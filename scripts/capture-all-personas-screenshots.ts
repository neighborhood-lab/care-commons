#!/usr/bin/env tsx
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const screenshotsDir = join(process.cwd(), 'ui-screenshots-personas');

// All 5 demo personas from Login.tsx
const PERSONAS = [
  {
    name: 'Maria Rodriguez',
    role: 'Administrator',
    selector: 'text=Maria Rodriguez',
    folder: '01-administrator',
  },
  {
    name: 'James Thompson',
    role: 'Care Coordinator',
    selector: 'text=James Thompson',
    folder: '02-coordinator',
  },
  {
    name: 'Sarah Chen',
    role: 'Caregiver',
    selector: 'text=Sarah Chen',
    folder: '03-caregiver',
  },
  {
    name: 'David Williams',
    role: 'RN Clinical',
    selector: 'text=David Williams',
    folder: '04-nurse',
  },
  {
    name: 'Emily Johnson',
    role: 'Family Member',
    selector: 'text=Emily Johnson',
    folder: '05-family',
  },
] as const;

// Common routes to test
const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/clients', name: 'clients' },
  { path: '/caregivers', name: 'caregivers' },
  { path: '/visits', name: 'visits' },
  { path: '/care-plans', name: 'care-plans' },
  { path: '/tasks', name: 'tasks' },
  { path: '/schedule', name: 'schedule' },
  { path: '/medications', name: 'medications' },
  { path: '/incidents', name: 'incidents' },
  { path: '/quality', name: 'quality' },
  { path: '/billing', name: 'billing' },
  { path: '/payroll', name: 'payroll' },
  { path: '/reports', name: 'reports' },
] as const;

async function capturePersonaScreenshots(
  page: any,
  persona: typeof PERSONAS[number]
) {
  const personaDir = join(screenshotsDir, persona.folder);
  await mkdir(personaDir, { recursive: true });

  console.log(`\n🔐 Testing persona: ${persona.name} (${persona.role})`);

  // Go to login and click persona card
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  console.log(`   Clicking persona card...`);
  await page.click(persona.selector);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const afterLoginUrl = page.url();
  console.log(`   ✓ Logged in, redirected to: ${afterLoginUrl}`);

  // Capture each route
  for (const route of ROUTES) {
    try {
      console.log(`   📸 ${route.path}`);
      await page.goto(`http://localhost:5173${route.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: join(personaDir, `${route.name}.png`),
        fullPage: true,
      });
    } catch (error) {
      console.error(`   ❌ Failed to capture ${route.path}:`, error.message);
    }
  }

  // Logout for next persona
  try {
    await page.goto('http://localhost:5173/logout');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log(`   Logout failed, continuing...`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('🎭 Capturing screenshots for all personas...\n');
    console.log(`Screenshots will be saved to: ${screenshotsDir}\n`);

    for (const persona of PERSONAS) {
      await capturePersonaScreenshots(page, persona);
    }

    console.log('\n✅ Complete! All persona screenshots captured.');
    console.log(`📁 View screenshots in: ${screenshotsDir}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

main();
