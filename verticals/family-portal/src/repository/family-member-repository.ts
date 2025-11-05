/**
 * Family Member Repository
 *
 * Data access layer for family members
 */

import { Repository, Database, UUID, PaginatedResult, PaginationParams } from '@care-commons/core';
import type { FamilyMember, FamilyMemberStatus } from '../types/index.js';

export interface FamilyMemberFilters {
  organizationId?: UUID;
  clientId?: UUID;
  status?: FamilyMemberStatus;
  email?: string;
  search?: string; // firstName, lastName, email
}

export class FamilyMemberRepository extends Repository<FamilyMember> {
  constructor(database: Database) {
    super({ tableName: 'family_members', database, enableAudit: true, enableSoftDelete: true });
  }

  protected mapRowToEntity(row: any): FamilyMember {
    return {
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id,
      authorizedContactId: row.authorized_contact_id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      relationship: row.relationship,
      phone: row.phone,
      status: row.status,
      permissions: row.permissions || [],
      accessLevel: row.access_level,
      preferences: row.preferences,
      notificationSettings: row.notification_settings,
      lastLoginAt: row.last_login_at,
      lastPasswordChangeAt: row.last_password_change_at,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      deletedAt: row.deleted_at,
    };
  }

  protected mapEntityToRow(entity: Partial<FamilyMember>): Record<string, any> {
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.authorizedContactId !== undefined) row.authorized_contact_id = entity.authorizedContactId;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.passwordHash !== undefined) row.password_hash = entity.passwordHash;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.relationship !== undefined) row.relationship = entity.relationship;
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.permissions !== undefined) row.permissions = entity.permissions;
    if (entity.accessLevel !== undefined) row.access_level = entity.accessLevel;
    if (entity.preferences !== undefined) row.preferences = JSON.stringify(entity.preferences);
    if (entity.notificationSettings !== undefined)
      row.notification_settings = JSON.stringify(entity.notificationSettings);
    if (entity.lastLoginAt !== undefined) row.last_login_at = entity.lastLoginAt;
    if (entity.lastPasswordChangeAt !== undefined)
      row.last_password_change_at = entity.lastPasswordChangeAt;
    if (entity.passwordResetToken !== undefined) row.password_reset_token = entity.passwordResetToken;
    if (entity.passwordResetExpires !== undefined)
      row.password_reset_expires = entity.passwordResetExpires;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.deletedAt !== undefined) row.deleted_at = entity.deletedAt;

    return row;
  }

  async findByEmail(email: string): Promise<FamilyMember | null> {
    const query = this.database.knex(this.tableName)
      .where({ email })
      .whereNull('deleted_at')
      .first();

    const row = await query;
    return row ? this.mapRowToEntity(row) : null;
  }

  async findByClientId(clientId: UUID): Promise<FamilyMember[]> {
    const rows = await this.database.knex(this.tableName)
      .where({ client_id: clientId })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findByPasswordResetToken(token: string): Promise<FamilyMember | null> {
    const query = this.database.knex(this.tableName)
      .where({ password_reset_token: token })
      .where('password_reset_expires', '>', new Date())
      .whereNull('deleted_at')
      .first();

    const row = await query;
    return row ? this.mapRowToEntity(row) : null;
  }

  async search(
    filters: FamilyMemberFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<FamilyMember>> {
    let query = this.database.knex(this.tableName).whereNull('deleted_at');

    if (filters.organizationId) {
      query = query.where('organization_id', filters.organizationId);
    }
    if (filters.clientId) {
      query = query.where('client_id', filters.clientId);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.email) {
      query = query.where('email', 'ILIKE', `%${filters.email}%`);
    }
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('first_name', 'ILIKE', `%${filters.search}%`)
          .orWhere('last_name', 'ILIKE', `%${filters.search}%`)
          .orWhere('email', 'ILIKE', `%${filters.search}%`);
      });
    }

    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = Number(countResult?.count || 0);

    const offset = (pagination.page - 1) * pagination.limit;
    const rows = await query
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

  async updateLastLogin(id: UUID): Promise<void> {
    await this.database.knex(this.tableName).where({ id }).update({
      last_login_at: new Date(),
    });
  }

  async updatePasswordResetToken(
    id: UUID,
    token: string | null,
    expiresAt: Date | null
  ): Promise<void> {
    await this.database.knex(this.tableName).where({ id }).update({
      password_reset_token: token,
      password_reset_expires: expiresAt,
    });
  }
}
