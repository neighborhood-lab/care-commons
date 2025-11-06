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
} from '../types/index.js';

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
    _caregiver: CaregiverCredentials,
    _visit: VisitDetails,
    _client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Georgia-specific validations can be added here
    // Georgia is generally more lenient, especially for rural areas

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
