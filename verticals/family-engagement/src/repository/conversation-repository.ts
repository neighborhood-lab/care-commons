/**
 * Conversation repository - data access layer for messaging
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import {
  Conversation,
  ConversationFilter,
  Message,
  MessageFilter,
  MessageDraft,
  TypingIndicator,
  UserPresence,
} from '../types/conversation.js';

export class ConversationRepository extends Repository<Conversation> {
  constructor(database: Database) {
    super({
      tableName: 'conversations',
      database,
      enableAudit: false,
      enableSoftDelete: true,
    });
  }

  /**
   * Map database row to Conversation entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Conversation {
    return {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      subject: row['subject'] as string | undefined,
      conversationType: row['conversation_type'] as any,
      participants: JSON.parse(row['participants'] as string),
      status: row['status'] as any,
      lastMessageAt: row['last_message_at'] as Date | undefined,
      lastMessagePreview: row['last_message_preview'] as string | undefined,
      lastMessageSenderId: row['last_message_sender_id'] as string | undefined,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      deletedAt: row['deleted_at'] as Date | undefined,
      isArchived: row['is_archived'] as boolean,
      isPinned: row['is_pinned'] as boolean,
      tags: row['tags'] ? JSON.parse(row['tags'] as string) : undefined,
    };
  }

  /**
   * Find conversations for a user (family member, coordinator, etc.)
   */
  async findByUser(
    userId: string,
    filter?: ConversationFilter
  ): Promise<Conversation[]> {
    let query = `
      SELECT * FROM conversations
      WHERE deleted_at IS NULL
        AND participants @> '[{"userId": "${userId}"}]'::jsonb
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filter?.clientId) {
      params.push(filter.clientId);
      query += ` AND client_id = $${paramIndex++}`;
    }

    if (filter?.conversationType) {
      params.push(filter.conversationType);
      query += ` AND conversation_type = $${paramIndex++}`;
    }

    if (filter?.status) {
      params.push(filter.status);
      query += ` AND status = $${paramIndex++}`;
    }

    if (filter?.unreadOnly) {
      // This would need to join with participant read status
      // Simplified for now
      query += ` AND last_message_at > (
        SELECT last_read_at FROM jsonb_array_elements(participants)
        WHERE value->>'userId' = '${userId}'
        LIMIT 1
      )`;
    }

    if (filter?.archivedOnly) {
      query += ` AND is_archived = true`;
    } else {
      query += ` AND is_archived = false`;
    }

    if (filter?.pinnedOnly) {
      query += ` AND is_pinned = true`;
    }

    query += ` ORDER BY is_pinned DESC, last_message_at DESC NULLS LAST`;

    const rows = await this.database.query<Record<string, unknown>>(query, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find conversations by client
   */
  async findByClient(clientId: string): Promise<Conversation[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM conversations
       WHERE client_id = $1 AND deleted_at IS NULL
       ORDER BY last_message_at DESC NULLS LAST`,
      [clientId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find direct conversation between two users
   */
  async findDirectConversation(
    userId1: string,
    userId2: string,
    clientId: string
  ): Promise<Conversation | null> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM conversations
       WHERE client_id = $1
         AND conversation_type = 'DIRECT'
         AND participants @> '[{"userId": "${userId1}"}]'::jsonb
         AND participants @> '[{"userId": "${userId2}"}]'::jsonb
         AND deleted_at IS NULL
       LIMIT 1`,
      [clientId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  /**
   * Update last message info
   */
  async updateLastMessage(
    conversationId: string,
    messageId: string,
    senderId: string,
    preview: string
  ): Promise<void> {
    await this.database.query(
      `UPDATE conversations
       SET last_message_at = NOW(),
           last_message_sender_id = $2,
           last_message_preview = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [conversationId, senderId, preview]
    );
  }

  /**
   * Update participant read status
   */
  async updateParticipantReadStatus(
    conversationId: string,
    userId: string,
    messageId: string
  ): Promise<void> {
    await this.database.query(
      `UPDATE conversations
       SET participants = jsonb_set(
         participants,
         '{0,lastReadMessageId}',
         to_jsonb($2::text)
       )
       WHERE id = $1
         AND participants @> '[{"userId": "${userId}"}]'::jsonb`,
      [conversationId, messageId]
    );
  }

  /**
   * Archive conversation
   */
  async archive(conversationId: string): Promise<void> {
    await this.database.query(
      `UPDATE conversations SET is_archived = true, updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );
  }

  /**
   * Unarchive conversation
   */
  async unarchive(conversationId: string): Promise<void> {
    await this.database.query(
      `UPDATE conversations SET is_archived = false, updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );
  }

  /**
   * Pin conversation
   */
  async pin(conversationId: string): Promise<void> {
    await this.database.query(
      `UPDATE conversations SET is_pinned = true, updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );
  }

  /**
   * Unpin conversation
   */
  async unpin(conversationId: string): Promise<void> {
    await this.database.query(
      `UPDATE conversations SET is_pinned = false, updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );
  }
}

