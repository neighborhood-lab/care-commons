#!/usr/bin/env tsx
/**
 * E2E Test Server
 * 
 * Starts the API server in test mode for E2E testing.
 * Optimized for CI environments - no watch mode, faster startup.
 */

import { resetDatabase } from '@care-commons/core';
import { createApp } from '../packages/app/src/server.js';

const PORT = parseInt(process.env['PORT'] || '3000', 10);

async function startE2EServer() {
  console.log('🧪 Starting E2E test server...');
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env['NODE_ENV'] || 'test'}`);
  console.log(`   Database: ${process.env['DATABASE_URL'] || 'using individual env vars'}`);

  try {
    // Ensure DATABASE_URL is set (playwright.config.ts provides this)
    if (!process.env['DATABASE_URL'] && !process.env['DB_PASSWORD']) {
      throw new Error('DATABASE_URL or DB_PASSWORD environment variable required');
    }

    // Reset database instance (in case server.ts was already loaded)
    resetDatabase();

    // Create Express app (handles database initialization internally)
    console.log('🔧 Creating Express application...');
    const app = await createApp();
    console.log('✅ Application created successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log('\n✅ E2E Test Server running');
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API docs: http://localhost:${PORT}/api-docs`);
      console.log('   Ready for E2E tests!\n');
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start E2E server:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

startE2EServer();
