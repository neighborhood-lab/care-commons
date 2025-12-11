/**
 * Clinical Handoff Service
 *
 * Manages structured clinical handoffs between nurses/caregivers.
 * Supports common handoff frameworks like SBAR (Situation, Background,
 * Assessment, Recommendation).
 *
 * Clinical handoffs are critical for:
 * - Continuity of care
 * - Patient safety
 * - Clear communication of critical information
 * - Shift changes
 * - Care transitions
 */

import { UUID } from '@folkcare/core';
import { Pool } from 'pg';
import { format } from 'date-fns';

/**
 * Handoff type/framework
 */
export type HandoffType =
  | 'SBAR' // Situation, Background, Assessment, Recommendation
  | 'I_PASS' // Illness severity, Patient summary, Action list, Situation awareness, Synthesis
  | 'GENERAL'; // Free-form handoff

/**
 * Handoff status
 */
export type HandoffStatus =
  | 'DRAFT'
  | 'PENDING_ACKNOWLEDGMENT'
  | 'ACKNOWLEDGED'
  | 'DECLINED'
  | 'EXPIRED';

/**
 * Urgency level
 */
export type HandoffUrgency = 'ROUTINE' | 'URGENT' | 'CRITICAL';

/**
 * SBAR structured content
 */
export interface SBARContent {
  situation: string; // Current situation, why calling
  background: string; // Clinical history, context
  assessment: string; // Clinical assessment, what you think is happening
  recommendation: string; // What you need/recommend
}

/**
 * I-PASS structured content
 */
export interface IPassContent {
  illnessSeverity: 'STABLE' | 'WATCHER' | 'UNSTABLE';
  patientSummary: string; // Brief summary of patient's condition
  actionList: string[]; // Pending items, to-dos
  situationAwareness: string[]; // What to watch for
  synthesis: string; // Summary by receiver (filled in after acknowledgment)
}

/**
 * Clinical handoff record
 */
export interface ClinicalHandoff {
  id: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  clientName: string;

  // Handoff participants
  fromCaregiverId: UUID;
  fromCaregiverName: string;
  fromCaregiverCredentials?: string;
  toCaregiverId: UUID;
  toCaregiverName: string;
  toCaregiverCredentials?: string;

  // Handoff details
  handoffType: HandoffType;
  urgency: HandoffUrgency;
  handoffReason: string;
  effectiveDate: Date;

  // Structured content
  sbarContent?: SBARContent;
  ipassContent?: IPassContent;
  generalNotes?: string;

  // Key items to highlight
  criticalAlerts: string[];
  pendingTasks: string[];
  medicationChanges?: string[];
  upcomingAppointments?: string[];

  // Status tracking
  status: HandoffStatus;
  createdAt: Date;
  sentAt?: Date;
  acknowledgedAt?: Date;
  acknowledgmentNotes?: string;
  declinedAt?: Date;
  declineReason?: string;

  // Related records
  relatedVisitId?: UUID;
  relatedNoteIds?: UUID[];
}

/**
 * Create handoff input
 */
export interface CreateHandoffInput {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  fromCaregiverId: UUID;
  toCaregiverId: UUID;
  handoffType: HandoffType;
  urgency: HandoffUrgency;
  handoffReason: string;
  effectiveDate: Date;
  sbarContent?: SBARContent;
  ipassContent?: IPassContent;
  generalNotes?: string;
  criticalAlerts?: string[];
  pendingTasks?: string[];
  medicationChanges?: string[];
  upcomingAppointments?: string[];
  relatedVisitId?: UUID;
  relatedNoteIds?: UUID[];
}

/**
 * Handoff acknowledgment input
 */
export interface AcknowledgeHandoffInput {
  handoffId: UUID;
  acknowledgedBy: UUID;
  acknowledgmentNotes?: string;
  synthesis?: string; // For I-PASS
}

/**
 * Handoff decline input
 */
export interface DeclineHandoffInput {
  handoffId: UUID;
  declinedBy: UUID;
  declineReason: string;
}

/**
 * Handoff summary for dashboard
 */
export interface HandoffSummary {
  pending: number;
  acknowledged: number;
  declined: number;
  expired: number;
  criticalPending: number;
}

export class ClinicalHandoffService {
  constructor(private pool: Pool) {}

