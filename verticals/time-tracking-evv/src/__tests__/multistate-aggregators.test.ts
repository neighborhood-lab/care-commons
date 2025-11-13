/**
 * Multi-State Aggregator Tests
 * 
 * Tests for the multi-state EVV expansion covering OH, PA, GA, NC, AZ.
 * Validates aggregator routing, configuration, and state-specific rules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AggregatorRouter } from '../aggregators/aggregator-router';
import { SandataAggregator } from '../aggregators/sandata-aggregator';
import { TellusAggregator } from '../aggregators/tellus-aggregator';
import {
  getStateConfig,
  usesSandata,
  getStatesByAggregator,
  STATE_AGGREGATOR_MAP,
} from '../config/state-evv-configs';
import { getStateEVVRules } from '../types/state-specific';
import type { EVVRecord } from '../types/evv';
import type { StateCode } from '../types/state-specific';

describe('Multi-State Aggregator Support', () => {
  describe('State Configuration', () => {
    it('should support all 7 states', () => {
      const supportedStates: StateCode[] = ['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'];
      
      for (const state of supportedStates) {
        expect(() => getStateConfig(state)).not.toThrow();
        expect(() => getStateEVVRules(state)).not.toThrow();
      }
    });

    it('should have correct aggregator mapping', () => {
      expect(STATE_AGGREGATOR_MAP.TX).toBe('HHAEEXCHANGE');
      expect(STATE_AGGREGATOR_MAP.FL).toBe('MULTI');
      expect(STATE_AGGREGATOR_MAP.OH).toBe('SANDATA');
      expect(STATE_AGGREGATOR_MAP.PA).toBe('SANDATA');
      expect(STATE_AGGREGATOR_MAP.GA).toBe('TELLUS');
      expect(STATE_AGGREGATOR_MAP.NC).toBe('SANDATA');
      expect(STATE_AGGREGATOR_MAP.AZ).toBe('SANDATA');
    });

    it('should identify Sandata states correctly', () => {
      expect(usesSandata('OH')).toBe(true);
      expect(usesSandata('PA')).toBe(true);
      expect(usesSandata('NC')).toBe(true);
      expect(usesSandata('AZ')).toBe(true);
      expect(usesSandata('GA')).toBe(false);
      expect(usesSandata('TX')).toBe(false);
      expect(usesSandata('FL')).toBe(false);
    });

    it('should return correct states by aggregator', () => {
      const sandataStates = getStatesByAggregator('SANDATA');
      expect(sandataStates).toHaveLength(4);
      expect(sandataStates).toContain('OH');
      expect(sandataStates).toContain('PA');
      expect(sandataStates).toContain('NC');
      expect(sandataStates).toContain('AZ');

      const tellusStates = getStatesByAggregator('TELLUS');
      expect(tellusStates).toHaveLength(1);
      expect(tellusStates).toContain('GA');
    });
  });

  describe('State-Specific Rules', () => {
    it('should have Ohio (OH) rules', () => {
      const rules = getStateEVVRules('OH');
      expect(rules.state).toBe('OH');
      expect(rules.geoFenceRadius).toBe(125);
      expect(rules.geoFenceTolerance).toBe(75);
      expect(rules.maxClockInEarlyMinutes).toBe(10);
      expect(rules.maxClockOutLateMinutes).toBe(10);
      expect(rules.retentionYears).toBe(6);
      expect(rules.immutableAfterDays).toBe(30);
    });

    it('should have Pennsylvania (PA) rules with 7-year retention', () => {
      const rules = getStateEVVRules('PA');
      expect(rules.state).toBe('PA');
      expect(rules.geoFenceRadius).toBe(100);
      expect(rules.geoFenceTolerance).toBe(50);
      expect(rules.maxClockInEarlyMinutes).toBe(15);
      expect(rules.maxClockOutLateMinutes).toBe(15);
      expect(rules.retentionYears).toBe(7); // PA requires longest retention
      expect(rules.immutableAfterDays).toBe(35);
    });

    it('should have Georgia (GA) lenient rules', () => {
      const rules = getStateEVVRules('GA');
      expect(rules.state).toBe('GA');
      expect(rules.geoFenceRadius).toBe(150); // Most lenient
      expect(rules.geoFenceTolerance).toBe(100); // Most lenient
      expect(rules.maxClockInEarlyMinutes).toBe(15);
      expect(rules.maxClockOutLateMinutes).toBe(15);
      expect(rules.overtimeThresholdMinutes).toBe(20);
      expect(rules.retentionYears).toBe(6);
      expect(rules.immutableAfterDays).toBe(45); // Lenient correction window
    });

    it('should have North Carolina (NC) rules', () => {
      const rules = getStateEVVRules('NC');
      expect(rules.state).toBe('NC');
      expect(rules.geoFenceRadius).toBe(120);
      expect(rules.geoFenceTolerance).toBe(60);
      expect(rules.maxClockInEarlyMinutes).toBe(10);
      expect(rules.maxClockOutLateMinutes).toBe(10);
      expect(rules.retentionYears).toBe(6);
      expect(rules.immutableAfterDays).toBe(30);
    });

    it('should have Arizona (AZ) rules', () => {
      const rules = getStateEVVRules('AZ');
      expect(rules.state).toBe('AZ');
      expect(rules.geoFenceRadius).toBe(100);
      expect(rules.geoFenceTolerance).toBe(50);
      expect(rules.maxClockInEarlyMinutes).toBe(10);
      expect(rules.maxClockOutLateMinutes).toBe(10);
      expect(rules.retentionYears).toBe(6);
      expect(rules.immutableAfterDays).toBe(30);
    });

    it('should have varying geofence tolerances by state', () => {
      // Pennsylvania: Most conservative (100m + 50m = 150m total)
      const pa = getStateEVVRules('PA');
      const paTotal = pa.geoFenceRadius + pa.geoFenceTolerance;
      expect(paTotal).toBe(150);

      // Georgia: Most lenient (150m + 100m = 250m total)
      const ga = getStateEVVRules('GA');
      const gaTotal = ga.geoFenceRadius + ga.geoFenceTolerance;
      expect(gaTotal).toBe(250);

      // Georgia should have larger total tolerance than Pennsylvania
      expect(gaTotal).toBeGreaterThan(paTotal);
    });
  });

  describe('Aggregator Router', () => {
    let router: AggregatorRouter;

    beforeEach(() => {
      router = new AggregatorRouter();
    });

    it('should create router instance', () => {
      expect(router).toBeDefined();
      expect(router).toBeInstanceOf(AggregatorRouter);
    });

    it('should identify Sandata states', () => {
      expect(router.stateUsesSandata('OH')).toBe(true);
      expect(router.stateUsesSandata('PA')).toBe(true);
      expect(router.stateUsesSandata('NC')).toBe(true);
      expect(router.stateUsesSandata('AZ')).toBe(true);
      expect(router.stateUsesSandata('GA')).toBe(false);
    });

    it('should return correct Sandata states', () => {
      const sandataStates = router.getSandataStates();
      expect(sandataStates).toEqual(['OH', 'PA', 'NC', 'AZ']);
    });

    it('should get config for each state', () => {
      const states: StateCode[] = ['OH', 'PA', 'GA', 'NC', 'AZ'];
      
      for (const state of states) {
        const config = router.getConfig(state);
        expect(config).toBeDefined();
        expect(config.state).toBe(state);
        expect(config.aggregatorType).toBeDefined();
        expect(config.geofenceRadiusMeters).toBeGreaterThan(0);
        expect(config.gracePeriodMinutes).toBeGreaterThan(0);
      }
    });

    it('should route TX and FL to HHAeXchange aggregator', async () => {
      const mockTXRecord = createMockEVVRecord('TX');
      
      // TX routes to HHAeXchange aggregator
      const result = await router.submit(mockTXRecord, 'TX');
      
      expect(result).toBeDefined();
      expect(result.submissionId).toBeDefined();
    });
  });

  describe('Sandata Aggregator', () => {
    let aggregator: SandataAggregator;

    beforeEach(() => {
      aggregator = new SandataAggregator();
    });

    it('should create Sandata aggregator instance', () => {
      expect(aggregator).toBeDefined();
      expect(aggregator).toBeInstanceOf(SandataAggregator);
    });

    it('should validate EVV record for Ohio', () => {
      const evvRecord = createMockEVVRecord('OH');
      const config = getStateConfig('OH');
      
      const result = aggregator.validate(evvRecord, config);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate EVV record for Pennsylvania', () => {
      const evvRecord = createMockEVVRecord('PA');
      const config = getStateConfig('PA');
      
      const result = aggregator.validate(evvRecord, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const evvRecord = createMockEVVRecord('OH');
      // Remove required field
      evvRecord.clockOutTime = null;
      
      const config = getStateConfig('OH');
      const result = aggregator.validate(evvRecord, config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === 'MISSING_END_TIME')).toBe(true);
    });

    it('should detect low GPS accuracy as warning for Arizona', () => {
      const evvRecord = createMockEVVRecord('AZ');
      // Set GPS accuracy worse than state tolerance
      evvRecord.clockInVerification.accuracy = 200; // AZ tolerance is 100m
      
      const config = getStateConfig('AZ');
      const result = aggregator.validate(evvRecord, config);
      
      // Should still be valid but with warnings
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'LOW_GPS_ACCURACY')).toBe(true);
    });
  });

  describe('Tellus Aggregator', () => {
    let aggregator: TellusAggregator;

    beforeEach(() => {
      aggregator = new TellusAggregator();
    });

    it('should create Tellus aggregator instance', () => {
      expect(aggregator).toBeDefined();
      expect(aggregator).toBeInstanceOf(TellusAggregator);
    });

    it('should validate EVV record for Georgia', () => {
      const evvRecord = createMockEVVRecord('GA');
      const config = getStateConfig('GA');
      
      const result = aggregator.validate(evvRecord, config);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept high GPS inaccuracy for Georgia (lenient policy)', () => {
      const evvRecord = createMockEVVRecord('GA');
      // GA tolerance is 150m + 100m = 250m total
      evvRecord.clockInVerification.accuracy = 200; // Still within tolerance
      
      const config = getStateConfig('GA');
      const result = aggregator.validate(evvRecord, config);
      
      // Should be valid with no errors
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about extremely high GPS inaccuracy even for lenient Georgia', () => {
      const evvRecord = createMockEVVRecord('GA');
      evvRecord.clockInVerification.accuracy = 300; // Exceeds even GA's lenient 250m tolerance
      
      const config = getStateConfig('GA');
      const result = aggregator.validate(evvRecord, config);
      
      expect(result.isValid).toBe(true); // Still valid
      expect(result.warnings.some(w => w.code === 'HIGH_GPS_INACCURACY')).toBe(true);
    });
  });

  describe('State Configuration Coverage', () => {
    it('should have complete config for all new states', () => {
      const newStates: StateCode[] = ['OH', 'PA', 'GA', 'NC', 'AZ'];
      
      for (const state of newStates) {
        const config = getStateConfig(state);
        
        // Required fields
        expect(config.state).toBe(state);
        expect(config.aggregatorType).toBeDefined();
        expect(config.aggregatorEndpoint).toBeDefined();
        expect(config.gracePeriodMinutes).toBeGreaterThan(0);
        expect(config.geofenceRadiusMeters).toBeGreaterThan(0);
        expect(config.retryPolicy).toBeDefined();
        expect(config.retryPolicy?.maxRetries).toBeGreaterThan(0);
      }
    });

    it('should have unique aggregator endpoints for each state', () => {
      const endpoints = new Set<string>();
      const newStates: StateCode[] = ['OH', 'PA', 'GA', 'NC', 'AZ'];
      
      for (const state of newStates) {
        const config = getStateConfig(state);
        endpoints.add(config.aggregatorEndpoint);
      }
      
      // Each state should have its own endpoint
      expect(endpoints.size).toBe(5);
    });
  });
});

/**
 * Helper: Create mock EVV record for testing
 */
