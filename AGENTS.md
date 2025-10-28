# Repository Guidelines

## Project Structure & Module Organization
This monorepo uses npm workspaces managed by Turbo. Shared domain logic lives in `packages/core`, while each product vertical has its own package under `verticals/*` (for example `verticals/client-demographics`). Source files are TypeScript in `src/`, scripts (such as database utilities) live in `scripts/`, and compiled output is emitted to `dist/`. Tests sit alongside code in `src/**/__tests__`, and SQL migrations reside in `packages/core/migrations`.

## Build, Test, and Development Commands
Run `npm run dev` to watch all workspaces via Turbo while editing TypeScript. Use `npm run build` to emit production-ready bundles, and `npm run test` to execute every Jest suite across packages. `npm run lint` and `npm run typecheck` should be clean before opening a pull request. Database changes run through `npm run db:migrate` and sample data through `npm run db:seed`, both executed from `packages/core` with environment taken from the repo’s `.env`.

## Coding Style & Naming Conventions
All packages use strict TypeScript (`tsconfig.json` enforces `strict`, consistent casing, and ES2020 targets). Adopt two-space indentation, `camelCase` for variables and functions, and `PascalCase` for types, enums, and classes. Re-export public APIs from each package’s `src/index.ts` to keep entry points predictable. Avoid committing generated `dist/` artifacts or `.turbo` caches; rely on the build pipeline instead.

## Testing Guidelines
Jest is configured per package; place new specs under `__tests__` directories with the `*.test.ts` suffix (e.g. `client-utils.test.ts`). Tests should cover main service flows and any validation or database edge cases, especially when touching `packages/core/src/db` logic. Use `npm run test -- <pattern>` during development, and ensure deterministic data setup by seeding or mocking database calls.

## Commit & Pull Request Guidelines
Follow the existing history: short, present-tense commands such as `add risk flag helper` or `update migrate script`. Group related changes per commit and include context for schema updates or new vertical contracts in the body if needed. Pull requests should explain the problem, the solution, and any follow-up tasks, link to tracking issues, and include screenshots or console output when UI or CLI behavior changes. Confirm tests, type checks, and migrations before requesting review.
