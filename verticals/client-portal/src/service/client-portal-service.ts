/**
 * Client Portal Service - Business Logic Layer
 *
 * Handles all client portal operations with permission checks and business rules:
 * - Portal access management
 * - Visit ratings
 * - Schedule change requests
 * - Video call sessions
 * - Dashboard data aggregation
 */

import {
  PermissionError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UserContext,
  PaginationParams,
  PaginatedResult,
} from '@care-commons/core';
import type {
  ClientPortalAccess,
  ClientVisitRating,
  ScheduleChangeRequest,
  VideoCallSession,
  ClientPortalDashboard,
  InviteClientToPortalInput,
  ActivatePortalAccessInput,
  CreateVisitRatingInput,
  CreateScheduleChangeRequestInput,
  ReviewScheduleChangeRequestInput,
  ScheduleVideoCallInput,
  RateVideoCallInput,
  UpdateAccessibilityPreferencesInput,
  UpdateNotificationPreferencesInput,
  VisitRatingFilters,
  ScheduleChangeRequestFilters,
  CarePlanAccessLog,
} from '../types/index';
import {
  ClientPortalAccessRepository,
  VisitRatingRepository,
  ScheduleChangeRequestRepository,
  VideoCallSessionRepository,
  CarePlanAccessLogRepository,
} from '../repository/client-portal-repository';
import { randomBytes } from 'crypto';

export class ClientPortalService {
  constructor(
    private portalAccessRepo: ClientPortalAccessRepository,
    private visitRatingRepo: VisitRatingRepository,
    private scheduleRequestRepo: ScheduleChangeRequestRepository,
    private videoCallRepo: VideoCallSessionRepository,
    private carePlanAccessLogRepo: CarePlanAccessLogRepository
  ) {}

  // ============================================================================
  // Portal Access Management
  // ============================================================================

