/**
 * Clinical Documentation Repository
 * 
 * Database access layer for clinical visit notes.
 * Handles CRUD operations for licensed clinical staff documentation.
 */

import { Pool, PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { UUID } from '@care-commons/core';
import {
  VisitNote,
  CreateVisitNoteInput,
  UpdateVisitNoteInput,
  SignVisitNoteInput,
  CoSignVisitNoteInput,
  VisitNoteSearchFilters,
} from '../types/clinical.js';

export class ClinicalRepository {
  constructor(private pool: Pool) {}

  /**
   * CREATE VISIT NOTE
   */
  async createVisitNote(
    input: CreateVisitNoteInput,
    createdBy: UUID,
    client?: PoolClient
  ): Promise<VisitNote> {
    const db = client || this.pool;
    const id = uuid();
    const now = new Date();

    const result = await db.query(
      `
      INSERT INTO clinical_visit_notes (
        id, visit_id, organization_id, branch_id, client_id, caregiver_id,
        note_type, service_date, documented_at,
        subjective_notes, objective_notes, assessment, plan, narrative_note,
        interventions_performed, patient_response, safety_incidents, incident_description,
        signed_by, signed_by_name, signed_by_credentials, signed_at,
        status, requires_co_sign, is_encrypted,
        created_at, created_by, updated_at, updated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      )
      RETURNING *
      `,
      [
        id,
        input.visitId,
        input.organizationId,
        input.branchId,
        input.clientId,
        input.caregiverId,
        input.noteType,
        input.serviceDate,
        now, // documented_at
        input.subjectiveNotes || null,
        input.objectiveNotes || null,
        input.assessment || null,
        input.plan || null,
        input.narrativeNote || null,
        JSON.stringify(input.interventionsPerformed || []),
        input.patientResponse || null,
        input.safetyIncidents || false,
        input.incidentDescription || null,
        createdBy, // signed_by (will be populated on signature)
        '', // signed_by_name (will be populated on signature)
        input.signedByCredentials,
        now, // signed_at (will be updated on actual signature)
        'DRAFT', // status
        input.requiresCoSign || false,
        false, // is_encrypted
        now, // created_at
        createdBy,
        now, // updated_at
        createdBy,
        1, // version
      ]
    );

    return this.mapRowToVisitNote(result.rows[0]);
  }

  /**
   * UPDATE VISIT NOTE (draft only)
   */
  async updateVisitNote(
    input: UpdateVisitNoteInput,
    updatedBy: UUID,
    client?: PoolClient
  ): Promise<VisitNote> {
    const db = client || this.pool;
    const now = new Date();

    const result = await db.query(
      `
      UPDATE clinical_visit_notes
      SET
        subjective_notes = COALESCE($2, subjective_notes),
        objective_notes = COALESCE($3, objective_notes),
        assessment = COALESCE($4, assessment),
        plan = COALESCE($5, plan),
        narrative_note = COALESCE($6, narrative_note),
        interventions_performed = COALESCE($7, interventions_performed),
        patient_response = COALESCE($8, patient_response),
        safety_incidents = COALESCE($9, safety_incidents),
        incident_description = COALESCE($10, incident_description),
        updated_at = $11,
        updated_by = $12,
        version = version + 1
      WHERE id = $1
        AND status IN ('DRAFT', 'PENDING_SIGNATURE')
        AND deleted_at IS NULL
      RETURNING *
      `,
      [
        input.id,
        input.subjectiveNotes,
        input.objectiveNotes,
        input.assessment,
        input.plan,
        input.narrativeNote,
        input.interventionsPerformed ? JSON.stringify(input.interventionsPerformed) : null,
        input.patientResponse,
        input.safetyIncidents,
        input.incidentDescription,
        now,
        updatedBy,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Note not found or cannot be updated (already signed/locked)');
    }

    return this.mapRowToVisitNote(result.rows[0]);
  }

  /**
   * SIGN VISIT NOTE
   */
  async signVisitNote(
    input: SignVisitNoteInput,
    client?: PoolClient
  ): Promise<VisitNote> {
    const db = client || this.pool;
    const now = new Date();

    const result = await db.query(
      `
      UPDATE clinical_visit_notes
      SET
        signed_by = $2,
        signed_by_name = $3,
        signed_by_credentials = $4,
        signed_at = $5,
        status = CASE
          WHEN requires_co_sign = true THEN 'PENDING_COSIGN'
          ELSE 'FINALIZED'
        END,
        updated_at = $5,
        updated_by = $2
      WHERE id = $1
        AND status IN ('DRAFT', 'PENDING_SIGNATURE')
        AND deleted_at IS NULL
      RETURNING *
      `,
      [input.noteId, input.signedBy, input.signedByName, input.signedByCredentials, now]
    );

    if (result.rows.length === 0) {
      throw new Error('Note not found or already signed');
    }

    return this.mapRowToVisitNote(result.rows[0]);
  }

  /**
   * CO-SIGN VISIT NOTE
   */
  async coSignVisitNote(
    input: CoSignVisitNoteInput,
    client?: PoolClient
  ): Promise<VisitNote> {
    const db = client || this.pool;
    const now = new Date();

    const result = await db.query(
      `
      UPDATE clinical_visit_notes
      SET
        co_signed_by = $2,
        co_signed_by_name = $3,
        co_signed_at = $4,
        status = 'FINALIZED',
        updated_at = $4,
        updated_by = $2
      WHERE id = $1
        AND status = 'PENDING_COSIGN'
        AND requires_co_sign = true
        AND deleted_at IS NULL
      RETURNING *
      `,
      [input.noteId, input.coSignedBy, input.coSignedByName, now]
    );

    if (result.rows.length === 0) {
      throw new Error('Note not found or does not require co-signature');
    }

    return this.mapRowToVisitNote(result.rows[0]);
  }

  /**
   * GET VISIT NOTE BY ID
   */
  async getVisitNoteById(id: UUID, client?: PoolClient): Promise<VisitNote | null> {
    const db = client || this.pool;

    const result = await db.query(
      `
      SELECT * FROM clinical_visit_notes
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToVisitNote(result.rows[0]);
  }

  /**
   * SEARCH VISIT NOTES
   */
  async searchVisitNotes(
    filters: VisitNoteSearchFilters,
    client?: PoolClient
  ): Promise<VisitNote[]> {
    const db = client || this.pool;
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: (string | boolean | Date)[] = [];
    let paramIndex = 1;

    conditions.push(`organization_id = $${paramIndex++}`);
    params.push(filters.organizationId);

    if (filters.branchId) {
      conditions.push(`branch_id = $${paramIndex++}`);
      params.push(filters.branchId);
    }

    if (filters.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      params.push(filters.clientId);
    }

    if (filters.caregiverId) {
      conditions.push(`caregiver_id = $${paramIndex++}`);
      params.push(filters.caregiverId);
    }

    if (filters.noteType) {
      conditions.push(`note_type = $${paramIndex++}`);
      params.push(filters.noteType);
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.serviceDateFrom) {
      conditions.push(`service_date >= $${paramIndex++}`);
      params.push(filters.serviceDateFrom);
    }

    if (filters.serviceDateTo) {
      conditions.push(`service_date <= $${paramIndex++}`);
      params.push(filters.serviceDateTo);
    }

    if (filters.requiresCoSign !== undefined) {
      conditions.push(`requires_co_sign = $${paramIndex++}`);
      params.push(filters.requiresCoSign);
    }

    if (filters.signedBy) {
      conditions.push(`signed_by = $${paramIndex++}`);
      params.push(filters.signedBy);
    }

    const whereClause = conditions.join(' AND ');

    // False positive: whereClause is built from safe conditions array,
    // not user input. All user values are passed via parameterized params array.
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await db.query(
      `
      SELECT * FROM clinical_visit_notes
      WHERE ${whereClause}
      ORDER BY service_date DESC, created_at DESC
      `,
      params
    );

    return result.rows.map((row) => this.mapRowToVisitNote(row));
  }

  /**
   * GET NOTES PENDING CO-SIGNATURE
   */
  async getNotesPendingCoSign(
    organizationId: UUID,
    client?: PoolClient
  ): Promise<VisitNote[]> {
    const db = client || this.pool;

    const result = await db.query(
      `
      SELECT * FROM clinical_visit_notes
      WHERE organization_id = $1
        AND status = 'PENDING_COSIGN'
        AND requires_co_sign = true
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [organizationId]
    );

    return result.rows.map((row) => this.mapRowToVisitNote(row));
  }

  /**
   * SOFT DELETE VISIT NOTE
   */
  async deleteVisitNote(
    id: UUID,
    deletedBy: UUID,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;
    const now = new Date();

    await db.query(
      `
      UPDATE clinical_visit_notes
      SET deleted_at = $2, deleted_by = $3
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [id, now, deletedBy]
    );
  }

  /**
   * MAP DATABASE ROW TO VISIT NOTE
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Database row type from pg library
  private mapRowToVisitNote(row: any): VisitNote {
    return {
      id: row.id,
      visitId: row.visit_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      clientId: row.client_id,
      caregiverId: row.caregiver_id,
      noteType: row.note_type,
      serviceDate: row.service_date,
      documentedAt: row.documented_at,
      subjectiveNotes: row.subjective_notes,
      objectiveNotes: row.objective_notes,
      assessment: row.assessment,
      plan: row.plan,
      narrativeNote: row.narrative_note,
      interventionsPerformed: row.interventions_performed || [],
      patientResponse: row.patient_response,
      safetyIncidents: row.safety_incidents,
      incidentDescription: row.incident_description,
      signedBy: row.signed_by,
      signedByName: row.signed_by_name,
      signedByCredentials: row.signed_by_credentials,
      signedAt: row.signed_at,
      supervisedBy: row.supervised_by,
      supervisedByName: row.supervised_by_name,
      supervisedByCredentials: row.supervised_by_credentials,
      supervisedAt: row.supervised_at,
      status: row.status,
      requiresCoSign: row.requires_co_sign,
      coSignedBy: row.co_signed_by,
      coSignedByName: row.co_signed_by_name,
      coSignedAt: row.co_signed_at,
      amendmentReason: row.amendment_reason,
      amendedAt: row.amended_at,
      amendedBy: row.amended_by,
      originalNoteId: row.original_note_id,
      isEncrypted: row.is_encrypted,
      encryptedFields: row.encrypted_fields,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
      deletedAt: row.deleted_at || null,
      deletedBy: row.deleted_by || null,
    };
  }
}
