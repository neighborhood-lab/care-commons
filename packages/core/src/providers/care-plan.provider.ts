/**
 * Care Plan Provider Interface and Implementation
 *
 * Provides care plan data access for all verticals.
 * Decouples services from direct database queries.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable unicorn/prefer-string-slice */

import { Database } from '../db/connection';
import type { UUID } from '../types/base';

/**
 * Care Plan data structure for cross-vertical use
 */
export interface CarePlan {
  id: UUID;
  clientId: UUID;
  organizationId: UUID;
  branchId?: UUID | null;

  // Plan identity
  planNumber: string;
  name: string;
  planType: string;
  status: string;
  priority?: string;

  // Dates
  effectiveDate: Date;
  expirationDate?: Date | null;
  reviewDate?: Date | null;
  lastReviewedDate?: Date | null;

  // Care team
  primaryCaregiverId?: UUID | null;
  coordinatorId?: UUID | null;
  supervisorId?: UUID | null;

  // Plan content
  goals?: unknown[];
  interventions?: unknown[];
  taskTemplates?: unknown[];

  // Service frequency
  serviceFrequency?: Record<string, unknown>;
  estimatedHoursPerWeek?: number | null;

  // Authorization
  authorizedBy?: UUID | null;
  authorizedDate?: Date | null;
  authorizationNumber?: string | null;
  authorizationHours?: number | null;
  authorizationStartDate?: Date | null;
  authorizationEndDate?: Date | null;

  // Compliance
  complianceStatus: string;
  lastComplianceCheck?: Date | null;

  // Metadata
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Filters for querying care plans
 */
export interface CarePlanFilters {
  organizationId?: UUID;
  branchId?: UUID;
  status?: string | string[];
  planType?: string | string[];
  activeOnly?: boolean;
  expiringWithinDays?: number;
}

/**
 * Input for creating a care plan
 */
export interface CreateCarePlanInput {
  clientId: UUID;
  organizationId: UUID;
  branchId?: UUID;
  name: string;
  planType: string;
  effectiveDate: Date;
  expirationDate?: Date;
  goals?: unknown[];
  interventions?: unknown[];
  taskTemplates?: unknown[];
  serviceFrequency?: Record<string, unknown>;
  coordinatorId?: UUID;
  notes?: string;
}

/**
 * Input for updating a care plan
 */
export interface UpdateCarePlanInput {
  name?: string;
  status?: string;
  priority?: string;
  expirationDate?: Date;
  reviewDate?: Date;
  lastReviewedDate?: Date;
  goals?: unknown[];
  interventions?: unknown[];
  taskTemplates?: unknown[];
  serviceFrequency?: Record<string, unknown>;
  notes?: string;
}

/**
 * Care Plan Provider Interface
 *
 * Provides access to care plan data for cross-vertical operations.
 * Services should depend on this interface, not the concrete implementation.
 */
export interface ICarePlanProvider {
  /**
   * Get care plan by ID
   */
  getCarePlanById(carePlanId: UUID): Promise<CarePlan | null>;

  /**
   * Get care plans by client ID
   */
  getCarePlansByClientId(clientId: UUID): Promise<CarePlan[]>;

  /**
   * Get active care plan for a client
   */
  getActiveCarePlanForClient(clientId: UUID): Promise<CarePlan | null>;

  /**
   * Create a new care plan
   */
  createCarePlan(data: CreateCarePlanInput): Promise<CarePlan>;

  /**
   * Update an existing care plan
   */
  updateCarePlan(carePlanId: UUID, data: UpdateCarePlanInput): Promise<CarePlan>;

  /**
   * Delete (soft delete) a care plan
   */
  deleteCarePlan(carePlanId: UUID): Promise<void>;
}

/**
 * Care Plan Provider Implementation
 *
 * Concrete implementation that queries the database.
 */
export class CarePlanProvider implements ICarePlanProvider {
  constructor(private database: Database) {}

