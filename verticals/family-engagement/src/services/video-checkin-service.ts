/**
 * @folkcare/family-engagement - Video Check-in Service
 *
 * Business logic for video calls between families and patients,
 * including scheduling, room management, and participant handling.
 */

import { v4 as uuidv4 } from 'uuid';
import type { PermissionService, UUID, UserContext } from '@folkcare/core';
import type {
  VideoCall,
  VideoCallParticipant,
  RecurringVideoSchedule,
  VideoCallInvitation,
  VideoCallFilters,
  RecurringScheduleFilters,
  ScheduleVideoCallInput,
  StartVideoCallInput,
  CreateRecurringScheduleInput,
  UpdateVideoCallInput,
  EndVideoCallInput,
  ParticipantFeedbackInput,
  SendInvitationInput,
  VideoCallWithParticipants,
  VideoCallJoinInfo,
  ClientVideoHistory,
  VideoCallDashboard,
  FamilyVideoView
} from '../types/video-checkin.js';
import type {
  VideoCallRepository,
  VideoCallParticipantRepository,
  RecurringVideoScheduleRepository,
  VideoCallInvitationRepository
} from '../repositories/video-checkin-repository.js';
import type { FamilyMemberRepository } from '../repositories/family-engagement-repository.js';

export class VideoCheckinService {
  constructor(
    private callRepo: VideoCallRepository,
    private participantRepo: VideoCallParticipantRepository,
    private scheduleRepo: RecurringVideoScheduleRepository,
    private invitationRepo: VideoCallInvitationRepository,
    private familyMemberRepo: FamilyMemberRepository,
    private permissions: PermissionService
  ) {}

  // ============================================================================
  // Video Call Management
  // ============================================================================

  async scheduleCall(
    input: ScheduleVideoCallInput,
    context: UserContext
  ): Promise<VideoCallWithParticipants> {
    this.permissions.requirePermission(context, 'video_calls:create');

    // Generate session ID and join code
    const sessionId = uuidv4();
    const joinCode = this.generateJoinCode();
    const roomUrl = this.generateRoomUrl(sessionId);

    // Calculate end time
    const scheduledEndTime = new Date(
      new Date(input.scheduledStartTime).getTime() + input.durationMinutes * 60000
    ).toISOString();

    // Create video call
    const call = await this.callRepo.create({
      sessionId,
      clientId: input.clientId,
      visitId: input.visitId,
      callType: input.callType,
      status: 'SCHEDULED',
      title: input.title,
      scheduledStartTime: input.scheduledStartTime,
      scheduledEndTime,
      durationMinutes: input.durationMinutes,
      isRecurring: false,
      hostUserId: context.userId,
      hostRole: 'COORDINATOR',
      roomUrl,
      joinCode,
      passwordProtected: false,
      provider: 'daily',
      maxParticipants: 10,
      recordingEnabled: input.recordingEnabled ?? false,
      notes: input.notes,
      organizationId: input.organizationId,
      branchId: input.branchId,
      createdBy: context.userId,
      updatedBy: context.userId
    });

    // Add participants
    const participants: VideoCallParticipant[] = [];

    // Add host as participant
    const hostParticipant = await this.participantRepo.create({
      videoCallId: call.id,
      userId: context.userId,
      role: 'HOST',
      status: 'INVITED',
      createdBy: context.userId,
      updatedBy: context.userId
    });
    participants.push(hostParticipant);

    // Add other participants
    for (const p of input.participants) {
      const participant = await this.participantRepo.create({
        videoCallId: call.id,
        userId: p.userId || context.userId,
        role: p.role,
        status: 'INVITED',
        familyMemberId: p.familyMemberId,
        createdBy: context.userId,
        updatedBy: context.userId
      });
      participants.push(participant);

      // Send invitation
      await this.sendInvitation({
        videoCallId: call.id,
        recipientUserId: p.userId,
        recipientFamilyMemberId: p.familyMemberId,
        recipientEmail: p.email,
        recipientName: p.email.split('@')[0] || p.email,
        invitationType: 'EMAIL'
      }, participant.id, context);
    }

    return {
      ...call,
      participants
    };
  }

