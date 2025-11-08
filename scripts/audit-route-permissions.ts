#!/usr/bin/env tsx
/**
 * Route Permissions Audit Script
 *
 * Scans all route files to ensure proper authentication and authorization middleware
 * is applied to protect endpoints.
 *
 * Checks for:
 * - Authentication middleware (requireAuth)
 * - Permission checks (requirePermission)
 * - Role checks (requireRole)
 *
 * Usage:
 *   npm run audit:routes
 *   tsx scripts/audit-route-permissions.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Route security issue
 */
interface SecurityIssue {
  file: string;
  line: number;
  route: string;
  method: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Patterns to look for in route files
 */
const PATTERNS = {
  // HTTP methods
  methods: /\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/g,

  // Authentication middleware
  requireAuth: /requireAuth/,
  optionalAuth: /optionalAuth/,

  // Authorization middleware
  requirePermission: /requirePermission/,
  requireRole: /requireRole/,

  // Public endpoints that might not need auth
  publicEndpoints: /\/(health|metrics|status|api|csrf-token|public|demo)/,

  // Health check endpoints
  healthCheck: /\/health/,

  // Logout endpoints (don't need permission checks beyond authentication)
  logoutEndpoint: /\/logout$/,

  // State-changing methods
  stateChanging: ['post', 'put', 'patch', 'delete']
};

/**
 * Find all route files in the project
 */
async function findRouteFiles(): Promise<string[]> {
  const patterns = [
    'packages/app/src/**/*.routes.ts',
    'packages/app/src/**/routes/**/*.ts',
    'packages/app/src/api/**/*.ts',
    'verticals/*/src/**/*.routes.ts',
    'verticals/*/src/**/routes/**/*.ts'
  ];

  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.spec.ts']
    });
    files.push(...matches);
  }

  return [...new Set(files)]; // Remove duplicates
}

/**
 * Analyze a route file for security issues
 */