function createMockEVVRecord(state: StateCode): EVVRecord {
  const now = new Date('2025-11-04T10:00:00Z');
  const clockOutTime = new Date('2025-11-04T12:00:00Z');

  return {
    id: '11111111-1111-1111-1111-111111111111',
    visitId: '22222222-2222-2222-2222-222222222222',
    organizationId: '33333333-3333-3333-3333-333333333333',
    branchId: '44444444-4444-4444-4444-444444444444',
    clientId: '55555555-5555-5555-5555-555555555555',
    caregiverId: '66666666-6666-6666-6666-666666666666',
    
    serviceTypeCode: 'T1019',
    serviceTypeName: 'Personal Care Services',
    
    clientName: 'Test Client',
    clientMedicaidId: 'MED123456',
    
    caregiverName: 'Test Caregiver',
    caregiverEmployeeId: 'EMP001',
    caregiverNationalProviderId: '1234567890',
    
    serviceDate: new Date('2025-11-04'),
    
    serviceAddress: {
      line1: '123 Main St',
      city: getStateCityExample(state),
      state: state,
      postalCode: getStateZipExample(state),
      country: 'US',
      latitude: getStateLatitudeExample(state),
      longitude: getStateLongitudeExample(state),
      geofenceRadius: 100,
      addressVerified: true,
    },
    
    clockInTime: now,
    clockOutTime: clockOutTime,
    totalDuration: 120, // 2 hours
    
    clockInVerification: {
      latitude: getStateLatitudeExample(state),
      longitude: getStateLongitudeExample(state),
      accuracy: 50,
      timestamp: now,
      timestampSource: 'GPS',
      isWithinGeofence: true,
      distanceFromAddress: 25,
      geofencePassed: true,
      deviceId: 'device123',
      deviceModel: 'iPhone 14',
      deviceOS: 'iOS 17',
      appVersion: '1.0.0',
      method: 'GPS',
      locationSource: 'GPS_SATELLITE',
      mockLocationDetected: false,
      verificationPassed: true,
    },
    
    clockOutVerification: {
      latitude: getStateLatitudeExample(state),
      longitude: getStateLongitudeExample(state),
      accuracy: 50,
      timestamp: clockOutTime,
      timestampSource: 'GPS',
      isWithinGeofence: true,
      distanceFromAddress: 30,
      geofencePassed: true,
      deviceId: 'device123',
      deviceModel: 'iPhone 14',
      deviceOS: 'iOS 17',
      appVersion: '1.0.0',
      method: 'GPS',
      locationSource: 'GPS_SATELLITE',
      mockLocationDetected: false,
      verificationPassed: true,
    },
    
    recordStatus: 'COMPLETE',
    verificationLevel: 'FULL',
    complianceFlags: ['COMPLIANT'],
    integrityHash: 'hash123',
    integrityChecksum: 'checksum123',
    
    recordedAt: now,
    recordedBy: '77777777-7777-7777-7777-777777777777',
    syncMetadata: {
      syncId: '88888888-8888-8888-8888-888888888888',
      lastSyncedAt: now,
      syncStatus: 'SYNCED',
    },
    
    createdAt: now,
    createdBy: '77777777-7777-7777-7777-777777777777',
    updatedAt: now,
    updatedBy: '77777777-7777-7777-7777-777777777777',
    version: 1,
  };
}

