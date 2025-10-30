"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthService = void 0;
const createAuthService = (apiClient) => {
    return {
        async login(credentials) {
            return apiClient.post('/api/auth/login', credentials);
        },
        async logout() {
            return apiClient.post('/api/auth/logout');
        },
        async getCurrentUser() {
            return apiClient.get('/api/auth/me');
        },
        async refreshToken() {
            return apiClient.post('/api/auth/refresh');
        },
    };
};
exports.createAuthService = createAuthService;
//# sourceMappingURL=auth-service.js.map