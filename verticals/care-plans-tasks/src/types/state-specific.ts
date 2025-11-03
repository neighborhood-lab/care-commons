/**
 * State-specific Care Plan Types for TX and FL Compliance
 *
 * TX Requirements:
 * - 26 TAC §§558 (licensed HCSSA)
 * - HHSC Forms 1746/8606, Form 485/Plan of Care
 * - Consumer Directed Services (CDS) support
 * - Emergency preparedness per §558
 *
 * FL Requirements:
 * - AHCA Chapter 59A-8 home health licensing
 * - Florida Statute 400.487 plan-of-care linkage
 * - RN delegation per 59A-8.0216
 * - Supervisory visit requirements
 */

import { UUID, Timestamp } from '@care-commons/core';

/**
 * State jurisdiction for compliance
 */
export type StateJurisdiction = 'TX' | 'FL' | 'OTHER';

/**
 * Service Authorization - TX HHSC / FL AHCA approved services
 */
export interface ServiceAuthorization {
  id: UUID;
  carePlanId: UUID;
  clientId: UUID;
  organizationId: UUID;

  // State and payer info
  stateJurisdiction: StateJurisdiction;
  authorizationType: string; // TX: HHSC, MCO; FL: AHCA, SMMC
  authorizationNumber: string;
  payerName: string;
  payerId?: string;

  // Authorization scope
  serviceCodes: string[]; // Procedure codes
  authorizedUnits: number; // Hours or units
  unitType: 'HOURS' | 'VISITS' | 'DAYS';
  ratePerUnit?: number;

  // Period
  effectiveDate: Date;
  expirationDate: Date;

  // Usage tracking
  unitsUsed: number;
  unitsRemaining: number;
  lastUsageDate?: Date;

  // TX-specific
  formNumber?: string; // HHSC Form 4100 series
  mcoId?: string;

  // FL-specific
  ahcaProviderNumber?: string;
  smmcPlanName?: string;

  status: AuthorizationStatus;
  notes?: string;
  stateSpecificData?: Record<string, unknown>;

  // Audit
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
  version: number;
}

export type AuthorizationStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'TERMINATED';

/**
 * RN Delegation - FL 59A-8.0216 nursing task delegation
 */
export interface RNDelegation {
  id: UUID;
  carePlanId: UUID;
  clientId: UUID;
  organizationId: UUID;
  branchId?: UUID;

  // Delegating RN
  delegatingRnId: UUID;
  delegatingRnName: string;
  delegatingRnLicense: string;

  // Delegated to (CNA, HHA, etc.)
  delegatedToCaregiverId?: UUID;
  delegatedToCaregiverName: string;
  delegatedToCredentialType: string; // CNA, HHA, etc.
  delegatedToCredentialNumber?: string;

  // Scope
  taskCategory: string; // MEDICATION, WOUND_CARE, etc.
  taskDescription: string;
  specificSkillsDelegated: string[];
  limitations?: string[];

  // Training and competency
  trainingProvided: boolean;
  trainingDate?: Date;
  trainingMethod?: string;
  competencyEvaluated: boolean;
  competencyEvaluationDate?: Date;
  competencyEvaluatorId?: UUID;
  evaluationResult?: 'COMPETENT' | 'NEEDS_IMPROVEMENT' | 'NOT_COMPETENT' | 'PENDING';

  // Period and supervision
  effectiveDate: Date;
  expirationDate?: Date;
  supervisionFrequency: string; // Daily, Weekly, Per Visit
  lastSupervisionDate?: Date;
  nextSupervisionDue?: Date;

  // Status
  status: DelegationStatus;
  revocationReason?: string;
  revokedBy?: UUID;
  revokedAt?: Timestamp;

  // FL-specific
  ahcaDelegationFormNumber?: string;
  stateSpecificData?: Record<string, unknown>;

  notes?: string;

  // Audit
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
  version: number;
}

export type DelegationStatus =
  | 'PENDING_TRAINING'
  | 'PENDING_EVALUATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'EXPIRED';

/**
 * Extended Care Plan with state-specific fields
 */
export interface StateSpecificCarePlanData {
  // Jurisdiction
  stateJurisdiction?: StateJurisdiction;

  // Order source and provenance (TX requirement)
  orderSource?: string; // Physician/authorized professional
  orderingProviderId?: UUID;
  orderingProviderName?: string;
  orderingProviderLicense?: string;
  orderingProviderNpi?: string;
  orderDate?: Timestamp;
  verbalOrderAuthenticatedBy?: UUID;
  verbalOrderAuthenticatedAt?: Timestamp;

  // RN supervision (FL requirement)
  rnDelegationId?: UUID;
  rnSupervisorId?: UUID;
  rnSupervisorName?: string;
  rnSupervisorLicense?: string;
  lastSupervisoryVisitDate?: Date;
  nextSupervisoryVisitDue?: Date;

  // Review requirements (both states)
  planReviewIntervalDays?: number; // TX/FL: 60-90 days
  nextReviewDue?: Date;
  lastReviewCompletedDate?: Date;
  lastReviewCompletedBy?: UUID;

  // Medicaid program tracking
  medicaidProgram?: string; // TX: STAR+Plus, CFC, etc.; FL: SMMC, LTC
  medicaidWaiver?: string;
  serviceAuthorizationForm?: string; // TX: HHSC Form 4100
  serviceAuthorizationUnits?: number;
  serviceAuthorizationPeriodStart?: Date;
  serviceAuthorizationPeriodEnd?: Date;

  // TX Consumer Directed Services (CDS)
  isCdsModel?: boolean;
  employerAuthorityId?: UUID; // Who manages caregivers in CDS
  financialManagementServiceId?: UUID; // FMS provider

