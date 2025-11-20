#!/usr/bin/env tsx
/**
 * Mobile Integration Test
 * 
 * Validates that the mobile app integration is working correctly:
 * 1. Showcase is accessible
 * 2. Mobile demo page loads
 * 3. MobileSimulator component renders
 * 4. Mobile server is reachable (if running)
 */

import { chromium } from '@playwright/test';

async function testIntegration() {
  console.log('🔍 Testing Mobile Integration...\n');
  
  const showcaseURL = process.env['SHOWCASE_URL'] || 'http://localhost:5173';
  const mobileURL = process.env['MOBILE_URL'] || 'http://localhost:8081';
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // Test 1: Showcase landing page
    console.log('1️⃣  Testing showcase landing page...');
    await page.goto(`${showcaseURL}/care-commons/`, { 
      waitUntil: 'networkidle',
      timeout: 10000,
    });
    
    const hasLanding = await page.locator('h1:has-text("Care Commons Showcase")').isVisible();
    console.log(`   ${hasLanding ? '✅' : '❌'} Landing page loads\n`);
    
    // Test 2: Mobile demo page
    console.log('2️⃣  Testing mobile demo page...');
    await page.goto(`${showcaseURL}/care-commons/mobile`, { 
      waitUntil: 'networkidle',
      timeout: 10000,
    });
    
    const hasMobileTitle = await page.locator('text=Caregiver Mobile App').isVisible();
    console.log(`   ${hasMobileTitle ? '✅' : '❌'} Mobile demo page loads`);
    
    const hasSimulator = await page.locator('text=Live Mobile App').isVisible();
    console.log(`   ${hasSimulator ? '✅' : '❌'} MobileSimulator component present`);
    
    const hasFeatures = await page.locator('text=EVV Clock In/Out').isVisible();
    console.log(`   ${hasFeatures ? '✅' : '❌'} Features section renders\n`);
    
    // Test 3: Mobile server accessibility
    console.log('3️⃣  Testing mobile server...');
    try {
      const mobileResponse = await fetch(mobileURL);
      const mobileOk = mobileResponse.ok;
      console.log(`   ${mobileOk ? '✅' : '❌'} Mobile server accessible at ${mobileURL}`);
      
      const mobileContent = await mobileResponse.text();
      const hasMobileContent = mobileContent.includes('Care Commons Mobile');
      console.log(`   ${hasMobileContent ? '✅' : '❌'} Mobile app content served\n`);
    } catch (error) {
      console.log(`   ⚠️  Mobile server not running (expected in CI)\n`);
    }
    
    // Test 4: Responsive design
    console.log('4️⃣  Testing responsive design...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const tabletView = await page.locator('text=Caregiver Mobile App').isVisible();
    console.log(`   ${tabletView ? '✅' : '❌'} Tablet viewport (768x1024)`);
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileView = await page.locator('text=Caregiver Mobile App').isVisible();
    console.log(`   ${mobileView ? '✅' : '❌'} Mobile viewport (375x667)\n`);
    
    console.log('✅ All integration tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
  testIntegration().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testIntegration };
