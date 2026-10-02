# Design

## Context

See proposal.md for why. The current state that shapes the approach:

- Every number the page needs is in the `links` table already: one row per link, a `clicks` column, `created_at` and `expires_at`. No migration is needed.
- `src/services/links.ts` holds the column list and the row-to-link mapping as private helpers. A second service that reads link rows needs the same mapping.
- Whether a link has expired is decided in the actions layer by `src/actions/is-expired.ts`, and `withStatus` in `src/actions/link-status.ts` adds the `expired` flag the API already returns. The home page reads that flag and never compares dates.
- `src/app.ts` serves `public/` as static files, mounts `/api/links`, then the short-code redirect at `/:code`. A request for `/stats` would reach the redirect router today and be treated as a code.
- `createApp(links)` takes the one service it needs. Action tests use a fake service; service tests use `openTestDatabase()`.
- The browser test shares one server and one throwaway database file across its scenarios, so a scenario cannot assume the table is empty.

## Goals / Non-Goals

**Goals:**

- The numbers are computed by the database, not by loading every row into memory.
- The limit of five and the expired flag are decided in the actions layer, so the service stays a plain store and the page stays a renderer.
- The stats page is built the same way as the home page: a static HTML file, a small script, the shared stylesheet.

**Non-Goals:**

- Charts, date ranges or any history of clicks over time. The table has no click log, only a counter.
- Reserving `stats` as a code. A link with the custom code `stats` can still be created, and its short URL is shadowed by the page. That is noted under risks and left for a later change.
- Live updating of the stats page. One load is enough.

## Decisions

1. **A separate stats service, `src/services/stats.ts`, with two queries.**
   `totals()` runs `COUNT(*)` and `SUM(clicks)` in one statement. `topLinks(limit)` selects link rows ordered by clicks and limited to `limit`. Why: the queries are aggregates over the whole table, which is a different job from reading and writing one link, so they get their own file. Alternative considered: adding both to `LinksService`. Rejected because that file would then hold two jobs and every fake of it would have to grow.

2. **The row mapping moves to `src/services/link-row.ts` and both services import it.**
   `LINK_COLUMNS` and `toLink` leave `links.ts` for a file of their own. Why: the mapping is now used in two places, which is the moment the code-structure skill says to extract. A service importing a sibling helper in the same layer is not a sideways call between layers.

3. **The action, `src/actions/get-stats.ts`, owns the number five and the expired flag.**
   `getStats(stats, now)` calls `stats.totals()` and `stats.topLinks(5)` and maps the five through `withStatus`. It returns a plain value, like `listLinks`, because nothing can go wrong that the user needs to hear about. Why: how many links to show and whether one has expired are rules, not mechanics. The fake for the action test lives in `src/actions/fake-stats.ts`, next to `fake-links.ts`.

4. **`GET /api/stats` returns `{ links, clicks, top }` from `src/routes/stats.ts`.**
   `top` is the list of link statuses as the action returns them: `code`, `url`, `clicks`, `createdAt`, `expiresAt`, `expired`. No `shortUrl` is added, because the page shows the code as text. Why: the smallest shape that meets the spec. If a client later wants the short URL, `presentLink` is one call away.

5. **`GET /stats` is a route of its own, `src/routes/stats-page.ts`, mounted before the redirect.**
   It sends `public/stats.html`. Why: `express.static` serves the file at `/stats.html`, but the spec names `/stats`, and the redirect router would otherwise treat `stats` as a code. A route mounted earlier is the plain way to say the path is reserved. `createApp` grows to `createApp(links, stats)` and `src/server.ts` builds both services from the same database.

6. **The page is `public/stats.html` and `public/stats.js`, styled by `public/style.css`.**
   The script fetches `/api/stats` once and fills two numbers and a table. An expired row gets the `expired` class the home page already styles and the word Expired next to its count. Why: it mirrors the home page, so the two read as one app, and the server stays the only clock. Alternative considered: rendering the HTML on the server. Rejected because the home page is static and the proposal asks for the same shape.

7. **The browser scenario measures differences, not absolutes.**
   It reads `/api/stats` before it creates its links, then checks the totals went up by what it added and that its own rows are in the top five. Why: earlier scenarios leave links behind in the shared database and the test must not depend on their count.

## Risks / Trade-offs

- [A link with the custom code `stats` is shadowed by the page] -> Noted as out of scope. The link is still created and listed, only its short URL does not resolve. A later change can reserve the code in `validate-code.ts`.
- [`SUM(clicks)` is null on an empty table] -> The query wraps it in `COALESCE(..., 0)` and the service test covers the empty case.
- [The top five hides links beyond it] -> By design. The home page still lists every link.
- [Two services read the same table] -> They share one row mapping and the test database, so a column added later is added in one place.

## Migration Plan

No schema change and no new configuration. Deploy the code; rollback is a revert.

## Open Questions

- Which order do links with the same click count take? The spec only asks that the order be the same from one request to the next. The implementer picks a stable secondary order and records it as a decision on the ticket. This does not change the specs, the approach or the tasks.