  async startCall(
    input: StartVideoCallInput,
    context: UserContext
  ): Promise<VideoCallWithParticipants> {
    this.permissions.requirePermission(context, 'video_calls:create');

    // Generate session ID and join code
    const sessionId = uuidv4();
    const joinCode = this.generateJoinCode();
    const roomUrl = this.generateRoomUrl(sessionId);

    // Create video call
    const call = await this.callRepo.create({
      sessionId,
      clientId: input.clientId,
      visitId: input.visitId,
      callType: 'ON_DEMAND',
      status: 'WAITING',
      title: input.title,
      actualStartTime: new Date().toISOString(),
      isRecurring: false,
      hostUserId: context.userId,
      hostRole: 'CAREGIVER',
      roomUrl,
      joinCode,
      passwordProtected: false,
      provider: 'daily',
      maxParticipants: 10,
      recordingEnabled: input.recordingEnabled ?? false,
      organizationId: input.organizationId,
      branchId: input.branchId,
      createdBy: context.userId,
      updatedBy: context.userId
    });

    // Add host as participant and mark as connected
    const hostParticipant = await this.participantRepo.create({
      videoCallId: call.id,
      userId: context.userId,
      role: 'HOST',
      status: 'CONNECTED',
      joinedAt: new Date().toISOString(),
      createdBy: context.userId,
      updatedBy: context.userId
    });

    const participants: VideoCallParticipant[] = [hostParticipant];

    // Invite other participants
    for (const p of input.participants) {
      const participant = await this.participantRepo.create({
        videoCallId: call.id,
        userId: p.userId || context.userId,
        role: p.role,
        status: 'INVITED',
        familyMemberId: p.familyMemberId,
        createdBy: context.userId,
        updatedBy: context.userId
      });
      participants.push(participant);

      // Send invitation
      await this.sendInvitation({
        videoCallId: call.id,
        recipientUserId: p.userId,
        recipientFamilyMemberId: p.familyMemberId,
        recipientEmail: p.email,
        recipientName: p.email.split('@')[0] || p.email,
        invitationType: 'PUSH'
      }, participant.id, context);
    }

    return {
      ...call,
      participants
    };
  }

  async getCall(id: UUID, _context: UserContext): Promise<VideoCallWithParticipants> {
    const call = await this.callRepo.findById(id);
    if (!call) {
      throw new Error('Video call not found');
    }

    const participants = await this.participantRepo.findByVideoCallId(id);

    return {
      ...call,
      participants
    };
  }

  async updateCall(
    id: UUID,
    input: UpdateVideoCallInput,
    context: UserContext
  ): Promise<VideoCall> {
    this.permissions.requirePermission(context, 'video_calls:update');

    const call = await this.callRepo.update(id, {
      ...input,
      updatedBy: context.userId
    });

    if (!call) {
      throw new Error('Video call not found');
    }

    return call;
  }

  async joinCall(
    callId: UUID,
    context: UserContext,
    deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN',
    browserType?: string
  ): Promise<VideoCallJoinInfo> {
    const call = await this.callRepo.findById(callId);
    if (!call) {
      throw new Error('Video call not found');
    }

    if (call.status === 'COMPLETED' || call.status === 'CANCELLED') {
      throw new Error('Video call has ended');
    }

    // Find or create participant
    let participant = await this.participantRepo.findByUserAndCall(context.userId, callId);

    if (!participant) {
      // Create new participant if not exists
      participant = await this.participantRepo.create({
        videoCallId: callId,
        userId: context.userId,
        role: 'FAMILY',
        status: 'JOINING',
        deviceType,
        browserType,
        createdBy: context.userId,
        updatedBy: context.userId
      });
    }

    // Update participant status
    await this.participantRepo.update(participant.id, {
      status: 'CONNECTED',
      joinedAt: new Date().toISOString(),
      deviceType,
      browserType,
      updatedBy: context.userId
    });

    // Update call status if first participant joining
    if (call.status === 'SCHEDULED' || call.status === 'WAITING') {
      await this.callRepo.update(callId, {
        status: 'IN_PROGRESS',
        actualStartTime: call.actualStartTime || new Date().toISOString(),
        updatedBy: context.userId
      });
    }

    // Generate join token (in real implementation, this would be from video provider)
    const token = this.generateJoinToken(call.sessionId, context.userId);

    return {
      videoCallId: callId,
      sessionId: call.sessionId,
      roomUrl: call.roomUrl || '',
      joinCode: call.joinCode || '',
      token,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    };
  }

