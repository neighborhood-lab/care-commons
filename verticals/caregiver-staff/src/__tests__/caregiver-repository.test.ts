/**
 * Caregiver repository tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaregiverRepository } from '../repository/caregiver-repository';
import type { Database, UserContext } from '@care-commons/core';

describe('CaregiverRepository', () => {
  let repository: CaregiverRepository;
  let mockDb: Database;
  let mockContext: UserContext;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    } as unknown as Database;

    mockContext = {
      userId: 'user-123',
      organizationId: 'org-123',
      branchIds: ['branch-123'],
      roles: ['ORG_ADMIN'],
      permissions: ['caregivers:read', 'caregivers:write'],
    };

    repository = new CaregiverRepository(mockDb);
  });

  describe('createServiceAuthorization', () => {
    it('should create service authorization with all fields', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [{ id: 'auth-123' }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const authId = await repository.createServiceAuthorization(
        {
          caregiverId: 'caregiver-123',
          serviceTypeCode: 'PERSONAL_CARE',
          serviceTypeName: 'Personal Care',
          authorizationSource: 'CREDENTIAL',
          effectiveDate: new Date('2024-01-01'),
          expirationDate: new Date('2025-12-31'),
          notes: 'CNA certified',
        },
        mockContext
      );

      expect(authId).toBe('auth-123');
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should create service authorization with minimal fields', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [{ id: 'auth-456' }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const authId = await repository.createServiceAuthorization(
        {
          caregiverId: 'caregiver-123',
          serviceTypeCode: 'COMPANION',
          serviceTypeName: 'Companion Care',
          effectiveDate: new Date('2024-01-01'),
        },
        mockContext
      );

      expect(authId).toBe('auth-456');
    });
  });

  describe('getServiceAuthorizations', () => {
    it('should retrieve service authorizations', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [
          {
            id: 'auth-1',
            caregiver_id: 'caregiver-123',
            service_type_code: 'PERSONAL_CARE',
            service_type_name: 'Personal Care',
            authorization_source: 'CREDENTIAL',
            effective_date: new Date('2024-01-01'),
            expiration_date: new Date('2025-12-31'),
            status: 'ACTIVE',
            notes: 'Test note',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const authorizations = await repository.getServiceAuthorizations('caregiver-123');

      expect(authorizations).toHaveLength(1);
      expect(authorizations[0]?.serviceTypeCode).toBe('PERSONAL_CARE');
    });

    it('should return empty array when no authorizations exist', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const authorizations = await repository.getServiceAuthorizations('caregiver-999');
      expect(authorizations).toHaveLength(0);
    });
  });

  describe('createStateScreening', () => {
    it('should create state screening record', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [{ id: 'screening-123' }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const screeningId = await repository.createStateScreening({
        caregiverId: 'caregiver-123',
        stateCode: 'TX',
        screeningType: 'EMPLOYEE_MISCONDUCT_REGISTRY',
        initiatedBy: 'user-123',
        initiatedAt: new Date('2024-01-01'),
      });

      expect(screeningId).toBe('screening-123');
      expect(mockDb.query).toHaveBeenCalled();
    });
  });

  describe('updateStateScreening', () => {
    it('should update all screening fields', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await repository.updateStateScreening(
        'screening-123',
        {
          status: 'CLEARED',
          completionDate: new Date('2024-01-15'),
          expirationDate: new Date('2025-12-31'),
          confirmationNumber: 'TX-123456',
          clearanceNumber: 'CLEAR-789',
          results: { flagged: false },
          notes: 'Approved',
        },
        mockContext
      );

      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should update only status field', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await repository.updateStateScreening(
        'screening-123',
        { status: 'IN_PROGRESS' },
        mockContext
      );

      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should handle JSONB results field', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await repository.updateStateScreening(
        'screening-123',
        {
          results: { level: 2, approved: true, notes: 'Clean record' },
        },
        mockContext
      );

      expect(mockDb.query).toHaveBeenCalled();
    });
  });

  describe('getStateScreenings', () => {
    it('should retrieve state screenings', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [
          {
            id: 'screening-1',
            caregiver_id: 'caregiver-123',
            state_code: 'TX',
            screening_type: 'EMPLOYEE_MISCONDUCT_REGISTRY',
            status: 'CLEARED',
            initiation_date: new Date('2024-01-01'),
            completion_date: new Date('2024-01-15'),
            expiration_date: new Date('2025-12-31'),
            confirmation_number: 'TX-123456',
            clearance_number: null,
            results: null,
            notes: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const screenings = await repository.getStateScreenings('caregiver-123');

      expect(screenings).toHaveLength(1);
      expect(screenings[0]?.stateCode).toBe('TX');
      expect(screenings[0]?.status).toBe('CLEARED');
    });

    it('should parse JSONB results field', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [
          {
            id: 'screening-1',
            caregiver_id: 'caregiver-123',
            state_code: 'FL',
            screening_type: 'LEVEL_2_BACKGROUND',
            status: 'CLEARED',
            initiation_date: new Date('2024-01-01'),
            completion_date: new Date('2024-01-15'),
            expiration_date: new Date('2029-12-31'),
            confirmation_number: 'FL-789012',
            clearance_number: null,
            results: JSON.stringify({ level: 2, approved: true }),
            notes: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const screenings = await repository.getStateScreenings('caregiver-123');

      expect(screenings[0]?.results).toEqual({ level: 2, approved: true });
    });

    it('should return empty array when no screenings exist', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const screenings = await repository.getStateScreenings('caregiver-999');
      expect(screenings).toHaveLength(0);
    });
  });
});
