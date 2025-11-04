import { defineProject } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineProject({
  plugins: [react()],
  test: {
    name: 'web',
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    maxConcurrency: 1,
    pool: 'vmThreads',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/verticals': path.resolve(__dirname, './src/verticals'),
      '@/app': path.resolve(__dirname, './src/app'),
    },
  },
});
