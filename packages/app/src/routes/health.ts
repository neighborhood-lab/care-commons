/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring application health, readiness, and liveness.
 * Used by Kubernetes, load balancers, and monitoring systems.
 */

import { Router, Request, Response } from 'express';
import { Database, logger } from '@care-commons/core';

export function createHealthRouter(db: Database): Router {
  const router = Router();

  /**
   * GET /health
   * Simple health check
   *
   * Returns:
   *   - status: 'ok'
   *   - timestamp: Current timestamp
   */
  router.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * GET /health/detailed
   * Detailed health check with dependencies
   *
   * Returns:
   *   - status: 'healthy' | 'degraded'
   *   - timestamp: Current timestamp
   *   - uptime: Process uptime in seconds
   *   - environment: NODE_ENV value
   *   - version: Application version
   *   - checks: Health status of dependencies
   */
  router.get('/detailed', async (_req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      checks: {
        database: 'unknown'
      }
    };

    // Check database
    try {
      const isHealthy = await db.healthCheck();
      health.checks.database = isHealthy === true ? 'healthy' : 'unhealthy';
      if (isHealthy !== true) {
        health.status = 'degraded';
      }
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  /**
   * GET /health/ready
   * Readiness check (for Kubernetes)
   *
   * Indicates whether the application is ready to accept traffic.
   * Checks critical dependencies like database connectivity.
   *
   * Returns:
   *   - ready: boolean
   */
  router.get('/ready', async (_req: Request, res: Response) => {
    try {
      const isHealthy = await db.healthCheck();
      if (isHealthy === true) {
        res.status(200).json({ ready: true });
      } else {
        res.status(503).json({ ready: false });
      }
    } catch (error) {
      logger.error({ error }, 'Readiness check failed');
      res.status(503).json({ ready: false });
    }
  });

  /**
   * GET /health/live
   * Liveness check (for Kubernetes)
   *
   * Indicates whether the application is alive.
   * Used to determine if the container should be restarted.
   *
   * Returns:
   *   - alive: boolean
   */
  router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({ alive: true });
  });

  return router;
}
