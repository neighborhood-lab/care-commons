/**
 * Family Member Provider Interface and Implementation
 *
 * Provides family member data access for all verticals.
 * Decouples services from direct database queries.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable sonarjs/no-nested-conditional */

import { Database } from '../db/connection.js';
import type { UUID } from '../types/base.js';

/**
 * Family Member data structure for cross-vertical use
 */
export interface FamilyMember {
  id: UUID;
  clientId: UUID;
  organizationId: UUID;
  branchId: UUID;

  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;

  // Relationship
  relationship: string;
  relationshipNote?: string | null;
  isPrimaryContact: boolean;

  // Portal access
  portalAccessLevel: string;
  accessGrantedBy: UUID;
  accessGrantedAt: Date;
  accessExpiresAt?: Date | null;

  // Status
  status: string;
  invitationStatus: string;
  invitationSentAt?: Date | null;
  invitationAcceptedAt?: Date | null;

  // Preferences
  receiveNotifications: boolean;
  notificationPreferences?: Record<string, unknown>;
  preferredContactMethod: string;

  // Security
  lastLoginAt?: Date | null;
  passwordResetRequired: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Filters for querying family members
 */
export interface FamilyMemberFilters {
  organizationId?: UUID;
  branchId?: UUID;
  status?: string | string[];
  isPrimaryContact?: boolean;
  invitationStatus?: string | string[];
}

/**
 * Input for creating a family member
 */
export interface CreateFamilyMemberInput {
  clientId: UUID;
  organizationId: UUID;
  branchId: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  relationship: string;
  relationshipNote?: string;
  isPrimaryContact: boolean;
  portalAccessLevel: string;
  accessGrantedBy: UUID;
  preferredContactMethod?: string;
  receiveNotifications?: boolean;
  notificationPreferences?: Record<string, unknown>;
}

/**
 * Input for updating a family member
 */
export interface UpdateFamilyMemberInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  relationship?: string;
  relationshipNote?: string;
  isPrimaryContact?: boolean;
  portalAccessLevel?: string;
  status?: string;
  invitationStatus?: string;
  receiveNotifications?: boolean;
  notificationPreferences?: Record<string, unknown>;
  preferredContactMethod?: string;
  lastLoginAt?: Date;
  passwordResetRequired?: boolean;
}

/**
 * Family Member Provider Interface
 *
 * Provides access to family member data for cross-vertical operations.
 * Services should depend on this interface, not the concrete implementation.
 */
export interface IFamilyMemberProvider {
  /**
   * Get family member by ID
   */
  getFamilyMemberById(memberId: UUID): Promise<FamilyMember | null>;

  /**
   * Get family members by client ID
   */
  getFamilyMembersByClientId(clientId: UUID): Promise<FamilyMember[]>;

  /**
   * Get primary contact for a client
   */
  getPrimaryContactForClient(clientId: UUID): Promise<FamilyMember | null>;

  /**
   * Create a new family member
   */
  createFamilyMember(data: CreateFamilyMemberInput): Promise<FamilyMember>;

  /**
   * Update an existing family member
   */
  updateFamilyMember(memberId: UUID, data: UpdateFamilyMemberInput): Promise<FamilyMember>;

  /**
   * Delete (soft delete) a family member
   */
  deleteFamilyMember(memberId: UUID): Promise<void>;
}

/**
 * Family Member Provider Implementation
 *
 * Concrete implementation that queries the database.
 */
export class FamilyMemberProvider implements IFamilyMemberProvider {
  constructor(private database: Database) {}

