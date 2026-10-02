# Design

## Context

See proposal.md for why. The current state that shapes the approach:

- The `links` table has `code`, `url`, `clicks` and `created_at`. Schema changes are numbered SQL files in `migrations/`, and `001-create-links.sql` must not be edited.
- A visit flows `src/routes/redirect.ts` -> `src/actions/follow-link.ts` -> `src/services/links.ts`. Today `followLink` asks the service to bump the click count and return the URL in one query, so there is no point where a rule can say no before the click is counted.
- Creation flows `src/routes/links.ts` -> `src/actions/create-link.ts` -> `links.insert(code, url)`.
- The home page (`public/app.js`) renders whatever `GET /api/links` returns. It has no clock logic and should not grow any.
- The browser test (`e2e/hop.spec.ts`) drives a server started by Playwright with `HOP_DB=:memory:`, so the test process cannot reach the server's data.
- Action tests use `src/actions/fake-links.ts`; service tests use `openTestDatabase()`.

## Goals / Non-Goals

**Goals:**

- The decision "has this link expired" lives in one place in the actions layer and is used by follow, list and get.
- The server is the only clock. The page never compares dates.
- Existing links and existing API clients are untouched: a missing `expiresInDays` means no expiry, and the new response fields are additions.

**Non-Goals:**

- Editing the expiry of an existing link.
- Deleting or hiding expired links automatically.
- Timezone handling beyond storing and comparing UTC timestamps.

## Decisions

1. **Store `expires_at` as a nullable ISO 8601 UTC text column, added by `migrations/002-add-expires-at.sql`.**
   Why: it matches how `created_at` is stored, SQLite has no date type, and null is the natural way to say "never". Alternative considered: storing `expires_in_days` and computing the date on every read. Rejected because the date would then depend on `created_at` and the rule would be spread across reads.

2. **The expiry date is worked out in the action, not the service or the database.**
   `createLink` validates `expiresInDays` (an integer from 1 to 365, or blank for none) and computes `now + days`. The service takes the finished timestamp: `insert(code, url, expiresAt)`. Why: whether a value is allowed is a business rule, so it belongs in the action. The service stays a plain store. `createLink` takes `now` as an optional parameter, defaulting to the current time, so the action test can assert the exact date.

3. **One small rule file, `src/actions/is-expired.ts`, answers "has this link expired at this moment".**
   `followLink`, `listLinks` and `getLink` all call it. Why: the rule is used in three places, so it is extracted on the second use as the code-structure skill says. The actions take `now` as an optional parameter for the same reason as above.

4. **`followLink` checks before it counts.**
   It reads the link with `links.get`, returns a new result reason `expired` when the rule says so, and only then calls `links.recordClick`. `ActionResult` gains `expired` in its reason union. Why: the spec says an expired visit must not count, and the action is the layer that decides. Alternative considered: a service query that only bumps when `expires_at` is null or in the future. Rejected because it moves a rule into SQL and the service would need its own clock.

5. **The route turns `expired` into 410 with a plain HTML page.**
   `src/routes/redirect.ts` sends `410` and the small page held in `src/routes/expired-page.ts`, which links the existing stylesheet. Why: the page is a response shape, which is the route's job. A static file in `public/` was considered and rejected because `express.static` would also serve it with 200 at its own path.

6. **The API returns `expiresAt` and `expired` on every link.**
   `listLinks` and `getLink` return the link plus an `expired` flag; `presentLink` passes it through unchanged. The page reads `link.expired` to grey the row and write Expired in the clicks cell. Why: the server is the only clock, and the page stays a renderer.

7. **The browser test uses a throwaway file database so it can plant an expired link.**
   `playwright.config.ts` points `HOP_DB` at a file under `data/` (already ignored by git) and deletes it before the server starts. The expiry test creates a link through the page, then opens the same file with the real links service and sets `expires_at` in the past. Why: there is no honest way to make time pass in a browser test, and a test-only HTTP endpoint would put test code in the product. Opening the same SQLite file from two processes is safe for this volume.

## Risks / Trade-offs

- [The clock on the server drifts or the user expects local midnight] -> Expiry is "now plus N days" to the millisecond, in UTC, and the response shows the exact timestamp. Good enough for a short link service.
- [Two processes write the same SQLite file during the browser test] -> SQLite locks the file per write and the test does one small update. Playwright runs the suite with one worker.
- [A client that reads `expiresAt` from the list and compares it to its own clock could disagree with the server] -> The `expired` flag is the one to use and the proposal says so.
- [Expired links pile up on the home page] -> Out of scope here. They can still be deleted by hand, and a cleanup can be a later change.

## Migration Plan

1. Add `migrations/002-add-expires-at.sql` with `ALTER TABLE links ADD COLUMN expires_at TEXT`. The migration runner records it by name, so applying twice changes nothing.
2. Deploy the code. Old rows have `expires_at` null and keep working.
3. Rollback: revert the code. The extra column is harmless to the old code, which never reads it.
