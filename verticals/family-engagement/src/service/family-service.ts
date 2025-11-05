/**
 * Family member service - business logic layer
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
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
  FamilyAccessRule,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  InviteFamilyMemberRequest,
  HipaaAuthorizationRequest,
  FamilyMemberFilterOptions,
  AccessCheckRequest,
  AccessCheckResponse,
  ResourceType,
  Permission,
  ConsentPreferences,
  FamilyNotificationPreferences,
} from '../types/family.js';
import {
  FamilyMemberRepository,
  FamilyAccessRuleRepository,
} from '../repository/family-repository.js';

export class FamilyService {
  private familyRepository: FamilyMemberRepository;
  private accessRuleRepository: FamilyAccessRuleRepository;
  private permissionService = getPermissionService();

  constructor(
    familyRepository: FamilyMemberRepository,
    accessRuleRepository: FamilyAccessRuleRepository
  ) {
    this.familyRepository = familyRepository;
    this.accessRuleRepository = accessRuleRepository;
  }

  /**
   * Create a new family member
   */
  async createFamilyMember(
    request: CreateFamilyMemberRequest,
    context: UserContext
  ): Promise<FamilyMember> {
    // Check permissions
    this.permissionService.requirePermission(context, 'family:create');

    // Validate input
    this.validateEmail(request.email);

    // Check for duplicate email for this care recipient
    const existing = await this.familyRepository.findByEmailAndCareRecipient(
      request.email,
      request.careRecipientId
    );
    if (existing) {
      throw new ValidationError(
        'A family member with this email already exists for this care recipient'
      );
    }

    // Build family member entity
    const familyMember: Partial<FamilyMember> = {
      organizationId: request.organizationId,
      careRecipientId: request.careRecipientId,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
      relationship: request.relationship,
      accessLevel: request.accessLevel || 'BASIC',
      permissions: {},
      isPrimaryContact: request.isPrimaryContact || false,
      isEmergencyContact: request.isEmergencyContact || false,
      invitationStatus: 'PENDING',
      hipaaAuthorizationSigned: false,
      consentPreferences: this.getDefaultConsentPreferences(),
      status: 'ACTIVE',
      notificationPreferences: this.getDefaultNotificationPreferences(),
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
    };

    // Create family member
    const created = await this.familyRepository.create(familyMember, context);

    // Create default access rules based on access level
    await this.createDefaultAccessRules(created.id, created.accessLevel, context);

    // Send invitation if requested
    if (request.sendInvitation) {
      await this.sendInvitation(
        {
          familyMemberId: created.id,
        },
        context
      );
    }

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

    const familyMember = await this.familyRepository.findById(id);
    if (!familyMember) {
      throw new NotFoundError(`Family member not found: ${id}`);
    }

    // Check organizational access
    if (familyMember.organizationId !== context.organizationId) {
      throw new PermissionError('Access denied to this family member');
    }

    return familyMember;
  }

  /**
   * Get family members by filters
   */
  async getFamilyMembers(
    filters: FamilyMemberFilterOptions,
    context: UserContext
  ): Promise<PaginatedResult<FamilyMember>> {
    this.permissionService.requirePermission(context, 'family:read');

    // Enforce organization scope
    filters.organizationId = context.organizationId;

    return this.familyRepository.findByFilters(filters);
  }

  /**
   * Get family members for a care recipient
   */
  async getFamilyMembersForCareRecipient(
    careRecipientId: string,
    context: UserContext
  ): Promise<FamilyMember[]> {
    this.permissionService.requirePermission(context, 'family:read');

    const result = await this.familyRepository.findByFilters({
      careRecipientId,
      organizationId: context.organizationId,
    });

    return result.items;
  }

  /**
   * Update family member
   */
  async updateFamilyMember(
    id: string,
    updates: UpdateFamilyMemberRequest,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:update');

    // Verify family member exists
    const familyMember = await this.getFamilyMemberById(id, context);

    // Validate email if being updated
    if (updates.email && updates.email !== familyMember.email) {
      this.validateEmail(updates.email);

      // Check for duplicate
      const existing = await this.familyRepository.findByEmailAndCareRecipient(
        updates.email,
        familyMember.careRecipientId
      );
      if (existing && existing.id !== id) {
        throw new ValidationError(
          'A family member with this email already exists for this care recipient'
        );
      }
    }

    // Update access rules if access level changed
    if (updates.accessLevel && updates.accessLevel !== familyMember.accessLevel) {
      await this.updateAccessRulesForLevel(id, updates.accessLevel, context);
    }

    // Update family member
    const updated = await this.familyRepository.update(id, updates, context);

    return updated;
  }

  /**
   * Send invitation to family member
   */
  async sendInvitation(
    request: InviteFamilyMemberRequest,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'family:invite');

    const familyMember = await this.getFamilyMemberById(
      request.familyMemberId,
      context
    );

    // Cannot invite if already accepted
    if (familyMember.invitationStatus === 'ACCEPTED') {
      throw new ValidationError('Family member has already accepted invitation');
    }

    // Generate invitation token
    const invitationToken = uuidv4();
    const expirationDays = request.expirationDays || 7;
    const expiresAt = addDays(new Date(), expirationDays);

    // Update family member
    await this.familyRepository.update(
      request.familyMemberId,
      {
        invitationStatus: 'SENT',
        invitationToken,
        invitationSentAt: new Date(),
        invitationExpiresAt: expiresAt,
      },
      context
    );

    // TODO: Send actual invitation email via notification service
    // This would integrate with the notification service to send email
    console.log(`Invitation sent to ${familyMember.email} with token: ${invitationToken}`);
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    invitationToken: string,
    userId: string,
    context: UserContext
  ): Promise<FamilyMember> {
    const familyMember = await this.familyRepository.findByInvitationToken(
      invitationToken
    );

    if (!familyMember) {
      throw new NotFoundError('Invalid invitation token');
    }

    // Check if invitation is expired
    if (
      familyMember.invitationExpiresAt &&
      familyMember.invitationExpiresAt < new Date()
    ) {
      throw new ValidationError('Invitation has expired');
    }

    // Check if already accepted
    if (familyMember.invitationStatus === 'ACCEPTED') {
      throw new ValidationError('Invitation has already been accepted');
    }

    // Update family member
    const updated = await this.familyRepository.update(
      familyMember.id,
      {
        userId,
        invitationStatus: 'ACCEPTED',
        invitationAcceptedAt: new Date(),
        invitationToken: null, // Clear token after acceptance
      },
      context
    );

    return updated;
  }

  /**
   * Record HIPAA authorization
   */
  async recordHipaaAuthorization(
    request: HipaaAuthorizationRequest,
    context: UserContext
  ): Promise<FamilyMember> {
    this.permissionService.requirePermission(context, 'family:update');

    const familyMember = await this.getFamilyMemberById(
      request.familyMemberId,
      context
    );

    // Update family member with HIPAA authorization
    const updated = await this.familyRepository.update(
      request.familyMemberId,
      {
        hipaaAuthorizationSigned: true,
        hipaaAuthorizationDate: request.authorizationDate,
        hipaaAuthorizationDocumentId: request.documentId,
        consentPreferences: request.consentPreferences,
      },
      context
    );

    return updated;
  }

  /**
   * Check if family member has access to resource
   */
  async checkAccess(
    request: AccessCheckRequest,
    context: UserContext
  ): Promise<AccessCheckResponse> {
    const familyMember = await this.getFamilyMemberById(
      request.familyMemberId,
      context
    );

    // Check if family member is active
    if (familyMember.status !== 'ACTIVE') {
      return {
        allowed: false,
        reason: 'Family member is not active',
      };
    }

    // Check if HIPAA authorization is required and signed
    if (!familyMember.hipaaAuthorizationSigned) {
      return {
        allowed: false,
        reason: 'HIPAA authorization not signed',
      };
    }

    // Check consent preferences for resource type
    const hasConsent = this.checkConsentForResource(
      familyMember.consentPreferences,
      request.resourceType
    );

    if (!hasConsent) {
      return {
        allowed: false,
        reason: 'No consent for this resource type',
      };
    }

    // Check specific access rules
    const hasAccess = await this.accessRuleRepository.checkAccess(
      request.familyMemberId,
      request.resourceType,
      request.permission
    );

    if (!hasAccess) {
      return {
        allowed: false,
        reason: 'Access rule not found or denied',
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Deactivate family member
   */
  async deactivateFamilyMember(
    id: string,
    reason: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'family:delete');

    await this.familyRepository.update(
      id,
      {
        status: 'INACTIVE',
        deactivatedAt: new Date(),
        deactivatedBy: context.userId,
        deactivationReason: reason,
      },
      context
    );
  }

  /**
   * Create default access rules based on access level
   */
  private async createDefaultAccessRules(
    familyMemberId: string,
    accessLevel: string,
    context: UserContext
  ): Promise<void> {
    const rules: Array<{ resourceType: ResourceType; permission: Permission; allowed: boolean }> = [];

    switch (accessLevel) {
      case 'BASIC':
        // Can only read basic information
        rules.push(
          { resourceType: 'VISIT', permission: 'READ', allowed: true },
          { resourceType: 'ACTIVITY_FEED', permission: 'READ', allowed: true }
        );
        break;

      case 'STANDARD':
        // Can read most things
        rules.push(
          { resourceType: 'CARE_PLAN', permission: 'READ', allowed: true },
          { resourceType: 'VISIT', permission: 'READ', allowed: true },
          { resourceType: 'TASK', permission: 'READ', allowed: true },
          { resourceType: 'MESSAGE', permission: 'READ', allowed: true },
          { resourceType: 'MESSAGE', permission: 'WRITE', allowed: true },
          { resourceType: 'ACTIVITY_FEED', permission: 'READ', allowed: true },
          { resourceType: 'DOCUMENT', permission: 'READ', allowed: true }
        );
        break;

      case 'FULL':
        // Can read and write most things
        rules.push(
          { resourceType: 'CARE_PLAN', permission: 'READ', allowed: true },
          { resourceType: 'VISIT', permission: 'READ', allowed: true },
          { resourceType: 'TASK', permission: 'READ', allowed: true },
          { resourceType: 'MESSAGE', permission: 'READ', allowed: true },
          { resourceType: 'MESSAGE', permission: 'WRITE', allowed: true },
          { resourceType: 'ACTIVITY_FEED', permission: 'READ', allowed: true },
          { resourceType: 'DOCUMENT', permission: 'READ', allowed: true },
          { resourceType: 'INCIDENT_REPORT', permission: 'READ', allowed: true },
          { resourceType: 'MEDICATION', permission: 'READ', allowed: true },
          { resourceType: 'HEALTH_RECORD', permission: 'READ', allowed: true }
        );
        break;

      case 'ADMIN':
        // Full access to everything
        const allResources: ResourceType[] = [
          'CARE_PLAN',
          'VISIT',
          'TASK',
          'MESSAGE',
          'DOCUMENT',
          'ACTIVITY_FEED',
          'INCIDENT_REPORT',
          'MEDICATION',
          'HEALTH_RECORD',
          'BILLING',
        ];
        const allPermissions: Permission[] = ['READ', 'WRITE', 'DELETE', 'APPROVE'];

        for (const resource of allResources) {
          for (const permission of allPermissions) {
            rules.push({ resourceType: resource, permission, allowed: true });
          }
        }
        break;
    }

    // Create rules
    for (const rule of rules) {
      const familyMember = await this.familyRepository.findById(familyMemberId);
      if (!familyMember) continue;

      await this.accessRuleRepository.create(
        {
          familyMemberId,
          organizationId: familyMember.organizationId,
          resourceType: rule.resourceType,
          permission: rule.permission,
          allowed: rule.allowed,
          conditions: {},
        },
        context
      );
    }
  }

  /**
   * Update access rules when access level changes
   */
  private async updateAccessRulesForLevel(
    familyMemberId: string,
    newAccessLevel: string,
    context: UserContext
  ): Promise<void> {
    // Get existing rules
    const existingRules = await this.accessRuleRepository.findByFamilyMember(
      familyMemberId
    );

    // Delete existing rules
    for (const rule of existingRules) {
      await this.accessRuleRepository.delete(rule.id, context);
    }

    // Create new rules
    await this.createDefaultAccessRules(familyMemberId, newAccessLevel, context);
  }

  /**
   * Check consent for resource type
   */
  private checkConsentForResource(
    consentPreferences: ConsentPreferences,
    resourceType: ResourceType
  ): boolean {
    const mapping: Record<ResourceType, keyof ConsentPreferences> = {
      CARE_PLAN: 'careActivities',
      VISIT: 'careActivities',
      TASK: 'careActivities',
      MESSAGE: 'receiveUpdates',
      DOCUMENT: 'healthInformation',
      ACTIVITY_FEED: 'receiveUpdates',
      INCIDENT_REPORT: 'incidentReports',
      MEDICATION: 'medications',
      HEALTH_RECORD: 'healthInformation',
      BILLING: 'billing',
    };

    const consentKey = mapping[resourceType];
    return consentKey ? consentPreferences[consentKey] : false;
  }

  /**
   * Get default consent preferences
   */
  private getDefaultConsentPreferences(): ConsentPreferences {
    return {
      careActivities: false,
      healthInformation: false,
      medications: false,
      incidentReports: false,
      billing: false,
      receiveUpdates: false,
      receiveAlerts: false,
      receiveDailyDigest: false,
    };
  }

  /**
   * Get default notification preferences
   */
  private getDefaultNotificationPreferences(): FamilyNotificationPreferences {
    return {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: false,
      visitStarted: true,
      visitCompleted: true,
      carePlanUpdated: true,
      taskCompleted: false,
      incidentReported: true,
      medicationChange: true,
      scheduleChanged: true,
      dailyDigestEnabled: false,
      weeklyDigestEnabled: false,
    };
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }
}
