/**
 * Lab Result Service
 *
 * Manages lab results for clients, supporting trend analysis
 * and clinical decision making during home health visits.
 */

import { Pool } from 'pg';
import { UUID } from '@folkcare/core';
import { format } from 'date-fns';

// Enums
export type LabInterpretation =
  | 'NORMAL'
  | 'LOW'
  | 'HIGH'
  | 'CRITICAL_LOW'
  | 'CRITICAL_HIGH'
  | 'ABNORMAL'
  | 'UNKNOWN';

export type LabSource =
  | 'HOSPITAL'
  | 'LAB'
  | 'PHYSICIAN_OFFICE'
  | 'HOME_TEST'
  | 'OTHER';

// Types
export interface LabResultType {
  id: UUID;
  organizationId: UUID;
  code: string;
  name: string;
  shortName?: string;
  category: string;
  unit?: string;
  normalMin?: number;
  normalMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabResult {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  labTypeId?: UUID;
  labName: string;
  labCode?: string;
  numericValue?: number;
  textValue?: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  interpretation: LabInterpretation;
  interpretationNotes?: string;
  collectionDate: Date;
  resultDate?: Date;
  source: LabSource;
  sourceName?: string;
  orderingPhysician?: string;
  specimenType?: string;
  enteredBy: UUID;
  enteredByName: string;
  enteredAt: Date;
  visitId?: UUID;
  isVerified: boolean;
  verifiedBy?: UUID;
  verifiedByName?: string;
  verifiedAt?: Date;
  requiresNotification: boolean;
  physicianNotified: boolean;
  physicianNotifiedAt?: Date;
  notificationNotes?: string;
  clinicalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface CreateLabResultTypeInput {
  organizationId: UUID;
  code: string;
  name: string;
  shortName?: string;
  category: string;
  unit?: string;
  normalMin?: number;
  normalMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  displayOrder?: number;
}

export interface CreateLabResultInput {
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  labTypeId?: UUID;
  labName: string;
  labCode?: string;
  numericValue?: number;
  textValue?: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  interpretationNotes?: string;
  collectionDate: string;
  resultDate?: string;
  source: LabSource;
  sourceName?: string;
  orderingPhysician?: string;
  specimenType?: string;
  enteredBy: UUID;
  enteredByName: string;
  visitId?: UUID;
  clinicalNotes?: string;
}

export interface UpdateLabResultInput {
  id: UUID;
  numericValue?: number;
  textValue?: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  interpretationNotes?: string;
  collectionDate?: string;
  resultDate?: string;
  source?: LabSource;
  sourceName?: string;
  orderingPhysician?: string;
  specimenType?: string;
  clinicalNotes?: string;
}

export interface LabResultTrend {
  labName: string;
  labCode?: string;
  unit?: string;
  results: Array<{
    id: UUID;
    value: number;
    interpretation: LabInterpretation;
    collectionDate: Date;
    referenceLow?: number;
    referenceHigh?: number;
  }>;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'INSUFFICIENT_DATA';
  latestValue?: number;
  latestInterpretation?: LabInterpretation;
}

export interface LabResultSummary {
  totalResults: number;
  resultsThisMonth: number;
  criticalResults: number;
  abnormalResults: number;
  pendingVerification: number;
  pendingNotification: number;
  resultsByCategory: Record<string, number>;
}

interface LabResultTypeRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  short_name: string | null;
  category: string;
  unit: string | null;
  normal_min: string | null;
  normal_max: string | null;
  critical_low: string | null;
  critical_high: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface LabResultRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  client_id: string;
  lab_type_id: string | null;
  lab_name: string;
  lab_code: string | null;
  numeric_value: string | null;
  text_value: string | null;
  unit: string | null;
  reference_low: string | null;
  reference_high: string | null;
  interpretation: LabInterpretation;
  interpretation_notes: string | null;
  collection_date: Date;
  result_date: Date | null;
  source: LabSource;
  source_name: string | null;
  ordering_physician: string | null;
  specimen_type: string | null;
  entered_by: string;
  entered_by_name: string;
  entered_at: Date;
  visit_id: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_by_name: string | null;
  verified_at: Date | null;
  requires_notification: boolean;
  physician_notified: boolean;
  physician_notified_at: Date | null;
  notification_notes: string | null;
  clinical_notes: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export class LabResultService {
  constructor(private pool: Pool) {}

  // ==================== LAB RESULT TYPES ====================

  /**
   * Get all lab result types for an organization
   */
  async getLabResultTypes(
    organizationId: UUID,
    options?: { category?: string; activeOnly?: boolean }
  ): Promise<LabResultType[]> {
    const activeOnly = options?.activeOnly !== false;

    if (options?.category) {
      const result = await this.pool.query<LabResultTypeRow>(
        `SELECT * FROM lab_result_types
         WHERE organization_id = $1 AND category = $2 AND ($3::boolean = false OR is_active = true)
         ORDER BY display_order, name`,
        [organizationId, options.category, activeOnly]
      );
      return result.rows.map(this.mapLabResultType);
    }

    const result = await this.pool.query<LabResultTypeRow>(
      `SELECT * FROM lab_result_types
       WHERE organization_id = $1 AND ($2::boolean = false OR is_active = true)
       ORDER BY category, display_order, name`,
      [organizationId, activeOnly]
    );
    return result.rows.map(this.mapLabResultType);
  }

  /**
   * Get lab result type by ID
   */
  async getLabResultTypeById(id: UUID): Promise<LabResultType | null> {
    const result = await this.pool.query<LabResultTypeRow>(
      `SELECT * FROM lab_result_types WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapLabResultType(result.rows[0]) : null;
  }

  /**
   * Get lab result type by code
   */
  async getLabResultTypeByCode(
    organizationId: UUID,
    code: string
  ): Promise<LabResultType | null> {
    const result = await this.pool.query<LabResultTypeRow>(
      `SELECT * FROM lab_result_types WHERE organization_id = $1 AND code = $2`,
      [organizationId, code]
    );
    return result.rows[0] ? this.mapLabResultType(result.rows[0]) : null;
  }

  /**
   * Create a new lab result type
   */
  async createLabResultType(input: CreateLabResultTypeInput): Promise<LabResultType> {
    const result = await this.pool.query<LabResultTypeRow>(
      `INSERT INTO lab_result_types (
        organization_id, code, name, short_name, category, unit,
        normal_min, normal_max, critical_low, critical_high, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.organizationId,
        input.code,
        input.name,
        input.shortName ?? null,
        input.category,
        input.unit ?? null,
        input.normalMin ?? null,
        input.normalMax ?? null,
        input.criticalLow ?? null,
        input.criticalHigh ?? null,
        input.displayOrder ?? 0,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapLabResultType(result.rows[0]!);
  }

  /**
   * Update a lab result type
   */
  async updateLabResultType(
    id: UUID,
    updates: Partial<Omit<CreateLabResultTypeInput, 'organizationId'>>
  ): Promise<LabResultType> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramCount = 0;

    if (updates.code !== undefined) {
      paramCount++;
      setClauses.push(`code = $${paramCount}`);
      values.push(updates.code);
    }
    if (updates.name !== undefined) {
      paramCount++;
      setClauses.push(`name = $${paramCount}`);
      values.push(updates.name);
    }
    if (updates.shortName !== undefined) {
      paramCount++;
      setClauses.push(`short_name = $${paramCount}`);
      values.push(updates.shortName);
    }
    if (updates.category !== undefined) {
      paramCount++;
      setClauses.push(`category = $${paramCount}`);
      values.push(updates.category);
    }
    if (updates.unit !== undefined) {
      paramCount++;
      setClauses.push(`unit = $${paramCount}`);
      values.push(updates.unit);
    }
    if (updates.normalMin !== undefined) {
      paramCount++;
      setClauses.push(`normal_min = $${paramCount}`);
      values.push(updates.normalMin);
    }
    if (updates.normalMax !== undefined) {
      paramCount++;
      setClauses.push(`normal_max = $${paramCount}`);
      values.push(updates.normalMax);
    }
    if (updates.criticalLow !== undefined) {
      paramCount++;
      setClauses.push(`critical_low = $${paramCount}`);
      values.push(updates.criticalLow);
    }
    if (updates.criticalHigh !== undefined) {
      paramCount++;
      setClauses.push(`critical_high = $${paramCount}`);
      values.push(updates.criticalHigh);
    }
    if (updates.displayOrder !== undefined) {
      paramCount++;
      setClauses.push(`display_order = $${paramCount}`);
      values.push(updates.displayOrder);
    }

    paramCount++;
    values.push(id);

    // Column names are from hardcoded field map, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<LabResultTypeRow>(
      `UPDATE lab_result_types SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Lab result type not found');
    }
    return this.mapLabResultType(result.rows[0]);
  }

  /**
   * Deactivate a lab result type
   */
  async deactivateLabResultType(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE lab_result_types SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // ==================== LAB RESULTS ====================

  /**
   * Calculate interpretation based on value and reference ranges
   */
  private calculateInterpretation(
    numericValue: number | undefined,
    referenceLow: number | undefined,
    referenceHigh: number | undefined,
    criticalLow: number | undefined,
    criticalHigh: number | undefined
  ): { interpretation: LabInterpretation; requiresNotification: boolean } {
    if (numericValue === undefined) {
      return { interpretation: 'UNKNOWN', requiresNotification: false };
    }

    // Check critical values first
    if (criticalLow !== undefined && numericValue <= criticalLow) {
      return { interpretation: 'CRITICAL_LOW', requiresNotification: true };
    }
    if (criticalHigh !== undefined && numericValue >= criticalHigh) {
      return { interpretation: 'CRITICAL_HIGH', requiresNotification: true };
    }

    // Check normal range
    if (referenceLow !== undefined && numericValue < referenceLow) {
      return { interpretation: 'LOW', requiresNotification: false };
    }
    if (referenceHigh !== undefined && numericValue > referenceHigh) {
      return { interpretation: 'HIGH', requiresNotification: false };
    }

    // Within normal range
    if (referenceLow !== undefined || referenceHigh !== undefined) {
      return { interpretation: 'NORMAL', requiresNotification: false };
    }

    return { interpretation: 'UNKNOWN', requiresNotification: false };
  }

  /**
   * Create a new lab result
   */
  async createLabResult(input: CreateLabResultInput): Promise<LabResult> {
    // Get reference ranges from lab type if provided
    let referenceLow = input.referenceLow;
    let referenceHigh = input.referenceHigh;
    let criticalLow: number | undefined;
    let criticalHigh: number | undefined;

    if (input.labTypeId) {
      const labType = await this.getLabResultTypeById(input.labTypeId);
      if (labType) {
        referenceLow = referenceLow ?? labType.normalMin;
        referenceHigh = referenceHigh ?? labType.normalMax;
        criticalLow = labType.criticalLow;
        criticalHigh = labType.criticalHigh;
      }
    }

    // Calculate interpretation
    const { interpretation, requiresNotification } = this.calculateInterpretation(
      input.numericValue,
      referenceLow,
      referenceHigh,
      criticalLow,
      criticalHigh
    );

    const result = await this.pool.query<LabResultRow>(
      `INSERT INTO lab_results (
        organization_id, branch_id, client_id, lab_type_id,
        lab_name, lab_code, numeric_value, text_value, unit,
        reference_low, reference_high, interpretation, interpretation_notes,
        collection_date, result_date, source, source_name,
        ordering_physician, specimen_type, entered_by, entered_by_name,
        visit_id, clinical_notes, requires_notification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        input.organizationId,
        input.branchId ?? null,
        input.clientId,
        input.labTypeId ?? null,
        input.labName,
        input.labCode ?? null,
        input.numericValue ?? null,
        input.textValue ?? null,
        input.unit ?? null,
        referenceLow ?? null,
        referenceHigh ?? null,
        interpretation,
        input.interpretationNotes ?? null,
        input.collectionDate,
        input.resultDate ?? null,
        input.source,
        input.sourceName ?? null,
        input.orderingPhysician ?? null,
        input.specimenType ?? null,
        input.enteredBy,
        input.enteredByName,
        input.visitId ?? null,
        input.clinicalNotes ?? null,
        requiresNotification,
      ]
    );

    // INSERT RETURNING always returns the inserted row
    return this.mapLabResult(result.rows[0]!);
  }

  /**
   * Get lab result by ID
   */
  async getLabResultById(id: UUID): Promise<LabResult | null> {
    const result = await this.pool.query<LabResultRow>(
      `SELECT * FROM lab_results WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return result.rows[0] ? this.mapLabResult(result.rows[0]) : null;
  }

  /**
   * Get lab results for a client
   */
  async getClientLabResults(
    clientId: UUID,
    options?: {
      labName?: string;
      category?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<LabResult[]> {
    const conditions = ['lr.client_id = $1', 'lr.is_deleted = false'];
    const values: unknown[] = [clientId];
    let paramCount = 1;

    if (options?.labName) {
      paramCount++;
      conditions.push(`lr.lab_name = $${paramCount}`);
      values.push(options.labName);
    }

    if (options?.startDate) {
      paramCount++;
      conditions.push(`lr.collection_date >= $${paramCount}`);
      values.push(options.startDate);
    }

    if (options?.endDate) {
      paramCount++;
      conditions.push(`lr.collection_date <= $${paramCount}`);
      values.push(options.endDate);
    }

    let query = `
      SELECT lr.* FROM lab_results lr
      ${options?.category ? 'LEFT JOIN lab_result_types lrt ON lr.lab_type_id = lrt.id' : ''}
      WHERE ${conditions.join(' AND ')}
    `;

    if (options?.category) {
      paramCount++;
      query = query.replace(
        `WHERE ${conditions.join(' AND ')}`,
        `WHERE ${conditions.join(' AND ')} AND lrt.category = $${paramCount}`
      );
      values.push(options.category);
    }

    query += ` ORDER BY lr.collection_date DESC, lr.lab_name`;

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
    }

    const result = await this.pool.query<LabResultRow>(query, values);
    return result.rows.map(this.mapLabResult);
  }

  /**
   * Get lab result trends for a client
   */
  async getLabResultTrends(
    clientId: UUID,
    labName: string,
    months: number = 12
  ): Promise<LabResultTrend> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const result = await this.pool.query<LabResultRow>(
      `SELECT * FROM lab_results
       WHERE client_id = $1 AND lab_name = $2
         AND collection_date >= $3 AND is_deleted = false
         AND numeric_value IS NOT NULL
       ORDER BY collection_date ASC`,
      [clientId, labName, startDate]
    );

    const results = result.rows.map((row) => ({
      id: row.id,
      value: parseFloat(row.numeric_value!),
      interpretation: row.interpretation,
      collectionDate: row.collection_date,
      referenceLow: row.reference_low ? parseFloat(row.reference_low) : undefined,
      referenceHigh: row.reference_high ? parseFloat(row.reference_high) : undefined,
    }));

    // Calculate trend
    let trend: LabResultTrend['trend'] = 'INSUFFICIENT_DATA';
    if (results.length >= 3) {
      // Compare first half average to second half average
      const midpoint = Math.floor(results.length / 2);
      const firstHalf = results.slice(0, midpoint);
      const secondHalf = results.slice(midpoint);

      const firstAvg = firstHalf.reduce((sum, r) => sum + r.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, r) => sum + r.value, 0) / secondHalf.length;

      // Get reference range for context (results[0] exists since results.length >= 3)
      const firstResult = results[0]!;
      const refLow = firstResult.referenceLow;
      const refHigh = firstResult.referenceHigh;

      if (refLow !== undefined && refHigh !== undefined) {
        const normalMid = (refLow + refHigh) / 2;
        const firstDiff = Math.abs(firstAvg - normalMid);
        const secondDiff = Math.abs(secondAvg - normalMid);

        if (secondDiff < firstDiff * 0.9) {
          trend = 'IMPROVING';
        } else if (secondDiff > firstDiff * 1.1) {
          trend = 'WORSENING';
        } else {
          trend = 'STABLE';
        }
      } else {
        // Without reference range, just compare values
        const change = Math.abs(secondAvg - firstAvg) / firstAvg;
        if (change < 0.05) {
          trend = 'STABLE';
        } else {
          trend = secondAvg > firstAvg ? 'WORSENING' : 'IMPROVING';
        }
      }
    }

    const latest = results[results.length - 1];

    return {
      labName,
      labCode: result.rows[0]?.lab_code ?? undefined,
      unit: result.rows[0]?.unit ?? undefined,
      results,
      trend,
      latestValue: latest?.value,
      latestInterpretation: latest?.interpretation,
    };
  }

  /**
   * Update a lab result
   */
  async updateLabResult(input: UpdateLabResultInput): Promise<LabResult> {
    // Get current result for recalculation
    const current = await this.getLabResultById(input.id);
    if (!current) {
      throw new Error('Lab result not found');
    }

    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramCount = 0;

    // Track values for recalculation
    let numericValue = current.numericValue;
    let referenceLow = current.referenceLow;
    let referenceHigh = current.referenceHigh;

    if (input.numericValue !== undefined) {
      paramCount++;
      setClauses.push(`numeric_value = $${paramCount}`);
      values.push(input.numericValue);
      numericValue = input.numericValue;
    }
    if (input.textValue !== undefined) {
      paramCount++;
      setClauses.push(`text_value = $${paramCount}`);
      values.push(input.textValue);
    }
    if (input.unit !== undefined) {
      paramCount++;
      setClauses.push(`unit = $${paramCount}`);
      values.push(input.unit);
    }
    if (input.referenceLow !== undefined) {
      paramCount++;
      setClauses.push(`reference_low = $${paramCount}`);
      values.push(input.referenceLow);
      referenceLow = input.referenceLow;
    }
    if (input.referenceHigh !== undefined) {
      paramCount++;
      setClauses.push(`reference_high = $${paramCount}`);
      values.push(input.referenceHigh);
      referenceHigh = input.referenceHigh;
    }
    if (input.interpretationNotes !== undefined) {
      paramCount++;
      setClauses.push(`interpretation_notes = $${paramCount}`);
      values.push(input.interpretationNotes);
    }
    if (input.collectionDate !== undefined) {
      paramCount++;
      setClauses.push(`collection_date = $${paramCount}`);
      values.push(input.collectionDate);
    }
    if (input.resultDate !== undefined) {
      paramCount++;
      setClauses.push(`result_date = $${paramCount}`);
      values.push(input.resultDate);
    }
    if (input.source !== undefined) {
      paramCount++;
      setClauses.push(`source = $${paramCount}`);
      values.push(input.source);
    }
    if (input.sourceName !== undefined) {
      paramCount++;
      setClauses.push(`source_name = $${paramCount}`);
      values.push(input.sourceName);
    }
    if (input.orderingPhysician !== undefined) {
      paramCount++;
      setClauses.push(`ordering_physician = $${paramCount}`);
      values.push(input.orderingPhysician);
    }
    if (input.specimenType !== undefined) {
      paramCount++;
      setClauses.push(`specimen_type = $${paramCount}`);
      values.push(input.specimenType);
    }
    if (input.clinicalNotes !== undefined) {
      paramCount++;
      setClauses.push(`clinical_notes = $${paramCount}`);
      values.push(input.clinicalNotes);
    }

    // Recalculate interpretation if values changed
    if (
      input.numericValue !== undefined ||
      input.referenceLow !== undefined ||
      input.referenceHigh !== undefined
    ) {
      // Get critical values from lab type
      let criticalLow: number | undefined;
      let criticalHigh: number | undefined;
      if (current.labTypeId) {
        const labType = await this.getLabResultTypeById(current.labTypeId);
        if (labType) {
          criticalLow = labType.criticalLow;
          criticalHigh = labType.criticalHigh;
        }
      }

      const { interpretation, requiresNotification } = this.calculateInterpretation(
        numericValue,
        referenceLow,
        referenceHigh,
        criticalLow,
        criticalHigh
      );

      paramCount++;
      setClauses.push(`interpretation = $${paramCount}`);
      values.push(interpretation);

      paramCount++;
      setClauses.push(`requires_notification = $${paramCount}`);
      values.push(requiresNotification);
    }

    paramCount++;
    values.push(input.id);

    // Column names are from hardcoded field map, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<LabResultRow>(
      `UPDATE lab_results SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Lab result not found');
    }
    return this.mapLabResult(result.rows[0]);
  }

  /**
   * Verify a lab result
   */
  async verifyLabResult(
    id: UUID,
    verifiedBy: UUID,
    verifiedByName: string
  ): Promise<LabResult> {
    const result = await this.pool.query<LabResultRow>(
      `UPDATE lab_results SET
        is_verified = true,
        verified_by = $2,
        verified_by_name = $3,
        verified_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, verifiedBy, verifiedByName]
    );

    if (!result.rows[0]) {
      throw new Error('Lab result not found');
    }
    return this.mapLabResult(result.rows[0]);
  }

  /**
   * Mark physician notified for critical value
   */
  async markPhysicianNotified(
    id: UUID,
    notes?: string
  ): Promise<LabResult> {
    const result = await this.pool.query<LabResultRow>(
      `UPDATE lab_results SET
        physician_notified = true,
        physician_notified_at = NOW(),
        notification_notes = $2,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, notes ?? null]
    );

    if (!result.rows[0]) {
      throw new Error('Lab result not found');
    }
    return this.mapLabResult(result.rows[0]);
  }

  /**
   * Get results requiring physician notification
   */
  async getPendingNotifications(organizationId: UUID): Promise<LabResult[]> {
    const result = await this.pool.query<LabResultRow>(
      `SELECT * FROM lab_results
       WHERE organization_id = $1
         AND requires_notification = true
         AND physician_notified = false
         AND is_deleted = false
       ORDER BY collection_date DESC`,
      [organizationId]
    );
    return result.rows.map(this.mapLabResult);
  }

  /**
   * Get results pending verification
   */
  async getPendingVerification(organizationId: UUID): Promise<LabResult[]> {
    const result = await this.pool.query<LabResultRow>(
      `SELECT * FROM lab_results
       WHERE organization_id = $1
         AND is_verified = false
         AND is_deleted = false
       ORDER BY entered_at DESC`,
      [organizationId]
    );
    return result.rows.map(this.mapLabResult);
  }

  /**
   * Soft delete a lab result
   */
  async deleteLabResult(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE lab_results SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  /**
   * Get lab result summary for organization
   */
  async getLabResultSummary(
    organizationId: UUID,
    startDate?: Date,
    endDate?: Date
  ): Promise<LabResultSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total results
    const totalResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM lab_results
       WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    // Results this month
    const monthlyResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM lab_results
       WHERE organization_id = $1 AND is_deleted = false
         AND collection_date >= $2`,
      [organizationId, monthStart]
    );

    // Critical results - use separate queries to avoid dynamic SQL
    let criticalResult: { rows: Array<{ count: string }> };
    if (startDate && endDate) {
      criticalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('CRITICAL_LOW', 'CRITICAL_HIGH')
           AND collection_date >= $2 AND collection_date <= $3`,
        [organizationId, startDate, endDate]
      );
    } else if (startDate) {
      criticalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('CRITICAL_LOW', 'CRITICAL_HIGH')
           AND collection_date >= $2`,
        [organizationId, startDate]
      );
    } else if (endDate) {
      criticalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('CRITICAL_LOW', 'CRITICAL_HIGH')
           AND collection_date <= $2`,
        [organizationId, endDate]
      );
    } else {
      criticalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('CRITICAL_LOW', 'CRITICAL_HIGH')`,
        [organizationId]
      );
    }

    // Abnormal results - use separate queries to avoid dynamic SQL
    let abnormalResult: { rows: Array<{ count: string }> };
    if (startDate && endDate) {
      abnormalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('LOW', 'HIGH', 'ABNORMAL')
           AND collection_date >= $2 AND collection_date <= $3`,
        [organizationId, startDate, endDate]
      );
    } else if (startDate) {
      abnormalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('LOW', 'HIGH', 'ABNORMAL')
           AND collection_date >= $2`,
        [organizationId, startDate]
      );
    } else if (endDate) {
      abnormalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('LOW', 'HIGH', 'ABNORMAL')
           AND collection_date <= $2`,
        [organizationId, endDate]
      );
    } else {
      abnormalResult = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lab_results
         WHERE organization_id = $1 AND is_deleted = false
           AND interpretation IN ('LOW', 'HIGH', 'ABNORMAL')`,
        [organizationId]
      );
    }

    // Pending verification
    const pendingVerifyResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM lab_results
       WHERE organization_id = $1 AND is_deleted = false AND is_verified = false`,
      [organizationId]
    );

    // Pending notification
    const pendingNotifyResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM lab_results
       WHERE organization_id = $1 AND is_deleted = false
         AND requires_notification = true AND physician_notified = false`,
      [organizationId]
    );

    // Results by category
    const categoryResult = await this.pool.query<{ category: string; count: string }>(
      `SELECT lrt.category, COUNT(*) as count
       FROM lab_results lr
       JOIN lab_result_types lrt ON lr.lab_type_id = lrt.id
       WHERE lr.organization_id = $1 AND lr.is_deleted = false
       GROUP BY lrt.category`,
      [organizationId]
    );

    const resultsByCategory: Record<string, number> = {};
    for (const row of categoryResult.rows) {
      resultsByCategory[row.category] = parseInt(row.count, 10);
    }

    // COUNT(*) queries always return a row
    return {
      totalResults: parseInt(totalResult.rows[0]!.count, 10),
      resultsThisMonth: parseInt(monthlyResult.rows[0]!.count, 10),
      criticalResults: parseInt(criticalResult.rows[0]!.count, 10),
      abnormalResults: parseInt(abnormalResult.rows[0]!.count, 10),
      pendingVerification: parseInt(pendingVerifyResult.rows[0]!.count, 10),
      pendingNotification: parseInt(pendingNotifyResult.rows[0]!.count, 10),
      resultsByCategory,
    };
  }

  /**
   * Generate printable lab result report for client
   */
  generateClientLabReport(
    clientName: string,
    results: LabResult[],
    trends?: LabResultTrend[]
  ): string {
    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push('LAB RESULTS REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Client: ${clientName}`);
    lines.push(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`);
    lines.push('');

    if (results.length === 0) {
      lines.push('No lab results on file.');
      return lines.join('\n');
    }

    // Group by date
    const byDate = new Map<string, LabResult[]>();
    for (const result of results) {
      const dateKey = format(result.collectionDate, 'yyyy-MM-dd');
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(result);
    }

    lines.push('-'.repeat(60));
    lines.push('RECENT RESULTS');
    lines.push('-'.repeat(60));

    for (const [dateKey, dateResults] of byDate) {
      lines.push('');
      lines.push(`Collection Date: ${format(new Date(dateKey), 'MMM d, yyyy')}`);
      lines.push('');

      for (const result of dateResults) {
        const value = result.numericValue ?? result.textValue ?? 'N/A';
        const unit = result.unit ? ` ${result.unit}` : '';
        const interp = result.interpretation !== 'NORMAL' ? ` [${result.interpretation}]` : '';
        lines.push(`  ${result.labName}: ${value}${unit}${interp}`);

        if (result.referenceLow !== undefined || result.referenceHigh !== undefined) {
          const range =
            result.referenceLow !== undefined && result.referenceHigh !== undefined
              ? `${result.referenceLow}-${result.referenceHigh}`
              : result.referenceLow !== undefined
                ? `>${result.referenceLow}`
                : `<${result.referenceHigh}`;
          lines.push(`    Reference: ${range}${unit}`);
        }

        if (result.interpretationNotes) {
          lines.push(`    Notes: ${result.interpretationNotes}`);
        }
      }
    }

    if (trends && trends.length > 0) {
      lines.push('');
      lines.push('-'.repeat(60));
      lines.push('TRENDS');
      lines.push('-'.repeat(60));

      for (const trend of trends) {
        lines.push('');
        lines.push(`${trend.labName}: ${trend.trend}`);
        if (trend.latestValue !== undefined) {
          const unit = trend.unit ? ` ${trend.unit}` : '';
          lines.push(`  Latest: ${trend.latestValue}${unit}`);
        }
        lines.push(`  Data points: ${trend.results.length}`);
      }
    }

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('END OF REPORT');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // ==================== MAPPING ====================

  private mapLabResultType(row: LabResultTypeRow): LabResultType {
    return {
      id: row.id,
      organizationId: row.organization_id,
      code: row.code,
      name: row.name,
      shortName: row.short_name ?? undefined,
      category: row.category,
      unit: row.unit ?? undefined,
      normalMin: row.normal_min ? parseFloat(row.normal_min) : undefined,
      normalMax: row.normal_max ? parseFloat(row.normal_max) : undefined,
      criticalLow: row.critical_low ? parseFloat(row.critical_low) : undefined,
      criticalHigh: row.critical_high ? parseFloat(row.critical_high) : undefined,
      displayOrder: row.display_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapLabResult(row: LabResultRow): LabResult {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id ?? undefined,
      clientId: row.client_id,
      labTypeId: row.lab_type_id ?? undefined,
      labName: row.lab_name,
      labCode: row.lab_code ?? undefined,
      numericValue: row.numeric_value ? parseFloat(row.numeric_value) : undefined,
      textValue: row.text_value ?? undefined,
      unit: row.unit ?? undefined,
      referenceLow: row.reference_low ? parseFloat(row.reference_low) : undefined,
      referenceHigh: row.reference_high ? parseFloat(row.reference_high) : undefined,
      interpretation: row.interpretation,
      interpretationNotes: row.interpretation_notes ?? undefined,
      collectionDate: row.collection_date,
      resultDate: row.result_date ?? undefined,
      source: row.source,
      sourceName: row.source_name ?? undefined,
      orderingPhysician: row.ordering_physician ?? undefined,
      specimenType: row.specimen_type ?? undefined,
      enteredBy: row.entered_by,
      enteredByName: row.entered_by_name,
      enteredAt: row.entered_at,
      visitId: row.visit_id ?? undefined,
      isVerified: row.is_verified,
      verifiedBy: row.verified_by ?? undefined,
      verifiedByName: row.verified_by_name ?? undefined,
      verifiedAt: row.verified_at ?? undefined,
      requiresNotification: row.requires_notification,
      physicianNotified: row.physician_notified,
      physicianNotifiedAt: row.physician_notified_at ?? undefined,
      notificationNotes: row.notification_notes ?? undefined,
      clinicalNotes: row.clinical_notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted,
    };
  }
}
