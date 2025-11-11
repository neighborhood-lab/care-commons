/**
 * Generic State Compliance Validator
 *
 * Provides baseline compliance validation for states without custom implementations.
 * Uses federal standards (21st Century Cures Act, HIPAA) and common state requirements.
 *
 * This validator can be used for any state and provides:
 * - EVV compliance (6 required elements from Cures Act)
 * - Background check validation
 * - Basic training requirements
 * - Plan of care tracking
 * - Standard authorization checks
 *
 * State-specific validators should extend or replace this as needed.
 */

import {
  BaseComplianceValidator,
  StateCredentialConfig,
  StateAuthorizationConfig,
} from '../base-validator.js';
import { StateCode } from '../../types/base.js';

export class GenericStateComplianceValidator extends BaseComplianceValidator {
  public readonly state: StateCode;

  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'LEVEL_2', // Federal baseline
      frequency: 'EVERY_5_YEARS', // Common standard
      expirationDays: 1825, // 5 years
      warningDays: 30,
    },
    licensure: {
      required: false, // State-specific
      roles: [],
      verificationFrequency: 'AT_HIRE',
    },
    registryChecks: [
      {
        name: 'Abuse & Neglect Registry',
        type: 'ABUSE_NEGLECT',
        frequency: 'AT_HIRE',
        expirationDays: 1095, // 3 years
      },
    ],
  };

  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.9, // 90% utilized
    allowOverage: false,
  };

  constructor(stateCode: StateCode) {
    super();
    this.state = stateCode;
  }

  // Regulatory references (generic/federal)
  protected getBackgroundRegulation(): string {
    return 'Federal baseline - 42 CFR §483.30(a)(1)';
  }

  protected getLicensureRegulation(): string {
    return `${this.state} state licensure requirements`;
  }

  protected getRegistryRegulation(type: string): string {
    return `${this.state} ${type} registry check requirements`;
  }

  protected getAuthorizationRegulation(): string {
    return '42 CFR §440.230 (Medicaid service authorization)';
  }

  protected getDocumentationRegulation(): string {
    return '42 CFR §409.43 (Medicare documentation requirements)';
  }

  protected getPlanOfCareRegulation(): string {
    return '42 CFR §409.43(c) (Plan of care requirements)';
  }
}

/**
 * Factory function to create generic validator for any state
 */
export async function createGenericValidator(
  stateCode: StateCode
): Promise<GenericStateComplianceValidator> {
  return new GenericStateComplianceValidator(stateCode);
}
