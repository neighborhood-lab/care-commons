/**
 * Care Note Repository
 *
 * Data access layer for care notes and progress reporting
 */

import { Repository, Database } from '@care-commons/core';
import { UUID, PaginatedResult, PaginationParams } from '@care-commons/core';
import {
  CareNote,
  CreateCareNoteInput,
  UpdateCareNoteInput,
  CareNoteSearchFilters,
  ProgressReport,
  ProgressReportType,
} from '../types/care-note.js';

export class CareNoteRepository extends Repository<CareNote> {
  constructor(database: Database) {
    super({
      tableName: 'care_notes',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  // Satisfy abstract methods (delegate / stub)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): CareNote {
    return this.mapRowToCareNote(row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<CareNote>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    // Map all entity properties to snake_case database columns
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.caregiverId !== undefined) row.caregiver_id = entity.caregiverId;
    if (entity.visitId !== undefined) row.visit_id = entity.visitId;
    if (entity.carePlanId !== undefined) row.care_plan_id = entity.carePlanId;
    if (entity.organizationId !== undefined)
      row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.noteNumber !== undefined) row.note_number = entity.noteNumber;
    if (entity.noteType !== undefined) row.note_type = entity.noteType;
    if (entity.priority !== undefined) row.priority = entity.priority;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.visitDate !== undefined) row.visit_date = entity.visitDate;
    if (entity.visitStartTime !== undefined)
      row.visit_start_time = entity.visitStartTime;
    if (entity.visitEndTime !== undefined)
      row.visit_end_time = entity.visitEndTime;
    if (entity.noteDate !== undefined) row.note_date = entity.noteDate;
    if (entity.authorId !== undefined) row.author_id = entity.authorId;
    if (entity.authorName !== undefined) row.author_name = entity.authorName;
    if (entity.authorRole !== undefined) row.author_role = entity.authorRole;
    if (entity.authorSignature !== undefined)
      row.author_signature = JSON.stringify(entity.authorSignature);
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.content !== undefined) row.content = entity.content;

