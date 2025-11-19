/**
 * Visual Regression Testing Utilities
 *
 * Provides helpers for visual regression testing using Playwright's
 * built-in screenshot comparison capabilities.
 *
 * Purpose: Enable AI agents to detect UI changes and regressions
 */

import { expect, type Page, type Locator } from '@playwright/test';
import { join } from 'node:path';

export interface VisualCompareOptions {
  /**
   * Maximum allowed pixel difference ratio (0-1)
   * Default: 0.01 (1% difference allowed)
   */
  maxDiffPixelRatio?: number;

  /**
   * Threshold for pixel color difference (0-1)
   * Default: 0.1
   */
  threshold?: number;

  /**
   * Mask elements that may change between runs
   */
  mask?: Locator[];

  /**
   * Full page screenshot
   */
  fullPage?: boolean;

  /**
   * Custom screenshot name
   */
  name?: string;
}

/**
 * Compare page screenshot against baseline
 */
export async function comparePageSnapshot(
  page: Page,
  snapshotName: string,
  options: VisualCompareOptions = {}
): Promise<void> {
  const {
    maxDiffPixelRatio = 0.01,
    threshold = 0.1,
    mask = [],
    fullPage = false,
  } = options;

  await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
    maxDiffPixelRatio,
    threshold,
    mask,
    fullPage,
    animations: 'disabled',
  });
}

/**
 * Compare element screenshot against baseline
 */
export async function compareElementSnapshot(
  element: Locator,
  snapshotName: string,
  options: Omit<VisualCompareOptions, 'fullPage'> = {}
): Promise<void> {
  const {
    maxDiffPixelRatio = 0.01,
    threshold = 0.1,
    mask = [],
  } = options;

  await expect(element).toHaveScreenshot(`${snapshotName}.png`, {
    maxDiffPixelRatio,
    threshold,
    mask,
    animations: 'disabled',
  });
}

/**
 * Capture baseline screenshots for a page
 * Used to establish initial "golden" screenshots
 */
export async function captureBaseline(
  page: Page,
  name: string,
  fullPage: boolean = true
): Promise<void> {
  await page.screenshot({
    path: join('e2e', 'baselines', `${name}.png`),
    fullPage,
    animations: 'disabled',
  });
}

/**
 * Common UI states to capture for visual regression
 */
export const UIStates = {
  // Authentication
  LOGIN_PAGE: 'auth-login-page',
  LOGIN_ERROR: 'auth-login-error',

  // Dashboard
  COORDINATOR_DASHBOARD: 'dashboard-coordinator',
  ADMIN_DASHBOARD: 'dashboard-admin',
  CAREGIVER_DASHBOARD: 'dashboard-caregiver',

  // Visits
  VISIT_LIST: 'visits-list',
  VISIT_DETAIL: 'visits-detail',
  VISIT_SCHEDULE_FORM: 'visits-schedule-form',
  VISIT_CALENDAR: 'visits-calendar',

  // Clients
  CLIENT_LIST: 'clients-list',
  CLIENT_PROFILE: 'clients-profile',
  CLIENT_FORM: 'clients-form',

  // Caregivers
  CAREGIVER_LIST: 'caregivers-list',
  CAREGIVER_PROFILE: 'caregivers-profile',

  // Care Plans
  CARE_PLAN_LIST: 'care-plans-list',
  CARE_PLAN_DETAIL: 'care-plans-detail',

  // EVV
  EVV_CLOCK_IN: 'evv-clock-in',
  EVV_CLOCK_OUT: 'evv-clock-out',
  EVV_VERIFICATION: 'evv-verification',

  // Mobile
  MOBILE_VISIT_LIST: 'mobile-visits-list',
  MOBILE_VISIT_DETAIL: 'mobile-visits-detail',
  MOBILE_EVV_CHECKIN: 'mobile-evv-checkin',
} as const;

/**
 * Viewport configurations for responsive testing
 */
export const Viewports = {
  DESKTOP: { width: 1920, height: 1080 },
  LAPTOP: { width: 1366, height: 768 },
  TABLET: { width: 768, height: 1024 },
  MOBILE_IPHONE: { width: 375, height: 667 },
  MOBILE_ANDROID: { width: 360, height: 640 },
  MOBILE_LARGE: { width: 414, height: 896 },
} as const;

/**
 * Wait for UI to stabilize before screenshot
 */
export async function waitForUIStable(page: Page): Promise<void> {
  // Wait for network idle
  await page.waitForLoadState('networkidle');

  // Wait for any loading spinners to disappear
  const spinner = page.locator('[data-testid="loading-spinner"], .loading, .spinner');
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Ignore if spinner doesn't exist
    });
  }

  // Wait for animations to complete
  await page.waitForTimeout(500);
}

/**
 * Mask dynamic content that changes between runs
 */
export function getCommonMasks(page: Page): Locator[] {
  return [
    // Timestamps
    page.locator('[data-testid="timestamp"]'),
    page.locator('.timestamp'),

    // Avatars (may have dynamic images)
    page.locator('[data-testid="avatar"]'),

    // Live data indicators
    page.locator('[data-testid="live-indicator"]'),

    // Real-time metrics
    page.locator('[data-testid="metric-value"]'),
  ];
}

/**
 * Configure page for consistent screenshots
 */
export async function configurePageForScreenshot(page: Page): Promise<void> {
  // Disable animations
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });

  // Hide scroll bars
  await page.addStyleTag({
    content: `
      ::-webkit-scrollbar {
        display: none;
      }
      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
    `,
  });
}
