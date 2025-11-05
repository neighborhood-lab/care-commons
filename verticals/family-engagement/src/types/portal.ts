/**
 * Family Portal domain models
 *
 * Portal access for family members and authorized contacts:
 * - Family member accounts and authentication
 * - Access permissions and role management
 * - Client relationship tracking
 * - Portal activity logging
 * - Privacy and consent management
 * - HIPAA compliance for family data access
 */

import {
  Entity,
  SoftDeletable,
  UUID,
} from '@care-commons/core';

/**
 * Family member portal account
 * Links external family members to clients they can view
 */
export interface FamilyMember extends Entity, SoftDeletable {
  id: UUID;

  // Identity
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;

  // Authentication
  authProviderId?: string; // External auth provider ID (Auth0, Cognito, etc.)
  emailVerified: boolean;
  emailVerifiedAt?: Date;

  // Portal Access
  status: FamilyMemberStatus;
  lastLoginAt?: Date;
  invitedAt?: Date;
  invitedBy?: UUID; // Staff member who sent invitation
  acceptedAt?: Date;

  // Preferences
  preferredLanguage?: string;
  timezone?: string;
  notificationPreferences: NotificationPreferences;

  // Security
  twoFactorEnabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type FamilyMemberStatus =
  | 'INVITED'      // Invitation sent, not yet accepted
  | 'ACTIVE'       // Active account with portal access
  | 'SUSPENDED'    // Temporarily suspended access
  | 'INACTIVE'     // Account deactivated
  | 'EXPIRED';     // Invitation expired

/**
 * Notification preferences for family members
 */
export interface NotificationPreferences {
  email: {
    visitReminders: boolean;
    visitCompletions: boolean;
    carePlanUpdates: boolean;
    messages: boolean;
    systemAlerts: boolean;
  };
  sms: {
    visitReminders: boolean;
    visitCompletions: boolean;
    urgentMessages: boolean;
  };
  push: {
    messages: boolean;
    updates: boolean;
  };
}

/**
 * Links family members to clients with specific permissions
 * Implements principle of least privilege for PHI access
 */
export interface FamilyClientAccess extends Entity {
  id: UUID;

  // Relationships
  familyMemberId: UUID;
  clientId: UUID;

  // Relationship Type
  relationshipType: RelationshipType;
  isPrimaryContact: boolean;

  // Access Permissions
  permissions: FamilyAccessPermissions;

  // Legal Authorization
  consentStatus: ConsentStatus;
  consentDate?: Date;
  consentFormId?: UUID; // Reference to signed consent document
  legalAuthority?: LegalAuthority;

  // Access Control
  status: AccessStatus;
  grantedAt: Date;
  grantedBy: UUID; // Staff member who granted access
  revokedAt?: Date;
  revokedBy?: UUID;
  revokedReason?: string;

  // Audit
  lastAccessedAt?: Date;
  accessCount: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type RelationshipType =
  | 'PARENT'
  | 'CHILD'
  | 'SPOUSE'
  | 'SIBLING'
  | 'GRANDPARENT'
  | 'GRANDCHILD'
  | 'GUARDIAN'
  | 'POWER_OF_ATTORNEY'
  | 'HEALTHCARE_PROXY'
  | 'AUTHORIZED_REPRESENTATIVE'
  | 'OTHER';

export type ConsentStatus =
  | 'PENDING'      // Consent form sent, awaiting signature
  | 'GRANTED'      // Valid consent on file
  | 'EXPIRED'      // Consent needs renewal
  | 'REVOKED'      // Client revoked consent
  | 'DENIED';      // Client denied access

export type AccessStatus =
  | 'ACTIVE'       // Can access portal and view data
  | 'SUSPENDED'    // Temporarily suspended
  | 'REVOKED'      // Permanently revoked
  | 'EXPIRED';     // Time-limited access expired

export type LegalAuthority =
  | 'HEALTHCARE_POA'           // Healthcare Power of Attorney
  | 'DURABLE_POA'             // Durable Power of Attorney
  | 'GUARDIANSHIP'            // Court-appointed guardian
  | 'CONSERVATORSHIP'         // Court-appointed conservator
  | 'HIPAA_AUTHORIZATION'     // HIPAA-compliant authorization form
  | 'CLIENT_CONSENT';         // Direct client consent

/**
 * Fine-grained permissions for family portal access
 * Controls what PHI and features family members can access
 */
export interface FamilyAccessPermissions {
  // Care Information
  viewCarePlan: boolean;
  viewCarePlanGoals: boolean;
  viewCarePlanTasks: boolean;

