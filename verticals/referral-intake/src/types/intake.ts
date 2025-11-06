/**
 * Intake domain model
 *
 * Manages the intake process for converting referrals to active clients:
 * - Intake scheduling and workflow
 * - Documentation collection
 * - Assessment completion
 * - Service agreement
 * - Client onboarding
 */

import {
  Entity,
  SoftDeletable,
  UUID,
} from '@care-commons/core';

/**
 * Main intake entity representing the onboarding process
 */
export interface Intake extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;

  // Related entities
  referralId?: UUID; // Original referral if applicable
  clientId?: UUID; // Will be populated when client is created

  // Intake identification
  intakeNumber: string;
  intakeDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;

  // Assignment
  intakeCoordinatorId: UUID;
  assessorId?: UUID;

  // Status and workflow
  status: IntakeStatus;
  currentStage: IntakeStage;

  // Client information (before client record created)
  prospectiveClientName: string;
  prospectiveClientDob?: Date;
  prospectiveClientContact?: ContactInfo;

  // Service details
  requestedServices: string[];
  serviceStartDate?: Date;
  preferredSchedule?: PreferredSchedule;

  // Documentation
  documentsRequired: DocumentRequirement[];
  documentsReceived: DocumentReceived[];
  allDocumentsCollected: boolean;

  // Assessment
  assessmentType?: AssessmentType;
  assessmentScheduled: boolean;
  assessmentDate?: Date;
  assessmentCompleted: boolean;
  assessmentSummary?: string;

  // Authorization and eligibility
  authorizationVerified: boolean;
  authorizationDetails?: AuthorizationDetails;
  insuranceVerified: boolean;
  insuranceDetails?: InsuranceDetails;

  // Service agreement
  serviceAgreementSigned: boolean;
  serviceAgreementDate?: Date;
  serviceAgreementDocumentId?: UUID;

  // Financial
  rateAgreed?: number;
  paymentMethod?: PaymentMethod;
  billingSetupCompleted: boolean;

  // Care team assignment
  primaryCaregiverId?: UUID;
  backupCaregiverId?: UUID;
  caregiverAssigned: boolean;

  // Orientation and training
  clientOrientationCompleted: boolean;
  clientOrientationDate?: Date;
  familyOrientationCompleted: boolean;
  emergencyPlanEstablished: boolean;

  // Safety and environment
  homeAssessmentCompleted: boolean;
  homeAssessmentDate?: Date;
  safetyChecksCompleted: boolean;

  // Notes and communication
  intakeNotes?: string;
  specialInstructions?: string;
  internalNotes?: string;

  // Outcome
  intakeOutcome?: IntakeOutcome;
  outcomeDate?: Date;
  outcomeReason?: string;

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;

  // Audit fields
  createdBy: UUID;
  lastModifiedBy?: UUID;

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Intake status
 */
export type IntakeStatus =
  | 'SCHEDULED' // Intake appointment scheduled
  | 'IN_PROGRESS' // Intake process underway
  | 'PENDING_DOCS' // Waiting for documentation
  | 'PENDING_ASSESSMENT' // Waiting for assessment
  | 'PENDING_AUTH' // Waiting for authorization
  | 'PENDING_AGREEMENT' // Waiting for service agreement
  | 'PENDING_ASSIGNMENT' // Waiting for caregiver assignment
  | 'READY_TO_START' // All requirements met
  | 'COMPLETED' // Successfully onboarded
  | 'CANCELLED' // Intake cancelled
  | 'ON_HOLD'; // Temporarily paused

/**
 * Intake stages in the workflow
 */
export type IntakeStage =
  | 'INITIAL_CONTACT'
  | 'DOCUMENT_COLLECTION'
  | 'ASSESSMENT'
  | 'ELIGIBILITY_VERIFICATION'
  | 'SERVICE_PLANNING'
  | 'AGREEMENT_SIGNING'
  | 'CAREGIVER_ASSIGNMENT'
  | 'ORIENTATION'
  | 'SERVICE_INITIATION'
  | 'COMPLETED';

/**
 * Contact information structure
 */
export interface ContactInfo {
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  preferredContactMethod?: 'PHONE' | 'EMAIL' | 'TEXT' | 'MAIL';
  bestTimeToCall?: string;
  address?: Address;
}

/**
 * Address structure
 */
export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  country?: string;
}

/**
 * Preferred schedule
 */
export interface PreferredSchedule {
  preferredDays?: string[]; // ['MONDAY', 'WEDNESDAY', 'FRIDAY']
  preferredTimes?: string[]; // ['MORNING', 'AFTERNOON', 'EVENING']
  hoursPerWeek?: number;
  continuousCare?: boolean;
  overnightCare?: boolean;
  weekendCare?: boolean;
}

/**
 * Document requirement
 */
export interface DocumentRequirement {
  documentType: RequiredDocumentType;
  required: boolean;
  received: boolean;
  dueDate?: Date;
}

/**
 * Required document types
 */
