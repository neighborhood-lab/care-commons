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
      // Force packages to use browser exports
      '@care-commons/core/browser': path.resolve(
        __dirname,
        '../core/dist/browser.js'
      ),
      '@care-commons/core': path.resolve(
        __dirname,
        '../core/dist/browser.js'
      ),
      '@care-commons/care-plans-tasks/browser': path.resolve(
        __dirname,
        '../../verticals/care-plans-tasks/dist/browser.js'
      ),
      '@care-commons/care-plans-tasks': path.resolve(
        __dirname,
        '../../verticals/care-plans-tasks/dist/browser.js'
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
    esbuildOptions: {
      // Define process as an object for compatibility
      define: {
        'process.versions.node': 'undefined',
      },
    },
    // Enable dependency pre-bundling for faster startup
    entries: ['./src/main.tsx'],
  },
  server: {
    port: 5173,
    // Improved HMR configuration for reliability
    hmr: {
      overlay: true,
      // Reduce HMR connection timeout
      timeout: 5000,
    },
    // Watch configuration for better file change detection
    watch: {
      // Use polling in Docker/WSL environments
      usePolling: false,
      // Ignore node_modules and dist to reduce watcher overhead
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
    // Faster server startup
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    // Enable CORS for better development experience
    cors: true,
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
        // Sentry Node.js modules - these are server-only and should never be bundled for browser
        '@sentry/node',
        '@sentry/node-core',
        '@sentry/profiling-node',
        '@sentry-internal/node-cpu-profiler',
        '@sentry-internal/tracing',
        /sentry_cpu_profiler.*\.node$/,
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
