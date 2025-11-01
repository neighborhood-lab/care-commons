/**
 * Tests for Shift Matching API Handlers
 * 
 * Tests cover:
 * - Scheduler operations (create, match, manage shifts)
 * - Caregiver self-service (browse, accept, reject proposals)
 * - Configuration management
 * - Analytics and reporting
 * - Error handling and validation
 */

import { ShiftMatchingHandlers } from '../shift-matching-handlers';
import {
  CreateOpenShiftInput,
  MatchShiftInput,
  CreateProposalInput,
  RespondToProposalInput,
  UpdateCaregiverPreferencesInput,
  OpenShiftFilters,
  ProposalFilters,
  OpenShift,
  AssignmentProposal,
  MatchingConfiguration,
  CaregiverPreferenceProfile,
} from '../../types/shift-matching';
import { UserContext, PaginationParams } from '@care-commons/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
const mockPool = {
  query: vi.fn() as any,
} as any;

const mockService = {
  createOpenShift: vi.fn(),
  matchShift: vi.fn(),
  createProposal: vi.fn(),
  respondToProposal: vi.fn(),
  getAvailableShiftsForCaregiver: vi.fn(),
  getCaregiverProposals: vi.fn(),
  markProposalViewed: vi.fn(),
  caregiverSelectShift: vi.fn(),
  expireStaleProposals: vi.fn(),
} as any;

const mockRepository = {
  searchOpenShifts: vi.fn(),
  getOpenShift: vi.fn(),
  getProposalsByOpenShift: vi.fn(),
  searchProposals: vi.fn(),
  getProposal: vi.fn(),
  createMatchingConfiguration: vi.fn(),
  updateMatchingConfiguration: vi.fn(),
  getMatchingConfiguration: vi.fn(),
  getDefaultConfiguration: vi.fn(),
  upsertCaregiverPreferences: vi.fn(),
  getCaregiverPreferences: vi.fn(),
} as any;

const mockContext: UserContext = {
  userId: 'user-123',
  organizationId: 'org-123',
  branchIds: ['branch-123'],
  roles: ['SCHEDULER'],
  permissions: ['shifts:write', 'shifts:read'],
};

