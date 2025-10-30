import type { ClientSearchFilters, CreateClientInput, UpdateClientInput } from '../types';
import type { SearchParams } from '@/core/types';
export declare const useClientApi: () => import("../services/client-api").ClientApiService;
export declare const useClients: (filters?: ClientSearchFilters & SearchParams) => import("@tanstack/react-query").UseQueryResult<PaginatedResult<import("../types").Client>, Error>;
export declare const useClient: (id: string | undefined) => import("@tanstack/react-query").UseQueryResult<import("../types").Client, Error>;
export declare const useCreateClient: () => import("@tanstack/react-query").UseMutationResult<import("../types").Client, any, CreateClientInput, unknown>;
export declare const useUpdateClient: () => import("@tanstack/react-query").UseMutationResult<import("../types").Client, any, {
    id: string;
    input: UpdateClientInput;
}, unknown>;
export declare const useDeleteClient: () => import("@tanstack/react-query").UseMutationResult<void, any, string, unknown>;
//# sourceMappingURL=useClients.d.ts.map