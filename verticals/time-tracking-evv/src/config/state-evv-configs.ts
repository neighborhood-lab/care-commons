/**
 * State EVV Configuration Constants
 * 
 * Centralized configuration for all 7 supported states.
 * Each state has unique EVV requirements, aggregators, and compliance rules.
 * 
 * States Covered:
 * - Texas (TX) - HHAeXchange (existing)
 * - Florida (FL) - Multi-aggregator (existing)
 * - Ohio (OH) - Sandata
 * - Pennsylvania (PA) - Sandata
 * - Georgia (GA) - Tellus
 * - North Carolina (NC) - Sandata
 * - Arizona (AZ) - Sandata
 * 
 * Domain Knowledge Applied:
 * - All configurations based on actual state Medicaid EVV policies
 * - Geofence tolerances reflect GPS accuracy realities + state regulations
 * - Grace periods align with state wage & hour requirements
 * - Aggregator assignments match state mandates or common practice
 */

import { StateCode } from '../types/state-specific.js';
import { StateEVVConfig, EXPONENTIAL_BACKOFF } from '../aggregators/base-aggregator.js';

/**
 * State-to-Aggregator mapping
 * 
 * MASSIVE CODE REUSE: Sandata serves 4 states with single implementation
 */
export const STATE_AGGREGATOR_MAP: Record<StateCode, string> = {
  TX: 'HHAEEXCHANGE',    // Texas mandates HHAeXchange
  FL: 'MULTI',            // Florida allows multiple aggregators
  OH: 'SANDATA',          // Ohio uses Sandata
  PA: 'SANDATA',          // Pennsylvania uses Sandata
  GA: 'TELLUS',           // Georgia uses Tellus (Netsmart)
  NC: 'SANDATA',          // North Carolina uses Sandata
  AZ: 'SANDATA',          // Arizona uses Sandata
};

/**
 * State EVV Configurations
 * 
 * Each state configuration includes:
 * - Aggregator details
 * - Geofence parameters (base + tolerance)
 * - Grace periods (clock-in/out flexibility)
 * - State-specific flags and extensions
 */
