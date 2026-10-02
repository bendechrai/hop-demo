# Proposal

## Why

The three link-labels reviews left known problems that nobody fixed: a browser test that fails now and then, a destination column that got narrower and can still overflow, and a health endpoint promise with no test for old data. They are small and independent, so one cleanup change fixes them before they get blamed on a later feature.

## What Changes

- The browser tests stop sharing one database across parallel workers. Playwright runs five workers on this repository, all talking to one server and one database file. Checked on main: 2 failures in 25 runs, both in the first test of `e2e/hop.spec.ts` ("zeros and a note when there are no links"), which sees links that another file's test has just created. The top-five stats test in the same file has the same exposure.
- The destination column on the home page gets its width back. The URL is capped at 240px (it was about 420px before link-labels), and a 40-character label in wide letters is 455px wide, wider than the 420px cell, so it overflows the cell and squeezes even a short URL to zero width. The tag gets a maximum width with an ellipsis, the URL takes the rest of the cell, and the two `.label-tag` CSS blocks become one.
- The health endpoint gets a test for a link stored under the code `health` before that code became reserved. `/health` already answers as the health endpoint; the change records that in a test and in the spec so it cannot regress.
- The evidence tool can set the browser size, because the evidence for the column fix must be taken at 1280px wide and the tool is fixed at 1200px.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `link-labels`: the destination column keeps the URL readable and a tag never leaves its cell, however long the label is.
- `health-check`: a link stored under the code `health` before it was reserved does not change what `/health` answers.

## Impact

- `playwright.config.ts`, `e2e/hop.spec.ts` (group 1).
- `public/style.css`, `public/app.js`, `e2e/labels.spec.ts`, `bin/evidence.mjs` (group 2).
- `src/app-health.test.ts` (group 3).
- No product behavior changes except the column layout. No schema change, no new dependency, no new environment variable.
