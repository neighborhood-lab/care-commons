# Task 0052: E2E Test Suite for Critical Workflows

**Priority**: 🔴 HIGH (Production Requirement)
**Category**: Testing / Quality Assurance
**Estimated Effort**: 1 week (40 hours)

## Context

Care Commons has strong unit test coverage (70+ test files) but minimal end-to-end testing. Before production launch, we need E2E tests for critical user workflows to ensure:

1. **Cross-vertical integration** - Features work together (e.g., schedule → EVV → billing)
2. **Multi-persona workflows** - Different user roles can complete their tasks
3. **Regression prevention** - Changes don't break core functionality
4. **Production confidence** - Critical paths are validated before each deployment

Current test coverage gaps:
- ✅ Unit tests: 70+ files, good coverage
- 🚧 Integration tests: Limited
- ❌ E2E tests: Minimal
- ❌ Multi-persona scenarios: None

## Objective

Implement comprehensive E2E test suite covering the 5 most critical workflows:

1. **Visit Lifecycle** - Schedule → Clock-in → Complete → Bill
2. **Family Portal** - Login → View updates → Send message → Get notification
3. **Caregiver Onboarding** - Create account → Add credentials → Assign visits
4. **Care Plan Management** - Create plan → Assign tasks → Track completion
5. **Multi-State EVV** - Submit visit → State-specific validation → Compliance report

## Technology Stack

**Recommended**: Playwright (best for full-stack E2E testing)

**Rationale**:
- Supports API + UI testing in one framework
- Better debugging than Cypress
- Faster than Selenium
- Built-in assertions and waiting
- Great TypeScript support
- Can test web + API (important for our use case)

**Alternative**: Cypress (if team prefers)

## Test Architecture

```
packages/e2e-tests/              # New package
├── fixtures/
│   ├── users.ts                 # Test user data
│   ├── clients.ts               # Test client data
│   ├── caregivers.ts            # Test caregiver data
│   └── visits.ts                # Test visit data
├── helpers/
│   ├── auth.ts                  # Login helpers
│   ├── db-seed.ts               # Database seeding
│   ├── api.ts                   # API helpers
│   └── assertions.ts            # Custom assertions
├── workflows/
│   ├── visit-lifecycle.spec.ts
│   ├── family-portal.spec.ts
│   ├── caregiver-onboarding.spec.ts
│   ├── care-plan-management.spec.ts
│   └── multi-state-evv.spec.ts
└── playwright.config.ts
```

## Implementation Steps

### Step 1: Setup Playwright

```bash
cd /home/user/care-commons
mkdir -p packages/e2e-tests
cd packages/e2e-tests
npm init -y
npm install -D @playwright/test @playwright/test-results
npm install -D typescript @types/node
npx playwright install
```

**package.json**:
```json
{
  "name": "@care-commons/e2e-tests",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  }
}
```

**playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './workflows',
  fullyParallel: false, // Critical: DB state must be controlled
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Serial execution for DB isolation
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Add others later: firefox, webkit, mobile
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Step 2: Create Database Seeding Helper

