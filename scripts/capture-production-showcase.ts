#!/usr/bin/env tsx
/**
 * Production Showcase Screenshot Capture
 * 
 * Captures screenshots of the deployed showcase on GitHub Pages.
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const screenshotsDir = join(rootDir, 'ui-screenshots', 'production-showcase');

const showcaseURL = 'https://neighborhood-lab.github.io/care-commons';

const pages = [
  { name: '01-landing-page', path: '/', scroll: 0 },
  { name: '02-landing-mobile-section', path: '/', scroll: 2500 },
  { name: '03-dashboard', path: '/dashboard', scroll: 0 },
  { name: '04-clients', path: '/clients', scroll: 0 },
  { name: '05-caregivers', path: '/caregivers', scroll: 0 },
  { name: '06-care-plans', path: '/care-plans', scroll: 0 },
  { name: '07-scheduling', path: '/scheduling', scroll: 0 },
  { name: '08-evv', path: '/evv', scroll: 0 },
  { name: '09-analytics', path: '/analytics', scroll: 0 },
  { name: '10-mobile-demo', path: '/mobile', scroll: 0 },
  { name: '11-mobile-demo-features', path: '/mobile', scroll: 800 },
];

async function captureScreenshots() {
  console.log('📸 Capturing Production Showcase Screenshots\n');
  console.log(`URL: ${showcaseURL}\n`);
  
  await mkdir(screenshotsDir, { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  
  let successCount = 0;
  let failCount = 0;
  
  for (const page of pages) {
    try {
      console.log(`  Capturing: ${page.name}`);
      
      const browserPage = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
      });
      
      const fullURL = `${showcaseURL}${page.path}`;
      await browserPage.goto(fullURL, { 
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      if (page.scroll > 0) {
        await browserPage.evaluate((y) => window.scrollTo(0, y), page.scroll);
        await browserPage.waitForTimeout(500);
      }
      
      const screenshotPath = join(screenshotsDir, `${page.name}.png`);
      await browserPage.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
      
      console.log(`    ✅ ${page.name}.png\n`);
      successCount++;
      
      await browserPage.close();
      
    } catch (error) {
      console.error(`    ❌ Failed: ${page.name}`);
      console.error(`    ${error instanceof Error ? error.message : String(error)}\n`);
      failCount++;
    }
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 ${screenshotsDir}`);
  console.log('='.repeat(50) + '\n');
}

captureScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
