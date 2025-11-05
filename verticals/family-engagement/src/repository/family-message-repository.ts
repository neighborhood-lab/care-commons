/**
 * Family Message Repository - data access layer for family messaging
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import {
  FamilyMessage,
  FamilyMessageFilters,
  MessageSenderType,
  MessageType,
  MessageStatus,
  MessageCategory,
  Conversation,
} from '../types/index.js';

export class FamilyMessageRepository extends Repository<FamilyMessage> {
  constructor(database: Database) {
    super({
      tableName: 'family_messages',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to FamilyMessage entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyMessage {
    return {
      id: row['id'] as string,
      conversation_id: row['conversation_id'] as string,
      client_id: row['client_id'] as string,
      organization_id: row['organization_id'] as string,

      // Sender & recipient
      sender_id: row['sender_id'] as string,
      sender_type: row['sender_type'] as MessageSenderType,
      sender_name: row['sender_name'] as string,

      recipient_id: row['recipient_id'] as string | undefined,
      recipient_type: row['recipient_type'] as string | undefined,

      // Message content
      message_body: row['message_body'] as string,
      message_type: row['message_type'] as MessageType,
      attachments: row['attachments'] ? JSON.parse(row['attachments'] as string) : undefined,
      attachment_count: row['attachment_count'] as number,

      // Status
      status: row['status'] as MessageStatus,
      sent_at: row['sent_at'] as Date,
      delivered_at: row['delivered_at'] as Date | undefined,
      read_at: row['read_at'] as Date | undefined,
      is_read: row['is_read'] as boolean,

      // Threading
      parent_message_id: row['parent_message_id'] as string | undefined,
      thread_depth: row['thread_depth'] as number,

      // Flags & categories
      is_urgent: row['is_urgent'] as boolean,
      is_flagged: row['is_flagged'] as boolean,
      is_archived: row['is_archived'] as boolean,
      category: row['category'] as MessageCategory | undefined,
      tags: row['tags'] ? JSON.parse(row['tags'] as string) : undefined,

      // Moderation
      is_deleted: row['is_deleted'] as boolean,
      deleted_at: row['deleted_at'] as Date | undefined,
      deleted_by: row['deleted_by'] as string | undefined,
      deletion_reason: row['deletion_reason'] as string | undefined,

      // Standard fields
      created_at: row['created_at'] as Date,
      created_by: row['created_by'] as string,
      updated_at: row['updated_at'] as Date,
      updated_by: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Find messages in a conversation
   */
  async findByConversationId(
    conversationId: string,
    includeDeleted = false
  ): Promise<FamilyMessage[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({ conversation_id: conversationId });

    if (!includeDeleted) {
      query.where({ is_deleted: false });
    }

    query.orderBy('created_at', 'asc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find messages for a client
   */
  async findByClientId(clientId: string, includeDeleted = false): Promise<FamilyMessage[]> {
    const query = this.database.getKnex()(this.tableName).where({ client_id: clientId });

    if (!includeDeleted) {
      query.where({ is_deleted: false });
    }

    query.orderBy('created_at', 'desc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find unread messages for a recipient
   */
  async findUnreadForRecipient(
    recipientId: string,
    recipientType: string
  ): Promise<FamilyMessage[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({
        recipient_id: recipientId,
        is_read: false,
        is_deleted: false,
        status: 'SENT',
      })
      .orderBy('created_at', 'desc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find urgent messages for an organization
   */
  async findUrgent(organizationId: string): Promise<FamilyMessage[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({
        organization_id: organizationId,
        is_urgent: true,
        is_deleted: false,
      })
      .orderBy('created_at', 'desc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Get conversations for a client with last message and unread count
   */
  async getConversations(clientId: string): Promise<Conversation[]> {
    const knex = this.database.getKnex();

    // Get unique conversations with their last messages
    const conversationsQuery = knex(this.tableName)
      .select(
        'conversation_id',
        'client_id',
        knex.raw('MAX(created_at) as last_message_time')
      )
      .where({ client_id: clientId, is_deleted: false })
      .groupBy('conversation_id', 'client_id')
      .orderBy('last_message_time', 'desc');

    const conversationRows = await conversationsQuery;

    const conversations: Conversation[] = [];

    for (const convRow of conversationRows) {
      const conversationId = convRow['conversation_id'] as string;

      // Get last message
      const lastMessageQuery = knex(this.tableName)
        .where({ conversation_id: conversationId, is_deleted: false })
        .orderBy('created_at', 'desc')
        .first();

      const lastMessageRow = await lastMessageQuery;

      if (!lastMessageRow) continue;

      const lastMessage = this.mapRowToEntity(lastMessageRow);

      // Count unread messages
      const unreadCountQuery = knex(this.tableName)
        .where({ conversation_id: conversationId, is_read: false, is_deleted: false })
        .count('* as count')
        .first();

      const unreadCountRow = await unreadCountQuery;
      const unreadCount = Number(unreadCountRow?.['count'] ?? 0);

      // Count participants (distinct senders)
      const participantCountQuery = knex(this.tableName)
        .where({ conversation_id: conversationId, is_deleted: false })
        .countDistinct('sender_id as count')
        .first();

      const participantCountRow = await participantCountQuery;
      const participantCount = Number(participantCountRow?.['count'] ?? 0);

      // Get client name (would need to join with clients table in real implementation)
      const clientName = 'Client'; // Placeholder

      conversations.push({
        conversation_id: conversationId,
        client_id: clientId,
        client_name: clientName,
        last_message: lastMessage,
        unread_count: unreadCount,
        participant_count: participantCount,
        created_at: lastMessage.created_at,
        updated_at: lastMessage.updated_at,
      });
    }

    return conversations;
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    const knex = this.database.getKnex();

    await knex(this.tableName)
      .where({ id: messageId })
      .update({
        is_read: true,
        read_at: knex.fn.now(),
        updated_by: userId,
        updated_at: knex.fn.now(),
      });
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const knex = this.database.getKnex();

    await knex(this.tableName)
      .where({ conversation_id: conversationId, is_read: false })
      .update({
        is_read: true,
        read_at: knex.fn.now(),
        updated_by: userId,
        updated_at: knex.fn.now(),
      });
  }

  /**
   * Soft delete a message
   */
  async softDelete(messageId: string, userId: string, reason?: string): Promise<void> {
    const knex = this.database.getKnex();

    await knex(this.tableName)
      .where({ id: messageId })
      .update({
        is_deleted: true,
        deleted_at: knex.fn.now(),
        deleted_by: userId,
        deletion_reason: reason,
        updated_by: userId,
        updated_at: knex.fn.now(),
      });
  }

  /**
   * Search messages with filters
   */
  async search(
    filters: FamilyMessageFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<FamilyMessage>> {
    const query = this.database.getKnex()(this.tableName);

    // Apply filters
    if (filters.conversation_id) {
      query.where({ conversation_id: filters.conversation_id });
    }

    if (filters.client_id) {
      query.where({ client_id: filters.client_id });
    }

    if (filters.organization_id) {
      query.where({ organization_id: filters.organization_id });
    }

    if (filters.sender_id) {
      query.where({ sender_id: filters.sender_id });
    }

    if (filters.sender_type) {
      query.where({ sender_type: filters.sender_type });
    }

    if (filters.recipient_id) {
      query.where({ recipient_id: filters.recipient_id });
    }

    if (filters.is_read !== undefined) {
      query.where({ is_read: filters.is_read });
    }

    if (filters.is_urgent !== undefined) {
      query.where({ is_urgent: filters.is_urgent });
    }

    if (filters.is_deleted !== undefined) {
      query.where({ is_deleted: filters.is_deleted });
    } else {
      // By default, exclude deleted messages
      query.where({ is_deleted: false });
    }

    if (filters.category) {
      query.where({ category: filters.category });
    }

    if (filters.date_from) {
      query.where('created_at', '>=', filters.date_from);
    }

    if (filters.date_to) {
      query.where('created_at', '<=', filters.date_to);
    }

    // Count total
    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = Number(countResult?.['count'] ?? 0);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query.limit(pageSize).offset(offset);
    query.orderBy('created_at', 'desc');

    const rows = await query;
    const items = rows.map((row) => this.mapRowToEntity(row));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get message statistics for a client
   */
  async getStatsForClient(clientId: string): Promise<{
    total_messages: number;
    total_conversations: number;
    unread_messages: number;
    urgent_messages: number;
    messages_today: number;
  }> {
    const knex = this.database.getKnex();

    // Total messages
    const totalResult = await knex(this.tableName)
      .where({ client_id: clientId, is_deleted: false })
      .count('* as count')
      .first();

    const total_messages = Number(totalResult?.['count'] ?? 0);

    // Total conversations
    const conversationsResult = await knex(this.tableName)
      .where({ client_id: clientId, is_deleted: false })
      .countDistinct('conversation_id as count')
      .first();

    const total_conversations = Number(conversationsResult?.['count'] ?? 0);

    // Unread messages
    const unreadResult = await knex(this.tableName)
      .where({ client_id: clientId, is_read: false, is_deleted: false })
      .count('* as count')
      .first();

    const unread_messages = Number(unreadResult?.['count'] ?? 0);

    // Urgent messages
    const urgentResult = await knex(this.tableName)
      .where({ client_id: clientId, is_urgent: true, is_deleted: false })
      .count('* as count')
      .first();

    const urgent_messages = Number(urgentResult?.['count'] ?? 0);

    // Messages today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayResult = await knex(this.tableName)
      .where({ client_id: clientId, is_deleted: false })
      .where('created_at', '>=', todayStart)
      .count('* as count')
      .first();

    const messages_today = Number(todayResult?.['count'] ?? 0);

    return {
      total_messages,
      total_conversations,
      unread_messages,
      urgent_messages,
      messages_today,
    };
  }
}