  /**
   * Map database row to FamilyMember entity
   */
  private mapRowToFamilyMember(row: Record<string, unknown>): FamilyMember {
    return {
      id: row['id'] as UUID,
      clientId: row['client_id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchId: row['branch_id'] as UUID,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      email: row['email'] as string,
      phoneNumber: row['phone_number'] as string,
      relationship: row['relationship'] as string,
      relationshipNote: row['relationship_note'] as string | null | undefined,
      isPrimaryContact: row['is_primary_contact'] as boolean,
      portalAccessLevel: row['portal_access_level'] as string,
      accessGrantedBy: row['access_granted_by'] as UUID,
      accessGrantedAt: new Date(row['access_granted_at'] as string),
      accessExpiresAt: row['access_expires_at'] ? new Date(row['access_expires_at'] as string) : null,
      status: row['status'] as string,
      invitationStatus: row['invitation_status'] as string,
      invitationSentAt: row['invitation_sent_at'] ? new Date(row['invitation_sent_at'] as string) : null,
      invitationAcceptedAt: row['invitation_accepted_at'] ? new Date(row['invitation_accepted_at'] as string) : null,
      receiveNotifications: row['receive_notifications'] as boolean,
      notificationPreferences: row['notification_preferences'] ? (typeof row['notification_preferences'] === 'string' ? JSON.parse(row['notification_preferences']) : row['notification_preferences']) : undefined,
      preferredContactMethod: row['preferred_contact_method'] as string,
      lastLoginAt: row['last_login_at'] ? new Date(row['last_login_at'] as string) : null,
      passwordResetRequired: row['password_reset_required'] as boolean,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
      deletedAt: row['deleted_at'] ? new Date(row['deleted_at'] as string) : null,
    };
  }

  async getFamilyMemberById(memberId: UUID): Promise<FamilyMember | null> {
    const query = `
      SELECT
        id, client_id, organization_id, branch_id,
        first_name, last_name, email, phone_number,
        relationship, relationship_note, is_primary_contact,
        portal_access_level, access_granted_by, access_granted_at, access_expires_at,
        status, invitation_status, invitation_sent_at, invitation_accepted_at,
        receive_notifications, notification_preferences, preferred_contact_method,
        last_login_at, password_reset_required,
        created_at, updated_at, deleted_at
      FROM family_members
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [memberId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFamilyMember(result.rows[0] as Record<string, unknown>);
  }

  async getFamilyMembersByClientId(clientId: UUID): Promise<FamilyMember[]> {
    const query = `
      SELECT
        id, client_id, organization_id, branch_id,
        first_name, last_name, email, phone_number,
        relationship, relationship_note, is_primary_contact,
        portal_access_level, access_granted_by, access_granted_at, access_expires_at,
        status, invitation_status, invitation_sent_at, invitation_accepted_at,
        receive_notifications, notification_preferences, preferred_contact_method,
        last_login_at, password_reset_required,
        created_at, updated_at, deleted_at
      FROM family_members
      WHERE client_id = $1 AND deleted_at IS NULL
      ORDER BY is_primary_contact DESC, last_name, first_name
    `;

    const result = await this.database.query(query, [clientId]);

    return result.rows.map(row => this.mapRowToFamilyMember(row as Record<string, unknown>));
  }

  async getPrimaryContactForClient(clientId: UUID): Promise<FamilyMember | null> {
    const query = `
      SELECT
        id, client_id, organization_id, branch_id,
        first_name, last_name, email, phone_number,
        relationship, relationship_note, is_primary_contact,
        portal_access_level, access_granted_by, access_granted_at, access_expires_at,
        status, invitation_status, invitation_sent_at, invitation_accepted_at,
        receive_notifications, notification_preferences, preferred_contact_method,
        last_login_at, password_reset_required,
        created_at, updated_at, deleted_at
      FROM family_members
      WHERE client_id = $1
        AND is_primary_contact = true
        AND status = 'ACTIVE'
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1
    `;

    const result = await this.database.query(query, [clientId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFamilyMember(result.rows[0] as Record<string, unknown>);
  }

  async createFamilyMember(data: CreateFamilyMemberInput): Promise<FamilyMember> {
    const now = new Date();

    const query = `
      INSERT INTO family_members (
        client_id, organization_id, branch_id,
        first_name, last_name, email, phone_number,
        relationship, relationship_note, is_primary_contact,
        portal_access_level, access_granted_by, access_granted_at,
        status, invitation_status, invitation_sent_at,
        receive_notifications, notification_preferences, preferred_contact_method,
        password_reset_required,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      data.clientId,
      data.organizationId,
      data.branchId,
      data.firstName,
      data.lastName,
      data.email,
      data.phoneNumber,
      data.relationship,
      data.relationshipNote || null,
      data.isPrimaryContact,
      data.portalAccessLevel,
      data.accessGrantedBy,
      now,
      'ACTIVE',
      'PENDING',
      now,
      data.receiveNotifications !== undefined ? data.receiveNotifications : true,
      data.notificationPreferences ? JSON.stringify(data.notificationPreferences) : null,
      data.preferredContactMethod || 'EMAIL',
      false,
      now,
      now,
    ]);

    return this.mapRowToFamilyMember(result.rows[0] as Record<string, unknown>);
  }

