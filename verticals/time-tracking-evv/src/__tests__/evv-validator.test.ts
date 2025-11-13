/**
 * Tests for EVV Validator - Validation and integrity checking for EVV data
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EVVValidator } from '../validation/evv-validator';
import { CryptoUtils } from '../utils/crypto-utils';
import { 
  ClockInInput, 
  ClockOutInput, 
  CreateGeofenceInput,
  EVVRecord,
  VerificationMethod
} from '../types/evv';
import { ValidationError } from '@care-commons/core';

describe('EVVValidator', () => {
  let validator: EVVValidator;

  beforeEach(() => {
    validator = new EVVValidator();
  });

  describe('validateClockIn', () => {
    const validClockInInput: ClockInInput = {
      visitId: 'visit-123',
      caregiverId: 'caregiver-123',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      },
      deviceInfo: {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
      },
    };

    it('should pass validation with valid clock-in data', () => {
      expect(() => validator.validateClockIn(validClockInInput)).not.toThrow();
    });

    it('should throw ValidationError when visitId is missing', () => {
      const invalidInput = { ...validClockInInput, visitId: '' };
      
      expect(() => validator.validateClockIn(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when caregiverId is missing', () => {
      const invalidInput = { ...validClockInInput, caregiverId: '' };
      
      expect(() => validator.validateClockIn(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when location is missing', () => {
      const invalidInput = { ...validClockInInput, location: undefined as any };
      
      expect(() => validator.validateClockIn(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when deviceInfo is missing', () => {
      const invalidInput = { ...validClockInInput, deviceInfo: undefined as any };
      
      expect(() => validator.validateClockIn(invalidInput))
        .toThrow(ValidationError);
    });
  });

  describe('validateClockOut', () => {
    const validClockOutInput: ClockOutInput = {
      visitId: 'visit-123',
      evvRecordId: 'evv-123',
      caregiverId: 'caregiver-123',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      },
      deviceInfo: {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
      },
    };

    it('should pass validation with valid clock-out data', () => {
      expect(() => validator.validateClockOut(validClockOutInput)).not.toThrow();
    });

    it('should throw ValidationError when evvRecordId is missing', () => {
      const invalidInput = { ...validClockOutInput, evvRecordId: '' };
      
      expect(() => validator.validateClockOut(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when visitId is missing from clock-out', () => {
      const invalidInput = { ...validClockOutInput, visitId: '' };
      
      expect(() => validator.validateClockOut(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when caregiverId is missing from clock-out', () => {
      const invalidInput = { ...validClockOutInput, caregiverId: '' };
      
      expect(() => validator.validateClockOut(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when location is missing from clock-out', () => {
      const invalidInput = { ...validClockOutInput, location: undefined as any };
      
      expect(() => validator.validateClockOut(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when deviceInfo is missing from clock-out', () => {
      const invalidInput = { ...validClockOutInput, deviceInfo: undefined as any };
      
      expect(() => validator.validateClockOut(invalidInput))
        .toThrow(ValidationError);
    });
  });

  describe('validateLocation', () => {
    it('should pass validation with valid location', () => {
      const validLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(validLocation, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for invalid latitude', () => {
      const invalidLocation = {
        latitude: 91, // Invalid latitude
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('latitude must be between -90 and 90');
    });

    it('should add error for invalid longitude', () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: 181, // Invalid longitude
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('longitude must be between -180 and 180');
    });

    it('should add error for negative accuracy', () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: -5, // Negative accuracy
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('accuracy cannot be negative');
    });

    it('should add error for accuracy too high', () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 1500, // Too high accuracy
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('accuracy over 1000 meters is too low for verification');
    });

    it('should add error for old timestamp', () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('location timestamp is too far from server time (clock skew detected)');
    });

    it('should add error for mock location detected', () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: true, // Mock location detected
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('mock location/GPS spoofing detected - verification failed');
    });

    it('should add error when timestamp is missing', () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: undefined as any,
        method: 'GPS' as VerificationMethod,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('location timestamp is required');
    });

    it('should add error when verification method is missing', () => {
      const invalidLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: undefined as any,
        mockLocationDetected: false,
      };

      const errors: string[] = [];
      validator.validateLocation(invalidLocation, errors);
      expect(errors).toContain('verification method is required');
    });
  });

  describe('validateDeviceInfo', () => {
    it('should pass validation with valid device info', () => {
      const validDeviceInfo = {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
      };

      const errors: string[] = [];
      validator.validateDeviceInfo(validDeviceInfo, errors);
      expect(errors).toHaveLength(0);
    });

    it('should add error for missing deviceId', () => {
      const invalidDeviceInfo = {
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
      };

      const errors: string[] = [];
      validator.validateDeviceInfo(invalidDeviceInfo, errors);
      expect(errors).toContain('deviceId is required');
    });

    it('should add error for missing deviceModel', () => {
      const invalidDeviceInfo = {
        deviceId: 'device-123',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
      };

      const errors: string[] = [];
      validator.validateDeviceInfo(invalidDeviceInfo, errors);
      expect(errors).toContain('deviceModel is required');
    });

    it('should add error for missing deviceOS', () => {
      const invalidDeviceInfo = {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        osVersion: '16.0',
        appVersion: '1.0.0',
      };

      const errors: string[] = [];
      validator.validateDeviceInfo(invalidDeviceInfo, errors);
      expect(errors).toContain('deviceOS is required');
    });

    it('should add error for missing appVersion', () => {
      const invalidDeviceInfo = {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
      };

      const errors: string[] = [];
      validator.validateDeviceInfo(invalidDeviceInfo, errors);
      expect(errors).toContain('appVersion is required');
    });

    it('should add error for rooted device', () => {
      const invalidDeviceInfo = {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
        isRooted: true, // Rooted device
      };

      const errors: string[] = [];
      validator.validateDeviceInfo(invalidDeviceInfo, errors);
      expect(errors).toContain('rooted/jailbroken devices are not allowed for EVV compliance');
    });

    it('should add error for jailbroken device', () => {
      const invalidDeviceInfo = {
        deviceId: 'device-123',
        deviceModel: 'iPhone 14',
        deviceOS: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
        isJailbroken: true, // Jailbroken device
      };

      const errors: string[] = [];
      validator.validateDeviceInfo(invalidDeviceInfo, errors);
      expect(errors).toContain('rooted/jailbroken devices are not allowed for EVV compliance');
    });
  });

  describe('validateGeofence', () => {
    const validGeofenceInput: CreateGeofenceInput = {
      organizationId: 'org-123',
      clientId: 'client-123',
      addressId: 'address-123',
      centerLatitude: 40.7128,
      centerLongitude: -74.0060,
      radiusMeters: 100,
    };

    it('should pass validation with valid geofence data', () => {
      expect(() => validator.validateGeofence(validGeofenceInput)).not.toThrow();
    });

    it('should throw ValidationError when organizationId is missing', () => {
      const invalidInput = { ...validGeofenceInput, organizationId: '' };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when clientId is missing', () => {
      const invalidInput = { ...validGeofenceInput, clientId: '' };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when addressId is missing', () => {
      const invalidInput = { ...validGeofenceInput, addressId: '' };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid latitude', () => {
      const invalidInput = { ...validGeofenceInput, centerLatitude: 91 };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid longitude', () => {
      const invalidInput = { ...validGeofenceInput, centerLongitude: 181 };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for negative radius', () => {
      const invalidInput = { ...validGeofenceInput, radiusMeters: -10 };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for radius too small', () => {
      const invalidInput = { ...validGeofenceInput, radiusMeters: 5 };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for radius too large', () => {
      const invalidInput = { ...validGeofenceInput, radiusMeters: 600 };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for polygon with insufficient points', () => {
      const invalidInput = {
        ...validGeofenceInput,
        shape: 'POLYGON' as const,
        polygonPoints: [{ latitude: 40.7128, longitude: -74.0060 }], // Only 1 point
      };
      
      expect(() => validator.validateGeofence(invalidInput))
        .toThrow(ValidationError);
    });
  });

  describe('checkGeofence', () => {
    it('should return within geofence for location inside radius', () => {
      const result = validator.checkGeofence(
        40.7128,    // locationLat
        -74.0060,   // locationLon
        10,          // locationAccuracy
        40.7128,    // geofenceLat
        -74.0060,   // geofenceLon
        100,         // geofenceRadius
        0            // allowedVariance
      );

      expect(result.isWithinGeofence).toBe(true);
      expect(result.distanceFromCenter).toBe(0);
      expect(result.requiresManualReview).toBe(false);
    });

    it('should return outside geofence for location far from center', () => {
      const result = validator.checkGeofence(
        40.7228,    // locationLat (1km north)
        -74.0060,   // locationLon
        10,          // locationAccuracy
        40.7128,    // geofenceLat
        -74.0060,   // geofenceLon
        100,         // geofenceRadius
        0            // allowedVariance
      );

      expect(result.isWithinGeofence).toBe(false);
      expect(result.distanceFromCenter).toBeGreaterThan(100);
      expect(result.requiresManualReview).toBe(false);
      expect(result.reason).toContain('Location is significantly outside geofence');
    });

    it('should require manual review when accuracy makes verification uncertain', () => {
      const result = validator.checkGeofence(
        40.7128,    // locationLat (same center)
        -74.0060,   // locationLon
        150,         // locationAccuracy (high accuracy)
        40.7128,    // geofenceLat
        -74.0060,   // geofenceLon
        100,         // geofenceRadius
        0            // allowedVariance
      );

      expect(result.isWithinGeofence).toBe(true); // minPossibleDistance is 0
      expect(result.requiresManualReview).toBe(true);
      expect(result.reason).toContain('GPS accuracy makes verification uncertain');
    });

    it('should account for allowed variance', () => {
      const result = validator.checkGeofence(
        40.7128,    // locationLat (same center)
        -74.0060,   // locationLon
        10,          // locationAccuracy
        40.7128,    // geofenceLat
        -74.0060,   // geofenceLon
        100,         // geofenceRadius
        50           // allowedVariance
      );

      expect(result.isWithinGeofence).toBe(true);
      expect(result.distanceFromAddress).toBe(0);
    });
  });

  describe('verifyIntegrity', () => {
    const mockEVVRecord: EVVRecord = {
      id: 'evv-123',
      visitId: 'visit-123',
      organizationId: 'org-123',
      branchId: 'branch-123',
      clientId: 'client-123',
      caregiverId: 'caregiver-123',
      serviceTypeCode: 'HCBS',
      serviceTypeName: 'Home Care',
      clientName: 'John Doe',
      caregiverName: 'Jane Smith',
      caregiverEmployeeId: 'EMP123',
      serviceDate: new Date(),
      serviceAddress: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060,
        geofenceRadius: 100,
        addressVerified: true,
      },
      clockInTime: new Date(),
      clockOutTime: new Date(),
      clockInVerification: (() => {
        const baseVerification = {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: new Date(),
          timestampSource: 'DEVICE' as const,
          isWithinGeofence: true,
          distanceFromAddress: 5,
          geofencePassed: true,
          deviceId: 'device-123',
          method: 'GPS' as VerificationMethod,
          locationSource: 'GPS_SATELLITE' as const,
          mockLocationDetected: false,
          verificationPassed: true,
        };

        const optionalFields = {
          altitude: undefined,
          heading: undefined,
          speed: undefined,
          photoUrl: undefined,
          biometricVerified: undefined,
          biometricMethod: undefined,
          verificationFailureReasons: undefined,
        };

        const filteredOptional = Object.fromEntries(
          Object.entries(optionalFields).filter(([_, value]) => value !== undefined)
        );

        return { ...baseVerification, ...filteredOptional };
      })(),
      recordStatus: 'COMPLETE',
      verificationLevel: 'FULL',
      complianceFlags: ['COMPLIANT'],
      integrityHash: 'valid-hash',
      integrityChecksum: 'valid-checksum',
      recordedAt: new Date(),
      recordedBy: 'user-123',
      syncMetadata: {
        syncId: 'sync-123',
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
      },
      createdAt: new Date(),
      createdBy: 'user-123',
      updatedAt: new Date(),
      updatedBy: 'user-123',
      version: 1,
    };

    it('should return valid integrity for untampered record', () => {
      // Create a record with matching hash and checksum using CryptoUtils
      const record = { ...mockEVVRecord };
      
      // Generate hash and checksum based on current record data
      const coreData = {
        visitId: record.visitId,
        clientId: record.clientId,
        caregiverId: record.caregiverId,
        serviceDate: record.serviceDate,
        clockInTime: record.clockInTime,
        clockOutTime: record.clockOutTime,
        serviceAddress: record.serviceAddress,
        clockInVerification: record.clockInVerification,
        clockOutVerification: record.clockOutVerification,
      };
      
      const computedHash = CryptoUtils.generateIntegrityHash(coreData);
      record.integrityHash = computedHash;
      
      // Compute checksum excluding integrity fields (to match validator behavior)
      const { integrityHash: _integrityHash, integrityChecksum: _integrityChecksum, ...recordWithoutIntegrity } = record;
      const computedChecksum = CryptoUtils.generateChecksum(recordWithoutIntegrity);
      record.integrityChecksum = computedChecksum;

      const result = validator.verifyIntegrity(record);

      expect(result.isValid).toBe(true);
      expect(result.hashMatch).toBe(true);
      expect(result.checksumMatch).toBe(true);
      expect(result.tamperDetected).toBe(false);
    });

    it('should detect tampering when hash does not match', () => {
      const record = { ...mockEVVRecord, integrityHash: 'invalid-hash' };

      const result = validator.verifyIntegrity(record);

      expect(result.isValid).toBe(false);
      expect(result.hashMatch).toBe(false);
      expect(result.tamperDetected).toBe(true);
      expect(result.issues).toContain('Integrity hash mismatch - core data may have been tampered with');
    });

    it('should detect tampering when checksum does not match', () => {
      const record = { ...mockEVVRecord, integrityChecksum: 'invalid-checksum' };

      const result = validator.verifyIntegrity(record);

      expect(result.isValid).toBe(false);
      expect(result.checksumMatch).toBe(false);
      expect(result.tamperDetected).toBe(true);
      expect(result.issues).toContain('Checksum mismatch - record data may have been modified');
    });
  });

  describe('performVerification', () => {
    const mockEVVRecord: EVVRecord = {
      id: 'evv-123',
      visitId: 'visit-123',
      organizationId: 'org-123',
      branchId: 'branch-123',
      clientId: 'client-123',
      caregiverId: 'caregiver-123',
      serviceTypeCode: 'HCBS',
      serviceTypeName: 'Home Care',
      clientName: 'John Doe',
      caregiverName: 'Jane Smith',
      caregiverEmployeeId: 'EMP123',
      serviceDate: new Date(),
      serviceAddress: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060,
        geofenceRadius: 100,
        addressVerified: true,
      },
      clockInTime: new Date(),
      clockOutTime: new Date(),
      totalDuration: 120,
      clockInVerification: (() => {
        const baseVerification = {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: new Date(),
          timestampSource: 'DEVICE' as const,
          isWithinGeofence: true,
          distanceFromAddress: 5,
          geofencePassed: true,
          deviceId: 'device-123',
          method: 'GPS' as VerificationMethod,
          locationSource: 'GPS_SATELLITE' as const,
          mockLocationDetected: false,
          verificationPassed: true,
        };

        const optionalFields = {
          altitude: undefined,
          heading: undefined,
          speed: undefined,
          photoUrl: undefined,
          biometricVerified: undefined,
          biometricMethod: undefined,
          verificationFailureReasons: undefined,
        };

        const filteredOptional = Object.fromEntries(
          Object.entries(optionalFields).filter(([_, value]) => value !== undefined)
        );

        return { ...baseVerification, ...filteredOptional };
      })(),
      recordStatus: 'COMPLETE',
      verificationLevel: 'FULL',
      complianceFlags: ['COMPLIANT'],
      integrityHash: 'hash',
      integrityChecksum: 'checksum',
      recordedAt: new Date(),
      recordedBy: 'user-123',
      syncMetadata: {
        syncId: 'sync-123',
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
      },
      createdAt: new Date(),
      createdBy: 'user-123',
      updatedAt: new Date(),
      updatedBy: 'user-123',
      version: 1,
    };

    it('should return passed verification for compliant record', () => {
      const geofenceCheck = {
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      };

      const result = validator.performVerification(mockEVVRecord, geofenceCheck);

      expect(result.passed).toBe(true);
      expect(result.verificationLevel).toBe('FULL');
      expect(result.complianceFlags).toEqual(['COMPLIANT']);
      expect(result.issues).toHaveLength(0);
      expect(result.requiresSupervisorReview).toBe(false);
    });

    it('should detect geofence violation', () => {
      const geofenceCheck = {
        isWithinGeofence: false,
        distanceFromCenter: 150,
        distanceFromAddress: 150,
        accuracy: 10,
        requiresManualReview: false,
        reason: 'Location outside geofence',
      };

      const result = validator.performVerification(mockEVVRecord, geofenceCheck);

      expect(result.passed).toBe(false);
      expect(result.verificationLevel).toBe('PARTIAL');
      expect(result.complianceFlags).toContain('GEOFENCE_VIOLATION');
      expect(result.issues).toContainEqual({
        issueType: 'GEOFENCE_VIOLATION',
        severity: 'HIGH',
        description: 'Location verification failed - 150m from address',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      expect(result.requiresSupervisorReview).toBe(true);
    });

    it('should detect low GPS accuracy', () => {
      const recordWithLowAccuracy = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          accuracy: 150, // Low accuracy
        },
      };

      const geofenceCheck = {
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 150,
        requiresManualReview: false,
      };

      const result = validator.performVerification(recordWithLowAccuracy, geofenceCheck);

      expect(result.issues).toContainEqual({
        issueType: 'LOW_GPS_ACCURACY',
        severity: 'MEDIUM',
        description: 'GPS accuracy is low (150m)',
        canBeOverridden: true,
        requiresSupervisor: false,
      });
    });

    it('should detect GPS spoofing', () => {
      const recordWithSpoofing = {
        ...mockEVVRecord,
        clockInVerification: {
          ...mockEVVRecord.clockInVerification,
          mockLocationDetected: true, // Mock location detected
        },
      };

      const geofenceCheck = {
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      };

      const result = validator.performVerification(recordWithSpoofing, geofenceCheck);

      expect(result.passed).toBe(false);
      expect(result.verificationLevel).toBe('EXCEPTION');
      expect(result.complianceFlags).toContain('LOCATION_SUSPICIOUS');
      expect(result.issues).toContainEqual({
        issueType: 'GPS_SPOOFING',
        severity: 'CRITICAL',
        description: 'Mock location/GPS spoofing detected',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      expect(result.requiresSupervisorReview).toBe(true);
    });

    it('should detect suspiciously short visit', () => {
      const recordWithShortVisit = {
        ...mockEVVRecord,
        totalDuration: 3, // 3 minutes - too short
      };

      const geofenceCheck = {
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      };

      const result = validator.performVerification(recordWithShortVisit, geofenceCheck);

      expect(result.issues).toContainEqual({
        issueType: 'VISIT_TOO_SHORT',
        severity: 'HIGH',
        description: 'Visit duration is suspiciously short',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      expect(result.requiresSupervisorReview).toBe(true);
    });

    it('should detect missing clock-out', () => {
      const { totalDuration: _totalDuration, ...recordWithoutClockOut } = mockEVVRecord;
      const recordForTest = {
        ...recordWithoutClockOut,
        clockOutTime: null,
      };

      const geofenceCheck = {
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      };

      const result = validator.performVerification(recordForTest, geofenceCheck);

      expect(result.issues).toContainEqual({
        issueType: 'MISSING_CLOCK_OUT',
        severity: 'HIGH',
        description: 'Visit has no clock-out time',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      expect(result.requiresSupervisorReview).toBe(true);
    });

    it('should detect excessive pause time', () => {
      const recordWithExcessivePauses = {
        ...mockEVVRecord,
        pauseEvents: [
          {
            id: 'pause-1',
            pausedAt: new Date(),
            resumedAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            duration: 60,
            reason: 'BREAK' as const,
            isPaid: false,
          },
          {
            id: 'pause-2',
            pausedAt: new Date(),
            resumedAt: new Date(Date.now() + 90 * 60 * 1000), // 1.5 hours
            duration: 90,
            reason: 'MEAL' as const,
            isPaid: false,
          },
        ],
      };

      const geofenceCheck = {
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      };

      const result = validator.performVerification(recordWithExcessivePauses, geofenceCheck);

      expect(result.complianceFlags).toContain('TIME_GAP');
      expect(result.issues).toContainEqual({
        issueType: 'EXCESSIVE_PAUSE_TIME',
        severity: 'MEDIUM',
        description: 'Total pause time (150 minutes) is excessive',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      expect(result.requiresSupervisorReview).toBe(true);
    });
  });

  describe('MCO-specific validations (validateStateRequirements)', () => {
    const baseMockEVVRecord: EVVRecord = {
      id: 'evv-123',
      visitId: 'visit-123',
      organizationId: 'org-123',
      branchId: 'branch-123',
      clientId: 'client-123',
      caregiverId: 'caregiver-123',
      serviceTypeCode: 'HCBS',
      serviceTypeName: 'Home Care',
      clientName: 'John Doe',
      caregiverName: 'Jane Smith',
      caregiverEmployeeId: 'EMP123',
      serviceDate: new Date('2025-01-15'),
      serviceAddress: {
        line1: '123 Main St',
        city: 'Miami',
        state: 'FL',
        postalCode: '33101',
        country: 'USA',
        latitude: 25.7617,
        longitude: -80.1918,
        geofenceRadius: 150,
        addressVerified: true,
      },
      clockInTime: new Date('2025-01-15T09:00:00Z'),
      clockOutTime: new Date('2025-01-15T11:00:00Z'),
      totalDuration: 120,
      clockInVerification: {
        latitude: 25.7617,
        longitude: -80.1918,
        accuracy: 10,
        timestamp: new Date('2025-01-15T09:00:00Z'),
        timestampSource: 'GPS',
        isWithinGeofence: true,
        distanceFromAddress: 50,
        geofencePassed: true,
        deviceId: 'device-123',
        method: 'GPS',
        locationSource: 'GPS_SATELLITE',
        mockLocationDetected: false,
        verificationPassed: true,
      },
      clockOutVerification: {
        latitude: 25.7617,
        longitude: -80.1918,
        accuracy: 10,
        timestamp: new Date('2025-01-15T11:00:00Z'),
        timestampSource: 'GPS',
        isWithinGeofence: true,
        distanceFromAddress: 50,
        geofencePassed: true,
        deviceId: 'device-123',
        method: 'GPS',
        locationSource: 'GPS_SATELLITE',
        mockLocationDetected: false,
        verificationPassed: true,
      },
      recordStatus: 'COMPLETE',
      verificationLevel: 'FULL',
      complianceFlags: ['COMPLIANT'],
      integrityHash: 'hash-123',
      integrityChecksum: 'checksum-123',
      recordedAt: new Date(),
      recordedBy: 'user-123',
      syncMetadata: {
        syncId: 'sync-123',
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
      },
      createdAt: new Date(),
      createdBy: 'user-123',
      updatedAt: new Date(),
      updatedBy: 'user-123',
      version: 1,
    };

    const floridaConfigWithMCO = {
      state: 'FL' as const,
      requiresGPS: true,
      requiresPhotoVerification: false,
      minimumAccuracyMeters: 100,
      geoPerimeterTolerance: 250,
      clockInGracePeriodMinutes: 15,
      clockOutGracePeriodMinutes: 15,
      allowTelephonyFallback: true,
      aggregatorId: 'HHAEXCHANGE',
      allowedVerificationMethods: ['GPS', 'NETWORK'],
      mcoRequirements: {
        mcoId: 'HUMANA_FL',
        mcoName: 'Humana Florida',
        requiresClientSignature: true,
        requiresPhotoVerification: false,
      },
    };

    describe('client signature validation', () => {
      it('should pass when MCO requires signature and signature is present', () => {
        const recordWithSignature: EVVRecord = {
          ...baseMockEVVRecord,
          clientAttestation: {
            attestedBy: 'client-123',
            attestedByName: 'John Doe',
            attestedAt: new Date('2025-01-15T11:00:00Z'),
            attestationType: 'SIGNATURE',
            signatureData: 'base64-encoded-signature',
            signatureHash: 'signature-hash-123',
            statement: 'I acknowledge receipt of home care services',
            deviceId: 'device-123',
          },
        };

        const result = validator.validateStateRequirements(
          'FL',
          floridaConfigWithMCO,
          recordWithSignature
        );

        expect(result.complianceFlags).not.toContain('MISSING_SIGNATURE');
        expect(result.issues).not.toContainEqual(
          expect.objectContaining({ issueType: 'MISSING_SIGNATURE' })
        );
      });

      it('should fail when MCO requires signature and signature is missing', () => {
        const recordWithoutSignature: EVVRecord = {
          ...baseMockEVVRecord,
          clientAttestation: undefined,
        };

        const result = validator.validateStateRequirements(
          'FL',
          floridaConfigWithMCO,
          recordWithoutSignature
        );

        expect(result.passed).toBe(false);
        expect(result.complianceFlags).toContain('MISSING_SIGNATURE');
        expect(result.issues).toContainEqual({
          issueType: 'MISSING_SIGNATURE',
          severity: 'HIGH',
          description: 'MCO Humana Florida requires client signature',
          canBeOverridden: false,
          requiresSupervisor: true,
        });
        expect(result.requiresSupervisorReview).toBe(true);
      });

      it('should pass when MCO does not require signature and signature is missing', () => {
        const configWithoutSignatureRequirement = {
          ...floridaConfigWithMCO,
          mcoRequirements: {
            ...floridaConfigWithMCO.mcoRequirements,
            requiresClientSignature: false,
          },
        };

        const recordWithoutSignature: EVVRecord = {
          ...baseMockEVVRecord,
          clientAttestation: undefined,
        };

        const result = validator.validateStateRequirements(
          'FL',
          configWithoutSignatureRequirement,
          recordWithoutSignature
        );

        expect(result.complianceFlags).not.toContain('MISSING_SIGNATURE');
        expect(result.issues).not.toContainEqual(
          expect.objectContaining({ issueType: 'MISSING_SIGNATURE' })
        );
      });
    });

    describe('photo verification validation', () => {
      it('should pass when MCO requires photo and clock-in photo is present', () => {
        const configWithPhotoRequirement = {
          ...floridaConfigWithMCO,
          mcoRequirements: {
            ...floridaConfigWithMCO.mcoRequirements,
            requiresPhotoVerification: true,
          },
        };

        const recordWithClockInPhoto: EVVRecord = {
          ...baseMockEVVRecord,
          clockInVerification: {
            ...baseMockEVVRecord.clockInVerification!,
            photoUrl: 's3://bucket/photos/clock-in-photo-123.jpg',
            photoHash: 'photo-hash-123',
          },
        };

        const result = validator.validateStateRequirements(
          'FL',
          configWithPhotoRequirement,
          recordWithClockInPhoto
        );

        expect(result.issues).not.toContainEqual(
          expect.objectContaining({ issueType: 'MISSING_PHOTO_VERIFICATION' })
        );
      });

      it('should pass when MCO requires photo and clock-out photo is present', () => {
        const configWithPhotoRequirement = {
          ...floridaConfigWithMCO,
          mcoRequirements: {
            ...floridaConfigWithMCO.mcoRequirements,
            requiresPhotoVerification: true,
          },
        };

        const recordWithClockOutPhoto: EVVRecord = {
          ...baseMockEVVRecord,
          clockOutVerification: {
            ...baseMockEVVRecord.clockOutVerification!,
            photoUrl: 's3://bucket/photos/clock-out-photo-123.jpg',
            photoHash: 'photo-hash-456',
          },
        };

        const result = validator.validateStateRequirements(
          'FL',
          configWithPhotoRequirement,
          recordWithClockOutPhoto
        );

        expect(result.issues).not.toContainEqual(
          expect.objectContaining({ issueType: 'MISSING_PHOTO_VERIFICATION' })
        );
      });

      it('should fail when MCO requires photo and no photos are present', () => {
        const configWithPhotoRequirement = {
          ...floridaConfigWithMCO,
          mcoRequirements: {
            ...floridaConfigWithMCO.mcoRequirements,
            requiresPhotoVerification: true,
          },
        };

        const recordWithoutPhotos: EVVRecord = {
          ...baseMockEVVRecord,
          clockInVerification: {
            ...baseMockEVVRecord.clockInVerification!,
            photoUrl: undefined,
            photoHash: undefined,
          },
          clockOutVerification: {
            ...baseMockEVVRecord.clockOutVerification!,
            photoUrl: undefined,
            photoHash: undefined,
          },
        };

        const result = validator.validateStateRequirements(
          'FL',
          configWithPhotoRequirement,
          recordWithoutPhotos
        );

        expect(result.passed).toBe(false);
        expect(result.issues).toContainEqual({
          issueType: 'MISSING_PHOTO_VERIFICATION',
          severity: 'HIGH',
          description: 'MCO Humana Florida requires photo verification',
          canBeOverridden: false,
          requiresSupervisor: true,
        });
        expect(result.requiresSupervisorReview).toBe(true);
      });

      it('should pass when MCO does not require photo and no photos are present', () => {
        const configWithoutPhotoRequirement = {
          ...floridaConfigWithMCO,
          mcoRequirements: {
            ...floridaConfigWithMCO.mcoRequirements,
            requiresPhotoVerification: false,
          },
        };

        const recordWithoutPhotos: EVVRecord = {
          ...baseMockEVVRecord,
          clockInVerification: {
            ...baseMockEVVRecord.clockInVerification!,
            photoUrl: undefined,
          },
          clockOutVerification: {
            ...baseMockEVVRecord.clockOutVerification!,
            photoUrl: undefined,
          },
        };

        const result = validator.validateStateRequirements(
          'FL',
          configWithoutPhotoRequirement,
          recordWithoutPhotos
        );

        expect(result.issues).not.toContainEqual(
          expect.objectContaining({ issueType: 'MISSING_PHOTO_VERIFICATION' })
        );
      });
    });

    describe('combined MCO requirements', () => {
      it('should fail with both signature and photo missing when both are required', () => {
        const configRequiringBoth = {
          ...floridaConfigWithMCO,
          mcoRequirements: {
            mcoId: 'SUNSHINE_FL',
            mcoName: 'Sunshine Health',
            requiresClientSignature: true,
            requiresPhotoVerification: true,
          },
        };

        const recordMissingBoth: EVVRecord = {
          ...baseMockEVVRecord,
          clientAttestation: undefined,
          clockInVerification: {
            ...baseMockEVVRecord.clockInVerification!,
            photoUrl: undefined,
          },
          clockOutVerification: {
            ...baseMockEVVRecord.clockOutVerification!,
            photoUrl: undefined,
          },
        };

        const result = validator.validateStateRequirements(
          'FL',
          configRequiringBoth,
          recordMissingBoth
        );

        expect(result.passed).toBe(false);
        expect(result.complianceFlags).toContain('MISSING_SIGNATURE');
        expect(result.issues).toContainEqual({
          issueType: 'MISSING_SIGNATURE',
          severity: 'HIGH',
          description: 'MCO Sunshine Health requires client signature',
          canBeOverridden: false,
          requiresSupervisor: true,
        });
        expect(result.issues).toContainEqual({
          issueType: 'MISSING_PHOTO_VERIFICATION',
          severity: 'HIGH',
          description: 'MCO Sunshine Health requires photo verification',
          canBeOverridden: false,
          requiresSupervisor: true,
        });
        expect(result.requiresSupervisorReview).toBe(true);
      });

      it('should pass with both signature and photo present when both are required', () => {
        const configRequiringBoth = {
          ...floridaConfigWithMCO,
          mcoRequirements: {
            mcoId: 'SUNSHINE_FL',
            mcoName: 'Sunshine Health',
            requiresClientSignature: true,
            requiresPhotoVerification: true,
          },
        };

        const recordWithBoth: EVVRecord = {
          ...baseMockEVVRecord,
          clientAttestation: {
            attestedBy: 'client-123',
            attestedByName: 'John Doe',
            attestedAt: new Date('2025-01-15T11:00:00Z'),
            attestationType: 'SIGNATURE',
            signatureData: 'base64-encoded-signature',
            signatureHash: 'signature-hash-123',
            statement: 'I acknowledge receipt of home care services',
            deviceId: 'device-123',
          },
          clockInVerification: {
            ...baseMockEVVRecord.clockInVerification!,
            photoUrl: 's3://bucket/photos/clock-in-123.jpg',
            photoHash: 'photo-hash-123',
          },
        };

        const result = validator.validateStateRequirements(
          'FL',
          configRequiringBoth,
          recordWithBoth
        );

        expect(result.complianceFlags).not.toContain('MISSING_SIGNATURE');
        expect(result.issues).not.toContainEqual(
          expect.objectContaining({ issueType: 'MISSING_SIGNATURE' })
        );
        expect(result.issues).not.toContainEqual(
          expect.objectContaining({ issueType: 'MISSING_PHOTO_VERIFICATION' })
        );
      });
    });
  });
});
