#!/usr/bin/env tsx
import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Listen to network requests
  page.on('response', async (response) => {
    if (response.url().includes('/api/analytics')) {
      console.log(`\n📡 ${response.request().method()} ${response.url()}`);
      console.log(`   Status: ${response.status()}`);
      try {
        const body = await response.text();
        console.log(`   Response: ${body.substring(0, 200)}`);
      } catch (e) {
        console.log(`   (couldn't read body)`);
      }
    }
  });

  page.on('console', msg => {
    if (msg.text().includes('error') || msg.text().includes('Error') || msg.text().includes('failed')) {
      console.log('🔴 CONSOLE:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ On login page, clicking Maria Rodriguez...');
  await page.click('text=Maria Rodriguez');
  
  console.log('⏳ Waiting 15 seconds to observe dashboard...');
  await page.waitForTimeout(15000);

  console.log('\n📸 Taking screenshot...');
  await page.screenshot({ path: 'admin-debug.png', fullPage: true });

  await browser.close();
}

main();