  /**
   * Map database row to CarePlan entity
   */
  private mapRowToCarePlan(row: Record<string, unknown>): CarePlan {
    return {
      id: row['id'] as UUID,
      clientId: row['client_id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      branchId: row['branch_id'] as UUID | null | undefined,
      planNumber: row['plan_number'] as string,
      name: row['name'] as string,
      planType: row['plan_type'] as string,
      status: row['status'] as string,
      priority: row['priority'] as string | undefined,
      effectiveDate: new Date(row['effective_date'] as string),
      expirationDate: row['expiration_date'] ? new Date(row['expiration_date'] as string) : null,
      reviewDate: row['review_date'] ? new Date(row['review_date'] as string) : null,
      lastReviewedDate: row['last_reviewed_date'] ? new Date(row['last_reviewed_date'] as string) : null,
      primaryCaregiverId: row['primary_caregiver_id'] as UUID | null | undefined,
      coordinatorId: row['coordinator_id'] as UUID | null | undefined,
      supervisorId: row['supervisor_id'] as UUID | null | undefined,
      goals: row['goals'] ? (typeof row['goals'] === 'string' ? JSON.parse(row['goals']) : row['goals']) : undefined,
      interventions: row['interventions'] ? (typeof row['interventions'] === 'string' ? JSON.parse(row['interventions']) : row['interventions']) : undefined,
      taskTemplates: row['task_templates'] ? (typeof row['task_templates'] === 'string' ? JSON.parse(row['task_templates']) : row['task_templates']) : undefined,
      serviceFrequency: row['service_frequency'] ? (typeof row['service_frequency'] === 'string' ? JSON.parse(row['service_frequency']) : row['service_frequency']) : undefined,
      estimatedHoursPerWeek: row['estimated_hours_per_week'] as number | null | undefined,
      authorizedBy: row['authorized_by'] as UUID | null | undefined,
      authorizedDate: row['authorized_date'] ? new Date(row['authorized_date'] as string) : null,
      authorizationNumber: row['authorization_number'] as string | null | undefined,
      authorizationHours: row['authorization_hours'] as number | null | undefined,
      authorizationStartDate: row['authorization_start_date'] ? new Date(row['authorization_start_date'] as string) : null,
      authorizationEndDate: row['authorization_end_date'] ? new Date(row['authorization_end_date'] as string) : null,
      complianceStatus: row['compliance_status'] as string,
      lastComplianceCheck: row['last_compliance_check'] ? new Date(row['last_compliance_check'] as string) : null,
      notes: row['notes'] as string | null | undefined,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
      deletedAt: row['deleted_at'] ? new Date(row['deleted_at'] as string) : null,
    };
  }

  async getCarePlanById(carePlanId: UUID): Promise<CarePlan | null> {
    const query = `
      SELECT
        id, client_id, organization_id, branch_id,
        plan_number, name, plan_type, status, priority,
        effective_date, expiration_date, review_date, last_reviewed_date,
        primary_caregiver_id, coordinator_id, supervisor_id,
        goals, interventions, task_templates,
        service_frequency, estimated_hours_per_week,
        authorized_by, authorized_date, authorization_number,
        authorization_hours, authorization_start_date, authorization_end_date,
        compliance_status, last_compliance_check,
        notes,
        created_at, updated_at, deleted_at
      FROM care_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [carePlanId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCarePlan(result.rows[0] as Record<string, unknown>);
  }

  async getCarePlansByClientId(clientId: UUID): Promise<CarePlan[]> {
    const query = `
      SELECT
        id, client_id, organization_id, branch_id,
        plan_number, name, plan_type, status, priority,
        effective_date, expiration_date, review_date, last_reviewed_date,
        primary_caregiver_id, coordinator_id, supervisor_id,
        goals, interventions, task_templates,
        service_frequency, estimated_hours_per_week,
        authorized_by, authorized_date, authorization_number,
        authorization_hours, authorization_start_date, authorization_end_date,
        compliance_status, last_compliance_check,
        notes,
        created_at, updated_at, deleted_at
      FROM care_plans
      WHERE client_id = $1 AND deleted_at IS NULL
      ORDER BY effective_date DESC
    `;

    const result = await this.database.query(query, [clientId]);

    return result.rows.map(row => this.mapRowToCarePlan(row as Record<string, unknown>));
  }

  async getActiveCarePlanForClient(clientId: UUID): Promise<CarePlan | null> {
    const query = `
      SELECT
        id, client_id, organization_id, branch_id,
        plan_number, name, plan_type, status, priority,
        effective_date, expiration_date, review_date, last_reviewed_date,
        primary_caregiver_id, coordinator_id, supervisor_id,
        goals, interventions, task_templates,
        service_frequency, estimated_hours_per_week,
        authorized_by, authorized_date, authorization_number,
        authorization_hours, authorization_start_date, authorization_end_date,
        compliance_status, last_compliance_check,
        notes,
        created_at, updated_at, deleted_at
      FROM care_plans
      WHERE client_id = $1
        AND status = 'ACTIVE'
        AND deleted_at IS NULL
        AND effective_date <= CURRENT_DATE
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
      ORDER BY effective_date DESC
      LIMIT 1
    `;

    const result = await this.database.query(query, [clientId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCarePlan(result.rows[0] as Record<string, unknown>);
  }

  async createCarePlan(data: CreateCarePlanInput): Promise<CarePlan> {
    const planNumber = this.generatePlanNumber();
    const now = new Date();

    const query = `
      INSERT INTO care_plans (
        client_id, organization_id, branch_id,
        plan_number, name, plan_type, status,
        effective_date, expiration_date,
        goals, interventions, task_templates,
        service_frequency, coordinator_id,
        compliance_status, notes,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      data.clientId,
      data.organizationId,
      data.branchId || null,
      planNumber,
      data.name,
      data.planType,
      'DRAFT',
      data.effectiveDate,
      data.expirationDate || null,
      data.goals ? JSON.stringify(data.goals) : null,
      data.interventions ? JSON.stringify(data.interventions) : null,
      data.taskTemplates ? JSON.stringify(data.taskTemplates) : null,
      data.serviceFrequency ? JSON.stringify(data.serviceFrequency) : null,
      data.coordinatorId || null,
      'PENDING_REVIEW',
      data.notes || null,
      now,
      now,
    ]);

    return this.mapRowToCarePlan(result.rows[0] as Record<string, unknown>);
  }

