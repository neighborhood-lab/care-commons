/**
 * Respite Care Repository
 *
 * Data access layer for family respite care coordination
 */

import { Repository, Database } from '@folkcare/core';
import type { UUID } from '@folkcare/core';
import type {
  RespiteRequest,
  CreateRespiteRequestInput,
  UpdateRespiteRequestInput,
  RespiteRequestFilters,
  AvailableRespiteCaregiver
} from '../types/respite-care.js';

/**
 * Repository for respite care requests
 */
export class RespiteRepository extends Repository<RespiteRequest> {
  constructor(database: Database) {
    super({
      tableName: 'respite_requests',
      database,
      enableAudit: true,
      enableSoftDelete: true
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): RespiteRequest {
    return {
      id: row.id,
      clientId: row.client_id,
      familyMemberId: row.family_member_id,
      status: row.status,
      priority: row.priority,
      reasonCategory: row.reason_category,
      reasonDescription: row.reason_description,
      requestedStartDate: row.requested_start_date,
      requestedStartTime: row.requested_start_time,
      requestedEndDate: row.requested_end_date,
      requestedEndTime: row.requested_end_time,
      requestedDurationMinutes: row.requested_duration_minutes,
      flexibleTiming: row.flexible_timing,
      preferredCaregiverId: row.preferred_caregiver_id,
      acceptAnyCaregiver: row.accept_any_caregiver,
      genderPreference: row.gender_preference,
      requiredSkills: row.required_skills,
      specialInstructions: row.special_instructions,
      emergencyContact: row.emergency_contact,
      submittedAt: row.submitted_at,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      approvalNotes: row.approval_notes,
      declineReason: row.decline_reason,
      assignedCaregiverId: row.assigned_caregiver_id,
      assignedAt: row.assigned_at,
      scheduledVisitId: row.scheduled_visit_id,
      completedAt: row.completed_at,
      completionNotes: row.completion_notes,
      familyRating: row.family_rating,
      familyFeedback: row.family_feedback,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<RespiteRequest>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.clientId !== undefined) row.client_id = entity.clientId;
    if (entity.familyMemberId !== undefined) row.family_member_id = entity.familyMemberId;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.priority !== undefined) row.priority = entity.priority;
    if (entity.reasonCategory !== undefined) row.reason_category = entity.reasonCategory;
    if (entity.reasonDescription !== undefined) row.reason_description = entity.reasonDescription;
    if (entity.requestedStartDate !== undefined) row.requested_start_date = entity.requestedStartDate;
    if (entity.requestedStartTime !== undefined) row.requested_start_time = entity.requestedStartTime;
    if (entity.requestedEndDate !== undefined) row.requested_end_date = entity.requestedEndDate;
    if (entity.requestedEndTime !== undefined) row.requested_end_time = entity.requestedEndTime;
    if (entity.requestedDurationMinutes !== undefined) row.requested_duration_minutes = entity.requestedDurationMinutes;
    if (entity.flexibleTiming !== undefined) row.flexible_timing = entity.flexibleTiming;
    if (entity.preferredCaregiverId !== undefined) row.preferred_caregiver_id = entity.preferredCaregiverId;
    if (entity.acceptAnyCaregiver !== undefined) row.accept_any_caregiver = entity.acceptAnyCaregiver;
    if (entity.genderPreference !== undefined) row.gender_preference = entity.genderPreference;
    if (entity.requiredSkills !== undefined) row.required_skills = JSON.stringify(entity.requiredSkills);
    if (entity.specialInstructions !== undefined) row.special_instructions = entity.specialInstructions;
    if (entity.emergencyContact !== undefined) row.emergency_contact = JSON.stringify(entity.emergencyContact);
    if (entity.submittedAt !== undefined) row.submitted_at = entity.submittedAt;
    if (entity.reviewedBy !== undefined) row.reviewed_by = entity.reviewedBy;
    if (entity.reviewedAt !== undefined) row.reviewed_at = entity.reviewedAt;
    if (entity.approvalNotes !== undefined) row.approval_notes = entity.approvalNotes;
    if (entity.declineReason !== undefined) row.decline_reason = entity.declineReason;
    if (entity.assignedCaregiverId !== undefined) row.assigned_caregiver_id = entity.assignedCaregiverId;
    if (entity.assignedAt !== undefined) row.assigned_at = entity.assignedAt;
    if (entity.scheduledVisitId !== undefined) row.scheduled_visit_id = entity.scheduledVisitId;
    if (entity.completedAt !== undefined) row.completed_at = entity.completedAt;
    if (entity.completionNotes !== undefined) row.completion_notes = entity.completionNotes;
    if (entity.familyRating !== undefined) row.family_rating = entity.familyRating;
    if (entity.familyFeedback !== undefined) row.family_feedback = entity.familyFeedback;
    if (entity.organizationId !== undefined) row.organization_id = entity.organizationId;
    if (entity.branchId !== undefined) row.branch_id = entity.branchId;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.createdBy !== undefined) row.created_by = entity.createdBy;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    if (entity.updatedBy !== undefined) row.updated_by = entity.updatedBy;
    if (entity.version !== undefined) row.version = entity.version;

    return row;
  }

