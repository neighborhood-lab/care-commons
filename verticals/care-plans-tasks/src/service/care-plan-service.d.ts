import { UserContext, PaginationParams, PaginatedResult, UUID } from '@care-commons/core';
import { PermissionService } from '@care-commons/core';
import { CarePlan, CreateCarePlanInput, UpdateCarePlanInput, CarePlanSearchFilters, TaskInstance, CreateTaskInstanceInput, CompleteTaskInput, TaskInstanceSearchFilters, ProgressNote, CreateProgressNoteInput, CarePlanAnalytics, TaskCompletionMetrics } from '../types/care-plan';
import { CarePlanRepository } from '../repository/care-plan-repository';
export declare class CarePlanService {
    private repository;
    private permissions;
    constructor(repository: CarePlanRepository, permissions: PermissionService);
    createCarePlan(input: CreateCarePlanInput, context: UserContext): Promise<CarePlan>;
    getCarePlanById(id: UUID, context: UserContext): Promise<CarePlan>;
    updateCarePlan(id: UUID, input: UpdateCarePlanInput, context: UserContext): Promise<CarePlan>;
    activateCarePlan(id: UUID, context: UserContext): Promise<CarePlan>;
    searchCarePlans(filters: CarePlanSearchFilters, pagination: PaginationParams, context: UserContext): Promise<PaginatedResult<CarePlan>>;
    getCarePlansByClientId(clientId: UUID, context: UserContext): Promise<CarePlan[]>;
    getActiveCarePlanForClient(clientId: UUID, context: UserContext): Promise<CarePlan | null>;
    getExpiringCarePlans(daysUntilExpiration: number, context: UserContext): Promise<CarePlan[]>;
    deleteCarePlan(id: UUID, context: UserContext): Promise<void>;
    createTasksForVisit(carePlanId: UUID, visitId: UUID, visitDate: Date, context: UserContext): Promise<TaskInstance[]>;
    createTaskInstance(input: CreateTaskInstanceInput, context: UserContext): Promise<TaskInstance>;
    getTaskInstanceById(id: UUID, context: UserContext): Promise<TaskInstance>;
    completeTask(id: UUID, input: CompleteTaskInput, context: UserContext): Promise<TaskInstance>;
    skipTask(id: UUID, reason: string, note?: string, context?: UserContext): Promise<TaskInstance>;
    reportTaskIssue(id: UUID, issueDescription: string, context: UserContext): Promise<TaskInstance>;
    searchTaskInstances(filters: TaskInstanceSearchFilters, pagination: PaginationParams, context: UserContext): Promise<PaginatedResult<TaskInstance>>;
    getTasksByVisitId(visitId: UUID, context: UserContext): Promise<TaskInstance[]>;
    createProgressNote(input: CreateProgressNoteInput, context: UserContext): Promise<ProgressNote>;
    getProgressNotesByCarePlanId(carePlanId: UUID, context: UserContext): Promise<ProgressNote[]>;
    getCarePlanAnalytics(organizationId: UUID, context: UserContext): Promise<CarePlanAnalytics>;
    getTaskCompletionMetrics(filters: {
        dateFrom: Date;
        dateTo: Date;
        organizationId: UUID;
    }, context: UserContext): Promise<TaskCompletionMetrics>;
    private generatePlanNumber;
    private shouldCreateTaskForDate;
}
export default CarePlanService;
//# sourceMappingURL=care-plan-service.d.ts.map