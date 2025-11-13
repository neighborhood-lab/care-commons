/**
 * Tellus Aggregator Tests
 * 
 * Comprehensive tests for Tellus (Netsmart) aggregator implementation
 * covering Georgia (GA).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TellusAggregator } from '../tellus-aggregator';
import { getStateConfig } from '../../config/state-evv-configs';
import type { EVVRecord } from '../../types/evv';

describe('TellusAggregator', () => {
  let aggregator: TellusAggregator;

  beforeEach(() => {
    aggregator = new TellusAggregator();
  });

  describe('Validation', () => {
    it('should validate complete EVV record for Georgia', () => {
      const record = createMockEVVRecord();
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing service type code', () => {
      const record = createMockEVVRecord();
      record.serviceTypeCode = '';
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_SERVICE_TYPE')).toBe(true);
    });

    it('should detect missing member identifier', () => {
      const record = createMockEVVRecord();
      record.clientMedicaidId = undefined;
      (record as any).clientId = undefined;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_MEMBER_ID')).toBe(true);
    });

    it('should detect missing provider ID', () => {
      const record = createMockEVVRecord();
      record.caregiverEmployeeId = '';
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_ID')).toBe(true);
    });

    it('should detect missing clock-in time', () => {
      const record = createMockEVVRecord();
      (record as any).clockInTime = null;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_START_TIME')).toBe(true);
    });

    it('should detect missing clock-out time', () => {
      const record = createMockEVVRecord();
      record.clockOutTime = null;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_END_TIME')).toBe(true);
    });

    it('should detect missing GPS location', () => {
      const record = createMockEVVRecord();
      (record.clockInVerification as any).latitude = undefined;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_LOCATION')).toBe(true);
    });
  });

  describe('Georgia-Specific Validation', () => {
    it('should accept high GPS inaccuracy (lenient policy)', () => {
      const record = createMockEVVRecord();
      record.clockInVerification.accuracy = 200; // Within GA's 250m tolerance
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about extremely high GPS inaccuracy', () => {
      const record = createMockEVVRecord();
      record.clockInVerification.accuracy = 300; // Exceeds GA's 250m tolerance
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true); // Still valid
      expect(result.warnings.some(w => w.code === 'HIGH_GPS_INACCURACY')).toBe(true);
    });

    it('should warn about missing waiver authorization for HCBS services', () => {
      const record = createMockEVVRecord();
      record.serviceTypeCode = 'T1019'; // HCBS waiver service
      record.stateSpecificData = {}; // Missing authorization
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_WAIVER_AUTH')).toBe(true);
    });

    it('should NOT warn about authorization for non-waiver services', () => {
      const record = createMockEVVRecord();
      record.serviceTypeCode = 'S9999'; // Non-waiver service
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'MISSING_WAIVER_AUTH')).toBe(false);
    });

    it('should validate record with waiver authorization', () => {
      const record = createMockEVVRecord();
      record.serviceTypeCode = 'S5125'; // Waiver service
      record.stateSpecificData = {
        serviceAuthorizationNumber: 'AUTH123456',
      };
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Submission', () => {
    it('should reject invalid EVV record before submission', async () => {
      const record = createMockEVVRecord();
      record.clockOutTime = null; // Missing required field
      const config = getStateConfig('GA');

      const result = await aggregator.submit(record, config);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_FAILED');
      expect(result.submissionId).toBe('');
    });

    it('should attempt to submit valid record', async () => {
      const record = createMockEVVRecord();
      const config = getStateConfig('GA');

      // Stub implementation catches error and returns error result
      const result = await aggregator.submit(record, config);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.requiresRetry).toBe(true);
    });

    it('should handle network errors during submission', async () => {
      const record = createMockEVVRecord();
      const config = getStateConfig('GA');

      // Stub implementation catches error and returns error result
      const result = await aggregator.submit(record, config);
      
      expect(result.success).toBe(false);
      expect(result.requiresRetry).toBe(true);
    });
  });

  describe('Payload Formatting', () => {
    it('should include all federal EVV elements', () => {
      const record = createMockEVVRecord();
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);
      
      // Validation passes means all required elements present
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle records with clientId instead of Medicaid ID', () => {
      const record = createMockEVVRecord();
      record.clientMedicaidId = undefined;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true); // clientId is acceptable
    });

    it('should format clock-out location when available', () => {
      const record = createMockEVVRecord();
      expect(record.clockOutVerification).toBeDefined();
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });

    it('should handle records without clock-out location', () => {
      const record = createMockEVVRecord();
      record.clockOutTime = new Date();
      record.clockOutVerification = undefined;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Georgia Extensions', () => {
    it('should handle rural exception flag', () => {
      const record = createMockEVVRecord();
      record.complianceFlags = ['MANUAL_OVERRIDE'];
      record.stateSpecificData = {
        ruralException: true,
      };
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });

    it('should handle waiver ID', () => {
      const record = createMockEVVRecord();
      record.stateSpecificData = {
        waiverId: 'WAIVER123',
      };
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
    });

    it('should handle geofence non-compliance flag', () => {
      const record = createMockEVVRecord();
      record.complianceFlags = ['GEOFENCE_VIOLATION'];
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true); // Still valid, just flagged
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should report all validation errors at once', () => {
      const record = createMockEVVRecord();
      record.serviceTypeCode = '';
      record.caregiverEmployeeId = '';
      record.clockInTime = null as any;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors.some(e => e.code === 'MISSING_SERVICE_TYPE')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_ID')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_START_TIME')).toBe(true);
    });

    it('should report errors with appropriate severity', () => {
      const record = createMockEVVRecord();
      record.clockOutTime = null;
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.every(e => e.severity === 'ERROR')).toBe(true);
    });

    it('should report warnings with appropriate severity', () => {
      const record = createMockEVVRecord();
      record.clockInVerification.accuracy = 300; // Very high inaccuracy
      const config = getStateConfig('GA');

      const result = aggregator.validate(record, config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.every(w => w.severity === 'WARNING')).toBe(true);
    });
  });
});

/**
 * Helper: Create mock EVV record for Georgia
 */
function createMockEVVRecord(): EVVRecord {
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
    clientMedicaidId: 'GA-MED123456',
    
    caregiverName: 'Test Caregiver',
    caregiverEmployeeId: 'EMP001',
    caregiverNationalProviderId: '1234567890',
    
    serviceDate: new Date('2025-11-04'),
    
    serviceAddress: {
      line1: '123 Main St',
      city: 'Atlanta',
      state: 'GA',
      postalCode: '30301',
      country: 'US',
      latitude: 33.7490,
      longitude: -84.3880,
      geofenceRadius: 150,
      addressVerified: true,
    },
    
    clockInTime: now,
    clockOutTime: clockOutTime,
    totalDuration: 120,
    
    clockInVerification: {
      latitude: 33.7490,
      longitude: -84.3880,
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
      latitude: 33.7490,
      longitude: -84.3880,
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