  /**
   * Create a new respite request
   */
  async createRequest(
    input: CreateRespiteRequestInput & { createdBy: UUID }
  ): Promise<RespiteRequest> {
    // Calculate duration in minutes
    const startDateTime = new Date(`${input.requestedStartDate}T${input.requestedStartTime}`);
    const endDateTime = new Date(`${input.requestedEndDate}T${input.requestedEndTime}`);
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

    const query = `
      INSERT INTO respite_requests (
        id, client_id, family_member_id, status, priority, reason_category, reason_description,
        requested_start_date, requested_start_time, requested_end_date, requested_end_time,
        requested_duration_minutes, flexible_timing, preferred_caregiver_id, accept_any_caregiver,
        gender_preference, required_skills, special_instructions, emergency_contact,
        organization_id, branch_id, created_by, updated_by, created_at, updated_at, version
      ) VALUES (
        gen_random_uuid(), $1, $2, 'DRAFT', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $20, NOW(), NOW(), 1
      )
      RETURNING *
    `;

    const result = await this.database.query(query, [
      input.clientId,
      input.familyMemberId,
      input.priority ?? 'ROUTINE',
      input.reasonCategory,
      input.reasonDescription ?? null,
      input.requestedStartDate,
      input.requestedStartTime,
      input.requestedEndDate,
      input.requestedEndTime,
      durationMinutes,
      input.flexibleTiming ?? true,
      input.preferredCaregiverId ?? null,
      input.acceptAnyCaregiver ?? true,
      input.genderPreference ?? null,
      JSON.stringify(input.requiredSkills ?? []),
      input.specialInstructions ?? null,
      JSON.stringify(input.emergencyContact),
      input.organizationId,
      input.branchId,
      input.createdBy
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Update a respite request
   */
  async updateRequest(
    id: UUID,
    input: UpdateRespiteRequestInput,
    updatedBy: UUID
  ): Promise<RespiteRequest | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (input.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(input.priority);
    }
    if (input.reasonCategory !== undefined) {
      updates.push(`reason_category = $${paramIndex++}`);
      values.push(input.reasonCategory);
    }
    if (input.reasonDescription !== undefined) {
      updates.push(`reason_description = $${paramIndex++}`);
      values.push(input.reasonDescription);
    }
    if (input.requestedStartDate !== undefined) {
      updates.push(`requested_start_date = $${paramIndex++}`);
      values.push(input.requestedStartDate);
    }
    if (input.requestedStartTime !== undefined) {
      updates.push(`requested_start_time = $${paramIndex++}`);
      values.push(input.requestedStartTime);
    }
    if (input.requestedEndDate !== undefined) {
      updates.push(`requested_end_date = $${paramIndex++}`);
      values.push(input.requestedEndDate);
    }
    if (input.requestedEndTime !== undefined) {
      updates.push(`requested_end_time = $${paramIndex++}`);
      values.push(input.requestedEndTime);
    }
    if (input.flexibleTiming !== undefined) {
      updates.push(`flexible_timing = $${paramIndex++}`);
      values.push(input.flexibleTiming);
    }
    if (input.preferredCaregiverId !== undefined) {
      updates.push(`preferred_caregiver_id = $${paramIndex++}`);
      values.push(input.preferredCaregiverId);
    }
    if (input.acceptAnyCaregiver !== undefined) {
      updates.push(`accept_any_caregiver = $${paramIndex++}`);
      values.push(input.acceptAnyCaregiver);
    }
    if (input.genderPreference !== undefined) {
      updates.push(`gender_preference = $${paramIndex++}`);
      values.push(input.genderPreference);
    }
    if (input.requiredSkills !== undefined) {
      updates.push(`required_skills = $${paramIndex++}`);
      values.push(JSON.stringify(input.requiredSkills));
    }
    if (input.specialInstructions !== undefined) {
      updates.push(`special_instructions = $${paramIndex++}`);
      values.push(input.specialInstructions);
    }
    if (input.emergencyContact !== undefined) {
      updates.push(`emergency_contact = $${paramIndex++}`);
      values.push(JSON.stringify(input.emergencyContact));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // Recalculate duration if dates/times changed
    if (input.requestedStartDate ?? input.requestedStartTime ?? input.requestedEndDate ?? input.requestedEndTime) {
      updates.push(`requested_duration_minutes = EXTRACT(EPOCH FROM (
        (requested_end_date || ' ' || requested_end_time)::timestamp -
        (requested_start_date || ' ' || requested_start_time)::timestamp
      )) / 60`);
    }

    updates.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);
    updates.push(`updated_at = NOW()`);
    updates.push(`version = version + 1`);

    values.push(id);

    const query = `
      UPDATE respite_requests
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, values);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Submit a draft request for review
   */
  async submitRequest(id: UUID, updatedBy: UUID): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET status = 'SUBMITTED', submitted_at = NOW(), updated_by = $1, updated_at = NOW(), version = version + 1
      WHERE id = $2 AND status = 'DRAFT' AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [updatedBy, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Approve a submitted request
   */
  async approveRequest(
    id: UUID,
    reviewedBy: UUID,
    approvalNotes?: string
  ): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW(),
          approval_notes = $2, updated_by = $1, updated_at = NOW(), version = version + 1
      WHERE id = $3 AND status = 'SUBMITTED' AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [reviewedBy, approvalNotes ?? null, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Decline a submitted request
   */
  async declineRequest(
    id: UUID,
    reviewedBy: UUID,
    declineReason: string
  ): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET status = 'DECLINED', reviewed_by = $1, reviewed_at = NOW(),
          decline_reason = $2, updated_by = $1, updated_at = NOW(), version = version + 1
      WHERE id = $3 AND status = 'SUBMITTED' AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [reviewedBy, declineReason, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Assign a caregiver to an approved request
   */
  async assignCaregiver(
    id: UUID,
    caregiverId: UUID,
    visitId: UUID,
    updatedBy: UUID
  ): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET status = 'SCHEDULED', assigned_caregiver_id = $1, assigned_at = NOW(),
          scheduled_visit_id = $2, updated_by = $3, updated_at = NOW(), version = version + 1
      WHERE id = $4 AND status = 'APPROVED' AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [caregiverId, visitId, updatedBy, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Mark a respite request as in progress
   */
  async startRespite(id: UUID, updatedBy: UUID): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET status = 'IN_PROGRESS', updated_by = $1, updated_at = NOW(), version = version + 1
      WHERE id = $2 AND status = 'SCHEDULED' AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [updatedBy, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Complete a respite request
   */
  async completeRequest(
    id: UUID,
    updatedBy: UUID,
    completionNotes?: string
  ): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET status = 'COMPLETED', completed_at = NOW(), completion_notes = $1,
          updated_by = $2, updated_at = NOW(), version = version + 1
      WHERE id = $3 AND status = 'IN_PROGRESS' AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [completionNotes ?? null, updatedBy, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Add family feedback after completion
   */
  async addFamilyFeedback(
    id: UUID,
    familyMemberId: UUID,
    rating: number,
    feedback?: string
  ): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET family_rating = $1, family_feedback = $2, updated_by = $3, updated_at = NOW(), version = version + 1
      WHERE id = $4 AND family_member_id = $3 AND status = 'COMPLETED' AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [rating, feedback ?? null, familyMemberId, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Cancel a request
   */
  async cancelRequest(id: UUID, updatedBy: UUID): Promise<RespiteRequest | null> {
    const query = `
      UPDATE respite_requests
      SET status = 'CANCELLED', updated_by = $1, updated_at = NOW(), version = version + 1
      WHERE id = $2 AND status NOT IN ('COMPLETED', 'CANCELLED', 'DECLINED') AND is_deleted = false
      RETURNING *
    `;

    const result = await this.database.query(query, [updatedBy, id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * Find requests by family member
   */
  async findByFamilyMember(familyMemberId: UUID): Promise<RespiteRequest[]> {
    const query = `
      SELECT * FROM respite_requests
      WHERE family_member_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
    `;

    const result = await this.database.query(query, [familyMemberId]);
    return result.rows.map((row: unknown) => this.mapRowToEntity(row));
  }

  /**
   * Find requests by client
   */
  async findByClient(clientId: UUID): Promise<RespiteRequest[]> {
    const query = `
      SELECT * FROM respite_requests
      WHERE client_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
    `;

    const result = await this.database.query(query, [clientId]);
    return result.rows.map((row: unknown) => this.mapRowToEntity(row));
  }

  /**
   * Find upcoming requests for a client
   */
  async findUpcoming(clientId: UUID): Promise<RespiteRequest[]> {
    const query = `
      SELECT * FROM respite_requests
      WHERE client_id = $1 AND is_deleted = false
        AND status IN ('SUBMITTED', 'APPROVED', 'SCHEDULED')
        AND requested_start_date >= CURRENT_DATE
      ORDER BY requested_start_date, requested_start_time
    `;

    const result = await this.database.query(query, [clientId]);
    return result.rows.map((row: unknown) => this.mapRowToEntity(row));
  }

  /**
   * Find requests with filters
   */
  async findWithFilters(filters: RespiteRequestFilters): Promise<RespiteRequest[]> {
    const conditions: string[] = ['is_deleted = false'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters.clientId !== undefined) {
      conditions.push(`client_id = $${paramIndex++}`);
      values.push(filters.clientId);
    }
    if (filters.familyMemberId !== undefined) {
      conditions.push(`family_member_id = $${paramIndex++}`);
      values.push(filters.familyMemberId);
    }
    if (filters.status !== undefined) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status = ANY($${paramIndex++})`);
        values.push(filters.status);
      } else {
        conditions.push(`status = $${paramIndex++}`);
        values.push(filters.status);
      }
    }
    if (filters.priority !== undefined) {
      conditions.push(`priority = $${paramIndex++}`);
      values.push(filters.priority);
    }
    if (filters.startDateFrom !== undefined) {
      conditions.push(`requested_start_date >= $${paramIndex++}`);
      values.push(filters.startDateFrom);
    }
    if (filters.startDateTo !== undefined) {
      conditions.push(`requested_start_date <= $${paramIndex++}`);
      values.push(filters.startDateTo);
    }
    if (filters.assignedCaregiverId !== undefined) {
      conditions.push(`assigned_caregiver_id = $${paramIndex++}`);
      values.push(filters.assignedCaregiverId);
    }
    if (filters.organizationId !== undefined) {
      conditions.push(`organization_id = $${paramIndex++}`);
      values.push(filters.organizationId);
    }
    if (filters.branchId !== undefined) {
      conditions.push(`branch_id = $${paramIndex++}`);
      values.push(filters.branchId);
    }

