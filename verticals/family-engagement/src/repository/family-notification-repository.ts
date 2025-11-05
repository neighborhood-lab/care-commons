/**
 * Family Notification Repository - data access layer for family notifications
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import {
  FamilyNotification,
  FamilyNotificationFilters,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  DeliveryStatus,
  DeliveryChannel,
  NotificationStats,
} from '../types/index.js';

export class FamilyNotificationRepository extends Repository<FamilyNotification> {
  constructor(database: Database) {
    super({
      tableName: 'family_notifications',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to FamilyNotification entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyNotification {
    return {
      id: row['id'] as string,
      family_member_id: row['family_member_id'] as string,
      client_id: row['client_id'] as string,
      organization_id: row['organization_id'] as string,

      // Notification details
      notification_type: row['notification_type'] as NotificationType,
      category: row['category'] as NotificationCategory,
      priority: row['priority'] as NotificationPriority,
      title: row['title'] as string,
      body: row['body'] as string,
      data: row['data'] ? JSON.parse(row['data'] as string) : undefined,

      // Related entities
      related_entity_id: row['related_entity_id'] as string | undefined,
      related_entity_type: row['related_entity_type'] as string | undefined,

      // Delivery
      delivery_channels: row['delivery_channels']
        ? JSON.parse(row['delivery_channels'] as string)
        : undefined,
      scheduled_for: row['scheduled_for'] as Date | undefined,
      delivery_status: row['delivery_status'] as DeliveryStatus,
      sent_at: row['sent_at'] as Date | undefined,
      delivered_at: row['delivered_at'] as Date | undefined,
      read_at: row['read_at'] as Date | undefined,
      delivery_details: row['delivery_details']
        ? JSON.parse(row['delivery_details'] as string)
        : undefined,
      delivery_error: row['delivery_error'] as string | undefined,

      // User interaction
      is_read: row['is_read'] as boolean,
      is_archived: row['is_archived'] as boolean,
      is_starred: row['is_starred'] as boolean,
      archived_at: row['archived_at'] as Date | undefined,

      // Expiration
      expires_at: row['expires_at'] as Date | undefined,

      // Standard fields
      created_at: row['created_at'] as Date,
      created_by: row['created_by'] as string,
      updated_at: row['updated_at'] as Date,
      updated_by: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Find notifications for a family member
   */
  async findByFamilyMemberId(
    familyMemberId: string,
    includeArchived = false
  ): Promise<FamilyNotification[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({ family_member_id: familyMemberId });

    if (!includeArchived) {
      query.where({ is_archived: false });
    }

    query.orderBy('created_at', 'desc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find unread notifications for a family member
   */
  async findUnread(familyMemberId: string): Promise<FamilyNotification[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({
        family_member_id: familyMemberId,
        is_read: false,
        is_archived: false,
      })
      .orderBy('created_at', 'desc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find pending notifications (for delivery)
   */
  async findPendingDelivery(): Promise<FamilyNotification[]> {
    const knex = this.database.getKnex();
    const now = knex.fn.now();

    const query = knex(this.tableName)
      .where({ delivery_status: 'PENDING' })
      .where(function () {
        this.whereNull('scheduled_for').orWhere('scheduled_for', '<=', now);
      })
      .where(function () {
        this.whereNull('expires_at').orWhere('expires_at', '>', now);
      })
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'asc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const knex = this.database.getKnex();

    await knex(this.tableName)
      .where({ id: notificationId })
      .update({
        is_read: true,
        read_at: knex.fn.now(),
        updated_by: userId,
        updated_at: knex.fn.now(),
      });
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<void> {
    const knex = this.database.getKnex();

    await knex(this.tableName)
      .whereIn('id', notificationIds)
      .update({
        is_read: true,
        read_at: knex.fn.now(),
        updated_by: userId,
        updated_at: knex.fn.now(),
      });
  }

  /**
   * Archive notification
   */
  async archive(notificationId: string, userId: string): Promise<void> {
    const knex = this.database.getKnex();

    await knex(this.tableName)
      .where({ id: notificationId })
      .update({
        is_archived: true,
        archived_at: knex.fn.now(),
        updated_by: userId,
        updated_at: knex.fn.now(),
      });
  }

  /**
   * Get notification statistics for a family member
   */
  async getStats(familyMemberId: string): Promise<NotificationStats> {
    const knex = this.database.getKnex();

    // Total count
    const totalResult = await knex(this.tableName)
      .where({ family_member_id: familyMemberId, is_archived: false })
      .count('* as count')
      .first();

    const total = Number(totalResult?.['count'] ?? 0);

    // Unread count
    const unreadResult = await knex(this.tableName)
      .where({ family_member_id: familyMemberId, is_read: false, is_archived: false })
      .count('* as count')
      .first();

    const unread = Number(unreadResult?.['count'] ?? 0);

    // By category
    const categoryResults = await knex(this.tableName)
      .where({ family_member_id: familyMemberId, is_archived: false })
      .select('category')
      .count('* as count')
      .groupBy('category');

    const by_category: Record<NotificationCategory, number> = {
      VISIT: 0,
      CARE_PLAN: 0,
      HEALTH: 0,
      BILLING: 0,
      COMMUNICATION: 0,
      SYSTEM: 0,
    };

    for (const row of categoryResults) {
      by_category[row['category'] as NotificationCategory] = Number(row['count']);
    }

    // By priority
    const priorityResults = await knex(this.tableName)
      .where({ family_member_id: familyMemberId, is_archived: false })
      .select('priority')
      .count('* as count')
      .groupBy('priority');

    const by_priority: Record<NotificationPriority, number> = {
      LOW: 0,
      NORMAL: 0,
      HIGH: 0,
      URGENT: 0,
    };

    for (const row of priorityResults) {
      by_priority[row['priority'] as NotificationPriority] = Number(row['count']);
    }

    return {
      total,
      unread,
      by_category,
      by_priority,
    };
  }

  /**
   * Search notifications with filters
   */
  async search(
    filters: FamilyNotificationFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<FamilyNotification>> {
    const query = this.database.getKnex()(this.tableName);

    // Apply filters
    if (filters.family_member_id) {
      query.where({ family_member_id: filters.family_member_id });
    }

    if (filters.client_id) {
      query.where({ client_id: filters.client_id });
    }

    if (filters.organization_id) {
      query.where({ organization_id: filters.organization_id });
    }

    if (filters.notification_type) {
      query.where({ notification_type: filters.notification_type });
    }

    if (filters.category) {
      query.where({ category: filters.category });
    }

    if (filters.priority) {
      query.where({ priority: filters.priority });
    }

    if (filters.delivery_status) {
      query.where({ delivery_status: filters.delivery_status });
    }

    if (filters.is_read !== undefined) {
      query.where({ is_read: filters.is_read });
    }

    if (filters.is_archived !== undefined) {
      query.where({ is_archived: filters.is_archived });
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
   * Delete expired notifications
   */
  async deleteExpired(): Promise<number> {
    const knex = this.database.getKnex();

    const result = await knex(this.tableName)
      .where('expires_at', '<', knex.fn.now())
      .delete();

    return result;
  }
}
