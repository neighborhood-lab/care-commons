import { UUID, UserContext, PaginationParams, PaginatedResult } from '@care-commons/core';
import { ScheduleRepository } from '../repository/schedule-repository';
import { ServicePattern, Visit, CreateServicePatternInput, UpdateServicePatternInput, CreateVisitInput, AssignVisitInput, UpdateVisitStatusInput, CompleteVisitInput, VisitSearchFilters, ScheduleGenerationOptions, CaregiverAvailabilityQuery, AvailabilitySlot } from '../types/schedule';
export declare class ScheduleService {
    private repository;
    constructor(repository: ScheduleRepository);
    createServicePattern(input: CreateServicePatternInput, context: UserContext): Promise<ServicePattern>;
    getServicePatternById(id: UUID, context: UserContext): Promise<ServicePattern>;
    updateServicePattern(id: UUID, input: UpdateServicePatternInput, context: UserContext): Promise<ServicePattern>;
    getPatternsByClient(clientId: UUID, context: UserContext): Promise<ServicePattern[]>;
    createVisit(input: CreateVisitInput, context: UserContext): Promise<Visit>;
    getVisitById(id: UUID, context: UserContext): Promise<Visit>;
    updateVisitStatus(input: UpdateVisitStatusInput, context: UserContext): Promise<Visit>;
    completeVisit(input: CompleteVisitInput, context: UserContext): Promise<Visit>;
    assignCaregiver(input: AssignVisitInput, context: UserContext): Promise<Visit>;
    searchVisits(filters: VisitSearchFilters, pagination: PaginationParams, context: UserContext): Promise<PaginatedResult<Visit>>;
    getUnassignedVisits(organizationId: UUID, branchId: UUID | undefined, context: UserContext): Promise<Visit[]>;
    generateScheduleFromPattern(options: ScheduleGenerationOptions, context: UserContext): Promise<Visit[]>;
    checkCaregiverAvailability(query: CaregiverAvailabilityQuery): Promise<boolean>;
    getCaregiverAvailabilitySlots(query: CaregiverAvailabilityQuery): Promise<AvailabilitySlot[]>;
    private calculateVisitDates;
    private getDayOfWeek;
    private calculateEndTime;
    private addMinutesToTime;
    private timeToMinutes;
    private getClientAddress;
    private validatePatternBusinessRules;
    private validateVisitConflicts;
    private validateStatusTransition;
    private checkPermission;
    private checkOrganizationAccess;
    private checkBranchAccess;
}
//# sourceMappingURL=schedule-service.d.ts.map