export type RequiredDocumentType =
  | 'PHOTO_ID'
  | 'INSURANCE_CARD'
  | 'MEDICARE_CARD'
  | 'MEDICAID_CARD'
  | 'PHYSICIAN_ORDERS'
  | 'MEDICATION_LIST'
  | 'EMERGENCY_CONTACTS'
  | 'ADVANCED_DIRECTIVES'
  | 'POA_MEDICAL'
  | 'POA_FINANCIAL'
  | 'LIVING_WILL'
  | 'PRIOR_AUTH'
  | 'PLAN_OF_CARE'
  | 'CONSENT_FORMS'
  | 'HIPAA_AUTHORIZATION'
  | 'SERVICE_AGREEMENT'
  | 'FINANCIAL_AGREEMENT';

/**
 * Document received
 */
export interface DocumentReceived {
  documentType: RequiredDocumentType;
  receivedDate: Date;
  receivedBy: UUID;
  documentId: UUID;
  verified: boolean;
  verifiedBy?: UUID;
  verifiedDate?: Date;
  expirationDate?: Date;
  notes?: string;
}

/**
 * Assessment types
 */
export type AssessmentType =
  | 'IN_HOME'
  | 'TELEHEALTH'
  | 'OFFICE_VISIT'
  | 'PHONE_ASSESSMENT'
  | 'COMPREHENSIVE'
  | 'ABBREVIATED';

/**
 * Authorization details
 */
export interface AuthorizationDetails {
  authNumber: string;
  authSource: string; // Insurance company, MCO, etc.
  authStartDate: Date;
  authEndDate: Date;
  authorizedHours?: number;
  authorizedServices: string[];
  authStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'DENIED';
  verifiedDate?: Date;
  verifiedBy?: UUID;
  notes?: string;
}

/**
 * Insurance details
 */
export interface InsuranceDetails {
  insuranceType: InsuranceType;
  insuranceCompany: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName?: string;
  subscriberRelationship?: 'SELF' | 'SPOUSE' | 'PARENT' | 'OTHER';
  effectiveDate?: Date;
  expirationDate?: Date;
  copay?: number;
  deductible?: number;
  verifiedDate?: Date;
  verifiedBy?: UUID;
  notes?: string;
}

/**
 * Insurance types
 */
export type InsuranceType =
  | 'MEDICARE'
  | 'MEDICARE_ADVANTAGE'
  | 'MEDICAID'
  | 'MEDICAID_WAIVER'
  | 'PRIVATE_INSURANCE'
  | 'LONG_TERM_CARE_INSURANCE'
  | 'VETERANS_BENEFITS'
  | 'WORKERS_COMP'
  | 'PRIVATE_PAY'
  | 'OTHER';

/**
 * Payment methods
 */
export type PaymentMethod =
  | 'INSURANCE'
  | 'PRIVATE_PAY'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'MIXED'; // Combination of sources

/**
 * Intake outcome
 */
export type IntakeOutcome =
  | 'ADMITTED' // Successfully admitted as client
  | 'DECLINED_BY_CLIENT'
  | 'DECLINED_BY_AGENCY'
  | 'NOT_ELIGIBLE'
  | 'NO_AUTHORIZATION'
  | 'NO_CAREGIVER_AVAILABLE'
  | 'TRANSFERRED_TO_PARTNER'
  | 'DUPLICATE'
  | 'CANCELLED';

/**
 * Intake activity log
 */
export interface IntakeActivity extends Entity {
  intakeId: UUID;
  organizationId: UUID;

  // Activity details
  activityType: IntakeActivityType;
  activityDate: Date;
  performedBy: UUID;

  // Details
  description: string;
  notes?: string;

  // Related entities
  relatedDocumentId?: UUID;

  // Status changes
  previousStatus?: IntakeStatus;
  newStatus?: IntakeStatus;
  previousStage?: IntakeStage;
  newStage?: IntakeStage;

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Intake activity types
 */
export type IntakeActivityType =
  | 'INTAKE_CREATED'
  | 'INTAKE_SCHEDULED'
  | 'STAGE_CHANGED'
  | 'STATUS_CHANGED'
  | 'DOCUMENT_REQUESTED'
  | 'DOCUMENT_RECEIVED'
  | 'DOCUMENT_VERIFIED'
  | 'ASSESSMENT_SCHEDULED'
  | 'ASSESSMENT_COMPLETED'
  | 'AUTHORIZATION_VERIFIED'
  | 'INSURANCE_VERIFIED'
  | 'AGREEMENT_SIGNED'
  | 'CAREGIVER_ASSIGNED'
  | 'ORIENTATION_COMPLETED'
  | 'CLIENT_CREATED'
  | 'SERVICE_STARTED'
  | 'INTAKE_COMPLETED'
  | 'INTAKE_CANCELLED'
  | 'NOTE_ADDED';

/**
 * Intake checklist item
 */
export interface IntakeChecklistItem {
  id: UUID;
  intakeId: UUID;

  // Item details
  itemName: string;
  itemDescription?: string;
  itemCategory: IntakeChecklistCategory;

  // Status
  required: boolean;
  completed: boolean;
  completedDate?: Date;
  completedBy?: UUID;

  // Order
  sortOrder: number;

  // Notes
  notes?: string;
}

/**
 * Intake checklist categories
 */
export type IntakeChecklistCategory =
  | 'DOCUMENTATION'
  | 'ASSESSMENT'
  | 'VERIFICATION'
  | 'AGREEMENTS'
  | 'ASSIGNMENTS'
  | 'ORIENTATION'
  | 'SAFETY'
  | 'COMPLIANCE';
