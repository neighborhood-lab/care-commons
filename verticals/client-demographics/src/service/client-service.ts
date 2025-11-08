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
  GeocodingService,
} from '@care-commons/core';
import { getPermissionService } from '@care-commons/core';
import { Client, CreateClientInput, UpdateClientInput, ClientSearchFilters } from '../types/client';
import { ClientRepository } from '../repository/client-repository';
import { ClientValidator } from '../validation/client-validator';
import type { ClientAuditService, AuditQuery, AuditReport } from './client-audit-service';

export class ClientService {
  private repository: ClientRepository;
  private validator: ClientValidator;
  private permissionService = getPermissionService();
  private auditService?: ClientAuditService;
  private geocodingService: GeocodingService;

  constructor(repository: ClientRepository, auditService?: ClientAuditService) {
    this.repository = repository;
    this.validator = new ClientValidator();
    this.auditService = auditService;
    // Use environment variable to determine provider, default to mapbox
    const provider = (process.env.GEOCODING_PROVIDER || 'mapbox') as 'google' | 'mapbox' | 'nominatim';
    this.geocodingService = new GeocodingService(provider);
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

    // Geocode address automatically
    let geocodingData: Partial<Client> = {};
    if (input.primaryAddress) {
      try {
        const geocoded = await this.geocodingService.geocodeAddress(input.primaryAddress);
        if (geocoded) {
          geocodingData = {
            coordinates: {
              lat: geocoded.latitude,
              lng: geocoded.longitude
            },
            geocodingConfidence: geocoded.confidence,
            geocodedAt: new Date(),
            geocodingFailed: false
          };
        } else {
          console.warn(`Failed to geocode address for new client: ${input.primaryAddress.line1}`);
          geocodingData = {
            geocodingFailed: true
          };
        }
      } catch (error) {
        console.error('Geocoding error during client creation:', error);
        geocodingData = {
          geocodingFailed: true
        };
      }
    }

    // Build client entity
    const client: Partial<Client> = {
      organizationId: input.organizationId,
      branchId: input.branchId,
      clientNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
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
      ...geocodingData,
    };

    // Only add optional properties if they have values
    if (input.middleName !== undefined) client.middleName = input.middleName;
    if (input.preferredName !== undefined) client.preferredName = input.preferredName;
    if (input.gender !== undefined) client.gender = input.gender;
    if (input.primaryPhone !== undefined) client.primaryPhone = input.primaryPhone;
    if (input.email !== undefined) client.email = input.email;
    if (input.referralSource !== undefined) client.referralSource = input.referralSource;

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

    // If address changed, re-geocode
    if (updates.primaryAddress) {
      try {
        const geocoded = await this.geocodingService.geocodeAddress(updates.primaryAddress);
        if (geocoded) {
          (updates as Partial<Client>).coordinates = {
            lat: geocoded.latitude,
            lng: geocoded.longitude
          };
          (updates as Partial<Client>).geocodingConfidence = geocoded.confidence;
          (updates as Partial<Client>).geocodedAt = new Date();
          (updates as Partial<Client>).geocodingFailed = false;
        } else {
          console.warn(`Failed to geocode updated address for client ${id}: ${updates.primaryAddress.line1}`);
          (updates as Partial<Client>).geocodingFailed = true;
        }
      } catch (error) {
        console.error('Geocoding error during client update:', error);
        (updates as Partial<Client>).geocodingFailed = true;
      }
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
        if (context.branchIds[0] !== undefined) {
          filters.branchId = context.branchIds[0]; // Simplified: use first branch
        }
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
      if (reason !== undefined) {
        updates.notes = `${client.notes || ''}\n\nDischarged: ${reason}`;
      } else if (client.notes !== undefined) {
        updates.notes = client.notes;
      }
    }

    return await this.updateClient(clientId, updates, context);
  }

  /**
   * Generate unique client number
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async generateClientNumber(_organizationId: string): Promise<string> {
    // Simple implementation: timestamp-based
    // Production would use a more sophisticated approach
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CL-${timestamp}-${random}`;
  }

  /**
   * Get audit trail for a client
   * Requires auditor role or compliance permissions
   */
  async getClientAuditTrail(
    clientId: string,
    query: Omit<AuditQuery, 'clientId'>,
    context: UserContext
  ): Promise<AuditReport> {
    // Require elevated permissions for audit access
    this.permissionService.requirePermission(context, 'clients:audit');

    // Verify client exists and check access
    await this.getClientById(clientId, context);

    // Check if audit service is available
    if (!this.auditService) {
      throw new Error('Audit service not configured');
    }

    // Query audit log
    const auditReport = await this.auditService.queryAuditLog({
      ...query,
      clientId,
    });

    return auditReport;
  }

  /**
   * Manually geocode a client's address
   * Useful for re-geocoding failed addresses or updating old coordinates
   */
  async geocodeClientAddress(
    clientId: string,
    context: UserContext
  ): Promise<Client> {
    this.permissionService.requirePermission(context, 'clients:update');

    const client = await this.getClientById(clientId, context);

    if (!client.primaryAddress) {
      throw new ValidationError('Client has no address to geocode');
    }

    try {
      const geocoded = await this.geocodingService.geocodeAddress(client.primaryAddress);

      const updates: Partial<Client> = {};
      if (geocoded) {
        updates.coordinates = {
          lat: geocoded.latitude,
          lng: geocoded.longitude
        };
        updates.geocodingConfidence = geocoded.confidence;
        updates.geocodedAt = new Date();
        updates.geocodingFailed = false;
      } else {
        updates.geocodingFailed = true;
        throw new ValidationError('Failed to geocode address');
      }

      const updated = await this.repository.update(clientId, updates as UpdateClientInput, context);
      return updated;
    } catch (error) {
      console.error('Manual geocoding error:', error);
      // Mark as failed and re-throw
      await this.repository.update(
        clientId,
        { geocodingFailed: true } as UpdateClientInput,
        context
      );
      throw error;
    }
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
