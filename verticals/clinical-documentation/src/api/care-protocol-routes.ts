/**
 * Care Protocol API Routes
 *
 * Endpoints for managing care protocols and compliance
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { CareProtocolService } from '../service/care-protocol-service.js';

const protocolTypes = [
  'INFECTION_CONTROL',
  'WOUND_CARE',
  'FALL_PREVENTION',
  'MEDICATION_SAFETY',
  'CARDIAC',
  'RESPIRATORY',
  'DIABETES',
  'PAIN_MANAGEMENT',
  'SKIN_CARE',
  'NUTRITION',
  'MOBILITY',
  'COGNITIVE',
  'SAFETY',
  'EMERGENCY',
  'END_OF_LIFE',
  'GENERAL',
  'OTHER',
] as const;

const priorities = ['HIGH', 'MEDIUM', 'LOW'] as const;

const complianceStatuses = [
  'FULLY_COMPLIANT',
  'PARTIALLY_COMPLIANT',
  'NON_COMPLIANT',
  'NOT_APPLICABLE',
  'DEVIATION_DOCUMENTED',
] as const;

const protocolStepSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().min(1),
  instruction: z.string().min(1),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Create care protocol routes
 */
export function createCareProtocolRoutes(pool: Pool): Router {
  const router = Router();
  const protocolService = new CareProtocolService(pool);

  // ==================== CATEGORIES ====================

  /**
   * Get protocol categories
   * GET /api/care-protocols/categories
   */
  router.get(
    '/categories',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          activeOnly: z.coerce.boolean().optional(),
        });

        const { activeOnly } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const categories = await protocolService.getProtocolCategories(
          organizationId,
          activeOnly !== false
        );

        res.json({ categories, count: categories.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create protocol category
   * POST /api/care-protocols/categories
   */
  router.post(
    '/categories',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          name: z.string().min(1).max(200),
          description: z.string().optional(),
          icon: z.string().max(50).optional(),
          color: z.string().max(20).optional(),
          displayOrder: z.number().int().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId } = req.user as { organizationId: string };

        const category = await protocolService.createProtocolCategory({
          organizationId,
          ...data,
        });

        res.status(201).json(category);
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== PROTOCOLS ====================

  /**
   * Get care protocols
   * GET /api/care-protocols
   */
  router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          categoryId: z.string().uuid().optional(),
          protocolType: z.enum(protocolTypes).optional(),
          isMandatory: z.coerce.boolean().optional(),
          search: z.string().optional(),
          activeOnly: z.coerce.boolean().optional(),
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
        });

        const { categoryId, protocolType, isMandatory, search, activeOnly, limit, offset } =
          querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const protocols = await protocolService.getCareProtocols(organizationId, {
          categoryId,
          protocolType,
          isMandatory,
          search,
          activeOnly,
          limit,
          offset,
        });

        res.json({ protocols, count: protocols.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get protocol by ID
   * GET /api/care-protocols/:protocolId
   */
  router.get(
    '/:protocolId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          protocolId: z.string().uuid(),
        });

        const { protocolId } = paramsSchema.parse(req.params);

        const protocol = await protocolService.getProtocolById(protocolId);

        if (!protocol) {
          res.status(404).json({ error: 'Protocol not found' });
          return;
        }

        res.json(protocol);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get protocol by code
   * GET /api/care-protocols/code/:code
   */
  router.get(
    '/code/:code',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          code: z.string().min(1).max(50),
        });

        const { code } = paramsSchema.parse(req.params);
        const { organizationId } = req.user as { organizationId: string };

        const protocol = await protocolService.getProtocolByCode(code, organizationId);

        if (!protocol) {
          res.status(404).json({ error: 'Protocol not found' });
          return;
        }

        res.json(protocol);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get infection control protocols
   * GET /api/care-protocols/infection-control/organization
   */
  router.get(
    '/infection-control/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const protocols = await protocolService.getInfectionControlProtocols(organizationId);

        res.json({ protocols, count: protocols.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get mandatory protocols
   * GET /api/care-protocols/mandatory/organization
   */
  router.get(
    '/mandatory/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const protocols = await protocolService.getMandatoryProtocols(organizationId);

        res.json({ protocols, count: protocols.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create care protocol
   * POST /api/care-protocols
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          categoryId: z.string().uuid().optional(),
          name: z.string().min(1).max(200),
          code: z.string().max(50).optional(),
          description: z.string().optional(),
          protocolType: z.enum(protocolTypes),
          purpose: z.string().optional(),
          scope: z.string().optional(),
          indications: z.string().optional(),
          contraindications: z.string().optional(),
          steps: z.array(protocolStepSchema).optional(),
          equipmentNeeded: z.array(z.string()).optional(),
          precautions: z.string().optional(),
          expectedOutcomes: z.string().optional(),
          documentationRequirements: z.array(z.string()).optional(),
          evidenceBase: z.string().optional(),
          references: z.array(z.string()).optional(),
          sourceOrganization: z.string().max(200).optional(),
          externalUrl: z.string().max(500).optional(),
          version: z.string().max(20).optional(),
          effectiveDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          reviewDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          expirationDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          isMandatory: z.boolean().optional(),
          priority: z.enum(priorities).optional(),
          applicableConditions: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          createdByName: z.string().max(200).optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const protocol = await protocolService.createCareProtocol({
          organizationId,
          categoryId: data.categoryId,
          name: data.name,
          code: data.code,
          description: data.description,
          protocolType: data.protocolType,
          purpose: data.purpose,
          scope: data.scope,
          indications: data.indications,
          contraindications: data.contraindications,
          steps: data.steps,
          equipmentNeeded: data.equipmentNeeded,
          precautions: data.precautions,
          expectedOutcomes: data.expectedOutcomes,
          documentationRequirements: data.documentationRequirements,
          evidenceBase: data.evidenceBase,
          references: data.references,
          sourceOrganization: data.sourceOrganization,
          externalUrl: data.externalUrl,
          version: data.version,
          effectiveDate: data.effectiveDate,
          reviewDate: data.reviewDate,
          expirationDate: data.expirationDate,
          isMandatory: data.isMandatory,
          priority: data.priority,
          applicableConditions: data.applicableConditions,
          tags: data.tags,
          createdBy: userId,
          createdByName: data.createdByName,
        });

        res.status(201).json(protocol);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update care protocol
   * PATCH /api/care-protocols/:protocolId
   */
  router.patch(
    '/:protocolId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          protocolId: z.string().uuid(),
        });
        const bodySchema = z.object({
          name: z.string().min(1).max(200).optional(),
          description: z.string().optional(),
          purpose: z.string().optional(),
          scope: z.string().optional(),
          indications: z.string().optional(),
          contraindications: z.string().optional(),
          steps: z.array(protocolStepSchema).optional(),
          equipmentNeeded: z.array(z.string()).optional(),
          precautions: z.string().optional(),
          expectedOutcomes: z.string().optional(),
          documentationRequirements: z.array(z.string()).optional(),
          evidenceBase: z.string().optional(),
          references: z.array(z.string()).optional(),
          version: z.string().max(20).optional(),
          reviewDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          isMandatory: z.boolean().optional(),
          priority: z.enum(priorities).optional(),
          tags: z.array(z.string()).optional(),
        });

        const { protocolId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const protocol = await protocolService.updateCareProtocol({
          id: protocolId,
          ...data,
        });

        res.json(protocol);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Approve protocol
   * POST /api/care-protocols/:protocolId/approve
   */
  router.post(
    '/:protocolId/approve',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          protocolId: z.string().uuid(),
        });
        const bodySchema = z.object({
          approvedByName: z.string().min(1).max(200),
        });

        const { protocolId } = paramsSchema.parse(req.params);
        const { approvedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const protocol = await protocolService.approveProtocol(
          protocolId,
          userId,
          approvedByName
        );

        res.json(protocol);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Deactivate protocol
   * POST /api/care-protocols/:protocolId/deactivate
   */
  router.post(
    '/:protocolId/deactivate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          protocolId: z.string().uuid(),
        });

        const { protocolId } = paramsSchema.parse(req.params);

        await protocolService.deactivateProtocol(protocolId);

        res.json({ success: true, message: 'Protocol deactivated' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete protocol
   * DELETE /api/care-protocols/:protocolId
   */
  router.delete(
    '/:protocolId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          protocolId: z.string().uuid(),
        });

        const { protocolId } = paramsSchema.parse(req.params);

        await protocolService.deleteProtocol(protocolId);

        res.json({ success: true, message: 'Protocol deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== COMPLIANCE ====================

  /**
   * Record protocol compliance
   * POST /api/care-protocols/compliance
   */
  router.post(
    '/compliance',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          protocolId: z.string().uuid(),
          clientId: z.string().uuid(),
          visitId: z.string().uuid().optional(),
          complianceStatus: z.enum(complianceStatuses),
          stepsCompleted: z.array(z.number().int()).optional(),
          complianceNotes: z.string().optional(),
          hasDeviation: z.boolean().optional(),
          deviationReason: z.string().optional(),
          deviationOutcome: z.string().optional(),
          documentedByName: z.string().min(1).max(200),
          documentedByCredentials: z.string().max(50).optional(),
          documentedAt: z.string().refine((d) => !isNaN(Date.parse(d))),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const compliance = await protocolService.recordCompliance({
          organizationId,
          protocolId: data.protocolId,
          clientId: data.clientId,
          visitId: data.visitId,
          complianceStatus: data.complianceStatus,
          stepsCompleted: data.stepsCompleted,
          complianceNotes: data.complianceNotes,
          hasDeviation: data.hasDeviation,
          deviationReason: data.deviationReason,
          deviationOutcome: data.deviationOutcome,
          documentedBy: userId,
          documentedByName: data.documentedByName,
          documentedByCredentials: data.documentedByCredentials,
          documentedAt: data.documentedAt,
        });

        res.status(201).json(compliance);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get compliance for client
   * GET /api/care-protocols/compliance/client/:clientId
   */
  router.get(
    '/compliance/client/:clientId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          protocolId: z.string().uuid().optional(),
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          limit: z.coerce.number().min(1).max(100).optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { protocolId, startDate, endDate, limit } = querySchema.parse(req.query);

        const compliance = await protocolService.getClientCompliance(clientId, {
          protocolId,
          startDate,
          endDate,
          limit,
        });

        res.json({ clientId, compliance, count: compliance.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get compliance for visit
   * GET /api/care-protocols/compliance/visit/:visitId
   */
  router.get(
    '/compliance/visit/:visitId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          visitId: z.string().uuid(),
        });

        const { visitId } = paramsSchema.parse(req.params);

        const compliance = await protocolService.getVisitCompliance(visitId);

        res.json({ visitId, compliance, count: compliance.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Approve deviation
   * POST /api/care-protocols/compliance/:complianceId/approve-deviation
   */
  router.post(
    '/compliance/:complianceId/approve-deviation',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          complianceId: z.string().uuid(),
        });
        const bodySchema = z.object({
          approvedByName: z.string().min(1).max(200),
        });

        const { complianceId } = paramsSchema.parse(req.params);
        const { approvedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const compliance = await protocolService.approveDeviation(
          complianceId,
          userId,
          approvedByName
        );

        res.json(compliance);
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== SUMMARY ====================

  /**
   * Get protocol summary
   * GET /api/care-protocols/summary/organization
   */
  router.get(
    '/summary/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const summary = await protocolService.getProtocolSummary(organizationId);

        res.json(summary);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Generate printable protocol document
   * GET /api/care-protocols/:protocolId/document
   */
  router.get(
    '/:protocolId/document',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          protocolId: z.string().uuid(),
        });

        const { protocolId } = paramsSchema.parse(req.params);

        const protocol = await protocolService.getProtocolById(protocolId);

        if (!protocol) {
          res.status(404).json({ error: 'Protocol not found' });
          return;
        }

        const document = protocolService.generateProtocolDocument(protocol);

        res.setHeader('Content-Type', 'text/plain');
        res.send(document);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
