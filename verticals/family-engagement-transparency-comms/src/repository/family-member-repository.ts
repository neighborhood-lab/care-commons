/**
 * Family Member Repository - data access layer
 *
 * Handles database operations for family members
 */

import {
  Repository,
  Database,
  PaginatedResult,
  UserContext,
} from '@care-commons/core';
import {
  FamilyMember,
  FamilyMemberSearchFilters,
  AccountStatus,
} from '../types/family-member.js';

export class FamilyMemberRepository extends Repository<FamilyMember> {
  constructor(database: Database) {
    super({
      tableName: 'family_members',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  /**
   * Map database row to FamilyMember entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): FamilyMember {
    const entity: FamilyMember = {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      email: row['email'] as string,
      preferredContactMethod: row['preferred_contact_method'] as any,
      accountActive: row['account_active'] as boolean,
      accountStatus: row['account_status'] as AccountStatus,
      requiresTwoFactor: row['requires_two_factor'] as boolean,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
    };

    // Map optional fields
    if (row['middle_name']) entity.middleName = row['middle_name'] as string;
    if (row['preferred_name'])
      entity.preferredName = row['preferred_name'] as string;
    if (row['suffix']) entity.suffix = row['suffix'] as string;
    if (row['primary_phone'])
      entity.primaryPhone = JSON.parse(row['primary_phone'] as string);
    if (row['alternate_phone'])
      entity.alternatePhone = JSON.parse(row['alternate_phone'] as string);
    if (row['communication_preferences'])
      entity.communicationPreferences = JSON.parse(
        row['communication_preferences'] as string
      );
    if (row['address']) entity.address = JSON.parse(row['address'] as string);
    if (row['auth_user_id']) entity.authUserId = row['auth_user_id'] as string;
    if (row['account_activated_at'])
      entity.accountActivatedAt = row['account_activated_at'] as Date;
    if (row['last_login_at'])
      entity.lastLoginAt = row['last_login_at'] as Date;
    if (row['portal_preferences'])
      entity.portalPreferences = JSON.parse(
        row['portal_preferences'] as string
      );
    if (row['password_changed_at'])
      entity.passwordChangedAt = row['password_changed_at'] as Date;
    if (row['terms_accepted_at'])
      entity.termsAcceptedAt = row['terms_accepted_at'] as Date;
    if (row['terms_version'])
      entity.termsVersion = row['terms_version'] as string;
    if (row['deleted_at']) entity.deletedAt = row['deleted_at'] as Date;
    if (row['deleted_by']) entity.deletedBy = row['deleted_by'] as string;

    return entity;
  }

  /**
   * Map entity to database row
   */
  protected mapEntityToRow(
    entity: Partial<FamilyMember>
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined)
      row['organization_id'] = entity.organizationId;
    if (entity.firstName !== undefined) row['first_name'] = entity.firstName;
    if (entity.middleName !== undefined)
      row['middle_name'] = entity.middleName;
    if (entity.lastName !== undefined) row['last_name'] = entity.lastName;
    if (entity.preferredName !== undefined)
      row['preferred_name'] = entity.preferredName;
    if (entity.suffix !== undefined) row['suffix'] = entity.suffix;
    if (entity.email !== undefined) row['email'] = entity.email;
    if (entity.primaryPhone !== undefined)
      row['primary_phone'] = JSON.stringify(entity.primaryPhone);
    if (entity.alternatePhone !== undefined)
      row['alternate_phone'] = JSON.stringify(entity.alternatePhone);
    if (entity.preferredContactMethod !== undefined)
      row['preferred_contact_method'] = entity.preferredContactMethod;
    if (entity.communicationPreferences !== undefined)
      row['communication_preferences'] = JSON.stringify(
        entity.communicationPreferences
      );
    if (entity.address !== undefined)
      row['address'] = JSON.stringify(entity.address);
    if (entity.authUserId !== undefined)
      row['auth_user_id'] = entity.authUserId;
    if (entity.accountActive !== undefined)
      row['account_active'] = entity.accountActive;
    if (entity.accountStatus !== undefined)
      row['account_status'] = entity.accountStatus;
    if (entity.portalPreferences !== undefined)
      row['portal_preferences'] = JSON.stringify(entity.portalPreferences);
    if (entity.requiresTwoFactor !== undefined)
      row['requires_two_factor'] = entity.requiresTwoFactor;

    return row;
  }

  /**
   * Find family member by email
   */
  async findByEmail(
    email: string,
    organizationId: string
  ): Promise<FamilyMember | null> {
    const query = this.db
      .queryBuilder()
      .from(this.tableName)
      .where({ email: email.toLowerCase(), organization_id: organizationId })
      .whereNull('deleted_at')
      .first();

    const row = await this.db.executeQuery(query);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Find family member by auth user ID
   */
  async findByAuthUserId(authUserId: string): Promise<FamilyMember | null> {
    const query = this.db
      .queryBuilder()
      .from(this.tableName)
      .where({ auth_user_id: authUserId })
      .whereNull('deleted_at')
      .first();

    const row = await this.db.executeQuery(query);
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Search family members with filters
   */
  async search(
    filters: FamilyMemberSearchFilters
  ): Promise<PaginatedResult<FamilyMember>> {
    let query = this.db
      .queryBuilder()
      .from(this.tableName)
      .where({ organization_id: filters.organizationId })
      .whereNull('deleted_at');

    if (filters.email) {
      query = query.where({ email: filters.email.toLowerCase() });
    }

    if (filters.lastName) {
      query = query.whereILike('last_name', `%${filters.lastName}%`);
    }

    if (filters.accountStatus) {
      query = query.where({ account_status: filters.accountStatus });
    }

    if (filters.accountActive !== undefined) {
      query = query.where({ account_active: filters.accountActive });
    }

    if (filters.searchTerm) {
      query = query.where((builder) => {
        builder
          .whereILike('first_name', `%${filters.searchTerm}%`)
          .orWhereILike('last_name', `%${filters.searchTerm}%`)
          .orWhereILike('email', `%${filters.searchTerm}%`);
      });
    }

    const rows = await this.db.executeQuery(query);
    const items = rows.map((row) => this.mapRowToEntity(row));

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
    };
  }

  /**
   * Record account activation
   */
  async recordAccountActivation(id: string): Promise<void> {
    const query = this.db
      .queryBuilder()
      .from(this.tableName)
      .where({ id })
      .update({ account_activated_at: new Date() });

    await this.db.executeQuery(query);
  }

  /**
   * Record login activity
   */
  async recordLogin(id: string): Promise<void> {
    const query = this.db
      .queryBuilder()
      .from(this.tableName)
      .where({ id })
      .update({ last_login_at: new Date() });

    await this.db.executeQuery(query);
  }

  /**
   * Record terms acceptance
   */
  async recordTermsAcceptance(
    id: string,
    termsVersion: string
  ): Promise<FamilyMember> {
    const query = this.db
      .queryBuilder()
      .from(this.tableName)
      .where({ id })
      .update({
        terms_accepted_at: new Date(),
        terms_version: termsVersion,
      })
      .returning('*');

    const row = await this.db.executeQuery(query);
    return this.mapRowToEntity(row[0]);
  }

  /**
   * Find relationships by family member
   */
  async findRelationshipsByFamilyMember(
    familyMemberId: string
  ): Promise<any[]> {
    const query = this.db
      .queryBuilder()
      .from('family_client_relationships')
      .where({ family_member_id: familyMemberId })
      .whereNull('deleted_at')
      .join('clients', 'clients.id', 'family_client_relationships.client_id')
      .select('family_client_relationships.*', 'clients.first_name', 'clients.last_name');

    const rows = await this.db.executeQuery(query);
    return rows;
  }
}
