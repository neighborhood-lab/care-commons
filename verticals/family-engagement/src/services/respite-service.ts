/**
 * Respite Care Service
 *
 * Business logic for family respite care coordination
 */

import type {
  UserContext,
  UUID
} from '@folkcare/core';
import { PermissionService } from '@folkcare/core';
import type {
  RespiteRequest,
  CreateRespiteRequestInput,
  UpdateRespiteRequestInput,
  RespiteRequestFilters,
  AvailableRespiteCaregiver,
  RespiteUsageSummary,
  RespiteRequestWithDetails,
  ApproveRespiteRequestInput,
  DeclineRespiteRequestInput,
  CompleteRespiteRequestInput
} from '../types/respite-care.js';
import { RespiteRepository } from '../repositories/respite-repository.js';
import { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

/**
 * Error classes for respite operations
 */
class RespiteNotFoundError extends Error {
  constructor(id: UUID) {
    super(`Respite request not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

class RespitePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

class RespiteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Service for managing family respite care coordination
 */
export class RespiteService {
  constructor(
    private respiteRepo: RespiteRepository,
    private familyMemberRepo: FamilyMemberRepository,
    private permissions: PermissionService
  ) {}

  // ============================================================================
  // Request Management
  // ============================================================================

  /**
   * Create a new respite request
   */
  async createRequest(
    input: CreateRespiteRequestInput,
    context: UserContext
  ): Promise<RespiteRequest> {
    // Validate family member has permission to request respite
    const familyMember = await this.familyMemberRepo.findById(input.familyMemberId);
    if (familyMember === null || familyMember === undefined) {
      throw new RespiteNotFoundError(input.familyMemberId);
    }

    // Verify family member is active and belongs to the client
    if (familyMember.clientId !== input.clientId) {
      throw new RespitePermissionError('Family member does not have access to this client');
    }

    if (familyMember.status !== 'ACTIVE') {
      throw new RespitePermissionError('Family member account is not active');
    }

    // Validate dates
    const startDateTime = new Date(`${input.requestedStartDate}T${input.requestedStartTime}`);
    const endDateTime = new Date(`${input.requestedEndDate}T${input.requestedEndTime}`);

    if (startDateTime >= endDateTime) {
      throw new RespiteValidationError('End time must be after start time');
    }

    if (startDateTime < new Date()) {
      throw new RespiteValidationError('Start time must be in the future');
    }

    // Create the request
    const request = await this.respiteRepo.createRequest({
      ...input,
      createdBy: context.userId
    });

    // Create audit revision
    await this.respiteRepo.recordRevision(
      request.id,
      'CREATE',
      null,
      request,
      Object.keys(input),
      context.userId,
      'Initial creation'
    );

    return request;
  }

  /**
   * Update a draft respite request
   */
  async updateRequest(
    id: UUID,
    input: UpdateRespiteRequestInput,
    context: UserContext
  ): Promise<RespiteRequest> {
    const existing = await this.respiteRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Only drafts can be updated
    if (existing.status !== 'DRAFT') {
      throw new RespiteValidationError('Only draft requests can be updated');
    }

    // Verify requester owns the request
    const familyMember = await this.familyMemberRepo.findById(existing.familyMemberId);
    if (familyMember === null || familyMember === undefined) {
      throw new RespiteNotFoundError(existing.familyMemberId);
    }

    const updated = await this.respiteRepo.updateRequest(id, input, context.userId);
    if (updated === null || updated === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Create audit revision
    const changedFields = Object.keys(input).filter(key => input[key as keyof UpdateRespiteRequestInput] !== undefined);
    await this.respiteRepo.recordRevision(
      id,
      'UPDATE',
      existing,
      updated,
      changedFields,
      context.userId,
      'Updated draft'
    );

    return updated;
  }

  /**
   * Submit a draft request for coordinator review
   */
  async submitRequest(id: UUID, context: UserContext): Promise<RespiteRequest> {
    const existing = await this.respiteRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new RespiteNotFoundError(id);
    }

    if (existing.status !== 'DRAFT') {
      throw new RespiteValidationError('Only draft requests can be submitted');
    }

    const submitted = await this.respiteRepo.submitRequest(id, context.userId);
    if (submitted === null || submitted === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Note: Activity feed and notifications would be added via FamilyEngagementService integration

    // Create audit revision
    await this.respiteRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      submitted,
      ['status', 'submittedAt'],
      context.userId,
      'Submitted for review'
    );

    return submitted;
  }

  /**
   * Approve a submitted respite request (coordinator action)
   */
  async approveRequest(
    id: UUID,
    input: ApproveRespiteRequestInput,
    context: UserContext
  ): Promise<RespiteRequest> {
    // Check coordinator permission
    if (!this.permissions.hasPermission(context, 'respite:approve')) {
      throw new RespitePermissionError('Insufficient permissions to approve respite requests');
    }

    const existing = await this.respiteRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new RespiteNotFoundError(id);
    }

    if (existing.status !== 'SUBMITTED') {
      throw new RespiteValidationError('Only submitted requests can be approved');
    }

    const approved = await this.respiteRepo.approveRequest(id, context.userId, input.approvalNotes);
    if (approved === null || approved === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Create audit revision
    await this.respiteRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      approved,
      ['status', 'reviewedBy', 'reviewedAt', 'approvalNotes'],
      context.userId,
      'Approved by coordinator'
    );

    return approved;
  }

  /**
   * Decline a submitted respite request (coordinator action)
   */
  async declineRequest(
    id: UUID,
    input: DeclineRespiteRequestInput,
    context: UserContext
  ): Promise<RespiteRequest> {
    // Check coordinator permission
    if (!this.permissions.hasPermission(context, 'respite:approve')) {
      throw new RespitePermissionError('Insufficient permissions to decline respite requests');
    }

    const existing = await this.respiteRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new RespiteNotFoundError(id);
    }

    if (existing.status !== 'SUBMITTED') {
      throw new RespiteValidationError('Only submitted requests can be declined');
    }

    const declined = await this.respiteRepo.declineRequest(id, context.userId, input.declineReason);
    if (declined === null || declined === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Create audit revision
    await this.respiteRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      declined,
      ['status', 'reviewedBy', 'reviewedAt', 'declineReason'],
      context.userId,
      `Declined: ${input.declineReason}`
    );

    return declined;
  }

  /**
   * Assign a caregiver to an approved request (coordinator action)
   */
  async assignCaregiver(
    id: UUID,
    caregiverId: UUID,
    visitId: UUID,
    context: UserContext
  ): Promise<RespiteRequest> {
    // Check coordinator permission
    if (!this.permissions.hasPermission(context, 'respite:assign')) {
      throw new RespitePermissionError('Insufficient permissions to assign caregivers');
    }

    const existing = await this.respiteRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new RespiteNotFoundError(id);
    }

    if (existing.status !== 'APPROVED') {
      throw new RespiteValidationError('Only approved requests can have caregivers assigned');
    }

    const assigned = await this.respiteRepo.assignCaregiver(id, caregiverId, visitId, context.userId);
    if (assigned === null || assigned === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Create audit revision
    await this.respiteRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      assigned,
      ['status', 'assignedCaregiverId', 'assignedAt', 'scheduledVisitId'],
      context.userId,
      'Caregiver assigned'
    );

    return assigned;
  }

  /**
   * Complete a respite care session
   */
  async completeRequest(
    id: UUID,
    input: CompleteRespiteRequestInput,
    context: UserContext
  ): Promise<RespiteRequest> {
    const existing = await this.respiteRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Start the respite if it's scheduled
    if (existing.status === 'SCHEDULED') {
      await this.respiteRepo.startRespite(id, context.userId);
    }

    const completed = await this.respiteRepo.completeRequest(id, context.userId, input.completionNotes);
    if (completed === null || completed === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Add family rating if provided
    if (input.familyRating !== undefined) {
      await this.respiteRepo.addFamilyFeedback(
        id,
        completed.familyMemberId,
        input.familyRating,
        input.familyFeedback
      );
    }

    // Create audit revision
    await this.respiteRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      completed,
      ['status', 'completedAt', 'completionNotes', 'familyRating', 'familyFeedback'],
      context.userId,
      'Completed'
    );

    return completed;
  }

  /**
   * Cancel a respite request
   */
  async cancelRequest(id: UUID, context: UserContext): Promise<RespiteRequest> {
    const existing = await this.respiteRepo.findById(id);
    if (existing === null || existing === undefined) {
      throw new RespiteNotFoundError(id);
    }

    const cancelled = await this.respiteRepo.cancelRequest(id, context.userId);
    if (cancelled === null || cancelled === undefined) {
      throw new RespiteValidationError('Request cannot be cancelled in its current state');
    }

    // Note: Activity feed entry would be added via FamilyEngagementService integration

    // Create audit revision
    await this.respiteRepo.recordRevision(
      id,
      'STATUS_CHANGE',
      existing,
      cancelled,
      ['status'],
      context.userId,
      'Cancelled'
    );

    return cancelled;
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get a single respite request by ID
   */
  async getRequest(id: UUID, _context: UserContext): Promise<RespiteRequest> {
    const request = await this.respiteRepo.findById(id);
    if (request === null || request === undefined) {
      throw new RespiteNotFoundError(id);
    }
    return request;
  }

  /**
   * Get requests for a family member
   */
  async getRequestsByFamilyMember(
    familyMemberId: UUID,
    _context: UserContext
  ): Promise<RespiteRequest[]> {
    return this.respiteRepo.findByFamilyMember(familyMemberId);
  }

  /**
   * Get requests for a client
   */
  async getRequestsByClient(
    clientId: UUID,
    _context: UserContext
  ): Promise<RespiteRequest[]> {
    return this.respiteRepo.findByClient(clientId);
  }

  /**
   * Get upcoming requests for a client
   */
  async getUpcomingRequests(
    clientId: UUID,
    _context: UserContext
  ): Promise<RespiteRequest[]> {
    return this.respiteRepo.findUpcoming(clientId);
  }

  /**
   * Query requests with filters
   */
  async queryRequests(
    filters: RespiteRequestFilters,
    _context: UserContext
  ): Promise<RespiteRequest[]> {
    return this.respiteRepo.findWithFilters(filters);
  }

  /**
   * Get available caregivers for a time slot
   */
  async getAvailableCaregivers(
    organizationId: UUID,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    requiredSkills?: string[],
    genderPreference?: string,
    preferredCaregiverId?: UUID,
    _context?: UserContext
  ): Promise<AvailableRespiteCaregiver[]> {
    return this.respiteRepo.findAvailableCaregivers(
      organizationId,
      startDate,
      startTime,
      endDate,
      endTime,
      requiredSkills,
      genderPreference,
      preferredCaregiverId
    );
  }

  /**
   * Get usage summary for a family member
   */
  async getUsageSummary(
    familyMemberId: UUID,
    clientId: UUID,
    _context: UserContext
  ): Promise<RespiteUsageSummary> {
    const stats = await this.respiteRepo.getUsageSummary(familyMemberId, clientId);
    const upcoming = await this.respiteRepo.findUpcoming(clientId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      familyMemberId,
      clientId,
      currentPeriod: {
        startDate: monthStart.toISOString().split('T')[0]!,
        endDate: monthEnd.toISOString().split('T')[0]!,
        hoursUsed: stats.currentPeriodHours,
        requestsSubmitted: stats.currentPeriodRequests,
        requestsCompleted: stats.currentPeriodCompleted
      },
      yearToDate: {
        totalHoursUsed: stats.yearToDateHours,
        totalRequestsCompleted: stats.yearToDateCompleted,
        averageRating: stats.averageRating
      },
      upcomingRequests: upcoming.map(r => ({
        id: r.id,
        status: r.status,
        requestedStartDate: r.requestedStartDate,
        requestedStartTime: r.requestedStartTime,
        durationMinutes: r.requestedDurationMinutes,
        assignedCaregiverName: undefined // Would need to join with caregivers
      }))
    };
  }

  /**
   * Get request with full details for display
   */
  async getRequestWithDetails(
    id: UUID,
    _context: UserContext
  ): Promise<RespiteRequestWithDetails> {
    const request = await this.respiteRepo.findById(id);
    if (request === null || request === undefined) {
      throw new RespiteNotFoundError(id);
    }

    // Get family member info
    const familyMember = await this.familyMemberRepo.findById(request.familyMemberId);

    // Format duration for display
    const hours = Math.floor(request.requestedDurationMinutes / 60);
    const minutes = request.requestedDurationMinutes % 60;
    const durationDisplay = hours > 0
      ? minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`
      : `${minutes} minutes`;

    // Format date/time for display
    const dateTimeDisplay = `${request.requestedStartDate} ${request.requestedStartTime} - ${request.requestedEndDate} ${request.requestedEndTime}`;

    // Map status to display string
    const statusDisplayMap: Record<string, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Awaiting Review',
      APPROVED: 'Approved - Pending Assignment',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      DECLINED: 'Declined'
    };

    return {
      ...request,
      clientName: '', // Would need to fetch from clients table
      familyMemberName: familyMember !== null && familyMember !== undefined
        ? `${familyMember.firstName} ${familyMember.lastName}`
        : 'Unknown',
      assignedCaregiverName: undefined, // Would need to fetch from caregivers table
      reviewerName: undefined, // Would need to fetch from users table
      durationDisplay,
      statusDisplay: statusDisplayMap[request.status] ?? request.status,
      dateTimeDisplay
    };
  }
}
