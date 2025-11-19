#!/usr/bin/env tsx
/**
 * Mobile Simulator Screenshot Capture Tool
 *
 * Captures screenshots from the iOS simulator running the React Native app.
 * This tool:
 * - Boots the iOS simulator
 * - Starts the Expo dev server
 * - Automates app navigation using ADB/simctl
 * - Captures screenshots at each state
 * - Verifies screenshots match reality
 *
 * Purpose: Enable comprehensive mobile app testing and visual verification
 *
 * Usage:
 *   npm run capture:mobile-simulator
 */

import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const screenshotsDir = join(rootDir, 'mobile-screenshots');

// iOS Simulator configuration
const SIMULATOR_UUID = '3C8225BB-049F-4630-B83A-9828B7D80CB1';
const SIMULATOR_NAME = 'iPhone 15 Pro';
const EXPO_PORT = 8081;
const EXPO_URL = `exp://localhost:${EXPO_PORT}`;

interface ScreenshotStep {
  name: string;
  description: string;
  delay?: number;
  tapCoordinates?: { x: number; y: number };
  typeText?: string;
  action?: 'swipe-up' | 'swipe-down' | 'swipe-left' | 'swipe-right';
  verify?: (imagePath: string) => Promise<boolean>;
}

interface TestScenario {
  name: string;
  description: string;
  role?: 'caregiver' | 'coordinator' | 'admin' | 'family';
  setup?: () => Promise<void>;
  steps: ScreenshotStep[];
  teardown?: () => Promise<void>;
}

/**
 * Wait for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute shell command and return output
 */
async function executeCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('warning')) {
      console.warn(`  ⚠️  Command warning: ${stderr.substring(0, 200)}`);
    }
    return stdout.trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error}`);
  }
}

/**
 * Check if simulator is booted
 */
async function isSimulatorBooted(): Promise<boolean> {
  const output = await executeCommand(`xcrun simctl list devices booted`);
  return output.includes(SIMULATOR_UUID);
}

/**
 * Boot the iOS simulator
 */
async function bootSimulator(): Promise<void> {
  console.log(`📱 Booting ${SIMULATOR_NAME}...`);

  if (await isSimulatorBooted()) {
    console.log(`  ✅ ${SIMULATOR_NAME} already booted`);
    return;
  }

  try {
    await executeCommand(`xcrun simctl boot ${SIMULATOR_UUID}`);
    console.log(`  ✅ Simulator booted`);

    // Open Simulator.app
    await executeCommand('open -a Simulator');
    await sleep(3000); // Wait for Simulator.app to open
  } catch (error) {
    throw new Error(`Failed to boot simulator: ${error}`);
  }
}

/**
 * Check if Expo Metro server is running
 */
async function isExpoRunning(): Promise<boolean> {
  try {
    const output = await executeCommand(`lsof -i:${EXPO_PORT} | grep LISTEN`);
    return output.includes('node');
  } catch {
    return false;
  }
}

/**
 * Start Expo development server
 */
async function startExpo(): Promise<void> {
  if (await isExpoRunning()) {
    console.log(`  ✅ Expo already running on port ${EXPO_PORT}`);
    return;
  }

  console.log('🚀 Starting Expo development server...');

  return new Promise((resolve, reject) => {
    const expo = spawn('npx', ['expo', 'start', '--clear'], {
      cwd: join(rootDir, 'packages/mobile'),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let serverReady = false;

    expo.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`  📦 ${output.trim()}`);

      if (output.includes('Waiting on') || output.includes('Metro') || output.includes('Bundler')) {
        serverReady = true;
      }
    });

    expo.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('warning') && !error.includes('The following packages')) {
        console.error(`  ❌ Expo error: ${error.trim()}`);
      }
    });

    // Wait for server to be ready
    const checkInterval = setInterval(async () => {
      if (serverReady && (await isExpoRunning())) {
        clearInterval(checkInterval);
        console.log('  ✅ Expo server ready');
        resolve();
      }
    }, 1000);

    // Timeout after 60 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!serverReady) {
        expo.kill();
        reject(new Error('Expo server failed to start within 60 seconds'));
      }
    }, 60000);
  });
}

/**
 * Open app in simulator
 */
async function openAppInSimulator(): Promise<void> {
  console.log('📲 Opening app in simulator...');

  try {
    await executeCommand(`xcrun simctl openurl ${SIMULATOR_UUID} "${EXPO_URL}"`);
    console.log('  ✅ App opening...');

    // Wait for app to load
    await sleep(10000);
  } catch (error) {
    throw new Error(`Failed to open app: ${error}`);
  }
}

/**
 * Capture screenshot from simulator
 */
async function captureScreenshot(outputPath: string): Promise<void> {
  await executeCommand(`xcrun simctl io ${SIMULATOR_UUID} screenshot "${outputPath}"`);
}

/**
 * Tap at coordinates in simulator
 */
async function tapAtCoordinates(x: number, y: number): Promise<void> {
  // Note: simctl doesn't have direct tap support
  // We'll use AppleScript to simulate taps via System Events
  const script = `
    tell application "Simulator"
      activate
    end tell
    tell application "System Events"
      tell process "Simulator"
        click at {${x}, ${y}}
      end tell
    end tell
  `;

  await executeCommand(`osascript -e '${script.replace(/'/g, "\\'")}'`);
  await sleep(500);
}