export const STATE_EVV_CONFIGS: Record<StateCode, StateEVVConfig> = {
  /**
   * Texas (TX)
   * - Aggregator: HHAeXchange (state-mandated)
   * - Geofence: 100m base + 50m GPS accuracy allowance = 150m total
   * - Grace period: 10 minutes (conservative)
   * - Special: VMUR (Visit Maintenance Unlock Request) required for corrections
   */
  TX: {
    state: 'TX',
    aggregatorType: 'HHAEEXCHANGE',
    aggregatorEndpoint: 'https://api.hhaeexchange.com/evv/v2/visits',
    gracePeriodMinutes: 10,
    geofenceRadiusMeters: 100,
    geofenceToleranceMeters: 50,
    retryPolicy: EXPONENTIAL_BACKOFF,
    statePrograms: [
      'STAR_PLUS',
      'STAR_KIDS',
      'COMMUNITY_FIRST_CHOICE',
      'PRIMARY_HOME_CARE',
    ],
    requiresVMUR: true,
    vmurWindowDays: 30,
  },

  /**
   * Florida (FL)
   * - Aggregator: Multiple (HHAeXchange, Tellus, iConnect)
   * - Geofence: 150m base + 100m tolerance = 250m total (most lenient)
   * - Grace period: 15 minutes
   * - Special: MCO-specific routing, supports multiple aggregators
   */
  FL: {
    state: 'FL',
    aggregatorType: 'MULTI',
    aggregatorEndpoint: 'https://api.hhaeexchange.com/evv/v2/visits', // Default
    gracePeriodMinutes: 15,
    geofenceRadiusMeters: 150,
    geofenceToleranceMeters: 100,
    retryPolicy: EXPONENTIAL_BACKOFF,
    statePrograms: [
      'SMMC_LTC',
      'SMMC_MMA',
      'FFS_MEDICAID',
      'DOEA_HOMECARE',
    ],
    multiAggregatorSupport: true,
    mcoRouting: true,
  },

  /**
   * Ohio (OH)
   * - Aggregator: Sandata
   * - Geofence: 125m base + 75m tolerance = 200m total
   * - Grace period: 10 minutes
   * - Special: ODM (Ohio Department of Medicaid) standards
   */
  OH: {
    state: 'OH',
    aggregatorType: 'SANDATA',
    aggregatorEndpoint: 'https://api.sandata.com/ohio/evv/v1/visits',
    gracePeriodMinutes: 10,
    geofenceRadiusMeters: 125,
    geofenceToleranceMeters: 75,
    retryPolicy: EXPONENTIAL_BACKOFF,
    statePrograms: [
      'OHIO_MEDICAID',
      'MY_CARE',
      'PASSPORT',
      'ASSISTED_LIVING_WAIVER',
    ],
    stateDepartment: 'ODM', // Ohio Department of Medicaid
  },

  /**
   * Pennsylvania (PA)
   * - Aggregator: Sandata
   * - Geofence: 100m base + 50m tolerance = 150m total (conservative)
   * - Grace period: 15 minutes
   * - Special: DHS requires 7-year retention (longest of all states)
   */
  PA: {
    state: 'PA',
    aggregatorType: 'SANDATA',
    aggregatorEndpoint: 'https://api.sandata.com/pennsylvania/evv/v1/visits',
    gracePeriodMinutes: 15,
    geofenceRadiusMeters: 100,
    geofenceToleranceMeters: 50,
    retryPolicy: EXPONENTIAL_BACKOFF,
    statePrograms: [
      'COMMUNITY_HEALTHCHOICES',
      'OBRA_WAIVER',
      'AGING_WAIVER',
      'ATTENDANT_CARE',
    ],
    stateDepartment: 'DHS', // Department of Human Services
    retentionYears: 7, // PA requires longest retention
  },

  /**
   * Georgia (GA)
   * - Aggregator: Tellus (Netsmart)
   * - Geofence: 150m base + 100m tolerance = 250m total (most lenient)
   * - Grace period: 15 minutes
   * - Special: Lenient rural exception handling, HCBS waiver focus
   */
  GA: {
    state: 'GA',
    aggregatorType: 'TELLUS',
    aggregatorEndpoint: 'https://api.tellus.netsmart.com/georgia/evv/v1/visits',
    gracePeriodMinutes: 15,
    geofenceRadiusMeters: 150,
    geofenceToleranceMeters: 100,
    retryPolicy: EXPONENTIAL_BACKOFF,
    statePrograms: [
      'GEORGIA_MEDICAID',
      'CCSP_WAIVER', // Community Care Services Program
      'SOURCE_WAIVER',
      'NOW_COMP_WAIVER',
    ],
    stateDepartment: 'DCH', // Department of Community Health
    lenientRuralPolicy: true, // Georgia has most lenient rural exceptions
    hcbsWaiverFocus: true,
  },

  /**
   * North Carolina (NC)
   * - Aggregator: Sandata
   * - Geofence: 120m base + 60m tolerance = 180m total
   * - Grace period: 10 minutes
   * - Special: DHHS standards, balanced approach
   */
  NC: {
    state: 'NC',
    aggregatorType: 'SANDATA',
    aggregatorEndpoint: 'https://api.sandata.com/northcarolina/evv/v1/visits',
    gracePeriodMinutes: 10,
    geofenceRadiusMeters: 120,
    geofenceToleranceMeters: 60,
    retryPolicy: EXPONENTIAL_BACKOFF,
    statePrograms: [
      'NC_MEDICAID',
      'CAP_DA', // Community Alternatives Program - Disabled Adults
      'CAP_C', // Community Alternatives Program - Children
      'INNOVATIONS_WAIVER',
    ],
    stateDepartment: 'DHHS', // Department of Health and Human Services
  },

  /**
   * Arizona (AZ)
   * - Aggregator: Sandata
   * - Geofence: 100m base + 50m tolerance = 150m total
   * - Grace period: 10 minutes
   * - Special: Non-medical services exempt from NPI requirement
   */
  AZ: {
    state: 'AZ',
    aggregatorType: 'SANDATA',
    aggregatorEndpoint: 'https://api.sandata.com/arizona/evv/v1/visits',
    gracePeriodMinutes: 10,
    geofenceRadiusMeters: 100,
    geofenceToleranceMeters: 50,
    retryPolicy: EXPONENTIAL_BACKOFF,
    statePrograms: [
      'AHCCCS_ALTCS', // Arizona Long Term Care System
      'DDD_WAIVER', // Division of Developmental Disabilities
      'EPD', // Elderly and Physically Disabled
      'SMI', // Seriously Mentally Ill
    ],
    stateDepartment: 'AHCCCS', // Arizona Health Care Cost Containment System
    nonMedicalExempt: true, // Non-medical services don't require NPI
  },
};

