/**
 * AI-Powered Scheduling Optimization Service
 *
 * Provides intelligent caregiver-visit matching with scoring based on:
 * - Continuity of care (same caregivers = better outcomes)
 * - Geographic clustering (minimize drive time)
 * - Skill/certification matching
 * - Caregiver preferences and work-life balance
 * - Patient preferences (gender, language, etc.)
 *
 * This is a COMPETITIVE DIFFERENTIATOR - every competitor has basic scheduling,
 * but none have intelligent AI-powered optimization that actually helps workers.
 *
 * Key Design Principles:
 * - AI SUGGESTS, HUMAN DECIDES - schedulers always have final say
 * - WORKER-FIRST - optimize for caregiver satisfaction, not just coverage
 * - TRANSPARENT SCORING - show WHY we recommend each caregiver
 * - FAIL FAST - throw clear errors for unimplemented features
 */

import {
  UUID,
  UserContext,
  ValidationError,
  NotFoundError,
} from '@folkcare/core';
import { ScheduleRepository } from '../repository/schedule-repository.js';
import {
  Visit,
  VisitSearchFilters,
} from '../types/schedule.js';

/**
 * Caregiver suggestion with transparent scoring
 */
export interface CaregiverSuggestion {
  caregiverId: UUID;
  score: number; // 0-100, higher is better
  scoreBreakdown: ScoreBreakdown;
  isAvailable: boolean;
  conflicts: ConflictDetail[];
  reasoning: string[]; // Human-readable reasons for this suggestion
}

/**
 * Transparent score breakdown showing why this caregiver was suggested
 */
export interface ScoreBreakdown {
  continuityScore: number; // 0-30 points: Has worked with this client before
  geographicScore: number; // 0-25 points: Close to client, efficient routing
  skillMatchScore: number; // 0-20 points: Has required skills/certifications
  preferenceScore: number; // 0-15 points: Matches client preferences (gender, language)
  availabilityScore: number; // 0-10 points: Has availability preferences that match this slot
  totalScore: number; // Sum of all scores
}

/**
 * Detailed conflict information (if any)
 */
export interface ConflictDetail {
  type: 'EXISTING_VISIT' | 'TRAVEL_TIME' | 'OVERTIME' | 'CREDENTIAL_EXPIRING';
  severity: 'BLOCKING' | 'WARNING';
  description: string;
  conflictingVisitId?: UUID;
  suggestedResolution?: string;
}

/**
 * Optimization request
 */
export interface OptimizationRequest {
  visitId: UUID;
  includeUnavailable?: boolean; // Include unavailable caregivers with conflicts
  maxSuggestions?: number; // Limit number of suggestions (default: 10)
}

/**
 * Geographic clustering data (for future map-based scheduling)
 */
export interface GeographicCluster {
  centroid: { latitude: number; longitude: number };
  visits: UUID[];
  recommendedCaregivers: UUID[];
  estimatedTravelTime: number; // minutes
}

/**
 * Caregiver profile (minimal data needed for scoring)
 *
 * NOTE: This is a temporary interface. In production, this should come from
 * the caregiver-staff vertical via a provider interface to avoid circular dependencies.
 */
interface CaregiverProfile {
  id: UUID;
  firstName: string;
  lastName: string;
  skills: string[];
  certifications: string[];
  languages: string[];
  gender?: 'MALE' | 'FEMALE';
  homeAddress?: {
    latitude?: number;
    longitude?: number;
  };
  preferences?: {
    maxDailyHours?: number;
    preferredTimeOfDay?: string[];
    preferredDaysOfWeek?: string[];
  };
}

/**
 * Provider interface for fetching caregiver data
 * Allows decoupling from caregiver-staff vertical
 */
export interface ICaregiverProfileProvider {
  getCaregiverProfile(caregiverId: UUID): Promise<CaregiverProfile>;
  getAvailableCaregivers(
    organizationId: UUID,
    branchId?: UUID,
    date?: Date
  ): Promise<CaregiverProfile[]>;
}

/**
 * Provider interface for historical visit data (continuity scoring)
 */
export interface IVisitHistoryProvider {
  getClientCaregiverHistory(
    clientId: UUID,
    caregiverId: UUID
  ): Promise<{
    totalVisits: number;
    recentVisits: number; // Last 30 days
    lastVisitDate?: Date;
    clientSatisfactionRating?: number; // 1-5 if available
  }>;
}

