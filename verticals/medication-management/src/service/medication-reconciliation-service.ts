/**
 * Medication Reconciliation Service
 *
 * Provides medication reconciliation during home visits:
 * - Capture patient-reported medications
 * - Compare with documented medication list
 * - Identify and track discrepancies
 * - Document reconciliation process
 * - Track required follow-up actions
 */

import { Pool } from 'pg';
import { UUID } from '@folkcare/core';
import { format } from 'date-fns';

export type InformationSource =
  | 'PATIENT'
  | 'FAMILY_MEMBER'
  | 'CAREGIVER'
  | 'PHARMACY'
  | 'PHYSICIAN_OFFICE'
  | 'HOSPITAL_DISCHARGE'
  | 'OTHER';

export type ReconciliationStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REQUIRES_FOLLOWUP'
  | 'SIGNED';

export type AdherenceAssessment = 'GOOD' | 'FAIR' | 'POOR' | 'UNABLE_TO_ASSESS';

export type ReconciliationItemStatus =
  | 'CONFIRMED'
  | 'NEW'
  | 'DISCONTINUED'
  | 'DOSAGE_CHANGED'
  | 'FREQUENCY_CHANGED'
  | 'NOT_TAKING'
  | 'PRN_TAKING'
  | 'UNKNOWN';

export interface MedicationReconciliation {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  visitId?: UUID;
  performedBy: UUID;
  performedByName: string;
  performedByCredentials?: string;
  performedAt: Date;
  informationSource: InformationSource;
  sourceDetails?: string;
  status: ReconciliationStatus;
  hasDiscrepancies: boolean;
  discrepancyCount: number;
  summaryNotes?: string;
  adherenceAssessment?: AdherenceAssessment;
  adherenceNotes?: string;
  signedBy?: UUID;
  signedByName?: string;
  signedAt?: Date;
  requiresPhysicianNotification: boolean;
  physicianNotified?: boolean;
  physicianNotifiedAt?: Date;
  physicianNotificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ReconciliationItem[];
}

export interface ReconciliationItem {
  id: UUID;
  reconciliationId: UUID;
  medicationId?: UUID;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  instructions?: string;
  prescriber?: string;
  itemStatus: ReconciliationItemStatus;
  documentedDosage?: string;
  documentedFrequency?: string;
  reportedDosage?: string;
  reportedFrequency?: string;
  notes?: string;
  reasonForChange?: string;
  patientUnderstandsPurpose: boolean;
  hasSupply: boolean;
  daysSupplyRemaining?: number;
  requiresAction: boolean;
  actionRequired?: string;
  actionCompleted: boolean;
  actionCompletedAt?: Date;
  createdAt: Date;
}

export interface StartReconciliationInput {
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  visitId?: UUID;
  performedBy: UUID;
  performedByName: string;
  performedByCredentials?: string;
  informationSource: InformationSource;
  sourceDetails?: string;
}

export interface AddReconciliationItemInput {
  reconciliationId: UUID;
  medicationId?: UUID;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  instructions?: string;
  prescriber?: string;
  itemStatus: ReconciliationItemStatus;
  documentedDosage?: string;
  documentedFrequency?: string;
  reportedDosage?: string;
  reportedFrequency?: string;
  notes?: string;
  reasonForChange?: string;
  patientUnderstandsPurpose?: boolean;
  hasSupply?: boolean;
  daysSupplyRemaining?: number;
  requiresAction?: boolean;
  actionRequired?: string;
}

export interface CompleteReconciliationInput {
  reconciliationId: UUID;
  summaryNotes?: string;
  adherenceAssessment?: AdherenceAssessment;
  adherenceNotes?: string;
  requiresPhysicianNotification?: boolean;
}

export interface SignReconciliationInput {
  reconciliationId: UUID;
  signedBy: UUID;
  signedByName: string;
}

export interface ReconciliationSummary {
  totalReconciliations: number;
  reconciliationsWithDiscrepancies: number;
  byAdherence: Record<AdherenceAssessment | 'NONE', number>;
  pendingPhysicianNotifications: number;
  commonDiscrepancyTypes: Array<{ status: ReconciliationItemStatus; count: number }>;
}

