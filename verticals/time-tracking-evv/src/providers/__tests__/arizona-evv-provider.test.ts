/**
 * ArizonaEVVProvider Tests
 *
 * Tests for Arizona-specific EVV compliance requirements with Sandata aggregator
 * and AHCCCS program support (DDD, ALTCS, EPD, SMI).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArizonaEVVProvider } from '../arizona-evv-provider';
import type { Database } from '@care-commons/core';
import type { EVVRecord, LocationVerification } from '../../types/evv';

describe('ArizonaEVVProvider', () => {
  let provider: ArizonaEVVProvider;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as unknown as Database;
    provider = new ArizonaEVVProvider(mockDatabase);
  });

  describe('submitToAggregator', () => {
    it('should submit to Sandata with Arizona-specific fields', async () => {
      const mockConfig = {
        medicaid_program: 'AHCCCS_ALTCS',
      };

      const mockEVVRecord = {
        id: 'evv-AZ001',
        visitId: 'visit-AZ001',
        organizationId: 'org-AZ001',
        clientId: 'client-AZ001',
        clientMedicaidId: 'AZ-888999000',
        caregiverEmployeeId: 'CG-AZ-005',
        serviceTypeCode: 'PCA',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T13:00:00Z'),
        clockOutTime: new Date('2025-01-15T17:00:00Z'),
        clockInVerification: {
          latitude: 33.4484,
          longitude: -112.0740,
          accuracy: 11,
        } as LocationVerification,
        stateSpecificData: {
          ahcccsID: 'AZ-888999000',
        },
        recordedBy: 'user-AZ001',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] }) // Config query
        .mockResolvedValueOnce({ rows: [{ program_type: 'ALTCS' }] }) // Program determination
        .mockResolvedValueOnce({ rows: [{ id: 'submission-AZ001' }] }); // Submission insert

      const result = await provider.submitToAggregator(mockEVVRecord);

      expect(result).toEqual({
        submissionId: 'submission-AZ001',
        status: 'PENDING',
        aggregator: 'SANDATA',
        submittedAt: expect.any(Date),
      });
    });

    it('should include AHCCCS ID and program type in submission payload', async () => {
      const mockConfig = { medicaid_program: 'AHCCCS_ALTCS' };
      const mockEVVRecord = {
        id: 'evv-AZ001',
        visitId: 'visit-AZ001',
        organizationId: 'org-AZ001',
        clientId: 'client-AZ001',
        serviceTypeCode: 'PCA',
        clientMedicaidId: 'AZ-888999000',
        caregiverEmployeeId: 'CG-AZ-005',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T13:00:00Z'),
        clockOutTime: new Date('2025-01-15T17:00:00Z'),
        clockInVerification: {
          latitude: 33.4484,
          longitude: -112.0740,
          accuracy: 11,
        } as LocationVerification,
        stateSpecificData: {
          ahcccsID: 'AZ-888999000',
        },
        recordedBy: 'user-AZ001',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] })
        .mockResolvedValueOnce({ rows: [{ program_type: 'DDD' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'submission-AZ001' }] });

      await provider.submitToAggregator(mockEVVRecord);

      const insertCall = (mockDatabase.query as ReturnType<typeof vi.fn>).mock.calls[2];
      const payload = JSON.parse(insertCall[1][1]);

      expect(payload.ahcccsId).toBe('AZ-888999000');
      expect(payload.programType).toBe('DDD');
    });

    it('should mark non-medical services in submission payload', async () => {
      const mockConfig = { medicaid_program: 'AHCCCS_ALTCS' };
      const mockEVVRecord = {
        id: 'evv-AZ001',
        visitId: 'visit-AZ001',
        organizationId: 'org-AZ001',
        clientId: 'client-AZ001',
        serviceTypeCode: 'TRANSPORTATION', // Non-medical
        clientMedicaidId: 'AZ-888999000',
        caregiverEmployeeId: 'CG-AZ-005',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T13:00:00Z'),
        clockOutTime: new Date('2025-01-15T17:00:00Z'),
        clockInVerification: {
          latitude: 33.4484,
          longitude: -112.0740,
          accuracy: 11,
        } as LocationVerification,
        stateSpecificData: {
          ahcccsID: 'AZ-888999000',
        },
        recordedBy: 'user-AZ001',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] })
        .mockResolvedValueOnce({ rows: [{ program_type: 'ALTCS' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'submission-AZ001' }] });

      await provider.submitToAggregator(mockEVVRecord);

      const insertCall = (mockDatabase.query as ReturnType<typeof vi.fn>).mock.calls[2];
      const payload = JSON.parse(insertCall[1][1]);

      expect(payload.isNonMedical).toBe(true);
    });
  });

  describe('validateVisit', () => {
    it('should pass validation with all required fields', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'AZ-888999000',
        serviceTypeCode: 'PCA',
        stateSpecificData: {
          ahcccsID: 'AZ-888999000',
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation without AHCCCS ID', () => {
      const mockEVVRecord = {
        serviceTypeCode: 'PCA',
        stateSpecificData: {},
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'AZ_MISSING_AHCCCS_ID' })
      );
    });

    it('should warn about missing NPI for medical services', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'AZ-888999000',
        serviceTypeCode: 'SN', // Skilled Nursing - medical service
        stateSpecificData: {
          ahcccsID: 'AZ-888999000',
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'AZ_MISSING_NPI' })
      );
    });

    it('should not warn about NPI for non-medical services', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'AZ-888999000',
        serviceTypeCode: 'PCA', // Personal Care - non-medical
        stateSpecificData: {
          ahcccsID: 'AZ-888999000',
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings.filter(w => w.code === 'AZ_MISSING_NPI')).toHaveLength(0);
    });
  });

  describe('validateGeofence', () => {
    it('should pass validation within 1 mile radius', () => {
      const location = {
        latitude: 33.4484,
        longitude: -112.0740,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 33.4550,
        longitude: -112.0700,
        street1: '300 W Washington St',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85003',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(true);
    });
  });

  describe('determineProgram', () => {
    it('should determine DDD from explicit program type', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ program_type: 'DDD' }],
      });

      const result = await provider.determineProgram('client-123' as any);

      expect(result).toBe('DDD');
    });

    it('should determine DDD from waiver program', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ ltc_program: 'DDD_WAIVER' }],
      });

      const result = await provider.determineProgram('client-456' as any);

      expect(result).toBe('DDD');
    });

    it('should determine EPD from waiver program', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ ltc_program: 'EPD_WAIVER' }],
      });

      const result = await provider.determineProgram('client-789' as any);

      expect(result).toBe('EPD');
    });

    it('should default to ALTCS', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ program_type: null, ltc_program: null }],
      });

      const result = await provider.determineProgram('client-999' as any);

      expect(result).toBe('ALTCS');
    });
  });
});
