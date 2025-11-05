#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';

// Colors for output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

interface VercelConfig {
  version: number;
  regions?: string[];
  functions?: Record<string, { includeFiles?: string }>;
  rewrites?: Array<{ source: string; destination: string }>;
  headers?: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
  github?: { enabled: boolean; autoAlias?: boolean; silent?: boolean };
  cleanUrls?: boolean;
  trailingSlash?: boolean;
}

const configPath = path.join(process.cwd(), 'vercel.json');

// Check if file exists
if (!fs.existsSync(configPath)) {
  console.error(`${COLORS.red}❌ vercel.json not found at: ${configPath}${COLORS.reset}`);
  process.exit(1);
}

// Read configuration
let config: VercelConfig;
try {
  const configContent = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configContent);
} catch (error) {
  console.error(`${COLORS.red}❌ Failed to parse vercel.json:${COLORS.reset}`, error);
  process.exit(1);
}

console.log(`${COLORS.green}🔍 Vercel Configuration Validation${COLORS.reset}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();

// Validation checks
interface Check {
  name: string;
  check: () => boolean;
  error: string;
  severity: 'error' | 'warning';
}

const checks: Check[] = [
  {
    name: 'Vercel version 2',
    check: () => config.version === 2,
    error: 'Vercel version should be 2',
    severity: 'error',
  },
  {
    name: 'GitHub auto-deploy disabled',
    check: () => config.github?.enabled === false,
    error: 'GitHub auto-deploy should be disabled to prevent rate limiting',
    severity: 'error',
  },
  {
    name: 'Health endpoint rewrite',
    check: () => {
      return (
        config.rewrites?.some(
          (r) => r.source === '/health' && r.destination === '/api'
        ) ?? false
      );
    },
    error: 'Health endpoint rewrite missing',
    severity: 'error',
  },
  {
    name: 'API path rewrites',
    check: () => {
      return (
        config.rewrites?.some((r) => r.source === '/api/:path*') ?? false
      );
    },
    error: 'API path rewrites missing',
    severity: 'error',
  },
  {
    name: 'SPA fallback',
    check: () => {
      return (
        config.rewrites?.some(
          (r) => r.source === '/(.*)' && r.destination === '/index.html'
        ) ?? false
      );
    },
    error: 'SPA fallback rewrite missing',
    severity: 'warning',
  },
  {
    name: 'Security headers on API routes',
    check: () => {
      const apiHeaders = config.headers?.find((h) => h.source === '/api/(.*)');
      if (!apiHeaders) return false;

      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
      ];

      return requiredHeaders.every((headerKey) =>
        apiHeaders.headers.some((h) => h.key === headerKey)
      );
    },
    error: 'Missing security headers on API routes',
    severity: 'warning',
  },
  {
    name: 'Regions configured',
    check: () => config.regions !== undefined && config.regions.length > 0,
    error: 'No regions configured (Vercel will use default)',
    severity: 'warning',
  },
  {
    name: 'Functions configuration',
    check: () => {
      return config.functions !== undefined;
    },
    error: 'No functions configuration defined',
    severity: 'warning',
  },
];

// Run checks
let errorCount = 0;
let warningCount = 0;

for (const check of checks) {
  try {
    if (check.check()) {
      console.log(`${COLORS.green}✅ ${check.name}${COLORS.reset}`);
    } else {
      if (check.severity === 'error') {
        console.log(`${COLORS.red}❌ ${check.name}${COLORS.reset}`);
        console.log(`   ${COLORS.red}${check.error}${COLORS.reset}`);
        errorCount++;
      } else {
        console.log(`${COLORS.yellow}⚠️  ${check.name}${COLORS.reset}`);
        console.log(`   ${COLORS.yellow}${check.error}${COLORS.reset}`);
        warningCount++;
      }
    }
  } catch (error) {
    console.log(
      `${COLORS.red}❌ ${check.name} (error during check)${COLORS.reset}`
    );
    console.error(error);
    errorCount++;
  }
}

console.log();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Summary
if (errorCount === 0 && warningCount === 0) {
  console.log(`${COLORS.green}✅ Vercel configuration is valid${COLORS.reset}`);
  process.exit(0);
} else {
  const summary = [];
  if (errorCount > 0) {
    summary.push(`${errorCount} error(s)`);
  }
  if (warningCount > 0) {
    summary.push(`${warningCount} warning(s)`);
  }

  if (errorCount > 0) {
    console.log(
      `${COLORS.red}❌ Validation failed: ${summary.join(', ')}${COLORS.reset}`
    );
    process.exit(1);
  } else {
    console.log(
      `${COLORS.yellow}⚠️  Validation completed with warnings: ${summary.join(', ')}${COLORS.reset}`
    );
    process.exit(0);
  }
}
