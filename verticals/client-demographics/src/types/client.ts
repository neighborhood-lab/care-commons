/**
 * Client domain model
 * 
 * Foundational record for individuals receiving care:
 * - Identity and demographics
 * - Contact structure
 * - Authorized contacts
 * - Program enrollment
 * - Service eligibility
 * - Risk flags
 * - Residence locations
 * - Lifecycle management
 */

import {
  Entity,
  SoftDeletable,
  UUID,
} from '@care-commons/core';

export interface Client extends Entity, SoftDeletable {
  // Organization context
  organizationId: UUID;
  branchId: UUID;

  // Identity
  clientNumber: string; // Human-readable identifier
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  ssn?: string; // Encrypted
  gender?: Gender;
  pronouns?: string;

  // Contact information
  primaryPhone?: Phone;
  alternatePhone?: Phone;
  email?: string;
  preferredContactMethod?: ContactMethod;
  communicationPreferences?: CommunicationPreferences;

  // Demographics
  language?: string;
  ethnicity?: string;
  race?: string[];
  maritalStatus?: MaritalStatus;
  veteranStatus?: boolean;

  // Residence
  primaryAddress: Address;
  secondaryAddresses?: Address[];
  livingArrangement?: LivingArrangement;
  mobilityInfo?: MobilityInfo;

  // Emergency contacts
  emergencyContacts: EmergencyContact[];
  authorizedContacts: AuthorizedContact[];

  // Healthcare
  primaryPhysician?: HealthcareProvider;
  pharmacy?: Pharmacy;
  insurance?: Insurance[];
  medicalRecordNumber?: string;

  // Service information
  programs: ProgramEnrollment[];
  serviceEligibility: ServiceEligibility;
  fundingSources?: FundingSource[];

  // Risk and safety
  riskFlags: RiskFlag[];
  allergies?: Allergy[];
  specialInstructions?: string;
  accessInstructions?: string;

  // Status
  status: ClientStatus;
  intakeDate?: Date;
  dischargeDate?: Date;
  dischargeReason?: string;

