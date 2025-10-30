"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCompleteTask = exports.useTask = exports.useTasks = exports.useActivateCarePlan = exports.useUpdateCarePlan = exports.useCreateCarePlan = exports.useCarePlan = exports.useCarePlans = exports.useCarePlanApi = void 0;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const hooks_1 = require("@/core/hooks");
const care_plan_api_service_1 = require("../services/care-plan-api-service");
const useCarePlanApi = () => {
    const apiClient = (0, hooks_1.useApiClient)();
    return (0, react_1.useMemo)(() => (0, care_plan_api_service_1.createCarePlanApiService)(apiClient), [apiClient]);
};
exports.useCarePlanApi = useCarePlanApi;
const useCarePlans = (filters) => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    return (0, react_query_1.useQuery)({
        queryKey: ['care-plans', filters],
        queryFn: () => carePlanApi.getCarePlans(filters),
    });
};
exports.useCarePlans = useCarePlans;
const useCarePlan = (id) => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    return (0, react_query_1.useQuery)({
        queryKey: ['care-plans', id],
        queryFn: () => carePlanApi.getCarePlanById(id),
        enabled: !!id,
    });
};
exports.useCarePlan = useCarePlan;
const useCreateCarePlan = () => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (input) => carePlanApi.createCarePlan(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['care-plans'] });
            react_hot_toast_1.default.success('Care plan created successfully');
        },
        onError: (error) => {
            react_hot_toast_1.default.error(error.message || 'Failed to create care plan');
        },
    });
};
exports.useCreateCarePlan = useCreateCarePlan;
const useUpdateCarePlan = () => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: ({ id, input }) => carePlanApi.updateCarePlan(id, input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['care-plans'] });
            queryClient.invalidateQueries({ queryKey: ['care-plans', data.id] });
            react_hot_toast_1.default.success('Care plan updated successfully');
        },
        onError: (error) => {
            react_hot_toast_1.default.error(error.message || 'Failed to update care plan');
        },
    });
};
exports.useUpdateCarePlan = useUpdateCarePlan;
const useActivateCarePlan = () => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (id) => carePlanApi.activateCarePlan(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['care-plans'] });
            queryClient.invalidateQueries({ queryKey: ['care-plans', data.id] });
            react_hot_toast_1.default.success('Care plan activated successfully');
        },
        onError: (error) => {
            react_hot_toast_1.default.error(error.message || 'Failed to activate care plan');
        },
    });
};
exports.useActivateCarePlan = useActivateCarePlan;
const useTasks = (filters) => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    return (0, react_query_1.useQuery)({
        queryKey: ['tasks', filters],
        queryFn: () => carePlanApi.getTasks(filters),
    });
};
exports.useTasks = useTasks;
const useTask = (id) => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    return (0, react_query_1.useQuery)({
        queryKey: ['tasks', id],
        queryFn: () => carePlanApi.getTaskById(id),
        enabled: !!id,
    });
};
exports.useTask = useTask;
const useCompleteTask = () => {
    const carePlanApi = (0, exports.useCarePlanApi)();
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: ({ id, input }) => carePlanApi.completeTask(id, input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', data.id] });
            queryClient.invalidateQueries({ queryKey: ['care-plans', data.carePlanId] });
            react_hot_toast_1.default.success('Task completed successfully');
        },
        onError: (error) => {
            react_hot_toast_1.default.error(error.message || 'Failed to complete task');
        },
    });
};
exports.useCompleteTask = useCompleteTask;
//# sourceMappingURL=use-care-plans.js.map