describe('ShiftMatchingHandlers', () => {
  let handlers: ShiftMatchingHandlers;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = new ShiftMatchingHandlers(mockPool);
    
    // Replace service and repository with mocks
    (handlers as any).service = mockService;
    (handlers as any).repository = mockRepository;
  });

  describe('Scheduler Operations', () => {
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

        mockService.createOpenShift.mockResolvedValue(mockOpenShift);

        const result = await handlers.createOpenShift(input, mockContext);

        expect(result).toEqual(mockOpenShift);
        expect(mockService.createOpenShift).toHaveBeenCalledWith(input, mockContext);
      });
    });

    describe('matchOpenShift', () => {
      it('should match open shift', async () => {
        const input: Partial<MatchShiftInput> = {
          configurationId: 'config-123',
          autoPropose: true,
          maxCandidates: 5,
        };

        const mockResult = {
          openShift: { id: 'shift-123' } as OpenShift,
          candidates: [],
          proposalsCreated: [],
          eligibleCount: 2,
          ineligibleCount: 0,
        };

        mockService.matchShift.mockResolvedValue(mockResult);

        const result = await handlers.matchOpenShift('shift-123', input, mockContext);

        expect(result).toEqual(mockResult);
        expect(mockService.matchShift).toHaveBeenCalledWith(
          {
            openShiftId: 'shift-123',
            configurationId: 'config-123',
            autoPropose: true,
            maxCandidates: 5,
          },
          mockContext
        );
      });
    });

    describe('searchOpenShifts', () => {
      it('should search open shifts', async () => {
        const filters: OpenShiftFilters = {
          organizationId: 'org-123',
          priority: ['HIGH', 'CRITICAL'],
        };

        const pagination: PaginationParams = {
          page: 1,
          limit: 10,
        };

        const mockResult = {
          items: [{ id: 'shift-123' } as OpenShift],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        };

        mockRepository.searchOpenShifts.mockResolvedValue(mockResult);

        const result = await handlers.searchOpenShifts(filters, pagination, mockContext);

        expect(result).toEqual(mockResult);
        expect(mockRepository.searchOpenShifts).toHaveBeenCalledWith(filters, pagination);
      });
    });

    describe('getOpenShift', () => {
      it('should get open shift by ID', async () => {
        const mockOpenShift: OpenShift = {
          id: 'shift-123',
          visitId: 'visit-123',
        } as OpenShift;

        mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);

        const result = await handlers.getOpenShift('shift-123', mockContext);

        expect(result).toEqual(mockOpenShift);
        expect(mockRepository.getOpenShift).toHaveBeenCalledWith('shift-123');
      });
    });

    describe('getProposalsForShift', () => {
      it('should get proposals for shift', async () => {
        const mockProposals = [
          { id: 'proposal-123', openShiftId: 'shift-123' } as AssignmentProposal,
        ];

        mockRepository.getProposalsByOpenShift.mockResolvedValue(mockProposals);

        const result = await handlers.getProposalsForShift('shift-123', mockContext);

        expect(result).toEqual(mockProposals);
        expect(mockRepository.getProposalsByOpenShift).toHaveBeenCalledWith('shift-123');
      });
    });

    describe('createManualProposal', () => {
      it('should create manual proposal', async () => {
        const input: CreateProposalInput = {
          openShiftId: 'shift-123',
          caregiverId: 'cg-123',
          proposalMethod: 'MANUAL',
          sendNotification: true,
        };

        const mockOpenShift: OpenShift = {
          id: 'shift-123',
          branchId: 'branch-123',
        } as OpenShift;

        const mockConfig: MatchingConfiguration = {
          id: 'config-123',
          weights: {},
        } as MatchingConfiguration;

        const mockCandidate = {
          caregiverId: 'cg-123',
          overallScore: 85,
          matchQuality: 'GOOD',
        };

        const mockProposal: AssignmentProposal = {
          id: 'proposal-123',
          openShiftId: 'shift-123',
          caregiverId: 'cg-123',
        } as AssignmentProposal;

        mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
        mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
        
        // Mock the private method call
        const mockBuildCaregiverContext = vi.fn().mockResolvedValue({});
        (mockService as any).buildCaregiverContext = mockBuildCaregiverContext;

        // Mock MatchingAlgorithm
        const mockMatchingAlgorithm = {
          evaluateMatch: vi.fn().mockReturnValue(mockCandidate),
        };
        vi.doMock('../../utils/matching-algorithm', () => ({
          MatchingAlgorithm: mockMatchingAlgorithm,
        }));

        mockService.createProposal.mockResolvedValue(mockProposal);

        const result = await handlers.createManualProposal(input, mockContext);

        expect(result).toEqual(mockProposal);
        expect(mockRepository.getOpenShift).toHaveBeenCalledWith('shift-123');
        expect(mockRepository.getDefaultConfiguration).toHaveBeenCalledWith('org-123', 'branch-123');
      });

      it('should throw error if open shift not found', async () => {
        const input: CreateProposalInput = {
          openShiftId: 'invalid-shift',
          caregiverId: 'cg-123',
          proposalMethod: 'MANUAL',
        };

        mockRepository.getOpenShift.mockResolvedValue(null);

        await expect(handlers.createManualProposal(input, mockContext))
          .rejects.toThrow('Open shift not found');
      });

      it('should throw error if no configuration found', async () => {
        const input: CreateProposalInput = {
          openShiftId: 'shift-123',
          caregiverId: 'cg-123',
          proposalMethod: 'MANUAL',
        };

        const mockOpenShift: OpenShift = {
          id: 'shift-123',
          branchId: 'branch-123',
        } as OpenShift;

        mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
        mockRepository.getDefaultConfiguration.mockResolvedValue(null);

        await expect(handlers.createManualProposal(input, mockContext))
          .rejects.toThrow('No matching configuration found');
      });
    });

    describe('respondToProposal', () => {
      it('should respond to proposal', async () => {
        const input: RespondToProposalInput = {
          proposalId: 'proposal-123',
          accept: true,
          responseMethod: 'WEB',
        };

        const mockProposal: AssignmentProposal = {
          id: 'proposal-123',
          proposalStatus: 'ACCEPTED',
        } as AssignmentProposal;

        mockService.respondToProposal.mockResolvedValue(mockProposal);

        const result = await handlers.respondToProposal('proposal-123', input, mockContext);

        expect(result).toEqual(mockProposal);
        expect(mockService.respondToProposal).toHaveBeenCalledWith('proposal-123', input, mockContext);
      });
    });

    describe('searchProposals', () => {
      it('should search proposals', async () => {
        const filters: ProposalFilters = {
          organizationId: 'org-123',
          proposalStatus: ['PENDING', 'SENT'],
        };

        const pagination: PaginationParams = {
          page: 1,
          limit: 10,
        };

        const mockResult = {
          items: [{ id: 'proposal-123' } as AssignmentProposal],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        };

        mockRepository.searchProposals.mockResolvedValue(mockResult);

        const result = await handlers.searchProposals(filters, pagination, mockContext);

        expect(result).toEqual(mockResult);
        expect(mockRepository.searchProposals).toHaveBeenCalledWith(filters, pagination);
      });
    });
  });

  describe('Caregiver Self-Service', () => {
    describe('getAvailableShifts', () => {
      it('should get available shifts for caregiver', async () => {
        const mockCandidates = [
          {
            caregiverId: 'cg-123',
            openShiftId: 'shift-123',
            caregiverName: 'John Doe',
            caregiverPhone: '555-123-4567',
            employmentType: 'FULL_TIME',
            overallScore: 85,
            matchQuality: 'EXCELLENT' as any,
            scores: {
              skillsScore: 90,
              availabilityScore: 80,
              proximityScore: 85,
              preferenceScore: 85,
              historyScore: 80,
            } as any,
            isEligible: true,
            eligibilityIssues: [],
            warnings: [],
            hasConflict: false,
            availableHours: 40,
          },
        ];

        mockService.getAvailableShiftsForCaregiver.mockResolvedValue(mockCandidates);

        const result = await handlers.getAvailableShifts('cg-123', mockContext);

        expect(result).toEqual(mockCandidates);
        expect(mockService.getAvailableShiftsForCaregiver).toHaveBeenCalledWith('cg-123', mockContext);
      });
    });

    describe('getCaregiverProposals', () => {
      it('should get proposals for caregiver', async () => {
        const mockProposals = [
          { id: 'proposal-123', caregiverId: 'cg-123' } as AssignmentProposal,
        ];

        mockService.getCaregiverProposals.mockResolvedValue(mockProposals);

        const result = await handlers.getCaregiverProposals('cg-123', ['PENDING', 'SENT'], mockContext);

        expect(result).toEqual(mockProposals);
        expect(mockService.getCaregiverProposals).toHaveBeenCalledWith('cg-123', ['PENDING', 'SENT']);
      });
    });

    describe('markProposalViewed', () => {
      it('should mark proposal as viewed', async () => {
        const mockProposal: AssignmentProposal = {
          id: 'proposal-123',
          proposalStatus: 'VIEWED',
        } as AssignmentProposal;

        mockService.markProposalViewed.mockResolvedValue(mockProposal);

        const result = await handlers.markProposalViewed('proposal-123', mockContext);

        expect(result).toEqual(mockProposal);
        expect(mockService.markProposalViewed).toHaveBeenCalledWith('proposal-123', mockContext);
      });
    });

    describe('acceptProposal', () => {
      it('should accept proposal', async () => {
        const mockProposal: AssignmentProposal = {
          id: 'proposal-123',
          proposalStatus: 'ACCEPTED',
        } as AssignmentProposal;

        mockService.respondToProposal.mockResolvedValue(mockProposal);

        const result = await handlers.acceptProposal('proposal-123', 'Looking forward to it', mockContext);

        expect(result).toEqual(mockProposal);
        expect(mockService.respondToProposal).toHaveBeenCalledWith(
          'proposal-123',
          {
            proposalId: 'proposal-123',
            accept: true,
            responseMethod: 'WEB',
            notes: 'Looking forward to it',
          },
          mockContext
        );
      });
    });

    describe('rejectProposal', () => {
      it('should reject proposal', async () => {
        const mockProposal: AssignmentProposal = {
          id: 'proposal-123',
          proposalStatus: 'REJECTED',
        } as AssignmentProposal;

        mockService.respondToProposal.mockResolvedValue(mockProposal);

        const result = await handlers.rejectProposal(
          'proposal-123',
          'Too far',
          'TOO_FAR',
          'Not interested in this location',
          mockContext
        );

        expect(result).toEqual(mockProposal);
        expect(mockService.respondToProposal).toHaveBeenCalledWith(
          'proposal-123',
          {
            proposalId: 'proposal-123',
            accept: false,
            rejectionReason: 'Too far',
            rejectionCategory: 'TOO_FAR',
            responseMethod: 'WEB',
            notes: 'Not interested in this location',
          },
          mockContext
        );
      });
    });

    describe('claimShift', () => {
      it('should allow caregiver to claim shift', async () => {
        const mockProposal: AssignmentProposal = {
          id: 'proposal-123',
          proposalStatus: 'PENDING',
        } as AssignmentProposal;

        mockService.caregiverSelectShift.mockResolvedValue(mockProposal);

        const result = await handlers.claimShift('shift-123', 'cg-123', mockContext);

        expect(result).toEqual(mockProposal);
        expect(mockService.caregiverSelectShift).toHaveBeenCalledWith('cg-123', 'shift-123', mockContext);
      });
    });

    describe('updateCaregiverPreferences', () => {
      it('should update caregiver preferences', async () => {
        const input: UpdateCaregiverPreferencesInput = {
          maxTravelDistance: 25,
          maxShiftsPerWeek: 40,
          willingToAcceptUrgentShifts: true,
        };

        const mockPreferences: CaregiverPreferenceProfile = {
          id: 'pref-123',
          caregiverId: 'cg-123',
          maxTravelDistance: 25,
          maxShiftsPerWeek: 40,
          willingToAcceptUrgentShifts: true,
        } as CaregiverPreferenceProfile;

        mockRepository.upsertCaregiverPreferences.mockResolvedValue(mockPreferences);

        const result = await handlers.updateCaregiverPreferences('cg-123', input, mockContext);

        expect(result).toEqual(mockPreferences);
        expect(mockRepository.upsertCaregiverPreferences).toHaveBeenCalledWith(
          'cg-123',
          'org-123',
          input,
          mockContext
        );
      });
    });

    describe('getCaregiverPreferences', () => {
      it('should get caregiver preferences', async () => {
        const mockPreferences: CaregiverPreferenceProfile = {
          id: 'pref-123',
          caregiverId: 'cg-123',
        } as CaregiverPreferenceProfile;

        mockRepository.getCaregiverPreferences.mockResolvedValue(mockPreferences);

        const result = await handlers.getCaregiverPreferences('cg-123', mockContext);

        expect(result).toEqual(mockPreferences);
        expect(mockRepository.getCaregiverPreferences).toHaveBeenCalledWith('cg-123');
      });
    });
  });

  describe('Configuration & Admin', () => {
    describe('createConfiguration', () => {
      it('should create configuration', async () => {
        const input = {
          organizationId: 'org-123',
          name: 'Test Config',
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
          requireExactSkillMatch: false,
          requireActiveCertifications: true,
          respectGenderPreference: true,
          respectLanguagePreference: true,
          maxTravelDistance: 50,
          requireMinimumExperience: 0,
          requireBackgroundCheck: true,
          requireReferences: false,
          autoAssignThreshold: 90,
          maxCandidatesPerShift: 10,
          proposalExpirationHours: 24,
          allowOverbooking: false,
          respectTimeoffRequests: true,
          respectAvailabilityPreferences: true,
          requireComplianceTraining: true,
          maxWeeklyHours: 40,
          requireMinimumRating: 0,
          prioritizeRegularCaregivers: true,
          allowEmergencyOverrides: false,
        } as any;

        const mockConfig: MatchingConfiguration = {
          id: 'config-123',
          name: 'Test Config',
          weights: input.weights,
        } as MatchingConfiguration;

        mockRepository.createMatchingConfiguration.mockResolvedValue(mockConfig);

        const result = await handlers.createConfiguration(input, mockContext);

        expect(result).toEqual(mockConfig);
        expect(mockRepository.createMatchingConfiguration).toHaveBeenCalledWith(input, mockContext);
      });
    });

    describe('getConfiguration', () => {
      it('should get configuration by ID', async () => {
        const mockConfig: MatchingConfiguration = {
          id: 'config-123',
          name: 'Test Config',
        } as MatchingConfiguration;

        mockRepository.getMatchingConfiguration.mockResolvedValue(mockConfig);

        const result = await handlers.getConfiguration('config-123', mockContext);

        expect(result).toEqual(mockConfig);
        expect(mockRepository.getMatchingConfiguration).toHaveBeenCalledWith('config-123');
      });
    });

    describe('updateConfiguration', () => {
      it('should update configuration', async () => {
        const input = {
          name: 'Updated Config',
          autoAssignThreshold: 85,
        };

        const mockConfig: MatchingConfiguration = {
          id: 'config-123',
          name: 'Updated Config',
          autoAssignThreshold: 85,
        } as MatchingConfiguration;

        mockRepository.updateMatchingConfiguration.mockResolvedValue(mockConfig);

        const result = await handlers.updateConfiguration('config-123', input, mockContext);

        expect(result).toEqual(mockConfig);
        expect(mockRepository.updateMatchingConfiguration).toHaveBeenCalledWith('config-123', input, mockContext);
      });
    });

    describe('getDefaultConfiguration', () => {
      it('should get default configuration', async () => {
        const mockConfig: MatchingConfiguration = {
          id: 'config-123',
          name: 'Default Config',
          isDefault: true,
        } as MatchingConfiguration;

        mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);

        const result = await handlers.getDefaultConfiguration('org-123', 'branch-123', mockContext);

        expect(result).toEqual(mockConfig);
        expect(mockRepository.getDefaultConfiguration).toHaveBeenCalledWith('org-123', 'branch-123');
      });
    });

    describe('expireStaleProposals', () => {
      it('should expire stale proposals', async () => {
        mockService.expireStaleProposals.mockResolvedValue(5);

        const result = await handlers.expireStaleProposals(mockContext);

        expect(result).toEqual({
          success: true,
          expiredCount: 5,
          message: 'Expired 5 stale proposal(s)',
        });
        expect(mockService.expireStaleProposals).toHaveBeenCalledWith(mockContext);
      });
    });
  });

  describe('Analytics & Reporting', () => {
    describe('getMatchingMetrics', () => {
      it('should get matching metrics', async () => {
        const periodStart = new Date('2024-01-01');
        const periodEnd = new Date('2024-01-31');

        const mockMetrics = {
          periodStart,
          periodEnd,
          totalOpenShifts: 100,
          shiftsMatched: 85,
          shiftsUnmatched: 15,
          matchRate: 85,
          averageMatchScore: 78.5,
          averageResponseTimeMinutes: 12.3,
          proposalsAccepted: 80,
          proposalsRejected: 15,
          proposalsExpired: 5,
        };

        mockPool.query.mockResolvedValue({
          rows: [{
            total_open_shifts: '100',
            shifts_matched: '85',
            shifts_unmatched: '15',
            average_match_score: '78.5',
            average_response_time: '12.3',
            proposals_accepted: '80',
            proposals_rejected: '15',
            proposals_expired: '5',
          }],
        });

        const result = await handlers.getMatchingMetrics(periodStart, periodEnd, mockContext);

        expect(result).toEqual(mockMetrics);
        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('FROM match_history'),
          [periodStart, periodEnd]
        );
      });
    });

    describe('getCaregiverPerformance', () => {
      it('should get caregiver performance', async () => {
        const caregiverId = 'cg-123';
        const periodStart = new Date('2024-01-01');
        const periodEnd = new Date('2024-01-31');

        const mockPerformance = {
          caregiverId,
          periodStart,
          periodEnd,
          proposalsReceived: 20,
          proposalsAccepted: 15,
          proposalsRejected: 4,
          proposalsExpired: 1,
          acceptanceRate: 75,
          averageMatchScore: 82.5,
          averageResponseTimeMinutes: 8.7,
        };

        mockPool.query.mockResolvedValue({
          rows: [{
            proposals_received: '20',
            proposals_accepted: '15',
            proposals_rejected: '4',
            proposals_expired: '1',
            average_match_score: '82.5',
            average_response_time: '8.7',
          }],
        });

        const result = await handlers.getCaregiverPerformance(caregiverId, periodStart, periodEnd, mockContext);

        expect(result).toEqual(mockPerformance);
        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE caregiver_id = $1'),
          [caregiverId, periodStart, periodEnd]
        );
      });
    });

    describe('getTopRejectionReasons', () => {
      it('should get top rejection reasons', async () => {
        const periodStart = new Date('2024-01-01');
        const periodEnd = new Date('2024-01-31');

        const mockRejectionReasons = [
          { category: 'TOO_FAR', count: 25, percentage: 45.5 },
          { category: 'TIME_CONFLICT', count: 15, percentage: 27.3 },
          { category: 'PERSONAL_REASON', count: 10, percentage: 18.2 },
        ];

        mockPool.query.mockResolvedValue({
          rows: [
            { rejection_category: 'TOO_FAR', count: '25', percentage: '45.5' },
            { rejection_category: 'TIME_CONFLICT', count: '15', percentage: '27.3' },
            { rejection_category: 'PERSONAL_REASON', count: '10', percentage: '18.2' },
          ],
        });

        const result = await handlers.getTopRejectionReasons(periodStart, periodEnd, mockContext);

        expect(result).toEqual(mockRejectionReasons);
        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('FROM assignment_proposals'),
          [periodStart, periodEnd]
        );
      });
    });
  });
});