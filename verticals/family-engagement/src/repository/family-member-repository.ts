import { Repository, type Database, type PaginatedResult } from '@care-commons/core';
import type {
  FamilyMember,
  FamilyMemberSearchFilter,
  NotificationPreferences,
  FamilyPermissions,
} from '../types/family.js';

export class FamilyMemberRepository extends Repository<FamilyMember> {
  constructor(database: Database) {
    super({
      tableName: 'family_members',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): FamilyMember {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      clientId: row.client_id as string,

      firstName: row.first_name as string,
      lastName: row.last_name as string,
      relationship: row.relationship as FamilyMember['relationship'],

      phone: row.phone as string | undefined,
      email: row.email as string | undefined,
      preferredContactMethod: row.preferred_contact_method as FamilyMember['preferredContactMethod'],

      portalAccessEnabled: row.portal_access_enabled as boolean,
      portalUsername: row.portal_username as string | undefined,
      portalPasswordHash: row.portal_password_hash as string | undefined,
      portalLastLogin: row.portal_last_login ? new Date(row.portal_last_login as string) : undefined,

      notificationPreferences: row.notification_preferences as NotificationPreferences,
      permissions: row.permissions as FamilyPermissions,

      status: row.status as FamilyMember['status'],
      isPrimaryContact: row.is_primary_contact as boolean,
      isEmergencyContact: row.is_emergency_contact as boolean,

      createdAt: new Date(row.created_at as string),
      createdBy: row.created_by as string,
      updatedAt: new Date(row.updated_at as string),
      updatedBy: row.updated_by as string,
      version: row.version as number,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyMember>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.relationship !== undefined) row.relationship = entity.relationship;
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.preferredContactMethod !== undefined) row.preferred_contact_method = entity.preferredContactMethod;
    if (entity.portalAccessEnabled !== undefined) row.portal_access_enabled = entity.portalAccessEnabled;
    if (entity.portalUsername !== undefined) row.portal_username = entity.portalUsername;
    if (entity.portalPasswordHash !== undefined) row.portal_password_hash = entity.portalPasswordHash;
    if (entity.portalLastLogin !== undefined) row.portal_last_login = entity.portalLastLogin;
    if (entity.notificationPreferences !== undefined) row.notification_preferences = JSON.stringify(entity.notificationPreferences);
    if (entity.permissions !== undefined) row.permissions = JSON.stringify(entity.permissions);
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.isPrimaryContact !== undefined) row.is_primary_contact = entity.isPrimaryContact;
    if (entity.isEmergencyContact !== undefined) row.is_emergency_contact = entity.isEmergencyContact;

    return row;
  }

  /**
   * Search family members with filters
   */
  async search(
    filter: FamilyMemberSearchFilter,
    page = 1,
    limit = 50
  ): Promise<PaginatedResult<FamilyMember>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (this.enableSoftDelete) {
      conditions.push('deleted_at IS NULL');
    }

    if (filter.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      params.push(filter.clientId);
    }

    if (filter.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filter.status);
    }

    if (filter.portalAccessEnabled !== undefined) {
      conditions.push(`portal_access_enabled = $${paramIndex++}`);
      params.push(filter.portalAccessEnabled);
    }

    if (filter.isPrimaryContact !== undefined) {
      conditions.push(`is_primary_contact = $${paramIndex++}`);
      params.push(filter.isPrimaryContact);
    }

    if (filter.isEmergencyContact !== undefined) {
      conditions.push(`is_emergency_contact = $${paramIndex++}`);
      params.push(filter.isEmergencyContact);
    }

    if (filter.searchTerm) {
      conditions.push(`(
        first_name ILIKE $${paramIndex} OR
        last_name ILIKE $${paramIndex} OR
        phone ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex}
      )`);
      params.push(`%${filter.searchTerm}%`);
      paramIndex++;
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
   * Find family members by client ID
   */
  async findByClientId(clientId: string): Promise<FamilyMember[]> {
    const whereClause = this.enableSoftDelete
      ? 'WHERE client_id = $1 AND deleted_at IS NULL'
      : 'WHERE client_id = $1';

    const query = `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY is_primary_contact DESC, created_at`;
    const result = await this.database.query(query, [clientId]);

    return result.rows.map((row) => this.mapRowToEntity(row as Record<string, unknown>));
  }

  /**
   * Find family member by portal username
   */
  async findByPortalUsername(username: string): Promise<FamilyMember | null> {
    const whereClause = this.enableSoftDelete
      ? 'WHERE portal_username = $1 AND portal_access_enabled = true AND deleted_at IS NULL'
      : 'WHERE portal_username = $1 AND portal_access_enabled = true';

    const query = `SELECT * FROM ${this.tableName} ${whereClause}`;
    const result = await this.database.query(query, [username]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Find family member by phone number
   */
  async findByPhone(phone: string): Promise<FamilyMember | null> {
    const whereClause = this.enableSoftDelete
      ? 'WHERE phone = $1 AND deleted_at IS NULL'
      : 'WHERE phone = $1';

    const query = `SELECT * FROM ${this.tableName} ${whereClause}`;
    const result = await this.database.query(query, [phone]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Update portal last login
   */
  async updatePortalLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET portal_last_login = NOW()
      WHERE id = $1
    `;
    await this.database.query(query, [id]);
  }
}
