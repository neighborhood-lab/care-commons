/**
 * Pennsylvania Home Healthcare Compliance Validator
 *
 * Implements Pennsylvania-specific compliance rules per:
 * - Pennsylvania Code Title 55 §52.21 (Background Checks)
 * - Pennsylvania Code Title 55 §2600.18 (Criminal History Checks)
 * - Pennsylvania DHS Nurse Aide Registry Requirements
 * - Pennsylvania Home Care Licensure Act (Act 56 of 2007)
 * - Pennsylvania EVV Requirements (Act 13 of 2019)
 *
 * Key Pennsylvania Characteristics:
 * - FREE Sandata EVV aggregator (major cost advantage)
 * - Moderate licensing requirements
 * - 5-year background check cycle
 * - 7-year data retention (longest of all states)
 * - Conservative geofencing: 100m base + 50m tolerance = 150m total
 * - 15-minute grace periods
 * - Community HealthChoices MCO system
 */

import { BaseComplianceValidator, StateCredentialConfig, StateAuthorizationConfig } from '../base-validator';
import { StateCode } from '../../types/base';
import {
  ComplianceIssue,
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
  isExpired,
  isExpiringSoon,
  daysUntilExpiration,
  daysSince,
} from '../types/index';

/**
 * Pennsylvania-specific credential data structure
 */
export interface PennsylvaniaCredentials {
  // FBI + State Police Background Check (Title 55 §2600.18)
  fbiBackgroundCheck?: {
    checkDate: Date;
    expirationDate: Date;
    status: 'CLEAR' | 'PENDING' | 'ISSUES' | 'EXPIRED';
    clearanceNumber?: string;
  };

  // PA Child Abuse Registry Check (Act 151 of 1994)
  childAbuseCheck?: {
    checkDate: Date;
    expirationDate: Date;
    status: 'CLEAR' | 'PENDING' | 'LISTED' | 'EXPIRED';
    certificationNumber?: string;
  };

  // Nurse Aide Registry (for CNAs)
  paRegistryNumber?: string;
  paRegistryStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
  paRegistryVerificationDate?: Date;

  // Professional Licensure
  paLicenseNumber?: string;
  paLicenseType?: 'RN' | 'LPN' | 'CNA' | 'HHA';
  paLicenseExpiration?: Date;

  // Mandatory Training (Act 13 of 2019 - EVV)
  evvTrainingDate?: Date;
  evvTrainingCompleted?: boolean;

  // Tuberculosis Testing (Required by PA DHS)
  tbTestDate?: Date;
  tbTestResult?: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  tbTestExpiration?: Date;
}

/**
 * Pennsylvania-specific client data structure
 */
export interface PennsylvaniaClientData {
  // Community HealthChoices MCO (PA's managed care program)
  chcMCO?: string; // 'Keystone First' | 'AmeriHealth Caritas' | 'PA Health & Wellness' | 'UPMC'
  chcEnrollmentDate?: Date;
  chcAuthorizationNumber?: string;

  // Service Authorizations
  paServiceAuthorizations?: Array<{
    serviceCode: string;
    authorizedUnits: number;
    usedUnits: number;
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    requiresEVV: boolean;
  }>;

  // Plan of Care (PA-specific requirements)
  pocPhysicianSignatureDate?: Date;
  pocNextReviewDue?: Date;
  pocReviewFrequency?: number; // Days

  // Waiver Programs (OBRA, Aging, Attendant Care)
  waiverProgram?: 'OBRA' | 'AGING' | 'ATTENDANT_CARE' | 'CHC';
  waiverEnrollmentDate?: Date;
}

/**
 * Pennsylvania Compliance Validator
 */
