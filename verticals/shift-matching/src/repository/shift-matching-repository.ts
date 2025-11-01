/**
 * Repository for Shift Matching & Assignment
 * 
 * Data access layer for open shifts, matching configurations, assignment proposals,
 * caregiver preferences, and match history. Handles all database operations.
 */

import { Pool } from 'pg';
import {
  UUID,
  PaginationParams,
  PaginatedResult,
  UserContext,
  NotFoundError,
  ConflictError,
} from '@care-commons/core';
import {
  OpenShift,
  MatchingConfiguration,
  AssignmentProposal,
  CaregiverPreferenceProfile,
  BulkMatchRequest,
  MatchHistory,
  OpenShiftFilters,
  ProposalFilters,
  CreateOpenShiftInput,
  CreateProposalInput,
  RespondToProposalInput,
  CreateBulkMatchInput,
  UpdateMatchingConfigurationInput,
  UpdateCaregiverPreferencesInput,
  ProposalStatus,
  MatchingStatus,
} from '../types/shift-matching';

export class ShiftMatchingRepository {
  constructor(private pool: Pool) {}

  /**
   * ==========================================================================
   * OPEN SHIFTS
   * ==========================================================================
   */

  async createOpenShift(
    input: CreateOpenShiftInput,
    context: UserContext
  ): Promise<OpenShift> {
    // First, get visit details
    const visitQuery = `
      SELECT 
        v.id, v.organization_id, v.branch_id, v.client_id,
        v.scheduled_date, v.scheduled_start_time, v.scheduled_end_time,
        v.scheduled_duration, v.timezone, v.service_type_id, v.service_type_name,
        v.address, v.task_ids, v.required_skills, v.required_certifications,
        v.client_instructions,
        sp.preferred_caregivers, sp.blocked_caregivers,
        sp.gender_preference, sp.language_preference
      FROM visits v
      LEFT JOIN service_patterns sp ON v.pattern_id = sp.id
      WHERE v.id = $1 AND v.deleted_at IS NULL
    `;
    
    const visitResult = await this.pool.query(visitQuery, [input.visitId]);
    if (visitResult.rows.length === 0) {
      throw new NotFoundError('Visit not found', { visitId: input.visitId });
    }
    
    const visit = visitResult.rows[0];
    
    // Check if open shift already exists for this visit
    const existingCheck = await this.pool.query(
      'SELECT id FROM open_shifts WHERE visit_id = $1',
      [input.visitId]
    );
    
    if (existingCheck.rows.length > 0) {
      throw new ConflictError('Open shift already exists for this visit', {
        visitId: input.visitId,
        openShiftId: existingCheck.rows[0].id,
      });
    }
    
    const query = `
      INSERT INTO open_shifts (
        organization_id, branch_id, visit_id, client_id,
        scheduled_date, start_time, end_time, duration, timezone,
        service_type_id, service_type_name, task_ids,
        required_skills, required_certifications,
        preferred_caregivers, blocked_caregivers,
        gender_preference, language_preference,
        address, latitude, longitude,
        priority, is_urgent, fill_by_date,
        matching_status, match_attempts,
        client_instructions, internal_notes, tags,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, 'NEW', 0, $25, $26, $27,
        NOW(), $28, NOW(), $28, 1
      )
      RETURNING *
    `;
    
    const address = visit.address;
    const values = [
      visit.organization_id,
      visit.branch_id,
      input.visitId,
      visit.client_id,
      visit.scheduled_date,
      visit.scheduled_start_time,
      visit.scheduled_end_time,
      visit.scheduled_duration,
      visit.timezone,
      visit.service_type_id,
      visit.service_type_name,
      visit.task_ids,
      visit.required_skills,
      visit.required_certifications,
      visit.preferred_caregivers,
      visit.blocked_caregivers,
      visit.gender_preference,
      visit.language_preference,
      address,
      address?.latitude ?? null,
      address?.longitude ?? null,
      input.priority ?? 'NORMAL',
      false,
      input.fillByDate ?? null,
      visit.client_instructions,
      input.internalNotes ?? null,
      null,
      context.userId,
    ];
    
    const result = await this.pool.query(query, values);
    return this.mapRowToOpenShift(result.rows[0]);
  }

