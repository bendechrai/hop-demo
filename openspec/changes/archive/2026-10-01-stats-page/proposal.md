# Proposal

## Why

The home page lists every link with its own click count, but nobody can see the service as a whole: how many links exist, how many clicks they have drawn, and which links are doing the work. Those three numbers are what people ask for first when they want to know whether the service is being used.

## What Changes

- A new page at `/stats` shows the total number of links, the total number of clicks across all links, and the five most clicked links with their code, destination and click count.
- Expired links count towards both totals. An expired link that makes the top five is shown there, marked as expired, the same way the home page marks it.
- The page is plain HTML served by the app, like the home page. It reads its numbers from a new JSON endpoint, `GET /api/stats`, so the page has no logic of its own.
- The home page gets a Stats link in its header, and the stats page has a link back home.

No breaking changes. No schema change: every number comes from the columns the `links` table already has. Existing API responses are untouched.

## Capabilities

### New Capabilities

- `link-stats`: what the service reports about its links as a whole, through `GET /api/stats` and the `/stats` page, and how the two pages link to each other.

### Modified Capabilities

None. `link-expiry` already says how an expired link is marked on the home page and how the API flags it; this change reuses that flag and adds no requirement to it.

## Impact

- `src/services/`: a new stats service that counts links, sums clicks and reads the most clicked rows. The row-to-link mapping that `links.ts` holds today is shared with it.
- `src/actions/`: a new action that asks for the totals and the top five and marks each of the five with the existing expired flag, plus an in-memory fake of the stats service for its test.
- `src/routes/`: `GET /api/stats` as JSON, and `GET /stats` serving the page ahead of the short-code redirect, so `stats` is never treated as a code.
- `src/app.ts` and `src/server.ts`: the app takes the stats service next to the links service.
- `public/`: a new `stats.html` and `stats.js`, a Stats link on `index.html`, and a few lines of style.
- `e2e/hop.spec.ts`: a browser scenario that walks from the home page to the stats page and back and checks the numbers.
- No new dependencies, no new environment variables, no migration.
