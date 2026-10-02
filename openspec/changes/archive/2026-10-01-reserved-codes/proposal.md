# Proposal

## Why

A custom code that matches a path the app serves, such as `stats` or `api`, can be created today, but its short URL is shadowed by that page and never redirects. The stats-page design recorded this gap and left it for a later change. People get a short link that silently does not work.

## What Changes

- Creating a link with a custom code that is a reserved word SHALL fail with 400 and a message that says the code is reserved. The reserved words are every first path segment the app serves: `api`, `stats`, and the name without extension of every file in `public/` (today `app`, `index`, `stats`, `style`). They live in one list in one place.
- The match ignores case, because the app's routes ignore case: `/STATS` shows the stats page too.
- A custom code that ends in `+` SHALL fail with 400 and a message that says why: that address is the link's preview page.
- No breaking change for working links. Links already stored with a reserved code are left alone.

## Capabilities

### New Capabilities

- `custom-codes`: which custom short codes a person may choose when creating a link, and the messages when one is refused.

### Modified Capabilities

None. Redirect, preview, stats and expiry behaviour do not change.

## Impact

- `src/actions/reserved-codes.ts` (new) holds the list and the check; `src/actions/create-link.ts` calls it.
- Tests: `src/actions/reserved-codes.test.ts` (new), `src/actions/create-link.test.ts`, `src/app.test.ts`, `e2e/reserved.spec.ts` (new).
- `evidence/reserved-codes/` (new): before and after records of the bug.
- No new dependencies, no new environment variables, no migration.
