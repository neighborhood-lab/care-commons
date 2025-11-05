# Care Commons: End-to-End Testing Guide

## Overview

This directory contains comprehensive end-to-end (E2E) tests for Care Commons using [Playwright](https://playwright.dev/). These tests validate critical user workflows across multiple states and compliance requirements.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Data & Seeding](#test-data--seeding)
- [Page Object Models](#page-object-models)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 22.x
- PostgreSQL 15+
- npm 10.9.0+

### Installation

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers
npx playwright install

# Set up test database
createdb care_commons_e2e_test
npm run db:migrate
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Browser

```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Debug Mode

```bash
npm run test:e2e:debug
```

### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

---

## Test Structure

```
e2e/
├── tests/                          # Test suites
│   ├── visit-lifecycle.spec.ts    # Visit workflow tests
│   ├── evv-compliance.spec.ts     # State-specific EVV tests
│   └── caregiver-assignment.spec.ts # Assignment validation tests
├── pages/                          # Page Object Models
│   ├── BasePage.ts                 # Base page with common methods
│   ├── VisitListPage.ts            # Visit list page
│   ├── VisitDetailPage.ts          # Visit detail page
│   ├── ScheduleVisitPage.ts        # Schedule visit form
│   ├── EVVRecordPage.ts            # EVV record view
│   └── CaregiverSelectionModal.ts  # Caregiver assignment
├── fixtures/                       # Test fixtures
│   └── auth.fixture.ts             # Authentication helpers
├── setup/                          # Test setup & teardown
│   ├── global-setup.ts             # Pre-test setup
│   ├── global-teardown.ts          # Post-test cleanup
│   ├── test-database.ts            # Database utilities
│   └── seeds/                      # Test data seeds
│       ├── visit-lifecycle.seed.ts
│       ├── texas-visit.seed.ts
│       ├── florida-visit-mco.seed.ts
│       └── ohio-visit.seed.ts
└── README.md                       # This file
```

---

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Specific Test File

```bash
npx playwright test visit-lifecycle.spec.ts
```

### Specific Test Case

```bash
npx playwright test -g "should complete full visit lifecycle"
```

### By Project (Browser)

```bash
npm run test:e2e:chromium    # Desktop Chrome
npm run test:e2e:firefox     # Desktop Firefox
npm run test:e2e:webkit      # Desktop Safari
npm run test:e2e:mobile      # Mobile Chrome + Safari
```

### With UI (Interactive Mode)

```bash
npm run test:e2e:ui
```

### Debug Mode

```bash
npm run test:e2e:debug
```

### Generate Report

```bash
npm run test:e2e:report
```

### Environment Variables

```bash
# Override database URL
E2E_DATABASE_URL=postgresql://localhost/my_test_db npm run test:e2e

# Override base URL
E2E_BASE_URL=http://localhost:4000 npm run test:e2e

# Drop database after tests
E2E_DROP_DATABASE=true npm run test:e2e
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { TestDatabase } from '../setup/test-database.js';

test.describe('My Test Suite', () => {
  test.beforeAll(async () => {
    await TestDatabase.setup();
  });

  test.afterAll(async () => {
    await TestDatabase.teardown();
  });

  test.beforeEach(async () => {
    await TestDatabase.cleanup();
    await TestDatabase.seed('my-scenario');
  });

  test('should do something', async ({ authenticatedPage }) => {
    const visitPage = new VisitDetailPage(authenticatedPage);
    await visitPage.goToVisit('visit-001');
    await visitPage.clockIn();
    await visitPage.assertStatus('IN_PROGRESS');
  });
});
```

### Using Authentication Fixtures

```typescript
// Use pre-configured coordinator user
test('coordinator workflow', async ({ authenticatedPage, coordinatorUser }) => {
  // authenticatedPage is already authenticated as coordinator
});

// Use admin user
test('admin workflow', async ({ page, adminUser, createAuthenticatedPage }) => {
  const adminPage = await createAuthenticatedPage(page, adminUser);
  // adminPage is authenticated as admin
});

// Use caregiver user
test('caregiver workflow', async ({ page, caregiverUser, createAuthenticatedPage }) => {
  const caregiverPage = await createAuthenticatedPage(page, caregiverUser);
});
```

### Using Page Objects

```typescript
import { VisitListPage } from '../pages/VisitListPage.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';

test('navigate to visit', async ({ authenticatedPage }) => {
  const listPage = new VisitListPage(authenticatedPage);
  await listPage.goToVisitList();
  await listPage.filterByStatus('SCHEDULED');
  await listPage.clickVisit('John Doe');

  const detailPage = new VisitDetailPage(authenticatedPage);
  await detailPage.assertStatus('SCHEDULED');
});
```

### Mocking Geolocation

```typescript
test('with GPS', async ({ authenticatedPage }) => {
  // Set geolocation
  await authenticatedPage.context().setGeolocation({
    latitude: 30.2672,
    longitude: -97.7431,
    accuracy: 10,
  });
  await authenticatedPage.context().grantPermissions(['geolocation']);

  // Now proceed with test
  await visitPage.clockIn();
});
```

---

## Test Data & Seeding

### Creating Seed Files

Create a new seed file in `e2e/setup/seeds/`:

```typescript
// e2e/setup/seeds/my-scenario.seed.ts
import { Database } from '../../../packages/core/src/db/connection.js';

export async function seedDatabase(db: Database): Promise<void> {
  console.log('Seeding my scenario...');

  // Insert test data
  await db.query(
    `INSERT INTO clients (id, organization_id, first_name, last_name, ...)
     VALUES ($1, $2, $3, $4, ...)`,
    ['client-id', 'org-id', 'John', 'Doe', ...]
  );

  console.log('✅ My scenario seeded');
}
```

### Using Seeds in Tests

```typescript
test.beforeEach(async () => {
  await TestDatabase.cleanup();
  await TestDatabase.seed('my-scenario'); // Loads my-scenario.seed.ts
});
```

### State-Specific Seeds

We provide pre-built seeds for state-specific testing:

- `visit-lifecycle.seed.ts` - Basic visit workflow
- `texas-visit.seed.ts` - Texas EVV with HHAeXchange
- `florida-visit-mco.seed.ts` - Florida MCO with signature requirements
- `ohio-visit.seed.ts` - Ohio with Sandata
- `texas-caregiver-no-emr.seed.ts` - Texas caregiver missing EMR check
- `florida-caregiver-valid-screening.seed.ts` - Florida Level 2 screening

---

## Page Object Models

### BasePage Methods

All page objects extend `BasePage` with common utilities:

```typescript
// Navigation
await page.goto('/path');
await page.waitForPageLoad();

// Interaction
await page.clickButton('Save');
await page.fillInput('Name', 'John Doe');
await page.selectOption('State', 'TX');

// Waiting
await page.waitForToast('Saved successfully');
await page.waitForErrorToast('Validation failed');

// Assertions
await page.assertUrl('/visits/123');
await page.assertTitle('Visit Details');

// Utilities
await page.screenshot('debug-screenshot');
await page.reload();
```

### Creating New Page Objects

```typescript
// e2e/pages/MyPage.ts
import { BasePage } from './BasePage.js';
import { Locator } from '@playwright/test';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: 'My Button' });
  }

  async clickMyButton(): Promise<void> {
    await this.myButton.click();
    await this.waitForPageLoad();
  }
}
```

---

## CI/CD Integration

### GitHub Actions

E2E tests run automatically on:

- Pull requests to `main`, `preview`, `develop`
- Push to `main`, `preview`, `develop`
- Nightly at 2 AM UTC
- Manual workflow dispatch

### Workflow Configuration

See `.github/workflows/e2e-tests.yml`

Tests run in parallel across:

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop)
- Mobile Chrome
- Mobile Safari

### Artifacts

On test failure, the following are uploaded:

- HTML test reports (30 days retention)
- Screenshots (7 days retention)
- Videos (7 days retention)

---

## Troubleshooting

### Test Database Issues

```bash
# Reset test database
dropdb care_commons_e2e_test
createdb care_commons_e2e_test
npm run db:migrate

