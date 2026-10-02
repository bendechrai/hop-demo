# Proposal

## Why

People who run hop can see their links only one page at a time. They cannot take the list into a spreadsheet, and they cannot check where a short code leads without following it, which also adds a click to its count. Both are small, common needs.

## What Changes

- `GET /api/links.csv` returns every link as CSV with the columns `code,url,clicks,created_at,expires_at`, a header row, and correct quoting. The home page gets an "Export CSV" link to it.
- `GET /<code>+` (the short code followed by a plus sign) shows a plain page with the destination URL, the created date, the click count and the expiry. It does not redirect and does not count a click.

No breaking changes. No schema change. Existing routes and responses are untouched.

The two features are independent. They are planned as two task groups that touch different files, so two agents can build them at the same time in separate worktrees.

## Capabilities

### New Capabilities

- `link-export`: the CSV export of all links and the home page link to it.
- `link-preview`: the preview page for a short code, reached by adding a plus sign.

### Modified Capabilities

None. Redirect and expiry behaviour do not change.

## Impact

- `src/services/csv.ts` (new), `src/routes/export.ts` (new), `public/index.html` (one link): group 1.
- `src/actions/preview-link.ts` (new), `src/routes/preview.ts` (new), `src/routes/preview-page.ts` (new): group 2.
- `src/app.ts`: one mount line from each group.
- `e2e/export.spec.ts` and `e2e/preview.spec.ts`: one new browser scenario each, in separate new files.
- No new dependencies, no new environment variables, no migration.
