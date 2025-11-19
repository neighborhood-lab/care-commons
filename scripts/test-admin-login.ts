#!/usr/bin/env tsx
import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  console.log('Clicking Maria Rodriguez (Admin)...');
  await page.click('text=Maria Rodriguez');
  
  // Wait and observe
  await page.waitForTimeout(10000);

  await browser.close();
}

main();
