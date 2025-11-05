import type { UUID, Timestamp } from '@care-commons/core';

/**
 * Family Member Account
 * Represents a family member with portal access
 */
export interface FamilyMember {
  id: UUID;
  organizationId: UUID;
  clientId: UUID;
  authorizedContactId: UUID;

  // Account credentials
  email: string;
  passwordHash: string;

  // Profile
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;

  // Access control
  status: FamilyMemberStatus;
  permissions: FamilyPermission[];
  accessLevel: FamilyAccessLevel;

  // Preferences
  preferences: FamilyMemberPreferences;
  notificationSettings: NotificationSettings;

  // Security
  lastLoginAt?: Timestamp;
  lastPasswordChangeAt?: Timestamp;
  passwordResetToken?: string;
  passwordResetExpires?: Timestamp;

  // Audit
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
  deletedAt?: Timestamp;
}

export type FamilyMemberStatus =
  | 'INVITED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'REVOKED';

export type FamilyPermission =
  | 'VIEW_PROFILE'
  | 'VIEW_CARE_PLAN'
  | 'VIEW_VISITS'
  | 'VIEW_NOTES'
  | 'VIEW_MEDICATIONS'
  | 'VIEW_DOCUMENTS'
  | 'RECEIVE_NOTIFICATIONS'
  | 'USE_CHATBOT'
  | 'REQUEST_UPDATES'
  | 'MESSAGE_STAFF';

export type FamilyAccessLevel = 'BASIC' | 'STANDARD' | 'FULL';

export interface FamilyMemberPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  dashboardLayout?: string;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    careUpdates: boolean;
    visitReminders: boolean;
    emergencyAlerts: boolean;
    chatMessages: boolean;
  };
  sms: {
    enabled: boolean;
    emergencyOnly: boolean;
  };
  push: {
    enabled: boolean;
    careUpdates: boolean;
    chatMessages: boolean;
  };
}

/**
 * Family Member Invitation
 */
export interface FamilyInvitation {
  id: UUID;
  organizationId: UUID;
  clientId: UUID;
  authorizedContactId: UUID;

  // Invitation details
  email: string;
  token: string;
  expiresAt: Timestamp;

  // Status
  status: InvitationStatus;
  sentAt: Timestamp;
  acceptedAt?: Timestamp;
  revokedAt?: Timestamp;

  // Permissions
  proposedPermissions: FamilyPermission[];
  proposedAccessLevel: FamilyAccessLevel;

  // Audit
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
}

export type InvitationStatus =
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED';

/**
 * Family Member Session
 */
export interface FamilySession {
  id: UUID;
  familyMemberId: UUID;
  token: string;
  refreshToken?: string;

  // Session info
  ipAddress: string;
  userAgent: string;
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };

  // Timing
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastActivityAt: Timestamp;

  // Status
  isActive: boolean;
  revokedAt?: Timestamp;
  revokedReason?: string;
}

/**
 * Input types for creating/updating family members
 */
export interface CreateFamilyMemberInput {
  organizationId: UUID;
  clientId: UUID;
  authorizedContactId: UUID;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  permissions: FamilyPermission[];
  accessLevel: FamilyAccessLevel;
}

export interface UpdateFamilyMemberInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  preferences?: Partial<FamilyMemberPreferences>;
  notificationSettings?: Partial<NotificationSettings>;
}

export interface CreateInvitationInput {
  organizationId: UUID;
  clientId: UUID;
  authorizedContactId: UUID;
  email: string;
  permissions: FamilyPermission[];
  accessLevel: FamilyAccessLevel;
  expiresInDays?: number; // default 7 days
}

export interface AcceptInvitationInput {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  preferences?: Partial<FamilyMemberPreferences>;
}

/**
 * Authentication types
 */
export interface FamilyLoginCredentials {
  email: string;
  password: string;
}

export interface FamilyAuthResponse {
  familyMember: Omit<FamilyMember, 'passwordHash'>;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface FamilyPasswordResetRequest {
  email: string;
}

export interface FamilyPasswordReset {
  token: string;
  newPassword: string;
}
