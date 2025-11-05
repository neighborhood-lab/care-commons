import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  base: '/care-commons/', // GitHub Pages base path
});
