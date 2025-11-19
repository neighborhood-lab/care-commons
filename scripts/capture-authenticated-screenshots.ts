#!/usr/bin/env tsx
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const screenshotsDir = join(process.cwd(), 'ui-screenshots-authenticated');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('🔐 Logging in as Sarah Chen...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.click('text=Sarah Chen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await mkdir(screenshotsDir, { recursive: true });

    const currentUrl = page.url();
    console.log('📍 Current page:', currentUrl);
    console.log('📸 Capturing:', currentUrl);
    await page.screenshot({ path: join(screenshotsDir, 'after-login.png'), fullPage: true });

    const routes = ['/visits', '/clients', '/caregivers', '/care-plans', '/dashboard'];
    for (const route of routes) {
      console.log(`📸 Capturing: ${route}`);
      await page.goto(`http://localhost:5173${route}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: join(screenshotsDir, `${route.slice(1) || 'dashboard'}.png`),
        fullPage: true 
      });
    }

    console.log('✅ Done! Screenshots in:', screenshotsDir);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();
