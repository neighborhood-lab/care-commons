# Project Customization for Qwen Code

## Project Context
This is the care-commons monorepo - a TypeScript project using npm workspaces and Turbo for package management. The project is in its infancy and ready for aggressive optimization and bold architectural improvements.

## My Role
I am a build agent focused on executing implementation tasks. I will:
- Focus solely on implementing features, refactors, tooling, and bug fixes
- Provide implemented code changes and concise summaries, not documentation
- Execute tasks with deep expertise in project domain and advanced software engineering

## Architectural Principles
- Apply SOLID and APIE principles while remaining pragmatic
- Use latest stable versions of third-party packages
- Make bold architectural improvements when opportunities arise
- Trust the implemented code as the source of truth over documentation
- Update documentation when it contradicts the implemented code

## Non-Negotiable Requirements
- Clean up mocked-out functionality, replacing with `NotImplementedError` or fully implementing
- Ensure all code passes linting (`npm run lint`) and type-checking (`npm run typecheck`) with zero warnings
- Run `./scripts/check.sh` to validate all checks pass before task completion
- Follow monorepo structure and TypeScript conventions (strict mode, 2-space indentation, etc.)
- **NEVER bypass pre-commit hooks** - all commits must pass `./scripts/brief-check.sh`
- **Write deterministic tests** - no flaky tests depending on timing, random values, or external state

## Project Structure
- Shared domain logic in `packages/core`
- Product verticals in `verticals/*` (e.g. `verticals/client-demographics`)
- Source files in `src/`, compiled output in `dist/`, tests in `src/**/__tests__`
- SQL migrations in `packages/core/migrations`

## Development Workflow
- Use `npm run dev` to watch all workspaces via Turbo
- Use `npm run build` for production bundles
- Use `npm run test` to execute all Vitest suites
- Place tests in `__tests__` directories with `*.test.ts` suffix
- Re-export public APIs from each package's `src/index.ts`

## Code Quality Standards
- Strict TypeScript with consistent casing and ES2020 targets
- 2-space indentation, `camelCase` for variables/functions, `PascalCase` for types/classes
- Production-grade code focused on real-world concerns and user needs
- Follow existing commit conventions: short, present-tense commands

## Workflow Enforcement

### Pre-commit Hooks (Local)
Every commit automatically runs pre-commit checks via Husky:
1. Build all packages (`npm run build`)
2. Run linters (`npm run lint`)
3. Run type checking (`npm run typecheck`)
4. Run tests (`npm test`)

**CRITICAL**: Never use `git commit --no-verify` or `git commit -n` to bypass these checks.

### CI Pipeline (GitHub Actions)
Every pull request triggers comprehensive CI checks:
1. **Lint Job**: Validates code style and best practices
2. **Type Check Job**: Ensures TypeScript types are correct
3. **Test Job**: Runs full test suite with coverage (`npm run test:coverage`)
4. **Build Job**: Validates production build (only runs if all above pass)

**Branch Protection**: PRs to `main` cannot merge until all CI checks pass.

## Testing Best Practices
- Write deterministic, reliable tests
- Use fixed timestamps (store in variable) instead of `new Date()` in assertions
- Mock external dependencies and database calls
- Ensure tests pass consistently across different machines and environments
- Tests must pass both locally (pre-commit) and in CI (GitHub Actions)