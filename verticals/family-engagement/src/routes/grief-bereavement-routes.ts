/**
 * Grief & Bereavement Routes
 *
 * API routes for grief and bereavement support,
 * resources, memorials, and family interactions.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { asyncHandler, PermissionService } from '@folkcare/core';
import type { UUID, UserContext } from '@folkcare/core';
import { GriefBereavementService } from '../services/grief-bereavement-service.js';
import {
  BereavementResourceRepository,
  BereavementSupportRepository,
  SupportInteractionRepository,
  MemorialRepository,
  MemorialGuestbookRepository,
  BereavementSupportRequestRepository,
  SavedResourceRepository
} from '../repositories/grief-bereavement-repository.js';
import { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const resourceCategorySchema = z.enum([
  'EMOTIONAL_SUPPORT',
  'PRACTICAL_GUIDANCE',
  'FINANCIAL_LEGAL',
  'SPIRITUAL_RELIGIOUS',
  'MEMORIAL_SERVICES',
  'CHILDREN_FAMILY',
  'SELF_CARE',
  'COMMUNITY_CONNECTIONS',
  'READING_MATERIALS',
  'CRISIS_SUPPORT'
]);

const resourceTypeSchema = z.enum([
  'ARTICLE',
  'GUIDE',
  'VIDEO',
  'AUDIO',
  'SUPPORT_GROUP',
  'COUNSELING_SERVICE',
  'HOTLINE',
  'LOCAL_SERVICE',
  'BOOK',
  'TEMPLATE',
  'CHECKLIST',
  'EXTERNAL_LINK'
]);

const griefStageSchema = z.enum([
  'ANTICIPATORY',
  'IMMEDIATE',
  'ACUTE',
  'INTEGRATED',
  'ANY'
]);

const resourceStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'UNDER_REVIEW']);

const lossTypeSchema = z.enum(['CLIENT_DEATH', 'FAMILY_MEMBER', 'ANTICIPATORY']);

const supportStatusSchema = z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'DECLINED']);

const contactMethodSchema = z.enum(['PHONE', 'EMAIL', 'IN_PERSON', 'NO_CONTACT']);

const contactFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED']);

const interactionTypeSchema = z.enum([
  'INITIAL_OUTREACH',
  'CHECK_IN_CALL',
  'CHECK_IN_EMAIL',
  'IN_PERSON_VISIT',
  'RESOURCE_SHARED',
  'REFERRAL_MADE',
  'CONDOLENCE_SENT',
  'MEMORIAL_ASSISTANCE',
  'FAMILY_REQUEST',
  'CRISIS_INTERVENTION'
]);

const memorialPrivacySchema = z.enum(['PRIVATE', 'ORGANIZATION', 'PUBLIC']);

const supportRequestTypeSchema = z.enum([
  'COUNSELING_REFERRAL',
  'SUPPORT_GROUP',
  'PRACTICAL_HELP',
  'RESOURCE_REQUEST',
  'TALK_TO_SOMEONE',
  'MEMORIAL_HELP',
  'OTHER'
]);

const urgencySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRISIS']);

// Resource schemas
const createResourceSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  category: resourceCategorySchema,
  resourceType: resourceTypeSchema,
  content: z.string().max(50000).optional(),
  externalUrl: z.string().url().max(2000).optional(),
  fileUrl: z.string().url().max(2000).optional(),
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().max(255).optional(),
  address: z.string().max(500).optional(),
  hoursOfOperation: z.string().max(255).optional(),
  griefStage: griefStageSchema.optional(),
  tags: z.array(z.string().max(50)).optional(),
  language: z.string().max(10).optional(),
  estimatedReadTime: z.number().int().positive().optional(),
  isNational: z.boolean().optional(),
  statesCovered: z.array(z.string().max(2)).optional(),
  religionSpecific: z.string().max(100).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  organizationId: z.string().uuid().optional()
});

const resourceFiltersSchema = z.object({
  category: resourceCategorySchema.optional(),
  resourceType: resourceTypeSchema.optional(),
  griefStage: griefStageSchema.optional(),
  status: resourceStatusSchema.optional(),
  language: z.string().max(10).optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isNational: z.boolean().optional(),
  state: z.string().max(2).optional(),
  organizationId: z.string().uuid().optional(),
  searchQuery: z.string().max(200).optional()
});

// Support schemas
const createSupportSchema = z.object({
  clientId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  lossType: lossTypeSchema,
  dateOfLoss: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  anticipatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  initialAssessmentNotes: z.string().max(5000).optional(),
  specialConsiderations: z.string().max(2000).optional(),
  preferredContactMethod: contactMethodSchema.optional(),
  contactFrequency: contactFrequencySchema.optional(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid()
});

const updateSupportSchema = z.object({
  status: supportStatusSchema.optional(),
  dateOfLoss: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  supportPlanNotes: z.string().max(5000).optional(),
  specialConsiderations: z.string().max(2000).optional(),
  preferredContactMethod: contactMethodSchema.optional(),
  contactFrequency: contactFrequencySchema.optional(),
  doNotContactUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextFollowUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const supportFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  status: z.union([supportStatusSchema, z.array(supportStatusSchema)]).optional(),
  lossType: lossTypeSchema.optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  requiresFollowUp: z.boolean().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional()
});

// Interaction schema
const logInteractionSchema = z.object({
  bereavementSupportId: z.string().uuid(),
  clientId: z.string().uuid(),
  interactionType: interactionTypeSchema,
  interactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  interactionTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMinutes: z.number().int().positive().optional(),
  familyMemberIds: z.array(z.string().uuid()).optional(),
  summary: z.string().min(1).max(5000),
  emotionalState: z.string().max(100).optional(),
  concernsRaised: z.string().max(2000).optional(),
  nextSteps: z.string().max(2000).optional(),
  resourcesShared: z.array(z.string().uuid()).optional(),
  referralsMade: z.array(z.string().max(500)).optional(),
  requiresFollowUp: z.boolean().optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  followUpNotes: z.string().max(2000).optional(),
  organizationId: z.string().uuid()
});

// Memorial schemas
const createMemorialSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(500),
  biography: z.string().max(50000).optional(),
  obituary: z.string().max(10000).optional(),
  photoUrl: z.string().url().max(2000).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deathDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceLocation: z.string().max(500).optional(),
  donationInfo: z.object({
    organizationName: z.string().max(255),
    url: z.string().url().max(2000).optional(),
    instructions: z.string().max(1000).optional()
  }).optional(),
  allowGuestbook: z.boolean().optional(),
  allowCandles: z.boolean().optional(),
  privacy: memorialPrivacySchema.optional(),
  accessCode: z.string().max(50).optional(),
  familyMemberId: z.string().uuid(),
  organizationId: z.string().uuid()
});

const updateMemorialSchema = z.object({
  title: z.string().max(500).optional(),
  biography: z.string().max(50000).optional(),
  obituary: z.string().max(10000).optional(),
  photoUrl: z.string().url().max(2000).optional(),
  additionalPhotos: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().max(2000).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deathDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceLocation: z.string().max(500).optional(),
  donationInfo: z.object({
    organizationName: z.string().max(255),
    url: z.string().url().max(2000).optional(),
    instructions: z.string().max(1000).optional()
  }).optional(),
  allowGuestbook: z.boolean().optional(),
  allowCandles: z.boolean().optional(),
  privacy: memorialPrivacySchema.optional(),
  accessCode: z.string().max(50).optional(),
  isPublished: z.boolean().optional()
});

// Guestbook schema
const addGuestbookEntrySchema = z.object({
  memorialId: z.string().uuid(),
  authorName: z.string().min(1).max(255),
  authorEmail: z.string().email().max(255).optional(),
  authorRelationship: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  isCandle: z.boolean().optional()
});

// Support request schema
const submitSupportRequestSchema = z.object({
  bereavementSupportId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  requestType: supportRequestTypeSchema,
  description: z.string().min(1).max(5000),
  urgency: urgencySchema.optional(),
  organizationId: z.string().uuid()
});

// ============================================================================
// Route Handlers
// ============================================================================

export function createGriefBereavementRoutes(db: Pool): Router {
  const router = Router();

  // Initialize dependencies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const database = { query: (text: string, params?: unknown[]) => db.query(text, params) } as any;
  const resourceRepo = new BereavementResourceRepository(database);
  const supportRepo = new BereavementSupportRepository(database);
  const interactionRepo = new SupportInteractionRepository(database);
  const memorialRepo = new MemorialRepository(database);
  const guestbookRepo = new MemorialGuestbookRepository(database);
  const requestRepo = new BereavementSupportRequestRepository(database);
  const savedResourceRepo = new SavedResourceRepository(database);
  const familyMemberRepo = new FamilyMemberRepository(database);
  const permissions = new PermissionService();
  const service = new GriefBereavementService(
    resourceRepo,
    supportRepo,
    interactionRepo,
    memorialRepo,
    guestbookRepo,
    requestRepo,
    savedResourceRepo,
    familyMemberRepo,
    permissions
  );

  // ============================================================================
  // Resource Routes
  // ============================================================================

  /**
   * Create a bereavement resource
   * POST /bereavement/resources
   */
  router.post('/resources', asyncHandler(async (req, res) => {
    const input = createResourceSchema.parse(req.body);
    const context = req.user as UserContext;

    const resource = await service.createResource(input, context);
    res.status(201).json(resource);
  }));

  /**
   * Get a single resource
   * GET /bereavement/resources/:id
   */
  router.get('/resources/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const resource = await service.getResource(id, context);
    res.json(resource);
  }));

  /**
   * Update a resource
   * PATCH /bereavement/resources/:id
   */
  router.patch('/resources/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = createResourceSchema.partial().parse(req.body);
    const context = req.user as UserContext;

    const resource = await service.updateResource(id, input, context);
    res.json(resource);
  }));

  /**
   * Delete a resource
   * DELETE /bereavement/resources/:id
   */
  router.delete('/resources/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    await service.deleteResource(id, context);
    res.status(204).send();
  }));

  /**
   * Search resources
   * GET /bereavement/resources
   */
  router.get('/resources', asyncHandler(async (req, res) => {
    const filters = resourceFiltersSchema.parse(req.query);
    const context = req.user as UserContext;

    const resources = await service.searchResources(filters, context);
    res.json(resources);
  }));

  /**
   * Mark resource as helpful
   * POST /bereavement/resources/:id/helpful
   */
  router.post('/resources/:id/helpful', asyncHandler(async (req, res) => {
    const resourceId = req.params.id as UUID;
    const { familyMemberId, wasHelpful } = req.body;
    const context = req.user as UserContext;

    await service.markResourceHelpful(resourceId, familyMemberId, wasHelpful, context);
    res.status(204).send();
  }));

  /**
   * Save a resource
   * POST /bereavement/resources/:id/save
   */
  router.post('/resources/:id/save', asyncHandler(async (req, res) => {
    const resourceId = req.params.id as UUID;
    const { familyMemberId } = req.body;
    const context = req.user as UserContext;

    await service.saveResource(resourceId, familyMemberId, context);
    res.status(204).send();
  }));

  /**
   * Unsave a resource
   * DELETE /bereavement/resources/:id/save
   */
  router.delete('/resources/:id/save', asyncHandler(async (req, res) => {
    const resourceId = req.params.id as UUID;
    const { familyMemberId } = req.body;
    const context = req.user as UserContext;

    await service.unsaveResource(resourceId, familyMemberId, context);
    res.status(204).send();
  }));

  // ============================================================================
  // Support Routes
  // ============================================================================

  /**
   * Create bereavement support record
   * POST /bereavement/support
   */
  router.post('/support', asyncHandler(async (req, res) => {
    const input = createSupportSchema.parse(req.body);
    const context = req.user as UserContext;

    const support = await service.createSupport(input, context);
    res.status(201).json(support);
  }));

  /**
   * Get support record
   * GET /bereavement/support/:id
   */
  router.get('/support/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const support = await service.getSupport(id, context);
    res.json(support);
  }));

  /**
   * Update support record
   * PATCH /bereavement/support/:id
   */
  router.patch('/support/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = updateSupportSchema.parse(req.body);
    const context = req.user as UserContext;

    const support = await service.updateSupport(id, input, context);
    res.json(support);
  }));

  /**
   * Query support records
   * GET /bereavement/support
   */
  router.get('/support', asyncHandler(async (req, res) => {
    const filters = supportFiltersSchema.parse(req.query);
    const context = req.user as UserContext;

    const supports = await service.querySupport(filters, context);
    res.json(supports);
  }));

  /**
   * Get support by client
   * GET /bereavement/support/client/:clientId
   */
  router.get('/support/client/:clientId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const supports = await service.getSupportByClient(clientId, context);
    res.json(supports);
  }));

  /**
   * Complete support record
   * POST /bereavement/support/:id/complete
   */
  router.post('/support/:id/complete', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const support = await service.completeSupport(id, context);
    res.json(support);
  }));

  // ============================================================================
  // Interaction Routes
  // ============================================================================

  /**
   * Log support interaction
   * POST /bereavement/interactions
   */
  router.post('/interactions', asyncHandler(async (req, res) => {
    const input = logInteractionSchema.parse(req.body);
    const context = req.user as UserContext;

    const interaction = await service.logInteraction(input, context);
    res.status(201).json(interaction);
  }));

  /**
   * Get interactions for support record
   * GET /bereavement/support/:id/interactions
   */
  router.get('/support/:id/interactions', asyncHandler(async (req, res) => {
    const supportId = req.params.id as UUID;
    const context = req.user as UserContext;

    const interactions = await service.getInteractions(supportId, context);
    res.json(interactions);
  }));

  /**
   * Get interactions by client
   * GET /bereavement/interactions/client/:clientId
   */
  router.get('/interactions/client/:clientId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const interactions = await service.getInteractionsByClient(clientId, context);
    res.json(interactions);
  }));

  // ============================================================================
  // Memorial Routes
  // ============================================================================

  /**
   * Create memorial
   * POST /bereavement/memorials
   */
  router.post('/memorials', asyncHandler(async (req, res) => {
    const input = createMemorialSchema.parse(req.body);
    const context = req.user as UserContext;

    const memorial = await service.createMemorial(input, context);
    res.status(201).json(memorial);
  }));

  /**
   * Get memorial by ID
   * GET /bereavement/memorials/:id
   */
  router.get('/memorials/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const memorial = await service.getMemorial(id, context);
    res.json(memorial);
  }));

  /**
   * Get memorial by client
   * GET /bereavement/memorials/client/:clientId
   */
  router.get('/memorials/client/:clientId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const memorial = await service.getMemorialByClient(clientId, context);
    if (!memorial) {
      res.status(404).json({ error: 'Memorial not found' });
      return;
    }
    res.json(memorial);
  }));

  /**
   * Get memorial by access code (public)
   * GET /bereavement/memorials/access/:code
   */
  router.get('/memorials/access/:code', asyncHandler(async (req, res) => {
    const code = req.params.code as string;

    const memorial = await service.getMemorialByAccessCode(code);
    if (!memorial) {
      res.status(404).json({ error: 'Memorial not found' });
      return;
    }
    res.json(memorial);
  }));

  /**
   * Update memorial
   * PATCH /bereavement/memorials/:id
   */
  router.patch('/memorials/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = updateMemorialSchema.parse(req.body);
    const context = req.user as UserContext;

    const memorial = await service.updateMemorial(id, input, context);
    res.json(memorial);
  }));

  /**
   * Publish memorial
   * POST /bereavement/memorials/:id/publish
   */
  router.post('/memorials/:id/publish', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const memorial = await service.publishMemorial(id, context);
    res.json(memorial);
  }));

  /**
   * Unpublish memorial
   * POST /bereavement/memorials/:id/unpublish
   */
  router.post('/memorials/:id/unpublish', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const memorial = await service.unpublishMemorial(id, context);
    res.json(memorial);
  }));

  /**
   * Delete memorial
   * DELETE /bereavement/memorials/:id
   */
  router.delete('/memorials/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    await service.deleteMemorial(id, context);
    res.status(204).send();
  }));

  // ============================================================================
  // Guestbook Routes
  // ============================================================================

  /**
   * Add guestbook entry
   * POST /bereavement/guestbook
   */
  router.post('/guestbook', asyncHandler(async (req, res) => {
    const input = addGuestbookEntrySchema.parse(req.body);
    const context = req.user as UserContext;

    const entry = await service.addGuestbookEntry(input, context);
    res.status(201).json(entry);
  }));

  /**
   * Get guestbook entries for memorial
   * GET /bereavement/memorials/:id/guestbook
   */
  router.get('/memorials/:id/guestbook', asyncHandler(async (req, res) => {
    const memorialId = req.params.id as UUID;
    const approvedOnly = req.query.approvedOnly !== 'false';
    const context = req.user as UserContext;

    const entries = await service.getGuestbookEntries(memorialId, approvedOnly, context);
    res.json(entries);
  }));

  /**
   * Get pending guestbook entries
   * GET /bereavement/memorials/:id/guestbook/pending
   */
  router.get('/memorials/:id/guestbook/pending', asyncHandler(async (req, res) => {
    const memorialId = req.params.id as UUID;
    const context = req.user as UserContext;

    const entries = await service.getPendingGuestbookEntries(memorialId, context);
    res.json(entries);
  }));

  /**
   * Approve guestbook entry
   * POST /bereavement/guestbook/:id/approve
   */
  router.post('/guestbook/:id/approve', asyncHandler(async (req, res) => {
    const entryId = req.params.id as UUID;
    const context = req.user as UserContext;

    const entry = await service.approveGuestbookEntry(entryId, context);
    res.json(entry);
  }));

  /**
   * Report guestbook entry
   * POST /bereavement/guestbook/:id/report
   */
  router.post('/guestbook/:id/report', asyncHandler(async (req, res) => {
    const entryId = req.params.id as UUID;
    const { reason } = req.body;
    const context = req.user as UserContext;

    const entry = await service.reportGuestbookEntry(entryId, reason, context);
    res.json(entry);
  }));

  /**
   * Delete guestbook entry
   * DELETE /bereavement/guestbook/:id
   */
  router.delete('/guestbook/:id', asyncHandler(async (req, res) => {
    const entryId = req.params.id as UUID;
    const context = req.user as UserContext;

    await service.deleteGuestbookEntry(entryId, context);
    res.status(204).send();
  }));

  // ============================================================================
  // Support Request Routes
  // ============================================================================

  /**
   * Submit support request
   * POST /bereavement/requests
   */
  router.post('/requests', asyncHandler(async (req, res) => {
    const input = submitSupportRequestSchema.parse(req.body);
    const context = req.user as UserContext;

    const request = await service.submitSupportRequest(input, context);
    res.status(201).json(request);
  }));

  /**
   * Get support requests for a support record
   * GET /bereavement/support/:id/requests
   */
  router.get('/support/:id/requests', asyncHandler(async (req, res) => {
    const supportId = req.params.id as UUID;
    const context = req.user as UserContext;

    const requests = await service.getSupportRequests(supportId, context);
    res.json(requests);
  }));

  /**
   * Get pending support requests
   * GET /bereavement/requests/pending
   */
  router.get('/requests/pending', asyncHandler(async (req, res) => {
    const organizationId = req.query.organizationId as UUID | undefined;
    const context = req.user as UserContext;

    const requests = await service.getPendingSupportRequests(organizationId, context);
    res.json(requests);
  }));

  /**
   * Assign support request
   * POST /bereavement/requests/:id/assign
   */
  router.post('/requests/:id/assign', asyncHandler(async (req, res) => {
    const requestId = req.params.id as UUID;
    const { assignedTo } = req.body;
    const context = req.user as UserContext;

    const request = await service.assignSupportRequest(requestId, assignedTo, context);
    res.json(request);
  }));

  /**
   * Complete support request
   * POST /bereavement/requests/:id/complete
   */
  router.post('/requests/:id/complete', asyncHandler(async (req, res) => {
    const requestId = req.params.id as UUID;
    const { responseNotes } = req.body;
    const context = req.user as UserContext;

    const request = await service.completeSupportRequest(requestId, responseNotes, context);
    res.json(request);
  }));

  // ============================================================================
  // Dashboard Routes
  // ============================================================================

  /**
   * Get coordinator dashboard
   * GET /bereavement/dashboard
   */
  router.get('/dashboard', asyncHandler(async (req, res) => {
    const context = req.user as UserContext;

    const dashboard = await service.getCoordinatorDashboard(context);
    res.json(dashboard);
  }));

  /**
   * Get family bereavement view
   * GET /bereavement/family/:clientId/:familyMemberId
   */
  router.get('/family/:clientId/:familyMemberId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const familyMemberId = req.params.familyMemberId as UUID;
    const context = req.user as UserContext;

    const view = await service.getFamilyBereavementView(clientId, familyMemberId, context);
    res.json(view);
  }));

  return router;
}

export default createGriefBereavementRoutes;
