/**
 * Message repository - data access layer for messages and threads
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import type {
  Message,
  MessageThread,
  MessageStatus,
  MessageType,
  ThreadParticipant,
  ReadReceipt,
  MessageReaction,
  MessageAttachment,
} from '../types/communication.js';

/**
 * Repository for message threads
 */
export class MessageThreadRepository extends Repository<MessageThread> {
  constructor(database: Database) {
    super({
      tableName: 'message_threads',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): MessageThread {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      branchId: row['branch_id'] as string | undefined,
      threadType: row['thread_type'] as MessageType,
      subject: row['subject'] as string | undefined,
      description: row['description'] as string | undefined,
      participantIds: JSON.parse(row['participant_ids'] as string),
      participants: JSON.parse(row['participants'] as string),
      ownerId: row['owner_id'] as string,
      assignedToId: row['assigned_to_id'] as string | undefined,
      status: row['status'] as 'ACTIVE' | 'ARCHIVED' | 'LOCKED' | 'DELETED',
      isLocked: row['is_locked'] as boolean,
      lockedAt: row['locked_at'] as Date | null | undefined,
      lockedBy: row['locked_by'] as string | undefined,
      lockedReason: row['locked_reason'] as string | undefined,
      lastMessageAt: row['last_message_at'] as Date | null | undefined,
      lastMessagePreview: row['last_message_preview'] as string | undefined,
      messageCount: row['message_count'] as number,
      relatedEntityType: row['related_entity_type'] as 'CLIENT' | 'VISIT' | 'CARE_PLAN' | 'INCIDENT' | undefined,
      relatedEntityId: row['related_entity_id'] as string | undefined,
      tags: JSON.parse((row['tags'] as string) || '[]'),
      category: row['category'] as string | undefined,
      allowAttachments: row['allow_attachments'] as boolean,
      maxParticipants: row['max_participants'] as number | undefined,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
    };
  }

  protected mapEntityToRow(entity: Partial<MessageThread>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.branchId !== undefined) row['branch_id'] = entity.branchId;
    if (entity.threadType !== undefined) row['thread_type'] = entity.threadType;
    if (entity.subject !== undefined) row['subject'] = entity.subject;
    if (entity.description !== undefined) row['description'] = entity.description;
    if (entity.participantIds !== undefined) row['participant_ids'] = JSON.stringify(entity.participantIds);
    if (entity.participants !== undefined) row['participants'] = JSON.stringify(entity.participants);
    if (entity.ownerId !== undefined) row['owner_id'] = entity.ownerId;
    if (entity.assignedToId !== undefined) row['assigned_to_id'] = entity.assignedToId;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.isLocked !== undefined) row['is_locked'] = entity.isLocked;
    if (entity.lockedAt !== undefined) row['locked_at'] = entity.lockedAt;
    if (entity.lockedBy !== undefined) row['locked_by'] = entity.lockedBy;
    if (entity.lockedReason !== undefined) row['locked_reason'] = entity.lockedReason;
    if (entity.lastMessageAt !== undefined) row['last_message_at'] = entity.lastMessageAt;
    if (entity.lastMessagePreview !== undefined) row['last_message_preview'] = entity.lastMessagePreview;
    if (entity.messageCount !== undefined) row['message_count'] = entity.messageCount;
    if (entity.relatedEntityType !== undefined) row['related_entity_type'] = entity.relatedEntityType;
    if (entity.relatedEntityId !== undefined) row['related_entity_id'] = entity.relatedEntityId;
    if (entity.tags !== undefined) row['tags'] = JSON.stringify(entity.tags);
    if (entity.category !== undefined) row['category'] = entity.category;
    if (entity.allowAttachments !== undefined) row['allow_attachments'] = entity.allowAttachments;
    if (entity.maxParticipants !== undefined) row['max_participants'] = entity.maxParticipants;

