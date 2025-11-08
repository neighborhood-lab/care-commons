import { defineProject } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineProject({
  plugins: [react()],
  test: {
    name: 'web',
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    maxConcurrency: 1,
    pool: 'threads', // Use threads pool instead of vmThreads to avoid .node file issues
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.node',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/verticals': path.resolve(__dirname, './src/verticals'),
      '@/app': path.resolve(__dirname, './src/app'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
  optimizeDeps: {
    // Exclude all Sentry-related modules from optimization
    exclude: [
      '@sentry-internal/node-cpu-profiler',
      '@sentry/profiling-node',
      '@sentry/node',
      '@sentry/node-core',
      '@sentry/tracing',
      '@sentry-internal/tracing',
      'sentry_cpu_profiler',
    ],
    include: [],
  },
});
