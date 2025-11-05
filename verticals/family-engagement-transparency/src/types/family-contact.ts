/**
 * Authorized Family Contact Types
 *
 * Types for managing authorized family members with portal access
 * and communication preferences.
 */

/**
 * Role types for family contacts
 */
export type FamilyContactRole =
  | 'VIEW_ONLY'          // Can view progress and updates only
  | 'RECEIVE_UPDATES'    // Receives notifications but limited portal access
  | 'CARE_COORDINATOR'   // Can participate in care decisions
  | 'EMERGENCY_CONTACT'; // Primary emergency contact

/**
 * Access level determines what information is visible
 */
export type AccessLevel =
  | 'BASIC'    // Summary information only
  | 'STANDARD' // Detailed progress and care plans
  | 'FULL';    // Complete access including sensitive information

/**
 * Status of the family contact authorization
 */
export type FamilyContactStatus =
  | 'ACTIVE'    // Currently authorized
  | 'INACTIVE'  // Temporarily inactive
  | 'SUSPENDED' // Suspended pending review
  | 'REVOKED';  // Authorization revoked

/**
 * Method used to obtain consent
 */
export type ConsentMethod =
  | 'E_SIGNATURE' // Electronic signature
  | 'VERBAL'      // Verbal consent documented
  | 'WRITTEN'     // Physical signature
  | 'DIGITAL';    // Digital consent form

/**
 * Relationship types
 */
export type RelationshipType =
  | 'PARENT'
  | 'SPOUSE'
  | 'CHILD'
  | 'SIBLING'
  | 'GUARDIAN'
  | 'POWER_OF_ATTORNEY'
  | 'HEALTHCARE_PROXY'
  | 'FRIEND'
  | 'OTHER';

/**
 * Permissions granted to family contact
 */
export interface FamilyContactPermissions {
  // View permissions
  viewProgressNotes: boolean;
  viewCarePlan: boolean;
  viewSchedule: boolean;
  viewMedications: boolean;
  viewHealthRecords: boolean;
  viewPhotos: boolean;
  viewFinancial: boolean;

  // Communication permissions
  messageCaregiver: boolean;
  messageCoordinator: boolean;
  receiveNotifications: boolean;

  // Action permissions
  approveScheduleChanges: boolean;
  requestVisitChanges: boolean;
  updateContactInfo: boolean;

  // Document access
  downloadReports: boolean;
  viewIncidentReports: boolean;
}

/**
 * Document reference for consent forms
 */
export interface ConsentDocument {
  id: string;
  documentType: 'CONSENT_FORM' | 'AUTHORIZATION' | 'HIPAA_RELEASE' | 'OTHER';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

/**
 * Notification preferences for family contact
 */
export interface FamilyNotificationPreferences {
  // General preferences
  enabled: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;   // HH:MM format
  timezone?: string;

  // Notification types
  progressUpdates: boolean;
  scheduleChanges: boolean;
  careTeamMessages: boolean;
  incidents: boolean;
  milestones: boolean;
  billingUpdates: boolean;

  // Channel preferences per type
  progressUpdates_email: boolean;
  progressUpdates_sms: boolean;
  progressUpdates_push: boolean;

  scheduleChanges_email: boolean;
  scheduleChanges_sms: boolean;
  scheduleChanges_push: boolean;

  careTeamMessages_email: boolean;
  careTeamMessages_sms: boolean;
  careTeamMessages_push: boolean;

  incidents_email: boolean;
  incidents_sms: boolean;
  incidents_push: boolean;

  // Frequency preferences
  summaryFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER';
  digestPreferred: boolean; // Batch notifications vs immediate
}

/**
 * Authorized Family Contact entity
 */
export interface AuthorizedFamilyContact {
  // Identity
  id: string;
  clientId: string;
  organizationId: string;

  // Contact information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string;

  // Access control
  role: FamilyContactRole;
  permissions: FamilyContactPermissions;
  accessLevel: AccessLevel;

  // Portal access
  portalUserId?: string;
  accessCode?: string;
  accessCodeExpiresAt?: Date;
  portalAccessEnabled: boolean;
  lastPortalAccessAt?: Date;

  // Consent & authorization
  isLegalGuardian: boolean;
  consentGiven: boolean;
  consentDate?: Date;
  consentMethod?: ConsentMethod;
  consentNotes?: string;
  consentDocuments?: ConsentDocument[];

  // Communication preferences
  notifyByEmail: boolean;
  notifyBySms: boolean;
  notifyByPush: boolean;
  notificationPreferences?: FamilyNotificationPreferences;

  // Status
  status: FamilyContactStatus;
  statusNotes?: string;
  activatedAt?: Date;
  deactivatedAt?: Date;
  deactivatedBy?: string;

  // Audit fields
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

/**
 * Create family contact input
 */
export interface CreateFamilyContactInput {
  clientId: string;
  organizationId: string;

  // Contact information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string;

  // Access control
  role: FamilyContactRole;
  accessLevel?: AccessLevel;
  permissions?: Partial<FamilyContactPermissions>;

  // Portal access
  portalAccessEnabled?: boolean;
  generateAccessCode?: boolean;

  // Consent
  isLegalGuardian?: boolean;
  consentGiven?: boolean;
  consentMethod?: ConsentMethod;
  consentNotes?: string;

  // Communication preferences
  notifyByEmail?: boolean;
  notifyBySms?: boolean;
  notifyByPush?: boolean;
}

/**
 * Update family contact input
 */
export interface UpdateFamilyContactInput {
  // Contact information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  relationship?: string;

  // Access control
  role?: FamilyContactRole;
  accessLevel?: AccessLevel;
  permissions?: Partial<FamilyContactPermissions>;

  // Portal access
  portalAccessEnabled?: boolean;
  regenerateAccessCode?: boolean;

  // Communication preferences
  notifyByEmail?: boolean;
  notifyBySms?: boolean;
  notifyByPush?: boolean;
  notificationPreferences?: Partial<FamilyNotificationPreferences>;

  // Status
  status?: FamilyContactStatus;
  statusNotes?: string;
}

/**
 * Search criteria for family contacts
 */
export interface FamilyContactSearchCriteria {
  organizationId?: string;
  clientId?: string;
  email?: string;
  role?: FamilyContactRole[];
  status?: FamilyContactStatus[];
  isLegalGuardian?: boolean;
  portalAccessEnabled?: boolean;
  searchText?: string; // Search across name, email, relationship
}

/**
 * Family contact with client details
 */
export interface FamilyContactWithClient extends AuthorizedFamilyContact {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  };
}
