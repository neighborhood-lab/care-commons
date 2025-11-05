/**
 * Sync API Handlers
 * 
 * HTTP handlers for offline-first synchronization endpoints.
 * These endpoints enable clients to pull server changes and push local changes.
 */

import type { Request, Response, NextFunction } from 'express';
import { getDatabase } from '@care-commons/core/db.js';
import { SyncProtocol } from '@care-commons/core/sync/sync-protocol.js';
import { z } from 'zod';

/**
 * Zod schemas for request validation
 */
const PullChangesRequestSchema = z.object({
  lastPulledAt: z.number().int().nonnegative(),
  entities: z.array(z.enum(['VISIT', 'EVV_RECORD', 'TIME_ENTRY', 'TASK', 'CLIENT', 'CAREGIVER', 'GEOFENCE'])),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  caregiverId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const PushChangesRequestSchema = z.object({
  changes: z.array(z.object({
    id: z.string(),
    entityType: z.enum(['VISIT', 'EVV_RECORD', 'TIME_ENTRY', 'TASK', 'CLIENT', 'CAREGIVER', 'GEOFENCE']),
    entityId: z.string().uuid(),
    operationType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    data: z.record(z.unknown()),
    version: z.number().int().nonnegative(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
  })),
  deviceId: z.string(),
  timestamp: z.number().int().nonnegative(),
  organizationId: z.string().uuid(),
});

/**
 * Pull changes from server
 * 
 * GET /api/sync/pull
 * 
 * Returns all changes made on the server since the client's last pull.
 * Clients should call this periodically to stay synchronized.
 */
export async function handlePullChanges(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request
    const result = PullChangesRequestSchema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues,
      });
      return;
    }

    const request = result.data;

    // Verify user has access to the organization
    const userId = req.user?.id;
    const userOrgId = req.user?.organizationId;
    
    if (!userId || userOrgId !== request.organizationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this organization',
      });
      return;
    }

    // Get database and sync protocol
    const db = getDatabase();
    const syncProtocol = new SyncProtocol(db);

    // Pull changes
    const response = await syncProtocol.pullChanges(request);

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Push local changes to server
 * 
 * POST /api/sync/push
 * 
 * Accepts changes from client and applies them to the server database.
 * Returns conflicts that need resolution and errors for retry.
 */
export async function handlePushChanges(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request
    const result = PushChangesRequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues,
      });
      return;
    }

    const request = result.data;

    // Verify user has access to the organization
    const userId = req.user?.id;
    const userOrgId = req.user?.organizationId;
    
    if (!userId || userOrgId !== request.organizationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this organization',
      });
      return;
    }

    // Get database and sync protocol
    const db = getDatabase();
    const syncProtocol = new SyncProtocol(db);

    // Push changes
    const response = await syncProtocol.pushChanges(request);

    // Return 200 even with conflicts (partial success)
    // Return 207 Multi-Status if there were conflicts
    if (response.conflicts.length > 0) {
      res.status(207).json(response);
    } else {
      res.json(response);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get sync status for user
 * 
 * GET /api/sync/status
 * 
 * Returns information about pending syncs, conflicts, and last sync time
 * for the current user.
 */
export async function handleSyncStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
      return;
    }

    // This would query the database for sync queue items
    // For now, return a simple status
    res.json({
      organizationId,
      userId,
      lastSyncAt: Date.now(),
      pendingCount: 0,
      conflictCount: 0,
      failedCount: 0,
    });
  } catch (error) {
    next(error);
  }
}
