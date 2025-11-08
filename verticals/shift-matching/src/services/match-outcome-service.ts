/**
 * Match Outcome Service
 *
 * Tracks and records the outcomes of shift matches for ML training
 */

// Database type - using any for now as this vertical uses pg.Pool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { type MatchOutcomeRecord, type MatchOutcome, type MatchOutcomeInput } from '../types/ml-types';

export class MatchOutcomeService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: any) {}

  /**
   * Record a match outcome
   */
  async recordOutcome(input: MatchOutcomeInput): Promise<string> {
    const wasSuccessful = this.determineSuccess(input.outcome);

    const [result] = await this.db('match_outcomes')
      .insert({
        organization_id: await this.getOrganizationId(input.visitId),
        branch_id: await this.getBranchId(input.visitId),
        visit_id: input.visitId,
        caregiver_id: input.caregiverId,
        client_id: input.clientId,
        outcome: input.outcome,
        was_successful: wasSuccessful,
        scheduled_start: input.scheduledStart,
        scheduled_end: input.scheduledEnd,
        actual_start: input.actualStart,
        actual_end: input.actualEnd,
        client_rating: input.clientRating,
        caregiver_rating: input.caregiverRating,
        match_score: input.matchScore,
        created_by: 'system', // Would come from context
        updated_by: 'system',
      })
      .returning('id');

    return result.id;
  }

  /**
   * Update an existing outcome with additional information
   */
  async updateOutcome(
    outcomeId: string,
    updates: Partial<MatchOutcomeRecord>
  ): Promise<void> {
    const updateData: any = {
      updated_at: new Date(),
      updated_by: 'system',
    };

    if (updates.outcome !== undefined) {
      updateData.outcome = updates.outcome;
      updateData.was_successful = this.determineSuccess(updates.outcome);
    }

    if (updates.actualStart !== undefined) updateData.actual_start = updates.actualStart;
    if (updates.actualEnd !== undefined) updateData.actual_end = updates.actualEnd;
    if (updates.clientRating !== undefined) updateData.client_rating = updates.clientRating;
    if (updates.caregiverRating !== undefined) updateData.caregiver_rating = updates.caregiverRating;
    if (updates.incidentNotes !== undefined) updateData.incident_notes = updates.incidentNotes;
    if (updates.hadIncident !== undefined) updateData.had_incident = updates.hadIncident;
    if (updates.tasksCompleted !== undefined) updateData.tasks_completed = updates.tasksCompleted;

    await this.db('match_outcomes')
      .where('id', outcomeId)
      .update(updateData);
  }

  /**
   * Record outcome from visit completion
   */
  async recordFromVisit(visitId: string): Promise<string | null> {
    // Fetch visit data
    const visit = await this.db('visits')
      .where('id', visitId)
      .first();

    if (!visit) {
      console.error(`Visit ${visitId} not found`);
      return null;
    }

    // Check if outcome already recorded
    const existing = await this.db('match_outcomes')
      .where('visit_id', visitId)
      .first();

    if (existing) {
      // Update existing outcome
      await this.updateOutcome(existing.id, {
        outcome: this.mapVisitStatusToOutcome(visit.status),
        actualStart: visit.actual_start,
        actualEnd: visit.actual_end,
      });
      return existing.id;
    }

    // Create new outcome
    return this.recordOutcome({
      visitId,
      caregiverId: visit.caregiver_id,
      clientId: visit.client_id,
      outcome: this.mapVisitStatusToOutcome(visit.status),
      scheduledStart: visit.scheduled_start,
      scheduledEnd: visit.scheduled_end,
      actualStart: visit.actual_start,
      actualEnd: visit.actual_end,
    });
  }

  /**
   * Get outcomes for a caregiver-client pair
   */
  async getOutcomes(
    caregiverId: string,
    clientId: string
  ): Promise<MatchOutcomeRecord[]> {
    const outcomes = await this.db('match_outcomes')
      .where('caregiver_id', caregiverId)
      .where('client_id', clientId)
      .orderBy('scheduled_start', 'desc');

    return outcomes.map(this.mapDbToOutcome);
  }

  /**
   * Get success rate for a caregiver-client pair
   */
  async getSuccessRate(
    caregiverId: string,
    clientId: string
  ): Promise<number> {
    const result = await this.db('match_outcomes')
      .where('caregiver_id', caregiverId)
      .where('client_id', clientId)
      .select(
        this.db.raw('SUM(CASE WHEN was_successful THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate')
      )
      .first();

    return result?.success_rate || 0;
  }

  /**
   * Get no-show rate for a caregiver
   */
  async getNoShowRate(
    caregiverId: string,
    days: number = 90
  ): Promise<number> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const result = await this.db('match_outcomes')
      .where('caregiver_id', caregiverId)
      .where('scheduled_start', '>=', sinceDate)
      .select(
        this.db.raw('SUM(CASE WHEN outcome = \'NO_SHOW_CAREGIVER\' THEN 1 ELSE 0 END)::float / COUNT(*) as no_show_rate')
      )
      .first();

    return result?.no_show_rate || 0;
  }

  /**
   * Get completion rate for a caregiver
   */
  async getCompletionRate(
    caregiverId: string,
    days: number = 90
  ): Promise<number> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const result = await this.db('match_outcomes')
      .where('caregiver_id', caregiverId)
      .where('scheduled_start', '>=', sinceDate)
      .select(
        this.db.raw('SUM(CASE WHEN outcome = \'COMPLETED\' THEN 1 ELSE 0 END)::float / COUNT(*) as completion_rate')
      )
      .first();

    return result?.completion_rate || 0;
  }

  /**
   * Get average rating for a caregiver from a specific client
   */
  async getAverageClientRating(
    caregiverId: string,
    clientId: string
  ): Promise<number | null> {
    const result = await this.db('match_outcomes')
      .where('caregiver_id', caregiverId)
      .where('client_id', clientId)
      .whereNotNull('caregiver_rating')
      .avg('caregiver_rating as avg_rating')
      .first();

    return result?.avg_rating || null;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private determineSuccess(outcome: MatchOutcome): boolean {
    return outcome === 'COMPLETED';
  }

  private mapVisitStatusToOutcome(visitStatus: string): MatchOutcome {
    const statusMap: Record<string, MatchOutcome> = {
      COMPLETED: 'COMPLETED',
      NO_SHOW: 'NO_SHOW_CAREGIVER',
      CANCELLED: 'CANCELLED_CAREGIVER',
      IN_PROGRESS: 'IN_PROGRESS',
      SCHEDULED: 'SCHEDULED',
    };

    return statusMap[visitStatus] || 'COMPLETED';
  }

  private async getOrganizationId(visitId: string): Promise<string> {
    const visit = await this.db('visits')
      .where('id', visitId)
      .select('organization_id')
      .first();

    return visit?.organization_id;
  }

  private async getBranchId(visitId: string): Promise<string> {
    const visit = await this.db('visits')
      .where('id', visitId)
      .select('branch_id')
      .first();

    return visit?.branch_id;
  }

  private mapDbToOutcome(dbOutcome: any): MatchOutcomeRecord {
    return {
      id: dbOutcome.id,
      organizationId: dbOutcome.organization_id,
      branchId: dbOutcome.branch_id,
      visitId: dbOutcome.visit_id,
      openShiftId: dbOutcome.open_shift_id,
      assignmentProposalId: dbOutcome.assignment_proposal_id,
      caregiverId: dbOutcome.caregiver_id,
      clientId: dbOutcome.client_id,
      matchScore: dbOutcome.match_score,
      matchQuality: dbOutcome.match_quality,
      matchReasons: dbOutcome.match_reasons,
      outcome: dbOutcome.outcome,
      wasSuccessful: dbOutcome.was_successful,
      scheduledStart: dbOutcome.scheduled_start,
      scheduledEnd: dbOutcome.scheduled_end,
      actualStart: dbOutcome.actual_start,
      actualEnd: dbOutcome.actual_end,
      clientRating: dbOutcome.client_rating,
      caregiverRating: dbOutcome.caregiver_rating,
      tasksCompleted: dbOutcome.tasks_completed,
      incidentNotes: dbOutcome.incident_notes,
      hadIncident: dbOutcome.had_incident,
      responseTimeMinutes: dbOutcome.response_time_minutes,
      assignmentAttemptNumber: dbOutcome.assignment_attempt_number,
      caregiverContext: dbOutcome.caregiver_context,
      clientContext: dbOutcome.client_context,
      distanceMiles: dbOutcome.distance_miles,
      travelTimeMinutes: dbOutcome.travel_time_minutes,
      createdAt: dbOutcome.created_at,
      createdBy: dbOutcome.created_by,
      updatedAt: dbOutcome.updated_at,
      updatedBy: dbOutcome.updated_by,
    };
  }
}
