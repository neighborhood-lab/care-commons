/**
 * Repository for Scheduling & Visit Management
 * 
 * Data access layer for service patterns, schedules, visits, and assignments.
 * Handles database operations, queries, and data mapping.
 */

import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import {
  UUID,
  PaginationParams,
  PaginatedResult,
  UserContext,
  NotFoundError,
} from '@care-commons/core';
import {
  ServicePattern,
  Visit,
  VisitSearchFilters,
  VisitStatus,
  CreateServicePatternInput,
  UpdateServicePatternInput,
  CreateVisitInput,
  AssignVisitInput,
} from '../types/schedule';

export class ScheduleRepository {
  constructor(private pool: Pool) {}

  /**
   * Service Pattern operations
   */

  async createServicePattern(
    input: CreateServicePatternInput,
    context: UserContext
  ): Promise<ServicePattern> {
    const query = `
      INSERT INTO service_patterns (
        id, organization_id, branch_id, client_id, name, description,
        pattern_type, service_type_id, service_type_name, recurrence,
        duration, flexibility_window, required_skills, required_certifications,
        preferred_caregivers, blocked_caregivers, gender_preference,
        language_preference, preferred_time_of_day, must_start_by, must_end_by,
        authorized_hours_per_week, authorized_visits_per_week,
        authorization_start_date, authorization_end_date, funding_source_id,
        travel_time_before, travel_time_after, allow_back_to_back,
        status, effective_from, effective_to, notes,
        client_instructions, caregiver_instructions,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        'DRAFT', $29, $30, $31, $32, $33, NOW(), $34, NOW(), $34, 1
      )
      RETURNING *
    `;

    const values = [
      input.organizationId,
      input.branchId,
      input.clientId,
      input.name,
      input.description || null,
      input.patternType,
      input.serviceTypeId,
      input.serviceTypeName,
      JSON.stringify(input.recurrence),
      input.duration,
      input.flexibilityWindow || null,
      input.requiredSkills ? JSON.stringify(input.requiredSkills) : null,
      input.requiredCertifications ? JSON.stringify(input.requiredCertifications) : null,
      input.preferredCaregivers ? JSON.stringify(input.preferredCaregivers) : null,
      input.blockedCaregivers ? JSON.stringify(input.blockedCaregivers || []) : null,
      input.genderPreference || null,
      input.languagePreference || null,
      input.preferredTimeOfDay || null,
      input.mustStartBy || null,
      input.mustEndBy || null,
      input.authorizedHoursPerWeek || null,
      input.authorizedVisitsPerWeek || null,
      input.authorizationStartDate || null,
      input.authorizationEndDate || null,
      input.fundingSourceId || null,
      input.travelTimeBefore || null,
      input.travelTimeAfter || null,
      input.allowBackToBack || false,
      input.effectiveFrom,
      input.effectiveTo || null,
      input.notes || null,
      input.clientInstructions || null,
      input.caregiverInstructions || null,
      context.userId,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToServicePattern(result.rows[0]);
  }

  async getServicePatternById(id: UUID): Promise<ServicePattern | null> {
    const query = `
      SELECT * FROM service_patterns
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToServicePattern(result.rows[0]) : null;
  }

  async updateServicePattern(
    id: UUID,
    input: UpdateServicePatternInput,
    context: UserContext
  ): Promise<ServicePattern> {
    const pattern = await this.getServicePatternById(id);
    if (!pattern) {
      throw new NotFoundError('Service pattern not found', { id });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(input.description);
    }
    if (input.recurrence !== undefined) {
      updates.push(`recurrence = $${paramCount++}`);
      values.push(JSON.stringify(input.recurrence));
    }
    if (input.duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(input.duration);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(input.status);
    }
    if (input.effectiveTo !== undefined) {
      updates.push(`effective_to = $${paramCount++}`);
      values.push(input.effectiveTo);
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(context.userId);
    updates.push(`version = version + 1`);

    values.push(id);
    const query = `
      UPDATE service_patterns
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Service pattern not found', { id });
    }
    return this.mapRowToServicePattern(result.rows[0]);
  }

