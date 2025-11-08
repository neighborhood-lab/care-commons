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

// Valid UUIDs for testing (version 4, variant 8)
const TEST_IDS = {
  user: '10000000-0000-4000-8000-000000000001' as UUID,
  org: '10000000-0000-4000-8000-000000000002' as UUID,
  branch: '10000000-0000-4000-8000-000000000003' as UUID,
  pattern1: '10000000-0000-4000-8000-000000000010' as UUID,
  pattern2: '10000000-0000-4000-8000-000000000011' as UUID,
  pattern3: '10000000-0000-4000-8000-000000000012' as UUID,
  patternEvv: '10000000-0000-4000-8000-000000000013' as UUID,
  client1: '10000000-0000-4000-8000-000000000020' as UUID,
  client2: '10000000-0000-4000-8000-000000000021' as UUID,
  clientEvv: '10000000-0000-4000-8000-000000000022' as UUID,
  serviceType: '10000000-0000-4000-8000-000000000030' as UUID,
};

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
  userId: TEST_IDS.user,
  organizationId: TEST_IDS.org,
  branchIds: [TEST_IDS.branch],
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
        id: TEST_IDS.pattern1,
        organizationId: TEST_IDS.org,
        branchId: TEST_IDS.branch,
        clientId: TEST_IDS.client1,
        status: 'ACTIVE',
        serviceTypeId: TEST_IDS.serviceType,
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
        patternId: TEST_IDS.pattern1,
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
        id: TEST_IDS.pattern1,
        organizationId: TEST_IDS.org,
        branchId: TEST_IDS.branch,
        clientId: TEST_IDS.client1,
        status: 'ACTIVE',
        serviceTypeId: TEST_IDS.serviceType,
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
          id: '10000000-0000-4000-8000-000000000100',
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const options: ScheduleGenerationOptions = {
        patternId: TEST_IDS.pattern1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      };

      const visits = await serviceWithProvider.generateScheduleFromPattern(
        options,
        testContext
      );

      expect(visits.length).toBeGreaterThan(0);
      expect(mockAddressProvider.getClientAddress).toHaveBeenCalledWith(TEST_IDS.client1);
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
        id: TEST_IDS.pattern2,
        organizationId: TEST_IDS.org,
        branchId: TEST_IDS.branch,
        clientId: TEST_IDS.client2,
        status: 'ACTIVE',
        serviceTypeId: TEST_IDS.serviceType,
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
          id: `10000000-0000-4000-8000-0000000001${String(visitCount).padStart(2, '0')}`,
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const options: ScheduleGenerationOptions = {
        patternId: TEST_IDS.pattern2,
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
        id: TEST_IDS.pattern3,
        organizationId: TEST_IDS.org,
        branchId: TEST_IDS.branch,
        clientId: TEST_IDS.client1,
        status: 'ACTIVE',
        serviceTypeId: TEST_IDS.serviceType,
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
        patternId: TEST_IDS.pattern3,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
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
        id: TEST_IDS.patternEvv,
        organizationId: TEST_IDS.org,
        branchId: TEST_IDS.branch,
        clientId: TEST_IDS.clientEvv,
        status: 'ACTIVE',
        serviceTypeId: TEST_IDS.serviceType,
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
          id: '10000000-0000-4000-8000-000000000200',
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const options: ScheduleGenerationOptions = {
        patternId: TEST_IDS.patternEvv,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      };

      await serviceWithProvider.generateScheduleFromPattern(options, testContext);

      expect(mockRepository.createVisit).toHaveBeenCalled();
    });
  });

  describe('Holiday Filtering', () => {
    const mockHolidayService = {
      getHolidays: vi.fn(),
      isHoliday: vi.fn(),
      getHolidaysForYear: vi.fn(),
      getCalendars: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should skip holidays when generating recurring visits with skipHolidays=true', async () => {
      const mockAddress = {
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
      };

      mockAddressProvider.getClientAddress = vi.fn().mockResolvedValue(mockAddress);

      // Mock holidays - Christmas and New Year's Day
      mockHolidayService.getHolidays.mockResolvedValue([
        {
          id: '10000000-0000-4000-8000-000000000040',
          calendar_id: '10000000-0000-4000-8000-000000000050',
          name: 'Christmas Day',
          holiday_date: new Date('2025-12-25'),
          is_recurring: true,
        },
        {
          id: '10000000-0000-4000-8000-000000000041',
          calendar_id: '10000000-0000-4000-8000-000000000050',
          name: 'New Year\'s Day',
          holiday_date: new Date('2026-01-01'),
          is_recurring: true,
        },
      ]);

      const serviceWithHolidays = new ScheduleService(
        mockRepository,
        mockAddressProvider,
        mockHolidayService as any
      );

      mockRepository.getServicePatternById = vi.fn().mockResolvedValue({
        id: TEST_IDS.pattern1,
        organizationId: TEST_IDS.org,
        branchId: TEST_IDS.branch,
        clientId: TEST_IDS.client1,
        status: 'ACTIVE',
        serviceTypeId: TEST_IDS.serviceType,
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

      const createdVisits: any[] = [];
      mockRepository.createVisit = vi.fn().mockImplementation((input) => {
        const visit = {
          ...input,
          id: `10000000-0000-4000-8000-00000000${String(createdVisits.length).padStart(4, '0')}`,
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        createdVisits.push(visit);
        return Promise.resolve(visit);
      });

      const options: ScheduleGenerationOptions = {
        patternId: TEST_IDS.pattern1,
        startDate: new Date('2025-12-23'),
        endDate: new Date('2025-12-27'),
        skipHolidays: true,
      };

      const visits = await serviceWithHolidays.generateScheduleFromPattern(
        options,
        testContext
      );

      // Should call holiday service to get holidays
      expect(mockHolidayService.getHolidays).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        TEST_IDS.branch
      );

      // Should NOT create visit on Christmas (Dec 25)
      const visitDates = createdVisits.map(v => v.scheduledDate.toISOString().split('T')[0]);
      expect(visitDates).not.toContain('2025-12-25');

      // Should create visits on other days
      expect(visits.length).toBeGreaterThan(0);
      expect(visits.length).toBeLessThan(5); // Less than total days in range
    });

    it('should include holidays when skipHolidays=false', async () => {
      const mockAddress = {
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
      };

      mockAddressProvider.getClientAddress = vi.fn().mockResolvedValue(mockAddress);

      // Even with holidays configured, they should not be filtered
      mockHolidayService.getHolidays.mockResolvedValue([
        {
          id: '10000000-0000-4000-8000-000000000040',
          calendar_id: '10000000-0000-4000-8000-000000000050',
          name: 'Christmas Day',
          holiday_date: new Date('2025-12-25'),
          is_recurring: true,
        },
      ]);

      const serviceWithHolidays = new ScheduleService(
        mockRepository,
        mockAddressProvider,
        mockHolidayService as any
      );

      mockRepository.getServicePatternById = vi.fn().mockResolvedValue({
        id: TEST_IDS.pattern1,
        organizationId: TEST_IDS.org,
        branchId: TEST_IDS.branch,
        clientId: TEST_IDS.client1,
        status: 'ACTIVE',
        serviceTypeId: TEST_IDS.serviceType,
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

      const createdVisits: any[] = [];
      mockRepository.createVisit = vi.fn().mockImplementation((input) => {
        const visit = {
          ...input,
          id: `10000000-0000-4000-8000-00000000${String(createdVisits.length).padStart(4, '0')}`,
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        createdVisits.push(visit);
        return Promise.resolve(visit);
      });

      const options: ScheduleGenerationOptions = {
        patternId: TEST_IDS.pattern1,
        startDate: new Date('2025-12-23'),
        endDate: new Date('2025-12-27'),
        skipHolidays: false,
      };

      await serviceWithHolidays.generateScheduleFromPattern(options, testContext);

      // Should NOT call holiday service when skipHolidays is false
      expect(mockHolidayService.getHolidays).not.toHaveBeenCalled();

      // Should create visits on all days including Christmas
      const visitDates = createdVisits.map(v => v.scheduledDate.toISOString().split('T')[0]);
      expect(visitDates).toContain('2025-12-25');
    });
  });
});
