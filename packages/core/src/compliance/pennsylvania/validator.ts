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

import { BaseComplianceValidator, StateCredentialConfig, StateAuthorizationConfig } from '../base-validator.js';
import { StateCode } from '../../types/base.js';
import {
  ComplianceIssue,
  CaregiverCredentials,
  VisitDetails,
  ClientDetails,
} from '../types/index.js';

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
    _caregiver: CaregiverCredentials,
    _visit: VisitDetails,
    _client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Pennsylvania-specific validations can be added here
    // For now, base validator covers most requirements

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
