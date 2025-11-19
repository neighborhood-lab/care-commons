#!/usr/bin/env tsx
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const screenshotsDir = join(process.cwd(), 'ui-deep-dive');

const PERSONAS = [
  {
    name: 'Maria Rodriguez',
    role: 'Administrator',
    folder: '1-administrator',
  },
  {
    name: 'James Thompson',
    role: 'Care Coordinator',
    folder: '2-coordinator',
  },
  {
    name: 'Sarah Chen',
    role: 'Caregiver',
    folder: '3-caregiver',
  },
  {
    name: 'David Williams',
    role: 'RN Clinical',
    folder: '4-nurse',
  },
  {
    name: 'Emily Johnson',
    role: 'Family Member',
    folder: '5-family',
  },
];

async function captureAllScreens(page: any, persona: typeof PERSONAS[number]) {
  const personaDir = join(screenshotsDir, persona.folder);
  await mkdir(personaDir, { recursive: true });

  console.log(`\n📸 Deep dive: ${persona.name} (${persona.role})`);
  
  // Login
  await page.goto('http://localhost:5173/login', { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  await page.click(`text=${persona.name}`);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const landingUrl = page.url();
  console.log(`   Landing: ${landingUrl}`);
  
  // Capture landing page
  await page.screenshot({ 
    path: join(personaDir, '00-landing.png'),
    fullPage: true 
  });

  // Find all navigation links by examining the sidebar
  const navLinks = await page.$$eval('nav a, aside a, [role="navigation"] a', (links: any[]) => 
    links
      .map(link => ({
        text: link.textContent?.trim(),
        href: link.getAttribute('href'),
      }))
      .filter(link => link.href && link.href.startsWith('/'))
  );

  console.log(`   Found ${navLinks.length} nav links`);

  // Visit each unique route
  const visited = new Set<string>();
  visited.add(new URL(landingUrl).pathname);

  for (const link of navLinks) {
    if (!link.href || visited.has(link.href)) continue;
    visited.add(link.href);

    try {
      console.log(`   → ${link.href} (${link.text})`);
      await page.goto(`http://localhost:5173${link.href}`, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const safeName = link.href.replace(/\//g, '-').replace(/^-/, '') || 'home';
      await page.screenshot({
        path: join(personaDir, `${safeName}.png`),
        fullPage: true,
      });
    } catch (error) {
      console.log(`     ⚠️  Failed: ${error.message}`);
    }
  }

  console.log(`   ✓ Complete - ${visited.size} screens captured`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('🔍 Deep diving all personas...\n');

    for (const persona of PERSONAS) {
      await captureAllScreens(page, persona);
      
      // Clear session
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      await page.evaluate(() => sessionStorage.clear());
      await page.waitForTimeout(500);
    }

    console.log('\n✅ Deep dive complete!');
    console.log(`📁 Screenshots: ${screenshotsDir}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();