  // Forms and documentation
  planOfCareFormNumber?: string; // TX Form 485, FL AHCA Form 484
  disasterPlanOnFile?: boolean; // TX §558 Emergency Preparedness
  infectionControlPlanReviewed?: boolean;

  // Additional state-specific data (flexible)
  stateSpecificData?: Record<string, unknown>;
}

/**
 * State-specific task requirements
 */
export interface StateSpecificTaskData {
  // FL supervision requirements
  requiresSupervision?: boolean;
  supervisorReviewRequired?: boolean;
  supervisorReviewedBy?: UUID;
  supervisorReviewedAt?: Timestamp;

  // Delegation
  delegationAuthorityId?: UUID; // Link to RN delegation
  skillLevelRequired?: SkillLevel;

  // Additional state-specific data
  stateSpecificData?: Record<string, unknown>;
}

export type SkillLevel =
  | 'CAREGIVER' // Basic personal care
  | 'CNA' // Certified Nursing Assistant
  | 'HHA' // Home Health Aide
  | 'LPN' // Licensed Practical Nurse / LVN
  | 'RN' // Registered Nurse
  | 'THERAPIST' // PT, OT, ST
  | 'OTHER';

/**
 * Validation results for state-specific compliance
 */
export interface StateComplianceValidation {
  isCompliant: boolean;
  errors: StateComplianceError[];
  warnings: StateComplianceWarning[];
  stateJurisdiction: StateJurisdiction;
}

export interface StateComplianceError {
  code: string;
  field: string;
  message: string;
  requirement: string; // Regulation citation
  severity: 'BLOCKING' | 'CRITICAL';
}

export interface StateComplianceWarning {
  code: string;
  field: string;
  message: string;
  requirement: string;
  severity: 'WARNING' | 'INFO';
}

/**
 * TX-specific validation rules
 */
export interface TexasCarePlanRequirements {
  // 26 TAC §558.287 - Plan of Care requirements
  requiresPhysicianOrder: boolean;
  requiresRnAssessment: boolean;
  requiresEmergencyPlan: boolean;
  maxDaysBetweenReviews: number; // Typically 60

  // HHSC forms
  requiredForms: string[]; // Form 485, 1746, etc.

  // Service authorization
  requiresServiceAuthorization: boolean;
  authorizationForm: string; // HHSC Form 4100 series

  // CDS-specific
  isCdsModel: boolean;
  requiresEmployerAuthority?: boolean;
  requiresFmsProvider?: boolean;
}

/**
 * FL-specific validation rules
 */
export interface FloridaCarePlanRequirements {
  // AHCA Chapter 59A-8
  requiresPhysicianOrders: boolean;
  requiresComprehensiveAssessment: boolean;
  requiresRnSupervision: boolean;
  maxDaysBetweenReviews: number; // Typically 60
  maxDaysBetweenSupervisoryVisits: number; // Typically 14-30

  // AHCA forms
  requiredForms: string[]; // AHCA Form 484, etc.

  // Delegation requirements (59A-8.0216)
  requiresRnDelegation: boolean;
  requiresCompetencyEvaluation: boolean;
  requiresOngoingSupervision: boolean;

  // Personnel requirements (59A-8.0095)
  minimumStaffingRatios?: Record<string, number>;
  requiredTraining: string[];
}

/**
 * Input types for creating state-specific entities
 */
export interface CreateServiceAuthorizationInput {
  carePlanId: UUID;
  clientId: UUID;
  organizationId: UUID;
  stateJurisdiction: StateJurisdiction;
  authorizationType: string;
  authorizationNumber: string;
  payerName: string;
  payerId?: string;
  serviceCodes: string[];
  authorizedUnits: number;
  unitType: 'HOURS' | 'VISITS' | 'DAYS';
  ratePerUnit?: number;
  effectiveDate: Date;
  expirationDate: Date;
  formNumber?: string;
  mcoId?: string;
  ahcaProviderNumber?: string;
  smmcPlanName?: string;
  notes?: string;
  stateSpecificData?: Record<string, unknown>;
}

export interface CreateRNDelegationInput {
  carePlanId: UUID;
  clientId: UUID;
  organizationId: UUID;
  branchId?: UUID;
  delegatingRnId: UUID;
  delegatingRnName: string;
  delegatingRnLicense: string;
  delegatedToCaregiverId?: UUID;
  delegatedToCaregiverName: string;
  delegatedToCredentialType: string;
  delegatedToCredentialNumber?: string;
  taskCategory: string;
  taskDescription: string;
  specificSkillsDelegated: string[];
  limitations?: string[];
  trainingProvided: boolean;
  trainingDate?: Date;
  trainingMethod?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  supervisionFrequency: string;
  ahcaDelegationFormNumber?: string;
  notes?: string;
}

/**
 * Search filters for state-specific entities
 */
export interface ServiceAuthorizationFilters {
  organizationId?: UUID;
  clientId?: UUID;
  carePlanId?: UUID;
  stateJurisdiction?: StateJurisdiction;
  status?: AuthorizationStatus[];
  expiringSoon?: boolean; // Within 30 days
  payerName?: string;
  authorizationType?: string;
}

export interface RNDelegationFilters {
  organizationId?: UUID;
  clientId?: UUID;
  carePlanId?: UUID;
  delegatingRnId?: UUID;
  delegatedToCaregiverId?: UUID;
  status?: DelegationStatus[];
  taskCategory?: string;
  needsSupervision?: boolean; // nextSupervisionDue in past
  competencyPending?: boolean;
}
