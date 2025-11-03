/**
 * Caregiver service tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaregiverService } from '../service/caregiver-service.js';
import { CaregiverRepository } from '../repository/caregiver-repository.js';
import type { Database, UserContext } from '@care-commons/core';
import type { Caregiver } from '../types/caregiver.js';

describe('CaregiverService', () => {
  let service: CaregiverService;
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

    service = new CaregiverService(mockDb);
  });

  describe('validateAssignment', () => {
    it('should return eligible when all criteria are met', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
        complianceStatus: 'COMPLIANT',
        credentials: [
          {
            id: 'cred-1',
            type: 'CNA',
            name: 'Certified Nursing Assistant',
            issueDate: new Date('2023-01-01'),
            expirationDate: new Date('2025-12-31'),
            status: 'ACTIVE',
          },
        ],
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'getServiceAuthorizations').mockResolvedValue([
        {
          id: 'auth-1',
          caregiverId: 'caregiver-123',
          serviceTypeCode: 'PERSONAL_CARE',
          serviceTypeName: 'Personal Care',
          authorizationSource: 'CREDENTIAL',
          effectiveDate: new Date('2023-01-01'),
          expirationDate: null,
          status: 'ACTIVE',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.spyOn(CaregiverRepository.prototype, 'getStateScreenings').mockResolvedValue([
        {
          id: 'screening-1',
          caregiverId: 'caregiver-123',
          stateCode: 'TX',
          screeningType: 'EMPLOYEE_MISCONDUCT_REGISTRY',
          status: 'CLEARED',
          initiationDate: new Date('2023-01-01'),
          completionDate: new Date('2023-01-15'),
          expirationDate: new Date('2025-12-31'),
          confirmationNumber: 'TX-123456',
          clearanceNumber: null,
          results: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.validateAssignment(
        'caregiver-123',
        'PERSONAL_CARE',
        'TX',
        mockContext
      );

      expect(result.eligible).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should return ineligible when service authorization is missing', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
        complianceStatus: 'COMPLIANT',
        credentials: [
          {
            id: 'cred-1',
            type: 'CNA',
            name: 'Certified Nursing Assistant',
            issueDate: new Date('2023-01-01'),
            expirationDate: new Date('2025-12-31'),
            status: 'ACTIVE',
          },
        ],
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'getServiceAuthorizations').mockResolvedValue([]);
      vi.spyOn(CaregiverRepository.prototype, 'getStateScreenings').mockResolvedValue([]);

      const result = await service.validateAssignment(
        'caregiver-123',
        'PERSONAL_CARE',
        'TX',
        mockContext
      );

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('Not authorized for service type PERSONAL_CARE');
    });

    it('should return ineligible when compliance status is not compliant', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
        complianceStatus: 'EXPIRED',
        credentials: [],
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'getServiceAuthorizations').mockResolvedValue([]);
      vi.spyOn(CaregiverRepository.prototype, 'getStateScreenings').mockResolvedValue([]);

      const result = await service.validateAssignment(
        'caregiver-123',
        'PERSONAL_CARE',
        'TX',
        mockContext
      );

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('Compliance status is EXPIRED');
    });
  });

  describe('initiateBackgroundScreening', () => {
    it('should initiate background screening for valid state and type', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'createStateScreening').mockResolvedValue('screening-123');

      const screeningId = await service.initiateBackgroundScreening(
        'caregiver-123',
        'TX',
        'EMPLOYEE_MISCONDUCT_REGISTRY',
        mockContext
      );

      expect(screeningId).toBe('screening-123');
    });

    it('should reject invalid state code', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);

      await expect(
        service.initiateBackgroundScreening(
          'caregiver-123',
          'XX',
          'EMPLOYEE_MISCONDUCT_REGISTRY',
          mockContext
        )
      ).rejects.toThrow('Invalid state code');
    });

    it('should reject invalid screening type for state', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);

      await expect(
        service.initiateBackgroundScreening(
          'caregiver-123',
          'TX',
          'INVALID_TYPE',
          mockContext
        )
      ).rejects.toThrow('Invalid screening type for TX');
    });
  });
});
