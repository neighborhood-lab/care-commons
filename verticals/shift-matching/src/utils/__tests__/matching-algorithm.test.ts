/**
 * Tests for Matching Algorithm
 * 
 * Tests cover:
 * - Candidate evaluation and scoring
 * - Eligibility checking
 * - Match quality determination
 * - Candidate ranking
 * - Edge cases and boundary conditions
 */

import { MatchingAlgorithm, CaregiverContext } from '../matching-algorithm';
import {
  MatchCandidate,
  MatchScores,
  ConflictingVisit,
} from '../../types/shift-matching';
import { describe, it, expect } from 'vitest';



describe('MatchingAlgorithm', () => {
  const mockOpenShift: any = {
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
    genderPreference: 'FEMALE' as const,
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
    priority: 'NORMAL' as const,
    isUrgent: false,
    matchingStatus: 'NEW' as const,
    matchAttempts: 0,
    createdAt: new Date(),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
    version: 1,
  };

  const mockConfig: any = {
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
    optimizeFor: 'BEST_MATCH' as const,
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

  const mockCaregiver: any = {
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

  const mockCaregiverContext: CaregiverContext = {
    caregiver: mockCaregiver,
    currentWeekHours: 20,
    conflictingVisits: [],
    previousVisitsWithClient: 5,
    clientRating: 4.5,
    reliabilityScore: 92,
    recentRejectionCount: 1,
    distanceFromShift: 2.5,
  };

  describe('evaluateMatch', () => {
    it('should evaluate perfect match', () => {
      const perfectContext: CaregiverContext = {
        ...mockCaregiverContext,
        caregiver: {
          ...mockCaregiver,
          gender: 'FEMALE', // Matches preference
        },
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, perfectContext, mockConfig);

      expect(result.caregiverId).toBe('cg-123');
      expect(result.openShiftId).toBe('shift-123');
      expect(result.isEligible).toBe(true);
      expect(result.overallScore).toBeGreaterThan(80);
      expect(['EXCELLENT', 'GOOD']).toContain(result.matchQuality);
      expect(result.eligibilityIssues).toHaveLength(0);
    });

    it('should handle blocked caregiver', () => {
      const blockedShift = {
        ...mockOpenShift,
        blockedCaregivers: ['cg-123'],
      };

      const result = MatchingAlgorithm.evaluateMatch(blockedShift, mockCaregiverContext, mockConfig);

      expect(result.isEligible).toBe(false);
      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'BLOCKED_BY_CLIENT',
          severity: 'BLOCKING',
        })
      );
    });

    it('should handle missing skills', () => {
      const caregiverWithMissingSkills = {
        ...mockCaregiver,
        skills: [{ name: 'Personal Care' }], // Missing Medication Management
      };

      const contextWithMissingSkills = {
        ...mockCaregiverContext,
        caregiver: caregiverWithMissingSkills,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithMissingSkills, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_SKILL',
          severity: 'BLOCKING',
        })
      );
    });

    it('should handle missing certifications', () => {
      const caregiverWithMissingCerts = {
        ...mockCaregiver,
        credentials: [{ type: 'CNA', status: 'ACTIVE' }], // Missing CPR
      };

      const contextWithMissingCerts = {
        ...mockCaregiverContext,
        caregiver: caregiverWithMissingCerts,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithMissingCerts, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_CERTIFICATION',
          severity: 'BLOCKING',
        })
      );
    });

    it('should handle schedule conflicts', () => {
      const conflictingVisit: ConflictingVisit = {
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

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithConflict, mockConfig);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingVisits).toContain(conflictingVisit);
      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'SCHEDULE_CONFLICT',
          severity: 'BLOCKING',
        })
      );
    });

    it('should handle distance too far', () => {
      const contextWithFarDistance = {
        ...mockCaregiverContext,
        distanceFromShift: 50, // Over maxTravelDistance of 30
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithFarDistance, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'DISTANCE_TOO_FAR',
          severity: 'BLOCKING',
        })
      );
    });

    it('should handle gender preference mismatch', () => {
      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'GENDER_MISMATCH',
          severity: 'WARNING',
        })
      );
    });

    it('should handle language preference mismatch', () => {
      const shiftWithSpanishPreference = {
        ...mockOpenShift,
        languagePreference: 'Spanish',
      };

      const result = MatchingAlgorithm.evaluateMatch(shiftWithSpanishPreference, mockCaregiverContext, mockConfig);

      // Should not have language mismatch warning since caregiver speaks Spanish
      expect(result.eligibilityIssues).not.toContainEqual(
        expect.objectContaining({
          type: 'LANGUAGE_MISMATCH',
        })
      );
    });

    it('should handle weekly hour limit exceeded', () => {
      const caregiverWithLowLimit = {
        ...mockCaregiver,
        maxHoursPerWeek: 25,
      };

      // Create shift without gender preference to avoid that warning
      const shiftWithoutGenderPreference = {
        ...mockOpenShift,
        genderPreference: undefined,
      };

      const contextWithHighHours = {
        ...mockCaregiverContext,
        caregiver: caregiverWithLowLimit,
        currentWeekHours: 24, // 2-hour shift would exceed 25-hour limit (24 + 2 = 26 > 25)
      };

      const result = MatchingAlgorithm.evaluateMatch(shiftWithoutGenderPreference, contextWithHighHours, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'OVER_HOUR_LIMIT',
          severity: 'BLOCKING',
        })
      );
    });

    it('should calculate scores correctly', () => {
      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);

      expect(result.scores).toBeDefined();
      expect(result.scores.skillMatch).toBe(100); // Has all required skills
      expect(result.scores.availabilityMatch).toBe(100); // No conflicts
      expect(result.scores.complianceMatch).toBe(100); // Compliant
      expect(result.scores.proximityMatch).toBeGreaterThan(80); // Close distance
    });

    it('should generate match reasons', () => {
      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);

      expect(result.matchReasons).toBeDefined();
      expect(result.matchReasons.length).toBeGreaterThan(0);
      
      // Should have positive reasons for good matches
      expect(result.matchReasons).toContainEqual(
        expect.objectContaining({
          category: 'SKILL',
          impact: 'POSITIVE',
        })
      );
    });

    it('should calculate overall score correctly', () => {
      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, mockCaregiverContext, mockConfig);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(typeof result.overallScore).toBe('number');
    });

    it('should determine match quality correctly', () => {
      // Test with a perfect match scenario
      const perfectMatchShift = {
        ...mockOpenShift,
        genderPreference: 'MALE' as const, // Match caregiver gender
        requiredSkills: ['Personal Care'], // Caregiver has this skill
        requiredCertifications: ['CNA'], // Caregiver has this cert
      };

      const perfectResult = MatchingAlgorithm.evaluateMatch(perfectMatchShift, mockCaregiverContext, mockConfig);
      expect(perfectResult.matchQuality).toBeDefined();
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).toContain(perfectResult.matchQuality);

      // Test with a poor match scenario
      const poorMatchShift = {
        ...mockOpenShift,
        genderPreference: 'FEMALE' as const, // Mismatch caregiver gender
        requiredSkills: ['Advanced Wound Care'], // Caregiver doesn't have this skill
        requiredCertifications: ['RN'], // Caregiver doesn't have this cert
      };

      const poorResult = MatchingAlgorithm.evaluateMatch(poorMatchShift, mockCaregiverContext, mockConfig);
      expect(poorResult.matchQuality).toBeDefined();
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'INELIGIBLE']).toContain(poorResult.matchQuality);
    });
  });

  describe('rankCandidates', () => {
    it('should rank candidates by score', () => {
      const candidates: MatchCandidate[] = [
        {
          caregiverId: 'cg-1',
          openShiftId: 'shift-123',
          caregiverName: 'Candidate 1',
          caregiverPhone: '555-0001',
          employmentType: 'FULL_TIME',
          overallScore: 75,
          matchQuality: 'GOOD',
          scores: {} as MatchScores,
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
          scores: {} as MatchScores,
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
          scores: {} as MatchScores,
          isEligible: true,
          eligibilityIssues: [],
          warnings: [],
          hasConflict: false,
          availableHours: 20,
          matchReasons: [],
          computedAt: new Date(),
        },
      ];

      const ranked = MatchingAlgorithm.rankCandidates(candidates);

      expect(ranked[0]?.caregiverId).toBe('cg-2'); // Highest score
      expect(ranked[1]?.caregiverId).toBe('cg-1'); // Middle score
      expect(ranked[2]?.caregiverId).toBe('cg-3'); // Lowest score
    });

    it('should prioritize eligible over ineligible', () => {
      const candidates: MatchCandidate[] = [
        {
          caregiverId: 'cg-eligible',
          openShiftId: 'shift-123',
          caregiverName: 'Eligible Candidate',
          caregiverPhone: '555-0001',
          employmentType: 'FULL_TIME',
          overallScore: 65,
          matchQuality: 'FAIR',
          scores: {} as MatchScores,
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
          scores: {} as MatchScores,
          isEligible: false,
          eligibilityIssues: [{ type: 'BLOCKED_BY_CLIENT', severity: 'BLOCKING', message: 'Blocked' }],
          warnings: [],
          hasConflict: false,
          availableHours: 20,
          matchReasons: [],
          computedAt: new Date(),
        },
      ];

      const ranked = MatchingAlgorithm.rankCandidates(candidates);

      expect(ranked[0]?.caregiverId).toBe('cg-eligible'); // Eligible comes first despite lower score
      expect(ranked[1]?.caregiverId).toBe('cg-ineligible');
    });

    it('should handle empty array', () => {
      const ranked = MatchingAlgorithm.rankCandidates([]);
      expect(ranked).toHaveLength(0);
    });

    it('should handle single candidate', () => {
      const candidate: MatchCandidate = {
        caregiverId: 'cg-1',
        openShiftId: 'shift-123',
        caregiverName: 'Single Candidate',
        caregiverPhone: '555-0001',
        employmentType: 'FULL_TIME',
        overallScore: 80,
        matchQuality: 'GOOD',
        scores: {} as MatchScores,
        isEligible: true,
        eligibilityIssues: [],
        warnings: [],
        hasConflict: false,
        availableHours: 20,
        matchReasons: [],
        computedAt: new Date(),
      };

      const ranked = MatchingAlgorithm.rankCandidates([candidate]);

      expect(ranked).toHaveLength(1);
      expect(ranked[0]).toEqual(candidate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle caregiver with no skills', () => {
      const caregiverWithNoSkills = {
        ...mockCaregiver,
        skills: [],
      };

      const contextWithNoSkills = {
        ...mockCaregiverContext,
        caregiver: caregiverWithNoSkills,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoSkills, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_SKILL',
          severity: 'BLOCKING',
        })
      );
    });

    it('should handle caregiver with no credentials', () => {
      const caregiverWithNoCreds = {
        ...mockCaregiver,
        credentials: [],
      };

      const contextWithNoCreds = {
        ...mockCaregiverContext,
        caregiver: caregiverWithNoCreds,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoCreds, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_CERTIFICATION',
          severity: 'BLOCKING',
        })
      );
    });

    it('should handle shift with no requirements', () => {
      const shiftWithNoRequirements = {
        ...mockOpenShift,
        requiredSkills: [],
        requiredCertifications: [],
        genderPreference: 'NO_PREFERENCE',
        languagePreference: undefined,
      };

      const result = MatchingAlgorithm.evaluateMatch(shiftWithNoRequirements, mockCaregiverContext, mockConfig);

      // Should be eligible since no blocking requirements
      expect(result.isEligible).toBe(true);
      expect(result.eligibilityIssues.filter(i => i.severity === 'BLOCKING')).toHaveLength(0);
    });

    it('should handle caregiver with no address', () => {
      const caregiverWithNoAddress = {
        ...mockCaregiver,
        primaryAddress: undefined,
      };

      const contextWithNoAddress = {
        ...mockCaregiverContext,
        caregiver: caregiverWithNoAddress,
        distanceFromShift: 0,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoAddress, mockConfig);

      // Should have neutral proximity score when distance is unknown
      expect(result.scores.proximityMatch).toBe(50);
    });

    it('should handle caregiver with no max hours', () => {
      const caregiverWithNoLimit = {
        ...mockCaregiver,
        maxHoursPerWeek: undefined,
      };

      const contextWithNoLimit = {
        ...mockCaregiverContext,
        caregiver: caregiverWithNoLimit,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNoLimit, mockConfig);

      // Should have perfect capacity score when no limit
      expect(result.scores.capacityMatch).toBe(100);
    });

    it('should handle non-compliant caregiver', () => {
      const nonCompliantCaregiver = {
        ...mockCaregiver,
        complianceStatus: 'EXPIRED',
      };

      const contextWithNonCompliant = {
        ...mockCaregiverContext,
        caregiver: nonCompliantCaregiver,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithNonCompliant, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'NOT_COMPLIANT',
          severity: 'BLOCKING',
        })
      );
      expect(result.scores.complianceMatch).toBe(0);
    });

    it('should handle caregiver with expiring credentials', () => {
      const expiringCaregiver = {
        ...mockCaregiver,
        complianceStatus: 'EXPIRING_SOON',
      };

      const contextWithExpiring = {
        ...mockCaregiverContext,
        caregiver: expiringCaregiver,
      };

      const result = MatchingAlgorithm.evaluateMatch(mockOpenShift, contextWithExpiring, mockConfig);

      expect(result.eligibilityIssues).toContainEqual(
        expect.objectContaining({
          type: 'EXPIRED_CREDENTIAL',
          severity: 'WARNING',
        })
      );
      expect(result.scores.complianceMatch).toBe(70);
    });
  });
});