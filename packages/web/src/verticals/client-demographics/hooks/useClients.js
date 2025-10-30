"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDeleteClient = exports.useUpdateClient = exports.useCreateClient = exports.useClient = exports.useClients = exports.useClientApi = void 0;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const hooks_1 = require("@/core/hooks");
const client_api_1 = require("../services/client-api");
const useClientApi = () => {
    const apiClient = (0, hooks_1.useApiClient)();
    return (0, react_1.useMemo)(() => (0, client_api_1.createClientApiService)(apiClient), [apiClient]);
};
exports.useClientApi = useClientApi;
const useClients = (filters) => {
    const clientApi = (0, exports.useClientApi)();
    return (0, react_query_1.useQuery)({
        queryKey: ['clients', filters],
        queryFn: () => clientApi.getClients(filters),
    });
};
exports.useClients = useClients;
const useClient = (id) => {
    const clientApi = (0, exports.useClientApi)();
    return (0, react_query_1.useQuery)({
        queryKey: ['clients', id],
        queryFn: () => clientApi.getClientById(id),
        enabled: !!id,
    });
};
exports.useClient = useClient;
const useCreateClient = () => {
    const clientApi = (0, exports.useClientApi)();
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (input) => clientApi.createClient(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            react_hot_toast_1.default.success('Client created successfully');
        },
        onError: (error) => {
            react_hot_toast_1.default.error(error.message || 'Failed to create client');
        },
    });
};
exports.useCreateClient = useCreateClient;
const useUpdateClient = () => {
    const clientApi = (0, exports.useClientApi)();
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: ({ id, input }) => clientApi.updateClient(id, input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
            react_hot_toast_1.default.success('Client updated successfully');
        },
        onError: (error) => {
            react_hot_toast_1.default.error(error.message || 'Failed to update client');
        },
    });
};
exports.useUpdateClient = useUpdateClient;
const useDeleteClient = () => {
    const clientApi = (0, exports.useClientApi)();
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (id) => clientApi.deleteClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            react_hot_toast_1.default.success('Client deleted successfully');
        },
        onError: (error) => {
            react_hot_toast_1.default.error(error.message || 'Failed to delete client');
        },
    });
};
exports.useDeleteClient = useDeleteClient;
//# sourceMappingURL=useClients.js.map