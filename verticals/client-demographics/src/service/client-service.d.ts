import { UserContext, PaginatedResult } from '@care-commons/core';
import { Client, CreateClientInput, UpdateClientInput, ClientSearchFilters } from '../types/client';
import { ClientRepository } from '../repository/client-repository';
export declare class ClientService {
    private repository;
    private validator;
    private permissionService;
    constructor(repository: ClientRepository);
    createClient(input: CreateClientInput, context: UserContext): Promise<Client>;
    getClientById(id: string, context: UserContext): Promise<Client>;
    getClientByNumber(clientNumber: string, organizationId: string, context: UserContext): Promise<Client>;
    updateClient(id: string, updates: UpdateClientInput, context: UserContext): Promise<Client>;
    deleteClient(id: string, context: UserContext): Promise<void>;
    searchClients(filters: ClientSearchFilters, pagination: {
        page: number;
        limit: number;
    }, context: UserContext): Promise<PaginatedResult<Client>>;
    getClientsByBranch(branchId: string, context: UserContext, activeOnly?: boolean): Promise<Client[]>;
    addEmergencyContact(clientId: string, contact: Omit<import('../types/client').EmergencyContact, 'id'>, context: UserContext): Promise<Client>;
    updateEmergencyContact(clientId: string, contactId: string, updates: Partial<Omit<import('../types/client').EmergencyContact, 'id'>>, context: UserContext): Promise<Client>;
    removeEmergencyContact(clientId: string, contactId: string, context: UserContext): Promise<Client>;
    addRiskFlag(clientId: string, riskFlag: Omit<import('../types/client').RiskFlag, 'id'>, context: UserContext): Promise<Client>;
    resolveRiskFlag(clientId: string, flagId: string, context: UserContext): Promise<Client>;
    updateClientStatus(clientId: string, status: import('../types/client').ClientStatus, context: UserContext, reason?: string): Promise<Client>;
    private generateClientNumber;
    private checkOrganizationalAccess;
}
//# sourceMappingURL=client-service.d.ts.map