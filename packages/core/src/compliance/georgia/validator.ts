/**
 * Georgia Home Healthcare Compliance Validator
 *
 * Implements Georgia-specific compliance rules per:
 * - Georgia Code §31-7-350 (Home Health Agencies)
 * - Georgia Code §49-4-142 (Medicaid Home and Community-Based Services)
 * - Georgia DCH HCBS Waiver Requirements
 * - Georgia Nurse Aide Registry Requirements
 * - Georgia EVV Requirements
 *
 * Key Georgia Characteristics:
 * - Open/Flex EVV with Tellus aggregator
 * - Easy licensing requirements (most lenient)
 * - 5-year background check cycle
 * - 6-year data retention
 * - Lenient geofencing: 150m base + 100m tolerance = 250m total
 * - 15-minute grace periods
 * - Strong focus on HCBS waivers
 * - Generous rural exceptions
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
 * Georgia-specific credential data structure
 */
export interface GeorgiaCredentials {
  // Level 2 Background Screening (Georgia Code §31-7-350)
  backgroundScreening?: {
    checkDate: Date;
    expirationDate: Date;
    status: 'CLEAR' | 'PENDING' | 'ISSUES' | 'EXPIRED';
    screeningId?: string;
  };

  // Georgia Nurse Aide Registry (for CNAs)
  gaRegistryNumber?: string;
  gaRegistryStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
  gaRegistryVerificationDate?: Date;

  // Professional Licensure
  gaLicenseNumber?: string;
  gaLicenseType?: 'RN' | 'LPN' | 'CNA' | 'HHA' | 'PCA';
  gaLicenseExpiration?: Date;

  // HCBS Waiver Training (required for waiver programs)
  hcbsTrainingDate?: Date;
  hcbsTrainingCompleted?: boolean;

  // First Aid/CPR (recommended but not always required)
  firstAidCertificationDate?: Date;
  firstAidCertificationExpiration?: Date;
  cprCertificationDate?: Date;
  cprCertificationExpiration?: Date;

  // Rural Area Indicator (affects compliance flexibility)
  isRuralArea?: boolean;
}

/**
 * Georgia-specific client data structure
 */
export interface GeorgiaClientData {
  // HCBS Waiver Programs (Georgia's main Medicaid programs)
  waiverProgram?: 'CCSP' | 'SOURCE' | 'NOW_COMP' | 'GEORGIA_MEDICAID';
  waiverEnrollmentDate?: Date;

  // DCH (Department of Community Health) Authorization
  dchAuthorizationNumber?: string;
  dchProviderNumber?: string;

  // Service Authorizations
  gaServiceAuthorizations?: Array<{
    serviceCode: string;
    authorizedUnits: number;
    usedUnits: number;
    authorizationNumber: string;
    effectiveDate: Date;
    expirationDate: Date;
    requiresEVV: boolean;
    allowsOverage: boolean; // GA allows justified overages
  }>;

  // Plan of Care
  pocLastReviewDate?: Date;
  pocNextReviewDue?: Date;

  // Rural Exception Flag (affects geofencing and other requirements)
  qualifiesForRuralException?: boolean;
  countyName?: string;
}

/**
 * Georgia Compliance Validator
 */
