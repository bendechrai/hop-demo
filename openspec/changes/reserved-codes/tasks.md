# Tasks

## 1. Reserve route names

- [x] 1.1 Add `src/actions/reserved-codes.ts` holding the one list of reserved words (`api`, `stats`, and the name without extension of every file in `public/`: `app`, `index`, `stats`, `style`) and a check that matches them ignoring case and also refuses any code ending in `+`, each with its own message; verify `src/actions/reserved-codes.test.ts` covers every word, a mixed-case word, a trailing `+`, an ordinary code, and that every file in `public/` has its name in the list
- [x] 1.2 Call the check from `createLink` before the format check, so a reserved or `+` code returns `invalid` (400) and stores nothing; verify `src/actions/create-link.test.ts` rejects `stats`, `API` and `abc+` without storing a link and still accepts `my-stats`, and `src/app.test.ts` gets 400 with the reserved message for `stats` while `/stats` still serves the stats page
- [x] 1.3 Add a scenario in a new file `e2e/reserved.spec.ts` that submits the home page form with the custom code `api` and sees the reserved message; verify `npm run e2e` passes
- [x] 1.4 Capture evidence with the `evidence` skill: `evidence/reserved-codes/steps.json` posts the code `stats`, fetches `/stats` and screenshots it, then tries `api` in the form and screenshots the message; `before` on `origin/main` shows 201 and the shadowed stats page, `after` on `HEAD` shows 400 and the reserved message; commit the folder and link the images in the PR