**helpers/db-seed.ts**:
```typescript
import { knex } from '@care-commons/core/database';
import { hash } from '@care-commons/core/auth/password';

export async function seedTestDatabase() {
  // Clear existing test data
  await knex('visits').where('is_test_data', true).del();
  await knex('caregivers').where('email', 'like', '%@test.care-commons.local').del();
  await knex('clients').where('is_test_data', true).del();
  await knex('users').where('email', 'like', '%@test.care-commons.local').del();

  // Create test users
  const adminUser = await knex('users').insert({
    email: 'admin@test.care-commons.local',
    password_hash: await hash('TestPassword123!'),
    role: 'administrator',
    is_test_data: true,
  }).returning('*');

  const coordinatorUser = await knex('users').insert({
    email: 'coordinator@test.care-commons.local',
    password_hash: await hash('TestPassword123!'),
    role: 'coordinator',
    is_test_data: true,
  }).returning('*');

  const caregiverUser = await knex('users').insert({
    email: 'caregiver@test.care-commons.local',
    password_hash: await hash('TestPassword123!'),
    role: 'caregiver',
    is_test_data: true,
  }).returning('*');

  const familyUser = await knex('users').insert({
    email: 'family@test.care-commons.local',
    password_hash: await hash('TestPassword123!'),
    role: 'family',
    is_test_data: true,
  }).returning('*');

  // Create test client
  const client = await knex('clients').insert({
    first_name: 'Jane',
    last_name: 'TestClient',
    email: 'jane.client@test.care-commons.local',
    phone: '555-0100',
    address_line1: '123 Test Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    latitude: 30.2672,
    longitude: -97.7431,
    is_test_data: true,
  }).returning('*');

  // Create test caregiver
  const caregiver = await knex('caregivers').insert({
    user_id: caregiverUser[0].id,
    first_name: 'John',
    last_name: 'TestCaregiver',
    email: 'caregiver@test.care-commons.local',
    phone: '555-0200',
    address_line1: '456 Test Avenue',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    latitude: 30.2672,
    longitude: -97.7431,
    is_test_data: true,
  }).returning('*');

  return {
    users: {
      admin: adminUser[0],
      coordinator: coordinatorUser[0],
      caregiver: caregiverUser[0],
      family: familyUser[0],
    },
    client: client[0],
    caregiver: caregiver[0],
  };
}

export async function cleanupTestData() {
  await knex('visits').where('is_test_data', true).del();
  await knex('caregivers').where('email', 'like', '%@test.care-commons.local').del();
  await knex('clients').where('is_test_data', true).del();
  await knex('users').where('email', 'like', '%@test.care-commons.local').del();
}
```

### Step 3: Create Authentication Helper

**helpers/auth.ts**:
```typescript
import { test as base, Page } from '@playwright/test';
import { seedTestDatabase } from './db-seed';

export async function loginAs(page: Page, role: 'admin' | 'coordinator' | 'caregiver' | 'family') {
  const credentials = {
    admin: { email: 'admin@test.care-commons.local', password: 'TestPassword123!' },
    coordinator: { email: 'coordinator@test.care-commons.local', password: 'TestPassword123!' },
    caregiver: { email: 'caregiver@test.care-commons.local', password: 'TestPassword123!' },
    family: { email: 'family@test.care-commons.local', password: 'TestPassword123!' },
  };

  const cred = credentials[role];

  await page.goto('/login');
  await page.fill('input[name="email"]', cred.email);
  await page.fill('input[name="password"]', cred.password);
  await page.click('button[type="submit"]');

  // Wait for redirect after login
  await page.waitForURL(/\/(dashboard|portal|today)/);
}

// Custom fixture with auto-seeding
export const test = base.extend({
  page: async ({ page }, use) => {
    // Seed database before each test
    await seedTestDatabase();
    await use(page);
    // Cleanup happens in global teardown
  },
});
```

### Step 4: Implement Workflow Tests

