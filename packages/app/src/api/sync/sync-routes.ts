/**
 * Sync API Routes
 * 
 * Express routes for offline-first synchronization.
 */

import { Router } from 'express';
import { handlePullChanges, handlePushChanges, handleSyncStatus } from './sync-handlers.js';
import { authMiddleware } from '@care-commons/core/middleware/auth-middleware.js';

const router = Router();

// All sync routes require authentication
router.use(authMiddleware);

/**
 * Pull changes from server
 * GET /api/sync/pull?lastPulledAt=<timestamp>&entities=VISIT,TASK&organizationId=<uuid>
 */
router.get('/pull', handlePullChanges);

/**
 * Push local changes to server
 * POST /api/sync/push
 * Body: { changes: [...], deviceId: "...", timestamp: 123, organizationId: "..." }
 */
router.post('/push', handlePushChanges);

/**
 * Get sync status
 * GET /api/sync/status
 */
router.get('/status', handleSyncStatus);

export default router;
