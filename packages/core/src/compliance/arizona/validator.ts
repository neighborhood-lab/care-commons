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
} from '../types/index.js';

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
    _caregiver: CaregiverCredentials,
    _visit: VisitDetails,
    _client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Arizona-specific validations can be added here
    // AZ is generally more flexible for non-medical home care

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