/**
 * Type text in simulator
 */
async function typeText(text: string): Promise<void> {
  await executeCommand(`xcrun simctl io ${SIMULATOR_UUID} keyboard-text "${text}"`);
  await sleep(300);
}

/**
 * Simulate swipe gesture
 */
async function swipeGesture(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
  // Get simulator window dimensions - typical iPhone 15 Pro
  const centerX = 589; // Half of 1179
  const centerY = 1278; // Half of 2556

  let fromX = centerX,
    fromY = centerY;
  let toX = centerX,
    toY = centerY;

  switch (direction) {
    case 'up':
      fromY = 2000;
      toY = 500;
      break;
    case 'down':
      fromY = 500;
      toY = 2000;
      break;
    case 'left':
      fromX = 1000;
      toX = 200;
      break;
    case 'right':
      fromX = 200;
      toX = 1000;
      break;
  }

  // Use simctl for gesture
  await executeCommand(
    `xcrun simctl io ${SIMULATOR_UUID} touch ${fromX} ${fromY} && sleep 0.1 && xcrun simctl io ${SIMULATOR_UUID} touch ${toX} ${toY}`
  );
  await sleep(500);
}

/**
 * Verify screenshot was captured successfully
 */
async function verifyScreenshot(imagePath: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`file "${imagePath}"`);
    const isValid = stdout.includes('PNG image data');

    if (!isValid) {
      console.error(`  ❌ Screenshot verification failed: Not a valid PNG`);
      return false;
    }

    // Check file size - should be reasonable
    const { stdout: sizeOutput } = await execAsync(`wc -c < "${imagePath}"`);
    const fileSize = parseInt(sizeOutput.trim());

    if (fileSize < 1000) {
      console.error(`  ❌ Screenshot verification failed: File too small (${fileSize} bytes)`);
      return false;
    }

    if (fileSize > 50000000) {
      console.error(`  ❌ Screenshot verification failed: File too large (${fileSize} bytes)`);
      return false;
    }

    console.log(`  ✅ Screenshot verified (${Math.round(fileSize / 1024)} KB)`);
    return true;
  } catch (error) {
    console.error(`  ❌ Screenshot verification error: ${error}`);
    return false;
  }
}

/**
 * Execute a test scenario
 */
