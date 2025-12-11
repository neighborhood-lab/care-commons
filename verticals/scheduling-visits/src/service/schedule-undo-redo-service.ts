/**
 * Schedule Undo/Redo Service
 *
 * Provides undo/redo functionality for schedule changes including:
 * - Visit creation, updates, deletions
 * - Caregiver assignments
 * - Status changes
 * - Rescheduling
 * - Service pattern changes
 * - Bulk operations
 */

import { Pool, PoolClient } from 'pg';
import { UUID } from '@folkcare/core';
import { format } from 'date-fns';

export type ChangeType =
  | 'VISIT_CREATE'
  | 'VISIT_UPDATE'
  | 'VISIT_DELETE'
  | 'VISIT_ASSIGN'
  | 'VISIT_UNASSIGN'
  | 'VISIT_STATUS_CHANGE'
  | 'VISIT_RESCHEDULE'
  | 'PATTERN_CREATE'
  | 'PATTERN_UPDATE'
  | 'PATTERN_DELETE'
  | 'BULK_CREATE'
  | 'BULK_UPDATE'
  | 'BULK_DELETE';

export type EntityType = 'VISIT' | 'SERVICE_PATTERN';

export interface ScheduleChange {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  userId: UUID;
  changeType: ChangeType;
  entityType: EntityType;
  entityId?: UUID;
  entityIds?: UUID[];
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  changeDetails?: Record<string, unknown>;
  isUndone: boolean;
  undoneBy?: UUID;
  undoneAt?: Date;
  isRedone: boolean;
  redoneBy?: UUID;
  redoneAt?: Date;
  sessionId?: UUID;
  sequenceNumber?: number;
  description?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface RecordChangeInput {
  organizationId: UUID;
  branchId?: UUID;
  userId: UUID;
  changeType: ChangeType;
  entityType: EntityType;
  entityId?: UUID;
  entityIds?: UUID[];
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  changeDetails?: Record<string, unknown>;
  sessionId?: UUID;
  description?: string;
}

export interface UndoResult {
  success: boolean;
  changeId: UUID;
  entityType: EntityType;
  entityId?: UUID;
  entityIds?: UUID[];
  description: string;
  restoredState?: Record<string, unknown>;
}

export interface RedoResult {
  success: boolean;
  changeId: UUID;
  entityType: EntityType;
  entityId?: UUID;
  entityIds?: UUID[];
  description: string;
  appliedState?: Record<string, unknown>;
}

export interface ChangeHistoryOptions {
  limit?: number;
  offset?: number;
  entityType?: EntityType;
  entityId?: UUID;
  includeUndone?: boolean;
  sessionId?: UUID;
  fromDate?: Date;
  toDate?: Date;
}

export interface UndoStack {
  changes: ScheduleChange[];
  totalCount: number;
  canUndo: boolean;
  canRedo: boolean;
  undoableCount: number;
  redoableCount: number;
}

export class ScheduleUndoRedoService {
  constructor(private pool: Pool) {}

