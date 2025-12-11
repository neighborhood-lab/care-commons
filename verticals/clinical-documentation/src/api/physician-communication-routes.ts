/**
 * Physician Communication API Routes
 *
 * Endpoints for managing physician communications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { PhysicianCommunicationService } from '../service/physician-communication-service.js';

const preferredContacts = ['PHONE', 'FAX', 'EMAIL', 'SECURE_MESSAGE', 'PORTAL'] as const;
const relationshipTypes = [
  'PRIMARY_CARE',
  'SPECIALIST',
  'HOSPITALIST',
  'SURGEON',
  'PSYCHIATRIST',
  'OTHER',
] as const;
const communicationTypes = [
  'ORDER_REQUEST',
  'STATUS_UPDATE',
  'ABNORMAL_FINDING',
  'MEDICATION_QUESTION',
  'CARE_PLAN_CHANGE',
  'WOUND_UPDATE',
  'VITAL_SIGN_ALERT',
  'LAB_RESULT_NOTIFICATION',
  'GENERAL_INQUIRY',
  'OTHER',
] as const;
const urgencies = ['ROUTINE', 'URGENT', 'STAT'] as const;
const contactMethods = [
  'PHONE',
  'FAX',
  'EMAIL',
  'SECURE_MESSAGE',
  'PORTAL',
  'IN_PERSON',
] as const;
const statuses = [
  'DRAFT',
  'SENT',
  'DELIVERED',
  'READ',
  'RESPONSE_RECEIVED',
  'FAILED',
  'CANCELLED',
] as const;

/**
 * Create physician communication routes
 */