  /**
   * Create a new clinical handoff
   */
  async createHandoff(input: CreateHandoffInput): Promise<ClinicalHandoff> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get caregiver and client names
      const namesResult = await client.query(
        `SELECT
           fc.first_name || ' ' || fc.last_name as from_name,
           fc.credentials as from_credentials,
           tc.first_name || ' ' || tc.last_name as to_name,
           tc.credentials as to_credentials,
           cl.first_name || ' ' || cl.last_name as client_name
         FROM users fc
         CROSS JOIN users tc
         CROSS JOIN clients cl
         WHERE fc.id = $1 AND tc.id = $2 AND cl.id = $3`,
        [input.fromCaregiverId, input.toCaregiverId, input.clientId]
      );

      const names = namesResult.rows[0] || {
        from_name: 'Unknown',
        to_name: 'Unknown',
        client_name: 'Unknown',
      };

      // Insert handoff record
      const result = await client.query(
        `INSERT INTO clinical_handoffs (
           organization_id, branch_id, client_id,
           from_caregiver_id, to_caregiver_id,
           handoff_type, urgency, handoff_reason, effective_date,
           sbar_content, ipass_content, general_notes,
           critical_alerts, pending_tasks, medication_changes, upcoming_appointments,
           status, related_visit_id, related_note_ids,
           created_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
           'DRAFT', $17, $18, NOW()
         ) RETURNING id, created_at`,
        [
          input.organizationId,
          input.branchId,
          input.clientId,
          input.fromCaregiverId,
          input.toCaregiverId,
          input.handoffType,
          input.urgency,
          input.handoffReason,
          format(input.effectiveDate, 'yyyy-MM-dd'),
          input.sbarContent ? JSON.stringify(input.sbarContent) : null,
          input.ipassContent ? JSON.stringify(input.ipassContent) : null,
          input.generalNotes || null,
          input.criticalAlerts || [],
          input.pendingTasks || [],
          input.medicationChanges || null,
          input.upcomingAppointments || null,
          input.relatedVisitId || null,
          input.relatedNoteIds || null,
        ]
      );

      await client.query('COMMIT');

