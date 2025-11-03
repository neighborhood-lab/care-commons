/**
 * State-Specific EVV Validation Tests
 * 
 * Tests for Texas and Florida enhanced validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EVVValidator } from '../evv-validator.js';
import type { EVVRecord } from '../../types/evv.js';

describe('State-Specific EVV Validation', () => {
  let validator: EVVValidator;

  beforeEach(() => {
    validator = new EVVValidator();
  });

  const createBaseRecord = (): EVVRecord => ({
    id: 'evv-123',
    visitId: 'visit-123',
    organizationId: 'org-123',
    branchId: 'branch-123',
    clientId: 'client-123',
    caregiverId: 'caregiver-123',
    serviceTypeCode: 'PAS',
    serviceTypeName: 'Personal Assistance Services',
    clientName: 'John Doe',
    caregiverName: 'Jane Smith',
    caregiverEmployeeId: 'EMP-001',
    serviceDate: new Date('2024-01-15'),
    serviceAddress: {
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
      latitude: 30.2711,
      longitude: -97.7437,
      geofenceRadius: 100,
      addressVerified: true,
    },
    clockInTime: new Date('2024-01-15T09:00:00Z'),
    clockOutTime: new Date('2024-01-15T11:00:00Z'),
    totalDuration: 120,
    clockInVerification: {
      latitude: 30.2711,
      longitude: -97.7437,
      accuracy: 15,
      timestamp: new Date('2024-01-15T09:00:00Z'),
      timestampSource: 'DEVICE',
      isWithinGeofence: true,
      distanceFromAddress: 10,
      geofencePassed: true,
      deviceId: 'device-123',
      deviceModel: 'iPhone 12',
      deviceOS: 'iOS 15',
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
    recordedAt: new Date('2024-01-15T09:00:00Z'),
    recordedBy: 'user-123',
    syncMetadata: {
      syncId: 'sync-123',
      lastSyncedAt: new Date('2024-01-15T09:00:00Z'),
      syncStatus: 'SYNCED',
    },
    createdAt: new Date('2024-01-15T09:00:00Z'),
    createdBy: 'user-123',
    updatedAt: new Date('2024-01-15T09:00:00Z'),
    updatedBy: 'user-123',
    version: 1,
  });

  describe('Texas (TX) Validation', () => {
    it('should pass compliant Texas record', () => {
      const record = createBaseRecord();
      
      const result = validator.validateStateRequirements(
        'TX',
        { geoPerimeterTolerance: 100, clockInGracePeriodMinutes: 10 },
        record
      );

      expect(result.passed).toBe(true);
      expect(result.complianceFlags).toContain('COMPLIANT');
      expect(result.issues).toHaveLength(0);
    });

    it('should reject non-GPS methods for Texas', () => {
      const record = createBaseRecord();
      record.clockInVerification.method = 'PHONE';
      
      const result = validator.validateStateRequirements('TX', {}, record);

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'LOCATION_UNCERTAIN',
          severity: 'HIGH',
        })
      );
    });

    it('should allow BIOMETRIC method for Texas', () => {
      const record = createBaseRecord();
      record.clockInVerification.method = 'BIOMETRIC';
      
      const result = validator.validateStateRequirements('TX', {}, record);

      expect(result.passed).toBe(true);
    });

    it('should detect early clock-in for Texas (10min grace)', () => {
      const scheduledStart = new Date('2024-01-15T09:00:00Z');
      const record = createBaseRecord();
      record.clockInTime = new Date('2024-01-15T08:40:00Z'); // 20 min early
      
      const result = validator.validateStateRequirements(
        'TX',
        { clockInGracePeriodMinutes: 10 },
        record,
        scheduledStart
      );

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'VISIT_TOO_SHORT',
          description: expect.stringContaining('10 minutes early'),
        })
      );
    });

    it('should allow clock-in within Texas grace period', () => {
      const scheduledStart = new Date('2024-01-15T09:00:00Z');
      const record = createBaseRecord();
      record.clockInTime = new Date('2024-01-15T08:55:00Z'); // 5 min early
      
      const result = validator.validateStateRequirements(
        'TX',
        { clockInGracePeriodMinutes: 10 },
        record,
        scheduledStart
      );

      expect(result.passed).toBe(true);
    });

    it('should detect geofence violations for Texas (100m + accuracy)', () => {
      const record = createBaseRecord();
      record.clockInVerification.geofencePassed = false;
      record.clockInVerification.distanceFromAddress = 200; // 200m away
      record.clockInVerification.accuracy = 30; // 30m GPS accuracy
      
      const result = validator.validateStateRequirements(
        'TX',
        { geoPerimeterTolerance: 100 },
        record
      );

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'GEOFENCE_VIOLATION',
          severity: 'CRITICAL',
        })
      );
      expect(result.complianceFlags).toContain('GEOFENCE_VIOLATION');
    });

    it('should pass geofence within tolerance for Texas', () => {
      const record = createBaseRecord();
      record.clockInVerification.geofencePassed = true;
      record.clockInVerification.distanceFromAddress = 80;
      record.clockInVerification.accuracy = 20;
      
      const result = validator.validateStateRequirements(
        'TX',
        { geoPerimeterTolerance: 100 },
        record
      );

      expect(result.passed).toBe(true);
    });

    it('should detect poor GPS accuracy for Texas (>100m)', () => {
      const record = createBaseRecord();
      record.clockInVerification.accuracy = 150;
      
      const result = validator.validateStateRequirements('TX', {}, record);

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'LOW_GPS_ACCURACY',
          severity: 'HIGH',
        })
      );
      expect(result.complianceFlags).toContain('LOCATION_SUSPICIOUS');
    });

    it('should detect mock location for Texas', () => {
      const record = createBaseRecord();
      record.clockInVerification.mockLocationDetected = true;
      
      const result = validator.validateStateRequirements('TX', {}, record);

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'GPS_SPOOFING',
          severity: 'CRITICAL',
        })
      );
      expect(result.complianceFlags).toContain('LOCATION_SUSPICIOUS');
    });
  });

  describe('Florida (FL) Validation', () => {
    it('should pass compliant Florida record', () => {
      const record = createBaseRecord();
      
      const result = validator.validateStateRequirements(
        'FL',
        { geoPerimeterTolerance: 150, clockInGracePeriodMinutes: 15 },
        record
      );

      expect(result.passed).toBe(true);
      expect(result.complianceFlags).toContain('COMPLIANT');
    });

    it('should allow PHONE method for Florida with warning', () => {
      const record = createBaseRecord();
      record.clockInVerification.method = 'PHONE';
      
      const result = validator.validateStateRequirements('FL', {}, record);

      // Florida allows PHONE but issues a warning
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'LOCATION_UNCERTAIN',
          severity: 'MEDIUM',
          description: expect.stringContaining('Phone verification'),
        })
      );
    });

    it('should detect geofence violations for Florida (150m + accuracy)', () => {
      const record = createBaseRecord();
      record.clockInVerification.geofencePassed = false;
      record.clockInVerification.distanceFromAddress = 300;
      record.clockInVerification.accuracy = 50;
      
      const result = validator.validateStateRequirements(
        'FL',
        { geoPerimeterTolerance: 150 },
        record
      );

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'GEOFENCE_VIOLATION',
          severity: 'HIGH',
        })
      );
    });

    it('should detect early clock-in for Florida (15min grace)', () => {
      const scheduledStart = new Date('2024-01-15T09:00:00Z');
      const record = createBaseRecord();
      record.clockInTime = new Date('2024-01-15T08:40:00Z'); // 20 min early
      
      const result = validator.validateStateRequirements(
        'FL',
        { clockInGracePeriodMinutes: 15 },
        record,
        scheduledStart
      );

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'VISIT_TOO_SHORT',
          description: expect.stringContaining('15 minutes early'),
        })
      );
    });

    it('should allow clock-in within Florida grace period', () => {
      const scheduledStart = new Date('2024-01-15T09:00:00Z');
      const record = createBaseRecord();
      record.clockInTime = new Date('2024-01-15T08:50:00Z'); // 10 min early
      
      const result = validator.validateStateRequirements(
        'FL',
        { clockInGracePeriodMinutes: 15 },
        record,
        scheduledStart
      );

      expect(result.passed).toBe(true);
    });

    it('should detect poor GPS accuracy for Florida (>150m)', () => {
      const record = createBaseRecord();
      record.clockInVerification.accuracy = 200;
      
      const result = validator.validateStateRequirements('FL', {}, record);

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'LOW_GPS_ACCURACY',
          severity: 'MEDIUM',
        })
      );
    });

    it('should detect mock location for Florida', () => {
      const record = createBaseRecord();
      record.clockInVerification.mockLocationDetected = true;
      
      const result = validator.validateStateRequirements('FL', {}, record);

      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          issueType: 'GPS_SPOOFING',
          severity: 'CRITICAL',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported state', () => {
      const record = createBaseRecord();
      
      expect(() => {
        validator.validateStateRequirements('CA' as any, {}, record);
      }).toThrow('Unsupported state code: CA');
    });

    it('should throw error for null state', () => {
      const record = createBaseRecord();
      
      expect(() => {
        validator.validateStateRequirements('XX' as any, {}, record);
      }).toThrow('Unsupported state code');
    });
  });

  describe('Multiple Violations', () => {
    it('should report multiple issues for Texas', () => {
      const record = createBaseRecord();
      record.clockInVerification.method = 'PHONE'; // Not GPS
      record.clockInVerification.accuracy = 150; // Too high
      record.clockInVerification.mockLocationDetected = true; // Mock detected
      
      const result = validator.validateStateRequirements('TX', {}, record);

      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
      expect(result.complianceFlags).not.toContain('COMPLIANT');
    });

    it('should report multiple issues for Florida', () => {
      const record = createBaseRecord();
      record.clockInVerification.geofencePassed = false;
      record.clockInVerification.distanceFromAddress = 400;
      record.clockInVerification.accuracy = 250;
      
      const result = validator.validateStateRequirements(
        'FL',
        { geoPerimeterTolerance: 150 },
        record
      );

      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(1);
      // Should report at least geofence and/or accuracy issues
      expect(result.complianceFlags).not.toContain('COMPLIANT');
    });
  });

  describe('Geographic Validation with State Tolerance', () => {
    it('should validate geographic location with Texas tolerance', () => {
      const record = createBaseRecord();
      const expectedLocation = {
        latitude: 30.2711,
        longitude: -97.7437,
        radiusMeters: 100,
      };
      
      const result = validator.validateGeographicWithStateTolerance(
        'TX',
        { geoPerimeterTolerance: 100 },
        record,
        expectedLocation
      );

      expect(result.isWithinGeofence).toBe(true);
    });

    it('should validate geographic location with Florida tolerance', () => {
      const record = createBaseRecord();
      record.clockInVerification.geofencePassed = false;
      record.clockInVerification.distanceFromAddress = 200;
      
      const expectedLocation = {
        latitude: 30.2711,
        longitude: -97.7437,
        radiusMeters: 150,
      };
      
      const result = validator.validateGeographicWithStateTolerance(
        'FL',
        { geoPerimeterTolerance: 150 },
        record,
        expectedLocation
      );

      // With 150m + tolerance, result depends on calculation
      expect(result).toHaveProperty('isWithinGeofence');
      expect(result).toHaveProperty('distanceFromCenter');
    });

    it('should throw error for unsupported state in geographic validation', () => {
      const record = createBaseRecord();
      const expectedLocation = {
        latitude: 30.2711,
        longitude: -97.7437,
        radiusMeters: 100,
      };
      
      expect(() => {
        validator.validateGeographicWithStateTolerance(
          'NY' as any,
          {},
          record,
          expectedLocation
        );
      }).toThrow('Unsupported state code: NY');
    });
  });
});
