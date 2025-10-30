import { Pool } from 'pg';
import { UUID, UserContext } from '@care-commons/core';
import { CaregiverService } from '@care-commons/caregiver-staff';
import { OpenShift, MatchCandidate, AssignmentProposal, CreateOpenShiftInput, MatchShiftInput, CreateProposalInput, RespondToProposalInput, ProposalStatus } from '../types/shift-matching';
export interface MatchShiftResult {
    openShift: OpenShift;
    candidates: MatchCandidate[];
    proposalsCreated: AssignmentProposal[];
    eligibleCount: number;
    ineligibleCount: number;
}
export declare class ShiftMatchingService {
    private pool;
    private repository;
    private caregiverService;
    constructor(pool: Pool, caregiverService?: CaregiverService);
    createOpenShift(input: CreateOpenShiftInput, context: UserContext): Promise<OpenShift>;
    matchShift(input: MatchShiftInput, context: UserContext): Promise<MatchShiftResult>;
    createProposal(input: CreateProposalInput, candidate: MatchCandidate, context: UserContext): Promise<AssignmentProposal>;
    respondToProposal(proposalId: UUID, input: RespondToProposalInput, context: UserContext): Promise<AssignmentProposal>;
    getAvailableShiftsForCaregiver(caregiverId: UUID, context: UserContext): Promise<MatchCandidate[]>;
    caregiverSelectShift(caregiverId: UUID, openShiftId: UUID, context: UserContext): Promise<AssignmentProposal>;
    getCaregiverProposals(caregiverId: UUID, statuses?: ProposalStatus[]): Promise<AssignmentProposal[]>;
    markProposalViewed(proposalId: UUID, context: UserContext): Promise<AssignmentProposal>;
    expireStaleProposals(context: UserContext): Promise<number>;
    private buildCaregiverContext;
    private assignShift;
    private withdrawOtherProposals;
}
//# sourceMappingURL=shift-matching-service.d.ts.map