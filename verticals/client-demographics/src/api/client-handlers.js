"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientHandlers = void 0;
exports.createClientRouter = createClientRouter;
function getUserContext(req) {
    return req.userContext;
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
class ClientHandlers {
    constructor(clientService) {
        this.clientService = clientService;
        this.listClients = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const filters = {
                query: req.query.q,
                organizationId: req.query.organizationId,
                branchId: req.query.branchId,
                status: req.query.status ? req.query.status.split(',') : undefined,
                programId: req.query.programId,
                riskType: req.query.riskType ? req.query.riskType.split(',') : undefined,
                minAge: req.query.minAge ? parseInt(req.query.minAge) : undefined,
                maxAge: req.query.maxAge ? parseInt(req.query.maxAge) : undefined,
                city: req.query.city,
                state: req.query.state,
                hasActiveServices: req.query.hasActiveServices === 'true',
            };
            const pagination = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            };
            const result = await this.clientService.searchClients(filters, pagination, context);
            res.json({
                success: true,
                data: result,
            });
        });
        this.getClient = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id } = req.params;
            const client = await this.clientService.getClientById(id, context);
            res.json({
                success: true,
                data: client,
            });
        });
        this.getClientByNumber = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { clientNumber } = req.params;
            const organizationId = req.query.organizationId || context.organizationId;
            const client = await this.clientService.getClientByNumber(clientNumber, organizationId, context);
            res.json({
                success: true,
                data: client,
            });
        });
        this.createClient = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const input = req.body;
            const client = await this.clientService.createClient(input, context);
            res.status(201).json({
                success: true,
                data: client,
                message: 'Client created successfully',
            });
        });
        this.updateClient = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id } = req.params;
            const updates = req.body;
            const client = await this.clientService.updateClient(id, updates, context);
            res.json({
                success: true,
                data: client,
                message: 'Client updated successfully',
            });
        });
        this.deleteClient = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id } = req.params;
            await this.clientService.deleteClient(id, context);
            res.json({
                success: true,
                message: 'Client deleted successfully',
            });
        });
        this.addEmergencyContact = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id } = req.params;
            const contact = req.body;
            const client = await this.clientService.addEmergencyContact(id, contact, context);
            res.json({
                success: true,
                data: client,
                message: 'Emergency contact added successfully',
            });
        });
        this.updateEmergencyContact = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id, contactId } = req.params;
            const updates = req.body;
            const client = await this.clientService.updateEmergencyContact(id, contactId, updates, context);
            res.json({
                success: true,
                data: client,
                message: 'Emergency contact updated successfully',
            });
        });
        this.removeEmergencyContact = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id, contactId } = req.params;
            const client = await this.clientService.removeEmergencyContact(id, contactId, context);
            res.json({
                success: true,
                data: client,
                message: 'Emergency contact removed successfully',
            });
        });
        this.addRiskFlag = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id } = req.params;
            const riskFlag = req.body;
            const client = await this.clientService.addRiskFlag(id, riskFlag, context);
            res.json({
                success: true,
                data: client,
                message: 'Risk flag added successfully',
            });
        });
        this.resolveRiskFlag = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id, flagId } = req.params;
            const client = await this.clientService.resolveRiskFlag(id, flagId, context);
            res.json({
                success: true,
                data: client,
                message: 'Risk flag resolved successfully',
            });
        });
        this.updateClientStatus = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id } = req.params;
            const { status, reason } = req.body;
            const client = await this.clientService.updateClientStatus(id, status, context, reason);
            res.json({
                success: true,
                data: client,
                message: `Client status updated to ${status}`,
            });
        });
        this.getClientSummary = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { id } = req.params;
            const client = await this.clientService.getClientById(id, context);
            const age = new Date().getFullYear() - client.dateOfBirth.getFullYear();
            const summary = {
                id: client.id,
                clientNumber: client.clientNumber,
                fullName: `${client.firstName} ${client.lastName}`,
                preferredName: client.preferredName,
                age,
                gender: client.gender,
                status: client.status,
                primaryPhone: client.primaryPhone?.number,
                primaryContact: client.emergencyContacts.find((c) => c.isPrimary),
                activeRiskFlags: client.riskFlags.filter((f) => !f.resolvedDate).length,
                criticalRiskFlags: client.riskFlags.filter((f) => !f.resolvedDate && f.severity === 'CRITICAL'),
                address: {
                    line1: client.primaryAddress.line1,
                    city: client.primaryAddress.city,
                    state: client.primaryAddress.state,
                },
                programs: client.programs.filter((p) => p.status === 'ACTIVE'),
                hasAllergies: (client.allergies?.length || 0) > 0,
                specialInstructions: client.specialInstructions,
                accessInstructions: client.accessInstructions,
            };
            res.json({
                success: true,
                data: summary,
            });
        });
        this.getClientsByBranch = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { branchId } = req.params;
            const activeOnly = req.query.activeOnly !== 'false';
            const clients = await this.clientService.getClientsByBranch(branchId, context, activeOnly);
            res.json({
                success: true,
                data: clients,
                count: clients.length,
            });
        });
        this.bulkImportClients = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { clients } = req.body;
            if (!Array.isArray(clients)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid input: expected array of clients',
                });
            }
            const results = {
                successful: [],
                failed: [],
            };
            for (const clientData of clients) {
                try {
                    const client = await this.clientService.createClient(clientData, context);
                    results.successful.push({
                        clientNumber: client.clientNumber,
                        id: client.id,
                    });
                }
                catch (error) {
                    results.failed.push({
                        clientData: {
                            firstName: clientData.firstName,
                            lastName: clientData.lastName,
                        },
                        error: error.message,
                    });
                }
            }
            return res.json({
                success: true,
                data: results,
                message: `Imported ${results.successful.length} clients, ${results.failed.length} failed`,
            });
        });
        this.getClientAuditTrail = asyncHandler(async (_req, _res) => {
            throw new Error('Audit trail retrieval not yet implemented');
        });
        this.getDashboardStats = asyncHandler(async (req, res) => {
            const context = getUserContext(req);
            const { branchId } = req.query;
            const filters = {
                organizationId: context.organizationId,
                branchId: branchId,
            };
            const allClients = await this.clientService.searchClients(filters, { page: 1, limit: 10000 }, context);
            const stats = {
                total: allClients.total,
                byStatus: {
                    inquiry: allClients.items.filter((c) => c.status === 'INQUIRY').length,
                    pendingIntake: allClients.items.filter((c) => c.status === 'PENDING_INTAKE').length,
                    active: allClients.items.filter((c) => c.status === 'ACTIVE').length,
                    inactive: allClients.items.filter((c) => c.status === 'INACTIVE').length,
                    onHold: allClients.items.filter((c) => c.status === 'ON_HOLD').length,
                    discharged: allClients.items.filter((c) => c.status === 'DISCHARGED').length,
                    deceased: allClients.items.filter((c) => c.status === 'DECEASED').length,
                },
                highRiskCount: allClients.items.filter((c) => c.riskFlags.some((f) => !f.resolvedDate && (f.severity === 'HIGH' || f.severity === 'CRITICAL'))).length,
                newThisMonth: allClients.items.filter((c) => {
                    const intakeDate = c.intakeDate ? new Date(c.intakeDate) : null;
                    if (!intakeDate)
                        return false;
                    const now = new Date();
                    return (intakeDate.getMonth() === now.getMonth() &&
                        intakeDate.getFullYear() === now.getFullYear());
                }).length,
            };
            res.json({
                success: true,
                data: stats,
            });
        });
    }
}
exports.ClientHandlers = ClientHandlers;
function createClientRouter(clientService) {
    const express = require('express');
    const router = express.Router();
    const handlers = new ClientHandlers(clientService);
    router.get('/clients', handlers.listClients);
    router.get('/clients/:id', handlers.getClient);
    router.get('/clients/number/:clientNumber', handlers.getClientByNumber);
    router.post('/clients', handlers.createClient);
    router.patch('/clients/:id', handlers.updateClient);
    router.delete('/clients/:id', handlers.deleteClient);
    router.get('/clients/:id/summary', handlers.getClientSummary);
    router.patch('/clients/:id/status', handlers.updateClientStatus);
    router.get('/clients/:id/audit-trail', handlers.getClientAuditTrail);
    router.post('/clients/:id/emergency-contacts', handlers.addEmergencyContact);
    router.patch('/clients/:id/emergency-contacts/:contactId', handlers.updateEmergencyContact);
    router.delete('/clients/:id/emergency-contacts/:contactId', handlers.removeEmergencyContact);
    router.post('/clients/:id/risk-flags', handlers.addRiskFlag);
    router.patch('/clients/:id/risk-flags/:flagId/resolve', handlers.resolveRiskFlag);
    router.get('/branches/:branchId/clients', handlers.getClientsByBranch);
    router.post('/clients/bulk-import', handlers.bulkImportClients);
    router.get('/clients/dashboard/stats', handlers.getDashboardStats);
    return router;
}
//# sourceMappingURL=client-handlers.js.map