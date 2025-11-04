/**
 * Vitest configuration for mobile package
 * 
 * Note: Testing React Native components requires special setup.
 * This config is for unit testing services and utilities.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Use 'jsdom' for React Native testing with proper setup
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.expo/',
        'ios/',
        'android/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts', // Barrel exports
        'src/features/**/*.tsx', // UI components (would need RN test environment)
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.expo',
      'ios',
      'android',
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
