/**
 * Caregiver Provider Interface and Implementation
 *
 * Provides caregiver/staff data access for all verticals.
 * Decouples services from direct database queries.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/todo-tag */
/* eslint-disable sonarjs/cognitive-complexity */

import { Database } from '../db/connection';
import type { UUID } from '../types/base';

/**
 * Caregiver data structure for cross-vertical use
 */
export interface Caregiver {
  id: UUID;
  organizationId: UUID;
  branchIds: UUID[];
  primaryBranchId: UUID;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;

  // Contact
  primaryPhone?: Record<string, unknown>;
  email: string;

  // Skills and qualifications
  credentials?: unknown[];
  certifications?: unknown[];
  skills?: string[];

  // Employment
  status: string;
  hireDate?: Date;
  terminationDate?: Date;

  // Compliance
  backgroundCheck?: Record<string, unknown>;
  complianceStatus?: Record<string, unknown>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Filters for querying caregivers
 */
export interface CaregiverFilters {
  organizationId?: UUID;
  branchId?: UUID;
  branchIds?: UUID[];
  status?: string | string[];
  activeOnly?: boolean;
  hasSkills?: string[];
  hasCertifications?: string[];
  availableForDate?: Date;
}

/**
 * Caregiver Provider Interface
 *
 * Provides read access to caregiver data for cross-vertical operations.
 * Services should depend on this interface, not the concrete implementation.
 */
export interface ICaregiverProvider {
  /**
   * Get caregiver by ID
   * @throws NotFoundError if caregiver doesn't exist or is deleted
   */
  getCaregiverById(caregiverId: UUID): Promise<Caregiver | null>;

  /**
   * Get multiple caregivers by IDs
   */
  getCaregiversByIds(caregiverIds: UUID[]): Promise<Caregiver[]>;

  /**
   * Get caregivers by branch
   */
  getCaregiversByBranch(branchId: UUID, activeOnly?: boolean): Promise<Caregiver[]>;

  /**
   * Get caregivers by organization
   */
  getCaregiversByOrganization(organizationId: UUID, filters?: CaregiverFilters): Promise<Caregiver[]>;

  /**
   * Get available caregivers for a specific date/time range
   * (This is a simplified version - full implementation would check against schedules)
   */
  getAvailableCaregivers(startTime: Date, endTime: Date, branchId?: UUID): Promise<Caregiver[]>;
}

/**
 * Caregiver Provider Implementation
 *
 * Concrete implementation that queries the database.
 */
export class CaregiverProvider implements ICaregiverProvider {
  constructor(private database: Database) {}

  /**
   * Map database row to Caregiver entity
   */
  private mapRowToCaregiver(row: Record<string, unknown>): Caregiver {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchIds: row['branch_ids'] ? (Array.isArray(row['branch_ids']) ? row['branch_ids'] : JSON.parse(row['branch_ids'] as string)) : [],
      primaryBranchId: row['primary_branch_id'] as UUID,
      employeeNumber: row['employee_number'] as string,
      firstName: row['first_name'] as string,
      middleName: row['middle_name'] as string | undefined,
      lastName: row['last_name'] as string,
      preferredName: row['preferred_name'] as string | undefined,
      primaryPhone: row['primary_phone'] ? (typeof row['primary_phone'] === 'string' ? JSON.parse(row['primary_phone']) : row['primary_phone']) : undefined,
      email: row['email'] as string,
      credentials: row['credentials'] ? (typeof row['credentials'] === 'string' ? JSON.parse(row['credentials']) : row['credentials']) : [],
      certifications: row['certifications'] ? (typeof row['certifications'] === 'string' ? JSON.parse(row['certifications']) : row['certifications']) : [],
      skills: row['skills'] ? (Array.isArray(row['skills']) ? row['skills'] : (typeof row['skills'] === 'string' ? JSON.parse(row['skills']) : [])) : [],
      status: row['status'] as string,
      hireDate: row['hire_date'] ? new Date(row['hire_date'] as string) : undefined,
      terminationDate: row['termination_date'] ? new Date(row['termination_date'] as string) : undefined,
      backgroundCheck: row['background_check'] ? (typeof row['background_check'] === 'string' ? JSON.parse(row['background_check']) : row['background_check']) : undefined,
      complianceStatus: row['compliance_status'] ? (typeof row['compliance_status'] === 'string' ? JSON.parse(row['compliance_status']) : row['compliance_status']) : undefined,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
      deletedAt: row['deleted_at'] ? new Date(row['deleted_at'] as string) : null,
    };
  }

