#!/usr/bin/env tsx
/**
 * Unified Screenshot Capture Tool
 * 
 * Captures comprehensive screenshots for:
 * - Web Application (all personas: admin, coordinator, caregiver, nurse, family)
 * - Showcase (public demo)
 * - Mobile (iOS Simulator screenshots)
 * 
 * Works locally AND on production/preview deployments
 * 
 * Usage:
 *   npm run capture                          # All personas, all routes, local
 *   npm run capture -- --url https://...     # Capture from production
 *   npm run capture -- --persona admin       # Single persona only
 *   npm run capture -- --web                 # Web only (skip showcase/mobile)
 *   npm run capture -- --showcase            # Showcase only
 *   npm run capture -- --mobile              # Mobile only (requires simulator)
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/care-commons';
const SHOWCASE_URL = process.env.SHOWCASE_URL || 'http://localhost:5174/care-commons';
const OUTPUT_DIR = join(process.cwd(), 'screenshots');

interface Route {
  path: string;
  name: string;
  waitMs?: number; // Extra wait time if needed
  skipOnError?: boolean; // Continue if this route fails
}

interface Persona {
  id: string;
  name: string;
  role: string;
  selector: string; // How to click persona on login page
  routes: Route[];
}

// All 5 personas with their accessible routes
const PERSONAS: Persona[] = [
  {
    id: 'admin',
    name: 'Maria Rodriguez',
    role: 'Administrator',
    selector: 'text=Maria Rodriguez',
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
      { path: '/payroll', name: 'payroll', skipOnError: true },
      { path: '/incidents', name: 'incidents', skipOnError: true },
      { path: '/quality-assurance', name: 'quality-assurance' },
      { path: '/analytics/admin', name: 'analytics', waitMs: 3000 },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    id: 'coordinator',
    name: 'James Thompson',
    role: 'Care Coordinator',
    selector: 'text=James Thompson',
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
      { path: '/analytics/coordinator', name: 'analytics', waitMs: 3000 },
      { path: '/settings', name: 'settings' },
    ],
  },
  {
    id: 'caregiver',
    name: 'Sarah Chen',
    role: 'Caregiver',
    selector: 'text=Sarah Chen',
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
    id: 'nurse',
    name: 'David Williams',
    role: 'RN Clinical',
    selector: 'text=David Williams',
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
    selector: 'text=Emily Johnson',
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
  { path: '/', name: 'home' },
  { path: '/demo', name: 'demo' },
  { path: '/features', name: 'features', skipOnError: true },
  { path: '/states', name: 'states', skipOnError: true },
];

// ═══════════════════════════════════════════════════════════════════════════
// SCREENSHOT CAPTURE
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

async function captureRoute(
  page: Page,
  route: Route,
  baseUrl: string,
  outputPath: string
): Promise<boolean> {
  try {
    const url = `${baseUrl}${route.path}`;
    console.log(`   📸 ${route.path.padEnd(30)} → ${route.name}`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Extra wait if specified
    if (route.waitMs) {
      await page.waitForTimeout(route.waitMs);
    } else {
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: outputPath,
      fullPage: true,
      animations: 'disabled',
    });

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
  outputDir: string
): Promise<void> {
  const personaDir = join(outputDir, 'web', persona.id);
  await mkdir(personaDir, { recursive: true });

  console.log(`\n🎭 ${persona.name} (${persona.role})`);
  console.log(`   Output: ${personaDir}`);

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Login via persona selector
    console.log(`   🔐 Logging in...`);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    await page.click(persona.selector, { timeout: 10000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const afterLoginUrl = page.url();
    console.log(`   ✓ Logged in → ${afterLoginUrl}`);

    // Capture all routes
    for (const route of persona.routes) {
      stats.total++;
      const outputPath = join(personaDir, `${route.name}.png`);
      const success = await captureRoute(page, route, baseUrl, outputPath);
      
      if (!success && !route.skipOnError) {
        stats.failedRoutes.push({
          persona: persona.name,
          route: route.path,
          error: 'Navigation or screenshot failed',
        });
      }
    }

    // Logout for next persona
    try {
      await page.goto(`${baseUrl}/logout`, { timeout: 5000 });
      await page.waitForTimeout(500);
    } catch {
      // Logout failure is non-critical
    }
  } catch (error) {
    console.error(`   ❌ Persona capture failed:`, error instanceof Error ? error.message : String(error));
  } finally {
    await context.close();
  }
}

async function captureShowcase(
  browser: Browser,
  showcaseUrl: string,
  outputDir: string
): Promise<void> {
  const showcaseDir = join(outputDir, 'showcase');
  await mkdir(showcaseDir, { recursive: true });

  console.log(`\n🎨 Showcase Application`);
  console.log(`   URL: ${showcaseUrl}`);
  console.log(`   Output: ${showcaseDir}`);

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    for (const route of SHOWCASE_ROUTES) {
      stats.total++;
      const outputPath = join(showcaseDir, `${route.name}.png`);
      await captureRoute(page, route, showcaseUrl, outputPath);
    }
  } finally {
    await context.close();
  }
}

async function captureMobile(outputDir: string): Promise<void> {
  console.log(`\n📱 Mobile Application (iOS Simulator)`);
  
  const mobileDir = join(outputDir, 'mobile');
  await mkdir(mobileDir, { recursive: true });

  try {
    // Check if xcrun is available (macOS only)
    execSync('which xcrun', { stdio: 'ignore' });
    
    console.log(`   📸 Capturing iOS Simulator screenshots...`);
    console.log(`   ℹ️  Make sure the simulator is running and the app is open`);
    
    // Use xcrun simctl io to capture screenshots
    const timestamp = Date.now();
    const outputPath = join(mobileDir, `ios-simulator-${timestamp}.png`);
    
    execSync(`xcrun simctl io booted screenshot "${outputPath}"`, { stdio: 'inherit' });
    
    console.log(`   ✓ Screenshot saved: ${outputPath}`);
    console.log(`   💡 Tip: Navigate through the app and run this command again for more screenshots`);
  } catch (error) {
    console.error(`   ❌ Failed to capture mobile screenshots`);
    console.error(`   ℹ️  Mobile capture requires:`)
    console.error(`      - macOS with Xcode installed`);
    console.error(`      - iOS Simulator running`);
    console.error(`      - Mobile app open in simulator`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// METADATA AND REPORTING
// ═══════════════════════════════════════════════════════════════════════════

interface Metadata {
  timestamp: string;
  environment: {
    webUrl: string;
    showcaseUrl: string;
  };
  personas: {
    id: string;
    name: string;
    role: string;
    routesCaptured: number;
  }[];
  stats: CaptureStats;
}

async function generateMetadata(
  outputDir: string,
  capturedPersonas: Persona[],
  webUrl: string,
  showcaseUrl: string
): Promise<void> {
  const metadata: Metadata = {
    timestamp: new Date().toISOString(),
    environment: {
      webUrl,
      showcaseUrl,
    },
    personas: capturedPersonas.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      routesCaptured: p.routes.length,
    })),
    stats,
  };

  const metadataPath = join(outputDir, 'metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n📋 Metadata: ${metadataPath}`);
}

async function generateIndex(outputDir: string): Promise<void> {
  const indexPath = join(outputDir, 'INDEX.md');
  
  let content = `# Screenshots Index\n\n`;
  content += `Generated: ${new Date().toISOString()}\n\n`;
  content += `## Summary\n\n`;
  content += `- **Total Screenshots**: ${stats.total}\n`;
  content += `- **Successful**: ${stats.success}\n`;
  content += `- **Failed**: ${stats.failed}\n\n`;

  if (stats.failedRoutes.length > 0) {
    content += `## Failed Routes\n\n`;
    for (const failed of stats.failedRoutes) {
      content += `- **${failed.persona}** → ${failed.route}: ${failed.error}\n`;
    }
    content += `\n`;
  }

  content += `## Directory Structure\n\n`;
  content += `\`\`\`\n`;
  content += `screenshots/\n`;
  content += `├── web/                    # Web application (all personas)\n`;
  content += `│   ├── admin/              # Administrator\n`;
  content += `│   ├── coordinator/        # Care Coordinator\n`;
  content += `│   ├── caregiver/          # Caregiver\n`;
  content += `│   ├── nurse/              # RN Clinical\n`;
  content += `│   └── family/             # Family Member\n`;
  content += `├── showcase/               # Showcase application\n`;
  content += `├── mobile/                 # Mobile app (iOS Simulator)\n`;
  content += `├── metadata.json           # Capture metadata\n`;
  content += `└── INDEX.md                # This file\n`;
  content += `\`\`\`\n\n`;

  content += `## Usage\n\n`;
  content += `These screenshots are for:\n`;
  content += `- Visual regression testing\n`;
  content += `- LLM agents to understand UI state\n`;
  content += `- Documentation and demos\n`;
  content += `- Design reviews\n\n`;

  content += `## Regenerating\n\n`;
  content += `\`\`\`bash\n`;
  content += `npm run capture                    # All personas, local\n`;
  content += `npm run capture -- --url https://... # Production\n`;
  content += `npm run capture -- --persona admin # Single persona\n`;
  content += `\`\`\`\n`;

  await writeFile(indexPath, content);
  console.log(`📄 Index: ${indexPath}`);
}

function printSummary(): void {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 Capture Summary`);
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
  console.log(`\n✨ Screenshots saved to: ${OUTPUT_DIR}`);
  console.log(`📋 See INDEX.md for details\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const customUrl = args.find((arg) => arg.startsWith('--url='))?.split('=')[1];
  const targetPersona = args.find((arg) => arg.startsWith('--persona='))?.split('=')[1];
  const webOnly = args.includes('--web');
  const showcaseOnly = args.includes('--showcase');
  const mobileOnly = args.includes('--mobile');

  const webUrl = customUrl || BASE_URL;
  const showcaseUrl = customUrl || SHOWCASE_URL;

  console.log(`🚀 Care Commons Screenshot Capture Tool\n`);
  console.log(`Configuration:`);
  console.log(`  Web URL:      ${webUrl}`);
  console.log(`  Showcase URL: ${showcaseUrl}`);
  console.log(`  Output:       ${OUTPUT_DIR}`);
  if (targetPersona) {
    console.log(`  Target:       ${targetPersona} only`);
  }
  console.log();

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const capturedPersonas: Persona[] = [];

    // Capture web personas
    if (!showcaseOnly && !mobileOnly) {
      const personasToCapture = targetPersona
        ? PERSONAS.filter((p) => p.id === targetPersona)
        : PERSONAS;

      if (personasToCapture.length === 0) {
        throw new Error(`Unknown persona: ${targetPersona}`);
      }

      for (const persona of personasToCapture) {
        await capturePersona(browser, persona, webUrl, OUTPUT_DIR);
        capturedPersonas.push(persona);
      }
    }

    // Capture showcase
    if (!webOnly && !mobileOnly && !targetPersona) {
      await captureShowcase(browser, showcaseUrl, OUTPUT_DIR);
    }

    // Capture mobile (if requested)
    if (mobileOnly || (!webOnly && !showcaseOnly && !targetPersona)) {
      await captureMobile(OUTPUT_DIR);
    }

    // Generate metadata and index
    await generateMetadata(OUTPUT_DIR, capturedPersonas, webUrl, showcaseUrl);
    await generateIndex(OUTPUT_DIR);
    
    printSummary();
  } catch (error) {
    console.error(`\n❌ Fatal error:`, error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
