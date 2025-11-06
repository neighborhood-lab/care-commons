/**
 * Metrics Routes
 *
 * Exposes Prometheus-compatible application metrics.
 * Used by monitoring systems like Prometheus, Grafana, etc.
 */

import { Router, Request, Response } from 'express';
import { register } from '@care-commons/core';

export function createMetricsRouter(): Router {
  const router = Router();

  /**
   * GET /metrics
   * Prometheus metrics endpoint
   *
   * Returns:
   *   Prometheus-formatted metrics
   */
  router.get('/', async (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  return router;
}
