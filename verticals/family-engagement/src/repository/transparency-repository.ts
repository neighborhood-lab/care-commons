/**
 * Transparency repository - data access layer for activity and access logs
 */

import {
  Repository,
  Database,
  PaginatedResult,
} from '@care-commons/core';
import {
  ActivityFeedEntry,
  AccessLogEntry,
  ActivityFeedFilterOptions,
  AccessLogFilterOptions,
  ActorType,
  ActionCategory,
  VisibilityLevel,
  UserType,
  AccessMethod,
} from '../types/transparency.js';

/**
 * Activity Feed Repository
 */
export class ActivityFeedRepository extends Repository<ActivityFeedEntry> {
  constructor(database: Database) {
    super({
      tableName: 'activity_feed',
      database,
      enableAudit: false, // Activity feed is itself an audit
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to ActivityFeedEntry entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): ActivityFeedEntry {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      actorId: row['actor_id'] as string | undefined,
      actorType: row['actor_type'] as ActorType,
      action: row['action'] as string,
      actionCategory: row['action_category'] as ActionCategory,
      resourceType: row['resource_type'] as string,
      resourceId: row['resource_id'] as string,
      resourceDisplayName: row['resource_display_name'] as string | undefined,
      careRecipientId: row['care_recipient_id'] as string | undefined,
      details: JSON.parse((row['details'] as string) || '{}'),
      changes: row['changes'] ? JSON.parse(row['changes'] as string) : undefined,
      visibleToFamily: row['visible_to_family'] as boolean,
      visibilityLevel: row['visibility_level'] as VisibilityLevel,
      ipAddress: row['ip_address'] as string | undefined,
      userAgent: row['user_agent'] as string | undefined,
      metadata: JSON.parse((row['metadata'] as string) || '{}'),
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Map ActivityFeedEntry entity to database row
   */
  protected mapEntityToRow(entity: Partial<ActivityFeedEntry>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.actorId !== undefined) row['actor_id'] = entity.actorId;
    if (entity.actorType !== undefined) row['actor_type'] = entity.actorType;
    if (entity.action !== undefined) row['action'] = entity.action;
    if (entity.actionCategory !== undefined) row['action_category'] = entity.actionCategory;
    if (entity.resourceType !== undefined) row['resource_type'] = entity.resourceType;
    if (entity.resourceId !== undefined) row['resource_id'] = entity.resourceId;
    if (entity.resourceDisplayName !== undefined) row['resource_display_name'] = entity.resourceDisplayName;
    if (entity.careRecipientId !== undefined) row['care_recipient_id'] = entity.careRecipientId;
    if (entity.details !== undefined) row['details'] = JSON.stringify(entity.details);
    if (entity.changes !== undefined) row['changes'] = JSON.stringify(entity.changes);
    if (entity.visibleToFamily !== undefined) row['visible_to_family'] = entity.visibleToFamily;
    if (entity.visibilityLevel !== undefined) row['visibility_level'] = entity.visibilityLevel;
    if (entity.ipAddress !== undefined) row['ip_address'] = entity.ipAddress;
    if (entity.userAgent !== undefined) row['user_agent'] = entity.userAgent;
    if (entity.metadata !== undefined) row['metadata'] = JSON.stringify(entity.metadata);

    return row;
  }

  /**
   * Find activity feed entries by filters
   */
  async findByFilters(
    filters: ActivityFeedFilterOptions
  ): Promise<PaginatedResult<ActivityFeedEntry>> {
    const qb = this.database.queryBuilder();
    qb.select('*').from(this.tableName);

    // Apply filters
    if (filters.organizationId) {
      qb.where('organization_id', '=', filters.organizationId);
    }

    if (filters.actorId) {
      qb.where('actor_id', '=', filters.actorId);
    }

    if (filters.careRecipientId) {
      qb.where('care_recipient_id', '=', filters.careRecipientId);
    }

    if (filters.actionCategory) {
      qb.where('action_category', '=', filters.actionCategory);
    }

    if (filters.resourceType) {
      qb.where('resource_type', '=', filters.resourceType);
    }

    if (filters.resourceId) {
      qb.where('resource_id', '=', filters.resourceId);
    }

    if (filters.visibilityLevel) {
      qb.where('visibility_level', '=', filters.visibilityLevel);
    }

    if (filters.visibleToFamilyOnly) {
      qb.where('visible_to_family', '=', true);
    }

    if (filters.startDate) {
      qb.where('created_at', '>=', filters.startDate);
    }

    if (filters.endDate) {
      qb.where('created_at', '<=', filters.endDate);
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
}

/**
 * Access Log Repository
 */
export class AccessLogRepository extends Repository<AccessLogEntry> {
  constructor(database: Database) {
    super({
      tableName: 'access_logs',
      database,
      enableAudit: false, // Access logs are themselves audit records
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to AccessLogEntry entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): AccessLogEntry {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      userId: row['user_id'] as string,
      userType: row['user_type'] as UserType,
      userDisplayName: row['user_display_name'] as string | undefined,
      resourceType: row['resource_type'] as string,
      resourceId: row['resource_id'] as string,
      resourceDisplayName: row['resource_display_name'] as string | undefined,
      accessedAt: row['accessed_at'] as Date,
      accessMethod: row['access_method'] as AccessMethod,
      action: row['action'] as string,
      purpose: row['purpose'] as string | undefined,
      authorizationType: row['authorization_type'] as string | undefined,
      careRecipientId: row['care_recipient_id'] as string | undefined,
      ipAddress: row['ip_address'] as string | undefined,
      userAgent: row['user_agent'] as string | undefined,
      metadata: JSON.parse((row['metadata'] as string) || '{}'),
      isPatientAccess: row['is_patient_access'] as boolean,
      isEmergencyAccess: row['is_emergency_access'] as boolean,
      requiresDisclosure: row['requires_disclosure'] as boolean,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
    };
  }

  /**
   * Map AccessLogEntry entity to database row
   */
  protected mapEntityToRow(entity: Partial<AccessLogEntry>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.userId !== undefined) row['user_id'] = entity.userId;
    if (entity.userType !== undefined) row['user_type'] = entity.userType;
    if (entity.userDisplayName !== undefined) row['user_display_name'] = entity.userDisplayName;
    if (entity.resourceType !== undefined) row['resource_type'] = entity.resourceType;
    if (entity.resourceId !== undefined) row['resource_id'] = entity.resourceId;
    if (entity.resourceDisplayName !== undefined) row['resource_display_name'] = entity.resourceDisplayName;
    if (entity.accessedAt !== undefined) row['accessed_at'] = entity.accessedAt;
    if (entity.accessMethod !== undefined) row['access_method'] = entity.accessMethod;
    if (entity.action !== undefined) row['action'] = entity.action;
    if (entity.purpose !== undefined) row['purpose'] = entity.purpose;
    if (entity.authorizationType !== undefined) row['authorization_type'] = entity.authorizationType;
    if (entity.careRecipientId !== undefined) row['care_recipient_id'] = entity.careRecipientId;
    if (entity.ipAddress !== undefined) row['ip_address'] = entity.ipAddress;
    if (entity.userAgent !== undefined) row['user_agent'] = entity.userAgent;
    if (entity.metadata !== undefined) row['metadata'] = JSON.stringify(entity.metadata);
    if (entity.isPatientAccess !== undefined) row['is_patient_access'] = entity.isPatientAccess;
    if (entity.isEmergencyAccess !== undefined) row['is_emergency_access'] = entity.isEmergencyAccess;
    if (entity.requiresDisclosure !== undefined) row['requires_disclosure'] = entity.requiresDisclosure;

    return row;
  }

  /**
   * Find access logs by filters
   */
  async findByFilters(
    filters: AccessLogFilterOptions
  ): Promise<PaginatedResult<AccessLogEntry>> {
    const qb = this.database.queryBuilder();
    qb.select('*').from(this.tableName);

    // Apply filters
    if (filters.organizationId) {
      qb.where('organization_id', '=', filters.organizationId);
    }

    if (filters.userId) {
      qb.where('user_id', '=', filters.userId);
    }

    if (filters.careRecipientId) {
      qb.where('care_recipient_id', '=', filters.careRecipientId);
    }

    if (filters.userType) {
      qb.where('user_type', '=', filters.userType);
    }

    if (filters.resourceType) {
      qb.where('resource_type', '=', filters.resourceType);
    }

    if (filters.resourceId) {
      qb.where('resource_id', '=', filters.resourceId);
    }

    if (filters.accessMethod) {
      qb.where('access_method', '=', filters.accessMethod);
    }

    if (filters.requiresDisclosure !== undefined) {
      qb.where('requires_disclosure', '=', filters.requiresDisclosure);
    }

    if (filters.isEmergencyAccess !== undefined) {
      qb.where('is_emergency_access', '=', filters.isEmergencyAccess);
    }

    if (filters.startDate) {
      qb.where('accessed_at', '>=', filters.startDate);
    }

    if (filters.endDate) {
      qb.where('accessed_at', '<=', filters.endDate);
    }

    // Ordering
    qb.orderBy('accessed_at', 'DESC');

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows, countResult] = await Promise.all([
      qb.limit(limit).offset(offset).execute(),
      this.database.queryBuilder()
        .count('* as count')
        .from(this.tableName)
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
   * Get HIPAA disclosure report
   */
  async getHipaaDisclosureReport(
    careRecipientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccessLogEntry[]> {
    const rows = await this.database.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where('care_recipient_id', '=', careRecipientId)
      .where('requires_disclosure', '=', true)
      .where('accessed_at', '>=', startDate)
      .where('accessed_at', '<=', endDate)
      .orderBy('accessed_at', 'DESC')
      .execute();

    return rows.map((row) => this.mapRowToEntity(row));
  }
}
