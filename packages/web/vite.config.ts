import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      // Use the new JSX runtime
      jsxImportSource: 'react',
      babel: {
        plugins: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/verticals': path.resolve(__dirname, './src/verticals'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@care-commons/shared-components': path.resolve(
        __dirname,
        '../shared-components/src'
      ),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [
      '@sentry-internal/node-cpu-profiler',
      '@sentry/profiling-node',
      '@sentry/node',
      '@sentry/node-core',
      '@sentry/tracing',
      '@sentry-internal/tracing',
    ],
    force: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [
        // Sentry Node.js modules
        '@sentry-internal/node-cpu-profiler',
        '@sentry/profiling-node',
        '@sentry/node',
        '@sentry/node-core',
        '@sentry/tracing',
        '@sentry-internal/tracing',
        // Native Node.js modules
        /sentry_cpu_profiler.*\.node$/,
        // Node.js built-in modules
        /^node:/,
        'crypto',
        'stream',
        'util',
        'net',
        'url',
        'fs',
        'os',
        'path',
        'buffer',
        'events',
        'process',
        'worker_threads',
        'child_process',
        'cluster',
        'querystring',
        'tls',
        'zlib',
        'perf_hooks',
        'v8',
        'dns',
        'string_decoder',
        'http',
        'https',
        'diagnostics_channel',
        'readline',
        'timers',
        'node:fs',
        'node:crypto',
        'node:stream',
        'node:util',
        'node:net',
        'node:url',
        'node:os',
        'node:path',
        'node:buffer',
        'node:events',
        'node:process',
        'node:worker_threads',
        'node:diagnostics_channel',
        'node:timers/promises',
        'node:events',
        'node:net',
        'node:tls',
        'node:readline'
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