  /**
   * Invite a client to the portal
   * Permission: clients:portal:invite
   */
  async inviteClientToPortal(
    input: InviteClientToPortalInput,
    context: UserContext
  ): Promise<ClientPortalAccess> {
    // Permission check
    if (!context.permissions.includes('clients:portal:invite')) {
      throw new PermissionError('Missing clients:portal:invite permission');
    }

    // Check if client already has portal access
    const existing = await this.portalAccessRepo.findByClientId(input.clientId);
    if (existing && existing.status !== 'REVOKED') {
      throw new ConflictError('Client already has portal access');
    }

    // Generate unique invitation code
    const invitationCode = this.generateInvitationCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 7));

    // Create portal access record
    const portalAccess: Partial<ClientPortalAccess> = {
      clientId: input.clientId,
      organizationId: context.organizationId,
      branchId: context.branchIds[0], // Use first branch
      status: 'PENDING_ACTIVATION',
      portalEnabled: true,
      invitationCode,
      invitationSentAt: new Date(),
      invitationExpiresAt: expiresAt,
      accessibilityPreferences: {
        fontSize: 'MEDIUM',
        theme: 'LIGHT',
        animationsEnabled: true,
        reducedMotion: false,
        screenReaderMode: false,
        keyboardNavigationOnly: false,
        voiceControlEnabled: false,
        highContrast: false,
        largeClickTargets: false,
        underlineLinks: false,
        captionsEnabled: false,
        audioDescriptions: false,
        language: 'en',
        textToSpeechEnabled: false,
        ...input.accessibilityPreferences,
      },
      notificationPreferences: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        visitReminders: true,
        visitCompletedUpdates: true,
        caregiverChanges: true,
        scheduleChangeStatus: true,
        carePlanUpdates: true,
        appointmentReminders: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'America/New_York',
        digestFrequency: 'IMMEDIATE',
        ...input.notificationPreferences,
      },
      passwordResetRequired: false,
      failedLoginAttempts: 0,
      loginCount: 0,
      lastLoginAt: null,
      lastLoginIp: null,
    };

    const created = await this.portalAccessRepo.create(portalAccess, context.userId);

    // TODO: Send invitation email with invitationCode
    // await emailService.sendPortalInvitation(...)

    return created;
  }

  /**
   * Activate portal access with invitation code
   * Public endpoint - no permission check required
   */
  async activatePortalAccess(
    input: ActivatePortalAccessInput
  ): Promise<{ portalAccess: ClientPortalAccess; sessionToken: string }> {
    // Find portal access by invitation code
    const portalAccess = await this.portalAccessRepo.findByInvitationCode(input.invitationCode);
    if (!portalAccess) {
      throw new NotFoundError('Invalid invitation code');
    }

    // Check if invitation is expired
    if (portalAccess.invitationExpiresAt && portalAccess.invitationExpiresAt < new Date()) {
      throw new ValidationError('Invitation code has expired');
    }

    // Check if already activated
    if (portalAccess.status === 'ACTIVE') {
      throw new ConflictError('Portal access already activated');
    }

    // TODO: Create user account with password (integrate with auth service)
    // await authService.createClientUser(...)

    // Update portal access status
    const updated = await this.portalAccessRepo.update(
      portalAccess.id,
      {
        status: 'ACTIVE',
        activatedAt: new Date(),
        invitationCode: null, // Clear invitation code after activation
      },
      portalAccess.clientId
    );

    // TODO: Create session token
    const sessionToken = this.generateSessionToken();

    return { portalAccess: updated, sessionToken };
  }

  /**
   * Get portal access for a client
   * Permission: clients:portal:read OR self (client viewing their own portal)
   */
  async getPortalAccess(clientId: string, context: UserContext): Promise<ClientPortalAccess> {
    // Permission check: either has permission OR is the client themselves
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf && !context.permissions.includes('clients:portal:read')) {
      throw new PermissionError('Missing clients:portal:read permission');
    }

    const portalAccess = await this.portalAccessRepo.findByClientId(clientId);
    if (!portalAccess) {
      throw new NotFoundError('Portal access not found for client');
    }

    return portalAccess;
  }

  /**
   * Update accessibility preferences
   * Permission: self (client updating their own preferences)
   */
  async updateAccessibilityPreferences(
    clientId: string,
    input: UpdateAccessibilityPreferencesInput,
    context: UserContext
  ): Promise<ClientPortalAccess> {
    // Permission check: must be the client themselves
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf) {
      throw new PermissionError('Can only update your own accessibility preferences');
    }

    const portalAccess = await this.portalAccessRepo.findByClientId(clientId);
    if (!portalAccess) {
      throw new NotFoundError('Portal access not found');
    }

    const updated = await this.portalAccessRepo.update(
      portalAccess.id,
      {
        accessibilityPreferences: {
          ...portalAccess.accessibilityPreferences,
          ...input,
        },
      },
      context.userId
    );

    return updated;
  }

  /**
   * Update notification preferences
   * Permission: self (client updating their own preferences)
   */
  async updateNotificationPreferences(
    clientId: string,
    input: UpdateNotificationPreferencesInput,
    context: UserContext
  ): Promise<ClientPortalAccess> {
    // Permission check: must be the client themselves
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf) {
      throw new PermissionError('Can only update your own notification preferences');
    }

    const portalAccess = await this.portalAccessRepo.findByClientId(clientId);
    if (!portalAccess) {
      throw new NotFoundError('Portal access not found');
    }

    const updated = await this.portalAccessRepo.update(
      portalAccess.id,
      {
        notificationPreferences: {
          ...portalAccess.notificationPreferences,
          ...input,
        },
      },
      context.userId
    );

    return updated;
  }

  // ============================================================================
  // Visit Ratings
  // ============================================================================

  /**
   * Create a visit rating
   * Permission: self (client rating their own visit)
   */
  async createVisitRating(
    clientId: string,
    input: CreateVisitRatingInput,
    context: UserContext
  ): Promise<ClientVisitRating> {
    // Permission check: must be the client themselves
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf) {
      throw new PermissionError('Can only rate your own visits');
    }

    // Check if visit has already been rated
    const existing = await this.visitRatingRepo.findByVisitId(input.visitId);
    if (existing) {
      throw new ConflictError('Visit has already been rated');
    }

    // TODO: Verify that the visit belongs to this client and is completed
    // const visit = await visitService.getVisit(input.visitId);
    // if (visit.clientId !== clientId) throw new PermissionError(...)
    // if (visit.status !== 'COMPLETED') throw new ValidationError(...)

    // Auto-flag ratings with low scores for coordinator review
    const flaggedForReview =
      input.overallRating <= 2 ||
      (input.improvementFeedback && input.improvementFeedback.length > 0);

    const rating: Partial<ClientVisitRating> = {
      clientId,
      visitId: input.visitId,
      caregiverId: 'TODO', // Get from visit
      organizationId: context.organizationId,
      overallRating: input.overallRating,
      professionalismRating: input.professionalismRating || null,
      punctualityRating: input.punctualityRating || null,
      qualityOfCareRating: input.qualityOfCareRating || null,
      communicationRating: input.communicationRating || null,
      positiveFeedback: input.positiveFeedback || null,
      improvementFeedback: input.improvementFeedback || null,
      additionalComments: input.additionalComments || null,
      wouldRequestAgain: input.wouldRequestAgain || null,
      isAnonymous: input.isAnonymous || false,
      visibleToCaregiver: !input.isAnonymous, // Don't show to caregiver if anonymous
      flaggedForReview,
      ratedAt: new Date(),
    };

    const created = await this.visitRatingRepo.create(rating, context.userId);

    // TODO: Send notification to coordinator if flagged
    // if (flaggedForReview) await notificationService.notifyCoordinator(...)

    return created;
  }

  /**
   * Get visit ratings for a client
   * Permission: self OR clients:ratings:read
   */
  async getClientVisitRatings(
    clientId: string,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<ClientVisitRating>> {
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf && !context.permissions.includes('clients:ratings:read')) {
      throw new PermissionError('Missing clients:ratings:read permission');
    }

    return await this.visitRatingRepo.findByClientId(clientId, pagination);
  }

  /**
   * Search visit ratings
   * Permission: clients:ratings:read
   */
  async searchVisitRatings(
    filters: VisitRatingFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<ClientVisitRating>> {
    if (!context.permissions.includes('clients:ratings:read')) {
      throw new PermissionError('Missing clients:ratings:read permission');
    }

    return await this.visitRatingRepo.searchRatings(filters, pagination);
  }

  // ============================================================================
  // Schedule Change Requests
  // ============================================================================

  /**
   * Create a schedule change request
   * Permission: self (client requesting changes to their own schedule)
   */
  async createScheduleChangeRequest(
    clientId: string,
    input: CreateScheduleChangeRequestInput,
    context: UserContext
  ): Promise<ScheduleChangeRequest> {
    // Permission check: must be the client themselves
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf) {
      throw new PermissionError('Can only request changes to your own schedule');
    }

    // TODO: Verify visit belongs to client (for RESCHEDULE/CANCEL)
    // if (input.visitId) {
    //   const visit = await visitService.getVisit(input.visitId);
    //   if (visit.clientId !== clientId) throw new PermissionError(...)
    // }

    // TODO: Get current visit details for RESCHEDULE/CANCEL
    let currentStartTime: Date | null = null;
    let currentEndTime: Date | null = null;
    // if (input.visitId) {
    //   const visit = await visitService.getVisit(input.visitId);
    //   currentStartTime = visit.scheduledStart;
    //   currentEndTime = visit.scheduledEnd;
    // }

    const request: Partial<ScheduleChangeRequest> = {
      clientId,
      visitId: input.visitId || null,
      organizationId: context.organizationId,
      branchId: context.branchIds[0],
      requestType: input.requestType,
      priority: input.priority || 1,
      currentStartTime,
      currentEndTime,
      requestedStartTime: input.requestedStartTime || null,
      requestedEndTime: input.requestedEndTime || null,
      requestedReason: input.requestedReason,
      status: 'PENDING',
      changeApplied: false,
      clientNotified: false,
    };

    const created = await this.scheduleRequestRepo.create(request, context.userId);

    // TODO: Send notification to coordinator
    // await notificationService.notifyCoordinatorOfScheduleRequest(...)

    return created;
  }

  /**
   * Get pending schedule change requests for a client
   * Permission: self OR clients:schedule:read
   */
  async getPendingScheduleRequests(
    clientId: string,
    context: UserContext
  ): Promise<ScheduleChangeRequest[]> {
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf && !context.permissions.includes('clients:schedule:read')) {
      throw new PermissionError('Missing clients:schedule:read permission');
    }

    return await this.scheduleRequestRepo.findPendingByClientId(clientId);
  }

  /**
   * Review a schedule change request (coordinator)
   * Permission: clients:schedule:approve
   */
  async reviewScheduleChangeRequest(
    requestId: string,
    input: ReviewScheduleChangeRequestInput,
    context: UserContext
  ): Promise<ScheduleChangeRequest> {
    if (!context.permissions.includes('clients:schedule:approve')) {
      throw new PermissionError('Missing clients:schedule:approve permission');
    }

    const request = await this.scheduleRequestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundError('Schedule change request not found');
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('Request has already been reviewed');
    }

    const updated = await this.scheduleRequestRepo.update(
      requestId,
      {
        status: input.status,
        reviewedBy: context.userId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes || null,
        denialReason: input.denialReason || null,
        newVisitId: input.newVisitId || null,
        changeApplied: input.status === 'APPROVED' && !!input.newVisitId,
        appliedAt: input.status === 'APPROVED' && input.newVisitId ? new Date() : null,
      },
      context.userId
    );

    // TODO: Send notification to client
    // await notificationService.notifyClientOfScheduleRequestReview(...)

    return updated;
  }

  /**
   * Search schedule change requests
   * Permission: clients:schedule:read
   */
  async searchScheduleChangeRequests(
    filters: ScheduleChangeRequestFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<ScheduleChangeRequest>> {
    if (!context.permissions.includes('clients:schedule:read')) {
      throw new PermissionError('Missing clients:schedule:read permission');
    }

    return await this.scheduleRequestRepo.searchRequests(filters, pagination);
  }

  // ============================================================================
  // Video Call Sessions
  // ============================================================================

  /**
   * Schedule a video call
   * Permission: self (client scheduling call) OR clients:video:schedule
   */
  async scheduleVideoCall(
    clientId: string,
    input: ScheduleVideoCallInput,
    context: UserContext
  ): Promise<VideoCallSession> {
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf && !context.permissions.includes('clients:video:schedule')) {
      throw new PermissionError('Missing clients:video:schedule permission');
    }

    // Calculate duration
    const durationMs = input.scheduledEnd.getTime() - input.scheduledStart.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    const session: Partial<VideoCallSession> = {
      clientId,
      coordinatorId: input.coordinatorId,
      organizationId: context.organizationId,
      branchId: context.branchIds[0],
      callType: input.callType,
      status: 'SCHEDULED',
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      durationMinutes,
      callPurpose: input.callPurpose || null,
      captionsEnabled: input.captionsEnabled || false,
      signLanguageInterpreter: input.signLanguageInterpreter || false,
      languagePreference: input.languagePreference || null,
      platform: null, // Will be set when session is started
      externalSessionId: null,
      clientJoinUrl: null,
      coordinatorJoinUrl: null,
    };

    const created = await this.videoCallRepo.create(session, context.userId);

    // TODO: Send notification to coordinator
    // await notificationService.notifyCoordinatorOfVideoCallRequest(...)

    // TODO: Generate video call URLs when platform is configured
    // const urls = await videoCallPlatform.createSession(...)

    return created;
  }

  /**
   * Get upcoming video calls for a client
   * Permission: self OR clients:video:read
   */
  async getUpcomingVideoCalls(
    clientId: string,
    context: UserContext
  ): Promise<VideoCallSession[]> {
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf && !context.permissions.includes('clients:video:read')) {
      throw new PermissionError('Missing clients:video:read permission');
    }

    return await this.videoCallRepo.findUpcomingByClientId(clientId);
  }

  /**
   * Rate a completed video call
   * Permission: self (client rating their own call)
   */
  async rateVideoCall(
    sessionId: string,
    input: RateVideoCallInput,
    context: UserContext
  ): Promise<VideoCallSession> {
    const session = await this.videoCallRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Video call session not found');
    }

    // Permission check: must be the client themselves
    const isSelf = context.userId === session.clientId || context.roles.includes('CLIENT');
    if (!isSelf) {
      throw new PermissionError('Can only rate your own video calls');
    }

    if (session.status !== 'COMPLETED') {
      throw new ValidationError('Can only rate completed video calls');
    }

    const updated = await this.videoCallRepo.update(
      sessionId,
      {
        clientRating: input.clientRating,
        clientFeedback: input.clientFeedback || null,
        qualityMetrics: input.qualityMetrics || null,
      },
      context.userId
    );

    return updated;
  }

  // ============================================================================
  // Care Plan Access
  // ============================================================================

  /**
   * Log care plan access
   * Permission: self (client viewing their own care plan)
   */
  async logCarePlanAccess(
    clientId: string,
    carePlanId: string,
    accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT',
    metadata: {
      ipAddress: string | null;
      userAgent: string | null;
      deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'OTHER' | null;
      portalSessionId: string | null;
      accessibilityFeatures: Record<string, boolean> | null;
    },
    context: UserContext
  ): Promise<CarePlanAccessLog> {
    // Permission check: must be the client themselves
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf) {
      throw new PermissionError('Can only view your own care plan');
    }

    const log: Omit<CarePlanAccessLog, 'id'> = {
      clientId,
      carePlanId,
      organizationId: context.organizationId,
      accessedAt: new Date(),
      accessType,
      clientIp: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceType: metadata.deviceType,
      portalSessionId: metadata.portalSessionId,
      timeSpentSeconds: null, // Will be updated later
      fullyRead: false, // Will be updated later
      accessibilityFeatures: metadata.accessibilityFeatures,
    };

    return await this.carePlanAccessLogRepo.create(log);
  }

  // ============================================================================
  // Dashboard
  // ============================================================================

  /**
   * Get client portal dashboard data
   * Permission: self (client viewing their own dashboard)
   */
  async getClientDashboard(
    clientId: string,
    context: UserContext
  ): Promise<ClientPortalDashboard> {
    // Permission check: must be the client themselves
    const isSelf = context.userId === clientId || context.roles.includes('CLIENT');
    if (!isSelf) {
      throw new PermissionError('Can only view your own dashboard');
    }

    // TODO: Implement dashboard data aggregation
    // This would fetch data from multiple services:
    // - Client service (client info)
    // - Visit service (upcoming and recent visits)
    // - Schedule request service (pending requests)
    // - Video call service (upcoming calls)
    // - Care plan service (active care plan)
    // - Notification service (unread notifications)
    // - User service (primary coordinator)

    const dashboard: ClientPortalDashboard = {
      client: {
        id: clientId,
        firstName: 'TODO',
        lastName: 'TODO',
        preferredName: null,
      },
      upcomingVisits: [],
      recentCompletedVisits: [],
      pendingScheduleRequests: await this.getPendingScheduleRequests(clientId, context),
      upcomingVideoCalls: await this.getUpcomingVideoCalls(clientId, context),
      activCarePlan: null,
      unreadNotifications: 0,
      primaryCoordinator: null,
    };

    return dashboard;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateInvitationCode(): string {
    return randomBytes(32).toString('hex');
  }

  private generateSessionToken(): string {
    return randomBytes(48).toString('base64url');
  }
}
