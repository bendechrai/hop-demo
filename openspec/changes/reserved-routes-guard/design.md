# Design

## Context

`RESERVED_CODES` lives in `src/actions/reserved-codes.ts`. Routes are mounted in `src/app.ts`. The layers are routes, then actions, then services, and nothing flows sideways, so the action must not import the app. A test sits beside the code it tests and may import both.

## Decisions

1. **Derive the list from an exported prefix list, not from the Express router stack.** Express 5 does not keep the mount path of `app.use("/stats", router)` on the layer. It is compiled into a matcher function, so a stack walk can only see the prefix by reading private fields of the library, which break on a minor upgrade. A walk also cannot see routes a router declares inside itself under a "/" mount. The explicit list is plain data and does not depend on Express internals.
2. **The list drives the mounts.** `app.ts` declares `ROUTE_PREFIXES` once and each `app.use` for a named prefix reads from it (for example `app.use(ROUTE_PREFIXES.health, ...)`), so adding a mount means adding a prefix, and the test then covers it. Routers mounted at "/" (export, preview, redirect) have no prefix of their own; the export router's one path, `/api/links.csv`, starts with `api`, which is already reserved.
3. **The test is app-level.** It lives in `src/reserved-routes.test.ts`, imports `ROUTE_PREFIXES` from `app.ts` and `RESERVED_CODES` from the action, takes the first path segment lowercased and fails with a message naming the prefix.
4. **Known gap, accepted.** A bare `app.use("/new", router)` written without the list is not seen by the test. The comment above the list in `app.ts` says to use it. Closing that gap would need the Express internals decision 1 avoids.

## Risks

None for behaviour: only constants replace string literals in `app.ts`, and the existing app tests cover every route.
