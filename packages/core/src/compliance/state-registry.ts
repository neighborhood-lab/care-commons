/**
 * Centralized State Compliance Registry
 *
 * Single source of truth for all state-specific compliance configurations.
 * Eliminates need to hunt through multiple files for state info.
 */

import { StateCode } from '../types/base.js';
import type { StateComplianceValidator } from './types/index.js';

export interface StateInfo {
  code: StateCode;
  name: string;
  abbreviation: string;

  // EVV Aggregator
  evvAggregator: string;
  evvAggregatorFree: boolean;

  // Compliance characteristics
  strictness: 'STRICT' | 'MODERATE' | 'LENIENT';
  backgroundCheckCycle: 'BIENNIAL' | 'EVERY_5_YEARS';
  dataRetentionYears: number;

  // Market characteristics
  marketSize: string;
  independentAgencyPercentage: number;
  priorityScore: number;

  // Validator class (lazy-loaded to avoid circular dependencies)
  validatorFactory: () => Promise<StateComplianceValidator>;
}

/**
 * Lazy-load Ohio validator
 */
async function createOhioValidator(): Promise<StateComplianceValidator> {
  const { OhioComplianceValidator } = await import('./ohio/validator.js');
  return new OhioComplianceValidator();
}

/**
 * Lazy-load Texas validator
 */
async function createTexasValidator(): Promise<StateComplianceValidator> {
  const { TexasComplianceValidator } = await import('./texas/validator.js');
  return new TexasComplianceValidator();
}

/**
 * Lazy-load Florida validator
 */
async function createFloridaValidator(): Promise<StateComplianceValidator> {
  const { FloridaComplianceValidator } = await import('./florida/validator.js');
  return new FloridaComplianceValidator();
}

export const STATE_REGISTRY: Partial<Record<StateCode, StateInfo>> = {
  OH: {
    code: 'OH',
    name: 'Ohio',
    abbreviation: 'OH',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '5,000+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 9.5,
    validatorFactory: createOhioValidator,
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    abbreviation: 'TX',
    evvAggregator: 'HHAeXchange',
    evvAggregatorFree: false,
    strictness: 'STRICT',
    backgroundCheckCycle: 'BIENNIAL',
    dataRetentionYears: 6,
    marketSize: '7,000+ agencies',
    independentAgencyPercentage: 80,
    priorityScore: 9.0,
    validatorFactory: createTexasValidator,
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    abbreviation: 'FL',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: false,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '10,000+ agencies',
    independentAgencyPercentage: 82,
    priorityScore: 8.5,
    validatorFactory: createFloridaValidator,
  },
};

/**
 * Get validator instance for a state
 */
export async function getValidator(state: StateCode): Promise<StateComplianceValidator> {
  const stateInfo = STATE_REGISTRY[state];

  if (stateInfo === undefined) {
    throw new Error(`No validator registered for state: ${state}`);
  }

  return await stateInfo.validatorFactory();
}

/**
 * Check if state is supported
 */
export function isStateSupported(state: StateCode): boolean {
  return state in STATE_REGISTRY;
}

/**
 * Get all supported states
 */
export function getSupportedStates(): StateCode[] {
  return Object.keys(STATE_REGISTRY) as StateCode[];
}

/**
 * Get states by aggregator
 */
export function getStatesByAggregator(aggregator: string): StateCode[] {
  return (Object.values(STATE_REGISTRY) as StateInfo[])
    .filter(s => s.evvAggregator === aggregator)
    .map(s => s.code);
}

/**
 * Get state info
 */
export function getStateInfo(state: StateCode): StateInfo | undefined {
  return STATE_REGISTRY[state];
}
