/**
 * State EVV Configuration Tests
 * 
 * Tests for state configuration helpers and validation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  getStateConfig,
  getAggregatorType,
  usesSandata,
  getStatesByAggregator,
  validateStateGeography,
  STATE_AGGREGATOR_MAP,
  STATE_EVV_CONFIGS,
} from '../state-evv-configs.js';
import type { StateCode } from '../../types/state-specific.js';

describe('State EVV Configuration Helpers', () => {
  describe('getStateConfig', () => {
    it('should return config for Ohio', () => {
      const config = getStateConfig('OH');
      expect(config.state).toBe('OH');
      expect(config.aggregatorType).toBe('SANDATA');
      expect(config.geofenceRadiusMeters).toBe(125);
    });

    it('should return config for Pennsylvania', () => {
      const config = getStateConfig('PA');
      expect(config.state).toBe('PA');
      expect(config.aggregatorType).toBe('SANDATA');
      expect(config.geofenceRadiusMeters).toBe(100);
    });

    it('should return config for Georgia', () => {
      const config = getStateConfig('GA');
      expect(config.state).toBe('GA');
      expect(config.aggregatorType).toBe('TELLUS');
      expect(config.geofenceRadiusMeters).toBe(150);
    });

    it('should return config for North Carolina', () => {
      const config = getStateConfig('NC');
      expect(config.state).toBe('NC');
      expect(config.aggregatorType).toBe('SANDATA');
      expect(config.geofenceRadiusMeters).toBe(120);
    });

    it('should return config for Arizona', () => {
      const config = getStateConfig('AZ');
      expect(config.state).toBe('AZ');
      expect(config.aggregatorType).toBe('SANDATA');
      expect(config.geofenceRadiusMeters).toBe(100);
    });

    it('should return config for Texas', () => {
      const config = getStateConfig('TX');
      expect(config.state).toBe('TX');
      expect(config.aggregatorType).toBe('HHAEEXCHANGE');
    });

    it('should return config for Florida', () => {
      const config = getStateConfig('FL');
      expect(config.state).toBe('FL');
      expect(config.aggregatorType).toBe('MULTI');
    });

    it('should throw for invalid state', () => {
      expect(() => getStateConfig('ZZ' as StateCode)).toThrow(/No EVV configuration found/);
    });
  });

  describe('getAggregatorType', () => {
    it('should return SANDATA for Ohio', () => {
      expect(getAggregatorType('OH')).toBe('SANDATA');
    });

    it('should return SANDATA for Pennsylvania', () => {
      expect(getAggregatorType('PA')).toBe('SANDATA');
    });

    it('should return TELLUS for Georgia', () => {
      expect(getAggregatorType('GA')).toBe('TELLUS');
    });

    it('should return SANDATA for North Carolina', () => {
      expect(getAggregatorType('NC')).toBe('SANDATA');
    });

    it('should return SANDATA for Arizona', () => {
      expect(getAggregatorType('AZ')).toBe('SANDATA');
    });

    it('should return HHAEEXCHANGE for Texas', () => {
      expect(getAggregatorType('TX')).toBe('HHAEEXCHANGE');
    });

    it('should return MULTI for Florida', () => {
      expect(getAggregatorType('FL')).toBe('MULTI');
    });

    it('should return UNKNOWN for invalid state', () => {
      expect(getAggregatorType('ZZ' as StateCode)).toBe('UNKNOWN');
    });
  });

  describe('usesSandata', () => {
    it('should return true for Sandata states', () => {
      expect(usesSandata('OH')).toBe(true);
      expect(usesSandata('PA')).toBe(true);
      expect(usesSandata('NC')).toBe(true);
      expect(usesSandata('AZ')).toBe(true);
    });

    it('should return false for non-Sandata states', () => {
      expect(usesSandata('GA')).toBe(false);
      expect(usesSandata('TX')).toBe(false);
      expect(usesSandata('FL')).toBe(false);
    });
  });

  describe('getStatesByAggregator', () => {
    it('should return Sandata states', () => {
      const states = getStatesByAggregator('SANDATA');
      expect(states).toHaveLength(4);
      expect(states).toContain('OH');
      expect(states).toContain('PA');
      expect(states).toContain('NC');
      expect(states).toContain('AZ');
    });

    it('should return Tellus states', () => {
      const states = getStatesByAggregator('TELLUS');
      expect(states).toHaveLength(1);
      expect(states).toContain('GA');
    });

    it('should return HHAeXchange states', () => {
      const states = getStatesByAggregator('HHAEEXCHANGE');
      expect(states).toHaveLength(1);
      expect(states).toContain('TX');
    });

    it('should return multi-aggregator states', () => {
      const states = getStatesByAggregator('MULTI');
      expect(states).toHaveLength(1);
      expect(states).toContain('FL');
    });

    it('should return empty array for unknown aggregator', () => {
      const states = getStatesByAggregator('UNKNOWN');
      expect(states).toHaveLength(0);
    });
  });

  describe('validateStateGeography', () => {
    it('should validate Ohio coordinates', () => {
      const result = validateStateGeography('OH', 39.9612, -82.9988); // Columbus
      expect(result.valid).toBe(true);
    });

    it('should validate Pennsylvania coordinates', () => {
      const result = validateStateGeography('PA', 39.9526, -75.1652); // Philadelphia
      expect(result.valid).toBe(true);
    });

    it('should validate Georgia coordinates', () => {
      const result = validateStateGeography('GA', 33.7490, -84.3880); // Atlanta
      expect(result.valid).toBe(true);
    });

    it('should validate North Carolina coordinates', () => {
      const result = validateStateGeography('NC', 35.7796, -78.6382); // Raleigh
      expect(result.valid).toBe(true);
    });

    it('should validate Arizona coordinates', () => {
      const result = validateStateGeography('AZ', 33.4484, -112.0740); // Phoenix
      expect(result.valid).toBe(true);
    });

    it('should reject coordinates outside Ohio', () => {
      const result = validateStateGeography('OH', 33.7490, -84.3880); // Atlanta (not in OH)
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('outside');
      expect(result.reason).toContain('OH');
    });

    it('should reject coordinates outside Pennsylvania', () => {
      const result = validateStateGeography('PA', 30.2672, -97.7431); // Austin (not in PA)
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('outside');
    });

    it('should reject coordinates outside Georgia', () => {
      const result = validateStateGeography('GA', 39.9612, -82.9988); // Columbus (not in GA)
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('outside');
    });

    it('should reject coordinates outside North Carolina', () => {
      const result = validateStateGeography('NC', 33.4484, -112.0740); // Phoenix (not in NC)
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('outside');
    });

    it('should reject coordinates outside Arizona', () => {
      const result = validateStateGeography('AZ', 35.7796, -78.6382); // Raleigh (not in AZ)
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('outside');
    });

    it('should handle edge of state boundaries', () => {
      // Test northern edge of Ohio
      const result = validateStateGeography('OH', 41.9, -83.0);
      expect(result.valid).toBe(true);
    });

    it('should return valid for unknown states (no validation)', () => {
      const result = validateStateGeography('ZZ' as StateCode, 0, 0);
      expect(result.valid).toBe(true);
    });
  });

  describe('STATE_AGGREGATOR_MAP', () => {
    it('should have mappings for all 7 states', () => {
      const states = Object.keys(STATE_AGGREGATOR_MAP);
      expect(states).toHaveLength(7);
      expect(states).toContain('TX');
      expect(states).toContain('FL');
      expect(states).toContain('OH');
      expect(states).toContain('PA');
      expect(states).toContain('GA');
      expect(states).toContain('NC');
      expect(states).toContain('AZ');
    });

    it('should map OH to Sandata', () => {
      expect(STATE_AGGREGATOR_MAP.OH).toBe('SANDATA');
    });

    it('should map GA to Tellus', () => {
      expect(STATE_AGGREGATOR_MAP.GA).toBe('TELLUS');
    });
  });

  describe('STATE_EVV_CONFIGS', () => {
    it('should have configs for all 7 states', () => {
      const states = Object.keys(STATE_EVV_CONFIGS);
      expect(states).toHaveLength(7);
    });

    it('should have required fields for each config', () => {
      const states: StateCode[] = ['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'];
      
      for (const state of states) {
        const config = STATE_EVV_CONFIGS[state];
        expect(config.state).toBe(state);
        expect(config.aggregatorType).toBeDefined();
        expect(config.aggregatorEndpoint).toBeDefined();
        expect(config.gracePeriodMinutes).toBeGreaterThan(0);
        expect(config.geofenceRadiusMeters).toBeGreaterThan(0);
        expect(config.retryPolicy).toBeDefined();
      }
    });

    it('should have Pennsylvania with 7-year retention', () => {
      const paConfig = STATE_EVV_CONFIGS.PA as any;
      expect(paConfig.retentionYears).toBe(7);
    });

    it('should have Georgia with lenient rural policy', () => {
      const gaConfig = STATE_EVV_CONFIGS.GA as any;
      expect(gaConfig.lenientRuralPolicy).toBe(true);
    });

    it('should have Arizona with non-medical exemption', () => {
      const azConfig = STATE_EVV_CONFIGS.AZ as any;
      expect(azConfig.nonMedicalExempt).toBe(true);
    });

    it('should have Georgia with largest geofence tolerance', () => {
      const gaConfig = STATE_EVV_CONFIGS.GA;
      const paConfig = STATE_EVV_CONFIGS.PA;
      
      // GA should have larger geofence than PA
      expect(gaConfig.geofenceRadiusMeters).toBeGreaterThan(paConfig.geofenceRadiusMeters);
    });

    it('should have endpoints for each state', () => {
      const endpoints = new Set<string>();
      const states: StateCode[] = ['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'];
      
      for (const state of states) {
        const endpoint = STATE_EVV_CONFIGS[state].aggregatorEndpoint;
        expect(endpoint).toBeDefined();
        expect(endpoint.length).toBeGreaterThan(0);
        endpoints.add(endpoint);
      }
      
      // At least 3 unique aggregators (Sandata, Tellus, HHAeXchange)
      expect(endpoints.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Grace Period Variations', () => {
    it('should have correct grace periods for each state', () => {
      expect(STATE_EVV_CONFIGS.TX.gracePeriodMinutes).toBe(10);
      expect(STATE_EVV_CONFIGS.FL.gracePeriodMinutes).toBe(15);
      expect(STATE_EVV_CONFIGS.OH.gracePeriodMinutes).toBe(10);
      expect(STATE_EVV_CONFIGS.PA.gracePeriodMinutes).toBe(15);
      expect(STATE_EVV_CONFIGS.GA.gracePeriodMinutes).toBe(15);
      expect(STATE_EVV_CONFIGS.NC.gracePeriodMinutes).toBe(10);
      expect(STATE_EVV_CONFIGS.AZ.gracePeriodMinutes).toBe(10);
    });
  });

  describe('Geofence Variations', () => {
    it('should have correct geofence radii for each state', () => {
      expect(STATE_EVV_CONFIGS.TX.geofenceRadiusMeters).toBe(100);
      expect(STATE_EVV_CONFIGS.FL.geofenceRadiusMeters).toBe(150);
      expect(STATE_EVV_CONFIGS.OH.geofenceRadiusMeters).toBe(125);
      expect(STATE_EVV_CONFIGS.PA.geofenceRadiusMeters).toBe(100);
      expect(STATE_EVV_CONFIGS.GA.geofenceRadiusMeters).toBe(150); // Most lenient
      expect(STATE_EVV_CONFIGS.NC.geofenceRadiusMeters).toBe(120);
      expect(STATE_EVV_CONFIGS.AZ.geofenceRadiusMeters).toBe(100);
    });
  });
});
