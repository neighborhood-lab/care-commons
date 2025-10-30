import { Pool } from 'pg';
import { UUID, PaginationParams, PaginatedResult, UserContext } from '@care-commons/core';
import { ServicePattern, Visit, VisitSearchFilters, VisitStatus, CreateServicePatternInput, UpdateServicePatternInput, CreateVisitInput, AssignVisitInput } from '../types/schedule';
export declare class ScheduleRepository {
    private pool;
    constructor(pool: Pool);
    createServicePattern(input: CreateServicePatternInput, context: UserContext): Promise<ServicePattern>;
    getServicePatternById(id: UUID): Promise<ServicePattern | null>;
    updateServicePattern(id: UUID, input: UpdateServicePatternInput, context: UserContext): Promise<ServicePattern>;
    getPatternsByClient(clientId: UUID): Promise<ServicePattern[]>;
    createVisit(input: CreateVisitInput, context: UserContext): Promise<Visit>;
    getVisitById(id: UUID): Promise<Visit | null>;
    updateVisitStatus(id: UUID, newStatus: VisitStatus, context: UserContext, notes?: string, reason?: string): Promise<Visit>;
    assignCaregiver(input: AssignVisitInput, context: UserContext): Promise<Visit>;
    searchVisits(filters: VisitSearchFilters, pagination: PaginationParams): Promise<PaginatedResult<Visit>>;
    getVisitsByDateRange(organizationId: UUID, startDate: Date, endDate: Date, branchIds?: UUID[]): Promise<Visit[]>;
    getUnassignedVisits(organizationId: UUID, branchId?: UUID): Promise<Visit[]>;
    private generateVisitNumber;
    private mapRowToServicePattern;
    private mapRowToVisit;
}
//# sourceMappingURL=schedule-repository.d.ts.map