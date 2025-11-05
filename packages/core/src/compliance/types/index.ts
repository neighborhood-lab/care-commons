/**
 * Core Compliance Types
 * 
 * Shared types for state-specific compliance validation across all 50 states.
 * These types enable regulations-as-code with test-driven compliance.
 * 
 * Domain Knowledge Applied:
 * - Modeled after real regulatory violations and audit findings
 * - Supports both blocking issues (prevent service) and warnings (alert only)
 * - Includes regulatory citations for audit trail
 * - Designed for supervisor override workflows
 */

import { StateCode } from '../../types/base.js';

/**
 * Severity of a compliance issue
 * 
 * - BLOCKING: Prevents action (e.g., cannot assign caregiver with expired license)
 * - WARNING: Allows action but flags for review (e.g., credential expiring soon)
 * - INFO: Informational only, no action required
 */
export type ComplianceIssueSeverity = 'BLOCKING' | 'WARNING' | 'INFO';

/**
 * Category of compliance requirement
 * 
 * Aligned with typical state regulatory structure.
 */
export type ComplianceCategory =
  | 'CAREGIVER_CREDENTIALS'
  | 'CLIENT_AUTHORIZATION'
  | 'VISIT_DOCUMENTATION'
  | 'EVV_COMPLIANCE'
  | 'DATA_RETENTION'
  | 'PRIVACY_SECURITY'
  | 'QUALITY_STANDARDS'
  | 'INCIDENT_REPORTING';

/**
 * A specific compliance issue identified during validation
 * 
 * Example:
 * {
 *   type: 'TX_EMR_EXPIRED',
 *   severity: 'BLOCKING',
 *   category: 'CAREGIVER_CREDENTIALS',
 *   message: 'Employee Misconduct Registry check expired (over 1 year old)',
 *   regulation: '26 TAC §558.353',
 *   remediation: 'Re-verify EMR status at https://apps.hhs.texas.gov/emr/',
 *   canBeOverridden: false,
 *   requiresComplianceReview: true,
 * }
 */
export interface ComplianceIssue {
  /** Unique type identifier (e.g., TX_EMR_EXPIRED, FL_BACKGROUND_MISSING) */
  type: string;
  
  /** Severity level */
  severity: ComplianceIssueSeverity;
  
  /** Category of compliance requirement */
  category: ComplianceCategory;
  
  /** Human-readable message explaining the issue */
  message: string;
  
  /** Regulatory citation (statute, rule, policy) */
  regulation: string;
  
  /** How to remediate the issue */
  remediation: string;
  
  /** Can a supervisor override this issue? */
  canBeOverridden: boolean;
  
  /** Requires compliance officer review? */
  requiresComplianceReview?: boolean;
  
  /** Additional context data */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a compliance validation check
 * 
 * Used for all validation operations (assignment, scheduling, documentation, etc.)
 */
export interface ValidationResult {
  /** Whether the action can proceed */
  canProceed: boolean;
  
  /** List of compliance issues identified */
  issues: ComplianceIssue[];
  
  /** State this validation was performed for */
  state?: StateCode;
  
  /** Timestamp of validation */
  validatedAt?: Date;
  
  /** Validator that performed the check */
  validator?: string;
}

/**
 * Background screening credential
 * 
 * Required in all 50 states, but specifics vary (Level 1 vs Level 2, frequency, etc.)
 */
export interface BackgroundScreening {
  /** Type of background check */
  type: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'FINGERPRINT' | 'STATE_SPECIFIC';
  
  /** Date background check was completed */
  checkDate: Date;
  
  /** Status of the check */
  status: 'CLEAR' | 'PENDING' | 'ISSUES' | 'EXPIRED';
  
  /** Expiration date (if applicable) */
  expirationDate?: Date;
  
  /** Reference to documentation (PDF, screenshot, etc.) */
  documentation?: string;
  
  /** Notes about the screening */
  notes?: string;
  
