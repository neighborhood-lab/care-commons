"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const uuid_1 = require("uuid");
const core_1 = require("@care-commons/core");
const core_2 = require("@care-commons/core");
const client_validator_1 = require("../validation/client-validator");
class ClientService {
    constructor(repository) {
        this.permissionService = (0, core_2.getPermissionService)();
        this.repository = repository;
        this.validator = new client_validator_1.ClientValidator();
    }
    async createClient(input, context) {
        this.permissionService.requirePermission(context, 'clients:create');
        const validation = this.validator.validateCreate(input);
        if (!validation.success) {
            throw new core_1.ValidationError('Invalid client data', {
                errors: validation.errors,
            });
        }
        const clientNumber = await this.generateClientNumber(input.organizationId);
        const existing = await this.repository.findByClientNumber(clientNumber, input.organizationId);
        if (existing) {
            throw new core_1.ValidationError('Client number already exists');
        }
        const client = {
            organizationId: input.organizationId,
            branchId: input.branchId,
            clientNumber,
            firstName: input.firstName,
            middleName: input.middleName,
            lastName: input.lastName,
            preferredName: input.preferredName,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            primaryPhone: input.primaryPhone,
            email: input.email,
            primaryAddress: input.primaryAddress,
            emergencyContacts: input.emergencyContacts || [],
            authorizedContacts: [],
            programs: [],
            serviceEligibility: {
                medicaidEligible: false,
                medicareEligible: false,
                veteransBenefits: false,
                longTermCareInsurance: false,
                privatePayOnly: false,
            },
            riskFlags: [],
            status: input.status || 'PENDING_INTAKE',
            intakeDate: input.intakeDate || new Date(),
            referralSource: input.referralSource,
        };
        const created = await this.repository.create(client, context);
        return created;
    }
    async getClientById(id, context) {
        this.permissionService.requirePermission(context, 'clients:read');
        const client = await this.repository.findById(id);
        if (!client) {
            throw new core_1.NotFoundError(`Client not found: ${id}`);
        }
        this.checkOrganizationalAccess(client, context);
        return client;
    }
    async getClientByNumber(clientNumber, organizationId, context) {
        this.permissionService.requirePermission(context, 'clients:read');
        const client = await this.repository.findByClientNumber(clientNumber, organizationId);
        if (!client) {
            throw new core_1.NotFoundError(`Client not found: ${clientNumber}`);
        }
        this.checkOrganizationalAccess(client, context);
        return client;
    }
    async updateClient(id, updates, context) {
        this.permissionService.requirePermission(context, 'clients:update');
        await this.getClientById(id, context);
        const validation = this.validator.validateUpdate(updates);
        if (!validation.success) {
            throw new core_1.ValidationError('Invalid update data', {
                errors: validation.errors,
            });
        }
        const updated = await this.repository.update(id, updates, context);
        return updated;
    }
    async deleteClient(id, context) {
        this.permissionService.requirePermission(context, 'clients:delete');
        await this.getClientById(id, context);
        await this.repository.delete(id, context);
    }
    async searchClients(filters, pagination, context) {
        this.permissionService.requirePermission(context, 'clients:read');
        if (!context.roles.includes('SUPER_ADMIN')) {
            filters.organizationId = context.organizationId;
            if (context.roles.includes('BRANCH_ADMIN') &&
                context.branchIds.length > 0) {
                filters.branchId = context.branchIds[0];
            }
        }
        const result = await this.repository.search(filters, pagination);
        return result;
    }
    async getClientsByBranch(branchId, context, activeOnly = true) {
        this.permissionService.requirePermission(context, 'clients:read');
        if (!context.roles.includes('SUPER_ADMIN') &&
            !context.branchIds.includes(branchId)) {
            throw new core_1.PermissionError('No access to this branch');
        }
        return await this.repository.findByBranch(branchId, activeOnly);
    }
    async addEmergencyContact(clientId, contact, context) {
        const client = await this.getClientById(clientId, context);
        const newContact = {
            ...contact,
            id: (0, uuid_1.v4)(),
        };
        const emergencyContacts = [...client.emergencyContacts, newContact];
        return await this.updateClient(clientId, { emergencyContacts }, context);
    }
    async updateEmergencyContact(clientId, contactId, updates, context) {
        const client = await this.getClientById(clientId, context);
        const emergencyContacts = client.emergencyContacts.map((contact) => contact.id === contactId ? { ...contact, ...updates } : contact);
        return await this.updateClient(clientId, { emergencyContacts }, context);
    }
    async removeEmergencyContact(clientId, contactId, context) {
        const client = await this.getClientById(clientId, context);
        const emergencyContacts = client.emergencyContacts.filter((contact) => contact.id !== contactId);
        return await this.updateClient(clientId, { emergencyContacts }, context);
    }
    async addRiskFlag(clientId, riskFlag, context) {
        const client = await this.getClientById(clientId, context);
        const newFlag = {
            ...riskFlag,
            id: (0, uuid_1.v4)(),
            identifiedDate: new Date(),
        };
        const riskFlags = [...client.riskFlags, newFlag];
        return await this.updateClient(clientId, { riskFlags }, context);
    }
    async resolveRiskFlag(clientId, flagId, context) {
        const client = await this.getClientById(clientId, context);
        const riskFlags = client.riskFlags.map((flag) => flag.id === flagId ? { ...flag, resolvedDate: new Date() } : flag);
        return await this.updateClient(clientId, { riskFlags }, context);
    }
    async updateClientStatus(clientId, status, context, reason) {
        const client = await this.getClientById(clientId, context);
        const updates = { status };
        if (status === 'DISCHARGED') {
            updates.notes = reason
                ? `${client.notes || ''}\n\nDischarged: ${reason}`
                : client.notes;
        }
        return await this.updateClient(clientId, updates, context);
    }
    async generateClientNumber(_organizationId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `CL-${timestamp}-${random}`;
    }
    checkOrganizationalAccess(client, context) {
        if (context.roles.includes('SUPER_ADMIN')) {
            return;
        }
        if (client.organizationId !== context.organizationId) {
            throw new core_1.PermissionError('No access to this organization');
        }
        if (context.branchIds.length > 0 &&
            !context.branchIds.includes(client.branchId)) {
            throw new core_1.PermissionError('No access to this branch');
        }
    }
}
exports.ClientService = ClientService;
//# sourceMappingURL=client-service.js.map