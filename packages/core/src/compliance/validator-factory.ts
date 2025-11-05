/**
 * Validator Factory
 *
 * Creates appropriate validator instance based on state code.
 * Centralizes validator instantiation logic with caching.
 */

import { StateCode } from '../types/base.js';
import { getValidator, isStateSupported, getSupportedStates } from './state-registry.js';
import type { StateComplianceValidator } from './types/index.js';

export class ValidatorFactory {
  private static instances: Map<StateCode, StateComplianceValidator> = new Map();

  /**
   * Get validator for state (singleton pattern with caching)
   */
  static async getValidator(state: StateCode): Promise<StateComplianceValidator> {
    // Check cache first
    if (this.instances.has(state)) {
      return this.instances.get(state)!;
    }

    // Validate state is supported
    if (!isStateSupported(state)) {
      throw new Error(
        `State '${state}' is not yet supported. ` +
        `Supported states: ${this.getSupportedStates().join(', ')}`
      );
    }

    // Create and cache validator
    const validator = await getValidator(state);
    this.instances.set(state, validator);

    return validator;
  }

  /**
   * Get supported states
   */
  static getSupportedStates(): StateCode[] {
    return getSupportedStates();
  }

  /**
   * Clear validator cache (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}