export class PennsylvaniaComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'PA';

  /**
   * Pennsylvania credential requirements configuration
   */
  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'FINGERPRINT',              // PA requires FBI fingerprint checks
      frequency: 'EVERY_5_YEARS',       // 5-year cycle
      expirationDays: 1825,             // 5 years * 365 days
      warningDays: 60,                  // Warn 60 days before expiration
    },
    licensure: {
      required: true,
      roles: ['RN', 'LPN', 'CNA', 'HHA'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'Pennsylvania Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
      {
        name: 'PA Child Abuse Registry',
        type: 'ABUSE_NEGLECT',
        frequency: 'AT_HIRE',
        expirationDays: 1825,
      },
    ],
  };

  /**
   * Pennsylvania authorization requirements
   */
  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.9,              // Warn at 90% utilization
    allowOverage: false,                // Cannot exceed authorized units
  };

  /**
   * State-specific credential validations
   */
  protected override async validateStateSpecificCredentials(
    caregiver: CaregiverCredentials,
    _visit: VisitDetails,
    client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // 1. FBI + State Police Background Check
    issues.push(...this.validateFBIBackgroundCheck(caregiver));

    // 2. PA Child Abuse Registry Check
    issues.push(...this.validateChildAbuseCheck(caregiver));

    // 3. PA Nurse Aide Registry
    issues.push(...this.validatePARegistry(caregiver));

    // 4. TB Testing
    issues.push(...this.validateTBTesting(caregiver));

    // 5. EVV Training (Act 13 of 2019)
    issues.push(...this.validateEVVTraining(caregiver));

    // 6. Plan of Care Review
    issues.push(...this.validateClientPlanOfCare(client));

    return issues;
  }

  /**
   * Validate FBI + State Police Background Check
   *
   * Pennsylvania Code Title 55 §2600.18: All direct care staff must undergo
   * FBI and PA State Police fingerprint-based criminal history checks.
   */
  private validateFBIBackgroundCheck(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const paData = caregiver.stateSpecificData?.pennsylvania as PennsylvaniaCredentials | undefined;

    if (paData?.fbiBackgroundCheck === undefined) {
      issues.push({
        type: 'PA_FBI_CHECK_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No FBI/State Police background check on file. Cannot assign to any client.',
        regulation: 'Pennsylvania Code Title 55 §2600.18',
        remediation: 'Submit fingerprints for FBI and PA State Police criminal history checks',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    const check = paData.fbiBackgroundCheck;

    // Check status
    if (check.status === 'ISSUES') {
      issues.push({
        type: 'PA_BACKGROUND_ISSUES',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'FBI/State Police background check found disqualifying issues.',
        regulation: 'Pennsylvania Code Title 55 §2600.18',
        remediation: 'Review disqualifying offenses. May require waiver or permanent disqualification.',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (check.status === 'PENDING') {
      issues.push({
        type: 'PA_BACKGROUND_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'FBI/State Police background check results pending. Cannot assign until cleared.',
        regulation: 'Pennsylvania Code Title 55 §2600.18',
        remediation: 'Wait for background check results (typically 7-10 business days)',
        canBeOverridden: false,
      });
    }

    // Check expiration (5-year cycle)
    const expirationDate = new Date(check.expirationDate);
    if (isExpired(expirationDate)) {
      issues.push({
        type: 'PA_BACKGROUND_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `FBI/State Police background check expired on ${expirationDate.toLocaleDateString()}. Re-check required every 5 years.`,
        regulation: 'Pennsylvania Code Title 55 §2600.18',
        remediation: 'Submit new fingerprints for updated background checks',
        canBeOverridden: false,
      });
    } else if (isExpiringSoon(expirationDate, 60)) {
      issues.push({
        type: 'PA_BACKGROUND_EXPIRING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `FBI/State Police background check expires in ${daysUntilExpiration(expirationDate)} days`,
        regulation: 'Pennsylvania Code Title 55 §2600.18',
        remediation: 'Schedule fingerprinting appointment before expiration',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate PA Child Abuse Registry Check
   *
   * Act 151 of 1994 (Child Protective Services Law): All direct care workers
   * must be checked against PA Child Abuse Registry.
   */
  private validateChildAbuseCheck(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const paData = caregiver.stateSpecificData?.pennsylvania as PennsylvaniaCredentials | undefined;

    if (paData?.childAbuseCheck === undefined) {
      issues.push({
        type: 'PA_CHILD_ABUSE_CHECK_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No PA Child Abuse Registry check on file',
        regulation: 'Pennsylvania Child Protective Services Law (Act 151 of 1994)',
        remediation: 'Request child abuse clearance from PA Department of Human Services',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    const check = paData.childAbuseCheck;

    // If listed on registry, PERMANENT disqualification
    if (check.status === 'LISTED') {
      issues.push({
        type: 'PA_CHILD_ABUSE_LISTED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Caregiver is LISTED on PA Child Abuse Registry. PERMANENT DISQUALIFICATION.',
        regulation: 'Pennsylvania Child Protective Services Law (Act 151 of 1994)',
        remediation: 'Cannot be employed in home health. This is a permanent disqualification.',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (check.status === 'PENDING') {
      issues.push({
        type: 'PA_CHILD_ABUSE_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'PA Child Abuse Registry check pending. Cannot assign until cleared.',
        regulation: 'Pennsylvania Child Protective Services Law (Act 151 of 1994)',
        remediation: 'Wait for clearance results (typically 5-7 business days)',
        canBeOverridden: false,
      });
    }

    // Check expiration (5-year cycle, same as FBI check)
    const expirationDate = new Date(check.expirationDate);
    if (isExpired(expirationDate)) {
      issues.push({
        type: 'PA_CHILD_ABUSE_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `PA Child Abuse clearance expired on ${expirationDate.toLocaleDateString()}`,
        regulation: 'Pennsylvania Child Protective Services Law (Act 151 of 1994)',
        remediation: 'Request new child abuse clearance',
        canBeOverridden: false,
      });
    } else if (isExpiringSoon(expirationDate, 60)) {
      issues.push({
        type: 'PA_CHILD_ABUSE_EXPIRING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `PA Child Abuse clearance expires in ${daysUntilExpiration(expirationDate)} days`,
        regulation: 'Pennsylvania Child Protective Services Law (Act 151 of 1994)',
        remediation: 'Request renewed clearance before expiration',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate PA Nurse Aide Registry
   */
  private validatePARegistry(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const paData = caregiver.stateSpecificData?.pennsylvania as PennsylvaniaCredentials | undefined;

    // Check if caregiver is CNA
    const isCNA = caregiver.licenses.some(l => l.type === 'CNA' && l.state === 'PA');
    if (!isCNA) return issues;

    if (paData?.paRegistryNumber === undefined || paData.paRegistryNumber === '') {
      issues.push({
        type: 'PA_REGISTRY_NUMBER_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'CNA must be on Pennsylvania Nurse Aide Registry',
        regulation: 'Pennsylvania DHS Nurse Aide Registry Requirements',
        remediation: 'Verify registry status through PA Department of Health',
        canBeOverridden: false,
      });
      return issues;
    }

    if (paData.paRegistryStatus !== 'ACTIVE') {
      issues.push({
        type: 'PA_REGISTRY_INACTIVE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `PA Nurse Aide Registry status is ${paData.paRegistryStatus}, must be ACTIVE`,
        regulation: 'Pennsylvania DHS Nurse Aide Registry Requirements',
        remediation: 'Renew or reactivate registry certification',
        canBeOverridden: false,
      });
    }

    // Check verification date
    if (paData.paRegistryVerificationDate !== undefined) {
      const verificationDate = new Date(paData.paRegistryVerificationDate);
      const daysSinceVerification = daysSince(verificationDate);
      if (daysSinceVerification > 365) {
        issues.push({
          type: 'PA_REGISTRY_VERIFICATION_STALE',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `PA Nurse Aide Registry last verified ${daysSinceVerification} days ago. Annual verification recommended.`,
          regulation: 'Pennsylvania DHS Nurse Aide Registry Requirements',
          remediation: 'Re-verify registry status annually',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate TB Testing
   *
   * PA DHS requires tuberculosis testing for all direct care staff
   */
  private validateTBTesting(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const paData = caregiver.stateSpecificData?.pennsylvania as PennsylvaniaCredentials | undefined;

    if (paData?.tbTestDate === undefined) {
      issues.push({
        type: 'PA_TB_TEST_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No TB test on file. Required for all direct care staff.',
        regulation: 'Pennsylvania Code Title 55 §2600.161',
        remediation: 'Complete tuberculosis skin test or chest X-ray',
        canBeOverridden: false,
      });
      return issues;
    }

    if (paData.tbTestResult === 'POSITIVE') {
      issues.push({
        type: 'PA_TB_TEST_POSITIVE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Positive TB test result. Requires medical clearance before client contact.',
        regulation: 'Pennsylvania Code Title 55 §2600.161',
        remediation: 'Obtain physician clearance and follow-up chest X-ray showing non-active TB',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (paData.tbTestResult === 'PENDING') {
      issues.push({
        type: 'PA_TB_TEST_PENDING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'TB test results pending',
        regulation: 'Pennsylvania Code Title 55 §2600.161',
        remediation: 'Wait for test results before client assignment',
        canBeOverridden: true,
      });
    }

    // Check TB test expiration (annual requirement)
    if (paData.tbTestExpiration !== undefined) {
      const expirationDate = new Date(paData.tbTestExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'PA_TB_TEST_EXPIRED',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `TB test expired on ${expirationDate.toLocaleDateString()}. Annual testing required.`,
          regulation: 'Pennsylvania Code Title 55 §2600.161',
          remediation: 'Complete new tuberculosis test',
          canBeOverridden: false,
        });
      } else if (isExpiringSoon(expirationDate, 30)) {
        issues.push({
          type: 'PA_TB_TEST_EXPIRING',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `TB test expires in ${daysUntilExpiration(expirationDate)} days`,
          regulation: 'Pennsylvania Code Title 55 §2600.161',
          remediation: 'Schedule TB test renewal',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate EVV Training
   *
   * Act 13 of 2019: All staff using EVV systems must complete training
   */
  private validateEVVTraining(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const paData = caregiver.stateSpecificData?.pennsylvania as PennsylvaniaCredentials | undefined;

    if (paData?.evvTrainingCompleted !== true) {
      issues.push({
        type: 'PA_EVV_TRAINING_MISSING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'EVV training not completed',
        regulation: 'Pennsylvania Act 13 of 2019 (EVV Requirements)',
        remediation: 'Complete mandatory EVV system training',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate Plan of Care Review
   */
  private validateClientPlanOfCare(client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const paData = client.stateSpecificData?.pennsylvania as PennsylvaniaClientData | undefined;

    if (paData?.pocNextReviewDue !== undefined) {
      const reviewDueDate = new Date(paData.pocNextReviewDue);

      if (isExpired(reviewDueDate)) {
        const daysPastDue = daysSince(reviewDueDate);
        issues.push({
          type: 'PA_POC_REVIEW_OVERDUE',
          severity: 'BLOCKING',
          category: 'CLIENT_AUTHORIZATION',
          message: `Plan of Care review overdue by ${daysPastDue} days`,
          regulation: 'Pennsylvania Code Title 55 §2600.44',
          remediation: 'Conduct POC review and obtain physician signature immediately',
          canBeOverridden: false,
          metadata: { daysPastDue },
        });
      }
    }

    return issues;
  }

  /**
   * State-specific regulation citations
   */
  protected getBackgroundRegulation(): string {
    return 'Pennsylvania Code Title 55 §52.21, §2600.18';
  }

  protected getLicensureRegulation(): string {
    return 'Pennsylvania Home Care Licensure Act (Act 56 of 2007)';
  }

  protected getRegistryRegulation(type: string): string {
    if (type === 'NURSE_AIDE') {
      return 'Pennsylvania DHS Nurse Aide Registry Requirements';
    }
    if (type === 'ABUSE_NEGLECT') {
      return 'Pennsylvania Child Protective Services Law (Act 151 of 1994)';
    }
    return 'Pennsylvania Code Title 55';
  }

  protected getAuthorizationRegulation(): string {
    return 'Community HealthChoices Contract Requirements, 55 Pa. Code §1101';
  }

  protected getDocumentationRegulation(): string {
    return 'Pennsylvania Code Title 55 §2600.161, DHS Documentation Standards';
  }

  protected getPlanOfCareRegulation(): string {
    return 'Pennsylvania Code Title 55 §2600.44, 42 CFR §484.60';
  }
}
