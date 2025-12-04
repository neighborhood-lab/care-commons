import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages deployment with custom domain (about.folk.care)
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
