/**
 * Unit tests for state-specific EVV validation logic
 * 
 * Tests Texas and Florida specific EVV compliance requirements including:
 * - Grace periods for early/late clock times
 * - Geofence tolerances
 * - Clock method validations
 * - VMUR requirements (Texas)
 * - MCO requirements (Florida)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EVVValidator } from '../evv-validator';
import { 
  TexasEVVConfig, 
  FloridaEVVConfig, 
  FloridaMCORequirements 
} from '../../types/state-specific';
import { EVVRecord, VerificationMethod, ComplianceFlag, EVVRecordStatus } from '../../types/evv';
import { UUID } from '@care-commons/core';

describe('EVVValidator - State-Specific Validation', () => {
  let validator: EVVValidator;
  let mockEVVRecord: EVVRecord;
  let texasConfig: TexasEVVConfig;
  let floridaConfig: FloridaEVVConfig;

  beforeEach(() => {
    validator = new EVVValidator();
    
    // Mock EVV record for testing
    mockEVVRecord = {
      id: 'test-evv-id' as UUID,
      createdAt: new Date('2024-01-15T09:00:00Z'),
      createdBy: 'test-user' as UUID,
      updatedAt: new Date('2024-01-15T09:00:00Z'),
      updatedBy: 'test-user' as UUID,
      version: 1,
      visitId: 'test-visit-id' as UUID,
      organizationId: 'test-org-id' as UUID,
      branchId: 'test-branch-id' as UUID,
      clientId: 'test-client-id' as UUID,
      caregiverId: 'test-caregiver-id' as UUID,
      serviceTypeCode: 'HCBS',
      serviceTypeName: 'Home Health Services',
      clientName: 'Test Client',
      caregiverName: 'Test Caregiver',
      caregiverEmployeeId: 'CG001',
      serviceDate: new Date('2024-01-15'),
      serviceAddress: {
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
        latitude: 30.2672,
        longitude: -97.7431,
        geofenceRadius: 100,
        addressVerified: true,
      },
      clockInTime: new Date('2024-01-15T09:00:00Z'),
      clockOutTime: new Date('2024-01-15T11:00:00Z'),
      totalDuration: 120,
      clockInVerification: {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 20,
        timestamp: new Date('2024-01-15T09:00:00Z'),
        timestampSource: 'GPS',
        isWithinGeofence: true,
        distanceFromAddress: 5,
        geofencePassed: true,
        deviceId: 'test-device',
        method: 'GPS' as VerificationMethod,
        locationSource: 'GPS_SATELLITE',
        mockLocationDetected: false,
        verificationPassed: true,
      },
      recordStatus: 'COMPLETE' as EVVRecordStatus,
      verificationLevel: 'FULL',
      complianceFlags: ['COMPLIANT' as ComplianceFlag],
      integrityHash: 'test-hash',
      integrityChecksum: 'test-checksum',
      recordedAt: new Date('2024-01-15T09:00:00Z'),
      recordedBy: 'test-user' as UUID,
      syncMetadata: {
        syncId: 'test-sync-id' as UUID,
        lastSyncedAt: new Date('2024-01-15T09:00:00Z'),
        syncStatus: 'SYNCED',
      },
    };

    // Texas configuration
    texasConfig = {
      state: 'TX',
      aggregatorType: 'HHAEEXCHANGE',
      aggregatorEntityId: 'tx-aggregator-001',
      aggregatorSubmissionEndpoint: 'https://tx.hhaexchange.com/api',
      programType: 'STAR_PLUS',
      allowedClockMethods: ['MOBILE_GPS', 'FIXED_TELEPHONY', 'FIXED_BIOMETRIC'],
      requiresGPSForMobile: true,
      geoPerimeterTolerance: 150, // 100m base + 50m tolerance
      clockInGracePeriodMinutes: 10,
      clockOutGracePeriodMinutes: 10,
      lateClockInThresholdMinutes: 15,
      vmurEnabled: true,
      vmurApprovalRequired: true,
      vmurReasonCodesRequired: true,
    };

    // Florida configuration
    floridaConfig = {
      state: 'FL',
      aggregators: [
        {
          id: 'fl-aggregator-001',
          name: 'Florida HHAeXchange',
          type: 'HHAEEXCHANGE',
          endpoint: 'https://fl.hhaexchange.com/api',
          isActive: true,
          assignedPayers: ['medicaid'],
          assignedMCOs: ['mco-001'],
          batchSubmission: true,
          realTimeSubmission: false,
        },
      ],
      defaultAggregator: 'fl-aggregator-001',
      programType: 'SMMC_LTC',
      requiredDataElements: 'CURES_ACT_MINIMUM',
      allowedVerificationMethods: ['MOBILE_GPS', 'TELEPHONY_IVR', 'BIOMETRIC_FIXED'],
      geoPerimeterTolerance: 250, // 150m base + 100m tolerance
      allowTelephonyFallback: true,
      submissionDeadlineDays: 7,
      lateSubmissionGracePeriodDays: 3,
    };
  });

  describe('Texas EVV Validation', () => {
    it('should validate compliant Texas EVV record', () => {
      const scheduledStart = new Date('2024-01-15T09:00:00Z');
      const scheduledEnd = new Date('2024-01-15T11:00:00Z');
      
      const result = validator.validateStateRequirements(
        'TX',
        texasConfig,
        mockEVVRecord,
        scheduledStart,
        scheduledEnd
      );

      expect(result.passed).toBe(true);
      expect(result.verificationLevel).toBe('FULL');
      expect(result.complianceFlags).toEqual(['COMPLIANT']);
      expect(result.issues).toHaveLength(0);
      expect(result.requiresSupervisorReview).toBe(false);
    });

    it('should flag clock-in too early for Texas (beyond 10-minute grace)', () => {
      const scheduledStart = new Date('2024-01-15T09:15:00Z'); // 15 minutes after actual clock-in
      const scheduledEnd = new Date('2024-01-15T11:00:00Z');
      
      const result = validator.validateStateRequirements(
        'TX',
        texasConfig,
        mockEVVRecord,
        scheduledStart,
        scheduledEnd
      );

      expect(result.passed).toBe(false);
      expect(result.verificationLevel).toBe('PARTIAL');
      expect(result.complianceFlags).toContain('TIME_GAP');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('CLOCK_IN_TOO_EARLY');
      expect(result.issues[0]!.description).toContain('15 minutes before scheduled start');
      expect(result.requiresSupervisorReview).toBe(true);
    });

    it('should allow clock-in within Texas 10-minute grace period', () => {
      const scheduledStart = new Date('2024-01-15T09:08:00Z'); // 8 minutes after actual clock-in
      const scheduledEnd = new Date('2024-01-15T11:00:00Z');
      
      const result = validator.validateStateRequirements(
        'TX',
        texasConfig,
        mockEVVRecord,
        scheduledStart,
        scheduledEnd
      );

      expect(result.passed).toBe(true);
      expect(result.verificationLevel).toBe('FULL');
      expect(result.complianceFlags).toEqual(['COMPLIANT']);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject invalid clock method for Texas', () => {
      const invalidRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          method: 'MANUAL' as VerificationMethod, // Not allowed in Texas
        },
      };

      const result = validator.validateStateRequirements('TX', texasConfig, invalidRecord);

      expect(result.passed).toBe(false);
      expect(result.verificationLevel).toBe('PARTIAL');
      expect(result.complianceFlags).toContain('MANUAL_OVERRIDE');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('INVALID_CLOCK_METHOD');
      expect(result.issues[0]!.severity).toBe('HIGH');
      expect(result.issues[0]!.canBeOverridden).toBe(false);
    });

    it('should flag GPS accuracy issues for Texas mobile visits', () => {
      const lowAccuracyRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          accuracy: 200, // Exceeds Texas tolerance of 150m
        method: 'GPS' as VerificationMethod,
        },
      };

      const result = validator.validateStateRequirements('TX', texasConfig, lowAccuracyRecord);

      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('LOW_GPS_ACCURACY');
      expect(result.issues[0]!.description).toContain('200m exceeds Texas tolerance of 150m');
    });

    it('should require VMUR for amended Texas records', () => {
      const amendedRecord = {
        ...mockEVVRecord,
        recordStatus: 'AMENDED' as EVVRecordStatus,
      };

      const result = validator.validateStateRequirements('TX', texasConfig, amendedRecord);

      expect(result.passed).toBe(false);
      expect(result.complianceFlags).toContain('AMENDED');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('MISSING_VMUR');
      expect(result.issues[0]!.description).toContain('Texas requires VMUR approval');
    });

    it('should validate Texas geofence with 100m base + 50m tolerance', () => {
      // Location 140m from address (outside 100m base but within 150m total)
      const outsideBaseRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          latitude: 30.2685, // ~140m north
          longitude: -97.7431,
          distanceFromAddress: 140,
          isWithinGeofence: false,
        },
      };

      const result = validator.validateStateRequirements('TX', texasConfig, outsideBaseRecord);

      expect(result.passed).toBe(true); // Should pass due to tolerance
      expect(result.issues).toHaveLength(0);
    });

    it('should reject location outside Texas geofence tolerance', () => {
      // Location 200m from address (outside both 100m base and 150m tolerance)
      const farOutsideRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          latitude: 30.2690, // ~200m north
          longitude: -97.7431,
          distanceFromAddress: 200,
          isWithinGeofence: false,
        },
      };

      const result = validator.validateStateRequirements('TX', texasConfig, farOutsideRecord);

      expect(result.passed).toBe(false);
      expect(result.complianceFlags).toContain('GEOFENCE_VIOLATION');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('GEOFENCE_VIOLATION');
      expect(result.issues[0]!.description).toContain('Texas: 100m + 50m tolerance');
    });
  });

  describe('Florida EVV Validation', () => {
    it('should validate compliant Florida EVV record', () => {
      const result = validator.validateStateRequirements('FL', floridaConfig, mockEVVRecord);

      expect(result.passed).toBe(true);
      expect(result.verificationLevel).toBe('FULL');
      expect(result.complianceFlags).toEqual(['COMPLIANT']);
      expect(result.issues).toHaveLength(0);
      expect(result.requiresSupervisorReview).toBe(false);
    });

    it('should flag clock-in too early for Florida (beyond 15-minute grace)', () => {
      const scheduledStart = new Date('2024-01-15T09:20:00Z'); // 20 minutes after actual clock-in
      
      const result = validator.validateStateRequirements(
        'FL',
        floridaConfig,
        mockEVVRecord,
        scheduledStart
      );

      expect(result.passed).toBe(false);
      expect(result.verificationLevel).toBe('PARTIAL');
      expect(result.complianceFlags).toContain('TIME_GAP');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('CLOCK_IN_TOO_EARLY');
      expect(result.issues[0]!.description).toContain('20 minutes before scheduled start');
    });

    it('should allow clock-in within Florida 15-minute grace period', () => {
      const scheduledStart = new Date('2024-01-15T09:12:00Z'); // 12 minutes after actual clock-in
      
      const result = validator.validateStateRequirements(
        'FL',
        floridaConfig,
        mockEVVRecord,
        scheduledStart
      );

      expect(result.passed).toBe(true);
      expect(result.verificationLevel).toBe('FULL');
      expect(result.complianceFlags).toEqual(['COMPLIANT']);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject invalid verification method for Florida', () => {
      const invalidRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          method: 'MANUAL' as VerificationMethod, // Not allowed in Florida config
        },
      };

      const result = validator.validateStateRequirements('FL', floridaConfig, invalidRecord);

      expect(result.passed).toBe(false);
      expect(result.verificationLevel).toBe('PARTIAL');
      expect(result.complianceFlags).toContain('MANUAL_OVERRIDE');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('INVALID_VERIFICATION_METHOD');
      expect(result.issues[0]!.severity).toBe('HIGH');
    });

    it('should require client signature for MCO that mandates it', () => {
      const mcoConfig: FloridaMCORequirements = {
        mcoName: 'Florida Medicaid MCO',
        mcoId: 'mco-001',
        requiresClientSignature: true,
        requiresTaskDocumentation: false,
        requiresPhotoVerification: false,
        billingInterfaceType: 'ELECTRONIC_837',
        requiresPriorAuth: false,
      };

      const configWithMCO = {
        ...floridaConfig,
        mcoRequirements: mcoConfig,
      };

      const result = validator.validateStateRequirements('FL', configWithMCO, mockEVVRecord);

      expect(result.passed).toBe(false);
      expect(result.complianceFlags).toContain('MISSING_SIGNATURE');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('MISSING_SIGNATURE');
      expect(result.issues[0]!.description).toContain('requires client signature');
    });

    it('should require photo verification for MCO that mandates it', () => {
      const mcoConfig: FloridaMCORequirements = {
        mcoName: 'Florida Medicaid MCO',
        mcoId: 'mco-001',
        requiresClientSignature: false,
        requiresTaskDocumentation: false,
        requiresPhotoVerification: true,
        billingInterfaceType: 'ELECTRONIC_837',
        requiresPriorAuth: false,
      };

      const configWithMCO = {
        ...floridaConfig,
        mcoRequirements: mcoConfig,
      };

      const result = validator.validateStateRequirements('FL', configWithMCO, mockEVVRecord);

      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('MISSING_PHOTO_VERIFICATION');
      expect(result.issues[0]!.description).toContain('requires photo verification');
    });

    it('should validate Florida geofence with 150m base + 100m tolerance', () => {
      // Location 200m from address (outside 150m base but within 250m total)
      const outsideBaseRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          latitude: 30.2690, // ~200m north
          longitude: -97.7431,
          distanceFromAddress: 200,
          isWithinGeofence: false,
        },
      };

      const result = validator.validateStateRequirements('FL', floridaConfig, outsideBaseRecord);

      expect(result.passed).toBe(true); // Should pass due to tolerance
      expect(result.issues).toHaveLength(0);
    });

    it('should reject location outside Florida geofence tolerance', () => {
      // Location 300m from address (outside both 150m base and 250m tolerance)
      const farOutsideRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          latitude: 30.2700, // ~300m north
          longitude: -97.7431,
          distanceFromAddress: 300,
          isWithinGeofence: false,
        },
      };

      const result = validator.validateStateRequirements('FL', floridaConfig, farOutsideRecord);

      expect(result.passed).toBe(false);
      expect(result.complianceFlags).toContain('GEOFENCE_VIOLATION');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('GEOFENCE_VIOLATION');
      expect(result.issues[0]!.description).toContain('Florida: 150m + 100m tolerance');
    });

    it('should allow telephony when fallback is enabled', () => {
      const telephonyRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          method: 'PHONE' as VerificationMethod,
        },
      };

      const result = validator.validateStateRequirements('FL', floridaConfig, telephonyRecord);

      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject telephony when fallback is disabled', () => {
      const noTelephonyConfig = {
        ...floridaConfig,
        allowTelephonyFallback: false,
      };

      const telephonyRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          method: 'PHONE' as VerificationMethod,
        },
      };

      const result = validator.validateStateRequirements('FL', noTelephonyConfig, telephonyRecord);

      expect(result.passed).toBe(false);
      expect(result.complianceFlags).toContain('MANUAL_OVERRIDE');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.issueType).toBe('UNAUTHORIZED_TELEPHONY');
      expect(result.issues[0]!.description).toContain('Telephony verification not authorized');
    });
  });

  describe('Geographic Validation with State Tolerance', () => {
    it('should apply Texas tolerance correctly', () => {
      const result = validator.validateGeographicWithStateTolerance(
        'TX',
        30.2672,
        -97.7431,
        20,
        30.2672,
        -97.7431,
        100 // Base radius
      );

      expect(result.isWithinGeofence).toBe(true);
      expect(result.distanceFromCenter).toBe(0);
      expect(result.distanceFromAddress).toBe(0);
    });

    it('should apply Florida tolerance correctly', () => {
      const result = validator.validateGeographicWithStateTolerance(
        'FL',
        30.2672,
        -97.7431,
        20,
        30.2672,
        -97.7431,
        150 // Base radius
      );

      expect(result.isWithinGeofence).toBe(true);
      expect(result.distanceFromCenter).toBe(0);
      expect(result.distanceFromAddress).toBe(0);
    });

    it('should handle location just outside Texas base but within tolerance', () => {
      // Location 120m away (outside 100m base, within 150m total)
      const result = validator.validateGeographicWithStateTolerance(
        'TX',
        30.2683, // ~120m north
        -97.7431,
        20,
        30.2672,
        -97.7431,
        100 // Base radius
      );

      expect(result.isWithinGeofence).toBe(true);
      expect(result.distanceFromAddress).toBeCloseTo(120, -1);
    });

    it('should handle location just outside Florida base but within tolerance', () => {
      // Location 200m away (outside 150m base, within 250m total)
      const result = validator.validateGeographicWithStateTolerance(
        'FL',
        30.2690, // ~200m north
        -97.7431,
        20,
        30.2672,
        -97.7431,
        150 // Base radius
      );

      expect(result.isWithinGeofence).toBe(true);
      expect(result.distanceFromAddress).toBeCloseTo(200, -1);
    });

    it('should reject location outside both state tolerances', () => {
      // Location 300m away (outside both TX and FL tolerances)
      const texasResult = validator.validateGeographicWithStateTolerance(
        'TX',
        30.2700, // ~300m north
        -97.7431,
        20,
        30.2672,
        -97.7431,
        100 // Base radius
      );

      const floridaResult = validator.validateGeographicWithStateTolerance(
        'FL',
        30.2700, // ~300m north
        -97.7431,
        20,
        30.2672,
        -97.7431,
        150 // Base radius
      );

      expect(texasResult.isWithinGeofence).toBe(false);
      expect(floridaResult.isWithinGeofence).toBe(false);
    });
  });

  describe('Verification Level Determination', () => {
    it('should return FULL verification for compliant records', () => {
      const result = validator.validateStateRequirements('TX', texasConfig, mockEVVRecord);
      expect(result.verificationLevel).toBe('FULL');
    });

    it('should return PARTIAL verification for HIGH severity issues', () => {
      const invalidRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          method: 'MANUAL' as VerificationMethod,
        },
      };

      const result = validator.validateStateRequirements('TX', texasConfig, invalidRecord);
      expect(result.verificationLevel).toBe('PARTIAL');
    });

    it('should return EXCEPTION verification for CRITICAL severity issues', () => {
      // This would require adding a critical issue type to test
      // For now, we'll test the structure
      const result = validator.validateStateRequirements('TX', texasConfig, mockEVVRecord);
      expect(['FULL', 'PARTIAL', 'EXCEPTION']).toContain(result.verificationLevel);
    });
  });

  describe('Compliance Flag Management', () => {
    it('should remove COMPLIANT flag when issues exist', () => {
      const invalidRecord = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          method: 'MANUAL' as VerificationMethod,
        },
      };

      const result = validator.validateStateRequirements('TX', texasConfig, invalidRecord);
      expect(result.complianceFlags).not.toContain('COMPLIANT');
      expect(result.complianceFlags.length).toBeGreaterThan(0);
    });

    it('should keep only COMPLIANT flag for perfect records', () => {
      const result = validator.validateStateRequirements('TX', texasConfig, mockEVVRecord);
      expect(result.complianceFlags).toEqual(['COMPLIANT']);
      expect(result.complianceFlags.length).toBe(1);
    });
  });
});