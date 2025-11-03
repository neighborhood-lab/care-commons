import { defineConfig } from 'vitest/config';

/**
 * Root Vitest configuration for the Care Commons monorepo.
 * 
 * This configuration uses the "projects" pattern to explicitly define
 * all test projects in the monorepo. This approach:
 * - Improves VS Code extension performance
 * - Provides explicit control over which projects are tested
 * - Allows running specific projects via --project flag
 * - Defines global options like coverage and reporters
 * 
 * Usage:
 *   npm test                           # Run all projects
 *   npm test -- --project core         # Run only core package tests
 *   npm test -- --project web          # Run only web package tests
 */
export default defineConfig({
  test: {
    // Global settings - these apply to all projects unless overridden
    globals: true,
    
    // Coverage configuration - applied across all projects
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    
    // Define all projects explicitly using glob patterns
    // This references each project's individual vitest.config.ts file
    projects: [
      'packages/*/vitest.config.ts',
      'verticals/*/vitest.config.ts',
    ],
  },
});
