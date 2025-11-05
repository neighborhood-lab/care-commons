/**
 * Ohio Home Healthcare Compliance Validator
 *
 * Implements Ohio-specific compliance rules per:
 * - Ohio Revised Code §173.27 (Background Screening)
 * - Ohio Revised Code §3721.30 (Nurse Aide Registry)
 * - Ohio Revised Code §5164.34 (Medicaid Provider Standards)
 * - Ohio Administrative Code 3701-18-03 (STNA Requirements)
 * - Ohio Administrative Code 5160-1-17 (Home Health Provider Requirements)
 * - Ohio Administrative Code 5160-12-03 (Plan of Care Requirements)
 * - Ohio Administrative Code 5160-58-01 (Personal Care Aide Standards)
 *
 * Key Ohio Characteristics:
 * - FREE Sandata EVV aggregator (major cost advantage)
 * - FBI+BCI fingerprint required (not just name-based check)
 * - 5-year background check cycle (longer than TX's 2 years)
 * - STNA 2-year certification with 12 hours CE
 * - RN supervision: 14 days (new), 60 days (established)
 * - Conservative geofencing: 125m base + 75m tolerance = 200m total
 * - 10-minute grace periods
 * - 6-year data retention
 * - Complex MCO landscape (MyCare Ohio + 5 Medicaid MCOs)
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

/**
 * Ohio-specific credential data structure
 * Extends base caregiver credentials with OH-specific fields
 */
export interface OhioCredentials {
  // FBI + BCI Background Check (§173.27, §5164.34)
  backgroundCheck?: {
    type: 'FBI_BCI';                    // Must be fingerprint-based
    checkDate: Date;                    // Date clearance received
    expirationDate: Date;               // checkDate + 5 years
    bciTrackingNumber: string;          // Ohio BCI transaction ID
    documentation: string;              // PDF of clearance letter
    status: 'CLEAR' | 'PENDING' | 'ISSUES' | 'EXPIRED';
  };

  // STNA (State Tested Nurse Aide) Registry (§3721.30, OAC 3701-18-03)
  stnaNumber?: string;                  // STNA registry number
  stnaStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  stnaVerificationDate?: Date;          // Last registry check
  stnaCertificationExpiration?: Date;   // Cert expires every 2 years
  stnaCEHours?: number;                 // Continuing education (12 hrs/2 years)
  stnaLastPaidWork?: Date;              // Must work 24 months or re-test

  // HHA (Home Health Aide) Training (OAC 5160-58-01)
  hhaTrainingCompletion?: Date;         // 75-hour training completion
  hhaTrainingProgram?: string;          // Approved program name
  hhaCompetencyStatus?: 'PASSED' | 'FAILED' | 'PENDING';
  lastCompetencyCheck?: Date;           // Annual competency evaluation
  annualInServiceHours?: number;        // 12 hours per year
}

/**
 * Ohio-specific client data structure
 */
export interface OhioClientData {
  // MCO Information (MyCare Ohio, Buckeye, CareSource, Molina, Paramount, UnitedHealthcare)
  mcoName?: string;
  mcoId?: string;
  mcoAuthorizationRequired?: boolean;

  // RN Supervision (OAC 5160-12-03, 42 CFR §484.36)
  lastRNSupervisionVisit?: Date;
  nextRNSupervisionDue?: Date;
  rnSupervisorId?: string;
  isNewClient?: boolean;                // New = within first 60 days of service

  // Service Authorizations (specific to OH)
  odmProviderNumber?: string;           // ODM provider enrollment number
  odmAuthorizationNumber?: string;      // State authorization tracking
}

/**
 * Ohio Compliance Validator
 */
