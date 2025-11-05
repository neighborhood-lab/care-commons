import bcrypt from 'bcrypt';
import type { UserContext } from '@care-commons/core';
import { FamilyMemberRepository } from '../repository/family-member-repository.js';
import type {
  FamilyMember,
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
  FamilyMemberSearchFilter,
  NotificationPreferences,
  FamilyPermissions,
} from '../types/family.js';
import {
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  familyMemberSearchSchema,
} from '../validation/family-validator.js';

const SALT_ROUNDS = 10;

export class FamilyMemberService {
  constructor(private repository: FamilyMemberRepository) {}

  /**
   * Create a new family member
   */
  async create(input: CreateFamilyMemberInput, context: UserContext): Promise<FamilyMember> {
    // Validate input
    const validated = createFamilyMemberSchema.parse(input);

    // Hash password if portal access is enabled
    let portalPasswordHash: string | undefined;
    if (validated.portalAccessEnabled && validated.portalPassword) {
      portalPasswordHash = await bcrypt.hash(validated.portalPassword, SALT_ROUNDS);
    }

    // Set default notification preferences
    const notificationPreferences: NotificationPreferences = {
      visitStart: true,
      visitEnd: true,
      visitSummary: true,
      missedVisit: true,
      scheduleChange: true,
      emergencyAlert: true,
      medicationReminder: false,
      appointmentReminder: true,
      carePlanUpdate: true,
      ...validated.notificationPreferences,
    };

    // Set default permissions
    const permissions: FamilyPermissions = {
      viewVisitHistory: true,
      viewCarePlan: true,
      viewMedications: false,
      viewMedicalNotes: false,
      viewCaregiverInfo: true,
      requestVisitChanges: true,
      provideFeedback: true,
      viewBilling: false,
      ...validated.permissions,
    };

    const familyMember: Partial<FamilyMember> = {
      organizationId: validated.organizationId,
      clientId: validated.clientId,
      firstName: validated.firstName,
      lastName: validated.lastName,
      relationship: validated.relationship,
      phone: validated.phone,
      email: validated.email,
      preferredContactMethod: validated.preferredContactMethod,
      portalAccessEnabled: validated.portalAccessEnabled || false,
      portalUsername: validated.portalUsername,
      portalPasswordHash,
      notificationPreferences,
      permissions,
      status: 'ACTIVE',
      isPrimaryContact: validated.isPrimaryContact || false,
      isEmergencyContact: validated.isEmergencyContact || false,
    };

    return this.repository.create(familyMember, context);
  }

  /**
   * Update family member
   */
  async update(
    id: string,
    input: UpdateFamilyMemberInput,
    context: UserContext
  ): Promise<FamilyMember> {
    // Validate input
    const validated = updateFamilyMemberSchema.parse(input);

    // Get existing family member
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Family member not found: ${id}`);
    }

    // Check organization match
    if (existing.organizationId !== context.organizationId) {
      throw new Error('Not authorized to update this family member');
    }

    // Build update object
    const updates: Partial<FamilyMember> = {
      ...validated,
    };

    // Merge preferences if provided
    if (validated.notificationPreferences) {
      updates.notificationPreferences = {
        ...existing.notificationPreferences,
        ...validated.notificationPreferences,
      };
    }

    if (validated.permissions) {
      updates.permissions = {
        ...existing.permissions,
        ...validated.permissions,
      };
    }

    return this.repository.update(id, updates, context);
  }

  /**
   * Get family member by ID
   */
  async findById(id: string, context: UserContext): Promise<FamilyMember | null> {
    const familyMember = await this.repository.findById(id);

    if (!familyMember) {
      return null;
    }

    // Check organization match
    if (familyMember.organizationId !== context.organizationId) {
      throw new Error('Not authorized to view this family member');
    }

    return familyMember;
  }

  /**
   * Search family members
   */
  async search(filter: FamilyMemberSearchFilter, context: UserContext) {
    // Validate filter
    const validated = familyMemberSearchSchema.parse(filter);

    // Add organization filter
    const searchFilter: FamilyMemberSearchFilter = {
      ...validated,
    };

    return this.repository.search(searchFilter, validated.page, validated.limit);
  }

  /**
   * Get family members for a client
   */
  async findByClientId(clientId: string, context: UserContext): Promise<FamilyMember[]> {
    const familyMembers = await this.repository.findByClientId(clientId);

    // Filter by organization
    return familyMembers.filter(
      (fm) => fm.organizationId === context.organizationId
    );
  }

  /**
   * Delete (soft delete) family member
   */
  async delete(id: string, context: UserContext): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error(`Family member not found: ${id}`);
    }

    if (existing.organizationId !== context.organizationId) {
      throw new Error('Not authorized to delete this family member');
    }

    await this.repository.delete(id, context);
  }

  /**
   * Enable portal access for family member
   */
  async enablePortalAccess(
    id: string,
    username: string,
    password: string,
    context: UserContext
  ): Promise<FamilyMember> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error(`Family member not found: ${id}`);
    }

    if (existing.organizationId !== context.organizationId) {
      throw new Error('Not authorized to update this family member');
    }

    // Check if username is already taken
    const existingUser = await this.repository.findByPortalUsername(username);
    if (existingUser && existingUser.id !== id) {
      throw new Error('Username already taken');
    }

    // Hash password
    const portalPasswordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const updates: Partial<FamilyMember> = {
      portalAccessEnabled: true,
      portalUsername: username,
      portalPasswordHash,
    };

    return this.repository.update(id, updates, context);
  }

  /**
   * Disable portal access
   */
  async disablePortalAccess(id: string, context: UserContext): Promise<FamilyMember> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error(`Family member not found: ${id}`);
    }

    if (existing.organizationId !== context.organizationId) {
      throw new Error('Not authorized to update this family member');
    }

    const updates: Partial<FamilyMember> = {
      portalAccessEnabled: false,
    };

    return this.repository.update(id, updates, context);
  }

  /**
   * Authenticate family member for portal access
   */
  async authenticatePortal(username: string, password: string): Promise<FamilyMember | null> {
    const familyMember = await this.repository.findByPortalUsername(username);

    if (!familyMember) {
      return null;
    }

    if (!familyMember.portalAccessEnabled) {
      return null;
    }

    if (!familyMember.portalPasswordHash) {
      return null;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, familyMember.portalPasswordHash);

    if (!passwordMatch) {
      return null;
    }

    // Update last login
    await this.repository.updatePortalLastLogin(familyMember.id);

    return familyMember;
  }

  /**
   * Change portal password
   */
  async changePortalPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
    context: UserContext
  ): Promise<void> {
    const familyMember = await this.repository.findById(id);

    if (!familyMember) {
      throw new Error(`Family member not found: ${id}`);
    }

    if (!familyMember.portalAccessEnabled || !familyMember.portalPasswordHash) {
      throw new Error('Portal access not enabled');
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      familyMember.portalPasswordHash
    );

    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const portalPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const updates: Partial<FamilyMember> = {
      portalPasswordHash,
    };

    await this.repository.update(id, updates, context);
  }
}