**workflows/visit-lifecycle.spec.ts**:
```typescript
import { test, expect } from '../helpers/auth';

test.describe('Visit Lifecycle Workflow', () => {
  test('Complete visit flow: Schedule → Clock-in → Complete → Bill', async ({ page }) => {
    // Step 1: Coordinator schedules a visit
    await test.step('Coordinator schedules visit', async () => {
      await loginAs(page, 'coordinator');
      await page.goto('/scheduling');

      await page.click('button:has-text("Schedule Visit")');
      await page.selectOption('select[name="client_id"]', { label: 'Jane TestClient' });
      await page.selectOption('select[name="caregiver_id"]', { label: 'John TestCaregiver' });
      await page.fill('input[name="scheduled_start"]', '2025-11-09T10:00');
      await page.fill('input[name="scheduled_end"]', '2025-11-09T12:00');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Visit scheduled successfully')).toBeVisible();
    });

    // Step 2: Caregiver clocks in
    await test.step('Caregiver clocks in to visit', async () => {
      await page.goto('/logout');
      await loginAs(page, 'caregiver');
      await page.goto('/today');

      // Find the scheduled visit
      const visitCard = page.locator('[data-testid="visit-card"]').first();
      await visitCard.click();

      // Clock in
      await page.click('button:has-text("Clock In")');

      // Mock GPS (if using geolocation)
      await page.context().grantPermissions(['geolocation']);
      await page.context().setGeolocation({ latitude: 30.2672, longitude: -97.7431 });

      await expect(page.locator('text=Clocked in successfully')).toBeVisible();
    });

    // Step 3: Caregiver completes tasks and clocks out
    await test.step('Caregiver completes visit', async () => {
      // Complete care tasks
      await page.click('button:has-text("Tasks")');
      const firstTask = page.locator('[data-testid="task-item"]').first();
      await firstTask.click();
      await page.click('button:has-text("Mark Complete")');

      // Add notes
      await page.fill('textarea[name="visit_notes"]', 'Provided excellent care. Client in good spirits.');

      // Clock out
      await page.click('button:has-text("Clock Out")');

      await expect(page.locator('text=Visit completed successfully')).toBeVisible();
    });

    // Step 4: Coordinator verifies and approves for billing
    await test.step('Coordinator approves visit for billing', async () => {
      await page.goto('/logout');
      await loginAs(page, 'coordinator');
      await page.goto('/visits');

      // Filter completed visits
      await page.selectOption('select[name="status"]', 'completed');

      const visit = page.locator('[data-testid="visit-row"]').first();
      await visit.click();

      // Verify EVV compliance
      await expect(page.locator('text=GPS: Verified')).toBeVisible();
      await expect(page.locator('text=Time: Verified')).toBeVisible();

      // Approve for billing
      await page.click('button:has-text("Approve for Billing")');

      await expect(page.locator('text=Approved for billing')).toBeVisible();
    });

    // Step 5: Billing generates invoice
    await test.step('Billing system processes visit', async () => {
      await page.goto('/billing/invoices');

      // Trigger invoice generation (or wait for automatic)
      await page.click('button:has-text("Generate Invoices")');

      // Verify visit appears on invoice
      await page.fill('input[name="search"]', 'Jane TestClient');
      const invoice = page.locator('[data-testid="invoice-row"]').first();
      await expect(invoice).toContainText('Jane TestClient');
      await expect(invoice).toContainText('2 hours'); // 10am-12pm
    });
  });

  test('Multi-state EVV compliance validation', async ({ page }) => {
    // Test TX, FL, OH state-specific validations
    await loginAs(page, 'coordinator');

    // Create visits in different states
    const states = ['TX', 'FL', 'OH'];

    for (const state of states) {
      await test.step(`Validate ${state} EVV requirements`, async () => {
        // Create client in state
        // Schedule visit
        // Verify state-specific fields are enforced
        // Complete visit with EVV
        // Verify compliance report shows correct state regs
      });
    }
  });
});
```

