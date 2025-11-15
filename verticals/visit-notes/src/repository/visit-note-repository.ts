/**
 * Visit Note Repository
 *
 * Data access layer for visit notes.
 * Handles CRUD operations, signature capture, and immutability enforcement.
 */

import { Pool } from 'pg';
import {
  UUID,
  NotFoundError,
  PaginationParams,
  PaginatedResult,
  UserContext,
  ValidationError,
} from '@care-commons/core';
import type {
  VisitNote,
  CreateVisitNoteInput,
  UpdateVisitNoteInput,
  AddSignatureInput,
  VisitNoteSearchFilters,
  VisitNoteWithTemplate,
} from '../types/index.js';

export class VisitNoteRepository {
  constructor(private pool: Pool) {}

  /**
   * Create a new visit note
   */
  async create(input: CreateVisitNoteInput, context: UserContext): Promise<VisitNote> {
    const query = `
      INSERT INTO visit_notes (
        visit_id, evv_record_id, organization_id, caregiver_id,
        note_type, note_text, note_html, template_id,
        activities_performed, client_mood, client_condition_notes,
        is_incident, incident_severity, incident_description,
        is_voice_note, audio_file_uri, transcription_confidence,
        requires_signature, is_locked, is_synced, sync_pending,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, false, false, true,
        NOW(), $19, NOW(), $19
      )
      RETURNING *
    `;

    const values = [
      input.visitId,
      input.evvRecordId ?? null,
      input.organizationId,
      input.caregiverId,
      input.noteType ?? 'GENERAL',
      input.noteText,
      input.noteHtml ?? null,
      input.templateId ?? null,
      input.activitiesPerformed ? JSON.stringify(input.activitiesPerformed) : '[]',
      input.clientMood ?? null,
      input.clientConditionNotes ?? null,
      input.isIncident ?? false,
      input.incidentSeverity ?? null,
      input.incidentDescription ?? null,
      input.isVoiceNote ?? false,
      input.audioFileUri ?? null,
      input.transcriptionConfidence ?? null,
      input.requiresSignature ?? false,
      context.userId,
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToNote(result.rows[0]);
  }

  /**
   * Get note by ID
   */
  async findById(id: UUID): Promise<VisitNote | null> {
    const query = `
      SELECT * FROM visit_notes
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToNote(result.rows[0]) : null;
  }

  /**
   * Get note with template
   */
  async findByIdWithTemplate(id: UUID): Promise<VisitNoteWithTemplate | null> {
    const query = `
      SELECT
        vn.*,
        to_jsonb(vnt.*) as template
      FROM visit_notes vn
      LEFT JOIN visit_note_templates vnt ON vn.template_id = vnt.id
      WHERE vn.id = $1 AND vn.deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [id]);
    if (!result.rows[0]) return null;

    const note = this.mapRowToNote(result.rows[0]);
    return {
      ...note,
      template: result.rows[0].template,
    };
  }

