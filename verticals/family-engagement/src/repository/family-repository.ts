/**
 * Family member repository - data access layer
 */

import {
  Repository,
  Database,
  PaginatedResult,
} from '@care-commons/core';
import {
  FamilyMember,
  FamilyAccessRule,
  FamilyMemberFilterOptions,
  FamilyAccessLevel,
  InvitationStatus,
  FamilyMemberStatus,
  ResourceType,
  Permission,
} from '../types/family.js';

/**
 * Family Member Repository
 */
export class FamilyMemberRepository extends Repository<FamilyMember> {
  constructor(database: Database) {
    super({
      tableName: 'family_members',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to FamilyMember entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyMember {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      careRecipientId: row['care_recipient_id'] as string,
      userId: row['user_id'] as string | undefined,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      email: row['email'] as string,
      phone: row['phone'] as string | undefined,
      relationship: row['relationship'] as string,
      accessLevel: row['access_level'] as FamilyAccessLevel,
      permissions: JSON.parse((row['permissions'] as string) || '{}'),
      isPrimaryContact: row['is_primary_contact'] as boolean,
      isEmergencyContact: row['is_emergency_contact'] as boolean,
      invitationStatus: row['invitation_status'] as InvitationStatus,
      invitationToken: row['invitation_token'] as string | undefined,
      invitationSentAt: row['invitation_sent_at'] as Date | undefined,
      invitationExpiresAt: row['invitation_expires_at'] as Date | undefined,
      invitationAcceptedAt: row['invitation_accepted_at'] as Date | undefined,
      hipaaAuthorizationSigned: row['hipaa_authorization_signed'] as boolean,
      hipaaAuthorizationDate: row['hipaa_authorization_date'] as Date | undefined,
      hipaaAuthorizationDocumentId: row['hipaa_authorization_document_id'] as string | undefined,
      consentPreferences: JSON.parse((row['consent_preferences'] as string) || '{}'),
      status: row['status'] as FamilyMemberStatus,
      deactivatedAt: row['deactivated_at'] as Date | undefined,
      deactivatedBy: row['deactivated_by'] as string | undefined,
      deactivationReason: row['deactivation_reason'] as string | undefined,
      notificationPreferences: JSON.parse((row['notification_preferences'] as string) || '{}'),
      emailNotificationsEnabled: row['email_notifications_enabled'] as boolean,
      smsNotificationsEnabled: row['sms_notifications_enabled'] as boolean,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Map FamilyMember entity to database row
   */
  protected mapEntityToRow(entity: Partial<FamilyMember>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.careRecipientId !== undefined) row['care_recipient_id'] = entity.careRecipientId;
    if (entity.userId !== undefined) row['user_id'] = entity.userId;
    if (entity.firstName !== undefined) row['first_name'] = entity.firstName;
    if (entity.lastName !== undefined) row['last_name'] = entity.lastName;
    if (entity.email !== undefined) row['email'] = entity.email;
    if (entity.phone !== undefined) row['phone'] = entity.phone;
    if (entity.relationship !== undefined) row['relationship'] = entity.relationship;
    if (entity.accessLevel !== undefined) row['access_level'] = entity.accessLevel;
    if (entity.permissions !== undefined) row['permissions'] = JSON.stringify(entity.permissions);
    if (entity.isPrimaryContact !== undefined) row['is_primary_contact'] = entity.isPrimaryContact;
    if (entity.isEmergencyContact !== undefined) row['is_emergency_contact'] = entity.isEmergencyContact;
    if (entity.invitationStatus !== undefined) row['invitation_status'] = entity.invitationStatus;
    if (entity.invitationToken !== undefined) row['invitation_token'] = entity.invitationToken;
    if (entity.invitationSentAt !== undefined) row['invitation_sent_at'] = entity.invitationSentAt;
    if (entity.invitationExpiresAt !== undefined) row['invitation_expires_at'] = entity.invitationExpiresAt;
    if (entity.invitationAcceptedAt !== undefined) row['invitation_accepted_at'] = entity.invitationAcceptedAt;
    if (entity.hipaaAuthorizationSigned !== undefined) {
      row['hipaa_authorization_signed'] = entity.hipaaAuthorizationSigned;
    }
    if (entity.hipaaAuthorizationDate !== undefined) {
      row['hipaa_authorization_date'] = entity.hipaaAuthorizationDate;
    }
    if (entity.hipaaAuthorizationDocumentId !== undefined) {
      row['hipaa_authorization_document_id'] = entity.hipaaAuthorizationDocumentId;
    }
    if (entity.consentPreferences !== undefined) {
      row['consent_preferences'] = JSON.stringify(entity.consentPreferences);
    }
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.deactivatedAt !== undefined) row['deactivated_at'] = entity.deactivatedAt;
    if (entity.deactivatedBy !== undefined) row['deactivated_by'] = entity.deactivatedBy;
    if (entity.deactivationReason !== undefined) row['deactivation_reason'] = entity.deactivationReason;
    if (entity.notificationPreferences !== undefined) {
      row['notification_preferences'] = JSON.stringify(entity.notificationPreferences);
    }
    if (entity.emailNotificationsEnabled !== undefined) {
      row['email_notifications_enabled'] = entity.emailNotificationsEnabled;
    }
    if (entity.smsNotificationsEnabled !== undefined) {
      row['sms_notifications_enabled'] = entity.smsNotificationsEnabled;
    }

    return row;
  }

  /**
   * Find family members by filters
   */
  async findByFilters(
    filters: FamilyMemberFilterOptions
  ): Promise<PaginatedResult<FamilyMember>> {
    const qb = this.database.queryBuilder();
    qb.select('*').from(this.tableName);

    // Apply filters
    if (filters.careRecipientId) {
      qb.where('care_recipient_id', '=', filters.careRecipientId);
    }

    if (filters.organizationId) {
      qb.where('organization_id', '=', filters.organizationId);
    }

    if (filters.status) {
      qb.where('status', '=', filters.status);
    }

    if (filters.accessLevel) {
      qb.where('access_level', '=', filters.accessLevel);
    }

    if (filters.isPrimaryContact !== undefined) {
      qb.where('is_primary_contact', '=', filters.isPrimaryContact);
    }

    if (filters.isEmergencyContact !== undefined) {
      qb.where('is_emergency_contact', '=', filters.isEmergencyContact);
    }

    if (filters.search) {
      qb.where((builder) => {
        builder
          .where('first_name', 'ilike', `%${filters.search}%`)
          .orWhere('last_name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`);
      });
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

  /**
   * Find by invitation token
   */
  async findByInvitationToken(token: string): Promise<FamilyMember | null> {
    const rows = await this.database.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where('invitation_token', '=', token)
      .limit(1)
      .execute();

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find by email and care recipient
   */
  async findByEmailAndCareRecipient(
    email: string,
    careRecipientId: string
  ): Promise<FamilyMember | null> {
    const rows = await this.database.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where('email', '=', email)
      .where('care_recipient_id', '=', careRecipientId)
      .limit(1)
      .execute();

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Find primary contact for care recipient
   */
  async findPrimaryContact(careRecipientId: string): Promise<FamilyMember | null> {
    const rows = await this.database.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where('care_recipient_id', '=', careRecipientId)
      .where('is_primary_contact', '=', true)
      .where('status', '=', 'ACTIVE')
      .limit(1)
      .execute();

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }
}

/**
 * Family Access Rule Repository
 */
export class FamilyAccessRuleRepository extends Repository<FamilyAccessRule> {
  constructor(database: Database) {
    super({
      tableName: 'family_access_rules',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to FamilyAccessRule entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyAccessRule {
    return {
      id: row['id'] as string,
      familyMemberId: row['family_member_id'] as string,
      organizationId: row['organization_id'] as string,
      resourceType: row['resource_type'] as ResourceType,
      permission: row['permission'] as Permission,
      allowed: row['allowed'] as boolean,
      conditions: JSON.parse((row['conditions'] as string) || '{}'),
      effectiveFrom: row['effective_from'] as Date | undefined,
      effectiveUntil: row['effective_until'] as Date | undefined,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Map FamilyAccessRule entity to database row
   */
  protected mapEntityToRow(entity: Partial<FamilyAccessRule>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.familyMemberId !== undefined) row['family_member_id'] = entity.familyMemberId;
    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.resourceType !== undefined) row['resource_type'] = entity.resourceType;
    if (entity.permission !== undefined) row['permission'] = entity.permission;
    if (entity.allowed !== undefined) row['allowed'] = entity.allowed;
    if (entity.conditions !== undefined) row['conditions'] = JSON.stringify(entity.conditions);
    if (entity.effectiveFrom !== undefined) row['effective_from'] = entity.effectiveFrom;
    if (entity.effectiveUntil !== undefined) row['effective_until'] = entity.effectiveUntil;

    return row;
  }

  /**
   * Find access rules for family member
   */
  async findByFamilyMember(familyMemberId: string): Promise<FamilyAccessRule[]> {
    const rows = await this.database.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where('family_member_id', '=', familyMemberId)
      .execute();

    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find specific access rule
   */
  async findRule(
    familyMemberId: string,
    resourceType: ResourceType,
    permission: Permission
  ): Promise<FamilyAccessRule | null> {
    const rows = await this.database.queryBuilder()
      .select('*')
      .from(this.tableName)
      .where('family_member_id', '=', familyMemberId)
      .where('resource_type', '=', resourceType)
      .where('permission', '=', permission)
      .limit(1)
      .execute();

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Check if access is allowed
   */
  async checkAccess(
    familyMemberId: string,
    resourceType: ResourceType,
    permission: Permission
  ): Promise<boolean> {
    const rule = await this.findRule(familyMemberId, resourceType, permission);

    if (!rule) {
      return false; // Default deny
    }

    // Check time-based conditions
    const now = new Date();
    if (rule.effectiveFrom && rule.effectiveFrom > now) {
      return false;
    }
    if (rule.effectiveUntil && rule.effectiveUntil < now) {
      return false;
    }

    return rule.allowed;
  }
}