  /** State where screening was conducted */
  state?: StateCode;
}

/**
 * Professional licensure
 * 
 * RN, LPN/LVN, CNA, HHA, PCA - requirements vary by state
 */
export interface ProfessionalLicense {
  /** License type */
  type: 'RN' | 'LPN' | 'LVN' | 'CNA' | 'HHA' | 'PCA' | 'OTHER';
  
  /** License number */
  number: string;
  
  /** State that issued the license */
  state: StateCode;
  
  /** Issue date */
  issueDate: Date;
  
  /** Expiration date */
  expirationDate: Date;
  
  /** License status */
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';
  
  /** Date of last verification */
  verificationDate?: Date;
  
  /** URL to state licensure lookup */
  verificationUrl?: string;
}

/**
 * Registry check (state-specific)
 * 
 * Examples:
 * - Texas: Employee Misconduct Registry, Nurse Aide Registry
 * - Florida: Clearinghouse, Nurse Aide Registry
 * - Ohio: Nurse Aide Registry
 */
export interface RegistryCheck {
  /** Registry name */
  name: string;
  
  /** Registry type */
  type: 'EMPLOYEE_MISCONDUCT' | 'NURSE_AIDE' | 'ABUSE_NEGLECT' | 'OTHER';
  
  /** Date of check */
  checkDate: Date;
  
  /** Result of check */
  status: 'CLEAR' | 'LISTED' | 'PENDING' | 'EXPIRED';
  
  /** Registry reference number (if any) */
  referenceNumber?: string;
  
  /** Documentation of check */
  documentation?: string;
  
  /** State registry */
  state: StateCode;
}

/**
 * Caregiver credentials (aggregated)
 * 
 * All credentials required to work as a caregiver in a specific state.
 */
export interface CaregiverCredentials {
  /** Background screening */
  backgroundScreening?: BackgroundScreening;
  
  /** Professional licenses */
  licenses: ProfessionalLicense[];
  
  /** Registry checks */
  registryChecks: RegistryCheck[];
  
  /** State-specific credentials (JSONB field) */
  stateSpecificData?: Record<string, unknown>;
}

/**
 * Service authorization
 * 
 * Required for Medicaid and many private insurers.
 */
export interface ServiceAuthorization {
  /** Authorization number */
  authorizationNumber: string;
  
  /** Payor (Medicaid MCO, Medicare, private insurance) */
  payor: string;
  
  /** Authorized services */
  authorizedServices: string[];
  
  /** Total authorized units */
  authorizedUnits: number;
  
  /** Units consumed */
  unitsConsumed: number;
  
  /** Units remaining */
  unitsRemaining: number;
  
  /** Authorization start date */
  startDate: Date;
  
  /** Authorization end date */
  endDate: Date;
  
  /** Authorization status */
  status: 'ACTIVE' | 'PENDING' | 'DENIED' | 'EXPIRED' | 'EXHAUSTED';
  
  /** State program */
  program?: string;
}

/**
 * Plan of care
 * 
 * Required for Medicare, Medicaid, and most home health services.
 */
export interface PlanOfCare {
  /** Date plan of care was established */
  establishedDate: Date;
  
  /** Date of last review */
  lastReviewDate: Date;
  
  /** Date next review is due */
  nextReviewDue: Date;
  
  /** Physician signature date */
  physicianSignatureDate?: Date;
  
  /** Physician orders expiration */
  ordersExpiration?: Date;
  
  /** Status */
  status: 'CURRENT' | 'REVIEW_DUE' | 'OVERDUE' | 'EXPIRED';
}

/**
 * Visit documentation requirements
 * 
 * What must be documented for each visit (varies by state and service type).
 */
export interface VisitDocumentationRequirements {
  /** Services provided must be documented */
  servicesProvided: boolean;
  
  /** Client condition must be documented */
  clientCondition: boolean;
  
  /** Vital signs required */
  vitalSigns: boolean;
  
  /** Medications documented */
  medications: boolean;
  
  /** Caregiver observations */
  observations: boolean;
  
  /** Incidents/accidents */
  incidents: boolean;
  
  /** Signatures required */
  signatures: {
    caregiver: boolean;
    client: boolean;
    representative: boolean;
  };
  
