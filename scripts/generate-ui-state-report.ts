#!/usr/bin/env tsx
/**
 * UI State Report Generator
 *
 * Generates a comprehensive HTML report showing all UI states with:
 * - Screenshots
 * - DOM structure analysis
 * - Accessibility tree
 * - Component hierarchy
 *
 * Purpose: Give AI agents complete visibility into UI state
 *
 * Usage:
 *   npm run ui:report
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const reportsDir = join(rootDir, 'ui-reports');

interface UIElement {
  tag: string;
  role?: string;
  text?: string;
  testId?: string;
  classes: string[];
  children: number;
}

interface UIStateReport {
  name: string;
  url: string;
  timestamp: string;
  screenshot: string;
  viewport: { width: number; height: number };
  performance: {
    loadTime: number;
    domNodes: number;
    resources: number;
  };
  structure: {
    headings: string[];
    landmarks: string[];
    forms: string[];
    buttons: string[];
    links: string[];
    inputs: string[];
  };
  accessibility: {
    violations: unknown[];
    warnings: unknown[];
  };
  elements: UIElement[];
}

/**
 * Analyze page structure
 */
async function analyzePage(page: Page): Promise<UIStateReport['structure']> {
  return await page.evaluate(() => {
    const structure = {
      headings: [] as string[],
      landmarks: [] as string[],
      forms: [] as string[],
      buttons: [] as string[],
      links: [] as string[],
      inputs: [] as string[],
    };

    // Headings
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      const level = h.tagName;
      const text = h.textContent?.trim() || '';
      if (text) structure.headings.push(`${level}: ${text}`);
    });

    // Landmarks
    document.querySelectorAll('[role="navigation"], [role="main"], [role="complementary"], [role="banner"], nav, main, aside, header, footer').forEach((landmark) => {
      const role = landmark.getAttribute('role') || landmark.tagName.toLowerCase();
      const label = landmark.getAttribute('aria-label') || '';
      structure.landmarks.push(label ? `${role} (${label})` : role);
    });

    // Forms
    document.querySelectorAll('form').forEach((form) => {
      const name = form.getAttribute('name') || form.getAttribute('id') || 'unnamed';
      structure.forms.push(name);
    });

    // Buttons
    document.querySelectorAll('button, [role="button"]').forEach((btn) => {
      const text = btn.textContent?.trim() || btn.getAttribute('aria-label') || '';
      if (text) structure.buttons.push(text);
    });

    // Links
    document.querySelectorAll('a[href]').forEach((link) => {
      const text = link.textContent?.trim() || link.getAttribute('aria-label') || '';
      if (text) structure.links.push(text);
    });

    // Inputs
    document.querySelectorAll('input, textarea, select').forEach((input) => {
      const type = input.getAttribute('type') || input.tagName.toLowerCase();
      const label = input.getAttribute('aria-label') || input.getAttribute('placeholder') || input.getAttribute('name') || '';
      structure.inputs.push(label ? `${type}: ${label}` : type);
    });

    return structure;
  });
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(page: Page): Promise<UIStateReport['performance']> {
  const metrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return {
      loadTime: perfData ? perfData.loadEventEnd - perfData.fetchStart : 0,
      domNodes: document.querySelectorAll('*').length,
      resources: performance.getEntriesByType('resource').length,
    };
  });

  return metrics;
}

/**
 * Extract key UI elements
 */
async function extractUIElements(page: Page): Promise<UIElement[]> {
  return await page.evaluate(() => {
    const elements: UIElement[] = [];
    const maxElements = 50; // Limit to avoid huge reports

    // Get all interactive and important elements
    const selectors = [
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[data-testid]',
      'h1', 'h2', 'h3',
      '.card', '.modal', '.dialog',
    ];

    const seen = new Set<Element>();

    for (const selector of selectors) {
      const els = document.querySelectorAll(selector);
      for (const el of els) {
        if (seen.has(el)) continue;
        if (elements.length >= maxElements) break;

        seen.add(el);

        const element: UIElement = {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || undefined,
          text: el.textContent?.trim().slice(0, 50) || undefined,
          testId: el.getAttribute('data-testid') || undefined,
          classes: Array.from(el.classList),
          children: el.children.length,
        };

        elements.push(element);
      }

      if (elements.length >= maxElements) break;
    }

    return elements;
  });
}

/**
 * Generate report for a single page
 */
async function generatePageReport(
  browser: Browser,
  name: string,
  url: string,
  viewport: { width: number; height: number },
  outputDir: string
): Promise<UIStateReport> {
  console.log(`  📄 Analyzing: ${name}`);

  const page = await browser.newPage();
  await page.setViewportSize(viewport);

  try {
    // Navigate
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500); // Let animations settle

    // Take screenshot
    const screenshotFilename = `${name.replace(/[^a-z0-9]/gi, '-')}.png`;
    const screenshotPath = join(outputDir, screenshotFilename);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled',
    });

    // Gather data
    const [structure, performance, elements] = await Promise.all([
      analyzePage(page),
      getPerformanceMetrics(page),
      extractUIElements(page),
    ]);

    const report: UIStateReport = {
      name,
      url,
      timestamp: new Date().toISOString(),
      screenshot: screenshotFilename,
      viewport,
      performance,
      structure,
      accessibility: {
        violations: [],
        warnings: [],
      },
      elements,
    };

    console.log(`    ✅ Complete`);
    return report;
  } finally {
    await page.close();
  }
}

/**
 * Generate HTML report
 */
