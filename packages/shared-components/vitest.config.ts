import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'shared-components',
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}', 'src/**/?(*.)+(spec|test).{ts,tsx}'],
    maxConcurrency: 1,
    pool: 'vmThreads',
  },
});