  async getOpenShift(id: UUID): Promise<OpenShift | null> {
    const query = 'SELECT * FROM open_shifts WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToOpenShift(result.rows[0]) : null;
  }

  async getOpenShiftByVisitId(visitId: UUID): Promise<OpenShift | null> {
    const query = 'SELECT * FROM open_shifts WHERE visit_id = $1';
    const result = await this.pool.query(query, [visitId]);
    return result.rows.length > 0 ? this.mapRowToOpenShift(result.rows[0]) : null;
  }

  async updateOpenShiftStatus(
    id: UUID,
    status: MatchingStatus,
    context: UserContext
  ): Promise<OpenShift> {
    const query = `
      UPDATE open_shifts
      SET matching_status = $1,
          last_matched_at = CASE WHEN $1 = 'MATCHED' THEN NOW() ELSE last_matched_at END,
          match_attempts = CASE WHEN $1 = 'MATCHING' THEN match_attempts + 1 ELSE match_attempts END,
          updated_at = NOW(),
          updated_by = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [status, context.userId, id]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Open shift not found', { id });
    }
    
    return this.mapRowToOpenShift(result.rows[0]);
  }

  async searchOpenShifts(
    filters: OpenShiftFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<OpenShift>> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramCount = 0;

    if (filters.organizationId !== undefined) {
      conditions.push(`organization_id = $${++paramCount}`);
      values.push(filters.organizationId);
    }

    if (filters.branchId !== undefined) {
      conditions.push(`branch_id = $${++paramCount}`);
      values.push(filters.branchId);
    }

    if (filters.branchIds !== undefined && filters.branchIds.length > 0) {
      conditions.push(`branch_id = ANY($${++paramCount})`);
      values.push(filters.branchIds);
    }

    if (filters.clientId !== undefined) {
      conditions.push(`client_id = $${++paramCount}`);
      values.push(filters.clientId);
    }

    if (filters.dateFrom !== undefined) {
      conditions.push(`scheduled_date >= $${++paramCount}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo !== undefined) {
      conditions.push(`scheduled_date <= $${++paramCount}`);
      values.push(filters.dateTo);
    }

    if (filters.priority !== undefined && filters.priority.length > 0) {
      conditions.push(`priority = ANY($${++paramCount})`);
      values.push(filters.priority);
    }

    if (filters.matchingStatus !== undefined && filters.matchingStatus.length > 0) {
      conditions.push(`matching_status = ANY($${++paramCount})`);
      values.push(filters.matchingStatus);
    }

    if (filters.isUrgent !== undefined) {
      conditions.push(`is_urgent = $${++paramCount}`);
      values.push(filters.isUrgent);
    }

