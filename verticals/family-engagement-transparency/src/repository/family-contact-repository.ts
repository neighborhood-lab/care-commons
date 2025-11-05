/**
 * Family Contact Repository
 *
 * Data access layer for authorized family contacts
 */

import { Repository, Database, UUID, PaginatedResult, PaginationParams } from '@care-commons/core';
import {
  AuthorizedFamilyContact,
  CreateFamilyContactInput,
  UpdateFamilyContactInput,
  FamilyContactSearchCriteria,
  FamilyContactPermissions,
} from '../types/index.js';

export class FamilyContactRepository extends Repository<AuthorizedFamilyContact> {
  constructor(database: Database) {
    super({
      tableName: 'authorized_family_contacts',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): AuthorizedFamilyContact {
    return {
      id: row.id as string,
      clientId: row.client_id as string,
      organizationId: row.organization_id as string,
      firstName: row.first_name as string,
      lastName: row.last_name as string,
      email: row.email as string,
      phone: row.phone as string | undefined,
      relationship: row.relationship as string,
      role: row.role as AuthorizedFamilyContact['role'],
      permissions: (row.permissions as FamilyContactPermissions) || this.getDefaultPermissions(),
      accessLevel: row.access_level as AuthorizedFamilyContact['accessLevel'],
      portalUserId: row.portal_user_id as string | undefined,
      accessCode: row.access_code as string | undefined,
      accessCodeExpiresAt: row.access_code_expires_at ? new Date(row.access_code_expires_at as string) : undefined,
      portalAccessEnabled: row.portal_access_enabled as boolean,
      lastPortalAccessAt: row.last_portal_access_at ? new Date(row.last_portal_access_at as string) : undefined,
      isLegalGuardian: row.is_legal_guardian as boolean,
      consentGiven: row.consent_given as boolean,
      consentDate: row.consent_date ? new Date(row.consent_date as string) : undefined,
      consentMethod: row.consent_method as AuthorizedFamilyContact['consentMethod'],
      consentNotes: row.consent_notes as string | undefined,
      consentDocuments: row.consent_documents as AuthorizedFamilyContact['consentDocuments'],
      notifyByEmail: row.notify_by_email as boolean,
      notifyBySms: row.notify_by_sms as boolean,
      notifyByPush: row.notify_by_push as boolean,
      notificationPreferences: row.notification_preferences as AuthorizedFamilyContact['notificationPreferences'],
      status: row.status as AuthorizedFamilyContact['status'],
      statusNotes: row.status_notes as string | undefined,
      activatedAt: row.activated_at ? new Date(row.activated_at as string) : undefined,
      deactivatedAt: row.deactivated_at ? new Date(row.deactivated_at as string) : undefined,
      deactivatedBy: row.deactivated_by as string | undefined,
      createdAt: new Date(row.created_at as string),
      createdBy: row.created_by as string,
      updatedAt: new Date(row.updated_at as string),
      updatedBy: row.updated_by as string,
      version: row.version as number,
    };
  }

  protected mapEntityToRow(entity: Partial<AuthorizedFamilyContact>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.relationship !== undefined) row.relationship = entity.relationship;
    if (entity.role !== undefined) row.role = entity.role;
    if (entity.permissions !== undefined) row.permissions = JSON.stringify(entity.permissions);
    if (entity.accessLevel !== undefined) row.access_level = entity.accessLevel;
    if (entity.portalUserId !== undefined) row.portal_user_id = entity.portalUserId;
    if (entity.accessCode !== undefined) row.access_code = entity.accessCode;
    if (entity.accessCodeExpiresAt !== undefined) row.access_code_expires_at = entity.accessCodeExpiresAt;
    if (entity.portalAccessEnabled !== undefined) row.portal_access_enabled = entity.portalAccessEnabled;
    if (entity.lastPortalAccessAt !== undefined) row.last_portal_access_at = entity.lastPortalAccessAt;
    if (entity.isLegalGuardian !== undefined) row.is_legal_guardian = entity.isLegalGuardian;
    if (entity.consentGiven !== undefined) row.consent_given = entity.consentGiven;
    if (entity.consentDate !== undefined) row.consent_date = entity.consentDate;
    if (entity.consentMethod !== undefined) row.consent_method = entity.consentMethod;
    if (entity.consentNotes !== undefined) row.consent_notes = entity.consentNotes;
    if (entity.consentDocuments !== undefined) row.consent_documents = JSON.stringify(entity.consentDocuments);
    if (entity.notifyByEmail !== undefined) row.notify_by_email = entity.notifyByEmail;
    if (entity.notifyBySms !== undefined) row.notify_by_sms = entity.notifyBySms;
    if (entity.notifyByPush !== undefined) row.notify_by_push = entity.notifyByPush;
    if (entity.notificationPreferences !== undefined) {
      row.notification_preferences = JSON.stringify(entity.notificationPreferences);
    }
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.statusNotes !== undefined) row.status_notes = entity.statusNotes;
    if (entity.activatedAt !== undefined) row.activated_at = entity.activatedAt;
    if (entity.deactivatedAt !== undefined) row.deactivated_at = entity.deactivatedAt;
    if (entity.deactivatedBy !== undefined) row.deactivated_by = entity.deactivatedBy;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.version !== undefined) row.version = entity.version;

