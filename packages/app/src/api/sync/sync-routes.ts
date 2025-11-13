/**
 * Sync API Routes
 * 
 * Express routes for offline-first synchronization.
 */

import { Router } from 'express';
import type { Database } from '@care-commons/core';
import { AuthMiddleware } from '@care-commons/core';
import { createSyncHandlers } from './sync-handlers';
import { syncLimiter } from '../../middleware/rate-limit';

export function createSyncRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);
  const syncHandlers = createSyncHandlers(db);

  // All sync routes require authentication
  router.use(authMiddleware.requireAuth);

  /**
   * Pull changes from server
   * GET /api/sync/pull?lastPulledAt=<timestamp>&entities=VISIT,TASK&organizationId=<uuid>
   */
  router.get('/pull', syncLimiter as any, syncHandlers.handlePullChanges);

  /**
   * Push local changes to server
   * POST /api/sync/push
   * Body: { changes: [...], deviceId: "...", timestamp: 123, organizationId: "..." }
   */
  router.post('/push', syncLimiter as any, syncHandlers.handlePushChanges);

  /**
   * Get sync status
   * GET /api/sync/status
   */
  router.get('/status', syncHandlers.handleSyncStatus);

  return router;
}
