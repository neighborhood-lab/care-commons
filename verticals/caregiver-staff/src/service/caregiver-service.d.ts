import { Database, UserContext, PaginatedResult } from '@care-commons/core';
import { Caregiver, CreateCaregiverInput, UpdateCaregiverInput, CaregiverSearchFilters, CaregiverEligibility, ComplianceStatus } from '../types/caregiver';
export declare class CaregiverService {
    private repository;
    private validator;
    constructor(database: Database);
    createCaregiver(input: CreateCaregiverInput, context: UserContext): Promise<Caregiver>;
    updateCaregiver(id: string, input: UpdateCaregiverInput, context: UserContext): Promise<Caregiver>;
    getCaregiverById(id: string, context: UserContext): Promise<Caregiver>;
    getCaregiverByEmployeeNumber(employeeNumber: string, organizationId: string, context: UserContext): Promise<Caregiver>;
    searchCaregivers(filters: CaregiverSearchFilters, pagination: {
        page: number;
        limit: number;
    }, context: UserContext): Promise<PaginatedResult<Caregiver>>;
    getCaregiversByBranch(branchId: string, activeOnly: boolean, context: UserContext): Promise<Caregiver[]>;
    getCaregiversWithExpiringCredentials(organizationId: string, daysUntilExpiration: number, context: UserContext): Promise<Caregiver[]>;
    getCaregiversByComplianceStatus(organizationId: string, complianceStatus: ComplianceStatus[], context: UserContext): Promise<Caregiver[]>;
    findAvailableForShift(organizationId: string, branchId: string, dayOfWeek: string, shiftStart: string, shiftEnd: string, context: UserContext): Promise<Caregiver[]>;
    checkEligibilityForAssignment(caregiverId: string, clientId: string, shiftDate: Date, context: UserContext): Promise<CaregiverEligibility>;
    updateComplianceStatus(caregiverId: string, context: UserContext): Promise<Caregiver>;
    deleteCaregiver(id: string, context: UserContext): Promise<void>;
    private calculateComplianceStatus;
    private getDefaultPermissions;
    private filterSensitiveData;
    private applyContextFilters;
    private checkPermission;
}
//# sourceMappingURL=caregiver-service.d.ts.map