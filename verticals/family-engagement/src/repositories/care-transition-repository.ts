/**
 * Care Transition Repository
 *
 * Data access layer for transition of care support
 */

import type { Database, UUID } from '@folkcare/core';
import type {
  CareTransition,
  CreateCareTransitionInput,
  UpdateCareTransitionInput,
  CareTransitionFilters,
  TransitionChecklistItem,
  CreateChecklistItemInput,
  TransitionCommunication,
  LogTransitionCommunicationInput,
  TransitionUpdate,
  PostTransitionUpdateInput,
  TransitionSupportResource,
  ChecklistProgressSummary
} from '../types/care-transition.js';

/**
 * Repository for care transitions
 */
export class CareTransitionRepository {
  constructor(private database: Database) {}

  /**
   * Create a new care transition
   */
  async createTransition(input: CreateCareTransitionInput & { createdBy: UUID }): Promise<CareTransition> {
    const result = await this.database.query(
      `INSERT INTO care_transitions (
        client_id, family_member_id, transition_type, status, urgency,
        anticipated_date, from_location, to_location, reason,
        diagnosis_related, family_visible_notes, assigned_coordinator_id,
        primary_physician, organization_id, branch_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
      RETURNING *`,
      [
        input.clientId,
        input.familyMemberId,
        input.transitionType,
        'PENDING',
        input.urgency,
        input.anticipatedDate ?? null,
        JSON.stringify(input.fromLocation),
        JSON.stringify(input.toLocation),
        input.reason,
        input.diagnosisRelated ?? null,
        input.familyVisibleNotes ?? null,
        input.assignedCoordinatorId ?? null,
        input.primaryPhysician ?? null,
        input.organizationId,
        input.branchId,
        input.createdBy
      ]
    );
    return this.mapRowToTransition(result.rows[0]);
  }