  async updateCarePlan(carePlanId: UUID, data: UpdateCarePlanInput): Promise<CarePlan> {
    const setClauses: string[] = ['updated_at = $1'];
    const params: unknown[] = [new Date()];
    let paramIndex = 2;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex}`);
      params.push(data.priority);
      paramIndex++;
    }

    if (data.expirationDate !== undefined) {
      setClauses.push(`expiration_date = $${paramIndex}`);
      params.push(data.expirationDate);
      paramIndex++;
    }

    if (data.reviewDate !== undefined) {
      setClauses.push(`review_date = $${paramIndex}`);
      params.push(data.reviewDate);
      paramIndex++;
    }

    if (data.lastReviewedDate !== undefined) {
      setClauses.push(`last_reviewed_date = $${paramIndex}`);
      params.push(data.lastReviewedDate);
      paramIndex++;
    }

    if (data.goals !== undefined) {
      setClauses.push(`goals = $${paramIndex}`);
      params.push(JSON.stringify(data.goals));
      paramIndex++;
    }

    if (data.interventions !== undefined) {
      setClauses.push(`interventions = $${paramIndex}`);
      params.push(JSON.stringify(data.interventions));
      paramIndex++;
    }

    if (data.taskTemplates !== undefined) {
      setClauses.push(`task_templates = $${paramIndex}`);
      params.push(JSON.stringify(data.taskTemplates));
      paramIndex++;
    }

    if (data.serviceFrequency !== undefined) {
      setClauses.push(`service_frequency = $${paramIndex}`);
      params.push(JSON.stringify(data.serviceFrequency));
      paramIndex++;
    }

    if (data.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex}`);
      params.push(data.notes);
      paramIndex++;
    }

    params.push(carePlanId);
    const setClause = setClauses.join(', ');

    const query = `
      UPDATE care_plans
      SET ${setClause}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.database.query(query, params);

    return this.mapRowToCarePlan(result.rows[0] as Record<string, unknown>);
  }

  async deleteCarePlan(carePlanId: UUID): Promise<void> {
    const now = new Date();

    const query = `
      UPDATE care_plans
      SET deleted_at = $1, updated_at = $1
      WHERE id = $2
    `;

    await this.database.query(query, [now, carePlanId]);
  }

  /**
   * Generate a unique care plan number
   */
  private generatePlanNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CP-${timestamp}-${random}`;
  }
}

/**
 * Factory function to create a CarePlanProvider instance
 */
export function createCarePlanProvider(database: Database): ICarePlanProvider {
  return new CarePlanProvider(database);
}
