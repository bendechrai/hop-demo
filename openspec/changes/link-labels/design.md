# Design

## Context

See proposal.md for why. The current state that shapes the approach:

- `src/services/link-row.ts` holds the `Link` type, `LINK_COLUMNS` and `toLink`. Both the links and the stats services read rows through them, so a new column added there reaches every link the API returns.
- `src/services/links.ts` has `insert(code, url, expiresAt)`. Callers outside group 1 (`src/app.test.ts`, `src/services/stats.test.ts`, `e2e/database.ts`) call it with three arguments.
- `src/actions/create-link.ts` validates URL, then code, then expiry, each with an error the user can read. `src/routes/links.ts` reads `url`, `code` and `expiresInDays` from the body.
- `src/services/stats.ts` already has `totals()`, which returns the link count with expired links included.
- `src/app.ts` mounts the redirect at `/:code` last. Any new top-level route goes above it, and its first path segment goes into `RESERVED_CODES` in `src/actions/reserved-codes.ts`.
- The home page (`public/index.html`, `public/app.js`) re-renders the whole table from `/api/links` every five seconds.
- The browser tests share one server and database. `e2e/hop.spec.ts` needs an empty table at its start, so a new e2e file deletes the links it creates.

## Dependencies between task groups

This is the order the orchestrator follows.

| Group | Depends on | Can run in parallel with |
|---|---|---|
| 1. Labels in the data | nothing | 3 |
| 2. Labels on the home page | **group 1, merged** (it sends and reads the `label` field of the API) | nothing; it starts after group 1 merges |
| 3. Health endpoint | nothing | 1 |

Files each group may touch:

- **Group 1:** `migrations/003-add-label.sql` (new), `src/services/link-row.ts`, `src/services/links.ts`, `src/services/links.test.ts`, `src/actions/validate-label.ts` (new), `src/actions/validate-label.test.ts` (new), `src/actions/create-link.ts`, `src/actions/create-link.test.ts`, `src/actions/fake-links.ts`, `src/routes/links.ts`, `src/app.test.ts`. Plus type-only edits (`label: null` in a hand-built `Link`) in tests that build one: `src/actions/follow-link.test.ts`, `src/actions/delete-link.test.ts`, `src/actions/preview-link.test.ts`, `src/actions/get-stats.test.ts`, `src/services/csv.test.ts`, and any other test the typecheck names for the same reason.
- **Group 2:** `public/index.html`, `public/app.js`, `public/style.css`, `e2e/labels.spec.ts` (new).
- **Group 3:** `src/actions/get-health.ts` (new), `src/actions/get-health.test.ts` (new), `src/routes/health.ts` (new), `src/app-health.test.ts` (new), `src/app.ts`, `src/actions/reserved-codes.ts`, `src/actions/reserved-codes.test.ts`.
- **Every group:** its own lines in this change's `tasks.md`, and its evidence in `evidence/link-labels/g<group>/` (a folder per group, so two branches never write the same steps file).

## Shared file: `src/app.ts`

Only group 3 edits `src/app.ts` (one import and one mount line). Group 1 does not need it: the links router already passes the body through, and the new field arrives through `toLink`. If group 1 finds it must touch `src/app.ts` after all, it stops and says why instead. If both end up editing it, the second PR to merge rebases on `origin/main` and keeps both lines, and the health mount stays above the redirect.

Group 1 and group 3 both tick lines in `tasks.md`, in different sections, so git merges them without a conflict. Whichever of the two merges second is still rebased on `origin/main` before it merges, so the commit that lands is the commit that was checked.

## Goals / Non-Goals

**Goals:**

- Groups 1 and 3 touch disjoint files, so two agents can build them at the same time.
- The label rule lives in one action file and is tested on its own.
- The filter is client-side and survives the five-second refresh.

**Non-Goals:**

- Editing or removing a label after creation. Several labels per link. A list of known labels.
- Filtering on the server, or in the CSV export. The CSV columns do not change.
- A health check that probes anything but the links table. No uptime, version or timing fields.

## Decisions

1. **The column is `label TEXT`, nullable, added by `migrations/003-add-label.sql`.** Length and characters are a business rule, so they are enforced in the action, not with a `CHECK` constraint. Alternative: a `CHECK` in SQL. Rejected: SQLite cannot add a `CHECK` with `ALTER TABLE ADD COLUMN` cleanly, and the action must give a readable error anyway.
2. **`Link` gains `label: string | null`, read by `toLink`, and `LINK_COLUMNS` gains `label`.** Every link the API returns then carries it, including the stats page's top list, which is additive and harmless.
3. **`insert` gains a fourth parameter, `label: string | null = null`.** The default keeps the three-argument callers outside group 1 (`src/services/stats.test.ts`, `e2e/database.ts` and others) unchanged, which keeps group 1 out of group 2's and group 3's files. `fake-links.ts` mirrors the new signature.
4. **The rule is `src/actions/validate-label.ts`**, exporting `LABEL_PATTERN = /^[A-Za-z0-9 -]{1,40}$/` (applied after trimming) and a function that returns the trimmed label, `null` for none, or an error. `createLink` checks the label after the expiry, so existing error order is unchanged. The error text is: `Label must be 1 to 40 characters: letters, digits, spaces and hyphens only.`
5. **The links route passes `label: field("label")` into `createLink`.** Nothing else in the route changes.
6. **The home page filters in the browser.** `render` keeps the last list it was given and applies the filter text before drawing rows, so the five-second refresh keeps the filter. The tag is a `<span class="tag">` built with `textContent`, never `innerHTML`, so a label cannot inject markup. The count shows the number of rows shown. Alternative: `?label=` on `/api/links`. Rejected: not asked for, and it would put group 2 back into group 1's files.
7. **Health is `src/actions/get-health.ts` calling the stats service's `totals()`, and `src/routes/health.ts` serving `GET /health`.** It is mounted in `src/app.ts` above the redirect, and `health` is added to `RESERVED_CODES`. Its HTTP test is a new file, `src/app-health.test.ts`, built the same way as `src/app.test.ts`, so group 3 never edits a file group 1 edits. Alternative: a new count method on the links service. Rejected: `totals()` already gives the count.

## Risks / Trade-offs

- [An existing link with the code `health` would be shadowed by the new route] -> Before this change any code could be `health`. The demo database has none; the reserved list stops new ones. Noted, no data fix.
- [A label of spaces between words, like `a   b`] -> Allowed; only leading and trailing spaces are trimmed. Simple to explain, and harmless.
- [Group 1 changes `Link`, which group 3's files import indirectly] -> Group 3 builds no `Link` by hand and calls `insert` with three arguments, which the default keeps working, so its rebase after group 1 merges is clean.

## Migration Plan

`npm run migrate` applies `003-add-label.sql` once; existing rows get `label = NULL`. The server also applies pending migrations at start. Rollback is restoring the database file; the column is unused by older code.
