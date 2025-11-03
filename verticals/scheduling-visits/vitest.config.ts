import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'scheduling-visits',
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/?(*.)+(spec|test).ts'],
  },
  esbuild: {
    target: 'es2020',
  },
});