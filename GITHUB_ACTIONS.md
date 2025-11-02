# GitHub Actions Documentation

This document describes the GitHub Actions workflows used in Care Commons for CI/CD, testing, deployments, and release management.

## Overview

Care Commons uses GitHub Actions to automate:

- **Continuous Integration** - Testing, linting, and building on every PR
- **Continuous Deployment** - Automated deployments to staging and production
- **Database Management** - Safe database operations across environments
- **Security** - Automated dependency updates and vulnerability scanning
- **Release Management** - Version bumping, changelog generation, and publishing

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main` and `develop` branches
- Pushes to `main` and `develop` branches

**Jobs:**
- **lint** - Runs `npm run lint` across all packages - must have **zero warnings**
- **typecheck** - Runs `npm run typecheck` for TypeScript validation - must have **zero errors**
- **test** - Runs `npm run test:coverage` with PostgreSQL database - must pass **all tests** and meet **coverage thresholds**:
  - Lines: 82%
  - Statements: 82%
  - Branches: 70%
  - Functions: 87%
- **build** - Builds all packages and uploads artifacts - depends on all above jobs passing

**Environment:**
- Uses PostgreSQL service for integration tests
- Uploads coverage reports to Codecov (if token configured)
- Caches npm dependencies for faster builds

**Branch Protection:**
- All jobs must pass before PRs can be merged to `main`
- This ensures no code with linting errors, type errors, failing tests, or insufficient coverage makes it to production

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Vercel Hobby Plan Configuration:**
- Production environment ← `main` branch (pushes only)
- Preview environment ← `develop` branch (pushes only)
- Development environment ← local only (not in workflows)
- **Note**: Pull requests do NOT trigger deployments

**Triggers:**
- Pushes to `main` branch (production deployment)
- Pushes to `develop` branch (preview deployment)
- Manual workflow dispatch (production only)

**Jobs:**
- **build** - Builds and tests all packages
- **deploy-preview** - Preview deployment (develop branch pushes only)
- **deploy-production** - Production deployment (main branch only)

**Features:**
- Runs database migrations before deployment
- Supports environment-specific configuration
- Health checks after deployment
- CI checks run on all PRs (but no deployments)

### 3. Database Operations Workflow (`.github/workflows/database.yml`)

**Triggers:**
- Manual workflow dispatch only

**Operations:**
- `migrate` - Run database migrations
- `rollback` - Rollback last migration
- `status` - Check migration status
- `seed` - Seed database with sample data
- `nuke` - Destroy all data (⚠️ dangerous operation)

**Safety Features:**
- Environment selection (staging/production)
- Explicit confirmation for destructive operations
- Clear success/failure notifications

### 4. Security and Dependencies Workflow (`.github/workflows/security.yml`)

**Triggers:**
- Weekly schedule (Mondays at 2 AM UTC)
- Manual workflow dispatch

**Jobs:**
- **security-audit** - npm audit and CodeQL analysis
- **dependency-update** - Automated dependency updates with PR
- **snyk-security-scan** - Additional vulnerability scanning

**Features:**
- Creates pull requests for dependency updates
- Runs full test suite after updates
- Configurable severity thresholds
- Integration with multiple security tools

### 5. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Git tags matching `v*` pattern
- Manual workflow dispatch

**Jobs:**
- **create-release** - Version management and GitHub release creation
- **deploy-release** - Production deployment of tagged releases

**Features:**
- Automatic version bumping
- Changelog generation from git history
- GitHub release creation with detailed notes
- Support for manual version specification
- npm publishing (placeholder)

## Configuration

### Required Secrets

Configure these repository secrets in GitHub Settings:

```bash
# Vercel Configuration (REQUIRED)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=team_xxxx
VERCEL_PROJECT_ID=prj_xxxx

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:port/db
PREVIEW_DATABASE_URL=postgresql://user:pass@host:port/preview_db

# Application Secrets
JWT_SECRET=your-jwt-secret-key
PREVIEW_JWT_SECRET=your-preview-jwt-secret-key

