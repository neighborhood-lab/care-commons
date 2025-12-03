import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

async function captureAboutPage() {
  const outputDir = join(process.cwd(), 'ui-screenshots-personas', 'about');
  mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1024 }
  });

  try {
    console.log('Navigating to about page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    console.log('Capturing full page screenshot...');
    await page.screenshot({
      path: join(outputDir, 'about-page-full.png'),
      fullPage: true
    });

    console.log('Capturing viewport screenshot...');
    await page.screenshot({
      path: join(outputDir, 'about-page-viewport.png'),
      fullPage: false
    });

    console.log(`Screenshots saved to ${outputDir}`);
  } finally {
    await browser.close();
  }
}

captureAboutPage().catch(console.error);
