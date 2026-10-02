# Tasks

## 1. CSV export

- [x] 1.1 Add `src/services/csv.ts` that turns a list of links into CSV text with the header `code,url,clicks,created_at,expires_at`, an empty `expires_at` for a link that never expires, and values quoted only when they hold a comma, a double quote or a line break (inner quotes doubled); verify `src/services/csv.test.ts` covers no links, a plain row, a null expiry, a comma, a double quote and a line break
- [x] 1.2 Add `src/routes/export.ts` serving `GET /api/links.csv` with content type `text/csv` and all links (read through the existing `listLinks` action and formatted by the CSV service), and add its one mount line to `src/app.ts` next to the other `/api` lines; verify `src/app.test.ts` gets 200, `text/csv`, the header row and one row per link including an expired one
- [x] 1.3 Add an "Export CSV" link to `public/index.html` pointing at `/api/links.csv`; verify by opening the home page and following the link
- [x] 1.4 Add the scenario in a new file `e2e/export.spec.ts` (not in `e2e/hop.spec.ts`) that creates a link, follows the "Export CSV" link from the home page and checks the response holds the header row and the new link's code and URL; verify `npm run e2e` passes

## 2. Link preview page

- [x] 2.1 Add `src/actions/preview-link.ts` with `previewLink(code, links, now)` that returns the link with its `expired` flag, reports not-found for an unknown code, and never counts a click; verify `src/actions/preview-link.test.ts` shows a live link, an expired link still returned and flagged, an unknown code, and the click count unchanged after two previews
- [x] 2.2 Add `src/routes/preview-page.ts` that builds the plain HTML page (destination URL, created date, click count, expiry or "Never", expired marked, all values escaped), and `src/routes/preview.ts` serving `GET /:slug` only when the slug ends in `+` and calling `next()` otherwise; verify `src/app.test.ts` gets 200 and HTML for a live link, 200 with the expired mark for an expired link, 404 for an unknown code, and that the click count is unchanged after fetching the preview
- [x] 2.3 Mount the preview router in `src/app.ts` before the short-code redirect (one line); verify `src/app.test.ts` shows `/<code>` still redirects and counts a click while `/<code>+` does not
- [x] 2.4 Add the scenario in a new file `e2e/preview.spec.ts` (not in `e2e/hop.spec.ts`) that creates a link, opens `/<code>+`, checks the destination URL, a click count of 0 and the expiry, reloads it and sees the count is still 0; verify `npm run e2e` passes
