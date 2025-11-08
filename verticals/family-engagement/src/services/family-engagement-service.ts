/* eslint-disable sonarjs/todo-tag */
/* eslint-disable sonarjs/fixme-tag */
/**
 * Family Engagement Service
 *
 * Business logic for family portal, notifications, and communication
 */

import type {
  UserContext,
  UUID,
  ValidationError,
  PermissionError,
  NotFoundError,
  IUserProvider,
  IClientProvider,
  IVisitProvider,
  ICarePlanProvider
} from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import type {
  FamilyMember,
  FamilyMemberProfile,
  Notification,
  ActivityFeedItem,
  MessageThread,
  Message,
  VisitSummary,
  InviteFamilyMemberInput,
  SendNotificationInput,
  CreateMessageThreadInput,
  SendMessageInput,
  FamilyDashboard
} from '../types/family-engagement.js';
import {
  FamilyMemberRepository,
  NotificationRepository,
  ActivityFeedRepository,
  MessageRepository
} from '../repositories/family-engagement-repository.js';

/**
 * Service for managing family portal and engagement
 */
export class FamilyEngagementService {
  constructor(
    private familyMemberRepo: FamilyMemberRepository,
    private notificationRepo: NotificationRepository,
    private activityFeedRepo: ActivityFeedRepository,
    private messageRepo: MessageRepository,
    private permissions: PermissionService,
    private userProvider: IUserProvider,
    private clientProvider: IClientProvider,
    private visitProvider: IVisitProvider,
    private carePlanProvider: ICarePlanProvider
  ) {}

  // ============================================================================
  // Family Member Management
  // ============================================================================

