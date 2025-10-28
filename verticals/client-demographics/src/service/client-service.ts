/**
 * Client service - business logic layer
 */

import { v4 as uuidv4 } from 'uuid';
import {
  UserContext,
  ValidationError,
  PermissionError,
  NotFoundError,
  PaginatedResult,
} from '@care-commons/core';
import { getPermissionService } from '@care-commons/core';
import { Client, CreateClientInput, UpdateClientInput, ClientSearchFilters } from '../types/client';
import { ClientRepository } from '../repository/client-repository';
import { ClientValidator } from '../validation/client-validator';

export class ClientService {
  private repository: ClientRepository;
  private validator: ClientValidator;
  private permissionService = getPermissionService();

  constructor(repository: ClientRepository) {
    this.repository = repository;
    this.validator = new ClientValidator();
  }

  /**
   * Create a new client
   */
  async createClient(
    input: CreateClientInput,
    context: UserContext
  ): Promise<Client> {
    // Check permissions
    this.permissionService.requirePermission(context, 'clients:create');

    // Validate input
    const validation = this.validator.validateCreate(input);
    if (!validation.success) {
      throw new ValidationError('Invalid client data', {
        errors: validation.errors,
      });
    }

    // Check for duplicate client number
    const clientNumber = await this.generateClientNumber(input.organizationId);
    const existing = await this.repository.findByClientNumber(
      clientNumber,
      input.organizationId
    );
    if (existing) {
      throw new ValidationError('Client number already exists');
    }

    // Build client entity
    const client: Partial<Client> = {
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

    // Create in database
    const created = await this.repository.create(client, context);

    return created;
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string, context: UserContext): Promise<Client> {
    this.permissionService.requirePermission(context, 'clients:read');

    const client = await this.repository.findById(id);
    if (!client) {
      throw new NotFoundError(`Client not found: ${id}`);
    }

    // Check organizational scope
    this.checkOrganizationalAccess(client, context);

    return client;
  }

  /**
   * Get client by client number
   */
  async getClientByNumber(
    clientNumber: string,
    organizationId: string,
    context: UserContext
  ): Promise<Client> {
    this.permissionService.requirePermission(context, 'clients:read');

    const client = await this.repository.findByClientNumber(
      clientNumber,
      organizationId
    );
    if (!client) {
      throw new NotFoundError(`Client not found: ${clientNumber}`);
    }

    this.checkOrganizationalAccess(client, context);

    return client;
  }

  /**
   * Update client
   */
  async updateClient(
    id: string,
    updates: UpdateClientInput,
    context: UserContext
  ): Promise<Client> {
    this.permissionService.requirePermission(context, 'clients:update');

    // Verify client exists
    await this.getClientById(id, context);

    // Validate updates
    const validation = this.validator.validateUpdate(updates);
    if (!validation.success) {
      throw new ValidationError('Invalid update data', {
        errors: validation.errors,
      });
    }

    // Apply updates
    const updated = await this.repository.update(id, updates, context);

    return updated;
  }

  /**
   * Delete (soft delete) client
   */
  async deleteClient(id: string, context: UserContext): Promise<void> {
    this.permissionService.requirePermission(context, 'clients:delete');

    // Verify client exists
    await this.getClientById(id, context);
    await this.repository.delete(id, context);
  }

  /**
   * Search clients
   */
  async searchClients(
    filters: ClientSearchFilters,
    pagination: { page: number; limit: number },
    context: UserContext
  ): Promise<PaginatedResult<Client>> {
    this.permissionService.requirePermission(context, 'clients:read');

    // Apply organizational scope to filters
    if (!context.roles.includes('SUPER_ADMIN')) {
      filters.organizationId = context.organizationId;

      // Branch-level filtering for branch admins
      if (
        context.roles.includes('BRANCH_ADMIN') &&
        context.branchIds.length > 0
      ) {
        filters.branchId = context.branchIds[0]; // Simplified: use first branch
      }
    }

    const result = await this.repository.search(filters, pagination);

    return result;
  }

  /**
   * Get clients by branch
   */
  async getClientsByBranch(
    branchId: string,
    context: UserContext,
    activeOnly: boolean = true
  ): Promise<Client[]> {
    this.permissionService.requirePermission(context, 'clients:read');

    // Check branch access
    if (
      !context.roles.includes('SUPER_ADMIN') &&
      !context.branchIds.includes(branchId)
    ) {
      throw new PermissionError('No access to this branch');
    }

    return await this.repository.findByBranch(branchId, activeOnly);
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(
    clientId: string,
    contact: Omit<import('../types/client').EmergencyContact, 'id'>,
    context: UserContext
  ): Promise<Client> {
    const client = await this.getClientById(clientId, context);

    const newContact = {
      ...contact,
      id: uuidv4(),
    };

    const emergencyContacts = [...client.emergencyContacts, newContact];

    return await this.updateClient(
      clientId,
      { emergencyContacts },
      context
    );
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(
    clientId: string,
    contactId: string,
    updates: Partial<Omit<import('../types/client').EmergencyContact, 'id'>>,
    context: UserContext
  ): Promise<Client> {
    const client = await this.getClientById(clientId, context);

    const emergencyContacts = client.emergencyContacts.map((contact) =>
      contact.id === contactId ? { ...contact, ...updates } : contact
    );

    return await this.updateClient(
      clientId,
      { emergencyContacts },
      context
    );
  }

  /**
   * Remove emergency contact
   */
  async removeEmergencyContact(
    clientId: string,
    contactId: string,
    context: UserContext
  ): Promise<Client> {
    const client = await this.getClientById(clientId, context);

    const emergencyContacts = client.emergencyContacts.filter(
      (contact) => contact.id !== contactId
    );

    return await this.updateClient(
      clientId,
      { emergencyContacts },
      context
    );
  }

  /**
   * Add risk flag
   */
  async addRiskFlag(
    clientId: string,
    riskFlag: Omit<import('../types/client').RiskFlag, 'id'>,
    context: UserContext
  ): Promise<Client> {
    const client = await this.getClientById(clientId, context);

    const newFlag = {
      ...riskFlag,
      id: uuidv4(),
      identifiedDate: new Date(),
    };

    const riskFlags = [...client.riskFlags, newFlag];

    return await this.updateClient(clientId, { riskFlags }, context);
  }

  /**
   * Resolve risk flag
   */
  async resolveRiskFlag(
    clientId: string,
    flagId: string,
    context: UserContext
  ): Promise<Client> {
    const client = await this.getClientById(clientId, context);

    const riskFlags = client.riskFlags.map((flag) =>
      flag.id === flagId ? { ...flag, resolvedDate: new Date() } : flag
    );

    return await this.updateClient(clientId, { riskFlags }, context);
  }

  /**
   * Update client status
   */
  async updateClientStatus(
    clientId: string,
    status: import('../types/client').ClientStatus,
    context: UserContext,
    reason?: string
  ): Promise<Client> {
    const client = await this.getClientById(clientId, context);

    const updates: UpdateClientInput = { status };

    if (status === 'DISCHARGED') {
      updates.notes = reason
        ? `${client.notes || ''}\n\nDischarged: ${reason}`
        : client.notes;
    }

    return await this.updateClient(clientId, updates, context);
  }

  /**
   * Generate unique client number
   */
  private async generateClientNumber(_organizationId: string): Promise<string> {
    // Simple implementation: timestamp-based
    // Production would use a more sophisticated approach
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CL-${timestamp}-${random}`;
  }

  /**
   * Check organizational access
   */
  private checkOrganizationalAccess(
    client: Client,
    context: UserContext
  ): void {
    if (context.roles.includes('SUPER_ADMIN')) {
      return;
    }

    if (client.organizationId !== context.organizationId) {
      throw new PermissionError('No access to this organization');
    }

    if (
      context.branchIds.length > 0 &&
      !context.branchIds.includes(client.branchId)
    ) {
      throw new PermissionError('No access to this branch');
    }
  }
}
