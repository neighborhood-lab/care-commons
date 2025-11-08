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

/**
 * State-specific client data for TX and FL compliance
 */
export interface StateSpecificClientData {
  state: 'TX' | 'FL';
  texas?: TexasClientData;
  florida?: FloridaClientData;
}

/**
 * Texas-specific client fields (26 TAC §558, HHSC requirements)
 */
export interface TexasClientData {
  // Medicaid & Program Eligibility
  medicaidMemberId?: string; // Texas Medicaid ID
  medicaidProgram?: TexasMedicaidProgram;
  hhscClientId?: string; // HHSC community care client ID
  serviceDeliveryOption?: 'AGENCY' | 'CDS'; // Consumer Directed Services vs Agency
  
  // Authorization & Plan of Care
  planOfCareNumber?: string; // HHSC Form 1746/8606 reference
  authorizedServices: TexasAuthorizedService[];
  currentAuthorization?: TexasServiceAuthorization;
  
  // EVV Requirements
  evvEntityId?: string; // HHAeXchange Entity ID
  evvRequirements?: TexasEVVRequirements;
  
  // Emergency Planning & Safety
  emergencyPlanOnFile: boolean;
  emergencyPlanDate?: Date;
  disasterEvacuationPlan?: string;
  
  // Privacy & Compliance
  form1746Consent?: ConsentRecord; // Service delivery consent
  biometricDataConsent?: ConsentRecord; // Texas Privacy Protection Act
  releaseOfInformation?: ReleaseRecord[];
  
  // Risk Classification
  acuityLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'COMPLEX';
  starPlusWaiverServices?: string[];
}

/**
 * Florida-specific client fields (Chapter 59A-8, AHCA requirements)
 */
export interface FloridaClientData {
  // Medicaid & Program Enrollment
  medicaidRecipientId?: string; // Florida Medicaid ID
  managedCarePlan?: FloridaManagedCarePlan;
  apdWaiverEnrollment?: APDWaiverInfo; // Agency for Persons with Disabilities
  doeaRiskClassification?: 'LOW' | 'MODERATE' | 'HIGH'; // Dept of Elder Affairs
  
  // Plan of Care (Florida Statute 400.487)
  planOfCareId?: string; // AHCA Form 484 adaptation
  planOfCareReviewDate?: Date;
  nextReviewDue?: Date; // 60/90-day mandatory review
  authorizedServices: FloridaAuthorizedService[];
  
  // EVV & Billing
  evvAggregatorId?: string; // HHAeXchange or Netsmart/Tellus ID
  evvSystemType?: 'HHAX' | 'NETSMART' | 'OTHER';
  smmcProgramEnrollment?: boolean; // Statewide Medicaid Managed Care
  ltcProgramEnrollment?: boolean; // Long-Term Care
  
  // Clinical Oversight (59A-8.0095)
  rnSupervisorId?: string;
  lastSupervisoryVisit?: Date;
  nextSupervisoryVisitDue?: Date;
  supervisoryVisitFrequency?: number; // days
  
  // Safety & Environment
  hurricaneZone?: string; // For disaster planning per 59A-8.027
  biomedicalWasteExposure?: BiomedicalWasteRecord[];
  
  // Compliance
  ahcaLicenseVerification?: Date;
  backgroundScreeningStatus?: 'COMPLIANT' | 'PENDING' | 'NON_COMPLIANT';
}

export type TexasMedicaidProgram = 
  | 'STAR'
  | 'STAR_PLUS'
  | 'STAR_KIDS'
  | 'STAR_HEALTH'
  | 'PHC' // Primary Home Care
  | 'CFC'; // Community First Choice

export type FloridaManagedCarePlan =
  | 'SMMC_LTC' // Statewide Medicaid Managed Care - Long-Term Care
  | 'SMMC_MMA' // Managed Medical Assistance
  | 'PACE' // Program of All-Inclusive Care for the Elderly
  | 'FFS'; // Fee-for-Service

export interface TexasAuthorizedService {
  id: UUID;
  serviceCode: string; // HHSC service code
  serviceName: string;
  authorizedUnits: number;
  usedUnits: number;
  unitType: 'HOURS' | 'VISITS' | 'DAYS';
  authorizationNumber: string; // HHSC Form 4100 series
  effectiveDate: Date;
  expirationDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  requiresEVV: boolean;
}

export interface FloridaAuthorizedService {
  id: UUID;
  serviceCode: string; // AHCA service code
  serviceName: string;
  authorizedUnits: number;
  usedUnits: number;
  unitType: 'HOURS' | 'VISITS' | 'DAYS';
  authorizationNumber: string;
  effectiveDate: Date;
  expirationDate: Date;
  visitFrequency?: string; // e.g., "3x weekly"
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  requiresEVV: boolean;
  requiresRNSupervision: boolean;
}

export interface TexasServiceAuthorization {
  authorizationId: string;
  authorizationDate: Date;
  authorizingProvider: string; // Physician/licensed professional
  effectiveDate: Date;
  expirationDate: Date;
  totalAuthorizedHours?: number;
  servicesAuthorized: string[];
  restrictions?: string[];
  formNumber?: string; // e.g., "Form 4100"
}

export interface TexasEVVRequirements {
  evvMandatory: boolean;
  approvedClockMethods: ('MOBILE' | 'TELEPHONY' | 'FIXED')[];
  geoPerimeterRadius?: number; // meters
  aggregatorSubmissionRequired: boolean;
  tmhpIntegration: boolean; // Texas Medicaid Healthcare Partnership
}

export interface APDWaiverInfo {
  waiverType: string;
  enrollmentDate: Date;
  supportPlanDate?: Date;
  supportCoordinator?: string;
}

export interface ConsentRecord {
  consentDate: Date;
  consentFormId: string;
  documentPath?: string;
  signedBy: string;
  witnessedBy?: string;
  expirationDate?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface ReleaseRecord {
  id: UUID;
  releaseType: 'HIPAA' | 'RECORDS' | 'BILLING' | 'OTHER';
  recipientName: string;
  recipientOrganization?: string;
  purpose: string;
  dateGranted: Date;
  expirationDate?: Date;
  documentPath?: string;
  disclosureLog?: DisclosureEntry[];
}

export interface DisclosureEntry {
  id: UUID;
  disclosureDate: Date;
  disclosedTo: string;
  disclosedBy: UUID; // User ID
  purpose: string;
  informationDisclosed: string;
  method: 'VERBAL' | 'WRITTEN' | 'ELECTRONIC' | 'FAX';
  authorizationRef?: string;
}

export interface BiomedicalWasteRecord {
  id: UUID;
  exposureDate: Date;
  exposureType: string;
  reportedTo?: string;
  actionTaken?: string;
  followUpDate?: Date;
}

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

  // Geocoding
  coordinates?: { lat: number; lng: number };
  geocodingConfidence?: 'high' | 'medium' | 'low';
  geocodedAt?: Date;
  geocodingFailed?: boolean;

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

  // State-specific compliance fields
  stateSpecific?: StateSpecificClientData;

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
