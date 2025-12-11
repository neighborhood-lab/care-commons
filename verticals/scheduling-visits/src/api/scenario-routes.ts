/**
 * Schedule Scenario API Routes
 *
 * Endpoints for "what-if" scenario planning
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import {
  ScheduleScenarioService,
  ScenarioStatus,
  ScenarioType,
  ScenarioChangeType,
} from '../service/schedule-scenario-service.js';

const scenarioTypes: ScenarioType[] = [
  'VACATION_COVERAGE',
  'STAFF_CHANGE',
  'CLIENT_CHANGE',
  'OPTIMIZATION',
  'TRAINING',
  'GENERAL',
];

const scenarioStatuses: ScenarioStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'APPLIED',
  'REJECTED',
  'ARCHIVED',
];

const changeTypes: ScenarioChangeType[] = [
  'REASSIGNED',
  'RESCHEDULED',
  'CANCELLED',
  'ADDED',
];

/**
 * Create scenario routes
 */
export function createScenarioRoutes(pool: Pool): Router {
  const router = Router();
  const scenarioService = new ScheduleScenarioService(pool);

  /**
   * Create a new scenario
   * POST /api/scheduling/scenarios
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          name: z.string().min(1).max(200),
          description: z.string().optional(),
          scenarioType: z.enum(scenarioTypes as [ScenarioType, ...ScenarioType[]]),
          dateRangeStart: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: 'Invalid start date',
          }),
          dateRangeEnd: z.string().refine((d) => !isNaN(Date.parse(d)), {
            message: 'Invalid end date',
          }),
          copyFromLive: z.boolean().default(true),
        });

        const data = schema.parse(req.body);
        const { organizationId, userId } = req.user as { organizationId: string; userId: string };

        const scenario = await scenarioService.createScenario({
          organizationId,
          name: data.name,
          description: data.description,
          scenarioType: data.scenarioType,
          dateRangeStart: new Date(data.dateRangeStart),
          dateRangeEnd: new Date(data.dateRangeEnd),
          copyFromLive: data.copyFromLive,
          createdBy: userId,
        });

        res.status(201).json(scenario);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get all scenarios for the organization
   * GET /api/scheduling/scenarios
   */
  router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          status: z.enum(scenarioStatuses as [ScenarioStatus, ...ScenarioStatus[]]).optional(),
        });

        const { status } = schema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const scenarios = await scenarioService.getOrganizationScenarios(organizationId, status);

        res.json({
          scenarios,
          count: scenarios.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get a specific scenario
   * GET /api/scheduling/scenarios/:scenarioId
   */
  router.get(
    '/:scenarioId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          scenarioId: z.string().uuid(),
        });

        const { scenarioId } = schema.parse(req.params);

        const scenario = await scenarioService.getScenario(scenarioId);

        if (!scenario) {
          res.status(404).json({ error: 'Scenario not found' });
          return;
        }

        res.json(scenario);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get visits in a scenario
   * GET /api/scheduling/scenarios/:scenarioId/visits
   */
  router.get(
    '/:scenarioId/visits',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          scenarioId: z.string().uuid(),
        });

        const { scenarioId } = schema.parse(req.params);

        const visits = await scenarioService.getScenarioVisits(scenarioId);

        res.json({
          scenarioId,
          visits,
          count: visits.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Make a change to a visit in a scenario
   * POST /api/scheduling/scenarios/:scenarioId/changes
   */
  router.post(
    '/:scenarioId/changes',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          scenarioId: z.string().uuid(),
        });
        const bodySchema = z.object({
          visitId: z.string().uuid(),
          changeType: z.enum(changeTypes as [ScenarioChangeType, ...ScenarioChangeType[]]),
          newCaregiverId: z.string().uuid().optional(),
          newDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          newStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          newEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          reason: z.string().optional(),
        });

        const { scenarioId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const visit = await scenarioService.makeScenarioChange({
          scenarioId,
          visitId: data.visitId,
          changeType: data.changeType as Exclude<ScenarioChangeType, 'UNCHANGED'>,
          newCaregiverId: data.newCaregiverId,
          newDate: data.newDate ? new Date(data.newDate) : undefined,
          newStartTime: data.newStartTime,
          newEndTime: data.newEndTime,
          reason: data.reason,
          changedBy: userId,
        });

        res.json(visit);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Add a new visit to a scenario
   * POST /api/scheduling/scenarios/:scenarioId/visits
   */
  router.post(
    '/:scenarioId/visits',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          scenarioId: z.string().uuid(),
        });
        const bodySchema = z.object({
          clientId: z.string().uuid(),
          caregiverId: z.string().uuid().optional(),
          scheduledDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/),
          scheduledEndTime: z.string().regex(/^\d{2}:\d{2}$/),
          serviceTypeId: z.string().uuid(),
          serviceTypeName: z.string().min(1),
          reason: z.string().optional(),
        });

        const { scenarioId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const visit = await scenarioService.addScenarioVisit({
          scenarioId,
          clientId: data.clientId,
          caregiverId: data.caregiverId,
          scheduledDate: new Date(data.scheduledDate),
          scheduledStartTime: data.scheduledStartTime,
          scheduledEndTime: data.scheduledEndTime,
          serviceTypeId: data.serviceTypeId,
          serviceTypeName: data.serviceTypeName,
          reason: data.reason,
          addedBy: userId,
        });

        res.status(201).json(visit);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Compare scenario to live schedule
   * GET /api/scheduling/scenarios/:scenarioId/compare
   */
  router.get(
    '/:scenarioId/compare',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          scenarioId: z.string().uuid(),
        });

        const { scenarioId } = schema.parse(req.params);

        const comparison = await scenarioService.compareScenarioToLive(scenarioId);

        res.json(comparison);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update scenario status
   * PATCH /api/scheduling/scenarios/:scenarioId/status
   */
  router.patch(
    '/:scenarioId/status',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          scenarioId: z.string().uuid(),
        });
        const bodySchema = z.object({
          status: z.enum(scenarioStatuses as [ScenarioStatus, ...ScenarioStatus[]]),
          notes: z.string().optional(),
        });

        const { scenarioId } = paramsSchema.parse(req.params);
        const { status, notes } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        await scenarioService.updateScenarioStatus(scenarioId, status, userId, notes);

        res.json({ success: true, message: `Scenario status updated to ${status}` });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Apply scenario to live schedule
   * POST /api/scheduling/scenarios/:scenarioId/apply
   */
  router.post(
    '/:scenarioId/apply',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          scenarioId: z.string().uuid(),
        });

        const { scenarioId } = schema.parse(req.params);
        const { userId } = req.user as { userId: string };

        await scenarioService.applyScenario(scenarioId, userId);

        res.json({ success: true, message: 'Scenario applied to live schedule' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete (archive) a scenario
   * DELETE /api/scheduling/scenarios/:scenarioId
   */
  router.delete(
    '/:scenarioId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          scenarioId: z.string().uuid(),
        });

        const { scenarioId } = schema.parse(req.params);
        const { userId } = req.user as { userId: string };

        await scenarioService.deleteScenario(scenarioId, userId);

        res.json({ success: true, message: 'Scenario archived' });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
