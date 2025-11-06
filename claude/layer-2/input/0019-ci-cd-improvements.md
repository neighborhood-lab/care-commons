# Task 0019: CI/CD Pipeline Improvements and Deployment Automation

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 6-8 hours

## Context

The CI/CD pipeline exists but needs improvements for faster feedback, better test coverage, automated deployments, and production safety checks.

## Goal

- Fast feedback (<5 minutes for PR checks)
- Automated deployments with rollback capability
- Production safety gates
- Zero-downtime deployments
- Comprehensive pre-deployment checks

## Task

### 1. Optimize CI Pipeline Speed

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

# Cancel in-progress runs for same PR
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Quick checks first (fail fast)
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run typecheck

  # Run tests in parallel
  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [core, app, web, mobile]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test --workspace=@care-commons/${{ matrix.package }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: ${{ matrix.package }}

  # Build verification
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all packages
        run: npm run build

      - name: Check bundle size
        run: npm run bundlewatch

  # E2E tests (only on main/develop, not PRs from forks)
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository
    needs: [build]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Security checks
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Database migration check
  migration-check:
    name: Migration Check
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/care_commons

      - name: Rollback migrations
        run: npm run db:rollback
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/care_commons
```

### 2. Add Automated Deployment Pipeline

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches:
      - main        # Production
      - develop     # Staging

jobs:
  deploy:
    name: Deploy to ${{ github.ref_name == 'main' && 'Production' || 'Staging' }}
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.ref_name == 'main' && 'production' || 'staging' }}
      url: ${{ github.ref_name == 'main' && 'https://care-commons.vercel.app' || 'https://staging.care-commons.vercel.app' }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      # Pre-deployment checks
      - name: Run database migrations (dry-run)
        run: npm run db:migrate:dry-run
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Check for breaking changes
        run: npm run check:breaking-changes

      # Deploy to Vercel
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref_name == 'main' && '--prod' || '' }}

      # Run database migrations (actual)
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      # Post-deployment checks
      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          RESPONSE=$(curl -f -s -o /dev/null -w "%{http_code}" ${{ github.ref_name == 'main' && 'https://care-commons.vercel.app' || 'https://staging.care-commons.vercel.app' }}/health)
          if [ "$RESPONSE" != "200" ]; then
            echo "❌ Health check failed: $RESPONSE"
            exit 1
          fi
          echo "✅ Health check passed"

      - name: Smoke tests
        run: npm run test:smoke
        env:
          API_URL: ${{ github.ref_name == 'main' && 'https://care-commons.vercel.app' || 'https://staging.care-commons.vercel.app' }}

      # Notify deployment
      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "${{ job.status == 'success' && '✅' || '❌' }} Deployment to ${{ github.ref_name == 'main' && 'Production' || 'Staging' }}: ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Status*: ${{ job.status }}\n*Environment*: ${{ github.ref_name == 'main' && 'Production' || 'Staging' }}\n*Commit*: ${{ github.sha }}\n*Author*: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      # Rollback on failure
      - name: Rollback on failure
        if: failure()
        run: |
          echo "❌ Deployment failed, initiating rollback..."
          npm run deploy:rollback
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### 3. Add Pre-Deployment Safety Checks

**File**: `scripts/pre-deploy-checks.ts`

```typescript
#!/usr/bin/env tsx

import { execSync } from 'child_process';
import chalk from 'chalk';

interface Check {
  name: string;
  fn: () => Promise<boolean>;
  critical: boolean;
}

const checks: Check[] = [
  {
    name: 'Database connection',
    critical: true,
    fn: async () => {
      try {
        execSync('npm run db:ping', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Migration status',
    critical: true,
    fn: async () => {
      const status = execSync('npm run db:migrate:status').toString();
      return !status.includes('pending');
    }
  },
  {
    name: 'Test coverage',
    critical: true,
    fn: async () => {
      try {
        execSync('npm test -- --coverage --passWithNoTests', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'No TypeScript errors',
    critical: true,
    fn: async () => {
      try {
        execSync('npm run typecheck', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'No ESLint errors',
    critical: true,
    fn: async () => {
      try {
        execSync('npm run lint', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Environment variables set',
    critical: true,
    fn: async () => {
      const required = [
        'DATABASE_URL',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'ENCRYPTION_KEY'
      ];

      return required.every(key => process.env[key]);
    }
  },
  {
    name: 'Sensitive data not in logs',
    critical: true,
    fn: async () => {
      const output = execSync('npm run build 2>&1').toString();
      const forbidden = ['password', 'secret', 'api_key', 'token'];

      return !forbidden.some(word => output.toLowerCase().includes(word));
    }
  }
];

async function runPreDeployChecks() {
  console.log(chalk.blue.bold('\n🔍 Running pre-deployment checks...\n'));

  let passed = 0;
  let failed = 0;
  let criticalFailures: string[] = [];

  for (const check of checks) {
    process.stdout.write(`${check.name}... `);

    try {
      const result = await check.fn();

      if (result) {
        console.log(chalk.green('✅ PASS'));
        passed++;
      } else {
        console.log(chalk.red('❌ FAIL'));
        failed++;

        if (check.critical) {
          criticalFailures.push(check.name);
        }
      }
    } catch (error) {
      console.log(chalk.red('❌ ERROR'));
      failed++;

      if (check.critical) {
        criticalFailures.push(check.name);
      }
    }
  }

  console.log(chalk.blue.bold('\n📊 Results:'));
  console.log(`  Passed: ${chalk.green(passed)}`);
  console.log(`  Failed: ${chalk.red(failed)}`);

  if (criticalFailures.length > 0) {
    console.log(chalk.red.bold('\n❌ DEPLOYMENT BLOCKED'));
    console.log(chalk.red('Critical failures:'));
    criticalFailures.forEach(name => console.log(chalk.red(`  - ${name}`)));
    process.exit(1);
  } else if (failed > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Non-critical failures detected'));
    console.log(chalk.yellow('Deployment can proceed with caution'));
  } else {
    console.log(chalk.green.bold('\n✅ All checks passed! Ready to deploy'));
  }
}

runPreDeployChecks();
```

**Add to package.json**:
```json
{
  "scripts": {
    "predeploy": "tsx scripts/pre-deploy-checks.ts"
  }
}
```

### 4. Add Rollback Automation

**File**: `scripts/rollback-deployment.ts`

```typescript
#!/usr/bin/env tsx

import { execSync } from 'child_process';

async function rollback() {
  console.log('🔄 Rolling back deployment...');

  // Get previous deployment from Vercel
  const deployments = JSON.parse(
    execSync('vercel ls --json').toString()
  );

  const previousDeployment = deployments[1]; // Second most recent

  if (!previousDeployment) {
    console.error('❌ No previous deployment found');
    process.exit(1);
  }

  // Promote previous deployment to production
  execSync(`vercel promote ${previousDeployment.url} --scope=care-commons`);

  console.log('✅ Rollback complete');
  console.log(`Active deployment: ${previousDeployment.url}`);

  // Run health check on rolled-back deployment
  const healthCheck = execSync(`curl -f ${previousDeployment.url}/health`);
  console.log('✅ Health check passed');
}

rollback();
```

### 5. Add Smoke Tests

**File**: `e2e/tests/smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

// Critical path smoke tests - must pass after every deployment

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Care Commons/);
});

test('health check returns 200', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
});

test('login page accessible', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('API responds correctly', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});

test('database connection working', async ({ request }) => {
  const response = await request.get('/health/detailed');
  const body = await response.json();
  expect(body.checks.database).toBe('healthy');
});
```

### 6. Add Deployment Metrics

**File**: `scripts/record-deployment-metrics.ts`

```typescript
#!/usr/bin/env tsx

import { writeFileSync, readFileSync } from 'fs';

interface DeploymentMetric {
  timestamp: string;
  environment: string;
  duration: number;
  success: boolean;
  commit: string;
  deployer: string;
}

const metric: DeploymentMetric = {
  timestamp: new Date().toISOString(),
  environment: process.env.ENVIRONMENT || 'unknown',
  duration: parseInt(process.env.DEPLOYMENT_DURATION || '0'),
  success: process.env.DEPLOYMENT_SUCCESS === 'true',
  commit: process.env.GITHUB_SHA || 'unknown',
  deployer: process.env.GITHUB_ACTOR || 'unknown'
};

// Append to metrics file
const metricsFile = '.deployment-metrics.jsonl';
const existing = readFileSync(metricsFile, 'utf-8').split('\n').filter(Boolean);
existing.push(JSON.stringify(metric));

writeFileSync(metricsFile, existing.join('\n') + '\n');

console.log('✅ Deployment metrics recorded');
```

### 7. Add Deployment Checklist

**File**: `docs/DEPLOYMENT_CHECKLIST.md`

```markdown
# Deployment Checklist

## Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] No security vulnerabilities (Snyk scan)
- [ ] Changelog updated
- [ ] Stakeholders notified of deployment window

## During Deployment

- [ ] Monitor logs for errors
- [ ] Watch health check endpoint
- [ ] Monitor application metrics (response times, error rates)
- [ ] Verify database migrations applied
- [ ] Run smoke tests

## Post-Deployment

- [ ] Verify critical features working
- [ ] Check error tracking dashboard (Sentry)
- [ ] Monitor user feedback/support tickets
- [ ] Update deployment documentation
- [ ] Notify stakeholders of successful deployment

## Rollback Triggers

Initiate rollback if:
- [ ] Health check fails for >2 minutes
- [ ] Error rate increases >50%
- [ ] Critical feature broken
- [ ] Database migration fails
- [ ] Security vulnerability discovered
```

## Acceptance Criteria

- [ ] CI pipeline optimized (<5 minutes for PR checks)
- [ ] Automated deployment to staging on develop push
- [ ] Automated deployment to production on main push
- [ ] Pre-deployment checks implemented
- [ ] Rollback automation working
- [ ] Smoke tests passing after deployment
- [ ] Deployment metrics tracked
- [ ] Zero-downtime deployments
- [ ] Slack notifications for deployments
- [ ] Deployment checklist documented

## Metrics to Track

- **Deployment Frequency**: How often we deploy to production
- **Lead Time**: Time from commit to production
- **Change Failure Rate**: % of deployments causing failures
- **Mean Time to Recovery (MTTR)**: Time to recover from failed deployment

**Targets**:
- Deploy to production: Daily
- Lead time: <1 hour
- Change failure rate: <5%
- MTTR: <15 minutes

## Reference

- GitHub Actions: https://docs.github.com/en/actions
- Vercel Deployment: https://vercel.com/docs
- DORA Metrics: https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance
