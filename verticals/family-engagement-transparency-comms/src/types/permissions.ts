/**
 * Family Permissions domain model
 *
 * Fine-grained access control defining what each family member
 * can view and do in the family portal.
 */

import { Entity, UUID } from '@care-commons/core';

/**
 * Family permissions entity
 */
export interface FamilyPermissions extends Entity {
  id: UUID;
  organizationId: UUID;
  relationshipId: UUID;

  // Care Information Permissions
  canViewCarePlan: boolean;
  canViewVisitSchedule: boolean;
  canViewVisitNotes: boolean;
  canViewProgressUpdates: boolean;
  canViewTasks: boolean;
  canViewGoals: boolean;

  // Medical Information Permissions (HIPAA-sensitive)
  canViewMedications: boolean;
  canViewMedicalHistory: boolean;
  canViewVitalSigns: boolean;
  canViewAssessments: boolean;
  canViewDiagnoses: boolean;

  // Billing & Financial Permissions
  canViewInvoices: boolean;
  canViewPaymentHistory: boolean;
  canMakePayments: boolean;

  // Communication Permissions
  canSendMessages: boolean;
  canReceiveMessages: boolean;
  canViewMessageHistory: boolean;
  canRequestCallback: boolean;

  // Scheduling & Request Permissions
  canViewCaregiverInfo: boolean;
  canRequestScheduleChanges: boolean;
  canCancelVisits: boolean;
  canRateVisits: boolean;

  // Document Permissions
  canViewDocuments: boolean;
  canUploadDocuments: boolean;
  canSignDocuments: boolean;

  // Incident & Concern Permissions
  canViewIncidentReports: boolean;
  canSubmitConcerns: boolean;

  // Notification Preferences
  notifyVisitStart: boolean;
  notifyVisitEnd: boolean;
  notifyVisitMissed: boolean;
  notifyScheduleChanges: boolean;
  notifyCarePlanUpdates: boolean;
  notifyNewMessages: boolean;
  notifyMedicationChanges: boolean;
  notifyIncidents: boolean;
  notifyProgressUpdates: boolean;

  // Permission metadata
  effectiveDate: Date;
  expirationDate?: Date; // For temporary elevated permissions
  permissionNotes?: string;

  // Audit fields
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
}

/**
 * Permission categories for easier management
 */
export interface PermissionsByCategory {
  careInformation: CareInformationPermissions;
  medicalInformation: MedicalInformationPermissions;
  billing: BillingPermissions;
  communication: CommunicationPermissions;
  scheduling: SchedulingPermissions;
  documents: DocumentPermissions;
  incidents: IncidentPermissions;
  notifications: NotificationPermissions;
}

export interface CareInformationPermissions {
  canViewCarePlan: boolean;
  canViewVisitSchedule: boolean;
  canViewVisitNotes: boolean;
  canViewProgressUpdates: boolean;
  canViewTasks: boolean;
  canViewGoals: boolean;
}

export interface MedicalInformationPermissions {
  canViewMedications: boolean;
  canViewMedicalHistory: boolean;
  canViewVitalSigns: boolean;
  canViewAssessments: boolean;
  canViewDiagnoses: boolean;
}

export interface BillingPermissions {
  canViewInvoices: boolean;
  canViewPaymentHistory: boolean;
  canMakePayments: boolean;
}

export interface CommunicationPermissions {
  canSendMessages: boolean;
  canReceiveMessages: boolean;
  canViewMessageHistory: boolean;
  canRequestCallback: boolean;
}

export interface SchedulingPermissions {
  canViewCaregiverInfo: boolean;
  canRequestScheduleChanges: boolean;
  canCancelVisits: boolean;
  canRateVisits: boolean;
}

export interface DocumentPermissions {
  canViewDocuments: boolean;
  canUploadDocuments: boolean;
  canSignDocuments: boolean;
}

export interface IncidentPermissions {
  canViewIncidentReports: boolean;
  canSubmitConcerns: boolean;
}