export class MedicationReconciliationService {
  constructor(private pool: Pool) {}

  /**
   * Start a new medication reconciliation
   */
  async startReconciliation(
    input: StartReconciliationInput
  ): Promise<MedicationReconciliation> {
    const result = await this.pool.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      client_id: string;
      visit_id: string | null;
      performed_by: string;
      performed_by_name: string;
      performed_by_credentials: string | null;
      performed_at: Date;
      information_source: string;
      source_details: string | null;
      status: string;
      has_discrepancies: boolean;
      discrepancy_count: number;
      summary_notes: string | null;
      adherence_assessment: string | null;
      adherence_notes: string | null;
      signed_by: string | null;
      signed_by_name: string | null;
      signed_at: Date | null;
      requires_physician_notification: boolean;
      physician_notified: boolean | null;
      physician_notified_at: Date | null;
      physician_notification_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO medication_reconciliations (
        organization_id, branch_id, client_id, visit_id,
        performed_by, performed_by_name, performed_by_credentials,
        information_source, source_details, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'IN_PROGRESS')
      RETURNING *`,
      [
        input.organizationId,
        input.branchId ?? null,
        input.clientId,
        input.visitId ?? null,
        input.performedBy,
        input.performedByName,
        input.performedByCredentials ?? null,
        input.informationSource,
        input.sourceDetails ?? null,
      ]
    );

    return this.mapToReconciliation(result.rows[0]!);
  }

  /**
   * Get client's documented medications for reconciliation
   */
  async getClientMedications(
    clientId: UUID,
    organizationId: UUID
  ): Promise<
    Array<{
      id: UUID;
      medicationName: string;
      genericName?: string;
      dosage: string;
      frequency: string;
      route: string;
      instructions?: string;
      prescribedBy: string;
      status: string;
    }>
  > {
    const result = await this.pool.query<{
      id: string;
      medication_name: string;
      generic_name: string | null;
      dosage: string;
      frequency: string;
      route: string;
      instructions: string | null;
      prescribed_by: string;
      status: string;
    }>(
      `SELECT id, medication_name, generic_name, dosage, frequency, route,
              instructions, prescribed_by, status
       FROM medications
       WHERE client_id = $1 AND organization_id = $2 AND status = 'ACTIVE'
       ORDER BY medication_name`,
      [clientId, organizationId]
    );

    return result.rows.map((row) => ({
      id: row.id as UUID,
      medicationName: row.medication_name,
      genericName: row.generic_name ?? undefined,
      dosage: row.dosage,
      frequency: row.frequency,
      route: row.route,
      instructions: row.instructions ?? undefined,
      prescribedBy: row.prescribed_by,
      status: row.status,
    }));
  }

  /**
   * Add an item to the reconciliation
   */
  async addReconciliationItem(
    input: AddReconciliationItemInput
  ): Promise<ReconciliationItem> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const itemResult = await client.query<{
        id: string;
        reconciliation_id: string;
        medication_id: string | null;
        medication_name: string;
        dosage: string | null;
        frequency: string | null;
        route: string | null;
        instructions: string | null;
        prescriber: string | null;
        item_status: string;
        documented_dosage: string | null;
        documented_frequency: string | null;
        reported_dosage: string | null;
        reported_frequency: string | null;
        notes: string | null;
        reason_for_change: string | null;
        patient_understands_purpose: boolean;
        has_supply: boolean;
        days_supply_remaining: number | null;
        requires_action: boolean;
        action_required: string | null;
        action_completed: boolean;
        action_completed_at: Date | null;
        created_at: Date;
      }>(
        `INSERT INTO medication_reconciliation_items (
          reconciliation_id, medication_id, medication_name, dosage, frequency,
          route, instructions, prescriber, item_status, documented_dosage,
          documented_frequency, reported_dosage, reported_frequency, notes,
          reason_for_change, patient_understands_purpose, has_supply,
          days_supply_remaining, requires_action, action_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          input.reconciliationId,
          input.medicationId ?? null,
          input.medicationName,
          input.dosage ?? null,
          input.frequency ?? null,
          input.route ?? null,
          input.instructions ?? null,
          input.prescriber ?? null,
          input.itemStatus,
          input.documentedDosage ?? null,
          input.documentedFrequency ?? null,
          input.reportedDosage ?? null,
          input.reportedFrequency ?? null,
          input.notes ?? null,
          input.reasonForChange ?? null,
          input.patientUnderstandsPurpose ?? true,
          input.hasSupply ?? true,
          input.daysSupplyRemaining ?? null,
          input.requiresAction ?? false,
          input.actionRequired ?? null,
        ]
      );

