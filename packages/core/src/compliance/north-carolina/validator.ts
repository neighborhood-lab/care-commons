/**
 * North Carolina Home Healthcare Compliance Validator
 *
 * Implements North Carolina-specific compliance rules per:
 * - North Carolina General Statutes §131E-136 (Home Care Agencies)
 * - 10A NCAC 13F (Home Care Agency Licensure Rules)
 * - North Carolina DHHS Medicaid EVV Requirements
 * - North Carolina Nurse Aide Registry Requirements
 * - CAP Waiver Program Requirements
 *
 * Key North Carolina Characteristics:
 * - FREE Sandata EVV aggregator (major cost advantage)
 * - Moderate licensing requirements
 * - 5-year background check cycle
 * - 6-year data retention
 * - Moderate geofencing: 120m base + 60m tolerance = 180m total
 * - 10-minute grace periods
 * - Strong CAP waiver programs (CAP/DA, CAP/C, Innovations)
 * - DHHS standards enforcement
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
 * North Carolina-specific credential data structure
 */
export interface NorthCarolinaCredentials {
  // Level 2 Background Screening (NC General Statutes §131E-256)
  backgroundScreening?: {
    checkDate: Date;
    expirationDate: Date;
    status: 'CLEAR' | 'PENDING' | 'ISSUES' | 'EXPIRED';
    screeningId?: string;
  };

  // NC Health Care Personnel Registry (Abuse/Neglect)
  hcprCheck?: {
    checkDate: Date;
    status: 'CLEAR' | 'PENDING' | 'LISTED' | 'EXPIRED';
    certificationNumber?: string;
  };

  // NC Nurse Aide Registry (for CNAs)
  ncRegistryNumber?: string;
  ncRegistryStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  ncRegistryVerificationDate?: Date;

  // NA II (Nurse Aide II) Credentials
  naIICertified?: boolean;
  naIICertificationDate?: Date;
  naIICertificationExpiration?: Date;

  // Professional Licensure
  ncLicenseNumber?: string;
  ncLicenseType?: 'RN' | 'LPN' | 'CNA' | 'HHA' | 'NA II';
  ncLicenseExpiration?: Date;

  // CAP Waiver Training (Community Alternatives Program)
  capWaiverTrainingDate?: Date;
  capWaiverTrainingCompleted?: boolean;

  // TB Testing
  tbTestDate?: Date;
  tbTestResult?: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  tbTestExpiration?: Date;
}

/**
 * North Carolina-specific client data structure
 */
export interface NorthCarolinaClientData {
  // CAP Waiver Programs (CAP/DA, CAP/C, Innovations)
  waiverProgram?: 'CAP_DA' | 'CAP_C' | 'INNOVATIONS' | 'NC_MEDICAID';
  waiverEnrollmentDate?: Date;

  // DHHS Authorization
  dhsAuthorizationNumber?: string;
  dhsProviderNumber?: string;

  // Service Authorizations
  ncServiceAuthorizations?: Array<{
    serviceCode: string;
    authorizedUnits: number;
    usedUnits: number;
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    requiresEVV: boolean;
  }>;

  // Plan of Care (10A NCAC 13F .1002)
  pocLastReviewDate?: Date;
  pocNextReviewDue?: Date;
  pocPhysicianSignatureDate?: Date;
}

/**
 * North Carolina Compliance Validator
 */