      return {
        id: result.rows[0].id,
        organizationId: input.organizationId,
        branchId: input.branchId,
        clientId: input.clientId,
        clientName: names.client_name,
        fromCaregiverId: input.fromCaregiverId,
        fromCaregiverName: names.from_name,
        fromCaregiverCredentials: names.from_credentials,
        toCaregiverId: input.toCaregiverId,
        toCaregiverName: names.to_name,
        toCaregiverCredentials: names.to_credentials,
        handoffType: input.handoffType,
        urgency: input.urgency,
        handoffReason: input.handoffReason,
        effectiveDate: input.effectiveDate,
        sbarContent: input.sbarContent,
        ipassContent: input.ipassContent,
        generalNotes: input.generalNotes,
        criticalAlerts: input.criticalAlerts || [],
        pendingTasks: input.pendingTasks || [],
        medicationChanges: input.medicationChanges,
        upcomingAppointments: input.upcomingAppointments,
        status: 'DRAFT',
        createdAt: result.rows[0].created_at,
        relatedVisitId: input.relatedVisitId,
        relatedNoteIds: input.relatedNoteIds,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send a handoff (change status to pending acknowledgment)
   */
  async sendHandoff(handoffId: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE clinical_handoffs
       SET status = 'PENDING_ACKNOWLEDGMENT', sent_at = NOW()
       WHERE id = $1 AND status = 'DRAFT'`,
      [handoffId]
    );
  }

  /**
   * Get a handoff by ID
   */
  async getHandoff(handoffId: UUID): Promise<ClinicalHandoff | null> {
    const result = await this.pool.query(
      `SELECT
         h.*,
         fc.first_name || ' ' || fc.last_name as from_caregiver_name,
         fc.credentials as from_credentials,
         tc.first_name || ' ' || tc.last_name as to_caregiver_name,
         tc.credentials as to_credentials,
         c.first_name || ' ' || c.last_name as client_name
       FROM clinical_handoffs h
       JOIN users fc ON h.from_caregiver_id = fc.id
       JOIN users tc ON h.to_caregiver_id = tc.id
       JOIN clients c ON h.client_id = c.id
       WHERE h.id = $1`,
      [handoffId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToHandoff(result.rows[0]);
  }

  /**
   * Get pending handoffs for a caregiver
   */
  async getPendingHandoffsForCaregiver(caregiverId: UUID): Promise<ClinicalHandoff[]> {
    const result = await this.pool.query(
      `SELECT
         h.*,
         fc.first_name || ' ' || fc.last_name as from_caregiver_name,
         fc.credentials as from_credentials,
         tc.first_name || ' ' || tc.last_name as to_caregiver_name,
         tc.credentials as to_credentials,
         c.first_name || ' ' || c.last_name as client_name
       FROM clinical_handoffs h
       JOIN users fc ON h.from_caregiver_id = fc.id
       JOIN users tc ON h.to_caregiver_id = tc.id
       JOIN clients c ON h.client_id = c.id
       WHERE h.to_caregiver_id = $1
         AND h.status = 'PENDING_ACKNOWLEDGMENT'
       ORDER BY
         CASE h.urgency WHEN 'CRITICAL' THEN 1 WHEN 'URGENT' THEN 2 ELSE 3 END,
         h.sent_at DESC`,
      [caregiverId]
    );

    return result.rows.map((row) => this.mapRowToHandoff(row));
  }

  /**
   * Get handoffs for a client
   */
  async getHandoffsForClient(
    clientId: UUID,
    startDate?: Date,
    endDate?: Date
  ): Promise<ClinicalHandoff[]> {
    let query = `
      SELECT
        h.*,
        fc.first_name || ' ' || fc.last_name as from_caregiver_name,
        fc.credentials as from_credentials,
        tc.first_name || ' ' || tc.last_name as to_caregiver_name,
        tc.credentials as to_credentials,
        c.first_name || ' ' || c.last_name as client_name
      FROM clinical_handoffs h
      JOIN users fc ON h.from_caregiver_id = fc.id
      JOIN users tc ON h.to_caregiver_id = tc.id
      JOIN clients c ON h.client_id = c.id
      WHERE h.client_id = $1
    `;

    const params: (string | Date)[] = [clientId];

    if (startDate) {
      query += ` AND h.effective_date >= $${params.length + 1}`;
      params.push(format(startDate, 'yyyy-MM-dd'));
    }

    if (endDate) {
      query += ` AND h.effective_date <= $${params.length + 1}`;
      params.push(format(endDate, 'yyyy-MM-dd'));
    }

    query += ` ORDER BY h.created_at DESC`;

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapRowToHandoff(row));
  }

  /**
   * Acknowledge a handoff
   */
  async acknowledgeHandoff(input: AcknowledgeHandoffInput): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify the handoff is pending and for the right caregiver
      const handoffResult = await client.query(
        `SELECT to_caregiver_id, ipass_content FROM clinical_handoffs
         WHERE id = $1 AND status = 'PENDING_ACKNOWLEDGMENT'`,
        [input.handoffId]
      );

      if (handoffResult.rows.length === 0) {
        throw new Error('Handoff not found or not pending acknowledgment');
      }

      if (handoffResult.rows[0].to_caregiver_id !== input.acknowledgedBy) {
        throw new Error('Only the receiving caregiver can acknowledge this handoff');
      }

      // Update I-PASS synthesis if provided
      let ipassContent = handoffResult.rows[0].ipass_content;
      if (input.synthesis && ipassContent) {
        ipassContent.synthesis = input.synthesis;
      }

      await client.query(
        `UPDATE clinical_handoffs
         SET status = 'ACKNOWLEDGED',
             acknowledged_at = NOW(),
             acknowledgment_notes = $2,
             ipass_content = $3
         WHERE id = $1`,
        [
          input.handoffId,
          input.acknowledgmentNotes || null,
          ipassContent ? JSON.stringify(ipassContent) : null,
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Decline a handoff
   */
  async declineHandoff(input: DeclineHandoffInput): Promise<void> {
    const result = await this.pool.query(
      `UPDATE clinical_handoffs
       SET status = 'DECLINED',
           declined_at = NOW(),
           decline_reason = $2
       WHERE id = $1 AND status = 'PENDING_ACKNOWLEDGMENT' AND to_caregiver_id = $3`,
      [input.handoffId, input.declineReason, input.declinedBy]
    );

    if (result.rowCount === 0) {
      throw new Error('Handoff not found, not pending, or you are not the recipient');
    }
  }

  /**
   * Get handoff summary for an organization
   */
  async getHandoffSummary(organizationId: UUID): Promise<HandoffSummary> {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING_ACKNOWLEDGMENT') as pending,
         COUNT(*) FILTER (WHERE status = 'ACKNOWLEDGED') as acknowledged,
         COUNT(*) FILTER (WHERE status = 'DECLINED') as declined,
         COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired,
         COUNT(*) FILTER (WHERE status = 'PENDING_ACKNOWLEDGMENT' AND urgency = 'CRITICAL') as critical_pending
       FROM clinical_handoffs
       WHERE organization_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'`,
      [organizationId]
    );

    const row = result.rows[0];
    return {
      pending: parseInt(row.pending, 10),
      acknowledged: parseInt(row.acknowledged, 10),
      declined: parseInt(row.declined, 10),
      expired: parseInt(row.expired, 10),
      criticalPending: parseInt(row.critical_pending, 10),
    };
  }

