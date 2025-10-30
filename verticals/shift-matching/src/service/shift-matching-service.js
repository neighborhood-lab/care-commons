"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftMatchingService = void 0;
const core_1 = require("@care-commons/core");
const shift_matching_repository_1 = require("../repository/shift-matching-repository");
const matching_algorithm_1 = require("../utils/matching-algorithm");
const caregiver_staff_1 = require("@care-commons/caregiver-staff");
class ShiftMatchingService {
    constructor(pool, caregiverService) {
        this.pool = pool;
        this.repository = new shift_matching_repository_1.ShiftMatchingRepository(pool);
        this.caregiverService = caregiverService || (new caregiver_staff_1.CaregiverService(pool));
    }
    async createOpenShift(input, context) {
        return this.repository.createOpenShift(input, context);
    }
    async matchShift(input, context) {
        const openShift = await this.repository.getOpenShift(input.openShiftId);
        if (!openShift) {
            throw new core_1.NotFoundError('Open shift not found', { id: input.openShiftId });
        }
        await this.repository.updateOpenShiftStatus(input.openShiftId, 'MATCHING', context);
        try {
            const config = input.configurationId
                ? await this.repository.getMatchingConfiguration(input.configurationId)
                : await this.repository.getDefaultConfiguration(context.organizationId, openShift.branchId);
            if (!config) {
                throw new core_1.ValidationError('No matching configuration found. Please create a default configuration first.');
            }
            const allCaregivers = await this.caregiverService.searchCaregivers({
                organizationId: context.organizationId,
                status: ['ACTIVE'],
                branchId: openShift.branchId,
            }, { page: 1, limit: 1000 }, context);
            const candidates = [];
            for (const caregiver of allCaregivers.items) {
                if (openShift.blockedCaregivers?.includes(caregiver.id)) {
                    continue;
                }
                const caregiverContext = await this.buildCaregiverContext(caregiver.id, openShift, context);
                const candidate = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(openShift, caregiverContext, config);
                candidates.push(candidate);
            }
            const rankedCandidates = matching_algorithm_1.MatchingAlgorithm.rankCandidates(candidates);
            const eligibleCandidates = rankedCandidates.filter((c) => c.isEligible && c.overallScore >= config.minScoreForProposal);
            const eligibleCount = eligibleCandidates.length;
            const ineligibleCount = candidates.length - eligibleCount;
            const maxCandidates = input.maxCandidates || config.maxProposalsPerShift;
            const topCandidates = eligibleCandidates.slice(0, maxCandidates);
            let newStatus = 'NO_MATCH';
            if (topCandidates.length > 0) {
                newStatus = 'MATCHED';
            }
            await this.repository.updateOpenShiftStatus(input.openShiftId, newStatus, context);
            const proposalsCreated = [];
            if (input.autoPropose && topCandidates.length > 0) {
                for (const candidate of topCandidates) {
                    const proposal = await this.createProposal({
                        openShiftId: input.openShiftId,
                        caregiverId: candidate.caregiverId,
                        proposalMethod: 'AUTOMATIC',
                        sendNotification: true,
                        notificationMethod: 'PUSH',
                        urgencyFlag: openShift.isUrgent,
                    }, candidate, context);
                    proposalsCreated.push(proposal);
                }
                await this.repository.updateOpenShiftStatus(input.openShiftId, 'PROPOSED', context);
            }
            await this.repository.createMatchHistory({
                openShiftId: input.openShiftId,
                visitId: openShift.visitId,
                attemptNumber: openShift.matchAttempts,
                outcome: topCandidates.length > 0 ? 'PROPOSED' : 'NO_CANDIDATES',
                configurationId: config.id,
                notes: `Found ${eligibleCount} eligible candidates out of ${candidates.length} total`,
            }, context);
            return {
                openShift: await this.repository.getOpenShift(input.openShiftId),
                candidates: rankedCandidates,
                proposalsCreated,
                eligibleCount,
                ineligibleCount,
            };
        }
        catch (error) {
            await this.repository.updateOpenShiftStatus(input.openShiftId, 'NO_MATCH', context);
            throw error;
        }
    }
    async createProposal(input, candidate, context) {
        const proposal = await this.repository.createProposal(input, candidate.overallScore, candidate.matchQuality, candidate.matchReasons, context);
        if (input.sendNotification) {
            await this.repository.updateProposalStatus(proposal.id, 'SENT', context);
        }
        return proposal;
    }
    async respondToProposal(proposalId, input, context) {
        const proposal = await this.repository.getProposal(proposalId);
        if (!proposal) {
            throw new core_1.NotFoundError('Proposal not found', { proposalId });
        }
        if (!['PENDING', 'SENT', 'VIEWED'].includes(proposal.proposalStatus)) {
            throw new core_1.ValidationError('Proposal is no longer active', {
                status: proposal.proposalStatus,
            });
        }
        const updatedProposal = await this.repository.respondToProposal(proposalId, input, context);
        if (input.accept) {
            await this.assignShift(proposal.visitId, proposal.caregiverId, context);
            await this.repository.updateOpenShiftStatus(proposal.openShiftId, 'ASSIGNED', context);
            await this.withdrawOtherProposals(proposal.openShiftId, proposalId, context);
            await this.repository.createMatchHistory({
                openShiftId: proposal.openShiftId,
                visitId: proposal.visitId,
                caregiverId: proposal.caregiverId,
                attemptNumber: 1,
                matchScore: proposal.matchScore,
                matchQuality: proposal.matchQuality,
                outcome: 'ACCEPTED',
                assignmentProposalId: proposalId,
                assignedSuccessfully: true,
            }, context);
        }
        else {
            await this.repository.createMatchHistory({
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
            }, context);
            const remainingProposals = await this.repository.getProposalsByOpenShift(proposal.openShiftId);
            const activePending = remainingProposals.filter((p) => ['PENDING', 'SENT', 'VIEWED'].includes(p.proposalStatus));
            if (activePending.length === 0) {
                await this.repository.updateOpenShiftStatus(proposal.openShiftId, 'MATCHED', context);
            }
        }
        return updatedProposal;
    }
    async getAvailableShiftsForCaregiver(caregiverId, context) {
        const caregiver = await this.caregiverService.getCaregiverById(caregiverId, context);
        if (!caregiver) {
            throw new core_1.NotFoundError('Caregiver not found', { caregiverId });
        }
        const dateFrom = new Date();
        const dateTo = new Date();
        dateTo.setDate(dateTo.getDate() + 7);
        const openShifts = await this.repository.searchOpenShifts({
            organizationId: context.organizationId,
            branchIds: [caregiver.primaryBranchId],
            dateFrom,
            dateTo,
            matchingStatus: ['NEW', 'MATCHING', 'MATCHED', 'PROPOSED'],
        }, { page: 1, limit: 100, sortBy: 'scheduled_date', sortOrder: 'asc' });
        const config = await this.repository.getDefaultConfiguration(context.organizationId, caregiver.primaryBranchId);
        if (!config) {
            return [];
        }
        const candidates = [];
        for (const shift of openShifts.items) {
            if (shift.blockedCaregivers?.includes(caregiverId)) {
                continue;
            }
            const caregiverContext = await this.buildCaregiverContext(caregiverId, shift, context);
            const candidate = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(shift, caregiverContext, config);
            if (candidate.isEligible && candidate.overallScore >= config.minScoreForProposal) {
                candidates.push(candidate);
            }
        }
        return matching_algorithm_1.MatchingAlgorithm.rankCandidates(candidates);
    }
    async caregiverSelectShift(caregiverId, openShiftId, context) {
        const openShift = await this.repository.getOpenShift(openShiftId);
        if (!openShift) {
            throw new core_1.NotFoundError('Open shift not found', { openShiftId });
        }
        if (openShift.matchingStatus === 'ASSIGNED') {
            throw new core_1.ConflictError('This shift has already been assigned');
        }
        const caregiverContext = await this.buildCaregiverContext(caregiverId, openShift, context);
        const config = await this.repository.getDefaultConfiguration(context.organizationId, openShift.branchId);
        if (!config) {
            throw new core_1.ValidationError('No matching configuration found');
        }
        const candidate = matching_algorithm_1.MatchingAlgorithm.evaluateMatch(openShift, caregiverContext, config);
        if (!candidate.isEligible) {
            throw new core_1.ValidationError('You are not eligible for this shift', {
                reasons: candidate.eligibilityIssues.map((i) => i.message),
            });
        }
        if (candidate.overallScore < config.minScoreForProposal) {
            throw new core_1.ValidationError('Your match score is too low for this shift', {
                score: candidate.overallScore,
                minimumRequired: config.minScoreForProposal,
            });
        }
        const proposal = await this.repository.createProposal({
            openShiftId,
            caregiverId,
            proposalMethod: 'CAREGIVER_SELF_SELECT',
            sendNotification: false,
        }, candidate.overallScore, candidate.matchQuality, candidate.matchReasons, context);
        const preferences = await this.repository.getCaregiverPreferences(caregiverId);
        if (preferences?.acceptAutoAssignment && candidate.overallScore >= 85) {
            return this.respondToProposal(proposal.id, {
                proposalId: proposal.id,
                accept: true,
                responseMethod: 'WEB',
            }, context);
        }
        return proposal;
    }
    async getCaregiverProposals(caregiverId, statuses) {
        return this.repository.getProposalsByCaregiver(caregiverId, statuses);
    }
    async markProposalViewed(proposalId, context) {
        const proposal = await this.repository.getProposal(proposalId);
        if (!proposal) {
            throw new core_1.NotFoundError('Proposal not found', { proposalId });
        }
        if (!proposal.viewedByCaregiver) {
            await this.repository.updateProposalStatus(proposalId, 'VIEWED', context);
        }
        return this.repository.getProposal(proposalId);
    }
    async expireStaleProposals(context) {
        const staleProposals = await this.pool.query(`
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
      `, []);
        let expiredCount = 0;
        for (const row of staleProposals.rows) {
            await this.repository.updateProposalStatus(row.id, 'EXPIRED', context);
            await this.repository.createMatchHistory({
                openShiftId: row.open_shift_id,
                visitId: row.visit_id,
                caregiverId: row.caregiver_id,
                attemptNumber: 1,
                outcome: 'EXPIRED',
                assignmentProposalId: row.id,
                assignedSuccessfully: false,
            }, context);
            expiredCount++;
        }
        return expiredCount;
    }
    async buildCaregiverContext(caregiverId, shift, _context) {
        const systemContext = {
            userId: _context.userId,
            organizationId: _context.organizationId,
            branchIds: [],
            roles: ['SUPER_ADMIN'],
            permissions: ['caregivers:read'],
        };
        const caregiver = await this.caregiverService.getCaregiverById(caregiverId, systemContext);
        if (!caregiver) {
            throw new core_1.NotFoundError('Caregiver not found', { caregiverId });
        }
        const weekStart = new Date(shift.scheduledDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekHoursResult = await this.pool.query(`
      SELECT COALESCE(SUM(scheduled_duration), 0) as total_minutes
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND scheduled_date BETWEEN $2 AND $3
        AND deleted_at IS NULL
        AND status NOT IN ('CANCELLED', 'NO_SHOW_CAREGIVER', 'REJECTED')
      `, [caregiverId, weekStart, weekEnd]);
        const currentWeekHours = parseInt(weekHoursResult.rows[0]?.total_minutes || '0', 10) / 60;
        const conflictsResult = await this.pool.query(`
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
      `, [caregiverId, shift.scheduledDate, shift.startTime, shift.endTime]);
        const conflictingVisits = conflictsResult.rows.map((row) => ({
            visitId: row.visit_id,
            clientName: row.client_name,
            startTime: row.start_time,
            endTime: row.end_time,
            includesTravel: false,
        }));
        const previousVisitsResult = await this.pool.query(`
      SELECT COUNT(*) as count, AVG(client_rating) as avg_rating
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND client_id = $2
        AND deleted_at IS NULL
        AND status = 'COMPLETED'
      `, [caregiverId, shift.clientId]);
        const previousVisitsWithClient = parseInt(previousVisitsResult.rows[0]?.count || '0', 10);
        const clientRating = previousVisitsResult.rows[0]?.avg_rating
            ? parseFloat(previousVisitsResult.rows[0].avg_rating)
            : undefined;
        let distanceFromShift;
        if (shift.latitude && shift.longitude && caregiver.primaryAddress?.latitude && caregiver.primaryAddress?.longitude) {
            const distanceResult = await this.pool.query('SELECT calculate_distance($1, $2, $3, $4) as distance', [caregiver.primaryAddress.latitude, caregiver.primaryAddress.longitude, shift.latitude, shift.longitude]);
            distanceFromShift = parseFloat(distanceResult.rows[0]?.distance || '0');
        }
        const reliabilityResult = await this.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW_CAREGIVER') as no_shows,
        COUNT(*) FILTER (WHERE status = 'CANCELLED_BY_CAREGIVER') as cancellations,
        COUNT(*) as total
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND deleted_at IS NULL
        AND scheduled_date >= NOW() - INTERVAL '90 days'
      `, [caregiverId]);
        const stats = reliabilityResult.rows[0];
        const completed = parseInt(stats?.completed || '0', 10);
        const noShows = parseInt(stats?.no_shows || '0', 10);
        const cancellations = parseInt(stats?.cancellations || '0', 10);
        const total = parseInt(stats?.total || '0', 10);
        let reliabilityScore = 75;
        if (total > 0) {
            const completionRate = completed / total;
            reliabilityScore = Math.round(completionRate * 100);
            reliabilityScore -= noShows * 10;
            reliabilityScore -= cancellations * 5;
            reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
        }
        const rejectionsResult = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM assignment_proposals
      WHERE caregiver_id = $1
        AND proposal_status = 'REJECTED'
        AND deleted_at IS NULL
        AND proposed_at >= NOW() - INTERVAL '30 days'
      `, [caregiverId]);
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
    async assignShift(visitId, caregiverId, context) {
        await this.pool.query(`
      UPDATE visits
      SET assigned_caregiver_id = $1,
          status = 'SCHEDULED',
          updated_at = NOW(),
          updated_by = $2
      WHERE id = $3
      `, [caregiverId, context.userId, visitId]);
    }
    async withdrawOtherProposals(openShiftId, acceptedProposalId, context) {
        await this.pool.query(`
      UPDATE assignment_proposals
      SET proposal_status = 'SUPERSEDED',
          updated_at = NOW(),
          updated_by = $1
      WHERE open_shift_id = $2
        AND id != $3
        AND proposal_status IN ('PENDING', 'SENT', 'VIEWED')
        AND deleted_at IS NULL
      `, [context.userId, openShiftId, acceptedProposalId]);
    }
}
exports.ShiftMatchingService = ShiftMatchingService;
//# sourceMappingURL=shift-matching-service.js.map