# Tasks

## 1. Labels in the data

- [x] 1.1 Add `migrations/003-add-label.sql` adding a nullable `label TEXT` column to `links`; verify `npm run migrate` on an empty database applies it, a second run prints `applied 0`, and `src/services/migrations.test.ts` still passes
- [x] 1.2 Add `label: string | null` to `Link`, `label` to `LINK_COLUMNS` and to `toLink` in `src/services/link-row.ts`, and a fourth parameter `label: string | null = null` to `insert` in `src/services/links.ts` (and the same in `src/actions/fake-links.ts`); add `label: null` to hand-built `Link` values in tests where the typecheck asks; verify `src/services/links.test.ts` stores a label and reads it back through `get` and `list`, and reads `null` for a link inserted without one
- [x] 1.3 Add `src/actions/validate-label.ts` with the rule from design.md (trimmed, 1 to 40 letters, digits, spaces and hyphens; missing, null or blank means none; anything else is an error stating the rule); verify `src/actions/validate-label.test.ts` covers a valid label, trimming, blank, null, missing, 40 and 41 characters, a disallowed character and a non-text value
- [x] 1.4 Make `createLink` in `src/actions/create-link.ts` take `label`, check it after the expiry and store it; verify `src/actions/create-link.test.ts` shows a stored label, a blank label stored as null, and an invalid label refused with no link created
- [x] 1.5 Pass `label` from the request body in `src/routes/links.ts`; verify `src/app.test.ts` shows POST returning 201 with the label, POST with a 41-character label returning 400 and creating nothing, and `GET /api/links` and `GET /api/links/:code` returning `label` (a string, or `null` for a link without one)

## 2. Labels on the home page

Depends on group 1 being merged.

- [ ] 2.1 Add an optional "Label (optional)" field to the form in `public/index.html` (maxlength 40, a pattern for letters, digits, spaces and hyphens), and send its value as `label` from `public/app.js`, clearing it after a link is created; verify by creating a labelled link from the page and seeing the label in `/api/links`
- [ ] 2.2 Show each link's label as a small tag in its row (built with `textContent`, no tag for a link without a label), styled in `public/style.css`; verify by opening the home page with one labelled and one unlabelled link
- [ ] 2.3 Add a "Filter by label" box above the table that shows only links whose label contains the typed text, ignoring case, hides unlabelled links while it holds text, says when no link matches, shows every link when cleared, and keeps applying after the five-second refresh; verify by typing in it on the home page
- [ ] 2.4 Add `e2e/labels.spec.ts` (a new file, not `e2e/hop.spec.ts`) that creates links labelled `docs`, `Docs team` and `sales` and one with no label from the page, checks each row's tag, types `doc` in the filter and sees only the two docs rows, types a label nobody has and sees the no-match message, clears it and sees all four, and deletes its links at the end; verify `E2E_PORT=4392 npm run e2e` passes

## 3. Health endpoint

Independent of groups 1 and 2.

- [x] 3.1 Add `src/actions/get-health.ts` returning `{ status: "ok", links: <count> }` from the stats service's `totals()`; verify `src/actions/get-health.test.ts` with `fakeStats` shows the count passed through, 0 included
- [x] 3.2 Add `src/routes/health.ts` serving `GET /health` as JSON through the action, and mount it in `src/app.ts` above the short-code redirect (one import, one line); verify a new `src/app-health.test.ts` gets 200, `application/json` and `{"status":"ok","links":0}` on an empty database, then `links: 3` with three links one of them expired, and that no click count changed
- [x] 3.3 Add `health` to `RESERVED_CODES` in `src/actions/reserved-codes.ts`; verify `src/actions/reserved-codes.test.ts` refuses `health` and `Health`, and `src/app-health.test.ts` shows POST `/api/links` with the code `health` returns 400 and `/health` still answers