export class NorthCarolinaComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'NC';

  /**
   * North Carolina credential requirements configuration
   */
  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'LEVEL_2',                  // NC requires Level 2 background screening
      frequency: 'EVERY_5_YEARS',       // 5-year cycle
      expirationDays: 1825,             // 5 years * 365 days
      warningDays: 60,                  // Warn 60 days before expiration
    },
    licensure: {
      required: true,
      roles: ['RN', 'LPN', 'CNA', 'HHA', 'NA II'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'North Carolina Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
      {
        name: 'NC Health Care Personnel Registry',
        type: 'ABUSE_NEGLECT',
        frequency: 'AT_HIRE',
        expirationDays: 365,
      },
    ],
  };

  /**
   * North Carolina authorization requirements
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

    // 1. Level 2 Background Screening
    issues.push(...this.validateStateBackgroundScreening(caregiver));

    // 2. NC Health Care Personnel Registry Check
    issues.push(...this.validateHCPRCheck(caregiver));

    // 3. NC Nurse Aide Registry
    issues.push(...this.validateNCRegistry(caregiver));

    // 4. TB Testing
    issues.push(...this.validateTBTesting(caregiver));

    // 5. CAP Waiver Training
    issues.push(...this.validateCAPWaiverTraining(caregiver, client));

    // 6. Plan of Care Review
    issues.push(...this.validateClientPlanOfCare(client));

    return issues;
  }

  /**
   * Validate Level 2 Background Screening
   *
   * NC General Statutes §131E-256: Background screening required
   */
  private validateStateBackgroundScreening(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ncData = caregiver.stateSpecificData?.northCarolina as NorthCarolinaCredentials | undefined;

    if (ncData?.backgroundScreening === undefined) {
      issues.push({
        type: 'NC_BACKGROUND_SCREENING_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No Level 2 background screening on file',
        regulation: 'North Carolina General Statutes §131E-256, 10A NCAC 13F .0901',
        remediation: 'Complete Level 2 background screening through NC DHHS',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    const screening = ncData.backgroundScreening;

    // Check status
    if (screening.status === 'ISSUES') {
      issues.push({
        type: 'NC_BACKGROUND_ISSUES',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Background screening found disqualifying issues',
        regulation: 'North Carolina General Statutes §131E-256',
        remediation: 'Review disqualifying offenses with DHHS compliance',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (screening.status === 'PENDING') {
      issues.push({
        type: 'NC_BACKGROUND_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Background screening results pending',
        regulation: '10A NCAC 13F .0901',
        remediation: 'Wait for screening results (typically 5-7 business days)',
        canBeOverridden: false,
      });
    }

    // Check expiration (5-year cycle)
    const expirationDate = new Date(screening.expirationDate);
    if (isExpired(expirationDate)) {
      issues.push({
        type: 'NC_BACKGROUND_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Background screening expired on ${expirationDate.toLocaleDateString()}. Re-screening required every 5 years.`,
        regulation: 'North Carolina General Statutes §131E-256',
        remediation: 'Complete new Level 2 background screening',
        canBeOverridden: false,
      });
    } else if (isExpiringSoon(expirationDate, 60)) {
      issues.push({
        type: 'NC_BACKGROUND_EXPIRING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Background screening expires in ${daysUntilExpiration(expirationDate)} days`,
        regulation: 'North Carolina General Statutes §131E-256',
        remediation: 'Schedule background screening renewal',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate NC Health Care Personnel Registry Check
   *
   * NC General Statutes §131E-256: Check against abuse/neglect registry
   */
  private validateHCPRCheck(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ncData = caregiver.stateSpecificData?.northCarolina as NorthCarolinaCredentials | undefined;

    if (ncData?.hcprCheck === undefined) {
      issues.push({
        type: 'NC_HCPR_CHECK_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No NC Health Care Personnel Registry check on file',
        regulation: 'North Carolina General Statutes §131E-256, NC Health Care Personnel Registry',
        remediation: 'Submit HCPR check through NC DHHS',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    const check = ncData.hcprCheck;

    // If listed on registry, PERMANENT disqualification
    if (check.status === 'LISTED') {
      issues.push({
        type: 'NC_HCPR_LISTED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Caregiver is LISTED on NC Health Care Personnel Registry. PERMANENT DISQUALIFICATION.',
        regulation: 'North Carolina General Statutes §131E-256',
        remediation: 'Cannot be employed in home health. This is a permanent disqualification.',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (check.status === 'PENDING') {
      issues.push({
        type: 'NC_HCPR_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'NC HCPR check pending. Cannot assign until cleared.',
        regulation: 'North Carolina General Statutes §131E-256',
        remediation: 'Wait for registry clearance (typically 3-5 business days)',
        canBeOverridden: false,
      });
    }

    return issues;
  }

  /**
   * Validate NC Nurse Aide Registry
   */
  private validateNCRegistry(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ncData = caregiver.stateSpecificData?.northCarolina as NorthCarolinaCredentials | undefined;

    // Check if caregiver is CNA or NA II
    const isCNA = caregiver.licenses.some(l => ['CNA', 'NA II'].includes(l.type) && l.state === 'NC');
    if (!isCNA) return issues;

    if (ncData?.ncRegistryNumber === undefined || ncData.ncRegistryNumber === '') {
      issues.push({
        type: 'NC_REGISTRY_NUMBER_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'CNA must be on North Carolina Nurse Aide Registry',
        regulation: 'North Carolina General Statutes §131E-255, NC Nurse Aide Registry',
        remediation: 'Verify registry status through NC Division of Health Service Regulation',
        canBeOverridden: false,
      });
      return issues;
    }

    if (ncData.ncRegistryStatus !== 'ACTIVE') {
      let severity: 'BLOCKING' | 'WARNING';
      let remediation: string;

      if (ncData.ncRegistryStatus === 'SUSPENDED' || ncData.ncRegistryStatus === 'REVOKED') {
        severity = 'BLOCKING';
        remediation = 'Registry suspended/revoked. Cannot work until reinstated or may be permanently disqualified.';
      } else if (ncData.ncRegistryStatus === 'EXPIRED') {
        severity = 'BLOCKING';
        remediation = 'Registry expired. Renew certification immediately.';
      } else {
        // INACTIVE or other status
        severity = 'WARNING';
        remediation = 'Registry inactive. Verify work history and reactivate if needed.';
      }

      issues.push({
        type: 'NC_REGISTRY_INACTIVE',
        severity,
        category: 'CAREGIVER_CREDENTIALS',
        message: `NC Nurse Aide Registry status is ${ncData.ncRegistryStatus}`,
        regulation: 'North Carolina General Statutes §131E-255',
        remediation,
        canBeOverridden: severity === 'WARNING',
        requiresComplianceReview: ncData.ncRegistryStatus === 'SUSPENDED' || ncData.ncRegistryStatus === 'REVOKED',
      });
    }

    // Check verification date
    if (ncData.ncRegistryVerificationDate !== undefined) {
      const verificationDate = new Date(ncData.ncRegistryVerificationDate);
      const daysSinceVerification = daysSince(verificationDate);
      if (daysSinceVerification > 365) {
        issues.push({
          type: 'NC_REGISTRY_VERIFICATION_STALE',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `NC Nurse Aide Registry last verified ${daysSinceVerification} days ago. Annual verification recommended.`,
          regulation: 'North Carolina General Statutes §131E-255',
          remediation: 'Re-verify registry status annually',
          canBeOverridden: true,
        });
      }
    }

    // Check NA II certification if applicable
    if (ncData.naIICertified === true && ncData.naIICertificationExpiration !== undefined) {
      const expirationDate = new Date(ncData.naIICertificationExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'NC_NAII_CERTIFICATION_EXPIRED',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `NA II certification expired on ${expirationDate.toLocaleDateString()}`,
          regulation: 'North Carolina NA II Requirements',
          remediation: 'Renew NA II certification to continue medication administration',
          canBeOverridden: false,
        });
      }
    }

    return issues;
  }

  /**
   * Validate TB Testing
   *
   * NC DHHS requires tuberculosis testing for all direct care staff
   */
  private validateTBTesting(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ncData = caregiver.stateSpecificData?.northCarolina as NorthCarolinaCredentials | undefined;

    if (ncData?.tbTestDate === undefined) {
      issues.push({
        type: 'NC_TB_TEST_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No TB test on file. Required for all direct care staff.',
        regulation: '10A NCAC 13F .1001, NC DHHS Documentation Standards',
        remediation: 'Complete tuberculosis skin test or chest X-ray',
        canBeOverridden: false,
      });
      return issues;
    }

    if (ncData.tbTestResult === 'POSITIVE') {
      issues.push({
        type: 'NC_TB_TEST_POSITIVE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Positive TB test result. Requires medical clearance before client contact.',
        regulation: '10A NCAC 13F .1001',
        remediation: 'Obtain physician clearance and follow-up chest X-ray showing non-active TB',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (ncData.tbTestResult === 'PENDING') {
      issues.push({
        type: 'NC_TB_TEST_PENDING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'TB test results pending',
        regulation: '10A NCAC 13F .1001',
        remediation: 'Wait for test results before client assignment',
        canBeOverridden: true,
      });
    }

    // Check TB test expiration (annual requirement)
    if (ncData.tbTestExpiration !== undefined) {
      const expirationDate = new Date(ncData.tbTestExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'NC_TB_TEST_EXPIRED',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `TB test expired on ${expirationDate.toLocaleDateString()}. Annual testing required.`,
          regulation: '10A NCAC 13F .1001',
          remediation: 'Complete new tuberculosis test',
          canBeOverridden: false,
        });
      } else if (isExpiringSoon(expirationDate, 30)) {
        issues.push({
          type: 'NC_TB_TEST_EXPIRING',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `TB test expires in ${daysUntilExpiration(expirationDate)} days`,
          regulation: '10A NCAC 13F .1001',
          remediation: 'Schedule TB test renewal',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate CAP Waiver Training
   *
   * NC DHHS requires specific training for CAP waiver programs
   */
  private validateCAPWaiverTraining(caregiver: CaregiverCredentials, client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ncClientData = client.stateSpecificData?.northCarolina as NorthCarolinaClientData | undefined;
    const ncCaregiverData = caregiver.stateSpecificData?.northCarolina as NorthCarolinaCredentials | undefined;

    // Only required if client is on CAP waiver
    const isCAPWaiver = ncClientData?.waiverProgram !== undefined &&
                        ncClientData.waiverProgram !== 'NC_MEDICAID';

    if (!isCAPWaiver) return issues;

    if (ncCaregiverData?.capWaiverTrainingCompleted !== true) {
      issues.push({
        type: 'NC_CAP_TRAINING_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `CAP waiver training required for ${ncClientData.waiverProgram} program`,
        regulation: 'NC DHHS Medicaid Provider Manual, CAP Waiver Program Requirements',
        remediation: 'Complete CAP waiver-specific training through approved provider',
        canBeOverridden: false,
      });
    }

    return issues;
  }

  /**
   * Validate Plan of Care Review
   */
  private validateClientPlanOfCare(client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const ncData = client.stateSpecificData?.northCarolina as NorthCarolinaClientData | undefined;

    if (ncData?.pocNextReviewDue !== undefined) {
      const reviewDueDate = new Date(ncData.pocNextReviewDue);

      if (isExpired(reviewDueDate)) {
        const daysPastDue = daysSince(reviewDueDate);
        issues.push({
          type: 'NC_POC_REVIEW_OVERDUE',
          severity: 'BLOCKING',
          category: 'CLIENT_AUTHORIZATION',
          message: `Plan of Care review overdue by ${daysPastDue} days`,
          regulation: '10A NCAC 13F .1002, 42 CFR §484.60',
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
    return 'North Carolina General Statutes §131E-256, 10A NCAC 13F .0901';
  }

  protected getLicensureRegulation(): string {
    return 'North Carolina General Statutes §90 (Nursing Practice Act), 10A NCAC 13F';
  }

  protected getRegistryRegulation(type: string): string {
    if (type === 'NURSE_AIDE') {
      return 'North Carolina General Statutes §131E-255, NC Nurse Aide Registry';
    }
    if (type === 'ABUSE_NEGLECT') {
      return 'North Carolina General Statutes §131E-256, NC Health Care Personnel Registry';
    }
    return '10A NCAC 13F .0901';
  }

  protected getAuthorizationRegulation(): string {
    return 'NC DHHS Medicaid Provider Manual, CAP Waiver Program Requirements';
  }

  protected getDocumentationRegulation(): string {
    return '10A NCAC 13F .1001, NC DHHS Documentation Standards';
  }

  protected getPlanOfCareRegulation(): string {
    return '10A NCAC 13F .1002, 42 CFR §484.60';
  }
}
