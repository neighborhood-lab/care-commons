/**
 * Notification repository - data access layer
 */

import { v4 as uuidv4 } from 'uuid';
import { Database } from '../db/connection';
import { PaginatedResult } from '../types/base';
import {
  Notification,
  CreateNotificationInput,
  NotificationListOptions,
} from './types';

export class NotificationRepository {
  constructor(private readonly database: Database) {}

  /**
   * Map database row to Notification entity
   */
  private mapRowToEntity(row: Record<string, unknown>): Notification {
    return {
      id: row['id'] as string,
      userId: row['user_id'] as string,
      organizationId: row['organization_id'] as string,
      type: row['type'] as Notification['type'],
      title: row['title'] as string,
      message: row['message'] as string,
      isRead: row['is_read'] as boolean,
      actionUrl: row['action_url'] as string | undefined,
      metadata: row['metadata'] as Record<string, unknown>,
      createdAt: row['created_at'] as Date,
      readAt: row['read_at'] as Date | undefined,
      deletedAt: row['deleted_at'] as Date | undefined,
    };
  }

  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const id = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO notifications (
        id, user_id, organization_id, type, title, message,
        is_read, action_url, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      id,
      input.userId,
      input.organizationId,
      input.type,
      input.title,
      input.message,
      false, // isRead defaults to false
      input.actionUrl ?? null,
      JSON.stringify(input.metadata ?? {}),
      now,
    ];

    const result = await this.database.query(query, values);
    const row = result.rows[0] as Record<string, unknown>;
    return this.mapRowToEntity(row);
  }

  /**
   * Find notifications by user ID with filters and pagination
   */
  async findByUserId(
    userId: string,
    organizationId: string,
    options: NotificationListOptions = {}
  ): Promise<PaginatedResult<Notification>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      isRead,
      type,
      startDate,
      endDate,
    } = options;

    const offset = (page - 1) * limit;
    const whereClauses: string[] = [
      'user_id = $1',
      'organization_id = $2',
      'deleted_at IS NULL',
    ];
    const values: unknown[] = [userId, organizationId];
    let paramIndex = 3;

    if (isRead !== undefined) {
      whereClauses.push(`is_read = $${paramIndex}`);
      values.push(isRead);
      paramIndex++;
    }

    if (type !== undefined && type.length > 0) {
      whereClauses.push(`type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    if (startDate !== undefined) {
      whereClauses.push(`created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate !== undefined) {
      whereClauses.push(`created_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const whereClause = whereClauses.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM notifications WHERE ${whereClause}`;
    const countResult = await this.database.query(countQuery, values);
    const countRow = countResult.rows[0];
    if (countRow === undefined) {
      throw new Error('Failed to get notification count');
    }
    const total = parseInt(countRow['count'] as string, 10);

    // Get paginated results
    const query = `
      SELECT * FROM notifications
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.database.query(query, [...values, limit, offset]);

    return {
      items: result.rows.map((row) =>
        this.mapRowToEntity(row as Record<string, unknown>)
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get unread notification count for a user
   */
  async countUnread(userId: string, organizationId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) FROM notifications
      WHERE user_id = $1
        AND organization_id = $2
        AND is_read = false
        AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [userId, organizationId]);
    const countRow = result.rows[0];
    if (countRow === undefined) {
      return 0;
    }
    return parseInt(countRow['count'] as string, 10);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification | null> {
    const now = new Date();

    const query = `
      UPDATE notifications
      SET is_read = true, read_at = $1
      WHERE id = $2
        AND user_id = $3
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.database.query(query, [now, notificationId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, organizationId: string): Promise<number> {
    const now = new Date();

    const query = `
      UPDATE notifications
      SET is_read = true, read_at = $1
      WHERE user_id = $2
        AND organization_id = $3
        AND is_read = false
        AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [now, userId, organizationId]);
    return result.rowCount ?? 0;
  }

  /**
   * Soft delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<boolean> {
    const now = new Date();

    const query = `
      UPDATE notifications
      SET deleted_at = $1
      WHERE id = $2
        AND user_id = $3
        AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [now, notificationId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Find a single notification by ID
   */
  async findById(notificationId: string, userId: string): Promise<Notification | null> {
    const query = `
      SELECT * FROM notifications
      WHERE id = $1
        AND user_id = $2
        AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [notificationId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0] as Record<string, unknown>);
  }
}
