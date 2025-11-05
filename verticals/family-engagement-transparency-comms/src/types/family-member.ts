/**
 * Family Member domain model
 *
 * Represents family members who access the family portal to:
 * - View care information about their loved ones
 * - Communicate with care staff
 * - Track care progress and updates
 * - Manage preferences and notifications
 */

import { Entity, SoftDeletable, UUID } from '@care-commons/core';

/**
 * Core family member entity
 */
export interface FamilyMember extends Entity, SoftDeletable {
  id: UUID;
  organizationId: UUID;

  // Identity
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  suffix?: string; // Jr., Sr., III, etc.

  // Contact information
  email: string;
  primaryPhone?: PhoneInfo;
  alternatePhone?: PhoneInfo;
  preferredContactMethod: ContactMethod;
  communicationPreferences?: CommunicationPreferences;
  address?: Address;

  // Account & authentication
  authUserId?: string; // References external auth system (Auth0, Cognito, etc.)
  accountActive: boolean;
  accountActivatedAt?: Date;
  lastLoginAt?: Date;
  accountStatus: AccountStatus;

  // Portal preferences
  portalPreferences?: PortalPreferences;

  // Security
  requiresTwoFactor: boolean;
  passwordChangedAt?: Date;
  termsAcceptedAt?: Date;
  termsVersion?: string;

  // Audit fields
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
  deletedAt?: Date;
  deletedBy?: UUID;
}

/**
 * Phone information structure
 */
export interface PhoneInfo {
  number: string;
  type: PhoneType;
  extension?: string;
  preferredTime?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
  canText?: boolean;
}

export type PhoneType = 'MOBILE' | 'HOME' | 'WORK' | 'OTHER';

/**
 * Address structure
 */
export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  county?: string;
}

/**
 * Preferred contact methods
 */
export type ContactMethod = 'EMAIL' | 'SMS' | 'PHONE' | 'APP';

/**
 * Communication preferences
 */
export interface CommunicationPreferences {
  language?: string; // ISO 639-1 code (e.g., 'en', 'es')
  timezone?: string; // IANA timezone (e.g., 'America/New_York')
  quietHours?: QuietHours;
  notificationFrequency?: NotificationFrequency;
  emailOptOut?: boolean;
  smsOptOut?: boolean;
  pushOptOut?: boolean;
}

/**
 * Quiet hours when notifications should not be sent
 */
export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format (e.g., '22:00')
  endTime: string; // HH:mm format (e.g., '08:00')
  timezone: string;
}

/**
 * How often to batch notifications
 */
export type NotificationFrequency =
  | 'IMMEDIATE' // Send each notification as it occurs
  | 'HOURLY' // Batch notifications hourly
  | 'DAILY' // Daily digest
  | 'WEEKLY'; // Weekly summary

/**
 * Account status enum
 */
export type AccountStatus =
  | 'PENDING_ACTIVATION' // Invited but not activated
  | 'ACTIVE' // Active and can log in
  | 'SUSPENDED' // Temporarily suspended
  | 'DEACTIVATED'; // Permanently deactivated

/**
 * Portal preferences
 */
export interface PortalPreferences {
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  dashboardLayout?: 'GRID' | 'LIST' | 'COMPACT';
  defaultView?: 'DASHBOARD' | 'MESSAGES' | 'SCHEDULE' | 'CARE_PLAN';
  language?: string;
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12H' | '24H';
  showTutorials?: boolean;
}

/**
 * Input for creating a new family member
 */
export interface CreateFamilyMemberInput {
  organizationId: UUID;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  suffix?: string;
  email: string;
  primaryPhone?: PhoneInfo;
  alternatePhone?: PhoneInfo;
  preferredContactMethod?: ContactMethod;
  communicationPreferences?: CommunicationPreferences;
  address?: Address;
  portalPreferences?: PortalPreferences;
  requiresTwoFactor?: boolean;
}

/**
 * Input for updating an existing family member
 */
export interface UpdateFamilyMemberInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  suffix?: string;
  email?: string;
  primaryPhone?: PhoneInfo;
  alternatePhone?: PhoneInfo;
  preferredContactMethod?: ContactMethod;
  communicationPreferences?: CommunicationPreferences;
  address?: Address;
  portalPreferences?: PortalPreferences;
  requiresTwoFactor?: boolean;
  accountActive?: boolean;
  accountStatus?: AccountStatus;
}

/**
 * Family member search filters
 */
export interface FamilyMemberSearchFilters {
  organizationId: UUID;
  email?: string;
  lastName?: string;
  accountStatus?: AccountStatus;
  accountActive?: boolean;
  searchTerm?: string; // Full-text search across name and email
}

/**
 * Family member with relationship summary
 */
export interface FamilyMemberWithRelationships extends FamilyMember {
  relationships: Array<{
    clientId: UUID;
    clientName: string;
    relationshipType: string;
    isPrimaryContact: boolean;
  }>;
  activeRelationshipsCount: number;
}
