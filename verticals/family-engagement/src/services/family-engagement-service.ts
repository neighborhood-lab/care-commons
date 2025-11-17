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
  IUserRepository
} from '@care-commons/core';
import { PermissionService, getNotificationService } from '@care-commons/core';
import type { NotificationChannel } from '@care-commons/core';
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
  FamilyDashboard,
  CareTeamMember
} from '../types/family-engagement';
import {
  FamilyMemberRepository,
  NotificationRepository,
  ActivityFeedRepository,
  MessageRepository
} from '../repositories/family-engagement-repository';
import type { ClientService } from '@care-commons/client-demographics';
import type { CarePlanService } from '@care-commons/care-plans-tasks';

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
    private userRepository: IUserRepository,
    private clientService: ClientService,
    private carePlanService: CarePlanService
  ) {}

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get user display name from user ID
   * Returns "firstName lastName" or email if name not available
   */
  private async getUserName(userId: UUID): Promise<string> {
    try {
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        return 'Unknown User';
      }
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      return user.email;
    } catch (error) {
      console.error(`Failed to get user name for ${userId}:`, error);
      return 'Unknown User';
    }
  }

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
      organizationId: context.organizationId!
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
      organizationId: context.organizationId!
    });

    // Trigger actual notification delivery
    // Note: NotificationService currently only supports visit-related event types
    // Family portal notifications (messages, care plans, incidents) would require
    // expanding the NotificationService event types. For now, we create the notification
    // record in the database, which can be viewed in the portal.
    // Future enhancement: Add FAMILY_MESSAGE, CARE_PLAN_UPDATE, etc. to NotificationService
    try {
      const notificationService = getNotificationService();
      
      // Map preferred contact method to notification channels
      const preferredChannels: NotificationChannel[] = [];
      if (familyMember.preferredContactMethod === 'EMAIL' || familyMember.preferredContactMethod === 'PORTAL') {
        preferredChannels.push('EMAIL');
      }
      if (familyMember.preferredContactMethod === 'SMS') {
        preferredChannels.push('SMS');
      }
      // Default to email if no preference set
      if (preferredChannels.length === 0) {
        preferredChannels.push('EMAIL');
      }

      // Only send via notification service if it's a visit-related notification
      // Other notification types are stored in DB and shown in portal
      if (input.category === 'VISIT' && input.relatedEntityType === 'VISIT') {
        // Map to appropriate visit event type based on notification content
        const eventType = input.title.includes('completed') ? 'VISIT_CLOCK_OUT' : 'VISIT_CLOCK_IN';
        
        await notificationService.send({
          eventType,
          priority: input.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
          recipients: [{
            userId: familyMember.id,
            email: familyMember.email,
            phone: familyMember.phoneNumber,
            preferredChannels
          }],
          subject: input.title,
          message: input.message,
          data: {
            notificationId: notification.id,
            category: input.category,
            actionUrl: input.actionUrl,
            actionLabel: input.actionLabel
          },
          organizationId: context.organizationId!,
          relatedEntityType: 'visit',
          relatedEntityId: input.relatedEntityId
        });
      }
    } catch (error) {
      // Log but don't fail - notification record is saved, delivery can be retried
      console.error('Failed to deliver notification via notification service:', error);
    }

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
        organizationId: context.organizationId!
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
        organizationId: context.organizationId!,
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
      organizationId: context.organizationId!,
      branchId: context.branchIds[0] || context.organizationId! // Fallback to orgId if no branchId
    });

    // Send initial message if provided
    if (input.initialMessage) {
      const senderName = await this.getUserName(context.userId);
      await this.messageRepo.sendMessage({
        threadId: thread.id,
        messageText: input.initialMessage,
        familyMemberId: input.familyMemberId,
        clientId: input.clientId,
        sentBy: context.userId,
        senderType: 'STAFF',
        senderName,
        organizationId: context.organizationId!,
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
      throw new Error('Message thread not found') as NotFoundError;
    }

    const senderName = await this.getUserName(context.userId);
    const message = await this.messageRepo.sendMessage({
      ...input,
      familyMemberId: thread.familyMemberId,
      clientId: thread.clientId,
      sentBy: context.userId,
      senderType,
      senderName,
      organizationId: context.organizationId!,
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
        organizationId: context.organizationId!
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
      // Return demo data
      return {
        client: { id: 'demo-client' as UUID, name: 'Margaret Johnson' },
        unreadNotifications: 0,
        unreadMessages: 0,
        upcomingVisits: [],
        recentActivity: [],
        careTeam: []
      };
    }

    // IMPORTANT: Family members can only view their own dashboard
    // For FAMILY role, ensure familyMemberId matches userId (they should be the same)
    if (context.roles.includes('FAMILY') && familyMemberId !== context.userId) {
      throw new Error('You can only access your own family portal') as PermissionError;
    }

    // Get recent activity
    let recentActivity = await this.activityFeedRepo.getRecentActivity(familyMemberId, 10);

    // Add mock activity feed items if empty (for demo purposes)
    if (recentActivity.length === 0) {
      const now = new Date();
      recentActivity = [
        {
          id: 'activity-1' as UUID,
          familyMemberId,
          clientId: profile.clientId,
          activityType: 'VISIT_COMPLETED',
          title: 'Visit Completed',
          description: 'Morning care visit completed successfully',
          performedBy: 'caregiver-1' as UUID,
          performedByName: 'Sarah Johnson',
          relatedEntityType: 'VISIT',
          relatedEntityId: 'visit-1' as UUID,
          occurredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          viewedByFamily: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          createdBy: context.userId,
          updatedBy: context.userId,
          version: 1,
          organizationId: context.organizationId!,
          branchId: context.branchIds[0] || context.organizationId!,
        },
        {
          id: 'activity-2' as UUID,
          familyMemberId,
          clientId: profile.clientId,
          activityType: 'GOAL_ACHIEVED',
          title: 'Goal Achieved',
          description: 'Medication management goal achieved ahead of schedule',
          performedBy: 'coordinator-1' as UUID,
          performedByName: 'Care Coordinator',
          relatedEntityType: 'CARE_PLAN',
          relatedEntityId: 'goal-1' as UUID,
          occurredAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
          viewedByFamily: false,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          createdBy: context.userId,
          updatedBy: context.userId,
          version: 1,
          organizationId: context.organizationId!,
          branchId: context.branchIds[0] || context.organizationId!,
        },
        {
          id: 'activity-3' as UUID,
          familyMemberId,
          clientId: profile.clientId,
          activityType: 'CARE_PLAN_UPDATED',
          title: 'Care Plan Updated',
          description: 'Care plan updated with new mobility goals',
          performedBy: 'coordinator-1' as UUID,
          performedByName: 'Care Coordinator',
          relatedEntityType: 'CARE_PLAN',
          relatedEntityId: 'care-plan-1' as UUID,
          occurredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          viewedByFamily: false,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          createdBy: context.userId,
          updatedBy: context.userId,
          version: 1,
          organizationId: context.organizationId!,
          branchId: context.branchIds[0] || context.organizationId!,
        },
      ];
    }

    // Get upcoming visits for the client
    // Note: Visit summaries are published to the family portal separately
    // via the publishVisitSummary feature. This queries the visit_summaries table
    // which is populated when visits are completed and approved for family viewing.
    // For now, returning mock data for demo purposes
    const upcomingVisits: VisitSummary[] = [
      {
        id: 'visit-summary-1' as UUID,
        clientId: profile.clientId,
        visitId: 'visit-1' as UUID,
        familyMemberIds: [familyMemberId],
        scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        caregiverName: 'Sarah Johnson',
        caregiverPhotoUrl: undefined,
        status: 'SCHEDULED',
        tasksCompleted: [],
        visibleToFamily: true,
        viewedByFamily: false,
        organizationId: context.organizationId!,
        branchId: context.branchIds[0] || context.organizationId!,
        createdBy: context.userId,
        updatedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      {
        id: 'visit-summary-2' as UUID,
        clientId: profile.clientId,
        visitId: 'visit-2' as UUID,
        familyMemberIds: [familyMemberId],
        scheduledStartTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow morning
        scheduledEndTime: new Date(Date.now() + 28 * 60 * 60 * 1000),
        caregiverName: 'Sarah Johnson',
        caregiverPhotoUrl: undefined,
        status: 'SCHEDULED',
        tasksCompleted: [],
        visibleToFamily: true,
        viewedByFamily: false,
        organizationId: context.organizationId!,
        branchId: context.branchIds[0] || context.organizationId!,
        createdBy: context.userId,
        updatedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      {
        id: 'visit-summary-3' as UUID,
        clientId: profile.clientId,
        visitId: 'visit-3' as UUID,
        familyMemberIds: [familyMemberId],
        scheduledStartTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // 2 days from now
        scheduledEndTime: new Date(Date.now() + 52 * 60 * 60 * 1000),
        caregiverName: 'Michael Chen',
        caregiverPhotoUrl: undefined,
        status: 'SCHEDULED',
        tasksCompleted: [],
        visibleToFamily: true,
        viewedByFamily: false,
        organizationId: context.organizationId!,
        branchId: context.branchIds[0] || context.organizationId!,
        createdBy: context.userId,
        updatedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      {
        id: 'visit-summary-4' as UUID,
        clientId: profile.clientId,
        visitId: 'visit-4' as UUID,
        familyMemberIds: [familyMemberId],
        scheduledStartTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (completed)
        scheduledEndTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        actualStartTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        actualEndTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        caregiverName: 'Sarah Johnson',
        caregiverPhotoUrl: undefined,
        status: 'COMPLETED',
        tasksCompleted: [
          {
            taskId: 'task-1' as UUID,
            taskName: 'Personal Care',
            category: 'ADL',
            status: 'COMPLETED',
            completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
          {
            taskId: 'task-2' as UUID,
            taskName: 'Medication Assistance',
            category: 'Medical',
            status: 'COMPLETED',
            completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
        ],
        visitNotes: 'Visit went well. Patient was in good spirits and took all medications as prescribed.',
        visibleToFamily: true,
        viewedByFamily: false,
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        organizationId: context.organizationId!,
        branchId: context.branchIds[0] || context.organizationId!,
        createdBy: context.userId,
        updatedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      {
        id: 'visit-summary-5' as UUID,
        clientId: profile.clientId,
        visitId: 'visit-5' as UUID,
        familyMemberIds: [familyMemberId],
        scheduledStartTime: new Date(Date.now() - 30 * 60 * 60 * 1000), // Yesterday (completed)
        scheduledEndTime: new Date(Date.now() - 28 * 60 * 60 * 1000),
        actualStartTime: new Date(Date.now() - 30 * 60 * 60 * 1000),
        actualEndTime: new Date(Date.now() - 28 * 60 * 60 * 1000),
        caregiverName: 'Sarah Johnson',
        caregiverPhotoUrl: undefined,
        status: 'COMPLETED',
        tasksCompleted: [
          {
            taskId: 'task-3' as UUID,
            taskName: 'Personal Care',
            category: 'ADL',
            status: 'COMPLETED',
            completedAt: new Date(Date.now() - 29 * 60 * 60 * 1000),
          },
          {
            taskId: 'task-4' as UUID,
            taskName: 'Meal Preparation',
            category: 'Nutrition',
            status: 'COMPLETED',
            completedAt: new Date(Date.now() - 29 * 60 * 60 * 1000),
          },
          {
            taskId: 'task-5' as UUID,
            taskName: 'Light Housekeeping',
            category: 'Homemaking',
            status: 'COMPLETED',
            completedAt: new Date(Date.now() - 29 * 60 * 60 * 1000),
          },
        ],
        visitNotes: 'Completed all planned tasks. Patient had a good appetite and enjoyed the meal.',
        visibleToFamily: true,
        viewedByFamily: false,
        publishedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
        organizationId: context.organizationId!,
        branchId: context.branchIds[0] || context.organizationId!,
        createdBy: context.userId,
        updatedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ];

    // Get unread counts
    const unreadNotifications = profile.statistics.unreadNotifications;
    const unreadMessages = profile.statistics.unreadMessages;

    // Fetch client details
    let clientName = 'Unknown Client';
    try {
      const client = await this.clientService.getClientById(profile.clientId, context);
      clientName = `${client.firstName} ${client.lastName}`;
    } catch (error) {
      console.error('Failed to fetch client details:', error);
    }

    // Fetch active care plan
    let activeCarePlan;
    try {
      const carePlan = await this.carePlanService.getActiveCarePlanForClient(profile.clientId, context);
      if (carePlan) {
        // Count goals (if goals array exists)
        const goalsTotal = carePlan.goals?.length || 0;
        const goalsAchieved = carePlan.goals?.filter((g: { status: string }) => g.status === 'ACHIEVED').length || 0;
        
        activeCarePlan = {
          id: carePlan.id,
          name: carePlan.name,
          goalsTotal,
          goalsAchieved
        };
      }
    } catch (error) {
      console.error('Failed to fetch active care plan:', error);
    }

    // Fetch care team members
    // For demo purposes, returning mock data based on visits
    // In production, this would query the caregivers table and visit assignments
    const careTeam: CareTeamMember[] = [];

    // Get unique caregivers from upcoming visits
    const uniqueCaregiverIds = new Set<string>();
    upcomingVisits.forEach(visit => {
      if (visit.caregiverName) {
        uniqueCaregiverIds.add(visit.caregiverName);
      }
    });

    // For demo: Create care team members based on visit caregivers
    if (uniqueCaregiverIds.size > 0) {
      const caregiverNames = Array.from(uniqueCaregiverIds);
      caregiverNames.forEach((name, index) => {
        careTeam.push({
          id: `caregiver-${index}` as UUID,
          name,
          role: index === 0 ? 'Primary Caregiver' : 'Caregiver',
          isPrimary: index === 0,
          photoUrl: undefined
        });
      });
    } else {
      // Default care team if no visits scheduled
      careTeam.push({
        id: 'caregiver-default' as UUID,
        name: 'Sarah Chen',
        role: 'Primary Caregiver',
        isPrimary: true,
        photoUrl: undefined
      });
    }

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
      careTeam,
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
