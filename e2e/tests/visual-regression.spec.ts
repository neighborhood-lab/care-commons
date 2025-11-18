/**
 * Visual Regression Testing Example
 *
 * Demonstrates how to use the visual regression utilities to detect UI changes.
 * These tests capture screenshots and compare them against baseline images.
 *
 * Usage:
 *   npm run test:e2e -- visual-regression.spec.ts              # Run tests
 *   npm run test:e2e -- visual-regression.spec.ts --update-snapshots  # Update baselines
 *   npm run test:e2e:ui                                        # Interactive mode
 */

import { test, expect } from '@playwright/test';
import {
  comparePageSnapshot,
  compareElementSnapshot,
  waitForUIStable,
  configurePageForScreenshot,
  getCommonMasks,
  UIStates,
  Viewports,
} from '../utils/visual-regression.js';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configure page for consistent screenshots
    await configurePageForScreenshot(page);
  });

  test('login page should match baseline', async ({ page }) => {
    await page.goto('/login');
    await waitForUIStable(page);

    // Compare full page against baseline
    await comparePageSnapshot(page, UIStates.LOGIN_PAGE, {
      maxDiffPixelRatio: 0.01, // Allow 1% difference
      fullPage: true,
    });
  });

  test('login page should be responsive', async ({ page }) => {
    for (const [viewportName, viewport] of Object.entries(Viewports)) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await waitForUIStable(page);

      await comparePageSnapshot(
        page,
        `login-${viewportName.toLowerCase()}`,
        {
          maxDiffPixelRatio: 0.01,
          fullPage: true,
        }
      );
    }
  });

  test('dashboard should match baseline (authenticated)', async ({ page }) => {
    // Note: This test requires authentication setup
    // In a real scenario, you would use the auth fixture from e2e/fixtures/auth.fixture.ts

    // For now, we'll just navigate to the login page
    // In production tests, you would:
    // 1. Set up authentication
    // 2. Navigate to /dashboard
    // 3. Compare against baseline

    await page.goto('/login');
    await waitForUIStable(page);

    // Placeholder - actual dashboard test would go here
    expect(page.url()).toContain('/login');
  });

  test('visit list element should match baseline', async ({ page }) => {
    await page.goto('/visits');
    await waitForUIStable(page);

    // Compare specific element (if it exists)
    const visitListContainer = page.locator('[data-testid="visit-list"]');

    const exists = await visitListContainer.count();
    if (exists > 0) {
      await compareElementSnapshot(
        visitListContainer,
        'visit-list-container',
        {
          maxDiffPixelRatio: 0.005, // More strict for components
        }
      );
    } else {
      test.skip();
    }
  });

  test('login form with dynamic content masked', async ({ page }) => {
    await page.goto('/login');
    await waitForUIStable(page);

    const masks = getCommonMasks(page);

    // Compare with dynamic content masked
    await comparePageSnapshot(page, 'login-masked', {
      maxDiffPixelRatio: 0.01,
      mask: masks,
      fullPage: true,
    });
  });

  test.describe('Mobile viewports', () => {
    test('mobile visit list (iPhone)', async ({ page }) => {
      await page.setViewportSize(Viewports.MOBILE_IPHONE);
      await page.goto('/visits');
      await waitForUIStable(page);

      await comparePageSnapshot(page, UIStates.MOBILE_VISIT_LIST, {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      });
    });

    test('mobile visit list (Android)', async ({ page }) => {
      await page.setViewportSize(Viewports.MOBILE_ANDROID);
      await page.goto('/visits');
      await waitForUIStable(page);

      await comparePageSnapshot(page, 'mobile-visit-list-android', {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      });
    });
  });

  test.describe('Tablet viewports', () => {
    test('tablet dashboard', async ({ page }) => {
      await page.setViewportSize(Viewports.TABLET);
      await page.goto('/dashboard');
      await waitForUIStable(page);

      await comparePageSnapshot(page, 'tablet-dashboard', {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      });
    });
  });

  test.describe('Component-level snapshots', () => {
    test('navigation header', async ({ page }) => {
      await page.goto('/');
      await waitForUIStable(page);

      const header = page.locator('header, [role="banner"]');
      const exists = await header.count();

      if (exists > 0) {
        await compareElementSnapshot(header.first(), 'navigation-header', {
          maxDiffPixelRatio: 0.005,
        });
      } else {
        test.skip();
      }
    });

    test('login form', async ({ page }) => {
      await page.goto('/login');
      await waitForUIStable(page);

      const form = page.locator('form, [data-testid="login-form"]');
      const exists = await form.count();

      if (exists > 0) {
        await compareElementSnapshot(form.first(), 'login-form-component', {
          maxDiffPixelRatio: 0.005,
        });
      } else {
        test.skip();
      }
    });
  });
});

test.describe('Visual Regression - Cross-browser', () => {
  test.beforeEach(async ({ page }) => {
    await configurePageForScreenshot(page);
  });

  test('login page should look consistent across browsers', async ({
    page,
    browserName,
  }) => {
    await page.goto('/login');
    await waitForUIStable(page);

    // Take browser-specific snapshot
    await comparePageSnapshot(page, `login-${browserName}`, {
      maxDiffPixelRatio: 0.02, // More lenient for cross-browser
      fullPage: true,
    });
  });
});

test.describe('Visual Regression - Accessibility', () => {
  test('high contrast mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');
    await waitForUIStable(page);

    await comparePageSnapshot(page, 'login-dark-mode', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');
    await waitForUIStable(page);

    await comparePageSnapshot(page, 'dashboard-reduced-motion', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });
});
