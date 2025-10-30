/**
 * Care Commons API Server
 * 
 * Main Express application that integrates all vertical route handlers
 */

import dotenv from "dotenv";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRequestLogger } from './middleware/request-logger';
import { authContextMiddleware } from './middleware/auth-context';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { initializeDatabase, getDatabase } from '@care-commons/core';
import { setupRoutes } from './routes/index';

dotenv.config({ path: '../../.env', quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Initialize database connection
 */
function initDb() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons4',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    max: 20,
    idleTimeoutMillis: 30000,
  };

  console.log(`Initializing database connection to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  console.log('Database config:', { ...dbConfig, password: dbConfig.password ? '[REDACTED]' : 'MISSING' });
  console.log('Password type:', typeof dbConfig.password);
  return initializeDatabase(dbConfig);
}

/**
 * Configure Express middleware
 */
function setupMiddleware() {
  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  // Request logging
  app.use(createRequestLogger());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // User context extraction
  app.use(authContextMiddleware);
}

/**
 * Setup API routes
 */
function setupApiRoutes() {
  const db = getDatabase();

  // Health check endpoint (no auth required)
  app.get('/health', async (_req, res) => {
    const dbHealthy = await db.healthCheck();
    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  });

  // Root endpoint - API overview
  app.get('/', (_req, res) => {
    res.json({
      name: 'Care Commons API',
      version: '0.1.0',
      environment: NODE_ENV,
      endpoints: {
        health: '/health',
        api: '/api',
        clients: '/api/clients',
        carePlans: '/api/care-plans',
      },
      documentation: 'http://localhost:3000/api',
    });
  });

  // API version info
  app.get('/api', (_req, res) => {
    res.json({
      name: 'Care Commons API',
      version: '0.1.0',
      environment: NODE_ENV,
    });
  });

  // Setup vertical routes
  setupRoutes(app, db);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);
}

/**
 * Start the server
 */
async function start() {
  try {
    console.log(`Starting Care Commons API Server (${NODE_ENV})`);

    // Initialize database
    const db = initDb();

    // Check database connection
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    console.log('Database connection established');

    // Setup middleware and routes
    setupMiddleware();
    setupApiRoutes();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`   Environment: ${NODE_ENV}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API docs: http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  const db = getDatabase();
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  const db = getDatabase();
  await db.close();
  process.exit(0);
});

// Start the server
start();
