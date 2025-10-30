"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftMatchingHandlers = void 0;
const shift_matching_service_1 = require("../service/shift-matching-service");
const shift_matching_repository_1 = require("../repository/shift-matching-repository");
class ShiftMatchingHandlers {
    constructor(pool) {
        this.pool = pool;
        this.service = new shift_matching_service_1.ShiftMatchingService(pool);
        this.repository = new shift_matching_repository_1.ShiftMatchingRepository(pool);
    }
    async createOpenShift(input, context) {
        return this.service.createOpenShift(input, context);
    }
    async matchOpenShift(openShiftId, input, context) {
        const matchInput = {
            openShiftId,
            ...input,
        };
        return this.service.matchShift(matchInput, context);
    }
    async searchOpenShifts(filters, pagination, _context) {
        return this.repository.searchOpenShifts(filters, pagination);
    }
    async getOpenShift(openShiftId, _context) {
        return this.repository.getOpenShift(openShiftId);
    }
    async getProposalsForShift(openShiftId, _context) {
        return this.repository.getProposalsByOpenShift(openShiftId);
    }
    async createManualProposal(input, context) {
        const openShift = await this.repository.getOpenShift(input.openShiftId);
        if (!openShift) {
            throw new Error('Open shift not found');
        }
        const caregiverContext = await this.service.buildCaregiverContext(input.caregiverId, openShift, context);
        const config = await this.repository.getDefaultConfiguration(context.organizationId, openShift.branchId);
        if (!config) {
            throw new Error('No matching configuration found');
        }
        const { MatchingAlgorithm } = require('../utils/matching-algorithm');
        const candidate = MatchingAlgorithm.evaluateMatch(openShift, caregiverContext, config);
        return this.service.createProposal(input, candidate, context);
    }
    async respondToProposal(proposalId, input, context) {
        return this.service.respondToProposal(proposalId, input, context);
    }
    async searchProposals(filters, pagination, _context) {
        return this.repository.searchProposals(filters, pagination);
    }
    async getAvailableShifts(caregiverId, context) {
        return this.service.getAvailableShiftsForCaregiver(caregiverId, context);
    }
    async getCaregiverProposals(caregiverId, statuses, _context) {
        return this.service.getCaregiverProposals(caregiverId, statuses);
    }
    async markProposalViewed(proposalId, context) {
        return this.service.markProposalViewed(proposalId, context);
    }
    async acceptProposal(proposalId, notes, context) {
        return this.service.respondToProposal(proposalId, {
            proposalId,
            accept: true,
            responseMethod: 'WEB',
            notes,
        }, context);
    }
    async rejectProposal(proposalId, rejectionReason, rejectionCategory, notes, context) {
        return this.service.respondToProposal(proposalId, {
            proposalId,
            accept: false,
            rejectionReason,
            rejectionCategory: rejectionCategory,
            responseMethod: 'WEB',
            notes,
        }, context);
    }
    async claimShift(openShiftId, caregiverId, context) {
        return this.service.caregiverSelectShift(caregiverId, openShiftId, context);
    }
    async updateCaregiverPreferences(caregiverId, input, context) {
        return this.repository.upsertCaregiverPreferences(caregiverId, context.organizationId, input, context);
    }
    async getCaregiverPreferences(caregiverId, _context) {
        return this.repository.getCaregiverPreferences(caregiverId);
    }
    async createConfiguration(input, context) {
        return this.repository.createMatchingConfiguration(input, context);
    }
    async getConfiguration(configId, _context) {
        return this.repository.getMatchingConfiguration(configId);
    }
    async updateConfiguration(configId, input, context) {
        return this.repository.updateMatchingConfiguration(configId, input, context);
    }
    async getDefaultConfiguration(organizationId, branchId, _context) {
        return this.repository.getDefaultConfiguration(organizationId, branchId);
    }
    async expireStaleProposals(context) {
        const count = await this.service.expireStaleProposals(context);
        return {
            success: true,
            expiredCount: count,
            message: `Expired ${count} stale proposal(s)`,
        };
    }
    async getMatchingMetrics(periodStart, periodEnd, _context) {
        const result = await this.pool.query(`
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
      `, [periodStart, periodEnd]);
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
    async getCaregiverPerformance(caregiverId, periodStart, periodEnd, _context) {
        const result = await this.pool.query(`
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
      `, [caregiverId, periodStart, periodEnd]);
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
    async getTopRejectionReasons(periodStart, periodEnd, _context) {
        const result = await this.pool.query(`
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
      `, [periodStart, periodEnd]);
        return result.rows.map((row) => ({
            category: row.rejection_category,
            count: parseInt(row.count, 10),
            percentage: parseFloat(row.percentage),
        }));
    }
}
exports.ShiftMatchingHandlers = ShiftMatchingHandlers;
//# sourceMappingURL=shift-matching-handlers.js.map