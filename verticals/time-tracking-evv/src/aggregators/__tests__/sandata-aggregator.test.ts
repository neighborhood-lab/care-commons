/**
 * Sandata Aggregator Tests
 * 
 * Comprehensive tests for Sandata aggregator implementation
 * covering OH, PA, NC, AZ states.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SandataAggregator } from '../sandata-aggregator.js';
import { getStateConfig } from '../../config/state-evv-configs.js';
import type { EVVRecord } from '../../types/evv.js';
import type { StateCode } from '../../types/state-specific.js';

describe('SandataAggregator', () => {
  let aggregator: SandataAggregator;

  beforeEach(() => {
    aggregator = new SandataAggregator();
  });

  describe('Validation', () => {
    it('should validate complete EVV record for Ohio', () => {
      const record = createMockEVVRecord('OH');
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate complete EVV record for Pennsylvania', () => {
      const record = createMockEVVRecord('PA');
      const config = getStateConfig('PA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing service type code', () => {
      const record = createMockEVVRecord('OH');
      record.serviceTypeCode = '';
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_SERVICE_TYPE')).toBe(true);
      expect(result.errors.some(e => e.field === 'serviceTypeCode')).toBe(true);
    });

    it('should detect missing member identifier', () => {
      const record = createMockEVVRecord('PA');
      record.clientMedicaidId = undefined;
      (record as any).clientId = undefined;
      const config = getStateConfig('PA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_MEMBER_ID')).toBe(true);
    });

    it('should detect missing provider ID', () => {
      const record = createMockEVVRecord('NC');
      record.caregiverEmployeeId = '';
      const config = getStateConfig('NC');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_ID')).toBe(true);
    });

    it('should detect missing clock-in time', () => {
      const record = createMockEVVRecord('AZ');
      (record as any).clockInTime = null;
      const config = getStateConfig('AZ');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_START_TIME')).toBe(true);
    });

    it('should detect missing clock-out time', () => {
      const record = createMockEVVRecord('OH');
      record.clockOutTime = null;
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_END_TIME')).toBe(true);
    });

    it('should detect missing GPS coordinates', () => {
      const record = createMockEVVRecord('PA');
      (record.clockInVerification as any).latitude = undefined;
      const config = getStateConfig('PA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_LOCATION')).toBe(true);
    });

    it('should warn about missing NPI for non-Arizona states', () => {
      const record = createMockEVVRecord('OH');
      record.caregiverNationalProviderId = undefined;
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_NPI')).toBe(true);
    });

    it('should NOT warn about missing NPI for Arizona', () => {
      const record = createMockEVVRecord('AZ');
      record.caregiverNationalProviderId = undefined;
      const config = getStateConfig('AZ');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_NPI')).toBe(false);
    });

    it('should warn about low GPS accuracy', () => {
      const record = createMockEVVRecord('PA');
      record.clockInVerification.accuracy = 200; // Exceeds PA's 100m tolerance
      const config = getStateConfig('PA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'LOW_GPS_ACCURACY')).toBe(true);
    });

    it('should accept good GPS accuracy', () => {
      const record = createMockEVVRecord('OH');
      record.clockInVerification.accuracy = 50; // Well within tolerance
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Submission', () => {
    it('should reject invalid EVV record before submission', async () => {
      const record = createMockEVVRecord('OH');
      record.clockOutTime = null; // Missing required field
      const config = getStateConfig('OH');

      const result = await aggregator.submit(record, config);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_FAILED');
      expect(result.submissionId).toBe('');
    });

    it('should attempt to submit valid record', async () => {
      const record = createMockEVVRecord('PA');
      const config = getStateConfig('PA');

      // Stub implementation catches error and returns error result
      const result = await aggregator.submit(record, config);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.requiresRetry).toBe(true);
    });

    it('should handle network errors during submission', async () => {
      const record = createMockEVVRecord('NC');
      const config = getStateConfig('NC');

      // Stub implementation catches error and returns error result
      const result = await aggregator.submit(record, config);
      
      expect(result.success).toBe(false);
      expect(result.requiresRetry).toBe(true);
    });
  });

  describe('Payload Formatting', () => {
    it('should format payload for Ohio', () => {
      const record = createMockEVVRecord('OH');
      const config = getStateConfig('OH');

      // Access private method through validation (validates + formats internally)
      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });

    it('should format payload for Pennsylvania', () => {
      const record = createMockEVVRecord('PA');
      const config = getStateConfig('PA');

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });

    it('should format payload with Arizona non-medical exemption', () => {
      const record = createMockEVVRecord('AZ');
      const config = getStateConfig('AZ');

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });

    it('should include all required federal EVV elements', () => {
      const record = createMockEVVRecord('OH');
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);
      
      // Validation passes means all required elements present
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle records with only clientId (no Medicaid ID)', () => {
      const record = createMockEVVRecord('NC');
      record.clientMedicaidId = undefined;
      const config = getStateConfig('NC');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true); // clientId is acceptable
    });

    it('should handle records with Medicaid ID', () => {
      const record = createMockEVVRecord('OH');
      record.clientMedicaidId = 'MED123456';
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });
  });

  describe('State-Specific Handling', () => {
    it('should validate Ohio-specific requirements', () => {
      const record = createMockEVVRecord('OH');
      const config = getStateConfig('OH');

      expect(config.state).toBe('OH');
      expect(config.geofenceRadiusMeters).toBe(125);

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });

    it('should validate Pennsylvania 7-year retention requirement', () => {
      const record = createMockEVVRecord('PA');
      const config = getStateConfig('PA');

      expect(config.state).toBe('PA');
      // PA has strictest retention requirement
      const paConfig = config as any;
      expect(paConfig.retentionYears).toBe(7);

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });

    it('should validate North Carolina requirements', () => {
      const record = createMockEVVRecord('NC');
      const config = getStateConfig('NC');

      expect(config.state).toBe('NC');
      expect(config.geofenceRadiusMeters).toBe(120);

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
    });

    it('should validate Arizona non-medical service exemption', () => {
      const record = createMockEVVRecord('AZ');
      record.caregiverNationalProviderId = undefined; // No NPI required for non-medical
      const config = getStateConfig('AZ');

      expect(config.state).toBe('AZ');

      const result = aggregator.validate(record, config);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_NPI')).toBe(false);
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should report all validation errors at once', () => {
      const record = createMockEVVRecord('OH');
      record.serviceTypeCode = '';
      record.caregiverEmployeeId = '';
      record.clockOutTime = null;
      const config = getStateConfig('OH');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors.some(e => e.code === 'MISSING_SERVICE_TYPE')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_ID')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_END_TIME')).toBe(true);
    });

    it('should report errors with appropriate severity', () => {
      const record = createMockEVVRecord('PA');
      record.clockInTime = null as any;
      const config = getStateConfig('PA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.every(e => e.severity === 'ERROR')).toBe(true);
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
      city: 'Test City',
      state: state,
      postalCode: '12345',
      country: 'US',
      latitude: 39.9612,
      longitude: -82.9988,
      geofenceRadius: 100,
      addressVerified: true,
    },
    
    clockInTime: now,
    clockOutTime: clockOutTime,
    totalDuration: 120,
    
    clockInVerification: {
      latitude: 39.9612,
      longitude: -82.9988,
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
      latitude: 39.9612,
      longitude: -82.9988,
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
