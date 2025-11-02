/**
 * Vercel Serverless Function Entry Point
 * 
 * This wraps the Express app to work with Vercel's serverless functions.
 * For Vercel deployments, this becomes the main entry point.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createRequestLogger } from '../packages/app/dist/middleware/request-logger.js';
import { authContextMiddleware } from '../packages/app/dist/middleware/auth-context.js';
import { errorHandler, notFoundHandler } from '../packages/app/dist/middleware/error-handler.js';
import { initializeDatabase, getDatabase } from '@care-commons/core';
import { setupRoutes } from '../packages/app/dist/routes/index.js';

// Load environment variables
dotenv.config();

const app = express();

/**
 * Initialize database connection with Vercel-compatible settings
 */
async function initDb() {
  // Use DATABASE_URL for Vercel deployments (set in environment variables)
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for connection');
    return initializeDatabase({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for most cloud databases
      max: 10, // Lower connection pool for serverless
      idleTimeoutMillis: 10000, // Shorter timeout for serverless
      connectionTimeoutMillis: 5000,
    });
  }

  // Fallback to individual parameters (local development)
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons4',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    max: 10,
    idleTimeoutMillis: 10000,
  };

  console.log(`Initializing database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  return initializeDatabase(dbConfig);
}

/**
 * Configure Express middleware
 */
function setupMiddleware() {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API
  }));

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

  // Auth context
  app.use(authContextMiddleware);
}

/**
 * Health check endpoint
 */
app.get('/health', async (_req, res) => {
  try {
    const db = getDatabase();
    
    // Simple database connectivity check
    await db.raw('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      database: {
        status: 'connected'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

/**
 * Initialize the application
 */
let initialized = false;

async function initialize() {
  if (initialized) return;

  try {
    console.log('Initializing serverless function...');
    
    // Initialize database
    await initDb();
    console.log('✅ Database initialized');

    // Setup middleware
    setupMiddleware();
    console.log('✅ Middleware configured');

    // Setup routes
    setupRoutes(app);
    console.log('✅ Routes configured');

    // Error handlers (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);

    initialized = true;
    console.log('✅ Serverless function ready');
  } catch (error) {
    console.error('❌ Failed to initialize:', error);
    throw error;
  }
}

/**
 * Vercel serverless function handler
 * 
 * This function is called for every request. We initialize once and reuse
 * the Express app across requests (warm starts).
 */
export default async function handler(req, res) {
  try {
    // Initialize on first request (or after cold start)
    await initialize();

    // Handle the request with Express
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    
    // Return error response
    return res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
}

/**
 * Cleanup on function termination
 */
process.on('beforeExit', async () => {
  try {
    const db = getDatabase();
    await db.destroy();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});
