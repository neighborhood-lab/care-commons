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
} from '../types/index.js';

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
    _caregiver: CaregiverCredentials,
    _visit: VisitDetails,
    _client: ClientDetails
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // North Carolina-specific validations can be added here
    // NC has balanced approach between strict and lenient

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
