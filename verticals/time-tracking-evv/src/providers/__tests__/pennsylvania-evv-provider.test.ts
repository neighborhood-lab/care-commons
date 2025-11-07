/**
 * PennsylvaniaEVVProvider Tests
 *
 * Tests for Pennsylvania-specific EVV compliance requirements with stricter geofencing
 * and prior authorization verification.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PennsylvaniaEVVProvider } from '../pennsylvania-evv-provider.js';
import type { Database } from '@care-commons/core';
import type { EVVRecord, LocationVerification } from '../../types/evv';

describe('PennsylvaniaEVVProvider', () => {
  let provider: PennsylvaniaEVVProvider;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as unknown as Database;
    provider = new PennsylvaniaEVVProvider(mockDatabase);
  });

  describe('submitToAggregator', () => {
    it('should submit to Sandata with Pennsylvania-specific fields', async () => {
      const mockConfig = {
        medicaid_program: 'COMMUNITY_HEALTHCHOICES',
      };

      const mockEVVRecord = {
        id: 'evv-123',
        visitId: 'visit-123',
        organizationId: 'org-123',
        clientId: 'client-123',
        clientMedicaidId: 'PA-987654321',
        caregiverEmployeeId: 'CG-002',
        serviceTypeCode: 'PCA',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T10:00:00Z'),
        clockOutTime: new Date('2025-01-15T14:00:00Z'),
        clockInVerification: {
          latitude: 40.2732,
          longitude: -76.8867,
          accuracy: 8,
        } as LocationVerification,
        stateSpecificData: {
          authNumber: 'AUTH-123456',
          dhsRegion: 'SOUTHEAST',
        },
        recordedBy: 'user-456',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] }) // Config query
        .mockResolvedValueOnce({ rows: [{ id: 'auth-123' }] }) // Auth verification
        .mockResolvedValueOnce({ rows: [{ id: 'submission-456' }] }); // Submission insert

      const result = await provider.submitToAggregator(mockEVVRecord);

      expect(result).toEqual({
        submissionId: 'submission-456',
        status: 'PENDING',
        aggregator: 'SANDATA',
        submittedAt: expect.any(Date),
      });
    });

    it('should include authorization number in submission payload', async () => {
      const mockConfig = { medicaid_program: 'COMMUNITY_HEALTHCHOICES' };
      const mockEVVRecord = {
        id: 'evv-123',
        visitId: 'visit-123',
        organizationId: 'org-123',
        clientId: 'client-123',
        serviceTypeCode: 'PCA',
        clientMedicaidId: 'PA-987654321',
        caregiverEmployeeId: 'CG-002',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T10:00:00Z'),
        clockOutTime: new Date('2025-01-15T14:00:00Z'),
        clockInVerification: {
          latitude: 40.2732,
          longitude: -76.8867,
          accuracy: 8,
        } as LocationVerification,
        stateSpecificData: {
          authNumber: 'AUTH-789',
        },
        recordedBy: 'user-456',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] })
        .mockResolvedValueOnce({ rows: [{ id: 'auth-123' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'submission-456' }] });

      await provider.submitToAggregator(mockEVVRecord);

      const insertCall = (mockDatabase.query as ReturnType<typeof vi.fn>).mock.calls[2];
      const payload = JSON.parse(insertCall[1][1]);

      expect(payload.authorizationNumber).toBe('AUTH-789');
    });

    it('should throw error when authorization is invalid', async () => {
      const mockConfig = { medicaid_program: 'COMMUNITY_HEALTHCHOICES' };
      const mockEVVRecord = {
        organizationId: 'org-123',
        clientId: 'client-123',
        serviceTypeCode: 'PCA',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] })
        .mockResolvedValueOnce({ rows: [] }); // No valid authorization

      await expect(provider.submitToAggregator(mockEVVRecord)).rejects.toThrow(
        'PA requires valid prior authorization for EVV submission'
      );
    });
  });

  describe('validateVisit', () => {
    it('should pass validation with all required fields', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'PA-987654321',
        serviceTypeCode: 'PCA',
        stateSpecificData: {
          authNumber: 'AUTH-123',
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation without authorization number', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'PA-987654321',
        serviceTypeCode: 'PCA',
        stateSpecificData: {},
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'PA_MISSING_AUTH_NUMBER' })
      );
    });

    it('should warn when visit tolerance exceeded (±10 minutes)', () => {
      const scheduledTime = new Date('2025-01-15T10:00:00Z');
      const actualTime = new Date('2025-01-15T10:12:00Z'); // 12 minutes late

      const mockEVVRecord = {
        clientMedicaidId: 'PA-987654321',
        serviceTypeCode: 'PCA',
        clockInTime: actualTime,
        stateSpecificData: {
          authNumber: 'AUTH-123',
          scheduledStartTime: scheduledTime,
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('PA_VISIT_TOLERANCE_EXCEEDED');
    });
  });

  describe('validateGeofence', () => {
    it('should pass validation within 0.5 mile radius', () => {
      const location = {
        latitude: 40.2732,
        longitude: -76.8867,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 40.2750,
        longitude: -76.8850,
        street1: '789 Penn Ave',
        city: 'Harrisburg',
        state: 'PA',
        zipCode: '17101',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(true);
    });

    it('should fail validation outside 0.5 mile radius (stricter than other states)', () => {
      const location = {
        latitude: 40.2732,
        longitude: -76.8867,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 40.2850,
        longitude: -76.8950,
        street1: '999 State St',
        city: 'Harrisburg',
        state: 'PA',
        zipCode: '17101',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(false);
    });
  });

  describe('verifyPriorAuthorization', () => {
    it('should return true for valid active authorization', async () => {
      const mockAuth = {
        id: 'auth-123',
        status: 'ACTIVE',
        end_date: new Date('2025-12-31'),
      };

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockAuth],
      });

      const result = await provider.verifyPriorAuthorization('client-123' as any, 'PCA');

      expect(result).toBe(true);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM service_authorizations'),
        ['client-123', 'PCA']
      );
    });

    it('should return false for no authorization', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

      const result = await provider.verifyPriorAuthorization('client-456' as any, 'PCA');

      expect(result).toBe(false);
    });
  });
});
