/**
 * Notification repository - data access layer for notifications
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import type {
  Notification,
  NotificationStatus,
  NotificationCategory,
  ChannelType,
} from '../types/communication.js';

export class NotificationRepository extends Repository<Notification> {
  constructor(database: Database) {
    super({
      tableName: 'notifications',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): Notification {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      recipientId: row['recipient_id'] as string,
      recipientType: row['recipient_type'] as any,
      category: row['category'] as NotificationCategory,
      priority: row['priority'] as any,
      title: row['title'] as string,
      message: row['message'] as string,
      richContent: row['rich_content'] as string | undefined,
      actionUrl: row['action_url'] as string | undefined,
      actionLabel: row['action_label'] as string | undefined,
      actionData: JSON.parse((row['action_data'] as string) || '{}'),
      relatedEntityType: row['related_entity_type'] as string | undefined,
      relatedEntityId: row['related_entity_id'] as string | undefined,
      status: row['status'] as NotificationStatus,
      channels: JSON.parse(row['channels'] as string),
      primaryChannel: row['primary_channel'] as any,
      sentAt: row['sent_at'] as Date | null | undefined,
      deliveredAt: row['delivered_at'] as Date | null | undefined,
      readAt: row['read_at'] as Date | null | undefined,
      dismissedAt: row['dismissed_at'] as Date | null | undefined,
      failedAt: row['failed_at'] as Date | null | undefined,
      failureReason: row['failure_reason'] as string | undefined,
      externalIds: JSON.parse((row['external_ids'] as string) || '{}'),
      scheduledSendAt: row['scheduled_send_at'] as Date | null | undefined,
      expiresAt: row['expires_at'] as Date | null | undefined,
      groupKey: row['group_key'] as string | undefined,
      isGrouped: row['is_grouped'] as boolean,
      metadata: JSON.parse((row['metadata'] as string) || '{}'),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  protected mapEntityToRow(entity: Partial<Notification>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.recipientId !== undefined) row['recipient_id'] = entity.recipientId;
    if (entity.recipientType !== undefined) row['recipient_type'] = entity.recipientType;
    if (entity.category !== undefined) row['category'] = entity.category;
    if (entity.priority !== undefined) row['priority'] = entity.priority;
    if (entity.title !== undefined) row['title'] = entity.title;
    if (entity.message !== undefined) row['message'] = entity.message;
    if (entity.richContent !== undefined) row['rich_content'] = entity.richContent;
    if (entity.actionUrl !== undefined) row['action_url'] = entity.actionUrl;
    if (entity.actionLabel !== undefined) row['action_label'] = entity.actionLabel;
    if (entity.actionData !== undefined) row['action_data'] = JSON.stringify(entity.actionData);
    if (entity.relatedEntityType !== undefined) row['related_entity_type'] = entity.relatedEntityType;
    if (entity.relatedEntityId !== undefined) row['related_entity_id'] = entity.relatedEntityId;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.channels !== undefined) row['channels'] = JSON.stringify(entity.channels);
    if (entity.primaryChannel !== undefined) row['primary_channel'] = entity.primaryChannel;
    if (entity.sentAt !== undefined) row['sent_at'] = entity.sentAt;
    if (entity.deliveredAt !== undefined) row['delivered_at'] = entity.deliveredAt;
    if (entity.readAt !== undefined) row['read_at'] = entity.readAt;
    if (entity.dismissedAt !== undefined) row['dismissed_at'] = entity.dismissedAt;
    if (entity.failedAt !== undefined) row['failed_at'] = entity.failedAt;
    if (entity.failureReason !== undefined) row['failure_reason'] = entity.failureReason;
    if (entity.externalIds !== undefined) row['external_ids'] = JSON.stringify(entity.externalIds);
    if (entity.scheduledSendAt !== undefined) row['scheduled_send_at'] = entity.scheduledSendAt;
    if (entity.expiresAt !== undefined) row['expires_at'] = entity.expiresAt;
    if (entity.groupKey !== undefined) row['group_key'] = entity.groupKey;
    if (entity.isGrouped !== undefined) row['is_grouped'] = entity.isGrouped;
    if (entity.metadata !== undefined) row['metadata'] = JSON.stringify(entity.metadata);

    return row;
  }

  /**
   * Find notifications for a recipient
   */
  async findByRecipient(
    recipientId: string,
    unreadOnly: boolean = false,
    pagination?: { page: number; limit: number }
  ): Promise<PaginatedResult<Notification> | Notification[]> {
    const unreadFilter = unreadOnly ? "AND read_at IS NULL AND dismissed_at IS NULL" : '';

    if (!pagination) {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE recipient_id = $1
          ${unreadFilter}
        ORDER BY created_at DESC
        LIMIT 100
      `;
      const result = await this.database.query(query, [recipientId]);
      return result.rows.map((row) => this.mapRowToEntity(row));
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) FROM ${this.tableName}
      WHERE recipient_id = $1
        ${unreadFilter}
    `;
    const countResult = await this.database.query(countQuery, [recipientId]);
    const countRow = countResult.rows[0];
    if (!countRow) {
      throw new Error('Count query returned no rows');
    }
    const total = parseInt(String(countRow['count']));

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE recipient_id = $1
        ${unreadFilter}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.database.query(query, [recipientId, pagination.limit, offset]);
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
   * Find scheduled notifications ready to send
   */
  async findScheduledReady(currentTime: Date): Promise<Notification[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'SCHEDULED'
        AND scheduled_send_at IS NOT NULL
        AND scheduled_send_at <= $1
        AND (expires_at IS NULL OR expires_at > $1)
      ORDER BY scheduled_send_at ASC
      LIMIT 100
    `;

    const result = await this.database.query(query, [currentTime]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET read_at = NOW(),
          status = 'READ',
          updated_at = NOW()
      WHERE id = $1
        AND read_at IS NULL
    `;

    await this.database.query(query, [notificationId]);
  }

  /**
   * Mark all notifications as read for recipient
   */
  async markAllAsRead(recipientId: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET read_at = NOW(),
          status = 'READ',
          updated_at = NOW()
      WHERE recipient_id = $1
        AND read_at IS NULL
    `;

    await this.database.query(query, [recipientId]);
  }

  /**
   * Mark notification as dismissed
   */
  async markAsDismissed(notificationId: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET dismissed_at = NOW(),
          status = 'DISMISSED',
          updated_at = NOW()
      WHERE id = $1
    `;

    await this.database.query(query, [notificationId]);
  }

  /**
   * Get unread count for recipient
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      WHERE recipient_id = $1
        AND read_at IS NULL
        AND dismissed_at IS NULL
    `;

    const result = await this.database.query(query, [recipientId]);
    const row = result.rows[0];
    return row ? parseInt(String(row['count'])) : 0;
  }

  /**
   * Delete expired notifications
   */
  async deleteExpired(): Promise<number> {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE expires_at IS NOT NULL
        AND expires_at < NOW()
    `;

    const result = await this.database.query(query, []);
    return result.rowCount ?? 0;
  }

  /**
   * Find notifications by group key
   */
  async findByGroupKey(groupKey: string): Promise<Notification[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE group_key = $1
      ORDER BY created_at DESC
    `;

    const result = await this.database.query(query, [groupKey]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }
}