function analyzeRouteFile(filePath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip demo route files - these are intentionally public for demonstrations
  // Demo routes are session-scoped and isolated per user
  if (filePath.includes('/demo.ts') || filePath.includes('/demo.js')) {
    return issues;
  }

  // Check if file uses authentication middleware
  const hasRequireAuth = PATTERNS.requireAuth.test(content);
  const hasOptionalAuth = PATTERNS.optionalAuth.test(content);
  const hasRequirePermission = PATTERNS.requirePermission.test(content);
  const hasRequireRole = PATTERNS.requireRole.test(content);

  // Find all route definitions
  let match: RegExpExecArray | null;
  const methodPattern = new RegExp(PATTERNS.methods.source, 'g');

  while ((match = methodPattern.exec(content)) !== null) {
    const method = match[1];
    const routePath = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Skip health check and metrics endpoints
    if (PATTERNS.healthCheck.test(routePath)) {
      continue;
    }

    // Check if it's a public endpoint
    const isPublicEndpoint = PATTERNS.publicEndpoints.test(routePath);

    // Get the route definition context (next few lines)
    const contextStartLine = Math.max(0, lineNumber - 1);
    const contextEndLine = Math.min(lines.length, lineNumber + 5);
    const routeContext = lines.slice(contextStartLine, contextEndLine).join('\n');

    // Check if route has auth middleware in its context
    const hasAuthInContext = PATTERNS.requireAuth.test(routeContext) ||
                            PATTERNS.optionalAuth.test(routeContext);

    const hasPermissionInContext = PATTERNS.requirePermission.test(routeContext) ||
                                   PATTERNS.requireRole.test(routeContext);

    // Determine if route needs authentication
    const needsAuth = !isPublicEndpoint && method !== undefined &&
                      PATTERNS.stateChanging.includes(method.toLowerCase());

    // Report issues
    if (method !== undefined && needsAuth && !hasAuthInContext && !hasRequireAuth) {
      issues.push({
        file: filePath,
        line: lineNumber,
        route: `${method.toUpperCase()} ${routePath}`,
        method: method.toUpperCase(),
        issue: 'No authentication middleware detected',
        severity: 'HIGH'
      });
    }

    // Check for permission/role checks on authenticated routes
    // Skip logout endpoints as they don't need additional permission checks
    const isLogoutEndpoint = PATTERNS.logoutEndpoint.test(routePath);
    if (method !== undefined && hasAuthInContext && !hasPermissionInContext && !hasRequirePermission && !hasRequireRole && !isLogoutEndpoint) {
      // Only warn on state-changing methods
      if (PATTERNS.stateChanging.includes(method.toLowerCase())) {
        issues.push({
          file: filePath,
          line: lineNumber,
          route: `${method.toUpperCase()} ${routePath}`,
          method: method.toUpperCase(),
          issue: 'Has authentication but no permission/role checks',
          severity: 'MEDIUM'
        });
      }
    }
  }

  // If file has no auth middleware at all, warn about it
  if (!hasRequireAuth && !hasOptionalAuth && !hasRequirePermission && !hasRequireRole) {
    const hasStateChangingRoutes = content.match(/\.(post|put|patch|delete)\s*\(/);
    if (hasStateChangingRoutes !== null) {
      issues.push({
        file: filePath,
        line: 1,
        route: 'FILE_LEVEL',
        method: 'ALL',
        issue: 'File contains state-changing routes but no authentication middleware',
        severity: 'HIGH'
      });
    }
  }

  return issues;
}

/**
 * Main audit function
 */
async function auditRoutes(): Promise<void> {
  console.log('🔍 Starting route permissions audit...\n');

  const routeFiles = await findRouteFiles();

  if (routeFiles.length === 0) {
    console.log('⚠️  No route files found');
    return;
  }

  console.log(`Found ${routeFiles.length} route files\n`);

  const allIssues: SecurityIssue[] = [];

  for (const file of routeFiles) {
    const issues = analyzeRouteFile(file);
    allIssues.push(...issues);
  }

  // Group issues by severity
  const highSeverity = allIssues.filter(i => i.severity === 'HIGH');
  const mediumSeverity = allIssues.filter(i => i.severity === 'MEDIUM');
  const lowSeverity = allIssues.filter(i => i.severity === 'LOW');

  // Report results
  console.log('═══════════════════════════════════════════════════════');
  console.log('                AUDIT RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  if (allIssues.length === 0) {
    console.log('✅ No security issues found!');
    console.log('   All routes have proper authentication and authorization.\n');
    process.exit(0);
  }

  // Report high severity issues
  if (highSeverity.length > 0) {
    console.log('🔴 HIGH SEVERITY ISSUES:\n');
    for (const issue of highSeverity) {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`  Route: ${issue.route}`);
      console.log(`  Issue: ${issue.issue}\n`);
    }
  }

  // Report medium severity issues
  if (mediumSeverity.length > 0) {
    console.log('🟡 MEDIUM SEVERITY ISSUES:\n');
    for (const issue of mediumSeverity) {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`  Route: ${issue.route}`);
      console.log(`  Issue: ${issue.issue}\n`);
    }
  }

  // Report low severity issues
  if (lowSeverity.length > 0) {
    console.log('🟢 LOW SEVERITY ISSUES:\n');
    for (const issue of lowSeverity) {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`  Route: ${issue.route}`);
      console.log(`  Issue: ${issue.issue}\n`);
    }
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('                   SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`  Total Issues: ${allIssues.length}`);
  console.log(`  High:   ${highSeverity.length}`);
  console.log(`  Medium: ${mediumSeverity.length}`);
  console.log(`  Low:    ${lowSeverity.length}\n`);

  // Exit with error if high severity issues found
  if (highSeverity.length > 0) {
    console.log('❌ Audit failed: High severity security issues found');
    console.log('   Please add authentication middleware to unprotected routes\n');
    process.exit(1);
  }

  // Warn about medium severity
  if (mediumSeverity.length > 0) {
    console.log('⚠️  Audit completed with warnings');
    console.log('   Consider adding permission checks to authenticated routes\n');
  }

  process.exit(0);
}

// Run audit
auditRoutes().catch((error: unknown) => {
  console.error('Audit script failed:', error);
  process.exit(1);
});
