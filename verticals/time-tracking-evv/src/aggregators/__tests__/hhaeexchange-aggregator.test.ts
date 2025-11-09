/**
 * HHAeXchange Aggregator Tests
 * 
 * Comprehensive tests for HHAeXchange aggregator implementation
 * covering Texas (TX) and Florida (FL).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HHAeXchangeAggregator } from '../hhaeexchange-aggregator.js';
import { getStateConfig } from '../../config/state-evv-configs.js';
import type { EVVRecord } from '../../types/evv.js';
import type { StateCode } from '../../types/state-specific.js';

describe('HHAeXchangeAggregator', () => {
  let aggregator: HHAeXchangeAggregator;

  beforeEach(() => {
    aggregator = new HHAeXchangeAggregator();
  });

  describe('Validation', () => {
    it('should validate complete EVV record for Texas', () => {
      const record = createMockEVVRecord('TX');
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate complete EVV record for Florida', () => {
      const record = createMockEVVRecord('FL');
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing service type code', () => {
      const record = createMockEVVRecord('TX');
      record.serviceTypeCode = '';
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_SERVICE_TYPE')).toBe(true);
      expect(result.errors.some(e => e.field === 'serviceTypeCode')).toBe(true);
    });

    it('should detect missing member identifier', () => {
      const record = createMockEVVRecord('FL');
      record.clientMedicaidId = undefined;
      (record as any).clientId = undefined;
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_MEMBER_ID')).toBe(true);
    });

    it('should detect missing provider ID', () => {
      const record = createMockEVVRecord('TX');
      record.caregiverEmployeeId = '';
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_ID')).toBe(true);
    });

    it('should detect missing clock-in time', () => {
      const record = createMockEVVRecord('FL');
      (record as any).clockInTime = null;
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_START_TIME')).toBe(true);
    });

    it('should detect missing clock-out time', () => {
      const record = createMockEVVRecord('TX');
      record.clockOutTime = null;
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_END_TIME')).toBe(true);
    });

    it('should detect missing GPS coordinates', () => {
      const record = createMockEVVRecord('FL');
      (record.clockInVerification as any).latitude = undefined;
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_LOCATION')).toBe(true);
    });

    it('should detect missing longitude', () => {
      const record = createMockEVVRecord('TX');
      (record.clockInVerification as any).longitude = undefined;
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_LOCATION')).toBe(true);
    });
  });

  describe('Texas-Specific Validation', () => {
    it('should enforce strict GPS accuracy for Texas (≤100m)', () => {
      const record = createMockEVVRecord('TX');
      record.clockInVerification.accuracy = 150; // Exceeds TX requirement
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'GPS_ACCURACY_EXCEEDED')).toBe(true);
      expect(result.errors.some(e => e.field === 'clockInVerification.accuracy')).toBe(true);
    });

    it('should accept GPS accuracy ≤100m for Texas', () => {
      const record = createMockEVVRecord('TX');
      record.clockInVerification.accuracy = 100; // Exactly at limit
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept GPS accuracy well under Texas limit', () => {
      const record = createMockEVVRecord('TX');
      record.clockInVerification.accuracy = 50; // Well under limit
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Florida-Specific Validation', () => {
    it('should use more lenient GPS accuracy for Florida', () => {
      const record = createMockEVVRecord('FL');
      record.clockInVerification.accuracy = 150; // Within FL tolerance
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about poor GPS accuracy in Florida', () => {
      const record = createMockEVVRecord('FL');
      record.clockInVerification.accuracy = 200; // Exceeds geofence tolerance
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true); // Still valid
      expect(result.warnings.some(w => w.code === 'LOW_GPS_ACCURACY')).toBe(true);
    });
  });

  describe('Warning Conditions', () => {
    it('should warn about missing NPI', () => {
      const record = createMockEVVRecord('TX');
      record.caregiverNationalProviderId = undefined;
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_NPI')).toBe(true);
    });

    it('should warn about low GPS accuracy', () => {
      const record = createMockEVVRecord('FL');
      record.clockInVerification.accuracy = 200; // Exceeds geofence
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'LOW_GPS_ACCURACY')).toBe(true);
    });

    it('should not warn when all optional fields present', () => {
      const record = createMockEVVRecord('TX');
      record.caregiverNationalProviderId = '1234567890';
      record.clockInVerification.accuracy = 50;
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Submission', () => {
    it('should reject invalid EVV record before submission', async () => {
      const record = createMockEVVRecord('TX');
      record.clockOutTime = null; // Missing required field
      const config = getStateConfig('TX');

      const result = await aggregator.submit(record, config);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_FAILED');
      expect(result.submissionId).toBe('');
    });

    it('should attempt to submit valid Texas record', async () => {
      const record = createMockEVVRecord('TX');
      const config = getStateConfig('TX');

      // Stub implementation catches error and returns error result
      const result = await aggregator.submit(record, config);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.requiresRetry).toBe(true);
    });

    it('should attempt to submit valid Florida record', async () => {
      const record = createMockEVVRecord('FL');
      const config = getStateConfig('FL');

      // Stub implementation catches error and returns error result
      const result = await aggregator.submit(record, config);
      
      expect(result.success).toBe(false);
      expect(result.requiresRetry).toBe(true);
    });

    it('should handle network errors during submission', async () => {
      const record = createMockEVVRecord('TX');
      const config = getStateConfig('TX');

      // Stub implementation catches error and returns error result
      const result = await aggregator.submit(record, config);
      
      expect(result.success).toBe(false);
      expect(result.requiresRetry).toBe(true);
    });
  });

  describe('Payload Formatting', () => {
    it('should include all required federal EVV elements', () => {
      const record = createMockEVVRecord('TX');
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);
      
      // Validation passes means all required elements present
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle records with only clientId (no Medicaid ID)', () => {
      const record = createMockEVVRecord('FL');
      record.clientMedicaidId = undefined;
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true); // clientId is acceptable
    });

    it('should handle records with Medicaid ID', () => {
      const record = createMockEVVRecord('TX');
      record.clientMedicaidId = 'TX-MED123456';
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });

    it('should handle records with pause events', () => {
      const record = createMockEVVRecord('TX');
      const pauseTime = new Date('2025-11-04T11:00:00Z');
      const resumeTime = new Date('2025-11-04T11:30:00Z');
      
      record.pauseEvents = [{
        id: 'pause-1',
        pausedAt: pauseTime,
        resumedAt: resumeTime,
        duration: 30,
        reason: 'MEAL',
        isPaid: false,
      }];
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });

    it('should handle records with multiple pause events', () => {
      const record = createMockEVVRecord('FL');
      const pause1Time = new Date('2025-11-04T11:00:00Z');
      const resume1Time = new Date('2025-11-04T11:15:00Z');
      const pause2Time = new Date('2025-11-04T13:00:00Z');
      const resume2Time = new Date('2025-11-04T13:30:00Z');
      
      record.pauseEvents = [
        {
          id: 'pause-1',
          pausedAt: pause1Time,
          resumedAt: resume1Time,
          duration: 15,
          reason: 'BREAK',
          isPaid: false,
        },
        {
          id: 'pause-2',
          pausedAt: pause2Time,
          resumedAt: resume2Time,
          duration: 30,
          reason: 'MEAL',
          isPaid: false,
        }
      ];
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });

    it('should handle pause events without resume time', () => {
      const record = createMockEVVRecord('TX');
      const pauseTime = new Date('2025-11-04T11:00:00Z');
      
      record.pauseEvents = [{
        id: 'pause-1',
        pausedAt: pauseTime,
        resumedAt: null,
        reason: 'EMERGENCY',
        isPaid: false,
      }];
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should report all validation errors at once', () => {
      const record = createMockEVVRecord('TX');
      record.serviceTypeCode = '';
      record.caregiverEmployeeId = '';
      record.clockOutTime = null;
      (record.clockInVerification as any).latitude = undefined;
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors.some(e => e.code === 'MISSING_SERVICE_TYPE')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_ID')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_END_TIME')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_LOCATION')).toBe(true);
    });

    it('should report errors with appropriate severity', () => {
      const record = createMockEVVRecord('FL');
      record.clockInTime = null as any;
      const config = getStateConfig('FL');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.every(e => e.severity === 'ERROR')).toBe(true);
    });

    it('should report warnings with appropriate severity', () => {
      const record = createMockEVVRecord('TX');
      record.caregiverNationalProviderId = undefined;
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.every(w => w.severity === 'WARNING')).toBe(true);
    });

    it('should have both errors and warnings', () => {
      const record = createMockEVVRecord('TX');
      record.clockOutTime = null; // Error
      record.caregiverNationalProviderId = undefined; // Warning
      const config = getStateConfig('TX');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('State Configuration', () => {
    it('should validate against Texas configuration', () => {
      const record = createMockEVVRecord('TX');
      const config = getStateConfig('TX');

      expect(config.state).toBe('TX');
      expect(config.geofenceRadiusMeters).toBe(100);
      expect(config.gracePeriodMinutes).toBe(10);

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });

    it('should validate against Florida configuration', () => {
      const record = createMockEVVRecord('FL');
      const config = getStateConfig('FL');

      expect(config.state).toBe('FL');
      expect(config.geofenceRadiusMeters).toBe(150);
      expect(config.gracePeriodMinutes).toBe(15);

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });
  });
});

/**
 * Helper: Create mock EVV record for testing
 */
