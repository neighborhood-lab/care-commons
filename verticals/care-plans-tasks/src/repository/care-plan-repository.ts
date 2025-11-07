/**
 * Care Plan Repository
 * 
 * Data access layer for care plans and related entities
 */

import { Repository, Database } from '@care-commons/core';
import { UUID, PaginatedResult, PaginationParams } from '@care-commons/core';
import {
  CarePlan,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CarePlanSearchFilters,
  TaskInstance,
  CreateTaskInstanceInput,
  TaskInstanceSearchFilters,
  ProgressNote,
  CreateProgressNoteInput,
  TaskStatus,
} from '../types/care-plan';

export class CarePlanRepository extends Repository<CarePlan> {
  constructor(database: Database) {
    super({ tableName: 'care_plans', database, enableAudit: true, enableSoftDelete: true });
  }

  // satisfy abstract methods (delegate / stub)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): CarePlan {
    return this.mapRowToCarePlan(row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<CarePlan>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    // Map all entity properties to snake_case database columns
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.planNumber !== undefined) row.plan_number = entity.planNumber;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.planType !== undefined) row.plan_type = entity.planType;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.priority !== undefined) row.priority = entity.priority;
    if (entity.effectiveDate !== undefined) row.effective_date = entity.effectiveDate;
    if (entity.expirationDate !== undefined) row.expiration_date = entity.expirationDate;
    if (entity.reviewDate !== undefined) row.review_date = entity.reviewDate;
    if (entity.lastReviewedDate !== undefined) row.last_reviewed_date = entity.lastReviewedDate;
    if (entity.primaryCaregiverId !== undefined) row.primary_caregiver_id = entity.primaryCaregiverId;
    if (entity.coordinatorId !== undefined) row.coordinator_id = entity.coordinatorId;
    if (entity.supervisorId !== undefined) row.supervisor_id = entity.supervisorId;
    if (entity.physicianId !== undefined) row.physician_id = entity.physicianId;
    if (entity.assessmentSummary !== undefined) row.assessment_summary = entity.assessmentSummary;
    if (entity.medicalDiagnosis !== undefined) row.medical_diagnosis = entity.medicalDiagnosis;
    if (entity.functionalLimitations !== undefined) row.functional_limitations = entity.functionalLimitations;
    
    // Handle JSONB fields
    if (entity.goals !== undefined) row.goals = JSON.stringify(entity.goals);
    if (entity.interventions !== undefined) row.interventions = JSON.stringify(entity.interventions);
    if (entity.taskTemplates !== undefined) row.task_templates = JSON.stringify(entity.taskTemplates);
    if (entity.serviceFrequency !== undefined) row.service_frequency = JSON.stringify(entity.serviceFrequency);
    
    if (entity.estimatedHoursPerWeek !== undefined) row.estimated_hours_per_week = entity.estimatedHoursPerWeek;
    if (entity.authorizedBy !== undefined) row.authorized_by = entity.authorizedBy;
    if (entity.authorizedDate !== undefined) row.authorized_date = entity.authorizedDate;
    if (entity.authorizationNumber !== undefined) row.authorization_number = entity.authorizationNumber;
    if (entity.payerSource !== undefined) row.payer_source = entity.payerSource;
    if (entity.authorizationHours !== undefined) row.authorization_hours = entity.authorizationHours;
    if (entity.authorizationStartDate !== undefined) row.authorization_start_date = entity.authorizationStartDate;
    if (entity.authorizationEndDate !== undefined) row.authorization_end_date = entity.authorizationEndDate;
    if (entity.requiredDocumentation !== undefined) row.required_documentation = entity.requiredDocumentation;
    if (entity.signatureRequirements !== undefined) row.signature_requirements = entity.signatureRequirements;
    if (entity.restrictions !== undefined) row.restrictions = entity.restrictions;
    if (entity.precautions !== undefined) row.precautions = entity.precautions;
    if (entity.allergies !== undefined) row.allergies = entity.allergies;
    if (entity.contraindications !== undefined) row.contraindications = entity.contraindications;
    if (entity.progressNotes !== undefined) row.progress_notes = entity.progressNotes;
    if (entity.outcomesMeasured !== undefined) row.outcomes_measured = entity.outcomesMeasured;
    if (entity.regulatoryRequirements !== undefined) row.regulatory_requirements = entity.regulatoryRequirements;
    if (entity.complianceStatus !== undefined) row.compliance_status = entity.complianceStatus;
    if (entity.lastComplianceCheck !== undefined) row.last_compliance_check = entity.lastComplianceCheck;
    if (entity.modificationHistory !== undefined) row.modification_history = entity.modificationHistory;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.tags !== undefined) row.tags = entity.tags;
    if (entity.customFields !== undefined) row.custom_fields = entity.customFields;
    
    // Audit fields
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.version !== undefined) row.version = entity.version;
    if (entity.deletedAt !== undefined) row.deleted_at = entity.deletedAt;
    if (entity.deletedBy !== undefined) row.deleted_by = entity.deletedBy;

    return row;
  }

  /**
   * Create a new care plan
   */
  async createCarePlan(
    input: CreateCarePlanInput & {
      planNumber: string;
      createdBy: UUID;
      status?: string;
      planReviewIntervalDays?: number;
      nextReviewDue?: Date;
    }
  ): Promise<CarePlan> {
    const query = `
      INSERT INTO care_plans (
        id,
        plan_number,
        name,
        client_id,
        organization_id,
        branch_id,
        plan_type,
        status,
        priority,
        effective_date,
        expiration_date,
        coordinator_id,
        goals,
        interventions,
        task_templates,
        service_frequency,
        notes,
        created_by,
        updated_by,
        created_at,
        updated_at,
        version
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17,
        NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.planNumber,
      input.name,
      input.clientId,
      input.organizationId,
      input.branchId,
      input.planType,
      'DRAFT', // Initial status
      'MEDIUM', // Default priority
      input.effectiveDate,
      input.expirationDate,
      input.coordinatorId,
      JSON.stringify(input.goals),
      JSON.stringify(input.interventions),
      JSON.stringify(input.taskTemplates || []),
      JSON.stringify(input.serviceFrequency),
      input.notes,
      input.createdBy,
    ]);

    return this.mapRowToCarePlan(result.rows[0]);
  }

  /**
   * Get care plan by ID
   */
  async getCarePlanById(id: UUID): Promise<CarePlan | null> {
    const query = `
      SELECT * FROM care_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [id]);
    return result.rows[0] ? this.mapRowToCarePlan(result.rows[0]) : null;
  }

  /**
   * Update care plan
   */
  async updateCarePlan(
    id: UUID,
    input: UpdateCarePlanInput,
    updatedBy: UUID
  ): Promise<CarePlan> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(input.priority);
    }
    if (input.expirationDate !== undefined) {
      updates.push(`expiration_date = $${paramIndex++}`);
      values.push(input.expirationDate);
    }
    if (input.reviewDate !== undefined) {
      updates.push(`review_date = $${paramIndex++}`);
      values.push(input.reviewDate);
    }
    if (input.goals !== undefined) {
      updates.push(`goals = $${paramIndex++}`);
      values.push(JSON.stringify(input.goals));
    }
    if (input.interventions !== undefined) {
      updates.push(`interventions = $${paramIndex++}`);
      values.push(JSON.stringify(input.interventions));
    }
    if (input.taskTemplates !== undefined) {
      updates.push(`task_templates = $${paramIndex++}`);
      values.push(JSON.stringify(input.taskTemplates));
    }
    if (input.serviceFrequency !== undefined) {
      updates.push(`service_frequency = $${paramIndex++}`);
      values.push(JSON.stringify(input.serviceFrequency));
    }
    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(input.notes);
    }

    updates.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);
    updates.push(`updated_at = NOW()`);
    updates.push(`version = version + 1`);

    values.push(id);

    const query = `
      UPDATE care_plans
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Care plan not found or already deleted');
    }

    return this.mapRowToCarePlan(result.rows[0]);
  }

  /**
   * Search care plans
   */
  async searchCarePlans(
    filters: CarePlanSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<CarePlan>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.query) {
      conditions.push(`(
        name ILIKE $${paramIndex} OR
        plan_number ILIKE $${paramIndex}
      )`);
      values.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      values.push(filters.clientId);
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      values.push(filters.organizationId);
    }

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      values.push(filters.branchId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      values.push(filters.status);
    }

    if (filters.planType && filters.planType.length > 0) {
      conditions.push(`plan_type = ANY($${paramIndex++})`);
      values.push(filters.planType);
    }

    if (filters.coordinatorId) {
      conditions.push(`coordinator_id = $${paramIndex++}`);
      values.push(filters.coordinatorId);
    }

    if (filters.expiringWithinDays) {
      conditions.push(`expiration_date <= $${paramIndex++}`);
      values.push(new Date(Date.now() + filters.expiringWithinDays * 24 * 60 * 60 * 1000));
    }

    if (filters.needsReview) {
      conditions.push(`review_date <= NOW()`);
    }

    if (filters.complianceStatus && filters.complianceStatus.length > 0) {
      conditions.push(`compliance_status = ANY($${paramIndex++})`);
      values.push(filters.complianceStatus);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM care_plans ${whereClause}`;
    const countResult = await this.database.query(countQuery, values);
    const firstRow = countResult.rows[0] as Record<string, unknown> | undefined;
    if (!firstRow) throw new Error('Count query returned no rows');
    const total = parseInt(firstRow['count'] as string, 10);

    // Get paginated results
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';
    const offset = (pagination.page - 1) * pagination.limit;

    const dataQuery = `
      SELECT * FROM care_plans
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    values.push(pagination.limit, offset);

    const result = await this.database.query(dataQuery, values);
    const items = result.rows.map(row => this.mapRowToCarePlan(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get care plans for a client
   */
  async getCarePlansByClientId(clientId: UUID): Promise<CarePlan[]> {
    const query = `
      SELECT * FROM care_plans
      WHERE client_id = $1 AND deleted_at IS NULL
      ORDER BY effective_date DESC
    `;

    const result = await this.database.query(query, [clientId]);
    return result.rows.map(row => this.mapRowToCarePlan(row));
  }

  /**
   * Get active care plan for a client
   */
  async getActiveCarePlanForClient(clientId: UUID): Promise<CarePlan | null> {
    const query = `
      SELECT * FROM care_plans
      WHERE client_id = $1
        AND status = 'ACTIVE'
        AND deleted_at IS NULL
        AND effective_date <= NOW()
        AND (expiration_date IS NULL OR expiration_date > NOW())
      ORDER BY effective_date DESC
      LIMIT 1
    `;

    const result = await this.database.query(query, [clientId]);
    return result.rows[0] ? this.mapRowToCarePlan(result.rows[0]) : null;
  }

  /**
   * Get care plans expiring soon
   */
  async getExpiringCarePlans(
    organizationId: UUID,
    daysUntilExpiration: number
  ): Promise<CarePlan[]> {
    const query = `
      SELECT * FROM care_plans
      WHERE organization_id = $1
        AND status = 'ACTIVE'
        AND deleted_at IS NULL
        AND expiration_date <= $2
        AND expiration_date > NOW()
      ORDER BY expiration_date ASC
    `;

    const expirationCutoff = new Date(Date.now() + daysUntilExpiration * 24 * 60 * 60 * 1000);
    const result = await this.database.query(query, [organizationId, expirationCutoff]);
    return result.rows.map(row => this.mapRowToCarePlan(row));
  }

  /**
   * Soft delete care plan
   */
  async deleteCarePlan(id: UUID, deletedBy: UUID): Promise<void> {
    const query = `
      UPDATE care_plans
      SET deleted_at = NOW(),
          deleted_by = $1,
          updated_at = NOW(),
          updated_by = $1
      WHERE id = $2 AND deleted_at IS NULL
    `;

    await this.database.query(query, [deletedBy, id]);
  }

  /**
   * Create task instance
   */
  async createTaskInstance(
    input: CreateTaskInstanceInput & {
      createdBy: UUID;
      status: TaskStatus;
    }
  ): Promise<TaskInstance> {
    const query = `
      INSERT INTO task_instances (
        id,
        care_plan_id,
        template_id,
        visit_id,
        client_id,
        assigned_caregiver_id,
        name,
        description,
        category,
        instructions,
        scheduled_date,
        scheduled_time,
        required_signature,
        required_note,
        status,
        created_by,
        updated_by,
        created_at,
        updated_at,
        version
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15,
        NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.carePlanId,
      input.templateId,
      input.visitId,
      input.clientId,
      input.assignedCaregiverId,
      input.name,
      input.description,
      input.category,
      input.instructions,
      input.scheduledDate,
      input.scheduledTime,
      input.requiredSignature,
      input.requiredNote,
      input.status,
      input.createdBy,
    ]);

    return this.mapRowToTaskInstance(result.rows[0]);
  }

  /**
   * Get task instance by ID
   */
  async getTaskInstanceById(id: UUID): Promise<TaskInstance | null> {
    const query = `
      SELECT * FROM task_instances
      WHERE id = $1
    `;

    const result = await this.database.query(query, [id]);
    return result.rows[0] ? this.mapRowToTaskInstance(result.rows[0]) : null;
  }

  /**
   * Update task instance
   */
  async updateTaskInstance(
    id: UUID,
    updates: Partial<TaskInstance>,
    updatedBy: UUID
  ): Promise<TaskInstance> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = this.camelToSnake(key);
        updateFields.push(`${snakeKey} = $${paramIndex++}`);

        // Handle JSON fields
        if (['verification_data', 'quality_check_responses', 'completion_signature', 'custom_field_values'].includes(snakeKey)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    updateFields.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);
    updateFields.push(`updated_at = NOW()`);
    updateFields.push(`version = version + 1`);

    values.push(id);

    const query = `
      UPDATE task_instances
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Task instance not found');
    }

    return this.mapRowToTaskInstance(result.rows[0]);
  }

  /**
   * Search task instances
   */
  async searchTaskInstances(
    filters: TaskInstanceSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<TaskInstance>> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.carePlanId) {
      conditions.push(`care_plan_id = $${paramIndex++}`);
      values.push(filters.carePlanId);
    }

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      values.push(filters.clientId);
    }

    if (filters.assignedCaregiverId) {
      conditions.push(`assigned_caregiver_id = $${paramIndex++}`);
      values.push(filters.assignedCaregiverId);
    }

    if (filters.visitId) {
      conditions.push(`visit_id = $${paramIndex++}`);
      values.push(filters.visitId);
    }

    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      values.push(filters.status);
    }

    if (filters.category && filters.category.length > 0) {
      conditions.push(`category = ANY($${paramIndex++})`);
      values.push(filters.category);
    }

    if (filters.scheduledDateFrom) {
      conditions.push(`scheduled_date >= $${paramIndex++}`);
      values.push(filters.scheduledDateFrom);
    }

    if (filters.scheduledDateTo) {
      conditions.push(`scheduled_date <= $${paramIndex++}`);
      values.push(filters.scheduledDateTo);
    }

    if (filters.overdue) {
      conditions.push(`scheduled_date < NOW() AND status IN ('SCHEDULED', 'IN_PROGRESS')`);
    }

    if (filters.requiresSignature !== undefined) {
      conditions.push(`required_signature = $${paramIndex++}`);
      values.push(filters.requiresSignature);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM task_instances ${whereClause}`;
    const countResult = await this.database.query(countQuery, values);
    const firstRow = countResult.rows[0] as Record<string, unknown> | undefined;
    if (!firstRow) throw new Error('Count query returned no rows');
    const total = parseInt(firstRow['count'] as string, 10);

    // Get paginated results
    const sortBy = pagination.sortBy || 'scheduled_date';
    const sortOrder = pagination.sortOrder || 'asc';
    const offset = (pagination.page - 1) * pagination.limit;

    const dataQuery = `
      SELECT * FROM task_instances
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    values.push(pagination.limit, offset);

    const result = await this.database.query(dataQuery, values);
    const items = result.rows.map(row => this.mapRowToTaskInstance(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get tasks for a visit
   */
  async getTasksByVisitId(visitId: UUID): Promise<TaskInstance[]> {
    const query = `
      SELECT * FROM task_instances
      WHERE visit_id = $1
      ORDER BY scheduled_time ASC NULLS LAST, name ASC
    `;

    const result = await this.database.query(query, [visitId]);
    return result.rows.map(row => this.mapRowToTaskInstance(row));
  }

  /**
   * Create progress note
   */
  async createProgressNote(
    input: CreateProgressNoteInput & {
      authorId: UUID;
      authorName: string;
      authorRole: string;
      noteDate: Date;
    }
  ): Promise<ProgressNote> {
    const query = `
      INSERT INTO progress_notes (
        id,
        care_plan_id,
        client_id,
        visit_id,
        note_type,
        note_date,
        author_id,
        author_name,
        author_role,
        content,
        goal_progress,
        observations,
        concerns,
        recommendations,
        signature,
        created_by,
        updated_by,
        created_at,
        updated_at,
        version
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $6, $6,
        NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.carePlanId,
      input.clientId,
      input.visitId,
      input.noteType,
      input.noteDate,
      input.authorId,
      input.authorName,
      input.authorRole,
      input.content,
      JSON.stringify(input.goalProgress || []),
      JSON.stringify(input.observations || []),
      JSON.stringify(input.concerns || []),
      JSON.stringify(input.recommendations || []),
      input.signature ? JSON.stringify(input.signature) : null,
    ]);

    return this.mapRowToProgressNote(result.rows[0]);
  }

  /**
   * Get progress notes for a care plan
   */
  async getProgressNotesByCarePlanId(carePlanId: UUID): Promise<ProgressNote[]> {
    const query = `
      SELECT * FROM progress_notes
      WHERE care_plan_id = $1
      ORDER BY note_date DESC, created_at DESC
    `;

    const result = await this.database.query(query, [carePlanId]);
    return result.rows.map(row => this.mapRowToProgressNote(row));
  }

  /**
   * Helper: Map database row to CarePlan entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToCarePlan(row: any): CarePlan {
    return ({
      id: row.id,
      planNumber: row.plan_number,
      name: row.name,
      clientId: row.client_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      planType: row.plan_type,
      status: row.status,
      priority: row.priority,
      effectiveDate: new Date(row.effective_date),
      expirationDate: row.expiration_date ? new Date(row.expiration_date) : undefined,
      reviewDate: row.review_date ? new Date(row.review_date) : undefined,
      lastReviewedDate: row.last_reviewed_date ? new Date(row.last_reviewed_date) : undefined,
      primaryCaregiverId: row.primary_caregiver_id,
      coordinatorId: row.coordinator_id,
      supervisorId: row.supervisor_id,
      physicianId: row.physician_id,
      assessmentSummary: row.assessment_summary,
      medicalDiagnosis: row.medical_diagnosis,
      functionalLimitations: row.functional_limitations,
      goals: row.goals || [],
      interventions: row.interventions || [],
      taskTemplates: row.task_templates || [],
      serviceFrequency: row.service_frequency,
      estimatedHoursPerWeek: row.estimated_hours_per_week,
      authorizedBy: row.authorized_by,
      authorizedDate: row.authorized_date ? new Date(row.authorized_date) : undefined,
      authorizationNumber: row.authorization_number,
      payerSource: row.payer_source,
      authorizationHours: row.authorization_hours,
      authorizationStartDate: row.authorization_start_date ? new Date(row.authorization_start_date) : undefined,
      authorizationEndDate: row.authorization_end_date ? new Date(row.authorization_end_date) : undefined,
      requiredDocumentation: row.required_documentation,
      signatureRequirements: row.signature_requirements,
      restrictions: row.restrictions,
      precautions: row.precautions,
      allergies: row.allergies,
      contraindications: row.contraindications,
      progressNotes: row.progress_notes,
      outcomesMeasured: row.outcomes_measured,
      regulatoryRequirements: row.regulatory_requirements,
      complianceStatus: row.compliance_status,
      lastComplianceCheck: row.last_compliance_check ? new Date(row.last_compliance_check) : undefined,
      modificationHistory: row.modification_history,
      notes: row.notes,
      tags: row.tags,
      customFields: row.custom_fields,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      updatedAt: new Date(row.updated_at),
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      deletedBy: row.deleted_by,
    }) as CarePlan;
  }

  /**
   * Helper: Map database row to TaskInstance entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToTaskInstance(row: any): TaskInstance {
    return ({
      id: row.id,
      carePlanId: row.care_plan_id,
      templateId: row.template_id,
      visitId: row.visit_id,
      clientId: row.client_id,
      assignedCaregiverId: row.assigned_caregiver_id,
      name: row.name,
      description: row.description,
      category: row.category,
      instructions: row.instructions,
      scheduledDate: new Date(row.scheduled_date),
      scheduledTime: row.scheduled_time,
      timeOfDay: row.time_of_day,
      estimatedDuration: row.estimated_duration,
      status: row.status,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      completedBy: row.completed_by,
      completionNote: row.completion_note,
      completionSignature: row.completion_signature,
      completionPhoto: row.completion_photo,
      verificationData: row.verification_data,
      qualityCheckResponses: row.quality_check_responses,
      skippedAt: row.skipped_at ? new Date(row.skipped_at) : undefined,
      skippedBy: row.skipped_by,
      skipReason: row.skip_reason,
      skipNote: row.skip_note,
      issueReported: row.issue_reported,
      issueDescription: row.issue_description,
      issueReportedAt: row.issue_reported_at ? new Date(row.issue_reported_at) : undefined,
      issueReportedBy: row.issue_reported_by,
      requiredSignature: row.required_signature,
      requiredNote: row.required_note,
      customFieldValues: row.custom_field_values,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      updatedAt: new Date(row.updated_at),
      updatedBy: row.updated_by,
      version: row.version,
    }) as TaskInstance;
  }

  /**
   * Helper: Map database row to ProgressNote entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToProgressNote(row: any): ProgressNote {
    return ({
      id: row.id,
      carePlanId: row.care_plan_id,
      clientId: row.client_id,
      visitId: row.visit_id,
      noteType: row.note_type,
      noteDate: new Date(row.note_date),
      authorId: row.author_id,
      authorName: row.author_name,
      authorRole: row.author_role,
      content: row.content,
      goalProgress: row.goal_progress,
      observations: row.observations,
      concerns: row.concerns,
      recommendations: row.recommendations,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      approved: row.approved,
      attachments: row.attachments,
      signature: row.signature,
      tags: row.tags,
      isPrivate: row.is_private,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      updatedAt: new Date(row.updated_at),
      updatedBy: row.updated_by,
      version: row.version,
    }) as ProgressNote;
  }

  /**
   * Helper: Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default CarePlanRepository;
