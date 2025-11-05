/**
 * Family Member Repository - data access layer for family members
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import {
  FamilyMember,
  FamilyMemberFilters,
  FamilyMemberStatus,
  RelationshipType,
  PreferredContactMethod,
} from '../types/index.js';

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
      client_id: row['client_id'] as string,
      organization_id: row['organization_id'] as string,

      // Identity
      first_name: row['first_name'] as string,
      last_name: row['last_name'] as string,
      preferred_name: row['preferred_name'] as string | undefined,
      date_of_birth: row['date_of_birth'] as Date | undefined,

      // Relationship
      relationship_type: row['relationship_type'] as RelationshipType,
      is_primary_contact: row['is_primary_contact'] as boolean,
      is_emergency_contact: row['is_emergency_contact'] as boolean,
      is_authorized_representative: row['is_authorized_representative'] as boolean,
      contact_priority: row['contact_priority'] as number,

      // Contact information
      email: row['email'] as string | undefined,
      phone_primary: row['phone_primary'] as string | undefined,
      phone_secondary: row['phone_secondary'] as string | undefined,
      phone_type: row['phone_type'] as string | undefined,
      preferred_contact_method: row['preferred_contact_method'] as PreferredContactMethod,
      communication_preferences: row['communication_preferences']
        ? JSON.parse(row['communication_preferences'] as string)
        : undefined,

      // Address
      address_line1: row['address_line1'] as string | undefined,
      address_line2: row['address_line2'] as string | undefined,
      city: row['city'] as string | undefined,
      state: row['state'] as string | undefined,
      postal_code: row['postal_code'] as string | undefined,
      country: (row['country'] as string) || 'United States',

      // Permissions
      can_view_care_plans: row['can_view_care_plans'] as boolean,
      can_view_visit_logs: row['can_view_visit_logs'] as boolean,
      can_view_medical_info: row['can_view_medical_info'] as boolean,
      can_view_billing: row['can_view_billing'] as boolean,
      can_receive_notifications: row['can_receive_notifications'] as boolean,
      can_message_care_team: row['can_message_care_team'] as boolean,
      custom_permissions: row['custom_permissions']
        ? JSON.parse(row['custom_permissions'] as string)
        : undefined,

      // Language & accessibility
      preferred_language: (row['preferred_language'] as string) || 'en',
      accessibility_needs: row['accessibility_needs']
        ? JSON.parse(row['accessibility_needs'] as string)
        : undefined,

      // Status
      status: row['status'] as FamilyMemberStatus,
      notes: row['notes'] as string | undefined,

      // Standard fields
      created_at: row['created_at'] as Date,
      created_by: row['created_by'] as string,
      updated_at: row['updated_at'] as Date,
      updated_by: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  /**
   * Find family members by client ID
   */
  async findByClientId(clientId: string): Promise<FamilyMember[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({ client_id: clientId, status: 'ACTIVE' })
      .orderBy('contact_priority', 'asc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find primary contact for a client
   */
  async findPrimaryContact(clientId: string): Promise<FamilyMember | null> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({
        client_id: clientId,
        is_primary_contact: true,
        status: 'ACTIVE',
      })
      .first();

    const row = await query;
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Find emergency contacts for a client
   */
  async findEmergencyContacts(clientId: string): Promise<FamilyMember[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({
        client_id: clientId,
        is_emergency_contact: true,
        status: 'ACTIVE',
      })
      .orderBy('contact_priority', 'asc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find authorized representatives for a client
   */
  async findAuthorizedRepresentatives(clientId: string): Promise<FamilyMember[]> {
    const query = this.database
      .getKnex()(this.tableName)
      .where({
        client_id: clientId,
        is_authorized_representative: true,
        status: 'ACTIVE',
      })
      .orderBy('contact_priority', 'asc');

    const rows = await query;
    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find family member by email
   */
  async findByEmail(email: string): Promise<FamilyMember | null> {
    const query = this.database
      .getKnex()(this.tableName)
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .where({ status: 'ACTIVE' })
      .first();

    const row = await query;
    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Search family members with filters
   */
  async search(
    filters: FamilyMemberFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<FamilyMember>> {
    const query = this.database.getKnex()(this.tableName);

    // Apply filters
    if (filters.client_id) {
      query.where({ client_id: filters.client_id });
    }

    if (filters.organization_id) {
      query.where({ organization_id: filters.organization_id });
    }

    if (filters.relationship_type) {
      query.where({ relationship_type: filters.relationship_type });
    }

    if (filters.is_primary_contact !== undefined) {
      query.where({ is_primary_contact: filters.is_primary_contact });
    }

    if (filters.is_emergency_contact !== undefined) {
      query.where({ is_emergency_contact: filters.is_emergency_contact });
    }

    if (filters.is_authorized_representative !== undefined) {
      query.where({ is_authorized_representative: filters.is_authorized_representative });
    }

    if (filters.status) {
      query.where({ status: filters.status });
    }

    if (filters.email) {
      query.whereRaw('LOWER(email) = ?', [filters.email.toLowerCase()]);
    }

    if (filters.phone_primary) {
      query.where({ phone_primary: filters.phone_primary });
    }

    // Count total
    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = Number(countResult?.['count'] ?? 0);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query.limit(pageSize).offset(offset);
    query.orderBy('last_name', 'asc').orderBy('first_name', 'asc');

    const rows = await query;
    const items = rows.map((row) => this.mapRowToEntity(row));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get family member statistics for an organization
   */
  async getStatsByOrganization(organizationId: string): Promise<{
    total: number;
    by_relationship: Record<string, number>;
    primary_contacts: number;
    emergency_contacts: number;
    authorized_representatives: number;
  }> {
    const knex = this.database.getKnex();

    // Total count
    const totalResult = await knex(this.tableName)
      .where({ organization_id: organizationId, status: 'ACTIVE' })
      .count('* as count')
      .first();

    const total = Number(totalResult?.['count'] ?? 0);

    // By relationship type
    const relationshipResults = await knex(this.tableName)
      .where({ organization_id: organizationId, status: 'ACTIVE' })
      .select('relationship_type')
      .count('* as count')
      .groupBy('relationship_type');

    const by_relationship: Record<string, number> = {};
    for (const row of relationshipResults) {
      by_relationship[row['relationship_type'] as string] = Number(row['count']);
    }

    // Special counts
    const primaryContactsResult = await knex(this.tableName)
      .where({ organization_id: organizationId, status: 'ACTIVE', is_primary_contact: true })
      .count('* as count')
      .first();

    const emergencyContactsResult = await knex(this.tableName)
      .where({ organization_id: organizationId, status: 'ACTIVE', is_emergency_contact: true })
      .count('* as count')
      .first();

    const authorizedRepsResult = await knex(this.tableName)
      .where({
        organization_id: organizationId,
        status: 'ACTIVE',
        is_authorized_representative: true,
      })
      .count('* as count')
      .first();

    return {
      total,
      by_relationship,
      primary_contacts: Number(primaryContactsResult?.['count'] ?? 0),
      emergency_contacts: Number(emergencyContactsResult?.['count'] ?? 0),
      authorized_representatives: Number(authorizedRepsResult?.['count'] ?? 0),
    };
  }
}
