/**
 * HTTP/API handlers for Client & Demographics Management
 * 
 * RESTful endpoints for client CRUD operations and specialized workflows
 */

import { Request, Response, NextFunction, Router } from 'express';
import { UserContext } from '@care-commons/core';
import { ClientService } from '../service/client-service';
import { CreateClientInput, UpdateClientInput, ClientSearchFilters, ClientStatus, RiskType } from '../types/client';

/**
 * Extract user context from authenticated request
 */
function getUserContext(req: Request): UserContext {
  // In production, this would be populated by auth middleware
  return (req as Request & { userContext: UserContext }).userContext;
}

/**
 * Handle async route errors
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line promise/no-callback-in-promise
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Client API handlers
 */
export class ClientHandlers {
  constructor(private clientService: ClientService) { }

  /**
   * @openapi
   * /api/clients:
   *   get:
   *     tags:
   *       - Clients
   *     summary: List and search clients
   *     description: Search/list clients with pagination and filters
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Search query (name, client number, etc.)
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by organization ID
   *       - in: query
   *         name: branchId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by branch ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [INQUIRY, PENDING_INTAKE, ACTIVE, INACTIVE, ON_HOLD, DISCHARGED, DECEASED]
   *         description: Filter by client status (comma-separated for multiple)
   *       - in: query
   *         name: minAge
   *         schema:
   *           type: integer
   *         description: Minimum age filter
   *       - in: query
   *         name: maxAge
   *         schema:
   *           type: integer
   *         description: Maximum age filter
   *       - in: query
   *         name: city
   *         schema:
   *           type: string
   *         description: Filter by city
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: Filter by state code
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Items per page
   *     responses:
   *       200:
   *         description: Clients retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/PaginatedResponse'
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  listClients = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = this.buildClientSearchFilters(req);
    const pagination = this.buildPagination(req);

    const result = await this.clientService.searchClients(filters, pagination, context);

    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * Build client search filters from request query parameters
   */
  private buildClientSearchFilters(req: Request): ClientSearchFilters {
    const {
      q,
      organizationId: organizationIdParam,
      branchId: branchIdParam,
      status: statusParam,
      programId: programIdParam,
      riskType: riskTypeParam,
      minAge: minAgeParam,
      maxAge: maxAgeParam,
      city: cityParam,
      state: stateParam,
      hasActiveServices: hasActiveServicesParam,
    } = req.query;

    const filters: ClientSearchFilters = {
      query: q as string,
      organizationId: organizationIdParam as string,
    };

    if (typeof branchIdParam === 'string') {
      filters.branchId = branchIdParam.trim();
    }

    this.parseStatusFilter(statusParam, filters);
    this.parseRiskTypeFilter(riskTypeParam, filters);

    if (typeof programIdParam === 'string') {
      filters.programId = programIdParam.trim();
    }

    this.parseAgeRangeFilters(minAgeParam, maxAgeParam, filters);

    if (typeof cityParam === 'string') {
      filters.city = cityParam.trim();
    }

    if (typeof stateParam === 'string') {
      filters.state = stateParam.trim().toUpperCase();
    }

    filters.hasActiveServices = hasActiveServicesParam === 'true';

    return filters;
  }

  /**
   * Parse status filter from query parameter
   */
  private parseStatusFilter(statusParam: unknown, filters: ClientSearchFilters): void {
    if (typeof statusParam !== 'string') return;

    const validStatuses: ClientStatus[] = ['INQUIRY', 'PENDING_INTAKE', 'ACTIVE', 'INACTIVE', 'ON_HOLD', 'DISCHARGED', 'DECEASED'];
    const filtered = statusParam.split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => validStatuses.includes(s as ClientStatus)) as ClientStatus[];
    
