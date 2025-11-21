#!/usr/bin/env tsx
/**
 * Comprehensive Screenshot Capture Tool
 * 
 * Captures screenshots for ALL scenarios:
 * - All 5 demo personas (admin, coordinator, caregiver, nurse, family)
 * - All accessible pages per persona
 * - Local development (http://localhost:5173) or Production
 * - Web app, Mobile app showcase, Marketing showcase
 * 
 * Usage:
 *   npm run screenshots                    # Local web app, all personas
 *   npm run screenshots -- --env production  # Production web app
 *   npm run screenshots -- --mobile        # Local mobile showcase
 *   npm run screenshots -- --showcase      # Local marketing showcase
 *   npm run screenshots -- --all           # Everything (web + mobile + showcase)
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface ScreenshotConfig {
  env: 'local' | 'production';
  target: 'web' | 'mobile' | 'showcase' | 'all';
  outputDir: string;
  headless: boolean;
}

interface Persona {
  email: string;
  password: string;
  name: string;
  role: string;
  description: string;
  folder: string;
  routes: Route[];
}

interface Route {
  path: string;
  name: string;
  timeout?: number;
}

// All 5 demo personas (Texas-based, created by seed-demo.ts)
const PERSONAS: Persona[] = [
  {
    email: 'admin@tx.carecommons.example',
    password: 'Demo123!',
    name: 'Maria Rodriguez',
    role: 'Administrator',
    description: 'Full system access',
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
      { path: '/analytics/admin', name: 'analytics', timeout: 20000 },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    email: 'coordinator@tx.carecommons.example',
    password: 'Demo123!',
    name: 'James Thompson',
    role: 'Care Coordinator',
    description: 'Schedule visits, assign caregivers',
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
      { path: '/analytics/coordinator', name: 'analytics', timeout: 20000 },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    email: 'caregiver@tx.carecommons.example',
    password: 'Demo123!',
    name: 'Sarah Chen',
    role: 'Caregiver',
    description: 'Clock in/out, document visits',
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
    email: 'nurse@tx.carecommons.example',
    password: 'Demo123!',
    name: 'David Williams',
    role: 'RN Clinical',
    description: 'Clinical assessments, oversight',
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
    email: 'family@tx.carecommons.example',
    password: 'Demo123!',
    name: 'Emily Johnson',
    role: 'Family Member',
    description: 'View care updates, message caregivers',
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
];

// ============================================================================
// UTILITIES
// ============================================================================

function getBaseUrl(env: 'local' | 'production', target: string): string {
  if (target === 'mobile') {
    return env === 'production' 
      ? 'https://care-commons.vercel.app/mobile' 
      : 'http://localhost:5173/mobile';
  }
  if (target === 'showcase') {
    return env === 'production'
      ? 'https://care-commons.vercel.app'
      : 'http://localhost:5174'; // Showcase runs on different port
  }
  // Web app
  return env === 'production' 
    ? 'https://care-commons.vercel.app' 
    : 'http://localhost:5173';
}

async function loginWithPersona(
  page: Page,
  persona: Persona,
  baseUrl: string
): Promise<void> {
  console.log(`   Logging in as ${persona.name}...`);
  
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Look for persona button by name (the buttons have the persona names in them)
  const personaButton = page.locator(`button:has-text("${persona.name}")`).first();
  const hasPersonaButton = await personaButton.count() > 0;
  
  if (hasPersonaButton) {
    // Click the persona card
    await personaButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`   ✓ Logged in, redirected to: ${currentUrl}`);
  } else {
    // Fallback: try traditional email/password form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const hasEmailInput = await emailInput.count() > 0;
    
    if (hasEmailInput) {
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await emailInput.fill(persona.email);
      await passwordInput.fill(persona.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(2000);
      console.log(`   ✓ Logged in via email form`);
    } else {
      throw new Error(`Could not find login method for ${persona.name}`);
    }
  }
}

async function captureScreenshot(
  page: Page,
  path: string,
  name: string
): Promise<void> {
  await mkdir(path, { recursive: true });
  const filename = join(path, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
}

// ============================================================================
// PERSONA SCREENSHOTS
// ============================================================================

async function capturePersonaScreenshots(
  browser: Browser,
  persona: Persona,
  config: ScreenshotConfig
): Promise<void> {
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  const baseUrl = getBaseUrl(config.env, 'web');
  const personaDir = join(config.outputDir, 'web', persona.folder);
  
  console.log(`\n🔐 ${persona.name} (${persona.role})`);
  
  try {
    // Login
    await loginWithPersona(page, persona, baseUrl);
    
    // Capture each route
    for (const route of persona.routes) {
      try {
        console.log(`   📸 ${route.path}`);
        await page.goto(`${baseUrl}${route.path}`);
        
        const timeout = route.timeout || 10000;
        await page.waitForLoadState('networkidle', { timeout });
        await page.waitForTimeout(1000);
        
        await captureScreenshot(page, personaDir, route.name);
      } catch (error: any) {
        console.error(`   ❌ Failed ${route.path}: ${error.message}`);
      }
    }
    
    // Logout
    try {
      await page.goto(`${baseUrl}/logout`);
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Logout might not exist, that's OK
    }
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
  } finally {
    await context.close();
  }
}

// ============================================================================
// MOBILE APP SCREENSHOTS
// ============================================================================

async function captureMobileScreenshots(
  browser: Browser,
  config: ScreenshotConfig
): Promise<void> {
  console.log('\n📱 Mobile App Showcase');
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X/11/12/13/14 size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  const page = await context.newPage();
  
  const baseUrl = getBaseUrl(config.env, 'mobile');
  const mobileDir = join(config.outputDir, 'mobile');
  
  const routes = [
    { path: '/', name: 'home' },
    { path: '/visits', name: 'visits' },
    { path: '/clock-in', name: 'clock-in' },
    { path: '/clients', name: 'clients' },
    { path: '/tasks', name: 'tasks' },
  ];
  
  try {
    for (const route of routes) {
      console.log(`   📸 ${route.path}`);
      await page.goto(`${baseUrl}${route.path}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await captureScreenshot(page, mobileDir, route.name);
    }
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
  } finally {
    await context.close();
  }
}

// ============================================================================
// SHOWCASE SCREENSHOTS
// ============================================================================

async function captureShowcaseScreenshots(
  browser: Browser,
  config: ScreenshotConfig
): Promise<void> {
  console.log('\n🎨 Marketing Showcase');
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 } 
  });
  const page = await context.newPage();
  
  const baseUrl = getBaseUrl(config.env, 'showcase');
  const showcaseDir = join(config.outputDir, 'showcase');
  
  const routes = [
    { path: '/', name: 'home' },
    { path: '/features', name: 'features' },
    { path: '/pricing', name: 'pricing' },
    { path: '/demo', name: 'demo' },
  ];
  
  try {
    for (const route of routes) {
      console.log(`   📸 ${route.path}`);
      await page.goto(`${baseUrl}${route.path}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await captureScreenshot(page, showcaseDir, route.name);
    }
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
  } finally {
    await context.close();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const config: ScreenshotConfig = {
    env: args.includes('--env=production') || args.includes('--production') ? 'production' : 'local',
    target: args.includes('--all') ? 'all' 
      : args.includes('--mobile') ? 'mobile'
      : args.includes('--showcase') ? 'showcase'
      : 'web',
    outputDir: join(process.cwd(), 'screenshots'),
    headless: !args.includes('--headed'),
  };
  
  console.log('📸 Comprehensive Screenshot Capture\n');
  console.log(`Environment: ${config.env}`);
  console.log(`Target: ${config.target}`);
  console.log(`Output: ${config.outputDir}`);
  console.log(`Headless: ${config.headless}\n`);
  
  const browser = await chromium.launch({ headless: config.headless });
  
  try {
    // Web app - all personas
    if (config.target === 'web' || config.target === 'all') {
      console.log('═'.repeat(60));
      console.log('WEB APPLICATION - ALL PERSONAS');
      console.log('═'.repeat(60));
      
      for (const persona of PERSONAS) {
        await capturePersonaScreenshots(browser, persona, config);
      }
    }
    
    // Mobile app showcase
    if (config.target === 'mobile' || config.target === 'all') {
      console.log('\n' + '═'.repeat(60));
      console.log('MOBILE APP SHOWCASE');
      console.log('═'.repeat(60));
      await captureMobileScreenshots(browser, config);
    }
    
    // Marketing showcase
    if (config.target === 'showcase' || config.target === 'all') {
      console.log('\n' + '═'.repeat(60));
      console.log('MARKETING SHOWCASE');
      console.log('═'.repeat(60));
      await captureShowcaseScreenshots(browser, config);
    }
    
    console.log('\n✅ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${config.outputDir}\n`);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
