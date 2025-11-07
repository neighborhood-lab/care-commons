/**
 * Visit Provider Interface and Implementation
 *
 * Provides visit/scheduling data access for all verticals.
 * Decouples services from direct database queries.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable unicorn/prefer-string-slice */

import { Database } from '../db/connection.js';
import type { UUID } from '../types/base.js';

/**
 * Visit data structure for cross-vertical use
 */
export interface Visit {
  id: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  caregiverId?: UUID | null;
  patternId?: UUID | null;
  scheduleId?: UUID | null;

  // Visit identity
  visitNumber: string;
  visitType: string;
  serviceTypeId: UUID;
  serviceTypeName: string;

  // Timing
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDuration: number; // minutes
  timezone?: string;

  // Actual timing
  actualStartTime?: Date | null;
  actualEndTime?: Date | null;
  actualDuration?: number | null;

  // Location
  address: Record<string, unknown>;

  // Tasks
  taskIds?: UUID[];
  requiredSkills?: string[];
  requiredCertifications?: string[];

  // Status
  status: string;

  // Flags
  isUrgent?: boolean;
  isPriority?: boolean;
  requiresSupervision?: boolean;

  // Billing
  billableHours?: number | null;
  billingStatus?: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Filters for querying visits
 */
export interface VisitFilters {
  organizationId?: UUID;
  branchId?: UUID;
  clientId?: UUID;
  caregiverId?: UUID;
  status?: string | string[];
  dateFrom?: Date;
  dateTo?: Date;
  startDate?: Date;
  endDate?: Date;
  isUnassigned?: boolean;
  isUrgent?: boolean;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Input for creating a visit
 */
export interface CreateVisitInput {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  caregiverId?: UUID;
  visitType: string;
  serviceTypeId: UUID;
  serviceTypeName: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDuration: number;
  address: Record<string, unknown>;
  taskIds?: UUID[];
  status?: string;
}

/**
 * Input for updating a visit
 */
export interface UpdateVisitInput {
  caregiverId?: UUID | null;
  status?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  billableHours?: number;
  billingStatus?: string;
}

/**
 * Visit Provider Interface
 *
 * Provides access to visit data for cross-vertical operations.
 * Services should depend on this interface, not the concrete implementation.
 */
export interface IVisitProvider {
  /**
   * Get visit by ID
   */
  getVisitById(visitId: UUID): Promise<Visit | null>;

  /**
   * Get multiple visits by IDs
   */
  getVisitsByIds(visitIds: UUID[]): Promise<Visit[]>;

  /**
   * Get visits by client ID
   */
  getVisitsByClientId(clientId: UUID, filters?: VisitFilters): Promise<Visit[]>;

  /**
   * Get visits by caregiver ID
   */
  getVisitsByCaregiverId(caregiverId: UUID, filters?: VisitFilters): Promise<Visit[]>;

  /**
   * Get visits in a date range
   */
  getVisitsInDateRange(startDate: Date, endDate: Date, filters?: VisitFilters): Promise<Visit[]>;

  /**
   * Create a new visit
   */
  createVisit(data: CreateVisitInput): Promise<Visit>;

  /**
   * Update an existing visit
   */
  updateVisit(visitId: UUID, data: UpdateVisitInput): Promise<Visit>;

  /**
   * Delete (soft delete) a visit
   */
  deleteVisit(visitId: UUID): Promise<void>;
}

/**
 * Visit Provider Implementation
 *
 * Concrete implementation that queries the database.
 */
export class VisitProvider implements IVisitProvider {
  constructor(private database: Database) {}

  /**
   * Map database row to Visit entity
   */
  private mapRowToVisit(row: Record<string, unknown>): Visit {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchId: row['branch_id'] as UUID,
      clientId: row['client_id'] as UUID,
      caregiverId: row['caregiver_id'] as UUID | null | undefined,
      patternId: row['pattern_id'] as UUID | null | undefined,
      scheduleId: row['schedule_id'] as UUID | null | undefined,
      visitNumber: row['visit_number'] as string,
      visitType: row['visit_type'] as string,
      serviceTypeId: row['service_type_id'] as UUID,
      serviceTypeName: row['service_type_name'] as string,
      scheduledDate: new Date(row['scheduled_date'] as string),
      scheduledStartTime: row['scheduled_start_time'] as string,
      scheduledEndTime: row['scheduled_end_time'] as string,
      scheduledDuration: row['scheduled_duration'] as number,
      timezone: row['timezone'] as string | undefined,
      actualStartTime: row['actual_start_time'] ? new Date(row['actual_start_time'] as string) : null,
      actualEndTime: row['actual_end_time'] ? new Date(row['actual_end_time'] as string) : null,
      actualDuration: row['actual_duration'] as number | null | undefined,
      address: typeof row['address'] === 'string' ? JSON.parse(row['address']) : row['address'] as Record<string, unknown>,
      taskIds: row['task_ids'] ? (Array.isArray(row['task_ids']) ? row['task_ids'] : (typeof row['task_ids'] === 'string' ? JSON.parse(row['task_ids']) : [])) : undefined,
      requiredSkills: row['required_skills'] ? (Array.isArray(row['required_skills']) ? row['required_skills'] : (typeof row['required_skills'] === 'string' ? JSON.parse(row['required_skills']) : [])) : undefined,
      requiredCertifications: row['required_certifications'] ? (Array.isArray(row['required_certifications']) ? row['required_certifications'] : (typeof row['required_certifications'] === 'string' ? JSON.parse(row['required_certifications']) : [])) : undefined,
      status: row['status'] as string,
      isUrgent: row['is_urgent'] as boolean | undefined,
      isPriority: row['is_priority'] as boolean | undefined,
      requiresSupervision: row['requires_supervision'] as boolean | undefined,
      billableHours: row['billable_hours'] as number | null | undefined,
      billingStatus: row['billing_status'] as string | null | undefined,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
      deletedAt: row['deleted_at'] ? new Date(row['deleted_at'] as string) : null,
    };
  }

