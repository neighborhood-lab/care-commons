import { Pool } from 'pg';
import { UserContext, PaginationParams } from '@care-commons/core';
import { CreateOpenShiftInput, MatchShiftInput, CreateProposalInput, RespondToProposalInput, UpdateCaregiverPreferencesInput, OpenShiftFilters, ProposalFilters } from '../types/shift-matching';
export declare class ShiftMatchingHandlers {
    private service;
    private repository;
    private pool;
    constructor(pool: Pool);
    createOpenShift(input: CreateOpenShiftInput, context: UserContext): Promise<import("../types/shift-matching").OpenShift>;
    matchOpenShift(openShiftId: string, input: Partial<MatchShiftInput>, context: UserContext): Promise<import("../service/shift-matching-service").MatchShiftResult>;
    searchOpenShifts(filters: OpenShiftFilters, pagination: PaginationParams, _context: UserContext): Promise<import("@care-commons/core").PaginatedResult<import("../types/shift-matching").OpenShift>>;
    getOpenShift(openShiftId: string, _context: UserContext): Promise<import("../types/shift-matching").OpenShift | null>;
    getProposalsForShift(openShiftId: string, _context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal[]>;
    createManualProposal(input: CreateProposalInput, context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal>;
    respondToProposal(proposalId: string, input: RespondToProposalInput, context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal>;
    searchProposals(filters: ProposalFilters, pagination: PaginationParams, _context: UserContext): Promise<import("@care-commons/core").PaginatedResult<import("../types/shift-matching").AssignmentProposal>>;
    getAvailableShifts(caregiverId: string, context: UserContext): Promise<import("../types/shift-matching").MatchCandidate[]>;
    getCaregiverProposals(caregiverId: string, statuses: string[] | undefined, _context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal[]>;
    markProposalViewed(proposalId: string, context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal>;
    acceptProposal(proposalId: string, notes: string | undefined, context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal>;
    rejectProposal(proposalId: string, rejectionReason: string, rejectionCategory: string, notes: string | undefined, context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal>;
    claimShift(openShiftId: string, caregiverId: string, context: UserContext): Promise<import("../types/shift-matching").AssignmentProposal>;
    updateCaregiverPreferences(caregiverId: string, input: UpdateCaregiverPreferencesInput, context: UserContext): Promise<import("../types/shift-matching").CaregiverPreferenceProfile>;
    getCaregiverPreferences(caregiverId: string, _context: UserContext): Promise<import("../types/shift-matching").CaregiverPreferenceProfile | null>;
    createConfiguration(input: any, context: UserContext): Promise<import("../types/shift-matching").MatchingConfiguration>;
    getConfiguration(configId: string, _context: UserContext): Promise<import("../types/shift-matching").MatchingConfiguration | null>;
    updateConfiguration(configId: string, input: any, context: UserContext): Promise<import("../types/shift-matching").MatchingConfiguration>;
    getDefaultConfiguration(organizationId: string, branchId: string | undefined, _context: UserContext): Promise<import("../types/shift-matching").MatchingConfiguration | null>;
    expireStaleProposals(context: UserContext): Promise<{
        success: boolean;
        expiredCount: number;
        message: string;
    }>;
    getMatchingMetrics(periodStart: Date, periodEnd: Date, _context: UserContext): Promise<{
        periodStart: Date;
        periodEnd: Date;
        totalOpenShifts: number;
        shiftsMatched: number;
        shiftsUnmatched: number;
        matchRate: number;
        averageMatchScore: number;
        averageResponseTimeMinutes: number;
        proposalsAccepted: number;
        proposalsRejected: number;
        proposalsExpired: number;
    }>;
    getCaregiverPerformance(caregiverId: string, periodStart: Date, periodEnd: Date, _context: UserContext): Promise<{
        caregiverId: string;
        periodStart: Date;
        periodEnd: Date;
        proposalsReceived: number;
        proposalsAccepted: number;
        proposalsRejected: number;
        proposalsExpired: number;
        acceptanceRate: number;
        averageMatchScore: number;
        averageResponseTimeMinutes: number;
    }>;
    getTopRejectionReasons(periodStart: Date, periodEnd: Date, _context: UserContext): Promise<{
        category: any;
        count: number;
        percentage: number;
    }[]>;
}
//# sourceMappingURL=shift-matching-handlers.d.ts.map