export class ScheduleOptimizationService {
  private caregiverProvider?: ICaregiverProfileProvider;
  private visitHistoryProvider?: IVisitHistoryProvider;

  constructor(
    private repository: ScheduleRepository
  ) {}

  /**
   * Set the caregiver profile provider for optimization
   */
  setCaregiverProvider(provider: ICaregiverProfileProvider): void {
    this.caregiverProvider = provider;
  }

  /**
   * Set the visit history provider for continuity scoring
   */
  setVisitHistoryProvider(provider: IVisitHistoryProvider): void {
    this.visitHistoryProvider = provider;
  }

  /**
   * Get AI-powered caregiver suggestions for a visit
   *
   * This is the main entry point for scheduling optimization.
   * Returns a ranked list of caregivers with transparent scoring.
   */
  async suggestCaregivers(
    request: OptimizationRequest,
    context: UserContext
  ): Promise<CaregiverSuggestion[]> {
    // Get the visit we're trying to assign
    const visit = await this.repository.getVisitById(request.visitId);
    if (!visit) {
      throw new NotFoundError('Visit not found', { visitId: request.visitId });
    }

    // FAIL FAST: Require caregiver provider
    if (!this.caregiverProvider) {
      throw new ValidationError(
        'CaregiverProfileProvider not configured. Cannot suggest caregivers.',
        {
          hint: 'Inject a CaregiverProfileProvider implementation when instantiating ScheduleOptimizationService',
        }
      );
    }

    // Get all available caregivers for this organization/branch
    const availableCaregivers = await this.caregiverProvider.getAvailableCaregivers(
      visit.organizationId,
      visit.branchId,
      visit.scheduledDate
    );

    if (availableCaregivers.length === 0) {
      return []; // No caregivers available
    }

    // Score each caregiver
    const suggestions: CaregiverSuggestion[] = [];
    for (const caregiver of availableCaregivers) {
      const suggestion = await this.scoreCaregiverForVisit(caregiver, visit, context);
      suggestions.push(suggestion);
    }

    // Sort by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);

    // Filter out unavailable caregivers unless explicitly requested
    const filtered = request.includeUnavailable
      ? suggestions
      : suggestions.filter(s => s.isAvailable);

    // Limit number of suggestions
    const limit = request.maxSuggestions ?? 10;
    return filtered.slice(0, limit);
  }

  /**
   * Score a single caregiver for a visit
   *
   * This is where the AI magic happens. We calculate multiple scores
   * and combine them into a final recommendation.
   */
  private async scoreCaregiverForVisit(
    caregiver: CaregiverProfile,
    visit: Visit,
    context: UserContext
  ): Promise<CaregiverSuggestion> {
    // Check availability and conflicts
    const { isAvailable, conflicts } = await this.checkAvailability(
      caregiver.id,
      visit,
      context
    );

    // Calculate score breakdown
    const continuityScore = await this.scoreContinuity(caregiver.id, visit);
    const geographicScore = this.scoreGeography(caregiver, visit);
    const skillMatchScore = this.scoreSkillMatch(caregiver, visit);
    const preferenceScore = this.scorePreferences(caregiver, visit);
    const availabilityScore = isAvailable ? 10 : 0; // Full points if available

    const totalScore =
      continuityScore +
      geographicScore +
      skillMatchScore +
      preferenceScore +
      availabilityScore;

    // Generate human-readable reasoning
    const reasoning = this.generateReasoning(
      caregiver,
      {
        continuityScore,
        geographicScore,
        skillMatchScore,
        preferenceScore,
        availabilityScore,
        totalScore,
      }
    );

    return {
      caregiverId: caregiver.id,
      score: totalScore,
      scoreBreakdown: {
        continuityScore,
        geographicScore,
        skillMatchScore,
        preferenceScore,
        availabilityScore,
        totalScore,
      },
      isAvailable,
      conflicts,
      reasoning,
    };
  }

