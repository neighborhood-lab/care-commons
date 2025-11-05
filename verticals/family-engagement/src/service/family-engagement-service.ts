/**
 * Family Engagement Service - Main service layer
 *
 * Handles family portal users, conversations, messages, and activity feeds.
 */

import { Database, PaginatedResult } from '@care-commons/core';
import { v4 as uuidv4 } from 'uuid';
import {
  FamilyPortalUser,
  Conversation,
  Message,
  CareActivityFeedItem,
  CreateFamilyPortalUserRequest,
  UpdateFamilyPortalUserRequest,
  CreateConversationRequest,
  SendMessageRequest,
  CreateActivityFeedItemRequest,
} from '../types/family-portal.js';
import {
  FamilyPortalUserRepository,
  ConversationRepository,
  MessageRepository,
  CareActivityFeedRepository,
} from '../repository/family-portal-repository.js';

export class FamilyEngagementService {
  private familyUserRepo: FamilyPortalUserRepository;
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private activityRepo: CareActivityFeedRepository;

  constructor(private database: Database) {
    this.familyUserRepo = new FamilyPortalUserRepository(database);
    this.conversationRepo = new ConversationRepository(database);
    this.messageRepo = new MessageRepository(database);
    this.activityRepo = new CareActivityFeedRepository(database);
  }

  // ============================================================================
  // Family Portal User Management
  // ============================================================================

  /**
   * Create a new family portal user (invite)
   */
  async createFamilyUser(
    data: CreateFamilyPortalUserRequest,
    organizationId: string,
    createdBy: string
  ): Promise<FamilyPortalUser> {
    // Check if email already exists for this organization
    const existing = await this.familyUserRepo.findByEmail(data.email, organizationId);
    if (existing) {
      throw new Error('A family member with this email already exists');
    }

    // Generate invitation token
    const invitationToken = uuidv4();

    const familyUser = await this.familyUserRepo.create({
      organizationId,
      clientId: data.clientId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      relationship: data.relationship,
      isPrimaryContact: data.isPrimaryContact ?? false,
      isEmergencyContact: data.isEmergencyContact ?? false,
      hasLegalAuthority: data.hasLegalAuthority ?? false,
      status: 'INVITED',
      invitationToken,
      invitationSentAt: new Date(),
      permissions: data.permissions || {},
      notificationPreferences: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
      },
      canViewCareNotes: data.permissions?.canViewCareNotes ?? true,
      canViewSchedule: data.permissions?.canViewSchedule ?? true,
      canViewMedications: data.permissions?.canViewMedications ?? false,
      canViewBilling: data.permissions?.canViewBilling ?? false,
      canMessageCaregivers: data.permissions?.canMessageCaregivers ?? true,
      canRequestScheduleChanges: data.permissions?.canRequestScheduleChanges ?? false,
      createdBy,
      updatedBy: createdBy,
    }, createdBy);

    // TODO: Send invitation email with token

