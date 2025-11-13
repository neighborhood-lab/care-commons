/**
 * OhioEVVProvider Tests
 *
 * Tests for Ohio-specific EVV compliance requirements and Sandata aggregator integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OhioEVVProvider } from '../ohio-evv-provider';
import type { Database } from '@care-commons/core';
import type { EVVRecord, LocationVerification } from '../../types/evv';

describe('OhioEVVProvider', () => {
  let provider: OhioEVVProvider;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as unknown as Database;
    provider = new OhioEVVProvider(mockDatabase);
  });

  describe('submitToAggregator', () => {
    it('should submit to Sandata with Ohio-specific fields', async () => {
      const mockConfig = {
        medicaid_program: 'OHIO_MEDICAID',
      };

      const mockEVVRecord = {
        id: 'evv-123',
        visitId: 'visit-123',
        organizationId: 'org-123',
        clientId: 'client-123',
        clientMedicaidId: 'OH-123456789',
        caregiverEmployeeId: 'CG-001',
        serviceTypeCode: 'PCA',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T09:00:00Z'),
        clockOutTime: new Date('2025-01-15T13:00:00Z'),
        clockInVerification: {
          latitude: 39.9612,
          longitude: -82.9988,
          accuracy: 10,
        } as LocationVerification,
        recordedBy: 'user-123',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] }) // Config query
        .mockResolvedValueOnce({ rows: [{ id: 'submission-123' }] }); // Submission insert

      const result = await provider.submitToAggregator(mockEVVRecord);

      expect(result).toEqual({
        submissionId: 'submission-123',
        status: 'PENDING',
        aggregator: 'SANDATA',
        submittedAt: expect.any(Date),
      });

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO state_aggregator_submissions'),
        expect.arrayContaining(['evv-123', expect.any(String), 'user-123'])
      );
    });

    it('should include service category in submission payload', async () => {
      const mockConfig = { medicaid_program: 'OHIO_MEDICAID' };
      const mockEVVRecord = {
        id: 'evv-123',
        visitId: 'visit-123',
        organizationId: 'org-123',
        serviceTypeCode: 'SN', // Skilled Nursing - home health
        clientMedicaidId: 'OH-123456789',
        caregiverEmployeeId: 'CG-001',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T09:00:00Z'),
        clockOutTime: new Date('2025-01-15T13:00:00Z'),
        clockInVerification: {
          latitude: 39.9612,
          longitude: -82.9988,
          accuracy: 10,
        } as LocationVerification,
        recordedBy: 'user-123',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] })
        .mockResolvedValueOnce({ rows: [{ id: 'submission-123' }] });

      await provider.submitToAggregator(mockEVVRecord);

      const insertCall = (mockDatabase.query as ReturnType<typeof vi.fn>).mock.calls[1];
      const payload = JSON.parse(insertCall[1][1]);

      expect(payload.odmServiceCategory).toBe('HOME_HEALTH');
    });

    it('should throw error when config not found', async () => {
      const mockEVVRecord = {
        organizationId: 'org-123',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

      await expect(provider.submitToAggregator(mockEVVRecord)).rejects.toThrow(
        'OH EVV configuration not found for organization'
      );
    });
  });

  describe('validateVisit', () => {
    it('should pass validation with all required fields', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'OH-123456789',
        serviceTypeCode: 'PCA',
        stateSpecificData: {},
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation without Medicaid ID', () => {
      const mockEVVRecord = {
        serviceTypeCode: 'PCA',
        stateSpecificData: {},
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('OH_MISSING_MEDICAID_ID');
    });

    it('should warn when visit tolerance exceeded', () => {
      const scheduledTime = new Date('2025-01-15T09:00:00Z');
      const actualTime = new Date('2025-01-15T09:20:00Z'); // 20 minutes late

      const mockEVVRecord = {
        clientMedicaidId: 'OH-123456789',
        serviceTypeCode: 'PCA',
        clockInTime: actualTime,
        stateSpecificData: {
          scheduledStartTime: scheduledTime,
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('OH_VISIT_TOLERANCE_EXCEEDED');
    });
  });

  describe('validateGeofence', () => {
    it('should pass validation within 1 mile radius', () => {
      const location = {
        latitude: 39.9612,
        longitude: -82.9988,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 39.9700,
        longitude: -83.0000,
        street1: '123 Main St',
        city: 'Columbus',
        state: 'OH',
        zipCode: '43215',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(true);
    });

    it('should fail validation outside 1 mile radius', () => {
      const location = {
        latitude: 39.9612,
        longitude: -82.9988,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 40.0000,
        longitude: -83.0500,
        street1: '456 Oak Ave',
        city: 'Columbus',
        state: 'OH',
        zipCode: '43215',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(false);
    });

    it('should fail validation without address coordinates', () => {
      const location = {
        latitude: 39.9612,
        longitude: -82.9988,
      } as LocationVerification;

      const serviceAddress = {
        street1: '123 Main St',
        city: 'Columbus',
        state: 'OH',
        zipCode: '43215',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(false);
    });
  });

  describe('determineServiceCategory', () => {
    it('should categorize skilled nursing as home health', () => {
      const result = provider.determineServiceCategory('SN');
      expect(result).toBe('HOME_HEALTH');
    });

    it('should categorize physical therapy as home health', () => {
      const result = provider.determineServiceCategory('PT');
      expect(result).toBe('HOME_HEALTH');
    });

    it('should categorize personal care as waiver', () => {
      const result = provider.determineServiceCategory('PCA');
      expect(result).toBe('WAIVER');
    });

    it('should categorize respite as waiver', () => {
      const result = provider.determineServiceCategory('RESPITE');
      expect(result).toBe('WAIVER');
    });

    it('should default unknown codes to waiver', () => {
      const result = provider.determineServiceCategory('UNKNOWN_CODE');
      expect(result).toBe('WAIVER');
    });
  });
});