  /**
   * Invite a family member to the portal
   */
  async inviteFamilyMember(
    input: InviteFamilyMemberInput,
    context: UserContext
  ): Promise<FamilyMember> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'family-portal:invite')) {
      throw new Error('Insufficient permissions to invite family members') as PermissionError;
    }

    // Validate email uniqueness for client
    const existing = await this.familyMemberRepo.findByEmail(input.email);
    if (existing && existing.clientId === input.clientId) {
      throw new Error('Family member with this email already has portal access for this client') as ValidationError;
    }

    // Create family member
    const familyMember = await this.familyMemberRepo.createFamilyMember({
      ...input,
      createdBy: context.userId
    });

    // Create notification for invitation
    await this.notificationRepo.createNotification({
      familyMemberId: familyMember.id,
      clientId: input.clientId,
      category: 'SYSTEM',
      priority: 'NORMAL',
      title: 'Portal Access Invitation',
      message: `You have been invited to access the family portal for your ${input.relationship.toLowerCase()}.`,
      actionUrl: '/portal/accept-invitation',
      actionLabel: 'Accept Invitation',
      createdBy: context.userId,
      organizationId: context.organizationId
    });

    return familyMember;
  }

  /**
   * Get family member profile with statistics
   */
  async getFamilyMemberProfile(
    familyMemberId: UUID,
    context: UserContext
  ): Promise<FamilyMemberProfile | null> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'family-portal:view')) {
      throw new Error('Insufficient permissions to view family profiles') as PermissionError;
    }

    return await this.familyMemberRepo.getFamilyMemberProfile(familyMemberId);
  }

  /**
   * Get family members for a client
   */
  async getFamilyMembersForClient(
    clientId: UUID,
    context: UserContext
  ): Promise<FamilyMember[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'clients:view')) {
      throw new Error('Insufficient permissions to view client family members') as PermissionError;
    }

    return await this.familyMemberRepo.findByClientId(clientId);
  }

  /**
   * Update family member portal access
   */
  async updatePortalAccess(
    familyMemberId: UUID,
    updates: Partial<Pick<FamilyMember, 'portalAccessLevel' | 'status' | 'accessExpiresAt'>>,
    context: UserContext
  ): Promise<FamilyMember> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'family-portal:manage')) {
      throw new Error('Insufficient permissions to update portal access') as PermissionError;
    }

    const familyMember = await this.familyMemberRepo.findById(familyMemberId);
    if (!familyMember) {
      throw new Error('Family member not found') as NotFoundError;
    }

    return await this.familyMemberRepo.update(familyMemberId, {
      ...updates,
      updatedBy: context.userId
    }, context);
  }

  // ============================================================================
  // Notification Management
  // ============================================================================

  /**
   * Send notification to family member
   */
  async sendNotification(
    input: SendNotificationInput,
    context: UserContext
  ): Promise<Notification> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'notifications:send')) {
      throw new Error('Insufficient permissions to send notifications') as PermissionError;
    }

    // Verify family member exists and check notification preferences
    const familyMember = await this.familyMemberRepo.findById(input.familyMemberId);
    if (!familyMember) {
      throw new Error('Family member not found') as NotFoundError;
    }

    if (!familyMember.receiveNotifications) {
      // Family member has opted out of notifications
      throw new Error('Family member has disabled notifications') as ValidationError;
    }

    // Create notification
    const notification = await this.notificationRepo.createNotification({
      ...input,
      createdBy: context.userId,
      organizationId: context.organizationId
    });

    // FIXME: Trigger actual notification delivery (email, SMS, push)
    // This would integrate with external notification services

    return notification;
  }

  /**
   * Get unread notifications for family member
   */
  async getUnreadNotifications(
    familyMemberId: UUID,
    context: UserContext
  ): Promise<Notification[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'notifications:view')) {
      throw new Error('Insufficient permissions to view notifications') as PermissionError;
    }

    return await this.notificationRepo.getUnreadNotifications(familyMemberId);
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    notificationId: UUID,
    context: UserContext
  ): Promise<void> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'notifications:view')) {
      throw new Error('Insufficient permissions to update notifications') as PermissionError;
    }

    await this.notificationRepo.markAsRead(notificationId);
  }

  /**
   * Batch send notifications to multiple family members
   */
  async broadcastNotification(
    clientId: UUID,
    input: Omit<SendNotificationInput, 'familyMemberId' | 'clientId'>,
    context: UserContext
  ): Promise<Notification[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'notifications:broadcast')) {
      throw new Error('Insufficient permissions to broadcast notifications') as PermissionError;
    }

    // Get all active family members for client
    const familyMembers = await this.familyMemberRepo.findByClientId(clientId);
    const activeMembers = familyMembers.filter(
      fm => fm.status === 'ACTIVE' && fm.receiveNotifications
    );

    // Create notifications for all active members
    const notifications: Notification[] = [];
    for (const member of activeMembers) {
      const notification = await this.notificationRepo.createNotification({
        familyMemberId: member.id,
        clientId,
        ...input,
        createdBy: context.userId,
        organizationId: context.organizationId
      });
      notifications.push(notification);
    }

    return notifications;
  }

  // ============================================================================
  // Activity Feed Management
  // ============================================================================

  /**
   * Get recent activity for family member
   */
  async getRecentActivity(
    familyMemberId: UUID,
    limit: number = 20,
    context: UserContext
  ): Promise<ActivityFeedItem[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'activity-feed:view')) {
      throw new Error('Insufficient permissions to view activity feed') as PermissionError;
    }

    return await this.activityFeedRepo.getRecentActivity(familyMemberId, limit);
  }

  /**
   * Create activity feed item
   * (Called by other verticals when events occur)
   */
  async createActivityFeedItem(
    familyMemberIds: UUID[],
    clientId: UUID,
    activity: Pick<ActivityFeedItem, 'activityType' | 'title' | 'description' | 'summary' | 'relatedEntityType' | 'relatedEntityId' | 'performedBy' | 'performedByName' | 'iconType'>,
    context: UserContext
  ): Promise<ActivityFeedItem[]> {
    const activities: ActivityFeedItem[] = [];

    for (const familyMemberId of familyMemberIds) {
      const activityItem = await this.activityFeedRepo.create({
        familyMemberId,
        clientId,
        ...activity,
        viewedByFamily: false,
        organizationId: context.organizationId,
        branchId: context.branchIds[0],
        occurredAt: new Date()
      }, context);
      activities.push(activityItem);
    }

    return activities;
  }

  // ============================================================================
  // Messaging Management
  // ============================================================================

  /**
   * Create message thread
   */
  async createMessageThread(
    input: CreateMessageThreadInput,
    context: UserContext
  ): Promise<MessageThread> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'messages:create')) {
      throw new Error('Insufficient permissions to create message threads') as PermissionError;
    }

    // Create thread
    const thread = await this.messageRepo.createThread({
      ...input,
      createdBy: context.userId,
      organizationId: context.organizationId,
      branchId: context.branchIds[0] || context.organizationId // Fallback to orgId if no branchId
    });

    // Send initial message if provided
    if (input.initialMessage) {
      const senderName = await this.userProvider.getUserName(context.userId);

      await this.messageRepo.sendMessage({
        threadId: thread.id,
        messageText: input.initialMessage,
        familyMemberId: input.familyMemberId,
        clientId: input.clientId,
        sentBy: context.userId,
        senderType: 'STAFF',
        senderName,
        organizationId: context.organizationId,
        createdBy: context.userId
      });
    }

    return thread;
  }

  /**
   * Send message in thread
   */
  async sendMessage(
    input: SendMessageInput,
    senderType: 'FAMILY' | 'STAFF',
    context: UserContext
  ): Promise<Message> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'messages:send')) {
      throw new Error('Insufficient permissions to send messages') as PermissionError;
    }

    // Get thread to validate access and get clientId, familyMemberId
    const thread = await this.messageRepo.getThreadById(input.threadId);

    if (!thread) {
      throw new Error(`Thread ${input.threadId} not found`) as NotFoundError;
    }

    // Verify sender is a participant in the thread
    const isParticipant = thread.participants.includes(context.userId);
    if (!isParticipant) {
      throw new Error(`User ${context.userId} is not a participant in thread ${input.threadId}`) as PermissionError;
    }

    // Get actual user name
    const senderName = await this.userProvider.getUserName(context.userId);

    const message = await this.messageRepo.sendMessage({
      ...input,
      familyMemberId: thread.familyMemberId,
      clientId: thread.clientId,
      sentBy: context.userId,
      senderType,
      senderName,
      organizationId: context.organizationId,
      createdBy: context.userId
    });

    // Create notification for recipient
    if (senderType === 'STAFF') {
      // Notify family member
      await this.notificationRepo.createNotification({
        familyMemberId: message.familyMemberId,
        clientId: message.clientId,
        category: 'MESSAGE',
        priority: 'NORMAL',
        title: 'New Message',
        message: `You have a new message from ${message.senderName}`,
        actionUrl: `/portal/messages/${message.threadId}`,
        actionLabel: 'View Message',
        relatedEntityType: 'MESSAGE',
        relatedEntityId: message.id,
        createdBy: context.userId,
        organizationId: context.organizationId
      });
    }

    return message;
  }

  /**
   * Get message threads for family member
   */
  async getThreadsForFamilyMember(
    familyMemberId: UUID,
    context: UserContext
  ): Promise<MessageThread[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'messages:view')) {
      throw new Error('Insufficient permissions to view message threads') as PermissionError;
    }

    return await this.messageRepo.getThreadsForFamilyMember(familyMemberId);
  }

  /**
   * Get messages in thread
   */
  async getMessagesInThread(
    threadId: UUID,
    context: UserContext
  ): Promise<Message[]> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'messages:view')) {
      throw new Error('Insufficient permissions to view messages') as PermissionError;
    }

    return await this.messageRepo.getMessagesInThread(threadId);
  }

  // ============================================================================
  // Dashboard & Summary Views
  // ============================================================================

  /**
   * Get family dashboard data
   */
  async getFamilyDashboard(
    familyMemberId: UUID,
    context: UserContext
  ): Promise<FamilyDashboard> {
    // Validate permissions
    if (!this.permissions.hasPermission(context, 'family-portal:view')) {
      throw new Error('Insufficient permissions to view dashboard') as PermissionError;
    }

    const profile = await this.familyMemberRepo.getFamilyMemberProfile(familyMemberId);
    if (!profile) {
      throw new Error('Family member not found') as NotFoundError;
    }

    // Fetch client data
    const client = await this.clientProvider.getClientById(profile.clientId);
    const clientName = client
      ? `${client.firstName} ${client.lastName}`
      : 'Unknown Client';

    // Get upcoming visits for the client
    const now = new Date();
    const visits = await this.visitProvider.getVisitsByClientId(profile.clientId, {
      startDate: now,
      status: ['SCHEDULED', 'CONFIRMED'],
      orderBy: 'scheduled_date',
      order: 'asc',
      limit: 10
    });

    // Map visits to VisitSummary format
    const upcomingVisits: VisitSummary[] = await Promise.all(
      visits.map(async (visit) => {
        // Get caregiver name
        let caregiverName = 'Unassigned';
        if (visit.caregiverId) {
          caregiverName = await this.userProvider.getUserName(visit.caregiverId);
        }

        // Combine scheduledDate and times to create full timestamps
        const dateStr = visit.scheduledDate instanceof Date
          ? visit.scheduledDate.toISOString().split('T')[0]
          : String(visit.scheduledDate);

        return {
          id: visit.id,
          visitId: visit.id,
          clientId: visit.clientId,
          familyMemberIds: [familyMemberId],
          scheduledStartTime: new Date(`${dateStr}T${visit.scheduledStartTime}`),
          scheduledEndTime: new Date(`${dateStr}T${visit.scheduledEndTime}`),
          actualStartTime: visit.actualStartTime ?? undefined,
          actualEndTime: visit.actualEndTime ?? undefined,
          caregiverName,
          caregiverPhotoUrl: undefined,
          tasksCompleted: [],
          visitNotes: undefined,
          status: visit.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
          cancellationReason: undefined,
          visibleToFamily: true,
          publishedAt: null,
          viewedByFamily: false,
          viewedAt: null,
          organizationId: visit.organizationId,
          branchId: visit.branchId,
          createdAt: visit.createdAt,
          createdBy: context.userId,
          updatedAt: visit.updatedAt,
          updatedBy: context.userId,
          version: 1
        } as VisitSummary;
      })
    );

    // Get active care plan
    let activeCarePlan = undefined;
    const carePlan = await this.carePlanProvider.getActiveCarePlanForClient(profile.clientId);
    if (carePlan) {
      // Count goals
      const goals = carePlan.goals || [];
      const goalsTotal = Array.isArray(goals) ? goals.length : 0;
      const goalsAchieved = Array.isArray(goals)
        ? goals.filter((g: unknown) => {
            const goal = g as { status?: string };
            return goal.status === 'ACHIEVED' || goal.status === 'COMPLETED';
          }).length
        : 0;

      activeCarePlan = {
        id: carePlan.id,
        name: carePlan.name,
        goalsTotal,
        goalsAchieved
      };
    }

    // Get recent activity
    const recentActivity = await this.activityFeedRepo.getRecentActivity(familyMemberId, 10);

    // Get unread counts
    const unreadNotifications = profile.statistics.unreadNotifications;
    const unreadMessages = profile.statistics.unreadMessages;

    return {
      client: {
        id: profile.clientId,
        name: clientName,
        photoUrl: undefined
      },
      upcomingVisits,
      recentActivity,
      unreadNotifications,
      unreadMessages,
      activeCarePlan
    };
  }

  /**
   * Generate automated notifications for care events
   */
  async notifyFamilyOfCareEvent(
    clientId: UUID,
    eventType: 'VISIT_COMPLETED' | 'GOAL_ACHIEVED' | 'INCIDENT_REPORTED' | 'CARE_PLAN_UPDATED',
    eventData: {
      title: string;
      message: string;
      relatedEntityType?: 'VISIT' | 'CARE_PLAN' | 'INCIDENT' | 'GOAL';
      relatedEntityId?: UUID;
      performedBy?: UUID;
      performedByName?: string;
    },
    context: UserContext
  ): Promise<void> {
    // Get all active family members for client
    const familyMembers = await this.familyMemberRepo.findByClientId(clientId);
    const activeMembers = familyMembers.filter(fm => fm.status === 'ACTIVE');

    // Determine priority based on event type
    const priority = eventType === 'INCIDENT_REPORTED' ? 'HIGH' : 'NORMAL';
    const category = eventType === 'VISIT_COMPLETED' ? 'VISIT' :
                    eventType === 'GOAL_ACHIEVED' ? 'CARE_PLAN' :
                    eventType === 'INCIDENT_REPORTED' ? 'INCIDENT' :
                    'CARE_PLAN';

    // Create notifications for all active family members
    // Map GOAL to CARE_PLAN for notification type
    const notificationEntityType = eventData.relatedEntityType === 'GOAL' 
      ? 'CARE_PLAN' 
      : eventData.relatedEntityType;
    
    await this.broadcastNotification(clientId, {
      category,
      priority,
      title: eventData.title,
      message: eventData.message,
      relatedEntityType: notificationEntityType,
      relatedEntityId: eventData.relatedEntityId
    }, context);

    // Create activity feed items
    const activityType =
      eventType === 'VISIT_COMPLETED' ? 'VISIT_COMPLETED' :
      eventType === 'GOAL_ACHIEVED' ? 'GOAL_ACHIEVED' :
      eventType === 'INCIDENT_REPORTED' ? 'INCIDENT_REPORTED' :
      'CARE_PLAN_UPDATED';

    await this.createActivityFeedItem(
      activeMembers.map(fm => fm.id),
      clientId,
      {
        activityType,
        title: eventData.title,
        description: eventData.message,
        relatedEntityType: eventData.relatedEntityType || 'VISIT',
        relatedEntityId: eventData.relatedEntityId || clientId,
        performedBy: eventData.performedBy,
        performedByName: eventData.performedByName
      },
      context
    );
  }
}
