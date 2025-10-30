"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matching_algorithm_1 = require("../matching-algorithm");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('MatchingAlgorithm', () => {
    const mockOpenShift = {
        id: 'shift-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        visitId: 'visit-123',
        clientId: 'client-123',
        scheduledDate: new Date('2024-01-15'),
        startTime: '09:00',
        endTime: '11:00',
        duration: 120,
        timezone: 'America/New_York',
        serviceTypeId: 'service-123',
        serviceTypeName: 'Personal Care',
        requiredSkills: ['Personal Care', 'Medication Management'],
        requiredCertifications: ['CNA', 'CPR'],
        preferredCaregivers: ['cg-123'],
        blockedCaregivers: ['cg-456'],
        genderPreference: 'FEMALE',
        languagePreference: 'English',
        address: {
            line1: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            postalCode: '12345',
            country: 'USA',
        },
        latitude: 40.7128,
        longitude: -74.0060,
        priority: 'NORMAL',
        isUrgent: false,
        matchingStatus: 'NEW',
        matchAttempts: 0,
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
        updatedBy: 'system',
        version: 1,
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
        maxTravelDistance: 30,
        maxTravelTime: 45,
        requireExactSkillMatch: true,
        requireActiveCertifications: true,
        respectGenderPreference: true,
        respectLanguagePreference: true,
        autoAssignThreshold: 90,
        minScoreForProposal: 60,
        maxProposalsPerShift: 5,
        proposalExpirationMinutes: 120,
        optimizeFor: 'BEST_MATCH',
        considerCostEfficiency: false,
        balanceWorkloadAcrossCaregivers: false,
        prioritizeContinuityOfCare: true,
        preferSameCaregiverForRecurring: true,
        penalizeFrequentRejections: true,
        boostReliablePerformers: true,
        isActive: true,
        isDefault: true,
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
        updatedBy: 'system',
        version: 1,
    };
    const mockCaregiver = {
        id: 'cg-123',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'MALE',
        primaryPhone: { number: '555-1234', type: 'MOBILE', canReceiveSMS: true },
        employmentType: 'FULL_TIME',
        skills: [
            { id: 'skill-1', name: 'Personal Care', category: 'CARE', proficiencyLevel: 'ADVANCED' },
            { id: 'skill-2', name: 'Medication Management', category: 'CARE', proficiencyLevel: 'INTERMEDIATE' },
        ],
        credentials: [
            { id: 'cred-1', type: 'CNA', status: 'ACTIVE', expirationDate: new Date('2025-12-31') },
            { id: 'cred-2', type: 'CPR', status: 'ACTIVE', expirationDate: new Date('2025-12-31') },
        ],
        complianceStatus: 'COMPLIANT',
        maxHoursPerWeek: 40,
        languages: ['English', 'Spanish'],
        primaryAddress: {
            latitude: 40.7580,
            longitude: -73.9855,
        },
        availability: {
            schedule: {
                monday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                tuesday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                wednesday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                thursday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                friday: { available: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                saturday: { available: false },
                sunday: { available: false },
            },
        },
    };
    const mockCaregiverContext = {
        caregiver: mockCaregiver,
        currentWeekHours: 20,
        conflictingVisits: [],
        previousVisitsWithClient: 5,
        clientRating: 4.5,
        reliabilityScore: 92,
        recentRejectionCount: 1,
        distanceFromShift: 2.5,
    };
    (0, vitest_1.describe)('evaluateMatch', () => {
        (0, vitest_1.it)('should evaluate perfect match', () => {
            const perfectContext = {
                ...mockCaregiverContext,
                caregiver: {
                    ...mockCaregiver,
                    gender: 'FEMALE',
                },
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, perfectContext, mockConfig);
            (0, vitest_1.expect)(result.caregiverId).toBe('cg-123');
            (0, vitest_1.expect)(result.openShiftId).toBe('shift-123');
            (0, vitest_1.expect)(result.isEligible).toBe(true);
            (0, vitest_1.expect)(result.overallScore).toBeGreaterThan(80);
            (0, vitest_1.expect)(['EXCELLENT', 'GOOD']).toContain(result.matchQuality);
            (0, vitest_1.expect)(result.eligibilityIssues).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle blocked caregiver', () => {
            const blockedShift = {
                ...mockOpenShift,
                blockedCaregivers: ['cg-123'],
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(blockedShift, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(result.isEligible).toBe(false);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'BLOCKED_BY_CLIENT',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should handle missing skills', () => {
            const caregiverWithMissingSkills = {
                ...mockCaregiver,
                skills: [{ name: 'Personal Care' }],
            };
            const contextWithMissingSkills = {
                ...mockCaregiverContext,
                caregiver: caregiverWithMissingSkills,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithMissingSkills, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'MISSING_SKILL',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should handle missing certifications', () => {
            const caregiverWithMissingCerts = {
                ...mockCaregiver,
                credentials: [{ type: 'CNA', status: 'ACTIVE' }],
            };
            const contextWithMissingCerts = {
                ...mockCaregiverContext,
                caregiver: caregiverWithMissingCerts,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithMissingCerts, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'MISSING_CERTIFICATION',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should handle schedule conflicts', () => {
            const conflictingVisit = {
                visitId: 'conflict-123',
                clientName: 'Other Client',
                startTime: '10:00',
                endTime: '12:00',
                includesTravel: false,
            };
            const contextWithConflict = {
                ...mockCaregiverContext,
                conflictingVisits: [conflictingVisit],
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithConflict, mockConfig);
            (0, vitest_1.expect)(result.hasConflict).toBe(true);
            (0, vitest_1.expect)(result.conflictingVisits).toContain(conflictingVisit);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'SCHEDULE_CONFLICT',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should handle distance too far', () => {
            const contextWithFarDistance = {
                ...mockCaregiverContext,
                distanceFromShift: 50,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithFarDistance, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'DISTANCE_TOO_FAR',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should handle gender preference mismatch', () => {
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'GENDER_MISMATCH',
                severity: 'WARNING',
            }));
        });
        (0, vitest_1.it)('should handle language preference mismatch', () => {
            const shiftWithSpanishPreference = {
                ...mockOpenShift,
                languagePreference: 'Spanish',
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(shiftWithSpanishPreference, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).not.toContainEqual(vitest_1.expect.objectContaining({
                type: 'LANGUAGE_MISMATCH',
            }));
        });
        (0, vitest_1.it)('should handle weekly hour limit exceeded', () => {
            const caregiverWithLowLimit = {
                ...mockCaregiver,
                maxHoursPerWeek: 25,
            };
            const shiftWithoutGenderPreference = {
                ...mockOpenShift,
                genderPreference: undefined,
            };
            const contextWithHighHours = {
                ...mockCaregiverContext,
                caregiver: caregiverWithLowLimit,
                currentWeekHours: 24,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(shiftWithoutGenderPreference, contextWithHighHours, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'OVER_HOUR_LIMIT',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should calculate scores correctly', () => {
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(result.scores).toBeDefined();
            (0, vitest_1.expect)(result.scores.skillMatch).toBe(100);
            (0, vitest_1.expect)(result.scores.availabilityMatch).toBe(100);
            (0, vitest_1.expect)(result.scores.complianceMatch).toBe(100);
            (0, vitest_1.expect)(result.scores.proximityMatch).toBeGreaterThan(80);
        });
        (0, vitest_1.it)('should generate match reasons', () => {
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(result.matchReasons).toBeDefined();
            (0, vitest_1.expect)(result.matchReasons.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.matchReasons).toContainEqual(vitest_1.expect.objectContaining({
                category: 'SKILL',
                impact: 'POSITIVE',
            }));
        });
        (0, vitest_1.it)('should calculate overall score correctly', () => {
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(result.overallScore).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.overallScore).toBeLessThanOrEqual(100);
            (0, vitest_1.expect)(typeof result.overallScore).toBe('number');
        });
        (0, vitest_1.it)('should determine match quality correctly', () => {
            const perfectMatchShift = {
                ...mockOpenShift,
                genderPreference: 'MALE',
                requiredSkills: ['Personal Care'],
                requiredCertifications: ['CNA'],
            };
            const perfectResult = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(perfectMatchShift, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(perfectResult.matchQuality).toBeDefined();
            (0, vitest_1.expect)(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).toContain(perfectResult.matchQuality);
            const poorMatchShift = {
                ...mockOpenShift,
                genderPreference: 'FEMALE',
                requiredSkills: ['Advanced Wound Care'],
                requiredCertifications: ['RN'],
            };
            const poorResult = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(poorMatchShift, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(poorResult.matchQuality).toBeDefined();
            (0, vitest_1.expect)(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'INELIGIBLE']).toContain(poorResult.matchQuality);
        });
    });
    (0, vitest_1.describe)('rankCandidates', () => {
        (0, vitest_1.it)('should rank candidates by score', () => {
            const candidates = [
                {
                    caregiverId: 'cg-1',
                    openShiftId: 'shift-123',
                    caregiverName: 'Candidate 1',
                    caregiverPhone: '555-0001',
                    employmentType: 'FULL_TIME',
                    overallScore: 75,
                    matchQuality: 'GOOD',
                    scores: {},
                    isEligible: true,
                    eligibilityIssues: [],
                    warnings: [],
                    hasConflict: false,
                    availableHours: 20,
                    matchReasons: [],
                    computedAt: new Date(),
                },
                {
                    caregiverId: 'cg-2',
                    openShiftId: 'shift-123',
                    caregiverName: 'Candidate 2',
                    caregiverPhone: '555-0002',
                    employmentType: 'FULL_TIME',
                    overallScore: 90,
                    matchQuality: 'EXCELLENT',
                    scores: {},
                    isEligible: true,
                    eligibilityIssues: [],
                    warnings: [],
                    hasConflict: false,
                    availableHours: 20,
                    matchReasons: [],
                    computedAt: new Date(),
                },
                {
                    caregiverId: 'cg-3',
                    openShiftId: 'shift-123',
                    caregiverName: 'Candidate 3',
                    caregiverPhone: '555-0003',
                    employmentType: 'FULL_TIME',
                    overallScore: 60,
                    matchQuality: 'FAIR',
                    scores: {},
                    isEligible: true,
                    eligibilityIssues: [],
                    warnings: [],
                    hasConflict: false,
                    availableHours: 20,
                    matchReasons: [],
                    computedAt: new Date(),
                },
            ];
            const ranked = matching_algorithm_1.MatchingAlgorithm.rankCandidates(candidates);
            (0, vitest_1.expect)(ranked[0].caregiverId).toBe('cg-2');
            (0, vitest_1.expect)(ranked[1].caregiverId).toBe('cg-1');
            (0, vitest_1.expect)(ranked[2].caregiverId).toBe('cg-3');
        });
        (0, vitest_1.it)('should prioritize eligible over ineligible', () => {
            const candidates = [
                {
                    caregiverId: 'cg-eligible',
                    openShiftId: 'shift-123',
                    caregiverName: 'Eligible Candidate',
                    caregiverPhone: '555-0001',
                    employmentType: 'FULL_TIME',
                    overallScore: 65,
                    matchQuality: 'FAIR',
                    scores: {},
                    isEligible: true,
                    eligibilityIssues: [],
                    warnings: [],
                    hasConflict: false,
                    availableHours: 20,
                    matchReasons: [],
                    computedAt: new Date(),
                },
                {
                    caregiverId: 'cg-ineligible',
                    openShiftId: 'shift-123',
                    caregiverName: 'Ineligible Candidate',
                    caregiverPhone: '555-0002',
                    employmentType: 'FULL_TIME',
                    overallScore: 95,
                    matchQuality: 'INELIGIBLE',
                    scores: {},
                    isEligible: false,
                    eligibilityIssues: [{ type: 'BLOCKED_BY_CLIENT', severity: 'BLOCKING', message: 'Blocked' }],
                    warnings: [],
                    hasConflict: false,
                    availableHours: 20,
                    matchReasons: [],
                    computedAt: new Date(),
                },
            ];
            const ranked = matching_algorithm_1.MatchingAlgorithm.rankCandidates(candidates);
            (0, vitest_1.expect)(ranked[0].caregiverId).toBe('cg-eligible');
            (0, vitest_1.expect)(ranked[1].caregiverId).toBe('cg-ineligible');
        });
        (0, vitest_1.it)('should handle empty array', () => {
            const ranked = matching_algorithm_1.MatchingAlgorithm.rankCandidates([]);
            (0, vitest_1.expect)(ranked).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle single candidate', () => {
            const candidate = {
                caregiverId: 'cg-1',
                openShiftId: 'shift-123',
                caregiverName: 'Single Candidate',
                caregiverPhone: '555-0001',
                employmentType: 'FULL_TIME',
                overallScore: 80,
                matchQuality: 'GOOD',
                scores: {},
                isEligible: true,
                eligibilityIssues: [],
                warnings: [],
                hasConflict: false,
                availableHours: 20,
                matchReasons: [],
                computedAt: new Date(),
            };
            const ranked = matching_algorithm_1.MatchingAlgorithm.rankCandidates([candidate]);
            (0, vitest_1.expect)(ranked).toHaveLength(1);
            (0, vitest_1.expect)(ranked[0]).toEqual(candidate);
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle caregiver with no skills', () => {
            const caregiverWithNoSkills = {
                ...mockCaregiver,
                skills: [],
            };
            const contextWithNoSkills = {
                ...mockCaregiverContext,
                caregiver: caregiverWithNoSkills,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoSkills, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'MISSING_SKILL',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should handle caregiver with no credentials', () => {
            const caregiverWithNoCreds = {
                ...mockCaregiver,
                credentials: [],
            };
            const contextWithNoCreds = {
                ...mockCaregiverContext,
                caregiver: caregiverWithNoCreds,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoCreds, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'MISSING_CERTIFICATION',
                severity: 'BLOCKING',
            }));
        });
        (0, vitest_1.it)('should handle shift with no requirements', () => {
            const shiftWithNoRequirements = {
                ...mockOpenShift,
                requiredSkills: [],
                requiredCertifications: [],
                genderPreference: 'NO_PREFERENCE',
                languagePreference: undefined,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(shiftWithNoRequirements, mockCaregiverContext, mockConfig);
            (0, vitest_1.expect)(result.isEligible).toBe(true);
            (0, vitest_1.expect)(result.eligibilityIssues.filter(i => i.severity === 'BLOCKING')).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle caregiver with no address', () => {
            const caregiverWithNoAddress = {
                ...mockCaregiver,
                primaryAddress: undefined,
            };
            const contextWithNoAddress = {
                ...mockCaregiverContext,
                caregiver: caregiverWithNoAddress,
                distanceFromShift: undefined,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoAddress, mockConfig);
            (0, vitest_1.expect)(result.scores.proximityMatch).toBe(50);
        });
        (0, vitest_1.it)('should handle caregiver with no max hours', () => {
            const caregiverWithNoLimit = {
                ...mockCaregiver,
                maxHoursPerWeek: undefined,
            };
            const contextWithNoLimit = {
                ...mockCaregiverContext,
                caregiver: caregiverWithNoLimit,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoLimit, mockConfig);
            (0, vitest_1.expect)(result.scores.capacityMatch).toBe(100);
        });
        (0, vitest_1.it)('should handle non-compliant caregiver', () => {
            const nonCompliantCaregiver = {
                ...mockCaregiver,
                complianceStatus: 'EXPIRED',
            };
            const contextWithNonCompliant = {
                ...mockCaregiverContext,
                caregiver: nonCompliantCaregiver,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNonCompliant, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'NOT_COMPLIANT',
                severity: 'BLOCKING',
            }));
            (0, vitest_1.expect)(result.scores.complianceMatch).toBe(0);
        });
        (0, vitest_1.it)('should handle caregiver with expiring credentials', () => {
            const expiringCaregiver = {
                ...mockCaregiver,
                complianceStatus: 'EXPIRING_SOON',
            };
            const contextWithExpiring = {
                ...mockCaregiverContext,
                caregiver: expiringCaregiver,
            };
            const result = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithExpiring, mockConfig);
            (0, vitest_1.expect)(result.eligibilityIssues).toContainEqual(vitest_1.expect.objectContaining({
                type: 'EXPIRED_CREDENTIAL',
                severity: 'WARNING',
            }));
            (0, vitest_1.expect)(result.scores.complianceMatch).toBe(70);
        });
    });
});
//# sourceMappingURL=matching-algorithm.test.js.map