    if (filters.serviceTypeId !== undefined) {
      conditions.push(`service_type_id = $${++paramCount}`);
      values.push(filters.serviceTypeId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) FROM open_shifts ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy ?? 'scheduled_date';
    const sortOrder = pagination.sortOrder ?? 'asc';

    const dataQuery = `
      SELECT * FROM open_shifts
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    values.push(pagination.limit, offset);
    const dataResult = await this.pool.query(dataQuery, values);

    return {
      items: dataResult.rows.map((row) => this.mapRowToOpenShift(row)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * ==========================================================================
   * MATCHING CONFIGURATIONS
   * ==========================================================================
   */

  async createMatchingConfiguration(
    input: Partial<MatchingConfiguration>,
    context: UserContext
  ): Promise<MatchingConfiguration> {
    const query = `
      INSERT INTO matching_configurations (
        organization_id, branch_id, name, description, weights,
        max_travel_distance, max_travel_time,
        require_exact_skill_match, require_active_certifications,
        respect_gender_preference, respect_language_preference,
        auto_assign_threshold, min_score_for_proposal,
        max_proposals_per_shift, proposal_expiration_minutes,
        optimize_for, consider_cost_efficiency,
        balance_workload_across_caregivers, prioritize_continuity_of_care,
        prefer_same_caregiver_for_recurring, penalize_frequent_rejections,
        boost_reliable_performers, is_active, is_default, notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        NOW(), $26, NOW(), $26, 1
      )
      RETURNING *
    `;

    const values = [
      input.organizationId,
      input.branchId ?? null,
      input.name,
      input.description ?? null,
      JSON.stringify(input.weights),
      input.maxTravelDistance ?? null,
      input.maxTravelTime ?? null,
      input.requireExactSkillMatch ?? false,
      input.requireActiveCertifications ?? true,
      input.respectGenderPreference ?? true,
      input.respectLanguagePreference ?? true,
      input.autoAssignThreshold ?? null,
      input.minScoreForProposal ?? 50,
      input.maxProposalsPerShift ?? 5,
      input.proposalExpirationMinutes ?? 120,
      input.optimizeFor ?? 'BEST_MATCH',
      input.considerCostEfficiency ?? false,
      input.balanceWorkloadAcrossCaregivers ?? false,
      input.prioritizeContinuityOfCare ?? true,
      input.preferSameCaregiverForRecurring ?? true,
      input.penalizeFrequentRejections ?? true,
      input.boostReliablePerformers ?? true,
      input.isActive ?? true,
      input.isDefault ?? false,
      input.notes ?? null,
      context.userId,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToMatchingConfiguration(result.rows[0]);
  }

  async getMatchingConfiguration(id: UUID): Promise<MatchingConfiguration | null> {
    const query = 'SELECT * FROM matching_configurations WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToMatchingConfiguration(result.rows[0]) : null;
  }

  async getDefaultConfiguration(
    organizationId: UUID,
    branchId?: UUID
  ): Promise<MatchingConfiguration | null> {
    const query = `
      SELECT * FROM matching_configurations
      WHERE organization_id = $1
        AND (branch_id = $2 OR branch_id IS NULL)
        AND is_default = true
        AND is_active = true
      ORDER BY branch_id DESC NULLS LAST
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [organizationId, branchId ?? null]);
    return result.rows.length > 0 ? this.mapRowToMatchingConfiguration(result.rows[0]) : null;
  }

  private buildUpdateSet(
    input: UpdateMatchingConfigurationInput,
    updates: string[],
    values: unknown[],
    paramCount: { value: number }
  ): void {
    const fieldMappings = [
      { field: 'name', value: input.name },
      { field: 'description', value: input.description },
      { field: 'weights', value: input.weights, transform: JSON.stringify },
      { field: 'max_travel_distance', value: input.maxTravelDistance },
      { field: 'require_exact_skill_match', value: input.requireExactSkillMatch },
      { field: 'auto_assign_threshold', value: input.autoAssignThreshold },
      { field: 'min_score_for_proposal', value: input.minScoreForProposal },
      { field: 'max_proposals_per_shift', value: input.maxProposalsPerShift },
      { field: 'proposal_expiration_minutes', value: input.proposalExpirationMinutes },
      { field: 'optimize_for', value: input.optimizeFor },
      { field: 'is_active', value: input.isActive },
      { field: 'is_default', value: input.isDefault },
      { field: 'notes', value: input.notes },
    ];

    for (const mapping of fieldMappings) {
      if (mapping.value !== undefined && mapping.value !== null) {
        updates.push(`${mapping.field} = $${++paramCount.value}`);
        values.push(mapping.transform ? mapping.transform(mapping.value) : mapping.value);
      }
    }
  }

  async updateMatchingConfiguration(
    id: UUID,
    input: UpdateMatchingConfigurationInput,
    context: UserContext
  ): Promise<MatchingConfiguration> {
    const updates: string[] = [];
    const values: unknown[] = [];
    const paramCount = { value: 0 };

    this.buildUpdateSet(input, updates, values, paramCount);

    if (updates.length === 0) {
      const existing = await this.getMatchingConfiguration(id);
      if (existing === null) {
        throw new NotFoundError('Matching configuration not found', { id });
      }
      return existing;
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`updated_by = $${++paramCount.value}`);
    values.push(context.userId);

    values.push(id);

    const query = `
      UPDATE matching_configurations
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount.value}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Matching configuration not found', { id });
    }

    return this.mapRowToMatchingConfiguration(result.rows[0]);
  }

  /**
   * ==========================================================================
   * ASSIGNMENT PROPOSALS
   * ==========================================================================
   */

  async createProposal(
    input: CreateProposalInput,
    matchScore: number,
    matchQuality: string,
    matchReasons: unknown[],
    context: UserContext
  ): Promise<AssignmentProposal> {
    // Get shift details for branch_id and visit_id
    const shiftQuery = 'SELECT branch_id, visit_id FROM open_shifts WHERE id = $1';
    const shiftResult = await this.pool.query(shiftQuery, [input.openShiftId]);
    
    if (shiftResult.rows.length === 0) {
      throw new NotFoundError('Open shift not found', { id: input.openShiftId });
    }
    
    const { branch_id, visit_id } = shiftResult.rows[0];

    const query = `
      INSERT INTO assignment_proposals (
        organization_id, branch_id, open_shift_id, visit_id, caregiver_id,
        match_score, match_quality, match_reasons,
        proposal_status, proposed_by, proposed_at, proposal_method,
        sent_to_caregiver, notification_method,
        urgency_flag, notes, internal_notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, NOW(), $10,
        $11, $12, $13, $14, $15,
        NOW(), $9, NOW(), $9, 1
      )
      RETURNING *
    `;

    const values = [
      context.organizationId,
      branch_id,
      input.openShiftId,
      visit_id,
      input.caregiverId,
      matchScore,
      matchQuality,
      JSON.stringify(matchReasons),
      context.userId,
      input.proposalMethod,
      input.sendNotification ?? false,
      input.notificationMethod ?? null,
      input.urgencyFlag ?? false,
      input.notes ?? null,
      null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToProposal(result.rows[0]);
  }

  async getProposal(id: UUID): Promise<AssignmentProposal | null> {
    const query = 'SELECT * FROM assignment_proposals WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToProposal(result.rows[0]) : null;
  }

  async updateProposalStatus(
    id: UUID,
    status: ProposalStatus,
    context: UserContext
  ): Promise<AssignmentProposal> {
    const query = `
      UPDATE assignment_proposals
      SET proposal_status = $1,
          updated_at = NOW(),
          updated_by = $2
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, [status, context.userId, id]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Assignment proposal not found', { id });
    }

    return this.mapRowToProposal(result.rows[0]);
  }

  async respondToProposal(
    id: UUID,
    input: RespondToProposalInput,
    context: UserContext
  ): Promise<AssignmentProposal> {
    const now = new Date();
    
    if (input.accept) {
      const query = `
        UPDATE assignment_proposals
        SET proposal_status = 'ACCEPTED',
            accepted_at = $1,
            accepted_by = $2,
            responded_at = $1,
            response_method = $3,
            notes = $4,
            updated_at = $1,
            updated_by = $2
        WHERE id = $5 AND deleted_at IS NULL
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        now,
        context.userId,
        input.responseMethod ?? 'WEB',
        input.notes ?? null,
        id,
      ]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Assignment proposal not found', { id });
      }
      
      return this.mapRowToProposal(result.rows[0]);
    } else {
      const query = `
        UPDATE assignment_proposals
        SET proposal_status = 'REJECTED',
            rejected_at = $1,
            rejected_by = $2,
            rejection_reason = $3,
            rejection_category = $4,
            responded_at = $1,
            response_method = $5,
            notes = $6,
            updated_at = $1,
            updated_by = $2
        WHERE id = $7 AND deleted_at IS NULL
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        now,
        context.userId,
        input.rejectionReason ?? null,
        input.rejectionCategory ?? null,
        input.responseMethod ?? 'WEB',
        input.notes ?? null,
        id,
      ]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Assignment proposal not found', { id });
      }
      
      return this.mapRowToProposal(result.rows[0]);
    }
  }

  async getProposalsByCaregiver(
    caregiverId: UUID,
    statuses?: ProposalStatus[]
  ): Promise<AssignmentProposal[]> {
    let query = `
      SELECT * FROM assignment_proposals
      WHERE caregiver_id = $1 AND deleted_at IS NULL
    `;
    
    const values: unknown[] = [caregiverId];
    
    if (statuses !== undefined && statuses.length > 0) {
      query += ' AND proposal_status = ANY($2)';
      values.push(statuses);
    }
    
    query += ' ORDER BY proposed_at DESC';
    
    const result = await this.pool.query(query, values);
    return result.rows.map((row) => this.mapRowToProposal(row));
  }

  async getProposalsByOpenShift(
    openShiftId: UUID
  ): Promise<AssignmentProposal[]> {
    const query = `
      SELECT * FROM assignment_proposals
      WHERE open_shift_id = $1 AND deleted_at IS NULL
      ORDER BY match_score DESC, proposed_at ASC
    `;
    
    const result = await this.pool.query(query, [openShiftId]);
    return result.rows.map((row) => this.mapRowToProposal(row));
  }

  async searchProposals(
    filters: ProposalFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<AssignmentProposal>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramCount = 0;

    if (filters.organizationId !== undefined) {
      conditions.push(`organization_id = $${++paramCount}`);
      values.push(filters.organizationId);
    }

    if (filters.branchId !== undefined) {
      conditions.push(`branch_id = $${++paramCount}`);
      values.push(filters.branchId);
    }

    if (filters.caregiverId !== undefined) {
      conditions.push(`caregiver_id = $${++paramCount}`);
      values.push(filters.caregiverId);
    }

    if (filters.openShiftId !== undefined) {
      conditions.push(`open_shift_id = $${++paramCount}`);
      values.push(filters.openShiftId);
    }

    if (filters.proposalStatus !== undefined && filters.proposalStatus.length > 0) {
      conditions.push(`proposal_status = ANY($${++paramCount})`);
      values.push(filters.proposalStatus);
    }

    if (filters.matchQuality !== undefined && filters.matchQuality.length > 0) {
      conditions.push(`match_quality = ANY($${++paramCount}`);
      values.push(filters.matchQuality);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    const countQuery = `SELECT COUNT(*) FROM assignment_proposals ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy ?? 'proposed_at';
    const sortOrder = pagination.sortOrder ?? 'desc';

    const dataQuery = `
      SELECT * FROM assignment_proposals
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    values.push(pagination.limit, offset);
    const dataResult = await this.pool.query(dataQuery, values);

    return {
      items: dataResult.rows.map((row) => this.mapRowToProposal(row)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * ==========================================================================
   * CAREGIVER PREFERENCE PROFILES
   * ==========================================================================
   */

  async getCaregiverPreferences(
    caregiverId: UUID
  ): Promise<CaregiverPreferenceProfile | null> {
    const query = 'SELECT * FROM caregiver_preference_profiles WHERE caregiver_id = $1';
    const result = await this.pool.query(query, [caregiverId]);
    return result.rows.length > 0 ? this.mapRowToPreferences(result.rows[0]) : null;
  }

  async upsertCaregiverPreferences(
    caregiverId: UUID,
    organizationId: UUID,
    input: UpdateCaregiverPreferencesInput,
    context: UserContext
  ): Promise<CaregiverPreferenceProfile> {
    const query = `
      INSERT INTO caregiver_preference_profiles (
        caregiver_id, organization_id,
        preferred_days_of_week, preferred_time_ranges, preferred_shift_types,
        preferred_client_ids, preferred_client_types, preferred_service_types,
        max_travel_distance, preferred_zip_codes, avoid_zip_codes,
        max_shifts_per_day, max_shifts_per_week, max_hours_per_week,
        require_minimum_hours_between_shifts,
        willing_to_accept_urgent_shifts, willing_to_work_weekends,
        willing_to_work_holidays, accept_auto_assignment,
        notification_methods, quiet_hours_start, quiet_hours_end,
        last_updated, updated_by, created_at, created_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, NOW(), $23, NOW(), $23, 1
      )
      ON CONFLICT (caregiver_id) DO UPDATE SET
        preferred_days_of_week = COALESCE(EXCLUDED.preferred_days_of_week, caregiver_preference_profiles.preferred_days_of_week),
        preferred_time_ranges = COALESCE(EXCLUDED.preferred_time_ranges, caregiver_preference_profiles.preferred_time_ranges),
        max_travel_distance = COALESCE(EXCLUDED.max_travel_distance, caregiver_preference_profiles.max_travel_distance),
        max_shifts_per_week = COALESCE(EXCLUDED.max_shifts_per_week, caregiver_preference_profiles.max_shifts_per_week),
        max_hours_per_week = COALESCE(EXCLUDED.max_hours_per_week, caregiver_preference_profiles.max_hours_per_week),
        willing_to_accept_urgent_shifts = COALESCE(EXCLUDED.willing_to_accept_urgent_shifts, caregiver_preference_profiles.willing_to_accept_urgent_shifts),
        willing_to_work_weekends = COALESCE(EXCLUDED.willing_to_work_weekends, caregiver_preference_profiles.willing_to_work_weekends),
        willing_to_work_holidays = COALESCE(EXCLUDED.willing_to_work_holidays, caregiver_preference_profiles.willing_to_work_holidays),
        accept_auto_assignment = COALESCE(EXCLUDED.accept_auto_assignment, caregiver_preference_profiles.accept_auto_assignment),
        notification_methods = COALESCE(EXCLUDED.notification_methods, caregiver_preference_profiles.notification_methods),
        quiet_hours_start = COALESCE(EXCLUDED.quiet_hours_start, caregiver_preference_profiles.quiet_hours_start),
        quiet_hours_end = COALESCE(EXCLUDED.quiet_hours_end, caregiver_preference_profiles.quiet_hours_end),
        last_updated = NOW(),
        updated_by = EXCLUDED.updated_by,
        version = caregiver_preference_profiles.version + 1
      RETURNING *
    `;

    const values = [
      caregiverId,
      organizationId,
      input.preferredDaysOfWeek !== undefined ? JSON.stringify(input.preferredDaysOfWeek) : null,
      input.preferredTimeRanges !== undefined ? JSON.stringify(input.preferredTimeRanges) : null,
      null,
      null,
      null,
      null,
      input.maxTravelDistance ?? null,
      null,
      null,
      null,
      input.maxShiftsPerWeek ?? null,
      input.maxHoursPerWeek ?? null,
      null,
      input.willingToAcceptUrgentShifts ?? true,
      input.willingToWorkWeekends ?? true,
      input.willingToWorkHolidays ?? false,
      input.acceptAutoAssignment ?? false,
      input.notificationMethods !== undefined ? JSON.stringify(input.notificationMethods) : JSON.stringify(['PUSH', 'SMS']),
      input.quietHoursStart ?? null,
      input.quietHoursEnd ?? null,
      context.userId,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToPreferences(result.rows[0]);
  }

  /**
   * ==========================================================================
   * BULK MATCH REQUESTS
   * ==========================================================================
   */

  async createBulkMatchRequest(
    input: CreateBulkMatchInput,
    context: UserContext
  ): Promise<BulkMatchRequest> {
    const query = `
      INSERT INTO bulk_match_requests (
        organization_id, branch_id, date_from, date_to, open_shift_ids,
        configuration_id, optimization_goal,
        requested_by, requested_at, status, notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'PENDING', $9,
        NOW(), $8, NOW(), $8, 1
      )
      RETURNING *
    `;

    const values = [
      input.organizationId,
      input.branchId ?? null,
      input.dateFrom,
      input.dateTo,
      input.openShiftIds !== undefined ? JSON.stringify(input.openShiftIds) : null,
      input.configurationId ?? null,
      input.optimizationGoal ?? null,
      context.userId,
      input.notes ?? null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToBulkMatchRequest(result.rows[0]);
  }

  async updateBulkMatchRequest(
    id: UUID,
    updates: Partial<BulkMatchRequest>,
    context: UserContext
  ): Promise<BulkMatchRequest> {
    const query = `
      UPDATE bulk_match_requests
      SET status = COALESCE($1, status),
          started_at = COALESCE($2, started_at),
          completed_at = COALESCE($3, completed_at),
          total_shifts = COALESCE($4, total_shifts),
          matched_shifts = COALESCE($5, matched_shifts),
          unmatched_shifts = COALESCE($6, unmatched_shifts),
          proposals_generated = COALESCE($7, proposals_generated),
          error_message = COALESCE($8, error_message),
          updated_at = NOW(),
          updated_by = $9
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      updates.status ?? null,
      updates.startedAt ?? null,
      updates.completedAt ?? null,
      updates.totalShifts ?? null,
      updates.matchedShifts ?? null,
      updates.unmatchedShifts ?? null,
      updates.proposalsGenerated ?? null,
      updates.errorMessage ?? null,
      context.userId,
      id,
    ];

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Bulk match request not found', { id });
    }

    return this.mapRowToBulkMatchRequest(result.rows[0]);
  }

  /**
   * ==========================================================================
   * MATCH HISTORY
   * ==========================================================================
   */

  async createMatchHistory(
    data: Partial<MatchHistory>,
    context: UserContext
  ): Promise<MatchHistory> {
    const query = `
      INSERT INTO match_history (
        open_shift_id, visit_id, caregiver_id, attempt_number,
        matched_at, matched_by, match_score, match_quality,
        outcome, assignment_proposal_id, configuration_id,
        configuration_snapshot, notes,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12,
        NOW(), $5, NOW(), $5, 1
      )
      RETURNING *
    `;

    const values = [
      data.openShiftId,
      data.visitId,
      data.caregiverId ?? null,
      data.attemptNumber,
      context.userId,
      data.matchScore ?? null,
      data.matchQuality ?? null,
      data.outcome,
      data.assignmentProposalId ?? null,
      data.configurationId ?? null,
      data.configurationSnapshot !== undefined ? JSON.stringify(data.configurationSnapshot) : null,
      data.notes ?? null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToMatchHistory(result.rows[0]);
  }

  /**
   * ==========================================================================
   * HELPER METHODS - Row mapping
   * ==========================================================================
   */

  private mapRowToOpenShift(row: any): OpenShift {
    const base = {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      visitId: row.visit_id,
      clientId: row.client_id,
      scheduledDate: row.scheduled_date,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      timezone: row.timezone,
      serviceTypeId: row.service_type_id,
      serviceTypeName: row.service_type_name,
      taskIds: row.task_ids,
      requiredSkills: row.required_skills,
      requiredCertifications: row.required_certifications,
      preferredCaregivers: row.preferred_caregivers,
      blockedCaregivers: row.blocked_caregivers,
      genderPreference: row.gender_preference,
      languagePreference: row.language_preference,
      address: row.address,
      latitude: row.latitude !== null && row.latitude !== undefined ? parseFloat(row.latitude) : 0,
      longitude: row.longitude !== null && row.longitude !== undefined ? parseFloat(row.longitude) : 0,
      priority: row.priority,
      isUrgent: row.is_urgent,
      fillByDate: row.fill_by_date,
      matchingStatus: row.matching_status,
      lastMatchedAt: row.last_matched_at,
      matchAttempts: row.match_attempts,
      proposedAssignments: row.proposed_assignments,
      rejectedCaregivers: row.rejected_caregivers,
      clientInstructions: row.client_instructions,
      internalNotes: row.internal_notes,
      tags: row.tags,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
    return base;
  }

  private mapRowToMatchingConfiguration(row: any): MatchingConfiguration {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      name: row.name,
      description: row.description,
      weights: row.weights,
      maxTravelDistance: row.max_travel_distance,
      maxTravelTime: row.max_travel_time,
      requireExactSkillMatch: row.require_exact_skill_match,
      requireActiveCertifications: row.require_active_certifications,
      respectGenderPreference: row.respect_gender_preference,
      respectLanguagePreference: row.respect_language_preference,
      autoAssignThreshold: row.auto_assign_threshold,
      minScoreForProposal: row.min_score_for_proposal,
      maxProposalsPerShift: row.max_proposals_per_shift,
      proposalExpirationMinutes: row.proposal_expiration_minutes,
      optimizeFor: row.optimize_for,
      considerCostEfficiency: row.consider_cost_efficiency,
      balanceWorkloadAcrossCaregivers: row.balance_workload_across_caregivers,
      prioritizeContinuityOfCare: row.prioritize_continuity_of_care,
      preferSameCaregiverForRecurring: row.prefer_same_caregiver_for_recurring,
      penalizeFrequentRejections: row.penalize_frequent_rejections,
      boostReliablePerformers: row.boost_reliable_performers,
      isActive: row.is_active,
      isDefault: row.is_default,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }

  private mapRowToProposal(row: any): AssignmentProposal {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      openShiftId: row.open_shift_id,
      visitId: row.visit_id,
      caregiverId: row.caregiver_id,
      matchScore: row.match_score,
      matchQuality: row.match_quality,
      matchReasons: row.match_reasons,
      proposalStatus: row.proposal_status,
      proposedBy: row.proposed_by,
      proposedAt: row.proposed_at,
      proposalMethod: row.proposal_method,
      sentToCaregiver: row.sent_to_caregiver,
      sentAt: row.sent_at,
      notificationMethod: row.notification_method,
      viewedByCaregiver: row.viewed_by_caregiver,
      viewedAt: row.viewed_at,
      respondedAt: row.responded_at,
      responseMethod: row.response_method,
      acceptedAt: row.accepted_at,
      acceptedBy: row.accepted_by,
      rejectedAt: row.rejected_at,
      rejectedBy: row.rejected_by,
      rejectionReason: row.rejection_reason,
      rejectionCategory: row.rejection_category,
      expiredAt: row.expired_at,
      isPreferred: row.is_preferred,
      urgencyFlag: row.urgency_flag,
      notes: row.notes,
      internalNotes: row.internal_notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }

  private mapRowToPreferences(row: any): CaregiverPreferenceProfile {
    return {
      id: row.id,
      caregiverId: row.caregiver_id,
      organizationId: row.organization_id,
      preferredDaysOfWeek: row.preferred_days_of_week,
      preferredTimeRanges: row.preferred_time_ranges,
      preferredShiftTypes: row.preferred_shift_types,
      preferredClientIds: row.preferred_client_ids,
      preferredClientTypes: row.preferred_client_types,
      preferredServiceTypes: row.preferred_service_types,
      maxTravelDistance: row.max_travel_distance,
      preferredZipCodes: row.preferred_zip_codes,
      avoidZipCodes: row.avoid_zip_codes,
      maxShiftsPerDay: row.max_shifts_per_day,
      maxShiftsPerWeek: row.max_shifts_per_week,
      maxHoursPerWeek: row.max_hours_per_week,
      requireMinimumHoursBetweenShifts: row.require_minimum_hours_between_shifts,
      willingToAcceptUrgentShifts: row.willing_to_accept_urgent_shifts,
      willingToWorkWeekends: row.willing_to_work_weekends,
      willingToWorkHolidays: row.willing_to_work_holidays,
      acceptAutoAssignment: row.accept_auto_assignment,
      notificationMethods: row.notification_methods,
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      lastUpdated: row.last_updated,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      createdBy: row.created_by,
      version: row.version,
    };
  }

  private mapRowToBulkMatchRequest(row: any): BulkMatchRequest {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      dateFrom: row.date_from,
      dateTo: row.date_to,
      openShiftIds: row.open_shift_ids,
      configurationId: row.configuration_id,
      optimizationGoal: row.optimization_goal,
      requestedBy: row.requested_by,
      requestedAt: row.requested_at,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      totalShifts: row.total_shifts,
      matchedShifts: row.matched_shifts,
      unmatchedShifts: row.unmatched_shifts,
      proposalsGenerated: row.proposals_generated,
      errorMessage: row.error_message,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }

  private mapRowToMatchHistory(row: any): MatchHistory {
    return {
      id: row.id,
      openShiftId: row.open_shift_id,
      visitId: row.visit_id,
      caregiverId: row.caregiver_id,
      attemptNumber: row.attempt_number,
      matchedAt: row.matched_at,
      matchedBy: row.matched_by,
      matchScore: row.match_score,
      matchQuality: row.match_quality,
      outcome: row.outcome,
      outcomeDeterminedAt: row.outcome_determined_at,
      assignmentProposalId: row.assignment_proposal_id,
      assignedSuccessfully: row.assigned_successfully,
      rejectionReason: row.rejection_reason,
      configurationId: row.configuration_id,
      configurationSnapshot: row.configuration_snapshot,
      responseTimeMinutes: row.response_time_minutes,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }
}
