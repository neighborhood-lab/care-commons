/**
 * API Handlers for Shift Matching & Assignment
 * 
 * HTTP request handlers for:
 * - Scheduler operations (create open shifts, run matching, review candidates)
 * - Caregiver self-service (browse available shifts, accept/reject proposals)
 * - Administrative functions (configure matching rules, view analytics)
 */

import { UserContext, PaginationParams } from '@care-commons/core';
import { ShiftMatchingService } from '../service/shift-matching-service';
import { ShiftMatchingRepository } from '../repository/shift-matching-repository';
import { MatchingAlgorithm } from '../utils/matching-algorithm';
import {
  CreateOpenShiftInput,
  MatchShiftInput,
  CreateProposalInput,
  RespondToProposalInput,
  UpdateCaregiverPreferencesInput,
  OpenShiftFilters,
  ProposalFilters,
} from '../types/shift-matching';

/**
 * Handler responses - these would be serialized to JSON in actual HTTP handlers
 */

export class ShiftMatchingHandlers {
  private service: ShiftMatchingService;
  private repository: ShiftMatchingRepository;
  private pool: import('pg').Pool;

  constructor(pool: import('pg').Pool) {
    this.pool = pool;
    this.service = new ShiftMatchingService(pool);
    this.repository = new ShiftMatchingRepository(pool);
  }

  /**
   * ==========================================================================
   * SCHEDULER OPERATIONS
   * ==========================================================================
   */

  /**
   * POST /shifts/open
   * Create an open shift from an unassigned visit
   */
  async createOpenShift(input: CreateOpenShiftInput, context: UserContext) {
    return this.service.createOpenShift(input, context);
  }

  /**
   * POST /shifts/open/:id/match
   * Run matching algorithm for an open shift
   * 
   * Request body:
   * {
   *   "configurationId": "uuid",  // optional
   *   "maxCandidates": 5,          // optional
   *   "autoPropose": true          // optional, auto-send proposals to top matches
   * }
   */
  async matchOpenShift(
    openShiftId: string,
    input: Partial<MatchShiftInput>,
    context: UserContext
  ) {
    const matchInput: MatchShiftInput = {
      openShiftId,
      ...input,
    };

    return this.service.matchShift(matchInput, context);
  }

  /**
   * GET /shifts/open
   * Search for open shifts needing assignment
   */
  async searchOpenShifts(
    filters: OpenShiftFilters,
    pagination: PaginationParams,
    _context: UserContext
  ) {
    return this.repository.searchOpenShifts(filters, pagination);
  }

  /**
   * GET /shifts/open/:id
   * Get details of a specific open shift
   */
  async getOpenShift(openShiftId: string, _context: UserContext) {
    return this.repository.getOpenShift(openShiftId);
  }

  /**
   * GET /shifts/open/:id/proposals
   * Get all proposals for an open shift
   */
  async getProposalsForShift(openShiftId: string, _context: UserContext) {
    return this.repository.getProposalsByOpenShift(openShiftId);
  }

  /**
   * POST /proposals/:id/create
   * Manually create a proposal for a specific caregiver
   */
  async createManualProposal(
    input: CreateProposalInput,
    context: UserContext
  ) {
    // For manual proposals, create a minimal candidate since we're bypassing the algorithm
    const manualCandidate: any = {
        caregiverId: input.caregiverId,
        openShiftId: input.openShiftId,
        caregiverName: '',
        caregiverPhone: '',
        employmentType: '',
        overallScore: 100, // Manual proposals get perfect score
        matchQuality: 'EXCELLENT' as const,
        scores: {
          skillMatch: 100,
          availabilityMatch: 100,
          proximityMatch: 100,
          preferenceMatch: 100,
          experienceMatch: 100,
          reliabilityMatch: 100,
          complianceMatch: 100,
          capacityMatch: 100,
        },
        isEligible: true,
        eligibilityIssues: [],
        warnings: [],
        hasConflict: false,
        availableHours: 0,
        matchReasons: [{
          category: 'SYSTEM_OPTIMIZED',
          description: 'Manual assignment',
          impact: 'POSITIVE',
          weight: 0,
        }],
        computedAt: new Date() as any,
      } as any;





    return this.service.createProposal(input, manualCandidate, context);
  }

  /**
   * POST /proposals/:id/respond
   * Scheduler or admin responds to a proposal on behalf of caregiver
   */
  async respondToProposal(
    proposalId: string,
    input: RespondToProposalInput,
    context: UserContext
  ) {
    return this.service.respondToProposal(proposalId, input, context);
  }

