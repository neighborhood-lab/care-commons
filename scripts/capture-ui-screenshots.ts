#!/usr/bin/env tsx
/**
 * UI Screenshot Capture Tool
 *
 * This script captures screenshots of all major UI states across:
 * - Web application (coordinator/admin views)
 * - Showcase (public-facing demo)
 * - Mobile app (caregiver views via responsive emulation)
 *
 * Purpose: Enable AI agents to "see" the UI for better UX/design decisions
 *
 * Usage:
 *   npm run capture:ui              # Capture all UIs
 *   npm run capture:ui -- --web     # Web only
 *   npm run capture:ui -- --mobile  # Mobile only
 *   npm run capture:ui -- --showcase # Showcase only
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const screenshotsDir = join(rootDir, 'ui-screenshots');

interface ScreenshotConfig {
  name: string;
  url: string;
  viewport: { width: number; height: number };
  actions?: (page: Page) => Promise<void>;
  waitFor?: string | number;
}

interface UIState {
  name: string;
  description: string;
  screenshots: ScreenshotConfig[];
}

/**
 * Web Application Screenshots
 * Captures coordinator and admin views
 */
const webUIStates: UIState[] = [
  {
    name: 'authentication',
    description: 'Login and authentication flows',
    screenshots: [
      {
        name: 'login-page',
        url: '/login',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      {
        name: 'login-page-mobile',
        url: '/login',
        viewport: { width: 375, height: 667 }, // iPhone SE
        waitFor: 'networkidle',
      },
    ],
  },
  {
    name: 'dashboard',
    description: 'Main dashboard views',
    screenshots: [
      {
        name: 'coordinator-dashboard',
        url: '/dashboard',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      {
        name: 'coordinator-dashboard-tablet',
        url: '/dashboard',
        viewport: { width: 768, height: 1024 }, // iPad
        waitFor: 'networkidle',
      },
    ],
  },
  {
    name: 'visits',
    description: 'Visit management screens',
    screenshots: [
      {
        name: 'visit-list',
        url: '/visits',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      {
        name: 'schedule-visit',
        url: '/visits/schedule',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      {
        name: 'visit-calendar',
        url: '/visits/calendar',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
    ],
  },
  {
    name: 'clients',
    description: 'Client management screens',
    screenshots: [
      {
        name: 'client-list',
        url: '/clients',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      {
        name: 'client-profile',
        url: '/clients',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
        actions: async (page) => {
          // Try to click first client if available
          const firstClient = page.locator('[data-testid="client-row"]').first();
          if (await firstClient.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstClient.click();
            await page.waitForLoadState('networkidle');
          }
        },
      },
    ],
  },
  {
    name: 'caregivers',
    description: 'Caregiver management screens',
    screenshots: [
      {
        name: 'caregiver-list',
        url: '/caregivers',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
    ],
  },
  {
    name: 'care-plans',
    description: 'Care plan management',
    screenshots: [
      {
        name: 'care-plans-list',
        url: '/care-plans',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
    ],
  },
];

/**
 * Showcase Screenshots
 * Public-facing demo application
 */
const showcaseUIStates: UIState[] = [
  {
    name: 'showcase-home',
    description: 'Showcase landing page',
    screenshots: [
      {
        name: 'landing-desktop',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      {
        name: 'landing-mobile',
        url: '/',
        viewport: { width: 375, height: 667 },
        waitFor: 'networkidle',
      },
    ],
  },
  {
    name: 'showcase-features',
    description: 'Feature showcase screens',
    screenshots: [
      {
        name: 'evv-demo',
        url: '/demo/evv',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      {
        name: 'scheduling-demo',
        url: '/demo/scheduling',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
    ],
  },
];

/**
 * Mobile Application Screenshots
 * Caregiver-facing mobile app (via responsive web)
 */
const mobileUIStates: UIState[] = [
  {
    name: 'mobile-visits',
    description: 'Mobile visit workflows',
    screenshots: [
      {
        name: 'mobile-visit-list',
        url: '/mobile/visits',
        viewport: { width: 375, height: 667 }, // iPhone SE
        waitFor: 'networkidle',
      },
      {
        name: 'mobile-visit-list-android',
        url: '/mobile/visits',
        viewport: { width: 360, height: 640 }, // Android
        waitFor: 'networkidle',
      },
      {
        name: 'mobile-visit-detail',
        url: '/mobile/visits',
        viewport: { width: 375, height: 667 },
        waitFor: 'networkidle',
        actions: async (page) => {
          const firstVisit = page.locator('[data-testid="visit-card"]').first();
          if (await firstVisit.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstVisit.click();
            await page.waitForLoadState('networkidle');
          }
        },
      },
    ],
  },
  {
    name: 'mobile-evv',
    description: 'Mobile EVV check-in/out',
    screenshots: [
      {
        name: 'mobile-clock-in',
        url: '/mobile/evv/clock-in',
        viewport: { width: 375, height: 667 },
        waitFor: 'networkidle',
      },
    ],
  },
];

/**
 * Capture a single screenshot
 */
async function captureScreenshot(
  page: Page,
  config: ScreenshotConfig,
  outputDir: string
): Promise<void> {
  try {
    console.log(`  📸 Capturing: ${config.name}`);

    // Set viewport
    await page.setViewportSize(config.viewport);

    // Navigate to URL
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for specified condition
    if (typeof config.waitFor === 'string') {
      await page.waitForLoadState(config.waitFor as 'networkidle' | 'load' | 'domcontentloaded');
    } else if (typeof config.waitFor === 'number') {
      await page.waitForTimeout(config.waitFor);
    }

    // Wait a bit for any animations
    await page.waitForTimeout(500);

    // Execute custom actions if provided
    if (config.actions) {
      await config.actions(page);
    }

    // Take screenshot
    const screenshotPath = join(outputDir, `${config.name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled',
    });

    console.log(`    ✅ Saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`    ❌ Failed to capture ${config.name}:`, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Capture screenshots for a UI state
 */
async function captureUIState(
  browser: Browser,
  state: UIState,
  baseURL: string,
  outputDir: string
): Promise<void> {
  console.log(`\n🎨 Capturing: ${state.description}`);

  const stateDir = join(outputDir, state.name);
  await mkdir(stateDir, { recursive: true });

  const page = await browser.newPage();

  try {
    for (const screenshot of state.screenshots) {
      await captureScreenshot(
        page,
        { ...screenshot, url: `${baseURL}${screenshot.url}` },
        stateDir
      );
    }
  } finally {
    await page.close();
  }
}

/**
 * Generate metadata file with capture information
 */
async function generateMetadata(outputDir: string, captureInfo: {
  timestamp: string;
  webURL: string;
  showcaseURL: string;
  capturedStates: string[];
}): Promise<void> {
  const metadata = {
    ...captureInfo,
    purpose: 'UI screenshots for AI agent visibility and UX decision making',
    format: 'PNG with full page capture',
    viewports: {
      desktop: '1920x1080',
      tablet: '768x1024 (iPad)',
      mobile: '375x667 (iPhone SE), 360x640 (Android)',
    },
    usage: 'Reference these screenshots when making UX/design decisions',
  };

  const metadataPath = join(outputDir, 'metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n📋 Metadata saved: ${metadataPath}`);
}

/**
 * Generate README for screenshots directory
 */
async function generateReadme(outputDir: string): Promise<void> {
  const readme = `# UI Screenshots

This directory contains screenshots of all major UI states for the Care Commons platform.

## Purpose

These screenshots enable AI agents to "see" the user interface and make better UX and design decisions.

## Structure

\`\`\`
ui-screenshots/
├── metadata.json           # Capture metadata
├── web/                    # Web application screenshots
│   ├── authentication/
│   ├── dashboard/
│   ├── visits/
│   ├── clients/
│   ├── caregivers/
│   └── care-plans/
├── showcase/              # Showcase application screenshots
│   ├── showcase-home/
│   └── showcase-features/
└── mobile/                # Mobile application screenshots
    ├── mobile-visits/
    └── mobile-evv/
\`\`\`

## Viewports

- **Desktop**: 1920x1080
- **Tablet**: 768x1024 (iPad)
- **Mobile**: 375x667 (iPhone SE), 360x640 (Android)

## Regenerating Screenshots

\`\`\`bash
npm run capture:ui              # All UIs
npm run capture:ui -- --web     # Web only
npm run capture:ui -- --showcase # Showcase only
npm run capture:ui -- --mobile  # Mobile only
\`\`\`

## Last Updated

Check \`metadata.json\` for the last capture timestamp.

---

**Care Commons** - Shared care software, community owned
`;

  const readmePath = join(outputDir, 'README.md');
  await writeFile(readmePath, readme);
  console.log(`📄 README saved: ${readmePath}`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const captureWeb = args.includes('--web') || args.length === 0;
  const captureShowcase = args.includes('--showcase') || args.length === 0;
  const captureMobile = args.includes('--mobile') || args.length === 0;

  console.log('🚀 UI Screenshot Capture Tool\n');
  console.log('Target UIs:');
  if (captureWeb) console.log('  ✅ Web Application');
  if (captureShowcase) console.log('  ✅ Showcase');
  if (captureMobile) console.log('  ✅ Mobile');

  // Create screenshots directory
  await mkdir(screenshotsDir, { recursive: true });

  // Launch browser
  console.log('\n🌐 Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const capturedStates: string[] = [];

  try {
    // Web application
    if (captureWeb) {
      const webURL = process.env['WEB_URL'] || 'http://localhost:3000';
      const webDir = join(screenshotsDir, 'web');
      await mkdir(webDir, { recursive: true });

      console.log(`\n📱 Web Application (${webURL})`);
      for (const state of webUIStates) {
        await captureUIState(browser, state, webURL, webDir);
        capturedStates.push(`web/${state.name}`);
      }
    }

    // Showcase
    if (captureShowcase) {
      const showcaseURL = process.env['SHOWCASE_URL'] || 'http://localhost:5173';
      const showcaseDir = join(screenshotsDir, 'showcase');
      await mkdir(showcaseDir, { recursive: true });

      console.log(`\n🎭 Showcase (${showcaseURL})`);
      for (const state of showcaseUIStates) {
        await captureUIState(browser, state, showcaseURL, showcaseDir);
        capturedStates.push(`showcase/${state.name}`);
      }
    }

    // Mobile (via web responsive)
    if (captureMobile) {
      const webURL = process.env['WEB_URL'] || 'http://localhost:3000';
      const mobileDir = join(screenshotsDir, 'mobile');
      await mkdir(mobileDir, { recursive: true });

      console.log(`\n📱 Mobile Views (${webURL})`);
      for (const state of mobileUIStates) {
        await captureUIState(browser, state, webURL, mobileDir);
        capturedStates.push(`mobile/${state.name}`);
      }
    }

    // Generate metadata
    await generateMetadata(screenshotsDir, {
      timestamp: new Date().toISOString(),
      webURL: process.env['WEB_URL'] || 'http://localhost:3000',
      showcaseURL: process.env['SHOWCASE_URL'] || 'http://localhost:5173',
      capturedStates,
    });

    // Generate README
    await generateReadme(screenshotsDir);

    console.log('\n✨ Screenshot capture complete!');
    console.log(`📂 Saved to: ${screenshotsDir}`);
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main as captureUIScreenshots };