  /**
   * Record a schedule change for undo/redo tracking
   */
  async recordChange(input: RecordChangeInput): Promise<ScheduleChange> {
    const client = await this.pool.connect();
    try {
      // Get the next sequence number for this session
      let sequenceNumber: number | undefined;
      if (input.sessionId) {
        const seqResult = await client.query<{ max_seq: number | null }>(
          `SELECT COALESCE(MAX(sequence_number), 0) + 1 as max_seq
           FROM schedule_change_history
           WHERE session_id = $1`,
          [input.sessionId]
        );
        sequenceNumber = seqResult.rows[0]?.max_seq ?? 1;
      }

      const result = await client.query<{
        id: string;
        organization_id: string;
        branch_id: string | null;
        user_id: string;
        change_type: string;
        entity_type: string;
        entity_id: string | null;
        entity_ids: string[] | null;
        before_state: Record<string, unknown> | null;
        after_state: Record<string, unknown> | null;
        change_details: Record<string, unknown> | null;
        is_undone: boolean;
        undone_by: string | null;
        undone_at: Date | null;
        is_redone: boolean;
        redone_by: string | null;
        redone_at: Date | null;
        session_id: string | null;
        sequence_number: number | null;
        description: string | null;
        created_at: Date;
        expires_at: Date | null;
      }>(
        `INSERT INTO schedule_change_history (
          organization_id, branch_id, user_id, change_type, entity_type,
          entity_id, entity_ids, before_state, after_state, change_details,
          session_id, sequence_number, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          input.organizationId,
          input.branchId ?? null,
          input.userId,
          input.changeType,
          input.entityType,
          input.entityId ?? null,
          input.entityIds ?? null,
          input.beforeState ? JSON.stringify(input.beforeState) : null,
          input.afterState ? JSON.stringify(input.afterState) : null,
          input.changeDetails ? JSON.stringify(input.changeDetails) : null,
          input.sessionId ?? null,
          sequenceNumber ?? null,
          input.description ?? this.generateDescription(input),
        ]
      );

      return this.mapToScheduleChange(result.rows[0]!);
    } finally {
      client.release();
    }
  }

  /**
   * Undo the most recent undoable change for a user
   */
  async undo(
    organizationId: UUID,
    userId: UUID,
    changeId?: UUID
  ): Promise<UndoResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Find the change to undo
      let change: ScheduleChange | null;
      if (changeId) {
        change = await this.getChangeById(changeId, client);
      } else {
        change = await this.getMostRecentUndoableChange(organizationId, userId, client);
      }

      if (!change) {
        await client.query('ROLLBACK');
        return {
          success: false,
          changeId: changeId ?? ('' as UUID),
          entityType: 'VISIT',
          description: 'No changes to undo',
        };
      }

      // Perform the undo based on change type
      const restoredState = await this.performUndo(change, client);

      // Mark the change as undone
      await client.query(
        `UPDATE schedule_change_history
         SET is_undone = true, undone_by = $1, undone_at = NOW()
         WHERE id = $2`,
        [userId, change.id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        changeId: change.id,
        entityType: change.entityType,
        entityId: change.entityId,
        entityIds: change.entityIds,
        description: `Undone: ${change.description}`,
        restoredState,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Redo the most recent undone change for a user
   */
  async redo(
    organizationId: UUID,
    userId: UUID,
    changeId?: UUID
  ): Promise<RedoResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Find the change to redo
      let change: ScheduleChange | null;
      if (changeId) {
        change = await this.getChangeById(changeId, client);
        if (change && !change.isUndone) {
          await client.query('ROLLBACK');
          return {
            success: false,
            changeId,
            entityType: 'VISIT',
            description: 'Change has not been undone',
          };
        }
      } else {
        change = await this.getMostRecentRedoableChange(organizationId, userId, client);
      }

      if (!change) {
        await client.query('ROLLBACK');
        return {
          success: false,
          changeId: changeId ?? ('' as UUID),
          entityType: 'VISIT',
          description: 'No changes to redo',
        };
      }

      // Perform the redo based on change type
      const appliedState = await this.performRedo(change, client);

      // Mark the change as redone
      await client.query(
        `UPDATE schedule_change_history
         SET is_undone = false, is_redone = true, redone_by = $1, redone_at = NOW()
         WHERE id = $2`,
        [userId, change.id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        changeId: change.id,
        entityType: change.entityType,
        entityId: change.entityId,
        entityIds: change.entityIds,
        description: `Redone: ${change.description}`,
        appliedState,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get the undo/redo stack for a user
   */
  async getUndoStack(
    organizationId: UUID,
    userId: UUID,
    options: ChangeHistoryOptions = {}
  ): Promise<UndoStack> {
    const { limit = 50, offset = 0 } = options;

    const client = await this.pool.connect();
    try {
      // Get recent changes
      const changesResult = await client.query<{
        id: string;
        organization_id: string;
        branch_id: string | null;
        user_id: string;
        change_type: string;
        entity_type: string;
        entity_id: string | null;
        entity_ids: string[] | null;
        before_state: Record<string, unknown> | null;
        after_state: Record<string, unknown> | null;
        change_details: Record<string, unknown> | null;
        is_undone: boolean;
        undone_by: string | null;
        undone_at: Date | null;
        is_redone: boolean;
        redone_by: string | null;
        redone_at: Date | null;
        session_id: string | null;
        sequence_number: number | null;
        description: string | null;
        created_at: Date;
        expires_at: Date | null;
      }>(
        `SELECT * FROM schedule_change_history
         WHERE organization_id = $1 AND user_id = $2
         ORDER BY created_at DESC, sequence_number DESC
         LIMIT $3 OFFSET $4`,
        [organizationId, userId, limit, offset]
      );

      // Count totals
      const countResult = await client.query<{
        total: string;
        undoable: string;
        redoable: string;
      }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE is_undone = false) as undoable,
           COUNT(*) FILTER (WHERE is_undone = true AND is_redone = false) as redoable
         FROM schedule_change_history
         WHERE organization_id = $1 AND user_id = $2`,
        [organizationId, userId]
      );

      const counts = countResult.rows[0];
      const changes = changesResult.rows.map(row => this.mapToScheduleChange(row));

      return {
        changes,
        totalCount: parseInt(counts?.total ?? '0', 10),
        canUndo: parseInt(counts?.undoable ?? '0', 10) > 0,
        canRedo: parseInt(counts?.redoable ?? '0', 10) > 0,
        undoableCount: parseInt(counts?.undoable ?? '0', 10),
        redoableCount: parseInt(counts?.redoable ?? '0', 10),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get change history for an entity
   */
  async getEntityHistory(
    entityType: EntityType,
    entityId: UUID,
    options: ChangeHistoryOptions = {}
  ): Promise<ScheduleChange[]> {
    const { limit = 50, offset = 0, includeUndone = true } = options;

    type ChangeHistoryRow = {
      id: string;
      organization_id: string;
      branch_id: string | null;
      user_id: string;
      change_type: string;
      entity_type: string;
      entity_id: string | null;
      entity_ids: string[] | null;
      before_state: Record<string, unknown> | null;
      after_state: Record<string, unknown> | null;
      change_details: Record<string, unknown> | null;
      is_undone: boolean;
      undone_by: string | null;
      undone_at: Date | null;
      is_redone: boolean;
      redone_by: string | null;
      redone_at: Date | null;
      session_id: string | null;
      sequence_number: number | null;
      description: string | null;
      created_at: Date;
      expires_at: Date | null;
    };

    // Use separate queries to avoid dynamic SQL construction
    const result = includeUndone
      ? await this.pool.query<ChangeHistoryRow>(
          `SELECT * FROM schedule_change_history
           WHERE entity_type = $1 AND (entity_id = $2 OR $2 = ANY(entity_ids))
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4`,
          [entityType, entityId, limit, offset]
        )
      : await this.pool.query<ChangeHistoryRow>(
          `SELECT * FROM schedule_change_history
           WHERE entity_type = $1 AND (entity_id = $2 OR $2 = ANY(entity_ids))
           AND is_undone = false
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4`,
          [entityType, entityId, limit, offset]
        );

    return result.rows.map(row => this.mapToScheduleChange(row));
  }

  /**
   * Clear old change history (for maintenance)
   */
  async clearOldHistory(organizationId: UUID, olderThanDays: number = 30): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `WITH deleted AS (
         DELETE FROM schedule_change_history
         WHERE organization_id = $1
           AND created_at < NOW() - INTERVAL '1 day' * $2
           AND (expires_at IS NULL OR expires_at < NOW())
         RETURNING id
       )
       SELECT COUNT(*) as count FROM deleted`,
      [organizationId, olderThanDays]
    );

    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  /**
   * Create a new editing session
   */
  async createSession(_organizationId: UUID, _userId: UUID): Promise<UUID> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT gen_random_uuid() as id`
    );
    return result.rows[0]!.id as UUID;
  }

  // Private helper methods

  private async getChangeById(
    changeId: UUID,
    client: PoolClient
  ): Promise<ScheduleChange | null> {
    const result = await client.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      user_id: string;
      change_type: string;
      entity_type: string;
      entity_id: string | null;
      entity_ids: string[] | null;
      before_state: Record<string, unknown> | null;
      after_state: Record<string, unknown> | null;
      change_details: Record<string, unknown> | null;
      is_undone: boolean;
      undone_by: string | null;
      undone_at: Date | null;
      is_redone: boolean;
      redone_by: string | null;
      redone_at: Date | null;
      session_id: string | null;
      sequence_number: number | null;
      description: string | null;
      created_at: Date;
      expires_at: Date | null;
    }>(
      `SELECT * FROM schedule_change_history WHERE id = $1`,
      [changeId]
    );

    if (result.rows.length === 0) return null;
    return this.mapToScheduleChange(result.rows[0]!);
  }

  private async getMostRecentUndoableChange(
    organizationId: UUID,
    userId: UUID,
    client: PoolClient
  ): Promise<ScheduleChange | null> {
    const result = await client.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      user_id: string;
      change_type: string;
      entity_type: string;
      entity_id: string | null;
      entity_ids: string[] | null;
      before_state: Record<string, unknown> | null;
      after_state: Record<string, unknown> | null;
      change_details: Record<string, unknown> | null;
      is_undone: boolean;
      undone_by: string | null;
      undone_at: Date | null;
      is_redone: boolean;
      redone_by: string | null;
      redone_at: Date | null;
      session_id: string | null;
      sequence_number: number | null;
      description: string | null;
      created_at: Date;
      expires_at: Date | null;
    }>(
      `SELECT * FROM schedule_change_history
       WHERE organization_id = $1 AND user_id = $2 AND is_undone = false
       ORDER BY created_at DESC, sequence_number DESC
       LIMIT 1`,
      [organizationId, userId]
    );

    if (result.rows.length === 0) return null;
    return this.mapToScheduleChange(result.rows[0]!);
  }

  private async getMostRecentRedoableChange(
    organizationId: UUID,
    userId: UUID,
    client: PoolClient
  ): Promise<ScheduleChange | null> {
    const result = await client.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      user_id: string;
      change_type: string;
      entity_type: string;
      entity_id: string | null;
      entity_ids: string[] | null;
      before_state: Record<string, unknown> | null;
      after_state: Record<string, unknown> | null;
      change_details: Record<string, unknown> | null;
      is_undone: boolean;
      undone_by: string | null;
      undone_at: Date | null;
      is_redone: boolean;
      redone_by: string | null;
      redone_at: Date | null;
      session_id: string | null;
      sequence_number: number | null;
      description: string | null;
      created_at: Date;
      expires_at: Date | null;
    }>(
      `SELECT * FROM schedule_change_history
       WHERE organization_id = $1 AND user_id = $2 AND is_undone = true AND is_redone = false
       ORDER BY undone_at DESC
       LIMIT 1`,
      [organizationId, userId]
    );

    if (result.rows.length === 0) return null;
    return this.mapToScheduleChange(result.rows[0]!);
  }

  private async performUndo(
    change: ScheduleChange,
    client: PoolClient
  ): Promise<Record<string, unknown> | undefined> {
    if (!change.beforeState) {
      return undefined;
    }

    switch (change.changeType) {
      case 'VISIT_CREATE':
        // Undo create = soft delete
        await client.query(
          `UPDATE visits SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.beforeState;

      case 'VISIT_DELETE':
        // Undo delete = restore
        await client.query(
          `UPDATE visits SET is_deleted = false, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.beforeState;

      case 'VISIT_UPDATE':
      case 'VISIT_RESCHEDULE':
        // Undo update = restore previous state
        await this.restoreVisitState(change.entityId!, change.beforeState, client);
        return change.beforeState;

      case 'VISIT_ASSIGN':
        // Undo assign = unassign
        await client.query(
          `UPDATE visits
           SET assigned_caregiver_id = NULL, status = 'UNASSIGNED', updated_at = NOW()
           WHERE id = $1`,
          [change.entityId]
        );
        return change.beforeState;

      case 'VISIT_UNASSIGN': {
        // Undo unassign = reassign
        const prevCaregiver = change.beforeState.assignedCaregiverId as string | undefined;
        if (prevCaregiver) {
          await client.query(
            `UPDATE visits
             SET assigned_caregiver_id = $1, status = 'ASSIGNED', updated_at = NOW()
             WHERE id = $2`,
            [prevCaregiver, change.entityId]
          );
        }
        return change.beforeState;
      }

      case 'VISIT_STATUS_CHANGE': {
        // Undo status change = restore previous status
        const prevStatus = change.beforeState.status as string | undefined;
        if (prevStatus) {
          await client.query(
            `UPDATE visits SET status = $1, updated_at = NOW() WHERE id = $2`,
            [prevStatus, change.entityId]
          );
        }
        return change.beforeState;
      }

      case 'PATTERN_CREATE':
        await client.query(
          `UPDATE service_patterns SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.beforeState;

      case 'PATTERN_DELETE':
        await client.query(
          `UPDATE service_patterns SET is_deleted = false, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.beforeState;

      case 'PATTERN_UPDATE':
        await this.restorePatternState(change.entityId!, change.beforeState, client);
        return change.beforeState;

      case 'BULK_CREATE':
        // Undo bulk create = soft delete all
        if (change.entityIds && change.entityIds.length > 0) {
          await client.query(
            `UPDATE visits SET is_deleted = true, updated_at = NOW() WHERE id = ANY($1)`,
            [change.entityIds]
          );
        }
        return change.beforeState;

      case 'BULK_DELETE':
        // Undo bulk delete = restore all
        if (change.entityIds && change.entityIds.length > 0) {
          await client.query(
            `UPDATE visits SET is_deleted = false, updated_at = NOW() WHERE id = ANY($1)`,
            [change.entityIds]
          );
        }
        return change.beforeState;

      case 'BULK_UPDATE':
        // Restore each entity's previous state
        if (change.beforeState && Array.isArray(change.beforeState.entities)) {
          for (const entity of change.beforeState.entities as Array<{ id: string; state: Record<string, unknown> }>) {
            await this.restoreVisitState(entity.id as UUID, entity.state, client);
          }
        }
        return change.beforeState;

      default:
        return undefined;
    }
  }

  private async performRedo(
    change: ScheduleChange,
    client: PoolClient
  ): Promise<Record<string, unknown> | undefined> {
    if (!change.afterState) {
      return undefined;
    }

    switch (change.changeType) {
      case 'VISIT_CREATE':
        // Redo create = restore
        await client.query(
          `UPDATE visits SET is_deleted = false, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.afterState;

      case 'VISIT_DELETE':
        // Redo delete = soft delete again
        await client.query(
          `UPDATE visits SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.afterState;

      case 'VISIT_UPDATE':
      case 'VISIT_RESCHEDULE':
        await this.restoreVisitState(change.entityId!, change.afterState, client);
        return change.afterState;

      case 'VISIT_ASSIGN': {
        const caregiverId = change.afterState.assignedCaregiverId as string | undefined;
        if (caregiverId) {
          await client.query(
            `UPDATE visits
             SET assigned_caregiver_id = $1, status = 'ASSIGNED', updated_at = NOW()
             WHERE id = $2`,
            [caregiverId, change.entityId]
          );
        }
        return change.afterState;
      }

      case 'VISIT_UNASSIGN':
        await client.query(
          `UPDATE visits
           SET assigned_caregiver_id = NULL, status = 'UNASSIGNED', updated_at = NOW()
           WHERE id = $1`,
          [change.entityId]
        );
        return change.afterState;

      case 'VISIT_STATUS_CHANGE': {
        const newStatus = change.afterState.status as string | undefined;
        if (newStatus) {
          await client.query(
            `UPDATE visits SET status = $1, updated_at = NOW() WHERE id = $2`,
            [newStatus, change.entityId]
          );
        }
        return change.afterState;
      }

      case 'PATTERN_CREATE':
        await client.query(
          `UPDATE service_patterns SET is_deleted = false, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.afterState;

      case 'PATTERN_DELETE':
        await client.query(
          `UPDATE service_patterns SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
          [change.entityId]
        );
        return change.afterState;

      case 'PATTERN_UPDATE':
        await this.restorePatternState(change.entityId!, change.afterState, client);
        return change.afterState;

      case 'BULK_CREATE':
        if (change.entityIds && change.entityIds.length > 0) {
          await client.query(
            `UPDATE visits SET is_deleted = false, updated_at = NOW() WHERE id = ANY($1)`,
            [change.entityIds]
          );
        }
        return change.afterState;

      case 'BULK_DELETE':
        if (change.entityIds && change.entityIds.length > 0) {
          await client.query(
            `UPDATE visits SET is_deleted = true, updated_at = NOW() WHERE id = ANY($1)`,
            [change.entityIds]
          );
        }
        return change.afterState;

      case 'BULK_UPDATE':
        if (change.afterState && Array.isArray(change.afterState.entities)) {
          for (const entity of change.afterState.entities as Array<{ id: string; state: Record<string, unknown> }>) {
            await this.restoreVisitState(entity.id as UUID, entity.state, client);
          }
        }
        return change.afterState;

      default:
        return undefined;
    }
  }

  private async restoreVisitState(
    visitId: UUID,
    state: Record<string, unknown>,
    client: PoolClient
  ): Promise<void> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      scheduledDate: 'scheduled_date',
      scheduledStartTime: 'scheduled_start_time',
      scheduledEndTime: 'scheduled_end_time',
      assignedCaregiverId: 'assigned_caregiver_id',
      status: 'status',
      visitType: 'visit_type',
      clientInstructions: 'client_instructions',
      caregiverInstructions: 'caregiver_instructions',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in state) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(state[key]);
        paramIndex++;
      }
    }

    if (updates.length > 0) {
      values.push(visitId);
      // Column names come from hardcoded fieldMap above, not user input - safe
      // eslint-disable-next-line sonarjs/sql-queries
      await client.query(
        `UPDATE visits SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        values
      );
    }
  }

  private async restorePatternState(
    patternId: UUID,
    state: Record<string, unknown>,
    client: PoolClient
  ): Promise<void> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      duration: 'duration',
      clientInstructions: 'client_instructions',
      caregiverInstructions: 'caregiver_instructions',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in state) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(state[key]);
        paramIndex++;
      }
    }