  async leaveCall(callId: UUID, context: UserContext): Promise<void> {
    const participant = await this.participantRepo.findByUserAndCall(context.userId, callId);

    if (participant && participant.status === 'CONNECTED') {
      const joinedAt = participant.joinedAt ? new Date(participant.joinedAt).getTime() : Date.now();
      const durationSeconds = Math.floor((Date.now() - joinedAt) / 1000);

      await this.participantRepo.update(participant.id, {
        status: 'DISCONNECTED',
        leftAt: new Date().toISOString(),
        connectionDurationSeconds: durationSeconds,
        updatedBy: context.userId
      });

      // Check if all participants have left
      const remainingParticipants = await this.participantRepo.findByVideoCallId(callId);
      const connectedCount = remainingParticipants.filter(p => p.status === 'CONNECTED').length;

      if (connectedCount === 0) {
        // End the call if everyone left
        await this.endCall(callId, {}, context);
      }
    }
  }

  async endCall(
    id: UUID,
    input: EndVideoCallInput,
    context: UserContext
  ): Promise<VideoCall> {
    const call = await this.callRepo.findById(id);
    if (!call) {
      throw new Error('Video call not found');
    }

    const actualEndTime = new Date().toISOString();
    const startTime = call.actualStartTime ? new Date(call.actualStartTime).getTime() : Date.now();
    const durationMinutes = Math.floor((Date.now() - startTime) / 60000);

    const updated = await this.callRepo.update(id, {
      status: 'COMPLETED',
      actualEndTime,
      durationMinutes,
      notes: input.notes || call.notes,
      qualityRating: input.qualityRating,
      updatedBy: context.userId
    });

    // Mark all connected participants as disconnected
    const participants = await this.participantRepo.findByVideoCallId(id);
    for (const p of participants) {
      if (p.status === 'CONNECTED') {
        const joinedAt = p.joinedAt ? new Date(p.joinedAt).getTime() : startTime;
        const connectionDuration = Math.floor((Date.now() - joinedAt) / 1000);

        await this.participantRepo.update(p.id, {
          status: 'DISCONNECTED',
          leftAt: actualEndTime,
          connectionDurationSeconds: connectionDuration,
          updatedBy: context.userId
        });
      }
    }

    if (!updated) {
      throw new Error('Failed to end video call');
    }

    return updated;
  }

  async cancelCall(id: UUID, context: UserContext): Promise<VideoCall> {
    this.permissions.requirePermission(context, 'video_calls:update');

    const call = await this.callRepo.update(id, {
      status: 'CANCELLED',
      updatedBy: context.userId
    });

    if (!call) {
      throw new Error('Video call not found');
    }

    return call;
  }

  async queryCalls(
    filters: VideoCallFilters,
    _context: UserContext
  ): Promise<VideoCall[]> {
    return this.callRepo.findByFilters(filters);
  }

  async getCallsByClient(clientId: UUID, _context: UserContext): Promise<VideoCall[]> {
    return this.callRepo.findByClientId(clientId);
  }

  async getCallsByVisit(visitId: UUID, _context: UserContext): Promise<VideoCall[]> {
    return this.callRepo.findByVisitId(visitId);
  }

  // ============================================================================
  // Participant Management
  // ============================================================================

  async submitParticipantFeedback(
    callId: UUID,
    input: ParticipantFeedbackInput,
    context: UserContext
  ): Promise<VideoCallParticipant> {
    const participant = await this.participantRepo.findByUserAndCall(context.userId, callId);

    if (!participant) {
      throw new Error('Participant not found');
    }

    const updated = await this.participantRepo.update(participant.id, {
      qualityRating: input.qualityRating,
      feedbackNotes: input.feedbackNotes,
      hadTechnicalIssues: input.hadTechnicalIssues ?? false,
      technicalIssueNotes: input.technicalIssueNotes,
      updatedBy: context.userId
    });

    if (!updated) {
      throw new Error('Failed to submit feedback');
    }

    return updated;
  }

  // ============================================================================
  // Recurring Schedules
  // ============================================================================

  async createRecurringSchedule(
    input: CreateRecurringScheduleInput,
    context: UserContext
  ): Promise<RecurringVideoSchedule> {
    this.permissions.requirePermission(context, 'video_calls:create');

    return this.scheduleRepo.create({
      clientId: input.clientId,
      title: input.title,
      description: input.description,
      recurrenceRule: input.recurrenceRule,
      duration: input.duration,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: true,
      defaultParticipants: input.defaultParticipants,
      autoCreateSession: true,
      reminderMinutesBefore: input.reminderMinutesBefore || [30, 5],
      maxParticipants: input.maxParticipants ?? 10,
      recordingEnabled: input.recordingEnabled ?? false,
      createdByUserId: context.userId,
      organizationId: input.organizationId,
      branchId: input.branchId,
      createdBy: context.userId,
      updatedBy: context.userId
    });
  }

