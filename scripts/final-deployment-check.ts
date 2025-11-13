#!/usr/bin/env node
/**
 * Final Deployment Compatibility Check
 * Focuses on REAL issues, not false positives
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

interface Issue {
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
  file: string;
  line: number;
  issue: string;
  fix: string;
}

const issues: Issue[] = [];

function checkFile(filePath: string, baseDir: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = filePath.replace(baseDir + '/', '');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // CRITICAL: process.exit() outside of if (!serverless) blocks
    if (/process\.exit\s*\(/.test(line)) {
      // Check if it's wrapped in serverless check (look back 10 lines)
      const contextStart = Math.max(0, i - 10);
      const context = lines.slice(contextStart, i + 1).join('\n');
      
      if (!/if\s*\([^)]*VERCEL|AWS_LAMBDA|WORKER_NAME/.test(context)) {
        issues.push({
          severity: 'CRITICAL',
          file: relativePath,
          line: lineNum,
          issue: 'process.exit() will terminate serverless container',
          fix: 'Wrap in if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) or throw error instead'
        });
      }
    }

    // CRITICAL: Synchronous filesystem in non-script files
    if (/\b(readFileSync|writeFileSync|mkdirSync|rmdirSync)\s*\(/.test(line)) {
      if (!relativePath.includes('/scripts/') && !relativePath.includes('.test.ts')) {
        issues.push({
          severity: 'CRITICAL',
          file: relativePath,
          line: lineNum,
          issue: 'Synchronous filesystem operations not available in serverless',
          fix: 'Remove or move to build-time script'
        });
      }
    }

    // ERROR: setInterval without clearInterval (memory leak)
    if (/setInterval\s*\(/.test(line)) {
      // Check if there's a clearInterval in the file
      if (!content.includes('clearInterval')) {
        // Also check if it's inside a serverless guard
        const contextStart = Math.max(0, i - 5);
        const context = lines.slice(contextStart, i + 5).join('\n');
        
        if (!/if\s*\(!.*serverless|!.*VERCEL|!.*WORKER/.test(context)) {
          issues.push({
            severity: 'ERROR',
            file: relativePath,
            line: lineNum,
            issue: 'setInterval without cleanup creates memory leak in serverless',
            fix: 'Add clearInterval or skip setInterval in serverless environments'
          });
        }
      }
    }

    // WARNING: Large connection pools (max > 2)
    const poolMatch = line.match(/max\s*:\s*(\d+)/);
    if (poolMatch && parseInt(poolMatch[1]) > 5) {
      // Check if it's conditional on serverless
      const contextStart = Math.max(0, i - 10);
      const context = lines.slice(contextStart, i + 1).join('\n');
      
      if (!/isServerless|VERCEL|LAMBDA/.test(context)) {
        issues.push({
          severity: 'WARNING',
          file: relativePath,
          line: lineNum,
          issue: `Connection pool max: ${poolMatch[1]} is too high for serverless (should be 1-2)`,
          fix: 'Use max: 1 for serverless or make it conditional on environment'
        });
      }
    }
  }
}

function scanDir(dir: string, baseDir: string, excludes: string[]): void {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relativePath = fullPath.replace(baseDir + '/', '');
    
    if (excludes.some(ex => relativePath.includes(ex))) continue;
    
    if (statSync(fullPath).isDirectory()) {
      scanDir(fullPath, baseDir, excludes);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      checkFile(fullPath, baseDir);
    }
  }
}

const baseDir = process.cwd();
const scanPaths = ['packages/app/src', 'packages/core/src', 'verticals'];
const excludes = ['node_modules', 'dist', '__tests__', '/scripts/', 'e2e/', 'showcase/'];

console.log('🔍 Final Deployment Compatibility Check\n');

for (const path of scanPaths) {
  scanDir(join(baseDir, path), baseDir, excludes);
}

if (issues.length === 0) {
  console.log('✅ No deployment-blocking issues found!\n');
  process.exit(0);
}

const critical = issues.filter(i => i.severity === 'CRITICAL');
const errors = issues.filter(i => i.severity === 'ERROR');
const warnings = issues.filter(i => i.severity === 'WARNING');

if (critical.length > 0) {
  console.log(`🔴 CRITICAL: ${critical.length} issue(s)\n${'='.repeat(60)}`);
  for (const issue of critical) {
    console.log(`\n${issue.file}:${issue.line}`);
    console.log(`  Problem: ${issue.issue}`);
    console.log(`  Fix: ${issue.fix}`);
  }
}

if (errors.length > 0) {
  console.log(`\n❌ ERROR: ${errors.length} issue(s)\n${'='.repeat(60)}`);
  for (const issue of errors) {
    console.log(`\n${issue.file}:${issue.line}`);
    console.log(`  Problem: ${issue.issue}`);
    console.log(`  Fix: ${issue.fix}`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNING: ${warnings.length} issue(s)\n${'='.repeat(60)}`);
  for (const issue of warnings) {
    console.log(`\n${issue.file}:${issue.line}`);
    console.log(`  Problem: ${issue.issue}`);
    console.log(`  Fix: ${issue.fix}`);
  }
}

console.log(`\n📊 Total: ${issues.length} issues (${critical.length} critical, ${errors.length} errors, ${warnings.length} warnings)`);
process.exit(critical.length + errors.length);
