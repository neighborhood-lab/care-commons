/**
 * Referral domain model
 *
 * Manages incoming referrals from various sources:
 * - Referral source tracking
 * - Initial assessment
 * - Eligibility screening
 * - Prioritization and routing
 * - Authorization tracking
 * - Lifecycle management
 */

import {
  Entity,
  SoftDeletable,
  UUID,
} from '@care-commons/core';

/**
 * Main referral entity representing an incoming care request
 */
export interface Referral extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId?: UUID;

  // Referral identification
  referralNumber: string;
  referralDate: Date;
  receivedDate: Date;

  // Source information
  referralSource: ReferralSource;
  referralSourceId?: UUID;
  referralSourceContactId?: UUID;

  // Client information
  clientId?: UUID; // Linked to existing client if known
  prospectiveClientName: string;
  prospectiveClientDob?: Date;
  prospectiveClientPhone?: string;
  prospectiveClientEmail?: string;

  // Referral details
  referralType: ReferralType;
  serviceType: ServiceType[];
  urgencyLevel: UrgencyLevel;
  preferredStartDate?: Date;

  // Status and workflow
  status: ReferralStatus;
  assignedTo?: UUID; // Staff member handling referral
  assignedDate?: Date;

  // Clinical and eligibility
  diagnosis?: string[];
  insuranceType?: InsuranceType[];
  medicaidNumber?: string;
  medicareNumber?: string;
  privateInsuranceInfo?: string;

  // Initial screening
  initialScreeningCompleted: boolean;
  initialScreeningDate?: Date;
  initialScreeningBy?: UUID;
  eligibilityDetermined: boolean;
  eligibilityStatus?: EligibilityStatus;
  eligibilityNotes?: string;

  // Authorization
  authorizationRequired: boolean;
  authorizationReceived: boolean;
  authorizationNumber?: string;
  authorizationDate?: Date;
  authorizationExpiryDate?: Date;

  // Address and location
  serviceAddress?: Address;
  serviceZipCode?: string;
  serviceCounty?: string;

  // Notes and attachments
  referralNotes?: string;
  internalNotes?: string;
  attachmentIds?: UUID[];

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  lastContactDate?: Date;
  nextContactDate?: Date;

  // Outcome
  outcomeStatus?: ReferralOutcome;
  outcomeDate?: Date;
  outcomeReason?: string;
  convertedToClientId?: UUID;

  // Audit fields
  createdBy: UUID;
  lastModifiedBy?: UUID;

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Referral source types
 */
export type ReferralSource =
  | 'HOSPITAL_DISCHARGE'
  | 'PHYSICIAN'
  | 'CASE_MANAGER'
  | 'MANAGED_CARE_ORG'
  | 'MEDICAID_WAIVER'
  | 'MEDICARE_ADVANTAGE'
  | 'FAMILY_MEMBER'
  | 'SELF_REFERRAL'
  | 'COMMUNITY_PARTNER'
  | 'EXISTING_CLIENT'
  | 'WEBSITE'
  | 'SOCIAL_MEDIA'
  | 'OTHER';

/**
 * Referral types
 */
export type ReferralType =
  | 'NEW_ADMISSION'
  | 'RESPITE_CARE'
  | 'TEMPORARY_CARE'
  | 'LONG_TERM_CARE'
  | 'POST_ACUTE_CARE'
  | 'SKILLED_NURSING'
  | 'PERSONAL_CARE'
  | 'COMPANION_CARE'
  | 'SPECIALIZED_CARE';

/**
 * Service types requested
 */
export type ServiceType =
  | 'PERSONAL_CARE'
  | 'COMPANION_CARE'
  | 'SKILLED_NURSING'
  | 'PHYSICAL_THERAPY'
  | 'OCCUPATIONAL_THERAPY'
  | 'SPEECH_THERAPY'
  | 'MEDICATION_MANAGEMENT'
  | 'WOUND_CARE'
  | 'DEMENTIA_CARE'
  | 'HOSPICE_CARE'
  | 'RESPITE_CARE'
  | 'TRANSPORTATION'
  | 'MEAL_PREPARATION'
  | 'HOMEMAKER_SERVICES';