  async getVisitById(visitId: UUID): Promise<Visit | null> {
    const query = `
      SELECT
        id, organization_id, branch_id, client_id, caregiver_id,
        pattern_id, schedule_id, visit_number, visit_type,
        service_type_id, service_type_name,
        scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
        actual_start_time, actual_end_time, actual_duration,
        address, task_ids, required_skills, required_certifications,
        status, is_urgent, is_priority, requires_supervision,
        billable_hours, billing_status,
        created_at, updated_at, deleted_at
      FROM visits
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [visitId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToVisit(result.rows[0] as Record<string, unknown>);
  }

  async getVisitsByIds(visitIds: UUID[]): Promise<Visit[]> {
    if (visitIds.length === 0) {
      return [];
    }

    const query = `
      SELECT
        id, organization_id, branch_id, client_id, caregiver_id,
        pattern_id, schedule_id, visit_number, visit_type,
        service_type_id, service_type_name,
        scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
        actual_start_time, actual_end_time, actual_duration,
        address, task_ids, required_skills, required_certifications,
        status, is_urgent, is_priority, requires_supervision,
        billable_hours, billing_status,
        created_at, updated_at, deleted_at
      FROM visits
      WHERE id = ANY($1) AND deleted_at IS NULL
      ORDER BY scheduled_date, scheduled_start_time
    `;

    const result = await this.database.query(query, [visitIds]);

    return result.rows.map(row => this.mapRowToVisit(row as Record<string, unknown>));
  }

  async getVisitsByClientId(clientId: UUID, filters?: VisitFilters): Promise<Visit[]> {
    const whereClauses: string[] = ['client_id = $1', 'deleted_at IS NULL'];
    const params: unknown[] = [clientId];
    let paramIndex = 2;

    this.applyFilters(whereClauses, params, paramIndex, filters);

    const whereClause = whereClauses.join(' AND ');
    const orderBy = filters?.orderBy || 'scheduled_date';
    const order = filters?.order || 'asc';
    const limitClause = filters?.limit ? `LIMIT ${filters.limit}` : '';

    const query = `
      SELECT
        id, organization_id, branch_id, client_id, caregiver_id,
        pattern_id, schedule_id, visit_number, visit_type,
        service_type_id, service_type_name,
        scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
        actual_start_time, actual_end_time, actual_duration,
        address, task_ids, required_skills, required_certifications,
        status, is_urgent, is_priority, requires_supervision,
        billable_hours, billing_status,
        created_at, updated_at, deleted_at
      FROM visits
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${order}
      ${limitClause}
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => this.mapRowToVisit(row as Record<string, unknown>));
  }

