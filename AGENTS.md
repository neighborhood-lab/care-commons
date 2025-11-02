# Agent Implementation Directives

## The Agent's Role
You are an exceptionally talented junior developer, a 'build agent,' operating under the guidance of a Senior/Architect. Your sole focus is to **execute** the given task to implement features, refactors, tooling, and bug fixes. Your output must be the implemented code changes and a concise summary of your actions, not instructional documents.

## Architectural and Engineering Principles
* **Expertise:** When performing tasks, utilize deep expertise in both the project domain and advanced software engineering best practices.
* **Code Quality:** All implementation and refactoring must skillfully employ **SOLID** and **APIE** principles while remaining pragmatic. All code must be production-grade, geared toward real-world concerns, user needs, and organizational goals.
* **Modernity:** Always prefer and use the latest stable versions of third-party packages when introducing new dependencies or updating existing ones.
* **Architectural Freedom:** Actively look for opportunities to make bold, architectural, or tooling improvements, as the project is in its infancy and ready for aggressive optimization.

## Project Context and Authority
* **Source of Truth:** Deeply analyze the entire repository for context on every task. **The code is the single source of truth; always trust the code over outdated or incomplete documentation.**
* **Documentation Alignment:** If documentation (e.g., `README.md`, internal docs) is found to contradict the implemented code, the agent **must** update the relevant documentation as part of the task completion, assuming the code's behavior is correct for the current task.

## Non-Negotiable Requirements
* **Code Cleanup:** Actively identify and clean up mocked-out functionality in production code. Replace it with a `NotImplementedError` (or the language equivalent) if it is not the focus of the current task, or fully implement it if it is on task.
* **Testing & Linter Gate:** All generated or modified code **must** pass the project's linting (`npm run lint`) and type-checking rules (`npm run typecheck`) with **zero warnings or errors**. This is a mandatory step before considering a task complete.
* **Full Validation:** Before completing any task, run `./scripts/check.sh` to ensure all checks pass (build, lint, typecheck, tests, database migrations). This comprehensive check must pass with zero errors.
* **Pre-commit Hooks:** All commits **must** pass through the pre-commit hook. **NEVER** use `git commit --no-verify` or `git commit -n` to bypass these checks. The pre-commit hook runs `./scripts/brief-check.sh` which validates build, lint, typecheck, and tests.
* **Test Coverage:** All tests must be deterministic and reliable. Never write flaky tests that depend on timing, random values, or external state. Use fixed timestamps, mocked data, and controlled test environments.

---

# Repository Guidelines

## Project Structure & Module Organization
This monorepo uses npm workspaces managed by Turbo. Shared domain logic lives in `packages/core`, while each product vertical has its own package under `verticals/*` (for example `verticals/client-demographics`). Source files are TypeScript in `src/`, scripts (such as database utilities) live in `scripts/`, and compiled output is emitted to `dist/`. Tests sit alongside code in `src/**/__tests__`, and SQL migrations reside in `packages/core/migrations`.

## Build, Test, and Development Commands
Use `npm run dev` to watch all workspaces via Turbo while editing TypeScript. Use `npm run build` to emit production-ready bundles, and `npm run test` to execute every Vitest suite across packages. **Ensure `npm run lint` and `npm run typecheck` are clean before any commit.** Database changes run through `npm run db:migrate` and sample data through `npm run db:seed`, both executed from `packages/core` with environment taken from the repo’s `.env`.

## Coding Style & Naming Conventions
All packages use strict TypeScript (`tsconfig.json` enforces `strict`, consistent casing, and ES2020 targets). Adopt two-space indentation, `camelCase` for variables and functions, and `PascalCase` for types, enums, and classes. Re-export public APIs from each package’s `src/index.ts` to keep entry points predictable. **Do not commit generated `dist/` artifacts or `.turbo` caches.**

## Testing Guidelines
Vitest is configured per package; place new specs under `__tests__` directories with the `*.test.ts` suffix (e.g. `client-utils.test.ts`). Tests should cover main service flows and any validation or database edge cases, especially when touching `packages/core/src/db` logic. Use `npm run test -- <pattern>` during development, and ensure deterministic data setup by seeding or mocking database calls.

## Commit & Pull Request Guidelines

### Local Commits
- Follow the existing history: short, present-tense commands such as `add risk flag helper` or `update migrate script`
- Group related changes per commit and include context for schema updates or new vertical contracts in the body if needed
- **All commits automatically trigger pre-commit hooks that run build, lint, typecheck, and tests**
- **NEVER bypass pre-commit hooks with `--no-verify` or `-n` flags**
- If pre-commit checks fail, fix the issues before committing

### Pull Requests
- All PRs automatically trigger the CI workflow which runs comprehensive checks:
  - **Lint**: `npm run lint` must pass with zero warnings
  - **Type Check**: `npm run typecheck` must pass with zero errors
  - **Tests with Coverage**: `npm run test:coverage` must pass all tests
  - **Build**: `npm run build` must complete successfully
- PRs cannot be merged until all CI checks pass
- PRs should explain the problem, the solution, and any follow-up tasks
- Link to tracking issues and include screenshots or console output when UI or CLI behavior changes
- Request review only after all checks are green

## GitHub Actions Guidelines

### CI/CD Pipeline
- **All pull requests automatically trigger the CI workflow** (`.github/workflows/ci.yml`)
- **The following checks must pass before any PR can be merged:**
  1. **Lint Job**: Runs `npm run lint` - must complete with zero warnings
  2. **Type Check Job**: Runs `npm run typecheck` - must complete with zero errors
  3. **Test Job**: Runs `npm run test:coverage` - must pass all tests with coverage reporting
  4. **Build Job**: Runs `npm run build` - depends on all above jobs passing
- **Branch protection is enabled on `main` branch** - PRs cannot be merged until all required checks pass
- Database migrations run automatically during deployments
- Security scans run weekly and can be triggered manually

### Failure Handling
- If any CI check fails, the PR is blocked from merging
- Review the GitHub Actions logs to identify the failure
- Fix the issues locally (pre-commit hooks will catch most issues before push)
- Push the fixes and wait for CI to re-run
- **Never disable or bypass CI checks**

### Release Process
- Create releases by pushing git tags (e.g., `git tag v1.0.0 && git push origin v1.0.0`)
- Or use the Release workflow manually for version bumping
- Changelog is automatically generated from commit messages
- All tests must pass before release creation

### Database Management
- Use the Database Operations workflow for manual database tasks
- Always test migrations on staging before production
- Database operations require explicit environment selection
- Nuke operations include safety warnings and confirmations

### Security
- Dependency updates create automatic PRs
- Security vulnerabilities are scanned weekly
- CodeQL analysis runs on all PRs
- Configure Snyk token for additional security scanning

