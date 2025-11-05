/**
 * Family Member Service - business logic layer
 *
 * Handles operations related to family members:
 * - Creating and managing family member accounts
 * - Account activation and deactivation
 * - Profile updates and preferences
 * - Authentication integration
 */

import { v4 as uuidv4 } from 'uuid';
import {
  UserContext,
  ValidationError,
  PermissionError,
  NotFoundError,
  PaginatedResult,
} from '@care-commons/core';
import { getPermissionService } from '@care-commons/core';
import {
  FamilyMember,
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
  FamilyMemberSearchFilters,
  FamilyMemberWithRelationships,
  AccountStatus,
} from '../types/family-member.js';
import { FamilyMemberRepository } from '../repository/family-member-repository.js';
import { FamilyMemberValidator } from '../validation/family-member-validator.js';

export class FamilyMemberService {
  private repository: FamilyMemberRepository;
  private validator: FamilyMemberValidator;
  private permissionService = getPermissionService();

  constructor(repository: FamilyMemberRepository) {
    this.repository = repository;
    this.validator = new FamilyMemberValidator();
  }

  /**
   * Create a new family member account
   */
  async createFamilyMember(
    input: CreateFamilyMemberInput,
    context: UserContext
  ): Promise<FamilyMember> {
    // Check permissions
    this.permissionService.requirePermission(context, 'family:create');

    // Validate input
    const validation = this.validator.validateCreate(input);
    if (!validation.success) {
      throw new ValidationError('Invalid family member data', {
        errors: validation.errors,
      });
    }

    // Check for duplicate email
    const existing = await this.repository.findByEmail(
      input.email,
      input.organizationId
    );
    if (existing) {
      throw new ValidationError(
        'A family member with this email already exists'
      );
    }

    // Build family member entity
    const familyMember: Partial<FamilyMember> = {
      id: uuidv4(),
      organizationId: input.organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      preferredContactMethod: input.preferredContactMethod || 'EMAIL',
      accountActive: false, // Inactive until activated
      accountStatus: 'PENDING_ACTIVATION',
      requiresTwoFactor: input.requiresTwoFactor || false,
      createdAt: new Date(),
      createdBy: context.userId,
      updatedAt: new Date(),
      updatedBy: context.userId,
    };

    // Add optional fields
    if (input.middleName) familyMember.middleName = input.middleName;
    if (input.preferredName) familyMember.preferredName = input.preferredName;
    if (input.suffix) familyMember.suffix = input.suffix;
    if (input.primaryPhone) familyMember.primaryPhone = input.primaryPhone;
    if (input.alternatePhone) familyMember.alternatePhone = input.alternatePhone;
    if (input.communicationPreferences)
      familyMember.communicationPreferences = input.communicationPreferences;
    if (input.address) familyMember.address = input.address;
    if (input.portalPreferences)
      familyMember.portalPreferences = input.portalPreferences;

    // Create in database
    const created = await this.repository.create(familyMember, context);

    return created;
  }

  /**
   * Get family member by ID
   */
  async getFamilyMemberById(
    id: string,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:read');

    const familyMember = await this.repository.findById(id);
    if (!familyMember) {
      throw new NotFoundError(`Family member not found: ${id}`);
    }

    // Check organizational scope
    this.checkOrganizationalAccess(familyMember, context);

    return familyMember;
  }

  /**
   * Get family member by email
   */
  async getFamilyMemberByEmail(
    email: string,
    organizationId: string,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:read');

    const familyMember = await this.repository.findByEmail(
      email.toLowerCase(),
      organizationId
    );
    if (!familyMember) {
      throw new NotFoundError(`Family member not found with email: ${email}`);
    }

    this.checkOrganizationalAccess(familyMember, context);

    return familyMember;
  }

  /**
   * Get family member by auth user ID
   */
  async getFamilyMemberByAuthUserId(
    authUserId: string,
    context: UserContext
  ): Promise<FamilyMember> {
    const familyMember = await this.repository.findByAuthUserId(authUserId);
    if (!familyMember) {
      throw new NotFoundError(
        `Family member not found with auth user ID: ${authUserId}`
      );
    }

    // Family members can always access their own profile
    if (context.userId === familyMember.id) {
      return familyMember;
    }

    // Staff need permission
    this.permissionService.requirePermission(context, 'family:read');
    this.checkOrganizationalAccess(familyMember, context);

    return familyMember;
  }

