import type { CarePlanSearchFilters, TaskInstanceSearchFilters, CreateCarePlanInput, UpdateCarePlanInput, CompleteTaskInput } from '../types';
import type { SearchParams } from '@/core/types';
export declare const useCarePlanApi: () => import("../services/care-plan-api-service").CarePlanApiService;
export declare const useCarePlans: (filters?: CarePlanSearchFilters & SearchParams) => import("@tanstack/react-query").UseQueryResult<PaginatedResult<import("../types").CarePlan>, Error>;
export declare const useCarePlan: (id: string | undefined) => import("@tanstack/react-query").UseQueryResult<import("../types").CarePlan, Error>;
export declare const useCreateCarePlan: () => import("@tanstack/react-query").UseMutationResult<import("../types").CarePlan, any, CreateCarePlanInput, unknown>;
export declare const useUpdateCarePlan: () => import("@tanstack/react-query").UseMutationResult<import("../types").CarePlan, any, {
    id: string;
    input: UpdateCarePlanInput;
}, unknown>;
export declare const useActivateCarePlan: () => import("@tanstack/react-query").UseMutationResult<import("../types").CarePlan, any, string, unknown>;
export declare const useTasks: (filters?: TaskInstanceSearchFilters & SearchParams) => import("@tanstack/react-query").UseQueryResult<PaginatedResult<import("../types").TaskInstance>, Error>;
export declare const useTask: (id: string | undefined) => import("@tanstack/react-query").UseQueryResult<import("../types").TaskInstance, Error>;
export declare const useCompleteTask: () => import("@tanstack/react-query").UseMutationResult<import("../types").TaskInstance, any, {
    id: string;
    input: CompleteTaskInput;
}, unknown>;
//# sourceMappingURL=use-care-plans.d.ts.map