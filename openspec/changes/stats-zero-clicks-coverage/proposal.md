# Proposal

## Why

The stats code handles a database that has links but no clicks, but nothing tests it. The empty-table case is covered (totals of 0 and 0, "No links yet."). The tie-break case is covered, but only with a click count of 2. The service test that has a zero-click link also has links with clicks, and the API test shares one database with other tests and only checks differences. So no test has links where every click count is 0, at the service or the API.

That state is common: it is every new install after the first few links are made and before the first one is followed. When every count ties, the top five is decided only by the creation-date tie-break, so a change to that order, or to how totals handle zero, would go unseen.

## What Changes

- A test in `src/services/stats.test.ts`: three links with 0 clicks and different creation dates give totals of 3 links and 0 clicks, and `topLinks` lists them oldest first.
- A test in a new file `src/app-stats-zero.test.ts` with its own database and server: `GET /api/stats` for the same three links answers 200 with `links` 3, `clicks` 0 and `top` holding the three codes oldest first, each with `clicks` 0 and `expired` false. It also fetches `GET /stats` and checks the page is served.
- The tests are shown to catch a mistake: with the tie-break in `src/services/stats.ts` temporarily changed from `created_at ASC` to `created_at DESC`, both new tests fail, and the failing output is saved.
- No behaviour change and no production code change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `link-stats`: gains a requirement and scenarios for links that have no clicks.

## Impact

- `src/services/stats.test.ts` (one test added), new `src/app-stats-zero.test.ts`, new `evidence/stats-zero-clicks-coverage/`.
- No schema change, no new dependency, no new environment variable, no change under `public/`.
