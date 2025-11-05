/**
 * Family Member Service - business logic for family member management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FamilyMember,
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
  FamilyMemberFilters,
} from '../types/index.js';
import { FamilyMemberRepository } from '../repository/index.js';
import { Database, PaginatedResult } from '@care-commons/core';

export class FamilyMemberService {
  private repository: FamilyMemberRepository;

  constructor(database: Database) {
    this.repository = new FamilyMemberRepository(database);
  }

  /**
   * Create a new family member
   */
  async createFamilyMember(input: CreateFamilyMemberInput): Promise<FamilyMember> {
    // Validate email uniqueness if provided
    if (input.email) {
      const existing = await this.repository.findByEmail(input.email);
      if (existing) {
        throw new Error(`Family member with email ${input.email} already exists`);
      }
    }

    // If this is marked as primary contact, ensure no other primary contact exists
    if (input.is_primary_contact) {
      const existingPrimary = await this.repository.findPrimaryContact(input.client_id);
      if (existingPrimary) {
        throw new Error(`Client already has a primary contact: ${existingPrimary.first_name} ${existingPrimary.last_name}`);
      }
    }

    const familyMember: FamilyMember = {
      id: uuidv4(),
      client_id: input.client_id,
      organization_id: input.organization_id,

      first_name: input.first_name,
      last_name: input.last_name,
      preferred_name: input.preferred_name,
      date_of_birth: input.date_of_birth,

      relationship_type: input.relationship_type,
      is_primary_contact: input.is_primary_contact ?? false,
      is_emergency_contact: input.is_emergency_contact ?? false,
      is_authorized_representative: input.is_authorized_representative ?? false,
      contact_priority: input.contact_priority ?? 99,

      email: input.email,
      phone_primary: input.phone_primary,
      phone_secondary: input.phone_secondary,
      phone_type: input.phone_type,
      preferred_contact_method: input.preferred_contact_method ?? 'EMAIL',
      communication_preferences: input.communication_preferences,

      address_line1: input.address_line1,
      address_line2: input.address_line2,
      city: input.city,
      state: input.state,
      postal_code: input.postal_code,
      country: input.country ?? 'United States',

      can_view_care_plans: input.can_view_care_plans ?? false,
      can_view_visit_logs: input.can_view_visit_logs ?? false,
      can_view_medical_info: input.can_view_medical_info ?? false,
      can_view_billing: input.can_view_billing ?? false,
      can_receive_notifications: input.can_receive_notifications ?? true,
      can_message_care_team: input.can_message_care_team ?? true,
      custom_permissions: input.custom_permissions,

      preferred_language: input.preferred_language ?? 'en',
      accessibility_needs: input.accessibility_needs,

      status: 'ACTIVE',
      notes: input.notes,

      created_at: new Date(),
      created_by: input.created_by,
      updated_at: new Date(),
      updated_by: input.created_by,
      version: 1,
    };

    return await this.repository.create(familyMember);
  }

  /**
   * Update a family member
   */
  async updateFamilyMember(
    id: string,
    input: UpdateFamilyMemberInput
  ): Promise<FamilyMember> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Family member with ID ${id} not found`);
    }

    // If changing to primary contact, ensure no other primary contact exists
    if (input.is_primary_contact && !existing.is_primary_contact) {
      const existingPrimary = await this.repository.findPrimaryContact(existing.client_id);
      if (existingPrimary && existingPrimary.id !== id) {
        throw new Error(`Client already has a primary contact: ${existingPrimary.first_name} ${existingPrimary.last_name}`);
      }
    }

    // If email is being changed, validate uniqueness
    if (input.email && input.email !== existing.email) {
      const existingEmail = await this.repository.findByEmail(input.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new Error(`Family member with email ${input.email} already exists`);
      }
    }

    const updates: Partial<FamilyMember> = {
      ...input,
      updated_at: new Date(),
      updated_by: input.updated_by,
    };

    return await this.repository.update(id, updates);
  }

  /**
   * Get family member by ID
   */
  async getFamilyMemberById(id: string): Promise<FamilyMember | null> {
    return await this.repository.findById(id);
  }

  /**
   * Get all family members for a client
   */
  async getFamilyMembersByClientId(clientId: string): Promise<FamilyMember[]> {
    return await this.repository.findByClientId(clientId);
  }

  /**
   * Get primary contact for a client
   */
  async getPrimaryContact(clientId: string): Promise<FamilyMember | null> {
    return await this.repository.findPrimaryContact(clientId);
  }

  /**
   * Get emergency contacts for a client
   */
  async getEmergencyContacts(clientId: string): Promise<FamilyMember[]> {
    return await this.repository.findEmergencyContacts(clientId);
  }

  /**
   * Get authorized representatives for a client
   */
  async getAuthorizedRepresentatives(clientId: string): Promise<FamilyMember[]> {
    return await this.repository.findAuthorizedRepresentatives(clientId);
  }

  /**
   * Search family members with filters
   */
  async searchFamilyMembers(
    filters: FamilyMemberFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<FamilyMember>> {
    return await this.repository.search(filters, page, pageSize);
  }

  /**
   * Delete a family member (soft delete if enabled, hard delete otherwise)
   */
  async deleteFamilyMember(id: string, deletedBy: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Family member with ID ${id} not found`);
    }

    // Mark as inactive instead of deleting
    await this.repository.update(id, {
      status: 'INACTIVE',
      updated_by: deletedBy,
      updated_at: new Date(),
    });
  }

  /**
   * Set family member as primary contact
   */
  async setPrimaryContact(familyMemberId: string, userId: string): Promise<FamilyMember> {
    const familyMember = await this.repository.findById(familyMemberId);
    if (!familyMember) {
      throw new Error(`Family member with ID ${familyMemberId} not found`);
    }

    // Remove primary contact flag from other family members of the same client
    const existingPrimary = await this.repository.findPrimaryContact(familyMember.client_id);
    if (existingPrimary && existingPrimary.id !== familyMemberId) {
      await this.repository.update(existingPrimary.id, {
        is_primary_contact: false,
        updated_by: userId,
        updated_at: new Date(),
      });
    }

    // Set this family member as primary contact
    return await this.repository.update(familyMemberId, {
      is_primary_contact: true,
      updated_by: userId,
      updated_at: new Date(),
    });
  }

  /**
   * Update family member permissions
   */
  async updatePermissions(
    familyMemberId: string,
    permissions: {
      can_view_care_plans?: boolean;
      can_view_visit_logs?: boolean;
      can_view_medical_info?: boolean;
      can_view_billing?: boolean;
      can_receive_notifications?: boolean;
      can_message_care_team?: boolean;
    },
    userId: string
  ): Promise<FamilyMember> {
    const existing = await this.repository.findById(familyMemberId);
    if (!existing) {
      throw new Error(`Family member with ID ${familyMemberId} not found`);
    }

    return await this.repository.update(familyMemberId, {
      ...permissions,
      updated_by: userId,
      updated_at: new Date(),
    });
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
    return await this.repository.getStatsByOrganization(organizationId);
  }

  /**
   * Check if family member has permission
   */
  hasPermission(familyMember: FamilyMember, permission: string): boolean {
    const permissionMap: Record<string, boolean> = {
      view_care_plans: familyMember.can_view_care_plans,
      view_visit_logs: familyMember.can_view_visit_logs,
      view_medical_info: familyMember.can_view_medical_info,
      view_billing: familyMember.can_view_billing,
      receive_notifications: familyMember.can_receive_notifications,
      message_care_team: familyMember.can_message_care_team,
    };

    return permissionMap[permission] ?? false;
  }
}