export interface NotificationPermissions {
  notifyVisitStart: boolean;
  notifyVisitEnd: boolean;
  notifyVisitMissed: boolean;
  notifyScheduleChanges: boolean;
  notifyCarePlanUpdates: boolean;
  notifyNewMessages: boolean;
  notifyMedicationChanges: boolean;
  notifyIncidents: boolean;
  notifyProgressUpdates: boolean;
}

/**
 * Predefined permission templates for common roles
 */
export type PermissionTemplate =
  | 'FULL_ACCESS' // Complete access to all information
  | 'OBSERVER' // Read-only access to basic info
  | 'PRIMARY_CAREGIVER' // Full access to care and scheduling
  | 'BILLING_CONTACT' // Access to billing and payments only
  | 'EMERGENCY_CONTACT' // Minimal access, notifications only
  | 'LEGAL_REPRESENTATIVE' // Full access with legal authority
  | 'CUSTOM'; // Custom permissions

/**
 * Input for creating permissions
 */
export interface CreatePermissionsInput {
  relationshipId: UUID;
  template?: PermissionTemplate; // Use template or specify individual permissions

  // If template is CUSTOM, specify individual permissions
  permissions?: Partial<Omit<FamilyPermissions, 'id' | 'organizationId' | 'relationshipId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>;

  effectiveDate?: Date;
  expirationDate?: Date;
  permissionNotes?: string;
}

/**
 * Input for updating permissions
 */
export interface UpdatePermissionsInput {
  // Care Information
  canViewCarePlan?: boolean;
  canViewVisitSchedule?: boolean;
  canViewVisitNotes?: boolean;
  canViewProgressUpdates?: boolean;
  canViewTasks?: boolean;
  canViewGoals?: boolean;

  // Medical Information
  canViewMedications?: boolean;
  canViewMedicalHistory?: boolean;
  canViewVitalSigns?: boolean;
  canViewAssessments?: boolean;
  canViewDiagnoses?: boolean;

  // Billing
  canViewInvoices?: boolean;
  canViewPaymentHistory?: boolean;
  canMakePayments?: boolean;

  // Communication
  canSendMessages?: boolean;
  canReceiveMessages?: boolean;
  canViewMessageHistory?: boolean;
  canRequestCallback?: boolean;

  // Scheduling
  canViewCaregiverInfo?: boolean;
  canRequestScheduleChanges?: boolean;
  canCancelVisits?: boolean;
  canRateVisits?: boolean;

  // Documents
  canViewDocuments?: boolean;
  canUploadDocuments?: boolean;
  canSignDocuments?: boolean;

  // Incidents
  canViewIncidentReports?: boolean;
  canSubmitConcerns?: boolean;

  // Notifications
  notifyVisitStart?: boolean;
  notifyVisitEnd?: boolean;
  notifyVisitMissed?: boolean;
  notifyScheduleChanges?: boolean;
  notifyCarePlanUpdates?: boolean;
  notifyNewMessages?: boolean;
  notifyMedicationChanges?: boolean;
  notifyIncidents?: boolean;
  notifyProgressUpdates?: boolean;

  // Metadata
  expirationDate?: Date;
  permissionNotes?: string;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string; // If denied, why
  requiresAdditionalAuth?: boolean; // Requires 2FA or additional verification
}

/**
 * Bulk permission check input
 */
export interface BulkPermissionCheckInput {
  familyMemberId: UUID;
  clientId: UUID;
  permissions: string[]; // Array of permission names to check
}

/**
 * Bulk permission check result
 */
export interface BulkPermissionCheckResult {
  [permissionName: string]: PermissionCheckResult;
}

/**
 * Permission audit record
 */
export interface PermissionAuditRecord {
  permissionId: UUID;
  changedBy: UUID;
  changedAt: Date;
  changeType: 'GRANTED' | 'REVOKED' | 'MODIFIED';
  previousValue?: Partial<FamilyPermissions>;
  newValue: Partial<FamilyPermissions>;
  reason?: string;
}
