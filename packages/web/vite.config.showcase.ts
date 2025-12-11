import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'showcase-html-serve',
      enforce: 'pre',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // Rewrite HTML page requests to serve index-showcase.html
          const url = req.url || '';
          // Match routes but not assets - serve showcase HTML for SPA routes
          if (
            url.startsWith('/folkcare') &&
            !url.includes('.') &&
            !url.includes('/@') &&
            !url.includes('/src/') &&
            !url.includes('/node_modules')
          ) {
            req.url = '/folkcare/index-showcase.html';
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/verticals': path.resolve(__dirname, './src/verticals'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@folkcare/shared-components': path.resolve(
        __dirname,
        '../shared-components/src'
      ),
      '@folkcare/care-plans-tasks/browser': path.resolve(
        __dirname,
        '../../verticals/care-plans-tasks/dist/browser.js'
      ),
      '@folkcare/core/browser': path.resolve(
        __dirname,
        '../core/dist/browser.js'
      ),
      '@folkcare/core': path.resolve(__dirname, '../core/dist/index.js'),
    },
  },
  define: {
    'import.meta.env.VITE_SHOWCASE_MODE': JSON.stringify('true'),
  },
  build: {
    outDir: 'dist-showcase',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index-showcase.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  base: '/folkcare/', // GitHub Pages base path
});