  /**
   * Create SBAR handoff helper
   */
  async createSBARHandoff(
    baseInput: Omit<CreateHandoffInput, 'handoffType' | 'sbarContent'>,
    sbar: SBARContent
  ): Promise<ClinicalHandoff> {
    return this.createHandoff({
      ...baseInput,
      handoffType: 'SBAR',
      sbarContent: sbar,
    });
  }

  /**
   * Create I-PASS handoff helper
   */
  async createIPassHandoff(
    baseInput: Omit<CreateHandoffInput, 'handoffType' | 'ipassContent'>,
    ipass: Omit<IPassContent, 'synthesis'>
  ): Promise<ClinicalHandoff> {
    return this.createHandoff({
      ...baseInput,
      handoffType: 'I_PASS',
      ipassContent: { ...ipass, synthesis: '' },
    });
  }

  /**
   * Expire old pending handoffs
   */
  async expireOldHandoffs(daysOld: number = 7): Promise<number> {
    const result = await this.pool.query(
      `UPDATE clinical_handoffs
       SET status = 'EXPIRED'
       WHERE status = 'PENDING_ACKNOWLEDGMENT'
         AND sent_at < NOW() - INTERVAL '1 day' * $1`,
      [daysOld]
    );

    return result.rowCount ?? 0;
  }

  // Helper method to map database row to handoff
  private mapRowToHandoff(row: Record<string, unknown>): ClinicalHandoff {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID,
      clientId: row.client_id as UUID,
      clientName: row.client_name as string,
      fromCaregiverId: row.from_caregiver_id as UUID,
      fromCaregiverName: row.from_caregiver_name as string,
      fromCaregiverCredentials: row.from_credentials as string | undefined,
      toCaregiverId: row.to_caregiver_id as UUID,
      toCaregiverName: row.to_caregiver_name as string,
      toCaregiverCredentials: row.to_credentials as string | undefined,
      handoffType: row.handoff_type as HandoffType,
      urgency: row.urgency as HandoffUrgency,
      handoffReason: row.handoff_reason as string,
      effectiveDate: new Date(row.effective_date as string),
      sbarContent: row.sbar_content as SBARContent | undefined,
      ipassContent: row.ipass_content as IPassContent | undefined,
      generalNotes: row.general_notes as string | undefined,
      criticalAlerts: (row.critical_alerts as string[]) || [],
      pendingTasks: (row.pending_tasks as string[]) || [],
      medicationChanges: row.medication_changes as string[] | undefined,
      upcomingAppointments: row.upcoming_appointments as string[] | undefined,
      status: row.status as HandoffStatus,
      createdAt: new Date(row.created_at as string),
      sentAt: row.sent_at ? new Date(row.sent_at as string) : undefined,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at as string) : undefined,
      acknowledgmentNotes: row.acknowledgment_notes as string | undefined,
      declinedAt: row.declined_at ? new Date(row.declined_at as string) : undefined,
      declineReason: row.decline_reason as string | undefined,
      relatedVisitId: row.related_visit_id as UUID | undefined,
      relatedNoteIds: row.related_note_ids as UUID[] | undefined,
    };
  }
}