  /**
   * Update family member
   */
  async updateFamilyMember(
    id: string,
    updates: UpdateFamilyMemberInput,
    context: UserContext
  ): Promise<FamilyMember> {
    // Verify family member exists
    const existing = await this.getFamilyMemberById(id, context);

    // Family members can update their own profile (limited fields)
    const isSelfUpdate = context.userId === id;
    if (!isSelfUpdate) {
      this.permissionService.requirePermission(context, 'family:update');
    }

    // Validate updates
    const validation = this.validator.validateUpdate(updates);
    if (!validation.success) {
      throw new ValidationError('Invalid update data', {
        errors: validation.errors,
      });
    }

    // If email is being changed, check for duplicates
    if (
      updates.email &&
      updates.email.toLowerCase() !== existing.email.toLowerCase()
    ) {
      const duplicate = await this.repository.findByEmail(
        updates.email.toLowerCase(),
        existing.organizationId
      );
      if (duplicate) {
        throw new ValidationError('Email already in use by another family member');
      }
    }

    // Restrict certain fields for self-updates
    if (isSelfUpdate) {
      // Family members cannot change their own account status or activation
      delete updates.accountActive;
      delete updates.accountStatus;
    }

    // Update in database
    const updated = await this.repository.update(id, updates, context);

    return updated;
  }

  /**
   * Activate family member account
   */
  async activateFamilyMember(
    id: string,
    authUserId: string,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:activate');

    const familyMember = await this.getFamilyMemberById(id, context);

    if (familyMember.accountStatus !== 'PENDING_ACTIVATION') {
      throw new ValidationError(
        'Account is not in PENDING_ACTIVATION status'
      );
    }

    // Link to auth system user ID
    const updates: UpdateFamilyMemberInput = {
      authUserId,
      accountActive: true,
      accountStatus: 'ACTIVE',
    };

    const updated = await this.repository.update(id, updates, context);

    // Record activation time
    await this.repository.recordAccountActivation(id);

    return updated;
  }

  /**
   * Deactivate family member account
   */
  async deactivateFamilyMember(
    id: string,
    reason: string,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:deactivate');

    const familyMember = await this.getFamilyMemberById(id, context);

    if (!familyMember.accountActive) {
      throw new ValidationError('Account is already inactive');
    }

    const updates: UpdateFamilyMemberInput = {
      accountActive: false,
      accountStatus: 'DEACTIVATED',
    };

    const updated = await this.repository.update(id, updates, context);

    return updated;
  }

  /**
   * Suspend family member account temporarily
   */
  async suspendFamilyMember(
    id: string,
    reason: string,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:suspend');

    await this.getFamilyMemberById(id, context);

    const updates: UpdateFamilyMemberInput = {
      accountActive: false,
      accountStatus: 'SUSPENDED',
    };

    const updated = await this.repository.update(id, updates, context);

    return updated;
  }

  /**
   * Reactivate suspended account
   */
  async reactivateFamilyMember(
    id: string,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:activate');

    const familyMember = await this.getFamilyMemberById(id, context);

    if (familyMember.accountStatus !== 'SUSPENDED') {
      throw new ValidationError('Account is not suspended');
    }

    const updates: UpdateFamilyMemberInput = {
      accountActive: true,
      accountStatus: 'ACTIVE',
    };

    const updated = await this.repository.update(id, updates, context);

    return updated;
  }

  /**
   * Record login activity
   */
  async recordLogin(id: string): Promise<void> {
    await this.repository.recordLogin(id);
  }

  /**
   * Search family members
   */
  async searchFamilyMembers(
    filters: FamilyMemberSearchFilters,
    context: UserContext
  ): Promise<PaginatedResult<FamilyMember>> {
    this.permissionService.requirePermission(context, 'family:read');

    // Ensure organizational scope
    if (!filters.organizationId) {
      filters.organizationId = context.organizationId;
    } else {
      this.checkOrganizationMatch(filters.organizationId, context);
    }

    const results = await this.repository.search(filters);

    return results;
  }