  async getCaregiverById(caregiverId: UUID): Promise<Caregiver | null> {
    const query = `
      SELECT
        id, organization_id, branch_ids, primary_branch_id,
        employee_number, first_name, middle_name, last_name, preferred_name,
        primary_phone, email,
        credentials, certifications, skills,
        status, hire_date, termination_date,
        background_check, compliance_status,
        created_at, updated_at, deleted_at
      FROM caregivers
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [caregiverId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCaregiver(result.rows[0] as Record<string, unknown>);
  }

  async getCaregiversByIds(caregiverIds: UUID[]): Promise<Caregiver[]> {
    if (caregiverIds.length === 0) {
      return [];
    }

    const query = `
      SELECT
        id, organization_id, branch_ids, primary_branch_id,
        employee_number, first_name, middle_name, last_name, preferred_name,
        primary_phone, email,
        credentials, certifications, skills,
        status, hire_date, termination_date,
        background_check, compliance_status,
        created_at, updated_at, deleted_at
      FROM caregivers
      WHERE id = ANY($1) AND deleted_at IS NULL
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [caregiverIds]);

    return result.rows.map(row => this.mapRowToCaregiver(row as Record<string, unknown>));
  }

  async getCaregiversByBranch(branchId: UUID, activeOnly: boolean = true): Promise<Caregiver[]> {
    const statusFilter = activeOnly ? "AND status = 'ACTIVE'" : '';

    const query = `
      SELECT
        id, organization_id, branch_ids, primary_branch_id,
        employee_number, first_name, middle_name, last_name, preferred_name,
        primary_phone, email,
        credentials, certifications, skills,
        status, hire_date, termination_date,
        background_check, compliance_status,
        created_at, updated_at, deleted_at
      FROM caregivers
      WHERE $1 = ANY(branch_ids) AND deleted_at IS NULL ${statusFilter}
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [branchId]);

    return result.rows.map(row => this.mapRowToCaregiver(row as Record<string, unknown>));
  }

  async getCaregiversByOrganization(organizationId: UUID, filters?: CaregiverFilters): Promise<Caregiver[]> {
    const whereClauses: string[] = ['organization_id = $1', 'deleted_at IS NULL'];
    const params: unknown[] = [organizationId];
    let paramIndex = 2;

    if (filters?.branchId) {
      whereClauses.push(`$${paramIndex} = ANY(branch_ids)`);
      params.push(filters.branchId);
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
        id, organization_id, branch_ids, primary_branch_id,
        employee_number, first_name, middle_name, last_name, preferred_name,
        primary_phone, email,
        credentials, certifications, skills,
        status, hire_date, termination_date,
        background_check, compliance_status,
        created_at, updated_at, deleted_at
      FROM caregivers
      WHERE ${whereClause}
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => this.mapRowToCaregiver(row as Record<string, unknown>));
  }

  async getAvailableCaregivers(_startTime: Date, _endTime: Date, branchId?: UUID): Promise<Caregiver[]> {
    // Simplified implementation: returns active caregivers not currently assigned
    // Full implementation would check against visit schedules, availability records, etc.
    // TODO: Implement actual availability checking using startTime and endTime
    const whereClauses: string[] = ["status = 'ACTIVE'", 'deleted_at IS NULL'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (branchId) {
      whereClauses.push(`$${paramIndex} = ANY(branch_ids)`);
      params.push(branchId);
      paramIndex++;
    }

    const whereClause = whereClauses.join(' AND ');

    // TODO: In a full implementation, this would join with visits table
    // to exclude caregivers with overlapping assignments
    const query = `
      SELECT
        id, organization_id, branch_ids, primary_branch_id,
        employee_number, first_name, middle_name, last_name, preferred_name,
        primary_phone, email,
        credentials, certifications, skills,
        status, hire_date, termination_date,
        background_check, compliance_status,
        created_at, updated_at, deleted_at
      FROM caregivers
      WHERE ${whereClause}
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => this.mapRowToCaregiver(row as Record<string, unknown>));
  }
}

/**
 * Factory function to create a CaregiverProvider instance
 */
export function createCaregiverProvider(database: Database): ICaregiverProvider {
  return new CaregiverProvider(database);
}
