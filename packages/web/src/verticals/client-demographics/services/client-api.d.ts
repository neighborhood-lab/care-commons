import type { ApiClient } from '@/core/services';
import type { PaginatedResult, SearchParams } from '@/core/types';
import type { Client, CreateClientInput, UpdateClientInput, ClientSearchFilters } from '../types';
export interface ClientApiService {
    getClients(filters?: ClientSearchFilters & SearchParams): Promise<PaginatedResult<Client>>;
    getClientById(id: string): Promise<Client>;
    createClient(input: CreateClientInput): Promise<Client>;
    updateClient(id: string, input: UpdateClientInput): Promise<Client>;
    deleteClient(id: string): Promise<void>;
}
export declare const createClientApiService: (apiClient: ApiClient) => ClientApiService;
//# sourceMappingURL=client-api.d.ts.map