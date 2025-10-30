"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthService = exports.useApiClient = void 0;
const react_1 = require("react");
const api_client_1 = require("../services/api-client");
const auth_service_1 = require("../services/auth-service");
const auth_1 = require("./auth");
const useApiClient = () => {
    const { token } = (0, auth_1.useAuth)();
    return (0, react_1.useMemo)(() => {
        return (0, api_client_1.createApiClient)(import.meta.env.VITE_API_BASE_URL || '', () => token);
    }, [token]);
};
exports.useApiClient = useApiClient;
const useAuthService = () => {
    const apiClient = (0, exports.useApiClient)();
    return (0, react_1.useMemo)(() => {
        return (0, auth_service_1.createAuthService)(apiClient);
    }, [apiClient]);
};
exports.useAuthService = useAuthService;
//# sourceMappingURL=api.js.map