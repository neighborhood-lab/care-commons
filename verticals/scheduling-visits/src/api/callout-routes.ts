/**
 * Callout Handling API Routes
 *
 * Endpoints for handling caregiver callouts
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { CalloutHandlingService, CalloutReason } from '../service/callout-handling-service.js';

const calloutReasons: CalloutReason[] = [
  'SICK',
  'FAMILY_EMERGENCY',
  'CAR_TROUBLE',
  'WEATHER',
  'PERSONAL',
  'NO_SHOW',
  'OTHER',
];

/**
 * Create callout handling routes
 */
export function createCalloutRoutes(pool: Pool): Router {
  const router = Router();
  const calloutService = new CalloutHandlingService(pool);

  /**
   * Record a callout and get handling options
   * POST /api/scheduling/callouts
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          caregiverId: z.string().uuid(),
          calloutDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: 'Invalid date format',
          }),
          reason: z.enum(calloutReasons as [CalloutReason, ...CalloutReason[]]),
          reasonDetails: z.string().optional(),
        });

        const { caregiverId, calloutDate, reason, reasonDetails } = schema.parse(req.body);
        const { organizationId, userId } = req.user as { organizationId: string; userId: string };

        const result = await calloutService.handleCallout({
          caregiverId,
          calloutDate: new Date(calloutDate),
          reason,
          reasonDetails,
          reportedBy: userId,
          organizationId,
        });

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Find replacement caregivers for a specific date
   * GET /api/scheduling/callouts/replacements
   */
  router.get(
    '/replacements',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          caregiverId: z.string().uuid(),
          date: z.string().refine((d) => !isNaN(Date.parse(d))),
          visitIds: z.string().optional(), // comma-separated
        });

        const query = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        // Find replacement candidates for the given date
        // Note: In production, would look up affected visits using visitIds query param
        const candidates = await calloutService.findReplacementCandidates(
          query.caregiverId,
          new Date(query.date),
          [], // Empty array - affected visits would be fetched in full implementation
          organizationId
        );

        res.json({
          date: query.date,
          candidates,
          count: candidates.length,
          availableCount: candidates.filter((c) => c.isAvailable).length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Reassign a visit to a new caregiver
   * POST /api/scheduling/callouts/reassign
   */
  router.post(
    '/reassign',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          visitId: z.string().uuid(),
          newCaregiverId: z.string().uuid(),
        });

        const { visitId, newCaregiverId } = schema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const result = await calloutService.reassignVisit(visitId, newCaregiverId, userId);

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
   * Get callout history/analytics
   * GET /api/scheduling/callouts/history
   */
  router.get(
    '/history',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))),
        });

        const { startDate, endDate } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const history = await calloutService.getCalloutHistory(
          organizationId,
          new Date(startDate),
          new Date(endDate)
        );

        res.json(history);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