    return familyUser;
  }

  /**
   * Update family portal user
   */
  async updateFamilyUser(
    id: string,
    data: UpdateFamilyPortalUserRequest,
    updatedBy: string
  ): Promise<FamilyPortalUser> {
    const updates: Partial<FamilyPortalUser> = {
      updatedBy,
      ...data,
    };

    return await this.familyUserRepo.update(id, updates, updatedBy);
  }

  /**
   * Get family portal user by ID
   */
  async getFamilyUser(id: string): Promise<FamilyPortalUser | null> {
    return await this.familyUserRepo.findById(id);
  }

  /**
   * Get family members for a client
   */
  async getFamilyMembersByClient(clientId: string): Promise<FamilyPortalUser[]> {
    return await this.familyUserRepo.findByClientId(clientId);
  }

  /**
   * Accept family portal invitation
   */
  async acceptInvitation(token: string, password: string): Promise<FamilyPortalUser> {
    const familyUser = await this.familyUserRepo.findByInvitationToken(token);
    if (!familyUser) {
      throw new Error('Invalid invitation token');
    }

    if (familyUser.status !== 'INVITED') {
      throw new Error('Invitation has already been accepted or is no longer valid');
    }

    // TODO: Hash password properly (use bcrypt or similar)
    const passwordHash = password; // PLACEHOLDER - implement proper hashing

    return await this.familyUserRepo.update(familyUser.id, {
      passwordHash,
      status: 'ACTIVE',
      invitationAcceptedAt: new Date(),
      invitationToken: undefined, // Clear token after acceptance
      updatedBy: familyUser.id,
    }, familyUser.id);
  }

  /**
   * Deactivate family portal user
   */
  async deactivateFamilyUser(id: string, updatedBy: string): Promise<void> {
    await this.familyUserRepo.update(id, {
      status: 'INACTIVE',
      updatedBy,
    }, updatedBy);
  }

  // ============================================================================
  // Conversation Management
  // ============================================================================

  /**
   * Create a new conversation
   */
  async createConversation(
    data: CreateConversationRequest,
    organizationId: string,
    createdBy: string
  ): Promise<Conversation> {
    return await this.conversationRepo.create({
      organizationId,
      clientId: data.clientId,
      type: data.type,
      subject: data.subject,
      status: 'ACTIVE',
      familyMemberIds: data.familyMemberIds || [],
      caregiverIds: data.caregiverIds || [],
      coordinatorIds: data.coordinatorIds || [],
      isAiConversation: data.isAiConversation || false,
      messageCount: 0,
      unreadCount: 0,
      createdBy,
    }, createdBy);
  }

  /**
   * Get conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | null> {
    return await this.conversationRepo.findById(id);
  }

  /**
   * Get conversations for a family member
   */
  async getConversationsForFamilyMember(familyMemberId: string): Promise<Conversation[]> {
    return await this.conversationRepo.findByFamilyMemberId(familyMemberId);
  }

  /**
   * Get conversations for a client
   */
  async getConversationsForClient(clientId: string): Promise<Conversation[]> {
    return await this.conversationRepo.findByClientId(clientId);
  }

  /**
   * Add participant to conversation
   */
  async addParticipantToConversation(
    conversationId: string,
    participantId: string,
    participantType: 'family' | 'caregiver' | 'coordinator'
  ): Promise<void> {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const updates: Partial<Conversation> = {};

    if (participantType === 'family' && !conversation.familyMemberIds.includes(participantId)) {
      updates.familyMemberIds = [...conversation.familyMemberIds, participantId];
    } else if (participantType === 'caregiver' && !conversation.caregiverIds.includes(participantId)) {
      updates.caregiverIds = [...conversation.caregiverIds, participantId];
    } else if (participantType === 'coordinator' && !conversation.coordinatorIds.includes(participantId)) {
      updates.coordinatorIds = [...conversation.coordinatorIds, participantId];
    }

    if (Object.keys(updates).length > 0) {
      await this.conversationRepo.update(conversationId, updates, 'system');
    }
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    await this.conversationRepo.update(conversationId, {
      status: 'ARCHIVED',
    }, 'system');
  }

  // ============================================================================
  // Message Management
  // ============================================================================

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    data: SendMessageRequest,
    senderId: string,
    senderType: Message['senderType'],
    senderName: string,
    organizationId: string
  ): Promise<Message> {
    // Verify conversation exists
    const conversation = await this.conversationRepo.findById(data.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create message
    const message = await this.messageRepo.create({
      conversationId: data.conversationId,
      organizationId,
      senderType,
      senderId,
      senderName,
      content: data.content,
      contentType: data.contentType || 'TEXT',
      metadata: data.metadata,
      replyToMessageId: data.replyToMessageId,
      isAiGenerated: false,
      isRead: false,
      readBy: [senderId], // Sender has read their own message
      isFlagged: false,
      isHidden: false,
    }, senderId);

    // Update conversation
    await this.conversationRepo.incrementMessageCount(data.conversationId);

    // TODO: Create notifications for other participants

    return message;
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; beforeMessageId?: string }
  ): Promise<Message[]> {
    return await this.messageRepo.findByConversationId(conversationId, options);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    await this.messageRepo.markAsRead(messageIds, userId);
  }

  /**
   * Flag a message for review
   */
  async flagMessage(messageId: string, reason: string, userId: string): Promise<void> {
    await this.messageRepo.update(messageId, {
      isFlagged: true,
      flagReason: reason,
    }, userId);
  }

  // ============================================================================
  // Care Activity Feed
  // ============================================================================

  /**
   * Create an activity feed item
   */
  async createActivityFeedItem(
    data: CreateActivityFeedItemRequest,
    organizationId: string,
    createdBy: string
  ): Promise<CareActivityFeedItem> {
    return await this.activityRepo.create({
      organizationId,
      clientId: data.clientId,
      activityType: data.activityType,
      title: data.title,
      description: data.description,
      details: data.details,
      relatedVisitId: data.relatedVisitId,
      relatedCaregiverId: data.relatedCaregiverId,
      relatedCarePlanId: data.relatedCarePlanId,
      actorId: data.actorId,
      actorType: data.actorType,
      actorName: data.actorName,
      visibleToFamily: data.visibleToFamily ?? true,
      sensitivityLevel: data.sensitivityLevel || 'NORMAL',
      occurredAt: data.occurredAt,
      isRead: false,
      readByFamilyMembers: [],
      createdBy,
    }, createdBy);
  }

  /**
   * Get activity feed for a client
   */
  async getActivityFeed(
    clientId: string,
    options?: {
      visibleToFamily?: boolean;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResult<CareActivityFeedItem>> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.activityRepo.findByClientId(clientId, {
      visibleToFamily: options?.visibleToFamily,
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit,
      offset,
    });
  }

  /**
   * Mark activity as read by family member
   */
  async markActivityAsRead(activityId: string, familyMemberId: string): Promise<void> {
    await this.activityRepo.markAsReadByFamilyMember(activityId, familyMemberId);
  }

  /**
   * Get unread activity count for a client
   */
  async getUnreadActivityCount(clientId: string, familyMemberId: string): Promise<number> {
    const activities = await this.activityRepo.findByClientId(clientId, {
      visibleToFamily: true,
    });

    return activities.data.filter(
      (activity) => !activity.readByFamilyMembers.includes(familyMemberId)
    ).length;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get family portal dashboard data
   */
  async getDashboardData(familyMemberId: string, clientId: string): Promise<{
    user: FamilyPortalUser | null;
    conversations: Conversation[];
    recentActivity: PaginatedResult<CareActivityFeedItem>;
    unreadActivityCount: number;
    unreadMessageCount: number;
  }> {
    const user = await this.familyUserRepo.findById(familyMemberId);
    const conversations = await this.conversationRepo.findByFamilyMemberId(familyMemberId);
    const recentActivity = await this.activityRepo.findByClientId(clientId, {
      visibleToFamily: true,
      limit: 10,
    });
    const unreadActivityCount = await this.getUnreadActivityCount(clientId, familyMemberId);

    // Calculate unread message count
    const unreadMessageCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    return {
      user,
      conversations,
      recentActivity,
      unreadActivityCount,
      unreadMessageCount,
    };
  }
}
