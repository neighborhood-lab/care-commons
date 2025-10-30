"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientApiService = void 0;
const createClientApiService = (apiClient) => {
    return {
        async getClients(filters) {
            const params = new URLSearchParams();
            if (filters?.query)
                params.append('query', filters.query);
            if (filters?.status)
                filters.status.forEach(s => params.append('status', s));
            if (filters?.city)
                params.append('city', filters.city);
            if (filters?.state)
                params.append('state', filters.state);
            if (filters?.page)
                params.append('page', filters.page.toString());
            if (filters?.pageSize)
                params.append('pageSize', filters.pageSize.toString());
            if (filters?.sortBy)
                params.append('sortBy', filters.sortBy);
            if (filters?.sortDirection)
                params.append('sortDirection', filters.sortDirection);
            const queryString = params.toString();
            return apiClient.get(`/api/clients${queryString ? `?${queryString}` : ''}`);
        },
        async getClientById(id) {
            return apiClient.get(`/api/clients/${id}`);
        },
        async createClient(input) {
            return apiClient.post('/api/clients', input);
        },
        async updateClient(id, input) {
            return apiClient.patch(`/api/clients/${id}`, input);
        },
        async deleteClient(id) {
            return apiClient.delete(`/api/clients/${id}`);
        },
    };
};
exports.createClientApiService = createClientApiService;
//# sourceMappingURL=client-api.js.map