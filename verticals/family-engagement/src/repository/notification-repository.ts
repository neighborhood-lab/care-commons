import { Repository, type Database, type PaginatedResult } from '@care-commons/core';
import type { FamilyNotification, NotificationSearchFilter } from '../types/family.js';

export class NotificationRepository extends Repository<FamilyNotification> {
  constructor(database: Database) {
    super({
      tableName: 'family_notifications',
      database,
      enableAudit: false, // Notifications don't need revision history
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): FamilyNotification {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      familyMemberId: row.family_member_id as string,
      clientId: row.client_id as string,

      notificationType: row.notification_type as FamilyNotification['notificationType'],
      channel: row.channel as FamilyNotification['channel'],

      subject: row.subject as string | undefined,
      message: row.message as string,
      metadata: row.metadata as Record<string, any> | undefined,

      status: row.status as FamilyNotification['status'],
      sentAt: row.sent_at ? new Date(row.sent_at as string) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at as string) : undefined,
      readAt: row.read_at ? new Date(row.read_at as string) : undefined,
      failedReason: row.failed_reason as string | undefined,

      externalId: row.external_id as string | undefined,

      createdAt: new Date(row.created_at as string),
      createdBy: '', // Not tracked for notifications
      updatedAt: new Date(row.created_at as string), // Use created_at as updated_at
      updatedBy: '', // Not tracked
      version: 1,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyNotification>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.notificationType !== undefined) row.notification_type = entity.notificationType;
    if (entity.channel !== undefined) row.channel = entity.channel;
    if (entity.subject !== undefined) row.subject = entity.subject;
    if (entity.message !== undefined) row.message = entity.message;
    if (entity.metadata !== undefined) row.metadata = JSON.stringify(entity.metadata);
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.sentAt !== undefined) row.sent_at = entity.sentAt;
    if (entity.deliveredAt !== undefined) row.delivered_at = entity.deliveredAt;
    if (entity.readAt !== undefined) row.read_at = entity.readAt;
    if (entity.failedReason !== undefined) row.failed_reason = entity.failedReason;
    if (entity.externalId !== undefined) row.external_id = entity.externalId;

    return row;
  }

  /**
   * Search notifications with filters
   */
  async search(
    filter: NotificationSearchFilter,
    page = 1,
    limit = 50
  ): Promise<PaginatedResult<FamilyNotification>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter.familyMemberId) {
      conditions.push(`family_member_id = $${paramIndex++}`);
      params.push(filter.familyMemberId);
    }

    if (filter.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      params.push(filter.clientId);
    }

    if (filter.notificationType) {
      conditions.push(`notification_type = $${paramIndex++}`);
      params.push(filter.notificationType);
    }

    if (filter.channel) {
      conditions.push(`channel = $${paramIndex++}`);
      params.push(filter.channel);
    }

    if (filter.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filter.status);
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
   * Update notification status
   */
  async updateStatus(
    id: string,
    status: FamilyNotification['status'],
    externalId?: string,
    failedReason?: string
  ): Promise<void> {
    const updates: string[] = [`status = $2`];
    const params: unknown[] = [id, status];
    let paramIndex = 3;

    if (status === 'SENT' || status === 'DELIVERED') {
      updates.push(`sent_at = NOW()`);
    }

    if (status === 'DELIVERED') {
      updates.push(`delivered_at = NOW()`);
    }

    if (externalId) {
      updates.push(`external_id = $${paramIndex++}`);
      params.push(externalId);
    }

    if (failedReason) {
      updates.push(`failed_reason = $${paramIndex++}`);
      params.push(failedReason);
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${updates.join(', ')}
      WHERE id = $1
    `;
    await this.database.query(query, params);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'READ', read_at = NOW()
      WHERE id = $1
    `;
    await this.database.query(query, [id]);
  }

  /**
   * Get pending notifications (for retry logic)
   */
  async getPending(limit = 100): Promise<FamilyNotification[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'PENDING'
      ORDER BY created_at
      LIMIT $1
    `;
    const result = await this.database.query(query, [limit]);
    return result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>));
  }
}
