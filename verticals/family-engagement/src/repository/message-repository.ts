import { Repository, type Database, type PaginatedResult } from '@care-commons/core';
import type { FamilyMessage, MessageSearchFilter } from '../types/family.js';

export class MessageRepository extends Repository<FamilyMessage> {
  constructor(database: Database) {
    super({
      tableName: 'family_messages',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): FamilyMessage {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      clientId: row.client_id as string,

      senderType: row.sender_type as FamilyMessage['senderType'],
      senderId: row.sender_id as string,

      messageText: row.message_text as string,
      messageType: row.message_type as FamilyMessage['messageType'],
      attachments: row.attachments as FamilyMessage['attachments'],

      threadId: row.thread_id as string | undefined,
      parentMessageId: row.parent_message_id as string | undefined,

      isRead: row.is_read as boolean,
      readAt: row.read_at ? new Date(row.read_at as string) : undefined,
      requiresResponse: row.requires_response as boolean,
      priority: row.priority as FamilyMessage['priority'],

      createdAt: new Date(row.created_at as string),
      createdBy: row.sender_id as string,
      updatedAt: new Date(row.created_at as string),
      updatedBy: row.sender_id as string,
      version: 1,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyMessage>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.senderType !== undefined) row.sender_type = entity.senderType;
    if (entity.senderId !== undefined) row.sender_id = entity.senderId;
    if (entity.messageText !== undefined) row.message_text = entity.messageText;
    if (entity.messageType !== undefined) row.message_type = entity.messageType;
    if (entity.attachments !== undefined) row.attachments = JSON.stringify(entity.attachments);
    if (entity.threadId !== undefined) row.thread_id = entity.threadId;
    if (entity.parentMessageId !== undefined) row.parent_message_id = entity.parentMessageId;
    if (entity.isRead !== undefined) row.is_read = entity.isRead;
    if (entity.readAt !== undefined) row.read_at = entity.readAt;
    if (entity.requiresResponse !== undefined) row.requires_response = entity.requiresResponse;
    if (entity.priority !== undefined) row.priority = entity.priority;

    return row;
  }

  /**
   * Search messages with filters
   */
  async search(
    filter: MessageSearchFilter,
    page = 1,
    limit = 50
  ): Promise<PaginatedResult<FamilyMessage>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      params.push(filter.clientId);
    }

    if (filter.threadId) {
      conditions.push(`thread_id = $${paramIndex++}`);
      params.push(filter.threadId);
    }

    if (filter.senderType) {
      conditions.push(`sender_type = $${paramIndex++}`);
      params.push(filter.senderType);
    }

    if (filter.isRead !== undefined) {
      conditions.push(`is_read = $${paramIndex++}`);
      params.push(filter.isRead);
    }

    if (filter.requiresResponse !== undefined) {
      conditions.push(`requires_response = $${paramIndex++}`);
      params.push(filter.requiresResponse);
    }

    if (filter.priority) {
      conditions.push(`priority = $${paramIndex++}`);
      params.push(filter.priority);
    }

    if (filter.dateFrom) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filter.dateFrom);
    }

    if (filter.dateTo) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filter.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.database.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count as string, 10);

    // Get items
    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await this.database.query(query, [...params, limit, offset]);

    return {
      items: result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get messages by thread ID
   */
  async findByThreadId(threadId: string): Promise<FamilyMessage[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE thread_id = $1
      ORDER BY created_at ASC
    `;
    const result = await this.database.query(query, [threadId]);
    return result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>));
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET is_read = true, read_at = NOW()
      WHERE id = $1
    `;
    await this.database.query(query, [id]);
  }

  /**
   * Get unread message count for client
   */
  async getUnreadCount(clientId: string, senderType?: FamilyMessage['senderType']): Promise<number> {
    const conditions = ['client_id = $1', 'is_read = false'];
    const params: unknown[] = [clientId];

    if (senderType) {
      conditions.push('sender_type = $2');
      params.push(senderType);
    }

    const query = `
      SELECT COUNT(*) FROM ${this.tableName}
      WHERE ${conditions.join(' AND ')}
    `;
    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string, 10);
  }
}
