import { Page, BrowserContext } from '@playwright/test';
import { TestDatabase } from '../setup/test-database.js';
import { createAuthenticatedPage, AuthenticatedUser } from '../fixtures/auth.fixture.js';
import { TEST_GPS_COORDINATES } from '../fixtures/test-data.js';

/**
 * E2E Test Helper Functions
 *
 * Utility functions to simplify common E2E test operations
 */

/**
 * Quick login as a specific role
 */
export async function login(
  page: Page,
  role: 'admin' | 'coordinator' | 'caregiver' | 'family'
): Promise<void> {
  const users: Record<string, AuthenticatedUser> = {
    admin: {
      userId: 'admin-e2e-001',
      email: 'admin@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['SUPER_ADMIN'],
      permissions: ['*:*'],
    },
    coordinator: {
      userId: 'coord-e2e-001',
      email: 'coordinator@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['COORDINATOR'],
      permissions: ['clients:*', 'caregivers:*', 'visits:*', 'evv:*'],
    },
    caregiver: {
      userId: 'caregiver-e2e-001',
      email: 'caregiver@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['CAREGIVER'],
      permissions: ['visits:read:own', 'evv:write:own'],
    },
    family: {
      userId: 'family-e2e-001',
      email: 'family@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['FAMILY_MEMBER'],
      permissions: [
        'clients:read', 'visits:read', 'care-plans:read', 'tasks:read', 'schedules:read',
        'family-portal:view', 'notifications:view', 'messages:view', 'messages:write',
        'activity-feed:view'
      ],
    },
  };

  await createAuthenticatedPage(page, users[role]);
}

/**
 * Seed database with test data
 */
export async function seedDatabase(seedName?: string): Promise<void> {
  if (seedName) {
    await TestDatabase.seed(seedName);
  } else {
    await TestDatabase.seed('visit-lifecycle');
  }
}

/**
 * Clean database after tests
 */
export async function clearDatabase(): Promise<void> {
  await TestDatabase.cleanup();
}

/**
 * Mock GPS location
 */
export async function mockGPS(
  page: Page,
  location: 'austin' | 'newyork' | 'sanfrancisco' | { latitude: number; longitude: number; accuracy?: number }
): Promise<void> {
  let coords;

  if (typeof location === 'string') {
    const locationMap = {
      austin: TEST_GPS_COORDINATES.austinTX,
      newyork: TEST_GPS_COORDINATES.newYorkNY,
      sanfrancisco: TEST_GPS_COORDINATES.sanFranciscoCA,
    };
    coords = locationMap[location];
  } else {
    coords = { accuracy: 10, ...location };
  }

  await page.context().setGeolocation(coords);
  await page.context().grantPermissions(['geolocation']);
}

/**
 * Mock biometric verification
 */
export async function mockBiometric(page: Page, success: boolean = true): Promise<void> {
  await page.addInitScript((success) => {
    (window as any).mockBiometric = {
      authenticate: () => Promise.resolve({ success }),
    };
  }, success);
}

/**
 * Wait for offline sync to complete
 */
export async function waitForSync(page: Page, timeout: number = 10000): Promise<void> {
  const syncStatus = page.locator('[data-testid="sync-status"]');
  await syncStatus.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});

  // Wait for "synced" or "up to date" status
  await page.waitForFunction(
    () => {
      const statusEl = document.querySelector('[data-testid="sync-status"]');
      if (!statusEl) return true;
      const text = statusEl.textContent?.toLowerCase() || '';
      return text.includes('synced') || text.includes('up to date');
    },
    { timeout }
  );
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Simulate slow network (3G)
 */
export async function simulateSlowNetwork(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 100, // 100ms
  });
}

/**
 * Simulate offline mode
 */
export async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

/**
 * Restore online mode
 */
export async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
}

/**
 * Fill form with data object
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string>
): Promise<void> {
  for (const [label, value] of Object.entries(formData)) {
    const input = page.getByLabel(label, { exact: false });
    const inputExists = await input.isVisible({ timeout: 1000 }).catch(() => false);

    if (inputExists) {
      const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

      if (tagName === 'select') {
        await input.selectOption(value);
      } else if (tagName === 'input') {
        const type = await input.getAttribute('type');
        if (type === 'checkbox') {
          if (value === 'true' || value === '1') {
            await input.check();
          }
        } else {
          await input.fill(value);
        }
      } else {
        await input.fill(value);
      }
    }
  }
}

/**
 * Wait for element to appear
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Get element text content
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  return (await element.textContent()) || '';
}

/**
 * Click element by test ID
 */
export async function clickByTestId(page: Page, testId: string): Promise<void> {
  await page.locator(`[data-testid="${testId}"]`).click();
}

/**
 * Generate random email
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate random phone number
 */
export function generateRandomPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `${areaCode}-555-${lineNumber}`;
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time for input fields (HH:MM)
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get date N days from now
 */
export function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDate(date);
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 10000,
  intervalMs: number = 500
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Condition not met within timeout');
}

/**
 * Intercept API call
 */
export async function interceptAPI(
  page: Page,
  urlPattern: string,
  response: any
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock API error
 */
export async function mockAPIError(
  page: Page,
  urlPattern: string,
  statusCode: number = 500,
  errorMessage: string = 'Internal Server Error'
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: errorMessage }),
    });
  });
}