  async getPatternsByClient(clientId: UUID): Promise<ServicePattern[]> {
    const query = `
      SELECT * FROM service_patterns
      WHERE client_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [clientId]);
    return result.rows.map(row => this.mapRowToServicePattern(row));
  }

  /**
   * Visit operations
   */

  async createVisit(
    input: CreateVisitInput,
    context: UserContext
  ): Promise<Visit> {
    // Generate visit number
    const visitNumber = await this.generateVisitNumber(input.organizationId);

    // Calculate scheduled duration
    const [startHour, startMin] = input.scheduledStartTime.split(':').map(Number);
    const [endHour, endMin] = input.scheduledEndTime.split(':').map(Number);
    const scheduledDuration = ((endHour ?? 0) * 60 + (endMin ?? 0)) - ((startHour ?? 0) * 60 + (startMin ?? 0));

    const query = `
      INSERT INTO visits (
        id, organization_id, branch_id, client_id, pattern_id,
        visit_number, visit_type, service_type_id, service_type_name,
        scheduled_date, scheduled_start_time, scheduled_end_time,
        scheduled_duration, timezone, address, task_ids,
        required_skills, required_certifications, status,
        status_history, is_urgent, is_priority, requires_supervision,
        risk_flags, assignment_method, signature_required,
        client_instructions, caregiver_instructions, internal_notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        'America/New_York', $13, $14, $15, $16, 'UNASSIGNED', '[]'::jsonb,
        $17, $18, $19, $20, 'MANUAL', true, $21, $22, $23,
        NOW(), $24, NOW(), $24, 1
      )
      RETURNING *
    `;

    const values = [
      input.organizationId,
      input.branchId,
      input.clientId,
      input.patternId || null,
      visitNumber,
      input.visitType,
      input.serviceTypeId,
      input.serviceTypeName,
      input.scheduledDate,
      input.scheduledStartTime,
      input.scheduledEndTime,
      scheduledDuration,
      JSON.stringify(input.address),
      input.taskIds ? JSON.stringify(input.taskIds) : null,
      input.requiredSkills ? JSON.stringify(input.requiredSkills) : null,
      input.requiredCertifications ? JSON.stringify(input.requiredCertifications) : null,
      input.isUrgent || false,
      input.isPriority || false,
      input.requiresSupervision || false,
      input.riskFlags ? JSON.stringify(input.riskFlags) : null,
      input.clientInstructions || null,
      input.caregiverInstructions || null,
      input.internalNotes || null,
      context.userId,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToVisit(result.rows[0]);
  }

  async getVisitById(id: UUID): Promise<Visit | null> {
    const query = `
      SELECT * FROM visits
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToVisit(result.rows[0]) : null;
  }

