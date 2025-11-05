/**
 * Family Member domain models
 *
 * Family member registration and access control:
 * - Family member information
 * - Access levels and permissions
 * - HIPAA authorization
 * - Invitation management
 * - Notification preferences
 */

import {
  Entity,
  UUID,
} from '@care-commons/core';

/**
 * Access levels for family members
 */
export type FamilyAccessLevel = 'BASIC' | 'STANDARD' | 'FULL' | 'ADMIN';

/**
 * Invitation status
 */
export type InvitationStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

/**
 * Family member status
 */
export type FamilyMemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED';

/**
 * Resource types for access control
 */
export type ResourceType =
  | 'CARE_PLAN'
  | 'VISIT'
  | 'TASK'
  | 'MESSAGE'
  | 'DOCUMENT'
  | 'ACTIVITY_FEED'
  | 'INCIDENT_REPORT'
  | 'MEDICATION'
  | 'HEALTH_RECORD'
  | 'BILLING';

/**
 * Permission types
 */
export type Permission = 'READ' | 'WRITE' | 'DELETE' | 'APPROVE';

/**
 * HIPAA authorization consent preferences
 */
export interface ConsentPreferences {
  // What information can be shared
  careActivities: boolean;
  healthInformation: boolean;
  medications: boolean;
  incidentReports: boolean;
  billing: boolean;

  // Communication preferences
  receiveUpdates: boolean;
  receiveAlerts: boolean;
  receiveDailyDigest: boolean;
}

/**
 * Family member notification preferences
 */
export interface FamilyNotificationPreferences {
  // Notification channels
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;

  // Notification types
  visitStarted: boolean;
  visitCompleted: boolean;
  carePlanUpdated: boolean;
  taskCompleted: boolean;
  incidentReported: boolean;
  medicationChange: boolean;
  scheduleChanged: boolean;

  // Digest preferences
  dailyDigestEnabled: boolean;
  dailyDigestTime?: string; // HH:MM format
  weeklyDigestEnabled: boolean;
  weeklyDigestDay?: number; // 0-6 (Sunday-Saturday)
}

/**
 * Family member entity
 */
export interface FamilyMember extends Entity {
  organizationId: UUID;
  careRecipientId: UUID;
  userId?: UUID; // Nullable until invitation is accepted

  // Family member info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string; // Mother, Son, Legal Guardian, etc.

  // Access control
  accessLevel: FamilyAccessLevel;
  permissions: Record<string, any>; // Granular permissions
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;

  // Invitation status
  invitationStatus: InvitationStatus;
  invitationToken?: string;
  invitationSentAt?: Date;
  invitationExpiresAt?: Date;
  invitationAcceptedAt?: Date;

  // Consent and authorization (HIPAA compliance)
  hipaaAuthorizationSigned: boolean;
  hipaaAuthorizationDate?: Date;
  hipaaAuthorizationDocumentId?: string;
  consentPreferences: ConsentPreferences;

  // Status
  status: FamilyMemberStatus;
  deactivatedAt?: Date;
  deactivatedBy?: UUID;
  deactivationReason?: string;

  // Notification preferences
  notificationPreferences: FamilyNotificationPreferences;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
}

/**
 * Family access rule entity
 */
export interface FamilyAccessRule extends Entity {
  familyMemberId: UUID;
  organizationId: UUID;

  // Access rule definition
  resourceType: ResourceType;
  permission: Permission;
  allowed: boolean;

  // Optional resource-specific constraints
  conditions: Record<string, any>; // Time-based, status-based, etc.
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

/**
 * Family member creation request
 */
export interface CreateFamilyMemberRequest {
  organizationId: UUID;
  careRecipientId: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string;
  accessLevel?: FamilyAccessLevel;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  sendInvitation?: boolean;
}

/**
 * Family member invitation request
 */
export interface InviteFamilyMemberRequest {
  familyMemberId: UUID;
  expirationDays?: number; // Default: 7 days
  customMessage?: string;
  requireHipaaAuthorization?: boolean;
}

/**
 * Family member update request
 */
export interface UpdateFamilyMemberRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  accessLevel?: FamilyAccessLevel;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  status?: FamilyMemberStatus;
  consentPreferences?: Partial<ConsentPreferences>;
  notificationPreferences?: Partial<FamilyNotificationPreferences>;
}

/**
 * HIPAA authorization request
 */
export interface HipaaAuthorizationRequest {
  familyMemberId: UUID;
  documentId: string;
  authorizationDate: Date;
  consentPreferences: ConsentPreferences;
}

/**
 * Family member filter options
 */
export interface FamilyMemberFilterOptions {
  careRecipientId?: UUID;
  organizationId?: UUID;
  status?: FamilyMemberStatus;
  accessLevel?: FamilyAccessLevel;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  search?: string; // Search in name, email
  limit?: number;
  offset?: number;
}

/**
 * Family member with care recipient details
 */
export interface FamilyMemberWithCareRecipient extends FamilyMember {
  careRecipientName: string;
  careRecipientStatus: string;
}

/**
 * Family member summary for list views
 */
export interface FamilyMemberSummary {
  id: UUID;
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  accessLevel: FamilyAccessLevel;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  invitationStatus: InvitationStatus;
  status: FamilyMemberStatus;
  createdAt: Date;
}

/**
 * Access check request
 */
export interface AccessCheckRequest {
  familyMemberId: UUID;
  resourceType: ResourceType;
  resourceId: UUID;
  permission: Permission;
}

/**
 * Access check response
 */
export interface AccessCheckResponse {
  allowed: boolean;
  reason?: string;
  conditions?: Record<string, any>;
}
