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
        'src/repository/**',
        'src/api/**',
        'src/service/**',
        'src/validation/**',
      ],
      thresholds: {
        branches: 60,
        functions: 90,
        lines: 85,
        statements: 85,
      },
    },
  },
  esbuild: {
    target: 'es2020',
  },
});