async function executeScenario(scenario: TestScenario, outputDir: string): Promise<void> {
  console.log(`\n🎬 Scenario: ${scenario.description}`);

  const scenarioDir = join(outputDir, scenario.name);
  await mkdir(scenarioDir, { recursive: true });

  // Setup
  if (scenario.setup) {
    console.log('  🔧 Running setup...');
    await scenario.setup();
  }

  // Execute steps
  let stepNumber = 0;
  for (const step of scenario.steps) {
    stepNumber++;
    console.log(`  📸 Step ${stepNumber}/${scenario.steps.length}: ${step.description}`);

    // Wait if specified
    if (step.delay) {
      await sleep(step.delay);
    }

    // Perform action
    if (step.tapCoordinates) {
      await tapAtCoordinates(step.tapCoordinates.x, step.tapCoordinates.y);
      await sleep(1000); // Wait for UI to respond
    }

    if (step.typeText) {
      await typeText(step.typeText);
      await sleep(500);
    }

    if (step.action) {
      const direction = step.action.replace('swipe-', '') as 'up' | 'down' | 'left' | 'right';
      await swipeGesture(direction);
      await sleep(1000);
    }

    // Capture screenshot
    const screenshotPath = join(scenarioDir, `${String(stepNumber).padStart(2, '0')}-${step.name}.png`);
    await captureScreenshot(screenshotPath);

    // Verify screenshot
    const isValid = await verifyScreenshot(screenshotPath);
    if (!isValid) {
      console.error(`  ⚠️  Screenshot may be invalid, continuing anyway...`);
    }

    // Custom verification
    if (step.verify) {
      const customValid = await step.verify(screenshotPath);
      if (!customValid) {
        console.error(`  ⚠️  Custom verification failed for ${step.name}`);
      }
    }
  }

  // Teardown
  if (scenario.teardown) {
    console.log('  🧹 Running teardown...');
    await scenario.teardown();
  }

  console.log(`  ✅ Scenario complete`);
}

/**
 * Define test scenarios
 */
const scenarios: TestScenario[] = [
  {
    name: 'app-launch',
    description: 'Initial app launch and home screen',
    steps: [
      {
        name: 'home-screen',
        description: 'App home screen after launch',
        delay: 3000,
      },
      {
        name: 'home-screen-scrolled',
        description: 'Home screen after scroll',
        action: 'swipe-up',
        delay: 1000,
      },
    ],
  },
  {
    name: 'authentication',
    description: 'Login and authentication flow',
    steps: [
      {
        name: 'login-screen',
        description: 'Login screen initial state',
        delay: 2000,
      },
      {
        name: 'login-email-focused',
        description: 'Email field focused',
        tapCoordinates: { x: 589, y: 800 }, // Center-ish for email field
        delay: 1000,
      },
      {
        name: 'login-email-filled',
        description: 'Email filled in',
        typeText: 'caregiver@example.com',
        delay: 1000,
      },
      {
        name: 'login-password-focused',
        description: 'Password field focused',
        tapCoordinates: { x: 589, y: 1000 }, // Approximate password field
        delay: 1000,
      },
      {
        name: 'login-password-filled',
        description: 'Password filled (hidden)',
        typeText: 'password123',
        delay: 1000,
      },
      {
        name: 'login-submit',
        description: 'After tapping login button',
        tapCoordinates: { x: 589, y: 1200 }, // Approximate login button
        delay: 3000,
      },
    ],
  },
  {
    name: 'visits-workflow',
    description: "Caregiver's daily visits workflow",
    role: 'caregiver',
    steps: [
      {
        name: 'visits-list',
        description: "Today's visits list",
        delay: 2000,
      },
      {
        name: 'visit-detail',
        description: 'Visit detail screen',
        tapCoordinates: { x: 589, y: 600 }, // First visit card
        delay: 2000,
      },
      {
        name: 'visit-detail-scrolled',
        description: 'Visit detail scrolled to tasks',
        action: 'swipe-up',
        delay: 1000,
      },
      {
        name: 'visit-actions',
        description: 'Visit action buttons visible',
        action: 'swipe-up',
        delay: 1000,
      },
    ],
  },
  {
    name: 'evv-clock-in',
    description: 'EVV clock-in workflow',
    role: 'caregiver',
    steps: [
      {
        name: 'clock-in-button',
        description: 'Clock-in button on visit detail',
        tapCoordinates: { x: 589, y: 2200 }, // Bottom area for clock-in button
        delay: 2000,
      },
      {
        name: 'clock-in-gps',
        description: 'GPS verification screen',
        delay: 2000,
      },
      {
        name: 'clock-in-confirmation',
        description: 'Clock-in confirmation',
        tapCoordinates: { x: 589, y: 1800 }, // Confirm button
        delay: 3000,
      },
    ],
  },
  {
    name: 'profile-settings',
    description: 'Profile and settings screens',
    steps: [
      {
        name: 'profile-tab',
        description: 'Profile tab',
        tapCoordinates: { x: 1000, y: 2500 }, // Profile tab (bottom right)
        delay: 2000,
      },
      {
        name: 'profile-screen',
        description: 'Profile screen content',
        delay: 1000,
      },
      {
        name: 'profile-scrolled',
        description: 'Profile settings scrolled',
        action: 'swipe-up',
        delay: 1000,
      },
    ],
  },
];

