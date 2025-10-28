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

3. **Test your changes**
   ```bash
   npm run typecheck
   npm test
   npm run lint
   ```

4. **Commit your changes**
   - Write clear, descriptive commit messages
   - Reference related issues (e.g., "Fixes #123")

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Guidelines

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
- Aim for >80% code coverage
- Test edge cases and error conditions

### Documentation

- Update README files when adding features
- Document all public APIs
- Include usage examples
- Keep documentation up to date with code changes

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

1. **Automated checks** - CI runs tests and linting
2. **Code review** - Maintainer reviews code quality and design
3. **Testing** - Verify functionality in development environment
4. **Documentation** - Ensure docs are complete and accurate
5. **Merge** - Squash and merge when approved

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to Care Commons! 🏡