    return row;
  }

  /**
   * Find threads for a specific user
   */
  async findByUserId(userId: string, status?: string): Promise<MessageThread[]> {
    const statusFilter = status ? "AND status = $2" : '';
    const params = status ? [userId, status] : [userId];

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE $1 = ANY(participant_ids)
        AND deleted_at IS NULL
        ${statusFilter}
      ORDER BY last_message_at DESC NULLS LAST, created_at DESC
    `;

    const result = await this.database.query(query, params);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find threads by related entity
   */
  async findByRelatedEntity(entityType: string, entityId: string): Promise<MessageThread[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE related_entity_type = $1
        AND related_entity_id = $2
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await this.database.query(query, [entityType, entityId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Update thread message count and last message
   */
  async updateMessageMetadata(
    threadId: string,
    lastMessageAt: Date,
    lastMessagePreview: string,
    incrementCount: boolean = true
  ): Promise<void> {
    const incrementClause = incrementCount ? ', message_count = message_count + 1' : '';
    const query = `
      UPDATE ${this.tableName}
      SET last_message_at = $2,
          last_message_preview = $3,
          updated_at = NOW()
          ${incrementClause}
      WHERE id = $1
    `;

    await this.database.query(query, [threadId, lastMessageAt, lastMessagePreview]);
  }
}

/**
 * Repository for individual messages
 */
export class MessageRepository extends Repository<Message> {
  constructor(database: Database) {
    super({
      tableName: 'messages',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): Message {
    return {
      id: row['id'] as string,
      threadId: row['thread_id'] as string,
      organizationId: row['organization_id'] as string,
      senderId: row['sender_id'] as string,
      senderType: row['sender_type'] as any,
      senderName: row['sender_name'] as string,
      senderAvatarUrl: row['sender_avatar_url'] as string | undefined,
      content: row['content'] as string,
      contentFormat: row['content_format'] as 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML',
      truncatedContent: row['truncated_content'] as string | undefined,
      attachments: JSON.parse((row['attachments'] as string) || '[]'),
      messageType: row['message_type'] as MessageType,
      priority: row['priority'] as any,
      status: row['status'] as MessageStatus,
      sentAt: row['sent_at'] as Date | null | undefined,
      deliveredAt: row['delivered_at'] as Date | null | undefined,
      failedAt: row['failed_at'] as Date | null | undefined,
      failureReason: row['failure_reason'] as string | undefined,
      readBy: JSON.parse((row['read_by'] as string) || '[]'),
      readCount: row['read_count'] as number,
      replyToMessageId: row['reply_to_message_id'] as string | undefined,
      forwardedFromMessageId: row['forwarded_from_message_id'] as string | undefined,
      channels: JSON.parse(row['channels'] as string),
      primaryChannel: row['primary_channel'] as any,
      isEdited: row['is_edited'] as boolean,
      editedAt: row['edited_at'] as Date | null | undefined,
      isInternal: row['is_internal'] as boolean,
      isFlagged: row['is_flagged'] as boolean,
      flaggedReason: row['flagged_reason'] as string | undefined,
      flaggedBy: row['flagged_by'] as string | undefined,
      mentionedUserIds: JSON.parse((row['mentioned_user_ids'] as string) || '[]'),
      reactions: JSON.parse((row['reactions'] as string) || '[]'),
      scheduledSendAt: row['scheduled_send_at'] as Date | null | undefined,
      metadata: JSON.parse((row['metadata'] as string) || '{}'),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
    };
  }

  protected mapEntityToRow(entity: Partial<Message>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.threadId !== undefined) row['thread_id'] = entity.threadId;
    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.senderId !== undefined) row['sender_id'] = entity.senderId;
    if (entity.senderType !== undefined) row['sender_type'] = entity.senderType;
    if (entity.senderName !== undefined) row['sender_name'] = entity.senderName;
    if (entity.senderAvatarUrl !== undefined) row['sender_avatar_url'] = entity.senderAvatarUrl;
    if (entity.content !== undefined) row['content'] = entity.content;
    if (entity.contentFormat !== undefined) row['content_format'] = entity.contentFormat;
    if (entity.truncatedContent !== undefined) row['truncated_content'] = entity.truncatedContent;
    if (entity.attachments !== undefined) row['attachments'] = JSON.stringify(entity.attachments);
    if (entity.messageType !== undefined) row['message_type'] = entity.messageType;
    if (entity.priority !== undefined) row['priority'] = entity.priority;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.sentAt !== undefined) row['sent_at'] = entity.sentAt;
    if (entity.deliveredAt !== undefined) row['delivered_at'] = entity.deliveredAt;
    if (entity.failedAt !== undefined) row['failed_at'] = entity.failedAt;
    if (entity.failureReason !== undefined) row['failure_reason'] = entity.failureReason;
    if (entity.readBy !== undefined) row['read_by'] = JSON.stringify(entity.readBy);
    if (entity.readCount !== undefined) row['read_count'] = entity.readCount;
    if (entity.replyToMessageId !== undefined) row['reply_to_message_id'] = entity.replyToMessageId;
    if (entity.forwardedFromMessageId !== undefined) row['forwarded_from_message_id'] = entity.forwardedFromMessageId;
    if (entity.channels !== undefined) row['channels'] = JSON.stringify(entity.channels);
    if (entity.primaryChannel !== undefined) row['primary_channel'] = entity.primaryChannel;
    if (entity.isEdited !== undefined) row['is_edited'] = entity.isEdited;
    if (entity.editedAt !== undefined) row['edited_at'] = entity.editedAt;
    if (entity.isInternal !== undefined) row['is_internal'] = entity.isInternal;
    if (entity.isFlagged !== undefined) row['is_flagged'] = entity.isFlagged;
    if (entity.flaggedReason !== undefined) row['flagged_reason'] = entity.flaggedReason;
    if (entity.flaggedBy !== undefined) row['flagged_by'] = entity.flaggedBy;
    if (entity.mentionedUserIds !== undefined) row['mentioned_user_ids'] = JSON.stringify(entity.mentionedUserIds);
    if (entity.reactions !== undefined) row['reactions'] = JSON.stringify(entity.reactions);
    if (entity.scheduledSendAt !== undefined) row['scheduled_send_at'] = entity.scheduledSendAt;
    if (entity.metadata !== undefined) row['metadata'] = JSON.stringify(entity.metadata);

    return row;
  }

  /**
   * Find messages in a thread
   */
  async findByThread(
    threadId: string,
    pagination?: { page: number; limit: number }
  ): Promise<PaginatedResult<Message> | Message[]> {
    if (!pagination) {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE thread_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at ASC
      `;
      const result = await this.database.query(query, [threadId]);
      return result.rows.map((row) => this.mapRowToEntity(row));
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) FROM ${this.tableName}
      WHERE thread_id = $1 AND deleted_at IS NULL
    `;
    const countResult = await this.database.query(countQuery, [threadId]);
    const countRow = countResult.rows[0];
    if (!countRow) {
      throw new Error('Count query returned no rows');
    }
    const total = parseInt(String(countRow['count']));

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE thread_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.database.query(query, [threadId, pagination.limit, offset]);
    const items = result.rows.map((row) => this.mapRowToEntity(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Find scheduled messages ready to send
   */
  async findScheduledReady(currentTime: Date): Promise<Message[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'QUEUED'
        AND scheduled_send_at IS NOT NULL
        AND scheduled_send_at <= $1
        AND deleted_at IS NULL
      ORDER BY scheduled_send_at ASC
      LIMIT 100
    `;

    const result = await this.database.query(query, [currentTime]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Mark message as read by user
   */
  async markAsRead(messageId: string, userId: string, userName: string): Promise<void> {
    const readReceipt: ReadReceipt = {
      userId,
      userName,
      readAt: new Date(),
    };

    const query = `
      UPDATE ${this.tableName}
      SET read_by = read_by || $2::jsonb,
          read_count = read_count + 1,
          updated_at = NOW()
      WHERE id = $1
        AND NOT (read_by @> $2::jsonb)
    `;

    await this.database.query(query, [messageId, JSON.stringify([readReceipt])]);
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    messageId: string,
    userId: string,
    userName: string,
    emoji: string
  ): Promise<void> {
    const reaction: MessageReaction = {
      reactionId: crypto.randomUUID(),
      userId,
      userName,
      emoji,
      reactedAt: new Date(),
    };

    const query = `
      UPDATE ${this.tableName}
      SET reactions = reactions || $2::jsonb,
          updated_at = NOW()
      WHERE id = $1
    `;

    await this.database.query(query, [messageId, JSON.stringify([reaction])]);
  }
}
