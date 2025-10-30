import { Repository, Database } from '@care-commons/core';
import { UUID, PaginatedResult, PaginationParams } from '@care-commons/core';
import { CarePlan, CreateCarePlanInput, UpdateCarePlanInput, CarePlanSearchFilters, TaskInstance, CreateTaskInstanceInput, TaskInstanceSearchFilters, ProgressNote, CreateProgressNoteInput, TaskStatus } from '../types/care-plan';
export declare class CarePlanRepository extends Repository<CarePlan> {
    constructor(database: Database);
    protected mapRowToEntity(row: any): CarePlan;
    protected mapEntityToRow(_entity: Partial<CarePlan>): Record<string, any>;
    createCarePlan(input: CreateCarePlanInput & {
        planNumber: string;
        createdBy: UUID;
    }): Promise<CarePlan>;
    getCarePlanById(id: UUID): Promise<CarePlan | null>;
    updateCarePlan(id: UUID, input: UpdateCarePlanInput, updatedBy: UUID): Promise<CarePlan>;
    searchCarePlans(filters: CarePlanSearchFilters, pagination: PaginationParams): Promise<PaginatedResult<CarePlan>>;
    getCarePlansByClientId(clientId: UUID): Promise<CarePlan[]>;
    getActiveCarePlanForClient(clientId: UUID): Promise<CarePlan | null>;
    getExpiringCarePlans(organizationId: UUID, daysUntilExpiration: number): Promise<CarePlan[]>;
    deleteCarePlan(id: UUID, deletedBy: UUID): Promise<void>;
    createTaskInstance(input: CreateTaskInstanceInput & {
        createdBy: UUID;
        status: TaskStatus;
    }): Promise<TaskInstance>;
    getTaskInstanceById(id: UUID): Promise<TaskInstance | null>;
    updateTaskInstance(id: UUID, updates: Partial<TaskInstance>, updatedBy: UUID): Promise<TaskInstance>;
    searchTaskInstances(filters: TaskInstanceSearchFilters, pagination: PaginationParams): Promise<PaginatedResult<TaskInstance>>;
    getTasksByVisitId(visitId: UUID): Promise<TaskInstance[]>;
    createProgressNote(input: CreateProgressNoteInput & {
        authorId: UUID;
        authorName: string;
        authorRole: string;
        noteDate: Date;
    }): Promise<ProgressNote>;
    getProgressNotesByCarePlanId(carePlanId: UUID): Promise<ProgressNote[]>;
    private mapRowToCarePlan;
    private mapRowToTaskInstance;
    private mapRowToProgressNote;
    private camelToSnake;
}
export default CarePlanRepository;
//# sourceMappingURL=care-plan-repository.d.ts.map