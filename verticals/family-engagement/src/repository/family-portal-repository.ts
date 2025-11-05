/**
 * Family Portal Repository - data access layer for family engagement
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import {
  FamilyPortalUser,
  Conversation,
  Message,
  CareActivityFeedItem,
  ChatbotSession,
  FamilyNotification,
} from '../types/family-portal.js';

/**
 * Repository for Family Portal Users
 */
export class FamilyPortalUserRepository extends Repository<FamilyPortalUser> {
  constructor(database: Database) {
    super({
      tableName: 'family_portal_users',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): FamilyPortalUser {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      clientId: row['client_id'] as string,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      email: row['email'] as string,
      phone: row['phone'] ? JSON.parse(row['phone'] as string) : undefined,
      relationship: row['relationship'] as FamilyPortalUser['relationship'],
      isPrimaryContact: row['is_primary_contact'] as boolean,
      isEmergencyContact: row['is_emergency_contact'] as boolean,
      hasLegalAuthority: row['has_legal_authority'] as boolean,
      passwordHash: row['password_hash'] as string | undefined,
      status: row['status'] as FamilyPortalUser['status'],
      lastLoginAt: row['last_login_at'] as Date | undefined,
      invitationSentAt: row['invitation_sent_at'] as Date | undefined,
      invitationAcceptedAt: row['invitation_accepted_at'] as Date | undefined,
      invitationToken: row['invitation_token'] as string | undefined,
      permissions: JSON.parse((row['permissions'] as string) || '{}'),
      notificationPreferences: JSON.parse((row['notification_preferences'] as string) || '{}'),
      canViewCareNotes: row['can_view_care_notes'] as boolean,
      canViewSchedule: row['can_view_schedule'] as boolean,
      canViewMedications: row['can_view_medications'] as boolean,
      canViewBilling: row['can_view_billing'] as boolean,
      canMessageCaregivers: row['can_message_caregivers'] as boolean,
      canRequestScheduleChanges: row['can_request_schedule_changes'] as boolean,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      deletedAt: row['deleted_at'] as Date | undefined,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyPortalUser>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.clientId !== undefined) row['client_id'] = entity.clientId;
    if (entity.firstName !== undefined) row['first_name'] = entity.firstName;
    if (entity.lastName !== undefined) row['last_name'] = entity.lastName;
    if (entity.email !== undefined) row['email'] = entity.email;
    if (entity.phone !== undefined) row['phone'] = JSON.stringify(entity.phone);
    if (entity.relationship !== undefined) row['relationship'] = entity.relationship;
    if (entity.isPrimaryContact !== undefined) row['is_primary_contact'] = entity.isPrimaryContact;
    if (entity.isEmergencyContact !== undefined) row['is_emergency_contact'] = entity.isEmergencyContact;
    if (entity.hasLegalAuthority !== undefined) row['has_legal_authority'] = entity.hasLegalAuthority;
    if (entity.passwordHash !== undefined) row['password_hash'] = entity.passwordHash;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.lastLoginAt !== undefined) row['last_login_at'] = entity.lastLoginAt;
    if (entity.invitationSentAt !== undefined) row['invitation_sent_at'] = entity.invitationSentAt;
    if (entity.invitationAcceptedAt !== undefined) row['invitation_accepted_at'] = entity.invitationAcceptedAt;
    if (entity.invitationToken !== undefined) row['invitation_token'] = entity.invitationToken;
    if (entity.permissions !== undefined) row['permissions'] = JSON.stringify(entity.permissions);
    if (entity.notificationPreferences !== undefined) row['notification_preferences'] = JSON.stringify(entity.notificationPreferences);
    if (entity.canViewCareNotes !== undefined) row['can_view_care_notes'] = entity.canViewCareNotes;
    if (entity.canViewSchedule !== undefined) row['can_view_schedule'] = entity.canViewSchedule;
    if (entity.canViewMedications !== undefined) row['can_view_medications'] = entity.canViewMedications;
    if (entity.canViewBilling !== undefined) row['can_view_billing'] = entity.canViewBilling;
    if (entity.canMessageCaregivers !== undefined) row['can_message_caregivers'] = entity.canMessageCaregivers;
    if (entity.canRequestScheduleChanges !== undefined) row['can_request_schedule_changes'] = entity.canRequestScheduleChanges;

    return row;
  }

