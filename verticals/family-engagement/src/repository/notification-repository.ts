/**
 * Notification repository - data access layer
 */

import { Repository, Database } from '@care-commons/core';
import {
  Notification,
  NotificationDelivery,
  NotificationType,
  NotificationChannel,
  NotificationDeliveryStatus,
} from '../types/notification.js';

export class NotificationRepository extends Repository<Notification> {
  constructor(database: Database) {
    super({
      tableName: 'notifications',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to Notification entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Notification {
    return {
      id: row['id'] as string,
      familyMemberId: row['family_member_id'] as string,
      clientId: row['client_id'] as string,
      type: row['type'] as NotificationType,
      category: row['category'] as any,
      priority: row['priority'] as any,
      title: row['title'] as string,
      body: row['body'] as string,
      actionUrl: row['action_url'] as string | undefined,
      actionText: row['action_text'] as string | undefined,
      resourceType: row['resource_type'] as string | undefined,
      resourceId: row['resource_id'] as string | undefined,
      metadata: row['metadata'] ? JSON.parse(row['metadata'] as string) : undefined,
      deliveryChannels: JSON.parse(row['delivery_channels'] as string),
      deliveryStatus: row['delivery_status'] as NotificationDeliveryStatus,
      sentAt: row['sent_at'] as Date | undefined,
      deliveredAt: row['delivered_at'] as Date | undefined,
      failedAt: row['failed_at'] as Date | undefined,
      failureReason: row['failure_reason'] as string | undefined,
      readAt: row['read_at'] as Date | undefined,
      clickedAt: row['clicked_at'] as Date | undefined,
      dismissedAt: row['dismissed_at'] as Date | undefined,
      scheduledFor: row['scheduled_for'] as Date | undefined,
      expiresAt: row['expires_at'] as Date | undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  /**
   * Find notifications for a family member
   */
  async findByFamilyMember(
    familyMemberId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    let query = `SELECT * FROM notifications WHERE family_member_id = $1`;
    const params: any[] = [familyMemberId];
    let paramIndex = 2;

    if (options?.unreadOnly) {
      query += ` AND read_at IS NULL`;
    }

    query += ` ORDER BY created_at DESC`;

    if (options?.limit) {
      params.push(options.limit);
      query += ` LIMIT $${paramIndex++}`;
    }

    if (options?.offset) {
      params.push(options.offset);
      query += ` OFFSET $${paramIndex++}`;
    }

    const rows = await this.database.query<Record<string, unknown>>(query, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get unread count for family member
   */
  async getUnreadCount(familyMemberId: string): Promise<number> {
    const rows = await this.database.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications
       WHERE family_member_id = $1 AND read_at IS NULL`,
      [familyMemberId]
    );
    return parseInt(rows[0].count, 10);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.database.query(
      `UPDATE notifications
       SET read_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND read_at IS NULL`,
      [notificationId]
    );
  }

  /**
   * Mark all notifications as read for family member
   */
  async markAllAsRead(familyMemberId: string): Promise<void> {
    await this.database.query(
      `UPDATE notifications
       SET read_at = NOW(), updated_at = NOW()
       WHERE family_member_id = $1 AND read_at IS NULL`,
      [familyMemberId]
    );
  }

  /**
   * Mark notification as clicked
   */
  async markAsClicked(notificationId: string): Promise<void> {
    await this.database.query(
      `UPDATE notifications
       SET clicked_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND clicked_at IS NULL`,
      [notificationId]
    );
  }

  /**
   * Mark notification as dismissed
   */
  async markAsDismissed(notificationId: string): Promise<void> {
    await this.database.query(
      `UPDATE notifications
       SET dismissed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND dismissed_at IS NULL`,
      [notificationId]
    );
  }

  /**
   * Find scheduled notifications ready to send
   */
  async findScheduledReadyToSend(): Promise<Notification[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM notifications
       WHERE delivery_status = 'SCHEDULED'
         AND scheduled_for <= NOW()
       ORDER BY scheduled_for ASC
       LIMIT 100`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    notificationId: string,
    status: NotificationDeliveryStatus,
    error?: string
  ): Promise<void> {
    const statusField = status === 'SENT' ? 'sent_at'
                      : status === 'DELIVERED' ? 'delivered_at'
                      : status === 'FAILED' ? 'failed_at'
                      : null;

    let query = `UPDATE notifications SET delivery_status = $1, updated_at = NOW()`;
    const params: any[] = [status];
    let paramIndex = 2;

    if (statusField) {
      query += `, ${statusField} = NOW()`;
    }

    if (error) {
      params.push(error);
      query += `, failure_reason = $${paramIndex++}`;
    }

    params.push(notificationId);
    query += ` WHERE id = $${paramIndex}`;

    await this.database.query(query, params);
  }

  /**
   * Find notifications by type and date range
   */
  async findByTypeAndDateRange(
    type: NotificationType,
    startDate: Date,
    endDate: Date
  ): Promise<Notification[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM notifications
       WHERE type = $1
         AND created_at >= $2
         AND created_at <= $3
       ORDER BY created_at DESC`,
      [type, startDate, endDate]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Clean old notifications
   */
  async cleanOldNotifications(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.database.query(
      `DELETE FROM notifications
       WHERE created_at < $1
         AND (read_at IS NOT NULL OR dismissed_at IS NOT NULL)`,
      [cutoffDate]
    );
    return result.length;
  }
}

export class NotificationDeliveryRepository extends Repository<NotificationDelivery> {
  constructor(database: Database) {
    super({
      tableName: 'notification_deliveries',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to NotificationDelivery entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): NotificationDelivery {
    const channelData = row['channel_data'] ? JSON.parse(row['channel_data'] as string) : undefined;

    return {
      id: row['id'] as string,
      notificationId: row['notification_id'] as string,
      channel: row['channel'] as NotificationChannel,
      status: row['status'] as NotificationDeliveryStatus,
      sentAt: row['sent_at'] as Date | undefined,
      deliveredAt: row['delivered_at'] as Date | undefined,
      failedAt: row['failed_at'] as Date | undefined,
      errorMessage: row['error_message'] as string | undefined,
      retryCount: row['retry_count'] as number,
      maxRetries: row['max_retries'] as number,
      emailData: channelData?.emailData,
      smsData: channelData?.smsData,
      pushData: channelData?.pushData,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  /**
   * Find deliveries by notification
   */
  async findByNotification(notificationId: string): Promise<NotificationDelivery[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM notification_deliveries
       WHERE notification_id = $1
       ORDER BY created_at ASC`,
      [notificationId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find pending deliveries ready for retry
   */
  async findPendingRetries(): Promise<NotificationDelivery[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM notification_deliveries
       WHERE status = 'FAILED'
         AND retry_count < max_retries
         AND failed_at < NOW() - INTERVAL '5 minutes'
       ORDER BY failed_at ASC
       LIMIT 100`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update delivery status
   */
  async updateStatus(
    id: string,
    status: NotificationDeliveryStatus,
    error?: string
  ): Promise<void> {
    const statusField = status === 'SENT' ? 'sent_at'
                      : status === 'DELIVERED' ? 'delivered_at'
                      : status === 'FAILED' ? 'failed_at'
                      : null;

    let query = `UPDATE notification_deliveries SET status = $1, updated_at = NOW()`;
    const params: any[] = [status];
    let paramIndex = 2;

    if (statusField) {
      query += `, ${statusField} = NOW()`;
    }

    if (status === 'FAILED') {
      query += `, retry_count = retry_count + 1`;
      if (error) {
        params.push(error);
        query += `, error_message = $${paramIndex++}`;
      }
    }

    params.push(id);
    query += ` WHERE id = $${paramIndex}`;

    await this.database.query(query, params);
  }

  /**
   * Get delivery statistics
   */
  async getStatistics(
    notificationId: string
  ): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'SENT') as sent,
         COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
         COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
         COUNT(*) FILTER (WHERE status = 'PENDING') as pending
       FROM notification_deliveries
       WHERE notification_id = $1`,
      [notificationId]
    );

    const row = rows[0];
    return {
      total: parseInt(row['total'] as string, 10),
      sent: parseInt(row['sent'] as string, 10),
      delivered: parseInt(row['delivered'] as string, 10),
      failed: parseInt(row['failed'] as string, 10),
      pending: parseInt(row['pending'] as string, 10),
    };
  }
}
