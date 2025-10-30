"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientSearchTemplates = exports.ClientSearchBuilder = void 0;
exports.createClientSearch = createClientSearch;
class ClientSearchBuilder {
    constructor() {
        this.filters = {};
    }
    query(searchTerm) {
        this.filters.query = searchTerm;
        return this;
    }
    inOrganization(organizationId) {
        this.filters.organizationId = organizationId;
        return this;
    }
    inBranch(branchId) {
        this.filters.branchId = branchId;
        return this;
    }
    withStatus(...statuses) {
        this.filters.status = statuses;
        return this;
    }
    activeOnly() {
        this.filters.status = ['ACTIVE'];
        return this;
    }
    enrolledIn(programId) {
        this.filters.programId = programId;
        return this;
    }
    withRiskFlags(...riskTypes) {
        this.filters.riskType = riskTypes;
        return this;
    }
    highRiskOnly() {
        this.filters.riskType = [
            'FALL_RISK',
            'WANDERING',
            'AGGRESSIVE_BEHAVIOR',
            'SAFETY_CONCERN',
            'ABUSE_NEGLECT_CONCERN',
        ];
        return this;
    }
    ageBetween(minAge, maxAge) {
        this.filters.minAge = minAge;
        this.filters.maxAge = maxAge;
        return this;
    }
    ageAtLeast(minAge) {
        this.filters.minAge = minAge;
        return this;
    }
    ageAtMost(maxAge) {
        this.filters.maxAge = maxAge;
        return this;
    }
    inCity(city) {
        this.filters.city = city;
        return this;
    }
    inState(state) {
        this.filters.state = state;
        return this;
    }
    withActiveServices() {
        this.filters.hasActiveServices = true;
        return this;
    }
    build() {
        return { ...this.filters };
    }
    reset() {
        this.filters = {};
        return this;
    }
    clone() {
        const builder = new ClientSearchBuilder();
        builder.filters = { ...this.filters };
        return builder;
    }
}
exports.ClientSearchBuilder = ClientSearchBuilder;
function createClientSearch() {
    return new ClientSearchBuilder();
}
exports.ClientSearchTemplates = {
    activeClients: () => createClientSearch().activeOnly(),
    highRiskClients: () => createClientSearch()
        .activeOnly()
        .highRiskOnly(),
    elderlyClients: () => createClientSearch()
        .activeOnly()
        .ageAtLeast(80),
    pendingIntake: () => createClientSearch().withStatus('PENDING_INTAKE'),
    newInquiries: () => createClientSearch().withStatus('INQUIRY'),
    onHold: () => createClientSearch().withStatus('ON_HOLD'),
    inCity: (city) => createClientSearch()
        .activeOnly()
        .inCity(city),
    fallRisk: () => createClientSearch()
        .activeOnly()
        .withRiskFlags('FALL_RISK'),
    wanderingRisk: () => createClientSearch()
        .activeOnly()
        .withRiskFlags('WANDERING'),
};
//# sourceMappingURL=search-builder.js.map