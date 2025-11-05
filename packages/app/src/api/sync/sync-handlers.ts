/**
 * Sync API Handlers
 * 
 * HTTP handlers for offline-first synchronization endpoints.
 * These endpoints enable clients to pull server changes and push local changes.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Database } from '@care-commons/core';
import { z } from 'zod';

/**
 * Zod schemas for request validation
 */
const PullChangesRequestSchema = z.object({
  lastPulledAt: z.coerce.number().int().nonnegative(),
  entities: z.string().transform((val) => val.split(',')),
  organizationId: z.string(),
  branchId: z.string().optional(),
  caregiverId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const PushChangesRequestSchema = z.object({
  changes: z.array(z.object({
    id: z.string(),
    entityType: z.enum(['VISIT', 'EVV_RECORD', 'TIME_ENTRY', 'TASK', 'CLIENT', 'CAREGIVER', 'GEOFENCE']),
    entityId: z.string(),
    operationType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    data: z.record(z.string(), z.unknown()),
    version: z.number().int().nonnegative(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
  })),
  deviceId: z.string(),
  timestamp: z.number().int().nonnegative(),
  organizationId: z.string(),
});

/**
 * Create sync handlers with database dependency
 */
export function createSyncHandlers(_db: Database): {
  handlePullChanges: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  handlePushChanges: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  handleSyncStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
} {
  /**
   * Pull changes from server
   * 
   * GET /api/sync/pull
   * 
   * Returns all changes made on the server since the client's last pull.
   * Clients should call this periodically to stay synchronized.
   */
  const handlePullChanges = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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
      const userId = req.user?.userId;
      const userOrgId = req.user?.organizationId;
      
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!userId || !userOrgId || userOrgId !== request.organizationId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this organization',
        });
        return;
      }

      // NOTE: Sync protocol implementation is pending
      // For now, return empty changes
      res.json({
        changes: [],
        timestamp: Date.now(),
        hasMore: false,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Push local changes to server
   * 
   * POST /api/sync/push
   * 
   * Accepts changes from client and applies them to the server database.
   * Returns conflicts that need resolution and errors for retry.
   */
  const handlePushChanges = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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
      const userId = req.user?.userId;
      const userOrgId = req.user?.organizationId;
      
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!userId || !userOrgId || userOrgId !== request.organizationId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this organization',
        });
        return;
      }

      // NOTE: Sync protocol implementation is pending
      // For now, accept all changes
      res.json({
        applied: request.changes.map(c => c.id),
        conflicts: [],
        errors: [],
        timestamp: Date.now(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get sync status for user
   * 
   * GET /api/sync/status
   * 
   * Returns information about pending syncs, conflicts, and last sync time
   * for the current user.
   */
  const handleSyncStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const organizationId = req.user?.organizationId;

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!userId || !organizationId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'You must be logged in',
        });
        return;
      }

      // NOTE: Sync status implementation is pending
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
  };

  return {
    handlePullChanges,
    handlePushChanges,
    handleSyncStatus,
  };
}
