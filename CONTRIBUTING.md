# Contributing to Care Commons

Thank you for your interest in contributing to Care Commons! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

- Search existing issues before creating a new one
- Provide clear reproduction steps
- Include relevant error messages and logs
- Specify your environment (OS, Node version, database version)

### Suggesting Features

- Check if the feature aligns with the project's vision
- Provide clear use cases
- Consider implementation complexity and maintenance burden

### Submitting Pull Requests

1. **Fork the repository** and create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes locally**
   ```bash
   # Run comprehensive checks (same as pre-commit)
   ./scripts/check.sh
   
   # Or run individually:
   npm run build
   npm run lint
   npm run typecheck
   npm run test:coverage
   ```

4. **Commit your changes**
   - Write clear, descriptive commit messages
   - Reference related issues (e.g., "Fixes #123")
   - **Pre-commit hooks will automatically run** (build, lint, typecheck, test)
   - **NEVER bypass hooks with `--no-verify` or `-n` flags**
   - If hooks fail, fix the issues before committing

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Wait for CI checks to pass**
   - GitHub Actions will automatically run all checks
   - PRs cannot be merged until all checks are green
   - If CI fails, review the logs, fix issues, and push updates

## Development Guidelines

### Mandatory Quality Gates

This project enforces strict quality standards at two levels:

#### 1. Pre-commit Hooks (Local)
**Every commit automatically triggers** pre-commit checks via Husky (`.husky/pre-commit`):
- ✅ Build all packages (`npm run build`)
- ✅ Run linters (`npm run lint`) - must have zero warnings
- ✅ Run type checking (`npm run typecheck`) - must have zero errors
- ✅ Run tests with coverage (`npm run test:coverage`) - all tests must pass and meet coverage thresholds

**⚠️ CRITICAL**: These checks are **MANDATORY** and **CANNOT BE BYPASSED**. Do not use:
- ❌ `git commit --no-verify`
- ❌ `git commit -n`
- ❌ Any other method to skip pre-commit hooks

#### 2. CI Pipeline (GitHub Actions)
**Every pull request automatically triggers** comprehensive CI checks (`.github/workflows/ci.yml`):
- ✅ **Lint Job**: Validates code style with `npm run lint`
- ✅ **Type Check Job**: Ensures types are correct with `npm run typecheck`
- ✅ **Test Job**: Runs full test suite with coverage (`npm run test:coverage`)
- ✅ **Build Job**: Validates production build (only runs if all above pass)

**Branch Protection**: PRs to `main` cannot merge until **ALL** CI checks pass.

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Use meaningful variable names

### Database Changes

- Always create a migration file
- Never modify existing migrations
- Test migrations both up and down
- Document schema changes in comments

### Testing

- Write unit tests for business logic
- Write integration tests for API endpoints
- **Meet coverage thresholds** (enforced by pre-commit and CI):
  - Lines: 82%
  - Statements: 82%
  - Branches: 70%
  - Functions: 87%
- Test edge cases and error conditions
- **Write deterministic tests** - no flaky tests that depend on:
  - ❌ Multiple `new Date()` calls in assertions (use a single timestamp variable)
  - ❌ Random values without fixed seeds
  - ❌ External state or timing
  - ❌ Non-mocked external dependencies
- Tests must pass consistently across all environments (local, CI, different machines)

### Documentation

- Update README files when adding features
- Document all public APIs
- Include usage examples
- Keep documentation up to date with code changes

### TODO Comment Policy

#### When to Add a TODO

✅ **Do add TODOs for:**
- Incomplete features that need finishing
- Known performance issues
- Missing error handling
- Planned refactorings
- Integration points not yet wired

❌ **Don't add TODOs for:**
- Things you could fix right now (fix it instead)
- Vague ideas without clear action items
- Features not yet approved
- Nice-to-have enhancements (use backlog instead)

#### TODO Format

Use this format for all TODOs:

```typescript
// TODO(priority/type): Clear description of what needs to be done
//   Status: Tracked in Task XXXX | Not yet tracked
//   Impact: What happens if this isn't fixed
//   Estimate: Time estimate if known
```

**Priorities:**
- `p0` - Production blocker, must fix before launch
- `p1` - Important, should fix soon (within 2 weeks)
- `p2` - Medium priority, fix when time permits
- `future` - Planned enhancement, defer to backlog

**Types:**
- `integration` - Missing service/data integration
- `optimization` - Performance improvement
- `feature` - Incomplete feature
- `bug` - Known issue
- `security` - Security concern
- `refactor` - Code quality
- `test` - Missing tests
- `a11y` - Accessibility

#### Examples

Good:
```typescript
// TODO(p0/integration): Implement actual HTTP POST to EVV aggregator
//   Status: Tracked in Task 0049
//   Impact: EVV records not submitted - compliance failure
//   Estimate: 1 week
```

Bad:
```typescript
// TODO: fix this later
```

#### TODO Lifecycle

1. **Add TODO** with proper format
2. **Create tracking task** in `claude/layer-2/input/` if P0 or P1
3. **Update TODO** with task number
4. **Remove TODO** when work is complete
5. **Archive completed TODOs** in `docs/TODO_CHANGELOG.md`

#### Monthly TODO Review

On the 1st of each month:
- Review all P0/P1 TODOs for progress
- Downgrade stale P1 TODOs to P2
- Remove obsolete TODOs
- Update task references

Use `npm run todo:stats` to see current TODO statistics.

## Project Structure

```
care-commons/
├── packages/core/          # Shared core functionality
│   ├── src/
│   │   ├── types/         # Base types
│   │   ├── db/            # Database layer
│   │   ├── permissions/   # Authorization
│   │   └── audit/         # Audit logging
│   └── migrations/        # Database migrations
│
└── verticals/             # Feature verticals
    └── client-demographics/
        ├── src/
        │   ├── types/     # Domain types
        │   ├── repository/  # Data access
        │   ├── service/   # Business logic
        │   └── validation/  # Input validation
        └── README.md      # Vertical documentation
```

## Adding a New Vertical

1. Create directory in `verticals/`
2. Copy structure from existing vertical
3. Define domain types in `types/`
4. Implement repository in `repository/`
5. Implement service in `service/`
6. Add validation in `validation/`
7. Create database migration
8. Write tests
9. Document in README

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(clients): add risk flag management

- Add addRiskFlag method to ClientService
- Add resolveRiskFlag method
- Update client repository with risk flag queries

Closes #42
```

```
fix(permissions): correct branch-level filtering

Branch admins were seeing clients from all branches.
Fixed by applying branchIds filter in search query.

Fixes #55
```

## Review Process

1. **Local validation** - Pre-commit hooks validate your changes
2. **Automated checks** - CI runs comprehensive checks (lint, typecheck, test, build)
3. **Code review** - Maintainer reviews code quality and design
4. **Testing** - Verify functionality in development environment
5. **Documentation** - Ensure docs are complete and accurate
6. **Merge** - Squash and merge when approved and all checks are green

### Why PRs Get Blocked

A PR cannot be merged if:
- ❌ Any CI check fails (lint, typecheck, test, or build)
- ❌ Code review is not approved
- ❌ There are unresolved conversations
- ❌ The branch is not up to date with `main`

**Always ensure all checks are green before requesting review.**

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to Care Commons! 🏡
