/**
 * Matching Algorithm - Core scoring and candidate ranking logic
 *
 * Evaluates caregivers against open shifts across multiple dimensions:
 * - Skill and certification match
 * - Availability and schedule conflicts
 * - Proximity and travel feasibility
 * - Preferences and history
 * - Reliability and compliance
 */

import {
  OpenShift,
  MatchCandidate,
  MatchingConfiguration,
  MatchScores,
  MatchQuality,
  EligibilityIssue,
  MatchReason,
  ConflictingVisit,
} from '../types/shift-matching';
import { Caregiver } from '@care-commons/caregiver-staff';

export interface CaregiverContext {
  caregiver: Caregiver;
  currentWeekHours: number;
  conflictingVisits: ConflictingVisit[];
  previousVisitsWithClient: number;
  clientRating?: number;
  reliabilityScore: number;
  recentRejectionCount: number;
  distanceFromShift?: number;
}

export class MatchingAlgorithm {
  /**
   * Evaluate a caregiver's fit for a specific shift
   */
  static evaluateMatch(
    shift: OpenShift,
    caregiverContext: CaregiverContext,
    config: MatchingConfiguration
  ): MatchCandidate {
    const { caregiver } = caregiverContext;

    // Calculate dimensional scores
    const scores = this.calculateScores(shift, caregiverContext, config);

    // Check eligibility
    const eligibilityIssues = this.checkEligibility(shift, caregiverContext, config);
    const isEligible = !eligibilityIssues.some((issue) => issue.severity === 'BLOCKING');

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(scores, config);

    // Determine match quality
    const matchQuality = this.determineMatchQuality(overallScore, isEligible);

    // Generate match reasons
    const matchReasons = this.generateMatchReasons(shift, caregiverContext, scores);

    // Extract warnings from eligibility issues
    const warnings = eligibilityIssues
      .filter((issue) => issue.severity === 'WARNING')
      .map((issue) => issue.message);

    const base: MatchCandidate = {
      caregiverId: caregiver.id,
      openShiftId: shift.id,
      caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
      caregiverPhone: caregiver.primaryPhone.number,
      employmentType: caregiver.employmentType,
      overallScore,
      matchQuality,
      scores,
      isEligible,
      eligibilityIssues,
      warnings,
      distanceFromShift: caregiverContext.distanceFromShift ?? 0,
      ...(caregiverContext.distanceFromShift !== undefined && {
        estimatedTravelTime: Math.ceil(caregiverContext.distanceFromShift * 2),
      }),
      hasConflict: caregiverContext.conflictingVisits.length > 0,
      ...(caregiverContext.conflictingVisits.length > 0 && {
        conflictingVisits: caregiverContext.conflictingVisits,
      }),
      availableHours: caregiver.maxHoursPerWeek
        ? caregiver.maxHoursPerWeek - caregiverContext.currentWeekHours
        : 0,
      previousVisitsWithClient: caregiverContext.previousVisitsWithClient,
      ...(caregiverContext.clientRating !== undefined && {
        clientRating: caregiverContext.clientRating,
      }),
      reliabilityScore: caregiverContext.reliabilityScore,
      matchReasons,
      computedAt: new Date(),
    };
    return base;
  }

  /**
   * Calculate scores across all dimensions
   */
  private static calculateScores(
    shift: OpenShift,
    context: CaregiverContext,
    config: MatchingConfiguration
  ): MatchScores {
    return {
      skillMatch: this.scoreSkillMatch(shift, context.caregiver),
      availabilityMatch: this.scoreAvailability(shift, context),
      proximityMatch: this.scoreProximity(shift, context, config),
      preferenceMatch: this.scorePreferences(shift, context),
      experienceMatch: this.scoreExperience(shift, context),
      reliabilityMatch: this.scoreReliability(context, config),
      complianceMatch: this.scoreCompliance(context.caregiver),
      capacityMatch: this.scoreCapacity(shift, context),
    };
  }