  // Metadata
  referralSource?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type MaritalStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'DIVORCED'
  | 'WIDOWED'
  | 'SEPARATED'
  | 'DOMESTIC_PARTNERSHIP';

export type ContactMethod = 'PHONE' | 'EMAIL' | 'SMS' | 'MAIL' | 'IN_PERSON';

export type ClientStatus =
  | 'INQUIRY'
  | 'PENDING_INTAKE'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_HOLD'
  | 'DISCHARGED'
  | 'DECEASED';

export interface Phone {
  number: string;
  type: 'MOBILE' | 'HOME' | 'WORK';
  canReceiveSMS: boolean;
}

export interface CommunicationPreferences {
  method: ContactMethod;
  bestTimeToCall?: string;
  doNotContact?: boolean;
  languagePreference?: string;
  needsInterpreter?: boolean;
  hearingImpaired?: boolean;
  visuallyImpaired?: boolean;
}

export interface Address {
  type: 'HOME' | 'BILLING' | 'TEMPORARY';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  county?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  validFrom?: Date;
  validTo?: Date;
}

export interface LivingArrangement {
  type: 'ALONE' | 'WITH_FAMILY' | 'WITH_CAREGIVER' | 'ASSISTED_LIVING' | 'OTHER';
  description?: string;
  householdMembers?: number;
  pets?: Pet[];
  environmentalHazards?: string[];
}

export interface Pet {
  type: string;
  name?: string;
  notes?: string;
}

export interface MobilityInfo {
  requiresWheelchair: boolean;
  requiresWalker: boolean;
  requiresStairsAccess: boolean;
  transferAssistance?: 'NONE' | 'MINIMAL' | 'MODERATE' | 'TOTAL';
  notes?: string;
}

export interface EmergencyContact {
  id: UUID;
  name: string;
  relationship: string;
  phone: Phone;
  alternatePhone?: Phone;
  email?: string;
  address?: Address;
  isPrimary: boolean;
  canMakeHealthcareDecisions: boolean;
  notes?: string;
}

export interface AuthorizedContact {
  id: UUID;
  name: string;
  relationship: string;
  phone: Phone;
  email?: string;
  authorizations: Authorization[];
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
}

export interface Authorization {
  type: 'HIPAA' | 'FINANCIAL' | 'SCHEDULE_CHANGES' | 'CARE_DECISIONS' | 'EMERGENCY';
  grantedAt: Date;
  documentPath?: string;
}

export interface HealthcareProvider {
  name: string;
  specialty?: string;
  phone: Phone;
  fax?: string;
  address?: Address;
  npi?: string;
}

export interface Pharmacy {
  name: string;
  phone: Phone;
  fax?: string;
  address?: Address;
  isMailOrder: boolean;
}

export interface Insurance {
  id: UUID;
  type: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberId?: string;
  subscriberName?: string;
  subscriberRelationship?: string;
  subscriberDOB?: Date;
  effectiveDate?: Date;
  terminationDate?: Date;
  copay?: number;
  deductible?: number;
  notes?: string;
}

export interface ProgramEnrollment {
  id: UUID;
  programId: UUID;
  programName: string;
  enrollmentDate: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'TERMINATED';
  authorizedHoursPerWeek?: number;
  notes?: string;
}

export interface ServiceEligibility {
  medicaidEligible: boolean;
  medicaidNumber?: string;
  medicareEligible: boolean;
  medicareNumber?: string;
  veteransBenefits: boolean;
  longTermCareInsurance: boolean;
  privatePayOnly: boolean;
  eligibilityVerifiedDate?: Date;
  eligibilityNotes?: string;
}

export interface FundingSource {
  id: UUID;
  type: 'MEDICAID' | 'MEDICARE' | 'PRIVATE_INSURANCE' | 'PRIVATE_PAY' | 'VETERANS_BENEFITS' | 'OTHER';
  name: string;
  priority: number; // 1 = primary, 2 = secondary, etc.
  accountNumber?: string;
  effectiveDate?: Date;
  terminationDate?: Date;
  authorizedAmount?: number;
  authorizedUnits?: number;
  notes?: string;
}

export interface RiskFlag {
  id: UUID;
  type: RiskType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  identifiedDate: Date;
  resolvedDate?: Date;
  mitigationPlan?: string;
  requiresAcknowledgment: boolean;
}

export type RiskType =
  | 'FALL_RISK'
  | 'WANDERING'
  | 'AGGRESSIVE_BEHAVIOR'
  | 'INFECTION'
  | 'MEDICATION_COMPLIANCE'
  | 'DIETARY_RESTRICTION'
  | 'ENVIRONMENTAL_HAZARD'
  | 'SAFETY_CONCERN'
  | 'ABUSE_NEGLECT_CONCERN'
  | 'OTHER';

export interface Allergy {
  id: UUID;
  allergen: string;
  type: 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  notes?: string;
}

/**
 * Client creation input (subset of full Client)
 */
export interface CreateClientInput {
  organizationId: UUID;
  branchId: UUID;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  gender?: Gender;
  primaryPhone?: Phone;
  email?: string;
  primaryAddress: Address;
  emergencyContacts?: EmergencyContact[];
  referralSource?: string;
  intakeDate?: Date;
  status?: ClientStatus;
}

/**
 * Client update input (partial)
 */
export interface UpdateClientInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  primaryPhone?: Phone;
  alternatePhone?: Phone;
  email?: string;
  primaryAddress?: Address;
  emergencyContacts?: EmergencyContact[];
  authorizedContacts?: AuthorizedContact[];
  riskFlags?: RiskFlag[];
  status?: ClientStatus;
  notes?: string;
}

/**
 * Client search filters
 */
export interface ClientSearchFilters {
  query?: string; // Search by name, client number
  organizationId?: UUID;
  branchId?: UUID;
  status?: ClientStatus[];
  programId?: UUID;
  assignedCaregiver?: UUID;
  riskType?: RiskType[];
  minAge?: number;
  maxAge?: number;
  city?: string;
  state?: string;
  hasActiveServices?: boolean;
}
