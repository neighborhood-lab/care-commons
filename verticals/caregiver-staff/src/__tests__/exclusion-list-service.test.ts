/**
 * Exclusion List Service Tests
 * 
 * Tests for federal exclusion list checking (OIG LEIE, SAM.gov).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ExclusionListService } from '../services/exclusion-list-service.js';
import { CaregiverRepository } from '../repository/caregiver-repository.js';
import type { Database, UserContext } from '@care-commons/core';
import type { Caregiver } from '../types/caregiver.js';

function createMockCaregiver(overrides: Partial<Caregiver> = {}): Caregiver {
  return {
    id: 'caregiver-123',
    organizationId: 'org-123',
    branchIds: ['branch-123'],
    primaryBranchId: 'branch-123',
    employeeNumber: 'EMP001',
    firstName: 'Maria',
    lastName: 'Garcia',
    dateOfBirth: new Date('1985-03-15'),
    primaryPhone: { number: '512-555-1234', type: 'MOBILE', canReceiveSMS: true },
    email: 'maria.garcia@example.com',
    preferredContactMethod: 'EMAIL',
    primaryAddress: {
      type: 'HOME',
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'USA',
    },
    emergencyContacts: [],
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    hireDate: new Date('2022-01-15'),
    role: 'CAREGIVER',
    permissions: ['visits:read', 'visits:create'],
    credentials: [],
    training: [],
    skills: [],
    specializations: [],
    availability: {
      schedule: {
        monday: { available: true },
        tuesday: { available: true },
        wednesday: { available: true },
        thursday: { available: true },
        friday: { available: true },
        saturday: { available: false },
        sunday: { available: false },
      },
      lastUpdated: new Date(),
    },
    payRate: {
      id: 'rate-1',
      rateType: 'BASE',
      amount: 18.50,
      unit: 'HOURLY',
      effectiveDate: new Date('2022-01-15'),
    },
    complianceStatus: 'COMPLIANT',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    isDeleted: false,
    ...overrides,
  } as Caregiver;
}

describe('ExclusionListService', () => {
  let service: ExclusionListService;
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
      permissions: ['caregivers:read', 'caregivers:update'],
    };

    // Clear any environment variables that would enable real API calls
    delete process.env.OIG_API_KEY;
    delete process.env.SAM_API_KEY;

    service = new ExclusionListService(mockDb);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkCaregiver', () => {
    it('should return clear result for non-excluded caregiver', async () => {
      const mockCaregiver = createMockCaregiver();

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const result = await service.checkCaregiver('caregiver-123', mockContext);

      expect(result.isExcluded).toBe(false);
      expect(result.caregiverName).toBe('Maria Garcia');
      expect(result.employeeNumber).toBe('EMP001');
      expect(result.oigResult.status).toBe('CLEAR');
      expect(result.samResult.status).toBe('CLEAR');
      expect(result.requiresImmediateAction).toBe(false);
      expect(result.actionRequired).toBeUndefined();
    });

    it('should return excluded result for caregiver with EXCLUDED in name (test mode)', async () => {
      // The mock implementation flags caregivers with "EXCLUDED" in their last name
      const mockCaregiver = createMockCaregiver({
        firstName: 'John',
        lastName: 'EXCLUDED-TEST',
      });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const result = await service.checkCaregiver('caregiver-123', mockContext);

      expect(result.isExcluded).toBe(true);
      expect(result.oigResult.status).toBe('EXCLUDED');
      expect(result.oigResult.matchFound).toBe(true);
      expect(result.samResult.status).toBe('EXCLUDED');
      expect(result.samResult.matchFound).toBe(true);
      expect(result.requiresImmediateAction).toBe(true);
      expect(result.actionRequired).toContain('CRITICAL');
      expect(result.exclusionDetails).toHaveLength(2);
    });

    it('should throw error for non-existent caregiver', async () => {
      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(null);

      await expect(
        service.checkCaregiver('non-existent', mockContext)
      ).rejects.toThrow('Caregiver not found');
    });

    it('should include exclusion details when excluded', async () => {
      const mockCaregiver = createMockCaregiver({
        lastName: 'EXCLUDED-PERSON',
      });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const result = await service.checkCaregiver('caregiver-123', mockContext);

      expect(result.exclusionDetails).toBeDefined();
      expect(result.exclusionDetails!.length).toBeGreaterThan(0);
      
      const oigDetail = result.exclusionDetails!.find(d => d.listType === 'OIG_LEIE');
      expect(oigDetail).toBeDefined();
      expect(oigDetail!.prohibitsMedicaidBilling).toBe(true);
      expect(oigDetail!.prohibitsMedicareBilling).toBe(true);
      expect(oigDetail!.prohibitsAllFederalPrograms).toBe(true);
    });

    it('should record check date', async () => {
      const mockCaregiver = createMockCaregiver();

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const beforeCheck = new Date();
      const result = await service.checkCaregiver('caregiver-123', mockContext);
      const afterCheck = new Date();

      expect(result.checkDate.getTime()).toBeGreaterThanOrEqual(beforeCheck.getTime());
      expect(result.checkDate.getTime()).toBeLessThanOrEqual(afterCheck.getTime());
    });
  });

  describe('checkOrganization', () => {
    it('should check all active caregivers in organization', async () => {
      const caregivers = [
        createMockCaregiver({ id: 'cg-1', employeeNumber: 'EMP001' }),
        createMockCaregiver({ id: 'cg-2', employeeNumber: 'EMP002' }),
        createMockCaregiver({ id: 'cg-3', employeeNumber: 'EMP003' }),
      ];

      vi.spyOn(CaregiverRepository.prototype, 'search')
        .mockResolvedValue({ 
          items: caregivers, 
          total: 3, 
          page: 1, 
          limit: 10000, 
          totalPages: 1 
        });
      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockImplementation(async (id: string) => 
          caregivers.find(c => c.id === id) || null
        );

      const result = await service.checkOrganization('org-123', mockContext);

      expect(result.totalChecked).toBe(3);
      expect(result.clearCount).toBe(3);
      expect(result.excludedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.excludedCaregivers).toHaveLength(0);
    });

    it('should identify excluded caregivers in batch check', async () => {
      const caregivers = [
        createMockCaregiver({ id: 'cg-1', employeeNumber: 'EMP001', lastName: 'Smith' }),
        createMockCaregiver({ id: 'cg-2', employeeNumber: 'EMP002', lastName: 'EXCLUDED-TEST' }),
        createMockCaregiver({ id: 'cg-3', employeeNumber: 'EMP003', lastName: 'Jones' }),
      ];

      vi.spyOn(CaregiverRepository.prototype, 'search')
        .mockResolvedValue({ 
          items: caregivers, 
          total: 3, 
          page: 1, 
          limit: 10000, 
          totalPages: 1 
        });
      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockImplementation(async (id: string) => 
          caregivers.find(c => c.id === id) || null
        );

      const result = await service.checkOrganization('org-123', mockContext);

      expect(result.totalChecked).toBe(3);
      expect(result.clearCount).toBe(2);
      expect(result.excludedCount).toBe(1);
      expect(result.excludedCaregivers).toHaveLength(1);
      expect(result.excludedCaregivers[0]!.employeeNumber).toBe('EMP002');
    });

    it('should track errors during batch check', async () => {
      const caregivers = [
        createMockCaregiver({ id: 'cg-1', employeeNumber: 'EMP001' }),
        createMockCaregiver({ id: 'cg-2', employeeNumber: 'EMP002' }),
      ];

      vi.spyOn(CaregiverRepository.prototype, 'search')
        .mockResolvedValue({ 
          items: caregivers, 
          total: 2, 
          page: 1, 
          limit: 10000, 
          totalPages: 1 
        });
      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockImplementation(async (id: string) => {
          if (id === 'cg-2') {
            throw new Error('Database connection failed');
          }
          return caregivers.find(c => c.id === id) || null;
        });

      const result = await service.checkOrganization('org-123', mockContext);

      expect(result.totalChecked).toBe(2);
      expect(result.clearCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.caregiverId).toBe('cg-2');
      expect(result.errors[0]!.error).toContain('Database connection failed');
    });
  });

  describe('recordExclusionCheck', () => {
    it('should log exclusion check for audit purposes', async () => {
      const mockCaregiver = createMockCaregiver();

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const checkResult = await service.checkCaregiver('caregiver-123', mockContext);
      await service.recordExclusionCheck(checkResult, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Exclusion check recorded'),
        expect.objectContaining({
          isExcluded: false,
          checkedBy: 'user-123',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getCheckHistory', () => {
    it('should return empty array (not yet implemented)', async () => {
      const history = await service.getCheckHistory('caregiver-123', mockContext);

      expect(history).toEqual([]);
    });
  });

  describe('OIG result structure', () => {
    it('should have correct structure for clear result', async () => {
      const mockCaregiver = createMockCaregiver();

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const result = await service.checkCaregiver('caregiver-123', mockContext);

      expect(result.oigResult).toMatchObject({
        listType: 'OIG_LEIE',
        checked: true,
        status: 'CLEAR',
        matchFound: false,
      });
      expect(result.oigResult.checkDate).toBeInstanceOf(Date);
    });

    it('should have correct structure for excluded result', async () => {
      const mockCaregiver = createMockCaregiver({ lastName: 'EXCLUDED' });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const result = await service.checkCaregiver('caregiver-123', mockContext);

      expect(result.oigResult).toMatchObject({
        listType: 'OIG_LEIE',
        checked: true,
        status: 'EXCLUDED',
        matchFound: true,
        matchConfidence: 'HIGH',
      });
      expect(result.oigResult.exclusionId).toBeDefined();
      expect(result.oigResult.exclusionType).toBeDefined();
      expect(result.oigResult.exclusionDate).toBeInstanceOf(Date);
    });
  });

  describe('SAM result structure', () => {
    it('should have correct structure for clear result', async () => {
      const mockCaregiver = createMockCaregiver();

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const result = await service.checkCaregiver('caregiver-123', mockContext);

      expect(result.samResult).toMatchObject({
        listType: 'SAM',
        checked: true,
        status: 'CLEAR',
        matchFound: false,
      });
    });

    it('should have correct structure for excluded result', async () => {
      const mockCaregiver = createMockCaregiver({ lastName: 'EXCLUDED' });

      vi.spyOn(CaregiverRepository.prototype, 'findById')
        .mockResolvedValue(mockCaregiver);

      const result = await service.checkCaregiver('caregiver-123', mockContext);

      expect(result.samResult).toMatchObject({
        listType: 'SAM',
        checked: true,
        status: 'EXCLUDED',
        matchFound: true,
        matchConfidence: 'HIGH',
      });
    });
  });
});