export class MessageRepository extends Repository<Message> {
  constructor(database: Database) {
    super({
      tableName: 'messages',
      database,
      enableAudit: false,
      enableSoftDelete: true,
    });
  }

  /**
   * Map database row to Message entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Message {
    return {
      id: row['id'] as string,
      conversationId: row['conversation_id'] as string,
      clientId: row['client_id'] as string,
      senderId: row['sender_id'] as string,
      senderType: row['sender_type'] as any,
      content: row['content'] as string,
      contentType: row['content_type'] as any,
      attachments: row['attachments'] ? JSON.parse(row['attachments'] as string) : undefined,
      mentions: row['mentions'] ? JSON.parse(row['mentions'] as string) : undefined,
      replyToMessageId: row['reply_to_message_id'] as string | undefined,
      threadId: row['thread_id'] as string | undefined,
      sentAt: row['sent_at'] as Date,
      deliveredAt: row['delivered_at'] as Date | undefined,
      deliveryStatus: row['delivery_status'] as any,
      readBy: JSON.parse(row['read_by'] as string),
      reactions: row['reactions'] ? JSON.parse(row['reactions'] as string) : undefined,
      editedAt: row['edited_at'] as Date | undefined,
      editHistory: row['edit_history'] ? JSON.parse(row['edit_history'] as string) : undefined,
      isSystemMessage: row['is_system_message'] as boolean,
      systemMessageType: row['system_message_type'] as any | undefined,
      containsPHI: row['contains_phi'] as boolean,
      encryptionStatus: row['encryption_status'] as any | undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
      deletedAt: row['deleted_at'] as Date | undefined,
    };
  }

  /**
   * Find messages by conversation
   */
  async findByConversation(
    conversationId: string,
    filter?: MessageFilter
  ): Promise<Message[]> {
    let query = `SELECT * FROM messages WHERE conversation_id = $1 AND deleted_at IS NULL`;
    const params: any[] = [conversationId];
    let paramIndex = 2;

    if (filter?.senderId) {
      params.push(filter.senderId);
      query += ` AND sender_id = $${paramIndex++}`;
    }

    if (filter?.senderType) {
      params.push(filter.senderType);
      query += ` AND sender_type = $${paramIndex++}`;
    }

    if (filter?.contentType) {
      params.push(filter.contentType);
      query += ` AND content_type = $${paramIndex++}`;
    }

    if (filter?.containsPHI !== undefined) {
      params.push(filter.containsPHI);
      query += ` AND contains_phi = $${paramIndex++}`;
    }

    if (filter?.hasAttachments) {
      query += ` AND attachments IS NOT NULL`;
    }

    if (filter?.dateFrom) {
      params.push(filter.dateFrom);
      query += ` AND sent_at >= $${paramIndex++}`;
    }

    if (filter?.dateTo) {
      params.push(filter.dateTo);
      query += ` AND sent_at <= $${paramIndex++}`;
    }

    query += ` ORDER BY sent_at ASC`;

    if (filter?.limit) {
      params.push(filter.limit);
      query += ` LIMIT $${paramIndex++}`;
    }

    if (filter?.offset) {
      params.push(filter.offset);
      query += ` OFFSET $${paramIndex++}`;
    }

    const rows = await this.database.query<Record<string, unknown>>(query, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string): Promise<void> {
    await this.database.query(
      `UPDATE messages
       SET delivery_status = 'DELIVERED',
           delivered_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [messageId]
    );
  }

  /**
   * Add read receipt
   */
  async addReadReceipt(
    messageId: string,
    userId: string,
    userType: string
  ): Promise<void> {
    await this.database.query(
      `UPDATE messages
       SET read_by = read_by || jsonb_build_object(
         'userId', $2,
         'userType', $3,
         'readAt', NOW()
       )::jsonb,
       updated_at = NOW()
       WHERE id = $1`,
      [messageId, userId, userType]
    );
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    messageId: string,
    emoji: string,
    userId: string,
    userType: string
  ): Promise<void> {
    await this.database.query(
      `UPDATE messages
       SET reactions = COALESCE(reactions, '[]'::jsonb) || jsonb_build_object(
         'emoji', $2,
         'userId', $3,
         'userType', $4,
         'reactedAt', NOW()
       )::jsonb,
       updated_at = NOW()
       WHERE id = $1`,
      [messageId, emoji, userId, userType]
    );
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    await this.database.query(
      `UPDATE messages
       SET reactions = (
         SELECT jsonb_agg(reaction)
         FROM jsonb_array_elements(reactions) AS reaction
         WHERE reaction->>'userId' != $2 OR reaction->>'emoji' != $3
       ),
       updated_at = NOW()
       WHERE id = $1`,
      [messageId, userId, emoji]
    );
  }

  /**
   * Search messages by content
   */
  async searchByContent(
    clientId: string,
    searchQuery: string,
    limit = 50
  ): Promise<Message[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM messages
       WHERE client_id = $1
         AND deleted_at IS NULL
         AND to_tsvector('english', content) @@ plainto_tsquery('english', $2)
       ORDER BY sent_at DESC
       LIMIT $3`,
      [clientId, searchQuery, limit]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get unread message count for user in conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const rows = await this.database.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM messages m
       WHERE m.conversation_id = $1
         AND m.sender_id != $2
         AND m.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM jsonb_array_elements(m.read_by) AS rb
           WHERE rb->>'userId' = $2
         )`,
      [conversationId, userId]
    );
    return parseInt(rows[0].count, 10);
  }
}

export class MessageDraftRepository extends Repository<MessageDraft> {
  constructor(database: Database) {
    super({
      tableName: 'message_drafts',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to MessageDraft entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): MessageDraft {
    return {
      id: row['id'] as string,
      conversationId: row['conversation_id'] as string,
      userId: row['user_id'] as string,
      content: row['content'] as string,
      attachments: row['attachments'] ? JSON.parse(row['attachments'] as string) : undefined,
      replyToMessageId: row['reply_to_message_id'] as string | undefined,
      savedAt: row['saved_at'] as Date,
      expiresAt: row['expires_at'] as Date,
    };
  }

  /**
   * Find draft by conversation and user
   */
  async findByConversationAndUser(
    conversationId: string,
    userId: string
  ): Promise<MessageDraft | null> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM message_drafts
       WHERE conversation_id = $1 AND user_id = $2 AND expires_at > NOW()`,
      [conversationId, userId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  /**
   * Save or update draft
   */
  async saveOrUpdate(draft: Partial<MessageDraft> & { conversationId: string; userId: string }): Promise<MessageDraft> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const rows = await this.database.query<Record<string, unknown>>(
      `INSERT INTO message_drafts (conversation_id, user_id, content, attachments, reply_to_message_id, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (conversation_id, user_id)
       DO UPDATE SET
         content = EXCLUDED.content,
         attachments = EXCLUDED.attachments,
         reply_to_message_id = EXCLUDED.reply_to_message_id,
         saved_at = NOW(),
         expires_at = EXCLUDED.expires_at
       RETURNING *`,
      [
        draft.conversationId,
        draft.userId,
        draft.content || '',
        draft.attachments ? JSON.stringify(draft.attachments) : null,
        draft.replyToMessageId || null,
        expiresAt,
      ]
    );
    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Delete draft
   */
  async deleteDraft(conversationId: string, userId: string): Promise<void> {
    await this.database.query(
      `DELETE FROM message_drafts WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }

  /**
   * Clean expired drafts
   */
  async cleanExpired(): Promise<number> {
    const result = await this.database.query(
      `DELETE FROM message_drafts WHERE expires_at < NOW()`
    );
    return result.length;
  }
}