  /** Documentation must be completed within X hours */
  timelinessHours: number;
  
  /** Minimum note length (characters) */
  minimumNoteLength?: number;
  
  /** Blocked phrases (vague descriptions) */
  blockedPhrases?: string[];
}

/**
 * Base interface for state-specific compliance validators
 * 
 * Each state implements this interface with state-specific logic.
 */
export interface StateComplianceValidator {
  /** State code */
  readonly state: StateCode;
  
  /**
   * Validate if caregiver can be assigned to a visit
   * 
   * Checks credentials, licensure, registry status, etc.
   */
  canAssignToVisit(
    caregiver: CaregiverCredentials,
    visit: VisitDetails,
    client: ClientDetails
  ): Promise<ValidationResult> | ValidationResult;
  
  /**
   * Validate client authorization for service
   * 
   * Checks authorization status, units remaining, date ranges.
   */
  validateAuthorization(
    authorization: ServiceAuthorization,
    serviceType: string,
    scheduledDate: Date,
    units: number
  ): Promise<ValidationResult> | ValidationResult;
  
  /**
   * Validate visit documentation completeness
   * 
   * Checks required fields, timeliness, quality standards.
   */
  validateVisitDocumentation(
    documentation: VisitDocumentation,
    requirements: VisitDocumentationRequirements
  ): Promise<ValidationResult> | ValidationResult;
  
  /**
   * Validate plan of care currency
   * 
   * Checks review dates, physician orders, etc.
   */
  validatePlanOfCare(
    planOfCare: PlanOfCare
  ): Promise<ValidationResult> | ValidationResult;
}

/**
 * Visit details (simplified for validation)
 */
export interface VisitDetails {
  id: string;
  clientId: string;
  serviceType: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  state: StateCode;
}

/**
 * Client details (simplified for validation)
 */
export interface ClientDetails {
  id: string;
  state: StateCode;
  authorization?: ServiceAuthorization;
  planOfCare?: PlanOfCare;
  program?: string;
}

/**
 * Visit documentation (simplified)
 */
export interface VisitDocumentation {
  visitId: string;
  servicesProvided?: string;
  clientCondition?: string;
  vitalSigns?: Record<string, unknown>;
  medications?: Record<string, unknown>;
  observations?: string;
  incidents?: string;
  caregiverSignature?: Date;
  clientSignature?: Date;
  representativeSignature?: Date;
  completedAt?: Date;
}

/**
 * Helper function to create a validation result with no issues
 */
export function createSuccessResult(state?: StateCode, validator?: string): ValidationResult {
  return {
    canProceed: true,
    issues: [],
    state,
    validatedAt: new Date(),
    validator,
  };
}

/**
 * Helper function to create a validation result with issues
 */
export function createFailureResult(
  issues: ComplianceIssue[],
  state?: StateCode,
  validator?: string
): ValidationResult {
  const blockingIssues = issues.filter((i) => i.severity === 'BLOCKING');
  return {
    canProceed: blockingIssues.length === 0,
    issues,
    state,
    validatedAt: new Date(),
    validator,
  };
}

/**
 * Helper function to check if a date is expired
 */
export function isExpired(date: Date | null | undefined): boolean {
  if (!date) return true;
  return new Date() > new Date(date);
}

/**
 * Helper function to check if a date is expiring soon (within days)
 */
export function isExpiringSoon(date: Date | null | undefined, withinDays: number): boolean {
  if (!date) return false;
  const expirationDate = new Date(date);
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + withinDays);
  return expirationDate <= warningDate && expirationDate > new Date();
}

/**
 * Helper function to calculate days until expiration
 */
export function daysUntilExpiration(date: Date | null | undefined): number {
  if (!date) return -1;
  const today = new Date();
  const expiration = new Date(date);
  const diff = expiration.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Helper function to calculate days since date
 */
export function daysSince(date: Date | null | undefined): number {
  if (!date) return -1;
  const today = new Date();
  const past = new Date(date);
  const diff = today.getTime() - past.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
