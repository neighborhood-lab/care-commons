/**
 * Tests for Enhanced Match Explanations
 *
 * Validates that enhanced explanations provide detailed, accurate information
 * about why caregivers are matched to specific shifts.
 */

import { describe, it, expect } from 'vitest';
import { EnhancedMatchExplanations } from '../enhanced-match-explanations';
import type { OpenShift, MatchScores } from '../../types/shift-matching';
import type { CaregiverContext } from '../matching-algorithm';
import type { Caregiver } from '@care-commons/caregiver-staff';

describe('EnhancedMatchExplanations', () => {
  const mockCaregiver: Caregiver = {
    id: 'caregiver-1',
    organizationId: 'org-1',
    branchIds: ['branch-1'],
    primaryBranchId: 'branch-1',
    employeeNumber: 'EMP-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    gender: 'FEMALE',
    dateOfBirth: new Date('1985-05-15'),
    primaryPhone: {
      number: '555-0123',
      type: 'MOBILE',
      canReceiveSMS: true,
      isPrimary: true,
    },
    email: 'sarah.johnson@example.com',
    preferredContactMethod: 'SMS',
    primaryAddress: {
      type: 'HOME',
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
    },
    emergencyContacts: [],
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    hireDate: new Date('2020-01-15'),
    role: 'HOME_HEALTH_AIDE',
    permissions: [],
    maxHoursPerWeek: 40,
    credentials: [
      {
        id: 'cred-1',
        type: 'HHA',
        name: 'Home Health Aide',
        status: 'ACTIVE',
        number: 'HHA-123456',
        issuingAuthority: 'State Board',
        issueDate: new Date('2020-01-01'),
        expirationDate: new Date('2026-01-01'),
        verifiedDate: new Date('2020-01-01'),
      },
      {
        id: 'cred-2',
        type: 'CPR',
        name: 'CPR Certification',
        status: 'ACTIVE',
        number: 'CPR-789',
        issuingAuthority: 'Red Cross',
        issueDate: new Date('2024-01-01'),
        expirationDate: new Date('2026-01-01'),
        verifiedDate: new Date('2024-01-01'),
      },
    ],
    training: [],
    skills: [
      {
        id: 'skill-1',
        name: 'Dementia Care',
        category: 'Clinical',
        proficiencyLevel: 'EXPERT',
        certifiedDate: new Date('2020-01-01'),
      },
      {
        id: 'skill-2',
        name: 'Medication Management',
        category: 'Clinical',
        proficiencyLevel: 'INTERMEDIATE',
        certifiedDate: new Date('2021-01-01'),
      },
    ],
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
      lastUpdated: new Date('2024-01-01'),
    },
    workPreferences: {
      preferredDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
    },
    payRate: {
      id: 'pay-1',
      rateType: 'BASE',
      amount: 18.50,
      unit: 'HOURLY',
      effectiveDate: new Date('2020-01-01'),
    },
    languages: ['English', 'Spanish'],
    complianceStatus: 'COMPLIANT',
    status: 'ACTIVE',
    createdAt: new Date('2020-01-01'),
    createdBy: 'admin-1',
    updatedAt: new Date('2024-01-01'),
    updatedBy: 'admin-1',
    version: 1,
  };

  const mockOpenShift: OpenShift = {
    id: 'shift-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    visitId: 'visit-1',
    clientId: 'client-1',
    scheduledDate: new Date('2025-11-19'),
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    timezone: 'America/Chicago',
    serviceTypeId: 'service-1',
    serviceTypeName: 'Personal Care',
    requiredSkills: ['Dementia Care', 'Medication Management'],
    requiredCertifications: ['HHA', 'CPR'],
    languagePreference: 'Spanish',
    genderPreference: 'FEMALE',
    address: {
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
    },
    latitude: 30.2672,
    longitude: -97.7431,
    priority: 'NORMAL',
    isUrgent: false,
    matchingStatus: 'NEW',
    matchAttempts: 0,
    createdAt: new Date('2025-11-14'),
    createdBy: 'admin-1',
    updatedAt: new Date('2025-11-14'),
    updatedBy: 'admin-1',
    version: 1,
  };

  const mockContext: CaregiverContext = {
    caregiver: mockCaregiver,
    currentWeekHours: 20,
    conflictingVisits: [],
    previousVisitsWithClient: 5,
    clientRating: 4.8,
    reliabilityScore: 98,
    recentRejectionCount: 0,
    distanceFromShift: 12.3,
  };

  const mockScores: MatchScores = {
    skillMatch: 100,
    availabilityMatch: 100,
    proximityMatch: 85,
    preferenceMatch: 90,
    experienceMatch: 85,
    reliabilityMatch: 98,
    complianceMatch: 100,
    capacityMatch: 90,
  };

  describe('generateEnhancedExplanations', () => {
    it('should generate comprehensive explanations for all categories', () => {
      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        mockContext,
        mockScores
      );

      // Should have explanations for each category
      expect(explanations.length).toBeGreaterThan(0);

      const categories = explanations.map(e => e.category);
      expect(categories).toContain('skills');
      expect(categories).toContain('proximity');
      expect(categories).toContain('availability');
      expect(categories).toContain('preferences');
      expect(categories).toContain('experience');
      expect(categories).toContain('reliability');
    });

    it('should include detailed skills match explanation', () => {
      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        mockContext,
        mockScores
      );

      const skillsExplanation = explanations.find(e => e.category === 'skills');
      expect(skillsExplanation).toBeDefined();
      expect(skillsExplanation!.score).toBe(100);
      expect(skillsExplanation!.overallImpact).toBe('POSITIVE');
      expect(skillsExplanation!.details.length).toBeGreaterThan(0);

      // Should have details for required skills
      const dementiaDetail = skillsExplanation!.details.find(d =>
        d.requirement.includes('Dementia Care')
      );
      expect(dementiaDetail).toBeDefined();
      expect(dementiaDetail!.match).toBe('PERFECT');
      expect(dementiaDetail!.caregiverAttribute).toContain('Sarah');
    });

    it('should include proximity explanation with distance', () => {
      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        mockContext,
        mockScores
      );

      const proximityExplanation = explanations.find(e => e.category === 'proximity');
      expect(proximityExplanation).toBeDefined();
      expect(proximityExplanation!.details.length).toBeGreaterThan(0);

      const distanceDetail = proximityExplanation!.details[0];
      expect(distanceDetail).toBeDefined();
      expect(distanceDetail!.caregiverAttribute).toContain('12.3 miles');
      expect(distanceDetail!.explanation).toContain('minute drive');
    });

    it('should include availability explanation with schedule info', () => {
      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        mockContext,
        mockScores
      );

      const availabilityExplanation = explanations.find(e => e.category === 'availability');
      expect(availabilityExplanation).toBeDefined();
      expect(availabilityExplanation!.score).toBe(100);
      expect(availabilityExplanation!.overallImpact).toBe('POSITIVE');

      const availabilityDetail = availabilityExplanation!.details[0];
      expect(availabilityDetail).toBeDefined();
      expect(availabilityDetail!.match).toBe('PERFECT');
      expect(availabilityDetail!.explanation).toContain('clear');
    });

    it('should include preference explanation with language match', () => {
      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        mockContext,
        mockScores
      );

      const preferenceExplanation = explanations.find(e => e.category === 'preferences');
      expect(preferenceExplanation).toBeDefined();

      const languageDetail = preferenceExplanation!.details.find(d =>
        d.requirement.includes('Spanish')
      );
      expect(languageDetail).toBeDefined();
      expect(languageDetail!.match).toBe('PERFECT');
      expect(languageDetail!.caregiverAttribute).toContain('Spanish');
    });

    it('should include experience explanation with visit history', () => {
      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        mockContext,
        mockScores
      );

      const experienceExplanation = explanations.find(e => e.category === 'experience');
      expect(experienceExplanation).toBeDefined();

      const visitHistoryDetail = experienceExplanation!.details.find(d =>
        d.caregiverAttribute.includes('5 previous visit')
      );
      expect(visitHistoryDetail).toBeDefined();
      expect(visitHistoryDetail!.match).toBe('PERFECT');
    });

    it('should include reliability explanation with on-time rate', () => {
      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        mockContext,
        mockScores
      );

      const reliabilityExplanation = explanations.find(e => e.category === 'reliability');
      expect(reliabilityExplanation).toBeDefined();

      const onTimeDetail = reliabilityExplanation!.details.find(d =>
        d.caregiverAttribute.includes('98%')
      );
      expect(onTimeDetail).toBeDefined();
      expect(onTimeDetail!.match).toBe('PERFECT');
    });
  });

  describe('generateSummary', () => {
    it('should generate a concise summary of top match reasons', () => {
      const mockCandidate = {
        caregiverId: 'caregiver-1',
        openShiftId: 'shift-1',
        caregiverName: 'Sarah Johnson',
        caregiverPhone: '555-0123',
        employmentType: 'W2_FULL_TIME',
        overallScore: 92,
        matchQuality: 'EXCELLENT' as const,
        scores: mockScores,
        isEligible: true,
        eligibilityIssues: [],
        warnings: [],
        distanceFromShift: 12.3,
        hasConflict: false,
        availableHours: 20,
        previousVisitsWithClient: 5,
        clientRating: 4.8,
        reliabilityScore: 98,
        matchReasons: [
          {
            category: 'SKILL' as const,
            description: 'Has all required skills and certifications',
            impact: 'POSITIVE' as const,
            weight: 0.2,
          },
          {
            category: 'EXPERIENCE' as const,
            description: 'Has 5 previous visits with this client',
            impact: 'POSITIVE' as const,
            weight: 0.1,
          },
        ],
        computedAt: new Date(),
      };

      const summary = EnhancedMatchExplanations.generateSummary(
        mockOpenShift,
        mockCandidate,
        mockContext
      );

      expect(summary.length).toBeGreaterThan(0);
      expect(summary.some(s => s.includes('12.3 miles'))).toBe(true);
      expect(summary.some(s => s.includes('5 time'))).toBe(true);
      expect(summary.some(s => s.includes('98%'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle missing skills gracefully', () => {
      const caregiverWithoutSkills: Caregiver = {
        ...mockCaregiver,
        skills: [],
        credentials: [],
      };

      const contextWithoutSkills: CaregiverContext = {
        ...mockContext,
        caregiver: caregiverWithoutSkills,
      };

      const scoresWithLowSkillMatch: MatchScores = {
        ...mockScores,
        skillMatch: 0,
      };

      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        contextWithoutSkills,
        scoresWithLowSkillMatch
      );

      const skillsExplanation = explanations.find(e => e.category === 'skills');
      expect(skillsExplanation).toBeDefined();
      expect(skillsExplanation!.overallImpact).toBe('NEGATIVE');

      const missingSkillDetails = skillsExplanation!.details.filter(d => d.match === 'MISSING');
      expect(missingSkillDetails.length).toBeGreaterThan(0);
    });

    it('should handle schedule conflicts', () => {
      const contextWithConflicts: CaregiverContext = {
        ...mockContext,
        conflictingVisits: [
          {
            visitId: 'visit-2',
            clientName: 'John Doe',
            startTime: '10:30',
            endTime: '11:30',
            includesTravel: true,
          },
        ],
      };

      const scoresWithNoAvailability: MatchScores = {
        ...mockScores,
        availabilityMatch: 0,
      };

      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        contextWithConflicts,
        scoresWithNoAvailability
      );

      const availabilityExplanation = explanations.find(e => e.category === 'availability');
      expect(availabilityExplanation).toBeDefined();
      expect(availabilityExplanation!.overallImpact).toBe('NEGATIVE');

      const conflictDetail = availabilityExplanation!.details.find(d =>
        d.caregiverAttribute.includes('conflict')
      );
      expect(conflictDetail).toBeDefined();
      expect(conflictDetail!.match).toBe('MISSING');
    });

    it('should handle first-time client assignment', () => {
      const contextWithNoHistory: CaregiverContext = {
        ...mockContext,
        previousVisitsWithClient: 0,
        clientRating: undefined,
      };

      const explanations = EnhancedMatchExplanations.generateEnhancedExplanations(
        mockOpenShift,
        contextWithNoHistory,
        mockScores
      );

      const experienceExplanation = explanations.find(e => e.category === 'experience');
      expect(experienceExplanation).toBeDefined();

      const newClientDetail = experienceExplanation!.details.find(d =>
        d.requirement.includes('New client')
      );
      expect(newClientDetail).toBeDefined();
      expect(newClientDetail!.match).toBe('NEUTRAL');
    });
  });
});
