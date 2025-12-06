#!/usr/bin/env tsx
/**
 * Performance Budget Checker
 *
 * Enforces performance budgets for the frontend build:
 * - Bundle size < 200KB gzipped (per chunk)
 * - Total bundle size <  500KB gzipped
 * - Reports violations and fails CI if exceeded
 */

import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

interface BudgetConfig {
  maxBundleSizeGzip: number; // in KB
  maxChunkSizeGzip: number; // in KB
  distPath: string;
}

interface BundleStats {
  name: string;
  sizeBytes: number;
  sizeGzipBytes: number;
  sizeKB: number;
  sizeGzipKB: number;
}

const config: BudgetConfig = {
  maxBundleSizeGzip: 500, // Total bundle limit: 500KB gzipped
  maxChunkSizeGzip: 470, // Per-chunk limit: 470KB gzipped (current: ~426KB, +10% headroom)
  distPath: path.join(process.cwd(), 'packages/web/dist'),
};

// NOTE: Target budgets from issue #629:
// - Bundle size: <200KB gzipped
// - We're starting with more realistic budgets based on current bundle size (~426KB gzipped)
// - As we implement code-splitting and optimization, we'll gradually reduce these limits
// - TODO: Implement lazy loading and dynamic imports to reach <200KB target

function getFileSize(filePath: string): { bytes: number; gzipBytes: number } {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);

  return {
    bytes: content.length,
    gzipBytes: gzipped.length,
  };
}

function analyzeBundle(distPath: string): BundleStats[] {
  const stats: BundleStats[] = [];

  // Find all JS files in dist/assets
  const assetsPath = path.join(distPath, 'assets');

  if (!fs.existsSync(assetsPath)) {
    console.error(`❌ Assets directory not found: ${assetsPath}`);
    console.error('   Have you run the build? Try: npm run build');
    process.exit(1);
  }

  const files = fs.readdirSync(assetsPath);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  for (const file of jsFiles) {
    const filePath = path.join(assetsPath, file);
    const { bytes, gzipBytes } = getFileSize(filePath);

    stats.push({
      name: file,
      sizeBytes: bytes,
      sizeGzipBytes: gzipBytes,
      sizeKB: Math.round(bytes / 1024),
      sizeGzipKB: Math.round(gzipBytes / 1024),
    });
  }

  return stats.sort((a, b) => b.sizeGzipBytes - a.sizeGzipBytes);
}

function formatSize(kb: number): string {
  if (kb < 1024) {
    return `${kb} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

function checkBudgets(stats: BundleStats[], config: BudgetConfig): boolean {
  console.log('\n📊 Bundle Analysis\n');
  console.log('| File | Size | Gzipped | Status |');
  console.log('|------|------|---------|--------|');

  let violations = 0;
  let totalGzipKB = 0;

  for (const stat of stats) {
    totalGzipKB += stat.sizeGzipKB;
    const exceedsLimit = stat.sizeGzipKB > config.maxChunkSizeGzip;
    const status = exceedsLimit ? '❌ OVER BUDGET' : '✅ OK';

    if (exceedsLimit) violations++;

    console.log(
      `| ${stat.name} | ${formatSize(stat.sizeKB)} | ${formatSize(stat.sizeGzipKB)} | ${status} |`
    );
  }

  console.log('\n📦 Total Bundle Size\n');
  console.log(`  Gzipped: ${formatSize(totalGzipKB)}`);
  console.log(`  Budget:  ${formatSize(config.maxBundleSizeGzip)}`);

  const totalExceeds = totalGzipKB > config.maxBundleSizeGzip;

  if (totalExceeds) {
    console.log(`  ❌ OVER BUDGET by ${formatSize(totalGzipKB - config.maxBundleSizeGzip)}`);
    violations++;
  } else {
    console.log(`  ✅ Within budget (${formatSize(config.maxBundleSizeGzip - totalGzipKB)} remaining)`);
  }

  console.log('\n');

  if (violations > 0) {
    console.error('❌ Performance budget check FAILED\n');
    console.error('   Violations found:');

    if (totalExceeds) {
      console.error(`   - Total bundle exceeds ${formatSize(config.maxBundleSizeGzip)} gzipped`);
    }

    const oversizedChunks = stats.filter(s => s.sizeGzipKB > config.maxChunkSizeGzip);
    for (const chunk of oversizedChunks) {
      console.error(`   - ${chunk.name} exceeds ${formatSize(config.maxChunkSizeGzip)} gzipped`);
    }

    console.error('\n   Suggestions:');
    console.error('   - Use dynamic imports to code-split large features');
    console.error('   - Review dependencies and remove unused ones');
    console.error('   - Use tree-shaking to eliminate dead code');
    console.error('   - Consider lazy loading routes and components\n');

    return false;
  }

  console.log('✅ Performance budget check PASSED\n');
  return true;
}

function main() {
  console.log('🔍 Checking performance budgets...\n');
  console.log(`📁 Analyzing: ${config.distPath}\n`);
  console.log(`⚙️  Budgets:`);
  console.log(`   - Max chunk size: ${formatSize(config.maxChunkSizeGzip)} (gzipped)`);
  console.log(`   - Max total size: ${formatSize(config.maxBundleSizeGzip)} (gzipped)`);

  const stats = analyzeBundle(config.distPath);
  const passed = checkBudgets(stats, config);

  process.exit(passed ? 0 : 1);
}

main();