  // Visit Information
  viewScheduledVisits: boolean;
  viewVisitHistory: boolean;
  viewVisitNotes: boolean;
  viewCaregiverInfo: boolean;

  // Health Information (PHI)
  viewMedicalInfo: boolean;
  viewMedications: boolean;
  viewVitalSigns: boolean;
  viewProgressNotes: boolean;

  // Communication
  sendMessages: boolean;
  receiveMessages: boolean;
  requestVisitChanges: boolean;

  // Documents
  viewDocuments: boolean;
  downloadDocuments: boolean;
  uploadDocuments: boolean;

  // Administrative
  viewBillingInfo: boolean;
  viewInvoices: boolean;
}

/**
 * Default permission templates for common scenarios
 */
export const DEFAULT_PERMISSIONS: Record<string, FamilyAccessPermissions> = {
  FULL_ACCESS: {
    viewCarePlan: true,
    viewCarePlanGoals: true,
    viewCarePlanTasks: true,
    viewScheduledVisits: true,
    viewVisitHistory: true,
    viewVisitNotes: true,
    viewCaregiverInfo: true,
    viewMedicalInfo: true,
    viewMedications: true,
    viewVitalSigns: true,
    viewProgressNotes: true,
    sendMessages: true,
    receiveMessages: true,
    requestVisitChanges: true,
    viewDocuments: true,
    downloadDocuments: true,
    uploadDocuments: true,
    viewBillingInfo: true,
    viewInvoices: true,
  },
  LIMITED_ACCESS: {
    viewCarePlan: true,
    viewCarePlanGoals: true,
    viewCarePlanTasks: false,
    viewScheduledVisits: true,
    viewVisitHistory: true,
    viewVisitNotes: false,
    viewCaregiverInfo: true,
    viewMedicalInfo: false,
    viewMedications: false,
    viewVitalSigns: false,
    viewProgressNotes: false,
    sendMessages: true,
    receiveMessages: true,
    requestVisitChanges: false,
    viewDocuments: false,
    downloadDocuments: false,
    uploadDocuments: false,
    viewBillingInfo: false,
    viewInvoices: false,
  },
  VIEW_ONLY: {
    viewCarePlan: true,
    viewCarePlanGoals: true,
    viewCarePlanTasks: true,
    viewScheduledVisits: true,
    viewVisitHistory: true,
    viewVisitNotes: true,
    viewCaregiverInfo: true,
    viewMedicalInfo: false,
    viewMedications: false,
    viewVitalSigns: false,
    viewProgressNotes: false,
    sendMessages: false,
    receiveMessages: true,
    requestVisitChanges: false,
    viewDocuments: true,
    downloadDocuments: false,
    uploadDocuments: false,
    viewBillingInfo: false,
    viewInvoices: false,
  },
};

/**
 * Portal activity log for audit trail
 * Tracks all family member interactions with PHI
 */
export interface PortalActivityLog extends Entity {
  id: UUID;

  // Who
  familyMemberId: UUID;
  clientId: UUID;

  // What
  activityType: PortalActivityType;
  resourceType: string; // 'care_plan', 'visit', 'message', etc.
  resourceId?: UUID;
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'DOWNLOAD';

  // Details
  description: string;
  metadata?: Record<string, unknown>;

  // When & Where
  occurredAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;

  // PHI Access Tracking (HIPAA §164.528)
  isPHIAccess: boolean;
  phiDisclosureType?: string;
}

export type PortalActivityType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW_CARE_PLAN'
  | 'VIEW_VISIT'
  | 'VIEW_DOCUMENT'
  | 'DOWNLOAD_DOCUMENT'
  | 'SEND_MESSAGE'
  | 'READ_MESSAGE'
  | 'UPDATE_PREFERENCES'
  | 'ACCEPT_INVITATION'
  | 'REVOKE_ACCESS';

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os?: string;
  browser?: string;
  appVersion?: string;
}

/**
 * Family portal invitation
 */
export interface FamilyInvitation {
  id: UUID;
  clientId: UUID;
  email: string;
  relationshipType: RelationshipType;
  permissions: FamilyAccessPermissions;
  invitedBy: UUID;
  invitedAt: Date;
  expiresAt: Date;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
}
