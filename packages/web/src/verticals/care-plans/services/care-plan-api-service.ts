import type { ApiClient } from '@/core/services';
import type { PaginatedResult, SearchParams } from '@/core/types';
import type {
  CarePlan,
  TaskInstance,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CompleteTaskInput,
  CarePlanSearchFilters,
  TaskInstanceSearchFilters,
} from '../types';

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

export const createCarePlanApiService = (apiClient: ApiClient): CarePlanApiService => {
  return {
    async getCarePlans(filters?: CarePlanSearchFilters & SearchParams): Promise<PaginatedResult<CarePlan>> {
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.status) filters.status.forEach(s => params.append('status', s));
      if (filters?.planType) filters.planType.forEach(t => params.append('planType', t));
      if (filters?.coordinatorId) params.append('coordinatorId', filters.coordinatorId);
      if (filters?.expiringWithinDays) params.append('expiringWithinDays', filters.expiringWithinDays.toString());
      if (filters?.needsReview) params.append('needsReview', filters.needsReview.toString());
      if (filters?.complianceStatus) filters.complianceStatus.forEach(c => params.append('complianceStatus', c));
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

      const queryString = params.toString();
      return apiClient.get<PaginatedResult<CarePlan>>(
        `/api/care-plans${queryString ? `?${queryString}` : ''}`
      );
    },

    async getCarePlanById(id: string): Promise<CarePlan> {
      return apiClient.get<CarePlan>(`/api/care-plans/${id}`);
    },

    async createCarePlan(input: CreateCarePlanInput): Promise<CarePlan> {
      return apiClient.post<CarePlan>('/api/care-plans', input);
    },

    async updateCarePlan(id: string, input: UpdateCarePlanInput): Promise<CarePlan> {
      return apiClient.patch<CarePlan>(`/api/care-plans/${id}`, input);
    },

    async activateCarePlan(id: string): Promise<CarePlan> {
      return apiClient.post<CarePlan>(`/api/care-plans/${id}/activate`);
    },

    async getTasks(filters?: TaskInstanceSearchFilters & SearchParams): Promise<PaginatedResult<TaskInstance>> {
      const params = new URLSearchParams();
      if (filters?.carePlanId) params.append('carePlanId', filters.carePlanId);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.assignedCaregiverId) params.append('assignedCaregiverId', filters.assignedCaregiverId);
      if (filters?.visitId) params.append('visitId', filters.visitId);
      if (filters?.status) filters.status.forEach(s => params.append('status', s));
      if (filters?.category) filters.category.forEach(c => params.append('category', c));
      if (filters?.scheduledDateFrom) params.append('scheduledDateFrom', filters.scheduledDateFrom);
      if (filters?.scheduledDateTo) params.append('scheduledDateTo', filters.scheduledDateTo);
      if (filters?.overdue) params.append('overdue', filters.overdue.toString());
      if (filters?.requiresSignature) params.append('requiresSignature', filters.requiresSignature.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);

      const queryString = params.toString();
      return apiClient.get<PaginatedResult<TaskInstance>>(
        `/api/tasks${queryString ? `?${queryString}` : ''}`
      );
    },

    async getTaskById(id: string): Promise<TaskInstance> {
      return apiClient.get<TaskInstance>(`/api/tasks/${id}`);
    },

    async completeTask(id: string, input: CompleteTaskInput): Promise<TaskInstance> {
      return apiClient.post<TaskInstance>(`/api/tasks/${id}/complete`, input);
    },
  };
};