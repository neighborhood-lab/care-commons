/**
 * ML Feature Engineering Service
 *
 * Computes features for ML model training and inference from raw data
 */

// Database type - using any for now as this vertical uses pg.Pool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { type Caregiver } from '@care-commons/caregiver-staff';
import { type MLMatchFeatures } from '../types/ml-types';
import { type OpenShift } from '../types/shift-matching';
import { type CaregiverContext } from '../utils/matching-algorithm';
import { getDay, getHours, isWeekend } from 'date-fns';

export interface FeatureComputationInput {
  caregiverId: string;
  clientId: string;
  shiftId?: string;
  shift?: OpenShift;
  caregiverContext?: CaregiverContext;
  targetSuccess?: boolean; // For training data
}

export class MLFeatureEngineeringService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: any) {}

  /**
   * Compute features for a single caregiver-client-shift combination
   */
  async computeFeatures(input: FeatureComputationInput): Promise<MLMatchFeatures> {
    const {
      caregiverId,
      clientId,
      shiftId,
      shift,
      caregiverContext,
      targetSuccess,
    } = input;

    // Fetch data if not provided
    const caregiver = caregiverContext?.caregiver || await this.fetchCaregiver(caregiverId);
    const client = await this.fetchClient(clientId);
    const shiftData = shift || (shiftId ? await this.fetchShift(shiftId) : null);

    // Compute context if not provided
    const context = caregiverContext || await this.buildCaregiverContext(caregiverId, clientId, shiftData);

    // Compute features
    const features: Partial<MLMatchFeatures> = {
      organizationId: caregiver.organizationId,
      caregiverId,
      clientId,
      shiftId,
      computedAt: new Date(),
      featureVersion: '1.0',

      // Compatibility features
      ...this.computeCompatibilityFeatures(caregiver, client, context, shiftData),

      // Temporal features
      ...this.computeTemporalFeatures(shiftData),

      // Spatial features
      ...this.computeSpatialFeatures(context, caregiver, client, shiftData),

      // Caregiver state features
      ...this.computeCaregiverStateFeatures(context, caregiver),

      // Client features
      ...this.computeClientFeatures(client, shiftData),

      // Historical performance features
      ...await this.computeHistoricalFeatures(caregiverId, clientId),

      // Interaction features
      ...this.computeInteractionFeatures(caregiver, client, shiftData, context),

      // Target variable for training
      targetSuccess,
    };

    return features as MLMatchFeatures;
  }

  /**
   * Compute features for multiple caregiver-client pairs in batch
   */
  async computeBatchFeatures(inputs: FeatureComputationInput[]): Promise<MLMatchFeatures[]> {
    // In production, this would be optimized with batch queries
    return Promise.all(inputs.map((input) => this.computeFeatures(input)));
  }

  /**
   * Extract training data from match outcomes
   */
  async extractTrainingData(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MLMatchFeatures[]> {
    // Fetch match outcomes from the database
    const outcomes = await this.db('match_outcomes')
      .where('organization_id', organizationId)
      .whereBetween('scheduled_start', [startDate, endDate])
      .select('*');

    const features: MLMatchFeatures[] = [];

    for (const outcome of outcomes) {
      try {
        const featureSet = await this.computeFeatures({
          caregiverId: outcome.caregiver_id,
          clientId: outcome.client_id,
          shiftId: outcome.open_shift_id,
          targetSuccess: outcome.was_successful,
        });

        // Store the match outcome ID for linking
        featureSet.matchOutcomeId = outcome.id;

        features.push(featureSet);
      } catch (error) {
        console.error(`Failed to compute features for outcome ${outcome.id}:`, error);
      }
    }

    return features;
  }

  /**
   * Save computed features to database
   */
  async saveFeatures(features: MLMatchFeatures): Promise<string> {
    const [result] = await this.db('ml_match_features')
      .insert({
        organization_id: features.organizationId,
        caregiver_id: features.caregiverId,
        client_id: features.clientId,
        shift_id: features.shiftId,
        match_outcome_id: features.matchOutcomeId,
        computed_at: features.computedAt,

        // Compatibility features
        skill_match_score: features.skillMatchScore,
        experience_score: features.experienceScore,
        preference_score: features.preferenceScore,
        previous_visits_count: features.previousVisitsCount,
        avg_client_rating: features.avgClientRating,
        has_worked_together: features.hasWorkedTogether,
        days_since_last_visit: features.daysSinceLastVisit,

        // Temporal features
        day_of_week: features.dayOfWeek,
        hour_of_day: features.hourOfDay,
        is_weekend: features.isWeekend,
        is_holiday: features.isHoliday,
        time_of_day_preference: features.timeOfDayPreference,

        // Spatial features
        distance_miles: features.distanceMiles,
        travel_time_minutes: features.travelTimeMinutes,
        in_preferred_area: features.inPreferredArea,
        shifts_in_area_last_30d: features.shiftsInAreaLast30d,

        // Caregiver state features
        current_week_hours: features.currentWeekHours,
        capacity_utilization: features.capacityUtilization,
        active_shifts_count: features.activeShiftsCount,
        reliability_score_90d: features.reliabilityScore90d,
        no_show_count_90d: features.noShowCount90d,
        cancellation_count_90d: features.cancellationCount90d,
        rejection_count_30d: features.rejectionCount30d,

        // Client features
        client_has_special_needs: features.clientHasSpecialNeeds,
        required_skills: JSON.stringify(features.requiredSkills),
        required_certifications: JSON.stringify(features.requiredCertifications),
        gender_preference: features.genderPreference,
        language_preference: features.languagePreference,

        // Historical performance features
        caregiver_avg_rating: features.caregiverAvgRating,
        total_completed_visits: features.totalCompletedVisits,
        completion_rate: features.completionRate,
        on_time_rate: features.onTimeRate,

        // Interaction features
        is_preferred_caregiver: features.isPreferredCaregiver,
        is_blocked_caregiver: features.isBlockedCaregiver,
        mutual_preference_score: features.mutualPreferenceScore,

        // Target
        target_success: features.targetSuccess,

        feature_version: features.featureVersion,
      })
      .returning('id');

    return result.id;
  }

  // ============================================================================
  // Private helper methods for feature computation
  // ============================================================================

  private computeCompatibilityFeatures(
    caregiver: Caregiver,
    client: any,
    context: CaregiverContext,
    shift?: OpenShift | null
  ): Partial<MLMatchFeatures> {
    const caregiverSkills = caregiver.skills?.map((s) => s.name) || [];
    const requiredSkills = shift?.requiredSkills || client.required_skills || [];

    const matchedSkills = requiredSkills.filter((skill: string) =>
      caregiverSkills.includes(skill)
    );
    const skillMatchScore = requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 100
      : 100;

    return {
      skillMatchScore,
      experienceScore: this.computeExperienceScore(caregiver),
      preferenceScore: this.computePreferenceScore(caregiver, client, shift),
      previousVisitsCount: context.previousVisitsWithClient,
      avgClientRating: context.clientRating,
      hasWorkedTogether: context.previousVisitsWithClient > 0,
      daysSinceLastVisit: context.previousVisitsWithClient > 0
        ? this.computeDaysSinceLastVisit(caregiver.id, client.id)
        : undefined,
    };
  }

  private computeTemporalFeatures(shift?: OpenShift | null): Partial<MLMatchFeatures> {
    if (!shift) {
      return {};
    }

    const shiftDate = new Date(shift.scheduledDate);
    const shiftStartTime = new Date(`${shift.scheduledDate} ${shift.startTime}`);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getDay(shiftDate)];
    const hourOfDay = getHours(shiftStartTime);

    let timeOfDayPreference: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hourOfDay >= 6 && hourOfDay < 12) timeOfDayPreference = 'morning';
    else if (hourOfDay >= 12 && hourOfDay < 17) timeOfDayPreference = 'afternoon';
    else if (hourOfDay >= 17 && hourOfDay < 21) timeOfDayPreference = 'evening';
    else timeOfDayPreference = 'night';

    return {
      dayOfWeek,
      hourOfDay,
      isWeekend: isWeekend(shiftDate),
      isHoliday: this.isHoliday(shiftDate),
      timeOfDayPreference,
    };
  }

  private computeSpatialFeatures(
    context: CaregiverContext,
    caregiver: Caregiver,
    client: any,
    _shift?: OpenShift | null
  ): Partial<MLMatchFeatures> {
    const distanceMiles = context.distanceFromShift;
    const travelTimeMinutes = distanceMiles ? distanceMiles * 2 : undefined; // Rough estimate

    return {
      distanceMiles,
      travelTimeMinutes,
      inPreferredArea: this.checkPreferredArea(caregiver, client),
      shiftsInAreaLast30d: undefined, // Would query database for this
    };
  }

  private computeCaregiverStateFeatures(
    context: CaregiverContext,
    caregiver: Caregiver
  ): Partial<MLMatchFeatures> {
    const maxHours = caregiver.maxHoursPerWeek || 40;
    const capacityUtilization = context.currentWeekHours / maxHours;

    return {
      currentWeekHours: context.currentWeekHours,
      capacityUtilization,
      activeShiftsCount: undefined, // Would query database
      reliabilityScore90d: context.reliabilityScore,
      noShowCount90d: undefined, // Would query database
      cancellationCount90d: undefined, // Would query database
      rejectionCount30d: context.recentRejectionCount,
    };
  }

  private computeClientFeatures(client: any, shift?: OpenShift | null): Partial<MLMatchFeatures> {
    return {
      clientHasSpecialNeeds: client.special_needs?.length > 0,
      requiredSkills: shift?.requiredSkills || client.required_skills || [],
      requiredCertifications: shift?.requiredCertifications || client.required_certifications || [],
      genderPreference: shift?.genderPreference || client.gender_preference,
      languagePreference: shift?.languagePreference || client.language_preference,
    };
  }

  private async computeHistoricalFeatures(
    caregiverId: string,
    _clientId: string
  ): Promise<Partial<MLMatchFeatures>> {
    // Query historical visit data
    const historicalData = await this.db('match_outcomes')
      .where('caregiver_id', caregiverId)
      .where('outcome', 'COMPLETED')
      .select(
        this.db.raw('AVG(caregiver_rating) as avg_rating'),
        this.db.raw('COUNT(*) as total_visits'),
        this.db.raw('SUM(CASE WHEN was_successful THEN 1 ELSE 0 END)::float / COUNT(*) as completion_rate'),
        this.db.raw('SUM(CASE WHEN actual_start <= scheduled_start + interval \'15 minutes\' THEN 1 ELSE 0 END)::float / COUNT(*) as on_time_rate')
      )
      .first();

    return {
      caregiverAvgRating: historicalData?.avg_rating,
      totalCompletedVisits: historicalData?.total_visits || 0,
      completionRate: historicalData?.completion_rate,
      onTimeRate: historicalData?.on_time_rate,
    };
  }

  private computeInteractionFeatures(
    caregiver: Caregiver,
    client: any,
    shift: OpenShift | null | undefined,
    context: CaregiverContext
  ): Partial<MLMatchFeatures> {
    const preferredCaregivers = shift?.preferredCaregivers || client.preferred_caregivers || [];
    const blockedCaregivers = shift?.blockedCaregivers || client.blocked_caregivers || [];

    const isPreferred = preferredCaregivers.includes(caregiver.id);
    const isBlocked = blockedCaregivers.includes(caregiver.id);

    let mutualPreferenceScore = 0;
    if (isPreferred) mutualPreferenceScore += 50;
    if (isBlocked) mutualPreferenceScore -= 100;
    if (context.clientRating && context.clientRating >= 4.5) mutualPreferenceScore += 30;

    return {
      isPreferredCaregiver: isPreferred,
      isBlockedCaregiver: isBlocked,
      mutualPreferenceScore,
    };
  }

  // ============================================================================
  // Helper methods
  // ============================================================================

  private async fetchCaregiver(caregiverId: string): Promise<Caregiver> {
    const caregiver = await this.db('caregivers')
      .where('id', caregiverId)
      .first();
    if (!caregiver) {
      throw new Error(`Caregiver ${caregiverId} not found`);
    }
    return caregiver;
  }

  private async fetchClient(clientId: string): Promise<any> {
    const client = await this.db('clients')
      .where('id', clientId)
      .first();
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }
    return client;
  }

  private async fetchShift(shiftId: string): Promise<OpenShift | null> {
    const shift = await this.db('open_shifts')
      .where('id', shiftId)
      .first();
    return shift || null;
  }

  private async buildCaregiverContext(
    caregiverId: string,
    _clientId: string,
    _shift?: OpenShift | null
  ): Promise<CaregiverContext> {
    // This would use the existing context building logic from the matching service
    // For now, returning minimal context
    const caregiver = await this.fetchCaregiver(caregiverId);

    return {
      caregiver,
      currentWeekHours: 0,
      conflictingVisits: [],
      previousVisitsWithClient: 0,
      reliabilityScore: 0,
      recentRejectionCount: 0,
    };
  }

  private computeExperienceScore(caregiver: Caregiver): number {
    // Simplified experience scoring
    const yearsExperience = caregiver.yearsOfExperience || 0;
    return Math.min(100, yearsExperience * 10);
  }

  private computePreferenceScore(
    caregiver: Caregiver,
    client: any,
    shift?: OpenShift | null
  ): number {
    let score = 50; // Neutral starting point

    // Gender preference
    if (shift?.genderPreference && shift.genderPreference !== 'NO_PREFERENCE') {
      if (caregiver.gender === shift.genderPreference) {
        score += 25;
      } else {
        score -= 25;
      }
    }

    // Language preference
    const clientLanguage = shift?.languagePreference || client.language_preference;
    if (clientLanguage && caregiver.languages) {
      const speaksLanguage = caregiver.languages.some(
        (lang: any) => lang.language === clientLanguage
      );
      if (speaksLanguage) {
        score += 25;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private computeDaysSinceLastVisit(_caregiverId: string, _clientId: string): number | undefined {
    // Would query the database for the most recent visit
    // Placeholder implementation
    return undefined;
  }

  private isHoliday(date: Date): boolean {
    // Simplified holiday check - would use a proper holiday library
    const month = date.getMonth();
    const day = date.getDate();

    // Check for major US holidays
    const holidays = [
      { month: 0, day: 1 },   // New Year's Day
      { month: 6, day: 4 },   // Independence Day
      { month: 11, day: 25 }, // Christmas
    ];

    return holidays.some((h) => h.month === month && h.day === day);
  }

  private checkPreferredArea(_caregiver: Caregiver, _client: any): boolean {
    // Would check if client's location is in caregiver's preferred areas
    // Placeholder implementation
    return false;
  }
}