function generateHTMLReport(reports: UIStateReport[]): string {
  const reportsHTML = reports.map(report => `
    <section class="report-section">
      <h2>${report.name}</h2>
      <div class="report-meta">
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Viewport:</strong> ${report.viewport.width}x${report.viewport.height}</p>
        <p><strong>Captured:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
      </div>

      <div class="screenshot-container">
        <h3>Screenshot</h3>
        <img src="${report.screenshot}" alt="${report.name}" loading="lazy" />
      </div>

      <div class="metrics">
        <h3>Performance</h3>
        <ul>
          <li><strong>Load Time:</strong> ${report.performance.loadTime.toFixed(0)}ms</li>
          <li><strong>DOM Nodes:</strong> ${report.performance.domNodes}</li>
          <li><strong>Resources:</strong> ${report.performance.resources}</li>
        </ul>
      </div>

      <div class="structure">
        <h3>Page Structure</h3>
        
        <div class="structure-section">
          <h4>Headings (${report.structure.headings.length})</h4>
          <ul>
            ${report.structure.headings.map(h => `<li>${h}</li>`).join('') || '<li>None</li>'}
          </ul>
        </div>

        <div class="structure-section">
          <h4>Landmarks (${report.structure.landmarks.length})</h4>
          <ul>
            ${report.structure.landmarks.map(l => `<li>${l}</li>`).join('') || '<li>None</li>'}
          </ul>
        </div>

        <div class="structure-section">
          <h4>Buttons (${report.structure.buttons.length})</h4>
          <ul>
            ${report.structure.buttons.slice(0, 20).map(b => `<li>${b}</li>`).join('') || '<li>None</li>'}
            ${report.structure.buttons.length > 20 ? `<li><em>... and ${report.structure.buttons.length - 20} more</em></li>` : ''}
          </ul>
        </div>

        <div class="structure-section">
          <h4>Form Inputs (${report.structure.inputs.length})</h4>
          <ul>
            ${report.structure.inputs.slice(0, 20).map(i => `<li>${i}</li>`).join('') || '<li>None</li>'}
            ${report.structure.inputs.length > 20 ? `<li><em>... and ${report.structure.inputs.length - 20} more</em></li>` : ''}
          </ul>
        </div>
      </div>

      <details class="elements-details">
        <summary>Key UI Elements (${report.elements.length})</summary>
        <table>
          <thead>
            <tr>
              <th>Tag</th>
              <th>Role</th>
              <th>Test ID</th>
              <th>Text</th>
              <th>Classes</th>
            </tr>
          </thead>
          <tbody>
            ${report.elements.map(el => `
              <tr>
                <td><code>${el.tag}</code></td>
                <td>${el.role || '-'}</td>
                <td>${el.testId || '-'}</td>
                <td>${el.text || '-'}</td>
                <td><code>${el.classes.join(' ')}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </details>
    </section>
  `).join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Care Commons - UI State Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 0.5rem;
    }
    h2 {
      color: #2563eb;
      margin-top: 3rem;
    }
    h3 {
      color: #1e40af;
      margin-top: 2rem;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.25rem;
    }
    h4 {
      color: #1e3a8a;
      margin-top: 1rem;
    }
    .report-section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .report-meta {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin: 1rem 0;
    }
    .report-meta p { margin: 0.25rem 0; }
    .screenshot-container {
      margin: 2rem 0;
    }
    .screenshot-container img {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .metrics ul, .structure ul {
      list-style: none;
      padding: 0;
    }
    .metrics li, .structure li {
      padding: 0.25rem 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .structure-section {
      margin: 1rem 0;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      text-align: left;
      padding: 0.75rem;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #1e3a8a;
    }
    tr:hover {
      background: #f8fafc;
    }
    code {
      background: #f1f5f9;
      padding: 0.125rem 0.25rem;
      border-radius: 2px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
    }
    details {
      margin: 2rem 0;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    summary {
      cursor: pointer;
      font-weight: 600;
      color: #1e40af;
      padding: 0.5rem;
      user-select: none;
    }
    summary:hover {
      color: #2563eb;
    }
    .timestamp {
      text-align: right;
      color: #666;
      font-size: 0.875rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <h1>📊 Care Commons - UI State Report</h1>
  <p>Comprehensive analysis of all UI states for AI agent visibility</p>
  
  ${reportsHTML}

  <div class="timestamp">
    Generated: ${new Date().toLocaleString()}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 UI State Report Generator\n');

  const outputDir = join(reportsDir, new Date().toISOString().split('T')[0]);
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const baseURL = process.env['WEB_URL'] || 'http://localhost:3000';
  const reports: UIStateReport[] = [];

  try {
    // Define pages to analyze
    const pages = [
      { name: 'Login', url: '/login' },
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Visits List', url: '/visits' },
      { name: 'Clients List', url: '/clients' },
      { name: 'Caregivers List', url: '/caregivers' },
      { name: 'Care Plans', url: '/care-plans' },
    ];

    const viewport = { width: 1920, height: 1080 };

    for (const pageConfig of pages) {
      const report = await generatePageReport(
        browser,
        pageConfig.name,
        `${baseURL}${pageConfig.url}`,
        viewport,
        outputDir
      );
      reports.push(report);
    }

    // Generate HTML report
    const htmlReport = generateHTMLReport(reports);
    const reportPath = join(outputDir, 'index.html');
    await writeFile(reportPath, htmlReport);

    // Generate JSON report
    const jsonPath = join(outputDir, 'report.json');
    await writeFile(jsonPath, JSON.stringify(reports, null, 2));

    console.log('\n✨ Report generation complete!');
    console.log(`📂 HTML Report: ${reportPath}`);
    console.log(`📂 JSON Report: ${jsonPath}`);
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main as generateUIStateReport };
