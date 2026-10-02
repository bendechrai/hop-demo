# Design

## Context

Service tests use a throwaway database and action tests use a fake service. The app-level tests in `src/app.test.ts` share one database across all their tests, so they cannot assert absolute totals. `src/app-health.test.ts` shows the pattern for a file with its own database and server.

## Decisions

1. **Own file for the API test.** `src/app.test.ts` shares its database, so a zero-click state cannot be set up there without disturbing other tests. A new `src/app-stats-zero.test.ts` builds its own database and server the way `src/app-health.test.ts` does.
2. **Plant rows through the services, as the existing tests do.** The service test reuses the `plant` helper in `src/services/stats.test.ts` so the creation dates are set by the test. The API test inserts through the links service and sets `created_at` with one `UPDATE`, because inserts in the same millisecond could tie on date too.
3. **The stats page is checked only by fetching `/stats`.** The page renders in the browser from `/api/stats`, and the browser test for the empty page already exists. A zero-click browser test would need the e2e database and is out of scope.
4. **The mutation is `created_at ASC` to `created_at DESC`.** It is the smallest edit that changes only the order of tied counts. The totals tests are not expected to fail under it, and the task says so.

## Risks

None for behaviour: only test files and evidence are added.
