/**
 * Family Notification Repository
 *
 * Data access layer for family notifications
 */

import { Repository, Database, UUID, PaginatedResult, PaginationParams } from '@care-commons/core';
import type { FamilyNotification, NotificationStatus, NotificationCategory, NotificationPriority } from '../types/index.js';

export interface NotificationFilters {
  familyMemberId?: UUID;
  clientId?: UUID;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  unreadOnly?: boolean;
  urgentOnly?: boolean;
}

export class NotificationRepository extends Repository<FamilyNotification> {
  constructor(database: Database) {
    super({ tableName: 'family_notifications', database, enableAudit: false, enableSoftDelete: false });
  }

  protected mapRowToEntity(row: any): FamilyNotification {
    return {
      id: row.id,
      familyMemberId: row.family_member_id,
      clientId: row.client_id,
      type: row.type,
      category: row.category,
      title: row.title,
      message: row.message,
      priority: row.priority,
      actionRequired: row.action_required,
      actionUrl: row.action_url,
      actionLabel: row.action_label,
      channels: row.channels || [],
      status: row.status,
      sentAt: row.sent_at,
      readAt: row.read_at,
      dismissedAt: row.dismissed_at,
      relatedEntity: row.related_entity,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyNotification>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.category !== undefined) row.category = entity.category;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.message !== undefined) row.message = entity.message;
    if (entity.priority !== undefined) row.priority = entity.priority;
    if (entity.actionRequired !== undefined) row.action_required = entity.actionRequired;
    if (entity.actionUrl !== undefined) row.action_url = entity.actionUrl;
    if (entity.actionLabel !== undefined) row.action_label = entity.actionLabel;
    if (entity.channels !== undefined) row.channels = entity.channels;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.sentAt !== undefined) row.sent_at = entity.sentAt;
    if (entity.readAt !== undefined) row.read_at = entity.readAt;
    if (entity.dismissedAt !== undefined) row.dismissed_at = entity.dismissedAt;
    if (entity.relatedEntity !== undefined) row.related_entity = JSON.stringify(entity.relatedEntity);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.expiresAt !== undefined) row.expires_at = entity.expiresAt;

    return row;
  }

  async search(
    filters: NotificationFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<FamilyNotification>> {
    let query = this.database.knex(this.tableName);

    if (filters.familyMemberId) {
      query = query.where('family_member_id', filters.familyMemberId);
    }
    if (filters.clientId) {
      query = query.where('client_id', filters.clientId);
    }
    if (filters.category) {
      query = query.where('category', filters.category);
    }
    if (filters.priority) {
      query = query.where('priority', filters.priority);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.unreadOnly) {
      query = query.whereNull('read_at').where('status', '!=', 'DISMISSED');
    }
    if (filters.urgentOnly) {
      query = query.where('priority', 'URGENT');
    }

    // Exclude expired notifications
    query = query.where((builder) => {
      builder.whereNull('expires_at').orWhere('expires_at', '>', new Date());
    });

    const countResult = await query.clone().count('* as count').first();
    const total = Number(countResult?.count || 0);

    const offset = (pagination.page - 1) * pagination.limit;
    const rows = await query
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'desc')
      .limit(pagination.limit)
      .offset(offset);

    return {
      items: rows.map((row) => this.mapRowToEntity(row)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    };
  }

  async getUnreadCount(familyMemberId: UUID): Promise<number> {
    const result = await this.database.knex(this.tableName)
      .where({ family_member_id: familyMemberId })
      .whereNull('read_at')
      .where('status', '!=', 'DISMISSED')
      .where((builder) => {
        builder.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      })
      .count('* as count')
      .first();

    return Number(result?.count || 0);
  }

  async getUrgentNotifications(familyMemberId: UUID): Promise<FamilyNotification[]> {
    const rows = await this.database.knex(this.tableName)
      .where({ family_member_id: familyMemberId, priority: 'URGENT' })
      .whereNull('read_at')
      .where('status', '!=', 'DISMISSED')
      .where((builder) => {
        builder.whereNull('expires_at').orWhere('expires_at', '>', new Date());
      })
      .orderBy('created_at', 'desc')
      .limit(10);

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async markAsRead(notificationIds: UUID[]): Promise<void> {
    await this.database.knex(this.tableName).whereIn('id', notificationIds).update({
      status: 'READ',
      read_at: new Date(),
    });
  }

  async markAsDismissed(notificationIds: UUID[]): Promise<void> {
    await this.database.knex(this.tableName).whereIn('id', notificationIds).update({
      status: 'DISMISSED',
      dismissed_at: new Date(),
    });
  }

  async markAllAsRead(familyMemberId: UUID): Promise<void> {
    await this.database.knex(this.tableName)
      .where({ family_member_id: familyMemberId })
      .whereNull('read_at')
      .update({
        status: 'READ',
        read_at: new Date(),
      });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.database.knex(this.tableName)
      .where('expires_at', '<', new Date())
      .delete();

    return result;
  }
}
