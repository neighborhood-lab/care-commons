/**
 * Arizona Home Healthcare Compliance Validator
 *
 * Implements Arizona-specific compliance rules per:
 * - Arizona Revised Statutes §36-401 (Home Health Agencies)
 * - Arizona Administrative Code R9-10-201 (Home Health Licensing)
 * - AHCCCS (Arizona Health Care Cost Containment System) EVV Requirements
 * - Arizona DES Background Check Requirements
 * - Arizona ALTCS (Arizona Long Term Care System) Standards
 *
 * Key Arizona Characteristics:
 * - FREE Sandata EVV aggregator (major cost advantage)
 * - NO LICENSE REQUIRED for non-medical home care (easiest market entry)
 * - 5-year background check cycle
 * - 6-year data retention
 * - Conservative geofencing: 100m base + 50m tolerance = 150m total
 * - 10-minute grace periods
 * - Non-medical services exempt from NPI requirement
 * - High independent agency percentage (~88%)
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
 * Arizona-specific credential data structure
 */
export interface ArizonaCredentials {
  // DPS Fingerprint Background Check (AZ Revised Statutes §36-425.03)
  dpsBackgroundCheck?: {
    checkDate: Date;
    expirationDate: Date;
    status: 'CLEAR' | 'PENDING' | 'ISSUES' | 'EXPIRED';
    clearanceCardNumber?: string; // Level 1 Fingerprint Clearance Card number
  };

  // Arizona Nurse Aide Registry (for CNAs providing medical care)
  azRegistryNumber?: string;
  azRegistryStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
  azRegistryVerificationDate?: Date;

  // Professional Licensure (only required for medical services)
  azLicenseNumber?: string;
  azLicenseType?: 'RN' | 'LPN' | 'CNA' | 'Caregiver';
  azLicenseExpiration?: Date;

  // Service Type Indicator
  providesNonMedicalCareOnly?: boolean; // If true, license not required

  // ALTCS Training (Arizona Long Term Care System)
  altcsTrainingDate?: Date;
  altcsTrainingCompleted?: boolean;

  // TB Testing (recommended but not universally required)
  tbTestDate?: Date;
  tbTestResult?: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  tbTestExpiration?: Date;

  // First Aid/CPR (recommended)
  firstAidCertificationDate?: Date;
  firstAidCertificationExpiration?: Date;
  cprCertificationDate?: Date;
  cprCertificationExpiration?: Date;
}

/**
 * Arizona-specific client data structure
 */
export interface ArizonaClientData {
  // AHCCCS Programs (Arizona Health Care Cost Containment System)
  ahcccsProgram?: 'ALTCS' | 'DDD_WAIVER' | 'EPD' | 'SMI' | 'STANDARD_MEDICAID';
  ahcccsEnrollmentDate?: Date;

  // AHCCCS Authorization
  ahcccsAuthorizationNumber?: string;
  ahcccsProviderNumber?: string;

  // Service Type
  requiresMedicalServices?: boolean; // If false, non-medical caregiver OK
  requiresNPI?: boolean; // Non-medical services exempt

  // Service Authorizations
  azServiceAuthorizations?: Array<{
    serviceCode: string;
    authorizedUnits: number;
    usedUnits: number;
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    requiresEVV: boolean;
    isMedicalService: boolean;
  }>;

  // Plan of Care
  pocLastReviewDate?: Date;
  pocNextReviewDue?: Date;
}

/**
 * Arizona Compliance Validator
 */
