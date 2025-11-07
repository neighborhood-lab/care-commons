/**
 * Client Provider Interface and Implementation
 *
 * Provides client demographic data access for all verticals.
 * Decouples services from direct database queries.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/no-nested-conditional */

import { Database } from '../db/connection.js';
import type { UUID } from '../types/base.js';

/**
 * Client data structure for cross-vertical use
 */
export interface Client {
  id: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;

  // Contact
  primaryPhone?: Record<string, unknown>;
  alternatePhone?: Record<string, unknown>;
  email?: string;
  primaryAddress: Record<string, unknown>;

  // Demographics
  gender?: string;
  language?: string;

  // Service information
  serviceEligibility?: Record<string, unknown>;
  programs?: unknown[];
  status: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Filters for querying clients
 */
export interface ClientFilters {
  organizationId?: UUID;
  branchId?: UUID;
  branchIds?: UUID[];
  status?: string | string[];
  activeOnly?: boolean;
}

/**
 * Client Provider Interface
 *
 * Provides read access to client data for cross-vertical operations.
 * Services should depend on this interface, not the concrete implementation.
 */
export interface IClientProvider {
  /**
   * Get client by ID
   * @throws NotFoundError if client doesn't exist or is deleted
   */
  getClientById(clientId: UUID): Promise<Client | null>;

  /**
   * Get multiple clients by IDs
   */
  getClientsByIds(clientIds: UUID[]): Promise<Client[]>;

  /**
   * Get clients by branch
   */
  getClientsByBranch(branchId: UUID, activeOnly?: boolean): Promise<Client[]>;

  /**
   * Get clients by organization
   */
  getClientsByOrganization(organizationId: UUID, filters?: ClientFilters): Promise<Client[]>;
}

/**
 * Client Provider Implementation
 *
 * Concrete implementation that queries the database.
 */
export class ClientProvider implements IClientProvider {
  constructor(private database: Database) {}

  /**
   * Map database row to Client entity
   */
  private mapRowToClient(row: Record<string, unknown>): Client {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchId: row['branch_id'] as UUID,
      clientNumber: row['client_number'] as string,
      firstName: row['first_name'] as string,
      middleName: row['middle_name'] as string | undefined,
      lastName: row['last_name'] as string,
      preferredName: row['preferred_name'] as string | undefined,
      dateOfBirth: new Date(row['date_of_birth'] as string),
      primaryPhone: row['primary_phone'] ? (typeof row['primary_phone'] === 'string' ? JSON.parse(row['primary_phone']) : row['primary_phone']) : undefined,
      alternatePhone: row['alternate_phone'] ? (typeof row['alternate_phone'] === 'string' ? JSON.parse(row['alternate_phone']) : row['alternate_phone']) : undefined,
      email: row['email'] as string | undefined,
      primaryAddress: typeof row['primary_address'] === 'string' ? JSON.parse(row['primary_address']) : row['primary_address'] as Record<string, unknown>,
      gender: row['gender'] as string | undefined,
      language: row['language'] as string | undefined,
      serviceEligibility: row['service_eligibility'] ? (typeof row['service_eligibility'] === 'string' ? JSON.parse(row['service_eligibility']) : row['service_eligibility']) : undefined,
      programs: row['programs'] ? (typeof row['programs'] === 'string' ? JSON.parse(row['programs']) : row['programs']) : [],
      status: row['status'] as string,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
      deletedAt: row['deleted_at'] ? new Date(row['deleted_at'] as string) : null,
    };
  }

  async getClientById(clientId: UUID): Promise<Client | null> {
    const query = `
      SELECT
        id, organization_id, branch_id, client_number,
        first_name, middle_name, last_name, preferred_name,
        date_of_birth, primary_phone, alternate_phone, email,
        primary_address, gender, language,
        service_eligibility, programs, status,
        created_at, updated_at, deleted_at
      FROM clients
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [clientId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToClient(result.rows[0] as Record<string, unknown>);
  }

  async getClientsByIds(clientIds: UUID[]): Promise<Client[]> {
    if (clientIds.length === 0) {
      return [];
    }

    const query = `
      SELECT
        id, organization_id, branch_id, client_number,
        first_name, middle_name, last_name, preferred_name,
        date_of_birth, primary_phone, alternate_phone, email,
        primary_address, gender, language,
        service_eligibility, programs, status,
        created_at, updated_at, deleted_at
      FROM clients
      WHERE id = ANY($1) AND deleted_at IS NULL
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [clientIds]);

    return result.rows.map(row => this.mapRowToClient(row as Record<string, unknown>));
  }

  async getClientsByBranch(branchId: UUID, activeOnly: boolean = true): Promise<Client[]> {
    const statusFilter = activeOnly ? "AND status = 'ACTIVE'" : '';

    const query = `
      SELECT
        id, organization_id, branch_id, client_number,
        first_name, middle_name, last_name, preferred_name,
        date_of_birth, primary_phone, alternate_phone, email,
        primary_address, gender, language,
        service_eligibility, programs, status,
        created_at, updated_at, deleted_at
      FROM clients
      WHERE branch_id = $1 AND deleted_at IS NULL ${statusFilter}
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [branchId]);

    return result.rows.map(row => this.mapRowToClient(row as Record<string, unknown>));
  }

  async getClientsByOrganization(organizationId: UUID, filters?: ClientFilters): Promise<Client[]> {
    const whereClauses: string[] = ['organization_id = $1', 'deleted_at IS NULL'];
    const params: unknown[] = [organizationId];
    let paramIndex = 2;

    if (filters?.branchId) {
      whereClauses.push(`branch_id = $${paramIndex}`);
      params.push(filters.branchId);
      paramIndex++;
    }

    if (filters?.branchIds && filters.branchIds.length > 0) {
      whereClauses.push(`branch_id = ANY($${paramIndex})`);
      params.push(filters.branchIds);
      paramIndex++;
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        whereClauses.push(`status = ANY($${paramIndex})`);
        params.push(filters.status);
      } else {
        whereClauses.push(`status = $${paramIndex}`);
        params.push(filters.status);
      }
      paramIndex++;
    }

    if (filters?.activeOnly) {
      whereClauses.push("status = 'ACTIVE'");
    }

    const whereClause = whereClauses.join(' AND ');

    const query = `
      SELECT
        id, organization_id, branch_id, client_number,
        first_name, middle_name, last_name, preferred_name,
        date_of_birth, primary_phone, alternate_phone, email,
        primary_address, gender, language,
        service_eligibility, programs, status,
        created_at, updated_at, deleted_at
      FROM clients
      WHERE ${whereClause}
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => this.mapRowToClient(row as Record<string, unknown>));
  }
}

/**
 * Factory function to create a ClientProvider instance
 */
export function createClientProvider(database: Database): IClientProvider {
  return new ClientProvider(database);
}
