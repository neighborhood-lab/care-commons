import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Care Commons E2E Testing
 *
 * This configuration provides comprehensive E2E testing for critical workflows
 * including visit management, EVV compliance, and state-specific validations.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory structure
  testDir: './e2e/tests',

  // Timeout for each test (2 minutes)
  timeout: 120000,

  // Global test setup/teardown
  globalSetup: './e2e/setup/global-setup.ts',
  globalTeardown: './e2e/setup/global-teardown.ts',

  // Run tests in parallel (faster execution)
  fullyParallel: true,

  // CI-specific configuration
  forbidOnly: !!process.env['CI'], // Fail if test.only() left in code
  retries: process.env['CI'] ? 2 : 0, // Retry failed tests in CI
  workers: process.env['CI'] ? 2 : undefined, // Limit workers in CI

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['junit', { outputFile: 'e2e-results.xml' }],
    ['list'], // Console reporter for development
  ],

  // Shared settings for all tests
  use: {
    // Base URL for the application
    baseURL: process.env['E2E_BASE_URL'] || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure only
    screenshot: 'only-on-failure',

    // Video recording on failure only (saves space)
    video: 'retain-on-failure',

    // Emulate timezone
    timezoneId: 'America/New_York',

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,

    // Default timeout for actions (30 seconds)
    actionTimeout: 30000,

    // Default timeout for navigation (60 seconds)
    navigationTimeout: 60000,
  },

  // Project configurations for different browsers and viewports
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile viewports (critical for caregiver app)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    // Tablet viewports (coordinator workflows)
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  // Web server configuration (start dev server before tests)
  webServer: {
    command: 'npm run dev:server',
    port: 3000,
    timeout: 120000, // 2 minutes to start server
    reuseExistingServer: !process.env['CI'], // Reuse server in development
    stdout: 'pipe', // Capture server logs
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env['E2E_DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/care_commons_e2e_test',
      PORT: '3000',
      // JWT secrets for authentication (must be set in CI/local environment)
      JWT_SECRET: process.env['JWT_SECRET'] || 'test-jwt-secret-minimum-32-characters-required-for-security',
      JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || 'test-jwt-refresh-secret-minimum-32-characters-required',
    },
  },
});