  /**
   * Update note (only if not locked)
   */
  async update(id: UUID, input: UpdateVisitNoteInput, context: UserContext): Promise<VisitNote> {
    const note = await this.findById(id);
    if (!note) {
      throw new NotFoundError('Visit note not found', { id });
    }

    // Check if note is locked (immutability enforcement)
    if (note.isLocked) {
      throw new ValidationError('Cannot update locked note. Notes are immutable after 24 hours.', {
        noteId: id,
        lockedAt: note.lockedAt,
      });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (input.noteText !== undefined) {
      updates.push(`note_text = $${paramCount++}`);
      values.push(input.noteText);
    }
    if (input.noteHtml !== undefined) {
      updates.push(`note_html = $${paramCount++}`);
      values.push(input.noteHtml);
    }
    if (input.activitiesPerformed !== undefined) {
      updates.push(`activities_performed = $${paramCount++}`);
      values.push(JSON.stringify(input.activitiesPerformed));
    }
    if (input.clientMood !== undefined) {
      updates.push(`client_mood = $${paramCount++}`);
      values.push(input.clientMood);
    }
    if (input.clientConditionNotes !== undefined) {
      updates.push(`client_condition_notes = $${paramCount++}`);
      values.push(input.clientConditionNotes);
    }
    if (input.incidentSeverity !== undefined) {
      updates.push(`incident_severity = $${paramCount++}`);
      values.push(input.incidentSeverity);
    }
    if (input.incidentDescription !== undefined) {
      updates.push(`incident_description = $${paramCount++}`);
      values.push(input.incidentDescription);
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(context.userId);

    values.push(id);
    const query = `
      UPDATE visit_notes
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL AND is_locked = false
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new ValidationError('Cannot update note - it may be locked or deleted', { id });
    }

    return this.mapRowToNote(result.rows[0]);
  }

  /**
   * Add signature to note
   */
  async addSignature(input: AddSignatureInput, context: UserContext): Promise<VisitNote> {
    const note = await this.findById(input.noteId);
    if (!note) {
      throw new NotFoundError('Visit note not found', { noteId: input.noteId });
    }

    let updateClause = '';
    const values: unknown[] = [
      input.signatureData,
      input.signatureUrl ?? null,
      context.userId,
      input.device ?? null,
      input.ipAddress ?? null,
    ];

    if (input.signatureType === 'caregiver') {
      updateClause = `
        caregiver_signed = true,
        caregiver_signature_data = $1,
        caregiver_signature_url = $2,
        caregiver_signed_at = NOW(),
        caregiver_signature_device = $4,
        caregiver_signature_ip = $5,
        updated_at = NOW(),
        updated_by = $3
      `;
    } else if (input.signatureType === 'client') {
      updateClause = `
        client_signed = true,
        client_signature_data = $1,
        client_signature_url = $2,
        client_signed_at = NOW(),
        client_signer_name = $6,
        client_signer_relationship = $7,
        client_signature_device = $4,
        client_signature_ip = $5,
        updated_at = NOW(),
        updated_by = $3
      `;
      values.push(input.signerName ?? null, input.signerRelationship ?? null);
    } else if (input.signatureType === 'supervisor') {
      updateClause = `
        supervisor_signed = true,
        supervisor_signed_by = $3,
        supervisor_signature_data = $1,
        supervisor_signature_url = $2,
        supervisor_signed_at = NOW(),
        supervisor_comments = $6,
        updated_at = NOW(),
        updated_by = $3
      `;
      values.push(input.supervisorComments ?? null);
    }

    values.push(input.noteId);
    const paramCount = values.length;

    const query = `
      UPDATE visit_notes
      SET ${updateClause}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundError('Visit note not found', { noteId: input.noteId });
    }

    return this.mapRowToNote(result.rows[0]);
  }

  /**
   * Mark note as synced
   */
  async markSynced(id: UUID): Promise<void> {
    const query = `
      UPDATE visit_notes
      SET
        is_synced = true,
        sync_pending = false,
        synced_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [id]);
  }

  /**
   * Get notes for a visit
   */
  async findByVisitId(visitId: UUID): Promise<VisitNote[]> {
    const query = `
      SELECT * FROM visit_notes
      WHERE visit_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [visitId]);
    return result.rows.map(row => this.mapRowToNote(row));
  }

