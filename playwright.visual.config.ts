import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Visual Regression Tests
 *
 * This config is specifically for visual regression testing against the showcase.
 * It does NOT start a webserver - the showcase server must be running separately.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e/tests',
  testMatch: 'visual-*.spec.ts',

  // Shorter timeouts for visual tests
  timeout: 30000,

  // Run tests in parallel
  fullyParallel: true,

  // CI-specific configuration
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-visual-report', open: 'never' }],
    ['list'],
  ],

  // Snapshot settings
  expect: {
    toHaveScreenshot: {
      // Allow slight differences due to font rendering
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
    },
  },

  // Shared settings for all tests
  use: {
    // Use environment variable for base URL (set by workflow)
    baseURL: process.env['SHOWCASE_URL'] || 'http://localhost:5174/care-commons',

    // No traces/videos for visual tests (just screenshots)
    trace: 'off',
    screenshot: 'off',
    video: 'off',

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Faster timeouts for visual tests
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  // Only chromium for visual tests (consistency)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // NO webServer - showcase server must be running separately
  // This is intentional to avoid starting the full e2e server
});