  async getRecurringSchedule(id: UUID, _context: UserContext): Promise<RecurringVideoSchedule> {
    const schedule = await this.scheduleRepo.findById(id);
    if (!schedule) {
      throw new Error('Recurring schedule not found');
    }
    return schedule;
  }

  async getSchedulesByClient(clientId: UUID, _context: UserContext): Promise<RecurringVideoSchedule[]> {
    return this.scheduleRepo.findByClientId(clientId);
  }

  async querySchedules(
    filters: RecurringScheduleFilters,
    _context: UserContext
  ): Promise<RecurringVideoSchedule[]> {
    return this.scheduleRepo.findByFilters(filters);
  }

  async deactivateSchedule(id: UUID, context: UserContext): Promise<RecurringVideoSchedule> {
    this.permissions.requirePermission(context, 'video_calls:update');

    const schedule = await this.scheduleRepo.update(id, {
      isActive: false,
      updatedBy: context.userId
    });

    if (!schedule) {
      throw new Error('Recurring schedule not found');
    }

    return schedule;
  }

  async deleteSchedule(id: UUID, context: UserContext): Promise<void> {
    this.permissions.requirePermission(context, 'video_calls:delete');
    await this.scheduleRepo.delete(id);
  }

  // ============================================================================
  // Invitations
  // ============================================================================

  async sendInvitation(
    input: SendInvitationInput,
    participantId: UUID,
    context: UserContext
  ): Promise<VideoCallInvitation> {
    const call = await this.callRepo.findById(input.videoCallId);
    if (!call) {
      throw new Error('Video call not found');
    }

    const joinCode = call.joinCode || this.generateJoinCode();
    const joinUrl = `${call.roomUrl}?code=${joinCode}`;
    const expiresAt = call.scheduledEndTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return this.invitationRepo.create({
      videoCallId: input.videoCallId,
      participantId,
      recipientUserId: input.recipientUserId,
      recipientEmail: input.recipientEmail,
      recipientPhone: input.recipientPhone,
      recipientName: input.recipientName,
      invitationType: input.invitationType,
      sentAt: new Date().toISOString(),
      joinUrl,
      joinCode,
      expiresAt,
      createdBy: context.userId,
      updatedBy: context.userId
    });
  }

