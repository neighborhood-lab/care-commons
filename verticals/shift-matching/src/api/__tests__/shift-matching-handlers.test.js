"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shift_matching_handlers_1 = require("../shift-matching-handlers");
const vitest_1 = require("vitest");
const mockPool = {
    query: vitest_1.vi.fn(),
};
const mockService = {
    createOpenShift: vitest_1.vi.fn(),
    matchShift: vitest_1.vi.fn(),
    createProposal: vitest_1.vi.fn(),
    respondToProposal: vitest_1.vi.fn(),
    getAvailableShiftsForCaregiver: vitest_1.vi.fn(),
    getCaregiverProposals: vitest_1.vi.fn(),
    markProposalViewed: vitest_1.vi.fn(),
    caregiverSelectShift: vitest_1.vi.fn(),
    expireStaleProposals: vitest_1.vi.fn(),
};
const mockRepository = {
    searchOpenShifts: vitest_1.vi.fn(),
    getOpenShift: vitest_1.vi.fn(),
    getProposalsByOpenShift: vitest_1.vi.fn(),
    searchProposals: vitest_1.vi.fn(),
    getProposal: vitest_1.vi.fn(),
    createMatchingConfiguration: vitest_1.vi.fn(),
    updateMatchingConfiguration: vitest_1.vi.fn(),
    getMatchingConfiguration: vitest_1.vi.fn(),
    getDefaultConfiguration: vitest_1.vi.fn(),
    upsertCaregiverPreferences: vitest_1.vi.fn(),
    getCaregiverPreferences: vitest_1.vi.fn(),
};
const mockContext = {
    userId: 'user-123',
    organizationId: 'org-123',
    branchIds: ['branch-123'],
    roles: ['SCHEDULER'],
    permissions: ['shifts:write', 'shifts:read'],
};
(0, vitest_1.describe)('ShiftMatchingHandlers', () => {
    let handlers;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        handlers = new shift_matching_handlers_1.ShiftMatchingHandlers(mockPool);
        handlers.service = mockService;
        handlers.repository = mockRepository;
    });
    (0, vitest_1.describe)('Scheduler Operations', () => {
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
                mockService.createOpenShift.mockResolvedValue(mockOpenShift);
                const result = await handlers.createOpenShift(input, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockOpenShift);
                (0, vitest_1.expect)(mockService.createOpenShift).toHaveBeenCalledWith(input, mockContext);
            });
        });
        (0, vitest_1.describe)('matchOpenShift', () => {
            (0, vitest_1.it)('should match open shift', async () => {
                const input = {
                    configurationId: 'config-123',
                    autoPropose: true,
                    maxCandidates: 5,
                };
                const mockResult = {
                    openShift: { id: 'shift-123' },
                    candidates: [],
                    proposalsCreated: [],
                    eligibleCount: 2,
                    ineligibleCount: 0,
                };
                mockService.matchShift.mockResolvedValue(mockResult);
                const result = await handlers.matchOpenShift('shift-123', input, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockResult);
                (0, vitest_1.expect)(mockService.matchShift).toHaveBeenCalledWith({
                    openShiftId: 'shift-123',
                    configurationId: 'config-123',
                    autoPropose: true,
                    maxCandidates: 5,
                }, mockContext);
            });
        });
        (0, vitest_1.describe)('searchOpenShifts', () => {
            (0, vitest_1.it)('should search open shifts', async () => {
                const filters = {
                    organizationId: 'org-123',
                    priority: ['HIGH', 'CRITICAL'],
                };
                const pagination = {
                    page: 1,
                    limit: 10,
                };
                const mockResult = {
                    items: [{ id: 'shift-123' }],
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                };
                mockRepository.searchOpenShifts.mockResolvedValue(mockResult);
                const result = await handlers.searchOpenShifts(filters, pagination, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockResult);
                (0, vitest_1.expect)(mockRepository.searchOpenShifts).toHaveBeenCalledWith(filters, pagination);
            });
        });
        (0, vitest_1.describe)('getOpenShift', () => {
            (0, vitest_1.it)('should get open shift by ID', async () => {
                const mockOpenShift = {
                    id: 'shift-123',
                    visitId: 'visit-123',
                };
                mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
                const result = await handlers.getOpenShift('shift-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockOpenShift);
                (0, vitest_1.expect)(mockRepository.getOpenShift).toHaveBeenCalledWith('shift-123');
            });
        });
        (0, vitest_1.describe)('getProposalsForShift', () => {
            (0, vitest_1.it)('should get proposals for shift', async () => {
                const mockProposals = [
                    { id: 'proposal-123', openShiftId: 'shift-123' },
                ];
                mockRepository.getProposalsByOpenShift.mockResolvedValue(mockProposals);
                const result = await handlers.getProposalsForShift('shift-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposals);
                (0, vitest_1.expect)(mockRepository.getProposalsByOpenShift).toHaveBeenCalledWith('shift-123');
            });
        });
        (0, vitest_1.describe)('createManualProposal', () => {
            (0, vitest_1.it)('should create manual proposal', async () => {
                const input = {
                    openShiftId: 'shift-123',
                    caregiverId: 'cg-123',
                    proposalMethod: 'MANUAL',
                    sendNotification: true,
                };
                const mockOpenShift = {
                    id: 'shift-123',
                    branchId: 'branch-123',
                };
                const mockConfig = {
                    id: 'config-123',
                    weights: {},
                };
                const mockCandidate = {
                    caregiverId: 'cg-123',
                    overallScore: 85,
                    matchQuality: 'GOOD',
                };
                const mockProposal = {
                    id: 'proposal-123',
                    openShiftId: 'shift-123',
                    caregiverId: 'cg-123',
                };
                mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
                mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
                const mockBuildCaregiverContext = vitest_1.vi.fn().mockResolvedValue({});
                mockService.buildCaregiverContext = mockBuildCaregiverContext;
                const mockMatchingAlgorithm = {
                    evaluateMatch: vitest_1.vi.fn().mockReturnValue(mockCandidate),
                };
                vitest_1.vi.doMock('../../utils/matching-algorithm', () => ({
                    MatchingAlgorithm: mockMatchingAlgorithm,
                }));
                mockService.createProposal.mockResolvedValue(mockProposal);
                const result = await handlers.createManualProposal(input, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposal);
                (0, vitest_1.expect)(mockRepository.getOpenShift).toHaveBeenCalledWith('shift-123');
                (0, vitest_1.expect)(mockRepository.getDefaultConfiguration).toHaveBeenCalledWith('org-123', 'branch-123');
            });
            (0, vitest_1.it)('should throw error if open shift not found', async () => {
                const input = {
                    openShiftId: 'invalid-shift',
                    caregiverId: 'cg-123',
                    proposalMethod: 'MANUAL',
                };
                mockRepository.getOpenShift.mockResolvedValue(null);
                await (0, vitest_1.expect)(handlers.createManualProposal(input, mockContext))
                    .rejects.toThrow('Open shift not found');
            });
            (0, vitest_1.it)('should throw error if no configuration found', async () => {
                const input = {
                    openShiftId: 'shift-123',
                    caregiverId: 'cg-123',
                    proposalMethod: 'MANUAL',
                };
                const mockOpenShift = {
                    id: 'shift-123',
                    branchId: 'branch-123',
                };
                mockRepository.getOpenShift.mockResolvedValue(mockOpenShift);
                mockRepository.getDefaultConfiguration.mockResolvedValue(null);
                await (0, vitest_1.expect)(handlers.createManualProposal(input, mockContext))
                    .rejects.toThrow('No matching configuration found');
            });
        });
        (0, vitest_1.describe)('respondToProposal', () => {
            (0, vitest_1.it)('should respond to proposal', async () => {
                const input = {
                    proposalId: 'proposal-123',
                    accept: true,
                    responseMethod: 'WEB',
                };
                const mockProposal = {
                    id: 'proposal-123',
                    proposalStatus: 'ACCEPTED',
                };
                mockService.respondToProposal.mockResolvedValue(mockProposal);
                const result = await handlers.respondToProposal('proposal-123', input, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposal);
                (0, vitest_1.expect)(mockService.respondToProposal).toHaveBeenCalledWith('proposal-123', input, mockContext);
            });
        });
        (0, vitest_1.describe)('searchProposals', () => {
            (0, vitest_1.it)('should search proposals', async () => {
                const filters = {
                    organizationId: 'org-123',
                    proposalStatus: ['PENDING', 'SENT'],
                };
                const pagination = {
                    page: 1,
                    limit: 10,
                };
                const mockResult = {
                    items: [{ id: 'proposal-123' }],
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                };
                mockRepository.searchProposals.mockResolvedValue(mockResult);
                const result = await handlers.searchProposals(filters, pagination, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockResult);
                (0, vitest_1.expect)(mockRepository.searchProposals).toHaveBeenCalledWith(filters, pagination);
            });
        });
    });
    (0, vitest_1.describe)('Caregiver Self-Service', () => {
        (0, vitest_1.describe)('getAvailableShifts', () => {
            (0, vitest_1.it)('should get available shifts for caregiver', async () => {
                const mockCandidates = [
                    {
                        caregiverId: 'cg-123',
                        openShiftId: 'shift-123',
                        caregiverName: 'John Doe',
                        caregiverPhone: '555-123-4567',
                        employmentType: 'FULL_TIME',
                        overallScore: 85,
                        matchQuality: 'EXCELLENT',
                        scores: {
                            skillsScore: 90,
                            availabilityScore: 80,
                            proximityScore: 85,
                            preferenceScore: 85,
                            historyScore: 80,
                        },
                        isEligible: true,
                        eligibilityIssues: [],
                        warnings: [],
                        hasConflict: false,
                        availableHours: 40,
                    },
                ];
                mockService.getAvailableShiftsForCaregiver.mockResolvedValue(mockCandidates);
                const result = await handlers.getAvailableShifts('cg-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockCandidates);
                (0, vitest_1.expect)(mockService.getAvailableShiftsForCaregiver).toHaveBeenCalledWith('cg-123', mockContext);
            });
        });
        (0, vitest_1.describe)('getCaregiverProposals', () => {
            (0, vitest_1.it)('should get proposals for caregiver', async () => {
                const mockProposals = [
                    { id: 'proposal-123', caregiverId: 'cg-123' },
                ];
                mockService.getCaregiverProposals.mockResolvedValue(mockProposals);
                const result = await handlers.getCaregiverProposals('cg-123', ['PENDING', 'SENT'], mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposals);
                (0, vitest_1.expect)(mockService.getCaregiverProposals).toHaveBeenCalledWith('cg-123', ['PENDING', 'SENT']);
            });
        });
        (0, vitest_1.describe)('markProposalViewed', () => {
            (0, vitest_1.it)('should mark proposal as viewed', async () => {
                const mockProposal = {
                    id: 'proposal-123',
                    proposalStatus: 'VIEWED',
                };
                mockService.markProposalViewed.mockResolvedValue(mockProposal);
                const result = await handlers.markProposalViewed('proposal-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposal);
                (0, vitest_1.expect)(mockService.markProposalViewed).toHaveBeenCalledWith('proposal-123', mockContext);
            });
        });
        (0, vitest_1.describe)('acceptProposal', () => {
            (0, vitest_1.it)('should accept proposal', async () => {
                const mockProposal = {
                    id: 'proposal-123',
                    proposalStatus: 'ACCEPTED',
                };
                mockService.respondToProposal.mockResolvedValue(mockProposal);
                const result = await handlers.acceptProposal('proposal-123', 'Looking forward to it', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposal);
                (0, vitest_1.expect)(mockService.respondToProposal).toHaveBeenCalledWith('proposal-123', {
                    proposalId: 'proposal-123',
                    accept: true,
                    responseMethod: 'WEB',
                    notes: 'Looking forward to it',
                }, mockContext);
            });
        });
        (0, vitest_1.describe)('rejectProposal', () => {
            (0, vitest_1.it)('should reject proposal', async () => {
                const mockProposal = {
                    id: 'proposal-123',
                    proposalStatus: 'REJECTED',
                };
                mockService.respondToProposal.mockResolvedValue(mockProposal);
                const result = await handlers.rejectProposal('proposal-123', 'Too far', 'TOO_FAR', 'Not interested in this location', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposal);
                (0, vitest_1.expect)(mockService.respondToProposal).toHaveBeenCalledWith('proposal-123', {
                    proposalId: 'proposal-123',
                    accept: false,
                    rejectionReason: 'Too far',
                    rejectionCategory: 'TOO_FAR',
                    responseMethod: 'WEB',
                    notes: 'Not interested in this location',
                }, mockContext);
            });
        });
        (0, vitest_1.describe)('claimShift', () => {
            (0, vitest_1.it)('should allow caregiver to claim shift', async () => {
                const mockProposal = {
                    id: 'proposal-123',
                    proposalStatus: 'PENDING',
                };
                mockService.caregiverSelectShift.mockResolvedValue(mockProposal);
                const result = await handlers.claimShift('shift-123', 'cg-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockProposal);
                (0, vitest_1.expect)(mockService.caregiverSelectShift).toHaveBeenCalledWith('cg-123', 'shift-123', mockContext);
            });
        });
        (0, vitest_1.describe)('updateCaregiverPreferences', () => {
            (0, vitest_1.it)('should update caregiver preferences', async () => {
                const input = {
                    maxTravelDistance: 25,
                    maxShiftsPerWeek: 40,
                    willingToAcceptUrgentShifts: true,
                };
                const mockPreferences = {
                    id: 'pref-123',
                    caregiverId: 'cg-123',
                    maxTravelDistance: 25,
                    maxShiftsPerWeek: 40,
                    willingToAcceptUrgentShifts: true,
                };
                mockRepository.upsertCaregiverPreferences.mockResolvedValue(mockPreferences);
                const result = await handlers.updateCaregiverPreferences('cg-123', input, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockPreferences);
                (0, vitest_1.expect)(mockRepository.upsertCaregiverPreferences).toHaveBeenCalledWith('cg-123', 'org-123', input, mockContext);
            });
        });
        (0, vitest_1.describe)('getCaregiverPreferences', () => {
            (0, vitest_1.it)('should get caregiver preferences', async () => {
                const mockPreferences = {
                    id: 'pref-123',
                    caregiverId: 'cg-123',
                };
                mockRepository.getCaregiverPreferences.mockResolvedValue(mockPreferences);
                const result = await handlers.getCaregiverPreferences('cg-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockPreferences);
                (0, vitest_1.expect)(mockRepository.getCaregiverPreferences).toHaveBeenCalledWith('cg-123');
            });
        });
    });
    (0, vitest_1.describe)('Configuration & Admin', () => {
        (0, vitest_1.describe)('createConfiguration', () => {
            (0, vitest_1.it)('should create configuration', async () => {
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
                };
                const mockConfig = {
                    id: 'config-123',
                    name: 'Test Config',
                    weights: input.weights,
                };
                mockRepository.createMatchingConfiguration.mockResolvedValue(mockConfig);
                const result = await handlers.createConfiguration(input, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockConfig);
                (0, vitest_1.expect)(mockRepository.createMatchingConfiguration).toHaveBeenCalledWith(input, mockContext);
            });
        });
        (0, vitest_1.describe)('getConfiguration', () => {
            (0, vitest_1.it)('should get configuration by ID', async () => {
                const mockConfig = {
                    id: 'config-123',
                    name: 'Test Config',
                };
                mockRepository.getMatchingConfiguration.mockResolvedValue(mockConfig);
                const result = await handlers.getConfiguration('config-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockConfig);
                (0, vitest_1.expect)(mockRepository.getMatchingConfiguration).toHaveBeenCalledWith('config-123');
            });
        });
        (0, vitest_1.describe)('updateConfiguration', () => {
            (0, vitest_1.it)('should update configuration', async () => {
                const input = {
                    name: 'Updated Config',
                    autoAssignThreshold: 85,
                };
                const mockConfig = {
                    id: 'config-123',
                    name: 'Updated Config',
                    autoAssignThreshold: 85,
                };
                mockRepository.updateMatchingConfiguration.mockResolvedValue(mockConfig);
                const result = await handlers.updateConfiguration('config-123', input, mockContext);
                (0, vitest_1.expect)(result).toEqual(mockConfig);
                (0, vitest_1.expect)(mockRepository.updateMatchingConfiguration).toHaveBeenCalledWith('config-123', input, mockContext);
            });
        });
        (0, vitest_1.describe)('getDefaultConfiguration', () => {
            (0, vitest_1.it)('should get default configuration', async () => {
                const mockConfig = {
                    id: 'config-123',
                    name: 'Default Config',
                    isDefault: true,
                };
                mockRepository.getDefaultConfiguration.mockResolvedValue(mockConfig);
                const result = await handlers.getDefaultConfiguration('org-123', 'branch-123', mockContext);
                (0, vitest_1.expect)(result).toEqual(mockConfig);
                (0, vitest_1.expect)(mockRepository.getDefaultConfiguration).toHaveBeenCalledWith('org-123', 'branch-123');
            });
        });
        (0, vitest_1.describe)('expireStaleProposals', () => {
            (0, vitest_1.it)('should expire stale proposals', async () => {
                mockService.expireStaleProposals.mockResolvedValue(5);
                const result = await handlers.expireStaleProposals(mockContext);
                (0, vitest_1.expect)(result).toEqual({
                    success: true,
                    expiredCount: 5,
                    message: 'Expired 5 stale proposal(s)',
                });
                (0, vitest_1.expect)(mockService.expireStaleProposals).toHaveBeenCalledWith(mockContext);
            });
        });
    });
    (0, vitest_1.describe)('Analytics & Reporting', () => {
        (0, vitest_1.describe)('getMatchingMetrics', () => {
            (0, vitest_1.it)('should get matching metrics', async () => {
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
                (0, vitest_1.expect)(result).toEqual(mockMetrics);
                (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('FROM match_history'), [periodStart, periodEnd]);
            });
        });
        (0, vitest_1.describe)('getCaregiverPerformance', () => {
            (0, vitest_1.it)('should get caregiver performance', async () => {
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
                (0, vitest_1.expect)(result).toEqual(mockPerformance);
                (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('WHERE caregiver_id = $1'), [caregiverId, periodStart, periodEnd]);
            });
        });
        (0, vitest_1.describe)('getTopRejectionReasons', () => {
            (0, vitest_1.it)('should get top rejection reasons', async () => {
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
                (0, vitest_1.expect)(result).toEqual(mockRejectionReasons);
                (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('FROM assignment_proposals'), [periodStart, periodEnd]);
            });
        });
    });
});
//# sourceMappingURL=shift-matching-handlers.test.js.map