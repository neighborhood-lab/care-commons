/**
 * Family Portal repository - data access layer
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import {
  FamilyMember,
  FamilyMemberStatus,
  FamilyClientAccess,
  PortalActivityLog,
  FamilyInvitation,
} from '../types/portal.js';

export class FamilyMemberRepository extends Repository<FamilyMember> {
  constructor(database: Database) {
    super({
      tableName: 'family_members',
      database,
      enableAudit: false, // Custom audit fields
      enableSoftDelete: true,
    });
  }

  /**
   * Map database row to FamilyMember entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyMember {
    return {
      id: row['id'] as string,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      email: row['email'] as string,
      phoneNumber: row['phone_number'] as string | undefined,
      authProviderId: row['auth_provider_id'] as string | undefined,
      emailVerified: row['email_verified'] as boolean,
      emailVerifiedAt: row['email_verified_at'] as Date | undefined,
      status: row['status'] as FamilyMemberStatus,
      lastLoginAt: row['last_login_at'] as Date | undefined,
      invitedAt: row['invited_at'] as Date | undefined,
      invitedBy: row['invited_by'] as string | undefined,
      acceptedAt: row['accepted_at'] as Date | undefined,
      preferredLanguage: row['preferred_language'] as string | undefined,
      timezone: row['timezone'] as string | undefined,
      notificationPreferences: JSON.parse(row['notification_preferences'] as string),
      twoFactorEnabled: row['two_factor_enabled'] as boolean,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
      deletedAt: row['deleted_at'] as Date | undefined,
    };
  }

  /**
   * Find family member by email
   */
  async findByEmail(email: string): Promise<FamilyMember | null> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_members WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  /**
   * Find family member by auth provider ID
   */
  async findByAuthProviderId(authProviderId: string): Promise<FamilyMember | null> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_members WHERE auth_provider_id = $1 AND deleted_at IS NULL`,
      [authProviderId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  /**
   * Find family members by status
   */
  async findByStatus(status: FamilyMemberStatus): Promise<FamilyMember[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_members WHERE status = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [status]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.database.query(
      `UPDATE family_members SET last_login_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  /**
   * Get family members for a client
   */
  async findByClientId(clientId: string): Promise<FamilyMember[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT fm.* FROM family_members fm
       INNER JOIN family_client_access fca ON fm.id = fca.family_member_id
       WHERE fca.client_id = $1
         AND fca.status = 'ACTIVE'
         AND fm.deleted_at IS NULL
       ORDER BY fca.is_primary_contact DESC, fm.last_name, fm.first_name`,
      [clientId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }
}

export class FamilyClientAccessRepository extends Repository<FamilyClientAccess> {
  constructor(database: Database) {
    super({
      tableName: 'family_client_access',
      database,
      enableAudit: false, // Custom audit fields
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to FamilyClientAccess entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyClientAccess {
    return {
      id: row['id'] as string,
      familyMemberId: row['family_member_id'] as string,
      clientId: row['client_id'] as string,
      relationshipType: row['relationship_type'] as any,
      isPrimaryContact: row['is_primary_contact'] as boolean,
      permissions: JSON.parse(row['permissions'] as string),
      consentStatus: row['consent_status'] as any,
      consentDate: row['consent_date'] as Date | undefined,
      consentFormId: row['consent_form_id'] as string | undefined,
      legalAuthority: row['legal_authority'] as any | undefined,
      status: row['status'] as any,
      grantedAt: row['granted_at'] as Date,
      grantedBy: row['granted_by'] as string,
      revokedAt: row['revoked_at'] as Date | undefined,
      revokedBy: row['revoked_by'] as string | undefined,
      revokedReason: row['revoked_reason'] as string | undefined,
      lastAccessedAt: row['last_accessed_at'] as Date | undefined,
      accessCount: row['access_count'] as number,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  /**
   * Find access record by family member and client
   */
  async findByFamilyMemberAndClient(
    familyMemberId: string,
    clientId: string
  ): Promise<FamilyClientAccess | null> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_client_access
       WHERE family_member_id = $1 AND client_id = $2`,
      [familyMemberId, clientId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  /**
   * Get all clients accessible by a family member
   */
  async findClientsByFamilyMember(familyMemberId: string): Promise<FamilyClientAccess[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_client_access
       WHERE family_member_id = $1 AND status = 'ACTIVE'
       ORDER BY is_primary_contact DESC, created_at ASC`,
      [familyMemberId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get all family members for a client
   */
  async findFamilyMembersByClient(clientId: string): Promise<FamilyClientAccess[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_client_access
       WHERE client_id = $1 AND status = 'ACTIVE'
       ORDER BY is_primary_contact DESC, created_at ASC`,
      [clientId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Revoke access
   */
  async revokeAccess(
    id: string,
    revokedBy: string,
    reason: string
  ): Promise<void> {
    await this.database.query(
      `UPDATE family_client_access
       SET status = 'REVOKED',
           revoked_at = NOW(),
           revoked_by = $2,
           revoked_reason = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [id, revokedBy, reason]
    );
  }

  /**
   * Track access
   */
  async trackAccess(id: string): Promise<void> {
    await this.database.query(
      `UPDATE family_client_access
       SET last_accessed_at = NOW(),
           access_count = access_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Check if family member has permission
   */
  async hasPermission(
    familyMemberId: string,
    clientId: string,
    permission: string
  ): Promise<boolean> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT permissions->>$3 as has_permission
       FROM family_client_access
       WHERE family_member_id = $1
         AND client_id = $2
         AND status = 'ACTIVE'`,
      [familyMemberId, clientId, permission]
    );
    return rows.length > 0 && rows[0]['has_permission'] === 'true';
  }
}

export class PortalActivityLogRepository extends Repository<PortalActivityLog> {
  constructor(database: Database) {
    super({
      tableName: 'portal_activity_log',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to PortalActivityLog entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): PortalActivityLog {
    return {
      id: row['id'] as string,
      familyMemberId: row['family_member_id'] as string,
      clientId: row['client_id'] as string,
      activityType: row['activity_type'] as any,
      resourceType: row['resource_type'] as string,
      resourceId: row['resource_id'] as string | undefined,
      action: row['action'] as any,
      description: row['description'] as string,
      metadata: row['metadata'] ? JSON.parse(row['metadata'] as string) : undefined,
      occurredAt: row['occurred_at'] as Date,
      ipAddress: row['ip_address'] as string | undefined,
      userAgent: row['user_agent'] as string | undefined,
      deviceInfo: row['device_info'] ? JSON.parse(row['device_info'] as string) : undefined,
      isPHIAccess: row['is_phi_access'] as boolean,
      phiDisclosureType: row['phi_disclosure_type'] as string | undefined,
    };
  }

  /**
   * Get activity log for family member
   */
  async findByFamilyMember(
    familyMemberId: string,
    limit = 100,
    offset = 0
  ): Promise<PortalActivityLog[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM portal_activity_log
       WHERE family_member_id = $1
       ORDER BY occurred_at DESC
       LIMIT $2 OFFSET $3`,
      [familyMemberId, limit, offset]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get PHI access log for audit
   */
  async findPHIAccessLog(
    clientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PortalActivityLog[]> {
    const params: any[] = [clientId];
    let query = `SELECT * FROM portal_activity_log
                 WHERE client_id = $1 AND is_phi_access = true`;

    if (startDate) {
      params.push(startDate);
      query += ` AND occurred_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND occurred_at <= $${params.length}`;
    }

    query += ` ORDER BY occurred_at DESC`;

    const rows = await this.database.query<Record<string, unknown>>(query, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get activity by date range
   */
  async findByDateRange(
    familyMemberId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PortalActivityLog[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM portal_activity_log
       WHERE family_member_id = $1
         AND occurred_at >= $2
         AND occurred_at <= $3
       ORDER BY occurred_at DESC`,
      [familyMemberId, startDate, endDate]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }
}

export class FamilyInvitationRepository extends Repository<FamilyInvitation> {
  constructor(database: Database) {
    super({
      tableName: 'family_invitations',
      database,
      enableAudit: false,
      enableSoftDelete: false,
    });
  }

  /**
   * Map database row to FamilyInvitation entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyInvitation {
    return {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      email: row['email'] as string,
      relationshipType: row['relationship_type'] as any,
      permissions: JSON.parse(row['permissions'] as string),
      invitedBy: row['invited_by'] as string,
      invitedAt: row['invited_at'] as Date,
      expiresAt: row['expires_at'] as Date,
      token: row['token'] as string,
      status: row['status'] as any,
    };
  }

  /**
   * Find invitation by token
   */
  async findByToken(token: string): Promise<FamilyInvitation | null> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_invitations WHERE token = $1`,
      [token]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  /**
   * Find pending invitations by email
   */
  async findPendingByEmail(email: string): Promise<FamilyInvitation[]> {
    const rows = await this.database.query<Record<string, unknown>>(
      `SELECT * FROM family_invitations
       WHERE email = $1 AND status = 'PENDING' AND expires_at > NOW()
       ORDER BY invited_at DESC`,
      [email]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Mark invitation as accepted
   */
  async markAsAccepted(id: string): Promise<void> {
    await this.database.query(
      `UPDATE family_invitations SET status = 'ACCEPTED' WHERE id = $1`,
      [id]
    );
  }

  /**
   * Expire old invitations
   */
  async expireOldInvitations(): Promise<number> {
    const result = await this.database.query(
      `UPDATE family_invitations
       SET status = 'EXPIRED'
       WHERE status = 'PENDING' AND expires_at < NOW()`
    );
    return result.length;
  }
}