  async updateVisitStatus(
    id: UUID,
    newStatus: VisitStatus,
    context: UserContext,
    notes?: string,
    reason?: string
  ): Promise<Visit> {
    const visit = await this.getVisitById(id);
    if (!visit) {
      throw new NotFoundError('Visit not found', { id });
    }

    // Add to status history
    const statusChange = {
      id: randomUUID(),
      fromStatus: visit.status,
      toStatus: newStatus,
      timestamp: new Date(),
      changedBy: context.userId,
      reason: reason || null,
      notes: notes || null,
      automatic: false,
    };

    const query = `
      UPDATE visits
      SET 
        status = $1,
        status_history = status_history || $2::jsonb,
        updated_at = NOW(),
        updated_by = $3,
        version = version + 1
      WHERE id = $4 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [newStatus, JSON.stringify(statusChange), context.userId, id];
    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Visit not found', { id });
    }
    return this.mapRowToVisit(result.rows[0]);
  }

  async assignCaregiver(
    input: AssignVisitInput,
    context: UserContext
  ): Promise<Visit> {
    const visit = await this.getVisitById(input.visitId);
    if (!visit) {
      throw new NotFoundError('Visit not found', { visitId: input.visitId });
    }

    const query = `
      UPDATE visits
      SET 
        assigned_caregiver_id = $1,
        assigned_at = NOW(),
        assigned_by = $2,
        assignment_method = $3,
        status = CASE WHEN status = 'UNASSIGNED' THEN 'ASSIGNED' ELSE status END,
        updated_at = NOW(),
        updated_by = $2,
        version = version + 1
      WHERE id = $4 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [
      input.caregiverId,
      context.userId,
      input.assignmentMethod,
      input.visitId,
    ];

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Visit not found', { visitId: input.visitId });
    }
    return this.mapRowToVisit(result.rows[0]);
  }

  async searchVisits(
    filters: VisitSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Visit>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramCount = 1;

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount++}`);
      values.push(filters.organizationId);
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramCount++}`);
      values.push(filters.branchId);
    }

    if (filters.branchIds && filters.branchIds.length > 0) {
      conditions.push(`branch_id = ANY($${paramCount++})`);
      values.push(filters.branchIds);
    }

    if (filters.clientId) {
      conditions.push(`client_id = $${paramCount++}`);
      values.push(filters.clientId);
    }

    if (filters.clientIds && filters.clientIds.length > 0) {
      conditions.push(`client_id = ANY($${paramCount++})`);
      values.push(filters.clientIds);
    }

    if (filters.caregiverId) {
      conditions.push(`assigned_caregiver_id = $${paramCount++}`);
      values.push(filters.caregiverId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramCount++})`);
      values.push(filters.status);
    }

    if (filters.visitType && filters.visitType.length > 0) {
      conditions.push(`visit_type = ANY($${paramCount++})`);
      values.push(filters.visitType);
    }

    if (filters.dateFrom) {
      conditions.push(`scheduled_date >= $${paramCount++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`scheduled_date <= $${paramCount++}`);
      values.push(filters.dateTo);
    }

    if (filters.isUnassigned) {
      conditions.push(`assigned_caregiver_id IS NULL`);
    }

    if (filters.isUrgent) {
      conditions.push(`is_urgent = true`);
    }

    if (filters.query) {
      conditions.push(`(
        visit_number ILIKE $${paramCount} OR
        to_tsvector('english', client_instructions || ' ' || caregiver_instructions) 
        @@ plainto_tsquery('english', $${paramCount})
      )`);
      values.push(`%${filters.query}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM visits ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || 'scheduled_date';
    const sortOrder = pagination.sortOrder || 'asc';

    const dataQuery = `
      SELECT * FROM visits
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(pagination.limit, offset);

    const result = await this.pool.query(dataQuery, values);
    const items = result.rows.map(row => this.mapRowToVisit(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async getVisitsByDateRange(
    organizationId: UUID,
    startDate: Date,
    endDate: Date,
    branchIds?: UUID[]
  ): Promise<Visit[]> {
    let query = `
      SELECT * FROM visits
      WHERE organization_id = $1
        AND scheduled_date >= $2
        AND scheduled_date <= $3
        AND deleted_at IS NULL
    `;
    const values: unknown[] = [organizationId, startDate, endDate];

    if (branchIds && branchIds.length > 0) {
      query += ` AND branch_id = ANY($4)`;
      values.push(branchIds);
    }

    query += ` ORDER BY scheduled_date ASC, scheduled_start_time ASC`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToVisit(row));
  }

  async getUnassignedVisits(
    organizationId: UUID,
    branchId?: UUID
  ): Promise<Visit[]> {
    let query = `
      SELECT * FROM visits
      WHERE organization_id = $1
        AND status IN ('UNASSIGNED', 'SCHEDULED')
        AND assigned_caregiver_id IS NULL
        AND deleted_at IS NULL
    `;
    const values: unknown[] = [organizationId];

    if (branchId) {
      query += ` AND branch_id = $2`;
      values.push(branchId);
    }

    query += ` ORDER BY scheduled_date ASC, is_urgent DESC, is_priority DESC`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToVisit(row));
  }

  /**
   * Helper methods
   */

  private async generateVisitNumber(organizationId: UUID): Promise<string> {
    const query = `
      SELECT COUNT(*) as count
      FROM visits
      WHERE organization_id = $1
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    const result = await this.pool.query(query, [organizationId]);
    const count = parseInt(result.rows[0].count, 10) + 1;
    const year = new Date().getFullYear();
    return `V${year}-${count.toString().padStart(6, '0')}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToServicePattern(row: any): ServicePattern {
    return row as ServicePattern;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToVisit(row: any): Visit {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      clientId: row.client_id,
      patternId: row.pattern_id,
      scheduleId: row.schedule_id,
      visitNumber: row.visit_number,
      visitType: row.visit_type,
      serviceTypeId: row.service_type_id,
      serviceTypeName: row.service_type_name,
      scheduledDate: row.scheduled_date,
      scheduledStartTime: row.scheduled_start_time,
      scheduledEndTime: row.scheduled_end_time,
      scheduledDuration: row.scheduled_duration,
      timezone: row.timezone,
      actualStartTime: row.actual_start_time,
      actualEndTime: row.actual_end_time,
      actualDuration: row.actual_duration,
      assignedCaregiverId: row.assigned_caregiver_id,
      assignedAt: row.assigned_at,
      assignedBy: row.assigned_by,
      assignmentMethod: row.assignment_method,
      address: row.address,
      locationVerification: row.location_verification,
      taskIds: row.task_ids,
      requiredSkills: row.required_skills,
      requiredCertifications: row.required_certifications,
      status: row.status,
      statusHistory: row.status_history || [],
      isUrgent: row.is_urgent,
      isPriority: row.is_priority,
      requiresSupervision: row.requires_supervision,
      riskFlags: row.risk_flags,
      verificationMethod: row.verification_method,
      verificationData: row.verification_data,
      completionNotes: row.completion_notes,
      tasksCompleted: row.tasks_completed,
      tasksTotal: row.tasks_total,
      incidentReported: row.incident_reported,
      signatureRequired: row.signature_required,
      signatureCaptured: row.signature_captured,
      signatureData: row.signature_data,
      billableHours: row.billable_hours,
      billingStatus: row.billing_status,
      billingNotes: row.billing_notes,
      clientInstructions: row.client_instructions,
      caregiverInstructions: row.caregiver_instructions,
      internalNotes: row.internal_notes,
      tags: row.tags,
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
