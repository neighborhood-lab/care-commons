"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shift_matching_service_1 = require("../shift-matching-service");
const matching_algorithm_1 = require("../../utils/matching-algorithm");
const core_1 = require("@care-commons/core");
const vitest_1 = require("vitest");
const mockPool = {
    query: vitest_1.vi.fn(),
};
const mockRepository = {
    createOpenShift: vitest_1.vi.fn(),
    getOpenShift: vitest_1.vi.fn(),
    updateOpenShiftStatus: vitest_1.vi.fn(),
    searchOpenShifts: vitest_1.vi.fn(),
    getMatchingConfiguration: vitest_1.vi.fn(),
    getDefaultConfiguration: vitest_1.vi.fn(),
    updateMatchingConfiguration: vitest_1.vi.fn(),
    createProposal: vitest_1.vi.fn(),
    getProposal: vitest_1.vi.fn(),
    updateProposalStatus: vitest_1.vi.fn(),
    respondToProposal: vitest_1.vi.fn(),
    getProposalsByCaregiver: vitest_1.vi.fn(),
    getProposalsByOpenShift: vitest_1.vi.fn(),
    searchProposals: vitest_1.vi.fn(),
    getCaregiverPreferences: vitest_1.vi.fn(),
    upsertCaregiverPreferences: vitest_1.vi.fn(),
    createBulkMatchRequest: vitest_1.vi.fn(),
    updateBulkMatchRequest: vitest_1.vi.fn(),
    createMatchHistory: vitest_1.vi.fn(),
};
const mockCaregiverService = {
    getCaregiverById: vitest_1.vi.fn(),
    searchCaregivers: vitest_1.vi.fn(),
};
const mockContext = {
    userId: 'user-123',
    organizationId: 'org-123',
    branchIds: ['branch-123'],
    roles: ['SCHEDULER'],
    permissions: ['shifts:write', 'shifts:read'],
};
vitest_1.vi.mock('../../utils/matching-algorithm', () => ({
    MatchingAlgorithm: {
        evaluateMatch: vitest_1.vi.fn(),
        rankCandidates: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('ShiftMatchingService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        service = new shift_matching_service_1.ShiftMatchingService(mockRepository, mockCaregiverService);
    });
    (0, vitest_1.describe)('createOpenShift', () => {
        (0, vitest_1.it)('should create open shift', async () => {
            const input = {
                visitId: 'visit-123',
                priority: 'HIGH',
            };
            const mockOpenShift = {
                id: 'shift-123',
                visitId: 'visit-123',
                priority: 'HIGH',
                matchingStatus: 'NEW',
            };
            mockRepository.createOpenShift.mockResolvedValue(mockOpenShift);
            const result = await service.createOpenShift(input, mockContext);
            (0, vitest_1.expect)(result).toEqual(mockOpenShift);
            (0, vitest_1.expect)(mockRepository.createOpenShift).toHaveBeenCalledWith(input, mockContext);
        });
    });
    (0, vitest_1.describe)('matchShift', () => {
        const mockOpenShift = {
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
        };
        const mockConfig = {
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
        };
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
                        longitude: -74.0060,
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
        const mockCandidates = [
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
                    { category: 'SKILL', description: 'Has required skills', impact: 'POSITIVE', weight: 0.2 },
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
                    { category: 'SKILL', description: 'Has required skills', impact: 'POSITIVE', weight: 0.2 },
                ],
                computedAt: new Date(),
            },
        ];
        (0, vitest_1.it)('should match shift and create proposals', async () => {
            const input = {
                openShiftId: 'shift-123',
                autoPropose: true,
                maxCandidates: 2,
            };
            mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
            mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
            mockCaregiverService.searchCaregivers.mockResolvedValue(mockCaregivers);
            mockCaregiverService.getCaregiverById.mockImplementation((caregiverId) => {
                return Promise.resolve(mockCaregivers.items.find((cg) => cg.id === caregiverId));
            });
            matching_algorithm_1.MatchingAlgorithm.evaluateMatch.mockReturnValue(mockCandidates[0]);
            matching_algorithm_1.MatchingAlgorithm.rankCandidates.mockReturnValue(mockCandidates);
            mockRepository.updateOpenShiftStatus.mockResolvedValue(mockOpenShift);
            mockRepository.createProposal.mockResolvedValue({
                id: 'proposal-123',
                proposalStatus: 'PENDING',
            });
            mockRepository.createMatchHistory.mockResolvedValue({});
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ total_minutes: '240' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '5', avg_rating: '4.2' }] })
                .mockResolvedValueOnce({ rows: [{ completed: '48', no_shows: '2', cancellations: '1', total: '51' }] })
                .mockResolvedValueOnce({ rows: [{ count: '1' }] })
                .mockResolvedValueOnce({ rows: [{ total_minutes: '180' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '3', avg_rating: '4.0' }] })
                .mockResolvedValueOnce({ rows: [{ completed: '40', no_shows: '1', cancellations: '2', total: '43' }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] });
            const result = await service.matchShift(input, mockContext);
            (0, vitest_1.expect)(result.openShift).toBeDefined();
            (0, vitest_1.expect)(result.candidates).toHaveLength(2);
            (0, vitest_1.expect)(result.eligibleCount).toBe(2);
            (0, vitest_1.expect)(result.ineligibleCount).toBe(0);
            (0, vitest_1.expect)(result.proposalsCreated).toHaveLength(2);
            (0, vitest_1.expect)(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith('shift-123', 'MATCHING', mockContext);
            (0, vitest_1.expect)(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith('shift-123', 'PROPOSED', mockContext);
        });
        (0, vitest_1.it)('should handle no eligible candidates', async () => {
            const input = {
                openShiftId: 'shift-123',
                autoPropose: false,
            };
            const ineligibleCandidates = mockCandidates.map(c => ({
                ...c,
                isEligible: false,
                overallScore: 40,
            }));
            mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
            mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
            mockCaregiverService.searchCaregivers.mockResolvedValue(mockCaregivers);
            mockCaregiverService.getCaregiverById.mockImplementation((caregiverId) => {
                return Promise.resolve(mockCaregivers.items.find((cg) => cg.id === caregiverId));
            });
            matching_algorithm_1.MatchingAlgorithm.evaluateMatch.mockReturnValue(ineligibleCandidates[0]);
            matching_algorithm_1.MatchingAlgorithm.rankCandidates.mockReturnValue(ineligibleCandidates);
            mockRepository.updateOpenShiftStatus.mockResolvedValue(mockOpenShift);
            mockRepository.createMatchHistory.mockResolvedValue({});
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ total_minutes: '180' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '2', avg_rating: '3.8' }] })
                .mockResolvedValueOnce({ rows: [{ completed: '45', no_shows: '3', cancellations: '2', total: '50' }] })
                .mockResolvedValueOnce({ rows: [{ count: '2' }] })
                .mockResolvedValueOnce({ rows: [{ total_minutes: '160' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '1', avg_rating: '3.5' }] })
                .mockResolvedValueOnce({ rows: [{ completed: '38', no_shows: '4', cancellations: '3', total: '45' }] })
                .mockResolvedValueOnce({ rows: [{ count: '3' }] });
            const result = await service.matchShift(input, mockContext);
            (0, vitest_1.expect)(result.eligibleCount).toBe(0);
            (0, vitest_1.expect)(result.ineligibleCount).toBe(2);
            (0, vitest_1.expect)(result.proposalsCreated).toHaveLength(0);
            (0, vitest_1.expect)(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith('shift-123', 'NO_MATCH', mockContext);
        });
        (0, vitest_1.it)('should throw error if shift not found', async () => {
            const input = { openShiftId: 'invalid-shift' };
            mockRepository.getOpenShift.mockResolvedValue(null);
            await (0, vitest_1.expect)(service.matchShift(input, mockContext))
                .rejects.toThrow(core_1.NotFoundError);
        });
        (0, vitest_1.it)('should throw error if no configuration found', async () => {
            const input = { openShiftId: 'shift-123' };
            mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
            mockRepository.getDefaultConfiguration.mockResolvedValue(null);
            await (0, vitest_1.expect)(service.matchShift(input, mockContext))
                .rejects.toThrow(core_1.ValidationError);
        });
        (0, vitest_1.it)('should handle blocked caregivers', async () => {
            const shiftWithBlocked = {
                ...mockOpenShift,
                blockedCaregivers: ['cg-123'],
            };
            const input = { openShiftId: 'shift-123' };
            mockRepository.getOpenShift.mockResolvedValue(shiftWithBlocked);
            mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
            mockCaregiverService.searchCaregivers.mockResolvedValue(mockCaregivers);
            mockCaregiverService.getCaregiverById.mockImplementation((caregiverId) => {
                return Promise.resolve(mockCaregivers.items.find((cg) => cg.id === caregiverId));
            });
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ total_minutes: '200' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '3', avg_rating: '4.0' }] })
                .mockResolvedValueOnce({ rows: [{ completed: '47', no_shows: '1', cancellations: '2', total: '50' }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] });
            matching_algorithm_1.MatchingAlgorithm.evaluateMatch.mockReturnValue(mockCandidates[1]);
            matching_algorithm_1.MatchingAlgorithm.rankCandidates.mockReturnValue([mockCandidates[1]]);
            mockRepository.updateOpenShiftStatus.mockResolvedValue(mockOpenShift);
            mockRepository.createMatchHistory.mockResolvedValue({});
            const result = await service.matchShift(input, mockContext);
            (0, vitest_1.expect)(result.candidates).toHaveLength(1);
            (0, vitest_1.expect)(result.candidates[0].caregiverId).toBe('cg-456');
        });
    });
    (0, vitest_1.describe)('respondToProposal', () => {
        const mockProposal = {
            id: 'proposal-123',
            openShiftId: 'shift-123',
            visitId: 'visit-123',
            caregiverId: 'cg-123',
            proposalStatus: 'PENDING',
            matchScore: 85,
            matchQuality: 'GOOD',
        };
        (0, vitest_1.it)('should accept proposal and assign shift', async () => {
            const input = {
                proposalId: 'proposal-123',
                accept: true,
                responseMethod: 'WEB',
            };
            const acceptedProposal = {
                ...mockProposal,
                proposalStatus: 'ACCEPTED',
                acceptedAt: new Date(),
                acceptedBy: mockContext.userId,
            };
            mockRepository.getProposal.mockResolvedValue(mockProposal);
            mockRepository.respondToProposal.mockResolvedValue(acceptedProposal);
            mockRepository.updateOpenShiftStatus.mockResolvedValue({});
            mockRepository.createMatchHistory.mockResolvedValue({});
            service.assignShift = vitest_1.vi.fn();
            service.withdrawOtherProposals = vitest_1.vi.fn();
            const result = await service.respondToProposal('proposal-123', input, mockContext);
            (0, vitest_1.expect)(result.proposalStatus).toBe('ACCEPTED');
            (0, vitest_1.expect)(mockRepository.respondToProposal).toHaveBeenCalledWith('proposal-123', input, mockContext);
            (0, vitest_1.expect)(mockRepository.updateOpenShiftStatus).toHaveBeenCalledWith('shift-123', 'ASSIGNED', mockContext);
        });
        (0, vitest_1.it)('should reject proposal', async () => {
            const input = {
                proposalId: 'proposal-123',
                accept: false,
                rejectionReason: 'Too far',
                rejectionCategory: 'TOO_FAR',
                responseMethod: 'WEB',
            };
            const rejectedProposal = {
                ...mockProposal,
                proposalStatus: 'REJECTED',
                rejectedAt: new Date(),
                rejectedBy: mockContext.userId,
                rejectionReason: 'Too far',
                rejectionCategory: 'TOO_FAR',
            };
            mockRepository.getProposal.mockResolvedValue(mockProposal);
            mockRepository.respondToProposal.mockResolvedValue(rejectedProposal);
            mockRepository.getProposalsByOpenShift.mockResolvedValue([]);
            mockRepository.updateOpenShiftStatus.mockResolvedValue({});
            mockRepository.createMatchHistory.mockResolvedValue({});
            const result = await service.respondToProposal('proposal-123', input, mockContext);
            (0, vitest_1.expect)(result.proposalStatus).toBe('REJECTED');
            (0, vitest_1.expect)(result.rejectionReason).toBe('Too far');
        });
        (0, vitest_1.it)('should throw error if proposal not found', async () => {
            const input = {
                proposalId: 'invalid-proposal',
                accept: true,
            };
            mockRepository.getProposal.mockResolvedValue(null);
            await (0, vitest_1.expect)(service.respondToProposal('invalid-proposal', input, mockContext))
                .rejects.toThrow(core_1.NotFoundError);
        });
        (0, vitest_1.it)('should throw error if proposal not active', async () => {
            const input = {
                proposalId: 'proposal-123',
                accept: true,
            };
            const inactiveProposal = { ...mockProposal, proposalStatus: 'ACCEPTED' };
            mockRepository.getProposal.mockResolvedValue(inactiveProposal);
            await (0, vitest_1.expect)(service.respondToProposal('proposal-123', input, mockContext))
                .rejects.toThrow(core_1.ValidationError);
        });
    });
    (0, vitest_1.describe)('getAvailableShiftsForCaregiver', () => {
        const mockCaregiver = {
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
        (0, vitest_1.it)('should get available shifts for caregiver', async () => {
            mockCaregiverService.getCaregiverById.mockResolvedValue(mockCaregiver);
            mockRepository.searchOpenShifts.mockResolvedValue(mockOpenShifts);
            mockRepository.getDefaultConfiguration.mockResolvedValue({
                minScoreForProposal: 60,
            });
            const mockCandidate = {
                caregiverId: 'cg-123',
                openShiftId: 'shift-123',
                caregiverName: 'John Doe',
                caregiverPhone: '555-1234',
                employmentType: 'FULL_TIME',
                overallScore: 85,
                isEligible: true,
                matchQuality: 'GOOD',
                scores: {},
                eligibilityIssues: [],
                warnings: [],
                hasConflict: false,
                availableHours: 20,
                matchReasons: [],
                computedAt: new Date(),
            };
            matching_algorithm_1.MatchingAlgorithm.evaluateMatch.mockReturnValue(mockCandidate);
            matching_algorithm_1.MatchingAlgorithm.rankCandidates.mockReturnValue([mockCandidate]);
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ total_minutes: '160' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '1', avg_rating: '4.5' }] })
                .mockResolvedValueOnce({ rows: [{ completed: '25', no_shows: '1', cancellations: '1', total: '27' }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [{ total_minutes: '160' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '1', avg_rating: '4.5' }] })
                .mockResolvedValueOnce({ rows: [{ completed: '25', no_shows: '1', cancellations: '1', total: '27' }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] });
            const result = await service.getAvailableShiftsForCaregiver('cg-123', mockContext);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].caregiverId).toBe('cg-123');
        });
        (0, vitest_1.it)('should return empty array if no configuration', async () => {
            mockCaregiverService.getCaregiverById.mockResolvedValue(mockCaregiver);
            mockRepository.searchOpenShifts.mockResolvedValue(mockOpenShifts);
            mockRepository.getDefaultConfiguration.mockResolvedValue(null);
            const result = await service.getAvailableShiftsForCaregiver('cg-123', mockContext);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
        (0, vitest_1.it)('should throw error if caregiver not found', async () => {
            mockCaregiverService.getCaregiverById.mockResolvedValue(null);
            await (0, vitest_1.expect)(service.getAvailableShiftsForCaregiver('invalid-cg', mockContext))
                .rejects.toThrow(core_1.NotFoundError);
        });
    });
    (0, vitest_1.describe)('caregiverSelectShift', () => {
        const mockOpenShift = {
            id: 'shift-123',
            matchingStatus: 'NEW',
        };
        const mockCandidate = {
            caregiverId: 'cg-123',
            openShiftId: 'shift-123',
            caregiverName: 'John Doe',
            caregiverPhone: '555-1234',
            employmentType: 'FULL_TIME',
            overallScore: 85,
            isEligible: true,
            matchQuality: 'GOOD',
            scores: {},
            eligibilityIssues: [],
            warnings: [],
            hasConflict: false,
            availableHours: 20,
            matchReasons: [],
            computedAt: new Date(),
        };
        (0, vitest_1.it)('should allow caregiver to select shift', async () => {
            mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
            mockRepository.getDefaultConfiguration.mockResolvedValue({
                minScoreForProposal: 60,
            });
            mockRepository.createProposal.mockResolvedValue({
                id: 'proposal-123',
                proposalStatus: 'PENDING',
                caregiverId: 'cg-123',
            });
            service.buildCaregiverContext = vitest_1.vi.fn().mockResolvedValue({});
            matching_algorithm_1.MatchingAlgorithm.evaluateMatch.mockReturnValue(mockCandidate);
            const result = await service.caregiverSelectShift('cg-123', 'shift-123', mockContext);
            (0, vitest_1.expect)(result.proposalStatus).toBe('PENDING');
            (0, vitest_1.expect)(result.caregiverId).toBe('cg-123');
        });
        (0, vitest_1.it)('should throw error if shift already assigned', async () => {
            const assignedShift = { ...mockOpenShift, matchingStatus: 'ASSIGNED' };
            mockRepository.getOpenShift.mockResolvedValue(assignedShift);
            await (0, vitest_1.expect)(service.caregiverSelectShift('cg-123', 'shift-123', mockContext))
                .rejects.toThrow(core_1.ConflictError);
        });
        (0, vitest_1.it)('should throw error if caregiver not eligible', async () => {
            const ineligibleCandidate = {
                ...mockCandidate,
                isEligible: false,
                eligibilityIssues: [{ type: 'MISSING_SKILL', severity: 'BLOCKING', message: 'Missing skill' }],
            };
            mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
            mockRepository.getDefaultConfiguration.mockResolvedValue({
                minScoreForProposal: 60,
            });
            service.buildCaregiverContext = vitest_1.vi.fn().mockResolvedValue({});
            matching_algorithm_1.MatchingAlgorithm.evaluateMatch.mockReturnValue(ineligibleCandidate);
            await (0, vitest_1.expect)(service.caregiverSelectShift('cg-123', 'shift-123', mockContext))
                .rejects.toThrow(core_1.ValidationError);
        });
        (0, vitest_1.it)('should auto-accept if configured and score is high', async () => {
            const highScoreCandidate = { ...mockCandidate, overallScore: 90 };
            const acceptedProposal = {
                id: 'proposal-123',
                proposalStatus: 'ACCEPTED',
            };
            mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
            mockRepository.getDefaultConfiguration.mockResolvedValue({
                minScoreForProposal: 60,
            });
            mockRepository.createProposal.mockResolvedValue({
                id: 'proposal-123',
                proposalStatus: 'PENDING',
            });
            mockRepository.getCaregiverPreferences.mockResolvedValue({
                acceptAutoAssignment: true,
            });
            vitest_1.vi.spyOn(service, 'respondToProposal').mockResolvedValue(acceptedProposal);
            service.buildCaregiverContext = vitest_1.vi.fn().mockResolvedValue({});
            matching_algorithm_1.MatchingAlgorithm.evaluateMatch.mockReturnValue(highScoreCandidate);
            const result = await service.caregiverSelectShift('cg-123', 'shift-123', mockContext);
            (0, vitest_1.expect)(result.proposalStatus).toBe('ACCEPTED');
            (0, vitest_1.expect)(service.respondToProposal).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('markProposalViewed', () => {
        (0, vitest_1.it)('should mark proposal as viewed', async () => {
            const mockProposal = {
                id: 'proposal-123',
                viewedByCaregiver: false,
                proposalStatus: 'SENT',
            };
            const viewedProposal = {
                ...mockProposal,
                viewedByCaregiver: true,
                proposalStatus: 'VIEWED',
            };
            mockRepository.getProposal.mockResolvedValueOnce(mockProposal);
            mockRepository.updateProposalStatus.mockResolvedValue(viewedProposal);
            mockRepository.getProposal.mockResolvedValueOnce(viewedProposal);
            const result = await service.markProposalViewed('proposal-123', mockContext);
            (0, vitest_1.expect)(result.proposalStatus).toBe('VIEWED');
            (0, vitest_1.expect)(mockRepository.updateProposalStatus).toHaveBeenCalledWith('proposal-123', 'VIEWED', mockContext);
        });
        (0, vitest_1.it)('should not update if already viewed', async () => {
            const alreadyViewedProposal = {
                id: 'proposal-123',
                viewedByCaregiver: true,
                proposalStatus: 'VIEWED',
            };
            mockRepository.getProposal.mockResolvedValue(alreadyViewedProposal);
            const result = await service.markProposalViewed('proposal-123', mockContext);
            (0, vitest_1.expect)(result.proposalStatus).toBe('VIEWED');
            (0, vitest_1.expect)(mockRepository.updateProposalStatus).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('expireStaleProposals', () => {
        (0, vitest_1.it)('should expire stale proposals', async () => {
            const staleProposals = [
                { id: 'proposal-123', open_shift_id: 'shift-123' },
                { id: 'proposal-456', open_shift_id: 'shift-456' },
            ];
            mockPool.query.mockResolvedValue({ rows: staleProposals });
            mockRepository.updateProposalStatus.mockResolvedValue({});
            mockRepository.createMatchHistory.mockResolvedValue({});
            const result = await service.expireStaleProposals(mockContext);
            (0, vitest_1.expect)(result).toBe(2);
            (0, vitest_1.expect)(mockRepository.updateProposalStatus).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockRepository.createMatchHistory).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should return 0 if no stale proposals', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });
            const result = await service.expireStaleProposals(mockContext);
            (0, vitest_1.expect)(result).toBe(0);
            (0, vitest_1.expect)(mockRepository.updateProposalStatus).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getCaregiverProposals', () => {
        (0, vitest_1.it)('should get proposals for caregiver', async () => {
            const mockProposals = [
                { id: 'proposal-123', caregiverId: 'cg-123' },
                { id: 'proposal-456', caregiverId: 'cg-123' },
            ];
            mockRepository.getProposalsByCaregiver.mockResolvedValue(mockProposals);
            const result = await service.getCaregiverProposals('cg-123', ['PENDING', 'SENT']);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(mockRepository.getProposalsByCaregiver).toHaveBeenCalledWith('cg-123', ['PENDING', 'SENT']);
        });
    });
});
//# sourceMappingURL=shift-matching-service.test.js.map