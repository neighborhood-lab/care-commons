/**
 * HTTP/API handlers for Client & Demographics Management
 * 
 * RESTful endpoints for client CRUD operations and specialized workflows
 */

import { Request, Response, NextFunction } from 'express';
import { UserContext } from '@care-commons/core';
import { ClientService } from '../service/client-service';
import { CreateClientInput, UpdateClientInput, ClientSearchFilters } from '../types/client';

/**
 * Extract user context from authenticated request
 */
function getUserContext(req: Request): UserContext {
  // In production, this would be populated by auth middleware
  return (req as any).userContext as UserContext;
}

/**
 * Handle async route errors
 */
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Client API handlers
 */
export class ClientHandlers {
  constructor(private clientService: ClientService) { }

  /**
   * GET /api/clients
   * Search/list clients with pagination and filters
   */
  listClients = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);

    // Extract query parameters
    const filters: ClientSearchFilters = {
      query: req.query.q as string,
      organizationId: req.query.organizationId as string,
      branchId: req.query.branchId as string,
      status: req.query.status ? (req.query.status as string).split(',') as any[] : undefined,
      programId: req.query.programId as string,
      riskType: req.query.riskType ? (req.query.riskType as string).split(',') as any[] : undefined,
      minAge: req.query.minAge ? parseInt(req.query.minAge as string) : undefined,
      maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined,
      city: req.query.city as string,
      state: req.query.state as string,
      hasActiveServices: req.query.hasActiveServices === 'true',
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await this.clientService.searchClients(filters, pagination, context);

    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/clients/:id
   * Get single client by ID
   */
  getClient = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    const client = await this.clientService.getClientById(id, context);

    res.json({
      success: true,
      data: client,
    });
  });

  /**
   * GET /api/clients/number/:clientNumber
   * Get client by client number
   */
  getClientByNumber = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { clientNumber } = req.params;
    const organizationId = req.query.organizationId as string || context.organizationId;

    const client = await this.clientService.getClientByNumber(
      clientNumber,
      organizationId,
      context
    );

    res.json({
      success: true,
      data: client,
    });
  });

  /**
   * POST /api/clients
   * Create new client
   */
  createClient = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreateClientInput = req.body;

    const client = await this.clientService.createClient(input, context);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  });

  /**
   * PATCH /api/clients/:id
   * Update existing client
   */
  updateClient = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const updates: UpdateClientInput = req.body;

    const client = await this.clientService.updateClient(id, updates, context);

    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });
  });

  /**
   * DELETE /api/clients/:id
   * Soft delete client
   */
  deleteClient = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    await this.clientService.deleteClient(id, context);

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  });

  /**
   * POST /api/clients/:id/emergency-contacts
   * Add emergency contact to client
   */
  addEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * PATCH /api/clients/:id/emergency-contacts/:contactId
   * Update emergency contact
   */
  updateEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id, contactId } = req.params;
    const updates = req.body;

    const client = await this.clientService.updateEmergencyContact(
      id,
      contactId,
      updates,
      context
    );

    res.json({
      success: true,
      data: client,
      message: 'Emergency contact updated successfully',
    });
  });

  /**
   * DELETE /api/clients/:id/emergency-contacts/:contactId
   * Remove emergency contact
   */
  removeEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id, contactId } = req.params;

    const client = await this.clientService.removeEmergencyContact(id, contactId, context);

    res.json({
      success: true,
      data: client,
      message: 'Emergency contact removed successfully',
    });
  });

  /**
   * POST /api/clients/:id/risk-flags
   * Add risk flag to client
   */
  addRiskFlag = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * PATCH /api/clients/:id/risk-flags/:flagId/resolve
   * Resolve a risk flag
   */
  resolveRiskFlag = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id, flagId } = req.params;

    const client = await this.clientService.resolveRiskFlag(id, flagId, context);

    res.json({
      success: true,
      data: client,
      message: 'Risk flag resolved successfully',
    });
  });

  /**
   * PATCH /api/clients/:id/status
   * Update client status (with workflow validation)
   */
  updateClientStatus = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * GET /api/clients/:id/summary
   * Get client summary (optimized for dashboard/cards)
   */
  getClientSummary = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    const client = await this.clientService.getClientById(id, context);

    // Calculate age
    const age = new Date().getFullYear() - client.dateOfBirth.getFullYear();

    // Extract key information
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
      criticalRiskFlags: client.riskFlags.filter(
        (f) => !f.resolvedDate && f.severity === 'CRITICAL'
      ),
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

  /**
   * GET /api/branches/:branchId/clients
   * Get all clients for a branch
   */
  getClientsByBranch = asyncHandler(async (req: Request, res: Response) => {
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

  /**
   * POST /api/clients/bulk-import
   * Bulk import clients (for migrations/data loading)
   */
  bulkImportClients = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { clients } = req.body;

    if (!Array.isArray(clients)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: expected array of clients',
      });
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    for (const clientData of clients) {
      try {
        const client = await this.clientService.createClient(clientData, context);
        results.successful.push({
          clientNumber: client.clientNumber,
          id: client.id,
        });
      } catch (error: any) {
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

  /**
   * GET /api/clients/:id/audit-trail
   * Get full audit history for a client (requires auditor role)
   */
  getClientAuditTrail = asyncHandler(async (_req: Request, _res: Response) => {
    // This would typically query the audit_log table
    // For now, return a placeholder
    throw new Error('Audit trail retrieval not yet implemented');
  });

  /**
   * GET /api/clients/dashboard/stats
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { branchId } = req.query;

    // Get clients for the branch or organization
    const filters: ClientSearchFilters = {
      organizationId: context.organizationId,
      branchId: branchId as string,
    };

    const allClients = await this.clientService.searchClients(
      filters,
      { page: 1, limit: 10000 },
      context
    );

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
      highRiskCount: allClients.items.filter((c) =>
        c.riskFlags.some((f) => !f.resolvedDate && (f.severity === 'HIGH' || f.severity === 'CRITICAL'))
      ).length,
      newThisMonth: allClients.items.filter((c) => {
        const intakeDate = c.intakeDate ? new Date(c.intakeDate) : null;
        if (!intakeDate) return false;
        const now = new Date();
        return (
          intakeDate.getMonth() === now.getMonth() &&
          intakeDate.getFullYear() === now.getFullYear()
        );
      }).length,
    };

    res.json({
      success: true,
      data: stats,
    });
  });
}

/**
 * Create router with all client endpoints
 */
export function createClientRouter(clientService: ClientService) {
  const express = require('express');
  const router = express.Router();
  const handlers = new ClientHandlers(clientService);

  // Main CRUD endpoints
  router.get('/clients', handlers.listClients);
  router.get('/clients/:id', handlers.getClient);
  router.get('/clients/number/:clientNumber', handlers.getClientByNumber);
  router.post('/clients', handlers.createClient);
  router.patch('/clients/:id', handlers.updateClient);
  router.delete('/clients/:id', handlers.deleteClient);

  // Specialized endpoints
  router.get('/clients/:id/summary', handlers.getClientSummary);
  router.patch('/clients/:id/status', handlers.updateClientStatus);
  router.get('/clients/:id/audit-trail', handlers.getClientAuditTrail);

  // Emergency contacts
  router.post('/clients/:id/emergency-contacts', handlers.addEmergencyContact);
  router.patch('/clients/:id/emergency-contacts/:contactId', handlers.updateEmergencyContact);
  router.delete('/clients/:id/emergency-contacts/:contactId', handlers.removeEmergencyContact);

  // Risk flags
  router.post('/clients/:id/risk-flags', handlers.addRiskFlag);
  router.patch('/clients/:id/risk-flags/:flagId/resolve', handlers.resolveRiskFlag);

  // Branch operations
  router.get('/branches/:branchId/clients', handlers.getClientsByBranch);

  // Bulk operations
  router.post('/clients/bulk-import', handlers.bulkImportClients);

  // Dashboard
  router.get('/clients/dashboard/stats', handlers.getDashboardStats);

  return router;
}