  async getVisitsByCaregiverId(caregiverId: UUID, filters?: VisitFilters): Promise<Visit[]> {
    const whereClauses: string[] = ['caregiver_id = $1', 'deleted_at IS NULL'];
    const params: unknown[] = [caregiverId];
    let paramIndex = 2;

    this.applyFilters(whereClauses, params, paramIndex, filters);

    const whereClause = whereClauses.join(' AND ');
    const orderBy = filters?.orderBy || 'scheduled_date';
    const order = filters?.order || 'asc';
    const limitClause = filters?.limit ? `LIMIT ${filters.limit}` : '';

    const query = `
      SELECT
        id, organization_id, branch_id, client_id, caregiver_id,
        pattern_id, schedule_id, visit_number, visit_type,
        service_type_id, service_type_name,
        scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
        actual_start_time, actual_end_time, actual_duration,
        address, task_ids, required_skills, required_certifications,
        status, is_urgent, is_priority, requires_supervision,
        billable_hours, billing_status,
        created_at, updated_at, deleted_at
      FROM visits
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${order}
      ${limitClause}
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => this.mapRowToVisit(row as Record<string, unknown>));
  }

  async getVisitsInDateRange(startDate: Date, endDate: Date, filters?: VisitFilters): Promise<Visit[]> {
    const whereClauses: string[] = [
      'scheduled_date >= $1',
      'scheduled_date <= $2',
      'deleted_at IS NULL'
    ];
    const params: unknown[] = [startDate, endDate];
    let paramIndex = 3;

    this.applyFilters(whereClauses, params, paramIndex, filters);

    const whereClause = whereClauses.join(' AND ');
    const orderBy = filters?.orderBy || 'scheduled_date';
    const order = filters?.order || 'asc';
    const limitClause = filters?.limit ? `LIMIT ${filters.limit}` : '';

    const query = `
      SELECT
        id, organization_id, branch_id, client_id, caregiver_id,
        pattern_id, schedule_id, visit_number, visit_type,
        service_type_id, service_type_name,
        scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
        actual_start_time, actual_end_time, actual_duration,
        address, task_ids, required_skills, required_certifications,
        status, is_urgent, is_priority, requires_supervision,
        billable_hours, billing_status,
        created_at, updated_at, deleted_at
      FROM visits
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${order}
      ${limitClause}
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => this.mapRowToVisit(row as Record<string, unknown>));
  }

  async createVisit(data: CreateVisitInput): Promise<Visit> {
    const visitNumber = this.generateVisitNumber();
    const now = new Date();

    const query = `
      INSERT INTO visits (
        organization_id, branch_id, client_id, caregiver_id,
        visit_number, visit_type, service_type_id, service_type_name,
        scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration,
        address, task_ids, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      data.organizationId,
      data.branchId,
      data.clientId,
      data.caregiverId || null,
      visitNumber,
      data.visitType,
      data.serviceTypeId,
      data.serviceTypeName,
      data.scheduledDate,
      data.scheduledStartTime,
      data.scheduledEndTime,
      data.scheduledDuration,
      JSON.stringify(data.address),
      data.taskIds ? JSON.stringify(data.taskIds) : null,
      data.status || 'SCHEDULED',
      now,
      now,
    ]);

    return this.mapRowToVisit(result.rows[0] as Record<string, unknown>);
  }

  async updateVisit(visitId: UUID, data: UpdateVisitInput): Promise<Visit> {
    const setClauses: string[] = ['updated_at = $1'];
    const params: unknown[] = [new Date()];
    let paramIndex = 2;

    if (data.caregiverId !== undefined) {
      setClauses.push(`caregiver_id = $${paramIndex}`);
      params.push(data.caregiverId);
      paramIndex++;
    }

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.actualStartTime !== undefined) {
      setClauses.push(`actual_start_time = $${paramIndex}`);
      params.push(data.actualStartTime);
      paramIndex++;
    }

    if (data.actualEndTime !== undefined) {
      setClauses.push(`actual_end_time = $${paramIndex}`);
      params.push(data.actualEndTime);
      paramIndex++;
    }

    if (data.actualDuration !== undefined) {
      setClauses.push(`actual_duration = $${paramIndex}`);
      params.push(data.actualDuration);
      paramIndex++;
    }

    if (data.billableHours !== undefined) {
      setClauses.push(`billable_hours = $${paramIndex}`);
      params.push(data.billableHours);
      paramIndex++;
    }

    if (data.billingStatus !== undefined) {
      setClauses.push(`billing_status = $${paramIndex}`);
      params.push(data.billingStatus);
      paramIndex++;
    }

    params.push(visitId);
    const setClause = setClauses.join(', ');

    const query = `
      UPDATE visits
      SET ${setClause}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.database.query(query, params);

    return this.mapRowToVisit(result.rows[0] as Record<string, unknown>);
  }

  async deleteVisit(visitId: UUID): Promise<void> {
    const now = new Date();

    const query = `
      UPDATE visits
      SET deleted_at = $1, updated_at = $1
      WHERE id = $2
    `;

    await this.database.query(query, [now, visitId]);
  }

  /**
   * Helper method to apply common filters to queries
   */
  private applyFilters(
    whereClauses: string[],
    params: unknown[],
    startIndex: number,
    filters?: VisitFilters
  ): void {
    let paramIndex = startIndex;

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

    if (filters?.dateFrom || filters?.startDate) {
      whereClauses.push(`scheduled_date >= $${paramIndex}`);
      params.push(filters.dateFrom || filters.startDate);
      paramIndex++;
    }

    if (filters?.dateTo || filters?.endDate) {
      whereClauses.push(`scheduled_date <= $${paramIndex}`);
      params.push(filters.dateTo || filters.endDate);
      paramIndex++;
    }

    if (filters?.isUnassigned) {
      whereClauses.push('caregiver_id IS NULL');
    }

    if (filters?.isUrgent) {
      whereClauses.push('is_urgent = true');
    }

    if (filters?.branchId) {
      whereClauses.push(`branch_id = $${paramIndex}`);
      params.push(filters.branchId);
      paramIndex++;
    }
  }

  /**
   * Generate a unique visit number
   */
  private generateVisitNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VST-${timestamp}-${random}`;
  }
}

/**
 * Factory function to create a VisitProvider instance
 */
export function createVisitProvider(database: Database): IVisitProvider {
  return new VisitProvider(database);
}