/**
 * Urgency level of referral
 */
export type UrgencyLevel =
  | 'EMERGENCY' // Same day
  | 'URGENT' // Within 24-48 hours
  | 'PRIORITY' // Within 3-5 days
  | 'ROUTINE' // Within 1-2 weeks
  | 'SCHEDULED'; // Future date specified

/**
 * Referral status in the workflow
 */
export type ReferralStatus =
  | 'NEW' // Just received
  | 'ASSIGNED' // Assigned to staff
  | 'IN_SCREENING' // Initial screening in progress
  | 'AWAITING_INFO' // Waiting for additional information
  | 'IN_ASSESSMENT' // Full assessment in progress
  | 'AWAITING_AUTH' // Waiting for authorization
  | 'READY_FOR_INTAKE' // Ready to convert to intake
  | 'IN_INTAKE' // Intake process started
  | 'COMPLETED' // Successfully converted to client
  | 'DECLINED' // Client declined services
  | 'INELIGIBLE' // Not eligible for services
  | 'NO_CAPACITY' // Unable to service due to capacity
  | 'CLOSED'; // Closed for other reasons

/**
 * Eligibility status
 */
export type EligibilityStatus =
  | 'ELIGIBLE'
  | 'INELIGIBLE'
  | 'CONDITIONAL' // Eligible with conditions
  | 'PENDING_VERIFICATION'
  | 'UNKNOWN';

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
 * Referral outcome
 */
export type ReferralOutcome =
  | 'CONVERTED_TO_CLIENT'
  | 'DECLINED_BY_CLIENT'
  | 'DECLINED_BY_AGENCY'
  | 'INELIGIBLE'
  | 'NO_CAPACITY'
  | 'NO_RESPONSE'
  | 'DUPLICATE'
  | 'TRANSFERRED_TO_PARTNER'
  | 'OTHER';

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
 * Referral source contact entity
 */
export interface ReferralSourceContact extends Entity {
  organizationId: UUID;

  // Contact information
  sourceName: string;
  sourceType: ReferralSource;
  contactPerson?: string;
  title?: string;

  // Contact details
  phone?: string;
  email?: string;
  fax?: string;

  // Address
  address?: Address;

  // Relationship
  partnerOrganization?: string;
  contractOnFile: boolean;
  preferredContact: boolean;

  // Activity tracking
  totalReferrals: number;
  successfulConversions: number;
  lastReferralDate?: Date;

  // Notes
  notes?: string;

  // Status
  isActive: boolean;
}

/**
 * Referral activity log
 */
export interface ReferralActivity extends Entity {
  referralId: UUID;
  organizationId: UUID;

  // Activity details
  activityType: ReferralActivityType;
  activityDate: Date;
  performedBy: UUID;

  // Details
  description: string;
  notes?: string;

  // Related entities
  relatedContactId?: UUID;
  relatedDocumentId?: UUID;

  // Status changes
  previousStatus?: ReferralStatus;
  newStatus?: ReferralStatus;

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Referral activity types
 */
export type ReferralActivityType =
  | 'REFERRAL_RECEIVED'
  | 'REFERRAL_ASSIGNED'
  | 'SCREENING_STARTED'
  | 'SCREENING_COMPLETED'
  | 'INFO_REQUESTED'
  | 'INFO_RECEIVED'
  | 'CLIENT_CONTACTED'
  | 'ASSESSMENT_SCHEDULED'
  | 'ASSESSMENT_COMPLETED'
  | 'AUTH_REQUESTED'
  | 'AUTH_RECEIVED'
  | 'INTAKE_SCHEDULED'
  | 'STATUS_CHANGED'
  | 'NOTE_ADDED'
  | 'DOCUMENT_UPLOADED'
  | 'CONVERTED_TO_CLIENT'
  | 'REFERRAL_CLOSED';
