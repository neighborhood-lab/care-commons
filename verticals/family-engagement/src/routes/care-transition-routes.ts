/**
 * Care Transition Routes
 *
 * API routes for transition of care support.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { asyncHandler, PermissionService } from '@folkcare/core';
import type { UUID, UserContext } from '@folkcare/core';
import { CareTransitionService } from '../services/care-transition-service.js';
import {
  CareTransitionRepository,
  TransitionChecklistRepository,
  TransitionCommunicationRepository,
  TransitionUpdateRepository,
  TransitionSupportResourceRepository
} from '../repositories/care-transition-repository.js';
import { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const transitionTypeSchema = z.enum([
  'HOSPITALIZATION',
  'HOSPITAL_DISCHARGE',
  'SKILLED_NURSING',
  'ASSISTED_LIVING',
  'MEMORY_CARE',
  'REHABILITATION',
  'HOSPICE',
  'HOME_RETURN',
  'CARE_LEVEL_CHANGE'
]);

const transitionStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]);

const transitionUrgencySchema = z.enum(['PLANNED', 'URGENT', 'EMERGENCY']);

const locationTypeSchema = z.enum([
  'HOME',
  'HOSPITAL',
  'SKILLED_NURSING',
  'ASSISTED_LIVING',
  'REHAB',
  'HOSPICE',
  'OTHER'
]);

const checklistCategorySchema = z.enum([
  'MEDICAL',
  'MEDICATION',
  'EQUIPMENT',
  'DOCUMENTATION',
  'INSURANCE',
  'HOME_PREPARATION',
  'CARE_COORDINATION',
  'FAMILY_SUPPORT',
  'FOLLOW_UP'
]);

const communicationTypeSchema = z.enum([
  'CALL',
  'EMAIL',
  'SMS',
  'IN_PERSON',
  'PORTAL_MESSAGE'
]);

const updateTypeSchema = z.enum([
  'STATUS_CHANGE',
  'CHECKLIST_UPDATE',
  'COMMUNICATION',
  'LOCATION_UPDATE',
  'CARE_PLAN_CHANGE',
  'GENERAL_UPDATE'
]);

const transitionLocationSchema = z.object({
  type: locationTypeSchema,
  name: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  contactPerson: z.string().max(255).optional(),
  roomNumber: z.string().max(50).optional()
});

const createTransitionSchema = z.object({
  clientId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  transitionType: transitionTypeSchema,
  urgency: transitionUrgencySchema,
  anticipatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fromLocation: transitionLocationSchema,
  toLocation: transitionLocationSchema,
  reason: z.string().min(1).max(2000),
  diagnosisRelated: z.string().max(500).optional(),
  familyVisibleNotes: z.string().max(2000).optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  primaryPhysician: z.string().max(255).optional(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid()
});

const updateTransitionSchema = z.object({
  status: transitionStatusSchema.optional(),
  urgency: transitionUrgencySchema.optional(),
  anticipatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actualStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actualEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fromLocation: transitionLocationSchema.optional(),
  toLocation: transitionLocationSchema.optional(),
  reason: z.string().max(2000).optional(),
  diagnosisRelated: z.string().max(500).optional(),
  coordinatorNotes: z.string().max(2000).optional(),
  familyVisibleNotes: z.string().max(2000).optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  primaryPhysician: z.string().max(255).optional(),
  dischargeManager: z.string().max(255).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  followUpNotes: z.string().max(2000).optional()
});

const createChecklistItemSchema = z.object({
  transitionId: z.string().uuid(),
  clientId: z.string().uuid(),
  category: checklistCategorySchema,
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assignedTo: z.enum(['FAMILY', 'COORDINATOR', 'CAREGIVER', 'OTHER']).optional(),
  assignedUserId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
  organizationId: z.string().uuid()
});

const completeChecklistItemSchema = z.object({
  completionNotes: z.string().max(1000).optional()
});

const logCommunicationSchema = z.object({
  transitionId: z.string().uuid(),
  clientId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  communicationType: communicationTypeSchema,
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  subject: z.string().min(1).max(500),
  summary: z.string().min(1).max(5000),
  outcome: z.string().max(1000).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  organizationId: z.string().uuid()
});

const postUpdateSchema = z.object({
  transitionId: z.string().uuid(),
  clientId: z.string().uuid(),
  updateType: updateTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  isPublic: z.boolean(),
  organizationId: z.string().uuid()
});

const transitionFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  transitionType: transitionTypeSchema.optional(),
  status: z.union([transitionStatusSchema, z.array(transitionStatusSchema)]).optional(),
  urgency: transitionUrgencySchema.optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional()
});

// ============================================================================
// Route Handlers
// ============================================================================

export function createCareTransitionRoutes(db: Pool): Router {
  const router = Router();

  // Initialize dependencies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const database = { query: (text: string, params?: unknown[]) => db.query(text, params) } as any;
  const transitionRepo = new CareTransitionRepository(database);
  const checklistRepo = new TransitionChecklistRepository(database);
  const communicationRepo = new TransitionCommunicationRepository(database);
  const updateRepo = new TransitionUpdateRepository(database);
  const resourceRepo = new TransitionSupportResourceRepository(database);
  const familyMemberRepo = new FamilyMemberRepository(database);
  const permissions = new PermissionService();
  const service = new CareTransitionService(
    transitionRepo,
    checklistRepo,
    communicationRepo,
    updateRepo,
    resourceRepo,
    familyMemberRepo,
    permissions
  );

  // ============================================================================
  // Transition CRUD
  // ============================================================================

  /**
   * Create a new care transition
   * POST /transitions
   */
  router.post('/', asyncHandler(async (req, res) => {
    const input = createTransitionSchema.parse(req.body);
    const context = req.user as UserContext;

    const transition = await service.createTransition(input, context);
    res.status(201).json(transition);
  }));

  /**
   * Get a single transition
   * GET /transitions/:id
   */
  router.get('/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const transition = await service.getTransition(id, context);
    res.json(transition);
  }));

  /**
   * Get transition with full details
   * GET /transitions/:id/details
   */
  router.get('/:id/details', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const details = await service.getTransitionWithDetails(id, context);
    res.json(details);
  }));

  /**
   * Update a transition
   * PATCH /transitions/:id
   */
  router.patch('/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = updateTransitionSchema.parse(req.body);
    const context = req.user as UserContext;

    const transition = await service.updateTransition(id, input, context);
    res.json(transition);
  }));

  /**
   * Start a transition
   * POST /transitions/:id/start
   */
  router.post('/:id/start', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const transition = await service.startTransition(id, context);
    res.json(transition);
  }));

  /**
   * Complete a transition
   * POST /transitions/:id/complete
   */
  router.post('/:id/complete', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const transition = await service.completeTransition(id, context);
    res.json(transition);
  }));

  /**
   * Cancel a transition
   * POST /transitions/:id/cancel
   */
  router.post('/:id/cancel', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const transition = await service.cancelTransition(id, context);
    res.json(transition);
  }));

  /**
   * Query transitions with filters
   * GET /transitions
   */
  router.get('/', asyncHandler(async (req, res) => {
    const filters = transitionFiltersSchema.parse(req.query);
    const context = req.user as UserContext;

    const transitions = await service.queryTransitions(filters, context);
    res.json(transitions);
  }));

  // ============================================================================
  // Checklist Management
  // ============================================================================

  /**
   * Add a checklist item
   * POST /transitions/checklist/items
   */
  router.post('/checklist/items', asyncHandler(async (req, res) => {
    const input = createChecklistItemSchema.parse(req.body);
    const context = req.user as UserContext;

    const item = await service.addChecklistItem(input, context);
    res.status(201).json(item);
  }));

  /**
   * Get checklist items for a transition
   * GET /transitions/:id/checklist
   */
  router.get('/:id/checklist', asyncHandler(async (req, res) => {
    const transitionId = req.params.id as UUID;
    const context = req.user as UserContext;

    const items = await service.getChecklistItems(transitionId, context);
    res.json(items);
  }));

  /**
   * Get checklist progress summary
   * GET /transitions/:id/checklist/progress
   */
  router.get('/:id/checklist/progress', asyncHandler(async (req, res) => {
    const transitionId = req.params.id as UUID;
    const context = req.user as UserContext;

    const progress = await service.getChecklistProgress(transitionId, context);
    res.json(progress);
  }));

  /**
   * Complete a checklist item
   * POST /transitions/checklist/items/:itemId/complete
   */
  router.post('/checklist/items/:itemId/complete', asyncHandler(async (req, res) => {
    const itemId = req.params.itemId as UUID;
    const input = completeChecklistItemSchema.parse(req.body);
    const context = req.user as UserContext;

    const item = await service.completeChecklistItem(itemId, input, context);
    res.json(item);
  }));

  /**
   * Uncomplete a checklist item
   * POST /transitions/checklist/items/:itemId/uncomplete
   */
  router.post('/checklist/items/:itemId/uncomplete', asyncHandler(async (req, res) => {
    const itemId = req.params.itemId as UUID;
    const context = req.user as UserContext;

    const item = await service.uncompleteChecklistItem(itemId, context);
    res.json(item);
  }));

  // ============================================================================
  // Communications
  // ============================================================================

  /**
   * Log a communication
   * POST /transitions/communications
   */
  router.post('/communications', asyncHandler(async (req, res) => {
    const input = logCommunicationSchema.parse(req.body);
    const context = req.user as UserContext;

    const communication = await service.logCommunication(input, context);
    res.status(201).json(communication);
  }));

  /**
   * Get communications for a transition
   * GET /transitions/:id/communications
   */
  router.get('/:id/communications', asyncHandler(async (req, res) => {
    const transitionId = req.params.id as UUID;
    const context = req.user as UserContext;

    const communications = await service.getCommunications(transitionId, context);
    res.json(communications);
  }));

  // ============================================================================
  // Updates
  // ============================================================================

  /**
   * Post an update
   * POST /transitions/updates
   */
  router.post('/updates', asyncHandler(async (req, res) => {
    const input = postUpdateSchema.parse(req.body);
    const context = req.user as UserContext;

    const update = await service.postUpdate(input, context);
    res.status(201).json(update);
  }));

  /**
   * Get updates for a transition
   * GET /transitions/:id/updates
   */
  router.get('/:id/updates', asyncHandler(async (req, res) => {
    const transitionId = req.params.id as UUID;
    const publicOnly = req.query.publicOnly === 'true';
    const context = req.user as UserContext;

    const updates = await service.getUpdates(transitionId, publicOnly, context);
    res.json(updates);
  }));

  // ============================================================================
  // Client and Family Views
  // ============================================================================

  /**
   * Get transitions by client
   * GET /transitions/client/:clientId
   */
  router.get('/client/:clientId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const transitions = await service.getTransitionsByClient(clientId, context);
    res.json(transitions);
  }));

  /**
   * Get active transitions for client
   * GET /transitions/client/:clientId/active
   */
  router.get('/client/:clientId/active', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const transitions = await service.getActiveTransitionsByClient(clientId, context);
    res.json(transitions);
  }));

  /**
   * Get family transition dashboard
   * GET /transitions/client/:clientId/dashboard
   */
  router.get('/client/:clientId/dashboard', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const dashboard = await service.getFamilyDashboard(clientId, context);
    res.json(dashboard);
  }));

  // ============================================================================
  // Support Resources
  // ============================================================================

  /**
   * Get support resources for a transition type
   * GET /transitions/resources/:transitionType
   */
  router.get('/resources/:transitionType', asyncHandler(async (req, res) => {
    const transitionType = req.params.transitionType as string;
    const organizationId = req.query.organizationId as UUID | undefined;
    const context = req.user as UserContext;

    const resources = await service.getSupportResources(transitionType, organizationId, context);
    res.json(resources);
  }));

  return router;
}

export default createCareTransitionRoutes;
