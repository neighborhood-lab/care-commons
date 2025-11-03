/**
 * Tests for Shift Matching Service
 *
 * Tests cover:
 * - Open shift creation and matching
 * - Proposal lifecycle management
 * - Caregiver self-service operations
 * - Configuration-driven matching
 * - Error handling and edge cases
 */

import { ShiftMatchingService } from '../shift-matching-service';
import { MatchingAlgorithm } from '../../utils/matching-algorithm';
import {
  OpenShift,
  MatchCandidate,
  MatchingConfiguration,
  AssignmentProposal,
  CreateOpenShiftInput,
  MatchShiftInput,
  RespondToProposalInput,
  ProposalStatus,
  MatchingStatus,
} from '../../types/shift-matching';
import { UserContext, NotFoundError, ValidationError, ConflictError } from '@care-commons/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
const mockPool = {
  query: vi.fn(),
} as unknown as any;

const mockRepository = {
  createOpenShift: vi.fn(),
  getOpenShift: vi.fn(),
  updateOpenShiftStatus: vi.fn(),
  searchOpenShifts: vi.fn(),
  getMatchingConfiguration: vi.fn(),
  getDefaultConfiguration: vi.fn(),
  updateMatchingConfiguration: vi.fn(),
  createProposal: vi.fn(),
  getProposal: vi.fn(),
  updateProposalStatus: vi.fn(),
  respondToProposal: vi.fn(),
  getProposalsByCaregiver: vi.fn(),
  getProposalsByOpenShift: vi.fn(),
  searchProposals: vi.fn(),
  getCaregiverPreferences: vi.fn(),
  upsertCaregiverPreferences: vi.fn(),
  createBulkMatchRequest: vi.fn(),
  updateBulkMatchRequest: vi.fn(),
  createMatchHistory: vi.fn(),
} as any;

const mockCaregiverService = {
  getCaregiverById: vi.fn(),
  searchCaregivers: vi.fn(),
} as any;

const mockContext: UserContext = {
  userId: 'user-123',
  organizationId: 'org-123',
  branchIds: ['branch-123'],
  roles: ['SCHEDULER'],
  permissions: ['shifts:write', 'shifts:read'],
};

// Mock MatchingAlgorithm
vi.mock('../../utils/matching-algorithm', () => ({
  MatchingAlgorithm: {
    evaluateMatch: vi.fn(),
    rankCandidates: vi.fn(),
  },
}));

