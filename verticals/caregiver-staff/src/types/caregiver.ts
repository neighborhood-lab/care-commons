/**
 * Caregiver & Staff domain model
 * 
 * Secure directory of personnel providing care services:
 * - Roles and credentials
 * - Availability and scheduling preferences
 * - Pay rates and compensation
 * - Work eligibility and compliance
 * - Branch assignment and supervisor relationships
 * - Lifecycle states and permission scaffolding
 */

import {
  Entity,
  SoftDeletable,
  LifecycleStatus,
  UUID,
  Timestamp,
} from '@care-commons/core';

export interface Caregiver extends Entity, SoftDeletable {
  // Organization context
  organizationId: UUID;
  branchIds: UUID[]; // Can work at multiple branches
  primaryBranchId: UUID;

  // Identity
  employeeNumber: string; // Human-readable identifier
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  ssn?: string; // Encrypted
  gender?: Gender;
  pronouns?: string;

  // Contact information
  primaryPhone: Phone;
  alternatePhone?: Phone;
  email: string;
  preferredContactMethod: ContactMethod;
  communicationPreferences?: CommunicationPreferences;

  // Demographics
  language?: string;
  languages?: string[]; // All languages spoken
  ethnicity?: string;
  race?: string[];

  // Address
  primaryAddress: Address;
  mailingAddress?: Address;

  // Emergency contact
  emergencyContacts: EmergencyContact[];

  // Employment information
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  hireDate: Date;
  terminationDate?: Date;
  terminationReason?: string;
  rehireEligible?: boolean;

  // Role and permissions
  role: CaregiverRole;
  permissions: string[];
  supervisorId?: UUID;
  
  // Credentials and certifications
  credentials: Credential[];
  backgroundCheck?: BackgroundCheck;
  drugScreening?: DrugScreening;
  healthScreening?: HealthScreening;
  
  // Training and qualifications
  training: TrainingRecord[];
  skills: Skill[];
  specializations: string[];
  languages_spoken?: string[]; // For matching with clients

  // Work preferences and availability
  availability: Availability;
  workPreferences?: WorkPreferences;
  maxHoursPerWeek?: number;
  minHoursPerWeek?: number;
  willingToTravel?: boolean;
  maxTravelDistance?: number; // miles

  // Compensation
  payRate: PayRate;
  alternatePayRates?: PayRate[]; // For different service types
  payrollInfo?: PayrollInfo;

  // Performance and compliance
  performanceRating?: number; // 1-5 scale
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  complianceStatus: ComplianceStatus;
  lastComplianceCheck?: Date;

  // Scheduling metadata
  reliabilityScore?: number; // Calculated based on history
  preferredClients?: UUID[];
  restrictedClients?: UUID[]; // Cannot be assigned

  // Status
  status: CaregiverStatus;
  statusReason?: string;
  
  // Documents
  documents?: DocumentReference[];