  /**
   * GET /proposals
   * Search all proposals with filters
   */
  async searchProposals(
    filters: ProposalFilters,
    pagination: PaginationParams,
    _context: UserContext
  ) {
    return this.repository.searchProposals(filters, pagination);
  }

  /**
   * ==========================================================================
   * CAREGIVER SELF-SERVICE
   * ==========================================================================
   */

  /**
   * GET /caregiver/shifts/available
   * Get shifts available for the current caregiver to claim
   */
  async getAvailableShifts(caregiverId: string, context: UserContext) {
    return this.service.getAvailableShiftsForCaregiver(caregiverId, context);
  }

  /**
   * GET /caregiver/proposals
   * Get all proposals sent to the current caregiver
   */
  async getCaregiverProposals(
    caregiverId: string,
    statuses: string[] | undefined,
    _context: UserContext
  ) {
    return this.service.getCaregiverProposals(
      caregiverId,
      statuses as any
    );
  }

  /**
   * POST /caregiver/proposals/:id/view
   * Mark a proposal as viewed by caregiver
   */
  async markProposalViewed(proposalId: string, context: UserContext) {
    return this.service.markProposalViewed(proposalId, context);
  }

  /**
   * POST /caregiver/proposals/:id/accept
   * Caregiver accepts a shift proposal
   */
  async acceptProposal(proposalId: string, notes: string | undefined, context: UserContext) {
    return this.service.respondToProposal(
      proposalId,
      {
        proposalId,
        accept: true,
        responseMethod: 'WEB',
        notes,
      },
      context
    );
  }

  /**
   * POST /caregiver/proposals/:id/reject
   * Caregiver rejects a shift proposal
   */
  async rejectProposal(
    proposalId: string,
    rejectionReason: string,
    rejectionCategory: string,
    notes: string | undefined,
    context: UserContext
  ) {
    return this.service.respondToProposal(
      proposalId,
      {
        proposalId,
        accept: false,
        rejectionReason,
        rejectionCategory: rejectionCategory as any,
        responseMethod: 'WEB',
        notes,
      },
      context
    );
  }

  /**
   * POST /caregiver/shifts/:id/claim
   * Caregiver self-selects an available shift
   */
  async claimShift(
    openShiftId: string,
    caregiverId: string,
    context: UserContext
  ) {
    return this.service.caregiverSelectShift(caregiverId, openShiftId, context);
  }

  /**
   * PUT /caregiver/preferences
   * Update caregiver shift preferences
   */
  async updateCaregiverPreferences(
    caregiverId: string,
    input: UpdateCaregiverPreferencesInput,
    context: UserContext
  ) {
    return this.repository.upsertCaregiverPreferences(
      caregiverId,
      context.organizationId,
      input,
      context
    );
  }

  /**
   * GET /caregiver/preferences
   * Get caregiver shift preferences
   */
  async getCaregiverPreferences(caregiverId: string, _context: UserContext) {
    return this.repository.getCaregiverPreferences(caregiverId);
  }

  /**
   * ==========================================================================
   * CONFIGURATION & ADMIN
   * ==========================================================================
   */

  /**
   * POST /configurations
   * Create a new matching configuration
   */
  async createConfiguration(input: any, context: UserContext) {
    return this.repository.createMatchingConfiguration(input, context);
  }

  /**
   * GET /configurations/:id
   * Get a specific matching configuration
   */
  async getConfiguration(configId: string, _context: UserContext) {
    return this.repository.getMatchingConfiguration(configId);
  }

  /**
   * PUT /configurations/:id
   * Update a matching configuration
   */
  async updateConfiguration(configId: string, input: any, context: UserContext) {
    return this.repository.updateMatchingConfiguration(configId, input, context);
  }

  /**
   * GET /configurations/default
   * Get the default configuration for an organization/branch
   */
  async getDefaultConfiguration(
    organizationId: string,
    branchId: string | undefined,
    _context: UserContext
  ) {
    return this.repository.getDefaultConfiguration(organizationId, branchId);
  }

  /**
   * POST /admin/expire-stale-proposals
   * Manually trigger expiration of old proposals
   */
  async expireStaleProposals(context: UserContext) {
    const count = await this.service.expireStaleProposals(context);
    return {
      success: true,
      expiredCount: count,
      message: `Expired ${count} stale proposal(s)`,
    };
  }

  /**
   * ==========================================================================
   * ANALYTICS & REPORTING
   * ==========================================================================
   */

