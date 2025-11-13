/**
 * GeorgiaEVVProvider Tests
 *
 * Tests for Georgia-specific EVV compliance requirements with Tellus aggregator
 * and lenient rural exception handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeorgiaEVVProvider } from '../georgia-evv-provider';
import type { Database } from '@care-commons/core';
import type { EVVRecord, LocationVerification } from '../../types/evv';

describe('GeorgiaEVVProvider', () => {
  let provider: GeorgiaEVVProvider;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as unknown as Database;
    provider = new GeorgiaEVVProvider(mockDatabase);
  });

  describe('submitToAggregator', () => {
    it('should submit to Tellus with Georgia-specific fields', async () => {
      const mockConfig = {
        medicaid_program: 'CCSP_WAIVER',
      };

      const mockEVVRecord = {
        id: 'evv-789',
        visitId: 'visit-789',
        organizationId: 'org-789',
        clientId: 'client-789',
        clientMedicaidId: 'GA-555666777',
        caregiverEmployeeId: 'CG-003',
        serviceTypeCode: 'PCA',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T11:00:00Z'),
        clockOutTime: new Date('2025-01-15T15:00:00Z'),
        clockInVerification: {
          latitude: 33.7490,
          longitude: -84.3880,
          accuracy: 12,
        } as LocationVerification,
        stateSpecificData: {
          medicaidID: 'GA-555666777',
          isRuralArea: false,
        },
        recordedBy: 'user-789',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] }) // Config query
        .mockResolvedValueOnce({ rows: [{ program_type: 'CFC' }] }) // Program determination
        .mockResolvedValueOnce({ rows: [{ id: 'submission-789' }] }); // Submission insert

      const result = await provider.submitToAggregator(mockEVVRecord);

      expect(result).toEqual({
        submissionId: 'submission-789',
        status: 'PENDING',
        aggregator: 'TELLUS',
        submittedAt: expect.any(Date),
      });
    });

    it('should include program type in submission payload', async () => {
      const mockConfig = { medicaid_program: 'CCSP_WAIVER' };
      const mockEVVRecord = {
        id: 'evv-789',
        visitId: 'visit-789',
        organizationId: 'org-789',
        clientId: 'client-789',
        serviceTypeCode: 'PCA',
        clientMedicaidId: 'GA-555666777',
        caregiverEmployeeId: 'CG-003',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T11:00:00Z'),
        clockOutTime: new Date('2025-01-15T15:00:00Z'),
        clockInVerification: {
          latitude: 33.7490,
          longitude: -84.3880,
          accuracy: 12,
        } as LocationVerification,
        stateSpecificData: {
          medicaidID: 'GA-555666777',
        },
        recordedBy: 'user-789',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] })
        .mockResolvedValueOnce({ rows: [{ program_type: 'HCBS' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'submission-789' }] });

      await provider.submitToAggregator(mockEVVRecord);

      const insertCall = (mockDatabase.query as ReturnType<typeof vi.fn>).mock.calls[2];
      const payload = JSON.parse(insertCall[1][1]);

      expect(payload.programType).toBe('HCBS');
    });
  });

  describe('validateVisit', () => {
    it('should pass validation with all required fields', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'GA-555666777',
        serviceTypeCode: 'PCA',
        stateSpecificData: {
          medicaidID: 'GA-555666777',
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply lenient tolerance for rural areas', () => {
      const scheduledTime = new Date('2025-01-15T11:00:00Z');
      const actualTime = new Date('2025-01-15T11:25:00Z'); // 25 minutes late

      const mockEVVRecord = {
        clientMedicaidId: 'GA-555666777',
        serviceTypeCode: 'PCA',
        clockInTime: actualTime,
        stateSpecificData: {
          medicaidID: 'GA-555666777',
          scheduledStartTime: scheduledTime,
          isRuralArea: true, // Rural area gets lenient tolerance
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('GA_VISIT_TOLERANCE_RURAL');
    });

    it('should warn for non-rural areas exceeding tolerance', () => {
      const scheduledTime = new Date('2025-01-15T11:00:00Z');
      const actualTime = new Date('2025-01-15T11:20:00Z'); // 20 minutes late

      const mockEVVRecord = {
        clientMedicaidId: 'GA-555666777',
        serviceTypeCode: 'PCA',
        clockInTime: actualTime,
        stateSpecificData: {
          medicaidID: 'GA-555666777',
          scheduledStartTime: scheduledTime,
          isRuralArea: false,
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('GA_VISIT_TOLERANCE_EXCEEDED');
    });
  });

  describe('validateGeofence', () => {
    it('should pass validation within 1 mile radius', () => {
      const location = {
        latitude: 33.7490,
        longitude: -84.3880,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 33.7550,
        longitude: -84.3900,
        street1: '100 Peachtree St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30303',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(true);
    });
  });

  describe('determineProgram', () => {
    it('should determine CFC from explicit program type', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ program_type: 'CFC' }],
      });

      const result = await provider.determineProgram('client-123' as any);

      expect(result).toBe('CFC');
    });

    it('should determine CFC from waiver program code', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ waiver_program: 'CCSP' }],
      });

      const result = await provider.determineProgram('client-456' as any);

      expect(result).toBe('CFC');
    });

    it('should default to HCBS', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [{ program_type: null, waiver_program: 'OTHER' }],
      });

      const result = await provider.determineProgram('client-789' as any);

      expect(result).toBe('HCBS');
    });
  });
});
