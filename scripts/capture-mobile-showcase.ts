#!/usr/bin/env tsx
/**
 * Mobile Showcase Screenshot Capture
 * 
 * Captures screenshots of the mobile app integration in showcase.
 * Includes the MobileDemoPage and mobile app simulator.
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const screenshotsDir = join(rootDir, 'ui-screenshots', 'mobile-showcase');

interface ScreenshotConfig {
  name: string;
  url: string;
  viewport: { width: number; height: number };
  waitFor?: string | number;
  scrollTo?: number;
}

const screenshots: ScreenshotConfig[] = [
  // Landing page mobile section
  {
    name: '01-landing-page-mobile-section',
    url: '/care-commons/',
    viewport: { width: 1920, height: 1080 },
    scrollTo: 2000, // Scroll to mobile section
  },
  // Mobile demo page - full view
  {
    name: '02-mobile-demo-page-full',
    url: '/care-commons/mobile',
    viewport: { width: 1920, height: 1080 },
    waitFor: 2000,
  },
  // Mobile demo page - simulator closeup
  {
    name: '03-mobile-demo-simulator',
    url: '/care-commons/mobile',
    viewport: { width: 1200, height: 1400 },
    waitFor: 2000,
  },
  // Mobile demo page - features section
  {
    name: '04-mobile-demo-features',
    url: '/care-commons/mobile',
    viewport: { width: 1920, height: 1080 },
    scrollTo: 800,
  },
  // Mobile demo page - tablet view
  {
    name: '05-mobile-demo-tablet',
    url: '/care-commons/mobile',
    viewport: { width: 768, height: 1024 },
    waitFor: 2000,
  },
  // Mobile demo page - mobile view
  {
    name: '06-mobile-demo-mobile',
    url: '/care-commons/mobile',
    viewport: { width: 375, height: 667 },
    waitFor: 2000,
  },
];

async function captureScreenshots() {
  console.log('🚀 Starting mobile showcase screenshot capture...\n');
  
  await mkdir(screenshotsDir, { recursive: true });
  
  const browser = await chromium.launch({
    headless: true,
  });
  
  const showcaseURL = process.env['SHOWCASE_URL'] || 'http://localhost:5173';
  
  console.log(`📸 Capturing from: ${showcaseURL}`);
  console.log(`💾 Saving to: ${screenshotsDir}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const config of screenshots) {
    try {
      console.log(`  Capturing: ${config.name}`);
      console.log(`    URL: ${config.url}`);
      console.log(`    Viewport: ${config.viewport.width}x${config.viewport.height}`);
      
      const page = await browser.newPage({
        viewport: config.viewport,
      });
      
      const fullURL = `${showcaseURL}${config.url}`;
      await page.goto(fullURL, { 
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // Wait for any specified delay
      if (typeof config.waitFor === 'number') {
        await page.waitForTimeout(config.waitFor);
      }
      
      // Scroll if needed
      if (config.scrollTo) {
        await page.evaluate((y) => window.scrollTo(0, y), config.scrollTo);
        await page.waitForTimeout(500);
      }
      
      // Take screenshot
      const screenshotPath = join(screenshotsDir, `${config.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
      
      console.log(`    ✅ Saved: ${config.name}.png\n`);
      successCount++;
      
      await page.close();
      
    } catch (error) {
      console.error(`    ❌ Failed: ${config.name}`);
      console.error(`    Error: ${error instanceof Error ? error.message : String(error)}\n`);
      failCount++;
    }
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Capture Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Location: ${screenshotsDir}`);
  console.log('='.repeat(50) + '\n');
  
  if (failCount > 0) {
    console.log('⚠️  Some screenshots failed. Check that:');
    console.log('   1. Showcase is running: npm run dev (in showcase/)');
    console.log('   2. Mobile server is running: npm run web (in packages/mobile/)');
    console.log('   3. URLs are accessible\n');
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  captureScreenshots().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { captureScreenshots };