  /**
   * Get notes by caregiver
   */
  async findByCaregiverId(caregiverId: UUID, limit = 50): Promise<VisitNote[]> {
    const query = `
      SELECT * FROM visit_notes
      WHERE caregiver_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [caregiverId, limit]);
    return result.rows.map(row => this.mapRowToNote(row));
  }

  /**
   * Get pending sync notes (for mobile offline)
   */
  async findPendingSync(caregiverId?: UUID): Promise<VisitNote[]> {
    let query = `
      SELECT * FROM visit_notes
      WHERE sync_pending = true AND deleted_at IS NULL
    `;
    const values: unknown[] = [];

    if (caregiverId) {
      query += ` AND caregiver_id = $1`;
      values.push(caregiverId);
    }

    query += ` ORDER BY created_at ASC LIMIT 100`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToNote(row));
  }

  /**
   * Search notes
   */
  async search(
    filters: VisitNoteSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<VisitNote>> {
    const { conditions, values, paramCount } = this.buildSearchConditions(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM visit_notes ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy ?? 'created_at';
    const sortOrder = pagination.sortOrder ?? 'desc';

    const dataQuery = `
      SELECT * FROM visit_notes
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(pagination.limit, offset);

    const result = await this.pool.query(dataQuery, values);
    const items = result.rows.map(row => this.mapRowToNote(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Soft delete note (only if not locked)
   */
  async delete(id: UUID, context: UserContext): Promise<void> {
    const note = await this.findById(id);
    if (!note) {
      throw new NotFoundError('Visit note not found', { id });
    }

    if (note.isLocked) {
      throw new ValidationError('Cannot delete locked note', { noteId: id });
    }

    const query = `
      UPDATE visit_notes
      SET
        deleted_at = NOW(),
        deleted_by = $1,
        updated_at = NOW(),
        updated_by = $1
      WHERE id = $2 AND deleted_at IS NULL AND is_locked = false
    `;

    const result = await this.pool.query(query, [context.userId, id]);
    if (result.rowCount === 0) {
      throw new ValidationError('Cannot delete note - it may be locked', { id });
    }
  }

  /**
   * Build search conditions
   */
  private buildSearchConditions(filters: VisitNoteSearchFilters): {
    conditions: string[];
    values: unknown[];
    paramCount: number;
  } {
    const conditions: string[] = ['deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramCount = 1;

    if (filters.visitId) {
      conditions.push(`visit_id = $${paramCount++}`);
      values.push(filters.visitId);
    }

    if (filters.visitIds && filters.visitIds.length > 0) {
      conditions.push(`visit_id = ANY($${paramCount++})`);
      values.push(filters.visitIds);
    }

    if (filters.caregiverId) {
      conditions.push(`caregiver_id = $${paramCount++}`);
      values.push(filters.caregiverId);
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount++}`);
      values.push(filters.organizationId);
    }

    if (filters.noteType && filters.noteType.length > 0) {
      conditions.push(`note_type = ANY($${paramCount++})`);
      values.push(filters.noteType);
    }

    if (filters.isIncident !== undefined) {
      conditions.push(`is_incident = $${paramCount++}`);
      values.push(filters.isIncident);
    }

    if (filters.incidentSeverity && filters.incidentSeverity.length > 0) {
      conditions.push(`incident_severity = ANY($${paramCount++})`);
      values.push(filters.incidentSeverity);
    }

    if (filters.isLocked !== undefined) {
      conditions.push(`is_locked = $${paramCount++}`);
      values.push(filters.isLocked);
    }

    if (filters.dateFrom) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(filters.dateTo);
    }

    if (filters.requiresSignature !== undefined) {
      conditions.push(`requires_signature = $${paramCount++}`);
      values.push(filters.requiresSignature);
    }

    if (filters.caregiverSigned !== undefined) {
      conditions.push(`caregiver_signed = $${paramCount++}`);
      values.push(filters.caregiverSigned);
    }

    if (filters.clientSigned !== undefined) {
      conditions.push(`client_signed = $${paramCount++}`);
      values.push(filters.clientSigned);
    }

    if (filters.syncPending !== undefined) {
      conditions.push(`sync_pending = $${paramCount++}`);
      values.push(filters.syncPending);
    }

    return { conditions, values, paramCount };
  }

  /**
   * Map database row to VisitNote
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToNote(row: any): VisitNote {
    return {
      id: row.id,
      visitId: row.visit_id,
      evvRecordId: row.evv_record_id,
      organizationId: row.organization_id,
      caregiverId: row.caregiver_id,
      noteType: row.note_type,
      noteText: row.note_text,
      noteHtml: row.note_html,
      templateId: row.template_id,
      activitiesPerformed: row.activities_performed ?? [],
      clientMood: row.client_mood,
      clientConditionNotes: row.client_condition_notes,
      isIncident: row.is_incident,
      incidentSeverity: row.incident_severity,
      incidentDescription: row.incident_description,
      incidentReportedAt: row.incident_reported_at,
      isVoiceNote: row.is_voice_note,
      audioFileUri: row.audio_file_uri,
      transcriptionConfidence: row.transcription_confidence,
      isLocked: row.is_locked,
      lockedAt: row.locked_at,
      lockedBy: row.locked_by,
      lockReason: row.lock_reason,
      requiresSignature: row.requires_signature,
      caregiverSigned: row.caregiver_signed,
      caregiverSignatureData: row.caregiver_signature_data,
      caregiverSignatureUrl: row.caregiver_signature_url,
      caregiverSignedAt: row.caregiver_signed_at,
      caregiverSignatureDevice: row.caregiver_signature_device,
      caregiverSignatureIp: row.caregiver_signature_ip,
      clientSigned: row.client_signed,
      clientSignatureData: row.client_signature_data,
      clientSignatureUrl: row.client_signature_url,
      clientSignedAt: row.client_signed_at,
      clientSignerName: row.client_signer_name,
      clientSignerRelationship: row.client_signer_relationship,
      clientSignatureDevice: row.client_signature_device,
      clientSignatureIp: row.client_signature_ip,
      supervisorSigned: row.supervisor_signed,
      supervisorSignedBy: row.supervisor_signed_by,
      supervisorSignatureData: row.supervisor_signature_data,
      supervisorSignatureUrl: row.supervisor_signature_url,
      supervisorSignedAt: row.supervisor_signed_at,
      supervisorComments: row.supervisor_comments,
      isSynced: row.is_synced,
      syncPending: row.sync_pending,
      syncedAt: row.synced_at,
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
