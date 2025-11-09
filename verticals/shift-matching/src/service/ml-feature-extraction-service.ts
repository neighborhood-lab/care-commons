import { Knex } from 'knex';
import { MLFeatureVector } from '../types/ml-matching';
import { MatchCandidate, OpenShift } from '../types/shift-matching';

/**
 * Service for extracting ML features from shift matching context
 */
export class MLFeatureExtractionService {
  constructor(private db: Knex) {}

  /**
   * Extract feature vector from a match candidate and shift
   */
  async extractFeatures(
    candidate: MatchCandidate,
    shift: OpenShift,
    additionalData?: {
      caregiver_acceptance_rate_30d?: number;
      caregiver_no_show_rate_30d?: number;
      competing_caregivers_count?: number;
      recent_rejection_count?: number;
    }
  ): Promise<MLFeatureVector> {
    // Parse shift time
    const shiftDate = new Date(shift.scheduledDate);
    const shiftStart = this.parseTime(shift.startTime);
    const dayOfWeek = shiftDate.getDay();
    const hourOfDay = shiftStart.hours;

    // Calculate time to shift
    const now = new Date();
    const shiftDateTime = new Date(shiftDate);
    shiftDateTime.setHours(shiftStart.hours, shiftStart.minutes);
    const timeToShiftHours = (shiftDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Determine shift characteristics
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isEvening = hourOfDay >= 17 && hourOfDay < 22;
    const isNight = hourOfDay >= 22 || hourOfDay < 6;

    // Calculate shift duration
    const shiftEnd = this.parseTime(shift.endTime);
    const shiftDurationHours = this.calculateDuration(shiftStart, shiftEnd);

    // Get caregiver info
    const caregiver = await this.db('caregivers')
      .where({ id: candidate.caregiverId })
      .first();

    // Caregiver experience
    const caregiverExperienceYears = caregiver?.hire_date
      ? (now.getTime() - new Date(caregiver.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 0;

    // Get caregiver statistics
    const caregiverStats = await this.getCaregiverStatistics(candidate.caregiverId);

    // Client characteristics
    const requiresSpecializedSkills = Boolean(shift.requiredSkills && shift.requiredSkills.length > 0);
    const hasGenderPreference = Boolean(shift.genderPreference !== null && shift.genderPreference !== undefined);
    const hasLanguagePreference = Boolean(shift.languagePreference !== null && shift.languagePreference !== undefined);

    const features: MLFeatureVector = {
      // Original rule-based scores
      skill_match: candidate.scores.skillMatch,
      availability_match: candidate.scores.availabilityMatch,
      proximity_match: candidate.scores.proximityMatch,
      preference_match: candidate.scores.preferenceMatch,
      experience_match: candidate.scores.experienceMatch,
      reliability_match: candidate.scores.reliabilityMatch,
      compliance_match: candidate.scores.complianceMatch,
      capacity_match: candidate.scores.capacityMatch,

      // Derived features
      distance_miles: candidate.distanceFromShift || 0,
      estimated_travel_minutes: candidate.estimatedTravelTime || 0,
      previous_visits_with_client: candidate.previousVisitsWithClient || 0,
      caregiver_reliability_score: caregiver?.reliability_score || 50,
      caregiver_weekly_hours: 0, // Would need to calculate
      caregiver_weekly_utilization: 0, // Would need to calculate
      shift_duration_hours: shiftDurationHours,
      is_weekend: isWeekend,
      is_evening: isEvening,
      is_night: isNight,
      day_of_week: dayOfWeek,
      hour_of_day: hourOfDay,

      // Caregiver characteristics
      caregiver_experience_years: Math.round(caregiverExperienceYears * 10) / 10,
      caregiver_total_clients: caregiverStats.total_clients,
      caregiver_acceptance_rate_30d: (additionalData?.caregiver_acceptance_rate_30d ?? caregiverStats.acceptance_rate_30d),
      caregiver_no_show_rate_30d: (additionalData?.caregiver_no_show_rate_30d ?? caregiverStats.no_show_rate_30d),
      caregiver_avg_rating: caregiverStats.avg_rating,

      // Client characteristics
      client_total_visits: caregiverStats.client_total_visits,
      client_avg_caregiver_rating: caregiverStats.client_avg_caregiver_rating,
      requires_specialized_skills: requiresSpecializedSkills,
      has_gender_preference: hasGenderPreference,
      has_language_preference: hasLanguagePreference,

      // Contextual features
      time_to_shift_hours: Math.max(0, timeToShiftHours),
      competing_caregivers_count: additionalData?.competing_caregivers_count ?? 0,
      shift_priority: this.priorityToNumber(shift.priority),
      is_recurring_visit: false, // NOTE: Future enhancement - determine from visit recurrence
      recent_rejection_count: additionalData?.recent_rejection_count ?? 0,
    };

    return features;
  }

  /**
   * Convert priority string to number for ML
   */
  private priorityToNumber(priority: string): number {
    const priorityMap: Record<string, number> = {
      'LOW': 1,
      'NORMAL': 3,
      'HIGH': 4,
      'URGENT': 5,
    };
    return priorityMap[priority] ?? 3;
  }

  /**
   * Extract features for batch predictions
   */
  async extractFeaturesForBatch(
    candidates: MatchCandidate[],
    shift: OpenShift
  ): Promise<Map<string, MLFeatureVector>> {
    const results = new Map<string, MLFeatureVector>();

    // Get competing caregivers count
    const competingCaregiversCount = candidates.length;

    // Process each candidate
    for (const candidate of candidates) {
      const features = await this.extractFeatures(candidate, shift, {
        competing_caregivers_count: competingCaregiversCount,
      });
      results.set(candidate.caregiverId, features);
    }

    return results;
  }

  /**
   * Create training data point from completed shift
   */
  async createTrainingDataPoint(
    openShiftId: string,
    caregiverId: string,
    visitId: string,
    features: MLFeatureVector,
    ruleBasedScore: number,
    matchQuality: string,
    outcome: {
      was_accepted: boolean;
      was_completed?: boolean;
      was_no_show?: boolean;
      was_late?: boolean;
      client_satisfaction_rating?: number;
      response_time_minutes?: number;
    }
  ): Promise<void> {
    // Get organization_id from open_shift
    const shift = await this.db('open_shifts')
      .where({ id: openShiftId })
      .first();

    if (!shift) {
      throw new Error(`Open shift ${openShiftId} not found`);
    }

    await this.db('ml_training_data').insert({
      organization_id: shift.organization_id,
      open_shift_id: openShiftId,
      caregiver_id: caregiverId,
      visit_id: visitId,
      features: JSON.stringify(features),
      was_accepted: outcome.was_accepted,
      was_completed: outcome.was_completed ?? null,
      was_no_show: outcome.was_no_show ?? null,
      was_late: outcome.was_late ?? null,
      client_satisfaction_rating: outcome.client_satisfaction_rating ?? null,
      response_time_minutes: outcome.response_time_minutes ?? null,
      rule_based_score: ruleBasedScore,
      match_quality: matchQuality,
      matched_at: new Date(),
      shift_completed_at: outcome.was_completed ? new Date(shift.scheduled_date) : null,
    });
  }

  /**
   * Get training dataset for model training
   */
  async getTrainingDataset(filters?: {
    organization_id?: string;
    min_date?: Date;
    max_date?: Date;
    include_incomplete?: boolean;
    limit?: number;
  }): Promise<Array<{
    features: MLFeatureVector;
    label: number;
    weight?: number;
  }>> {
    let query = this.db('ml_training_data')
      .whereNull('deleted_at');

    if (filters?.organization_id) {
      query = query.where('organization_id', filters.organization_id);
    }

    if (filters?.min_date) {
      query = query.where('matched_at', '>=', filters.min_date);
    }

    if (filters?.max_date) {
      query = query.where('matched_at', '<=', filters.max_date);
    }

    if (!filters?.include_incomplete) {
      query = query.whereNotNull('was_completed');
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const rows = await query.orderBy('matched_at', 'desc');

    return rows.map((row: any) => {
      // Parse features from JSONB
      const features = typeof row.features === 'string'
        ? JSON.parse(row.features)
        : row.features;

      // Calculate label based on outcome
      // For match_success: accept + complete + no no-show
      const label = row.was_accepted && row.was_completed && !row.was_no_show ? 1 : 0;

      // Weight by recency (more recent = higher weight)
      const daysSince = (Date.now() - new Date(row.matched_at).getTime()) / (1000 * 60 * 60 * 24);
      const weight = Math.exp(-daysSince / 90); // Exponential decay with 90-day half-life

      return {
        features,
        label,
        weight,
      };
    });
  }

  /**
   * Update training data with visit outcome
   */
  async updateTrainingDataWithOutcome(
    visitId: string,
    outcome: {
      was_completed: boolean;
      was_no_show?: boolean;
      was_late?: boolean;
      client_satisfaction_rating?: number;
    }
  ): Promise<void> {
    // Get the visit completion date
    const visit = await this.db('visits')
      .where({ id: visitId })
      .first('scheduled_date');

    await this.db('ml_training_data')
      .where({ visit_id: visitId })
      .update({
        was_completed: outcome.was_completed,
        was_no_show: outcome.was_no_show ?? false,
        was_late: outcome.was_late ?? false,
        client_satisfaction_rating: outcome.client_satisfaction_rating ?? null,
        shift_completed_at: outcome.was_completed && visit ? new Date(visit.scheduled_date) : null,
        updated_at: new Date(),
      });
  }

  /**
   * Get caregiver statistics for feature extraction
   */
  private async getCaregiverStatistics(caregiverId: string): Promise<{
    total_clients: number;
    acceptance_rate_30d: number;
    no_show_rate_30d: number;
    avg_rating: number;
    client_total_visits: number;
    client_avg_caregiver_rating: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get proposal statistics
    const proposalStats = await this.db('assignment_proposals as ap')
      .where('ap.caregiver_id', caregiverId)
      .where('ap.created_at', '>=', thirtyDaysAgo)
      .select(
        this.db.raw('COUNT(*) as total_proposals'),
        this.db.raw("COUNT(*) FILTER (WHERE ap.proposal_status = 'ACCEPTED') as accepted_proposals")
      )
      .first();

    const acceptanceRate = proposalStats?.total_proposals > 0
      ? (proposalStats.accepted_proposals / proposalStats.total_proposals) * 100
      : 50;

    // Get visit statistics
    const visitStats = await this.db('visits as v')
      .where('v.assigned_caregiver_id', caregiverId)
      .where('v.status', 'COMPLETED')
      .where('v.scheduled_date', '>=', thirtyDaysAgo)
      .select(
        this.db.raw('COUNT(*) as total_visits'),
        this.db.raw('COUNT(*) FILTER (WHERE v.was_no_show = true) as no_shows'),
        this.db.raw('AVG(v.client_satisfaction_rating) as avg_rating')
      )
      .first();

    const noShowRate = visitStats?.total_visits > 0
      ? (visitStats.no_shows / visitStats.total_visits) * 100
      : 0;

    // Get unique clients
    const clientCount = await this.db('visits')
      .where('assigned_caregiver_id', caregiverId)
      .countDistinct('client_id as count')
      .first();

    // Get client statistics (for current context - would need client_id)
    const clientStats = {
      client_total_visits: 0,
      client_avg_caregiver_rating: 3.0,
    };

    return {
      total_clients: clientCount?.count ? Number(clientCount.count) : 0,
      acceptance_rate_30d: acceptanceRate,
      no_show_rate_30d: noShowRate,
      avg_rating: visitStats?.avg_rating ? Number(visitStats.avg_rating) : 3.0,
      client_total_visits: clientStats.client_total_visits,
      client_avg_caregiver_rating: clientStats.client_avg_caregiver_rating,
    };
  }

  /**
   * Parse time string (HH:MM or HH:MM:SS)
   */
  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0] || '0', 10),
      minutes: parseInt(parts[1] || '0', 10),
    };
  }

  /**
   * Calculate duration between two times in hours
   */
  private calculateDuration(
    start: { hours: number; minutes: number },
    end: { hours: number; minutes: number }
  ): number {
    let duration = (end.hours - start.hours) + (end.minutes - start.minutes) / 60;
    if (duration < 0) {
      duration += 24; // Handle overnight shifts
    }
    return duration;
  }
}