/**
 * Helper: Get example city for state (for realistic addresses)
 */
function getStateCityExample(state: StateCode): string {
  const cities: Record<StateCode, string> = {
    TX: 'Austin',
    FL: 'Tampa',
    OH: 'Columbus',
    PA: 'Philadelphia',
    GA: 'Atlanta',
    NC: 'Raleigh',
    AZ: 'Phoenix',
  };
  return cities[state];
}

/**
 * Helper: Get example ZIP code for state
 */
function getStateZipExample(state: StateCode): string {
  const zips: Record<StateCode, string> = {
    TX: '78701',
    FL: '33601',
    OH: '43215',
    PA: '19101',
    GA: '30301',
    NC: '27601',
    AZ: '85001',
  };
  return zips[state];
}

/**
 * Helper: Get example latitude for state (state capital coordinates)
 */
function getStateLatitudeExample(state: StateCode): number {
  const lats: Record<StateCode, number> = {
    TX: 30.2672, // Austin
    FL: 27.9506, // Tampa
    OH: 39.9612, // Columbus
    PA: 39.9526, // Philadelphia
    GA: 33.7490, // Atlanta
    NC: 35.7796, // Raleigh
    AZ: 33.4484, // Phoenix
  };
  return lats[state];
}

/**
 * Helper: Get example longitude for state
 */
function getStateLongitudeExample(state: StateCode): number {
  const lngs: Record<StateCode, number> = {
    TX: -97.7431, // Austin
    FL: -82.4572, // Tampa
    OH: -82.9988, // Columbus
    PA: -75.1652, // Philadelphia
    GA: -84.3880, // Atlanta
    NC: -78.6382, // Raleigh
    AZ: -112.0740, // Phoenix
  };
  return lngs[state];
}