  /**
   * Score skill and certification match
   */
  private static scoreSkillMatch(shift: OpenShift, caregiver: Caregiver): number {
    let score = 100;

    const requiredSkills = shift.requiredSkills || [];
    const requiredCerts = shift.requiredCertifications || [];

    const caregiverSkills = caregiver.skills?.map((s) => s.name) || [];
    const caregiverCerts = caregiver.credentials?.map((c) => String(c.type)) || [];

    // Check required skills
    const missingSkills = requiredSkills.filter((skill) => !caregiverSkills.includes(skill));
    if (missingSkills.length > 0) {
      score -= missingSkills.length * 30; // Penalize 30 points per missing skill
    }

    // Check required certifications
    const missingCerts = requiredCerts.filter((cert) => !caregiverCerts.includes(cert));
    if (missingCerts.length > 0) {
      score -= missingCerts.length * 40; // Penalize 40 points per missing cert
    }

    return Math.max(0, score);
  }

  /**
   * Score availability (no conflicts)
   */
  private static scoreAvailability(_shift: OpenShift, context: CaregiverContext): number {
    if (context.conflictingVisits.length === 0) {
      return 100; // Perfect availability
    }

    // Has conflicts - score 0
    return 0;
  }

  /**
   * Score proximity to shift location
   */
  private static scoreProximity(
    _shift: OpenShift,
    context: CaregiverContext,
    config: MatchingConfiguration
  ): number {
    if (!context.distanceFromShift) {
      return 50; // Unknown distance - neutral score
    }

    const distance = context.distanceFromShift;
    const maxDistance = config.maxTravelDistance || 50;

    if (distance > maxDistance) {
      return 0; // Too far
    }

    // Score decreases linearly with distance
    // 0 miles = 100, maxDistance miles = 20
    const score = 100 - (distance / maxDistance) * 80;
    return Math.max(20, Math.min(100, score));
  }

