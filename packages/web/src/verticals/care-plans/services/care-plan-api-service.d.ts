import type { ApiClient } from '@/core/services';
import type { PaginatedResult, SearchParams } from '@/core/types';
import type { CarePlan, TaskInstance, CreateCarePlanInput, UpdateCarePlanInput, CompleteTaskInput, CarePlanSearchFilters, TaskInstanceSearchFilters } from '../types';
export interface CarePlanApiService {
    getCarePlans(filters?: CarePlanSearchFilters & SearchParams): Promise<PaginatedResult<CarePlan>>;
    getCarePlanById(id: string): Promise<CarePlan>;
    createCarePlan(input: CreateCarePlanInput): Promise<CarePlan>;
    updateCarePlan(id: string, input: UpdateCarePlanInput): Promise<CarePlan>;
    activateCarePlan(id: string): Promise<CarePlan>;
    getTasks(filters?: TaskInstanceSearchFilters & SearchParams): Promise<PaginatedResult<TaskInstance>>;
    getTaskById(id: string): Promise<TaskInstance>;
    completeTask(id: string, input: CompleteTaskInput): Promise<TaskInstance>;
}
export declare const createCarePlanApiService: (apiClient: ApiClient) => CarePlanApiService;
//# sourceMappingURL=care-plan-api-service.d.ts.map