    if (filtered.length > 0) {
      filters.status = filtered;
    }
  }

  /**
   * Parse risk type filter from query parameter
   */
  private parseRiskTypeFilter(riskTypeParam: unknown, filters: ClientSearchFilters): void {
    if (typeof riskTypeParam !== 'string') return;

    const validRiskTypes: RiskType[] = ['FALL_RISK', 'WANDERING', 'AGGRESSIVE_BEHAVIOR', 'INFECTION', 'MEDICATION_COMPLIANCE', 'DIETARY_RESTRICTION', 'ENVIRONMENTAL_HAZARD', 'SAFETY_CONCERN', 'ABUSE_NEGLECT_CONCERN', 'OTHER'];
    const filtered = riskTypeParam.split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => validRiskTypes.includes(s as RiskType)) as RiskType[];
    
    if (filtered.length > 0) {
      filters.riskType = filtered;
    }
  }

  /**
   * Parse age range filters from query parameters
   */
  private parseAgeRangeFilters(minAgeParam: unknown, maxAgeParam: unknown, filters: ClientSearchFilters): void {
    if (typeof minAgeParam === 'string') {
      const age = parseInt(minAgeParam, 10);
      if (!isNaN(age) && age >= 0 && age <= 150) {
        filters.minAge = age;
      }
    }

    if (typeof maxAgeParam === 'string') {
      const age = parseInt(maxAgeParam, 10);
      if (!isNaN(age) && age >= 0 && age <= 150) {
        filters.maxAge = age;
      }
    }
  }

  /**
   * Build pagination parameters from request query
   */
  private buildPagination(req: Request): { page: number; limit: number } {
    const { page: pageParam, limit: limitParam } = req.query;

    const parsedPage = typeof pageParam === 'string' ? parseInt(pageParam, 10) : NaN;
    const parsedLimit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : NaN;

    return {
      page: (!isNaN(parsedPage) && parsedPage > 0) ? parsedPage : 1,
      limit: (!isNaN(parsedLimit) && parsedLimit > 0) ? parsedLimit : 20,
    };
  }

  /**
   * @openapi
   * /api/clients/{id}:
   *   get:
   *     tags:
   *       - Clients
   *     summary: Get client by ID
   *     description: Retrieve a single client by their unique identifier
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Client UUID
   *     responses:
   *       200:
   *         description: Client found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Client'
   *       400:
   *         description: Invalid client ID
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Client not found
   *       500:
   *         description: Server error
   */
  getClient = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    const client = await this.clientService.getClientById(id, context);

    return res.json({
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
    const orgIdFromQuery = req.query['organizationId'];
    const organizationId = (typeof orgIdFromQuery === 'string' && orgIdFromQuery !== '') ? orgIdFromQuery : context.organizationId;

    if (typeof clientNumber !== 'string' || clientNumber === '' || typeof organizationId !== 'string' || organizationId === '') {
      return res.status(400).json({
        success: false,
        error: 'Client number and organization ID are required',
      });
    }

    const client = await this.clientService.getClientByNumber(
      clientNumber,
      organizationId,
      context
    );

    return res.json({
      success: true,
      data: client,
    });
  });

  /**
   * @openapi
   * /api/clients:
   *   post:
   *     tags:
   *       - Clients
   *     summary: Create new client
   *     description: Create a new client record with demographics and intake information
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - dateOfBirth
   *               - organizationId
   *             properties:
   *               firstName:
   *                 type: string
   *                 example: John
   *               lastName:
   *                 type: string
   *                 example: Doe
   *               dateOfBirth:
   *                 type: string
   *                 format: date
   *                 example: 1950-01-15
   *               organizationId:
   *                 type: string
   *                 format: uuid
   *               primaryAddress:
   *                 $ref: '#/components/schemas/Address'
   *               primaryPhone:
   *                 type: object
   *                 properties:
   *                   number:
   *                     type: string
   *                   type:
   *                     type: string
   *                     enum: [MOBILE, HOME, WORK]
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       201:
   *         description: Client created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Client'
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  createClient = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreateClientInput = req.body;

    const client = await this.clientService.createClient(input, context);

    return res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  });

  /**
   * @openapi
   * /api/clients/{id}:
   *   patch:
   *     tags:
   *       - Clients
   *     summary: Update client
   *     description: Update existing client information (partial update)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Client UUID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               primaryAddress:
   *                 $ref: '#/components/schemas/Address'
   *               primaryPhone:
   *                 type: object
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Client updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Client'
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Client not found
   *       500:
   *         description: Server error
   */
  updateClient = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const updates: UpdateClientInput = req.body;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    const client = await this.clientService.updateClient(id, updates, context);

    return res.json({
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

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    await this.clientService.deleteClient(id, context);

    return res.json({
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

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    const client = await this.clientService.addEmergencyContact(id, contact, context);

    return res.json({
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

    if (typeof id !== 'string' || id === '' || typeof contactId !== 'string' || contactId === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID and contact ID are required',
      });
    }

    const client = await this.clientService.updateEmergencyContact(
      id,
      contactId,
      updates,
      context
    );

    return res.json({
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

    if (typeof id !== 'string' || id === '' || typeof contactId !== 'string' || contactId === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID and contact ID are required',
      });
    }

    const client = await this.clientService.removeEmergencyContact(id, contactId, context);

    return res.json({
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

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    const client = await this.clientService.addRiskFlag(id, riskFlag, context);

    return res.json({
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

    if (typeof id !== 'string' || id === '' || typeof flagId !== 'string' || flagId === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID and flag ID are required',
      });
    }

    const client = await this.clientService.resolveRiskFlag(id, flagId, context);

    return res.json({
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

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    const client = await this.clientService.updateClientStatus(id, status, context, reason);

    return res.json({
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

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

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
      primaryContact: client.emergencyContacts.find((c) => c.isPrimary) ?? null,
      activeRiskFlags: (client.riskFlags || []).filter((f) => f.resolvedDate === null || f.resolvedDate === undefined).length,
      criticalRiskFlags: (client.riskFlags || []).filter(
        (f) => (f.resolvedDate === null || f.resolvedDate === undefined) && f.severity === 'CRITICAL'
      ),
      address: client.primaryAddress ? {
        line1: client.primaryAddress.line1,
        city: client.primaryAddress.city,
        state: client.primaryAddress.state,
      } : null,
      programs: (client.programs || []).filter((p) => p.status === 'ACTIVE'),
      hasAllergies: (client.allergies?.length ?? 0) > 0,
      specialInstructions: client.specialInstructions,
      accessInstructions: client.accessInstructions,
    };

    return res.json({
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
    const activeOnlyParam = req.query['activeOnly'];
    const activeOnly = activeOnlyParam !== 'false';

    if (typeof branchId !== 'string' || branchId === '') {
      return res.status(400).json({
        success: false,
        error: 'Branch ID is required',
      });
    }

    const clients = await this.clientService.getClientsByBranch(branchId, context, activeOnly);

    return res.json({
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
      successful: [] as Array<{ clientNumber: string; id: string }>,
      failed: [] as Array<{ clientData: { firstName: string; lastName: string }; error: string }>,
    };

    for (const clientData of clients) {
      try {
        const client = await this.clientService.createClient(clientData, context);
        results.successful.push({
          clientNumber: client.clientNumber,
          id: client.id,
        });
      } catch (error: unknown) {
        results.failed.push({
          clientData: {
            firstName: clientData.firstName,
            lastName: clientData.lastName,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
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
  getClientAuditTrail = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    // Extract query parameters for filtering
    const {
      accessType: accessTypeParam,
      accessedBy: accessedByParam,
      startDate: startDateParam,
      endDate: endDateParam,
      disclosuresOnly: disclosuresOnlyParam,
      page: pageParam,
      limit: limitParam,
    } = req.query;

    // Build audit query filters - handle accessType as array
    let accessType: ('VIEW' | 'UPDATE' | 'CREATE' | 'DELETE' | 'DISCLOSURE' | 'EXPORT' | 'PRINT')[] | undefined;
    if (typeof accessTypeParam === 'string' && accessTypeParam !== '') {
      const types = accessTypeParam.split(',').map(t => t.trim().toUpperCase());
      const validTypes = ['VIEW', 'UPDATE', 'CREATE', 'DELETE', 'DISCLOSURE', 'EXPORT', 'PRINT'];
      accessType = types.filter(t => validTypes.includes(t)) as typeof accessType;
    }

    const accessedBy = typeof accessedByParam === 'string' && accessedByParam !== '' ? accessedByParam : undefined;
    const startDate = typeof startDateParam === 'string' && startDateParam !== '' ? new Date(startDateParam) : undefined;
    const endDate = typeof endDateParam === 'string' && endDateParam !== '' ? new Date(endDateParam) : undefined;
    const disclosuresOnly = disclosuresOnlyParam === 'true';

    // Parse pagination
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : 50;
    const offset = (page - 1) * limit;

    // Get audit trail from service
    const auditTrail = await this.clientService.getClientAuditTrail(
      id,
      {
        accessType,
        accessedBy,
        startDate,
        endDate,
        disclosuresOnly,
        limit,
        offset,
      },
      context
    );

    return res.json({
      success: true,
      data: auditTrail,
    });
  });

  /**
   * GET /api/clients/dashboard
   * Get comprehensive dashboard data with client details, visits, tasks, and alerts
   */
  getClientsDashboard = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = this.buildClientSearchFilters(req);
    const pagination = this.buildPagination(req);

    // Get clients with filters
    const result = await this.clientService.searchClients(filters, pagination, context);

    // Enrich each client with dashboard-specific data
    const enrichedClients = result.items.map((client) => {
      const age = new Date().getFullYear() - client.dateOfBirth.getFullYear();
      const activeRiskFlags = (client.riskFlags || []).filter(
        (f) => f.resolvedDate === null || f.resolvedDate === undefined
      );
      const criticalRisks = activeRiskFlags.filter((f) => f.severity === 'CRITICAL');

      return {
        id: client.id,
        clientNumber: client.clientNumber,
        fullName: `${client.firstName} ${client.lastName}`,
        preferredName: client.preferredName,
        age,
        status: client.status,
        primaryPhone: client.primaryPhone?.number ?? null,
        address: client.primaryAddress ? {
          line1: client.primaryAddress.line1,
          city: client.primaryAddress.city,
          state: client.primaryAddress.state,
        } : null,
        alertsCount: activeRiskFlags.length,
        criticalAlerts: criticalRisks.length,
        hasCriticalRisks: criticalRisks.length > 0,
        programs: (client.programs || []).filter((p) => p.status === 'ACTIVE').map((p) => ({
          id: p.id,
          name: p.programName,
        })),
        // Placeholders for data from other verticals (to be populated via provider pattern)
        nextVisit: null, // Would be populated from visit provider
        recentNotes: [], // Would be populated from visit notes
        outstandingTasks: 0, // Would be populated from care plan tasks
        lastVisitDate: null, // Would be populated from visit provider
      };
    });

    res.json({
      success: true,
      data: {
        items: enrichedClients,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  });

  /**
   * GET /api/clients/dashboard/stats
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const branchIdParam = req.query['branchId'];

    // Get clients for the branch or organization
    const filters: ClientSearchFilters = {
      organizationId: context.organizationId,
    };

    if (typeof branchIdParam === 'string') {
      filters.branchId = branchIdParam;
    }

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
        if (!c.intakeDate) return false;
        const intakeDate = new Date(c.intakeDate);
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

  /**
   * @openapi
   * /api/clients/{id}/geocode:
   *   post:
   *     tags:
   *       - Clients
   *     summary: Manually geocode client address
   *     description: Geocode a client's primary address and update coordinates
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Client ID
   *     responses:
   *       200:
   *         description: Address geocoded successfully
   *       400:
   *         description: Invalid request or geocoding failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Client not found
   */
  geocodeClientAddress = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const context = getUserContext(req);
    const clientId = req.params.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required',
      });
    }

    const client = await this.clientService.geocodeClientAddress(clientId, context);

    return res.json({
      success: true,
      data: {
        id: client.id,
        coordinates: client.coordinates,
        geocodingConfidence: client.geocodingConfidence,
        geocodedAt: client.geocodedAt,
      },
    });
  });
}

/**
 * Create router with all client endpoints
 */
export function createClientRouter(clientService: ClientService): Router {
  const router = Router();
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
  router.post('/clients/:id/geocode', handlers.geocodeClientAddress);

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
  router.get('/clients/dashboard', handlers.getClientsDashboard);

  return router;
}