**workflows/family-portal.spec.ts**:
```typescript
import { test, expect } from '../helpers/auth';

test.describe('Family Portal Workflow', () => {
  test('Family member views care updates and communicates', async ({ page }) => {
    // Step 1: Family logs in
    await test.step('Family member logs in', async () => {
      await loginAs(page, 'family');
      await expect(page).toHaveURL(/\/family-portal/);
    });

    // Step 2: View recent visit updates
    await test.step('View recent visits', async () => {
      await page.goto('/family-portal/visits');

      const visitList = page.locator('[data-testid="visit-list"]');
      await expect(visitList).toBeVisible();

      // Should see completed visit from previous test
      const visit = visitList.locator('[data-testid="visit-item"]').first();
      await expect(visit).toContainText('John TestCaregiver');
      await expect(visit).toContainText('Completed');
    });

    // Step 3: Send message to care team
    await test.step('Send message to coordinator', async () => {
      await page.goto('/family-portal/messages');

      await page.click('button:has-text("New Message")');
      await page.selectOption('select[name="recipient"]', 'coordinator@test.care-commons.local');
      await page.fill('input[name="subject"]', 'Question about care plan');
      await page.fill('textarea[name="message"]', 'Can we discuss updating Mom\'s care schedule?');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Message sent')).toBeVisible();
    });

    // Step 4: Coordinator receives and responds
    await test.step('Coordinator responds to message', async () => {
      await page.goto('/logout');
      await loginAs(page, 'coordinator');
      await page.goto('/messages');

      // Find unread message
      const message = page.locator('[data-testid="message-item"]').filter({ hasText: 'Question about care plan' });
      await message.click();

      await page.fill('textarea[name="reply"]', 'Yes, I\'ll call you tomorrow to discuss options.');
      await page.click('button:has-text("Send Reply")');

      await expect(page.locator('text=Reply sent')).toBeVisible();
    });

    // Step 5: Family receives notification
    await test.step('Family receives notification', async () => {
      await page.goto('/logout');
      await loginAs(page, 'family');
      await page.goto('/family-portal/notifications');

      const notification = page.locator('[data-testid="notification"]').first();
      await expect(notification).toContainText('New reply to your message');
    });
  });
});
```

### Step 5: Add Database Migration for Test Data Flag

**Add to schema**:
```sql
-- Add is_test_data column to all tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;

-- Create index for faster cleanup
CREATE INDEX IF NOT EXISTS idx_users_test_data ON users(is_test_data);
CREATE INDEX IF NOT EXISTS idx_clients_test_data ON clients(is_test_data);
CREATE INDEX IF NOT EXISTS idx_caregivers_test_data ON caregivers(is_test_data);
CREATE INDEX IF NOT EXISTS idx_visits_test_data ON visits(is_test_data);
```

### Step 6: Add CI Integration

**.github/workflows/e2e-tests.yml**:
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: care_commons_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run migrate:latest
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/care_commons_test

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/care_commons_test
          BASE_URL: http://localhost:3000

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: packages/e2e-tests/playwright-report/
```

## Additional Workflows to Implement

### 3. Caregiver Onboarding
- Admin creates caregiver account
- Caregiver completes profile
- Caregiver uploads credentials (license, certifications)
- Admin verifies and approves credentials
- Coordinator assigns first visit

### 4. Care Plan Management
- Coordinator creates care plan for client
- Coordinator adds tasks (ADLs, medications, etc.)
- Coordinator assigns plan to caregiver
- Caregiver views and completes tasks during visit
- System tracks completion percentage

### 5. Shift Matching
- Coordinator creates open shift
- System recommends caregivers (8-dimensional scoring)
- Coordinator assigns best match
- Caregiver accepts shift
- Visit scheduled automatically

## Success Criteria

- [ ] All 5 critical workflows have E2E tests
- [ ] Tests run in CI on every PR
- [ ] Test coverage includes happy path + error cases
- [ ] Tests are deterministic (no flaky tests)
- [ ] Test execution time < 10 minutes
- [ ] Failed tests provide clear error messages
- [ ] Screenshots/videos captured on failure
- [ ] Database cleanup works properly (no test pollution)

## Maintenance

- Add new E2E tests for any new critical workflows
- Update tests when UI changes
- Keep test data fixtures realistic but minimal
- Review and remove flaky tests
- Monitor test execution time

## Related Tasks

- Task 0051 - Documentation Audit (validates claims made in docs)
- Task 0053 - Load Testing (complements E2E with performance)
- Task 0065 - Mobile App Testing Automation (similar approach for mobile)
