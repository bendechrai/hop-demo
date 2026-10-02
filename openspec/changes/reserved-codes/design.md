# Design

## Context

`createLink` checks a custom code against `CODE_PATTERN` (3 to 32 letters, digits, hyphens) and against the codes already taken. Nothing checks it against the paths the app serves. `src/app.ts` mounts `/api/...`, `/stats`, the preview router (slugs ending in `+`) and `express.static(public/)` before the redirect, so a code equal to one of those never reaches the redirect. Express matches routes without regard to case.

## Goals / Non-Goals

**Goals:**
- One list of reserved words in one file, used by the create action.
- A clear 400 message for a reserved word and for a trailing `+`.
- A test that fails when a file is added to `public/` without its name in the list.

**Non-Goals:**
- Renaming or deleting links already stored with a reserved code.
- Reserving codes in the redirect path: a reserved path never reaches it.

## Decisions

- **The list lives in `src/actions/reserved-codes.ts`.** Deciding which codes are allowed is a business rule, so it sits in the actions layer. The earlier design suggested `validate-code.ts`, but that file's pattern also decides which paths the redirect will try, and reserving words there would mix two jobs. Alternative considered: build the list at startup by reading `public/` and the router mounts. That needs file access in a service and threading the list through `createApp`, for a list that changes rarely. A static list plus a test that reads `public/` catches drift with less code.
- **Case-insensitive match.** `/Stats` and `/STATS` show the stats page, so `Stats` is as shadowed as `stats`.
- **Trailing `+` gets its own message, checked before the pattern.** The pattern already rejects `+`, but its message ("letters, digits and hyphens only") does not say why `abc+` in particular cannot work. The specific message is checked first.
- **Status 400, reason `invalid`.** The links route already maps `invalid` to 400. A reserved word is not a conflict with another link, so 409 would mislead.
- **Generated codes are not checked.** They are always 6 characters, and every reserved word today is 3 or 5, so they cannot collide. If a 6 character name is ever reserved, the generator's existing retry loop is the place to add the check.

## Risks / Trade-offs

- [A new top-level route or a new file in `public/` is added without updating the list] -> The `public/` case is caught by a test. A new router mount is not; the list's comment says to add its first path segment, and a reviewer checks it.
- [A link already stored as `stats` stays shadowed] -> Out of scope. It is still listed and can be deleted from the home page.