export class ArizonaComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'AZ';

  /**
   * Arizona credential requirements configuration
   */
  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'FINGERPRINT',              // AZ requires DPS fingerprint checks
      frequency: 'EVERY_5_YEARS',       // 5-year cycle
      expirationDays: 1825,             // 5 years * 365 days
      warningDays: 60,                  // Warn 60 days before expiration
    },
    licensure: {
      required: false,                  // AZ does not require license for non-medical care
      roles: ['RN', 'LPN', 'CNA', 'Caregiver'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'Arizona Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
    ],
  };

  /**
   * Arizona authorization requirements
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

    // 1. DPS Background Check (Level 1 Fingerprint Clearance Card)
    issues.push(...this.validateDPSBackgroundCheck(caregiver));

    // 2. Licensure (only if providing medical services)
    issues.push(...this.validateLicensureForServiceType(caregiver, client));

    // 3. AZ Nurse Aide Registry (if applicable)
    issues.push(...this.validateAZRegistry(caregiver, client));

    // 4. ALTCS Training
    issues.push(...this.validateALTCSTraining(caregiver, client));

    // 5. TB Testing (lenient - warnings only)
    issues.push(...this.validateTBTesting(caregiver));

    // 6. First Aid/CPR (recommendations only)
    issues.push(...this.validateFirstAidCPR(caregiver));

    // 7. Plan of Care Review
    issues.push(...this.validateClientPlanOfCare(client));

    return issues;
  }

  /**
   * Validate DPS Fingerprint Background Check (Level 1 Fingerprint Clearance Card)
   *
   * Arizona Revised Statutes §36-425.03: All caregivers must have Level 1
   * Fingerprint Clearance Card issued by Arizona DPS
   */
  private validateDPSBackgroundCheck(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const azData = caregiver.stateSpecificData?.arizona as ArizonaCredentials | undefined;

    if (azData?.dpsBackgroundCheck === undefined) {
      issues.push({
        type: 'AZ_DPS_CHECK_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No DPS Level 1 Fingerprint Clearance Card on file',
        regulation: 'Arizona Revised Statutes §36-425.03, AZ DES Background Check Requirements',
        remediation: 'Apply for Level 1 Fingerprint Clearance Card through Arizona DPS',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    const check = azData.dpsBackgroundCheck;

    // Check status
    if (check.status === 'ISSUES') {
      issues.push({
        type: 'AZ_DPS_CHECK_ISSUES',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'DPS background check found disqualifying issues',
        regulation: 'Arizona Revised Statutes §36-425.03',
        remediation: 'Review disqualifying offenses. May require suspension or denial of clearance card.',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (check.status === 'PENDING') {
      issues.push({
        type: 'AZ_DPS_CHECK_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'DPS Fingerprint Clearance Card application pending',
        regulation: 'Arizona Revised Statutes §36-425.03',
        remediation: 'Wait for DPS clearance card (typically 7-14 business days)',
        canBeOverridden: false,
      });
    }

    // Check expiration (5-year cycle, but cards must be renewed)
    const expirationDate = new Date(check.expirationDate);
    if (isExpired(expirationDate)) {
      issues.push({
        type: 'AZ_DPS_CHECK_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `DPS Fingerprint Clearance Card expired on ${expirationDate.toLocaleDateString()}. Card must be renewed.`,
        regulation: 'Arizona Revised Statutes §36-425.03',
        remediation: 'Renew Level 1 Fingerprint Clearance Card through Arizona DPS',
        canBeOverridden: false,
      });
    } else if (isExpiringSoon(expirationDate, 60)) {
      issues.push({
        type: 'AZ_DPS_CHECK_EXPIRING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `DPS Fingerprint Clearance Card expires in ${daysUntilExpiration(expirationDate)} days`,
        regulation: 'Arizona Revised Statutes §36-425.03',
        remediation: 'Begin renewal process for Fingerprint Clearance Card',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate Licensure (only required for medical services)
   *
   * Arizona's key advantage: NO LICENSE REQUIRED for non-medical home care
   */
  private validateLicensureForServiceType(caregiver: CaregiverCredentials, client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const azCaregiverData = caregiver.stateSpecificData?.arizona as ArizonaCredentials | undefined;
    const azClientData = client.stateSpecificData?.arizona as ArizonaClientData | undefined;

    // Check if services are medical or non-medical
    const requiresMedicalServices = azClientData?.requiresMedicalServices ?? false;
    const providesNonMedicalOnly = azCaregiverData?.providesNonMedicalCareOnly ?? false;

    // If client requires medical services but caregiver only provides non-medical, issue warning
    if (requiresMedicalServices && providesNonMedicalOnly) {
      issues.push({
        type: 'AZ_SERVICE_TYPE_MISMATCH',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Client requires medical services but caregiver is only certified for non-medical care',
        regulation: 'Arizona Revised Statutes §36-401, Arizona Administrative Code R9-10-201',
        remediation: 'Assign a licensed medical professional (RN/LPN) or update service authorization to non-medical only',
        canBeOverridden: false,
      });
    }

    // If medical services required, validate license
    if (requiresMedicalServices && !providesNonMedicalOnly) {
      const azLicense = caregiver.licenses.find(l => l.state === 'AZ' && ['RN', 'LPN', 'CNA'].includes(l.type));

      if (azLicense === undefined) {
        issues.push({
          type: 'AZ_MEDICAL_LICENSE_MISSING',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: 'Medical services require professional license (RN/LPN/CNA)',
          regulation: 'Arizona Revised Statutes §36-401',
          remediation: 'Verify professional license for medical service provision',
          canBeOverridden: false,
        });
      } else {
        // Check license expiration
        const expirationDate = new Date(azLicense.expirationDate);
        if (isExpired(expirationDate)) {
          issues.push({
            type: 'AZ_LICENSE_EXPIRED',
            severity: 'BLOCKING',
            category: 'CAREGIVER_CREDENTIALS',
            message: `Arizona ${azLicense.type} license expired on ${expirationDate.toLocaleDateString()}`,
            regulation: 'Arizona Revised Statutes §36-401',
            remediation: 'Renew professional license immediately',
            canBeOverridden: false,
          });
        } else if (isExpiringSoon(expirationDate, 60)) {
          issues.push({
            type: 'AZ_LICENSE_EXPIRING',
            severity: 'WARNING',
            category: 'CAREGIVER_CREDENTIALS',
            message: `Arizona ${azLicense.type} license expires in ${daysUntilExpiration(expirationDate)} days`,
            regulation: 'Arizona Revised Statutes §36-401',
            remediation: 'Schedule license renewal',
            canBeOverridden: true,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate AZ Nurse Aide Registry (only if providing CNA services)
   */
  private validateAZRegistry(caregiver: CaregiverCredentials, client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const azData = caregiver.stateSpecificData?.arizona as ArizonaCredentials | undefined;
    const azClientData = client.stateSpecificData?.arizona as ArizonaClientData | undefined;

    // Only required if providing CNA-level medical services
    const isCNA = caregiver.licenses.some(l => l.type === 'CNA' && l.state === 'AZ');
    const requiresMedicalServices = azClientData?.requiresMedicalServices ?? false;

    if (!isCNA || !requiresMedicalServices) return issues;

    if (azData?.azRegistryNumber === undefined || azData.azRegistryNumber === '') {
      issues.push({
        type: 'AZ_REGISTRY_NUMBER_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'CNA providing medical services must be on Arizona Nurse Aide Registry',
        regulation: 'Arizona Nurse Aide Registry, AHCCCS Requirements',
        remediation: 'Verify registry status through Arizona Department of Health Services',
        canBeOverridden: false,
      });
      return issues;
    }

    if (azData.azRegistryStatus !== 'ACTIVE') {
      const severity = azData.azRegistryStatus === 'SUSPENDED' ? 'BLOCKING' : 'WARNING';
      issues.push({
        type: 'AZ_REGISTRY_INACTIVE',
        severity,
        category: 'CAREGIVER_CREDENTIALS',
        message: `AZ Nurse Aide Registry status is ${azData.azRegistryStatus}`,
        regulation: 'Arizona Nurse Aide Registry',
        remediation: azData.azRegistryStatus === 'SUSPENDED'
          ? 'Registry suspended. Cannot provide CNA services until reinstated.'
          : 'Renew or reactivate registry certification',
        canBeOverridden: severity === 'WARNING',
      });
    }

    return issues;
  }

  /**
   * Validate ALTCS Training
   *
   * Arizona Long Term Care System requires specific training
   */
  private validateALTCSTraining(caregiver: CaregiverCredentials, client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const azClientData = client.stateSpecificData?.arizona as ArizonaClientData | undefined;
    const azCaregiverData = caregiver.stateSpecificData?.arizona as ArizonaCredentials | undefined;

    // Only required if client is on ALTCS program
    const isALTCS = azClientData?.ahcccsProgram === 'ALTCS' || azClientData?.ahcccsProgram === 'DDD_WAIVER';

    if (!isALTCS) return issues;

    if (azCaregiverData?.altcsTrainingCompleted !== true) {
      issues.push({
        type: 'AZ_ALTCS_TRAINING_MISSING',
        severity: 'WARNING', // Arizona is lenient - warning only
        category: 'CAREGIVER_CREDENTIALS',
        message: `ALTCS training recommended for ${azClientData?.ahcccsProgram} program`,
        regulation: 'AHCCCS Provider Manual, ALTCS Program Requirements',
        remediation: 'Complete ALTCS-specific training through approved provider',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate TB Testing (lenient - not universally required in AZ)
   */
  private validateTBTesting(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const azData = caregiver.stateSpecificData?.arizona as ArizonaCredentials | undefined;

    // TB testing recommended but not universally required in Arizona
    if (azData?.tbTestDate !== undefined && azData.tbTestResult === 'POSITIVE') {
      issues.push({
        type: 'AZ_TB_TEST_POSITIVE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Positive TB test result. Requires medical clearance before client contact.',
        regulation: 'Arizona Administrative Code R9-10-209 (Recommended)',
        remediation: 'Obtain physician clearance and follow-up chest X-ray showing non-active TB',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    }

    // Check TB test expiration if present (WARNING only)
    if (azData?.tbTestExpiration !== undefined) {
      const expirationDate = new Date(azData.tbTestExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'AZ_TB_TEST_EXPIRED',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `TB test expired on ${expirationDate.toLocaleDateString()}`,
          regulation: 'Arizona Administrative Code R9-10-209 (Recommended)',
          remediation: 'Consider completing new tuberculosis test (recommended)',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate First Aid/CPR Certifications (recommendations only)
   */
  private validateFirstAidCPR(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const azData = caregiver.stateSpecificData?.arizona as ArizonaCredentials | undefined;

    // First Aid/CPR recommended but not required
    if (azData?.firstAidCertificationExpiration !== undefined) {
      const expirationDate = new Date(azData.firstAidCertificationExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'AZ_FIRST_AID_EXPIRED',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `First Aid certification expired on ${expirationDate.toLocaleDateString()}`,
          regulation: 'Best Practices (Recommended)',
          remediation: 'Consider renewing First Aid certification',
          canBeOverridden: true,
        });
      }
    }

    if (azData?.cprCertificationExpiration !== undefined) {
      const expirationDate = new Date(azData.cprCertificationExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'AZ_CPR_EXPIRED',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `CPR certification expired on ${expirationDate.toLocaleDateString()}`,
          regulation: 'Best Practices (Recommended)',
          remediation: 'Consider renewing CPR certification',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate Plan of Care Review
   */
  private validateClientPlanOfCare(client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const azData = client.stateSpecificData?.arizona as ArizonaClientData | undefined;

    if (azData?.pocNextReviewDue !== undefined) {
      const reviewDueDate = new Date(azData.pocNextReviewDue);

      if (isExpired(reviewDueDate)) {
        const daysPastDue = daysSince(reviewDueDate);
        issues.push({
          type: 'AZ_POC_REVIEW_OVERDUE',
          severity: 'BLOCKING',
          category: 'CLIENT_AUTHORIZATION',
          message: `Plan of Care review overdue by ${daysPastDue} days`,
          regulation: 'Arizona Administrative Code R9-10-207, 42 CFR §484.60',
          remediation: 'Conduct POC review immediately',
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
    return 'Arizona Revised Statutes §36-425.03, AZ DES Background Check Requirements';
  }

  protected getLicensureRegulation(): string {
    return 'Arizona Revised Statutes §36-401, Arizona Administrative Code R9-10-201';
  }

  protected getRegistryRegulation(type: string): string {
    if (type === 'NURSE_AIDE') {
      return 'Arizona Nurse Aide Registry, AHCCCS Requirements';
    }
    return 'Arizona Administrative Code R9-10-201';
  }

  protected getAuthorizationRegulation(): string {
    return 'AHCCCS Provider Manual, ALTCS Program Requirements';
  }

  protected getDocumentationRegulation(): string {
    return 'Arizona Administrative Code R9-10-209, AHCCCS Documentation Standards';
  }

  protected getPlanOfCareRegulation(): string {
    return 'Arizona Administrative Code R9-10-207, 42 CFR §484.60';
  }
}
