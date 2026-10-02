# Proposal

## Why

People who keep many links in hop cannot group them. A long table of short codes gives no hint which links belong to which campaign or project, and there is no way to narrow it. Separately, whoever runs hop has no cheap way for a monitor to ask "is it up, and can it read its database?".

## What Changes

- A link can carry an optional label: up to 40 characters of letters, digits, spaces and hyphens. It is stored in a new column added by a migration, accepted when a link is created through the API, and returned by every API response that returns a link (`null` when there is none). A label outside the rules is refused with 400 and no link is created.
- The home page form gets a label field. Each row in the links table shows its label as a small tag. A filter box above the table narrows the rows to links whose label contains the typed text, ignoring case.
- `GET /health` returns `200` with JSON `{"status":"ok","links":<number of links>}` for monitoring.
- `health` becomes a reserved custom code, because the new route shadows it.

No breaking changes. Existing links get a `null` label. Existing routes keep their behaviour; responses that return a link gain one field.

The work is three task groups. Group 2 needs group 1's API field. Group 3 is independent of both. Groups 1 and 3 touch different files and can be built at the same time in separate worktrees.

## Capabilities

### New Capabilities

- `link-labels`: the optional label on a link, its rules, how the API accepts and returns it, and how the home page shows and filters by it.
- `health-check`: the `/health` endpoint a monitor polls.

### Modified Capabilities

- `custom-codes`: the reserved words gain `health`, the first path segment of the new endpoint.

## Impact

- Group 1: `migrations/003-add-label.sql` (new), `src/services/link-row.ts`, `src/services/links.ts`, `src/actions/create-link.ts`, `src/actions/validate-label.ts` (new), `src/routes/links.ts`, and their tests. `Link` gains a field, so test files that build a `Link` by hand gain `label: null` (type-only edits).
- Group 2: `public/index.html`, `public/app.js`, `public/style.css`, `e2e/labels.spec.ts` (new).
- Group 3: `src/actions/get-health.ts` (new), `src/routes/health.ts` (new), `src/app.ts` (one mount line), `src/actions/reserved-codes.ts`, and tests.
- No new dependencies, no new environment variables. One migration.