describe('ShiftMatchingService', () => {
  let service: ShiftMatchingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ShiftMatchingService(mockPool, mockCaregiverService as any);
    // Replace the repository with our mock
    (service as any).repository = mockRepository;
  });

  describe('createOpenShift', () => {
    it('should create open shift', async () => {
      const input: CreateOpenShiftInput = {
        visitId: 'visit-123',
        priority: 'HIGH',
      };

      const mockOpenShift: OpenShift = {
        id: 'shift-123',
        visitId: 'visit-123',
        priority: 'HIGH',
        matchingStatus: 'NEW',
      } as OpenShift;

      mockRepository.createOpenShift.mockResolvedValue(mockOpenShift);

      const result = await service.createOpenShift(input, mockContext);

      expect(result).toEqual(mockOpenShift);
      expect(mockRepository.createOpenShift).toHaveBeenCalledWith(input, mockContext);
    });
  });

  describe('matchShift', () => {
    const mockOpenShift: OpenShift = {
      id: 'shift-123',
      visitId: 'visit-123',
      clientId: 'client-123',
      branchId: 'branch-123',
      scheduledDate: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '11:00',
      duration: 120,
      timezone: 'America/New_York',
      serviceTypeId: 'service-123',
      serviceTypeName: 'Personal Care',
      requiredSkills: ['Personal Care'],
      requiredCertifications: ['CNA'],
      priority: 'NORMAL',
      isUrgent: false,
      matchingStatus: 'NEW',
      matchAttempts: 0,
    } as OpenShift;

    const mockConfig: MatchingConfiguration = {
      id: 'config-123',
      organizationId: 'org-123',
      name: 'Default Config',
      weights: {
        skillMatch: 25,
        availabilityMatch: 20,
        proximityMatch: 15,
        preferenceMatch: 10,
        experienceMatch: 10,
        reliabilityMatch: 10,
        complianceMatch: 5,
        capacityMatch: 5,
      },
      minScoreForProposal: 60,
      maxProposalsPerShift: 5,
      proposalExpirationMinutes: 120,
      isActive: true,
      isDefault: true,
    } as MatchingConfiguration;

    const mockCaregivers = {
      items: [
        {
          id: 'cg-123',
          firstName: 'John',
          lastName: 'Doe',
          primaryPhone: { number: '555-1234' },
          employmentType: 'FULL_TIME',
          skills: [{ name: 'Personal Care' }],
          credentials: [{ type: 'CNA', status: 'ACTIVE' }],
          complianceStatus: 'COMPLIANT',
          maxHoursPerWeek: 40,
          primaryAddress: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
        {
          id: 'cg-456',
          firstName: 'Jane',
          lastName: 'Smith',
          primaryPhone: { number: '555-5678' },
          employmentType: 'PART_TIME',
          skills: [{ name: 'Personal Care' }],
          credentials: [{ type: 'CNA', status: 'ACTIVE' }],
          complianceStatus: 'COMPLIANT',
          maxHoursPerWeek: 20,
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    const mockCandidates: MatchCandidate[] = [
      {
        caregiverId: 'cg-123',
        openShiftId: 'shift-123',
        caregiverName: 'John Doe',
        caregiverPhone: '555-1234',
        employmentType: 'FULL_TIME',
        overallScore: 85,
        matchQuality: 'GOOD',
        scores: {
          skillMatch: 100,
          availabilityMatch: 100,
          proximityMatch: 80,
          preferenceMatch: 70,
          experienceMatch: 60,
          reliabilityMatch: 90,
          complianceMatch: 100,
          capacityMatch: 80,
        },
        isEligible: true,
        eligibilityIssues: [],
        warnings: [],
        distanceFromShift: 5.2,
        estimatedTravelTime: 10,
        hasConflict: false,
        availableHours: 30,
        previousVisitsWithClient: 0,
        reliabilityScore: 90,
        matchReasons: [
          {
            category: 'SKILL',
            description: 'Has required skills',
            impact: 'POSITIVE',
            weight: 0.2,
          },
        ],
        computedAt: new Date(),
      },
      {
        caregiverId: 'cg-456',
        openShiftId: 'shift-123',
        caregiverName: 'Jane Smith',
        caregiverPhone: '555-5678',
        employmentType: 'PART_TIME',
        overallScore: 75,
        matchQuality: 'GOOD',
        scores: {
          skillMatch: 100,
          availabilityMatch: 100,
          proximityMatch: 60,
          preferenceMatch: 60,
          experienceMatch: 50,
          reliabilityMatch: 80,
          complianceMatch: 100,
          capacityMatch: 70,
        },
        isEligible: true,
        eligibilityIssues: [],
        warnings: [],
        distanceFromShift: 15.8,
        estimatedTravelTime: 32,
        hasConflict: false,
        availableHours: 15,
        previousVisitsWithClient: 0,
        reliabilityScore: 80,
        matchReasons: [
          {
            category: 'SKILL',
            description: 'Has required skills',
            impact: 'POSITIVE',
            weight: 0.2,
          },
        ],
        computedAt: new Date(),
      },
    ];

    it.skip('should match shift and create proposals', async () => {
      const input: MatchShiftInput = {
        openShiftId: 'shift-123',
        autoPropose: true,
        maxCandidates: 2,
      };

      mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
      mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
      mockCaregiverService.searchCaregivers.mockResolvedValue(mockCaregivers);
      // Mock getCaregiverById for each caregiver in the list
      mockCaregiverService.getCaregiverById.mockImplementation((caregiverId: string) => {
        return Promise.resolve(mockCaregivers.items.find((cg: any) => cg.id === caregiverId));
      });

      (MatchingAlgorithm.evaluateMatch as any).mockReturnValue(mockCandidates[0]);
      (MatchingAlgorithm.rankCandidates as any).mockReturnValue(mockCandidates);
      mockRepository.updateOpenShiftStatus.mockResolvedValue(mockOpenShift);
      mockRepository.createProposal.mockResolvedValue({
        id: 'proposal-123',
        proposalStatus: 'PENDING' as const,
      } as AssignmentProposal);
      mockRepository.createMatchHistory.mockResolvedValue({} as any);

      // Mock database queries for buildCaregiverContext - set up right before calling service
      // Need to handle 2 caregivers, so each query is called twice
      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ total_minutes: '240' }] }) // week hours for caregiver 1
        .mockResolvedValueOnce({ rows: [] }) // conflicts for caregiver 1
        .mockResolvedValueOnce({ rows: [{ count: '5', avg_rating: '4.2' }] }) // previous visits for caregiver 1
        .mockResolvedValueOnce({
          rows: [{ completed: '48', no_shows: '2', cancellations: '1', total: '51' }],
        }) // reliability for caregiver 1
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // rejections for caregiver 1
        .mockResolvedValueOnce({ rows: [{ total_minutes: '180' }] }) // week hours for caregiver 2
        .mockResolvedValueOnce({ rows: [] }) // conflicts for caregiver 2
        .mockResolvedValueOnce({ rows: [{ count: '3', avg_rating: '4.0' }] }) // previous visits for caregiver 2
        .mockResolvedValueOnce({
          rows: [{ completed: '40', no_shows: '1', cancellations: '2', total: '43' }],
        }) // reliability for caregiver 2
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // rejections for caregiver 2

      const result = await service.matchShift(input, mockContext);

      expect(result.openShift).toBeDefined();
      expect(result.candidates).toHaveLength(2);
      expect(result.eligibleCount).toBe(2);
      expect(result.ineligibleCount).toBe(0);
      expect(result.proposalsCreated).toHaveLength(2);

      expect(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith(
        'shift-123',
        'MATCHING',
        mockContext
      );
      expect(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith(
        'shift-123',
        'PROPOSED',
        mockContext
      );
    });

    it.skip('should handle no eligible candidates', async () => {
      const input: MatchShiftInput = {
        openShiftId: 'shift-123',
        autoPropose: false,
      };

      const ineligibleCandidates = mockCandidates.map((c) => ({
        ...c,
        isEligible: false,
        overallScore: 40,
      }));

      mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
      mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
      mockCaregiverService.searchCaregivers.mockResolvedValue(mockCaregivers);
      // Mock getCaregiverById for each caregiver in the list
      mockCaregiverService.getCaregiverById.mockImplementation((caregiverId: string) => {
        return Promise.resolve(mockCaregivers.items.find((cg: any) => cg.id === caregiverId));
      });

      (MatchingAlgorithm.evaluateMatch as any).mockReturnValue(ineligibleCandidates[0]);
      (MatchingAlgorithm.rankCandidates as any).mockReturnValue(ineligibleCandidates);
      mockRepository.updateOpenShiftStatus.mockResolvedValue(mockOpenShift);
      mockRepository.createMatchHistory.mockResolvedValue({} as any);

      // Mock database queries for buildCaregiverContext - set up right before calling service
      // Need to handle 2 caregivers, so each query is called twice
      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ total_minutes: '180' }] }) // week hours for caregiver 1
        .mockResolvedValueOnce({ rows: [] }) // conflicts for caregiver 1
        .mockResolvedValueOnce({ rows: [{ count: '2', avg_rating: '3.8' }] }) // previous visits for caregiver 1
        .mockResolvedValueOnce({
          rows: [{ completed: '45', no_shows: '3', cancellations: '2', total: '50' }],
        }) // reliability for caregiver 1
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // rejections for caregiver 1
        .mockResolvedValueOnce({ rows: [{ total_minutes: '160' }] }) // week hours for caregiver 2
        .mockResolvedValueOnce({ rows: [] }) // conflicts for caregiver 2
        .mockResolvedValueOnce({ rows: [{ count: '1', avg_rating: '3.5' }] }) // previous visits for caregiver 2
        .mockResolvedValueOnce({
          rows: [{ completed: '38', no_shows: '4', cancellations: '3', total: '45' }],
        }) // reliability for caregiver 2
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // rejections for caregiver 2

      const result = await service.matchShift(input, mockContext);

      expect(result.eligibleCount).toBe(0);
      expect(result.ineligibleCount).toBe(2);
      expect(result.proposalsCreated).toHaveLength(0);

      expect(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith(
        'shift-123',
        'NO_MATCH',
        mockContext
      );
    });

    it('should throw error if shift not found', async () => {
      const input: MatchShiftInput = { openShiftId: 'invalid-shift' };

      mockRepository.getOpenShift.mockResolvedValue(null);

      await expect(service.matchShift(input, mockContext)).rejects.toThrow(NotFoundError);
    });

    it('should throw error if no configuration found', async () => {
      const input: MatchShiftInput = { openShiftId: 'shift-123' };

      mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
      mockRepository.getDefaultConfiguration.mockResolvedValue(null);

      await expect(service.matchShift(input, mockContext)).rejects.toThrow(ValidationError);
    });

    it.skip('should handle blocked caregivers', async () => {
      const shiftWithBlocked = {
        ...mockOpenShift,
        blockedCaregivers: ['cg-123'],
      };

      const input: MatchShiftInput = { openShiftId: 'shift-123' };

      mockRepository.getOpenShift.mockResolvedValue(shiftWithBlocked);
      mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
      mockCaregiverService.searchCaregivers.mockResolvedValue(mockCaregivers);
      // Mock getCaregiverById for each caregiver in the list
      mockCaregiverService.getCaregiverById.mockImplementation((caregiverId: string) => {
        return Promise.resolve(mockCaregivers.items.find((cg: any) => cg.id === caregiverId));
      });

      // Mock database queries for buildCaregiverContext
      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ total_minutes: '200' }] }) // week hours
        .mockResolvedValueOnce({ rows: [] }) // conflicts
        .mockResolvedValueOnce({ rows: [{ count: '3', avg_rating: '4.0' }] }) // previous visits
        .mockResolvedValueOnce({
          rows: [{ completed: '47', no_shows: '1', cancellations: '2', total: '50' }],
        }) // reliability
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // rejections

      (MatchingAlgorithm.evaluateMatch as any).mockReturnValue(mockCandidates[1]);
      (MatchingAlgorithm.rankCandidates as any).mockReturnValue([mockCandidates[1]]);
      mockRepository.updateOpenShiftStatus.mockResolvedValue(mockOpenShift);
      mockRepository.createMatchHistory.mockResolvedValue({} as any);

      const result = await service.matchShift(input, mockContext);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0]?.caregiverId).toBe('cg-456');
    });
  });

  describe('respondToProposal', () => {
    const mockProposal: AssignmentProposal = {
      id: 'proposal-123',
      openShiftId: 'shift-123',
      visitId: 'visit-123',
      caregiverId: 'cg-123',
      proposalStatus: 'PENDING' as const,
      matchScore: 85,
      matchQuality: 'GOOD',
    } as AssignmentProposal;

    it('should accept proposal and assign shift', async () => {
      const input: RespondToProposalInput = {
        proposalId: 'proposal-123',
        accept: true,
        responseMethod: 'WEB',
      };

      const acceptedProposal = {
        ...mockProposal,
        proposalStatus: 'ACCEPTED' as const,
        acceptedAt: new Date(),
        acceptedBy: mockContext.userId,
      };

      mockRepository.getProposal.mockResolvedValue(mockProposal);
      mockRepository.respondToProposal.mockResolvedValue(acceptedProposal);
      mockRepository.updateOpenShiftStatus.mockResolvedValue({} as OpenShift);
      mockRepository.createMatchHistory.mockResolvedValue({} as any);

      // Mock the private methods
      (service as any).assignShift = vi.fn();
      (service as any).withdrawOtherProposals = vi.fn();

      const result = await service.respondToProposal('proposal-123', input, mockContext);

      expect(result.proposalStatus).toBe('ACCEPTED');
      expect(mockRepository.respondToProposal).toHaveBeenCalledWith(
        'proposal-123',
        input,
        mockContext
      );
      expect(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith(
        'shift-123',
        'ASSIGNED',
        mockContext
      );
    });

    it('should reject proposal', async () => {
      const input: RespondToProposalInput = {
        proposalId: 'proposal-123',
        accept: false,
        rejectionReason: 'Too far',
        rejectionCategory: 'TOO_FAR',
        responseMethod: 'WEB',
      };

      const rejectedProposal = {
        ...mockProposal,
        proposalStatus: 'REJECTED' as const,
        rejectedAt: new Date(),
        rejectedBy: mockContext.userId,
        rejectionReason: 'Too far',
        rejectionCategory: 'TOO_FAR',
      };

      mockRepository.getProposal.mockResolvedValue(mockProposal);
      mockRepository.respondToProposal.mockResolvedValue(rejectedProposal);
      mockRepository.getProposalsByOpenShift.mockResolvedValue([]);
      mockRepository.updateOpenShiftStatus.mockResolvedValue({} as OpenShift);
      mockRepository.createMatchHistory.mockResolvedValue({} as any);

      const result = await service.respondToProposal('proposal-123', input, mockContext);

      expect(result.proposalStatus).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Too far');
    });

    it('should throw error if proposal not found', async () => {
      const input: RespondToProposalInput = {
        proposalId: 'invalid-proposal',
        accept: true,
      };

      mockRepository.getProposal.mockResolvedValue(null);

      await expect(
        service.respondToProposal('invalid-proposal', input, mockContext)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if proposal not active', async () => {
      const input: RespondToProposalInput = {
        proposalId: 'proposal-123',
        accept: true,
      };

      const inactiveProposal = { ...mockProposal, proposalStatus: 'ACCEPTED' as ProposalStatus };

      mockRepository.getProposal.mockResolvedValue(inactiveProposal);

      await expect(service.respondToProposal('proposal-123', input, mockContext)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('getAvailableShiftsForCaregiver', () => {
    const mockCaregiver: any = {
      id: 'cg-123',
      firstName: 'John',
      lastName: 'Doe',
      primaryBranchId: 'branch-123',
    };

    const mockOpenShifts = {
      items: [
        {
          id: 'shift-123',
          scheduledDate: new Date('2024-01-15'),
          matchingStatus: 'NEW',
        },
        {
          id: 'shift-456',
          scheduledDate: new Date('2024-01-16'),
          matchingStatus: 'MATCHED',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it.skip('should get available shifts for caregiver', async () => {
      mockCaregiverService.getCaregiverById.mockResolvedValue(mockCaregiver);
      mockRepository.searchOpenShifts.mockResolvedValue(mockOpenShifts);
      mockRepository.getDefaultConfiguration.mockResolvedValue({
        minScoreForProposal: 60,
      } as MatchingConfiguration);

      const mockCandidate: MatchCandidate = {
        caregiverId: 'cg-123',
        openShiftId: 'shift-123',
        caregiverName: 'John Doe',
        caregiverPhone: '555-1234',
        employmentType: 'FULL_TIME',
        overallScore: 85,
        isEligible: true,
        matchQuality: 'GOOD' as const,
        scores: {} as any,
        eligibilityIssues: [],
        warnings: [],
        hasConflict: false,
        availableHours: 20,
        matchReasons: [],
        computedAt: new Date(),
      };

      (MatchingAlgorithm.evaluateMatch as any).mockReturnValue(mockCandidate);
      (MatchingAlgorithm.rankCandidates as any).mockReturnValue([mockCandidate]);

      // Mock database queries for buildCaregiverContext - set up right before calling service
      // 2 shifts for 1 caregiver, so need 2 sets of mocks (one per shift)
      (mockPool.query as any)
        .mockResolvedValueOnce({ rows: [{ total_minutes: '160' }] }) // week hours for shift 1
        .mockResolvedValueOnce({ rows: [] }) // conflicts for shift 1
        .mockResolvedValueOnce({ rows: [{ count: '1', avg_rating: '4.5' }] }) // previous visits for shift 1
        .mockResolvedValueOnce({
          rows: [{ completed: '25', no_shows: '1', cancellations: '1', total: '27' }],
        }) // reliability for shift 1
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // rejections for shift 1
        .mockResolvedValueOnce({ rows: [{ total_minutes: '160' }] }) // week hours for shift 2
        .mockResolvedValueOnce({ rows: [] }) // conflicts for shift 2
        .mockResolvedValueOnce({ rows: [{ count: '1', avg_rating: '4.5' }] }) // previous visits for shift 2
        .mockResolvedValueOnce({
          rows: [{ completed: '25', no_shows: '1', cancellations: '1', total: '27' }],
        }) // reliability for shift 2
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // rejections for shift 2

      const result = await service.getAvailableShiftsForCaregiver('cg-123', mockContext);

      expect(result).toHaveLength(1);
      expect(result[0]?.caregiverId).toBe('cg-123');
    });

    it('should return empty array if no configuration', async () => {
      mockCaregiverService.getCaregiverById.mockResolvedValue(mockCaregiver);
      mockRepository.searchOpenShifts.mockResolvedValue(mockOpenShifts);
      mockRepository.getDefaultConfiguration.mockResolvedValue(null);

      const result = await service.getAvailableShiftsForCaregiver('cg-123', mockContext);

      expect(result).toHaveLength(0);
    });

    it('should throw error if caregiver not found', async () => {
      mockCaregiverService.getCaregiverById.mockResolvedValue(null as any);

      await expect(
        service.getAvailableShiftsForCaregiver('invalid-cg', mockContext)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('caregiverSelectShift', () => {
    const mockOpenShift: OpenShift = {
      id: 'shift-123',
      matchingStatus: 'NEW',
    } as OpenShift;

    const mockCandidate: MatchCandidate = {
      caregiverId: 'cg-123',
      openShiftId: 'shift-123',
      caregiverName: 'John Doe',
      caregiverPhone: '555-1234',
      employmentType: 'FULL_TIME',
      overallScore: 85,
      isEligible: true,
      matchQuality: 'GOOD' as const,
      scores: {} as any,
      eligibilityIssues: [],
      warnings: [],
      hasConflict: false,
      availableHours: 20,
      matchReasons: [],
      computedAt: new Date(),
    };

    it.skip('should allow caregiver to select shift', async () => {
      mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
      mockRepository.getDefaultConfiguration.mockResolvedValue({
        minScoreForProposal: 60,
      } as MatchingConfiguration);
      mockRepository.createProposal.mockResolvedValue({
        id: 'proposal-123',
        proposalStatus: 'PENDING' as const,
        caregiverId: 'cg-123',
      } as AssignmentProposal);

      // Mock buildCaregiverContext
      (service as any).buildCaregiverContext = vi.fn().mockResolvedValue({});
      (MatchingAlgorithm.evaluateMatch as any).mockReturnValue(mockCandidate);

      const result = await service.caregiverSelectShift('cg-123', 'shift-123', mockContext);

      expect(result.proposalStatus).toBe('PENDING');
      expect(result.caregiverId).toBe('cg-123');
    });

    it('should throw error if shift already assigned', async () => {
      const assignedShift = { ...mockOpenShift, matchingStatus: 'ASSIGNED' as MatchingStatus };

      mockRepository.getOpenShift.mockResolvedValue(assignedShift);

      await expect(
        service.caregiverSelectShift('cg-123', 'shift-123', mockContext)
      ).rejects.toThrow(ConflictError);
    });

    it('should throw error if caregiver not eligible', async () => {
      const ineligibleCandidate = {
        ...mockCandidate,
        isEligible: false,
        eligibilityIssues: [
          { type: 'MISSING_SKILL', severity: 'BLOCKING', message: 'Missing skill' },
        ],
      };

      mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
      mockRepository.getDefaultConfiguration.mockResolvedValue({
        minScoreForProposal: 60,
      } as MatchingConfiguration);

      (service as any).buildCaregiverContext = vi.fn().mockResolvedValue({});
      (MatchingAlgorithm.evaluateMatch as any).mockReturnValue(ineligibleCandidate);

      await expect(
        service.caregiverSelectShift('cg-123', 'shift-123', mockContext)
      ).rejects.toThrow(ValidationError);
    });

    it('should auto-accept if configured and score is high', async () => {
      const highScoreCandidate = { ...mockCandidate, overallScore: 90 };
      const acceptedProposal = {
        id: 'proposal-123',
        proposalStatus: 'ACCEPTED' as const,
      } as AssignmentProposal;

      mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
      mockRepository.getDefaultConfiguration.mockResolvedValue({
        minScoreForProposal: 60,
      } as MatchingConfiguration);
      mockRepository.createProposal.mockResolvedValue({
        id: 'proposal-123',
        proposalStatus: 'PENDING' as const,
      } as AssignmentProposal);
      mockRepository.getCaregiverPreferences.mockResolvedValue({
        acceptAutoAssignment: true,
      } as any);

      // Mock respondToProposal to return accepted proposal
      vi.spyOn(service, 'respondToProposal').mockResolvedValue(acceptedProposal);

      (service as any).buildCaregiverContext = vi.fn().mockResolvedValue({});
      (MatchingAlgorithm.evaluateMatch as any).mockReturnValue(highScoreCandidate);

      const result = await service.caregiverSelectShift('cg-123', 'shift-123', mockContext);

      expect(result.proposalStatus).toBe('ACCEPTED');
      expect(service.respondToProposal).toHaveBeenCalled();
    });
  });

  describe('markProposalViewed', () => {
    it('should mark proposal as viewed', async () => {
      const mockProposal = {
        id: 'proposal-123',
        viewedByCaregiver: false,
        proposalStatus: 'SENT' as const,
      } as AssignmentProposal;

      const viewedProposal = {
        ...mockProposal,
        viewedByCaregiver: true,
        proposalStatus: 'VIEWED' as const,
      };

      mockRepository.getProposal.mockResolvedValueOnce(mockProposal);
      mockRepository.updateProposalStatus.mockResolvedValue(viewedProposal);
      mockRepository.getProposal.mockResolvedValueOnce(viewedProposal);

      const result = await service.markProposalViewed('proposal-123', mockContext);

      expect(result.proposalStatus).toBe('VIEWED');
      expect(mockRepository.updateProposalStatus).toHaveBeenCalledWith(
        'proposal-123',
        'VIEWED',
        mockContext
      );
    });

    it('should not update if already viewed', async () => {
      const alreadyViewedProposal = {
        id: 'proposal-123',
        viewedByCaregiver: true,
        proposalStatus: 'VIEWED' as const,
      } as AssignmentProposal;

      mockRepository.getProposal.mockResolvedValue(alreadyViewedProposal);

      const result = await service.markProposalViewed('proposal-123', mockContext);

      expect(result.proposalStatus).toBe('VIEWED');
      expect(mockRepository.updateProposalStatus).not.toHaveBeenCalled();
    });
  });

  describe('expireStaleProposals', () => {
    it.skip('should expire stale proposals', async () => {
      const staleProposals = [
        { id: 'proposal-123', open_shift_id: 'shift-123' },
        { id: 'proposal-456', open_shift_id: 'shift-456' },
      ];

      (mockPool.query as any).mockResolvedValue({ rows: staleProposals });
      mockRepository.updateProposalStatus.mockResolvedValue({} as AssignmentProposal);
      mockRepository.createMatchHistory.mockResolvedValue({} as any);

      const result = await service.expireStaleProposals(mockContext);

      expect(result).toBe(2);
      expect(mockRepository.updateProposalStatus).toHaveBeenCalledTimes(2);
      expect(mockRepository.createMatchHistory).toHaveBeenCalledTimes(2);
    });

    it.skip('should return 0 if no stale proposals', async () => {
      (mockPool.query as any).mockResolvedValue({ rows: [] });

      const result = await service.expireStaleProposals(mockContext);

      expect(result).toBe(0);
      expect(mockRepository.updateProposalStatus).not.toHaveBeenCalled();
    });
  });

  describe('getCaregiverProposals', () => {
    it('should get proposals for caregiver', async () => {
      const mockProposals = [
        { id: 'proposal-123', caregiverId: 'cg-123' },
        { id: 'proposal-456', caregiverId: 'cg-123' },
      ] as AssignmentProposal[];

      mockRepository.getProposalsByCaregiver.mockResolvedValue(mockProposals);

      const result = await service.getCaregiverProposals('cg-123', ['PENDING', 'SENT']);

      expect(result).toHaveLength(2);
      expect(mockRepository.getProposalsByCaregiver).toHaveBeenCalledWith('cg-123', [
        'PENDING',
        'SENT',
      ]);
    });
  });
});