    // Handle JSONB fields
    if (entity.structuredContent !== undefined)
      row.structured_content = JSON.stringify(entity.structuredContent);
    if (entity.observations !== undefined)
      row.observations = JSON.stringify(entity.observations);
    if (entity.vitalSigns !== undefined)
      row.vital_signs = JSON.stringify(entity.vitalSigns);
    if (entity.painAssessment !== undefined)
      row.pain_assessment = JSON.stringify(entity.painAssessment);
    if (entity.moodAssessment !== undefined)
      row.mood_assessment = JSON.stringify(entity.moodAssessment);
    if (entity.activitiesPerformed !== undefined)
      row.activities_performed = JSON.stringify(entity.activitiesPerformed);
    if (entity.tasksCompleted !== undefined)
      row.tasks_completed = JSON.stringify(entity.tasksCompleted);
    if (entity.interventionsProvided !== undefined)
      row.interventions_provided = JSON.stringify(entity.interventionsProvided);
    if (entity.clientCondition !== undefined)
      row.client_condition = JSON.stringify(entity.clientCondition);
    if (entity.changeInCondition !== undefined)
      row.change_in_condition = entity.changeInCondition;
    if (entity.changeDescription !== undefined)
      row.change_description = entity.changeDescription;
    if (entity.concerns !== undefined)
      row.concerns = JSON.stringify(entity.concerns);
    if (entity.alerts !== undefined)
      row.alerts = JSON.stringify(entity.alerts);
    if (entity.followUpRequired !== undefined)
      row.follow_up_required = entity.followUpRequired;
    if (entity.followUpInstructions !== undefined)
      row.follow_up_instructions = entity.followUpInstructions;
    if (entity.medicationsAdministered !== undefined)
      row.medications_administered = JSON.stringify(
        entity.medicationsAdministered
      );
    if (entity.medicationChanges !== undefined)
      row.medication_changes = JSON.stringify(entity.medicationChanges);
    if (entity.familyCommunication !== undefined)
      row.family_communication = JSON.stringify(entity.familyCommunication);
    if (entity.physicianCommunication !== undefined)
      row.physician_communication = JSON.stringify(
        entity.physicianCommunication
      );
    if (entity.goalProgress !== undefined)
      row.goal_progress = JSON.stringify(entity.goalProgress);
    if (entity.progressSummary !== undefined)
      row.progress_summary = entity.progressSummary;
    if (entity.attachments !== undefined)
      row.attachments = JSON.stringify(entity.attachments);
    if (entity.photos !== undefined)
      row.photos = JSON.stringify(entity.photos);
    if (entity.reviewedBy !== undefined) row.reviewed_by = entity.reviewedBy;
    if (entity.reviewedAt !== undefined) row.reviewed_at = entity.reviewedAt;
    if (entity.reviewStatus !== undefined)
      row.review_status = entity.reviewStatus;
    if (entity.reviewComments !== undefined)
      row.review_comments = entity.reviewComments;
    if (entity.approvedBy !== undefined) row.approved_by = entity.approvedBy;
    if (entity.approvedAt !== undefined) row.approved_at = entity.approvedAt;
    if (entity.complianceCheckStatus !== undefined)
      row.compliance_check_status = entity.complianceCheckStatus;
    if (entity.requiredFields !== undefined)
      row.required_fields = JSON.stringify(entity.requiredFields);
    if (entity.missingFields !== undefined)
      row.missing_fields = JSON.stringify(entity.missingFields);
    if (entity.lastComplianceCheck !== undefined)
      row.last_compliance_check = entity.lastComplianceCheck;
    if (entity.tags !== undefined) row.tags = JSON.stringify(entity.tags);
    if (entity.categories !== undefined)
      row.categories = JSON.stringify(entity.categories);
    if (entity.isPrivate !== undefined) row.is_private = entity.isPrivate;
    if (entity.isConfidential !== undefined)
      row.is_confidential = entity.isConfidential;
    if (entity.needsAttention !== undefined)
      row.needs_attention = entity.needsAttention;
    if (entity.customFields !== undefined)
      row.custom_fields = JSON.stringify(entity.customFields);

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
   * Map database row to CareNote entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToCareNote(row: any): CareNote {
    return {
      id: row.id,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      visitId: row.visit_id,
      carePlanId: row.care_plan_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      noteNumber: row.note_number,
      noteType: row.note_type,
      priority: row.priority,
      status: row.status,
      visitDate: row.visit_date,
      visitStartTime: row.visit_start_time,
      visitEndTime: row.visit_end_time,
      noteDate: row.note_date,
      authorId: row.author_id,
      authorName: row.author_name,
      authorRole: row.author_role,
      authorSignature: row.author_signature,
      title: row.title,
      content: row.content,
      structuredContent: row.structured_content,
      observations: row.observations,
      vitalSigns: row.vital_signs,
      painAssessment: row.pain_assessment,
      moodAssessment: row.mood_assessment,
      activitiesPerformed: row.activities_performed,
      tasksCompleted: row.tasks_completed,
      interventionsProvided: row.interventions_provided,
      clientCondition: row.client_condition,
      changeInCondition: row.change_in_condition,
      changeDescription: row.change_description,
      concerns: row.concerns,
      alerts: row.alerts,
      followUpRequired: row.follow_up_required,
      followUpInstructions: row.follow_up_instructions,
      medicationsAdministered: row.medications_administered,
      medicationChanges: row.medication_changes,
      familyCommunication: row.family_communication,
      physicianCommunication: row.physician_communication,
      goalProgress: row.goal_progress,
      progressSummary: row.progress_summary,
      attachments: row.attachments,
      photos: row.photos,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewStatus: row.review_status,
      reviewComments: row.review_comments,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      complianceCheckStatus: row.compliance_check_status,
      requiredFields: row.required_fields,
      missingFields: row.missing_fields,
      lastComplianceCheck: row.last_compliance_check,
      tags: row.tags,
      categories: row.categories,
      isPrivate: row.is_private,
      isConfidential: row.is_confidential,
      needsAttention: row.needs_attention,
      customFields: row.custom_fields,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }

  /**
   * Create a new care note
   */
  async createCareNote(
    input: CreateCareNoteInput & {
      noteNumber: string;
      createdBy: UUID;
      authorName: string;
      authorRole: string;
    }
  ): Promise<CareNote> {
    const query = `
      INSERT INTO care_notes (
        id,
        client_id,
        caregiver_id,
        visit_id,
        care_plan_id,
        organization_id,
        branch_id,
        note_number,
        note_type,
        priority,
        status,
        visit_date,
        visit_start_time,
        visit_end_time,
        note_date,
        author_id,
        author_name,
        author_role,
        title,
        content,
        structured_content,
        observations,
        vital_signs,
        activities_performed,
        concerns,
        review_status,
        compliance_check_status,
        created_by,
        updated_by,
        created_at,
        updated_at,
        version
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26, $26, NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.clientId,
      input.caregiverId,
      input.visitId,
      input.carePlanId,
      input.organizationId,
      input.branchId,
      input.noteNumber,
      input.noteType,
      'ROUTINE', // Default priority
      'DRAFT', // Initial status
      input.visitDate,
      input.visitStartTime,
      input.visitEndTime,
      input.caregiverId, // author_id
      input.authorName,
      input.authorRole,
      input.title,
      input.content,
      input.structuredContent ? JSON.stringify(input.structuredContent) : null,
      input.observations ? JSON.stringify(input.observations) : null,
      input.vitalSigns ? JSON.stringify(input.vitalSigns) : null,
      input.activitiesPerformed
        ? JSON.stringify(input.activitiesPerformed)
        : null,
      input.concerns ? JSON.stringify(input.concerns) : null,
      'NOT_REVIEWED', // Initial review status
      'INCOMPLETE', // Initial compliance status
      input.createdBy,
    ]);

    return this.mapRowToCareNote(result.rows[0]);
  }

  /**
   * Get care note by ID
   */
  async getCareNoteById(id: UUID): Promise<CareNote | null> {
    const query = `
      SELECT * FROM care_notes
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [id]);
    return result.rows[0] ? this.mapRowToCareNote(result.rows[0]) : null;
  }