  // Metadata
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type ContactMethod = 'PHONE' | 'EMAIL' | 'SMS' | 'IN_PERSON';

export type EmploymentType = 
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'PER_DIEM'
  | 'CONTRACT'
  | 'TEMPORARY'
  | 'SEASONAL';

export type EmploymentStatus =
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'RETIRED';

export type CaregiverRole =
  | 'CAREGIVER'
  | 'SENIOR_CAREGIVER'
  | 'CERTIFIED_NURSING_ASSISTANT'
  | 'HOME_HEALTH_AIDE'
  | 'PERSONAL_CARE_AIDE'
  | 'COMPANION'
  | 'NURSE_RN'
  | 'NURSE_LPN'
  | 'THERAPIST'
  | 'COORDINATOR'
  | 'SUPERVISOR'
  | 'SCHEDULER'
  | 'ADMINISTRATIVE';

export type CaregiverStatus =
  | 'APPLICATION'
  | 'INTERVIEWING'
  | 'PENDING_ONBOARDING'
  | 'ONBOARDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'RETIRED';

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'PENDING_VERIFICATION'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'NON_COMPLIANT';

export interface Phone {
  number: string;
  type: 'MOBILE' | 'HOME' | 'WORK';
  canReceiveSMS: boolean;
  isPrimary?: boolean;
}

export interface CommunicationPreferences {
  method: ContactMethod;
  bestTimeToCall?: string;
  doNotContact?: boolean;
  languagePreference?: string;
}

export interface Address {
  type: 'HOME' | 'MAILING';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  county?: string;
  country: string;
  latitude?: number;
  longitude?: number;
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
  notes?: string;
}

export interface Credential {
  id: UUID;
  type: CredentialType;
  name: string;
  number?: string;
  issuingAuthority?: string;
  issueDate: Date;
  expirationDate?: Date;
  verifiedDate?: Date;
  verifiedBy?: UUID;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'REVOKED';
  documentPath?: string;
  notes?: string;
}

export type CredentialType =
  | 'CNA'
  | 'HHA'
  | 'PCA'
  | 'RN'
  | 'LPN'
  | 'CPR'
  | 'FIRST_AID'
  | 'DRIVERS_LICENSE'
  | 'VEHICLE_INSURANCE'
  | 'TB_TEST'
  | 'IMMUNIZATION'
  | 'MEDICATION_ADMINISTRATION'
  | 'DEMENTIA_CARE'
  | 'OTHER';

export interface BackgroundCheck {
  provider: string;
  checkDate: Date;
  expirationDate?: Date;
  status: 'CLEAR' | 'PENDING' | 'FLAGGED' | 'EXPIRED';
  reportId?: string;
  documentPath?: string;
  notes?: string;
}

export interface DrugScreening {
  provider: string;
  screeningDate: Date;
  expirationDate?: Date;
  status: 'PASSED' | 'PENDING' | 'FAILED' | 'EXPIRED';
  reportId?: string;
  documentPath?: string;
  notes?: string;
}

export interface HealthScreening {
  provider: string;
  screeningDate: Date;
  expirationDate?: Date;
  status: 'CLEARED' | 'PENDING' | 'RESTRICTIONS' | 'EXPIRED';
  restrictions?: string[];
  immunizations?: Immunization[];
  tbTestDate?: Date;
  documentPath?: string;
  notes?: string;
}

export interface Immunization {
  type: string;
  date: Date;
  expirationDate?: Date;
  provider?: string;
  lotNumber?: string;
}

export interface TrainingRecord {
  id: UUID;
  name: string;
  category: TrainingCategory;
  provider?: string;
  completionDate: Date;
  expirationDate?: Date;
  hours?: number;
  certificateNumber?: string;
  documentPath?: string;
  status: 'COMPLETED' | 'EXPIRED' | 'IN_PROGRESS';
  notes?: string;
}

export type TrainingCategory =
  | 'ORIENTATION'
  | 'MANDATORY_COMPLIANCE'
  | 'CLINICAL_SKILLS'
  | 'SAFETY'
  | 'SPECIALIZED_CARE'
  | 'SOFT_SKILLS'
  | 'TECHNOLOGY'
  | 'CONTINUING_EDUCATION';

export interface Skill {
  id: UUID;
  name: string;
  category: string;
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  certifiedDate?: Date;
  notes?: string;
}

export interface Availability {
  schedule: WeeklyAvailability;
  blackoutDates?: DateRange[];
  preferredShiftTypes?: ShiftType[];
  restrictions?: string;
  lastUpdated: Date;
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface DayAvailability {
  available: boolean;
  timeSlots?: TimeSlot[];
  notes?: string;
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export type ShiftType =
  | 'MORNING'
  | 'AFTERNOON'
  | 'EVENING'
  | 'NIGHT'
  | 'OVERNIGHT'
  | 'SPLIT'
  | 'LIVE_IN';

export interface WorkPreferences {
  preferredShiftTypes?: ShiftType[];
  preferredDays?: string[];
  preferredClients?: UUID[];
  preferredLocations?: string[]; // cities, zip codes
  avoidClients?: UUID[];
  avoidLocations?: string[];
  willingToWorkWeekends?: boolean;
  willingToWorkHolidays?: boolean;
  requiresFixedSchedule?: boolean;
  notes?: string;
}

export interface PayRate {
  id: UUID;
  rateType: PayRateType;
  amount: number;
  unit: 'HOURLY' | 'VISIT' | 'DAILY' | 'SALARY';
  effectiveDate: Date;
  endDate?: Date;
  serviceType?: string; // e.g., 'PERSONAL_CARE', 'COMPANION'
  payLevel?: number;
  overtimeMultiplier?: number;
  weekendMultiplier?: number;
  holidayMultiplier?: number;
  liveInRate?: number;
  notes?: string;
}

export type PayRateType =
  | 'BASE'
  | 'OVERTIME'
  | 'WEEKEND'
  | 'HOLIDAY'
  | 'LIVE_IN'
  | 'SPECIALIZED_CARE';

export interface PayrollInfo {
  payrollId?: string;
  taxId?: string; // Encrypted
  bankAccount?: BankAccount; // Encrypted
  paymentMethod: 'DIRECT_DEPOSIT' | 'CHECK' | 'CASH';
  payFrequency: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY';
  w4OnFile: boolean;
  i9OnFile: boolean;
  directDepositConsent?: boolean;
  notes?: string;
}

export interface BankAccount {
  bankName: string;
  accountType: 'CHECKING' | 'SAVINGS';
  routingNumber: string; // Encrypted
  accountNumber: string; // Encrypted
  accountHolderName: string;
}

export interface DocumentReference {
  id: UUID;
  name: string;
  type: string;
  category: DocumentCategory;
  filePath: string;
  uploadedDate: Date;
  uploadedBy: UUID;
  expirationDate?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
  notes?: string;
}

export type DocumentCategory =
  | 'IDENTIFICATION'
  | 'CERTIFICATION'
  | 'TRAINING'
  | 'BACKGROUND_CHECK'
  | 'HEALTH_SCREENING'
  | 'EMPLOYMENT'
  | 'TAX_FORMS'
  | 'BANK_INFO'
  | 'OTHER';

/**
 * Caregiver creation input
 */
export interface CreateCaregiverInput {
  organizationId: UUID;
  branchIds: UUID[];
  primaryBranchId: UUID;
  employeeNumber?: string; // Auto-generated if not provided
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  primaryPhone: Phone;
  email: string;
  primaryAddress: Address;
  emergencyContacts: EmergencyContact[];
  employmentType: EmploymentType;
  hireDate: Date;
  role: CaregiverRole;
  payRate: PayRate;
  status?: CaregiverStatus;
}

/**
 * Caregiver update input
 */
export interface UpdateCaregiverInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  primaryPhone?: Phone;
  alternatePhone?: Phone;
  email?: string;
  primaryAddress?: Address;
  branchIds?: UUID[];
  emergencyContacts?: EmergencyContact[];
  role?: CaregiverRole;
  supervisorId?: UUID;
  credentials?: Credential[];
  training?: TrainingRecord[];
  skills?: Skill[];
  availability?: Availability;
  workPreferences?: WorkPreferences;
  payRate?: PayRate;
  status?: CaregiverStatus;
  notes?: string;
}

/**
 * Caregiver search filters
 */
export interface CaregiverSearchFilters {
  query?: string; // Search by name, employee number
  organizationId?: UUID;
  branchId?: UUID;
  status?: CaregiverStatus[];
  role?: CaregiverRole[];
  employmentType?: EmploymentType[];
  skills?: string[];
  languages?: string[];
  availability?: {
    dayOfWeek?: string;
    shiftType?: ShiftType;
  };
  complianceStatus?: ComplianceStatus[];
  credentials?: CredentialType[];
  credentialExpiring?: boolean; // Expiring within 30 days
  city?: string;
  state?: string;
  maxTravelDistance?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Caregiver assignment eligibility check
 */
export interface CaregiverEligibility {
  caregiverId: UUID;
  isEligible: boolean;
  reasons: EligibilityReason[];
}

export interface EligibilityReason {
  type: 'COMPLIANCE' | 'AVAILABILITY' | 'SKILL' | 'PREFERENCE' | 'LOCATION' | 'OTHER';
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}
