import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'incident-risk-reporting',
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.ts', 'src/**/?(*.)+(spec|test).ts'],
  },
});