  /**
   * Score continuity of care (0-30 points)
   *
   * Continuity is THE most important factor for patient outcomes.
   * Same caregiver = patient comfort, fewer errors, better care.
   */
  private async scoreContinuity(
    caregiverId: UUID,
    visit: Visit
  ): Promise<number> {
    // FAIL FAST: If no history provider, return 0 (no continuity data)
    if (!this.visitHistoryProvider) {
      return 0;
    }

    const history = await this.visitHistoryProvider.getClientCaregiverHistory(
      visit.clientId,
      caregiverId
    );

    let score = 0;

    // Recent visits worth more than older visits
    if (history.recentVisits > 0) {
      score += Math.min(history.recentVisits * 3, 15); // Up to 15 points for recent work
    }

    // Total history
    if (history.totalVisits > 0) {
      score += Math.min(history.totalVisits, 10); // Up to 10 points for overall history
    }

    // Client satisfaction boost
    if (history.clientSatisfactionRating && history.clientSatisfactionRating >= 4) {
      score += 5; // Bonus for high satisfaction
    }

    return Math.min(score, 30); // Cap at 30 points
  }

  /**
   * Score geographic proximity (0-25 points)
   *
   * Minimize drive time = happier caregivers + more time with patients
   */
  private scoreGeography(
    caregiver: CaregiverProfile,
    visit: Visit
  ): number {
    // If we don't have coordinates, can't calculate distance
    if (
      !caregiver.homeAddress?.latitude ||
      !caregiver.homeAddress?.longitude ||
      !visit.address.latitude ||
      !visit.address.longitude
    ) {
      return 0; // No geographic data = no points
    }

    const distance = this.calculateDistance(
      caregiver.homeAddress.latitude,
      caregiver.homeAddress.longitude,
      visit.address.latitude,
      visit.address.longitude
    );

    // Score based on distance (in miles)
    if (distance < 5) return 25; // Very close
    if (distance < 10) return 20; // Close
    if (distance < 15) return 15; // Reasonable
    if (distance < 20) return 10; // Acceptable
    if (distance < 30) return 5; // Far
    return 0; // Too far
  }

  /**
   * Score skill and certification matching (0-20 points)
   *
   * Right qualifications = compliance + quality care
   */
  private scoreSkillMatch(
    caregiver: CaregiverProfile,
    visit: Visit
  ): number {
    let score = 0;

    // Check required skills
    if (visit.requiredSkills && visit.requiredSkills.length > 0) {
      const matchingSkills = visit.requiredSkills.filter(skill =>
        caregiver.skills.includes(skill)
      );
      const skillMatchPercentage = matchingSkills.length / visit.requiredSkills.length;
      score += skillMatchPercentage * 10; // Up to 10 points
    } else {
      score += 10; // No specific skills required = full points
    }

    // Check required certifications
    if (visit.requiredCertifications && visit.requiredCertifications.length > 0) {
      const matchingCerts = visit.requiredCertifications.filter(cert =>
        caregiver.certifications.includes(cert)
      );
      const certMatchPercentage = matchingCerts.length / visit.requiredCertifications.length;
      score += certMatchPercentage * 10; // Up to 10 points
    } else {
      score += 10; // No specific certs required = full points
    }

    return Math.min(score, 20); // Cap at 20 points
  }

  /**
   * Score patient preferences (0-15 points)
   *
   * Respecting patient preferences = dignity + comfort
   */
  private scorePreferences(
    _caregiver: CaregiverProfile,
    _visit: Visit
  ): number {
    const score = 15; // Start with full points, deduct for mismatches

    // Gender preference (from pattern - we'd need to fetch this)
    // For now, assume no preference = no deduction
    // TODO: Fetch ServicePattern to get genderPreference

    // Language preference
    // TODO: Fetch ServicePattern to get languagePreference
    // For now, give full points

    return score;
  }

