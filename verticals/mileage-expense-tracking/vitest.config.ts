import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'mileage-expense-tracking',
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/?(*.)+(spec|test).ts'],
  },
});
