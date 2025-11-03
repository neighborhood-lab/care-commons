import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/?(*.)+(spec|test).ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/index.ts',
        'src/types/**',
        'src/api/**',
        'src/service/**',
        'src/repository/**',
      ],
      thresholds: {
        branches: 75,
        functions: 100,
        lines: 90,
        statements: 90,
      },
    },
  },
});
