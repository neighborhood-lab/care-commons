/**
 * Centralized State Compliance Registry
 *
 * Single source of truth for all state-specific compliance configurations.
 * Eliminates need to hunt through multiple files for state info.
 */

import { StateCode } from '../types/base';
import type { StateComplianceValidator } from './types/index';

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

/**
 * Lazy-load Pennsylvania validator
 */
async function createPennsylvaniaValidator(): Promise<StateComplianceValidator> {
  const { PennsylvaniaComplianceValidator } = await import('./pennsylvania/validator.js');
  return new PennsylvaniaComplianceValidator();
}

/**
 * Lazy-load Georgia validator
 */
async function createGeorgiaValidator(): Promise<StateComplianceValidator> {
  const { GeorgiaComplianceValidator } = await import('./georgia/validator.js');
  return new GeorgiaComplianceValidator();
}

/**
 * Lazy-load North Carolina validator
 */
async function createNorthCarolinaValidator(): Promise<StateComplianceValidator> {
  const { NorthCarolinaComplianceValidator } = await import('./north-carolina/validator.js');
  return new NorthCarolinaComplianceValidator();
}

/**
 * Lazy-load Arizona validator
 */
async function createArizonaValidator(): Promise<StateComplianceValidator> {
  const { ArizonaComplianceValidator } = await import('./arizona/validator.js');
  return new ArizonaComplianceValidator();
}

/**
 * Generic validator factory for states without custom implementations
 */
