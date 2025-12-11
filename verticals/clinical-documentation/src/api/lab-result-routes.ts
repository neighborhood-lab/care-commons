/**
 * Lab Result API Routes
 *
 * Endpoints for managing lab results and lab result types
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { LabResultService } from '../service/lab-result-service.js';

const labSources = ['HOSPITAL', 'LAB', 'PHYSICIAN_OFFICE', 'HOME_TEST', 'OTHER'] as const;

/**
 * Create lab result routes
 */
export function createLabResultRoutes(pool: Pool): Router {
  const router = Router();
  const labService = new LabResultService(pool);

  // ==================== LAB RESULT TYPES ====================

  /**
   * Get all lab result types
   * GET /api/lab-results/types
   */
  router.get(
    '/types',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          category: z.string().optional(),
          activeOnly: z.coerce.boolean().optional(),
        });

        const { category, activeOnly } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const types = await labService.getLabResultTypes(organizationId, {
          category,
          activeOnly,
        });

        res.json({ types, count: types.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get lab result type by ID
   * GET /api/lab-results/types/:typeId
   */
  router.get(
    '/types/:typeId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          typeId: z.string().uuid(),
        });

        const { typeId } = paramsSchema.parse(req.params);

        const labType = await labService.getLabResultTypeById(typeId);

        if (!labType) {
          res.status(404).json({ error: 'Lab result type not found' });
          return;
        }

        res.json(labType);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create a lab result type
   * POST /api/lab-results/types
   */
  router.post(
    '/types',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          code: z.string().min(1).max(50),
          name: z.string().min(1).max(200),
          shortName: z.string().max(50).optional(),
          category: z.string().min(1).max(100),
          unit: z.string().max(50).optional(),
          normalMin: z.number().optional(),
          normalMax: z.number().optional(),
          criticalLow: z.number().optional(),
          criticalHigh: z.number().optional(),
          displayOrder: z.number().int().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId } = req.user as { organizationId: string };

        const labType = await labService.createLabResultType({
          organizationId,
          ...data,
        });

        res.status(201).json(labType);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update a lab result type
   * PATCH /api/lab-results/types/:typeId
   */
  router.patch(
    '/types/:typeId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          typeId: z.string().uuid(),
        });
        const bodySchema = z.object({
          code: z.string().min(1).max(50).optional(),
          name: z.string().min(1).max(200).optional(),
          shortName: z.string().max(50).optional(),
          category: z.string().min(1).max(100).optional(),
          unit: z.string().max(50).optional(),
          normalMin: z.number().optional(),
          normalMax: z.number().optional(),
          criticalLow: z.number().optional(),
          criticalHigh: z.number().optional(),
          displayOrder: z.number().int().optional(),
        });

        const { typeId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const labType = await labService.updateLabResultType(typeId, data);

        res.json(labType);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Deactivate a lab result type
   * DELETE /api/lab-results/types/:typeId
   */
  router.delete(
    '/types/:typeId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          typeId: z.string().uuid(),
        });

        const { typeId } = paramsSchema.parse(req.params);

        await labService.deactivateLabResultType(typeId);

        res.json({ success: true, message: 'Lab result type deactivated' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== LAB RESULTS ====================

  /**
   * Create a new lab result
   * POST /api/lab-results
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          branchId: z.string().uuid().optional(),
          clientId: z.string().uuid(),
          labTypeId: z.string().uuid().optional(),
          labName: z.string().min(1).max(200),
          labCode: z.string().max(50).optional(),
          numericValue: z.number().optional(),
          textValue: z.string().max(500).optional(),
          unit: z.string().max(50).optional(),
          referenceLow: z.number().optional(),
          referenceHigh: z.number().optional(),
          interpretationNotes: z.string().optional(),
          collectionDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          resultDate: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
          source: z.enum(labSources),
          sourceName: z.string().max(200).optional(),
          orderingPhysician: z.string().max(200).optional(),
          specimenType: z.string().optional(),
          enteredByName: z.string().min(1),
          visitId: z.string().uuid().optional(),
          clinicalNotes: z.string().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const result = await labService.createLabResult({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          labTypeId: data.labTypeId,
          labName: data.labName,
          labCode: data.labCode,
          numericValue: data.numericValue,
          textValue: data.textValue,
          unit: data.unit,
          referenceLow: data.referenceLow,
          referenceHigh: data.referenceHigh,
          interpretationNotes: data.interpretationNotes,
          collectionDate: data.collectionDate,
          resultDate: data.resultDate,
          source: data.source,
          sourceName: data.sourceName,
          orderingPhysician: data.orderingPhysician,
          specimenType: data.specimenType,
          enteredBy: userId,
          enteredByName: data.enteredByName,
          visitId: data.visitId,
          clinicalNotes: data.clinicalNotes,
        });

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get lab result by ID
   * GET /api/lab-results/:resultId
   */
  router.get(
    '/:resultId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          resultId: z.string().uuid(),
        });

        const { resultId } = paramsSchema.parse(req.params);

        const result = await labService.getLabResultById(resultId);

        if (!result) {
          res.status(404).json({ error: 'Lab result not found' });
          return;
        }

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get lab results for a client
   * GET /api/lab-results/client/:clientId
   */
  router.get(
    '/client/:clientId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          labName: z.string().optional(),
          category: z.string().optional(),
          startDate: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
          endDate: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { labName, category, startDate, endDate, limit, offset } =
          querySchema.parse(req.query);

        const results = await labService.getClientLabResults(clientId, {
          labName,
          category,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit,
          offset,
        });

        res.json({ clientId, results, count: results.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get lab result trends for a client
   * GET /api/lab-results/client/:clientId/trends/:labName
   */
  router.get(
    '/client/:clientId/trends/:labName',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
          labName: z.string().min(1),
        });
        const querySchema = z.object({
          months: z.coerce.number().min(1).max(60).optional(),
        });

        const { clientId, labName } = paramsSchema.parse(req.params);
        const { months } = querySchema.parse(req.query);

        const trends = await labService.getLabResultTrends(
          clientId,
          decodeURIComponent(labName),
          months
        );

        res.json(trends);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update a lab result
   * PATCH /api/lab-results/:resultId
   */
  router.patch(
    '/:resultId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          resultId: z.string().uuid(),
        });
        const bodySchema = z.object({
          numericValue: z.number().optional(),
          textValue: z.string().max(500).optional(),
          unit: z.string().max(50).optional(),
          referenceLow: z.number().optional(),
          referenceHigh: z.number().optional(),
          interpretationNotes: z.string().optional(),
          collectionDate: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
          resultDate: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
          source: z.enum(labSources).optional(),
          sourceName: z.string().max(200).optional(),
          orderingPhysician: z.string().max(200).optional(),
          specimenType: z.string().optional(),
          clinicalNotes: z.string().optional(),
        });

        const { resultId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const result = await labService.updateLabResult({
          id: resultId,
          ...data,
        });

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Verify a lab result
   * POST /api/lab-results/:resultId/verify
   */
  router.post(
    '/:resultId/verify',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          resultId: z.string().uuid(),
        });
        const bodySchema = z.object({
          verifiedByName: z.string().min(1),
        });

        const { resultId } = paramsSchema.parse(req.params);
        const { verifiedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const result = await labService.verifyLabResult(
          resultId,
          userId,
          verifiedByName
        );

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Mark physician notified for critical value
   * POST /api/lab-results/:resultId/physician-notified
   */
  router.post(
    '/:resultId/physician-notified',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          resultId: z.string().uuid(),
        });
        const bodySchema = z.object({
          notes: z.string().optional(),
        });

        const { resultId } = paramsSchema.parse(req.params);
        const { notes } = bodySchema.parse(req.body);

        const result = await labService.markPhysicianNotified(resultId, notes);

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get pending physician notifications
   * GET /api/lab-results/pending-notifications/organization
   */
  router.get(
    '/pending-notifications/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const results = await labService.getPendingNotifications(organizationId);

        res.json({ results, count: results.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get pending verifications
   * GET /api/lab-results/pending-verification/organization
   */
  router.get(
    '/pending-verification/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const results = await labService.getPendingVerification(organizationId);

        res.json({ results, count: results.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete a lab result
   * DELETE /api/lab-results/:resultId
   */
  router.delete(
    '/:resultId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          resultId: z.string().uuid(),
        });

        const { resultId } = paramsSchema.parse(req.params);

        await labService.deleteLabResult(resultId);

        res.json({ success: true, message: 'Lab result deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get lab result summary
   * GET /api/lab-results/summary/organization
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

        const summary = await labService.getLabResultSummary(
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
   * Generate printable report for client
   * GET /api/lab-results/client/:clientId/report
   */
  router.get(
    '/client/:clientId/report',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          clientName: z.string().min(1),
          includeTrends: z.coerce.boolean().optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { clientName, includeTrends } = querySchema.parse(req.query);

        const results = await labService.getClientLabResults(clientId, {
          limit: 50,
        });

        let trends;
        if (includeTrends) {
          // Get unique lab names and fetch trends for each
          const labNames = [...new Set(results.map((r) => r.labName))];
          trends = await Promise.all(
            labNames.slice(0, 10).map((name) =>
              labService.getLabResultTrends(clientId, name, 12)
            )
          );
        }

        const report = labService.generateClientLabReport(
          decodeURIComponent(clientName),
          results,
          trends
        );

        res.setHeader('Content-Type', 'text/plain');
        res.send(report);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
