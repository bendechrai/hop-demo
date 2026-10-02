# Design

## Context

See proposal.md for why. The current state that shapes the approach:

- `src/app.ts` serves `public/`, mounts `/api/links`, `/api/stats` and `/stats`, then the short-code redirect at `/:code`. The redirect router matches any single path segment, so `abc+` would reach it and be treated as a code.
- `src/services/links.ts` already has `list()` and `get(code)`. Neither changes a click count. Only `followLink` counts clicks.
- `src/actions/get-link.ts` and `withStatus` in `src/actions/link-status.ts` already return a link with its `expired` flag.
- Layers: route, then action, then service. A route never calls a service.
- The browser test shares one server and one database across scenarios, so a scenario cannot assume an empty table.

## Goals / Non-Goals

**Goals:**

- The two groups touch disjoint files, so two agents can build them in parallel worktrees.
- CSV quoting is one small, tested function that does not know about links.

**Non-Goals:**

- Filtering, paging or choosing columns in the export.
- QR codes, charts or any editing on the preview page.
- A new service method. `list()` and `get()` are enough.

## Decisions

1. **The CSV builder is a service, `src/services/csv.ts`.** It takes link rows and returns text, with no database access. Quoting follows RFC 4180: quote a value only if it holds a comma, a quote or a line break, and double inner quotes. Lines end with `\r\n`. The export route gets its links through the existing `listLinks` action in `src/actions/list-links.ts` (a route never calls a service for data it can get from an action) and passes them to the CSV builder for formatting. Alternative: put quoting in the route. Rejected: it is mechanics, and hard to test on its own.
2. **The export lives at `/api/links.csv`, mounted as its own router in `src/routes/export.ts`.** Express matches `/api/links` only at a path boundary, so it does not catch `/api/links.csv`. The mount can go anywhere above the 404 handler; put it next to the other `/api` lines.
3. **The preview action is `src/actions/preview-link.ts`.** It finds the link and adds the `expired` flag through `getLink`'s logic, and it never calls anything that counts a click. A test with the fake service proves the count is unchanged. Alternative: add a flag to `followLink`. Rejected: that function should keep one job, and a flag makes a count-or-not mistake easy.
4. **The preview route is `src/routes/preview.ts`, with the page in `src/routes/preview-page.ts`.** The router handles `GET /:slug`, and calls `next()` unless the slug ends in `+`. The page text is escaped HTML built in `preview-page.ts`, so a hostile destination URL cannot inject markup. Alternative: an Express path pattern with a regex. Rejected: it varies between Express versions, and a plain `endsWith("+")` check is clear.
5. **Each group adds its scenario in a new e2e file** (`e2e/export.spec.ts` and `e2e/preview.spec.ts`), not in `e2e/hop.spec.ts`, so the two branches never edit the same file there.

## Shared file: `src/app.ts`

Both groups add one mount line to `src/app.ts`. That is the one expected merge conflict. When the second pull request to merge conflicts:

1. Rebase the branch on `origin/main` (`git fetch origin && git rebase origin/main`).
2. In `src/app.ts`, keep both lines (and both imports). Take neither side whole.
3. Order matters for one line: the preview route MUST be mounted before the redirect (`app.use("/", redirectRouter(links))`), or `abc+` is read as a short code. The export mount can sit with the `/api` lines.
4. Run `npm run verify` and `npm run e2e`, then `git rebase --continue` and push.

## Risks / Trade-offs

- [A link whose code could end in `+`] -> Codes allow only letters, digits and hyphens, so no real code ends in `+`. No clash.
- [CSV formula injection: a URL starting with `=` in a spreadsheet] -> Destinations are normalised to start with `http`, so no value starts with `=`, `+`, `-` or `@`. Noted; no extra handling.
- [Both groups edit `src/app.ts`] -> Covered above.
