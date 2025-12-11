/**
 * Split Shift API Routes
 *
 * Endpoints for managing split shifts (multiple work segments in a day)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { SplitShiftService } from '../service/split-shift-service.js';

/**
 * Create split shift routes
 */
export function createSplitShiftRoutes(pool: Pool): Router {
  const router = Router();
  const splitShiftService = new SplitShiftService(pool);

  /**
   * Create a split shift
   * POST /api/scheduling/split-shifts
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          branchId: z.string().uuid(),
          clientId: z.string().uuid(),
          caregiverId: z.string().uuid(),
          date: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: 'Invalid date format',
          }),
          parts: z
            .array(
              z.object({
                startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm format'),
                endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm format'),
                taskIds: z.array(z.string().uuid()).optional(),
              })
            )
            .min(2, 'Split shift must have at least 2 parts')
            .max(3, 'Split shift cannot have more than 3 parts'),
          serviceTypeId: z.string().uuid(),
          serviceTypeName: z.string().min(1),
          notes: z.string().optional(),
        });

        const data = schema.parse(req.body);
        const { organizationId, userId } = req.user as { organizationId: string; userId: string };

        const splitShift = await splitShiftService.createSplitShift({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          caregiverId: data.caregiverId,
          date: new Date(data.date),
          parts: data.parts,
          serviceTypeId: data.serviceTypeId,
          serviceTypeName: data.serviceTypeName,
          notes: data.notes,
          createdBy: userId,
        });

        res.status(201).json(splitShift);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Validate a split shift configuration
   * POST /api/scheduling/split-shifts/validate
   */
  router.post(
    '/validate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          branchId: z.string().uuid(),
          clientId: z.string().uuid(),
          caregiverId: z.string().uuid(),
          date: z.string().refine((d) => !isNaN(Date.parse(d))),
          parts: z.array(
            z.object({
              startTime: z.string().regex(/^\d{2}:\d{2}$/),
              endTime: z.string().regex(/^\d{2}:\d{2}$/),
              taskIds: z.array(z.string().uuid()).optional(),
            })
          ),
          serviceTypeId: z.string().uuid(),
          serviceTypeName: z.string().min(1),
        });

        const data = schema.parse(req.body);
        const { organizationId, userId } = req.user as { organizationId: string; userId: string };

        const validation = await splitShiftService.validateSplitShift({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          caregiverId: data.caregiverId,
          date: new Date(data.date),
          parts: data.parts,
          serviceTypeId: data.serviceTypeId,
          serviceTypeName: data.serviceTypeName,
          createdBy: userId,
        });

        res.json(validation);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get a split shift group by ID
   * GET /api/scheduling/split-shifts/:groupId
   */
  router.get(
    '/:groupId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          groupId: z.string().uuid(),
        });

        const { groupId } = schema.parse(req.params);

        const splitShift = await splitShiftService.getSplitShiftGroup(groupId);

        if (!splitShift) {
          res.status(404).json({ error: 'Split shift not found' });
          return;
        }

        res.json(splitShift);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get split shifts for a caregiver on a date
   * GET /api/scheduling/split-shifts/caregiver/:caregiverId
   */
  router.get(
    '/caregiver/:caregiverId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          caregiverId: z.string().uuid(),
        });
        const querySchema = z.object({
          date: z.string().refine((d) => !isNaN(Date.parse(d))),
        });

        const { caregiverId } = paramsSchema.parse(req.params);
        const { date } = querySchema.parse(req.query);

        const splitShifts = await splitShiftService.getCaregiverSplitShifts(
          caregiverId,
          new Date(date)
        );

        res.json({
          caregiverId,
          date,
          splitShifts,
          count: splitShifts.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get organization split shifts for a date range
   * GET /api/scheduling/split-shifts
   */
  router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))),
        });

        const { startDate, endDate } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const splitShifts = await splitShiftService.getOrganizationSplitShifts(
          organizationId,
          new Date(startDate),
          new Date(endDate)
        );

        res.json({
          startDate,
          endDate,
          splitShifts,
          count: splitShifts.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get payroll summary for split shifts
   * GET /api/scheduling/split-shifts/payroll
   */
  router.get(
    '/payroll/summary',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))),
        });

        const { startDate, endDate } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const summary = await splitShiftService.getSplitShiftPayrollSummary(
          organizationId,
          new Date(startDate),
          new Date(endDate)
        );

        res.json({
          startDate,
          endDate,
          summary,
          totalCaregivers: summary.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Cancel a split shift
   * POST /api/scheduling/split-shifts/:groupId/cancel
   */
  router.post(
    '/:groupId/cancel',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          groupId: z.string().uuid(),
        });
        const bodySchema = z.object({
          reason: z.string().optional(),
        });

        const { groupId } = paramsSchema.parse(req.params);
        const { reason } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        await splitShiftService.cancelSplitShift(groupId, userId, reason);

        res.json({ success: true, message: 'Split shift cancelled successfully' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get related parts of a split shift for a visit
   * GET /api/scheduling/split-shifts/visit/:visitId/related
   */
  router.get(
    '/visit/:visitId/related',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          visitId: z.string().uuid(),
        });

        const { visitId } = schema.parse(req.params);

        const isPartOfSplitShift = await splitShiftService.isPartOfSplitShift(visitId);

        if (!isPartOfSplitShift) {
          res.json({
            visitId,
            isPartOfSplitShift: false,
            relatedParts: [],
          });
          return;
        }

        const relatedParts = await splitShiftService.getRelatedSplitShiftParts(visitId);

        res.json({
          visitId,
          isPartOfSplitShift: true,
          relatedParts,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
