/**
 * @care-commons/core - Organization Repository
 * 
 * Data access layer for multi-tenant organizations with state-based isolation
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import {
  Organization,
  OrganizationStatus,
  CreateOrganizationRequest,
  Address,
  OrganizationSettings,
  USStateCode,
} from '../types/organization';

export interface IOrganizationRepository {
  getOrganizationById(id: UUID): Promise<Organization | null>;
  getOrganizationsByState(stateCode: USStateCode): Promise<Organization[]>;
  createOrganization(
    request: Omit<CreateOrganizationRequest, 'adminUser'>,
    createdBy: UUID
  ): Promise<Organization>;
  updateOrganization(
    id: UUID,
    updates: Partial<Omit<Organization, 'id' | 'createdAt' | 'createdBy'>>,
    updatedBy: UUID
  ): Promise<Organization>;
  deleteOrganization(id: UUID, deletedBy: UUID): Promise<void>;
  checkEmailExists(email: string): Promise<boolean>;
}

export class OrganizationRepository implements IOrganizationRepository {
  constructor(private db: Database) {}

  async getOrganizationById(id: UUID): Promise<Organization | null> {
    const query = `
      SELECT 
        id, name, legal_name, state_code, tax_id, license_number,
        phone, email, website, primary_address, billing_address,
        settings, status, created_at, created_by, updated_at, updated_by,
        version, deleted_at, deleted_by
      FROM organizations
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<{
      id: string;
      name: string;
      legal_name: string | null;
      state_code: string;
      tax_id: string | null;
      license_number: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      primary_address: Address;
      billing_address: Address | null;
      settings: OrganizationSettings;
      status: OrganizationStatus;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
      version: number;
      deleted_at: Date | null;
      deleted_by: string | null;
    }>(query, [id]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToOrganization(row);
  }

  async getOrganizationsByState(stateCode: USStateCode): Promise<Organization[]> {
    const query = `
      SELECT 
        id, name, legal_name, state_code, tax_id, license_number,
        phone, email, website, primary_address, billing_address,
        settings, status, created_at, created_by, updated_at, updated_by,
        version, deleted_at, deleted_by
      FROM organizations
      WHERE state_code = $1 AND deleted_at IS NULL
      ORDER BY name
    `;

    const result = await this.db.query<{
      id: string;
      name: string;
      legal_name: string | null;
      state_code: string;
      tax_id: string | null;
      license_number: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      primary_address: Address;
      billing_address: Address | null;
      settings: OrganizationSettings;
      status: OrganizationStatus;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
      version: number;
      deleted_at: Date | null;
      deleted_by: string | null;
    }>(query, [stateCode]);

    return result.rows.map((row) => this.mapRowToOrganization(row));
  }

  async createOrganization(
    request: Omit<CreateOrganizationRequest, 'adminUser'>,
    createdBy: UUID
  ): Promise<Organization> {
    const query = `
      INSERT INTO organizations (
        name, legal_name, state_code, tax_id, license_number,
        phone, email, website, primary_address, billing_address,
        settings, status, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE', $12, $12)
      RETURNING 
        id, name, legal_name, state_code, tax_id, license_number,
        phone, email, website, primary_address, billing_address,
        settings, status, created_at, created_by, updated_at, updated_by,
        version, deleted_at, deleted_by
    `;

    const result = await this.db.query<{
      id: string;
      name: string;
      legal_name: string | null;
      state_code: string;
      tax_id: string | null;
      license_number: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      primary_address: Address;
      billing_address: Address | null;
      settings: OrganizationSettings;
      status: OrganizationStatus;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
      version: number;
      deleted_at: Date | null;
      deleted_by: string | null;
    }>(query, [
      request.name,
      request.legalName ?? null,
      request.stateCode,
      request.taxId ?? null,
      request.licenseNumber ?? null,
      request.phone ?? null,
      request.email,
      request.website ?? null,
      JSON.stringify(request.primaryAddress),
      request.billingAddress != null ? JSON.stringify(request.billingAddress) : null,
      JSON.stringify({}),
      createdBy,
    ]);

    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Failed to create organization');
    }

    return this.mapRowToOrganization(row);
  }

  async updateOrganization(
    id: UUID,
    updates: Partial<Omit<Organization, 'id' | 'createdAt' | 'createdBy'>>,
    updatedBy: UUID
  ): Promise<Organization> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.legalName !== undefined) {
      setClauses.push(`legal_name = $${paramIndex++}`);
      values.push(updates.legalName);
    }
    if (updates.stateCode !== undefined) {
      setClauses.push(`state_code = $${paramIndex++}`);
      values.push(updates.stateCode);
    }
    if (updates.taxId !== undefined) {
      setClauses.push(`tax_id = $${paramIndex++}`);
      values.push(updates.taxId);
    }
    if (updates.licenseNumber !== undefined) {
      setClauses.push(`license_number = $${paramIndex++}`);
      values.push(updates.licenseNumber);
    }
    if (updates.phone !== undefined) {
      setClauses.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.website !== undefined) {
      setClauses.push(`website = $${paramIndex++}`);
      values.push(updates.website);
    }
    if (updates.primaryAddress !== undefined) {
      setClauses.push(`primary_address = $${paramIndex++}`);
      values.push(JSON.stringify(updates.primaryAddress));
    }
    if (updates.billingAddress !== undefined) {
      setClauses.push(`billing_address = $${paramIndex++}`);
      values.push(updates.billingAddress != null ? JSON.stringify(updates.billingAddress) : null);
    }
    if (updates.settings !== undefined) {
      setClauses.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(updates.settings));
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    setClauses.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);
    setClauses.push(`version = version + 1`);

    values.push(id);

    const query = `
      UPDATE organizations
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING 
        id, name, legal_name, state_code, tax_id, license_number,
        phone, email, website, primary_address, billing_address,
        settings, status, created_at, created_by, updated_at, updated_by,
        version, deleted_at, deleted_by
    `;

    const result = await this.db.query<{
      id: string;
      name: string;
      legal_name: string | null;
      state_code: string;
      tax_id: string | null;
      license_number: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      primary_address: Address;
      billing_address: Address | null;
      settings: OrganizationSettings;
      status: OrganizationStatus;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
      version: number;
      deleted_at: Date | null;
      deleted_by: string | null;
    }>(query, values);

    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Organization not found or already deleted');
    }

    return this.mapRowToOrganization(row);
  }

  async deleteOrganization(id: UUID, deletedBy: UUID): Promise<void> {
    const query = `
      UPDATE organizations
      SET deleted_at = NOW(), deleted_by = $2
      WHERE id = $1 AND deleted_at IS NULL
    `;

    await this.db.query(query, [id, deletedBy]);
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM organizations
        WHERE email = $1 AND deleted_at IS NULL
      ) as exists
    `;

    const result = await this.db.query<{ exists: boolean }>(query, [email]);
    return result.rows[0]?.exists ?? false;
  }

  private mapRowToOrganization(row: {
    id: string;
    name: string;
    legal_name: string | null;
    state_code: string;
    tax_id: string | null;
    license_number: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    primary_address: Address;
    billing_address: Address | null;
    settings: OrganizationSettings;
    status: OrganizationStatus;
    created_at: Date;
    created_by: string;
    updated_at: Date;
    updated_by: string;
    version: number;
    deleted_at: Date | null;
    deleted_by: string | null;
  }): Organization {
    return {
      id: row.id,
      name: row.name,
      legalName: row.legal_name,
      stateCode: row.state_code as USStateCode,
      taxId: row.tax_id,
      licenseNumber: row.license_number,
      phone: row.phone,
      email: row.email,
      website: row.website,
      primaryAddress: row.primary_address,
      billingAddress: row.billing_address,
      settings: row.settings,
      status: row.status,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }
}
