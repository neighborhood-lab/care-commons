/**
 * Medication Reconciliation API Routes
 *
 * Endpoints for medication reconciliation during home visits
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { MedicationReconciliationService } from '../service/medication-reconciliation-service.js';

const informationSources = [
  'PATIENT',
  'FAMILY_MEMBER',
  'CAREGIVER',
  'PHARMACY',
  'PHYSICIAN_OFFICE',
  'HOSPITAL_DISCHARGE',
  'OTHER',
] as const;

const adherenceAssessments = ['GOOD', 'FAIR', 'POOR', 'UNABLE_TO_ASSESS'] as const;

const itemStatuses = [
  'CONFIRMED',
  'NEW',
  'DISCONTINUED',
  'DOSAGE_CHANGED',
  'FREQUENCY_CHANGED',
  'NOT_TAKING',
  'PRN_TAKING',
  'UNKNOWN',
] as const;

/**
 * Create medication reconciliation routes
 */
export function createMedicationReconciliationRoutes(pool: Pool): Router {
  const router = Router();
  const reconciliationService = new MedicationReconciliationService(pool);

  /**
   * Start a new reconciliation
   * POST /api/medications/reconciliation
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          branchId: z.string().uuid().optional(),
          clientId: z.string().uuid(),
          visitId: z.string().uuid().optional(),
          performedByName: z.string().min(1),
          performedByCredentials: z.string().optional(),
          informationSource: z.enum(informationSources),
          sourceDetails: z.string().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const reconciliation = await reconciliationService.startReconciliation({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          visitId: data.visitId,
          performedBy: userId,
          performedByName: data.performedByName,
          performedByCredentials: data.performedByCredentials,
          informationSource: data.informationSource,
          sourceDetails: data.sourceDetails,
        });

        res.status(201).json(reconciliation);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get client's documented medications for reconciliation
   * GET /api/medications/reconciliation/client/:clientId/medications
   */
  router.get(
    '/client/:clientId/medications',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { organizationId } = req.user as { organizationId: string };

        const medications = await reconciliationService.getClientMedications(
          clientId,
          organizationId
        );

        res.json({ clientId, medications, count: medications.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get a reconciliation by ID
   * GET /api/medications/reconciliation/:reconciliationId
   */
  router.get(
    '/:reconciliationId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          reconciliationId: z.string().uuid(),
        });

        const { reconciliationId } = paramsSchema.parse(req.params);

        const reconciliation = await reconciliationService.getReconciliation(
          reconciliationId
        );

        if (!reconciliation) {
          res.status(404).json({ error: 'Reconciliation not found' });
          return;
        }

        res.json(reconciliation);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get reconciliation history for a client
   * GET /api/medications/reconciliation/client/:clientId/history
   */
  router.get(
    '/client/:clientId/history',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { limit, offset } = querySchema.parse(req.query);

        const reconciliations =
          await reconciliationService.getClientReconciliationHistory(clientId, {
            limit,
            offset,
          });

        res.json({
          clientId,
          reconciliations,
          count: reconciliations.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Add an item to the reconciliation
   * POST /api/medications/reconciliation/:reconciliationId/items
   */
  router.post(
    '/:reconciliationId/items',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          reconciliationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          medicationId: z.string().uuid().optional(),
          medicationName: z.string().min(1),
          dosage: z.string().optional(),
          frequency: z.string().optional(),
          route: z.string().optional(),
          instructions: z.string().optional(),
          prescriber: z.string().optional(),
          itemStatus: z.enum(itemStatuses),
          documentedDosage: z.string().optional(),
          documentedFrequency: z.string().optional(),
          reportedDosage: z.string().optional(),
          reportedFrequency: z.string().optional(),
          notes: z.string().optional(),
          reasonForChange: z.string().optional(),
          patientUnderstandsPurpose: z.boolean().optional(),
          hasSupply: z.boolean().optional(),
          daysSupplyRemaining: z.number().min(0).optional(),
          requiresAction: z.boolean().optional(),
          actionRequired: z.string().optional(),
        });

        const { reconciliationId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const item = await reconciliationService.addReconciliationItem({
          reconciliationId,
          ...data,
        });

        res.status(201).json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Complete a reconciliation
   * POST /api/medications/reconciliation/:reconciliationId/complete
   */
  router.post(
    '/:reconciliationId/complete',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          reconciliationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          summaryNotes: z.string().optional(),
          adherenceAssessment: z.enum(adherenceAssessments).optional(),
          adherenceNotes: z.string().optional(),
          requiresPhysicianNotification: z.boolean().optional(),
        });

        const { reconciliationId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const reconciliation =
          await reconciliationService.completeReconciliation({
            reconciliationId,
            ...data,
          });

        res.json(reconciliation);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Sign a reconciliation
   * POST /api/medications/reconciliation/:reconciliationId/sign
   */
  router.post(
    '/:reconciliationId/sign',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          reconciliationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          signedByName: z.string().min(1),
        });

        const { reconciliationId } = paramsSchema.parse(req.params);
        const { signedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const reconciliation = await reconciliationService.signReconciliation({
          reconciliationId,
          signedBy: userId,
          signedByName,
        });

        res.json(reconciliation);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get pending physician notifications
   * GET /api/medications/reconciliation/pending-notifications
   */
  router.get(
    '/pending-notifications/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const reconciliations =
          await reconciliationService.getPendingPhysicianNotifications(
            organizationId
          );

        res.json({
          reconciliations,
          count: reconciliations.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Mark physician notified
   * POST /api/medications/reconciliation/:reconciliationId/physician-notified
   */
  router.post(
    '/:reconciliationId/physician-notified',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          reconciliationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          notes: z.string().optional(),
        });

        const { reconciliationId } = paramsSchema.parse(req.params);
        const { notes } = bodySchema.parse(req.body);

        await reconciliationService.markPhysicianNotified(
          reconciliationId,
          notes
        );

        res.json({ success: true, message: 'Physician notification recorded' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Mark action completed on an item
   * POST /api/medications/reconciliation/items/:itemId/action-completed
   */
  router.post(
    '/items/:itemId/action-completed',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          itemId: z.string().uuid(),
        });

        const { itemId } = paramsSchema.parse(req.params);

        await reconciliationService.markActionCompleted(itemId);

        res.json({ success: true, message: 'Action marked as completed' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get reconciliation summary for organization
   * GET /api/medications/reconciliation/summary
   */
  router.get(
    '/summary/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          startDate: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
          endDate: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
        });

        const { startDate, endDate } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const summary = await reconciliationService.getReconciliationSummary(
          organizationId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );

        res.json(summary);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Generate printable report
   * GET /api/medications/reconciliation/:reconciliationId/report
   */
  router.get(
    '/:reconciliationId/report',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          reconciliationId: z.string().uuid(),
        });

        const { reconciliationId } = paramsSchema.parse(req.params);

        const reconciliation = await reconciliationService.getReconciliation(
          reconciliationId
        );

        if (!reconciliation) {
          res.status(404).json({ error: 'Reconciliation not found' });
          return;
        }

        const report =
          reconciliationService.generateReconciliationReport(reconciliation);

        res.setHeader('Content-Type', 'text/plain');
        res.send(report);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