/**
 * Get configuration for a specific state
 * 
 * @param state - State code
 * @returns State EVV configuration
 * @throws Error if state not supported
 */
export function getStateConfig(state: StateCode): StateEVVConfig {
  const config = STATE_EVV_CONFIGS[state];
  if (!config) {
    throw new Error(`No EVV configuration found for state: ${state}`);
  }
  return config;
}

/**
 * Get aggregator type for a state
 * 
 * @param state - State code
 * @returns Aggregator type (SANDATA, TELLUS, HHAEEXCHANGE, MULTI)
 */
export function getAggregatorType(state: StateCode): string {
  return STATE_AGGREGATOR_MAP[state] || 'UNKNOWN';
}

/**
 * Check if state uses Sandata aggregator
 * 
 * This enables code reuse optimization - 4 states share single implementation.
 * 
 * @param state - State code
 * @returns true if state uses Sandata
 */
export function usesSandata(state: StateCode): boolean {
  return ['OH', 'PA', 'NC', 'AZ'].includes(state);
}

/**
 * Get all states using a specific aggregator
 * 
 * @param aggregatorType - Aggregator type
 * @returns Array of state codes
 */
export function getStatesByAggregator(aggregatorType: string): StateCode[] {
  return Object.entries(STATE_AGGREGATOR_MAP)
    .filter(([_, agg]) => agg === aggregatorType)
    .map(([state, _]) => state as StateCode);
}

/**
 * State-specific validation: Check if geofence coordinates are within state boundaries
 * 
 * This prevents configuration errors where a Texas client address is used for
 * an Ohio visit (common mistake during multi-state expansion).
 * 
 * Note: This is a simplified check. Production should use proper geocoding service.
 */
export function validateStateGeography(
  state: StateCode,
  latitude: number,
  longitude: number
): { valid: boolean; reason?: string } {
  // Rough bounding boxes for each state (production should use proper geocoding)
  const stateBounds: Record<StateCode, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
    TX: { minLat: 25.8, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
    FL: { minLat: 24.4, maxLat: 31.0, minLng: -87.6, maxLng: -79.8 },
    OH: { minLat: 38.4, maxLat: 42.0, minLng: -84.8, maxLng: -80.5 },
    PA: { minLat: 39.7, maxLat: 42.3, minLng: -80.5, maxLng: -74.7 },
    GA: { minLat: 30.4, maxLat: 35.0, minLng: -85.6, maxLng: -80.8 },
    NC: { minLat: 33.8, maxLat: 36.6, minLng: -84.3, maxLng: -75.4 },
    AZ: { minLat: 31.3, maxLat: 37.0, minLng: -114.8, maxLng: -109.0 },
  };

  const bounds = stateBounds[state];
  if (!bounds) {
    return { valid: true }; // Unknown state, skip validation
  }

  if (
    latitude < bounds.minLat ||
    latitude > bounds.maxLat ||
    longitude < bounds.minLng ||
    longitude > bounds.maxLng
  ) {
    return {
      valid: false,
      reason: `Coordinates (${latitude}, ${longitude}) appear to be outside ${state} state boundaries. ` +
              `Verify the service address is in the correct state.`,
    };
  }

  return { valid: true };
}
