import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
    rollupOptions: {
      external: [
        // Exclude Node.js-specific Sentry modules that have native bindings
        '@sentry/profiling-node',
        '@sentry-internal/node-cpu-profiler',
        '@sentry/node-core',
        // Exclude Node.js built-in modules that shouldn't be in browser bundle
        /^node:/,
        'worker_threads',
        'diagnostics_channel',
        'module',
        'crypto',
        'fs',
        'path',
        'os',
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
