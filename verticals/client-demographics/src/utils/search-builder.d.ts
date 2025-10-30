import { ClientSearchFilters, ClientStatus, RiskType } from '../types/client';
export declare class ClientSearchBuilder {
    private filters;
    query(searchTerm: string): this;
    inOrganization(organizationId: string): this;
    inBranch(branchId: string): this;
    withStatus(...statuses: ClientStatus[]): this;
    activeOnly(): this;
    enrolledIn(programId: string): this;
    withRiskFlags(...riskTypes: RiskType[]): this;
    highRiskOnly(): this;
    ageBetween(minAge: number, maxAge: number): this;
    ageAtLeast(minAge: number): this;
    ageAtMost(maxAge: number): this;
    inCity(city: string): this;
    inState(state: string): this;
    withActiveServices(): this;
    build(): ClientSearchFilters;
    reset(): this;
    clone(): ClientSearchBuilder;
}
export declare function createClientSearch(): ClientSearchBuilder;
export declare const ClientSearchTemplates: {
    activeClients: () => ClientSearchBuilder;
    highRiskClients: () => ClientSearchBuilder;
    elderlyClients: () => ClientSearchBuilder;
    pendingIntake: () => ClientSearchBuilder;
    newInquiries: () => ClientSearchBuilder;
    onHold: () => ClientSearchBuilder;
    inCity: (city: string) => ClientSearchBuilder;
    fallRisk: () => ClientSearchBuilder;
    wanderingRisk: () => ClientSearchBuilder;
};
//# sourceMappingURL=search-builder.d.ts.map