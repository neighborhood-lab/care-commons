import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codecovVitePlugin } from '@codecov/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

const isAnalyze = process.env.ANALYZE === 'true';

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
    // PWA plugin for offline functionality
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Folk Care',
        short_name: 'Folk Care',
        description: 'Shared care software for home care agencies',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Increase max file size to cache the large JS bundle
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        // Cache API responses
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\..*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true
      },
      devOptions: {
        enabled: true, // Enable in development for testing
        type: 'module'
      }
    }),
    // Codecov bundle analysis - must be placed after all other plugins
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'folkcare-web',
      uploadToken: process.env.CODECOV_TOKEN,
      // Only upload in CI or when explicitly enabled
      uploadOverrides: {
        sha: process.env.GITHUB_SHA,
        branch: process.env.GITHUB_REF_NAME,
      },
    }),
    // Bundle visualization - only enabled when ANALYZE=true
    // Run: ANALYZE=true npm run build
    ...(isAnalyze
      ? [
          visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap', // or 'sunburst', 'network'
          }),
        ]
      : []),
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
      // Force packages to use browser exports
      '@folkcare/core/browser': path.resolve(
        __dirname,
        '../core/dist/browser.js'
      ),
      '@folkcare/core': path.resolve(
        __dirname,
        '../core/dist/browser.js'
      ),
      '@folkcare/care-plans-tasks/browser': path.resolve(
        __dirname,
        '../../verticals/care-plans-tasks/dist/browser.js'
      ),
      '@folkcare/care-plans-tasks': path.resolve(
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
    force: true,
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.WEB_PORT ?? '5173', 10),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT ?? '3001'}`,
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
