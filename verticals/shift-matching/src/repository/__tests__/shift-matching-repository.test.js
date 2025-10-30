"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shift_matching_repository_1 = require("../shift-matching-repository");
const vitest_1 = require("vitest");
const mockPool = {
    query: vitest_1.vi.fn(),
};
const mockContext = {
    userId: 'user-123',
    organizationId: 'org-123',
    branchIds: ['branch-123'],
    roles: ['SCHEDULER'],
    permissions: ['shifts:write', 'shifts:read'],
};
(0, vitest_1.describe)('ShiftMatchingRepository', () => {
    let repository;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        repository = new shift_matching_repository_1.ShiftMatchingRepository(mockPool);
    });
    (0, vitest_1.describe)('Open Shifts', () => {
        const mockVisitRow = {
            id: 'visit-123',
            organization_id: 'org-123',
            branch_id: 'branch-123',
            client_id: 'client-123',
            scheduled_date: new Date('2024-01-15'),
            scheduled_start_time: '09:00',
            scheduled_end_time: '11:00',
            scheduled_duration: 120,
            timezone: 'America/New_York',
            service_type_id: 'service-123',
            service_type_name: 'Personal Care',
            task_ids: ['task-123'],
            required_skills: ['Personal Care'],
            required_certifications: ['CNA'],
            address: {
                line1: '123 Main St',
                city: 'Anytown',
                state: 'NY',
                postalCode: '12345',
                country: 'USA',
            },
            client_instructions: 'Be on time',
            preferred_caregivers: ['cg-123'],
            blocked_caregivers: ['cg-456'],
            gender_preference: 'FEMALE',
            language_preference: 'English',
        };
        const mockOpenShiftRow = {
            id: 'shift-123',
            organization_id: 'org-123',
            branch_id: 'branch-123',
            visit_id: 'visit-123',
            client_id: 'client-123',
            scheduled_date: new Date('2024-01-15'),
            start_time: '09:00',
            end_time: '11:00',
            duration: 120,
            timezone: 'America/New_York',
            service_type_id: 'service-123',
            service_type_name: 'Personal Care',
            task_ids: ['task-123'],
            required_skills: ['Personal Care'],
            required_certifications: ['CNA'],
            preferred_caregivers: ['cg-123'],
            blocked_caregivers: ['cg-456'],
            gender_preference: 'FEMALE',
            language_preference: 'English',
            address: {
                line1: '123 Main St',
                city: 'Anytown',
                state: 'NY',
                postalCode: '12345',
                country: 'USA',
            },
            latitude: 40.7128,
            longitude: -74.0060,
            priority: 'HIGH',
            is_urgent: false,
            fill_by_date: null,
            matching_status: 'NEW',
            last_matched_at: null,
            match_attempts: 0,
            proposed_assignments: null,
            rejected_caregivers: null,
            client_instructions: 'Be on time',
            internal_notes: null,
            tags: null,
            created_at: new Date(),
            created_by: 'user-123',
            updated_at: new Date(),
            updated_by: 'user-123',
            version: 1,
        };
        (0, vitest_1.describe)('createOpenShift', () => {
            (0, vitest_1.it)('should create an open shift from visit', async () => {
                const input = {
                    visitId: 'visit-123',
                    priority: 'HIGH',
                    fillByDate: new Date('2024-01-14'),
                    internalNotes: 'Urgent shift',
                };
                mockPool.query
                    .mockResolvedValueOnce({ rows: [mockVisitRow] })
                    .mockResolvedValueOnce({ rows: [] })
                    .mockResolvedValueOnce({ rows: [mockOpenShiftRow] });
                const result = await repository.createOpenShift(input, mockContext);
                (0, vitest_1.expect)(result).toEqual(vitest_1.expect.objectContaining({
                    id: 'shift-123',
                    visitId: 'visit-123',
                    priority: 'HIGH',
                    matchingStatus: 'NEW',
                }));
                (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledTimes(3);
            });
            (0, vitest_1.it)('should throw error if visit not found', async () => {
                const input = { visitId: 'invalid-visit' };
                mockPool.query.mockResolvedValueOnce({ rows: [] });
                await (0, vitest_1.expect)(repository.createOpenShift(input, mockContext))
                    .rejects.toThrow('Visit not found');
            });
            (0, vitest_1.it)('should throw error if open shift already exists', async () => {
                const input = { visitId: 'visit-123' };
                mockPool.query
                    .mockResolvedValueOnce({ rows: [mockVisitRow] })
                    .mockResolvedValueOnce({ rows: [{ id: 'existing-shift' }] });
                await (0, vitest_1.expect)(repository.createOpenShift(input, mockContext))
                    .rejects.toThrow('Open shift already exists for this visit');
            });
        });
        (0, vitest_1.describe)('getOpenShift', () => {
            (0, vitest_1.it)('should return open shift by ID', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [mockOpenShiftRow] });
                const result = await repository.getOpenShift('shift-123');
                (0, vitest_1.expect)(result).toEqual(vitest_1.expect.objectContaining({
                    id: 'shift-123',
                    visitId: 'visit-123',
                }));
            });
            (0, vitest_1.it)('should return null if not found', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [] });
                const result = await repository.getOpenShift('invalid-shift');
                (0, vitest_1.expect)(result).toBeNull();
            });
        });
        (0, vitest_1.describe)('updateOpenShiftStatus', () => {
            (0, vitest_1.it)('should update shift status', async () => {
                const updatedRow = { ...mockOpenShiftRow, matching_status: 'MATCHED' };
                mockPool.query.mockResolvedValueOnce({ rows: [updatedRow] });
                const result = await repository.updateOpenShiftStatus('shift-123', 'MATCHED', mockContext);
                (0, vitest_1.expect)(result.matchingStatus).toBe('MATCHED');
                (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('UPDATE open_shifts'), ['MATCHED', mockContext.userId, 'shift-123']);
            });
        });
        (0, vitest_1.describe)('searchOpenShifts', () => {
            (0, vitest_1.it)('should search with filters', async () => {
                const filters = {
                    organizationId: 'org-123',
                    priority: ['HIGH', 'CRITICAL'],
                    isUrgent: true,
                };
                const pagination = {
                    page: 1,
                    limit: 10,
                    sortBy: 'scheduled_date',
                    sortOrder: 'asc',
                };
                mockPool.query
                    .mockResolvedValueOnce({ rows: [{ count: '1' }] })
                    .mockResolvedValueOnce({ rows: [mockOpenShiftRow] });
                const result = await repository.searchOpenShifts(filters, pagination);
                (0, vitest_1.expect)(result.items).toHaveLength(1);
                (0, vitest_1.expect)(result.total).toBe(1);
                (0, vitest_1.expect)(result.page).toBe(1);
            });
        });
    });
    (0, vitest_1.describe)('Matching Configurations', () => {
        const mockConfigRow = {
            id: 'config-123',
            organization_id: 'org-123',
            branch_id: 'branch-123',
            name: 'Default Config',
            description: 'Default matching configuration',
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
            max_travel_distance: 30,
            max_travel_time: 45,
            require_exact_skill_match: true,
            require_active_certifications: true,
            respect_gender_preference: true,
            respect_language_preference: true,
            auto_assign_threshold: 90,
            min_score_for_proposal: 60,
            max_proposals_per_shift: 5,
            proposal_expiration_minutes: 120,
            optimize_for: 'BEST_MATCH',
            consider_cost_efficiency: false,
            balance_workload_across_caregivers: false,
            prioritize_continuity_of_care: true,
            prefer_same_caregiver_for_recurring: true,
            penalize_frequent_rejections: true,
            boost_reliable_performers: true,
            is_active: true,
            is_default: true,
            notes: null,
            created_at: new Date(),
            created_by: 'user-123',
            updated_at: new Date(),
            updated_by: 'user-123',
            version: 1,
        };
        (0, vitest_1.describe)('createMatchingConfiguration', () => {
            (0, vitest_1.it)('should create configuration', async () => {
                const input = {
                    organizationId: 'org-123',
                    name: 'Test Config',
                    weights: mockConfigRow.weights,
                    isActive: true,
                };
                mockPool.query.mockResolvedValueOnce({ rows: [mockConfigRow] });
                const result = await repository.createMatchingConfiguration(input, mockContext);
                (0, vitest_1.expect)(result.name).toBe('Default Config');
                (0, vitest_1.expect)(result.weights).toEqual(mockConfigRow.weights);
            });
        });
        (0, vitest_1.describe)('getDefaultConfiguration', () => {
            (0, vitest_1.it)('should get default configuration for organization', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [mockConfigRow] });
                const result = await repository.getDefaultConfiguration('org-123', 'branch-123');
                (0, vitest_1.expect)(result?.name).toBe('Default Config');
                (0, vitest_1.expect)(result?.isDefault).toBe(true);
            });
            (0, vitest_1.it)('should return null if no default config', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [] });
                const result = await repository.getDefaultConfiguration('org-123', 'branch-123');
                (0, vitest_1.expect)(result).toBeNull();
            });
        });
        (0, vitest_1.describe)('updateMatchingConfiguration', () => {
            (0, vitest_1.it)('should update configuration', async () => {
                const input = {
                    name: 'Updated Config',
                    autoAssignThreshold: 85,
                };
                const updatedRow = { ...mockConfigRow, name: 'Updated Config', auto_assign_threshold: 85 };
                mockPool.query.mockResolvedValueOnce({ rows: [updatedRow] });
                const result = await repository.updateMatchingConfiguration('config-123', input, mockContext);
                (0, vitest_1.expect)(result.name).toBe('Updated Config');
                (0, vitest_1.expect)(result.autoAssignThreshold).toBe(85);
            });
            (0, vitest_1.it)('should throw error if configuration not found', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [] });
                await (0, vitest_1.expect)(repository.updateMatchingConfiguration('invalid-config', {}, mockContext))
                    .rejects.toThrow('Matching configuration not found');
            });
        });
    });
    (0, vitest_1.describe)('Assignment Proposals', () => {
        const mockProposalRow = {
            id: 'proposal-123',
            organization_id: 'org-123',
            branch_id: 'branch-123',
            open_shift_id: 'shift-123',
            visit_id: 'visit-123',
            caregiver_id: 'cg-123',
            match_score: 85,
            match_quality: 'GOOD',
            match_reasons: [{ category: 'SKILL', description: 'Has required skills' }],
            proposal_status: 'PENDING',
            proposed_by: 'user-123',
            proposed_at: new Date(),
            proposal_method: 'AUTOMATIC',
            sent_to_caregiver: false,
            notification_method: null,
            viewed_by_caregiver: false,
            viewed_at: null,
            responded_at: null,
            response_method: null,
            accepted_at: null,
            accepted_by: null,
            rejected_at: null,
            rejected_by: null,
            rejection_reason: null,
            rejection_category: null,
            expired_at: null,
            is_preferred: false,
            urgency_flag: false,
            notes: null,
            internal_notes: null,
            created_at: new Date(),
            created_by: 'user-123',
            updated_at: new Date(),
            updated_by: 'user-123',
            version: 1,
            deleted_at: null,
            deleted_by: null,
        };
        (0, vitest_1.describe)('createProposal', () => {
            (0, vitest_1.it)('should create proposal', async () => {
                const input = {
                    openShiftId: 'shift-123',
                    caregiverId: 'cg-123',
                    proposalMethod: 'AUTOMATIC',
                    sendNotification: true,
                    notificationMethod: 'PUSH',
                };
                const mockShiftRow = { branch_id: 'branch-123', visit_id: 'visit-123' };
                mockPool.query
                    .mockResolvedValueOnce({ rows: [mockShiftRow] })
                    .mockResolvedValueOnce({ rows: [mockProposalRow] });
                const result = await repository.createProposal(input, 85, 'GOOD', [{ category: 'SKILL', description: 'Has required skills' }], mockContext);
                (0, vitest_1.expect)(result.id).toBe('proposal-123');
                (0, vitest_1.expect)(result.matchScore).toBe(85);
                (0, vitest_1.expect)(result.proposalStatus).toBe('PENDING');
            });
        });
        (0, vitest_1.describe)('respondToProposal', () => {
            (0, vitest_1.it)('should accept proposal', async () => {
                const input = {
                    proposalId: 'proposal-123',
                    accept: true,
                    responseMethod: 'WEB',
                    notes: 'Looking forward to it',
                };
                const acceptedRow = {
                    ...mockProposalRow,
                    proposal_status: 'ACCEPTED',
                    accepted_at: new Date(),
                    accepted_by: mockContext.userId,
                    responded_at: new Date(),
                    response_method: 'WEB',
                };
                mockPool.query.mockResolvedValueOnce({ rows: [acceptedRow] });
                const result = await repository.respondToProposal('proposal-123', input, mockContext);
                (0, vitest_1.expect)(result.proposalStatus).toBe('ACCEPTED');
                (0, vitest_1.expect)(result.acceptedAt).toBeDefined();
            });
            (0, vitest_1.it)('should reject proposal', async () => {
                const input = {
                    proposalId: 'proposal-123',
                    accept: false,
                    rejectionReason: 'Too far',
                    rejectionCategory: 'TOO_FAR',
                    responseMethod: 'WEB',
                };
                const rejectedRow = {
                    ...mockProposalRow,
                    proposal_status: 'REJECTED',
                    rejected_at: new Date(),
                    rejected_by: mockContext.userId,
                    rejection_reason: 'Too far',
                    rejection_category: 'TOO_FAR',
                    responded_at: new Date(),
                    response_method: 'WEB',
                };
                mockPool.query.mockResolvedValueOnce({ rows: [rejectedRow] });
                const result = await repository.respondToProposal('proposal-123', input, mockContext);
                (0, vitest_1.expect)(result.proposalStatus).toBe('REJECTED');
                (0, vitest_1.expect)(result.rejectionReason).toBe('Too far');
            });
        });
        (0, vitest_1.describe)('getProposalsByCaregiver', () => {
            (0, vitest_1.it)('should get proposals for caregiver', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [mockProposalRow] });
                const result = await repository.getProposalsByCaregiver('cg-123');
                (0, vitest_1.expect)(result).toHaveLength(1);
                (0, vitest_1.expect)(result[0].caregiverId).toBe('cg-123');
            });
            (0, vitest_1.it)('should filter by status', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [mockProposalRow] });
                await repository.getProposalsByCaregiver('cg-123', ['PENDING', 'SENT']);
                (0, vitest_1.expect)(mockPool.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('proposal_status = ANY($2)'), ['cg-123', ['PENDING', 'SENT']]);
            });
        });
        (0, vitest_1.describe)('searchProposals', () => {
            (0, vitest_1.it)('should search proposals with filters', async () => {
                const filters = {
                    organizationId: 'org-123',
                    proposalStatus: ['PENDING', 'SENT'],
                };
                const pagination = { page: 1, limit: 10 };
                mockPool.query
                    .mockResolvedValueOnce({ rows: [{ count: '1' }] })
                    .mockResolvedValueOnce({ rows: [mockProposalRow] });
                const result = await repository.searchProposals(filters, pagination);
                (0, vitest_1.expect)(result.items).toHaveLength(1);
                (0, vitest_1.expect)(result.total).toBe(1);
            });
        });
    });
    (0, vitest_1.describe)('Caregiver Preferences', () => {
        const mockPreferencesRow = {
            id: 'pref-123',
            caregiver_id: 'cg-123',
            organization_id: 'org-123',
            preferred_days_of_week: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
            preferred_time_ranges: [{ startTime: '09:00', endTime: '17:00' }],
            preferred_shift_types: null,
            preferred_client_ids: null,
            preferred_client_types: null,
            preferred_service_types: null,
            max_travel_distance: 25,
            preferred_zip_codes: null,
            avoid_zip_codes: null,
            max_shifts_per_day: null,
            max_shifts_per_week: 40,
            max_hours_per_week: 40,
            require_minimum_hours_between_shifts: null,
            willing_to_accept_urgent_shifts: true,
            willing_to_work_weekends: true,
            willing_to_work_holidays: false,
            accept_auto_assignment: false,
            notification_methods: ['PUSH', 'SMS'],
            quiet_hours_start: '22:00',
            quiet_hours_end: '07:00',
            last_updated: new Date(),
            updated_by: 'user-123',
            created_at: new Date(),
            created_by: 'user-123',
            version: 1,
        };
        (0, vitest_1.describe)('getCaregiverPreferences', () => {
            (0, vitest_1.it)('should get caregiver preferences', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [mockPreferencesRow] });
                const result = await repository.getCaregiverPreferences('cg-123');
                (0, vitest_1.expect)(result?.caregiverId).toBe('cg-123');
                (0, vitest_1.expect)(result?.maxTravelDistance).toBe(25);
            });
            (0, vitest_1.it)('should return null if no preferences', async () => {
                mockPool.query.mockResolvedValueOnce({ rows: [] });
                const result = await repository.getCaregiverPreferences('cg-123');
                (0, vitest_1.expect)(result).toBeNull();
            });
        });
        (0, vitest_1.describe)('upsertCaregiverPreferences', () => {
            (0, vitest_1.it)('should create new preferences', async () => {
                const input = {
                    maxTravelDistance: 30,
                    maxShiftsPerWeek: 35,
                    willingToAcceptUrgentShifts: false,
                };
                mockPool.query.mockResolvedValueOnce({ rows: [mockPreferencesRow] });
                const result = await repository.upsertCaregiverPreferences('cg-123', 'org-123', input, mockContext);
                (0, vitest_1.expect)(result.caregiverId).toBe('cg-123');
                (0, vitest_1.expect)(result.maxTravelDistance).toBe(25);
            });
        });
    });
    (0, vitest_1.describe)('Bulk Match Requests', () => {
        const mockBulkMatchRow = {
            id: 'bulk-123',
            organization_id: 'org-123',
            branch_id: 'branch-123',
            date_from: new Date('2024-01-15'),
            date_to: new Date('2024-01-21'),
            open_shift_ids: ['shift-123', 'shift-456'],
            configuration_id: 'config-123',
            optimization_goal: 'BEST_MATCH',
            requested_by: 'user-123',
            requested_at: new Date(),
            status: 'PENDING',
            started_at: null,
            completed_at: null,
            total_shifts: null,
            matched_shifts: null,
            unmatched_shifts: null,
            proposals_generated: null,
            error_message: null,
            notes: 'Weekly bulk match',
            created_at: new Date(),
            created_by: 'user-123',
            updated_at: new Date(),
            updated_by: 'user-123',
            version: 1,
        };
        (0, vitest_1.describe)('createBulkMatchRequest', () => {
            (0, vitest_1.it)('should create bulk match request', async () => {
                const input = {
                    organizationId: 'org-123',
                    branchId: 'branch-123',
                    dateFrom: new Date('2024-01-15'),
                    dateTo: new Date('2024-01-21'),
                    openShiftIds: ['shift-123', 'shift-456'],
                    optimizationGoal: 'BEST_MATCH',
                    notes: 'Weekly bulk match',
                };
                mockPool.query.mockResolvedValueOnce({ rows: [mockBulkMatchRow] });
                const result = await repository.createBulkMatchRequest(input, mockContext);
                (0, vitest_1.expect)(result.organizationId).toBe('org-123');
                (0, vitest_1.expect)(result.status).toBe('PENDING');
            });
        });
        (0, vitest_1.describe)('updateBulkMatchRequest', () => {
            (0, vitest_1.it)('should update bulk match request', async () => {
                const updates = {
                    status: 'COMPLETED',
                    totalShifts: 10,
                    matchedShifts: 8,
                    unmatchedShifts: 2,
                    proposalsGenerated: 15,
                    completedAt: new Date(),
                };
                const updatedRow = {
                    ...mockBulkMatchRow,
                    status: updates.status,
                    total_shifts: updates.totalShifts,
                    matched_shifts: updates.matchedShifts,
                    unmatched_shifts: updates.unmatchedShifts,
                    proposals_generated: updates.proposalsGenerated,
                    completed_at: updates.completedAt,
                };
                mockPool.query.mockResolvedValueOnce({ rows: [updatedRow] });
                const result = await repository.updateBulkMatchRequest('bulk-123', updates, mockContext);
                (0, vitest_1.expect)(result.status).toBe('COMPLETED');
                (0, vitest_1.expect)(result.matchedShifts).toBe(8);
            });
        });
    });
    (0, vitest_1.describe)('Match History', () => {
        const mockHistoryRow = {
            id: 'history-123',
            open_shift_id: 'shift-123',
            visit_id: 'visit-123',
            caregiver_id: 'cg-123',
            attempt_number: 1,
            matched_at: new Date(),
            matched_by: 'user-123',
            match_score: 85,
            match_quality: 'GOOD',
            outcome: 'ACCEPTED',
            outcome_determined_at: new Date(),
            assignment_proposal_id: 'proposal-123',
            assigned_successfully: true,
            rejection_reason: null,
            configuration_id: 'config-123',
            configuration_snapshot: null,
            response_time_minutes: 15,
            notes: 'Successfully matched',
            created_at: new Date(),
            created_by: 'user-123',
            updated_at: new Date(),
            updated_by: 'user-123',
            version: 1,
        };
        (0, vitest_1.describe)('createMatchHistory', () => {
            (0, vitest_1.it)('should create match history entry', async () => {
                const data = {
                    openShiftId: 'shift-123',
                    visitId: 'visit-123',
                    caregiverId: 'cg-123',
                    attemptNumber: 1,
                    matchScore: 85,
                    matchQuality: 'GOOD',
                    outcome: 'ACCEPTED',
                    assignmentProposalId: 'proposal-123',
                    assignedSuccessfully: true,
                    notes: 'Successfully matched',
                };
                mockPool.query.mockResolvedValueOnce({ rows: [mockHistoryRow] });
                const result = await repository.createMatchHistory(data, mockContext);
                (0, vitest_1.expect)(result.openShiftId).toBe('shift-123');
                (0, vitest_1.expect)(result.outcome).toBe('ACCEPTED');
                (0, vitest_1.expect)(result.assignedSuccessfully).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=shift-matching-repository.test.js.map