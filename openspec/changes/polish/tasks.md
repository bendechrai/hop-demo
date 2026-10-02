# Tasks

## 1. Browser tests stop sharing a database

Independent of groups 2 and 3.

- [ ] 1.1 Reproduce the failure first: on a clean checkout of `origin/main` run `npm run e2e` 20 times and save each result line (`Running 11 tests using 5 workers`, then passed or failed) to `evidence/polish/g1/before.txt`, with the failing test's name and message for every failure; verify the file shows the 5 workers and, if a run failed, the `#total-links` expectation (on main 2 of 25 runs failed, so if 20 runs all pass, say so in the file and run 20 more)
- [ ] 1.2 Set `workers: 1` in `playwright.config.ts` with a comment that says why (every spec file shares one server and one database, so files must not run at the same time); verify `npm run e2e` prints `using 1 worker`
- [ ] 1.3 Add a comment above the empty-database test in `e2e/hop.spec.ts` saying it relies on one worker and on `e2e/export.spec.ts` removing its link, without moving, deleting or weakening any test; verify `npm run e2e` still runs the same 11 tests and `git diff --stat` shows only comment lines changed in that file
- [ ] 1.4 Run the e2e suite 5 times in a row after the change (`for i in 1 2 3 4 5; do npm run e2e || break; done`) and save the 5 result lines to `evidence/polish/g1/after.txt`; verify all 5 runs pass with no failure, then do the same 5 runs again on the pushed commit through `bin/preflight.sh` or the pre-push gate and quote the exit codes

## 2. Destination column and label tag

Independent of groups 1 and 3.

- [ ] 2.1 Add a `viewport` step to `bin/evidence.mjs` (`{ "viewport": { "width": 1280, "height": 800 } }`, applied before the next step) and describe it in the usage text; verify `node bin/evidence.mjs --help` lists it, `npm run lint` and `npm run typecheck` pass, and a steps file with a `viewport` step makes the screenshot 1280px wide
- [ ] 2.2 Merge the two `.label-tag` blocks in `public/style.css` into one, let the tag shrink with a maximum width, an ellipsis and `nowrap`, and let `.dest-url` take the rest of the cell instead of the fixed 240px (design.md decision 3); set the tag's `title` to the full label in `public/app.js` with `textContent` and `title`, never `innerHTML`; verify `grep -c "\.label-tag" public/style.css` shows one rule block and, at 1280px wide, a 40-character label of capital W and a long destination leave the tag's right edge inside the cell with the URL showing more than 240px of text when the label is short
- [ ] 2.3 Add a test to `e2e/labels.spec.ts` (the file group 2 owns; it deletes its own links at the end) that creates a link with a long destination and a 40-character `W` label, at a 1280px wide viewport, and checks with bounding boxes that the tag is inside the cell and that the URL has width above zero, and also creates a link with a short destination and the same label and checks the URL width is above zero; verify `E2E_PORT=4391 npm run e2e` passes and that the new test fails when run against the CSS from `origin/main`
- [ ] 2.4 Capture evidence with the `evidence` skill into `evidence/polish/g2/`: a steps file that sets the viewport to 1280 wide, creates a link with a long destination (over 100 characters) and the label `WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW` (40 capital W), opens `/` and takes a screenshot, with `expectText` on the row; `before` on `origin/main`, `after` on `HEAD`; verify `after.json` has every step `ok: true`, the screenshots are 1280px wide, the before screenshot shows the tag overflowing the cell and the after screenshot shows the tag inside the cell with the URL still visible, a human can see both, and the PR body has the `## Evidence` table with short shas from the records

## 3. Health endpoint with an old health link

Independent of groups 1 and 2.

- [x] 3.1 Add a test to `src/app-health.test.ts` that stores a link with the code `health` through the links service (as a database from before the code was reserved would hold it), fetches `/health` without following redirects, and checks the status is 200, the content type is JSON and the body is `{"status":"ok","links":<n>}` with `<n>` including that link; the test goes last in the file or builds its own database and server so the earlier count tests are not disturbed; verify `npm run test` passes and the file's other tests still pass unchanged
- [x] 3.2 Prove the test can fail: temporarily move the `/health` mount in `src/app.ts` below the redirect mount, run `node --test src/app-health.test.ts` and save its failing output to `evidence/polish/g3/mutation-fail.txt`, then restore `src/app.ts` with `git checkout src/app.ts`; verify `git status` shows `src/app.ts` unchanged, the saved output names the new test as failing, and `npm run verify` passes afterwards
