/**
 * Health Check Routes
 *
 * Provides health check endpoint for monitoring and development
 */

import { Router } from 'express';
import type { Database } from '@care-commons/core';

export function createHealthRouter(db: Database): Router {
  const router = Router();

  router.get('/health', async (req, res) => {
    try {
      // Check database connection
      await db.query('SELECT 1');

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
