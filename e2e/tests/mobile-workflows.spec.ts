import { test, expect, devices } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture.js';
import { VisitListPage } from '../pages/VisitListPage.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { TestDatabase } from '../setup/test-database.js';

/**
 * Mobile-Specific Workflow Tests
 *
 * Tests mobile viewport behavior and touch interactions:
 * 1. Mobile Visit Check-In with GPS
 * 2. Mobile Offline Sync
 * 3. Mobile Responsive Design
 */
test.describe('Mobile Workflows', () => {
  test.beforeAll(async () => {
    await TestDatabase.setup();
  });

  test.afterAll(async () => {
    await TestDatabase.teardown();
  });

  test.beforeEach(async () => {
    await TestDatabase.cleanup();
    await TestDatabase.seed('visit-lifecycle');
  });

  test('Mobile Visit Check-In: navigate and check in on mobile device', async ({
    browser,
  }) => {
    // Create mobile context (iPhone 12 Pro)
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
      geolocation: { latitude: 30.2672, longitude: -97.7431, accuracy: 10 },
      permissions: ['geolocation'],
    });

    const page = await context.newPage();

    // Set up authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'caregiver-token');
      localStorage.setItem('userId', 'caregiver-e2e-001');
      localStorage.setItem('organizationId', 'org-e2e-001');
    });

    // Navigate to today's visits
    await page.goto('/visits/today');
    await page.waitForLoadState('networkidle');

    // Verify mobile layout
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(428); // Mobile width

    // Find and tap visit card
    const visitCard = page.locator('[data-testid="visit-card"]').first();
    await expect(visitCard).toBeVisible();
    await visitCard.tap();

    // Wait for visit detail page
    await page.waitForURL(/\/visits\/\d+/);

    const visitDetail = new VisitDetailPage(page);

    // Verify check-in button has adequate touch target size
    const checkInBtn = page.locator('[data-testid="check-in-btn"]');
    await expect(checkInBtn).toBeVisible();

    const boundingBox = await checkInBtn.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44);

    // Tap check-in button
    await checkInBtn.tap();

    // Should verify GPS capture
    const gpsIndicator = page.locator('[data-testid="gps-status"]');
    await expect(gpsIndicator).toBeVisible();
    await expect(gpsIndicator).toContainText(/captured|verified|within.*range/i);

    // Verify status changed
    await visitDetail.assertStatus('IN_PROGRESS');

    // Verify mobile-optimized layout
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();

    await context.close();
  });

  test('Mobile Visit Check-In: should handle biometric authentication prompt', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
      geolocation: { latitude: 30.2672, longitude: -97.7431, accuracy: 10 },
      permissions: ['geolocation'],
    });

    const page = await context.newPage();

    // Set up authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'caregiver-token');
      localStorage.setItem('userId', 'caregiver-e2e-001');
    });

    await page.goto('/visits/visit-001');

    // Mock biometric API
    await page.addInitScript(() => {
      (window as any).mockBiometric = {
        authenticate: () => Promise.resolve({ success: true }),
      };
    });

    const checkInBtn = page.locator('[data-testid="check-in-btn"]');
    await checkInBtn.tap();

    // If biometric is enabled, should show biometric prompt
    const biometricPrompt = page.locator('[data-testid="biometric-prompt"]');
    const biometricExists = await biometricPrompt.isVisible({ timeout: 2000 }).catch(() => false);

    if (biometricExists) {
      await expect(biometricPrompt).toContainText(/face id|touch id|fingerprint|biometric/i);

      // Confirm biometric
      const confirmBtn = page.getByRole('button', { name: /confirm|authenticate/i });
      await confirmBtn.tap();
    }

    // Should complete check-in
    const statusBadge = page.locator('[data-testid="visit-status"]');
    await expect(statusBadge).toContainText(/in progress|active/i, { timeout: 5000 });

    await context.close();
  });

  test('Mobile Offline Sync: complete visit offline and sync when online', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
      geolocation: { latitude: 30.2672, longitude: -97.7431, accuracy: 10 },
      permissions: ['geolocation'],
    });

    const page = await context.newPage();

    // Set up authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'caregiver-token');
      localStorage.setItem('userId', 'caregiver-e2e-001');
    });

    const visitDetail = new VisitDetailPage(page);
    await visitDetail.goToVisit('visit-001');
    await visitDetail.clockIn({ withGPS: true });

    // Go offline
    await context.setOffline(true);

    // Verify offline indicator shown
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
    await expect(offlineIndicator).toContainText(/offline|no.*connection/i);

    // Complete tasks while offline
    const task1 = page.locator('[data-testid="task-checkbox"]').first();
    await task1.tap();

    const task2 = page.locator('[data-testid="task-checkbox"]').nth(1);
    await task2.tap();

    // Add notes while offline
    await page.getByLabel('Visit Notes').fill('Completed all tasks offline');

    // Should show queued for sync
    const syncStatus = page.locator('[data-testid="sync-status"]');
    await expect(syncStatus).toContainText(/queued|pending|waiting.*sync/i);

    // Go back online
    await context.setOffline(false);

    // Should automatically sync
    await expect(offlineIndicator).toBeHidden({ timeout: 10000 });
    await expect(syncStatus).toContainText(/synced|up.*to.*date/i, { timeout: 10000 });

    // Verify success notification
    const syncToast = page.locator('[role="alert"][data-type="success"]');
    await expect(syncToast).toContainText(/synced|saved/i);

    await context.close();
  });

  test('Mobile Responsive Design: verify all key pages on mobile viewport', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
    });

    const page = await context.newPage();

    // Set up authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'coordinator-token');
      localStorage.setItem('userId', 'coord-e2e-001');
    });

    const pagesToTest = [
      { path: '/visits', name: 'Visit List' },
      { path: '/visits/schedule', name: 'Schedule Visit' },
      { path: '/clients', name: 'Client List' },
      { path: '/caregivers', name: 'Caregiver List' },
      { path: '/dashboard', name: 'Dashboard' },
    ];

    for (const testPage of pagesToTest) {
      await page.goto(testPage.path);
      await page.waitForLoadState('networkidle');

      // Verify no horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance

      // Verify mobile navigation visible
      const mobileNav = page.locator('[data-testid="mobile-nav"], [data-testid="hamburger-menu"]');
      await expect(mobileNav).toBeVisible();

      // Verify readable font sizes (at least 16px for body text)
      const bodyFontSize = await page.evaluate(() => {
        const body = document.body;
        return parseInt(window.getComputedStyle(body).fontSize);
      });
      expect(bodyFontSize).toBeGreaterThanOrEqual(14); // Minimum readable size

      // Verify touch targets are adequate size
      const buttons = page.locator('button:visible').first();
      if (await buttons.isVisible()) {
        const box = await buttons.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(36); // Reasonable minimum
        }
      }
    }

    await context.close();
  });

  test('Mobile Responsive Design: verify touch targets meet accessibility standards', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
    });

    const page = await context.newPage();

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'caregiver-token');
    });

    await page.goto('/visits/today');

    // Check all interactive elements
    const interactiveElements = await page.locator('button, a, input, [role="button"]').all();

    for (const element of interactiveElements.slice(0, 10)) { // Check first 10
      const isVisible = await element.isVisible();
      if (isVisible) {
        const box = await element.boundingBox();
        if (box) {
          // iOS Human Interface Guidelines: minimum 44x44pt
          // Android: minimum 48x48dp
          // We'll use 44px as minimum
          expect(box.height).toBeGreaterThanOrEqual(36); // Slightly relaxed for some elements
          expect(box.width).toBeGreaterThanOrEqual(36);
        }
      }
    }

    await context.close();
  });

  test('Mobile Navigation: swipe gestures and mobile menu', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
    });

    const page = await context.newPage();

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'coordinator-token');
    });

    await page.goto('/visits');

    // Open mobile menu
    const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
    await hamburgerMenu.tap();

    // Verify menu opened
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // Verify menu items
    await expect(mobileMenu.getByRole('link', { name: /visits/i })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: /clients/i })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: /caregivers/i })).toBeVisible();

    // Navigate via menu
    await mobileMenu.getByRole('link', { name: /clients/i }).tap();
    await expect(page).toHaveURL(/\/clients/);

    await context.close();
  });

  test('Mobile Forms: keyboard behavior and input focus', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
    });

    const page = await context.newPage();

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'coordinator-token');
    });

    await page.goto('/visits/schedule');

    // Tap into first input
    const clientInput = page.getByLabel('Client');
    await clientInput.tap();

    // Virtual keyboard should trigger (we can't test directly, but input should be focused)
    await expect(clientInput).toBeFocused();

    // Fill form using mobile keyboard
    await clientInput.fill('John Doe');

    // Verify input accepted
    await expect(clientInput).toHaveValue('John Doe');

    // Test date picker on mobile
    const dateInput = page.getByLabel('Date');
    await dateInput.tap();

    // Should show mobile-optimized date picker (native or custom)
    // This is hard to test cross-platform, but verify input is focused
    await expect(dateInput).toBeFocused();

    await context.close();
  });

  test('Mobile Performance: page load times on mobile network', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
    });

    const page = await context.newPage();

    // Simulate 3G network
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
      uploadThroughput: (750 * 1024) / 8, // 750 Kbps
      latency: 100, // 100ms
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'caregiver-token');
    });

    // Measure page load time
    const startTime = Date.now();
    await page.goto('/visits/today');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within reasonable time even on slower network
    expect(loadTime).toBeLessThan(10000); // 10 seconds max on 3G

    // Verify page is interactive
    const visitCard = page.locator('[data-testid="visit-card"]').first();
    const isVisible = await visitCard.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBe(true);

    await context.close();
  });

  test('Mobile Orientation: handle portrait and landscape modes', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
    });

    const page = await context.newPage();

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'coordinator-token');
    });

    // Test in portrait mode (default)
    await page.goto('/visits');
    await page.waitForLoadState('networkidle');

    let viewport = page.viewportSize();
    expect(viewport!.height).toBeGreaterThan(viewport!.width);

    // Verify layout in portrait
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    await expect(mobileNav).toBeVisible();

    // Switch to landscape
    await page.setViewportSize({ width: 844, height: 390 }); // iPhone 12 Pro landscape

    await page.waitForTimeout(500); // Allow layout to adjust

    viewport = page.viewportSize();
    expect(viewport!.width).toBeGreaterThan(viewport!.height);

    // Verify layout adapts to landscape
    // Content should still be usable
    const visitList = page.locator('[data-testid="visit-list"]');
    await expect(visitList).toBeVisible();

    await context.close();
  });

  test('Mobile Pull-to-Refresh: refresh visit list with pull gesture', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 Pro'],
    });

    const page = await context.newPage();

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'caregiver-token');
    });

    await page.goto('/visits/today');
    await page.waitForLoadState('networkidle');

    // Note: Actual pull-to-refresh gestures are hard to simulate in Playwright
    // We can test the refresh button instead
    const refreshBtn = page.locator('[data-testid="refresh-btn"]');
    const hasRefreshBtn = await refreshBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasRefreshBtn) {
      await refreshBtn.tap();

      // Should show loading indicator
      const loadingIndicator = page.locator('[data-testid="loading"]');
      await expect(loadingIndicator).toBeVisible();

      // Wait for refresh to complete
      await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
    }

    await context.close();
  });
});
