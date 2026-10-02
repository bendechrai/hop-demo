# Design

## Context

See proposal.md for why. What was checked on main (commit a4a442b) before writing this:

- `playwright.config.ts` sets `fullyParallel: false` and no `workers`. That only stops tests inside one file from running at the same time. Playwright still gives each spec file to its own worker, and this machine runs `Running 11 tests using 5 workers`. All workers use the one server and the one database file `data/e2e.sqlite` that the web server block starts.
- 25 runs of `npm run e2e` on main: 23 passed, 2 failed (5 of 5 passed in the first batch, 18 of 20 in the second). Both failures were the first test of `e2e/hop.spec.ts`, expecting `#total-links` to be `0` and getting `1` and `3`. That test assumes an empty database, which no longer holds once other files run beside it. `export.spec.ts` carries a comment that depends on file order for the same reason.
- `public/style.css`: `td.dest` has `max-width: 420px`, `.dest-url` has `max-width: 240px` and `.label-tag` is split between one block (the look) and a later one (`flex-shrink: 0`). The tag has no maximum width. Measured at 1280px with a 40-character label of capital W: the tag is 455px wide, the cell is 420px, the tag ends 59px outside the cell, and the URL is 0px wide even for `https://example.com/a`. With the label `campaign` the URL is 240px and the tag fits.
- `GET /health` with a stored link whose code is `health` answers 200 `{"status":"ok","links":1}`, because the health router is mounted above the redirect in `src/app.ts`. Only a test is missing. (`/health+` shows the preview page of that old link, which is the preview feature working as written, so it is left alone.)
- `bin/evidence.mjs` opens its browser at 1200x800 with no way to change it, and the steps have no viewport kind.

## Dependencies between task groups

None. The three groups can be built at the same time.

| Group | Depends on | Can run in parallel with |
|---|---|---|
| 1. Browser tests stop sharing a database | nothing | 2, 3 |
| 2. Destination column and label tag | nothing | 1, 3 |
| 3. Health endpoint with an old `health` link | nothing | 1, 2 |

Files each group may touch:

- **Group 1:** `playwright.config.ts`, `e2e/hop.spec.ts`.
- **Group 2:** `public/style.css`, `public/app.js`, `e2e/labels.spec.ts`, `bin/evidence.mjs`.
- **Group 3:** `src/app-health.test.ts`.
- **Every group:** its own lines in this change's `tasks.md`, and its evidence in `evidence/polish/g<group>/` (a folder per group, so two branches never write the same steps file).

## Shared file

No source file is shared. The only file two groups both edit is this change's `tasks.md`, in different sections, so git merges the ticks without a conflict. Whichever PR merges later is still rebased on `origin/main` and verified again before it merges.

One thing to know: group 1 changes how every e2e file runs (one worker, so files run one after another), and group 2 adds a test to `e2e/labels.spec.ts`, which group 1 does not touch. Group 2 and 3 PRs must pass the e2e gate with whichever config is on `origin/main` when they merge; neither depends on group 1 for its own logic.

## Goals / Non-Goals

**Goals:**

- The e2e suite gives the same result every run, whatever the machine's core count.
- The destination column shows as much of the URL as fits, and no tag leaves its cell.
- A regression that put a stored `health` link ahead of `/health` fails a unit test.

**Non-Goals:**

- A server and database per worker. More machinery than three small test files need.
- Changing the 40-character label rule, the 420px cell width or the 820px page width.
- Making `/health+` or the preview of a legacy `health` link behave differently.

## Decisions

1. **Group 1 sets `workers: 1` in `playwright.config.ts`, with a comment saying why.** Files then run one after another in name order, and the test in `e2e/hop.spec.ts` that expects an empty database runs when the other files have deleted or not yet created their links. The cost is a few seconds (the suite takes about 4s on 5 workers). Alternative: a database per worker. Rejected: the web server, the planted-expiry helper in `e2e/database.ts` and the evidence and preflight tools all assume one server and one file.
2. **Group 1 also makes the order dependence visible in `e2e/hop.spec.ts`:** a comment on the empty-database test saying that it relies on one worker and on `e2e/export.spec.ts` removing its link. It does not move or delete any test.
3. **Group 2 lets the tag shrink and the URL grow.** In `public/style.css` there is one `.label-tag` block. The tag has `flex: 0 1 auto`, `min-width: 0`, `max-width: 60%` of the line, `overflow: hidden`, `text-overflow: ellipsis` and `white-space: nowrap`. `.dest-url` loses its fixed `max-width: 240px` and gets `flex: 1 1 auto` and `min-width: 0`, so it takes what the tag leaves. `td.dest` stays at `max-width: 420px`. `public/app.js` sets the tag's `title` to the full label with `textContent`/`title`, never `innerHTML`. The 60% cap is a starting point: the implementer may pick another figure if the URL still has room (see the spec scenarios), and says which in the PR.
4. **Group 2 adds a viewport step to `bin/evidence.mjs`:** `{ "viewport": { "width": 1280, "height": 800 } }`, applied before the next step, listed in the usage text. Alternative: change the fixed 1200px to 1280px. Rejected: it would move every earlier evidence record's baseline for no reason.
5. **Group 3 adds tests to `src/app-health.test.ts` only.** It inserts a link with the code `health` through the links service (the way an old database would hold it) and checks `/health` answers 200 with the count that includes it. Because the file's tests share one database and the earlier tests count links, the new test goes last or builds its own database and server. No production file changes. Because the behavior already holds, there is no red state to show; the proof is a mutation check, described in task 3.2.

## Risks / Trade-offs

- [`workers: 1` hides, rather than removes, the shared database] -> The shared database is by design (see `e2e/database.ts`). The comment in the config says tests must stay safe to run one after another in file order, and each file deletes the links it creates.
- [The e2e suite gets slower] -> About 4s to about 10s. Accepted.
- [Group 2 changes a layout that a pixel test cannot judge] -> It is checked by the bounding-box test in `e2e/labels.spec.ts` and by screenshots a human reads.

## Migration Plan

None. No schema, data or configuration changes. Rollback is reverting the commits.
