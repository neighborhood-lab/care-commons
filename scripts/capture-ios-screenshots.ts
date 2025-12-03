#!/usr/bin/env tsx
/**
 * iOS Simulator Screenshot Capture Tool
 * 
 * Captures screenshots from the iOS Simulator running the Folk mobile app.
 * 
 * Prerequisites:
 *   - Xcode installed with iOS Simulator
 *   - Mobile app running in simulator: cd packages/mobile && npx expo start --ios
 * 
 * Usage:
 *   npx tsx scripts/capture-ios-screenshots.ts              # Capture current screen
 *   npx tsx scripts/capture-ios-screenshots.ts --name visits # Capture with custom name
 *   npx tsx scripts/capture-ios-screenshots.ts --list       # List booted simulators
 * 
 * For automated multi-screen capture, use Detox E2E tests:
 *   cd packages/mobile && npm run test:e2e
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const OUTPUT_DIR = join(process.cwd(), 'ui-screenshots-personas', 'ios-simulator');

interface SimulatorDevice {
  udid: string;
  name: string;
  state: string;
}

function runCommand(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Command failed: ${cmd}\n${message}`);
  }
}

function listBootedSimulators(): SimulatorDevice[] {
  const output = runCommand('xcrun simctl list devices booted -j');
  const data = JSON.parse(output);
  const devices: SimulatorDevice[] = [];
  
  for (const runtime of Object.values(data.devices) as any[]) {
    for (const device of runtime) {
      if (device.state === 'Booted') {
        devices.push({
          udid: device.udid,
          name: device.name,
          state: device.state,
        });
      }
    }
  }
  
  return devices;
}

async function captureScreenshot(name: string): Promise<string> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = name ? `${name}.png` : `screenshot-${timestamp}.png`;
  const outputPath = join(OUTPUT_DIR, filename);
  
  console.log(`📸 Capturing iOS Simulator screenshot...`);
  
  runCommand(`xcrun simctl io booted screenshot "${outputPath}"`);
  
  console.log(`✅ Saved to: ${outputPath}`);
  return outputPath;
}

async function generateMetadata(screenshots: string[]): Promise<void> {
  const metadata = {
    timestamp: new Date().toISOString(),
    platform: 'ios-simulator',
    screenshots: screenshots.map(s => ({
      path: s,
      name: s.split('/').pop()?.replace('.png', ''),
    })),
    instructions: {
      startApp: 'cd packages/mobile && npx expo start --ios',
      bootSimulator: 'xcrun simctl boot "iPhone 15 Pro"',
      openSimulator: 'open -a Simulator',
      manualNavigation: 'Use the Simulator app to navigate, then run this script',
      automatedTesting: 'cd packages/mobile && npm run test:e2e',
    },
  };
  
  const metadataPath = join(OUTPUT_DIR, 'metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`📋 Metadata saved to: ${metadataPath}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  console.log(`\n📱 iOS Simulator Screenshot Tool\n`);
  
  // List simulators
  if (args.includes('--list')) {
    const devices = listBootedSimulators();
    if (devices.length === 0) {
      console.log('No booted simulators found.');
      console.log('\nTo boot a simulator:');
      console.log('  xcrun simctl boot "iPhone 15 Pro"');
      console.log('  open -a Simulator');
    } else {
      console.log('Booted simulators:');
      for (const device of devices) {
        console.log(`  • ${device.name} (${device.udid})`);
      }
    }
    return;
  }
  
  // Check if simulator is running
  const devices = listBootedSimulators();
  if (devices.length === 0) {
    console.error('❌ No booted iOS Simulator found.');
    console.log('\nTo start the simulator and mobile app:');
    console.log('  1. xcrun simctl boot "iPhone 15 Pro"');
    console.log('  2. open -a Simulator');
    console.log('  3. cd packages/mobile && npx expo start --ios');
    process.exit(1);
  }
  
  console.log(`Using simulator: ${devices[0].name}`);
  
  // Get custom name if provided
  const nameIndex = args.indexOf('--name');
  const name = nameIndex !== -1 ? args[nameIndex + 1] : '';
  
  // Capture screenshot
  const screenshotPath = await captureScreenshot(name);
  
  // Generate metadata
  await generateMetadata([screenshotPath]);
  
  console.log(`\n💡 Tips:`);
  console.log(`   • Navigate in the Simulator app, then run this script again`);
  console.log(`   • Use --name <screen-name> to name screenshots`);
  console.log(`   • For automated capture, use Detox: cd packages/mobile && npm run test:e2e`);
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