  async updateFamilyMember(memberId: UUID, data: UpdateFamilyMemberInput): Promise<FamilyMember> {
    const setClauses: string[] = ['updated_at = $1'];
    const params: unknown[] = [new Date()];
    let paramIndex = 2;

    if (data.firstName !== undefined) {
      setClauses.push(`first_name = $${paramIndex}`);
      params.push(data.firstName);
      paramIndex++;
    }

    if (data.lastName !== undefined) {
      setClauses.push(`last_name = $${paramIndex}`);
      params.push(data.lastName);
      paramIndex++;
    }

    if (data.email !== undefined) {
      setClauses.push(`email = $${paramIndex}`);
      params.push(data.email);
      paramIndex++;
    }

    if (data.phoneNumber !== undefined) {
      setClauses.push(`phone_number = $${paramIndex}`);
      params.push(data.phoneNumber);
      paramIndex++;
    }

    if (data.relationship !== undefined) {
      setClauses.push(`relationship = $${paramIndex}`);
      params.push(data.relationship);
      paramIndex++;
    }

    if (data.relationshipNote !== undefined) {
      setClauses.push(`relationship_note = $${paramIndex}`);
      params.push(data.relationshipNote);
      paramIndex++;
    }

    if (data.isPrimaryContact !== undefined) {
      setClauses.push(`is_primary_contact = $${paramIndex}`);
      params.push(data.isPrimaryContact);
      paramIndex++;
    }

    if (data.portalAccessLevel !== undefined) {
      setClauses.push(`portal_access_level = $${paramIndex}`);
      params.push(data.portalAccessLevel);
      paramIndex++;
    }

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.invitationStatus !== undefined) {
      setClauses.push(`invitation_status = $${paramIndex}`);
      params.push(data.invitationStatus);
      paramIndex++;
    }

    if (data.receiveNotifications !== undefined) {
      setClauses.push(`receive_notifications = $${paramIndex}`);
      params.push(data.receiveNotifications);
      paramIndex++;
    }

    if (data.notificationPreferences !== undefined) {
      setClauses.push(`notification_preferences = $${paramIndex}`);
      params.push(JSON.stringify(data.notificationPreferences));
      paramIndex++;
    }

    if (data.preferredContactMethod !== undefined) {
      setClauses.push(`preferred_contact_method = $${paramIndex}`);
      params.push(data.preferredContactMethod);
      paramIndex++;
    }

    if (data.lastLoginAt !== undefined) {
      setClauses.push(`last_login_at = $${paramIndex}`);
      params.push(data.lastLoginAt);
      paramIndex++;
    }

    if (data.passwordResetRequired !== undefined) {
      setClauses.push(`password_reset_required = $${paramIndex}`);
      params.push(data.passwordResetRequired);
      paramIndex++;
    }

    params.push(memberId);
    const setClause = setClauses.join(', ');

    const query = `
      UPDATE family_members
      SET ${setClause}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.database.query(query, params);

    return this.mapRowToFamilyMember(result.rows[0] as Record<string, unknown>);
  }

  async deleteFamilyMember(memberId: UUID): Promise<void> {
    const now = new Date();

    const query = `
      UPDATE family_members
      SET deleted_at = $1, updated_at = $1, status = 'INACTIVE'
      WHERE id = $2
    `;

    await this.database.query(query, [now, memberId]);
  }
}

/**
 * Factory function to create a FamilyMemberProvider instance
 */
export function createFamilyMemberProvider(database: Database): IFamilyMemberProvider {
  return new FamilyMemberProvider(database);
}
