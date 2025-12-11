/**
 * Overtime Alerts API Routes
 *
 * Endpoints for checking caregiver overtime status before assignment
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { OvertimeAlertService } from '../service/overtime-alert-service.js';

/**
 * Create overtime alerts routes
 */
export function createOvertimeAlertsRoutes(pool: Pool): Router {
  const router = Router();
  const overtimeService = new OvertimeAlertService(pool);

  /**
   * Check overtime status for a proposed assignment
   * POST /api/scheduling/overtime-check
   */
  router.post(
    '/overtime-check',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          caregiverId: z.string().uuid(),
          visitDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: 'Invalid date format',
          }),
          durationMinutes: z.number().positive(),
          state: z.string().length(2).optional(),
        });

        const { caregiverId, visitDate, durationMinutes, state } = schema.parse(req.body);
        const { organizationId } = req.user as { organizationId: string };

        const result = await overtimeService.checkOvertimeForAssignment(
          caregiverId,
          new Date(visitDate),
          durationMinutes,
          organizationId,
          state
        );

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get overtime status for all caregivers in organization
   * GET /api/scheduling/overtime-status
   */
  router.get(
    '/overtime-status',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const weekDate = req.query.weekDate
          ? new Date(req.query.weekDate as string)
          : new Date();

        const state = (req.query.state as string) || 'DEFAULT';

        const result = await overtimeService.getOrganizationOvertimeStatus(
          organizationId,
          weekDate,
          state
        );

        res.json({
          weekDate: weekDate.toISOString(),
          state,
          caregivers: result,
          summary: {
            total: result.length,
            inOvertime: result.filter((c) => c.status === 'OVERTIME').length,
            approaching: result.filter((c) => c.status === 'WARNING').length,
            normal: result.filter((c) => c.status === 'NORMAL').length,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get overtime configuration for a state
   * GET /api/scheduling/overtime-config/:state
   */
  router.get(
    '/overtime-config/:state',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const state = req.params.state?.toUpperCase() || 'DEFAULT';
        const config = overtimeService.getOvertimeConfig(state);

        res.json({
          state,
          config,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
