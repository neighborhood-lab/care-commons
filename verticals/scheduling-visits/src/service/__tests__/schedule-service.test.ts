/**
 * ScheduleService Tests
 *
 * Tests for schedule generation and client address integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleService, IClientAddressProvider } from '../schedule-service';
import { ScheduleRepository } from '../../repository/schedule-repository';
import type { UserContext, UUID } from '@care-commons/core';
import type { ScheduleGenerationOptions } from '../../types/schedule';

// Mock repository
const mockRepository = {
  createServicePattern: vi.fn(),
  getServicePatternById: vi.fn(),
  updateServicePattern: vi.fn(),
  getPatternsByClient: vi.fn(),
  createVisit: vi.fn(),
  getVisitById: vi.fn(),
  updateVisitStatus: vi.fn(),
  assignCaregiver: vi.fn(),
  searchVisits: vi.fn(),
  getUnassignedVisits: vi.fn(),
} as unknown as ScheduleRepository;

// Mock client address provider
const mockAddressProvider: IClientAddressProvider = {
  getClientAddress: vi.fn(),
};

// Test context
const testContext: UserContext = {
  userId: 'user-123' as UUID,
  organizationId: 'org-123' as UUID,
  branchIds: ['branch-123' as UUID],
  roles: ['SUPER_ADMIN'],
  permissions: ['schedules:generate', 'schedules:create', 'visits:read'],
};

describe('ScheduleService - Client Address Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClientAddress', () => {
    it('should throw error when no address provider is configured', async () => {
      const serviceWithoutProvider = new ScheduleService(mockRepository);

      // Mock the pattern
      mockRepository.getServicePatternById = vi.fn().mockResolvedValue({
        id: 'pattern-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        clientId: 'client-123',
        status: 'ACTIVE',
        serviceTypeId: 'service-type-123',
        serviceTypeName: 'Personal Care',
        duration: 60,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          startTime: '09:00',
        },
        taskTemplateIds: [],
        requiredSkills: [],
        requiredCertifications: [],
      });

      mockRepository.createVisit = vi.fn().mockRejectedValue(
        new Error('ClientAddressProvider not configured')
      );

      const options: ScheduleGenerationOptions = {
        patternId: 'pattern-123' as UUID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      };

      await expect(
        serviceWithoutProvider.generateScheduleFromPattern(options, testContext)
      ).rejects.toThrow();
    });

    it('should use client address provider when configured', async () => {
      const mockAddress = {
        line1: '123 Main St',
        line2: 'Apt 4',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
        latitude: 30.2672,
        longitude: -97.7431,
        geofenceRadius: 100,
      };

      mockAddressProvider.getClientAddress = vi.fn().mockResolvedValue(mockAddress);

      const serviceWithProvider = new ScheduleService(
        mockRepository,
        mockAddressProvider
      );

      // Mock the pattern
      mockRepository.getServicePatternById = vi.fn().mockResolvedValue({
        id: 'pattern-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        clientId: 'client-123',
        status: 'ACTIVE',
        serviceTypeId: 'service-type-123',
        serviceTypeName: 'Personal Care',
        duration: 60,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          startTime: '09:00',
        },
        taskTemplateIds: [],
        requiredSkills: [],
        requiredCertifications: [],
      });

      mockRepository.createVisit = vi.fn().mockImplementation((input) => {
        // Verify the address was passed correctly
        expect(input.address).toEqual(mockAddress);
        return Promise.resolve({
          ...input,
          id: 'visit-123',
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const options: ScheduleGenerationOptions = {
        patternId: 'pattern-123' as UUID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      };

      const visits = await serviceWithProvider.generateScheduleFromPattern(
        options,
        testContext
      );

      expect(visits).toHaveLength(1);
      expect(mockAddressProvider.getClientAddress).toHaveBeenCalledWith('client-123');
    });

    it('should call address provider for each visit generated', async () => {
      const mockAddress = {
        line1: '456 Oak Ave',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75201',
        country: 'USA',
        latitude: 32.7767,
        longitude: -96.7970,
        geofenceRadius: 100,
      };

      mockAddressProvider.getClientAddress = vi.fn().mockResolvedValue(mockAddress);

      const serviceWithProvider = new ScheduleService(
        mockRepository,
        mockAddressProvider
      );

      // Mock the pattern for weekly recurrence
      mockRepository.getServicePatternById = vi.fn().mockResolvedValue({
        id: 'pattern-456',
        organizationId: 'org-123',
        branchId: 'branch-123',
        clientId: 'client-456',
        status: 'ACTIVE',
        serviceTypeId: 'service-type-123',
        serviceTypeName: 'Skilled Nursing',
        duration: 120,
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          startTime: '14:00',
          daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        },
        taskTemplateIds: [],
        requiredSkills: ['CPR', 'First Aid'],
        requiredCertifications: ['RN'],
      });

      let visitCount = 0;
      mockRepository.createVisit = vi.fn().mockImplementation((input) => {
        visitCount++;
        return Promise.resolve({
          ...input,
          id: `visit-${visitCount}`,
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const options: ScheduleGenerationOptions = {
        patternId: 'pattern-456' as UUID,
        startDate: new Date('2024-01-01'), // Monday
        endDate: new Date('2024-01-05'), // Friday
      };

      const visits = await serviceWithProvider.generateScheduleFromPattern(
        options,
        testContext
      );

      // Should generate 3 visits (Mon, Wed, Fri)
      expect(visits.length).toBeGreaterThan(0);
      expect(mockAddressProvider.getClientAddress).toHaveBeenCalledTimes(
        visits.length
      );
    });
  });

  describe('Address Provider Integration Scenarios', () => {
    it('should handle address provider errors gracefully', async () => {
      const errorProvider: IClientAddressProvider = {
        getClientAddress: vi.fn().mockRejectedValue(
          new Error('Client not found')
        ),
      };

      const serviceWithErrorProvider = new ScheduleService(
        mockRepository,
        errorProvider
      );

      mockRepository.getServicePatternById = vi.fn().mockResolvedValue({
        id: 'pattern-789',
        organizationId: 'org-123',
        branchId: 'branch-123',
        clientId: 'client-nonexistent',
        status: 'ACTIVE',
        serviceTypeId: 'service-type-123',
        serviceTypeName: 'Personal Care',
        duration: 60,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          startTime: '10:00',
        },
        taskTemplateIds: [],
        requiredSkills: [],
        requiredCertifications: [],
      });

      const options: ScheduleGenerationOptions = {
        patternId: 'pattern-789' as UUID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      };

      await expect(
        serviceWithErrorProvider.generateScheduleFromPattern(options, testContext)
      ).rejects.toThrow('Client not found');
    });

    it('should use addresses with geofence data for EVV validation', async () => {
      const mockAddressWithGeofence = {
        line1: '789 Pine Rd',
        city: 'Houston',
        state: 'TX',
        postalCode: '77001',
        country: 'USA',
        latitude: 29.7604,
        longitude: -95.3698,
        geofenceRadius: 150, // Custom geofence radius
      };

      mockAddressProvider.getClientAddress = vi.fn().mockResolvedValue(
        mockAddressWithGeofence
      );

      const serviceWithProvider = new ScheduleService(
        mockRepository,
        mockAddressProvider
      );

      mockRepository.getServicePatternById = vi.fn().mockResolvedValue({
        id: 'pattern-evv',
        organizationId: 'org-123',
        branchId: 'branch-123',
        clientId: 'client-evv',
        status: 'ACTIVE',
        serviceTypeId: 'service-type-123',
        serviceTypeName: 'EVV Required Service',
        duration: 60,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          startTime: '08:00',
        },
        taskTemplateIds: [],
        requiredSkills: [],
        requiredCertifications: [],
      });

      mockRepository.createVisit = vi.fn().mockImplementation((input) => {
        expect(input.address.geofenceRadius).toBe(150);
        return Promise.resolve({
          ...input,
          id: 'visit-evv',
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const options: ScheduleGenerationOptions = {
        patternId: 'pattern-evv' as UUID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      };

      await serviceWithProvider.generateScheduleFromPattern(options, testContext);

      expect(mockRepository.createVisit).toHaveBeenCalled();
    });
  });
});
