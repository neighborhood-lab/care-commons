/**
 * Video Check-in Routes
 *
 * API routes for video calls between families and patients,
 * including scheduling, room management, and participant handling.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { asyncHandler, PermissionService } from '@folkcare/core';
import type { UUID, UserContext } from '@folkcare/core';
import { VideoCheckinService } from '../services/video-checkin-service.js';
import {
  VideoCallRepository,
  VideoCallParticipantRepository,
  RecurringVideoScheduleRepository,
  VideoCallInvitationRepository
} from '../repositories/video-checkin-repository.js';
import { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const callTypeSchema = z.enum([
  'SCHEDULED_CHECKIN',
  'ON_DEMAND',
  'RECURRING',
  'EMERGENCY'
]);

const callStatusSchema = z.enum([
  'SCHEDULED',
  'WAITING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'MISSED',
  'FAILED'
]);

const participantRoleSchema = z.enum([
  'HOST',
  'FAMILY',
  'CLIENT',
  'CAREGIVER',
  'COORDINATOR'
]);

const qualityRatingSchema = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR'
]);

const deviceTypeSchema = z.enum([
  'MOBILE',
  'TABLET',
  'DESKTOP',
  'UNKNOWN'
]);

const invitationTypeSchema = z.enum([
  'EMAIL',
  'SMS',
  'PUSH',
  'IN_APP'
]);

const invitationResponseSchema = z.enum([
  'ACCEPTED',
  'DECLINED',
  'TENTATIVE'
]);

// Schedule call schema
const scheduleCallSchema = z.object({
  clientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  callType: callTypeSchema,
  title: z.string().max(255).optional(),
  scheduledStartTime: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(180),
  participants: z.array(z.object({
    userId: z.string().uuid().optional(),
    role: participantRoleSchema,
    familyMemberId: z.string().uuid().optional(),
    email: z.string().email()
  })),
  recordingEnabled: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid()
});

// Start call schema (on-demand)
const startCallSchema = z.object({
  clientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  title: z.string().max(255).optional(),
  participants: z.array(z.object({
    userId: z.string().uuid().optional(),
    role: participantRoleSchema,
    familyMemberId: z.string().uuid().optional(),
    email: z.string().email()
  })),
  recordingEnabled: z.boolean().optional(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid()
});

// Update call schema
const updateCallSchema = z.object({
  title: z.string().max(255).optional(),
  scheduledStartTime: z.string().datetime().optional(),
  scheduledEndTime: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
  familyVisibleNotes: z.string().max(5000).optional(),
  maxParticipants: z.number().int().min(2).max(20).optional(),
  recordingEnabled: z.boolean().optional()
});

// End call schema
const endCallSchema = z.object({
  notes: z.string().max(5000).optional(),
  qualityRating: qualityRatingSchema.optional()
});

// Join call schema
const joinCallSchema = z.object({
  deviceType: deviceTypeSchema.optional(),
  browserType: z.string().max(50).optional()
});

// Participant feedback schema
const participantFeedbackSchema = z.object({
  qualityRating: qualityRatingSchema.optional(),
  feedbackNotes: z.string().max(2000).optional(),
  hadTechnicalIssues: z.boolean().optional(),
  technicalIssueNotes: z.string().max(2000).optional()
});

// Call filters schema
const callFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  visitId: z.string().uuid().optional(),
  callType: z.union([callTypeSchema, z.array(callTypeSchema)]).optional(),
  status: z.union([callStatusSchema, z.array(callStatusSchema)]).optional(),
  hostUserId: z.string().uuid().optional(),
  scheduledFrom: z.string().datetime().optional(),
  scheduledTo: z.string().datetime().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional()
});

// Create recurring schedule schema
const createRecurringScheduleSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  recurrenceRule: z.string().max(500),
  duration: z.number().int().min(5).max(180),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  defaultParticipants: z.array(z.object({
    userId: z.string().uuid().optional(),
    role: participantRoleSchema,
    familyMemberId: z.string().uuid().optional(),
    email: z.string().email()
  })),
  reminderMinutesBefore: z.array(z.number().int()).optional(),
  maxParticipants: z.number().int().min(2).max(20).optional(),
  recordingEnabled: z.boolean().optional(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid()
});

// Schedule filters schema
const scheduleFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  createdByUserId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional()
});

// Send invitation schema
const sendInvitationSchema = z.object({
  recipientUserId: z.string().uuid().optional(),
  recipientFamilyMemberId: z.string().uuid().optional(),
  recipientEmail: z.string().email(),
  recipientPhone: z.string().max(50).optional(),
  recipientName: z.string().max(255),
  invitationType: invitationTypeSchema
});

// ============================================================================
// Route Handlers
// ============================================================================

export function createVideoCheckinRoutes(db: Pool): Router {
  const router = Router();

  // Initialize dependencies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const database = { query: (text: string, params?: unknown[]) => db.query(text, params) } as any;
  const callRepo = new VideoCallRepository(database);
  const participantRepo = new VideoCallParticipantRepository(database);
  const scheduleRepo = new RecurringVideoScheduleRepository(database);
  const invitationRepo = new VideoCallInvitationRepository(database);
  const familyMemberRepo = new FamilyMemberRepository(database);
  const permissions = new PermissionService();
  const service = new VideoCheckinService(
    callRepo,
    participantRepo,
    scheduleRepo,
    invitationRepo,
    familyMemberRepo,
    permissions
  );

  // ============================================================================
  // Video Call Routes
  // ============================================================================

  /**
   * Schedule a video call
   * POST /video-checkin/calls/schedule
   */
  router.post('/calls/schedule', asyncHandler(async (req, res) => {
    const input = scheduleCallSchema.parse(req.body);
    const context = req.user as UserContext;

    const call = await service.scheduleCall(input, context);
    res.status(201).json(call);
  }));

  /**
   * Start an on-demand video call
   * POST /video-checkin/calls/start
   */
  router.post('/calls/start', asyncHandler(async (req, res) => {
    const input = startCallSchema.parse(req.body);
    const context = req.user as UserContext;

    const call = await service.startCall(input, context);
    res.status(201).json(call);
  }));

  /**
   * Get video call by ID
   * GET /video-checkin/calls/:id
   */
  router.get('/calls/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const call = await service.getCall(id, context);
    res.json(call);
  }));

  /**
   * Update video call
   * PATCH /video-checkin/calls/:id
   */
  router.patch('/calls/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const input = updateCallSchema.parse(req.body);
    const context = req.user as UserContext;

    const call = await service.updateCall(id, input, context);
    res.json(call);
  }));

  /**
   * Query video calls
   * GET /video-checkin/calls
   */
  router.get('/calls', asyncHandler(async (req, res) => {
    const filters = callFiltersSchema.parse(req.query);
    const context = req.user as UserContext;

    const calls = await service.queryCalls(filters, context);
    res.json(calls);
  }));

  /**
   * Get calls by client
   * GET /video-checkin/calls/client/:clientId
   */
  router.get('/calls/client/:clientId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const calls = await service.getCallsByClient(clientId, context);
    res.json(calls);
  }));

  /**
   * Get calls by visit
   * GET /video-checkin/calls/visit/:visitId
   */
  router.get('/calls/visit/:visitId', asyncHandler(async (req, res) => {
    const visitId = req.params.visitId as UUID;
    const context = req.user as UserContext;

    const calls = await service.getCallsByVisit(visitId, context);
    res.json(calls);
  }));

  /**
   * Join a video call
   * POST /video-checkin/calls/:id/join
   */
  router.post('/calls/:id/join', asyncHandler(async (req, res) => {
    const callId = req.params.id as UUID;
    const { deviceType, browserType } = joinCallSchema.parse(req.body);
    const context = req.user as UserContext;

    const joinInfo = await service.joinCall(callId, context, deviceType, browserType);
    res.json(joinInfo);
  }));

  /**
   * Leave a video call
   * POST /video-checkin/calls/:id/leave
   */
  router.post('/calls/:id/leave', asyncHandler(async (req, res) => {
    const callId = req.params.id as UUID;
    const context = req.user as UserContext;

    await service.leaveCall(callId, context);
    res.status(204).send();
  }));

  /**
   * End a video call
   * POST /video-checkin/calls/:id/end
   */
  router.post('/calls/:id/end', asyncHandler(async (req, res) => {
    const callId = req.params.id as UUID;
    const input = endCallSchema.parse(req.body);
    const context = req.user as UserContext;

    const call = await service.endCall(callId, input, context);
    res.json(call);
  }));

  /**
   * Cancel a video call
   * POST /video-checkin/calls/:id/cancel
   */
  router.post('/calls/:id/cancel', asyncHandler(async (req, res) => {
    const callId = req.params.id as UUID;
    const context = req.user as UserContext;

    const call = await service.cancelCall(callId, context);
    res.json(call);
  }));

  /**
   * Submit participant feedback
   * POST /video-checkin/calls/:id/feedback
   */
  router.post('/calls/:id/feedback', asyncHandler(async (req, res) => {
    const callId = req.params.id as UUID;
    const input = participantFeedbackSchema.parse(req.body);
    const context = req.user as UserContext;

    const participant = await service.submitParticipantFeedback(callId, input, context);
    res.json(participant);
  }));

  // ============================================================================
  // Recurring Schedule Routes
  // ============================================================================

  /**
   * Create recurring video schedule
   * POST /video-checkin/schedules
   */
  router.post('/schedules', asyncHandler(async (req, res) => {
    const input = createRecurringScheduleSchema.parse(req.body);
    const context = req.user as UserContext;

    const schedule = await service.createRecurringSchedule(input, context);
    res.status(201).json(schedule);
  }));

  /**
   * Get recurring schedule by ID
   * GET /video-checkin/schedules/:id
   */
  router.get('/schedules/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const schedule = await service.getRecurringSchedule(id, context);
    res.json(schedule);
  }));

  /**
   * Query recurring schedules
   * GET /video-checkin/schedules
   */
  router.get('/schedules', asyncHandler(async (req, res) => {
    const filters = scheduleFiltersSchema.parse(req.query);
    const context = req.user as UserContext;

    const schedules = await service.querySchedules(filters, context);
    res.json(schedules);
  }));

  /**
   * Get schedules by client
   * GET /video-checkin/schedules/client/:clientId
   */
  router.get('/schedules/client/:clientId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const schedules = await service.getSchedulesByClient(clientId, context);
    res.json(schedules);
  }));

  /**
   * Deactivate recurring schedule
   * POST /video-checkin/schedules/:id/deactivate
   */
  router.post('/schedules/:id/deactivate', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    const schedule = await service.deactivateSchedule(id, context);
    res.json(schedule);
  }));

  /**
   * Delete recurring schedule
   * DELETE /video-checkin/schedules/:id
   */
  router.delete('/schedules/:id', asyncHandler(async (req, res) => {
    const id = req.params.id as UUID;
    const context = req.user as UserContext;

    await service.deleteSchedule(id, context);
    res.status(204).send();
  }));

  // ============================================================================
  // Invitation Routes
  // ============================================================================

  /**
   * Send invitation for a video call
   * POST /video-checkin/calls/:callId/invitations
   */
  router.post('/calls/:callId/invitations', asyncHandler(async (req, res) => {
    const callId = req.params.callId as UUID;
    const input = sendInvitationSchema.parse(req.body);
    const { participantId } = req.body;
    const context = req.user as UserContext;

    const invitation = await service.sendInvitation(
      { ...input, videoCallId: callId },
      participantId,
      context
    );
    res.status(201).json(invitation);
  }));

  /**
   * Respond to invitation
   * POST /video-checkin/invitations/:id/respond
   */
  router.post('/invitations/:id/respond', asyncHandler(async (req, res) => {
    const invitationId = req.params.id as UUID;
    const response = invitationResponseSchema.parse(req.body.response);
    const context = req.user as UserContext;

    const invitation = await service.respondToInvitation(invitationId, response, context);
    res.json(invitation);
  }));

  /**
   * Get pending invitations for current user
   * GET /video-checkin/invitations/pending
   */
  router.get('/invitations/pending', asyncHandler(async (req, res) => {
    const context = req.user as UserContext;

    const invitations = await service.getPendingInvitations(context);
    res.json(invitations);
  }));

  // ============================================================================
  // Dashboard & View Routes
  // ============================================================================

  /**
   * Get video call dashboard
   * GET /video-checkin/dashboard
   */
  router.get('/dashboard', asyncHandler(async (req, res) => {
    const context = req.user as UserContext;

    const dashboard = await service.getDashboard(context);
    res.json(dashboard);
  }));

  /**
   * Get client video history
   * GET /video-checkin/history/:clientId
   */
  router.get('/history/:clientId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const context = req.user as UserContext;

    const history = await service.getClientVideoHistory(clientId, context);
    res.json(history);
  }));

  /**
   * Get family video view
   * GET /video-checkin/family/:clientId/:familyMemberId
   */
  router.get('/family/:clientId/:familyMemberId', asyncHandler(async (req, res) => {
    const clientId = req.params.clientId as UUID;
    const familyMemberId = req.params.familyMemberId as UUID;
    const context = req.user as UserContext;

    const view = await service.getFamilyVideoView(clientId, familyMemberId, context);
    res.json(view);
  }));

  return router;
}

export default createVideoCheckinRoutes;
