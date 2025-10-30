"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCarePlanApiService = void 0;
const createCarePlanApiService = (apiClient) => {
    return {
        async getCarePlans(filters) {
            const params = new URLSearchParams();
            if (filters?.query)
                params.append('query', filters.query);
            if (filters?.clientId)
                params.append('clientId', filters.clientId);
            if (filters?.organizationId)
                params.append('organizationId', filters.organizationId);
            if (filters?.branchId)
                params.append('branchId', filters.branchId);
            if (filters?.status)
                filters.status.forEach(s => params.append('status', s));
            if (filters?.planType)
                filters.planType.forEach(t => params.append('planType', t));
            if (filters?.coordinatorId)
                params.append('coordinatorId', filters.coordinatorId);
            if (filters?.expiringWithinDays)
                params.append('expiringWithinDays', filters.expiringWithinDays.toString());
            if (filters?.needsReview)
                params.append('needsReview', filters.needsReview.toString());
            if (filters?.complianceStatus)
                filters.complianceStatus.forEach(c => params.append('complianceStatus', c));
            if (filters?.page)
                params.append('page', filters.page.toString());
            if (filters?.pageSize)
                params.append('pageSize', filters.pageSize.toString());
            if (filters?.sortBy)
                params.append('sortBy', filters.sortBy);
            if (filters?.sortDirection)
                params.append('sortDirection', filters.sortDirection);
            const queryString = params.toString();
            return apiClient.get(`/api/care-plans${queryString ? `?${queryString}` : ''}`);
        },
        async getCarePlanById(id) {
            return apiClient.get(`/api/care-plans/${id}`);
        },
        async createCarePlan(input) {
            return apiClient.post('/api/care-plans', input);
        },
        async updateCarePlan(id, input) {
            return apiClient.patch(`/api/care-plans/${id}`, input);
        },
        async activateCarePlan(id) {
            return apiClient.post(`/api/care-plans/${id}/activate`);
        },
        async getTasks(filters) {
            const params = new URLSearchParams();
            if (filters?.carePlanId)
                params.append('carePlanId', filters.carePlanId);
            if (filters?.clientId)
                params.append('clientId', filters.clientId);
            if (filters?.assignedCaregiverId)
                params.append('assignedCaregiverId', filters.assignedCaregiverId);
            if (filters?.visitId)
                params.append('visitId', filters.visitId);
            if (filters?.status)
                filters.status.forEach(s => params.append('status', s));
            if (filters?.category)
                filters.category.forEach(c => params.append('category', c));
            if (filters?.scheduledDateFrom)
                params.append('scheduledDateFrom', filters.scheduledDateFrom);
            if (filters?.scheduledDateTo)
                params.append('scheduledDateTo', filters.scheduledDateTo);
            if (filters?.overdue)
                params.append('overdue', filters.overdue.toString());
            if (filters?.requiresSignature)
                params.append('requiresSignature', filters.requiresSignature.toString());
            if (filters?.page)
                params.append('page', filters.page.toString());
            if (filters?.pageSize)
                params.append('pageSize', filters.pageSize.toString());
            if (filters?.sortBy)
                params.append('sortBy', filters.sortBy);
            if (filters?.sortDirection)
                params.append('sortDirection', filters.sortDirection);
            const queryString = params.toString();
            return apiClient.get(`/api/tasks${queryString ? `?${queryString}` : ''}`);
        },
        async getTaskById(id) {
            return apiClient.get(`/api/tasks/${id}`);
        },
        async completeTask(id, input) {
            return apiClient.post(`/api/tasks/${id}/complete`, input);
        },
    };
};
exports.createCarePlanApiService = createCarePlanApiService;
//# sourceMappingURL=care-plan-api-service.js.map