  /**
   * Update care note
   */
  async updateCareNote(
    id: UUID,
    input: UpdateCareNoteInput,
    updatedBy: UUID
  ): Promise<CareNote> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }
    if (input.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(input.content);
    }
    if (input.structuredContent !== undefined) {
      updates.push(`structured_content = $${paramIndex++}`);
      values.push(JSON.stringify(input.structuredContent));
    }
    if (input.observations !== undefined) {
      updates.push(`observations = $${paramIndex++}`);
      values.push(JSON.stringify(input.observations));
    }
    if (input.vitalSigns !== undefined) {
      updates.push(`vital_signs = $${paramIndex++}`);
      values.push(JSON.stringify(input.vitalSigns));
    }
    if (input.activitiesPerformed !== undefined) {
      updates.push(`activities_performed = $${paramIndex++}`);
      values.push(JSON.stringify(input.activitiesPerformed));
    }
    if (input.concerns !== undefined) {
      updates.push(`concerns = $${paramIndex++}`);
      values.push(JSON.stringify(input.concerns));
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(input.tags));
    }

    if (updates.length === 0) {
      const note = await this.getCareNoteById(id);
      if (!note) throw new Error('Care note not found');
      return note;
    }

    updates.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);
    updates.push(`updated_at = NOW()`);
    updates.push(`version = version + 1`);

    values.push(id);

    const query = `
      UPDATE care_notes
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Care note not found or already deleted');
    }

    return this.mapRowToCareNote(result.rows[0]);
  }

  /**
   * Search care notes with filters
   */
  async searchCareNotes(
    filters: CareNoteSearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CareNote>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      values.push(filters.clientId);
    }
    if (filters.caregiverId) {
      conditions.push(`caregiver_id = $${paramIndex++}`);
      values.push(filters.caregiverId);
    }
    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      values.push(filters.organizationId);
    }
    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      values.push(filters.branchId);
    }
    if (filters.noteType && filters.noteType.length > 0) {
      conditions.push(`note_type = ANY($${paramIndex++})`);
      values.push(filters.noteType);
    }
    if (filters.status && filters.status.length > 0) {
      conditions.push(`status = ANY($${paramIndex++})`);
      values.push(filters.status);
    }
    if (filters.reviewStatus && filters.reviewStatus.length > 0) {
      conditions.push(`review_status = ANY($${paramIndex++})`);
      values.push(filters.reviewStatus);
    }
    if (filters.dateFrom) {
      conditions.push(`visit_date >= $${paramIndex++}`);
      values.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push(`visit_date <= $${paramIndex++}`);
      values.push(filters.dateTo);
    }
    if (filters.needsReview) {
      conditions.push(`review_status = 'NOT_REVIEWED'`);
    }
    if (filters.changeInCondition) {
      conditions.push(`change_in_condition = true`);
    }
    if (filters.query) {
      conditions.push(
        `(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`
      );
      values.push(`%${filters.query}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM care_notes
      ${whereClause}
    `;
    const countResult = await this.database.query(countQuery, values);
    const countRow = countResult.rows[0] as Record<string, unknown> | undefined;
    if (!countRow) throw new Error('Count query returned no rows');
    const total = Number.parseInt(countRow['total'] as string, 10);

    // Get paginated data
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT *
      FROM care_notes
      ${whereClause}
      ORDER BY visit_date DESC, created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataResult = await this.database.query(dataQuery, [
      ...values,
      limit,
      offset,
    ]);

    return {
      items: dataResult.rows.map((row: Record<string, unknown>) =>
        this.mapRowToCareNote(row)
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get care notes by client ID
   */
  async getCareNotesByClientId(
    clientId: UUID,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CareNote>> {
    return this.searchCareNotes({ clientId }, pagination);
  }

  /**
   * Get care notes requiring review
   */
  async getCareNotesRequiringReview(
    organizationId?: UUID,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<CareNote>> {
    const filters: CareNoteSearchFilters = {
      needsReview: true,
    };
    if (organizationId) {
      filters.organizationId = organizationId;
    }
    return this.searchCareNotes(filters, pagination);
  }

  /**
   * Review care note
   */
  async reviewCareNote(
    id: UUID,
    reviewedBy: UUID,
    reviewStatus: string,
    reviewComments?: string
  ): Promise<CareNote> {
    const query = `
      UPDATE care_notes
      SET
        reviewed_by = $1,
        reviewed_at = NOW(),
        review_status = $2,
        review_comments = $3,
        updated_by = $1,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $4 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.database.query(query, [
      reviewedBy,
      reviewStatus,
      reviewComments,
      id,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Care note not found or already deleted');
    }

    return this.mapRowToCareNote(result.rows[0]);
  }

  /**
   * Approve care note
   */
  async approveCareNote(id: UUID, approvedBy: UUID): Promise<CareNote> {
    const query = `
      UPDATE care_notes
      SET
        approved_by = $1,
        approved_at = NOW(),
        review_status = 'APPROVED',
        status = 'APPROVED',
        updated_by = $1,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.database.query(query, [approvedBy, id]);

    if (result.rows.length === 0) {
      throw new Error('Care note not found or already deleted');
    }

    return this.mapRowToCareNote(result.rows[0]);
  }

  /**
   * Generate progress report for a client
   */
  async generateProgressReport(
    clientId: UUID,
    reportType: ProgressReportType,
    periodStart: Date,
    periodEnd: Date,
    generatedBy: UUID
  ): Promise<ProgressReport> {
    // This would typically involve complex aggregations
    // For now, return a stub that can be expanded
    const query = `
      INSERT INTO progress_reports (
        id,
        report_type,
        client_id,
        period_start,
        period_end,
        generated_at,
        generated_by,
        created_at,
        created_by,
        updated_at,
        updated_by,
        version
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, NOW(), $5, NOW(), $5, NOW(), $5, 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      reportType,
      clientId,
      periodStart,
      periodEnd,
      generatedBy,
    ]);

    // Map and return (simplified for now)
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error('Progress report creation failed');
    return {
      id: row['id'] as UUID,
      reportType: row['report_type'] as ProgressReportType,
      clientId: row['client_id'] as UUID,
      periodStart: row['period_start'] as Date,
      periodEnd: row['period_end'] as Date,
      generatedAt: row['generated_at'] as Date,
      generatedBy: row['generated_by'] as UUID,
      totalVisits: 0,
      totalHours: 0,
      notesCount: 0,
      goalsReviewed: 0,
      overallProgress: '',
      goalProgress: [],
    };
  }
}
