# Tasks

## 1. Stats service

- [ ] 1.1 Move `COLUMNS` and `toLink` out of `src/services/links.ts` into `src/services/link-row.ts` (as `LINK_COLUMNS` and `toLink`) and import them back, changing no behaviour; verify `npm run verify` passes with the existing `links.test.ts` untouched
- [ ] 1.2 Add `src/services/stats.ts` with `createStatsService(db)` whose `totals()` returns the link count and the click sum over every row, expired or not, with 0 and 0 on an empty table; verify `src/services/stats.test.ts` covers the empty table and a mix of live and expired links against the throwaway database
- [ ] 1.3 Add `topLinks(limit)` to the stats service, returning at most `limit` links ordered by clicks from most to least with a stable order for equal counts; verify `src/services/stats.test.ts` covers the limit, the click order and that equal counts come back in the same order on every call

## 2. Stats action and routes

- [ ] 2.1 Add `src/actions/get-stats.ts` with `getStats(stats, now)` that returns the totals and the top five links each carrying the `expired` flag from `withStatus`, plus `src/actions/fake-stats.ts` as the in-memory stand-in; verify `src/actions/get-stats.test.ts` shows the service is asked for five, the totals pass through and an expired link is flagged while a live one is not
- [ ] 2.2 Add `src/routes/stats.ts` serving `GET /api/stats` as JSON `{ links, clicks, top }`, make `createApp(links, stats)` mount it, and build the stats service in `src/server.ts`; verify `src/app.test.ts` reads the totals, sees them rise after a link is created and followed, and sees an expired link planted through the service flagged in `top`
- [ ] 2.3 Add `src/routes/stats-page.ts` serving `public/stats.html` at `GET /stats`, mounted before the short-code redirect, and add `public/stats.html` with the title, a Home link, two empty totals and an empty top-five table; verify `src/app.test.ts` gets 200 and `text/html` from `/stats` and that an unknown code still gets 404

## 3. Pages and browser test

- [ ] 3.1 Add `public/stats.js` that fetches `/api/stats` once, fills the two totals and the table with code, destination and click count, gives an expired row the `expired` class and the word Expired beside its count, and shows "No links yet" when the list is empty; verify by starting the app and opening `/stats` with and without links
- [ ] 3.2 Add a Stats link to the header of `public/index.html` and the matching nav style in `public/style.css`, and give the stats page its Home link the same style; verify by opening the home page and following the link there and back
- [ ] 3.3 Add a scenario to `e2e/hop.spec.ts` that reads `/api/stats`, creates a link and follows it three times, plants an expired link, follows the Stats link from the home page, checks both totals rose by what was added, sees the new link and the expired link in the top five with the expired one marked, and follows the Home link back; verify `npm run e2e` passes
