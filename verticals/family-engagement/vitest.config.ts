import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'family-engagement',
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.ts', 'src/**/?(*.)+(spec|test).ts'],
  },
});
