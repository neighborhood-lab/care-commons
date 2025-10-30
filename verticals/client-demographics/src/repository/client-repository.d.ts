import { Repository, Database, PaginatedResult } from '@care-commons/core';
import { Client, ClientSearchFilters } from '../types/client';
export declare class ClientRepository extends Repository<Client> {
    constructor(database: Database);
    protected mapRowToEntity(row: any): Client;
    protected mapEntityToRow(entity: Partial<Client>): Record<string, any>;
    findByClientNumber(clientNumber: string, organizationId: string): Promise<Client | null>;
    search(filters: ClientSearchFilters, pagination: {
        page: number;
        limit: number;
    }): Promise<PaginatedResult<Client>>;
    findByBranch(branchId: string, activeOnly?: boolean): Promise<Client[]>;
    findByRiskType(organizationId: string, riskType: string): Promise<Client[]>;
}
//# sourceMappingURL=client-repository.d.ts.map