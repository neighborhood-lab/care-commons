/**
 * Texas Home Healthcare Compliance Validator
 *
 * Implements Texas-specific compliance rules per:
 * - 26 TAC §558 (HHSC Home Health Rules)
 * - Texas Human Resources Code §40.053 (Employee Misconduct Registry)
 * - Texas Human Resources Code §250.006 (Background screening)
 * - Texas Human Resources Code §32.00131 (EVV requirements)
 *
 * Key Texas Characteristics:
 * - STRICT enforcement (toughest state in US)
 * - HHAeXchange mandatory aggregator
 * - Employee Misconduct Registry (permanent disqualification)
 * - 2-year background check cycle (shortest in US)
 * - VMUR 30-day correction window for EVV
 * - Conservative geofencing: 100m base + 50m tolerance = 150m total
 * - 10-minute grace periods (strict)
 */

import { BaseComplianceValidator, StateCredentialConfig, StateAuthorizationConfig } from '../base-validator.js';
import { StateCode } from '../../types/base.js';
import {
  ComplianceIssue,
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
  isExpired,
  isExpiringSoon,
  daysUntilExpiration,
  daysSince,
} from '../types/index.js';

export interface TexasCredentials {
  // Employee Misconduct Registry Check
  emrCheckDate?: Date;
  emrStatus?: 'CLEAR' | 'PENDING' | 'LISTED';
  emrListingDetails?: string; // If listed, reason

  // Nurse Aide Registry (for CNAs)
  narNumber?: string;
  narStatus?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  narVerificationDate?: Date;

  // Background Check (2-year cycle in TX)
  backgroundCheckType?: 'LEVEL_1' | 'LEVEL_2';
  backgroundCheckDate?: Date;
  backgroundCheckExpiration?: Date;

  // HHSC Orientation (mandatory)
  hhscOrientationDate?: Date;
  hhscOrientationCompleted?: boolean;

  // EVV Enrollment
  evvEntityId?: string;
  evvEnrollmentDate?: Date;
  evvEnrollmentStatus?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

export interface TexasClientData {
  // STAR+PLUS / Managed Care
  medicaidProgram?: string;
  managedCareOrganization?: string;
  mcoAuthorizationNumber?: string;

  // Emergency Plan (required for STAR+PLUS)
  emergencyPlanOnFile?: boolean;
  emergencyPlanLastUpdated?: Date;

  // Service Authorizations
  authorizedServices?: Array<{
    serviceCode: string;
    authorizedUnits: number;
    usedUnits: number;
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    requiresEVV: boolean;
  }>;

