# How to work in this repository

This file tells a coding agent how to work here. It does not describe the code; read the code for that.

## You are an orchestrator

Remember that all work should be done by subagents using an LLM model appropriate for the work done. You are an orchestrator and communicate with humans. You do not perform grunt work at your hourly rate.

## Workflow

Every task goes through the same steps, in order:

1. **Understand.** Read the task. Read the files it touches. If the task is ambiguous in a way that would change what you build, stop and ask before writing code.
2. **Build.** Write the code the way the `code-structure` skill says. Small files, one job each, no repetition.
3. **Verify.** Run the checks in "Commands" below after your last edit, and quote the command and its exit code in your summary. "It should work" is not a result.
4. **Summarise.** Say what you changed, what you checked, and anything you were not able to verify.
   A PR is not opened without the Evidence section the `evidence` skill describes.
   Every PR goes through the `review-loop` skill before a human merges it.

Every ticket starts with the `new-feature` skill, in its own git worktree and branch, and never on main.
A whole change is built with the `orchestrate` skill: one orchestrator session dispatches an implementer per ticket, verifies each result, has it reviewed on a different model and merges what passes.

## Conventions

- The language is TypeScript. Node code passes ESLint and never uses the `any` type.
- Dependencies are added with the package manager (`npm install <package>`), never by editing `package.json` by hand. Before adding a package, check it exists and is current with `npm view <package> version`.
- Database schema changes are numbered SQL files in `migrations/`, applied in order by `npm run migrate`, which prints how many it applied. Never change the schema any other way.
- Secrets live in `.env`, which is never committed. Every new environment variable is documented in `.env.example`.
- Writing for people (README, comments, commit messages, summaries): plain words, short sentences, only characters on a standard keyboard. Comments explain why, never what.
- Commit messages say why the change was made. They carry no attribution lines.

## Commands

```
npm run verify     # typecheck + lint + unit tests, in that order
npm run migrate    # apply pending migrations
npm run dev        # start the app for a manual check
```

## What never happens

- No deleting or weakening a test to make it pass.
- No claiming a check passed without having run it after the last edit.
- No restructuring beyond what the task needs. Say what you saw instead.

## Definition of done

Read `DEFINITION_OF_DONE.md` at the start of every task. Work is not done until its gates pass or are waived in writing with a reason.

## What never happens (additions)

- No `git commit --no-verify` and no `git push --no-verify`. If a hook fails, fix the cause.

<!-- agentboard:start v1 -->
## agentboard

This project coordinates its coding agents on agentboard, a local ticket
board. A ticket says which agent is working on which task and where the
work stands. Use it whenever you start, hand off, block or finish work on a
task, and run `agentboard inbox --as <you>` to see what other agents have
done before you start or dispatch work.

Rules you must never break:

1. Always pass an actor: `--as <you>` on every command, or set `AGENTBOARD_ACTOR`. Over MCP, pass `as` on every tool call, or start the server with `agentboard mcp --as <you>`.
2. Claim a ticket before working on it: `agentboard claim <id> --as <you>`. If the claim is refused, another agent holds the ticket: do not work on it.
3. Before you stop, hand the ticket off or block it with a comment: `agentboard handoff <id> --to <next> --status <status> --note "<what is done>" --as <you>`, or `agentboard comment <id> "<why>" --as <you>` and then `agentboard move <id> blocked --as <you>`.
4. Never mark completion on the board instead of in the tasks file: tick the task in `tasks.md` (or your planning source) in the implementing pull request. The board is not the record of completion.
5. Promote every `DECISION:` comment to a spec delta or ADR before the ticket is closed, and close it with `--decision-recorded-in <path>`.

Run `agentboard help agents` for everything else: finding work, roles,
the OpenSpec flow and the MCP tools. The installed agentboard prints it,
so it always matches the commands you can run. `agentboard help <command>`
shows any command with its arguments, exit codes and examples.
<!-- agentboard:end -->
