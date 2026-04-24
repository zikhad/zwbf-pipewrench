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