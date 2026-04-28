# ZLBF Agent Instructions

These instructions apply to all AI assistants working in this repository.

## Source Of Truth

- Source code lives in `src/` and should be treated as the canonical implementation.
- Generated Lua and packaged mod output under `dist/` or local Project Zomboid mod folders are build artifacts, not the primary edit target.
- Do not hand-edit generated Lua unless the task is explicitly about debugging generated output or confirming runtime behavior.

## Dependency And Build Rules

- Do not make permanent fixes inside `node_modules`.
- If a dependency bug is discovered, fix it in project source, wrap it locally, or document a temporary patch clearly.
- Build with `npm run build`.
- Validate behavior changes with the narrowest relevant command first, usually `npm test`, then `npm run build` if Lua transpilation shape matters.
- Use `npm run check` when formatting or linting validation is relevant.

## Project Structure

- Client gameplay code lives under `src/client/ZLBF`.
- Shared logic belongs under `src/shared` when it is reused across client or server boundaries.
- Prefer the existing path aliases from `tsconfig.json`, including `@client/*`, `@actions/*`, `@shared/components/*`, `@utils`, and `@constants`.

## TypeScript-To-Lua Constraints

- Prefer TypeScript patterns that transpile cleanly to Lua.
- Avoid relying on Node.js or browser runtime behavior in gameplay code.
- Keep control flow explicit and side effects deterministic.
- Isolate game-facing integration from pure domain logic when possible so Jest tests stay straightforward.

## PipeWrench And Build 42 Guidance

- Prefer existing PipeWrench types and APIs before introducing new abstractions.
- When Build 42 behavior differs from Build 41 typings, add precise type augmentations instead of falling back to `any`.
- Runtime bugs in Project Zomboid often come from generated Lua shape, loader paths, or integration boundaries; inspect the built output when TypeScript looks correct but the game disagrees.

## Change Discipline

- Keep fixes narrow and avoid unrelated refactors.
- Update or add Jest tests for behavior changes.
- When documentation affects contributor workflows, keep `README.md` aligned with the actual package scripts and build pipeline.

## Git Workflow Expectations

- Do not commit directly to `main` unless the user explicitly asks for it.
- Prefer feature branches for implementation work.
- Use branch names that describe intent, such as `feat/<topic>`, `fix/<topic>`, `refactor/<topic>`, or `docs/<topic>`.
- Keep commits focused and atomic: one logical change per commit when possible.
- This repository uses `standard-version` for releases, so commit messages must follow commitlint/Conventional Commit format.
- Write commit messages in Conventional Commit style, for example `fix(actions): resolve timed action queue require path`.
- Prefer commit types such as `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, and include an optional scope when useful.
- Before proposing a PR, ensure relevant checks pass locally (`npm test` and `npm run build` when applicable).

## Pull Request Guidance

- Open PRs from feature branches into `main`.
- Include a short summary of behavior changes and affected modules.
- Include a validation section listing exact commands executed and their outcomes.
- Call out any known risks, assumptions, or follow-up tasks.
- If runtime behavior was validated in-game, state what was tested and what was not.

## Collaboration Safety

- If the workspace has unexpected modifications in files outside the current task scope, stop and ask how to proceed.
- Never rewrite shared history unless explicitly requested.
- Never use destructive git commands like `git reset --hard` without explicit user approval.