export class OhioComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'OH';

  /**
   * Ohio credential requirements configuration
   */
  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'FINGERPRINT',              // FBI + BCI fingerprint mandatory
      frequency: 'EVERY_5_YEARS',       // Longer cycle than TX (2 years)
      expirationDays: 1825,             // 5 years * 365 days
      warningDays: 60,                  // Warn 60 days before expiration
    },
    licensure: {
      required: true,
      roles: ['RN', 'LPN', 'CNA', 'STNA', 'HHA'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'Ohio Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'ANNUAL',
        expirationDays: 730,            // STNA cert every 2 years
      },
    ],
  };

  /**
   * Ohio authorization requirements
   */
  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.9,              // Warn at 90% utilization
    allowOverage: false,                // Cannot exceed authorized units
  };

  /**
   * State-specific credential validations
   */
  protected async validateStateSpecificCredentials(
    caregiver: CaregiverCredentials,
    visit: VisitDetails,
    client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // 1. FBI+BCI background check validation
    issues.push(...this.validateFBIBCICheck(caregiver));

    // 2. STNA registry validation (for CNAs)
    issues.push(...this.validateSTNARegistry(caregiver));

    // 3. HHA training validation
    issues.push(...this.validateHHATraining(caregiver));

    // 4. RN supervision validation (client-specific)
    issues.push(...this.validateRNSupervision(client));

    return issues;
  }

  /**
   * Validate FBI+BCI background check
   *
   * Ohio Revised Code §5164.34: All caregivers providing services to Medicaid
   * beneficiaries must undergo FBI and BCI fingerprint checks before client contact.
   *
   * Re-check required:
   * - Every 5 years
   * - Break in service > 90 days
   * - Substantiated incident
   */
  private validateFBIBCICheck(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ohioData = caregiver.stateSpecificData?.ohio as OhioCredentials | undefined;

    // Missing background check entirely
    if (!ohioData?.backgroundCheck) {
      issues.push({
        type: 'OH_FBI_BCI_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No FBI+BCI background check on file. Cannot assign to any client.',
        regulation: 'Ohio Revised Code §5164.34, Ohio Administrative Code 5160-1-17',
        remediation: 'Submit fingerprints to Ohio BCI via approved vendor (Fieldprint, IdentoGO). ' +
                     'Visit https://www.ohioattorneygeneral.gov/Business/Services-for-Business/WebCheck',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    const check = ohioData.backgroundCheck;

    // Must be FBI+BCI type (not name-based)
    if (check.type !== 'FBI_BCI') {
      issues.push({
        type: 'OH_WRONG_BACKGROUND_TYPE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Ohio requires FBI+BCI fingerprint background check, not name-based check',
        regulation: 'Ohio Revised Code §5164.34',
        remediation: 'Complete FBI+BCI fingerprint check through Ohio BCI',
        canBeOverridden: false,
      });
    }

    // Check expiration status
    const today = new Date();
    const expirationDate = new Date(check.expirationDate);

    if (isExpired(expirationDate)) {
      issues.push({
        type: 'OH_BACKGROUND_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `FBI+BCI background check expired on ${expirationDate.toLocaleDateString()}. ` +
                 `Ohio requires re-check every 5 years.`,
        regulation: 'Ohio Revised Code §173.27',
        remediation: 'Submit new fingerprints for updated FBI+BCI check',
        canBeOverridden: false,
        metadata: {
          expirationDate: expirationDate.toISOString(),
          daysSinceExpiration: daysSince(expirationDate),
        },
      });
    } else if (isExpiringSoon(expirationDate, 60)) {
      issues.push({
        type: 'OH_BACKGROUND_EXPIRING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `FBI+BCI background check expires in ${daysUntilExpiration(expirationDate)} days. ` +
                 `Schedule renewal soon.`,
        regulation: 'Ohio Revised Code §173.27',
        remediation: 'Schedule fingerprinting appointment before expiration',
        canBeOverridden: true,
        metadata: {
          expirationDate: expirationDate.toISOString(),
          daysRemaining: daysUntilExpiration(expirationDate),
        },
      });
    }

    // Check for pending or issues status
    if (check.status === 'PENDING') {
      issues.push({
        type: 'OH_BACKGROUND_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'FBI+BCI background check results pending. Cannot assign until cleared.',
        regulation: 'Ohio Administrative Code 5160-1-17',
        remediation: 'Wait for BCI results (typically 3-5 business days)',
        canBeOverridden: false,
      });
    } else if (check.status === 'ISSUES') {
      issues.push({
        type: 'OH_BACKGROUND_ISSUES',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'FBI+BCI background check found disqualifying issues. Caregiver ineligible.',
        regulation: 'Ohio Revised Code §5164.34',
        remediation: 'Review disqualifying offenses with legal/HR. May be permanent disqualification.',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    }

    return issues;
  }

  /**
   * Validate STNA (State Tested Nurse Aide) registry
   *
   * Ohio Revised Code §3721.30: CNAs must be on Ohio Nurse Aide Registry
   * OAC 3701-18-03: STNA certification requirements
   *
   * Requirements:
   * - Listed on registry with ACTIVE status
   * - Certification renewed every 2 years
   * - 12 hours continuing education per 2-year cycle
   * - Must work 24 months within 5-year period or re-test
   */
  private validateSTNARegistry(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ohioData = caregiver.stateSpecificData?.ohio as OhioCredentials | undefined;

    // Check if caregiver is CNA/STNA
    const isCNA = caregiver.licenses.some(license =>
      ['CNA', 'STNA'].includes(license.type) && license.state === 'OH'
    );

    if (!isCNA) {
      return issues; // Not applicable to non-CNAs
    }

    // CNA must have STNA number
    if (!ohioData?.stnaNumber) {
      issues.push({
        type: 'OH_STNA_NUMBER_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'CNA must be registered on Ohio Nurse Aide Registry',
        regulation: 'Ohio Revised Code §3721.30, Ohio Administrative Code 3701-18-03',
        remediation: 'Verify STNA registration at https://odh.ohio.gov/know-our-programs/nurse-aide-registry',
        canBeOverridden: false,
      });
      return issues;
    }

    // STNA status must be ACTIVE
    if (ohioData.stnaStatus !== 'ACTIVE') {
      let remediation = '';

      if (ohioData.stnaStatus === 'EXPIRED') {
        remediation = 'Renew STNA certification (requires 12 hours CE every 2 years)';
      } else if (ohioData.stnaStatus === 'SUSPENDED' || ohioData.stnaStatus === 'REVOKED') {
        remediation = 'Registry status is SUSPENDED or REVOKED. Caregiver may be permanently ineligible.';
      } else if (ohioData.stnaStatus === 'INACTIVE') {
        remediation = 'STNA inactive due to lack of paid work. Must work 24 months within 5-year period or re-test per OAC 3701-18-03.';
      }

      issues.push({
        type: 'OH_STNA_INACTIVE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `STNA registry status is ${ohioData.stnaStatus}, must be ACTIVE`,
        regulation: 'Ohio Administrative Code 3701-18-03',
        remediation,
        canBeOverridden: false,
        requiresComplianceReview: ohioData.stnaStatus === 'SUSPENDED' || ohioData.stnaStatus === 'REVOKED',
      });
    }

    // Check STNA certification expiration
    if (ohioData.stnaCertificationExpiration) {
      const expirationDate = new Date(ohioData.stnaCertificationExpiration);

      if (isExpired(expirationDate)) {
        issues.push({
          type: 'OH_STNA_CERT_EXPIRED',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `STNA certification expired on ${expirationDate.toLocaleDateString()}. ` +
                   `Ohio requires renewal every 2 years with 12 hours CE.`,
          regulation: 'Ohio Administrative Code 3701-18-03',
          remediation: 'Complete 12 hours continuing education and submit renewal application',
          canBeOverridden: false,
        });
      } else if (isExpiringSoon(expirationDate, 60)) {
        issues.push({
          type: 'OH_STNA_CERT_EXPIRING',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `STNA certification expires in ${daysUntilExpiration(expirationDate)} days`,
          regulation: 'Ohio Administrative Code 3701-18-03',
          remediation: 'Schedule continuing education courses to meet 12-hour requirement',
          canBeOverridden: true,
        });
      }
    }

    // Check 24-month work requirement
    if (ohioData.stnaLastPaidWork) {
      const lastWorkDate = new Date(ohioData.stnaLastPaidWork);
      const daysSinceWork = daysSince(lastWorkDate);

      // If >1095 days (3 years) since last paid work, may be at risk of inactive status
      if (daysSinceWork > 1095) {
        issues.push({
          type: 'OH_STNA_WORK_GAP',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `STNA has not worked in ${Math.floor(daysSinceWork / 365)} years. ` +
                   `Ohio requires 24 months paid work within 5-year period.`,
          regulation: 'Ohio Administrative Code 3701-18-03',
          remediation: 'Monitor work history. If approaches 5-year mark without 24 months work, must re-test.',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate HHA (Home Health Aide) training
   *
   * OAC 5160-58-01: HHA must complete 75-hour training and annual competency
   */
  private validateHHATraining(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ohioData = caregiver.stateSpecificData?.ohio as OhioCredentials | undefined;

    // Check if caregiver is HHA role
    const isHHA = caregiver.licenses.some(l => l.type === 'HHA' && l.state === 'OH');

    if (!isHHA) {
      return issues; // Not applicable
    }

    // HHA must have 75-hour training completion
    if (!ohioData?.hhaTrainingCompletion) {
      issues.push({
        type: 'OH_HHA_TRAINING_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'HHA must complete 75-hour training program before client contact',
        regulation: 'Ohio Administrative Code 5160-58-01',
        remediation: 'Enroll in DODD-approved HHA training program and complete 75 hours',
        canBeOverridden: false,
      });
    }

    // Check annual competency status
    if (ohioData?.hhaCompetencyStatus !== 'PASSED') {
      issues.push({
        type: 'OH_HHA_COMPETENCY_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'HHA annual competency evaluation not passed',
        regulation: 'Ohio Administrative Code 5160-58-01',
        remediation: 'Schedule and pass annual skills competency check',
        canBeOverridden: false,
      });
    }

    // Check when last competency was done
    if (ohioData?.lastCompetencyCheck) {
      const lastCheck = new Date(ohioData.lastCompetencyCheck);
      const daysSinceCheck = daysSince(lastCheck);

      // If >365 days, overdue
      if (daysSinceCheck > 365) {
        issues.push({
          type: 'OH_HHA_COMPETENCY_OVERDUE',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `HHA competency check overdue by ${daysSinceCheck - 365} days. Required annually.`,
          regulation: 'Ohio Administrative Code 5160-58-01',
          remediation: 'Schedule immediate competency evaluation',
          canBeOverridden: false,
        });
      }
    }

    // Check in-service hours (12 hours per year)
    if (ohioData?.annualInServiceHours !== undefined && ohioData.annualInServiceHours < 12) {
      issues.push({
        type: 'OH_HHA_INSERVICE_HOURS',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `HHA has only ${ohioData.annualInServiceHours} in-service hours. 12 hours required annually.`,
        regulation: 'Ohio Administrative Code 5160-58-01',
        remediation: 'Complete additional in-service training to meet 12-hour annual requirement',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate RN supervision requirements
   *
   * OAC 5160-12-03, 42 CFR §484.36: RN must conduct on-site supervision visits
   *
   * Frequency:
   * - NEW clients: Every 14 days for first 60 days
   * - ESTABLISHED clients: Every 60 days
   */
  private validateRNSupervision(client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ohioData = client.stateSpecificData?.ohio as OhioClientData | undefined;

    // Check if last RN visit is on record
    if (!ohioData?.lastRNSupervisionVisit) {
      issues.push({
        type: 'OH_RN_SUPERVISION_MISSING',
        severity: 'WARNING',
        category: 'CLIENT_AUTHORIZATION',
        message: 'No RN supervision visit on record. Required by Ohio regulations.',
        regulation: 'Ohio Administrative Code 5160-12-03, 42 CFR §484.36',
        remediation: 'RN supervisor must conduct on-site visit to observe aide and assess client',
        canBeOverridden: true,
      });
      return issues;
    }

    const lastVisit = new Date(ohioData.lastRNSupervisionVisit);
    const daysSinceVisit = daysSince(lastVisit);

    // Determine required frequency
    const isNewClient = ohioData.isNewClient === true;
    const requiredFrequency = isNewClient ? 14 : 60;

    if (daysSinceVisit > requiredFrequency) {
      issues.push({
        type: isNewClient ? 'OH_RN_SUPERVISION_14DAY_OVERDUE' : 'OH_RN_SUPERVISION_60DAY_OVERDUE',
        severity: 'BLOCKING',
        category: 'CLIENT_AUTHORIZATION',
        message: `RN supervision visit overdue by ${daysSinceVisit - requiredFrequency} days. ` +
                 `${isNewClient ? 'New clients require RN visit every 14 days for first 60 days' : 'Established clients require RN visit every 60 days'}.`,
        regulation: 'Ohio Administrative Code 5160-12-03, 42 CFR §484.36',
        remediation: 'RN supervisor must conduct on-site visit immediately',
        canBeOverridden: false,
        metadata: { daysSinceVisit, requiredFrequency, isNewClient },
      });
    }

    return issues;
  }

  /**
   * State-specific regulation citations
   */
  protected getBackgroundRegulation(): string {
    return 'Ohio Revised Code §173.27, §5164.34; Ohio Administrative Code 5160-1-17';
  }

  protected getLicensureRegulation(): string {
    return 'Ohio Revised Code §4723 (Nursing), Ohio Administrative Code 5160-58-01';
  }

  protected getRegistryRegulation(type: string): string {
    if (type === 'NURSE_AIDE') {
      return 'Ohio Revised Code §3721.30, Ohio Administrative Code 3701-18-03';
    }
    return 'Ohio Revised Code §5164.34';
  }

  protected getAuthorizationRegulation(): string {
    return 'Ohio Administrative Code 5160-58-01, MyCare Ohio Contract Requirements';
  }

  protected getDocumentationRegulation(): string {
    return 'Ohio Administrative Code 5160-12-03, Ohio Medicaid Documentation Standards';
  }

  protected getPlanOfCareRegulation(): string {
    return 'Ohio Administrative Code 5160-12-03, 42 CFR §484.60';
  }
}