    return row;
  }

  /**
   * Create a new family contact
   */
  async createFamilyContact(
    input: CreateFamilyContactInput,
    createdBy: UUID
  ): Promise<AuthorizedFamilyContact> {
    const permissions = { ...this.getDefaultPermissions(), ...(input.permissions || {}) };

    const query = `
      INSERT INTO authorized_family_contacts (
        id, client_id, organization_id, first_name, last_name, email, phone,
        relationship, role, permissions, access_level, portal_access_enabled,
        is_legal_guardian, consent_given, consent_method, consent_notes,
        notify_by_email, notify_by_sms, notify_by_push, status,
        created_by, updated_by, created_at, updated_at, version
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, 'ACTIVE', $19, $19, NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.clientId,
      input.organizationId,
      input.firstName,
      input.lastName,
      input.email,
      input.phone,
      input.relationship,
      input.role,
      JSON.stringify(permissions),
      input.accessLevel || 'BASIC',
      input.portalAccessEnabled ?? true,
      input.isLegalGuardian ?? false,
      input.consentGiven ?? false,
      input.consentMethod,
      input.consentNotes,
      input.notifyByEmail ?? true,
      input.notifyBySms ?? false,
      input.notifyByPush ?? false,
      createdBy,
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Get family contact by ID
   */
  async getById(id: UUID): Promise<AuthorizedFamilyContact | null> {
    const query = `SELECT * FROM authorized_family_contacts WHERE id = $1`;
    const result = await this.database.query(query, [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Get family contacts for a client
   */
  async getByClientId(clientId: UUID, activeOnly = true): Promise<AuthorizedFamilyContact[]> {
    let query = `SELECT * FROM authorized_family_contacts WHERE client_id = $1`;

    if (activeOnly) {
      query += ` AND status = 'ACTIVE'`;
    }

    query += ` ORDER BY is_legal_guardian DESC, created_at DESC`;

    const result = await this.database.query(query, [clientId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Get family contact by email
   */
  async getByEmail(email: string, organizationId: UUID): Promise<AuthorizedFamilyContact | null> {
    const query = `
      SELECT * FROM authorized_family_contacts
      WHERE email = $1 AND organization_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.database.query(query, [email, organizationId]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Get family contact by access code
   */
  async getByAccessCode(accessCode: string): Promise<AuthorizedFamilyContact | null> {
    const query = `
      SELECT * FROM authorized_family_contacts
      WHERE access_code = $1
        AND portal_access_enabled = true
        AND status = 'ACTIVE'
        AND (access_code_expires_at IS NULL OR access_code_expires_at > NOW())
    `;
    const result = await this.database.query(query, [accessCode]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Update family contact
   */
  async updateFamilyContact(
    id: UUID,
    input: UpdateFamilyContactInput,
    updatedBy: UUID
  ): Promise<AuthorizedFamilyContact> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(input.firstName);
    }
    if (input.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(input.lastName);
    }
    if (input.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(input.email);
    }
    if (input.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(input.phone);
    }
    if (input.relationship !== undefined) {
      updates.push(`relationship = $${paramIndex++}`);
      values.push(input.relationship);
    }
    if (input.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(input.role);
    }
    if (input.permissions !== undefined) {
      updates.push(`permissions = $${paramIndex++}`);
      values.push(JSON.stringify(input.permissions));
    }
    if (input.accessLevel !== undefined) {
      updates.push(`access_level = $${paramIndex++}`);
      values.push(input.accessLevel);
    }
    if (input.portalAccessEnabled !== undefined) {
      updates.push(`portal_access_enabled = $${paramIndex++}`);
      values.push(input.portalAccessEnabled);
    }
    if (input.notifyByEmail !== undefined) {
      updates.push(`notify_by_email = $${paramIndex++}`);
      values.push(input.notifyByEmail);
    }
    if (input.notifyBySms !== undefined) {
      updates.push(`notify_by_sms = $${paramIndex++}`);
      values.push(input.notifyBySms);
    }
    if (input.notifyByPush !== undefined) {
      updates.push(`notify_by_push = $${paramIndex++}`);
      values.push(input.notifyByPush);
    }
    if (input.notificationPreferences !== undefined) {
      updates.push(`notification_preferences = $${paramIndex++}`);
      values.push(JSON.stringify(input.notificationPreferences));
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.statusNotes !== undefined) {
      updates.push(`status_notes = $${paramIndex++}`);
      values.push(input.statusNotes);
    }

    updates.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);
    updates.push(`updated_at = NOW()`);
    updates.push(`version = version + 1`);

    values.push(id);

    const query = `
      UPDATE authorized_family_contacts
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    if (!result.rows[0]) {
      throw new Error(`Family contact with ID ${id} not found`);
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Search family contacts
   */
  async search(
    criteria: FamilyContactSearchCriteria,
    pagination: PaginationParams
  ): Promise<PaginatedResult<AuthorizedFamilyContact>> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (criteria.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      values.push(criteria.organizationId);
    }

    if (criteria.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      values.push(criteria.clientId);
    }

    if (criteria.email) {
      conditions.push(`email ILIKE $${paramIndex++}`);
      values.push(`%${criteria.email}%`);
    }

    if (criteria.role && criteria.role.length > 0) {
      conditions.push(`role = ANY($${paramIndex++})`);
      values.push(criteria.role);
    }

    if (criteria.status && criteria.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      values.push(criteria.status);
    }

    if (criteria.isLegalGuardian !== undefined) {
      conditions.push(`is_legal_guardian = $${paramIndex++}`);
      values.push(criteria.isLegalGuardian);
    }

    if (criteria.portalAccessEnabled !== undefined) {
      conditions.push(`portal_access_enabled = $${paramIndex++}`);
      values.push(criteria.portalAccessEnabled);
    }

    if (criteria.searchText) {
      conditions.push(`(
        first_name ILIKE $${paramIndex} OR
        last_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        relationship ILIKE $${paramIndex}
      )`);
      values.push(`%${criteria.searchText}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `SELECT COUNT(*) FROM authorized_family_contacts ${whereClause}`;
    const countResult = await this.database.query(countQuery, values);
    const total = Number.parseInt(countResult.rows[0].count, 10);

    // Data query
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';

    const dataQuery = `
      SELECT * FROM authorized_family_contacts
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataResult = await this.database.query(dataQuery, [
      ...values,
      pagination.limit,
      offset,
    ]);

    return {
      data: dataResult.rows.map(row => this.mapRowToEntity(row)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrevious: pagination.page > 1,
      },
    };
  }

  /**
   * Update last portal access time
   */
  async updateLastPortalAccess(id: UUID): Promise<void> {
    const query = `
      UPDATE authorized_family_contacts
      SET last_portal_access_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `;
    await this.database.query(query, [id]);
  }

  /**
   * Generate and set access code
   */
  async generateAccessCode(id: UUID, expiresInDays = 90): Promise<string> {
    const accessCode = this.generateRandomCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const query = `
      UPDATE authorized_family_contacts
      SET access_code = $1,
          access_code_expires_at = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING access_code
    `;
    const result = await this.database.query(query, [accessCode, expiresAt, id]);
    return result.rows[0].access_code;
  }

  /**
   * Get default permissions for a family contact
   */
  private getDefaultPermissions(): FamilyContactPermissions {
    return {
      viewProgressNotes: true,
      viewCarePlan: true,
      viewSchedule: true,
      viewMedications: false,
      viewHealthRecords: false,
      viewPhotos: true,
      viewFinancial: false,
      messageCaregiver: true,
      messageCoordinator: true,
      receiveNotifications: true,
      approveScheduleChanges: false,
      requestVisitChanges: false,
      updateContactInfo: true,
      downloadReports: false,
      viewIncidentReports: false,
    };
  }

  /**
   * Generate a random access code
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