  /**
   * Find family members by client ID
   */
  async findByClientId(clientId: string): Promise<FamilyPortalUser[]> {
    const query = this.db.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where({ client_id: clientId, deleted_at: null });

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find family member by email
   */
  async findByEmail(email: string, organizationId: string): Promise<FamilyPortalUser | null> {
    const row = await this.db.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where({ email, organization_id: organizationId, deleted_at: null })
      .first();

    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Find family member by invitation token
   */
  async findByInvitationToken(token: string): Promise<FamilyPortalUser | null> {
    const row = await this.db.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where({ invitation_token: token, deleted_at: null })
      .first();

    return row ? this.mapRowToEntity(row) : null;
  }
}

/**
 * Repository for Conversations
 */
export class ConversationRepository extends Repository<Conversation> {
  constructor(database: Database) {
    super({
      tableName: 'conversations',
      database,
      enableAudit: false, // Has created_at/updated_at but not full audit
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): Conversation {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      clientId: row['client_id'] as string,
      type: row['type'] as Conversation['type'],
      subject: row['subject'] as string | undefined,
      status: row['status'] as Conversation['status'],
      familyMemberIds: (row['family_member_ids'] as string[]) || [],
      caregiverIds: (row['caregiver_ids'] as string[]) || [],
      coordinatorIds: (row['coordinator_ids'] as string[]) || [],
      isAiConversation: row['is_ai_conversation'] as boolean,
      aiConversationContext: row['ai_conversation_context'] as string | undefined,
      lastMessageAt: row['last_message_at'] as Date | undefined,
      messageCount: row['message_count'] as number,
      unreadCount: row['unread_count'] as number,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      deletedAt: row['deleted_at'] as Date | undefined,
    };
  }

  protected mapEntityToRow(entity: Partial<Conversation>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.clientId !== undefined) row['client_id'] = entity.clientId;
    if (entity.type !== undefined) row['type'] = entity.type;
    if (entity.subject !== undefined) row['subject'] = entity.subject;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.familyMemberIds !== undefined) row['family_member_ids'] = entity.familyMemberIds;
    if (entity.caregiverIds !== undefined) row['caregiver_ids'] = entity.caregiverIds;
    if (entity.coordinatorIds !== undefined) row['coordinator_ids'] = entity.coordinatorIds;
    if (entity.isAiConversation !== undefined) row['is_ai_conversation'] = entity.isAiConversation;
    if (entity.aiConversationContext !== undefined) row['ai_conversation_context'] = entity.aiConversationContext;
    if (entity.lastMessageAt !== undefined) row['last_message_at'] = entity.lastMessageAt;
    if (entity.messageCount !== undefined) row['message_count'] = entity.messageCount;
    if (entity.unreadCount !== undefined) row['unread_count'] = entity.unreadCount;

    return row;
  }

  /**
   * Find conversations for a family member
   */
  async findByFamilyMemberId(familyMemberId: string): Promise<Conversation[]> {
    const query = this.db.queryBuilder()
      .select('*')
      .from(this.tableName)
      .whereRaw('? = ANY(family_member_ids)', [familyMemberId])
      .andWhere({ deleted_at: null })
      .orderBy('last_message_at', 'desc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find conversations for a client
   */
  async findByClientId(clientId: string, options?: { includeAiOnly?: boolean }): Promise<Conversation[]> {
    const query = this.db.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where({ client_id: clientId, deleted_at: null });

    if (options?.includeAiOnly !== undefined) {
      query.andWhere({ is_ai_conversation: options.includeAiOnly });
    }

    query.orderBy('last_message_at', 'desc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Increment message count and update last message time
   */
  async incrementMessageCount(conversationId: string): Promise<void> {
    await this.db.queryBuilder()
      .update({
        message_count: this.db.raw('message_count + 1'),
        last_message_at: new Date(),
        updated_at: new Date(),
      })
      .from(this.tableName)
      .where({ id: conversationId });
  }
}

/**
 * Repository for Messages
 */
export class MessageRepository extends Repository<Message> {
  constructor(database: Database) {
    super({
      tableName: 'messages',
      database,
      enableAudit: false,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): Message {
    return {
      id: row['id'] as string,
      conversationId: row['conversation_id'] as string,
      organizationId: row['organization_id'] as string,
      senderType: row['sender_type'] as Message['senderType'],
      senderId: row['sender_id'] as string | undefined,
      senderName: row['sender_name'] as string,
      content: row['content'] as string,
      contentType: row['content_type'] as Message['contentType'],
      metadata: row['metadata'] ? JSON.parse(row['metadata'] as string) : undefined,
      isAiGenerated: row['is_ai_generated'] as boolean,
      aiPrompt: row['ai_prompt'] as string | undefined,
      aiContext: row['ai_context'] ? JSON.parse(row['ai_context'] as string) : undefined,
      aiTokenCount: row['ai_token_count'] as number | undefined,
      isRead: row['is_read'] as boolean,
      readAt: row['read_at'] as Date | undefined,
      readBy: (row['read_by'] as string[]) || [],
      replyToMessageId: row['reply_to_message_id'] as string | undefined,
      isFlagged: row['is_flagged'] as boolean,
      flagReason: row['flag_reason'] as string | undefined,
      isHidden: row['is_hidden'] as boolean,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
      deletedAt: row['deleted_at'] as Date | undefined,
    };
  }

  protected mapEntityToRow(entity: Partial<Message>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.conversationId !== undefined) row['conversation_id'] = entity.conversationId;
    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.senderType !== undefined) row['sender_type'] = entity.senderType;
    if (entity.senderId !== undefined) row['sender_id'] = entity.senderId;
    if (entity.senderName !== undefined) row['sender_name'] = entity.senderName;
    if (entity.content !== undefined) row['content'] = entity.content;
    if (entity.contentType !== undefined) row['content_type'] = entity.contentType;
    if (entity.metadata !== undefined) row['metadata'] = JSON.stringify(entity.metadata);
    if (entity.isAiGenerated !== undefined) row['is_ai_generated'] = entity.isAiGenerated;
    if (entity.aiPrompt !== undefined) row['ai_prompt'] = entity.aiPrompt;
    if (entity.aiContext !== undefined) row['ai_context'] = JSON.stringify(entity.aiContext);
    if (entity.aiTokenCount !== undefined) row['ai_token_count'] = entity.aiTokenCount;
    if (entity.isRead !== undefined) row['is_read'] = entity.isRead;
    if (entity.readAt !== undefined) row['read_at'] = entity.readAt;
    if (entity.readBy !== undefined) row['read_by'] = entity.readBy;
    if (entity.replyToMessageId !== undefined) row['reply_to_message_id'] = entity.replyToMessageId;
    if (entity.isFlagged !== undefined) row['is_flagged'] = entity.isFlagged;
    if (entity.flagReason !== undefined) row['flag_reason'] = entity.flagReason;
    if (entity.isHidden !== undefined) row['is_hidden'] = entity.isHidden;

    return row;
  }

  /**
   * Find messages in a conversation with pagination
   */
  async findByConversationId(
    conversationId: string,
    options?: { limit?: number; beforeMessageId?: string }
  ): Promise<Message[]> {
    const query = this.db.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where({ conversation_id: conversationId, deleted_at: null });

    if (options?.beforeMessageId) {
      const beforeMessage = await this.findById(options.beforeMessageId);
      if (beforeMessage) {
        query.andWhere('created_at', '<', beforeMessage.createdAt);
      }
    }

    query.orderBy('created_at', 'desc').limit(options?.limit || 50);

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row)).reverse(); // Reverse to show oldest first
  }

  /**
   * Mark messages as read by a user
   */
  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    await this.db.queryBuilder()
      .update({
        is_read: true,
        read_at: new Date(),
        read_by: this.db.raw('array_append(read_by, ?)', [userId]),
        updated_at: new Date(),
      })
      .from(this.tableName)
      .whereIn('id', messageIds)
      .andWhere('is_read', false);
  }
}

/**
 * Repository for Care Activity Feed
 */
export class CareActivityFeedRepository extends Repository<CareActivityFeedItem> {
  constructor(database: Database) {
    super({
      tableName: 'care_activity_feed',
      database,
      enableAudit: false,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): CareActivityFeedItem {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      clientId: row['client_id'] as string,
      activityType: row['activity_type'] as CareActivityFeedItem['activityType'],
      title: row['title'] as string,
      description: row['description'] as string | undefined,
      details: row['details'] ? JSON.parse(row['details'] as string) : undefined,
      relatedVisitId: row['related_visit_id'] as string | undefined,
      relatedCaregiverId: row['related_caregiver_id'] as string | undefined,
      relatedCarePlanId: row['related_care_plan_id'] as string | undefined,
      actorId: row['actor_id'] as string | undefined,
      actorType: row['actor_type'] as CareActivityFeedItem['actorType'],
      actorName: row['actor_name'] as string,
      visibleToFamily: row['visible_to_family'] as boolean,
      sensitivityLevel: row['sensitivity_level'] as CareActivityFeedItem['sensitivityLevel'],
      occurredAt: row['occurred_at'] as Date,
      isRead: row['is_read'] as boolean,
      readByFamilyMembers: (row['read_by_family_members'] as string[]) || [],
      firstReadAt: row['first_read_at'] as Date | undefined,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      deletedAt: row['deleted_at'] as Date | undefined,
    };
  }

  protected mapEntityToRow(entity: Partial<CareActivityFeedItem>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.clientId !== undefined) row['client_id'] = entity.clientId;
    if (entity.activityType !== undefined) row['activity_type'] = entity.activityType;
    if (entity.title !== undefined) row['title'] = entity.title;
    if (entity.description !== undefined) row['description'] = entity.description;
    if (entity.details !== undefined) row['details'] = JSON.stringify(entity.details);
    if (entity.relatedVisitId !== undefined) row['related_visit_id'] = entity.relatedVisitId;
    if (entity.relatedCaregiverId !== undefined) row['related_caregiver_id'] = entity.relatedCaregiverId;
    if (entity.relatedCarePlanId !== undefined) row['related_care_plan_id'] = entity.relatedCarePlanId;
    if (entity.actorId !== undefined) row['actor_id'] = entity.actorId;
    if (entity.actorType !== undefined) row['actor_type'] = entity.actorType;
    if (entity.actorName !== undefined) row['actor_name'] = entity.actorName;
    if (entity.visibleToFamily !== undefined) row['visible_to_family'] = entity.visibleToFamily;
    if (entity.sensitivityLevel !== undefined) row['sensitivity_level'] = entity.sensitivityLevel;
    if (entity.occurredAt !== undefined) row['occurred_at'] = entity.occurredAt;
    if (entity.isRead !== undefined) row['is_read'] = entity.isRead;
    if (entity.readByFamilyMembers !== undefined) row['read_by_family_members'] = entity.readByFamilyMembers;
    if (entity.firstReadAt !== undefined) row['first_read_at'] = entity.firstReadAt;

    return row;
  }

  /**
   * Find activity feed items for a client
   */
  async findByClientId(
    clientId: string,
    options?: {
      visibleToFamily?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginatedResult<CareActivityFeedItem>> {
    const query = this.db.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where({ client_id: clientId, deleted_at: null });

    if (options?.visibleToFamily !== undefined) {
      query.andWhere({ visible_to_family: options.visibleToFamily });
    }

    if (options?.startDate) {
      query.andWhere('occurred_at', '>=', options.startDate);
    }

    if (options?.endDate) {
      query.andWhere('occurred_at', '<=', options.endDate);
    }

    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');

    // Get paginated results
    query.orderBy('occurred_at', 'desc');

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    const rows = await query;
    const items = rows.map((row) => this.mapRowToEntity(row));

    return {
      data: items,
      total: Number(count),
      page: options?.offset ? Math.floor(options.offset / (options?.limit || 20)) + 1 : 1,
      pageSize: options?.limit || 20,
      totalPages: Math.ceil(Number(count) / (options?.limit || 20)),
    };
  }

  /**
   * Mark activity as read by a family member
   */
  async markAsReadByFamilyMember(activityId: string, familyMemberId: string): Promise<void> {
    const activity = await this.findById(activityId);
    if (!activity || activity.readByFamilyMembers.includes(familyMemberId)) {
      return;
    }

    await this.db.queryBuilder()
      .update({
        read_by_family_members: this.db.raw('array_append(read_by_family_members, ?)', [familyMemberId]),
        is_read: true,
        first_read_at: activity.firstReadAt || new Date(),
      })
      .from(this.tableName)
      .where({ id: activityId });
  }
}

/**
 * Repository for Chatbot Sessions
 */
export class ChatbotSessionRepository extends Repository<ChatbotSession> {
  constructor(database: Database) {
    super({
      tableName: 'chatbot_sessions',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): ChatbotSession {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      conversationId: row['conversation_id'] as string,
      familyMemberId: row['family_member_id'] as string,
      clientId: row['client_id'] as string,
      sessionType: row['session_type'] as string | undefined,
      startedAt: row['started_at'] as Date,
      endedAt: row['ended_at'] as Date | undefined,
      durationSeconds: row['duration_seconds'] as number | undefined,
      aiModel: row['ai_model'] as string,
      totalMessages: row['total_messages'] as number,
      totalTokens: row['total_tokens'] as number,
      estimatedCost: Number(row['estimated_cost']),
      initialContext: row['initial_context'] ? JSON.parse(row['initial_context'] as string) : undefined,
      topicsDiscussed: row['topics_discussed'] ? JSON.parse(row['topics_discussed'] as string) : undefined,
      wasHelpful: row['was_helpful'] as boolean | undefined,
      helpfulnessRating: row['helpfulness_rating'] as number | undefined,
      userFeedback: row['user_feedback'] as string | undefined,
      requiredHumanHandoff: row['required_human_handoff'] as boolean,
      handoffReason: row['handoff_reason'] as string | undefined,
      handedOffTo: row['handed_off_to'] as string | undefined,
      handoffAt: row['handoff_at'] as Date | undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  protected mapEntityToRow(entity: Partial<ChatbotSession>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.conversationId !== undefined) row['conversation_id'] = entity.conversationId;
    if (entity.familyMemberId !== undefined) row['family_member_id'] = entity.familyMemberId;
    if (entity.clientId !== undefined) row['client_id'] = entity.clientId;
    if (entity.sessionType !== undefined) row['session_type'] = entity.sessionType;
    if (entity.startedAt !== undefined) row['started_at'] = entity.startedAt;
    if (entity.endedAt !== undefined) row['ended_at'] = entity.endedAt;
    if (entity.durationSeconds !== undefined) row['duration_seconds'] = entity.durationSeconds;
    if (entity.aiModel !== undefined) row['ai_model'] = entity.aiModel;
    if (entity.totalMessages !== undefined) row['total_messages'] = entity.totalMessages;
    if (entity.totalTokens !== undefined) row['total_tokens'] = entity.totalTokens;
    if (entity.estimatedCost !== undefined) row['estimated_cost'] = entity.estimatedCost;
    if (entity.initialContext !== undefined) row['initial_context'] = JSON.stringify(entity.initialContext);
    if (entity.topicsDiscussed !== undefined) row['topics_discussed'] = JSON.stringify(entity.topicsDiscussed);
    if (entity.wasHelpful !== undefined) row['was_helpful'] = entity.wasHelpful;
    if (entity.helpfulnessRating !== undefined) row['helpfulness_rating'] = entity.helpfulnessRating;
    if (entity.userFeedback !== undefined) row['user_feedback'] = entity.userFeedback;
    if (entity.requiredHumanHandoff !== undefined) row['required_human_handoff'] = entity.requiredHumanHandoff;
    if (entity.handoffReason !== undefined) row['handoff_reason'] = entity.handoffReason;
    if (entity.handedOffTo !== undefined) row['handed_off_to'] = entity.handedOffTo;
    if (entity.handoffAt !== undefined) row['handoff_at'] = entity.handoffAt;

    return row;
  }

  /**
   * Update session metrics (messages, tokens, cost)
   */
  async updateMetrics(
    sessionId: string,
    metrics: { messageCount?: number; tokenCount?: number; cost?: number }
  ): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (metrics.messageCount) {
      updates.total_messages = this.db.raw('total_messages + ?', [metrics.messageCount]);
    }
    if (metrics.tokenCount) {
      updates.total_tokens = this.db.raw('total_tokens + ?', [metrics.tokenCount]);
    }
    if (metrics.cost) {
      updates.estimated_cost = this.db.raw('estimated_cost + ?', [metrics.cost]);
    }

    await this.db.queryBuilder()
      .update(updates)
      .from(this.tableName)
      .where({ id: sessionId });
  }
}