  /**
   * Get family member with relationships
   */
  async getFamilyMemberWithRelationships(
    id: string,
    context: UserContext
  ): Promise<FamilyMemberWithRelationships> {
    this.permissionService.requirePermission(context, 'family:read');

    const familyMember = await this.getFamilyMemberById(id, context);
    const relationships =
      await this.repository.findRelationshipsByFamilyMember(id);

    // Build relationship summary
    const relationshipSummary = relationships.map((rel) => ({
      clientId: rel.clientId,
      clientName: `${rel.client.firstName} ${rel.client.lastName}`,
      relationshipType: rel.relationshipType,
      isPrimaryContact: rel.isPrimaryContact,
    }));

    const activeRelationshipsCount = relationships.filter(
      (r) => r.status === 'ACTIVE'
    ).length;

    return {
      ...familyMember,
      relationships: relationshipSummary,
      activeRelationshipsCount,
    };
  }

  /**
   * Update portal preferences
   */
  async updatePortalPreferences(
    id: string,
    preferences: FamilyMember['portalPreferences'],
    context: UserContext
  ): Promise<FamilyMember> {
    // Family members can update their own preferences
    const isSelfUpdate = context.userId === id;
    if (!isSelfUpdate) {
      this.permissionService.requirePermission(context, 'family:update');
    }

    const existing = await this.getFamilyMemberById(id, context);

    const updates: UpdateFamilyMemberInput = {
      portalPreferences: {
        ...existing.portalPreferences,
        ...preferences,
      },
    };

    const updated = await this.repository.update(id, updates, context);

    return updated;
  }

  /**
   * Update communication preferences
   */
  async updateCommunicationPreferences(
    id: string,
    preferences: FamilyMember['communicationPreferences'],
    context: UserContext
  ): Promise<FamilyMember> {
    // Family members can update their own preferences
    const isSelfUpdate = context.userId === id;
    if (!isSelfUpdate) {
      this.permissionService.requirePermission(context, 'family:update');
    }

    const existing = await this.getFamilyMemberById(id, context);

    const updates: UpdateFamilyMemberInput = {
      communicationPreferences: {
        ...existing.communicationPreferences,
        ...preferences,
      },
    };

    const updated = await this.repository.update(id, updates, context);

    return updated;
  }

  /**
   * Accept terms of service
   */
  async acceptTerms(
    id: string,
    termsVersion: string,
    context: UserContext
  ): Promise<FamilyMember> {
    const updates: UpdateFamilyMemberInput = {
      // Note: termsAcceptedAt and termsVersion are not in UpdateFamilyMemberInput
      // This would need to be added to the type definition or handled separately
    };

    const updated = await this.repository.recordTermsAcceptance(
      id,
      termsVersion
    );

    return updated;
  }

  /**
   * Delete family member (soft delete)
   */
  async deleteFamilyMember(
    id: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'family:delete');

    const familyMember = await this.getFamilyMemberById(id, context);

    // Check if family member has active relationships
    const relationships =
      await this.repository.findRelationshipsByFamilyMember(id);
    const activeRelationships = relationships.filter(
      (r) => r.status === 'ACTIVE'
    );

    if (activeRelationships.length > 0) {
      throw new ValidationError(
        'Cannot delete family member with active relationships. Deactivate relationships first.'
      );
    }

    await this.repository.delete(id, context);
  }

  /**
   * Check if user has access to this family member's organization
   */
  private checkOrganizationalAccess(
    familyMember: FamilyMember,
    context: UserContext
  ): void {
    if (familyMember.organizationId !== context.organizationId) {
      throw new PermissionError(
        'You do not have access to this family member'
      );
    }
  }

  /**
   * Check if organization ID matches user context
   */
  private checkOrganizationMatch(
    organizationId: string,
    context: UserContext
  ): void {
    if (organizationId !== context.organizationId) {
      throw new PermissionError(
        'You do not have access to this organization'
      );
    }
  }
}
