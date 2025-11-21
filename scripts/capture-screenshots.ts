#!/usr/bin/env tsx
/**
 * Unified Screenshot Capture Tool
 * 
 * Captures comprehensive screenshots showing ALL seed data:
 * - Web Application (all 5 personas: admin, coordinator, caregiver, nurse, family)
 * - Showcase (public marketing site)
 * - Mobile (responsive mobile views)
 * 
 * Features:
 * - Works locally AND on production/preview deployments
 * - Auto-resizes images to 2000px width using ImageMagick mogrify
 * - Proper login/logout between personas
 * - Detailed stats and error reporting
 * - Metadata generation for AI agents
 * 
 * Usage:
 *   npm run capture                          # Local, all personas, web only
 *   npm run capture -- --production          # Production environment
 *   npm run capture -- --showcase            # Include showcase
 *   npm run capture -- --mobile              # Include mobile views
 *   npm run capture -- --all                 # Web + Showcase + Mobile
 *   npm run capture -- --persona admin       # Single persona only
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface Route {
  path: string;
  name: string;
  waitMs?: number;
  skipOnError?: boolean;
}

interface Persona {
  id: string;
  name: string;
  role: string;
  email: string;
  password: string;
  folder: string;
  routes: Route[];
}

// All 5 personas with Texas demo credentials (from seed-demo.ts)
const PERSONAS: Persona[] = [
  {
    id: 'admin',
    name: 'Maria Rodriguez',
    role: 'Administrator',
    email: 'admin@tx.carecommons.example',
    password: 'Demo123!',
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
      { path: '/time-tracking', name: 'time-tracking', waitMs: 3000 }, // Extra wait for 255 EVV records
      { path: '/billing', name: 'billing' },
      { path: '/quality-assurance', name: 'quality-assurance' },
      { path: '/analytics/admin', name: 'analytics', waitMs: 3000 },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    id: 'coordinator',
    name: 'James Thompson',
    role: 'Care Coordinator',
    email: 'coordinator@tx.carecommons.example',
    password: 'Demo123!',
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
      { path: '/time-tracking', name: 'time-tracking', waitMs: 3000 }, // Extra wait for 255 EVV records
      { path: '/analytics/coordinator', name: 'analytics', waitMs: 3000 },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    id: 'caregiver',
    name: 'Sarah Chen',
    role: 'Caregiver',
    email: 'caregiver@tx.carecommons.example',
    password: 'Demo123!',
    folder: '03-caregiver',
    routes: [
      { path: '/', name: 'home' },
      { path: '/dashboard', name: 'dashboard' },
      { path: '/clients', name: 'clients' },
      { path: '/visits', name: 'visits' },
      { path: '/scheduling', name: 'scheduling' },
      { path: '/tasks', name: 'tasks' },
      { path: '/time-tracking', name: 'time-tracking', waitMs: 3000 }, // Extra wait for 255 EVV records
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    id: 'nurse',
    name: 'David Williams',
    role: 'RN Clinical',
    email: 'nurse@tx.carecommons.example',
    password: 'Demo123!',
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
    id: 'family',
    name: 'Emily Johnson',
    role: 'Family Member',
    email: 'family@tx.carecommons.example',
    password: 'Demo123!',
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

const SHOWCASE_ROUTES: Route[] = [
  { path: '/', name: 'landing-page' },
  { path: '/demo', name: 'demo' },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

interface CaptureStats {
  total: number;
  success: number;
  failed: number;
  failedRoutes: { persona: string; route: string; error: string }[];
}

const stats: CaptureStats = {
  total: 0,
  success: 0,
  failed: 0,
  failedRoutes: [],
};

function checkImageMagick(): boolean {
  try {
    execSync('which mogrify', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resizeImage(imagePath: string): void {
  try {
    // Resize to max 2000px width AND max 8000px height (Claude's image limit)
    execSync(`mogrify -resize 2000x8000\\> "${imagePath}"`, { stdio: 'ignore' });
  } catch (error) {
    console.warn(`   ⚠️  Failed to resize ${imagePath}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

async function loginWithPersona(
  page: Page,
  persona: Persona,
  baseUrl: string
): Promise<void> {
  console.log(`   🔐 Logging in as ${persona.email}...`);
  
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(1000);
  
  // Try persona card first (faster for demo mode)
  const personaButton = page.locator(`button:has-text("${persona.name}")`).first();
  const hasPersonaButton = await personaButton.count() > 0;
  
  if (hasPersonaButton) {
    console.log(`   ✓ Using persona card`);
    await personaButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(2000);
  } else {
    // Fallback to email/password form
    console.log(`   ✓ Using email/password form`);
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(persona.email);
    await passwordInput.fill(persona.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(2000);
  }
  
  const currentUrl = page.url();
  console.log(`   ✓ Logged in → ${currentUrl}`);
}

async function logout(page: Page, baseUrl: string): Promise<void> {
  try {
    await page.goto(`${baseUrl}/logout`, { timeout: 10000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    await page.waitForTimeout(1000);
    console.log(`   🚪 Logged out`);
  } catch (error) {
    // Logout might not exist or fail - that's OK
    console.log(`   ⚠️  Logout failed (continuing...)`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREENSHOT CAPTURE
// ═══════════════════════════════════════════════════════════════════════════

async function captureRoute(
  page: Page,
  route: Route,
  baseUrl: string,
  outputPath: string,
  useResize: boolean
): Promise<boolean> {
  try {
    const url = `${baseUrl}${route.path}`;
    console.log(`   📸 ${route.path.padEnd(35)} → ${route.name}`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    // Extra wait if specified (for analytics pages with multiple API calls)
    if (route.waitMs) {
      await page.waitForTimeout(route.waitMs);
    } else {
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: outputPath,
      fullPage: false, // Fixed: Use viewport-only screenshots to avoid 16,647px tall images
      animations: 'disabled',
    });

    // Resize image using mogrify
    if (useResize) {
      resizeImage(outputPath);
    }

    stats.success++;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ Failed: ${message.split('\n')[0]}`);
    
    if (!route.skipOnError) {
      stats.failed++;
    }
    
    return false;
  }
}

async function capturePersona(
  browser: Browser,
  persona: Persona,
  baseUrl: string,
  outputDir: string,
  useResize: boolean
): Promise<void> {
  const personaDir = join(outputDir, 'web', persona.folder);
  await mkdir(personaDir, { recursive: true });

  console.log(`\n🎭 ${persona.name} (${persona.role})`);
  console.log(`   Email: ${persona.email}`);
  console.log(`   Output: ${personaDir}`);

  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    // Login
    await loginWithPersona(page, persona, baseUrl);

    // Capture all routes
    for (const route of persona.routes) {
      stats.total++;
      const outputPath = join(personaDir, `${route.name}.png`);
      const success = await captureRoute(page, route, baseUrl, outputPath, useResize);
      
      if (!success && !route.skipOnError) {
        stats.failedRoutes.push({
          persona: persona.name,
          route: route.path,
          error: 'Navigation or screenshot failed',
        });
      }
    }

    // Logout
    await logout(page, baseUrl);
  } catch (error) {
    console.error(`   ❌ Error:`, error instanceof Error ? error.message : String(error));
  } finally {
    await context.close();
  }
}

async function captureShowcase(
  browser: Browser,
  showcaseUrl: string,
  outputDir: string,
  useResize: boolean
): Promise<void> {
  const showcaseDir = join(outputDir, 'showcase');
  await mkdir(showcaseDir, { recursive: true });

  console.log(`\n🎨 Showcase Application`);
  console.log(`   URL: ${showcaseUrl}`);
  console.log(`   Output: ${showcaseDir}`);

  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 } 
  });
  const page = await context.newPage();

  try {
    for (const route of SHOWCASE_ROUTES) {
      stats.total++;
      const outputPath = join(showcaseDir, `${route.name}.png`);
      await captureRoute(page, route, showcaseUrl, outputPath, useResize);
    }
  } finally {
    await context.close();
  }
}

async function captureMobile(
  browser: Browser,
  baseUrl: string,
  outputDir: string,
  useResize: boolean
): Promise<void> {
  const mobileDir = join(outputDir, 'mobile');
  await mkdir(mobileDir, { recursive: true });

  console.log(`\n📱 Mobile Views`);
  console.log(`   URL: ${baseUrl}`);
  console.log(`   Output: ${mobileDir}`);

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  const page = await context.newPage();

  const mobileRoutes: Route[] = [
    { path: '/login', name: 'login' },
    { path: '/dashboard', name: 'dashboard' },
  ];

  try {
    for (const route of mobileRoutes) {
      stats.total++;
      const outputPath = join(mobileDir, `${route.name}.png`);
      await captureRoute(page, route, baseUrl, outputPath, useResize);
    }
  } finally {
    await context.close();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// METADATA AND REPORTING
// ═══════════════════════════════════════════════════════════════════════════

async function generateMetadata(
  outputDir: string,
  capturedPersonas: Persona[],
  config: { webUrl: string; showcaseUrl: string; resize: boolean }
): Promise<void> {
  const metadata = {
    timestamp: new Date().toISOString(),
    environment: {
      webUrl: config.webUrl,
      showcaseUrl: config.showcaseUrl,
    },
    settings: {
      resize: config.resize,
      maxWidth: 2000,
    },
    personas: capturedPersonas.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      email: p.email,
      routesCaptured: p.routes.length,
    })),
    stats,
  };

  const metadataPath = join(outputDir, 'metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n📋 Metadata: ${metadataPath}`);
}

function printSummary(outputDir: string): void {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 Screenshot Capture Summary`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`Total Screenshots:  ${stats.total}`);
  console.log(`Successful:         ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Failed:             ${stats.failed}`);
  
  if (stats.failedRoutes.length > 0) {
    console.log(`\n⚠️  Failed Routes:`);
    for (const failed of stats.failedRoutes) {
      console.log(`   • ${failed.persona} → ${failed.route}`);
    }
  }
  
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n✅ Screenshots saved to: ${outputDir}`);
  console.log(`📁 View screenshots to verify seed data is visible\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const isProduction = args.includes('--production');
  const includeShowcase = args.includes('--showcase') || args.includes('--all');
  const includeMobile = args.includes('--mobile') || args.includes('--all');
  const targetPersona = args.find((arg) => arg.startsWith('--persona='))?.split('=')[1];
  const noResize = args.includes('--no-resize');

  const webUrl = isProduction 
    ? 'https://care-commons.vercel.app' 
    : process.env.BASE_URL || 'http://localhost:5173';
  
  const showcaseUrl = isProduction
    ? 'https://care-commons.vercel.app'
    : 'http://localhost:5174';

  const outputDir = join(process.cwd(), isProduction ? 'ui-screenshots-production-comprehensive' : 'ui-screenshots-personas');

  // Check for ImageMagick
  const hasImageMagick = checkImageMagick();
  const useResize = !noResize && hasImageMagick;
  
  console.log(`🚀 Care Commons Screenshot Capture Tool\n`);
  console.log(`Configuration:`);
  console.log(`  Environment:  ${isProduction ? 'Production' : 'Local'}`);
  console.log(`  Web URL:      ${webUrl}`);
  console.log(`  Showcase URL: ${showcaseUrl}`);
  console.log(`  Output:       ${outputDir}`);
  console.log(`  ImageMagick:  ${hasImageMagick ? '✓ Available (will resize to 2000px)' : '✗ Not found (install with: brew install imagemagick)'}`);
  if (targetPersona) {
    console.log(`  Target:       ${targetPersona} only`);
  }
  console.log();

  // Create output directory
  await mkdir(outputDir, { recursive: true });

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const capturedPersonas: Persona[] = [];

    // Capture web personas
    const personasToCapture = targetPersona
      ? PERSONAS.filter((p) => p.id === targetPersona)
      : PERSONAS;

    if (personasToCapture.length === 0) {
      throw new Error(`Unknown persona: ${targetPersona}. Valid: ${PERSONAS.map(p => p.id).join(', ')}`);
    }

    for (const persona of personasToCapture) {
      await capturePersona(browser, persona, webUrl, outputDir, useResize);
      capturedPersonas.push(persona);
    }

    // Capture showcase
    if (includeShowcase && !targetPersona) {
      await captureShowcase(browser, showcaseUrl, outputDir, useResize);
    }

    // Capture mobile
    if (includeMobile && !targetPersona) {
      await captureMobile(browser, webUrl, outputDir, useResize);
    }

    // Generate metadata
    await generateMetadata(outputDir, capturedPersonas, {
      webUrl,
      showcaseUrl,
      resize: useResize,
    });
    
    printSummary(outputDir);
  } catch (error) {
    console.error(`\n❌ Fatal error:`, error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