export function createPhysicianCommunicationRoutes(pool: Pool): Router {
  const router = Router();
  const commService = new PhysicianCommunicationService(pool);

  // ==================== PHYSICIANS ====================

  /**
   * Get all physicians
   * GET /api/physician-communications/physicians
   */
  router.get(
    '/physicians',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          activeOnly: z.coerce.boolean().optional(),
          search: z.string().optional(),
        });

        const { activeOnly, search } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const physicians = await commService.getPhysicians(organizationId, {
          activeOnly,
          search,
        });

        res.json({ physicians, count: physicians.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get physician by ID
   * GET /api/physician-communications/physicians/:physicianId
   */
  router.get(
    '/physicians/:physicianId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          physicianId: z.string().uuid(),
        });

        const { physicianId } = paramsSchema.parse(req.params);

        const physician = await commService.getPhysicianById(physicianId);

        if (!physician) {
          res.status(404).json({ error: 'Physician not found' });
          return;
        }

        res.json(physician);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create a physician
   * POST /api/physician-communications/physicians
   */
  router.post(
    '/physicians',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          firstName: z.string().min(1).max(100),
          lastName: z.string().min(1).max(100),
          credentials: z.string().max(50).optional(),
          specialty: z.string().max(100).optional(),
          npi: z.string().max(10).optional(),
          phone: z.string().max(20).optional(),
          fax: z.string().max(20).optional(),
          email: z.string().email().max(200).optional(),
          secureEmail: z.string().email().max(200).optional(),
          practiceName: z.string().max(200).optional(),
          addressLine1: z.string().max(200).optional(),
          addressLine2: z.string().max(200).optional(),
          city: z.string().max(100).optional(),
          state: z.string().max(2).optional(),
          zip: z.string().max(10).optional(),
          preferredContact: z.enum(preferredContacts).optional(),
          acceptsSecureMessages: z.boolean().optional(),
          portalUrl: z.string().max(500).optional(),
          contactNotes: z.string().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId } = req.user as { organizationId: string };

        const physician = await commService.createPhysician({
          organizationId,
          ...data,
        });

        res.status(201).json(physician);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update a physician
   * PATCH /api/physician-communications/physicians/:physicianId
   */
  router.patch(
    '/physicians/:physicianId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          physicianId: z.string().uuid(),
        });
        const bodySchema = z.object({
          firstName: z.string().min(1).max(100).optional(),
          lastName: z.string().min(1).max(100).optional(),
          credentials: z.string().max(50).optional(),
          specialty: z.string().max(100).optional(),
          npi: z.string().max(10).optional(),
          phone: z.string().max(20).optional(),
          fax: z.string().max(20).optional(),
          email: z.string().email().max(200).optional(),
          secureEmail: z.string().email().max(200).optional(),
          practiceName: z.string().max(200).optional(),
          addressLine1: z.string().max(200).optional(),
          addressLine2: z.string().max(200).optional(),
          city: z.string().max(100).optional(),
          state: z.string().max(2).optional(),
          zip: z.string().max(10).optional(),
          preferredContact: z.enum(preferredContacts).optional(),
          acceptsSecureMessages: z.boolean().optional(),
          portalUrl: z.string().max(500).optional(),
          contactNotes: z.string().optional(),
        });

        const { physicianId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const physician = await commService.updatePhysician({
          id: physicianId,
          ...data,
        });

        res.json(physician);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Deactivate a physician
   * DELETE /api/physician-communications/physicians/:physicianId
   */
  router.delete(
    '/physicians/:physicianId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          physicianId: z.string().uuid(),
        });

        const { physicianId } = paramsSchema.parse(req.params);

        await commService.deactivatePhysician(physicianId);

        res.json({ success: true, message: 'Physician deactivated' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== CLIENT PHYSICIANS ====================

  /**
   * Get physicians for a client
   * GET /api/physician-communications/client/:clientId/physicians
   */
  router.get(
    '/client/:clientId/physicians',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });

        const { clientId } = paramsSchema.parse(req.params);

        const physicians = await commService.getClientPhysicians(clientId);

        res.json({ clientId, physicians, count: physicians.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Add a physician to a client
   * POST /api/physician-communications/client/:clientId/physicians
   */
  router.post(
    '/client/:clientId/physicians',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const bodySchema = z.object({
          physicianId: z.string().uuid(),
          relationshipType: z.enum(relationshipTypes),
          specialtyNotes: z.string().max(200).optional(),
          isPrimary: z.boolean().optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const clientPhysician = await commService.addClientPhysician({
          clientId,
          ...data,
        });

        res.status(201).json(clientPhysician);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Remove a physician from a client
   * DELETE /api/physician-communications/client/:clientId/physicians/:physicianId
   */
  router.delete(
    '/client/:clientId/physicians/:physicianId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
          physicianId: z.string().uuid(),
        });

        const { clientId, physicianId } = paramsSchema.parse(req.params);

        await commService.removeClientPhysician(clientId, physicianId);

        res.json({ success: true, message: 'Physician removed from client' });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Set primary physician for a client
   * POST /api/physician-communications/client/:clientId/physicians/:physicianId/set-primary
   */
  router.post(
    '/client/:clientId/physicians/:physicianId/set-primary',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
          physicianId: z.string().uuid(),
        });

        const { clientId, physicianId } = paramsSchema.parse(req.params);

        await commService.setPrimaryPhysician(clientId, physicianId);

        res.json({ success: true, message: 'Primary physician set' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== COMMUNICATIONS ====================

  /**
   * Create a communication
   * POST /api/physician-communications
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          branchId: z.string().uuid().optional(),
          clientId: z.string().uuid(),
          physicianId: z.string().uuid(),
          visitId: z.string().uuid().optional(),
          communicationType: z.enum(communicationTypes),
          urgency: z.enum(urgencies).optional(),
          subject: z.string().min(1).max(300),
          message: z.string().min(1),
          clinicalContext: z.string().optional(),
          attachments: z.array(z.unknown()).optional(),
          contactMethod: z.enum(contactMethods),
          contactNotes: z.string().optional(),
          sentByName: z.string().min(1),
          sentByCredentials: z.string().optional(),
          requiresResponse: z.boolean().optional(),
          responseDueBy: z
            .string()
            .refine((d) => !isNaN(Date.parse(d)))
            .optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const communication = await commService.createCommunication({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          physicianId: data.physicianId,
          visitId: data.visitId,
          communicationType: data.communicationType,
          urgency: data.urgency,
          subject: data.subject,
          message: data.message,
          clinicalContext: data.clinicalContext,
          attachments: data.attachments,
          contactMethod: data.contactMethod,
          contactNotes: data.contactNotes,
          sentBy: userId,
          sentByName: data.sentByName,
          sentByCredentials: data.sentByCredentials,
          requiresResponse: data.requiresResponse,
          responseDueBy: data.responseDueBy,
        });

        res.status(201).json(communication);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get communication by ID
   * GET /api/physician-communications/:communicationId
   */
  router.get(
    '/:communicationId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          communicationId: z.string().uuid(),
        });

        const { communicationId } = paramsSchema.parse(req.params);

        const communication = await commService.getCommunicationById(communicationId);

        if (!communication) {
          res.status(404).json({ error: 'Communication not found' });
          return;
        }

        res.json(communication);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get communications for a client
   * GET /api/physician-communications/client/:clientId
   */
  router.get(
    '/client/:clientId/communications',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          physicianId: z.string().uuid().optional(),
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { physicianId, limit, offset } = querySchema.parse(req.query);

        const communications = await commService.getClientCommunications(clientId, {
          physicianId,
          limit,
          offset,
        });

        res.json({ clientId, communications, count: communications.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get pending responses
   * GET /api/physician-communications/pending-responses/organization
   */
  router.get(
    '/pending-responses/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const communications = await commService.getPendingResponses(organizationId);

        res.json({ communications, count: communications.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get urgent communications
   * GET /api/physician-communications/urgent/organization
   */
  router.get(
    '/urgent/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const communications = await commService.getUrgentCommunications(organizationId);

        res.json({ communications, count: communications.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update communication status
   * PATCH /api/physician-communications/:communicationId/status
   */
  router.patch(
    '/:communicationId/status',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          communicationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          status: z.enum(statuses),
        });

        const { communicationId } = paramsSchema.parse(req.params);
        const { status } = bodySchema.parse(req.body);

        const communication = await commService.updateStatus(communicationId, status);

        res.json(communication);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Record a physician response
   * POST /api/physician-communications/:communicationId/response
   */
  router.post(
    '/:communicationId/response',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          communicationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          physicianResponse: z.string().min(1),
          respondedVia: z.string().optional(),
          ordersReceived: z.string().optional(),
        });

        const { communicationId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const communication = await commService.recordResponse({
          id: communicationId,
          ...data,
        });

        res.json(communication);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Mark orders as entered
   * POST /api/physician-communications/:communicationId/orders-entered
   */
  router.post(
    '/:communicationId/orders-entered',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          communicationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          enteredByName: z.string().min(1),
        });

        const { communicationId } = paramsSchema.parse(req.params);
        const { enteredByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const communication = await commService.markOrdersEntered(
          communicationId,
          userId,
          enteredByName
        );

        res.json(communication);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Mark requires follow-up
   * POST /api/physician-communications/:communicationId/requires-follow-up
   */
  router.post(
    '/:communicationId/requires-follow-up',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          communicationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          notes: z.string().min(1),
        });

        const { communicationId } = paramsSchema.parse(req.params);
        const { notes } = bodySchema.parse(req.body);

        const communication = await commService.markRequiresFollowUp(communicationId, notes);

        res.json(communication);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Complete follow-up
   * POST /api/physician-communications/:communicationId/complete-follow-up
   */
  router.post(
    '/:communicationId/complete-follow-up',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          communicationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          completedByName: z.string().min(1),
        });

        const { communicationId } = paramsSchema.parse(req.params);
        const { completedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const communication = await commService.completeFollowUp(
          communicationId,
          userId,
          completedByName
        );

        res.json(communication);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete a communication
   * DELETE /api/physician-communications/:communicationId
   */
  router.delete(
    '/:communicationId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          communicationId: z.string().uuid(),
        });

        const { communicationId } = paramsSchema.parse(req.params);

        await commService.deleteCommunication(communicationId);

        res.json({ success: true, message: 'Communication deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== TEMPLATES ====================

  /**
   * Get templates
   * GET /api/physician-communications/templates
   */
  router.get(
    '/templates/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          communicationType: z.enum(communicationTypes).optional(),
        });

        const { communicationType } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const templates = await commService.getTemplates(organizationId, communicationType);

        res.json({ templates, count: templates.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create a template
   * POST /api/physician-communications/templates
   */
  router.post(
    '/templates',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          name: z.string().min(1).max(200),
          communicationType: z.enum(communicationTypes),
          subjectTemplate: z.string().min(1).max(300),
          messageTemplate: z.string().min(1),
          displayOrder: z.number().int().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId } = req.user as { organizationId: string };

        const template = await commService.createTemplate({
          organizationId,
          ...data,
        });

        res.status(201).json(template);
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== SUMMARY ====================

  /**
   * Get communication summary
   * GET /api/physician-communications/summary/organization
   */
  router.get(
    '/summary/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const summary = await commService.getCommunicationSummary(organizationId);

        res.json(summary);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Generate printable communication log for client
   * GET /api/physician-communications/client/:clientId/log
   */
  router.get(
    '/client/:clientId/log',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });

        const { clientId } = paramsSchema.parse(req.params);

        const communications = await commService.getClientCommunications(clientId, {
          limit: 50,
        });

        const log = commService.generateCommunicationLog(communications);

        res.setHeader('Content-Type', 'text/plain');
        res.send(log);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
