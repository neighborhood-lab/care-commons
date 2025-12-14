/**
 * Respite Care Routes
 *
 * API routes for family respite care coordination.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { asyncHandler, PermissionService } from '@folkcare/core';
import type { UUID, UserContext } from '@folkcare/core';
import { RespiteService } from '../services/respite-service.js';
import { RespiteRepository } from '../repositories/respite-repository.js';
import { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const respiteRequestStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DECLINED'
]);

const respitePrioritySchema = z.enum(['ROUTINE', 'PREFERRED', 'URGENT']);

const respiteReasonCategorySchema = z.enum([
  'APPOINTMENT',
  'WORK',
  'FAMILY_EVENT',
  'SELF_CARE',
  'VACATION',
  'EMERGENCY',
  'OTHER'
]);

const genderPreferenceSchema = z.enum(['MALE', 'FEMALE', 'NO_PREFERENCE']);

const emergencyContactSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  relationship: z.string().min(1).max(100)
});

const createRespiteRequestSchema = z.object({
  clientId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  priority: respitePrioritySchema.optional(),
  reasonCategory: respiteReasonCategorySchema,
  reasonDescription: z.string().max(1000).optional(),
  requestedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestedStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  requestedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestedEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  flexibleTiming: z.boolean().optional(),
  preferredCaregiverId: z.string().uuid().optional(),
  acceptAnyCaregiver: z.boolean().optional(),
  genderPreference: genderPreferenceSchema.optional(),
  requiredSkills: z.array(z.string()).optional(),
  specialInstructions: z.string().max(2000).optional(),
  emergencyContact: emergencyContactSchema,
  organizationId: z.string().uuid(),
  branchId: z.string().uuid()
});

const updateRespiteRequestSchema = z.object({
  priority: respitePrioritySchema.optional(),
  reasonCategory: respiteReasonCategorySchema.optional(),
  reasonDescription: z.string().max(1000).optional(),
  requestedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  requestedStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  requestedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  requestedEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  flexibleTiming: z.boolean().optional(),
  preferredCaregiverId: z.string().uuid().optional(),
  acceptAnyCaregiver: z.boolean().optional(),
  genderPreference: genderPreferenceSchema.optional(),
  requiredSkills: z.array(z.string()).optional(),
  specialInstructions: z.string().max(2000).optional(),
  emergencyContact: emergencyContactSchema.optional()
});

const approveRequestSchema = z.object({
  approvalNotes: z.string().max(1000).optional()
});

const declineRequestSchema = z.object({
  declineReason: z.string().min(1).max(1000)
});

const assignCaregiverSchema = z.object({
  caregiverId: z.string().uuid(),
  visitId: z.string().uuid()
});

const completeRequestSchema = z.object({
  completionNotes: z.string().max(1000).optional(),
  familyRating: z.number().int().min(1).max(5).optional(),
  familyFeedback: z.string().max(2000).optional()
});

const queryFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  status: z.union([respiteRequestStatusSchema, z.array(respiteRequestStatusSchema)]).optional(),
  priority: respitePrioritySchema.optional(),
  startDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assignedCaregiverId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional()
});

const availableCaregiversSchema = z.object({
  organizationId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  requiredSkills: z.array(z.string()).optional(),
  genderPreference: genderPreferenceSchema.optional(),
  preferredCaregiverId: z.string().uuid().optional()
});

// ============================================================================
// Route Handlers
// ============================================================================

export function createRespiteRoutes(db: Pool): Router {
  const router = Router();

  // Initialize dependencies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const database = { query: (text: string, params?: unknown[]) => db.query(text, params) } as any;
  const respiteRepo = new RespiteRepository(database);
  const familyMemberRepo = new FamilyMemberRepository(database);
  const permissions = new PermissionService();
  const service = new RespiteService(respiteRepo, familyMemberRepo, permissions);

  /**
   * Create a new respite request
   * POST /respite/requests
   */
  router.post('/requests', asyncHandler(async (req, res) => {
    const input = createRespiteRequestSchema.parse(req.body);
    const context = req.user as UserContext;

    const request = await service.createRequest(input, context);
    res.status(201).json(request);
  }));

  /**
   * Get a single respite request
   * GET /respite/requests/:id
   */
  router.get('/requests/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const request = await service.getRequest(id, context);
    res.json(request);
  }));

  /**
   * Get respite request with full details
   * GET /respite/requests/:id/details
   */
  router.get('/requests/:id/details', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const details = await service.getRequestWithDetails(id, context);
    res.json(details);
  }));

  /**
   * Update a draft respite request
   * PATCH /respite/requests/:id
   */
  router.patch('/requests/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = updateRespiteRequestSchema.parse(req.body);
    const context = req.user as UserContext;

    const request = await service.updateRequest(id, input, context);
    res.json(request);
  }));

  /**
   * Submit a draft request for review
   * POST /respite/requests/:id/submit
   */
  router.post('/requests/:id/submit', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const request = await service.submitRequest(id, context);
    res.json(request);
  }));

  /**
   * Approve a submitted request (coordinator)
   * POST /respite/requests/:id/approve
   */
  router.post('/requests/:id/approve', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = approveRequestSchema.parse(req.body);
    const context = req.user as UserContext;

    const request = await service.approveRequest(id, input, context);
    res.json(request);
  }));

  /**
   * Decline a submitted request (coordinator)
   * POST /respite/requests/:id/decline
   */
  router.post('/requests/:id/decline', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = declineRequestSchema.parse(req.body);
    const context = req.user as UserContext;

    const request = await service.declineRequest(id, input, context);
    res.json(request);
  }));

  /**
   * Assign a caregiver to an approved request (coordinator)
   * POST /respite/requests/:id/assign
   */
  router.post('/requests/:id/assign', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = assignCaregiverSchema.parse(req.body);
    const context = req.user as UserContext;

    const request = await service.assignCaregiver(id, input.caregiverId, input.visitId, context);
    res.json(request);
  }));

  /**
   * Complete a respite request
   * POST /respite/requests/:id/complete
   */
  router.post('/requests/:id/complete', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = completeRequestSchema.parse(req.body);
    const context = req.user as UserContext;

    const request = await service.completeRequest(id, input, context);
    res.json(request);
  }));

  /**
   * Cancel a respite request
   * POST /respite/requests/:id/cancel
   */
  router.post('/requests/:id/cancel', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const request = await service.cancelRequest(id, context);
    res.json(request);
  }));

  /**
   * Query respite requests with filters
   * GET /respite/requests
   */
  router.get('/requests', asyncHandler(async (req, res) => {
    const filters = queryFiltersSchema.parse(req.query);
    const context = req.user as UserContext;

    const requests = await service.queryRequests(filters, context);
    res.json(requests);
  }));

  /**
   * Get requests by family member
   * GET /respite/family-member/:familyMemberId/requests
   */
  router.get('/family-member/:familyMemberId/requests', asyncHandler(async (req, res) => {
    const familyMemberId = req.params.familyMemberId as UUID;
    const context = req.user as UserContext;

    const requests = await service.getRequestsByFamilyMember(familyMemberId, context);
    res.json(requests);
  }));

  /**
   * Get requests by client
   * GET /respite/client/:clientId/requests
   */
  router.get('/client/:clientId/requests', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const requests = await service.getRequestsByClient(clientId, context);
    res.json(requests);
  }));

  /**
   * Get upcoming requests for a client
   * GET /respite/client/:clientId/upcoming
   */
  router.get('/client/:clientId/upcoming', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const requests = await service.getUpcomingRequests(clientId, context);
    res.json(requests);
  }));

  /**
   * Get usage summary for a family member
   * GET /respite/family-member/:familyMemberId/client/:clientId/usage
   */
  router.get('/family-member/:familyMemberId/client/:clientId/usage', asyncHandler(async (req, res) => {
    const familyMemberId = req.params.familyMemberId as UUID;
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const summary = await service.getUsageSummary(familyMemberId, clientId, context);
    res.json(summary);
  }));

  /**
   * Get available caregivers for a time slot
   * POST /respite/caregivers/available
   */
  router.post('/caregivers/available', asyncHandler(async (req, res) => {
    const input = availableCaregiversSchema.parse(req.body);
    const context = req.user as UserContext;

    const caregivers = await service.getAvailableCaregivers(
      input.organizationId,
      input.startDate,
      input.startTime,
      input.endDate,
      input.endTime,
      input.requiredSkills,
      input.genderPreference,
      input.preferredCaregiverId,
      context
    );
    res.json(caregivers);
  }));

  return router;
}

export default createRespiteRoutes;
