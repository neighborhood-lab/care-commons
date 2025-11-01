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