/**
 * Message repository - data access layer for messages and threads
 */

import {
  Repository,
  Database,
  PaginatedResult,
  QueryBuilder,
} from '@care-commons/core';
import {
  Message,
  MessageThread,
  MessageFilterOptions,
  ThreadFilterOptions,
  ThreadType,
  ThreadStatus,
  MessageType,
  MessageStatus,
  MessageWithSender,
  ThreadSummary,
} from '../types/message.js';

/**
 * Message Thread Repository
 */
export class MessageThreadRepository extends Repository<MessageThread> {
  constructor(database: Database) {
    super({
      tableName: 'message_threads',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to MessageThread entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): MessageThread {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      subject: row['subject'] as string | undefined,
      threadType: row['thread_type'] as ThreadType,
      careRecipientId: row['care_recipient_id'] as string | undefined,
      participants: JSON.parse((row['participants'] as string) || '[]'),
      participantCount: row['participant_count'] as number,
      status: row['status'] as ThreadStatus,
      lastMessageAt: row['last_message_at'] as Date | undefined,
      lastMessageBy: row['last_message_by'] as string | undefined,
      lastMessagePreview: row['last_message_preview'] as string | undefined,
      isArchived: row['is_archived'] as boolean,
      archivedAt: row['archived_at'] as Date | undefined,
      archivedBy: row['archived_by'] as string | undefined,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Map MessageThread entity to database row
   */
  protected mapEntityToRow(entity: Partial<MessageThread>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.subject !== undefined) row['subject'] = entity.subject;
    if (entity.threadType !== undefined) row['thread_type'] = entity.threadType;
    if (entity.careRecipientId !== undefined) row['care_recipient_id'] = entity.careRecipientId;
    if (entity.participants !== undefined) row['participants'] = JSON.stringify(entity.participants);
    if (entity.participantCount !== undefined) row['participant_count'] = entity.participantCount;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.lastMessageAt !== undefined) row['last_message_at'] = entity.lastMessageAt;
    if (entity.lastMessageBy !== undefined) row['last_message_by'] = entity.lastMessageBy;
    if (entity.lastMessagePreview !== undefined) row['last_message_preview'] = entity.lastMessagePreview;
    if (entity.isArchived !== undefined) row['is_archived'] = entity.isArchived;
    if (entity.archivedAt !== undefined) row['archived_at'] = entity.archivedAt;
    if (entity.archivedBy !== undefined) row['archived_by'] = entity.archivedBy;

    return row;
  }

  /**
   * Find threads by filters
   */
  async findByFilters(
    filters: ThreadFilterOptions
  ): Promise<PaginatedResult<MessageThread>> {
    const qb = this.database.queryBuilder();
    qb.select('*')
      .from(this.tableName)
      .where('organization_id', '=', filters.organizationId);

    // Apply filters
    if (filters.userId) {
      qb.whereRaw('participants @> ?', [JSON.stringify([filters.userId])]);
    }

    if (filters.careRecipientId) {
      qb.where('care_recipient_id', '=', filters.careRecipientId);
    }

    if (filters.threadType) {
      qb.where('thread_type', '=', filters.threadType);
    }

    if (filters.status) {
      qb.where('status', '=', filters.status);
    }

    if (filters.isArchived !== undefined) {
      qb.where('is_archived', '=', filters.isArchived);
    }

    if (filters.search) {
      qb.where((builder) => {
        builder
          .where('subject', 'ilike', `%${filters.search}%`)
          .orWhere('last_message_preview', 'ilike', `%${filters.search}%`);
      });
    }

    // Ordering
    qb.orderBy('last_message_at', 'DESC', 'NULLS LAST');

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows, countResult] = await Promise.all([
      qb.limit(limit).offset(offset).execute(),
      this.database.queryBuilder()
        .count('* as count')
        .from(this.tableName)
        .where('organization_id', '=', filters.organizationId)
        .execute(),
    ]);

    const items = rows.map((row) => this.mapRowToEntity(row));
    const total = Number(countResult[0]?.count || 0);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Get threads with unread message counts for a user
   */
  async findThreadsWithUnreadCounts(
    organizationId: string,
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<MessageThread & { unreadCount: number }>> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const query = `
      SELECT
        t.*,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM messages m
            WHERE m.thread_id = t.id
              AND m.deleted_at IS NULL
              AND m.sender_id != $2
              AND NOT (m.read_by ? $2)
          ),
          0
        ) as unread_count
      FROM message_threads t
      WHERE t.organization_id = $1
        AND t.participants @> $3
      ORDER BY t.last_message_at DESC NULLS LAST
      LIMIT $4 OFFSET $5
    `;

    const rows = await this.database.raw(query, [
      organizationId,
      userId,
      JSON.stringify([userId]),
      limit,
      offset,
    ]);

    const items = rows.map((row: Record<string, unknown>) => ({
      ...this.mapRowToEntity(row),
      unreadCount: Number(row['unread_count'] || 0),
    }));

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM message_threads
      WHERE organization_id = $1
        AND participants @> $2
    `;
    const countResult = await this.database.raw(countQuery, [
      organizationId,
      JSON.stringify([userId]),
    ]);
    const total = Number(countResult[0]?.count || 0);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Add participant to thread
   */
  async addParticipant(threadId: string, userId: string): Promise<void> {
    await this.database.raw(
      `
      UPDATE message_threads
      SET
        participants = participants || $1::jsonb,
        participant_count = participant_count + 1,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $2
        AND NOT (participants @> $1::jsonb)
    `,
      [JSON.stringify([userId]), threadId]
    );
  }

  /**
   * Remove participant from thread
   */
  async removeParticipant(threadId: string, userId: string): Promise<void> {
    await this.database.raw(
      `
      UPDATE message_threads
      SET
        participants = (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(participants) elem
          WHERE elem::text != $1::jsonb::text
        ),
        participant_count = participant_count - 1,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $2
        AND participants @> $1::jsonb
    `,
      [JSON.stringify([userId]), threadId]
    );
  }
}

/**
 * Message Repository
 */
export class MessageRepository extends Repository<Message> {
  constructor(database: Database) {
    super({
      tableName: 'messages',
      database,
      enableAudit: true,
      enableSoftDelete: false, // Uses deleted_at field
    });
  }

  /**
   * Map database row to Message entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Message {
    return {
      id: row['id'] as string,
      threadId: row['thread_id'] as string,
      organizationId: row['organization_id'] as string,
      senderId: row['sender_id'] as string,
      body: row['body'] as string,
      attachments: JSON.parse((row['attachments'] as string) || '[]'),
      messageType: row['message_type'] as MessageType,
      replyToId: row['reply_to_id'] as string | undefined,
      replyCount: row['reply_count'] as number,
      status: row['status'] as MessageStatus,
      editedAt: row['edited_at'] as Date | undefined,
      deletedAt: row['deleted_at'] as Date | undefined,
      deletedBy: row['deleted_by'] as string | undefined,
      readBy: JSON.parse((row['read_by'] as string) || '{}'),
      readCount: row['read_count'] as number,
      isUrgent: row['is_urgent'] as boolean,
      requiresAcknowledgment: row['requires_acknowledgment'] as boolean,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Map Message entity to database row
   */
  protected mapEntityToRow(entity: Partial<Message>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.threadId !== undefined) row['thread_id'] = entity.threadId;
    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.senderId !== undefined) row['sender_id'] = entity.senderId;
    if (entity.body !== undefined) row['body'] = entity.body;
    if (entity.attachments !== undefined) row['attachments'] = JSON.stringify(entity.attachments);
    if (entity.messageType !== undefined) row['message_type'] = entity.messageType;
    if (entity.replyToId !== undefined) row['reply_to_id'] = entity.replyToId;
    if (entity.replyCount !== undefined) row['reply_count'] = entity.replyCount;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.editedAt !== undefined) row['edited_at'] = entity.editedAt;
    if (entity.deletedAt !== undefined) row['deleted_at'] = entity.deletedAt;
    if (entity.deletedBy !== undefined) row['deleted_by'] = entity.deletedBy;
    if (entity.readBy !== undefined) row['read_by'] = JSON.stringify(entity.readBy);
    if (entity.readCount !== undefined) row['read_count'] = entity.readCount;
    if (entity.isUrgent !== undefined) row['is_urgent'] = entity.isUrgent;
    if (entity.requiresAcknowledgment !== undefined) {
      row['requires_acknowledgment'] = entity.requiresAcknowledgment;
    }

    return row;
  }

  /**
   * Find messages by filters
   */
  async findByFilters(
    filters: MessageFilterOptions
  ): Promise<PaginatedResult<Message>> {
    const qb = this.database.queryBuilder();
    qb.select('*')
      .from(this.tableName)
      .where('thread_id', '=', filters.threadId)
      .whereNull('deleted_at');

    // Apply filters
    if (filters.senderId) {
      qb.where('sender_id', '=', filters.senderId);
    }

    if (filters.messageType) {
      qb.where('message_type', '=', filters.messageType);
    }

    if (filters.isUrgent !== undefined) {
      qb.where('is_urgent', '=', filters.isUrgent);
    }

    if (filters.beforeDate) {
      qb.where('created_at', '<', filters.beforeDate);
    }

    if (filters.afterDate) {
      qb.where('created_at', '>', filters.afterDate);
    }

    // Ordering
    qb.orderBy('created_at', 'DESC');

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows, countResult] = await Promise.all([
      qb.limit(limit).offset(offset).execute(),
      this.database.queryBuilder()
        .count('* as count')
        .from(this.tableName)
        .where('thread_id', '=', filters.threadId)
        .whereNull('deleted_at')
        .execute(),
    ]);

    const items = rows.map((row) => this.mapRowToEntity(row));
    const total = Number(countResult[0]?.count || 0);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Mark message as read by user
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    await this.database.raw(
      `
      UPDATE messages
      SET
        read_by = jsonb_set(read_by, $1::text[], to_jsonb(NOW())),
        read_count = read_count + 1,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $2
        AND NOT (read_by ? $3)
    `,
      [`{${userId}}`, messageId, userId]
    );
  }

  /**
   * Mark all messages in thread as read by user
   */
  async markThreadAsRead(threadId: string, userId: string): Promise<void> {
    await this.database.raw(
      `
      UPDATE messages
      SET
        read_by = jsonb_set(read_by, $1::text[], to_jsonb(NOW())),
        read_count = read_count + 1,
        updated_at = NOW(),
        version = version + 1
      WHERE thread_id = $2
        AND sender_id != $3
        AND deleted_at IS NULL
        AND NOT (read_by ? $3)
    `,
      [`{${userId}}`, threadId, userId]
    );
  }

  /**
   * Get messages with sender details
   */
  async findWithSenderDetails(
    filters: MessageFilterOptions
  ): Promise<PaginatedResult<MessageWithSender>> {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT
        m.*,
        u.first_name || ' ' || u.last_name as sender_name,
        u.role as sender_role,
        CASE
          WHEN m.reply_to_id IS NOT NULL THEN json_build_object(
            'id', r.id,
            'body', r.body,
            'senderName', ru.first_name || ' ' || ru.last_name
          )
          ELSE NULL
        END as reply_to_message
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      LEFT JOIN messages r ON m.reply_to_id = r.id
      LEFT JOIN users ru ON r.sender_id = ru.id
      WHERE m.thread_id = $1
        AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const rows = await this.database.raw(query, [filters.threadId, limit, offset]);

    const items = rows.map((row: Record<string, unknown>) => ({
      ...this.mapRowToEntity(row),
      senderName: row['sender_name'] as string,
      senderRole: row['sender_role'] as string | undefined,
      replyToMessage: row['reply_to_message']
        ? JSON.parse(row['reply_to_message'] as string)
        : undefined,
    }));

    // Get total count
    const countResult = await this.database.queryBuilder()
      .count('* as count')
      .from(this.tableName)
      .where('thread_id', '=', filters.threadId)
      .whereNull('deleted_at')
      .execute();

    const total = Number(countResult[0]?.count || 0);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Soft delete message
   */
  async softDelete(messageId: string, deletedBy: string): Promise<void> {
    await this.database.raw(
      `
      UPDATE messages
      SET
        status = 'DELETED',
        deleted_at = NOW(),
        deleted_by = $1,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $2
        AND deleted_at IS NULL
    `,
      [deletedBy, messageId]
    );
  }
}
