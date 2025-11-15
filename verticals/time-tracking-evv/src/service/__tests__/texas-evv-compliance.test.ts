/**
 * Texas EVV Compliance Service Tests
 *
 * Integration tests for comprehensive Texas HHSC EVV compliance checking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TexasEVVComplianceService,
  createTexasComplianceService,
} from '../texas-evv-compliance';
import type { EVVRecord } from '../../types/evv';
import type { LocationCoordinates } from '../texas-geofence-validator';

describe('TexasEVVComplianceService', () => {
  let complianceService: TexasEVVComplianceService;

  // Test data - Austin, Texas location
  const expectedLocation: LocationCoordinates = {
    latitude: 30.2672,
    longitude: -97.7431,
  };

  const scheduledStartTime = new Date('2025-11-14T09:00:00Z');
  const scheduledEndTime = new Date('2025-11-14T13:00:00Z');

  beforeEach(() => {
    complianceService = createTexasComplianceService();
  });

  describe('Scenario 1: Compliant Visit (Perfect Clock-In/Out)', () => {
    it('should validate fully compliant visit as COMPLIANT', () => {
      const evvRecord: EVVRecord = createCompliantEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.isCompliant).toBe(true);
      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.requiresAction).toBe(false);
      expect(result.flags).toContain('COMPLIANT');
      expect(result.flags).toContain('AGGREGATOR_READY');
      expect(result.summary).toContain('fully compliant');
      expect(result.summary).toContain('ready for submission');
      expect(result.recommendations).toHaveLength(0);
    });

    it('should validate geofence as COMPLIANT', () => {
      const evvRecord = createCompliantEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.geofenceValidation.isValid).toBe(true);
      expect(result.geofenceValidation.complianceLevel).toBe('COMPLIANT');
      expect(result.geofenceValidation.validationType).toBe('WITHIN_BASE_RADIUS');
      expect(result.geofenceValidation.distanceMeters).toBeLessThan(1);
    });

    it('should validate all six elements as present and valid', () => {
      const evvRecord = createCompliantEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.elementsValidation.isValid).toBe(true);
      expect(result.elementsValidation.allElementsPresent).toBe(true);
      expect(result.elementsValidation.federalCompliant).toBe(true);
      expect(result.elementsValidation.texasCompliant).toBe(true);
      expect(result.elementsValidation.missingElements).toHaveLength(0);
    });

    it('should validate grace period as ON_TIME', () => {
      const evvRecord = createCompliantEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.gracePeriodValidation.isValid).toBe(true);
      expect(result.gracePeriodValidation.clockInStatus).toBe('ON_TIME');
      expect(result.gracePeriodValidation.clockOutStatus).toBe('ON_TIME');
    });
  });

  describe('Scenario 2: Geofence Warning (Barely Outside Range)', () => {
    it('should validate visit with geofence warning as WARNING', () => {
      const evvRecord = createGeofenceWarningEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.isCompliant).toBe(false);
      expect(result.complianceLevel).toBe('WARNING');
      expect(result.requiresAction).toBe(false);
      expect(result.flags).toContain('GEOFENCE_WARNING');
      expect(result.flags).not.toContain('COMPLIANT');
      expect(result.summary).toContain('geofence warning');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide geofence warning validation details', () => {
      const evvRecord = createGeofenceWarningEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.geofenceValidation.complianceLevel).toBe('WARNING');
      expect(result.geofenceValidation.validationType).toBe('WITHIN_ACCURACY_ALLOWANCE');
      expect(result.geofenceValidation.distanceMeters).toBeGreaterThan(100);
      expect(result.geofenceValidation.distanceMeters).toBeLessThan(
        result.geofenceValidation.effectiveRadiusMeters
      );
      expect(result.geofenceValidation.message).toContain('GPS accuracy allowance');
    });

    it('should recommend supervisor review for geofence warnings', () => {
      const evvRecord = createGeofenceWarningEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      const hasReviewRecommendation = result.recommendations.some(r =>
        r.toLowerCase().includes('review') || r.toLowerCase().includes('accuracy')
      );
      expect(hasReviewRecommendation).toBe(true);
    });
  });

  describe('Scenario 3: VMUR Required (Forgot to Clock Out)', () => {
    it('should flag incomplete visit (no clock-out)', () => {
      const evvRecord = createIncompleteVisitEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.flags).toContain('INCOMPLETE_VISIT');
      expect(result.flags).not.toContain('AGGREGATOR_READY');
    });

    it('should require VMUR for old records with issues', () => {
      const evvRecord = createOldRecordRequiringVMUR();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.flags).toContain('REQUIRES_VMUR');
      expect(result.requiresAction).toBe(true);
      expect(result.recommendations).toContain(
        'Record is older than 30 days. Use VMUR (Visit Maintenance Unlock Request) workflow for corrections.'
      );
    });

    it('should mark grace period as incomplete for missing clock-out', () => {
      const evvRecord = createIncompleteVisitEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.gracePeriodValidation.clockOutStatus).toBe('INCOMPLETE');
      expect(result.gracePeriodValidation.message).toContain('Not recorded');
    });
  });

  describe('GPS Accuracy Violations', () => {
    it('should reject visits with GPS accuracy > 100m', () => {
      const evvRecord = createHighGPSAccuracyEVVRecord();

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.isCompliant).toBe(false);
      expect(result.complianceLevel).toBe('NON_COMPLIANT');
      expect(result.flags).toContain('GPS_ACCURACY_EXCEEDED');
      expect(result.flags).toContain('REQUIRES_SUPERVISOR');
      expect(result.requiresAction).toBe(true);
    });
  });

  describe('Grace Period Validation', () => {
    it('should accept clock-in within 10-minute grace period (early)', () => {
      const evvRecord = createCompliantEVVRecord();
      evvRecord.clockInTime = new Date('2025-11-14T08:55:00Z'); // 5 minutes early

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.gracePeriodValidation.isValid).toBe(true);
      expect(result.gracePeriodValidation.clockInStatus).toBe('ON_TIME');
    });

    it('should accept clock-in within 10-minute grace period (late)', () => {
      const evvRecord = createCompliantEVVRecord();
      evvRecord.clockInTime = new Date('2025-11-14T09:08:00Z'); // 8 minutes late

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.gracePeriodValidation.isValid).toBe(true);
      expect(result.gracePeriodValidation.clockInStatus).toBe('ON_TIME');
    });

    it('should flag clock-in beyond grace period as VIOLATION', () => {
      const evvRecord = createCompliantEVVRecord();
      evvRecord.clockInTime = new Date('2025-11-14T09:25:00Z'); // 25 minutes late

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.gracePeriodValidation.isValid).toBe(false);
      expect(result.gracePeriodValidation.clockInStatus).toBe('VIOLATION');
      expect(result.flags).toContain('GRACE_PERIOD_VIOLATION');
    });
  });

  describe('Multiple Violations', () => {
    it('should identify all violations in a non-compliant visit', () => {
      const evvRecord: EVVRecord = {
        ...createCompliantEVVRecord(),
        clientMedicaidId: undefined, // Missing required element
        clockInVerification: {
          method: 'GPS',
          latitude: 30.2690, // 200m away - geofence violation
          longitude: -97.7431,
          accuracy: 20,
          timestamp: new Date('2025-11-14T09:30:00Z'), // 30 min late - grace violation
          verified: true,
          deviceId: 'device-123',
        },
        clockInTime: new Date('2025-11-14T09:30:00Z'),
      };

      const result = complianceService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      expect(result.isCompliant).toBe(false);
      expect(result.complianceLevel).toBe('NON_COMPLIANT');
      expect(result.requiresAction).toBe(true);

      // Should have multiple flags
      expect(result.flags.length).toBeGreaterThan(2);
      expect(result.flags).toContain('GEOFENCE_VIOLATION');
      expect(result.flags).toContain('GRACE_PERIOD_VIOLATION');

      // Should have multiple recommendations
      expect(result.recommendations.length).toBeGreaterThan(1);
    });
  });

  describe('Configuration', () => {
    it('should use default Texas configuration', () => {
      const config = complianceService.getConfig();

      expect(config.gracePeriodMinutes).toBe(10);
      expect(config.requireCompletedVisit).toBe(false);
      expect(config.strictGPSAccuracy).toBe(true);
    });

    it('should allow custom grace period', () => {
      const customService = createTexasComplianceService({
        gracePeriodMinutes: 15,
      });

      const evvRecord = createCompliantEVVRecord();
      evvRecord.clockInTime = new Date('2025-11-14T09:12:00Z'); // 12 minutes late

      const result = customService.validateCompliance(
        evvRecord,
        scheduledStartTime,
        scheduledEndTime,
        expectedLocation
      );

      // With 15-minute grace period, 12 minutes should be ON_TIME
      expect(result.gracePeriodValidation.clockInStatus).toBe('ON_TIME');
    });
  });
});

// ============================================================================
// Helper Functions to Create Test EVV Records
// ============================================================================

function createCompliantEVVRecord(): EVVRecord {
  return {
    id: 'evv-compliant-123',
    visitId: 'visit-123',
    organizationId: 'org-123',
    branchId: 'branch-123',
    clientId: 'client-123',
    caregiverId: 'caregiver-123',

    serviceTypeCode: 'T1019',
    serviceTypeName: 'Personal Care Services',

    clientName: 'John Doe',
    clientMedicaidId: 'TX-MED-12345',

    caregiverName: 'Jane Smith',
    caregiverEmployeeId: 'EMP-789',
    caregiverNationalProviderId: '1234567890',

    serviceDate: new Date('2025-11-14'),

    serviceAddress: {
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
      latitude: 30.2672,
      longitude: -97.7431,
      geofenceRadius: 100,
      addressVerified: true,
    },

    clockInTime: new Date('2025-11-14T09:00:00Z'),
    clockOutTime: new Date('2025-11-14T13:00:00Z'),
    totalDuration: 240,

    clockInVerification: {
      method: 'GPS',
      latitude: 30.2672, // Same as address - perfect location
      longitude: -97.7431,
      accuracy: 15, // Good GPS accuracy
      timestamp: new Date('2025-11-14T09:00:00Z'),
      verified: true,
      deviceId: 'device-123',
    },

    clockOutVerification: {
      method: 'GPS',
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 18,
      timestamp: new Date('2025-11-14T13:00:00Z'),
      verified: true,
      deviceId: 'device-123',
    },

    recordStatus: 'COMPLETE',
    verificationLevel: 'FULL',
    complianceFlags: ['COMPLIANT'],
    integrityHash: 'hash-123',
    integrityChecksum: 'checksum-123',

    recordedAt: new Date('2025-11-14T13:05:00Z'),
    recordedBy: 'caregiver-123',
    syncMetadata: {
      syncId: 'sync-123',
      syncedAt: new Date('2025-11-14T13:06:00Z'),
      deviceId: 'device-123',
      conflictResolved: false,
    },

    createdAt: new Date('2025-11-14T13:05:00Z'),
    updatedAt: new Date('2025-11-14T13:05:00Z'),
  };
}

function createGeofenceWarningEVVRecord(): EVVRecord {
  const record = createCompliantEVVRecord();
  record.id = 'evv-warning-456';
  // 120m away with 30m GPS accuracy
  // Effective radius = 100m + 30m = 130m
  // 120m < 130m = WARNING
  record.clockInVerification = {
    method: 'GPS',
    latitude: 30.2683, // ~120m north
    longitude: -97.7431,
    accuracy: 30, // GPS accuracy provides allowance
    timestamp: new Date('2025-11-14T09:00:00Z'),
    verified: true,
    deviceId: 'device-123',
  };
  record.complianceFlags = ['GEOFENCE_WARNING'];
  return record;
}

function createIncompleteVisitEVVRecord(): EVVRecord {
  const record = createCompliantEVVRecord();
  record.id = 'evv-incomplete-789';
  record.clockOutTime = null; // Forgot to clock out
  record.clockOutVerification = undefined;
  record.totalDuration = undefined;
  record.recordStatus = 'PENDING';
  record.complianceFlags = ['INCOMPLETE_VISIT'];
  return record;
}

function createOldRecordRequiringVMUR(): EVVRecord {
  const record = createIncompleteVisitEVVRecord();
  record.id = 'evv-old-vmur-999';
  // Record is 35 days old (> 30 days)
  const thirtyFiveDaysAgo = new Date();
  thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
  record.recordedAt = thirtyFiveDaysAgo;
  record.createdAt = thirtyFiveDaysAgo;
  return record;
}

function createHighGPSAccuracyEVVRecord(): EVVRecord {
  const record = createCompliantEVVRecord();
  record.id = 'evv-high-accuracy-111';
  record.clockInVerification = {
    method: 'GPS',
    latitude: 30.2672,
    longitude: -97.7431,
    accuracy: 150, // GPS accuracy > 100m requirement
    timestamp: new Date('2025-11-14T09:00:00Z'),
    verified: true,
    deviceId: 'device-123',
  };
  record.complianceFlags = ['GPS_ACCURACY_EXCEEDED'];
  return record;
}
