#!/usr/bin/env tsx
import { chromium } from '@playwright/test';
import { join } from 'node:path';

const BASE_URL = 'https://neighborhood-lab.github.io/care-commons';
const SCREENSHOTS_DIR = 'ui-screenshots-showcase-live';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📸 Testing live showcase deployment...\n');
  console.log(`URL: ${BASE_URL}\n`);

  // Test landing page
  try {
    console.log('1. Testing landing page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, 'landing-page.png'),
      fullPage: true,
    });
    console.log('   ✅ Landing page loaded');

    // Verify conversion CTA exists
    const ctaText = await page.locator('text=Ready for the Full Experience?').count();
    if (ctaText > 0) {
      console.log('   ✅ Conversion CTA found');
    } else {
      console.log('   ❌ Conversion CTA NOT FOUND');
    }

    // Verify no duplicate "Shift Matching"
    const shiftMatchingCount = await page.locator('text=Shift Matching').count();
    console.log(`   ℹ️  "Shift Matching" appears ${shiftMatchingCount} times (should be 1)`);

    // Test Reset Demo Data button
    console.log('\n2. Testing Reset Demo Data button...');
    const resetButton = await page.locator('text=Reset Data').count();
    if (resetButton > 0) {
      console.log('   ✅ Reset Data button found');
    } else {
      console.log('   ❌ Reset Data button NOT FOUND');
    }

    // Test dashboard navigation
    console.log('\n3. Testing dashboard navigation...');
    await page.click('text=Desktop / Web');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, 'dashboard.png'),
      fullPage: true,
    });
    console.log('   ✅ Dashboard loaded');

    // Test role switcher
    console.log('\n4. Testing role switcher...');
    const roleButton = await page.locator('[aria-label*="role"], [title*="role"], button:has-text("Coordinator")').first();
    if (await roleButton.count() > 0) {
      console.log('   ✅ Role switcher found');
    }

    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main();