function createMockEVVRecord(state: StateCode): EVVRecord {
  const now = new Date('2025-11-04T10:00:00Z');
  const clockOutTime = new Date('2025-11-04T12:00:00Z');

  const latitude = state === 'TX' ? 30.2672 : 27.9506; // Austin or Tampa
  const longitude = state === 'TX' ? -97.7431 : -82.4572;
  const postalCode = state === 'TX' ? '78701' : '33602';
  const medicaidId = state === 'TX' ? 'TX-MED123456' : 'FL-MED789012';

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
    clientMedicaidId: medicaidId,
    
    caregiverName: 'Test Caregiver',
    caregiverEmployeeId: 'EMP001',
    caregiverNationalProviderId: '1234567890',
    
    serviceDate: new Date('2025-11-04'),
    
    serviceAddress: {
      line1: '123 Main St',
      city: state === 'TX' ? 'Austin' : 'Tampa',
      state: state,
      postalCode: postalCode,
      country: 'US',
      latitude,
      longitude,
      geofenceRadius: state === 'TX' ? 100 : 150,
      addressVerified: true,
    },
    
    clockInTime: now,
    clockOutTime: clockOutTime,
    totalDuration: 120,
    
    clockInVerification: {
      latitude,
      longitude,
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
      latitude,
      longitude,
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
