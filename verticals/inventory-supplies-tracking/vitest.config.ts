import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'inventory-supplies-tracking',
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/?(*.)+(spec|test).ts'],
  },
});