  /**
   * Check if caregiver is available and identify conflicts
   */
  private async checkAvailability(
    caregiverId: UUID,
    visit: Visit,
    _context: UserContext
  ): Promise<{ isAvailable: boolean; conflicts: ConflictDetail[] }> {
    const conflicts: ConflictDetail[] = [];

    // Get all visits for this caregiver on the same date
    const filters: VisitSearchFilters = {
      caregiverId,
      dateFrom: visit.scheduledDate,
      dateTo: visit.scheduledDate,
      status: ['ASSIGNED', 'CONFIRMED', 'EN_ROUTE', 'IN_PROGRESS'],
    };

    const existingVisits = await this.repository.searchVisits(filters, {
      page: 1,
      limit: 100,
    });

    // Check for time conflicts
    const visitStart = this.timeToMinutes(visit.scheduledStartTime);
    const visitEnd = this.timeToMinutes(visit.scheduledEndTime);

    for (const existing of existingVisits.items) {
      const existingStart = this.timeToMinutes(existing.scheduledStartTime);
      const existingEnd = this.timeToMinutes(existing.scheduledEndTime);

      // Add travel time buffer (30 minutes before and after)
      const effectiveStart = existingStart - 30;
      const effectiveEnd = existingEnd + 30;

      // Check for overlap
      if (
        (visitStart >= effectiveStart && visitStart < effectiveEnd) ||
        (visitEnd > effectiveStart && visitEnd <= effectiveEnd) ||
        (visitStart <= effectiveStart && visitEnd >= effectiveEnd)
      ) {
        conflicts.push({
          type: 'EXISTING_VISIT',
          severity: 'BLOCKING',
          description: `Conflicts with existing visit at ${existing.scheduledStartTime}-${existing.scheduledEndTime}`,
          conflictingVisitId: existing.id,
          suggestedResolution: 'Reschedule one of the visits or add travel time',
        });
      }
    }

    return {
      isAvailable: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * Generate human-readable reasoning for the suggestion
   */
  private generateReasoning(
    caregiver: CaregiverProfile,
    breakdown: ScoreBreakdown
  ): string[] {
    const reasons: string[] = [];

    // Continuity reasoning
    if (breakdown.continuityScore > 20) {
      reasons.push(`${caregiver.firstName} has worked with this client many times before - excellent continuity`);
    } else if (breakdown.continuityScore > 10) {
      reasons.push(`${caregiver.firstName} has some history with this client`);
    } else if (breakdown.continuityScore === 0) {
      reasons.push(`${caregiver.firstName} hasn't worked with this client before (opportunity to build relationship)`);
    }

    // Geographic reasoning
    if (breakdown.geographicScore > 20) {
      reasons.push('Very close to client location - minimal drive time');
    } else if (breakdown.geographicScore > 10) {
      reasons.push('Reasonable distance from client');
    } else if (breakdown.geographicScore > 0) {
      reasons.push('Farther drive, but within service area');
    } else {
      reasons.push('No geographic data available');
    }

    // Skill reasoning
    if (breakdown.skillMatchScore === 20) {
      reasons.push('Perfect match for all required skills and certifications');
    } else if (breakdown.skillMatchScore > 15) {
      reasons.push('Good match for required qualifications');
    } else if (breakdown.skillMatchScore > 0) {
      reasons.push('Partial match for required qualifications');
    }

    // Availability reasoning
    if (breakdown.availabilityScore === 10) {
      reasons.push('✅ Available - no conflicts');
    } else {
      reasons.push('⚠️ Has scheduling conflicts - may need adjustment');
    }

    return reasons;
  }

  /**
   * Calculate distance between two lat/long points (Haversine formula)
   * Returns distance in miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private timeToMinutes(time: string): number {
    const [hours, mins] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (mins ?? 0);
  }

  /**
   * Batch optimization - suggest caregivers for multiple visits at once
   *
   * This enables geographic clustering and better overall schedule optimization.
   *
   * NOTE: This is a placeholder for future Phase 2 feature.
   * Throws NotImplementedError to fail fast and clearly.
   */
  async optimizeScheduleBatch(
    _visitIds: UUID[],
    _context: UserContext
  ): Promise<Map<UUID, CaregiverSuggestion[]>> {
    throw new Error(
      'NOT IMPLEMENTED: Batch schedule optimization coming in Phase 2. ' +
      'For now, use suggestCaregivers() for individual visits.'
    );
  }

  /**
   * Geographic clustering analysis
   *
   * Identify clusters of visits that could be handled by the same caregiver
   * to minimize drive time and maximize efficiency.
   *
   * NOTE: This is a placeholder for future Phase 2 feature.
   * Throws NotImplementedError to fail fast and clearly.
   */
  async identifyGeographicClusters(
    _visitIds: UUID[],
    _context: UserContext
  ): Promise<GeographicCluster[]> {
    throw new Error(
      'NOT IMPLEMENTED: Geographic clustering analysis coming in Phase 2. ' +
      'This will use K-means clustering to group nearby visits.'
    );
  }
}