# Optional Integrations
CODECOV_TOKEN=your-codecov-token
SNYK_TOKEN=your-snyk-token
GITHUB_TOKEN=ghp_your_github_token
```

### Environment-Specific Settings

**Production Environment (Vercel Production):**
- Branch: `main`
- Uses `DATABASE_URL` and `JWT_SECRET`
- Requires approval for deployments
- Runs full migration and seed process

**Preview Environment (Vercel Preview):**
- Branch: `develop` (pushes only)
- Uses `PREVIEW_DATABASE_URL` and `PREVIEW_JWT_SECRET`
- Automatic deployments when code is merged to develop
- Isolated from production data
- **No deployments for PRs** - only CI checks run

**Development Environment:**
- Local only (not deployed to Vercel)
- Use `vercel dev` to link to local machine
- Local database or development database

## Usage Examples

### Running Database Migrations

1. Go to Actions tab in GitHub repository
2. Select "Database Operations" workflow
3. Click "Run workflow"
4. Choose operation: `migrate`
5. Select environment: `staging` or `production`
6. Click "Run workflow"

### Creating a Release

**Option 1: Git Tag**
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Option 2: Manual Workflow**
1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Enter version: `1.0.0`
4. Choose release type: `patch`, `minor`, or `major`
5. Click "Run workflow"

### Updating Dependencies

The security workflow automatically:
1. Checks for outdated packages weekly
2. Updates patch and minor versions
3. Runs full test suite
4. Creates pull request if all tests pass

## Troubleshooting

### Common Issues

**Build Failures:**
- Check that Node.js version matches `package.json` engines
- Verify all dependencies are properly installed
- Ensure TypeScript compilation succeeds

**Test Failures:**
- Check PostgreSQL service is running in CI
- Verify database migrations completed successfully
- Review test logs for specific error messages

**Deployment Failures:**
- Confirm all required secrets are configured
- Check database connection strings
- Verify environment-specific configurations

**Permission Errors:**
- Ensure GitHub Actions have proper permissions
- Check environment protection rules
- Verify secret access permissions

### Debugging Steps

1. **Check Workflow Logs** - Review individual job outputs
2. **Verify Secrets** - Ensure all required secrets are set
3. **Test Locally** - Reproduce issues using same commands
4. **Check Dependencies** - Verify npm packages are compatible
5. **Review Changes** - Identify what changed since last success

## Pre-commit Hooks

Care Commons uses Husky to enforce quality gates **before code is committed**. This ensures that broken code never makes it into the repository.

### What Gets Checked

Every `git commit` automatically runs (via `.husky/pre-commit` → `./scripts/brief-check.sh`):

1. **Build** (`npm run build`) - Ensures all TypeScript compiles
2. **Lint** (`npm run lint`) - Enforces code style with zero warnings
3. **Type Check** (`npm run typecheck`) - Validates TypeScript types with zero errors
4. **Test Coverage** (`npm run test:coverage`) - Runs all tests and validates coverage thresholds

### Coverage Requirements

Tests must meet these minimum thresholds (configured in each package's `vitest.config.ts`):

- **Lines**: 82%
- **Statements**: 82%
- **Branches**: 70%
- **Functions**: 87%

If coverage falls below these thresholds, the commit is **blocked**.

### Important Rules

⚠️ **NEVER bypass pre-commit hooks:**

```bash
# ❌ WRONG - Do not do this!
git commit --no-verify -m "quick fix"
git commit -n -m "skip checks"

# ✅ CORRECT - Let hooks run
git commit -m "fix issue"
```

If pre-commit checks fail:
1. **Fix the issue** (linting error, type error, failing test, low coverage)
2. **Stage the fixes** (`git add .`)
3. **Commit again** - hooks will run automatically

### Why This Matters

Pre-commit hooks catch issues **before they're committed**, which:
- ✅ Prevents broken code from entering the repository
- ✅ Catches linting and type errors immediately
- ✅ Ensures test coverage doesn't decrease
- ✅ Reduces CI build failures
- ✅ Keeps the codebase clean and maintainable

**Two-Level Protection:**
1. **Local (Pre-commit)** - Catches issues before commit
2. **Remote (CI)** - Validates before merge to `main`

## Best Practices

### Development Workflow

1. **Feature Development**
   - Create feature branch from `develop`
   - Make changes with proper testing
   - Open pull request to `develop` (triggers CI checks only)
   - CI workflow validates changes automatically
   - Review code and CI results
   - Merge to `develop` (triggers preview deployment)
   - Verify preview deployment works correctly

2. **Release Preparation**
   - Ensure all tests pass on `develop`
   - Verify preview deployment works correctly
   - Update documentation as needed
   - Merge `develop` to `main` (triggers production deployment)
   - Monitor production deployment

3. **Hotfix Process**
   - Create hotfix branch from `main`
   - Fix issue with minimal changes
   - Merge directly to `main` (triggers production deployment)
   - Backport to `develop` to keep branches in sync

### Security Practices

- Review dependency update PRs carefully
- Monitor security scan results weekly
- Keep secrets rotated regularly
- Use environment-specific configurations
- Enable branch protection rules

### Performance Optimization

- Use workflow caching for faster builds
- Optimize test execution time
- Monitor workflow duration
- Use matrix builds when appropriate
- Clean up old artifacts and logs

## Customization

### Adding New Workflows

1. Create new YAML file in `.github/workflows/`
2. Follow existing naming conventions
3. Use appropriate triggers and permissions
4. Include proper error handling and logging
5. Update documentation

### Modifying Existing Workflows

1. Test changes in feature branch first
2. Consider impact on existing processes
3. Update documentation accordingly
4. Communicate changes to team
5. Monitor after deployment

### Environment-Specific Customization

- Add new environments as needed
- Configure appropriate secrets
- Update deployment scripts
- Test thoroughly before production use

## Support

For issues with GitHub Actions:

1. Check this documentation first
2. Review workflow logs for error details
3. Search existing GitHub issues
4. Create new issue with detailed information
5. Include workflow run links and error messages