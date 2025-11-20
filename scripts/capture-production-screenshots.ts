#!/usr/bin/env tsx
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] || 'https://care-commons.vercel.app';
const screenshotsDir = process.argv[3] || 'ui-screenshots-production-comprehensive';

// Production personas matching demo cards
const PERSONAS = [
  {
    name: 'Maria Rodriguez',
    role: 'Administrator',
    selector: 'text=Maria Rodriguez',
    folder: '01-administrator',
    routes: [
      { path: '/', name: 'home' },
      { path: '/admin', name: 'admin-dashboard' },
      { path: '/dashboard', name: 'dashboard' },
      { path: '/clients', name: 'clients' },
      { path: '/caregivers', name: 'caregivers' },
      { path: '/visits', name: 'visits' },
      { path: '/scheduling', name: 'scheduling' },
      { path: '/scheduling/calendar', name: 'calendar' },
      { path: '/care-plans', name: 'care-plans' },
      { path: '/tasks', name: 'tasks' },
      { path: '/time-tracking', name: 'time-tracking' },
      { path: '/billing', name: 'billing' },
      { path: '/quality-assurance', name: 'quality-assurance' },
      { path: '/analytics/admin', name: 'analytics' },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    name: 'James Thompson',
    role: 'Care Coordinator',
    selector: 'text=James Thompson',
    folder: '02-coordinator',
    routes: [
      { path: '/', name: 'home' },
      { path: '/dashboard', name: 'dashboard' },
      { path: '/clients', name: 'clients' },
      { path: '/caregivers', name: 'caregivers' },
      { path: '/visits', name: 'visits' },
      { path: '/scheduling', name: 'scheduling' },
      { path: '/scheduling/calendar', name: 'calendar' },
      { path: '/care-plans', name: 'care-plans' },
      { path: '/tasks', name: 'tasks' },
      { path: '/time-tracking', name: 'time-tracking' },
      { path: '/analytics/coordinator', name: 'analytics' },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    name: 'Sarah Chen',
    role: 'Caregiver',
    selector: 'text=Sarah Chen',
    folder: '03-caregiver',
    routes: [
      { path: '/', name: 'home' },
      { path: '/dashboard', name: 'dashboard' },
      { path: '/clients', name: 'clients' },
      { path: '/visits', name: 'visits' },
      { path: '/scheduling', name: 'scheduling' },
      { path: '/tasks', name: 'tasks' },
      { path: '/time-tracking', name: 'time-tracking' },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    name: 'David Williams',
    role: 'RN Clinical',
    selector: 'text=David Williams',
    folder: '04-nurse',
    routes: [
      { path: '/', name: 'home' },
      { path: '/dashboard', name: 'dashboard' },
      { path: '/clients', name: 'clients' },
      { path: '/caregivers', name: 'caregivers' },
      { path: '/visits', name: 'visits' },
      { path: '/care-plans', name: 'care-plans' },
      { path: '/tasks', name: 'tasks' },
      { path: '/quality-assurance', name: 'quality-assurance' },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    name: 'Emily Johnson',
    role: 'Family Member',
    selector: 'text=Emily Johnson',
    folder: '05-family',
    routes: [
      { path: '/', name: 'home' },
      { path: '/family-portal', name: 'family-dashboard' },
      { path: '/family-portal/activity', name: 'activity' },
      { path: '/family-portal/messages', name: 'messages' },
      { path: '/family-portal/notifications', name: 'notifications' },
      { path: '/family-portal/schedule', name: 'schedule' },
      { path: '/family-portal/care-plan', name: 'care-plan' },
      { path: '/family-portal/health-updates', name: 'health-updates' },
      { path: '/family-portal/settings', name: 'settings' },
    ],
  },
] as const;

async function capturePersonaScreenshots(
  page: any,
  persona: typeof PERSONAS[number]
) {
  const personaDir = join(screenshotsDir, persona.folder);
  await mkdir(personaDir, { recursive: true });

  console.log(`\n🔐 Testing persona: ${persona.name} (${persona.role})`);

  // Go to login and click persona card
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  console.log(`   Clicking persona card...`);
  await page.click(persona.selector);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const afterLoginUrl = page.url();
  console.log(`   ✓ Logged in, redirected to: ${afterLoginUrl}`);

  // Capture each route accessible to this persona
  for (const route of persona.routes) {
    try {
      console.log(`   📸 ${route.path}`);
      await page.goto(`${baseUrl}${route.path}`);
      
      // Analytics pages make multiple API calls, need longer timeout
      const timeout = route.path.includes('/analytics') ? 30000 : 10000;
      try {
        await page.waitForLoadState('networkidle', { timeout });
      } catch (e) {
        console.log(`   ⚠️  Timeout waiting for ${route.path}, taking screenshot anyway`);
      }
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: join(personaDir, `${route.name}.png`),
        fullPage: true,
      });
    } catch (error: any) {
      console.error(`   ❌ Failed to capture ${route.path}:`, error.message);
    }
  }

  // Logout for next persona
  try {
    await page.goto(`${baseUrl}/logout`);
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
    console.log('🎭 Capturing screenshots for production personas...\n');
    console.log(`Base URL: ${baseUrl}`);
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
