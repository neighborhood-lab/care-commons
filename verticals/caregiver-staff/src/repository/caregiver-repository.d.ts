import { Repository, Database, UserContext, PaginatedResult } from '@care-commons/core';
import { Caregiver, CaregiverSearchFilters } from '../types/caregiver';
export declare class CaregiverRepository extends Repository<Caregiver> {
    constructor(database: Database);
    protected mapRowToEntity(row: any): Caregiver;
    protected mapEntityToRow(entity: Partial<Caregiver>): Record<string, any>;
    findByEmployeeNumber(employeeNumber: string, organizationId: string): Promise<Caregiver | null>;
    search(filters: CaregiverSearchFilters, pagination: {
        page: number;
        limit: number;
    }): Promise<PaginatedResult<Caregiver>>;
    findByBranch(branchId: string, activeOnly?: boolean): Promise<Caregiver[]>;
    findBySupervisor(supervisorId: string): Promise<Caregiver[]>;
    findWithExpiringCredentials(organizationId: string, daysUntilExpiration?: number): Promise<Caregiver[]>;
    findByComplianceStatus(organizationId: string, complianceStatus: string[]): Promise<Caregiver[]>;
    findAvailableForShift(organizationId: string, branchId: string, dayOfWeek: string, shiftStart: string, shiftEnd: string): Promise<Caregiver[]>;
    updateComplianceStatus(caregiverId: string, complianceStatus: string, context: UserContext): Promise<Caregiver>;
    generateEmployeeNumber(organizationId: string): Promise<string>;
}
//# sourceMappingURL=caregiver-repository.d.ts.map