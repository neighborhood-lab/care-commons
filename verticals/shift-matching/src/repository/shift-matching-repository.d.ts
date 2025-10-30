import { Pool } from 'pg';
import { UUID, PaginationParams, PaginatedResult, UserContext } from '@care-commons/core';
import { OpenShift, MatchingConfiguration, AssignmentProposal, CaregiverPreferenceProfile, BulkMatchRequest, MatchHistory, OpenShiftFilters, ProposalFilters, CreateOpenShiftInput, CreateProposalInput, RespondToProposalInput, CreateBulkMatchInput, UpdateMatchingConfigurationInput, UpdateCaregiverPreferencesInput, ProposalStatus, MatchingStatus } from '../types/shift-matching';
export declare class ShiftMatchingRepository {
    private pool;
    constructor(pool: Pool);
    createOpenShift(input: CreateOpenShiftInput, context: UserContext): Promise<OpenShift>;
    getOpenShift(id: UUID): Promise<OpenShift | null>;
    getOpenShiftByVisitId(visitId: UUID): Promise<OpenShift | null>;
    updateOpenShiftStatus(id: UUID, status: MatchingStatus, context: UserContext): Promise<OpenShift>;
    searchOpenShifts(filters: OpenShiftFilters, pagination: PaginationParams): Promise<PaginatedResult<OpenShift>>;
    createMatchingConfiguration(input: Partial<MatchingConfiguration>, context: UserContext): Promise<MatchingConfiguration>;
    getMatchingConfiguration(id: UUID): Promise<MatchingConfiguration | null>;
    getDefaultConfiguration(organizationId: UUID, branchId?: UUID): Promise<MatchingConfiguration | null>;
    updateMatchingConfiguration(id: UUID, input: UpdateMatchingConfigurationInput, context: UserContext): Promise<MatchingConfiguration>;
    createProposal(input: CreateProposalInput, matchScore: number, matchQuality: string, matchReasons: any[], context: UserContext): Promise<AssignmentProposal>;
    getProposal(id: UUID): Promise<AssignmentProposal | null>;
    updateProposalStatus(id: UUID, status: ProposalStatus, context: UserContext): Promise<AssignmentProposal>;
    respondToProposal(id: UUID, input: RespondToProposalInput, context: UserContext): Promise<AssignmentProposal>;
    getProposalsByCaregiver(caregiverId: UUID, statuses?: ProposalStatus[]): Promise<AssignmentProposal[]>;
    getProposalsByOpenShift(openShiftId: UUID): Promise<AssignmentProposal[]>;
    searchProposals(filters: ProposalFilters, pagination: PaginationParams): Promise<PaginatedResult<AssignmentProposal>>;
    getCaregiverPreferences(caregiverId: UUID): Promise<CaregiverPreferenceProfile | null>;
    upsertCaregiverPreferences(caregiverId: UUID, organizationId: UUID, input: UpdateCaregiverPreferencesInput, context: UserContext): Promise<CaregiverPreferenceProfile>;
    createBulkMatchRequest(input: CreateBulkMatchInput, context: UserContext): Promise<BulkMatchRequest>;
    updateBulkMatchRequest(id: UUID, updates: Partial<BulkMatchRequest>, context: UserContext): Promise<BulkMatchRequest>;
    createMatchHistory(data: Partial<MatchHistory>, context: UserContext): Promise<MatchHistory>;
    private mapRowToOpenShift;
    private mapRowToMatchingConfiguration;
    private mapRowToProposal;
    private mapRowToPreferences;
    private mapRowToBulkMatchRequest;
    private mapRowToMatchHistory;
}
//# sourceMappingURL=shift-matching-repository.d.ts.map