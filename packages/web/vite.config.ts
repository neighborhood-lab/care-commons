import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ignore-node-modules',
      enforce: 'pre',
      resolveId(id, importer) {
        // Intercept any Sentry profiler imports
        if (id.includes('@sentry-internal/node-cpu-profiler') ||
            (importer && importer.includes('@sentry-internal/node-cpu-profiler'))) {
          return '\0sentry-profiler-stub';
        }
        if (id === 'node:crypto' || id === 'crypto') {
          return '\0crypto-stub';
        }
        if (id === 'node:stream' || id === 'stream') {
          return '\0stream-stub';
        }
        if (id === 'node:buffer' || id === 'buffer') {
          return '\0buffer-stub';
        }
        if (id === 'node:util' || id === 'util') {
          return '\0util-stub';
        }
        if (id === 'node:worker_threads' || id === 'worker_threads') {
          return '\0worker-threads-stub';
        }
        return null;
      },
      load(id) {
        if (id === '\0sentry-profiler-stub') {
          return 'export default {}';
        }
        if (id === '\0crypto-stub') {
          return `
            export const randomBytes = () => new Uint8Array(32);
            export const randomUUID = () => '00000000-0000-0000-0000-000000000000';
            export const pbkdf2Sync = () => new Uint8Array(32);
            export const createHash = () => ({ update: () => ({ digest: () => '' }) });
            export const createHmac = () => ({ update: () => ({ digest: () => '' }) });
            export const scrypt = (pwd, salt, keylen, cb) => cb(null, Buffer.alloc(keylen));
            export const scryptSync = () => Buffer.alloc(32);
            export default { randomBytes, randomUUID, pbkdf2Sync, createHash, createHmac, scrypt, scryptSync };
          `;
        }
        if (id === '\0stream-stub') {
          return 'export default {};';
        }
        if (id === '\0buffer-stub') {
          return 'export const Buffer = { from: () => ({}), alloc: () => ({}) }; export default { Buffer };';
        }
        if (id === '\0util-stub') {
          return 'export const format = (...args) => args.join(" "); export default { format };';
        }
        if (id === '\0worker-threads-stub') {
          return 'export const isMainThread = true; export const threadId = 0; export default { isMainThread, threadId };';
        }
        // Also handle direct file loads from the profiler package
        if (id.includes('@sentry-internal/node-cpu-profiler')) {
          return 'export default {}';
        }
        // Also handle Sentry node-core imports
        if (id.includes('@sentry/node-core') || id.includes('@sentry/node') || id.includes('@sentry/profiling-node')) {
          return 'export default {}; export const init = () => {}; export const captureException = () => {};';
        }
        return null;
      },
    },
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
    exclude: ['@sentry-internal/node-cpu-profiler'],
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
      ignore: ['@sentry-internal/node-cpu-profiler'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