export class GeorgiaComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'GA';

  /**
   * Georgia credential requirements configuration
   */
  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'LEVEL_2',                  // GA uses Level 2 background screening
      frequency: 'EVERY_5_YEARS',       // 5-year cycle
      expirationDays: 1825,             // 5 years * 365 days
      warningDays: 60,                  // Warn 60 days before expiration
    },
    licensure: {
      required: true,
      roles: ['RN', 'LPN', 'CNA', 'HHA', 'PCA'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'Georgia Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
    ],
  };

  /**
   * Georgia authorization requirements
   */
  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.85,             // Warn at 85% utilization (more lenient)
    allowOverage: true,                 // GA allows some overage with justification
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

    // 2. GA Nurse Aide Registry
    issues.push(...this.validateGARegistry(caregiver));

    // 3. HCBS Waiver Training
    issues.push(...this.validateHCBSTraining(caregiver, client));

    // 4. First Aid/CPR (lenient - warnings only)
    issues.push(...this.validateFirstAidCPR(caregiver));

    // 5. Plan of Care Review
    issues.push(...this.validateClientPlanOfCare(client));

    return issues;
  }

  /**
   * Validate Level 2 Background Screening
   *
   * Georgia Code §31-7-350: Background screening required for home health staff
   */
  private validateStateBackgroundScreening(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const gaData = caregiver.stateSpecificData?.georgia as GeorgiaCredentials | undefined;

    if (gaData?.backgroundScreening === undefined) {
      issues.push({
        type: 'GA_BACKGROUND_SCREENING_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No Level 2 background screening on file',
        regulation: 'Georgia Code §31-7-350, DCH Background Check Requirements',
        remediation: 'Complete Level 2 background screening through Georgia DCH',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }

    const screening = gaData.backgroundScreening;

    // Check status
    if (screening.status === 'ISSUES') {
      // Georgia is more lenient - issues may not be automatic disqualification
      issues.push({
        type: 'GA_BACKGROUND_ISSUES',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Background screening found issues requiring review',
        regulation: 'Georgia Code §31-7-350',
        remediation: 'Review with DCH compliance team. Georgia may allow case-by-case exceptions.',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
    } else if (screening.status === 'PENDING') {
      issues.push({
        type: 'GA_BACKGROUND_PENDING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Background screening results pending',
        regulation: 'Georgia Code §31-7-350',
        remediation: 'Wait for screening results (typically 5-10 business days)',
        canBeOverridden: false,
      });
    }

    // Check expiration (5-year cycle)
    const expirationDate = new Date(screening.expirationDate);
    if (isExpired(expirationDate)) {
      issues.push({
        type: 'GA_BACKGROUND_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Background screening expired on ${expirationDate.toLocaleDateString()}. Re-screening required every 5 years.`,
        regulation: 'Georgia Code §31-7-350',
        remediation: 'Complete new Level 2 background screening',
        canBeOverridden: false,
      });
    } else if (isExpiringSoon(expirationDate, 60)) {
      issues.push({
        type: 'GA_BACKGROUND_EXPIRING',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Background screening expires in ${daysUntilExpiration(expirationDate)} days`,
        regulation: 'Georgia Code §31-7-350',
        remediation: 'Schedule background screening renewal',
        canBeOverridden: true,
      });
    }

    return issues;
  }

  /**
   * Validate GA Nurse Aide Registry
   */
  private validateGARegistry(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const gaData = caregiver.stateSpecificData?.georgia as GeorgiaCredentials | undefined;

    // Check if caregiver is CNA
    const isCNA = caregiver.licenses.some(l => l.type === 'CNA' && l.state === 'GA');
    if (!isCNA) return issues;

    if (gaData?.gaRegistryNumber === undefined || gaData.gaRegistryNumber === '') {
      issues.push({
        type: 'GA_REGISTRY_NUMBER_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'CNA must be on Georgia Nurse Aide Registry',
        regulation: 'Georgia Nurse Aide Registry, DCH CNA Requirements',
        remediation: 'Verify registry status through Georgia DCH',
        canBeOverridden: false,
      });
      return issues;
    }

    if (gaData.gaRegistryStatus !== 'ACTIVE') {
      // Georgia is lenient - INACTIVE may be acceptable with justification
      const severity = gaData.gaRegistryStatus === 'SUSPENDED' ? 'BLOCKING' : 'WARNING';
      issues.push({
        type: 'GA_REGISTRY_INACTIVE',
        severity,
        category: 'CAREGIVER_CREDENTIALS',
        message: `GA Nurse Aide Registry status is ${gaData.gaRegistryStatus}`,
        regulation: 'Georgia Nurse Aide Registry, DCH CNA Requirements',
        remediation: gaData.gaRegistryStatus === 'SUSPENDED'
          ? 'Registry suspended. Cannot work until reinstated.'
          : 'Renew or reactivate registry certification',
        canBeOverridden: severity === 'WARNING',
      });
    }

    // Check verification date
    if (gaData.gaRegistryVerificationDate !== undefined) {
      const verificationDate = new Date(gaData.gaRegistryVerificationDate);
      const daysSinceVerification = daysSince(verificationDate);
      if (daysSinceVerification > 365) {
        issues.push({
          type: 'GA_REGISTRY_VERIFICATION_STALE',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `GA Nurse Aide Registry last verified ${daysSinceVerification} days ago. Annual verification recommended.`,
          regulation: 'Georgia Nurse Aide Registry, DCH CNA Requirements',
          remediation: 'Re-verify registry status annually',
          canBeOverridden: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate HCBS Waiver Training
   *
   * Georgia DCH requires specific training for HCBS waiver programs
   */
  private validateHCBSTraining(caregiver: CaregiverCredentials, client: ClientDetails): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const gaClientData = client.stateSpecificData?.georgia as GeorgiaClientData | undefined;
    const gaCaregiverData = caregiver.stateSpecificData?.georgia as GeorgiaCredentials | undefined;

    // Only required if client is on HCBS waiver
    const isHCBSWaiver = gaClientData?.waiverProgram !== undefined &&
                         gaClientData.waiverProgram !== 'GEORGIA_MEDICAID';

    if (!isHCBSWaiver) return issues;

    if (gaCaregiverData?.hcbsTrainingCompleted !== true) {
      issues.push({
        type: 'GA_HCBS_TRAINING_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `HCBS waiver training required for ${gaClientData?.waiverProgram} program`,
        regulation: 'Georgia DCH HCBS Waiver Manual',
        remediation: 'Complete HCBS waiver-specific training through approved provider',
        canBeOverridden: false,
      });
    }

    return issues;
  }

  /**
   * Validate First Aid/CPR Certifications
   *
   * Georgia recommends but doesn't strictly require First Aid/CPR for all roles
   */
  private validateFirstAidCPR(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const gaData = caregiver.stateSpecificData?.georgia as GeorgiaCredentials | undefined;

    // First Aid check (WARNING only - not blocking)
    if (gaData?.firstAidCertificationDate !== undefined && gaData.firstAidCertificationExpiration !== undefined) {
      const expirationDate = new Date(gaData.firstAidCertificationExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'GA_FIRST_AID_EXPIRED',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `First Aid certification expired on ${expirationDate.toLocaleDateString()}`,
          regulation: 'Georgia DCH Best Practices (Recommended)',
          remediation: 'Renew First Aid certification (recommended but not required)',
          canBeOverridden: true,
        });
      }
    }

    // CPR check (WARNING only - not blocking)
    if (gaData?.cprCertificationDate !== undefined && gaData.cprCertificationExpiration !== undefined) {
      const expirationDate = new Date(gaData.cprCertificationExpiration);
      if (isExpired(expirationDate)) {
        issues.push({
          type: 'GA_CPR_EXPIRED',
          severity: 'WARNING',
          category: 'CAREGIVER_CREDENTIALS',
          message: `CPR certification expired on ${expirationDate.toLocaleDateString()}`,
          regulation: 'Georgia DCH Best Practices (Recommended)',
          remediation: 'Renew CPR certification (recommended but not required)',
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
    const gaData = client.stateSpecificData?.georgia as GeorgiaClientData | undefined;

    if (gaData?.pocNextReviewDue !== undefined) {
      const reviewDueDate = new Date(gaData.pocNextReviewDue);

      if (isExpired(reviewDueDate)) {
        const daysPastDue = daysSince(reviewDueDate);

        // Georgia is lenient - only BLOCKING if significantly overdue
        const severity = daysPastDue > 30 ? 'BLOCKING' : 'WARNING';

        issues.push({
          type: 'GA_POC_REVIEW_OVERDUE',
          severity,
          category: 'CLIENT_AUTHORIZATION',
          message: `Plan of Care review overdue by ${daysPastDue} days`,
          regulation: 'Georgia DCH HCBS Waiver Requirements',
          remediation: severity === 'BLOCKING'
            ? 'Conduct POC review immediately - significantly overdue'
            : 'Schedule POC review soon',
          canBeOverridden: severity === 'WARNING',
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
    return 'Georgia Code §31-7-350, DCH Background Check Requirements';
  }

  protected getLicensureRegulation(): string {
    return 'Georgia Code §43-26 (Nursing), DCH Home Health Licensure Standards';
  }

  protected getRegistryRegulation(type: string): string {
    if (type === 'NURSE_AIDE') {
      return 'Georgia Nurse Aide Registry, DCH CNA Requirements';
    }
    return 'Georgia Code §49-4-142';
  }

  protected getAuthorizationRegulation(): string {
    return 'Georgia DCH HCBS Waiver Manual, Georgia Code §49-4-142';
  }

  protected getDocumentationRegulation(): string {
    return 'Georgia DCH Provider Manual, HCBS Waiver Documentation Standards';
  }

  protected getPlanOfCareRegulation(): string {
    return 'Georgia DCH HCBS Waiver Requirements, 42 CFR §484.60';
  }
}