  // EVV Entity ID (for client-specific EVV)
  evvEntityId?: string;
}

export class TexasComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'TX';

  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'LEVEL_2',                  // Most agencies use Level 2
      frequency: 'BIENNIAL',            // Every 2 years (shortest cycle)
      expirationDays: 730,              // 2 years
      warningDays: 60,
    },
    licensure: {
      required: true,
      roles: ['RN', 'LPN', 'CNA'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'Employee Misconduct Registry',
        type: 'EMPLOYEE_MISCONDUCT',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
      {
        name: 'Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
    ],
  };

  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.9,
    allowOverage: false,                // TX is STRICT - cannot exceed
  };

  protected async validateStateSpecificCredentials(
    caregiver: CaregiverCredentials,
    visit: VisitDetails,
    client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // 1. Employee Misconduct Registry (PERMANENT disqualification if listed)
    issues.push(...this.validateEMR(caregiver));

    // 2. Nurse Aide Registry (for CNAs)
    issues.push(...this.validateNAR(caregiver));

    // 3. HHSC Orientation (mandatory for all)
    issues.push(...this.validateHHSCOrientation(caregiver));

    // 4. EVV Enrollment
    issues.push(...this.validateEVVEnrollment(caregiver, client));

    // 5. Emergency Plan (STAR+PLUS requirement)
    issues.push(...this.validateEmergencyPlan(client));

    return issues;
  }

  private validateEMR(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const txData = caregiver.stateSpecificData?.texas as TexasCredentials | undefined;

    if (!txData?.emrCheckDate) {
      issues.push({
        type: 'TX_EMR_CHECK_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No Employee Misconduct Registry check on file',
        regulation: 'Texas Human Resources Code §40.053, 26 TAC §558.259',
        remediation: 'Check EMR at https://apps.hhs.texas.gov/emr/ before client assignment',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    // If listed on EMR, PERMANENT disqualification
    if (txData.emrStatus === 'LISTED') {
      issues.push({
        type: 'TX_EMR_LISTED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Caregiver is LISTED on Employee Misconduct Registry. PERMANENT DISQUALIFICATION.',
        regulation: 'Texas Human Resources Code §40.053',
        remediation: 'Cannot be employed in home health. This is a permanent disqualification.',
        canBeOverridden: false,
        requiresComplianceReview: true,
        metadata: { listingDetails: txData.emrListingDetails },
      });
    }

    // Check if EMR check is stale (>1 year)
    const checkDate = new Date(txData.emrCheckDate);
    const daysSinceCheck = daysSince(checkDate);
    if (daysSinceCheck > 365) {
      issues.push({
        type: 'TX_EMR_CHECK_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Employee Misconduct Registry check is ${daysSinceCheck} days old. Re-check required annually.`,
        regulation: '26 TAC §558.259',
        remediation: 'Perform updated EMR check',
        canBeOverridden: false,
      });
    }

    return issues;
  }

  private validateNAR(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const txData = caregiver.stateSpecificData?.texas as TexasCredentials | undefined;

    // Only applicable to CNAs
    const isCNA = caregiver.licenses.some(l => l.type === 'CNA' && l.state === 'TX');
    if (!isCNA) return issues;

    if (!txData?.narNumber) {
      issues.push({
        type: 'TX_NAR_NUMBER_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'CNA must be on Texas Nurse Aide Registry',
        regulation: '26 TAC §558.355',
        remediation: 'Verify NAR status at https://vo.hhsc.state.tx.us/',
        canBeOverridden: false,
      });
    } else if (txData.narStatus !== 'ACTIVE') {
      issues.push({
        type: 'TX_NAR_INACTIVE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `NAR status is ${txData.narStatus}, must be ACTIVE`,
        regulation: '26 TAC §558.355',
        remediation: 'Renew NAR certification',
        canBeOverridden: false,
      });
    }

    // Check NAR verification date
    if (txData.narVerificationDate) {
      const verificationDate = new Date(txData.narVerificationDate);
      const daysSinceVerification = daysSince(verificationDate);
      if (daysSinceVerification > 365) {
        issues.push({
          type: 'TX_NAR_VERIFICATION_STALE',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `NAR last verified ${daysSinceVerification} days ago. Annual verification recommended.`,
          regulation: '26 TAC §558.355',
          remediation: 'Re-verify NAR status annually',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  private validateHHSCOrientation(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const txData = caregiver.stateSpecificData?.texas as TexasCredentials | undefined;

    if (!txData?.hhscOrientationCompleted) {
      issues.push({
        type: 'TX_HHSC_ORIENTATION_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'HHSC orientation not completed',
        regulation: '26 TAC §558.259',
        remediation: 'Complete mandatory HHSC orientation training',
        canBeOverridden: false,
      });
    }

    return issues;
  }

  private validateEVVEnrollment(caregiver: CaregiverCredentials, client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const txCaregiverData = caregiver.stateSpecificData?.texas as TexasCredentials | undefined;
    const txClientData = client.stateSpecificData?.texas as TexasClientData | undefined;

    // Check if service requires EVV
    const requiresEVV = txClientData?.authorizedServices?.some(s => s.requiresEVV);

    if (requiresEVV && txCaregiverData?.evvEnrollmentStatus !== 'ACTIVE') {
      issues.push({
        type: 'TX_EVV_NOT_ENROLLED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Caregiver not enrolled in EVV system for EVV-required service',
        regulation: 'Texas Human Resources Code §32.00131',
        remediation: 'Enroll caregiver in HHAeXchange EVV system',
        canBeOverridden: false,
      });
    }

    return issues;
  }

  private validateEmergencyPlan(client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const txData = client.stateSpecificData?.texas as TexasClientData | undefined;

    // Emergency plan required for STAR+PLUS
    const isSTARPlus = txData?.medicaidProgram === 'STAR_PLUS';

    if (isSTARPlus && !txData.emergencyPlanOnFile) {
      issues.push({
        type: 'TX_EMERGENCY_PLAN_MISSING',
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: 'Emergency plan required for STAR+PLUS clients',
        regulation: '26 TAC §558',
        remediation: 'Complete and file emergency backup plan',
        canBeOverridden: false,
      });
    }

    // Check if plan is outdated (>1 year)
    if (isSTARPlus && txData.emergencyPlanLastUpdated) {
      const lastUpdated = new Date(txData.emergencyPlanLastUpdated);
      const daysSinceUpdate = daysSince(lastUpdated);
      if (daysSinceUpdate > 365) {
        issues.push({
          type: 'TX_EMERGENCY_PLAN_OUTDATED',
          severity: 'WARNING',
          category: 'CLIENT_AUTHORIZATION',
          message: `Emergency plan last updated ${daysSinceUpdate} days ago. Annual review recommended.`,
          regulation: '26 TAC §558',
          remediation: 'Review and update emergency backup plan',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  protected getBackgroundRegulation(): string {
    return 'Texas Human Resources Code §250.006, 26 TAC §558';
  }

  protected getLicensureRegulation(): string {
    return '26 TAC §558';
  }

  protected getRegistryRegulation(type: string): string {
    if (type === 'EMPLOYEE_MISCONDUCT') {
      return 'Texas Human Resources Code §40.053';
    } else if (type === 'NURSE_AIDE') {
      return '26 TAC §558.355';
    }
    return '26 TAC §558';
  }

  protected getAuthorizationRegulation(): string {
    return '26 TAC §558, STAR+PLUS Contract Requirements';
  }

  protected getDocumentationRegulation(): string {
    return '26 TAC §558';
  }

  protected getPlanOfCareRegulation(): string {
    return '26 TAC §558, 42 CFR §484';
  }
}
