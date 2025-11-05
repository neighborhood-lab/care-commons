import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'family-engagement-transparency-comms',
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/?(*.)+(spec|test).ts'],
  },
});
