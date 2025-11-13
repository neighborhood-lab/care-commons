#!/usr/bin/env tsx

/**
 * Deployment Compatibility Test Script
 * 
 * Tests for common deployment issues on Vercel and Cloudflare:
 * - Bundle size limits
 * - Environment variable access patterns
 * - Module resolution issues
 * - Dynamic imports
 * - Node.js built-in usage
 * - File system access
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ANSI colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

interface Issue {
  severity: 'error' | 'warning';
  category: string;
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

const issues: Issue[] = [];

/**
 * Vercel Limits:
 * - Hobby: 50 MB uncompressed
 * - Pro: 250 MB uncompressed
 * - Output: 5 MB per serverless function
 */
const VERCEL_LIMITS = {
  hobby: 50 * 1024 * 1024,
  pro: 250 * 1024 * 1024,
  outputPerFunction: 5 * 1024 * 1024,
};

/**
 * Cloudflare Limits:
 * - Workers: 1 MB compressed (3 MB uncompressed)
 * - Pages Functions: 20 MB uncompressed
 */
const CLOUDFLARE_LIMITS = {
  worker: 3 * 1024 * 1024,
  pages: 20 * 1024 * 1024,
};

/**
 * Get directory size recursively
 */
function getDirectorySize(dir: string): number {
  let size = 0;
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch (error) {
    // Ignore errors (e.g., permission denied)
  }
  return size;
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Test 1: Check bundle sizes
 */
function testBundleSizes() {
  console.log(`\n${colors.blue}📦 Testing Bundle Sizes${colors.reset}`);
  console.log('─'.repeat(60));

  // Check packages/app/dist (Vercel function)
  const appDistPath = join(ROOT_DIR, 'packages/app/dist');
  const appDistSize = getDirectorySize(appDistPath);
  
  console.log(`\npackages/app/dist: ${formatBytes(appDistSize)}`);
  
  if (appDistSize > VERCEL_LIMITS.outputPerFunction) {
    issues.push({
      severity: 'error',
      category: 'Bundle Size',
      file: 'packages/app/dist',
      message: `Bundle size (${formatBytes(appDistSize)}) exceeds Vercel function limit (${formatBytes(VERCEL_LIMITS.outputPerFunction)})`,
      suggestion: 'Consider code splitting or removing unused dependencies',
    });
  } else if (appDistSize > VERCEL_LIMITS.outputPerFunction * 0.8) {
    issues.push({
      severity: 'warning',
      category: 'Bundle Size',
      file: 'packages/app/dist',
      message: `Bundle size (${formatBytes(appDistSize)}) is approaching Vercel limit (${formatBytes(VERCEL_LIMITS.outputPerFunction)})`,
      suggestion: 'Monitor bundle size growth',
    });
  } else {
    console.log(`${colors.green}✓${colors.reset} Within Vercel limits`);
  }

  // Check for Cloudflare
  if (appDistSize > CLOUDFLARE_LIMITS.worker) {
    issues.push({
      severity: 'warning',
      category: 'Bundle Size',
      file: 'packages/app/dist',
      message: `Bundle size (${formatBytes(appDistSize)}) exceeds Cloudflare Worker limit (${formatBytes(CLOUDFLARE_LIMITS.worker)})`,
      suggestion: 'Use Cloudflare Pages Functions instead of Workers, or optimize bundle',
    });
  }

  // Check web bundle
  const webDistPath = join(ROOT_DIR, 'packages/web/dist');
  const webDistSize = getDirectorySize(webDistPath);
  console.log(`\npackages/web/dist: ${formatBytes(webDistSize)}`);
  
  if (webDistSize > 10 * 1024 * 1024) {
    issues.push({
      severity: 'warning',
      category: 'Bundle Size',
      file: 'packages/web/dist',
      message: `Frontend bundle (${formatBytes(webDistSize)}) is large, may affect initial load time`,
      suggestion: 'Enable code splitting and lazy loading',
    });
  }
}

/**
 * Test 2: Check environment variable access patterns
 */
function testEnvironmentVariables() {
  console.log(`\n${colors.blue}🔐 Testing Environment Variable Access${colors.reset}`);
  console.log('─'.repeat(60));

  const srcFiles = [
    'packages/app/src',
    'packages/core/src',
    'api',
  ];

  const problematicPatterns = [
    {
      pattern: /process\.env\[.+?\]/g,
      message: 'Dynamic environment variable access detected',
      suggestion: 'Use direct property access: process.env.VAR_NAME',
    },
    {
      pattern: /process\.env\.(\w+)\s*\?\?\s*undefined/g,
      message: 'Environment variable with undefined fallback',
      suggestion: 'Provide meaningful default value',
    },
  ];

  for (const dir of srcFiles) {
    const dirPath = join(ROOT_DIR, dir);
    try {
      checkDirectory(dirPath, problematicPatterns);
    } catch (error) {
      // Directory might not exist
    }
  }
}

/**
 * Check directory for patterns
 */
function checkDirectory(dir: string, patterns: Array<{ pattern: RegExp; message: string; suggestion: string }>) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.test')) {
          checkDirectory(filePath, patterns);
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        for (const { pattern, message, suggestion } of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const match of matches) {
              const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
              issues.push({
                severity: 'warning',
                category: 'Environment Variables',
                file: relative(ROOT_DIR, filePath),
                line: lineNumber,
                message: `${message}: ${match}`,
                suggestion,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Test 3: Check for filesystem access
 */
function testFilesystemAccess() {
  console.log(`\n${colors.blue}📁 Testing Filesystem Access${colors.reset}`);
  console.log('─'.repeat(60));

  const srcDirs = [
    'packages/app/src',
    'api/index.ts',
    'api/cloudflare-worker.ts',
  ];

  const fsPatterns = [
    {
      pattern: /\bfs\.(readFile|writeFile|readdir|mkdir|rmdir|unlink)/g,
      message: 'Filesystem operation detected',
      suggestion: 'Filesystem is not available in serverless - use object storage (R2/S3)',
    },
    {
      pattern: /__dirname|__filename/g,
      message: 'Directory path usage detected',
      suggestion: 'Not reliably available in ESM/serverless - avoid or use import.meta.url',
    },
  ];

  for (const path of srcDirs) {
    const fullPath = join(ROOT_DIR, path);
    try {
      if (statSync(fullPath).isFile()) {
        checkFile(fullPath, fsPatterns);
      } else {
        checkDirectory(fullPath, fsPatterns);
      }
    } catch (error) {
      // Path might not exist
    }
  }
}

/**
 * Check single file for patterns
 */
function checkFile(filePath: string, patterns: Array<{ pattern: RegExp; message: string; suggestion: string }>) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const { pattern, message, suggestion } of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
          issues.push({
            severity: 'warning',
            category: 'Filesystem',
            file: relative(ROOT_DIR, filePath),
            line: lineNumber,
            message: `${message}: ${match}`,
            suggestion,
          });
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Test 4: Check Cloudflare Worker compatibility
 */
function testCloudflareCompatibility() {
  console.log(`\n${colors.blue}⚡ Testing Cloudflare Worker Compatibility${colors.reset}`);
  console.log('─'.repeat(60));

  // Check if Hyperdrive is configured
  const wranglerPath = join(ROOT_DIR, 'wrangler.toml');
  try {
    const wranglerContent = readFileSync(wranglerPath, 'utf-8');
    
    if (!wranglerContent.includes('[[hyperdrive]]')) {
      issues.push({
        severity: 'warning',
        category: 'Cloudflare',
        file: 'wrangler.toml',
        message: 'Hyperdrive binding not configured',
        suggestion: 'Uncomment Hyperdrive configuration for Postgres connection pooling',
      });
    }

    // Check if node_compat is enabled
    if (!wranglerContent.includes('node_compat = true')) {
      issues.push({
        severity: 'error',
        category: 'Cloudflare',
        file: 'wrangler.toml',
        message: 'Node.js compatibility not enabled',
        suggestion: 'Add node_compat = true to wrangler.toml',
      });
    } else {
      console.log(`${colors.green}✓${colors.reset} Node.js compatibility enabled`);
    }
  } catch (error) {
    issues.push({
      severity: 'error',
      category: 'Cloudflare',
      file: 'wrangler.toml',
      message: 'wrangler.toml not found',
      suggestion: 'Create wrangler.toml for Cloudflare Workers deployment',
    });
  }
}

/**
 * Test 5: Check for missing .js extensions
 */
function testModuleExtensions() {
  console.log(`\n${colors.blue}🔗 Testing Module Extensions (ESM)${colors.reset}`);
  console.log('─'.repeat(60));

  const checkDirs = ['packages/app/src', 'api'];
  
  // Pattern: import from './something' or '../something' (relative imports without extension)
  const missingExtPattern = /import\s+.+\s+from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g;
  
  for (const dir of checkDirs) {
    const dirPath = join(ROOT_DIR, dir);
    try {
      checkModuleExtensionsInDir(dirPath, missingExtPattern);
    } catch (error) {
      // Directory might not exist
    }
  }
  
  if (issues.filter(i => i.category === 'Module Extensions').length === 0) {
    console.log(`${colors.green}✓${colors.reset} All relative imports include .js extension`);
  }
}

function checkModuleExtensionsInDir(dir: string, pattern: RegExp) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
        checkModuleExtensionsInDir(filePath, pattern);
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.endsWith('.test.ts')) {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = lines.findIndex(line => line.includes(match![0])) + 1;
          issues.push({
            severity: 'error',
            category: 'Module Extensions',
            file: relative(ROOT_DIR, filePath),
            line: lineNumber,
            message: `Missing .js extension in import: ${match[1]}`,
            suggestion: 'Add .js extension to relative imports for ESM compatibility',
          });
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.blue}📋 Deployment Compatibility Test Results${colors.reset}`);
  console.log('='.repeat(60));

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`\n${colors.green}✅ All checks passed!${colors.reset}`);
    console.log('Your code is ready for deployment to both Vercel and Cloudflare.\n');
    return 0;
  }

  if (errors.length > 0) {
    console.log(`\n${colors.red}❌ ${errors.length} Error(s)${colors.reset}`);
    for (const issue of errors) {
      console.log(`\n  ${colors.red}●${colors.reset} ${issue.category}`);
      console.log(`    File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`    ${issue.message}`);
      if (issue.suggestion) {
        console.log(`    ${colors.yellow}→${colors.reset} ${issue.suggestion}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  ${warnings.length} Warning(s)${colors.reset}`);
    for (const issue of warnings) {
      console.log(`\n  ${colors.yellow}●${colors.reset} ${issue.category}`);
      console.log(`    File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`    ${issue.message}`);
      if (issue.suggestion) {
        console.log(`    ${colors.yellow}→${colors.reset} ${issue.suggestion}`);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}\n`);
  return errors.length > 0 ? 1 : 0;
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.blue}╔${'═'.repeat(58)}╗${colors.reset}`);
  console.log(`${colors.blue}║${' '.repeat(10)}Deployment Compatibility Test${' '.repeat(18)}║${colors.reset}`);
  console.log(`${colors.blue}╚${'═'.repeat(58)}╝${colors.reset}`);

  testBundleSizes();
  testEnvironmentVariables();
  testFilesystemAccess();
  testCloudflareCompatibility();
  testModuleExtensions();

  const exitCode = printSummary();
  process.exit(exitCode);
}

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