  /**
   * GET /analytics/matching-metrics
   * Get matching performance metrics for a time period
   */
  async getMatchingMetrics(
    periodStart: Date,
    periodEnd: Date,
    _context: UserContext
  ) {
    // This would query match_history and generate metrics
    // Simplified implementation for now
    const result = await this.pool.query(
      `
      SELECT 
        COUNT(DISTINCT open_shift_id) as total_open_shifts,
        COUNT(DISTINCT open_shift_id) FILTER (WHERE outcome = 'ACCEPTED') as shifts_matched,
        COUNT(DISTINCT open_shift_id) FILTER (WHERE outcome = 'NO_CANDIDATES') as shifts_unmatched,
        AVG(match_score) FILTER (WHERE match_score IS NOT NULL) as average_match_score,
        AVG(response_time_minutes) FILTER (WHERE response_time_minutes IS NOT NULL) as average_response_time,
        COUNT(*) FILTER (WHERE outcome = 'ACCEPTED') as proposals_accepted,
        COUNT(*) FILTER (WHERE outcome = 'REJECTED') as proposals_rejected,
        COUNT(*) FILTER (WHERE outcome = 'EXPIRED') as proposals_expired
      FROM match_history
      WHERE matched_at BETWEEN $1 AND $2
      `,
      [periodStart, periodEnd]
    );

    const row = result.rows[0];

    const totalShifts = parseInt(row.total_open_shifts || '0', 10);
    const matched = parseInt(row.shifts_matched || '0', 10);

    return {
      periodStart,
      periodEnd,
      totalOpenShifts: totalShifts,
      shiftsMatched: matched,
      shiftsUnmatched: parseInt(row.shifts_unmatched || '0', 10),
      matchRate: totalShifts > 0 ? (matched / totalShifts) * 100 : 0,
      averageMatchScore: parseFloat(row.average_match_score || '0'),
      averageResponseTimeMinutes: parseFloat(row.average_response_time || '0'),
      proposalsAccepted: parseInt(row.proposals_accepted || '0', 10),
      proposalsRejected: parseInt(row.proposals_rejected || '0', 10),
      proposalsExpired: parseInt(row.proposals_expired || '0', 10),
    };
  }

  /**
   * GET /analytics/caregiver-performance/:id
   * Get matching performance for a specific caregiver
   */
  async getCaregiverPerformance(
    caregiverId: string,
    periodStart: Date,
    periodEnd: Date,
    _context: UserContext
  ) {
    const result = await this.pool.query(
      `
      SELECT 
        COUNT(*) FILTER (WHERE outcome = 'PROPOSED') as proposals_received,
        COUNT(*) FILTER (WHERE outcome = 'ACCEPTED') as proposals_accepted,
        COUNT(*) FILTER (WHERE outcome = 'REJECTED') as proposals_rejected,
        COUNT(*) FILTER (WHERE outcome = 'EXPIRED') as proposals_expired,
        AVG(match_score) as average_match_score,
        AVG(response_time_minutes) FILTER (WHERE response_time_minutes IS NOT NULL) as average_response_time
      FROM match_history
      WHERE caregiver_id = $1
        AND matched_at BETWEEN $2 AND $3
      `,
      [caregiverId, periodStart, periodEnd]
    );

    const row = result.rows[0];
    const proposed = parseInt(row.proposals_received || '0', 10);
    const accepted = parseInt(row.proposals_accepted || '0', 10);

    return {
      caregiverId,
      periodStart,
      periodEnd,
      proposalsReceived: proposed,
      proposalsAccepted: accepted,
      proposalsRejected: parseInt(row.proposals_rejected || '0', 10),
      proposalsExpired: parseInt(row.proposals_expired || '0', 10),
      acceptanceRate: proposed > 0 ? (accepted / proposed) * 100 : 0,
      averageMatchScore: parseFloat(row.average_match_score || '0'),
      averageResponseTimeMinutes: parseFloat(row.average_response_time || '0'),
    };
  }

  /**
   * GET /analytics/rejection-reasons
   * Get top rejection reasons to improve algorithm
   */
  async getTopRejectionReasons(
    periodStart: Date,
    periodEnd: Date,
    _context: UserContext
  ) {
    const result = await this.pool.query(
      `
      SELECT 
        ap.rejection_category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM assignment_proposals ap
      WHERE ap.proposal_status = 'REJECTED'
        AND ap.rejected_at BETWEEN $1 AND $2
        AND ap.rejection_category IS NOT NULL
        AND ap.deleted_at IS NULL
      GROUP BY ap.rejection_category
      ORDER BY count DESC
      LIMIT 10
      `,
      [periodStart, periodEnd]
    );

    return result.rows.map((row) => ({
      category: row.rejection_category,
      count: parseInt(row.count, 10),
      percentage: parseFloat(row.percentage),
    }));
  }
}
