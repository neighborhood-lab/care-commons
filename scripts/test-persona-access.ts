#!/usr/bin/env tsx
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const screenshotsDir = join(process.cwd(), 'ui-test-personas');

const PERSONAS = [
  { name: 'Maria Rodriguez', role: 'Administrator' },
  { name: 'James Thompson', role: 'Care Coordinator' },
  { name: 'Sarah Chen', role: 'Caregiver' },
  { name: 'David Williams', role: 'RN Clinical' },
  { name: 'Emily Johnson', role: 'Family Member' },
];

async function testPersona(page: any, persona: typeof PERSONAS[number]) {
  console.log(`\n🧪 Testing: ${persona.name} (${persona.role})`);
  
  // Go to login
  await page.goto('http://localhost:5173/login', { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  // Click persona card
  console.log(`   Clicking login card...`);
  await page.click(`text=${persona.name}`);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.log('   ⚠️  Network idle timeout, continuing anyway...');
  });
  await page.waitForTimeout(2000);
  
  // Check where we landed
  const url = page.url();
  console.log(`   ✓ Redirected to: ${url}`);
  
  // Take screenshot of landing page
  const safeName = persona.role.toLowerCase().replace(/\s+/g, '-');
  await mkdir(screenshotsDir, { recursive: true });
  await page.screenshot({ 
    path: join(screenshotsDir, `${safeName}-landing.png`),
    fullPage: true 
  });
  
  // Check for 404 or error
  const bodyText = await page.textContent('body');
  if (bodyText?.includes('404') || bodyText?.includes('Not Found')) {
    console.log(`   ❌ FAILED: Got 404 error`);
    return { success: false, url, error: '404' };
  }
  
  console.log(`   ✅ SUCCESS: Loaded without errors`);
  return { success: true, url };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results: any[] = [];

  try {
    for (const persona of PERSONAS) {
      const result = await testPersona(page, persona);
      results.push({ ...persona, ...result });
      
      // Clear session before next persona
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(() => sessionStorage.clear());
      await page.waitForTimeout(500);
    }

    console.log('\n📊 SUMMARY:\n');
    console.log('WORKING:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  ✅ ${r.role}: ${r.url}`);
    });
    
    console.log('\nBROKEN:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ ${r.role}: ${r.error} at ${r.url}`);
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

main();
