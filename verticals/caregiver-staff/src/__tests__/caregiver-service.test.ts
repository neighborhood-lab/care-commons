/**
 * Caregiver service tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaregiverService } from '../service/caregiver-service';
import { CaregiverRepository } from '../repository/caregiver-repository';
import type { Database, UserContext } from '@care-commons/core';
import type { Caregiver } from '../types/caregiver';

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

  describe('addServiceAuthorization', () => {
    it('should add service authorization for caregiver', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'createServiceAuthorization').mockResolvedValue('auth-123');

      const authId = await service.addServiceAuthorization(
        'caregiver-123',
        'PERSONAL_CARE',
        'Personal Care',
        {
          authorizationSource: 'CREDENTIAL',
          effectiveDate: new Date('2024-01-01'),
        },
        mockContext
      );

      expect(authId).toBe('auth-123');
    });

    it('should throw NotFoundError when caregiver does not exist', async () => {
      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(null);

      await expect(
        service.addServiceAuthorization(
          'nonexistent',
          'PERSONAL_CARE',
          'Personal Care',
          {},
          mockContext
        )
      ).rejects.toThrow('Caregiver not found');
    });
  });

  describe('getServiceAuthorizations', () => {
    it('should retrieve service authorizations', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      const mockAuthorizations = [
        {
          id: 'auth-1',
          caregiverId: 'caregiver-123',
          serviceTypeCode: 'PERSONAL_CARE',
          serviceTypeName: 'Personal Care',
          authorizationSource: 'CREDENTIAL',
          effectiveDate: new Date('2024-01-01'),
          expirationDate: null,
          status: 'ACTIVE' as const,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'getServiceAuthorizations').mockResolvedValue(mockAuthorizations);

      const result = await service.getServiceAuthorizations('caregiver-123', mockContext);

      expect(result).toHaveLength(1);
      expect(result[0]?.serviceTypeCode).toBe('PERSONAL_CARE');
    });
  });

  describe('updateBackgroundScreening', () => {
    it('should update screening with new status', async () => {
      vi.spyOn(CaregiverRepository.prototype, 'updateStateScreening').mockResolvedValue(undefined);

      await service.updateBackgroundScreening(
        'screening-123',
        {
          status: 'CLEARED',
          completionDate: new Date('2024-01-15'),
          clearanceNumber: 'TX-123456',
        },
        mockContext
      );

      expect(CaregiverRepository.prototype.updateStateScreening).toHaveBeenCalledWith(
        'screening-123',
        expect.objectContaining({
          status: 'CLEARED',
          clearanceNumber: 'TX-123456',
        }),
        mockContext
      );
    });
  });

  describe('getStateScreenings', () => {
    it('should retrieve state screenings for caregiver', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      const mockScreenings = [
        {
          id: 'screening-1',
          caregiverId: 'caregiver-123',
          stateCode: 'TX',
          screeningType: 'EMPLOYEE_MISCONDUCT_REGISTRY',
          status: 'CLEARED',
          initiationDate: new Date('2024-01-01'),
          completionDate: new Date('2024-01-15'),
          expirationDate: new Date('2025-12-31'),
          confirmationNumber: 'TX-123456',
          clearanceNumber: null,
          results: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'getStateScreenings').mockResolvedValue(mockScreenings);

      const result = await service.getStateScreenings('caregiver-123', mockContext);

      expect(result).toHaveLength(1);
      expect(result[0]?.stateCode).toBe('TX');
      expect(result[0]?.status).toBe('CLEARED');
    });

    it('should throw NotFoundError when caregiver does not exist', async () => {
      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(null);

      await expect(
        service.getStateScreenings('nonexistent', mockContext)
      ).rejects.toThrow('Caregiver not found');
    });
  });

  describe('validateAssignment - additional scenarios', () => {
    it('should return ineligible when caregiver is not active', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'SUSPENDED',
        complianceStatus: 'COMPLIANT',
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
      expect(result.reasons).toContain('Caregiver status is SUSPENDED, not ACTIVE');
    });

    it('should check for expired credentials', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
        complianceStatus: 'COMPLIANT',
        credentials: [
          {
            id: 'cred-1',
            type: 'CNA',
            name: 'Certified Nursing Assistant',
            issueDate: new Date('2020-01-01'),
            expirationDate: new Date('2023-12-31'), // Expired
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
      expect(result.reasons).toContain('No active credentials on file');
    });

    it('should check for expired service authorizations', async () => {
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

      const mockAuthorizations = [
        {
          id: 'auth-1',
          caregiverId: 'caregiver-123',
          serviceTypeCode: 'PERSONAL_CARE',
          serviceTypeName: 'Personal Care',
          authorizationSource: 'CREDENTIAL',
          effectiveDate: new Date('2023-01-01'),
          expirationDate: new Date('2023-12-31'), // Expired
          status: 'ACTIVE' as const,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'getServiceAuthorizations').mockResolvedValue(mockAuthorizations);
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

    it('should check for expired state screenings', async () => {
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

      const mockAuthorizations = [
        {
          id: 'auth-1',
          caregiverId: 'caregiver-123',
          serviceTypeCode: 'PERSONAL_CARE',
          serviceTypeName: 'Personal Care',
          authorizationSource: 'CREDENTIAL',
          effectiveDate: new Date('2023-01-01'),
          expirationDate: null,
          status: 'ACTIVE' as const,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockScreenings = [
        {
          id: 'screening-1',
          caregiverId: 'caregiver-123',
          stateCode: 'TX',
          screeningType: 'EMPLOYEE_MISCONDUCT_REGISTRY',
          status: 'CLEARED',
          initiationDate: new Date('2020-01-01'),
          completionDate: new Date('2020-01-15'),
          expirationDate: new Date('2023-12-31'), // Expired
          confirmationNumber: 'TX-123456',
          clearanceNumber: null,
          results: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'getServiceAuthorizations').mockResolvedValue(mockAuthorizations);
      vi.spyOn(CaregiverRepository.prototype, 'getStateScreenings').mockResolvedValue(mockScreenings);

      const result = await service.validateAssignment(
        'caregiver-123',
        'PERSONAL_CARE',
        'TX',
        mockContext
      );

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('Missing TX registry clearance or background screening');
    });
  });

  describe('initiateBackgroundScreening - additional scenarios', () => {
    it('should validate Florida screening types', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'createStateScreening').mockResolvedValue('screening-123');

      const screeningId = await service.initiateBackgroundScreening(
        'caregiver-123',
        'FL',
        'LEVEL_2_BACKGROUND',
        mockContext
      );

      expect(screeningId).toBe('screening-123');
    });

    it('should accept general background check for states without specific types', async () => {
      const mockCaregiver: Partial<Caregiver> = {
        id: 'caregiver-123',
        status: 'ACTIVE',
      };

      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(mockCaregiver as Caregiver);
      vi.spyOn(CaregiverRepository.prototype, 'createStateScreening').mockResolvedValue('screening-456');

      const screeningId = await service.initiateBackgroundScreening(
        'caregiver-123',
        'CA',
        'BACKGROUND_CHECK',
        mockContext
      );

      expect(screeningId).toBe('screening-456');
    });

    it('should throw NotFoundError for nonexistent caregiver', async () => {
      vi.spyOn(CaregiverRepository.prototype, 'findById').mockResolvedValue(null);

      await expect(
        service.initiateBackgroundScreening(
          'nonexistent',
          'TX',
          'EMPLOYEE_MISCONDUCT_REGISTRY',
          mockContext
        )
      ).rejects.toThrow('Caregiver not found');
    });
  });
});
