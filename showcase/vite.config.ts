import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Order matters! More specific aliases first
      '@/core': path.resolve(__dirname, '../packages/web/src/core'),
      '@/verticals': path.resolve(__dirname, '../packages/web/src/verticals'),
      '@care-commons/shared-components': path.resolve(
        __dirname,
        '../packages/shared-components/src'
      ),
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  // GitHub Pages deployment configuration
  base: '/care-commons/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
