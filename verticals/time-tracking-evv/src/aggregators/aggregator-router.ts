/**
 * Aggregator Router
 * 
 * SOLID: Open/Closed Principle - New states added without modifying existing code
 * APIE: Polymorphism - All aggregators implement IAggregator interface
 * 
 * Routes EVV submissions to the correct state aggregator based on service location.
 * Enables massive code reuse: Sandata serves 4 states with single implementation.
 * 
 * State-to-Aggregator Mapping:
 * - OH, PA, NC, AZ → Sandata (single implementation serves 4 states!)
 * - GA → Tellus
 * - TX → HHAeXchange (existing)
 * - FL → Multi-aggregator (existing)
 */

import { StateCode } from '../types/state-specific.js';
import { EVVRecord } from '../types/evv.js';
import {
  IAggregator,
  StateEVVConfig,
  AggregatorSubmissionResult,
} from './base-aggregator.js';
import { SandataAggregator } from './sandata-aggregator.js';
import { TellusAggregator } from './tellus-aggregator.js';
import { HHAeXchangeAggregator } from './hhaeexchange-aggregator.js';
import {
  getStateConfig,
  getAggregatorType,
  usesSandata,
} from '../config/state-evv-configs.js';

/**
 * Aggregator Router
 *
 * Single entry point for all state EVV submissions.
 * Automatically routes to the correct aggregator based on state code.
 */
export class AggregatorRouter {
  private sandataAggregator: SandataAggregator;
  private tellusAggregator: TellusAggregator;
  private hhaeXchangeAggregator: HHAeXchangeAggregator;

  constructor() {
    // Initialize aggregators once (reused across all states)
    this.sandataAggregator = new SandataAggregator();
    this.tellusAggregator = new TellusAggregator();
    this.hhaeXchangeAggregator = new HHAeXchangeAggregator();
  }

  /**
   * Submit EVV record to appropriate state aggregator
   * 
   * @param evvRecord - Complete EVV record
   * @param state - State code (extracted from service address)
   * @returns Submission result from the aggregator
   * 
   * @example
   * ```typescript
   * const router = new AggregatorRouter();
   * const result = await router.submit(evvRecord, 'OH');
   * // Automatically routes to Sandata for Ohio
   * ```
   */
  async submit(
    evvRecord: EVVRecord,
    state: StateCode
  ): Promise<AggregatorSubmissionResult> {
    // Get state-specific configuration
    const config = getStateConfig(state);

    // Route to appropriate aggregator based on state
    const aggregator = this.getAggregator(state);

    // Submit to aggregator
    return await aggregator.submit(evvRecord, config);
  }

  /**
   * Get the appropriate aggregator for a state
   * 
   * MASSIVE CODE REUSE:
   * - Sandata instance serves OH, PA, NC, AZ (4 states)
   * - Tellus instance serves GA (1 state)
   * - HHAeXchange serves TX (handled elsewhere)
   * - Multi-aggregator serves FL (handled elsewhere)
   * 
   * @param state - State code
   * @returns Aggregator instance
   * @throws Error if state not supported
   */
  private getAggregator(state: StateCode): IAggregator {
    const aggregatorType = getAggregatorType(state);

    switch (aggregatorType) {
      case 'SANDATA':
        // Single Sandata instance serves OH, PA, NC, AZ
        return this.sandataAggregator;

      case 'TELLUS':
        // Tellus serves GA
        return this.tellusAggregator;

      case 'HHAEEXCHANGE':
        // Texas and Florida use HHAeXchange
        return this.hhaeXchangeAggregator;

      case 'MULTI':
        // Florida multi-aggregator (can use HHAeXchange as default)
        return this.hhaeXchangeAggregator;

      default:
        throw new Error(`No aggregator configured for state: ${state}`);
    }
  }

  /**
   * Check if a state uses Sandata
   * 
   * Helper for optimization opportunities - Sandata states can be batched together.
   */
  stateUsesSandata(state: StateCode): boolean {
    return usesSandata(state);
  }

  /**
   * Get all states served by Sandata
   * 
   * Useful for batch operations and reporting.
   */
  getSandataStates(): StateCode[] {
    return ['OH', 'PA', 'NC', 'AZ'];
  }

  /**
   * Get config for a specific state
   * 
   * Convenience method to access state configuration.
   */
  getConfig(state: StateCode): StateEVVConfig {
    return getStateConfig(state);
  }

  /**
   * Validate EVV record for a specific state
   * 
   * Pre-submission validation to catch errors early.
   * 
   * @param evvRecord - EVV record to validate
   * @param state - State code
   * @returns Validation result
   */
  async validate(evvRecord: EVVRecord, state: StateCode) {
    const config = getStateConfig(state);
    const aggregator = this.getAggregator(state);

    if (aggregator.validate) {
      return aggregator.validate(evvRecord, config);
    }

    // Default validation result if aggregator doesn't implement validate
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
}

/**
 * Singleton instance for application-wide use
 * 
 * Create once, reuse everywhere. Aggregator instances are stateless
 * and can handle concurrent requests safely.
 */
let routerInstance: AggregatorRouter | null = null;

export function getAggregatorRouter(): AggregatorRouter {
  if (!routerInstance) {
    routerInstance = new AggregatorRouter();
  }
  return routerInstance;
}