  /**
   * Score preference alignment
   */
  private static scorePreferences(shift: OpenShift, context: CaregiverContext): number {
    let score = 50; // Start neutral

    const { caregiver } = context;

    // Check if caregiver is in preferred list
    if (shift.preferredCaregivers?.includes(caregiver.id)) {
      score += 30; // Bonus for being preferred
    }

    // Check if caregiver is blocked
    if (shift.blockedCaregivers?.includes(caregiver.id)) {
      return 0; // Hard block
    }

    // Gender preference match
    if (shift.genderPreference && shift.genderPreference !== 'NO_PREFERENCE') {
      if (caregiver.gender === shift.genderPreference) {
        score += 10;
      } else {
        score -= 20;
      }
    }

    // Language preference match
    if (shift.languagePreference) {
      if (caregiver.languages?.includes(shift.languagePreference)) {
        score += 10;
      } else {
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score experience with client and service type
   */
  private static scoreExperience(_shift: OpenShift, context: CaregiverContext): number {
    let score = 50; // Start neutral

    // Previous visits with this client
    const previousVisits = context.previousVisitsWithClient || 0;
    if (previousVisits > 0) {
      // Continuity of care bonus
      score += Math.min(30, previousVisits * 5); // Up to 30 points for 6+ visits
    }

    // Client rating
    if (context.clientRating) {
      // 5 stars = +20, 1 star = -20, 3 stars = 0
      score += (context.clientRating - 3) * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score reliability and performance
   */
  private static scoreReliability(
    context: CaregiverContext,
    config: MatchingConfiguration
  ): number {
    let score = context.reliabilityScore; // Base reliability score (0-100)

    // Penalize recent rejections if configured
    if (config.penalizeFrequentRejections && context.recentRejectionCount > 0) {
      score -= context.recentRejectionCount * 5; // -5 points per rejection
    }

    // Boost reliable performers if configured
    if (config.boostReliablePerformers && context.reliabilityScore >= 90) {
      score += 10; // Bonus for high reliability
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score compliance (credentials current)
   */
  private static scoreCompliance(caregiver: Caregiver): number {
    if (caregiver.complianceStatus === 'COMPLIANT') {
      return 100;
    } else if (caregiver.complianceStatus === 'EXPIRING_SOON') {
      return 70;
    } else if (caregiver.complianceStatus === 'PENDING_VERIFICATION') {
      return 50;
    } else {
      return 0; // Expired or non-compliant
    }
  }

  /**
   * Score capacity (hours remaining this week)
   */
  private static scoreCapacity(shift: OpenShift, context: CaregiverContext): number {
    const { caregiver } = context;

    if (!caregiver.maxHoursPerWeek) {
      return 100; // No limit
    }

    const availableHours = caregiver.maxHoursPerWeek - context.currentWeekHours;
    const shiftHours = shift.duration / 60;

    if (availableHours < shiftHours) {
      return 0; // Would exceed limit
    }

    // Score based on how much capacity remains after this shift
    const utilizationRate = (context.currentWeekHours + shiftHours) / caregiver.maxHoursPerWeek;

    // Prefer moderate utilization (60-80%)
    if (utilizationRate >= 0.6 && utilizationRate <= 0.8) {
      return 100;
    } else if (utilizationRate < 0.6) {
      return 80; // Under-utilized
    } else {
      return 60; // High utilization
    }
  }

  /**
   * Calculate weighted overall score
   */
  private static calculateOverallScore(scores: MatchScores, config: MatchingConfiguration): number {
    const weights = config.weights;

    const weightedScore =
      (scores.skillMatch * weights.skillMatch +
        scores.availabilityMatch * weights.availabilityMatch +
        scores.proximityMatch * weights.proximityMatch +
        scores.preferenceMatch * weights.preferenceMatch +
        scores.experienceMatch * weights.experienceMatch +
        scores.reliabilityMatch * weights.reliabilityMatch +
        scores.complianceMatch * weights.complianceMatch +
        scores.capacityMatch * weights.capacityMatch) /
      100; // Weights sum to 100

    return Math.round(weightedScore);
  }

  /**
   * Check eligibility and generate issues
   */
  private static checkEligibility(
    shift: OpenShift,
    context: CaregiverContext,
    config: MatchingConfiguration
  ): EligibilityIssue[] {
    const issues: EligibilityIssue[] = [];
    const { caregiver } = context;

    // Check blocked status
    if (shift.blockedCaregivers?.includes(caregiver.id)) {
      issues.push({
        type: 'BLOCKED_BY_CLIENT',
        severity: 'BLOCKING',
        message: 'Caregiver is blocked from this client',
      });
    }

    // Check required skills
    if (config.requireExactSkillMatch) {
      const requiredSkills = shift.requiredSkills || [];
      const caregiverSkills = caregiver.skills?.map((s) => s.name) || [];
      const missingSkills = requiredSkills.filter((skill) => !caregiverSkills.includes(skill));

      if (missingSkills.length > 0) {
        issues.push({
          type: 'MISSING_SKILL',
          severity: 'BLOCKING',
          message: `Missing required skills: ${missingSkills.join(', ')}`,
        });
      }
    }

    // Check certifications
    if (config.requireActiveCertifications) {
      const requiredCerts = shift.requiredCertifications || [];
      const caregiverCerts =
        caregiver.credentials?.filter((c) => c.status === 'ACTIVE').map((c) => String(c.type)) ||
        [];
      const missingCerts = requiredCerts.filter((cert) => !caregiverCerts.includes(cert));

      if (missingCerts.length > 0) {
        issues.push({
          type: 'MISSING_CERTIFICATION',
          severity: 'BLOCKING',
          message: `Missing required certifications: ${missingCerts.join(', ')}`,
        });
      }
    }

    // Check schedule conflicts
    if (context.conflictingVisits.length > 0) {
      issues.push({
        type: 'SCHEDULE_CONFLICT',
        severity: 'BLOCKING',
        message: `Has ${context.conflictingVisits.length} conflicting visit(s)`,
      });
    }

    // Check compliance
    if (
      caregiver.complianceStatus === 'EXPIRED' ||
      caregiver.complianceStatus === 'NON_COMPLIANT'
    ) {
      issues.push({
        type: 'NOT_COMPLIANT',
        severity: 'BLOCKING',
        message: 'Caregiver is not compliant - credentials expired or missing',
      });
    } else if (caregiver.complianceStatus === 'EXPIRING_SOON') {
      issues.push({
        type: 'EXPIRED_CREDENTIAL',
        severity: 'WARNING',
        message: 'Some credentials are expiring soon',
      });
    }

    // Check distance
    if (config.maxTravelDistance && context.distanceFromShift) {
      if (context.distanceFromShift && context.distanceFromShift > config.maxTravelDistance) {
        issues.push({
          type: 'DISTANCE_TOO_FAR',
          severity: 'BLOCKING',
          message: `Distance (${context.distanceFromShift.toFixed(1)} mi) exceeds max travel distance (${config.maxTravelDistance} mi)`,
        });
      }
    }

    // Check weekly hour limit
    if (caregiver.maxHoursPerWeek) {
      const shiftHours = shift.duration / 60;
      const availableHours = caregiver.maxHoursPerWeek - context.currentWeekHours;

      if (availableHours < shiftHours) {
        issues.push({
          type: 'OVER_HOUR_LIMIT',
          severity: 'BLOCKING',
          message: `Would exceed weekly hour limit (${caregiver.maxHoursPerWeek} hrs)`,
        });
      }
    }

    // Check gender preference
    if (
      config.respectGenderPreference &&
      shift.genderPreference &&
      shift.genderPreference !== 'NO_PREFERENCE'
    ) {
      if (caregiver.gender !== shift.genderPreference) {
        issues.push({
          type: 'GENDER_MISMATCH',
          severity: 'WARNING',
          message: `Client prefers ${shift.genderPreference} caregiver`,
        });
      }
    }

    // Check language preference
    if (config.respectLanguagePreference && shift.languagePreference) {
      if (!caregiver.languages?.includes(shift.languagePreference)) {
        issues.push({
          type: 'LANGUAGE_MISMATCH',
          severity: 'WARNING',
          message: `Client prefers ${shift.languagePreference}-speaking caregiver`,
        });
      }
    }

    return issues;
  }

  /**
   * Determine match quality tier
   */
  private static determineMatchQuality(score: number, isEligible: boolean): MatchQuality {
    if (!isEligible) {
      return 'INELIGIBLE';
    }

    if (score >= 85) {
      return 'EXCELLENT';
    } else if (score >= 70) {
      return 'GOOD';
    } else if (score >= 50) {
      return 'FAIR';
    } else {
      return 'POOR';
    }
  }

  /**
   * Generate human-readable match reasons
   */
  private static generateMatchReasons(
    shift: OpenShift,
    context: CaregiverContext,
    scores: MatchScores
  ): MatchReason[] {
    const reasons: MatchReason[] = [];

    // Skill match
    if (scores.skillMatch >= 90) {
      reasons.push({
        category: 'SKILL',
        description: 'Has all required skills and certifications',
        impact: 'POSITIVE',
        weight: 0.2,
      });
    } else if (scores.skillMatch < 70) {
      reasons.push({
        category: 'SKILL',
        description: 'Missing some required skills or certifications',
        impact: 'NEGATIVE',
        weight: 0.2,
      });
    }

    // Availability
    if (scores.availabilityMatch === 100) {
      reasons.push({
        category: 'AVAILABILITY',
        description: 'No schedule conflicts',
        impact: 'POSITIVE',
        weight: 0.2,
      });
    } else {
      reasons.push({
        category: 'AVAILABILITY',
        description: 'Has schedule conflict at this time',
        impact: 'NEGATIVE',
        weight: 0.2,
      });
    }

    // Proximity
    if (scores.proximityMatch >= 90) {
      reasons.push({
        category: 'PROXIMITY',
        description: 'Close to client location',
        impact: 'POSITIVE',
        weight: 0.15,
      });
    } else if (scores.proximityMatch < 50) {
      reasons.push({
        category: 'PROXIMITY',
        description: 'Far from client location',
        impact: 'NEGATIVE',
        weight: 0.15,
      });
    }

    // Experience
    if (context.previousVisitsWithClient > 0) {
      reasons.push({
        category: 'EXPERIENCE',
        description: `Has ${context.previousVisitsWithClient} previous visit(s) with this client`,
        impact: 'POSITIVE',
        weight: 0.1,
      });
    }

    // Preference
    if (shift.preferredCaregivers?.includes(context.caregiver.id)) {
      reasons.push({
        category: 'PREFERENCE',
        description: 'Preferred by client',
        impact: 'POSITIVE',
        weight: 0.1,
      });
    }

    // Reliability
    if (context.reliabilityScore >= 90) {
      reasons.push({
        category: 'RELIABILITY',
        description: 'Highly reliable performer',
        impact: 'POSITIVE',
        weight: 0.1,
      });
    } else if (context.reliabilityScore < 60) {
      reasons.push({
        category: 'RELIABILITY',
        description: 'Below-average reliability score',
        impact: 'NEGATIVE',
        weight: 0.1,
      });
    }

    return reasons;
  }

  /**
   * Rank candidates by overall score and quality
   */
  static rankCandidates(candidates: MatchCandidate[]): MatchCandidate[] {
    return candidates.sort((a, b) => {
      // First, separate eligible from ineligible
      if (a.isEligible !== b.isEligible) {
        return a.isEligible ? -1 : 1;
      }

      // Then sort by overall score (descending)
      return b.overallScore - a.overallScore;
    });
  }
}
