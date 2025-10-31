/**
 * Tests for EVV Service - Core business logic for time tracking and verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EVVService } from '../service/evv-service';
import { EVVRepository } from '../repository/evv-repository';
import { EVVValidator } from '../validation/evv-validator';
import { IntegrationService } from '../utils/integration-service';
import { CryptoUtils } from '../utils/crypto-utils';
import {
  EVVRecord,
  TimeEntry,
  ClockInInput,
  ClockOutInput,
  LocationVerification,
  VerificationResult,
} from '../types/evv';
import { UUID } from '@care-commons/core';
import { IVisitProvider, IClientProvider, ICaregiverProvider } from '../interfaces/visit-provider';
import { Database, UserContext } from '@care-commons/core';
import { ValidationError, PermissionError, NotFoundError } from '@care-commons/core';

// Mock implementations
const mockRepository = {
  createEVVRecord: vi.fn(),
  getEVVRecordById: vi.fn(),
  getEVVRecordByVisitId: vi.fn(),
  updateEVVRecord: vi.fn(),
  searchEVVRecords: vi.fn(),
  createTimeEntry: vi.fn(),
  getTimeEntryById: vi.fn(),
  updateTimeEntry: vi.fn(),
  getTimeEntriesByVisitId: vi.fn(),
  createGeofence: vi.fn(),
  getGeofenceByAddress: vi.fn(),
  updateGeofenceStats: vi.fn(),
} as any;

const mockValidator = {
  validateClockIn: vi.fn(),
  validateClockOut: vi.fn(),
  validateGeofence: vi.fn(),
  checkGeofence: vi.fn(),
  performVerification: vi.fn(),
} as any;

const mockIntegrationService = {
  syncTimeEntry: vi.fn(),
  processOfflineData: vi.fn(),
} as any;

const mockVisitProvider = {
  canClockIn: vi.fn(),
  getVisitForEVV: vi.fn(),
} as any;

const mockClientProvider = {
  getClientForEVV: vi.fn(),
} as any;

const mockCaregiverProvider = {
  getCaregiverForEVV: vi.fn(),
  canProvideService: vi.fn(),
} as any;

const mockDatabase = {} as Database;

describe('EVVService', () => {
  let service: EVVService;
  let userContext: UserContext;

  beforeEach(() => {
    service = new EVVService(
      mockRepository,
      mockIntegrationService,
      mockVisitProvider,
      mockClientProvider,
      mockCaregiverProvider,
      mockDatabase,
      mockValidator
    );

    userContext = {
      userId: 'caregiver-123' as UUID,
      organizationId: 'org-123' as UUID,
      branchIds: ['branch-123' as UUID],
      roles: ['CAREGIVER' as any],
      permissions: ['evv:clock_in' as any, 'evv:clock_out' as any, 'evv:read' as any],
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('clockIn', () => {
    const validClockInInput: ClockInInput = {
      visitId: 'visit-123' as UUID,
      caregiverId: 'caregiver-123' as UUID,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS',
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

    it('should successfully clock in with valid data and location', async () => {
      // Setup mocks
      mockValidator.validateClockIn.mockReturnValue(undefined);
      mockVisitProvider.canClockIn.mockResolvedValue(true);
      mockVisitProvider.getVisitForEVV.mockResolvedValue({
        id: 'visit-123',
        clientId: 'client-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        serviceTypeCode: 'HCBS',
        serviceTypeName: 'Home Care',
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
      });

      mockClientProvider.getClientForEVV.mockResolvedValue({
        id: 'client-123',
        name: 'John Doe',
        medicaidId: 'MED123',
      });

      mockCaregiverProvider.getCaregiverForEVV.mockResolvedValue({
        id: 'caregiver-123',
        name: 'Jane Smith',
        employeeId: 'EMP123',
        nationalProviderId: 'NPI123',
      });

      mockCaregiverProvider.canProvideService.mockResolvedValue({
        authorized: true,
      });

      mockRepository.getGeofenceByAddress.mockResolvedValue({
        id: 'geofence-123',
        centerLatitude: 40.7128,
        centerLongitude: -74.0060,
        radiusMeters: 100,
        isActive: true,
        allowedVariance: 10,
      });

      mockValidator.checkGeofence.mockReturnValue({
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      });

      mockRepository.createTimeEntry.mockResolvedValue({
        id: 'time-entry-123',
        visitId: 'visit-123',
        entryType: 'CLOCK_IN',
        status: 'VERIFIED',
        verificationPassed: true,
      });

      mockRepository.createEVVRecord.mockResolvedValue({
        id: 'evv-123',
        visitId: 'visit-123',
        recordStatus: 'PENDING',
        verificationLevel: 'FULL',
        complianceFlags: ['COMPLIANT'],
      });

      mockValidator.performVerification.mockReturnValue({
        passed: true,
        verificationLevel: 'FULL',
        complianceFlags: ['COMPLIANT'],
        issues: [],
        requiresSupervisorReview: false,
      });

      const result = await service.clockIn(validClockInInput, userContext);

      expect(result).toBeDefined();
      expect(result.evvRecord).toBeDefined();
      expect(result.timeEntry).toBeDefined();
      expect(result.verification.passed).toBe(true);

      expect(mockValidator.validateClockIn).toHaveBeenCalledWith(validClockInInput);
      expect(mockVisitProvider.canClockIn).toHaveBeenCalledWith('visit-123', 'caregiver-123');
      expect(mockRepository.createTimeEntry).toHaveBeenCalled();
      expect(mockRepository.createEVVRecord).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid input', async () => {
      mockValidator.validateClockIn.mockImplementation(() => {
        throw new ValidationError('Invalid clock-in data', { errors: ['location is required'] });
      });

      await expect(service.clockIn(validClockInInput, userContext))
        .rejects.toThrow(ValidationError);
    });

    it('should throw PermissionError when user lacks permission', async () => {
      mockValidator.validateClockIn.mockReturnValue(undefined);
      
      const unauthorizedUser = {
        ...userContext,
        permissions: [],
      };

      await expect(service.clockIn(validClockInInput, unauthorizedUser))
        .rejects.toThrow(PermissionError);
    });

    it('should throw PermissionError when caregiver tries to clock in for another caregiver', async () => {
      mockValidator.validateClockIn.mockReturnValue(undefined);
      
      const otherCaregiverInput = {
        ...validClockInInput,
        caregiverId: 'other-caregiver-456' as UUID,
      };

      await expect(service.clockIn(otherCaregiverInput, userContext))
        .rejects.toThrow(PermissionError);
    });

    it('should throw ValidationError when visit does not allow clock in', async () => {
      mockValidator.validateClockIn.mockReturnValue(undefined);
      mockVisitProvider.canClockIn.mockResolvedValue(false);

      await expect(service.clockIn(validClockInInput, userContext))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when caregiver is not authorized for service', async () => {
      mockValidator.validateClockIn.mockReturnValue(undefined);
      mockVisitProvider.canClockIn.mockResolvedValue(true);
      mockVisitProvider.getVisitForEVV.mockResolvedValue({
        id: 'visit-123',
        clientId: 'client-123',
        serviceTypeCode: 'HCBS',
        serviceAddress: {
          latitude: 40.7128,
          longitude: -74.0060,
          geofenceRadius: 100,
        },
      });

      mockCaregiverProvider.canProvideService.mockResolvedValue({
        authorized: false,
        reason: 'Missing certification',
        missingCredentials: ['CPR'],
        blockedReasons: ['EXPIRED_LICENSE'],
      });

      await expect(service.clockIn(validClockInInput, userContext))
        .rejects.toThrow(ValidationError);
    });

    it('should handle geofence violation', async () => {
      // Setup mocks for geofence violation
      mockValidator.validateClockIn.mockReturnValue(undefined);
      mockVisitProvider.canClockIn.mockResolvedValue(true);
      mockVisitProvider.getVisitForEVV.mockResolvedValue({
        id: 'visit-123',
        clientId: 'client-123',
        organizationId: 'org-123',
        serviceTypeCode: 'HCBS',
        serviceAddress: {
          latitude: 40.7128,
          longitude: -74.0060,
          geofenceRadius: 100,
        },
      });

      mockClientProvider.getClientForEVV.mockResolvedValue({
        id: 'client-123',
        name: 'John Doe',
      });

      mockCaregiverProvider.getCaregiverForEVV.mockResolvedValue({
        id: 'caregiver-123',
        name: 'Jane Smith',
        employeeId: 'EMP123',
      });

      mockCaregiverProvider.canProvideService.mockResolvedValue({
        authorized: true,
      });

      mockRepository.getGeofenceByAddress.mockResolvedValue({
        id: 'geofence-123',
        centerLatitude: 40.7128,
        centerLongitude: -74.0060,
        radiusMeters: 100,
      });

      mockValidator.checkGeofence.mockReturnValue({
        isWithinGeofence: false,
        distanceFromCenter: 150,
        distanceFromAddress: 150,
        accuracy: 10,
        requiresManualReview: true,
        reason: 'Location outside geofence',
      });

      mockRepository.createTimeEntry.mockResolvedValue({
        id: 'time-entry-123',
        status: 'FLAGGED',
        verificationPassed: false,
      });

      mockRepository.createEVVRecord.mockResolvedValue({
        id: 'evv-123',
        recordStatus: 'PENDING',
        verificationLevel: 'PARTIAL',
        complianceFlags: ['GEOFENCE_VIOLATION'],
      });

      mockValidator.performVerification.mockReturnValue({
        passed: false,
        verificationLevel: 'PARTIAL',
        complianceFlags: ['GEOFENCE_VIOLATION'],
        issues: [{
          issueType: 'GEOFENCE_VIOLATION',
          severity: 'HIGH',
          description: 'Location verification failed',
          canBeOverridden: true,
          requiresSupervisor: true,
        }],
        requiresSupervisorReview: true,
      });

      const result = await service.clockIn(validClockInInput, userContext);

      expect(result.verification.passed).toBe(false);
      expect(result.verification.complianceFlags).toContain('GEOFENCE_VIOLATION');
      expect(result.verification.requiresSupervisorReview).toBe(true);
    });
  });

  describe('clockOut', () => {
    const validClockOutInput: ClockOutInput = {
      visitId: 'visit-123' as UUID,
      evvRecordId: 'evv-123' as UUID,
      caregiverId: 'caregiver-123' as UUID,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS',
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

    const existingEVVRecord: EVVRecord = {
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
      clockInTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      clockOutTime: null,
      clockInVerification: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        timestampSource: 'DEVICE',
        isWithinGeofence: true,
        distanceFromAddress: 5,
        geofencePassed: true,
        deviceId: 'device-123',
        method: 'GPS',
        locationSource: 'GPS_SATELLITE',
        mockLocationDetected: false,
        verificationPassed: true,
      },
      recordStatus: 'PENDING',
      verificationLevel: 'FULL',
      complianceFlags: ['COMPLIANT'],
      integrityHash: 'hash123',
      integrityChecksum: 'checksum123',
      recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      recordedBy: 'caregiver-123',
      syncMetadata: {
        syncId: 'sync-123',
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdBy: 'caregiver-123',
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedBy: 'caregiver-123',
      version: 1,
    };

    it('should successfully clock out with valid data', async () => {
      mockValidator.validateClockOut.mockReturnValue(undefined);
      mockRepository.getEVVRecordById.mockResolvedValue(existingEVVRecord);
      mockRepository.getGeofenceByAddress.mockResolvedValue({
        id: 'geofence-123',
        centerLatitude: 40.7128,
        centerLongitude: -74.0060,
        radiusMeters: 100,
      });

      mockValidator.checkGeofence.mockReturnValue({
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      });

      mockRepository.createTimeEntry.mockResolvedValue({
        id: 'time-entry-clockout',
        visitId: 'visit-123',
        entryType: 'CLOCK_OUT',
        status: 'VERIFIED',
        verificationPassed: true,
      });

      mockRepository.updateEVVRecord.mockResolvedValue({
        ...existingEVVRecord,
        clockOutTime: new Date(),
        totalDuration: 120,
        recordStatus: 'COMPLETE',
      });

      mockValidator.performVerification.mockReturnValue({
        passed: true,
        verificationLevel: 'FULL',
        complianceFlags: ['COMPLIANT'],
        issues: [],
        requiresSupervisorReview: false,
      });

      const result = await service.clockOut(validClockOutInput, userContext);

      expect(result).toBeDefined();
      expect(result.evvRecord.recordStatus).toBe('COMPLETE');
      expect(result.evvRecord.clockOutTime).toBeDefined();
      expect(result.evvRecord.totalDuration).toBe(120);
      expect(result.verification.passed).toBe(true);
    });

    it('should throw NotFoundError when EVV record does not exist', async () => {
      mockValidator.validateClockOut.mockReturnValue(undefined);
      mockRepository.getEVVRecordById.mockResolvedValue(null);

      await expect(service.clockOut(validClockOutInput, userContext))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when visit already clocked out', async () => {
      const completedRecord = {
        ...existingEVVRecord,
        recordStatus: 'COMPLETE' as const,
        clockOutTime: new Date(),
      };

      mockValidator.validateClockOut.mockReturnValue(undefined);
      mockRepository.getEVVRecordById.mockResolvedValue(completedRecord);

      await expect(service.clockOut(validClockOutInput, userContext))
        .rejects.toThrow(ValidationError);
    });

    it('should handle client signature attestation', async () => {
      const clockOutWithSignature = {
        ...validClockOutInput,
        clientSignature: {
          attestedByName: 'John Doe',
          attestationType: 'SIGNATURE' as const,
          signatureData: 'base64-signature-data',
          statement: 'I confirm services were provided',
        },
      };

      mockValidator.validateClockOut.mockReturnValue(undefined);
      mockRepository.getEVVRecordById.mockResolvedValue(existingEVVRecord);
      mockRepository.getGeofenceByAddress.mockResolvedValue({
        id: 'geofence-123',
        centerLatitude: 40.7128,
        centerLongitude: -74.0060,
        radiusMeters: 100,
      });

      mockValidator.checkGeofence.mockReturnValue({
        isWithinGeofence: true,
        distanceFromCenter: 5,
        distanceFromAddress: 5,
        accuracy: 10,
        requiresManualReview: false,
      });

      mockRepository.createTimeEntry.mockResolvedValue({
        id: 'time-entry-clockout',
        entryType: 'CLOCK_OUT',
        status: 'VERIFIED',
        verificationPassed: true,
      });

      mockRepository.updateEVVRecord.mockResolvedValue({
        ...existingEVVRecord,
        clockOutTime: new Date(),
        totalDuration: 120,
        recordStatus: 'COMPLETE',
        clientAttestation: {
          attestedBy: 'client-123',
          attestedByName: 'John Doe',
          attestedAt: new Date(),
          attestationType: 'SIGNATURE',
          signatureData: 'base64-signature-data',
          signatureHash: expect.any(String),
          statement: 'I confirm services were provided',
          deviceId: 'device-123',
        },
      });

      mockValidator.performVerification.mockReturnValue({
        passed: true,
        verificationLevel: 'FULL',
        complianceFlags: ['COMPLIANT'],
        issues: [],
        requiresSupervisorReview: false,
      });

      const result = await service.clockOut(clockOutWithSignature, userContext);

      expect(result.evvRecord.clientAttestation).toBeDefined();
      expect(result.evvRecord.clientAttestation?.attestedByName).toBe('John Doe');
      expect(result.evvRecord.clientAttestation?.signatureHash).toBeDefined();
    });
  });

  describe('applyManualOverride', () => {
    const overrideInput = {
      timeEntryId: 'time-entry-123' as UUID,
      reason: 'GPS unavailable in rural area',
      reasonCode: 'GPS_UNAVAILABLE' as const,
      supervisorName: 'Supervisor Smith',
      supervisorTitle: 'Care Coordinator',
      approvalAuthority: 'Agency Policy Section 4.2',
      notes: 'Client confirmed caregiver was present',
    };

    it('should apply manual override for supervisor', async () => {
      const supervisorUser = {
        ...userContext,
        roles: ['COORDINATOR' as any],
      };

      const timeEntry = {
        id: 'time-entry-123',
        status: 'FLAGGED',
        verificationPassed: false,
      };

      mockRepository.getTimeEntryById.mockResolvedValue(timeEntry);
      mockRepository.updateTimeEntry.mockResolvedValue({
        ...timeEntry,
        status: 'OVERRIDDEN',
        verificationPassed: true,
        manualOverride: {
          overrideBy: 'user-123',
          overrideAt: expect.any(Date),
          reason: 'GPS unavailable in rural area',
          reasonCode: 'GPS_UNAVAILABLE',
          supervisorName: 'Supervisor Smith',
          supervisorTitle: 'Care Coordinator',
          approvalAuthority: 'Agency Policy Section 4.2',
          notes: 'Client confirmed caregiver was present',
        },
      });

      const result = await service.applyManualOverride(overrideInput, supervisorUser);

      expect(result.status).toBe('OVERRIDDEN');
      expect(result.verificationPassed).toBe(true);
      expect(result.manualOverride).toBeDefined();
    });

    it('should throw PermissionError for non-supervisor', async () => {
      await expect(service.applyManualOverride(overrideInput, userContext))
        .rejects.toThrow(PermissionError);
    });

    it('should throw NotFoundError when time entry does not exist', async () => {
      const supervisorUser = {
        ...userContext,
        roles: ['COORDINATOR' as any],
      };

      mockRepository.getTimeEntryById.mockResolvedValue(null);

      await expect(service.applyManualOverride(overrideInput, supervisorUser))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('createGeofence', () => {
    const geofenceInput = {
      organizationId: 'org-123' as UUID,
      clientId: 'client-123' as UUID,
      addressId: 'address-123' as UUID,
      centerLatitude: 40.7128,
      centerLongitude: -74.0060,
      radiusMeters: 100,
    };

    it('should create geofence with valid data', async () => {
      const adminUser = {
        ...userContext,
        permissions: ['geofences:create' as any],
      };

      mockValidator.validateGeofence.mockReturnValue(undefined);
      mockRepository.createGeofence.mockResolvedValue({
        id: 'geofence-123',
        ...geofenceInput,
        isActive: true,
        status: 'ACTIVE',
      });

      const result = await service.createGeofence(geofenceInput, adminUser);

      expect(result.id).toBe('geofence-123');
      expect(result.centerLatitude).toBe(40.7128);
      expect(result.centerLongitude).toBe(-74.0060);
      expect(result.radiusMeters).toBe(100);
    });

    it('should throw PermissionError when user lacks geofence creation permission', async () => {
      await expect(service.createGeofence(geofenceInput, userContext))
        .rejects.toThrow(PermissionError);
    });
  });

  describe('getEVVRecordByVisit', () => {
    it('should return EVV record for visit', async () => {
      const evvRecord = {
        id: 'evv-123',
        visitId: 'visit-123',
      };

      mockRepository.getEVVRecordByVisitId.mockResolvedValue(evvRecord as EVVRecord);

      const result = await service.getEVVRecordByVisit('visit-123', userContext);

      expect(result).toBe(evvRecord);
      expect(mockRepository.getEVVRecordByVisitId).toHaveBeenCalledWith('visit-123');
    });

    it('should throw PermissionError when user lacks read permission', async () => {
      const unauthorizedUser = {
        ...userContext,
        permissions: [],
      };

      await expect(service.getEVVRecordByVisit('visit-123', unauthorizedUser))
        .rejects.toThrow(PermissionError);
    });
  });

  describe('searchEVVRecords', () => {
    it('should search EVV records with filters', async () => {
      const filters = {
        organizationId: 'org-123' as UUID,
        clientId: 'client-123' as UUID,
      };

      const pagination = {
        page: 1,
        limit: 10,
      };

      const searchResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockRepository.searchEVVRecords.mockResolvedValue(searchResult);

      const result = await service.searchEVVRecords(filters, pagination, userContext);

      expect(result).toBe(searchResult);
      expect(mockRepository.searchEVVRecords).toHaveBeenCalledWith(filters, pagination);
    });

    it('should throw PermissionError when user lacks read permission', async () => {
      const unauthorizedUser = {
        ...userContext,
        permissions: [],
      };

      await expect(service.searchEVVRecords({}, { page: 1, limit: 10 }, unauthorizedUser))
        .rejects.toThrow(PermissionError);
    });
  });
});