      // Update discrepancy count on parent
      const isDiscrepancy = !['CONFIRMED', 'PRN_TAKING'].includes(
        input.itemStatus
      );
      if (isDiscrepancy) {
        await client.query(
          `UPDATE medication_reconciliations
           SET has_discrepancies = true,
               discrepancy_count = discrepancy_count + 1,
               updated_at = NOW()
           WHERE id = $1`,
          [input.reconciliationId]
        );
      }

      await client.query('COMMIT');

      return this.mapToItem(itemResult.rows[0]!);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Complete a reconciliation
   */
  async completeReconciliation(
    input: CompleteReconciliationInput
  ): Promise<MedicationReconciliation> {
    const status = input.requiresPhysicianNotification
      ? 'REQUIRES_FOLLOWUP'
      : 'COMPLETED';

    const result = await this.pool.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      client_id: string;
      visit_id: string | null;
      performed_by: string;
      performed_by_name: string;
      performed_by_credentials: string | null;
      performed_at: Date;
      information_source: string;
      source_details: string | null;
      status: string;
      has_discrepancies: boolean;
      discrepancy_count: number;
      summary_notes: string | null;
      adherence_assessment: string | null;
      adherence_notes: string | null;
      signed_by: string | null;
      signed_by_name: string | null;
      signed_at: Date | null;
      requires_physician_notification: boolean;
      physician_notified: boolean | null;
      physician_notified_at: Date | null;
      physician_notification_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE medication_reconciliations
       SET status = $2,
           summary_notes = COALESCE($3, summary_notes),
           adherence_assessment = COALESCE($4, adherence_assessment),
           adherence_notes = COALESCE($5, adherence_notes),
           requires_physician_notification = COALESCE($6, requires_physician_notification),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        input.reconciliationId,
        status,
        input.summaryNotes ?? null,
        input.adherenceAssessment ?? null,
        input.adherenceNotes ?? null,
        input.requiresPhysicianNotification ?? false,
      ]
    );

    return this.mapToReconciliation(result.rows[0]!);
  }

  /**
   * Sign a reconciliation
   */
  async signReconciliation(
    input: SignReconciliationInput
  ): Promise<MedicationReconciliation> {
    const result = await this.pool.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      client_id: string;
      visit_id: string | null;
      performed_by: string;
      performed_by_name: string;
      performed_by_credentials: string | null;
      performed_at: Date;
      information_source: string;
      source_details: string | null;
      status: string;
      has_discrepancies: boolean;
      discrepancy_count: number;
      summary_notes: string | null;
      adherence_assessment: string | null;
      adherence_notes: string | null;
      signed_by: string | null;
      signed_by_name: string | null;
      signed_at: Date | null;
      requires_physician_notification: boolean;
      physician_notified: boolean | null;
      physician_notified_at: Date | null;
      physician_notification_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE medication_reconciliations
       SET status = 'SIGNED',
           signed_by = $2,
           signed_by_name = $3,
           signed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [input.reconciliationId, input.signedBy, input.signedByName]
    );

    return this.mapToReconciliation(result.rows[0]!);
  }

  /**
   * Get a reconciliation by ID
   */
  async getReconciliation(
    reconciliationId: UUID
  ): Promise<MedicationReconciliation | null> {
    const result = await this.pool.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      client_id: string;
      visit_id: string | null;
      performed_by: string;
      performed_by_name: string;
      performed_by_credentials: string | null;
      performed_at: Date;
      information_source: string;
      source_details: string | null;
      status: string;
      has_discrepancies: boolean;
      discrepancy_count: number;
      summary_notes: string | null;
      adherence_assessment: string | null;
      adherence_notes: string | null;
      signed_by: string | null;
      signed_by_name: string | null;
      signed_at: Date | null;
      requires_physician_notification: boolean;
      physician_notified: boolean | null;
      physician_notified_at: Date | null;
      physician_notification_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(`SELECT * FROM medication_reconciliations WHERE id = $1`, [
      reconciliationId,
    ]);

    if (result.rows.length === 0) return null;

    const reconciliation = this.mapToReconciliation(result.rows[0]!);

    // Load items
    const itemsResult = await this.pool.query<{
      id: string;
      reconciliation_id: string;
      medication_id: string | null;
      medication_name: string;
      dosage: string | null;
      frequency: string | null;
      route: string | null;
      instructions: string | null;
      prescriber: string | null;
      item_status: string;
      documented_dosage: string | null;
      documented_frequency: string | null;
      reported_dosage: string | null;
      reported_frequency: string | null;
      notes: string | null;
      reason_for_change: string | null;
      patient_understands_purpose: boolean;
      has_supply: boolean;
      days_supply_remaining: number | null;
      requires_action: boolean;
      action_required: string | null;
      action_completed: boolean;
      action_completed_at: Date | null;
      created_at: Date;
    }>(
      `SELECT * FROM medication_reconciliation_items
       WHERE reconciliation_id = $1
       ORDER BY medication_name`,
      [reconciliationId]
    );

    reconciliation.items = itemsResult.rows.map((row) => this.mapToItem(row));

    return reconciliation;
  }

  /**
   * Get reconciliation history for a client
   */
  async getClientReconciliationHistory(
    clientId: UUID,
    options: { limit?: number; offset?: number } = {}
  ): Promise<MedicationReconciliation[]> {
    const { limit = 20, offset = 0 } = options;

    const result = await this.pool.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      client_id: string;
      visit_id: string | null;
      performed_by: string;
      performed_by_name: string;
      performed_by_credentials: string | null;
      performed_at: Date;
      information_source: string;
      source_details: string | null;
      status: string;
      has_discrepancies: boolean;
      discrepancy_count: number;
      summary_notes: string | null;
      adherence_assessment: string | null;
      adherence_notes: string | null;
      signed_by: string | null;
      signed_by_name: string | null;
      signed_at: Date | null;
      requires_physician_notification: boolean;
      physician_notified: boolean | null;
      physician_notified_at: Date | null;
      physician_notification_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM medication_reconciliations
       WHERE client_id = $1
       ORDER BY performed_at DESC
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset]
    );

    return result.rows.map((row) => this.mapToReconciliation(row));
  }

  /**
   * Get reconciliations requiring physician notification
   */
  async getPendingPhysicianNotifications(
    organizationId: UUID
  ): Promise<MedicationReconciliation[]> {
    const result = await this.pool.query<{
      id: string;
      organization_id: string;
      branch_id: string | null;
      client_id: string;
      visit_id: string | null;
      performed_by: string;
      performed_by_name: string;
      performed_by_credentials: string | null;
      performed_at: Date;
      information_source: string;
      source_details: string | null;
      status: string;
      has_discrepancies: boolean;
      discrepancy_count: number;
      summary_notes: string | null;
      adherence_assessment: string | null;
      adherence_notes: string | null;
      signed_by: string | null;
      signed_by_name: string | null;
      signed_at: Date | null;
      requires_physician_notification: boolean;
      physician_notified: boolean | null;
      physician_notified_at: Date | null;
      physician_notification_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM medication_reconciliations
       WHERE organization_id = $1
         AND requires_physician_notification = true
         AND (physician_notified IS NULL OR physician_notified = false)
       ORDER BY performed_at ASC`,
      [organizationId]
    );

    return result.rows.map((row) => this.mapToReconciliation(row));
  }

  /**
   * Mark physician as notified
   */
  async markPhysicianNotified(
    reconciliationId: UUID,
    notes?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE medication_reconciliations
       SET physician_notified = true,
           physician_notified_at = NOW(),
           physician_notification_notes = COALESCE($2, physician_notification_notes),
           updated_at = NOW()
       WHERE id = $1`,
      [reconciliationId, notes ?? null]
    );
  }

  /**
   * Mark action completed on an item
   */
  async markActionCompleted(itemId: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE medication_reconciliation_items
       SET action_completed = true, action_completed_at = NOW()
       WHERE id = $1`,
      [itemId]
    );
  }

  /**
   * Get reconciliation summary for organization
   */
  async getReconciliationSummary(
    organizationId: UUID,
    startDate?: Date,
    endDate?: Date
  ): Promise<ReconciliationSummary> {
    const hasDateFilter = startDate !== undefined && endDate !== undefined;

    // Use separate queries to avoid dynamic SQL construction
    let totalResult: { rows: Array<{ count: string }> };
    let discrepancyResult: { rows: Array<{ count: string }> };
    let adherenceResult: {
      rows: Array<{ adherence_assessment: string | null; count: string }>;
    };
    let pendingResult: { rows: Array<{ count: string }> };
    let discrepancyTypesResult: {
      rows: Array<{ item_status: string; count: string }>;
    };

    if (hasDateFilter) {
      const params = [organizationId, startDate, endDate];

      totalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM medication_reconciliations
         WHERE organization_id = $1 AND performed_at >= $2 AND performed_at <= $3`,
        params
      );

      discrepancyResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM medication_reconciliations
         WHERE organization_id = $1 AND has_discrepancies = true
           AND performed_at >= $2 AND performed_at <= $3`,
        params
      );

      adherenceResult = await this.pool.query<{
        adherence_assessment: string | null;
        count: string;
      }>(
        `SELECT adherence_assessment, COUNT(*) as count
         FROM medication_reconciliations
         WHERE organization_id = $1 AND performed_at >= $2 AND performed_at <= $3
         GROUP BY adherence_assessment`,
        params
      );

      pendingResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM medication_reconciliations
         WHERE organization_id = $1
           AND requires_physician_notification = true
           AND (physician_notified IS NULL OR physician_notified = false)
           AND performed_at >= $2 AND performed_at <= $3`,
        params
      );

      discrepancyTypesResult = await this.pool.query<{
        item_status: string;
        count: string;
      }>(
        `SELECT mri.item_status, COUNT(*) as count
         FROM medication_reconciliation_items mri
         JOIN medication_reconciliations mr ON mri.reconciliation_id = mr.id
         WHERE mr.organization_id = $1
           AND mri.item_status NOT IN ('CONFIRMED', 'PRN_TAKING')
           AND mr.performed_at >= $2 AND mr.performed_at <= $3
         GROUP BY mri.item_status
         ORDER BY count DESC
         LIMIT 5`,
        params
      );
    } else {
      const params = [organizationId];

      totalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM medication_reconciliations
         WHERE organization_id = $1`,
        params
      );

      discrepancyResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM medication_reconciliations
         WHERE organization_id = $1 AND has_discrepancies = true`,
        params
      );

      adherenceResult = await this.pool.query<{
        adherence_assessment: string | null;
        count: string;
      }>(
        `SELECT adherence_assessment, COUNT(*) as count
         FROM medication_reconciliations
         WHERE organization_id = $1
         GROUP BY adherence_assessment`,
        params
      );

      pendingResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM medication_reconciliations
         WHERE organization_id = $1
           AND requires_physician_notification = true
           AND (physician_notified IS NULL OR physician_notified = false)`,
        params
      );

      discrepancyTypesResult = await this.pool.query<{
        item_status: string;
        count: string;
      }>(
        `SELECT mri.item_status, COUNT(*) as count
         FROM medication_reconciliation_items mri
         JOIN medication_reconciliations mr ON mri.reconciliation_id = mr.id
         WHERE mr.organization_id = $1
           AND mri.item_status NOT IN ('CONFIRMED', 'PRN_TAKING')
         GROUP BY mri.item_status
         ORDER BY count DESC
         LIMIT 5`,
        params
      );
    }

    const byAdherence: Record<AdherenceAssessment | 'NONE', number> = {
      GOOD: 0,
      FAIR: 0,
      POOR: 0,
      UNABLE_TO_ASSESS: 0,
      NONE: 0,
    };

    for (const row of adherenceResult.rows) {
      const key = (row.adherence_assessment ?? 'NONE') as
        | AdherenceAssessment
        | 'NONE';
      byAdherence[key] = parseInt(row.count, 10);
    }

    return {
      totalReconciliations: parseInt(totalResult.rows[0]?.count ?? '0', 10),
      reconciliationsWithDiscrepancies: parseInt(
        discrepancyResult.rows[0]?.count ?? '0',
        10
      ),
      byAdherence,
      pendingPhysicianNotifications: parseInt(
        pendingResult.rows[0]?.count ?? '0',
        10
      ),
      commonDiscrepancyTypes: discrepancyTypesResult.rows.map((row) => ({
        status: row.item_status as ReconciliationItemStatus,
        count: parseInt(row.count, 10),
      })),
    };
  }

  /**
   * Generate printable reconciliation report
   */
  generateReconciliationReport(
    reconciliation: MedicationReconciliation
  ): string {
    const lines: string[] = [];
    const performedDate = format(
      reconciliation.performedAt,
      'MMMM d, yyyy h:mm a'
    );

    lines.push('MEDICATION RECONCILIATION REPORT');
    lines.push('================================');
    lines.push('');
    lines.push(`Date: ${performedDate}`);
    const credentialsSuffix = reconciliation.performedByCredentials
      ? `, ${reconciliation.performedByCredentials}`
      : '';
    lines.push(`Performed by: ${reconciliation.performedByName}${credentialsSuffix}`);
    lines.push(`Information Source: ${reconciliation.informationSource}`);
    if (reconciliation.sourceDetails) {
      lines.push(`Source Details: ${reconciliation.sourceDetails}`);
    }
    lines.push('');
    lines.push(`Status: ${reconciliation.status}`);
    lines.push(
      `Discrepancies Found: ${reconciliation.hasDiscrepancies ? 'Yes' : 'No'}`
    );
    if (reconciliation.hasDiscrepancies) {
      lines.push(`Discrepancy Count: ${reconciliation.discrepancyCount}`);
    }
    lines.push('');

    if (reconciliation.adherenceAssessment) {
      lines.push(`Adherence Assessment: ${reconciliation.adherenceAssessment}`);
      if (reconciliation.adherenceNotes) {
        lines.push(`Adherence Notes: ${reconciliation.adherenceNotes}`);
      }
      lines.push('');
    }

    if (reconciliation.items && reconciliation.items.length > 0) {
      lines.push('MEDICATIONS REVIEWED');
      lines.push('-------------------');

      for (const item of reconciliation.items) {
        lines.push('');
        lines.push(`${item.medicationName} - ${item.itemStatus}`);
        if (item.dosage) lines.push(`  Dosage: ${item.dosage}`);
        if (item.frequency) lines.push(`  Frequency: ${item.frequency}`);
        if (item.documentedDosage && item.reportedDosage) {
          lines.push(
            `  Documented vs Reported: ${item.documentedDosage} vs ${item.reportedDosage}`
          );
        }
        if (item.notes) lines.push(`  Notes: ${item.notes}`);
        if (item.requiresAction) {
          lines.push(`  ACTION REQUIRED: ${item.actionRequired}`);
        }
      }
      lines.push('');
    }

    if (reconciliation.summaryNotes) {
      lines.push('SUMMARY');
      lines.push('-------');
      lines.push(reconciliation.summaryNotes);
      lines.push('');
    }

    if (reconciliation.signedBy) {
      const signedDate = reconciliation.signedAt
        ? format(reconciliation.signedAt, 'MMMM d, yyyy h:mm a')
        : 'N/A';
      lines.push(`Signed by: ${reconciliation.signedByName}`);
      lines.push(`Signed at: ${signedDate}`);
    }

    return lines.join('\n');
  }

  // Private helper methods

  private mapToReconciliation(row: {
    id: string;
    organization_id: string;
    branch_id: string | null;
    client_id: string;
    visit_id: string | null;
    performed_by: string;
    performed_by_name: string;
    performed_by_credentials: string | null;
    performed_at: Date;
    information_source: string;
    source_details: string | null;
    status: string;
    has_discrepancies: boolean;
    discrepancy_count: number;
    summary_notes: string | null;
    adherence_assessment: string | null;
    adherence_notes: string | null;
    signed_by: string | null;
    signed_by_name: string | null;
    signed_at: Date | null;
    requires_physician_notification: boolean;
    physician_notified: boolean | null;
    physician_notified_at: Date | null;
    physician_notification_notes: string | null;
    created_at: Date;
    updated_at: Date;
  }): MedicationReconciliation {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID | undefined,
      clientId: row.client_id as UUID,
      visitId: row.visit_id as UUID | undefined,
      performedBy: row.performed_by as UUID,
      performedByName: row.performed_by_name,
      performedByCredentials: row.performed_by_credentials ?? undefined,
      performedAt: row.performed_at,
      informationSource: row.information_source as InformationSource,
      sourceDetails: row.source_details ?? undefined,
      status: row.status as ReconciliationStatus,
      hasDiscrepancies: row.has_discrepancies,
      discrepancyCount: row.discrepancy_count,
      summaryNotes: row.summary_notes ?? undefined,
      adherenceAssessment:
        (row.adherence_assessment as AdherenceAssessment) ?? undefined,
      adherenceNotes: row.adherence_notes ?? undefined,
      signedBy: row.signed_by as UUID | undefined,
      signedByName: row.signed_by_name ?? undefined,
      signedAt: row.signed_at ?? undefined,
      requiresPhysicianNotification: row.requires_physician_notification,
      physicianNotified: row.physician_notified ?? undefined,
      physicianNotifiedAt: row.physician_notified_at ?? undefined,
      physicianNotificationNotes: row.physician_notification_notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToItem(row: {
    id: string;
    reconciliation_id: string;
    medication_id: string | null;
    medication_name: string;
    dosage: string | null;
    frequency: string | null;
    route: string | null;
    instructions: string | null;
    prescriber: string | null;
    item_status: string;
    documented_dosage: string | null;
    documented_frequency: string | null;
    reported_dosage: string | null;
    reported_frequency: string | null;
    notes: string | null;
    reason_for_change: string | null;
    patient_understands_purpose: boolean;
    has_supply: boolean;
    days_supply_remaining: number | null;
    requires_action: boolean;
    action_required: string | null;
    action_completed: boolean;
    action_completed_at: Date | null;
    created_at: Date;
  }): ReconciliationItem {
    return {
      id: row.id as UUID,
      reconciliationId: row.reconciliation_id as UUID,
      medicationId: row.medication_id as UUID | undefined,
      medicationName: row.medication_name,
      dosage: row.dosage ?? undefined,
      frequency: row.frequency ?? undefined,
      route: row.route ?? undefined,
      instructions: row.instructions ?? undefined,
      prescriber: row.prescriber ?? undefined,
      itemStatus: row.item_status as ReconciliationItemStatus,
      documentedDosage: row.documented_dosage ?? undefined,
      documentedFrequency: row.documented_frequency ?? undefined,
      reportedDosage: row.reported_dosage ?? undefined,
      reportedFrequency: row.reported_frequency ?? undefined,
      notes: row.notes ?? undefined,
      reasonForChange: row.reason_for_change ?? undefined,
      patientUnderstandsPurpose: row.patient_understands_purpose,
      hasSupply: row.has_supply,
      daysSupplyRemaining: row.days_supply_remaining ?? undefined,
      requiresAction: row.requires_action,
      actionRequired: row.action_required ?? undefined,
      actionCompleted: row.action_completed,
      actionCompletedAt: row.action_completed_at ?? undefined,
      createdAt: row.created_at,
    };
  }
}
