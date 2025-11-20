#!/usr/bin/env tsx
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const baseUrl = 'http://localhost:5174/care-commons';
const screenshotsDir = 'ui-screenshots-showcase-comprehensive';

const PAGES = [
  { path: '/', name: 'landing' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/clients', name: 'clients' },
  { path: '/care-plans', name: 'care-plans' },
  { path: '/tasks', name: 'tasks' },
  { path: '/caregivers', name: 'caregivers' },
  { path: '/scheduling', name: 'scheduling' },
  { path: '/shifts', name: 'shift-matching' },
  { path: '/evv', name: 'evv' },
  { path: '/payroll', name: 'payroll' },
  { path: '/billing', name: 'billing' },
  { path: '/analytics', name: 'analytics' },
  { path: '/quality', name: 'quality-assurance' },
  { path: '/family-portal', name: 'family-portal' },
  { path: '/tours', name: 'tours' },
  { path: '/videos', name: 'videos' },
  { path: '/states', name: 'states' },
  { path: '/mobile', name: 'mobile-home' },
  { path: '/mobile/visits', name: 'mobile-visits' },
  { path: '/mobile/tasks', name: 'mobile-tasks' },
  { path: '/mobile/clients', name: 'mobile-clients' },
  { path: '/mobile/care-plans', name: 'mobile-care-plans' },
  { path: '/mobile/profile', name: 'mobile-profile' },
] as const;

async function main() {
  await mkdir(screenshotsDir, { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('📸 Capturing showcase screenshots...\n');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Screenshots: ${screenshotsDir}\n`);

  for (const route of PAGES) {
    try {
      console.log(`   📸 ${route.path}`);
      await page.goto(`${baseUrl}${route.path}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: join(screenshotsDir, `${route.name}.png`),
        fullPage: true,
      });
    } catch (error: any) {
      console.error(`   ❌ Failed ${route.path}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n✅ Showcase screenshots complete!');
}

main();
