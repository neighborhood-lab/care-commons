import { test, expect } from '@playwright/test';
import { configurePageForScreenshot, waitForUIStable, Viewports } from '../utils/visual-regression.js';

/**
 * Visual Regression Tests for Showcase
 *
 * These tests capture screenshots of all showcase pages and compare them
 * against baselines to detect unintended UI changes.
 *
 * Usage:
 *   npm run test:visual              # Run visual tests
 *   npm run test:visual:update       # Update baselines
 *
 * Baselines are stored in e2e/tests/visual-showcase.spec.ts-snapshots/
 */

// Showcase routes - mirrors scripts/capture-screenshots.ts
const SHOWCASE_PAGES = [
  { path: '/', name: 'landing-page' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/clients', name: 'clients' },
  { path: '/care-plans', name: 'care-plans' },
  { path: '/tasks', name: 'tasks' },
  { path: '/caregivers', name: 'caregivers' },
  { path: '/scheduling', name: 'scheduling' },
  { path: '/shifts', name: 'shift-matching' },
  { path: '/evv', name: 'evv' },
  { path: '/payroll', name: 'payroll' },
  { path: '/billing', name: 'billing' },
  { path: '/analytics', name: 'analytics' },
  { path: '/quality', name: 'quality-assurance' },
  { path: '/family-portal', name: 'family-portal' },
  { path: '/tours', name: 'tours' },
  { path: '/states', name: 'state-demo' },
  // Mobile simulator pages
  { path: '/mobile', name: 'mobile-demo' },
  { path: '/mobile/visits', name: 'mobile-visits' },
  { path: '/mobile/tasks', name: 'mobile-tasks' },
  { path: '/mobile/profile', name: 'mobile-profile' },
  { path: '/mobile/clients', name: 'mobile-clients' },
  { path: '/mobile/care-plans', name: 'mobile-care-plans' },
] as const;

// GitHub Pages showcase URL (or local dev server)
const SHOWCASE_BASE_URL = process.env['SHOWCASE_URL'] || 'http://localhost:5174/folkcare';

test.describe('Visual Regression: Showcase', () => {
  test.beforeEach(async ({ page }) => {
    // Configure page for consistent screenshots
    await configurePageForScreenshot(page);
  });

  // Generate a test for each showcase page
  for (const { path, name } of SHOWCASE_PAGES) {
    test(`${name} should match baseline`, async ({ page }) => {
      const url = `${SHOWCASE_BASE_URL}${path}`;

      await page.goto(url, { waitUntil: 'networkidle' });
      await waitForUIStable(page);

      // Use Playwright's built-in screenshot comparison
      // On first run, this creates the baseline
      // On subsequent runs, it compares against the baseline
      await expect(page).toHaveScreenshot(`showcase-${name}.png`, {
        maxDiffPixelRatio: 0.02, // Allow 2% pixel difference
        threshold: 0.2, // Color difference threshold
        animations: 'disabled',
        fullPage: false, // Viewport only (avoid very tall screenshots)
      });
    });
  }
});

test.describe('Visual Regression: Showcase Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await configurePageForScreenshot(page);
  });

  // Test key pages at mobile viewport
  const RESPONSIVE_PAGES = [
    { path: '/', name: 'landing-page' },
    { path: '/dashboard', name: 'dashboard' },
    { path: '/clients', name: 'clients' },
  ];

  for (const { path, name } of RESPONSIVE_PAGES) {
    test(`${name} should match baseline at mobile viewport`, async ({ page }) => {
      await page.setViewportSize(Viewports.MOBILE_IPHONE);

      const url = `${SHOWCASE_BASE_URL}${path}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await waitForUIStable(page);

      await expect(page).toHaveScreenshot(`showcase-mobile-${name}.png`, {
        maxDiffPixelRatio: 0.02,
        threshold: 0.2,
        animations: 'disabled',
        fullPage: false,
      });
    });
  }
});
