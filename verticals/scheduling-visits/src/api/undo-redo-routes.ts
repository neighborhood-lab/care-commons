/**
 * Schedule Undo/Redo API Routes
 *
 * Endpoints for undo/redo operations on schedule changes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { ScheduleUndoRedoService } from '../service/schedule-undo-redo-service.js';

/**
 * Create undo/redo routes
 */
export function createUndoRedoRoutes(pool: Pool): Router {
  const router = Router();
  const undoRedoService = new ScheduleUndoRedoService(pool);

  /**
   * Get undo/redo stack for current user
   * GET /api/schedule/undo-redo/stack
   */
  router.get(
    '/stack',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
        });

        const { limit, offset } = querySchema.parse(req.query);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const stack = await undoRedoService.getUndoStack(
          organizationId,
          userId,
          { limit, offset }
        );

        res.json(stack);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Undo most recent change or specific change
   * POST /api/schedule/undo-redo/undo
   */
  router.post(
    '/undo',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          changeId: z.string().uuid().optional(),
        });

        const { changeId } = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const result = await undoRedoService.undo(
          organizationId,
          userId,
          changeId
        );

        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Redo most recent undone change or specific change
   * POST /api/schedule/undo-redo/redo
   */
  router.post(
    '/redo',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          changeId: z.string().uuid().optional(),
        });

        const { changeId } = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const result = await undoRedoService.redo(
          organizationId,
          userId,
          changeId
        );

        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get change history for an entity
   * GET /api/schedule/undo-redo/history/:entityType/:entityId
   */
  router.get(
    '/history/:entityType/:entityId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          entityType: z.enum(['VISIT', 'SERVICE_PATTERN']),
          entityId: z.string().uuid(),
        });
        const querySchema = z.object({
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
          includeUndone: z.coerce.boolean().optional(),
        });

        const { entityType, entityId } = paramsSchema.parse(req.params);
        const { limit, offset, includeUndone } = querySchema.parse(req.query);

        const history = await undoRedoService.getEntityHistory(
          entityType,
          entityId,
          { limit, offset, includeUndone }
        );

        res.json({
          entityType,
          entityId,
          history,
          count: history.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create a new editing session
   * POST /api/schedule/undo-redo/session
   */
  router.post(
    '/session',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const sessionId = await undoRedoService.createSession(
          organizationId,
          userId
        );

        res.status(201).json({ sessionId });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Record a manual change (for custom integrations)
   * POST /api/schedule/undo-redo/record
   */
  router.post(
    '/record',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const changeTypes = [
          'VISIT_CREATE',
          'VISIT_UPDATE',
          'VISIT_DELETE',
          'VISIT_ASSIGN',
          'VISIT_UNASSIGN',
          'VISIT_STATUS_CHANGE',
          'VISIT_RESCHEDULE',
          'PATTERN_CREATE',
          'PATTERN_UPDATE',
          'PATTERN_DELETE',
          'BULK_CREATE',
          'BULK_UPDATE',
          'BULK_DELETE',
        ] as const;

        const entityTypes = ['VISIT', 'SERVICE_PATTERN'] as const;

        const bodySchema = z.object({
          branchId: z.string().uuid().optional(),
          changeType: z.enum(changeTypes),
          entityType: z.enum(entityTypes),
          entityId: z.string().uuid().optional(),
          entityIds: z.array(z.string().uuid()).optional(),
          beforeState: z.record(z.string(), z.unknown()).optional(),
          afterState: z.record(z.string(), z.unknown()).optional(),
          changeDetails: z.record(z.string(), z.unknown()).optional(),
          sessionId: z.string().uuid().optional(),
          description: z.string().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const change = await undoRedoService.recordChange({
          organizationId,
          branchId: data.branchId,
          userId,
          changeType: data.changeType,
          entityType: data.entityType,
          entityId: data.entityId,
          entityIds: data.entityIds,
          beforeState: data.beforeState,
          afterState: data.afterState,
          changeDetails: data.changeDetails,
          sessionId: data.sessionId,
          description: data.description,
        });

        res.status(201).json(change);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Clear old change history (admin only)
   * DELETE /api/schedule/undo-redo/history
   */
  router.delete(
    '/history',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          olderThanDays: z.coerce.number().min(1).max(365).optional(),
        });

        const { olderThanDays } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const deletedCount = await undoRedoService.clearOldHistory(
          organizationId,
          olderThanDays
        );

        res.json({
          success: true,
          deletedCount,
          message: `Cleared ${deletedCount} old change history records`,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