    if ('recurrence' in state) {
      updates.push(`recurrence = $${paramIndex}`);
      values.push(JSON.stringify(state.recurrence));
      paramIndex++;
    }

    if (updates.length > 0) {
      values.push(patternId);
      // Column names come from hardcoded fieldMap above, not user input - safe
      // eslint-disable-next-line sonarjs/sql-queries
      await client.query(
        `UPDATE service_patterns SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        values
      );
    }
  }

  private generateDescription(input: RecordChangeInput): string {
    const date = format(new Date(), 'MMM d, h:mm a');

    switch (input.changeType) {
      case 'VISIT_CREATE':
        return `Created visit on ${date}`;
      case 'VISIT_UPDATE':
        return `Updated visit on ${date}`;
      case 'VISIT_DELETE':
        return `Deleted visit on ${date}`;
      case 'VISIT_ASSIGN':
        return `Assigned caregiver on ${date}`;
      case 'VISIT_UNASSIGN':
        return `Unassigned caregiver on ${date}`;
      case 'VISIT_STATUS_CHANGE':
        return `Changed visit status on ${date}`;
      case 'VISIT_RESCHEDULE':
        return `Rescheduled visit on ${date}`;
      case 'PATTERN_CREATE':
        return `Created service pattern on ${date}`;
      case 'PATTERN_UPDATE':
        return `Updated service pattern on ${date}`;
      case 'PATTERN_DELETE':
        return `Deleted service pattern on ${date}`;
      case 'BULK_CREATE':
        return `Created ${input.entityIds?.length ?? 0} visits on ${date}`;
      case 'BULK_UPDATE':
        return `Updated ${input.entityIds?.length ?? 0} visits on ${date}`;
      case 'BULK_DELETE':
        return `Deleted ${input.entityIds?.length ?? 0} visits on ${date}`;
      default:
        return `Schedule change on ${date}`;
    }
  }

  private mapToScheduleChange(row: {
    id: string;
    organization_id: string;
    branch_id: string | null;
    user_id: string;
    change_type: string;
    entity_type: string;
    entity_id: string | null;
    entity_ids: string[] | null;
    before_state: Record<string, unknown> | null;
    after_state: Record<string, unknown> | null;
    change_details: Record<string, unknown> | null;
    is_undone: boolean;
    undone_by: string | null;
    undone_at: Date | null;
    is_redone: boolean;
    redone_by: string | null;
    redone_at: Date | null;
    session_id: string | null;
    sequence_number: number | null;
    description: string | null;
    created_at: Date;
    expires_at: Date | null;
  }): ScheduleChange {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID | undefined,
      userId: row.user_id as UUID,
      changeType: row.change_type as ChangeType,
      entityType: row.entity_type as EntityType,
      entityId: row.entity_id as UUID | undefined,
      entityIds: row.entity_ids as UUID[] | undefined,
      beforeState: row.before_state ?? undefined,
      afterState: row.after_state ?? undefined,
      changeDetails: row.change_details ?? undefined,
      isUndone: row.is_undone,
      undoneBy: row.undone_by as UUID | undefined,
      undoneAt: row.undone_at ?? undefined,
      isRedone: row.is_redone,
      redoneBy: row.redone_by as UUID | undefined,
      redoneAt: row.redone_at ?? undefined,
      sessionId: row.session_id as UUID | undefined,
      sequenceNumber: row.sequence_number ?? undefined,
      description: row.description ?? undefined,
      createdAt: row.created_at,
      expiresAt: row.expires_at ?? undefined,
    };
  }
}