# Check database connection
psql -d care_commons_e2e_test -c "SELECT 1"
```

### Browser Installation Issues

```bash
# Reinstall browsers
npx playwright install --with-deps

# Install specific browser
npx playwright install chromium
```

### Timeout Errors

```typescript
// Increase timeout for specific test
test('slow test', async ({ authenticatedPage }) => {
  test.setTimeout(180000); // 3 minutes

  // ... test code
});
```

### Flaky Tests

```typescript
// Retry failed tests
test.describe.configure({ retries: 2 });

// Or in playwright.config.ts:
retries: process.env['CI'] ? 2 : 0,
```

### Debug with Trace

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Inspect Element

```typescript
// Pause execution to inspect
await page.pause();
```

---

## Best Practices

### 1. Use Page Objects

✅ **Good:**
```typescript
const visitPage = new VisitDetailPage(page);
await visitPage.clockIn();
```

❌ **Bad:**
```typescript
await page.getByRole('button', { name: 'Clock In' }).click();
```

### 2. Seed Data Per Test

✅ **Good:**
```typescript
test.beforeEach(async () => {
  await TestDatabase.cleanup();
  await TestDatabase.seed('visit-lifecycle');
});
```

❌ **Bad:**
```typescript
// Sharing data between tests (causes flakiness)
```

### 3. Descriptive Test Names

✅ **Good:**
```typescript
test('should prevent clock-in outside geofence', async () => {});
```

❌ **Bad:**
```typescript
test('test1', async () => {});
```

### 4. Assertions

✅ **Good:**
```typescript
await expect(page.locator('[data-testid="status"]')).toHaveText('COMPLETED');
```

❌ **Bad:**
```typescript
const text = await page.locator('[data-testid="status"]').textContent();
expect(text).toBe('COMPLETED'); // No auto-retry
```

---

## Test Coverage

### Critical Workflows

- ✅ Visit lifecycle (schedule → clock in → complete → clock out)
- ✅ EVV compliance (TX, FL, OH state-specific)
- ✅ Caregiver assignment (multi-state validation)
- ✅ GPS verification and geofencing
- ✅ Task completion tracking
- ✅ State-specific credential requirements

### State Coverage

- ✅ Texas (EMR clearance, HHAeXchange, VMUR)
- ✅ Florida (Level 2 screening, MCO signatures)
- ✅ Ohio (STNA certification, Sandata)
- ⚠️ Pennsylvania (partial)
- ⚠️ Georgia (partial)
- ⚠️ North Carolina (planned)
- ⚠️ Arizona (planned)

---

## Contributing

### Adding New Tests

1. Create test file in `e2e/tests/`
2. Create seed data in `e2e/setup/seeds/`
3. Add page objects if needed in `e2e/pages/`
4. Document new scenarios in this README
5. Run tests locally: `npm run test:e2e`
6. Verify CI passes on PR

### Adding State-Specific Tests

1. Research state requirements (EVV aggregator, credentials, etc.)
2. Create seed file: `e2e/setup/seeds/{state}-visit.seed.ts`
3. Add test cases in `e2e/tests/evv-compliance.spec.ts`
4. Add to state coverage section above

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Care Commons Architecture](../packages/web/ARCHITECTURE.md)
- [Care Commons EVV Implementation](../verticals/time-tracking-evv/README.md)

---

**Care Commons** - Shared care software, community owned
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
