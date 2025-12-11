/**
 * On-Call Schedule API Routes
 *
 * Endpoints for managing on-call schedules and rotations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import {
  OnCallScheduleService,
  OnCallPeriodType,
} from '../service/on-call-schedule-service.js';

const periodTypes: OnCallPeriodType[] = ['WEEKDAY', 'WEEKEND', 'HOLIDAY', 'OVERNIGHT', 'CUSTOM'];

/**
 * Create on-call schedule routes
 */
export function createOnCallRoutes(pool: Pool): Router {
  const router = Router();
  const onCallService = new OnCallScheduleService(pool);

  /**
   * Create an on-call shift
   * POST /api/scheduling/on-call/shifts
   */
  router.post(
    '/shifts',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          caregiverId: z.string().uuid(),
          branchId: z.string().uuid().optional(),
          periodType: z.enum(periodTypes as [OnCallPeriodType, ...OnCallPeriodType[]]),
          startDateTime: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: 'Invalid start date format',
          }),
          endDateTime: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: 'Invalid end date format',
          }),
          backupCaregiverId: z.string().uuid().optional(),
          notes: z.string().optional(),
        });

        const data = schema.parse(req.body);
        const { organizationId, userId } = req.user as { organizationId: string; userId: string };

        const shift = await onCallService.createOnCallShift({
          organizationId,
          branchId: data.branchId,
          caregiverId: data.caregiverId,
          periodType: data.periodType,
          startDateTime: new Date(data.startDateTime),
          endDateTime: new Date(data.endDateTime),
          backupCaregiverId: data.backupCaregiverId,
          notes: data.notes,
          createdBy: userId,
        });

        res.status(201).json(shift);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get current on-call caregiver
   * GET /api/scheduling/on-call/current
   */
  router.get(
    '/current',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          branchId: z.string().uuid().optional(),
        });

        const { branchId } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const currentOnCall = await onCallService.getCurrentOnCall(organizationId, branchId);

        res.json({
          currentOnCall,
          hasCoverage: !!currentOnCall,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get on-call shifts for a date range
   * GET /api/scheduling/on-call/shifts
   */
  router.get(
    '/shifts',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          branchId: z.string().uuid().optional(),
        });

        const { startDate, endDate, branchId } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const shifts = await onCallService.getOnCallShifts(
          organizationId,
          new Date(startDate),
          new Date(endDate),
          branchId
        );

        res.json({
          shifts,
          count: shifts.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Check coverage status
   * GET /api/scheduling/on-call/coverage
   */
  router.get(
    '/coverage',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          branchId: z.string().uuid().optional(),
        });

        const { startDate, endDate, branchId } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const status = await onCallService.checkCoverageStatus(
          organizationId,
          new Date(startDate),
          new Date(endDate),
          branchId
        );

        res.json(status);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Escalate an on-call shift
   * POST /api/scheduling/on-call/shifts/:shiftId/escalate
   */
  router.post(
    '/shifts/:shiftId/escalate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          shiftId: z.string().uuid(),
        });
        const bodySchema = z.object({
          reason: z.string().min(1),
        });

        const { shiftId } = paramsSchema.parse(req.params);
        const { reason } = bodySchema.parse(req.body);

        const result = await onCallService.escalateOnCall(shiftId, reason);

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
   * Cancel an on-call shift
   * POST /api/scheduling/on-call/shifts/:shiftId/cancel
   */
  router.post(
    '/shifts/:shiftId/cancel',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          shiftId: z.string().uuid(),
        });
        const bodySchema = z.object({
          reason: z.string().optional(),
        });

        const { shiftId } = paramsSchema.parse(req.params);
        const { reason } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        await onCallService.cancelOnCallShift(shiftId, userId, reason);

        res.json({ success: true, message: 'Shift cancelled successfully' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Generate schedule from rotation
   * POST /api/scheduling/on-call/rotations/:rotationId/generate
   */
  router.post(
    '/rotations/:rotationId/generate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          rotationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          weeksToGenerate: z.number().int().min(1).max(52),
        });

        const { rotationId } = paramsSchema.parse(req.params);
        const { startDate, weeksToGenerate } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const shifts = await onCallService.generateScheduleFromRotation(
          rotationId,
          new Date(startDate),
          weeksToGenerate,
          userId
        );

        res.status(201).json({
          shifts,
          count: shifts.length,
          message: `Generated ${shifts.length} shifts for ${weeksToGenerate} weeks`,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get on-call statistics
   * GET /api/scheduling/on-call/stats
   */
  router.get(
    '/stats',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))),
        });

        const { startDate, endDate } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const stats = await onCallService.getOnCallStats(
          organizationId,
          new Date(startDate),
          new Date(endDate)
        );

        res.json(stats);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
