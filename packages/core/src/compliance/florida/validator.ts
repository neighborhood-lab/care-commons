/**
 * Florida Home Healthcare Compliance Validator
 *
 * Implements Florida-specific compliance rules per:
 * - Florida Statutes Chapter 400 (Home Health Agencies)
 * - Florida Statutes Chapter 409 (Medicaid)
 * - Florida Statutes Chapter 435 (Background Screening)
 * - Florida Administrative Code 59A-8 (Home Health Regulations)
 *
 * Key Florida Characteristics:
 * - LENIENT enforcement (most flexible state)
 * - Multi-aggregator support (HHAeXchange, Tellus, others)
 * - Level 2 background screening (5-year cycle)
 * - RN supervision every 60 days
 * - Lenient geofencing: 150m base + 100m tolerance = 250m total
 * - 15-minute grace periods (most lenient)
 * - Telephony fallback allowed
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

export interface FloridaCredentials {
  // Level 2 Background Screening (Chapter 435)
  level2ScreeningDate?: Date;
  level2ScreeningExpiration?: Date;
  level2ScreeningStatus?: 'CLEARED' | 'PENDING' | 'DISQUALIFIED';
  level2ScreeningId?: string; // AHCA screening ID

  // Professional Licensure (CNA/HHA)
  flLicenseNumber?: string;
  flLicenseType?: 'RN' | 'LPN' | 'CNA' | 'HHA';
  flLicenseExpiration?: Date;

  // RN Supervision Assignment
  rnSupervisorId?: string;
  lastSupervisionDate?: Date;

  // Training Requirements (59A-8.0095)
  hivAidsTrainingDate?: Date;
  hivAidsTrainingCompleted?: boolean;

  // Medicaid Provider ID
  medicaidProviderId?: string;
}

export interface FloridaClientData {
  // MCO Information (SMMC - Statewide Medicaid Managed Care)
  mcoName?: string;
  mcoProgram?: 'LTC' | 'MMA';  // Long-Term Care or Managed Medical Assistance

  // Plan of Care (Florida Statute 400.487)
  pocPhysicianSignatureDate?: Date;
  pocNextReviewDue?: Date;
  pocReviewFrequency?: 60 | 90; // Days

  // RN Supervisory Visits (59A-8.0095)
  lastRNSupervisoryVisit?: Date;
  nextRNSupervisoryDue?: Date;

  // Service Authorizations
  authorizedServices?: Array<{
    serviceCode: string;
    authorizedUnits: number;
    usedUnits: number;
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    requiresEVV: boolean;
    requiresRNSupervision: boolean;
  }>;

  // EVV Aggregator Selection (multi-aggregator model)
  preferredAggregator?: 'HHAEEXCHANGE' | 'TELLUS' | 'ICONNECT' | 'OTHER';
}

export class FloridaComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'FL';

  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'LEVEL_2',
      frequency: 'EVERY_5_YEARS',       // Same as Ohio
      expirationDays: 1825,             // 5 years
      warningDays: 60,
    },
    licensure: {
      required: true,
      roles: ['RN', 'LPN', 'CNA', 'HHA'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [], // Florida doesn't have abuse registry like TX EMR
  };

  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.9,
    allowOverage: false, // Still cannot exceed authorized units
  };

  protected override async validateStateSpecificCredentials(
    caregiver: CaregiverCredentials,
    _visit: VisitDetails,
    client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // 1. Level 2 Background Screening (Chapter 435)
    issues.push(...this.validateLevel2Screening(caregiver));

    // 2. Professional Licensure (CNA/HHA registry)
    issues.push(...this.validateFLLicensure(caregiver));

    // 3. HIV/AIDS Training (59A-8.0095)
    issues.push(...this.validateHIVAIDSTraining(caregiver));

    // 4. RN Supervision Assignment
    issues.push(...this.validateRNSupervisionAssignment(caregiver, client));

    // 5. Plan of Care Currency
    issues.push(...this.validateFloridaClientCompliance(client));

    return issues;
  }

  private validateLevel2Screening(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const flData = caregiver.stateSpecificData?.florida as FloridaCredentials | undefined;

    if (flData?.level2ScreeningDate === undefined) {
      issues.push({
        type: 'FL_LEVEL2_SCREENING_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No Level 2 background screening on file',
        regulation: 'Florida Statutes Chapter 435, Florida Administrative Code 59A-8',
        remediation: 'Submit Level 2 background screening application through AHCA',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    // Check status
    if (flData.level2ScreeningStatus === 'DISQUALIFIED') {
      issues.push({
        type: 'FL_LEVEL2_DISQUALIFIED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Caregiver has disqualifying offense on Level 2 screening. Cannot be employed.',
        regulation: 'Florida Statutes §435.04',
        remediation: 'Review disqualifying offenses. May require exemption application or permanent disqualification.',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (flData.level2ScreeningStatus === 'PENDING') {
      issues.push({
        type: 'FL_LEVEL2_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Level 2 screening results pending. Cannot assign until cleared.',
        regulation: 'Florida Administrative Code 59A-8',
        remediation: 'Wait for AHCA screening results (typically 5-7 business days)',
        canBeOverridden: false,
      });
    }

    // Check expiration (5-year cycle)
    if (flData.level2ScreeningExpiration !== undefined) {
      const expirationDate = new Date(flData.level2ScreeningExpiration);

      if (isExpired(expirationDate)) {
        issues.push({
          type: 'FL_LEVEL2_EXPIRED',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `Level 2 screening expired on ${expirationDate.toLocaleDateString()}. Re-screening required.`,
          regulation: 'Florida Statutes §435.04',
          remediation: 'Submit new Level 2 background screening application',
          canBeOverridden: false,
        });
      } else if (isExpiringSoon(expirationDate, 60)) {
        issues.push({
          type: 'FL_LEVEL2_EXPIRING',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `Level 2 screening expires in ${daysUntilExpiration(expirationDate)} days`,
          regulation: 'Florida Statutes §435.04',
          remediation: 'Schedule re-screening appointment before expiration',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  private validateFLLicensure(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Check if caregiver has Florida license
    const flLicense = caregiver.licenses.find(l => l.state === 'FL');

    if (flLicense === undefined) {
      issues.push({
        type: 'FL_LICENSE_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No active Florida professional license on file',
        regulation: 'Florida Administrative Code 59A-8.0095',
        remediation: 'Verify license through Florida Board of Nursing or CNA Registry',
        canBeOverridden: false,
      });
    } else {
      // Check license status
      if (flLicense.status !== 'ACTIVE') {
        issues.push({
          type: 'FL_LICENSE_INACTIVE',
          severity: 'BLOCKING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `Florida license status is ${flLicense.status}, must be ACTIVE`,
          regulation: 'Florida Administrative Code 59A-8.0095',
          remediation: 'Renew or reactivate professional license',
          canBeOverridden: false,
        });
      }

      // Check expiration
      const expirationDate = new Date(flLicense.expirationDate); {

        if (isExpired(expirationDate)) {
          issues.push({
            type: 'FL_LICENSE_EXPIRED',
            severity: 'BLOCKING',
            category: 'CAREGIVER_CREDENTIALS',
            message: `Florida license expired on ${expirationDate.toLocaleDateString()}`,
            regulation: 'Florida Administrative Code 59A-8.0095',
            remediation: 'Renew professional license immediately',
            canBeOverridden: false,
          });
        } else if (isExpiringSoon(expirationDate, 60)) {
          issues.push({
            type: 'FL_LICENSE_EXPIRING',
            severity: 'WARNING',
            category: 'CAREGIVER_CREDENTIALS',
            message: `Florida license expires in ${daysUntilExpiration(expirationDate)} days`,
            regulation: 'Florida Administrative Code 59A-8.0095',
            remediation: 'Submit license renewal application',
            canBeOverridden: true,
          });
        }
      }
    }

    return issues;
  }

  private validateHIVAIDSTraining(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const flData = caregiver.stateSpecificData?.florida as FloridaCredentials | undefined;

    // HIV/AIDS training required per 59A-8.0095
    if (flData?.hivAidsTrainingCompleted !== true) {
      issues.push({
        type: 'FL_HIV_AIDS_TRAINING_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'HIV/AIDS training not completed',
        regulation: 'Florida Administrative Code 59A-8.0095',
        remediation: 'Complete mandatory HIV/AIDS education course',
        canBeOverridden: false,
      });
    }

    return issues;
  }

  private validateRNSupervisionAssignment(caregiver: CaregiverCredentials, client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const flClientData = client.stateSpecificData?.florida as FloridaClientData | undefined;

    // Check if service requires RN supervision
    const requiresSupervision = flClientData?.authorizedServices?.some(s => s.requiresRNSupervision) ?? false;

    if (requiresSupervision === true && caregiver.stateSpecificData?.florida === undefined) {
      issues.push({
        type: 'FL_RN_SUPERVISOR_NOT_ASSIGNED',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Service requires RN supervision but no RN supervisor assigned',
        regulation: 'Florida Administrative Code 59A-8.0095',
        remediation: 'Assign RN supervisor for oversight of skilled services',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  private validateFloridaClientCompliance(client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const flData = client.stateSpecificData?.florida as FloridaClientData | undefined;

    // Check POC review currency (Florida Statute 400.487)
    if (flData?.pocNextReviewDue !== undefined) {
      const reviewDueDate = new Date(flData.pocNextReviewDue);

      if (isExpired(reviewDueDate)) {
        const daysPastDue = daysSince(reviewDueDate);
        issues.push({
          type: 'FL_POC_REVIEW_OVERDUE',
          severity: 'BLOCKING',
          category: 'CLIENT_AUTHORIZATION',
          message: `Plan of Care review overdue by ${daysPastDue} days. Florida requires review every ${flData.pocReviewFrequency ?? 60} days.`,
          regulation: 'Florida Statute 400.487',
          remediation: 'RN must conduct POC review and obtain physician signature',
          canBeOverridden: false,
          metadata: { daysPastDue, reviewFrequency: flData.pocReviewFrequency },
        });
      }
    }

    // Check RN supervisory visit (59A-8.0095)
    if (flData?.lastRNSupervisoryVisit !== undefined) {
      const lastVisit = new Date(flData.lastRNSupervisoryVisit);
      const daysSinceVisit = daysSince(lastVisit);

      // Florida requires 60-day RN supervisory visits
      if (daysSinceVisit > 60) {
        issues.push({
          type: 'FL_RN_SUPERVISION_OVERDUE',
          severity: 'BLOCKING',
          category: 'CLIENT_AUTHORIZATION',
          message: `RN supervisory visit overdue by ${daysSinceVisit - 60} days. Florida requires visits every 60 days.`,
          regulation: 'Florida Administrative Code 59A-8.0095',
          remediation: 'RN must conduct on-site supervisory visit immediately',
          canBeOverridden: false,
          metadata: { daysSinceVisit },
        });
      }
    }

    return issues;
  }

  protected getBackgroundRegulation(): string {
    return 'Florida Statutes Chapter 435, Florida Administrative Code 59A-8';
  }

  protected getLicensureRegulation(): string {
    return 'Florida Administrative Code 59A-8.0095';
  }

  protected getRegistryRegulation(_type: string): string {
    return 'Florida Statutes Chapter 435';
  }

  protected getAuthorizationRegulation(): string {
    return 'Florida Statutes Chapter 409, Florida Administrative Code 59A-8';
  }

  protected getDocumentationRegulation(): string {
    return 'Florida Administrative Code 59A-8';
  }

  protected getPlanOfCareRegulation(): string {
    return 'Florida Statute 400.487';
  }
}
