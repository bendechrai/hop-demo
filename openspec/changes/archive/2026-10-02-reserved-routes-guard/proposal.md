# Proposal

## Why

The reserved-codes list is kept by hand. A test fails when a file in `public/` is missing from it, but nothing fails when a new top-level route is mounted in `src/app.ts`. That is how `/health` was shipped without being reserved, and it had to be added later by hand. The same slip will happen again with the next route.

## What Changes

- `src/app.ts` exports the list of top-level prefixes it mounts (`ROUTE_PREFIXES`) and mounts each router from that list, so the list and the mounts cannot differ.
- A new test takes the first path segment of every prefix in that list and fails, naming the route, if it is missing from `RESERVED_CODES`.
- The test is shown to catch drift: with `health` temporarily removed from `RESERVED_CODES` it fails, and the failing output is saved.
- No behaviour change: no route, response or reserved word changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `custom-codes`: the reserved-words requirement gains a scenario saying every mounted top-level route name is reserved.

## Impact

- `src/app.ts` (export and use the prefix list), new `src/reserved-routes.test.ts`.
- No schema change, no new dependency, no new environment variable.
