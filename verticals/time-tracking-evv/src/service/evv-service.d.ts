import { UserContext, UUID, PaginationParams, PaginatedResult } from '@care-commons/core';
import { EVVRepository } from '../repository/evv-repository';
import { EVVValidator } from '../validation/evv-validator';
import { IntegrationService } from '../utils/integration-service';
import { EVVRecord, TimeEntry, Geofence, ClockInInput, ClockOutInput, CreateGeofenceInput, ManualOverrideInput, VerificationResult, EVVRecordSearchFilters } from '../types/evv';
import { IVisitProvider, IClientProvider, ICaregiverProvider } from '../interfaces/visit-provider';
export declare class EVVService {
    private repository;
    private integrationService;
    private visitProvider;
    private clientProvider;
    private caregiverProvider;
    private validator;
    constructor(repository: EVVRepository, integrationService: IntegrationService, visitProvider: IVisitProvider, clientProvider: IClientProvider, caregiverProvider: ICaregiverProvider, validator?: EVVValidator);
    clockIn(input: ClockInInput, userContext: UserContext): Promise<{
        evvRecord: EVVRecord;
        timeEntry: TimeEntry;
        verification: VerificationResult;
    }>;
    clockOut(input: ClockOutInput, userContext: UserContext): Promise<{
        evvRecord: EVVRecord;
        timeEntry: TimeEntry;
        verification: VerificationResult;
    }>;
    applyManualOverride(input: ManualOverrideInput, userContext: UserContext): Promise<TimeEntry>;
    createGeofence(input: CreateGeofenceInput, userContext: UserContext): Promise<Geofence>;
    private getOrCreateGeofence;
    getEVVRecordByVisit(visitId: UUID, userContext: UserContext): Promise<EVVRecord | null>;
    getTimeEntriesByVisit(visitId: UUID, userContext: UserContext): Promise<TimeEntry[]>;
    searchEVVRecords(filters: EVVRecordSearchFilters, pagination: PaginationParams, userContext: UserContext): Promise<PaginatedResult<EVVRecord>>;
    private hasPermission;
    private isSupervisor;
    private generateUUID;
    private generateIntegrityHash;
    private generateCoreDataHash;
    private generateChecksum;
}
//# sourceMappingURL=evv-service.d.ts.map