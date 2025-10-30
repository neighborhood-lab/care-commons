import { UUID } from '@care-commons/core';
import { EVVRecord } from '../types/evv';
import { StateCode, TexasEVVConfig, FloridaEVVConfig, StateAggregatorSubmission } from '../types/state-specific';
export interface IAggregatorConfigRepository {
    getStateConfig(organizationId: UUID, branchId: UUID, stateCode: StateCode): Promise<TexasEVVConfig | FloridaEVVConfig | null>;
}
export interface IAggregatorSubmissionRepository {
    createSubmission(submission: Omit<StateAggregatorSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<StateAggregatorSubmission>;
    updateSubmission(id: UUID, updates: Partial<StateAggregatorSubmission>): Promise<StateAggregatorSubmission>;
    getSubmissionsByEVVRecord(evvRecordId: UUID): Promise<StateAggregatorSubmission[]>;
    getPendingRetries(): Promise<StateAggregatorSubmission[]>;
}
export declare class EVVAggregatorService {
    private configRepository;
    private submissionRepository;
    constructor(configRepository: IAggregatorConfigRepository, submissionRepository: IAggregatorSubmissionRepository);
    submitToAggregator(evvRecord: EVVRecord): Promise<StateAggregatorSubmission[]>;
    private submitToTexasAggregator;
    private submitToFloridaAggregators;
    retryPendingSubmissions(): Promise<void>;
    private buildHHAeXchangePayload;
    private sendToHHAeXchange;
    private validateEVVRecord;
    private extractStateCode;
    private mapVerificationStatus;
    private calculateNextRetry;
}
//# sourceMappingURL=evv-aggregator-service.d.ts.map