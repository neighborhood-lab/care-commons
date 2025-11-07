/**
 * NorthCarolinaEVVProvider Tests
 *
 * Tests for North Carolina-specific EVV compliance requirements with Sandata aggregator
 * and Innovations waiver support.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NorthCarolinaEVVProvider } from '../north-carolina-evv-provider.js';
import type { Database } from '@care-commons/core';
import type { EVVRecord, LocationVerification } from '../../types/evv';

describe('NorthCarolinaEVVProvider', () => {
  let provider: NorthCarolinaEVVProvider;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as unknown as Database;
    provider = new NorthCarolinaEVVProvider(mockDatabase);
  });

  describe('submitToAggregator', () => {
    it('should submit to Sandata with North Carolina-specific fields', async () => {
      const mockConfig = {
        medicaid_program: 'INNOVATIONS_WAIVER',
      };

      const mockEVVRecord = {
        id: 'evv-NC001',
        visitId: 'visit-NC001',
        organizationId: 'org-NC001',
        clientId: 'client-NC001',
        clientMedicaidId: 'NC-111222333',
        caregiverEmployeeId: 'CG-NC-004',
        serviceTypeCode: 'PCA',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T12:00:00Z'),
        clockOutTime: new Date('2025-01-15T16:00:00Z'),
        clockInVerification: {
          latitude: 35.7796,
          longitude: -78.6382,
          accuracy: 9,
        } as LocationVerification,
        stateSpecificData: {
          serviceDefCode: 'T1019',
          innovationsWaiver: true,
        },
        recordedBy: 'user-NC001',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] }) // Config query
        .mockResolvedValueOnce({ rows: [{ id: 'submission-NC001' }] }); // Submission insert

      const result = await provider.submitToAggregator(mockEVVRecord);

      expect(result).toEqual({
        submissionId: 'submission-NC001',
        status: 'PENDING',
        aggregator: 'SANDATA',
        submittedAt: expect.any(Date),
      });
    });

    it('should include service definition code in submission payload', async () => {
      const mockConfig = { medicaid_program: 'INNOVATIONS_WAIVER' };
      const mockEVVRecord = {
        id: 'evv-NC001',
        visitId: 'visit-NC001',
        organizationId: 'org-NC001',
        clientId: 'client-NC001',
        serviceTypeCode: 'PCA',
        clientMedicaidId: 'NC-111222333',
        caregiverEmployeeId: 'CG-NC-004',
        serviceDate: new Date('2025-01-15'),
        clockInTime: new Date('2025-01-15T12:00:00Z'),
        clockOutTime: new Date('2025-01-15T16:00:00Z'),
        clockInVerification: {
          latitude: 35.7796,
          longitude: -78.6382,
          accuracy: 9,
        } as LocationVerification,
        stateSpecificData: {
          serviceDefCode: 'T1019',
        },
        recordedBy: 'user-NC001',
      } as EVVRecord;

      (mockDatabase.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ rows: [mockConfig] })
        .mockResolvedValueOnce({ rows: [{ id: 'submission-NC001' }] });

      await provider.submitToAggregator(mockEVVRecord);

      const insertCall = (mockDatabase.query as ReturnType<typeof vi.fn>).mock.calls[1];
      const payload = JSON.parse(insertCall[1][1]);

      expect(payload.serviceDefCode).toBe('T1019');
    });
  });

  describe('validateVisit', () => {
    it('should pass validation with all required fields', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'NC-111222333',
        serviceTypeCode: 'PCA',
        stateSpecificData: {
          serviceDefCode: 'T1019',
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation without service definition code', () => {
      const mockEVVRecord = {
        clientMedicaidId: 'NC-111222333',
        serviceTypeCode: 'PCA',
        stateSpecificData: {},
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'NC_MISSING_SERVICE_DEF_CODE' })
      );
    });

    it('should warn when visit tolerance exceeded (±20 minutes - most lenient)', () => {
      const scheduledTime = new Date('2025-01-15T12:00:00Z');
      const actualTime = new Date('2025-01-15T12:25:00Z'); // 25 minutes late

      const mockEVVRecord = {
        clientMedicaidId: 'NC-111222333',
        serviceTypeCode: 'PCA',
        clockInTime: actualTime,
        stateSpecificData: {
          serviceDefCode: 'T1019',
          scheduledStartTime: scheduledTime,
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('NC_VISIT_TOLERANCE_EXCEEDED');
    });

    it('should pass validation within ±20 minute tolerance', () => {
      const scheduledTime = new Date('2025-01-15T12:00:00Z');
      const actualTime = new Date('2025-01-15T12:15:00Z'); // 15 minutes late

      const mockEVVRecord = {
        clientMedicaidId: 'NC-111222333',
        serviceTypeCode: 'PCA',
        clockInTime: actualTime,
        stateSpecificData: {
          serviceDefCode: 'T1019',
          scheduledStartTime: scheduledTime,
        },
      } as EVVRecord;

      const result = provider.validateVisit(mockEVVRecord);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateGeofence', () => {
    it('should pass validation within 1 mile radius', () => {
      const location = {
        latitude: 35.7796,
        longitude: -78.6382,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 35.7850,
        longitude: -78.6400,
        street1: '200 Fayetteville St',
        city: 'Raleigh',
        state: 'NC',
        zipCode: '27601',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(true);
    });

    it('should fail validation outside 1 mile radius', () => {
      const location = {
        latitude: 35.7796,
        longitude: -78.6382,
      } as LocationVerification;

      const serviceAddress = {
        latitude: 35.8000,
        longitude: -78.7000,
        street1: '500 Capital Blvd',
        city: 'Raleigh',
        state: 'NC',
        zipCode: '27603',
      };

      const result = provider.validateGeofence(location, serviceAddress);

      expect(result).toBe(false);
    });
  });
});
