# Tasks

## 1. Guard the reserved list against new routes

- [ ] 1.1 Export `ROUTE_PREFIXES` from `src/app.ts` (`/health`, `/api/links`, `/api/stats`, `/stats`) and make the matching `app.use` calls read from it, with a comment saying a new top-level mount must be added to it and why (design.md decisions 1 and 2); no route, response or order of mounts changes; verify `npm run verify` passes and `git diff --stat` shows only `src/app.ts` changed
- [ ] 1.2 Add `src/reserved-routes.test.ts` that takes the first path segment of every prefix in `ROUTE_PREFIXES`, lowercased, and fails with a message naming the prefix if it is not in `RESERVED_CODES` (design.md decision 3); verify `node --test src/reserved-routes.test.ts` passes and `npm run lint` and `npm run typecheck` pass
- [ ] 1.3 Prove the test can fail: temporarily remove `"health"` from `RESERVED_CODES` in `src/actions/reserved-codes.ts`, run `node --test src/reserved-routes.test.ts` and save its failing output to `evidence/reserved-routes-guard/mutation-fail.txt`, then restore the file with `git checkout src/actions/reserved-codes.ts`; verify the saved output names `/health` as missing, `git status` shows `reserved-codes.ts` unchanged, and `npm run verify` passes afterwards