    const query = `
      SELECT * FROM respite_requests
      WHERE ${conditions.join(' AND ')}
      ORDER BY requested_start_date, requested_start_time
    `;

    const result = await this.database.query(query, values);
    return result.rows.map((row: unknown) => this.mapRowToEntity(row));
  }

  /**
   * Find available caregivers for a time slot
   */
  async findAvailableCaregivers(
    organizationId: UUID,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    requiredSkills?: string[],
    genderPreference?: string,
    preferredCaregiverId?: UUID
  ): Promise<AvailableRespiteCaregiver[]> {
    // This is a simplified query - in production, this would integrate
    // with the scheduling system to check actual availability
    const query = `
      SELECT
        c.id as caregiver_id,
        c.first_name,
        c.last_name,
        c.skills,
        c.gender,
        c.hourly_rate,
        CASE WHEN c.id = $7 THEN true ELSE false END as is_preferred,
        100 as match_score
      FROM caregivers c
      WHERE c.organization_id = $1
        AND c.status = 'ACTIVE'
        AND c.is_deleted = false
        ${genderPreference !== undefined && genderPreference !== 'NO_PREFERENCE' ? `AND c.gender = $8` : ''}
      ORDER BY
        CASE WHEN c.id = $7 THEN 0 ELSE 1 END,
        c.last_name, c.first_name
      LIMIT 20
    `;

    const params: unknown[] = [
      organizationId,
      startDate,
      startTime,
      endDate,
      endTime,
      JSON.stringify(requiredSkills ?? []),
      preferredCaregiverId ?? null
    ];

    if (genderPreference !== undefined && genderPreference !== 'NO_PREFERENCE') {
      params.push(genderPreference);
    }

    const result = await this.database.query(query, params);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => ({
      caregiverId: row.caregiver_id as UUID,
      firstName: row.first_name as string,
      lastName: row.last_name as string,
      matchScore: 100,
      isPreferred: row.is_preferred as boolean,
      hasRequiredSkills: true,
      matchingSkills: (row.skills as string[] | undefined) ?? [],
      availableFrom: `${startDate}T${startTime}`,
      availableTo: `${endDate}T${endTime}`,
      hourlyRate: row.hourly_rate as number | undefined
    }));
  }

  /**
   * Get usage summary for a family member
   */
  async getUsageSummary(familyMemberId: UUID, clientId: UUID): Promise<{
    currentPeriodHours: number;
    currentPeriodRequests: number;
    currentPeriodCompleted: number;
    yearToDateHours: number;
    yearToDateCompleted: number;
    averageRating: number;
  }> {
    const query = `
      SELECT
        -- Current month
        COALESCE(SUM(CASE
          WHEN status = 'COMPLETED'
            AND completed_at >= date_trunc('month', CURRENT_DATE)
          THEN requested_duration_minutes
          ELSE 0
        END) / 60.0, 0) as current_period_hours,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as current_period_requests,
        COUNT(*) FILTER (WHERE status = 'COMPLETED' AND completed_at >= date_trunc('month', CURRENT_DATE)) as current_period_completed,
        -- Year to date
        COALESCE(SUM(CASE
          WHEN status = 'COMPLETED'
            AND completed_at >= date_trunc('year', CURRENT_DATE)
          THEN requested_duration_minutes
          ELSE 0
        END) / 60.0, 0) as year_to_date_hours,
        COUNT(*) FILTER (WHERE status = 'COMPLETED' AND completed_at >= date_trunc('year', CURRENT_DATE)) as year_to_date_completed,
        COALESCE(AVG(family_rating) FILTER (WHERE family_rating IS NOT NULL), 0) as average_rating
      FROM respite_requests
      WHERE family_member_id = $1 AND client_id = $2 AND is_deleted = false
    `;

    const result = await this.database.query(query, [familyMemberId, clientId]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = result.rows[0] as any;

    return {
      currentPeriodHours: parseFloat(String(row?.current_period_hours ?? 0)) || 0,
      currentPeriodRequests: parseInt(String(row?.current_period_requests ?? 0), 10) || 0,
      currentPeriodCompleted: parseInt(String(row?.current_period_completed ?? 0), 10) || 0,
      yearToDateHours: parseFloat(String(row?.year_to_date_hours ?? 0)) || 0,
      yearToDateCompleted: parseInt(String(row?.year_to_date_completed ?? 0), 10) || 0,
      averageRating: parseFloat(String(row?.average_rating ?? 0)) || 0
    };
  }

  /**
   * Record a revision for audit trail (custom method, not an override)
   */
  async recordRevision(
    respiteRequestId: UUID,
    action: string,
    previousData: RespiteRequest | null,
    newData: RespiteRequest,
    changedFields: string[],
    createdBy: UUID,
    changeReason?: string
  ): Promise<void> {
    const query = `
      INSERT INTO respite_requests_revisions (
        id, respite_request_id, revision_number, action,
        previous_data, new_data, changed_fields, change_reason, created_at, created_by
      )
      SELECT
        gen_random_uuid(),
        $1,
        COALESCE(MAX(revision_number), 0) + 1,
        $2, $3, $4, $5, $6, NOW(), $7
      FROM respite_requests_revisions
      WHERE respite_request_id = $1
    `;

    await this.database.query(query, [
      respiteRequestId,
      action,
      previousData !== null ? JSON.stringify(previousData) : null,
      JSON.stringify(newData),
      JSON.stringify(changedFields),
      changeReason ?? null,
      createdBy
    ]);
  }
}
