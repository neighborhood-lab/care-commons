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
const PORT = Number(process.env['PORT'] ?? 3000);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

/**
 * Parse DATABASE_URL into individual components
 */
function parseDatabaseUrl(url: string): { host: string; port: number; database: string; user: string; password: string; ssl: boolean } {
  // eslint-disable-next-line no-undef
  const parsed = new URL(url);
  const port = Number(parsed.port);
  return {
    host: parsed.hostname,
    port: port !== 0 ? port : 5432,
    database: parsed.pathname.slice(1), // Remove leading /
    user: parsed.username,
    password: parsed.password,
    ssl: true, // Always use SSL for cloud databases
  };
}

/**
 * Initialize database connection
 * Supports both DATABASE_URL (Vercel) and individual config (local dev)
 */
function initDb(): ReturnType<typeof initializeDatabase> {
  // Check for DATABASE_URL first (used by Vercel and other cloud platforms)
  const databaseUrl = process.env['DATABASE_URL'];
  
  if (databaseUrl !== undefined) {
    console.log('Using DATABASE_URL for database connection');
    const dbConfig = parseDatabaseUrl(databaseUrl);
    return initializeDatabase({
      ...dbConfig,
      max: NODE_ENV === 'production' ? 10 : 20, // Lower pool for serverless
      idleTimeoutMillis: NODE_ENV === 'production' ? 10000 : 30000,
    });
  }

  // Fallback to individual environment variables (local development)
  const dbPassword = process.env['DB_PASSWORD'];
  if (dbPassword === undefined) {
    throw new Error('DB_PASSWORD environment variable is required (or use DATABASE_URL)');
  }

  const dbConfig = {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? 5432),
    database: process.env['DB_NAME'] ?? 'care_commons',
    user: process.env['DB_USER'] ?? 'postgres',
    password: dbPassword,
    ssl: process.env['DB_SSL'] === 'true' ? true : false,
    max: 20,
    idleTimeoutMillis: 30000,
  };

  console.log(`Initializing database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  return initializeDatabase(dbConfig);
}

/**
 * Configure Express middleware
 */
function setupMiddleware(): void {
  // Security headers - use default secure configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS - restrict to allowed origins in production
  const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') ?? [];
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (typeof origin !== 'string') {
        callback(null, true);
        return;
      }

      // In development, allow all origins
      if (NODE_ENV === 'development') {
        callback(null, true);
        return;
      }

      // In production, only allow specified origins
      if (allowedOrigins.length === 0) {
        console.warn('⚠️  No CORS_ORIGIN configured - blocking all browser requests');
        callback(new Error('CORS not configured'), false);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
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
function setupApiRoutes(): void {
  const db = getDatabase();

  // Health check endpoint (no auth required)
  app.get('/health', async (_req, res) => {
    const dbHealthy = await db.healthCheck();
    res.status(dbHealthy === true ? 200 : 503).json({
      status: dbHealthy === true ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      database: dbHealthy === true ? 'connected' : 'disconnected',
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
 * Initialize and configure the Express app
 * This is exported for use in Vercel serverless functions
 */
export async function createApp(): Promise<express.Application> {
  try {
    console.log(`Initializing Care Commons API (${NODE_ENV})`);

    // Initialize database
    const db = initDb();

    // Check database connection
    const isHealthy = await db.healthCheck();
    if (isHealthy !== true) {
      throw new Error('Database health check failed');
    }
    console.log('✅ Database connection established');

    // Setup middleware and routes
    setupMiddleware();
    setupApiRoutes();

    console.log('✅ Express app configured');
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    throw error;
  }
}

/**
 * Start the server (for local development)
 */
async function start(): Promise<void> {
  try {
    console.log(`Starting Care Commons API Server (${NODE_ENV})`);
    
    await createApp();

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
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  void (async () => {
    const db = getDatabase();
    await db.close();
    process.exit(0);
  })();
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  void (async () => {
    const db = getDatabase();
    await db.close();
    process.exit(0);
  })();
});

// Only start the server if this file is run directly (not imported)
// This allows Vercel to import createApp() without starting a server
if (import.meta.url === `file://${process.argv[1]}`) {
  await start();
}
