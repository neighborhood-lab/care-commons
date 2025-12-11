/**
 * Clinical Handoff API Routes
 *
 * Endpoints for structured clinical handoffs
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import {
  ClinicalHandoffService,
  HandoffType,
  HandoffUrgency,
} from '../service/clinical-handoff-service.js';

const handoffTypes: HandoffType[] = ['SBAR', 'I_PASS', 'GENERAL'];
const urgencyLevels: HandoffUrgency[] = ['ROUTINE', 'URGENT', 'CRITICAL'];

const sbarSchema = z.object({
  situation: z.string().min(1),
  background: z.string().min(1),
  assessment: z.string().min(1),
  recommendation: z.string().min(1),
});

const ipassSchema = z.object({
  illnessSeverity: z.enum(['STABLE', 'WATCHER', 'UNSTABLE']),
  patientSummary: z.string().min(1),
  actionList: z.array(z.string()),
  situationAwareness: z.array(z.string()),
});

/**
 * Create handoff routes
 */
export function createHandoffRoutes(pool: Pool): Router {
  const router = Router();
  const handoffService = new ClinicalHandoffService(pool);

  /**
   * Create a new handoff
   * POST /api/clinical/handoffs
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          branchId: z.string().uuid(),
          clientId: z.string().uuid(),
          toCaregiverId: z.string().uuid(),
          handoffType: z.enum(handoffTypes as [HandoffType, ...HandoffType[]]),
          urgency: z.enum(urgencyLevels as [HandoffUrgency, ...HandoffUrgency[]]),
          handoffReason: z.string().min(1),
          effectiveDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          sbarContent: sbarSchema.optional(),
          ipassContent: ipassSchema.optional(),
          generalNotes: z.string().optional(),
          criticalAlerts: z.array(z.string()).optional(),
          pendingTasks: z.array(z.string()).optional(),
          medicationChanges: z.array(z.string()).optional(),
          upcomingAppointments: z.array(z.string()).optional(),
          relatedVisitId: z.string().uuid().optional(),
          relatedNoteIds: z.array(z.string().uuid()).optional(),
        });

        const data = schema.parse(req.body);
        const { organizationId, userId } = req.user as { organizationId: string; userId: string };

        const handoff = await handoffService.createHandoff({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          fromCaregiverId: userId,
          toCaregiverId: data.toCaregiverId,
          handoffType: data.handoffType,
          urgency: data.urgency,
          handoffReason: data.handoffReason,
          effectiveDate: new Date(data.effectiveDate),
          sbarContent: data.sbarContent,
          ipassContent: data.ipassContent ? { ...data.ipassContent, synthesis: '' } : undefined,
          generalNotes: data.generalNotes,
          criticalAlerts: data.criticalAlerts,
          pendingTasks: data.pendingTasks,
          medicationChanges: data.medicationChanges,
          upcomingAppointments: data.upcomingAppointments,
          relatedVisitId: data.relatedVisitId,
          relatedNoteIds: data.relatedNoteIds,
        });

        res.status(201).json(handoff);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get a handoff by ID
   * GET /api/clinical/handoffs/:handoffId
   */
  router.get(
    '/:handoffId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          handoffId: z.string().uuid(),
        });

        const { handoffId } = schema.parse(req.params);

        const handoff = await handoffService.getHandoff(handoffId);

        if (!handoff) {
          res.status(404).json({ error: 'Handoff not found' });
          return;
        }

        res.json(handoff);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get pending handoffs for current user
   * GET /api/clinical/handoffs/pending
   */
  router.get(
    '/pending/me',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.user as { userId: string };

        const handoffs = await handoffService.getPendingHandoffsForCaregiver(userId);

        res.json({
          handoffs,
          count: handoffs.length,
          hasCritical: handoffs.some((h) => h.urgency === 'CRITICAL'),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get handoffs for a client
   * GET /api/clinical/handoffs/client/:clientId
   */
  router.get(
    '/client/:clientId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { startDate, endDate } = querySchema.parse(req.query);

        const handoffs = await handoffService.getHandoffsForClient(
          clientId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );

        res.json({
          clientId,
          handoffs,
          count: handoffs.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Send a handoff
   * POST /api/clinical/handoffs/:handoffId/send
   */
  router.post(
    '/:handoffId/send',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schema = z.object({
          handoffId: z.string().uuid(),
        });

        const { handoffId } = schema.parse(req.params);

        await handoffService.sendHandoff(handoffId);

        res.json({ success: true, message: 'Handoff sent successfully' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Acknowledge a handoff
   * POST /api/clinical/handoffs/:handoffId/acknowledge
   */
  router.post(
    '/:handoffId/acknowledge',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          handoffId: z.string().uuid(),
        });
        const bodySchema = z.object({
          acknowledgmentNotes: z.string().optional(),
          synthesis: z.string().optional(), // For I-PASS
        });

        const { handoffId } = paramsSchema.parse(req.params);
        const { acknowledgmentNotes, synthesis } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        await handoffService.acknowledgeHandoff({
          handoffId,
          acknowledgedBy: userId,
          acknowledgmentNotes,
          synthesis,
        });

        res.json({ success: true, message: 'Handoff acknowledged' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Decline a handoff
   * POST /api/clinical/handoffs/:handoffId/decline
   */
  router.post(
    '/:handoffId/decline',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          handoffId: z.string().uuid(),
        });
        const bodySchema = z.object({
          declineReason: z.string().min(1),
        });

        const { handoffId } = paramsSchema.parse(req.params);
        const { declineReason } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        await handoffService.declineHandoff({
          handoffId,
          declinedBy: userId,
          declineReason,
        });

        res.json({ success: true, message: 'Handoff declined' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get handoff summary for organization
   * GET /api/clinical/handoffs/summary
   */
  router.get(
    '/summary/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const summary = await handoffService.getHandoffSummary(organizationId);

        res.json(summary);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