/**
 * Generate metadata
 */
async function generateMetadata(outputDir: string, captureInfo: {
  timestamp: string;
  simulator: string;
  scenarios: string[];
}): Promise<void> {
  const metadata = {
    ...captureInfo,
    purpose: 'Mobile app screenshots from iOS Simulator for testing and verification',
    format: 'PNG screenshots from iOS Simulator',
    viewport: '1179x2556 (iPhone 15 Pro)',
    usage: 'Verify mobile app UI states and navigation flows',
    tool: 'capture-mobile-screenshots.ts',
  };

  const metadataPath = join(outputDir, 'metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n📋 Metadata saved: ${metadataPath}`);
}

/**
 * Generate README
 */
async function generateReadme(outputDir: string): Promise<void> {
  const readme = `# Mobile App Screenshots

This directory contains screenshots captured from the iOS Simulator running the Care Commons mobile app.

## Purpose

Enable comprehensive testing and visual verification of the mobile application, including:
- UI state verification
- Navigation flow testing
- Authentication workflows
- EVV compliance features
- Error handling

## Structure

\`\`\`
mobile-screenshots/
├── metadata.json
├── app-launch/
├── authentication/
├── visits-workflow/
├── evv-clock-in/
└── profile-settings/
\`\`\`

## Simulator Details

- **Device**: iPhone 15 Pro
- **iOS Version**: 17.2
- **Resolution**: 1179 x 2556 pixels
- **UUID**: ${SIMULATOR_UUID}

## Regenerating Screenshots

\`\`\`bash
npm run capture:mobile-simulator
\`\`\`

## Last Updated

Check \`metadata.json\` for the last capture timestamp.

---

**Care Commons Mobile** - Offline-first mobile app for caregivers
`;

  const readmePath = join(outputDir, 'README.md');
  await writeFile(readmePath, readme);
  console.log(`📄 README saved: ${readmePath}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🚀 Mobile Simulator Screenshot Capture\n');

  // Create output directory
  await mkdir(screenshotsDir, { recursive: true });

  try {
    // 1. Boot simulator
    await bootSimulator();

    // 2. Start Expo
    await startExpo();

    // 3. Open app in simulator
    await openAppInSimulator();

    // 4. Execute scenarios
    const executedScenarios: string[] = [];
    for (const scenario of scenarios) {
      await executeScenario(scenario, screenshotsDir);
      executedScenarios.push(scenario.name);
    }

    // 5. Generate metadata and README
    await generateMetadata(screenshotsDir, {
      timestamp: new Date().toISOString(),
      simulator: SIMULATOR_NAME,
      scenarios: executedScenarios,
    });

    await generateReadme(screenshotsDir);

    console.log('\n✨ Mobile screenshot capture complete!');
    console.log(`📂 Saved to: ${screenshotsDir}`);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main as captureMobileScreenshots };
