/**
 * Shift Matching Service
 * 
 * Orchestrates intelligent caregiver-to-shift matching by:
 * - Evaluating all eligible caregivers for open shifts
 * - Generating and sending assignment proposals
 * - Managing proposal responses and assignment workflows
 * - Tracking match history and analytics
 */

import { Pool } from 'pg';
import {
  UUID,
  UserContext,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@care-commons/core';
import { ShiftMatchingRepository } from '../repository/shift-matching-repository';
import { MatchingAlgorithm, CaregiverContext } from '../utils/matching-algorithm';
import { CaregiverService } from '@care-commons/caregiver-staff';
import {
  OpenShift,
  MatchCandidate,
  MatchingConfiguration,
  AssignmentProposal,
  CreateOpenShiftInput,
  MatchShiftInput,
  CreateProposalInput,
  RespondToProposalInput,
  ProposalStatus,
  MatchingStatus,
} from '../types/shift-matching';

export interface MatchShiftResult {
  openShift: OpenShift;
  candidates: MatchCandidate[];
  proposalsCreated: AssignmentProposal[];
  eligibleCount: number;
  ineligibleCount: number;
}

export class ShiftMatchingService {
  private repository: ShiftMatchingRepository;
  private caregiverService: CaregiverService;

  constructor(
    private pool: Pool,
    caregiverService?: CaregiverService
  ) {
    this.repository = new ShiftMatchingRepository(pool);
    // CaregiverService requires a Database, but we're passing Pool
    // This is a type issue - in production, wrap Pool in Database class
    this.caregiverService = caregiverService || (new CaregiverService(pool as any));
  }

  /**
   * Create an open shift from an unassigned visit
   */
  async createOpenShift(
    input: CreateOpenShiftInput,
    context: UserContext
  ): Promise<OpenShift> {
    return this.repository.createOpenShift(input, context);
  }

  /**
   * Match caregivers to an open shift and optionally create proposals
   */
  async matchShift(
    input: MatchShiftInput,
    context: UserContext
  ): Promise<MatchShiftResult> {
    // Get the open shift
    const openShift = await this.repository.getOpenShift(input.openShiftId);
    if (!openShift) {
      throw new NotFoundError('Open shift not found', { id: input.openShiftId });
    }

    // Update status to matching
    await this.repository.updateOpenShiftStatus(
      input.openShiftId,
      'MATCHING',
      context
    );

    try {
      // Get matching configuration
      const config = input.configurationId
        ? await this.repository.getMatchingConfiguration(input.configurationId)
        : await this.repository.getDefaultConfiguration(
            context.organizationId,
            openShift.branchId
          );

      if (!config) {
        throw new ValidationError('No matching configuration found. Please create a default configuration first.');
      }

      // Get all active caregivers in the organization
      const allCaregivers = await this.caregiverService.searchCaregivers(
        {
          organizationId: context.organizationId,
          status: ['ACTIVE'],
          branchId: openShift.branchId,
        },
        { page: 1, limit: 1000 },
        context
      );

      // Evaluate each caregiver
      const candidates: MatchCandidate[] = [];
      
      for (const caregiver of allCaregivers.items) {
        // Skip if blocked by client
        if (openShift.blockedCaregivers?.includes(caregiver.id)) {
          continue;
        }

        // Build caregiver context
        const caregiverContext = await this.buildCaregiverContext(
          caregiver.id,
          openShift,
          context
        );

        // Evaluate match
        const candidate = MatchingAlgorithm.evaluateMatch(
          openShift,
          caregiverContext,
          config
        );

        candidates.push(candidate);
      }

      // Rank candidates
      const rankedCandidates = MatchingAlgorithm.rankCandidates(candidates);

      // Filter to eligible candidates meeting minimum score
      const eligibleCandidates = rankedCandidates.filter(
        (c) => c.isEligible && c.overallScore >= config.minScoreForProposal
      );

      const eligibleCount = eligibleCandidates.length;
      const ineligibleCount = candidates.length - eligibleCount;

      // Limit to max proposals
      const maxCandidates = input.maxCandidates || config.maxProposalsPerShift;
      const topCandidates = eligibleCandidates.slice(0, maxCandidates);

      // Update shift status based on results
      let newStatus: MatchingStatus = 'NO_MATCH';
      if (topCandidates.length > 0) {
        newStatus = 'MATCHED';
      }

      await this.repository.updateOpenShiftStatus(
        input.openShiftId,
        newStatus,
        context
      );

      // Create proposals if requested
      const proposalsCreated: AssignmentProposal[] = [];
      
      if (input.autoPropose && topCandidates.length > 0) {
        for (const candidate of topCandidates) {
          const proposal = await this.createProposal(
            {
              openShiftId: input.openShiftId,
              caregiverId: candidate.caregiverId,
              proposalMethod: 'AUTOMATIC',
              sendNotification: true,
              notificationMethod: 'PUSH',
              urgencyFlag: openShift.isUrgent,
            },
            candidate,
            context
          );
          
          proposalsCreated.push(proposal);
        }

        // Update shift status to proposed
        await this.repository.updateOpenShiftStatus(
          input.openShiftId,
          'PROPOSED',
          context
        );
      }

      // Log match history
      await this.repository.createMatchHistory(
        {
          openShiftId: input.openShiftId,
          visitId: openShift.visitId,
          attemptNumber: openShift.matchAttempts,
          outcome: topCandidates.length > 0 ? 'PROPOSED' : 'NO_CANDIDATES',
          configurationId: config.id,
          notes: `Found ${eligibleCount} eligible candidates out of ${candidates.length} total`,
        },
        context
      );

      return {
        openShift: await this.repository.getOpenShift(input.openShiftId) as OpenShift,
        candidates: rankedCandidates,
        proposalsCreated,
        eligibleCount,
        ineligibleCount,
      };
    } catch (error) {
      // Revert status on error
      await this.repository.updateOpenShiftStatus(
        input.openShiftId,
        'NO_MATCH',
        context
      );
      throw error;
    }
  }

  /**
   * Create a proposal for a caregiver-shift pairing
   */
  async createProposal(
    input: CreateProposalInput,
    candidate: MatchCandidate,
    context: UserContext
  ): Promise<AssignmentProposal> {
    const proposal = await this.repository.createProposal(
      input,
      candidate.overallScore,
      candidate.matchQuality,
      candidate.matchReasons,
      context
    );

    // TODO: Send notification to caregiver via notification service
    // This would integrate with a notification system (push, SMS, email)
    if (input.sendNotification) {
      // Mark as sent
      await this.repository.updateProposalStatus(proposal.id, 'SENT', context);
    }

    return proposal;
  }

  /**
   * Caregiver or scheduler responds to a proposal
   */
  async respondToProposal(
    proposalId: UUID,
    input: RespondToProposalInput,
    context: UserContext
  ): Promise<AssignmentProposal> {
    const proposal = await this.repository.getProposal(proposalId);
    if (!proposal) {
      throw new NotFoundError('Proposal not found', { proposalId });
    }

    // Check if proposal is still valid
    if (!['PENDING', 'SENT', 'VIEWED'].includes(proposal.proposalStatus)) {
      throw new ValidationError('Proposal is no longer active', {
        status: proposal.proposalStatus,
      });
    }

    const updatedProposal = await this.repository.respondToProposal(
      proposalId,
      input,
      context
    );

    if (input.accept) {
      // Assign the caregiver to the visit
      await this.assignShift(proposal.visitId, proposal.caregiverId, context);

      // Mark open shift as assigned
      await this.repository.updateOpenShiftStatus(
        proposal.openShiftId,
        'ASSIGNED',
        context
      );

      // Withdraw other pending proposals for this shift
      await this.withdrawOtherProposals(proposal.openShiftId, proposalId, context);

      // Update match history
      await this.repository.createMatchHistory(
        {
          openShiftId: proposal.openShiftId,
          visitId: proposal.visitId,
          caregiverId: proposal.caregiverId,
          attemptNumber: 1,
          matchScore: proposal.matchScore,
          matchQuality: proposal.matchQuality,
          outcome: 'ACCEPTED',
          assignmentProposalId: proposalId,
          assignedSuccessfully: true,
        },
        context
      );
    } else {
      // Log rejection
      await this.repository.createMatchHistory(
        {
          openShiftId: proposal.openShiftId,
          visitId: proposal.visitId,
          caregiverId: proposal.caregiverId,
          attemptNumber: 1,
          matchScore: proposal.matchScore,
          matchQuality: proposal.matchQuality,
          outcome: 'REJECTED',
          assignmentProposalId: proposalId,
          assignedSuccessfully: false,
          rejectionReason: input.rejectionReason,
        },
        context
      );

      // Check if we should try more matches
      const remainingProposals = await this.repository.getProposalsByOpenShift(
        proposal.openShiftId
      );
      const activePending = remainingProposals.filter((p) =>
        ['PENDING', 'SENT', 'VIEWED'].includes(p.proposalStatus)
      );

      if (activePending.length === 0) {
        // No more pending proposals, revert to matched status
        await this.repository.updateOpenShiftStatus(
          proposal.openShiftId,
          'MATCHED',
          context
        );
      }
    }

    return updatedProposal;
  }

  /**
   * Get available shifts for a caregiver (self-selection)
   */
  async getAvailableShiftsForCaregiver(
    caregiverId: UUID,
    context: UserContext
  ): Promise<MatchCandidate[]> {
    // Get open shifts that match caregiver preferences
    const caregiver = await this.caregiverService.getCaregiverById(caregiverId, context);
    if (!caregiver) {
      throw new NotFoundError('Caregiver not found', { caregiverId });
    }

    // Get open shifts in next 7 days
    const dateFrom = new Date();
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + 7);

    const openShifts = await this.repository.searchOpenShifts(
      {
        organizationId: context.organizationId,
        branchIds: [caregiver.primaryBranchId],
        dateFrom,
        dateTo,
        matchingStatus: ['NEW', 'MATCHING', 'MATCHED', 'PROPOSED'],
      },
      { page: 1, limit: 100, sortBy: 'scheduled_date', sortOrder: 'asc' }
    );

    // Get default config
    const config = await this.repository.getDefaultConfiguration(
      context.organizationId,
      caregiver.primaryBranchId
    );

    if (!config) {
      return [];
    }

    // Evaluate caregiver for each shift
    const candidates: MatchCandidate[] = [];

    for (const shift of openShifts.items) {
      // Skip if blocked
      if (shift.blockedCaregivers?.includes(caregiverId)) {
        continue;
      }

      const caregiverContext = await this.buildCaregiverContext(
        caregiverId,
        shift,
        context
      );

      const candidate = MatchingAlgorithm.evaluateMatch(shift, caregiverContext, config);

      // Only show if eligible and meets minimum score
      if (candidate.isEligible && candidate.overallScore >= config.minScoreForProposal) {
        candidates.push(candidate);
      }
    }

    // Rank by score
    return MatchingAlgorithm.rankCandidates(candidates);
  }

  /**
   * Caregiver self-selects a shift
   */
  async caregiverSelectShift(
    caregiverId: UUID,
    openShiftId: UUID,
    context: UserContext
  ): Promise<AssignmentProposal> {
    const openShift = await this.repository.getOpenShift(openShiftId);
    if (!openShift) {
      throw new NotFoundError('Open shift not found', { openShiftId });
    }

    // Verify shift is still available
    if (openShift.matchingStatus === 'ASSIGNED') {
      throw new ConflictError('This shift has already been assigned');
    }

    // Build caregiver context and evaluate
    const caregiverContext = await this.buildCaregiverContext(
      caregiverId,
      openShift,
      context
    );

    const config = await this.repository.getDefaultConfiguration(
      context.organizationId,
      openShift.branchId
    );

    if (!config) {
      throw new ValidationError('No matching configuration found');
    }

    const candidate = MatchingAlgorithm.evaluateMatch(openShift, caregiverContext, config);

    // Check if eligible
    if (!candidate.isEligible) {
      throw new ValidationError('You are not eligible for this shift', {
        reasons: candidate.eligibilityIssues.map((i) => i.message),
      });
    }

    if (candidate.overallScore < config.minScoreForProposal) {
      throw new ValidationError('Your match score is too low for this shift', {
        score: candidate.overallScore,
        minimumRequired: config.minScoreForProposal,
      });
    }

    // Create proposal
    const proposal = await this.repository.createProposal(
      {
        openShiftId,
        caregiverId,
        proposalMethod: 'CAREGIVER_SELF_SELECT',
        sendNotification: false,
      },
      candidate.overallScore,
      candidate.matchQuality,
      candidate.matchReasons,
      context
    );

    // Auto-accept if configured
    const preferences = await this.repository.getCaregiverPreferences(caregiverId);
    if (preferences?.acceptAutoAssignment && candidate.overallScore >= 85) {
      return this.respondToProposal(
        proposal.id,
        {
          proposalId: proposal.id,
          accept: true,
          responseMethod: 'WEB',
        },
        context
      );
    }

    return proposal;
  }

  /**
   * Get proposals for a caregiver (their shift offers)
   */
  async getCaregiverProposals(
    caregiverId: UUID,
    statuses?: ProposalStatus[]
  ): Promise<AssignmentProposal[]> {
    return this.repository.getProposalsByCaregiver(caregiverId, statuses);
  }

  /**
   * Mark proposal as viewed by caregiver
   */
  async markProposalViewed(
    proposalId: UUID,
    context: UserContext
  ): Promise<AssignmentProposal> {
    const proposal = await this.repository.getProposal(proposalId);
    if (!proposal) {
      throw new NotFoundError('Proposal not found', { proposalId });
    }

    if (!proposal.viewedByCaregiver) {
      await this.repository.updateProposalStatus(proposalId, 'VIEWED', context);
    }

    return this.repository.getProposal(proposalId) as Promise<AssignmentProposal>;
  }

  /**
   * Expire old proposals that haven't been responded to
   */
  async expireStaleProposals(context: UserContext): Promise<number> {
    const staleProposals = await this.pool.query(
      `
      SELECT ap.id, ap.open_shift_id, mc.proposal_expiration_minutes
      FROM assignment_proposals ap
      JOIN open_shifts os ON ap.open_shift_id = os.id
      JOIN matching_configurations mc ON os.organization_id = mc.organization_id
      WHERE ap.proposal_status IN ('SENT', 'VIEWED', 'PENDING')
        AND ap.deleted_at IS NULL
        AND mc.is_default = true
        AND mc.is_active = true
        AND ap.sent_at IS NOT NULL
        AND ap.sent_at < NOW() - (mc.proposal_expiration_minutes || ' minutes')::INTERVAL
      `,
      []
    );

    let expiredCount = 0;

    for (const row of staleProposals.rows) {
      await this.repository.updateProposalStatus(row.id, 'EXPIRED', context);
      
      await this.repository.createMatchHistory(
        {
          openShiftId: row.open_shift_id,
          visitId: row.visit_id,
          caregiverId: row.caregiver_id,
          attemptNumber: 1,
          outcome: 'EXPIRED',
          assignmentProposalId: row.id,
          assignedSuccessfully: false,
        },
        context
      );

      expiredCount++;
    }

    return expiredCount;
  }

  /**
   * Private helper: Build caregiver context for matching
   */
  private async buildCaregiverContext(
    caregiverId: UUID,
    shift: OpenShift,
    _context: UserContext
  ): Promise<CaregiverContext> {
    // Context for getting caregiver
    const systemContext: UserContext = {
      userId: _context.userId,
      organizationId: _context.organizationId,
      branchIds: [],
      roles: ['SUPER_ADMIN'],
      permissions: ['caregivers:read'],
    };
    
    const caregiver = await this.caregiverService.getCaregiverById(caregiverId, systemContext);
    if (!caregiver) {
      throw new NotFoundError('Caregiver not found', { caregiverId });
    }

    // Get current week hours
    const weekStart = new Date(shift.scheduledDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekHoursResult = await this.pool.query(
      `
      SELECT COALESCE(SUM(scheduled_duration), 0) as total_minutes
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND scheduled_date BETWEEN $2 AND $3
        AND deleted_at IS NULL
        AND status NOT IN ('CANCELLED', 'NO_SHOW_CAREGIVER', 'REJECTED')
      `,
      [caregiverId, weekStart, weekEnd]
    );

    const currentWeekHours = parseInt(weekHoursResult.rows[0]?.total_minutes || '0', 10) / 60;

    // Check for conflicts
    const conflictsResult = await this.pool.query(
      `
      SELECT 
        v.id as visit_id,
        c.first_name || ' ' || c.last_name as client_name,
        v.scheduled_start_time as start_time,
        v.scheduled_end_time as end_time
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      WHERE v.assigned_caregiver_id = $1
        AND v.scheduled_date = $2
        AND v.deleted_at IS NULL
        AND v.status NOT IN ('CANCELLED', 'NO_SHOW_CAREGIVER', 'REJECTED')
        AND (v.scheduled_start_time, v.scheduled_end_time) OVERLAPS ($3, $4)
      `,
      [caregiverId, shift.scheduledDate, shift.startTime, shift.endTime]
    );

    const conflictingVisits = conflictsResult.rows.map((row) => ({
      visitId: row.visit_id,
      clientName: row.client_name,
      startTime: row.start_time,
      endTime: row.end_time,
      includesTravel: false,
    }));

    // Get previous visits with this client
    const previousVisitsResult = await this.pool.query(
      `
      SELECT COUNT(*) as count, AVG(client_rating) as avg_rating
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND client_id = $2
        AND deleted_at IS NULL
        AND status = 'COMPLETED'
      `,
      [caregiverId, shift.clientId]
    );

    const previousVisitsWithClient = parseInt(previousVisitsResult.rows[0]?.count || '0', 10);
    const clientRating = previousVisitsResult.rows[0]?.avg_rating
      ? parseFloat(previousVisitsResult.rows[0].avg_rating)
      : undefined;

    // Calculate distance if coordinates available
    let distanceFromShift: number | undefined;
    if (shift.latitude && shift.longitude && caregiver.primaryAddress?.latitude && caregiver.primaryAddress?.longitude) {
      const distanceResult = await this.pool.query(
        'SELECT calculate_distance($1, $2, $3, $4) as distance',
        [caregiver.primaryAddress.latitude, caregiver.primaryAddress.longitude, shift.latitude, shift.longitude]
      );
      distanceFromShift = parseFloat(distanceResult.rows[0]?.distance || '0');
    }

    // Calculate reliability score (simplified - could be more sophisticated)
    const reliabilityResult = await this.pool.query(
      `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW_CAREGIVER') as no_shows,
        COUNT(*) FILTER (WHERE status = 'CANCELLED_BY_CAREGIVER') as cancellations,
        COUNT(*) as total
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND deleted_at IS NULL
        AND scheduled_date >= NOW() - INTERVAL '90 days'
      `,
      [caregiverId]
    );

    const stats = reliabilityResult.rows[0];
    const completed = parseInt(stats?.completed || '0', 10);
    const noShows = parseInt(stats?.no_shows || '0', 10);
    const cancellations = parseInt(stats?.cancellations || '0', 10);
    const total = parseInt(stats?.total || '0', 10);

    let reliabilityScore = 75; // Default
    if (total > 0) {
      const completionRate = completed / total;
      reliabilityScore = Math.round(completionRate * 100);
      reliabilityScore -= noShows * 10; // Penalize no-shows heavily
      reliabilityScore -= cancellations * 5; // Penalize cancellations
      reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
    }

    // Get recent rejections
    const rejectionsResult = await this.pool.query(
      `
      SELECT COUNT(*) as count
      FROM assignment_proposals
      WHERE caregiver_id = $1
        AND proposal_status = 'REJECTED'
        AND deleted_at IS NULL
        AND proposed_at >= NOW() - INTERVAL '30 days'
      `,
      [caregiverId]
    );

    const recentRejectionCount = parseInt(rejectionsResult.rows[0]?.count || '0', 10);

    return {
      caregiver,
      currentWeekHours,
      conflictingVisits,
      previousVisitsWithClient,
      clientRating,
      reliabilityScore,
      recentRejectionCount,
      distanceFromShift,
    };
  }

  /**
   * Private helper: Assign caregiver to visit
   */
  private async assignShift(
    visitId: UUID,
    caregiverId: UUID,
    context: UserContext
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE visits
      SET assigned_caregiver_id = $1,
          status = 'SCHEDULED',
          updated_at = NOW(),
          updated_by = $2
      WHERE id = $3
      `,
      [caregiverId, context.userId, visitId]
    );
  }

  /**
   * Private helper: Withdraw other proposals when one is accepted
   */
  private async withdrawOtherProposals(
    openShiftId: UUID,
    acceptedProposalId: UUID,
    context: UserContext
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE assignment_proposals
      SET proposal_status = 'SUPERSEDED',
          updated_at = NOW(),
          updated_by = $1
      WHERE open_shift_id = $2
        AND id != $3
        AND proposal_status IN ('PENDING', 'SENT', 'VIEWED')
        AND deleted_at IS NULL
      `,
      [context.userId, openShiftId, acceptedProposalId]
    );
  }
}