async function createGenericValidator(stateCode: StateCode): Promise<StateComplianceValidator> {
  const { createGenericValidator: factory } = await import('./generic/validator.js');
  return await factory(stateCode);
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
  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    abbreviation: 'PA',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 7, // PA requires longest retention
    marketSize: '8,000+ agencies',
    independentAgencyPercentage: 83,
    priorityScore: 9.0,
    validatorFactory: createPennsylvaniaValidator,
  },
  GA: {
    code: 'GA',
    name: 'Georgia',
    abbreviation: 'GA',
    evvAggregator: 'Tellus',
    evvAggregatorFree: false, // Open/Flex model
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '6,000+ agencies',
    independentAgencyPercentage: 86,
    priorityScore: 8.5,
    validatorFactory: createGeorgiaValidator,
  },
  NC: {
    code: 'NC',
    name: 'North Carolina',
    abbreviation: 'NC',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '5,000+ agencies',
    independentAgencyPercentage: 84,
    priorityScore: 8.0,
    validatorFactory: createNorthCarolinaValidator,
  },
  AZ: {
    code: 'AZ',
    name: 'Arizona',
    abbreviation: 'AZ',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '4,000+ agencies',
    independentAgencyPercentage: 88,
    priorityScore: 8.0,
    validatorFactory: createArizonaValidator,
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
  // Additional states using generic validator (federal baseline + common standards)
  CA: {
    code: 'CA',
    name: 'California',
    abbreviation: 'CA',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: false,
    strictness: 'STRICT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 7,
    marketSize: '3,000+ agencies',
    independentAgencyPercentage: 78,
    priorityScore: 10.0,
    validatorFactory: () => createGenericValidator('CA'),
  },
  NY: {
    code: 'NY',
    name: 'New York',
    abbreviation: 'NY',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: false,
    strictness: 'STRICT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '2,500+ agencies',
    independentAgencyPercentage: 75,
    priorityScore: 9.5,
    validatorFactory: () => createGenericValidator('NY'),
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    abbreviation: 'IL',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '2,000+ agencies',
    independentAgencyPercentage: 82,
    priorityScore: 8.5,
    validatorFactory: () => createGenericValidator('IL'),
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    abbreviation: 'MA',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: false,
    strictness: 'STRICT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '1,500+ agencies',
    independentAgencyPercentage: 80,
    priorityScore: 8.0,
    validatorFactory: () => createGenericValidator('MA'),
  },
  NJ: {
    code: 'NJ',
    name: 'New Jersey',
    abbreviation: 'NJ',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: false,
    strictness: 'STRICT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '1,200+ agencies',
    independentAgencyPercentage: 79,
    priorityScore: 7.5,
    validatorFactory: () => createGenericValidator('NJ'),
  },
  WA: {
    code: 'WA',
    name: 'Washington',
    abbreviation: 'WA',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '1,000+ agencies',
    independentAgencyPercentage: 84,
    priorityScore: 7.0,
    validatorFactory: () => createGenericValidator('WA'),
  },
  MI: {
    code: 'MI',
    name: 'Michigan',
    abbreviation: 'MI',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '1,000+ agencies',
    independentAgencyPercentage: 83,
    priorityScore: 6.5,
    validatorFactory: () => createGenericValidator('MI'),
  },
  MN: {
    code: 'MN',
    name: 'Minnesota',
    abbreviation: 'MN',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '900+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 6.5,
    validatorFactory: () => createGenericValidator('MN'),
  },
  VA: {
    code: 'VA',
    name: 'Virginia',
    abbreviation: 'VA',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '800+ agencies',
    independentAgencyPercentage: 82,
    priorityScore: 6.0,
    validatorFactory: () => createGenericValidator('VA'),
  },
  TN: {
    code: 'TN',
    name: 'Tennessee',
    abbreviation: 'TN',
    evvAggregator: 'HHAeXchange',
    evvAggregatorFree: false,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '700+ agencies',
    independentAgencyPercentage: 84,
    priorityScore: 5.5,
    validatorFactory: () => createGenericValidator('TN'),
  },
  MD: {
    code: 'MD',
    name: 'Maryland',
    abbreviation: 'MD',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'STRICT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '700+ agencies',
    independentAgencyPercentage: 81,
    priorityScore: 5.5,
    validatorFactory: () => createGenericValidator('MD'),
  },
  CO: {
    code: 'CO',
    name: 'Colorado',
    abbreviation: 'CO',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '600+ agencies',
    independentAgencyPercentage: 86,
    priorityScore: 5.0,
    validatorFactory: () => createGenericValidator('CO'),
  },
  IN: {
    code: 'IN',
    name: 'Indiana',
    abbreviation: 'IN',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '600+ agencies',
    independentAgencyPercentage: 84,
    priorityScore: 5.0,
    validatorFactory: () => createGenericValidator('IN'),
  },
  MO: {
    code: 'MO',
    name: 'Missouri',
    abbreviation: 'MO',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '500+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 4.5,
    validatorFactory: () => createGenericValidator('MO'),
  },
  WI: {
    code: 'WI',
    name: 'Wisconsin',
    abbreviation: 'WI',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '500+ agencies',
    independentAgencyPercentage: 83,
    priorityScore: 4.5,
    validatorFactory: () => createGenericValidator('WI'),
  },
  AL: {
    code: 'AL',
    name: 'Alabama',
    abbreviation: 'AL',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '400+ agencies',
    independentAgencyPercentage: 87,
    priorityScore: 4.0,
    validatorFactory: () => createGenericValidator('AL'),
  },
  SC: {
    code: 'SC',
    name: 'South Carolina',
    abbreviation: 'SC',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '400+ agencies',
    independentAgencyPercentage: 86,
    priorityScore: 4.0,
    validatorFactory: () => createGenericValidator('SC'),
  },
  LA: {
    code: 'LA',
    name: 'Louisiana',
    abbreviation: 'LA',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '400+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 4.0,
    validatorFactory: () => createGenericValidator('LA'),
  },
  KY: {
    code: 'KY',
    name: 'Kentucky',
    abbreviation: 'KY',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '300+ agencies',
    independentAgencyPercentage: 84,
    priorityScore: 3.5,
    validatorFactory: () => createGenericValidator('KY'),
  },
  OR: {
    code: 'OR',
    name: 'Oregon',
    abbreviation: 'OR',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '300+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 3.5,
    validatorFactory: () => createGenericValidator('OR'),
  },
  OK: {
    code: 'OK',
    name: 'Oklahoma',
    abbreviation: 'OK',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '300+ agencies',
    independentAgencyPercentage: 86,
    priorityScore: 3.5,
    validatorFactory: () => createGenericValidator('OK'),
  },
  CT: {
    code: 'CT',
    name: 'Connecticut',
    abbreviation: 'CT',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'STRICT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '300+ agencies',
    independentAgencyPercentage: 80,
    priorityScore: 3.0,
    validatorFactory: () => createGenericValidator('CT'),
  },
  IA: {
    code: 'IA',
    name: 'Iowa',
    abbreviation: 'IA',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '200+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 3.0,
    validatorFactory: () => createGenericValidator('IA'),
  },
  MS: {
    code: 'MS',
    name: 'Mississippi',
    abbreviation: 'MS',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '200+ agencies',
    independentAgencyPercentage: 88,
    priorityScore: 3.0,
    validatorFactory: () => createGenericValidator('MS'),
  },
  AR: {
    code: 'AR',
    name: 'Arkansas',
    abbreviation: 'AR',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '200+ agencies',
    independentAgencyPercentage: 87,
    priorityScore: 3.0,
    validatorFactory: () => createGenericValidator('AR'),
  },
  KS: {
    code: 'KS',
    name: 'Kansas',
    abbreviation: 'KS',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '200+ agencies',
    independentAgencyPercentage: 84,
    priorityScore: 2.5,
    validatorFactory: () => createGenericValidator('KS'),
  },
  UT: {
    code: 'UT',
    name: 'Utah',
    abbreviation: 'UT',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '200+ agencies',
    independentAgencyPercentage: 83,
    priorityScore: 2.5,
    validatorFactory: () => createGenericValidator('UT'),
  },
  NV: {
    code: 'NV',
    name: 'Nevada',
    abbreviation: 'NV',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '200+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 2.5,
    validatorFactory: () => createGenericValidator('NV'),
  },
  NM: {
    code: 'NM',
    name: 'New Mexico',
    abbreviation: 'NM',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '150+ agencies',
    independentAgencyPercentage: 86,
    priorityScore: 2.0,
    validatorFactory: () => createGenericValidator('NM'),
  },
  WV: {
    code: 'WV',
    name: 'West Virginia',
    abbreviation: 'WV',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '150+ agencies',
    independentAgencyPercentage: 87,
    priorityScore: 2.0,
    validatorFactory: () => createGenericValidator('WV'),
  },
  NE: {
    code: 'NE',
    name: 'Nebraska',
    abbreviation: 'NE',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '100+ agencies',
    independentAgencyPercentage: 85,
    priorityScore: 2.0,
    validatorFactory: () => createGenericValidator('NE'),
  },
  ID: {
    code: 'ID',
    name: 'Idaho',
    abbreviation: 'ID',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '100+ agencies',
    independentAgencyPercentage: 88,
    priorityScore: 2.0,
    validatorFactory: () => createGenericValidator('ID'),
  },
  NH: {
    code: 'NH',
    name: 'New Hampshire',
    abbreviation: 'NH',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '100+ agencies',
    independentAgencyPercentage: 82,
    priorityScore: 2.0,
    validatorFactory: () => createGenericValidator('NH'),
  },
  ME: {
    code: 'ME',
    name: 'Maine',
    abbreviation: 'ME',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '100+ agencies',
    independentAgencyPercentage: 84,
    priorityScore: 2.0,
    validatorFactory: () => createGenericValidator('ME'),
  },
  HI: {
    code: 'HI',
    name: 'Hawaii',
    abbreviation: 'HI',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '100+ agencies',
    independentAgencyPercentage: 79,
    priorityScore: 2.0,
    validatorFactory: () => createGenericValidator('HI'),
  },
  RI: {
    code: 'RI',
    name: 'Rhode Island',
    abbreviation: 'RI',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'STRICT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 80,
    priorityScore: 1.5,
    validatorFactory: () => createGenericValidator('RI'),
  },
  MT: {
    code: 'MT',
    name: 'Montana',
    abbreviation: 'MT',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 89,
    priorityScore: 1.5,
    validatorFactory: () => createGenericValidator('MT'),
  },
  DE: {
    code: 'DE',
    name: 'Delaware',
    abbreviation: 'DE',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 81,
    priorityScore: 1.5,
    validatorFactory: () => createGenericValidator('DE'),
  },
  SD: {
    code: 'SD',
    name: 'South Dakota',
    abbreviation: 'SD',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 88,
    priorityScore: 1.0,
    validatorFactory: () => createGenericValidator('SD'),
  },
  ND: {
    code: 'ND',
    name: 'North Dakota',
    abbreviation: 'ND',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 87,
    priorityScore: 1.0,
    validatorFactory: () => createGenericValidator('ND'),
  },
  AK: {
    code: 'AK',
    name: 'Alaska',
    abbreviation: 'AK',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 85,
    priorityScore: 1.0,
    validatorFactory: () => createGenericValidator('AK'),
  },
  VT: {
    code: 'VT',
    name: 'Vermont',
    abbreviation: 'VT',
    evvAggregator: 'Multi-aggregator',
    evvAggregatorFree: true,
    strictness: 'MODERATE',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 83,
    priorityScore: 1.0,
    validatorFactory: () => createGenericValidator('VT'),
  },
  WY: {
    code: 'WY',
    name: 'Wyoming',
    abbreviation: 'WY',
    evvAggregator: 'Sandata',
    evvAggregatorFree: true,
    strictness: 'LENIENT',
    backgroundCheckCycle: 'EVERY_5_YEARS',
    dataRetentionYears: 6,
    marketSize: '<100 agencies',
    independentAgencyPercentage: 90,
    priorityScore: 1.0,
    validatorFactory: () => createGenericValidator('WY'),
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
