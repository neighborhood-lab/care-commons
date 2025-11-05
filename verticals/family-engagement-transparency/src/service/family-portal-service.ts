/**
 * Family Portal Service
 *
 * Core service for family portal operations including contact management,
 * access control, and portal interactions.
 */

import { Database, UUID } from '@care-commons/core';
import { FamilyContactRepository } from '../repository/family-contact-repository.js';
import {
  AuthorizedFamilyContact,
  CreateFamilyContactInput,
  UpdateFamilyContactInput,
  FamilyContactSearchCriteria,
  UserContext,
  PaginationParams,
  PaginatedResponse,
} from '../types/index.js';

export class FamilyPortalService {
  private familyContactRepo: FamilyContactRepository;

  constructor(private database: Database) {
    this.familyContactRepo = new FamilyContactRepository(database);
  }

  /**
   * Create a new family contact
   */
  async createFamilyContact(
    input: CreateFamilyContactInput,
    context: UserContext
  ): Promise<AuthorizedFamilyContact> {
    // TODO: Add permission check
    // await this.checkPermission(context, 'family-contacts:create');

    // Check if email already exists for this client
    const existing = await this.familyContactRepo.getByEmail(
      input.email,
      input.organizationId
    );

    if (existing && existing.clientId === input.clientId) {
      throw new Error('A family contact with this email already exists for this client');
    }

    const contact = await this.familyContactRepo.createFamilyContact(input, context.userId);

    // Generate access code if portal access is enabled
    if (input.portalAccessEnabled && input.generateAccessCode) {
      await this.familyContactRepo.generateAccessCode(contact.id);
    }

    return contact;
  }

  /**
   * Get family contact by ID
   */
  async getFamilyContact(id: UUID, context: UserContext): Promise<AuthorizedFamilyContact | null> {
    // TODO: Add permission check
    const contact = await this.familyContactRepo.getById(id);

    if (contact && contact.organizationId !== context.organizationId) {
      throw new Error('Unauthorized access to family contact');
    }

    return contact;
  }

  /**
   * Get all family contacts for a client
   */
  async getClientFamilyContacts(
    clientId: UUID,
    context: UserContext,
    activeOnly = true
  ): Promise<AuthorizedFamilyContact[]> {
    // TODO: Add permission check
    return this.familyContactRepo.getByClientId(clientId, activeOnly);
  }

  /**
   * Update family contact
   */
  async updateFamilyContact(
    id: UUID,
    input: UpdateFamilyContactInput,
    context: UserContext
  ): Promise<AuthorizedFamilyContact> {
    // TODO: Add permission check
    const existing = await this.familyContactRepo.getById(id);
    if (!existing) {
      throw new Error(`Family contact with ID ${id} not found`);
    }

    if (existing.organizationId !== context.organizationId) {
      throw new Error('Unauthorized access to family contact');
    }

    const updated = await this.familyContactRepo.updateFamilyContact(
      id,
      input,
      context.userId
    );

    // Regenerate access code if requested
    if (input.regenerateAccessCode) {
      await this.familyContactRepo.generateAccessCode(id);
    }

    return updated;
  }

  /**
   * Search family contacts
   */
  async searchFamilyContacts(
    criteria: FamilyContactSearchCriteria,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResponse<AuthorizedFamilyContact>> {
    // TODO: Add permission check
    // Ensure search is scoped to user's organization
    const searchCriteria = {
      ...criteria,
      organizationId: context.organizationId,
    };

    return this.familyContactRepo.search(searchCriteria, pagination);
  }

  /**
   * Authenticate with access code
   */
  async authenticateWithAccessCode(accessCode: string): Promise<AuthorizedFamilyContact | null> {
    return this.familyContactRepo.getByAccessCode(accessCode);
  }

  /**
   * Record portal access
   */
  async recordPortalAccess(contactId: UUID, context: UserContext): Promise<void> {
    const contact = await this.familyContactRepo.getById(contactId);
    if (!contact) {
      throw new Error(`Family contact with ID ${contactId} not found`);
    }

    if (!contact.portalAccessEnabled || contact.status !== 'ACTIVE') {
      throw new Error('Portal access is not enabled for this contact');
    }

    await this.familyContactRepo.updateLastPortalAccess(contactId);
  }

  /**
   * Deactivate family contact
   */
  async deactivateFamilyContact(
    id: UUID,
    reason: string,
    context: UserContext
  ): Promise<AuthorizedFamilyContact> {
    return this.familyContactRepo.updateFamilyContact(
      id,
      {
        status: 'INACTIVE',
        statusNotes: reason,
        portalAccessEnabled: false,
      },
      context.userId
    );
  }

  /**
   * Reactivate family contact
   */
  async reactivateFamilyContact(
    id: UUID,
    context: UserContext
  ): Promise<AuthorizedFamilyContact> {
    return this.familyContactRepo.updateFamilyContact(
      id,
      {
        status: 'ACTIVE',
        portalAccessEnabled: true,
      },
      context.userId
    );
  }

  /**
   * Get legal guardians for a client
   */
  async getLegalGuardians(
    clientId: UUID,
    context: UserContext
  ): Promise<AuthorizedFamilyContact[]> {
    const contacts = await this.familyContactRepo.getByClientId(clientId, true);
    return contacts.filter(c => c.isLegalGuardian);
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    contactId: UUID,
    preferences: AuthorizedFamilyContact['notificationPreferences'],
    context: UserContext
  ): Promise<AuthorizedFamilyContact> {
    return this.familyContactRepo.updateFamilyContact(
      contactId,
      { notificationPreferences: preferences },
      context.userId
    );
  }
}