  async respondToInvitation(
    invitationId: UUID,
    response: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE',
    context: UserContext
  ): Promise<VideoCallInvitation> {
    const invitation = await this.invitationRepo.update(invitationId, {
      response,
      respondedAt: new Date().toISOString(),
      updatedBy: context.userId
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Update participant status based on response
    if (response === 'DECLINED') {
      await this.participantRepo.update(invitation.participantId, {
        status: 'DECLINED',
        updatedBy: context.userId
      });
    }

    return invitation;
  }

  async getPendingInvitations(context: UserContext): Promise<VideoCallInvitation[]> {
    return this.invitationRepo.findPendingByUserId(context.userId);
  }

  // ============================================================================
  // Dashboard & Views
  // ============================================================================

  async getDashboard(context: UserContext): Promise<VideoCallDashboard> {
    this.permissions.requirePermission(context, 'video_calls:read');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's calls
    const todayCalls = await this.callRepo.findByFilters({
      scheduledFrom: today.toISOString(),
      scheduledTo: tomorrow.toISOString(),
      organizationId: context.organizationId
    });

    const todayCompleted = todayCalls.filter(c => c.status === 'COMPLETED').length;
    const todayInProgress = todayCalls.filter(c => c.status === 'IN_PROGRESS').length;

    // Get upcoming calls
    const upcomingCalls = await this.callRepo.findUpcoming(context.organizationId, 10);

    // Get recent missed calls
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentCalls = await this.callRepo.findByFilters({
      status: ['MISSED', 'FAILED'],
      scheduledFrom: lastWeek.toISOString(),
      organizationId: context.organizationId
    });

    // Calculate statistics
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const weekCalls = await this.callRepo.findByFilters({
      status: 'COMPLETED',
      scheduledFrom: thisWeekStart.toISOString(),
      organizationId: context.organizationId
    });

    const totalMinutes = weekCalls.reduce((sum, c) => sum + (c.durationMinutes || 0), 0);

    return {
      todayScheduled: todayCalls.length,
      todayCompleted,
      todayInProgress,
      upcomingCalls: upcomingCalls.map(c => ({
        videoCallId: c.id,
        clientName: 'Client', // Would need to join with clients
        scheduledStartTime: c.scheduledStartTime || '',
        participantCount: 0 // Would need to count
      })),
      recentMissedCalls: recentCalls.slice(0, 5).map(c => ({
        videoCallId: c.id,
        clientName: 'Client',
        scheduledStartTime: c.scheduledStartTime || '',
        reason: c.status === 'MISSED' ? 'Not answered' : 'Technical failure'
      })),
      statistics: {
        thisWeekCalls: weekCalls.length,
        thisWeekMinutes: totalMinutes,
        averageQualityRating: 0, // Would need calculation
        participantSatisfaction: 0 // Would need calculation
      }
    };
  }

  async getClientVideoHistory(
    clientId: UUID,
    _context: UserContext
  ): Promise<ClientVideoHistory> {
    const calls = await this.callRepo.findByClientId(clientId);

    const completedCalls = calls.filter(c => c.status === 'COMPLETED');
    const missedCalls = calls.filter(c => c.status === 'MISSED');
    const upcomingCalls = calls.filter(c =>
      c.status === 'SCHEDULED' &&
      c.scheduledStartTime &&
      new Date(c.scheduledStartTime) > new Date()
    );
    const recentCalls = completedCalls.slice(0, 10);

    const averageDuration = completedCalls.length > 0
      ? completedCalls.reduce((sum, c) => sum + (c.durationMinutes || 0), 0) / completedCalls.length
      : 0;

    const lastCall = completedCalls[0];

    return {
      clientId,
      totalCalls: calls.length,
      completedCalls: completedCalls.length,
      missedCalls: missedCalls.length,
      averageDuration,
      lastCallDate: lastCall?.actualEndTime ? String(lastCall.actualEndTime).split('T')[0] : undefined,
      upcomingCalls,
      recentCalls
    };
  }

  async getFamilyVideoView(
    clientId: UUID,
    familyMemberId: UUID,
    context: UserContext
  ): Promise<FamilyVideoView> {
    // Verify family member
    const familyMember = await this.familyMemberRepo.findById(familyMemberId);
    if (!familyMember || familyMember.clientId !== clientId) {
      throw new Error('Invalid family member for this client');
    }

    // Get upcoming calls
    const upcomingCalls = await this.callRepo.findByFilters({
      clientId,
      status: ['SCHEDULED', 'WAITING'],
      scheduledFrom: new Date().toISOString()
    });

    // Get recurring schedules
    const schedules = await this.scheduleRepo.findByClientId(clientId);
    const activeSchedules = schedules.filter(s => s.isActive);

    // Get recent calls
    const allCalls = await this.callRepo.findByClientId(clientId);
    const recentCalls = allCalls
      .filter(c => c.status === 'COMPLETED')
      .slice(0, 5);

    // Get pending invitations for this family member
    const pendingInvitations = await this.invitationRepo.findPendingByUserId(context.userId);

    return {
      clientId,
      upcomingCalls: upcomingCalls.map(c => ({
        videoCallId: c.id,
        title: c.title,
        scheduledStartTime: c.scheduledStartTime || '',
        durationMinutes: c.durationMinutes || 30,
        hostName: 'Caregiver',
        joinUrl: c.roomUrl,
        joinCode: c.joinCode
      })),
      recurringSchedules: activeSchedules.map(s => ({
        scheduleId: s.id,
        title: s.title,
        recurrenceRule: s.recurrenceRule,
        nextOccurrence: undefined // Would need RRULE parsing
      })),
      recentCalls: recentCalls.map(c => ({
        videoCallId: c.id,
        title: c.title,
        actualStartTime: c.actualStartTime || '',
        durationMinutes: c.durationMinutes || 0,
        status: c.status,
        notes: c.familyVisibleNotes
      })),
      pendingInvitations
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateJoinCode(): string {
    // Generate 6-digit alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateRoomUrl(sessionId: string): string {
    // In real implementation, this would create a room with video provider
    return `https://video.folkcare.example/room/${sessionId}`;
  }

  private generateJoinToken(sessionId: string, userId: UUID): string {
    // In real implementation, this would generate a JWT for the video provider
    return `token_${sessionId}_${userId}_${Date.now()}`;
  }
}