  /**
   * Update a care transition
   */
  async updateTransition(id: UUID, input: UpdateCareTransitionInput, userId: UUID): Promise<CareTransition | null> {
    const setClauses: string[] = ['updated_by = $2', 'updated_at = NOW()'];
    const values: unknown[] = [id, userId];
    let paramIndex = 3;

    if (input.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.urgency !== undefined) {
      setClauses.push(`urgency = $${paramIndex++}`);
      values.push(input.urgency);
    }
    if (input.anticipatedDate !== undefined) {
      setClauses.push(`anticipated_date = $${paramIndex++}`);
      values.push(input.anticipatedDate);
    }
    if (input.actualStartDate !== undefined) {
      setClauses.push(`actual_start_date = $${paramIndex++}`);
      values.push(input.actualStartDate);
    }
    if (input.actualEndDate !== undefined) {
      setClauses.push(`actual_end_date = $${paramIndex++}`);
      values.push(input.actualEndDate);
    }
    if (input.fromLocation !== undefined) {
      setClauses.push(`from_location = $${paramIndex++}`);
      values.push(JSON.stringify(input.fromLocation));
    }
    if (input.toLocation !== undefined) {
      setClauses.push(`to_location = $${paramIndex++}`);
      values.push(JSON.stringify(input.toLocation));
    }
    if (input.reason !== undefined) {
      setClauses.push(`reason = $${paramIndex++}`);
      values.push(input.reason);
    }
    if (input.diagnosisRelated !== undefined) {
      setClauses.push(`diagnosis_related = $${paramIndex++}`);
      values.push(input.diagnosisRelated);
    }
    if (input.coordinatorNotes !== undefined) {
      setClauses.push(`coordinator_notes = $${paramIndex++}`);
      values.push(input.coordinatorNotes);
    }
    if (input.familyVisibleNotes !== undefined) {
      setClauses.push(`family_visible_notes = $${paramIndex++}`);
      values.push(input.familyVisibleNotes);
    }
    if (input.assignedCoordinatorId !== undefined) {
      setClauses.push(`assigned_coordinator_id = $${paramIndex++}`);
      values.push(input.assignedCoordinatorId);
    }
    if (input.primaryPhysician !== undefined) {
      setClauses.push(`primary_physician = $${paramIndex++}`);
      values.push(input.primaryPhysician);
    }
    if (input.dischargeManager !== undefined) {
      setClauses.push(`discharge_manager = $${paramIndex++}`);
      values.push(input.dischargeManager);
    }
    if (input.followUpRequired !== undefined) {
      setClauses.push(`follow_up_required = $${paramIndex++}`);
      values.push(input.followUpRequired);
    }
    if (input.followUpDate !== undefined) {
      setClauses.push(`follow_up_date = $${paramIndex++}`);
      values.push(input.followUpDate);
    }
    if (input.followUpNotes !== undefined) {
      setClauses.push(`follow_up_notes = $${paramIndex++}`);
      values.push(input.followUpNotes);
    }

    const result = await this.database.query(
      `UPDATE care_transitions SET ${setClauses.join(', ')} WHERE id = $1 AND is_deleted = false RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToTransition(result.rows[0]);
  }

  /**
   * Start a transition (set status to IN_PROGRESS)
   */
  async startTransition(id: UUID, userId: UUID): Promise<CareTransition | null> {
    const result = await this.database.query(
      `UPDATE care_transitions SET
        status = 'IN_PROGRESS',
        actual_start_date = COALESCE(actual_start_date, CURRENT_DATE),
        updated_by = $2,
        updated_at = NOW()
      WHERE id = $1 AND status = 'PENDING' AND is_deleted = false
      RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToTransition(result.rows[0]);
  }

  /**
   * Complete a transition
   */
  async completeTransition(id: UUID, userId: UUID): Promise<CareTransition | null> {
    const result = await this.database.query(
      `UPDATE care_transitions SET
        status = 'COMPLETED',
        actual_end_date = COALESCE(actual_end_date, CURRENT_DATE),
        updated_by = $2,
        updated_at = NOW()
      WHERE id = $1 AND status = 'IN_PROGRESS' AND is_deleted = false
      RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToTransition(result.rows[0]);
  }

  /**
   * Cancel a transition
   */
  async cancelTransition(id: UUID, userId: UUID): Promise<CareTransition | null> {
    const result = await this.database.query(
      `UPDATE care_transitions SET
        status = 'CANCELLED',
        updated_by = $2,
        updated_at = NOW()
      WHERE id = $1 AND status IN ('PENDING', 'IN_PROGRESS') AND is_deleted = false
      RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToTransition(result.rows[0]);
  }

  /**
   * Find transition by ID
   */
  async findById(id: UUID): Promise<CareTransition | null> {
    const result = await this.database.query(
      `SELECT * FROM care_transitions WHERE id = $1 AND is_deleted = false`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToTransition(result.rows[0]);
  }

  /**
   * Find transitions by client
   */
  async findByClient(clientId: UUID): Promise<CareTransition[]> {
    const result = await this.database.query(
      `SELECT * FROM care_transitions WHERE client_id = $1 AND is_deleted = false ORDER BY created_at DESC`,
      [clientId]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToTransition(row));
  }

  /**
   * Find active transitions for client
   */
  async findActiveByClient(clientId: UUID): Promise<CareTransition[]> {
    const result = await this.database.query(
      `SELECT * FROM care_transitions
       WHERE client_id = $1 AND status IN ('PENDING', 'IN_PROGRESS') AND is_deleted = false
       ORDER BY created_at DESC`,
      [clientId]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToTransition(row));
  }

  /**
   * Find transitions with filters
   */
  async findWithFilters(filters: CareTransitionFilters): Promise<CareTransition[]> {
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
    if (filters.transitionType !== undefined) {
      conditions.push(`transition_type = $${paramIndex++}`);
      values.push(filters.transitionType);
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
    if (filters.urgency !== undefined) {
      conditions.push(`urgency = $${paramIndex++}`);
      values.push(filters.urgency);
    }
    if (filters.assignedCoordinatorId !== undefined) {
      conditions.push(`assigned_coordinator_id = $${paramIndex++}`);
      values.push(filters.assignedCoordinatorId);
    }
    if (filters.fromDate !== undefined) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(filters.fromDate);
    }
    if (filters.toDate !== undefined) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(filters.toDate);
    }
    if (filters.organizationId !== undefined) {
      conditions.push(`organization_id = $${paramIndex++}`);
      values.push(filters.organizationId);
    }
    if (filters.branchId !== undefined) {
      conditions.push(`branch_id = $${paramIndex++}`);
      values.push(filters.branchId);
    }

    const result = await this.database.query(
      `SELECT * FROM care_transitions WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      values
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToTransition(row));
  }

  /**
   * Record an audit revision
   */
  async recordRevision(
    entityId: UUID,
    revisionType: string,
    beforeData: CareTransition | null,
    afterData: CareTransition | null,
    changedFields: string[],
    changedBy: UUID,
    changeReason?: string
  ): Promise<void> {
    await this.database.query(
      `INSERT INTO care_transitions_revisions (
        entity_id, revision_type, before_data, after_data,
        changed_fields, changed_by, change_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entityId,
        revisionType,
        beforeData !== null ? JSON.stringify(beforeData) : null,
        afterData !== null ? JSON.stringify(afterData) : null,
        changedFields,
        changedBy,
        changeReason ?? null
      ]
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToTransition(row: any): CareTransition {
    return {
      id: row.id as UUID,
      clientId: row.client_id as UUID,
      familyMemberId: row.family_member_id as UUID,
      transitionType: row.transition_type,
      status: row.status,
      urgency: row.urgency,
      anticipatedDate: row.anticipated_date ?? undefined,
      actualStartDate: row.actual_start_date ?? undefined,
      actualEndDate: row.actual_end_date ?? undefined,
      fromLocation: typeof row.from_location === 'string' ? JSON.parse(row.from_location) : row.from_location,
      toLocation: typeof row.to_location === 'string' ? JSON.parse(row.to_location) : row.to_location,
      reason: row.reason as string,
      diagnosisRelated: row.diagnosis_related ?? undefined,
      coordinatorNotes: row.coordinator_notes ?? undefined,
      familyVisibleNotes: row.family_visible_notes ?? undefined,
      assignedCoordinatorId: row.assigned_coordinator_id ?? undefined,
      primaryPhysician: row.primary_physician ?? undefined,
      dischargeManager: row.discharge_manager ?? undefined,
      followUpRequired: row.follow_up_required as boolean,
      followUpDate: row.follow_up_date ?? undefined,
      followUpNotes: row.follow_up_notes ?? undefined,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version ?? 1
    };
  }
}

/**
 * Repository for transition checklist items
 */
export class TransitionChecklistRepository {
  constructor(private database: Database) {}

  /**
   * Create a checklist item
   */
  async createItem(input: CreateChecklistItemInput & { createdBy: UUID }): Promise<TransitionChecklistItem> {
    const result = await this.database.query(
      `INSERT INTO transition_checklist_items (
        transition_id, client_id, category, title, description,
        priority, due_date, assigned_to, assigned_user_id,
        sort_order, organization_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING *`,
      [
        input.transitionId,
        input.clientId,
        input.category,
        input.title,
        input.description ?? null,
        input.priority,
        input.dueDate ?? null,
        input.assignedTo ?? null,
        input.assignedUserId ?? null,
        input.sortOrder ?? 0,
        input.organizationId,
        input.createdBy
      ]
    );
    return this.mapRowToChecklistItem(result.rows[0]);
  }

  /**
   * Complete a checklist item
   */
  async completeItem(id: UUID, userId: UUID, notes?: string): Promise<TransitionChecklistItem | null> {
    const result = await this.database.query(
      `UPDATE transition_checklist_items SET
        is_completed = true,
        completed_at = NOW(),
        completed_by = $2,
        completion_notes = $3,
        updated_by = $2,
        updated_at = NOW()
      WHERE id = $1 AND is_deleted = false
      RETURNING *`,
      [id, userId, notes ?? null]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToChecklistItem(result.rows[0]);
  }

  /**
   * Uncomplete a checklist item
   */
  async uncompleteItem(id: UUID, userId: UUID): Promise<TransitionChecklistItem | null> {
    const result = await this.database.query(
      `UPDATE transition_checklist_items SET
        is_completed = false,
        completed_at = NULL,
        completed_by = NULL,
        completion_notes = NULL,
        updated_by = $2,
        updated_at = NOW()
      WHERE id = $1 AND is_deleted = false
      RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToChecklistItem(result.rows[0]);
  }

  /**
   * Find items by transition
   */
  async findByTransition(transitionId: UUID): Promise<TransitionChecklistItem[]> {
    const result = await this.database.query(
      `SELECT * FROM transition_checklist_items
       WHERE transition_id = $1 AND is_deleted = false
       ORDER BY sort_order, created_at`,
      [transitionId]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToChecklistItem(row));
  }

  /**
   * Find incomplete items by transition
   */
  async findIncompleteByTransition(transitionId: UUID): Promise<TransitionChecklistItem[]> {
    const result = await this.database.query(
      `SELECT * FROM transition_checklist_items
       WHERE transition_id = $1 AND is_completed = false AND is_deleted = false
       ORDER BY sort_order, created_at`,
      [transitionId]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToChecklistItem(row));
  }

  /**
   * Get checklist progress summary
   */
  async getProgressSummary(transitionId: UUID): Promise<ChecklistProgressSummary> {
    const result = await this.database.query(
      `SELECT
        category,
        COUNT(*) as total,
        SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN is_overdue AND NOT is_completed THEN 1 ELSE 0 END) as overdue
      FROM transition_checklist_items
      WHERE transition_id = $1 AND is_deleted = false
      GROUP BY category`,
      [transitionId]
    );

    const byCategory: Record<string, { total: number; completed: number }> = {};
    let total = 0;
    let completed = 0;
    let overdue = 0;

    for (const row of result.rows) {
      const catTotal = parseInt(row.total as string, 10);
      const catCompleted = parseInt(row.completed as string, 10);
      const catOverdue = parseInt(row.overdue as string, 10);

      byCategory[row.category as string] = { total: catTotal, completed: catCompleted };
      total += catTotal;
      completed += catCompleted;
      overdue += catOverdue;
    }

    return {
      transitionId,
      total,
      completed,
      overdue,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byCategory: byCategory as any
    };
  }

  /**
   * Update overdue status for items
   */
  async updateOverdueStatus(): Promise<void> {
    await this.database.query(
      `UPDATE transition_checklist_items SET
        is_overdue = (due_date < CURRENT_DATE AND NOT is_completed)
      WHERE is_deleted = false AND due_date IS NOT NULL`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToChecklistItem(row: any): TransitionChecklistItem {
    return {
      id: row.id as UUID,
      transitionId: row.transition_id as UUID,
      clientId: row.client_id as UUID,
      category: row.category,
      title: row.title as string,
      description: row.description ?? undefined,
      priority: row.priority,
      isCompleted: row.is_completed as boolean,
      completedAt: row.completed_at ?? undefined,
      completedBy: row.completed_by ?? undefined,
      completionNotes: row.completion_notes ?? undefined,
      dueDate: row.due_date ?? undefined,
      isOverdue: row.is_overdue as boolean,
      assignedTo: row.assigned_to ?? undefined,
      assignedUserId: row.assigned_user_id ?? undefined,
      sortOrder: row.sort_order as number,
      organizationId: row.organization_id as UUID,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version ?? 1
    };
  }
}

/**
 * Repository for transition communications
 */
export class TransitionCommunicationRepository {
  constructor(private database: Database) {}

  /**
   * Log a communication
   */
  async logCommunication(
    input: LogTransitionCommunicationInput & { staffUserId: UUID; staffName: string; createdBy: UUID }
  ): Promise<TransitionCommunication> {
    const result = await this.database.query(
      `INSERT INTO transition_communications (
        transition_id, client_id, family_member_id,
        communication_type, subject, summary, direction,
        staff_user_id, staff_name, outcome,
        follow_up_required, follow_up_date,
        organization_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      RETURNING *`,
      [
        input.transitionId,
        input.clientId,
        input.familyMemberId,
        input.communicationType,
        input.subject,
        input.summary,
        input.direction,
        input.staffUserId,
        input.staffName,
        input.outcome ?? null,
        input.followUpRequired ?? false,
        input.followUpDate ?? null,
        input.organizationId,
        input.createdBy
      ]
    );
    return this.mapRowToCommunication(result.rows[0]);
  }

  /**
   * Find communications by transition
   */
  async findByTransition(transitionId: UUID): Promise<TransitionCommunication[]> {
    const result = await this.database.query(
      `SELECT * FROM transition_communications
       WHERE transition_id = $1 AND is_deleted = false
       ORDER BY created_at DESC`,
      [transitionId]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToCommunication(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToCommunication(row: any): TransitionCommunication {
    return {
      id: row.id as UUID,
      transitionId: row.transition_id as UUID,
      clientId: row.client_id as UUID,
      familyMemberId: row.family_member_id as UUID,
      communicationType: row.communication_type,
      subject: row.subject as string,
      summary: row.summary as string,
      direction: row.direction,
      staffUserId: row.staff_user_id as UUID,
      staffName: row.staff_name as string,
      outcome: row.outcome ?? undefined,
      followUpRequired: row.follow_up_required as boolean,
      followUpDate: row.follow_up_date ?? undefined,
      organizationId: row.organization_id as UUID,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version ?? 1
    };
  }
}

/**
 * Repository for transition updates
 */
export class TransitionUpdateRepository {
  constructor(private database: Database) {}

  /**
   * Post an update
   */
  async postUpdate(
    input: PostTransitionUpdateInput & { authorUserId: UUID; authorName: string; createdBy: UUID }
  ): Promise<TransitionUpdate> {
    const result = await this.database.query(
      `INSERT INTO transition_updates (
        transition_id, client_id, update_type, title, description,
        is_public, author_user_id, author_name,
        organization_id, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      RETURNING *`,
      [
        input.transitionId,
        input.clientId,
        input.updateType,
        input.title,
        input.description,
        input.isPublic,
        input.authorUserId,
        input.authorName,
        input.organizationId,
        input.createdBy
      ]
    );
    return this.mapRowToUpdate(result.rows[0]);
  }

  /**
   * Find updates by transition
   */
  async findByTransition(transitionId: UUID, publicOnly: boolean = false): Promise<TransitionUpdate[]> {
    const query = publicOnly
      ? `SELECT * FROM transition_updates WHERE transition_id = $1 AND is_public = true AND is_deleted = false ORDER BY created_at DESC`
      : `SELECT * FROM transition_updates WHERE transition_id = $1 AND is_deleted = false ORDER BY created_at DESC`;

    const result = await this.database.query(query, [transitionId]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToUpdate(row));
  }

  /**
   * Find recent public updates for client
   */
  async findRecentPublicByClient(clientId: UUID, limit: number = 10): Promise<TransitionUpdate[]> {
    const result = await this.database.query(
      `SELECT * FROM transition_updates
       WHERE client_id = $1 AND is_public = true AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT $2`,
      [clientId, limit]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToUpdate(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToUpdate(row: any): TransitionUpdate {
    return {
      id: row.id as UUID,
      transitionId: row.transition_id as UUID,
      clientId: row.client_id as UUID,
      updateType: row.update_type,
      title: row.title as string,
      description: row.description as string,
      isPublic: row.is_public as boolean,
      authorUserId: row.author_user_id as UUID,
      authorName: row.author_name as string,
      organizationId: row.organization_id as UUID,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version ?? 1
    };
  }
}

/**
 * Repository for transition support resources
 */
export class TransitionSupportResourceRepository {
  constructor(private database: Database) {}

  /**
   * Find resources by transition type
   */
  async findByTransitionType(
    transitionType: string,
    organizationId?: UUID
  ): Promise<TransitionSupportResource[]> {
    const result = await this.database.query(
      `SELECT * FROM transition_support_resources
       WHERE transition_type = $1
         AND is_active = true
         AND is_deleted = false
         AND (available_for_all_orgs = true OR organization_id = $2)
       ORDER BY sort_order, created_at`,
      [transitionType, organizationId ?? null]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToResource(row));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToResource(row: any): TransitionSupportResource {
    return {
      id: row.id as UUID,
      transitionType: row.transition_type,
      resourceType: row.resource_type,
      title: row.title as string,
      description: row.description ?? undefined,
      content: row.content ?? undefined,
      url: row.url ?? undefined,
      fileUrl: row.file_url ?? undefined,
      contactName: row.contact_name ?? undefined,
      contactPhone: row.contact_phone ?? undefined,
      contactEmail: row.contact_email ?? undefined,
      contactRole: row.contact_role ?? undefined,
      sortOrder: row.sort_order as number,
      isActive: row.is_active as boolean,
      availableForAllOrgs: row.available_for_all_orgs as boolean,
      organizationId: row.organization_id ?? undefined,
      createdBy: row.created_by as UUID,
      updatedBy: row.updated_by as UUID,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version ?? 1
    };
  }
}
