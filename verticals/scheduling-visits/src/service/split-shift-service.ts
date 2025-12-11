/**
 * Split Shift Service
 *
 * Manages split shifts where caregivers work multiple segments
 * within the same day with a break in between.
 *
 * Common in home care scenarios:
 * - Morning visit (7am-11am)
 * - Break (11am-4pm)
 * - Evening visit (4pm-8pm)
 *
 * Features:
 * - Create linked split shift visits
 * - Track parts of the same logical shift
 * - Calculate total hours for a split shift day
 * - Validate split shift constraints
 * - Support for payroll calculations
 */

import { UUID } from '@folkcare/core';
import { Pool } from 'pg';
import { format } from 'date-fns';

/**
 * Split shift part position
 */
export type SplitShiftPart = 1 | 2 | 3;

/**
 * Split shift configuration
 */
export interface SplitShiftConfig {
  minimumBreakMinutes: number;
  maximumBreakMinutes: number;
  minimumPartDurationMinutes: number;
  requireSameCaregiver: boolean;
  requireSameClient: boolean;
}

/**
 * Split shift group - represents all parts of a split shift
 */
export interface SplitShiftGroup {
  groupId: UUID;
  organizationId: UUID;
  caregiverId: UUID;
  caregiverName: string;
  clientId: UUID;
  clientName: string;
  date: Date;
  parts: SplitShiftVisit[];
  totalScheduledMinutes: number;
  totalActualMinutes?: number;
  breakMinutes: number;
  status: SplitShiftStatus;
}

/**
 * Split shift visit - individual part of a split shift
 */
export interface SplitShiftVisit {
  visitId: UUID;
  part: SplitShiftPart;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDuration: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  status: string;
}

/**
 * Split shift status
 */
export type SplitShiftStatus =
  | 'SCHEDULED'
  | 'PART_1_IN_PROGRESS'
  | 'ON_BREAK'
  | 'PART_2_IN_PROGRESS'
  | 'PART_3_IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Create split shift input
 */
export interface CreateSplitShiftInput {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  caregiverId: UUID;
  date: Date;
  parts: SplitShiftPartInput[];
  serviceTypeId: UUID;
  serviceTypeName: string;
  notes?: string;
  createdBy: UUID;
}

/**
 * Split shift part input
 */
export interface SplitShiftPartInput {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  taskIds?: UUID[];
}

/**
 * Split shift validation result
 */
export interface SplitShiftValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Split shift payroll summary
 */
export interface SplitShiftPayrollSummary {
  caregiverId: UUID;
  caregiverName: string;
  date: Date;
  splitShiftGroups: number;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  splitShiftBonus?: number;
  details: Array<{
    groupId: UUID;
    clientName: string;
    parts: number;
    workMinutes: number;
    breakMinutes: number;
  }>;
}

const DEFAULT_CONFIG: SplitShiftConfig = {
  minimumBreakMinutes: 60,
  maximumBreakMinutes: 480, // 8 hours max break
  minimumPartDurationMinutes: 60,
  requireSameCaregiver: true,
  requireSameClient: true,
};

export class SplitShiftService {
  private config: SplitShiftConfig;

  constructor(
    private pool: Pool,
    config?: Partial<SplitShiftConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a split shift with multiple parts
   */
  async createSplitShift(input: CreateSplitShiftInput): Promise<SplitShiftGroup> {
    const validation = await this.validateSplitShift(input);
    if (!validation.isValid) {
      throw new Error(`Invalid split shift: ${validation.errors.join(', ')}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Generate group ID for linking parts
      const groupResult = await client.query(
        `SELECT gen_random_uuid() as group_id`
      );
      const groupId = groupResult.rows[0].group_id;

      // Get caregiver and client names
      const namesResult = await client.query(
        `SELECT
           c.first_name || ' ' || c.last_name as caregiver_name,
           cl.first_name || ' ' || cl.last_name as client_name
         FROM users c
         CROSS JOIN clients cl
         WHERE c.id = $1 AND cl.id = $2`,
        [input.caregiverId, input.clientId]
      );
      const caregiverName = namesResult.rows[0]?.caregiver_name || 'Unknown';
      const clientName = namesResult.rows[0]?.client_name || 'Unknown';

      // Get client address
      const addressResult = await client.query(
        `SELECT
           address_line1 as line1,
           address_line2 as line2,
           city,
           state,
           zip_code as "postalCode",
           'US' as country
         FROM clients WHERE id = $1`,
        [input.clientId]
      );
      const address = addressResult.rows[0] || {
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      };

      const parts: SplitShiftVisit[] = [];

      // Create visits for each part
      for (let i = 0; i < input.parts.length; i++) {
        const partInput = input.parts[i];
        if (!partInput) continue;

        const part = (i + 1) as SplitShiftPart;
        const duration = this.calculateDuration(partInput.startTime, partInput.endTime);

        // Generate visit number
        const visitNumberResult = await client.query(
          `SELECT 'V-' || LPAD((COALESCE(MAX(SUBSTRING(visit_number FROM 3)::INT), 0) + 1)::TEXT, 6, '0') as visit_number
           FROM visits WHERE organization_id = $1`,
          [input.organizationId]
        );
        const visitNumber = visitNumberResult.rows[0].visit_number;

        // Insert visit with split shift metadata
        const visitResult = await client.query(
          `INSERT INTO visits (
             organization_id, branch_id, client_id, visit_number, visit_type,
             service_type_id, service_type_name, scheduled_date,
             scheduled_start_time, scheduled_end_time, scheduled_duration,
             timezone, assigned_caregiver_id, assigned_at, assigned_by,
             assignment_method, address, status, is_urgent, is_priority,
             requires_supervision, signature_required,
             split_shift_group_id, split_shift_part,
             internal_notes, created_by, created_at
           ) VALUES (
             $1, $2, $3, $4, 'REGULAR',
             $5, $6, $7, $8, $9, $10,
             'America/Chicago', $11, NOW(), $12, 'MANUAL',
             $13::jsonb, 'ASSIGNED', false, false, false, true,
             $14, $15, $16, $17, NOW()
           ) RETURNING id, created_at`,
          [
            input.organizationId,
            input.branchId,
            input.clientId,
            visitNumber,
            input.serviceTypeId,
            input.serviceTypeName,
            format(input.date, 'yyyy-MM-dd'),
            partInput.startTime,
            partInput.endTime,
            duration,
            input.caregiverId,
            input.createdBy,
            JSON.stringify(address),
            groupId,
            part,
            input.notes ? `Split shift part ${part}: ${input.notes}` : `Split shift part ${part}`,
            input.createdBy,
          ]
        );

        parts.push({
          visitId: visitResult.rows[0].id,
          part,
          scheduledStartTime: partInput.startTime,
          scheduledEndTime: partInput.endTime,
          scheduledDuration: duration,
          status: 'ASSIGNED',
        });
      }

      await client.query('COMMIT');

      // Calculate totals
      const totalScheduledMinutes = parts.reduce((sum, p) => sum + p.scheduledDuration, 0);
      const breakMinutes = this.calculateBreakMinutes(parts);

      return {
        groupId,
        organizationId: input.organizationId,
        caregiverId: input.caregiverId,
        caregiverName,
        clientId: input.clientId,
        clientName,
        date: input.date,
        parts,
        totalScheduledMinutes,
        breakMinutes,
        status: 'SCHEDULED',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a split shift group by ID
   */
  async getSplitShiftGroup(groupId: UUID): Promise<SplitShiftGroup | null> {
    const result = await this.pool.query(
      `SELECT
         v.split_shift_group_id as group_id,
         v.organization_id,
         v.client_id,
         v.assigned_caregiver_id as caregiver_id,
         u.first_name || ' ' || u.last_name as caregiver_name,
         c.first_name || ' ' || c.last_name as client_name,
         v.scheduled_date as date,
         v.id as visit_id,
         v.split_shift_part as part,
         v.scheduled_start_time,
         v.scheduled_end_time,
         v.scheduled_duration,
         v.actual_start_time,
         v.actual_end_time,
         v.actual_duration,
         v.status
       FROM visits v
       JOIN users u ON v.assigned_caregiver_id = u.id
       JOIN clients c ON v.client_id = c.id
       WHERE v.split_shift_group_id = $1
         AND v.is_deleted = false
       ORDER BY v.split_shift_part ASC`,
      [groupId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const firstRow = result.rows[0];
    const parts: SplitShiftVisit[] = result.rows.map((row) => ({
      visitId: row.visit_id,
      part: row.part,
      scheduledStartTime: row.scheduled_start_time,
      scheduledEndTime: row.scheduled_end_time,
      scheduledDuration: row.scheduled_duration,
      actualStartTime: row.actual_start_time ? new Date(row.actual_start_time) : undefined,
      actualEndTime: row.actual_end_time ? new Date(row.actual_end_time) : undefined,
      actualDuration: row.actual_duration,
      status: row.status,
    }));

    const totalScheduledMinutes = parts.reduce((sum, p) => sum + p.scheduledDuration, 0);
    const totalActualMinutes = parts
      .filter((p) => p.actualDuration !== undefined)
      .reduce((sum, p) => sum + (p.actualDuration ?? 0), 0) || undefined;
    const breakMinutes = this.calculateBreakMinutes(parts);

    return {
      groupId: firstRow.group_id,
      organizationId: firstRow.organization_id,
      caregiverId: firstRow.caregiver_id,
      caregiverName: firstRow.caregiver_name,
      clientId: firstRow.client_id,
      clientName: firstRow.client_name,
      date: new Date(firstRow.date),
      parts,
      totalScheduledMinutes,
      totalActualMinutes,
      breakMinutes,
      status: this.determineSplitShiftStatus(parts),
    };
  }

  /**
   * Get all split shifts for a caregiver on a date
   */
  async getCaregiverSplitShifts(
    caregiverId: UUID,
    date: Date
  ): Promise<SplitShiftGroup[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT split_shift_group_id
       FROM visits
       WHERE assigned_caregiver_id = $1
         AND scheduled_date = $2
         AND split_shift_group_id IS NOT NULL
         AND is_deleted = false`,
      [caregiverId, format(date, 'yyyy-MM-dd')]
    );

    const groups: SplitShiftGroup[] = [];
    for (const row of result.rows) {
      const group = await this.getSplitShiftGroup(row.split_shift_group_id);
      if (group) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Get split shifts for an organization within a date range
   */
  async getOrganizationSplitShifts(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<SplitShiftGroup[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT split_shift_group_id
       FROM visits
       WHERE organization_id = $1
         AND scheduled_date >= $2
         AND scheduled_date <= $3
         AND split_shift_group_id IS NOT NULL
         AND is_deleted = false`,
      [organizationId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')]
    );

    const groups: SplitShiftGroup[] = [];
    for (const row of result.rows) {
      const group = await this.getSplitShiftGroup(row.split_shift_group_id);
      if (group) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Validate a split shift configuration
   */
  async validateSplitShift(input: CreateSplitShiftInput): Promise<SplitShiftValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must have at least 2 parts
    if (input.parts.length < 2) {
      errors.push('Split shift must have at least 2 parts');
    }

    // Maximum 3 parts
    if (input.parts.length > 3) {
      errors.push('Split shift cannot have more than 3 parts');
    }

    // Validate each part
    for (let i = 0; i < input.parts.length; i++) {
      const part = input.parts[i];
      if (!part) continue;

      const duration = this.calculateDuration(part.startTime, part.endTime);

      if (duration < this.config.minimumPartDurationMinutes) {
        errors.push(
          `Part ${i + 1} duration (${duration} min) is less than minimum (${this.config.minimumPartDurationMinutes} min)`
        );
      }

      // Validate time format
      if (!/^\d{2}:\d{2}$/.test(part.startTime)) {
        errors.push(`Part ${i + 1} has invalid start time format`);
      }
      if (!/^\d{2}:\d{2}$/.test(part.endTime)) {
        errors.push(`Part ${i + 1} has invalid end time format`);
      }
    }

    // Validate breaks between parts
    for (let i = 0; i < input.parts.length - 1; i++) {
      const currentPart = input.parts[i];
      const nextPart = input.parts[i + 1];
      if (!currentPart || !nextPart) continue;

      const breakDuration = this.calculateDuration(currentPart.endTime, nextPart.startTime);

      if (breakDuration < this.config.minimumBreakMinutes) {
        errors.push(
          `Break between parts ${i + 1} and ${i + 2} (${breakDuration} min) is less than minimum (${this.config.minimumBreakMinutes} min)`
        );
      }

      if (breakDuration > this.config.maximumBreakMinutes) {
        warnings.push(
          `Break between parts ${i + 1} and ${i + 2} (${breakDuration} min) exceeds recommended maximum (${this.config.maximumBreakMinutes} min)`
        );
      }

      // Validate parts are in order
      if (this.timeToMinutes(currentPart.endTime) > this.timeToMinutes(nextPart.startTime)) {
        errors.push(`Part ${i + 2} must start after part ${i + 1} ends`);
      }
    }

    // Check caregiver availability
    const availabilityResult = await this.pool.query(
      `SELECT COUNT(*) as conflicts
       FROM visits
       WHERE assigned_caregiver_id = $1
         AND scheduled_date = $2
         AND split_shift_group_id IS NULL
         AND status NOT IN ('CANCELLED', 'NO_SHOW_CLIENT', 'NO_SHOW_CAREGIVER')
         AND is_deleted = false`,
      [input.caregiverId, format(input.date, 'yyyy-MM-dd')]
    );

    if (parseInt(availabilityResult.rows[0].conflicts, 10) > 0) {
      warnings.push('Caregiver has other non-split-shift visits on this date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get payroll summary for split shifts
   */
  async getSplitShiftPayrollSummary(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<SplitShiftPayrollSummary[]> {
    // Get all split shifts in the date range
    const result = await this.pool.query(
      `SELECT DISTINCT
         v.assigned_caregiver_id as caregiver_id,
         u.first_name || ' ' || u.last_name as caregiver_name,
         v.scheduled_date as date,
         v.split_shift_group_id as group_id
       FROM visits v
       JOIN users u ON v.assigned_caregiver_id = u.id
       WHERE v.organization_id = $1
         AND v.scheduled_date >= $2
         AND v.scheduled_date <= $3
         AND v.split_shift_group_id IS NOT NULL
         AND v.status NOT IN ('CANCELLED')
         AND v.is_deleted = false
       ORDER BY v.assigned_caregiver_id, v.scheduled_date`,
      [organizationId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')]
    );

    // Group by caregiver and date
    const summaryMap = new Map<string, SplitShiftPayrollSummary>();

    for (const row of result.rows) {
      const key = `${row.caregiver_id}-${row.date}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          caregiverId: row.caregiver_id,
          caregiverName: row.caregiver_name,
          date: new Date(row.date),
          splitShiftGroups: 0,
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
          details: [],
        });
      }

      const summary = summaryMap.get(key)!;
      const group = await this.getSplitShiftGroup(row.group_id);

      if (group) {
        summary.splitShiftGroups++;
        summary.totalWorkMinutes += group.totalActualMinutes ?? group.totalScheduledMinutes;
        summary.totalBreakMinutes += group.breakMinutes;
        summary.details.push({
          groupId: group.groupId,
          clientName: group.clientName,
          parts: group.parts.length,
          workMinutes: group.totalActualMinutes ?? group.totalScheduledMinutes,
          breakMinutes: group.breakMinutes,
        });
      }
    }

    return Array.from(summaryMap.values());
  }

  /**
   * Cancel a split shift group
   */
  async cancelSplitShift(
    groupId: UUID,
    cancelledBy: UUID,
    reason?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE visits
       SET status = 'CANCELLED',
           internal_notes = COALESCE(internal_notes || ' | ', '') || $1,
           updated_at = NOW(),
           updated_by = $2
       WHERE split_shift_group_id = $3`,
      [
        `Cancelled: ${reason || 'No reason provided'}`,
        cancelledBy,
        groupId,
      ]
    );
  }

  /**
   * Check if a visit is part of a split shift
   */
  async isPartOfSplitShift(visitId: UUID): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT split_shift_group_id FROM visits WHERE id = $1`,
      [visitId]
    );
    return result.rows[0]?.split_shift_group_id !== null;
  }

  /**
   * Get the other parts of a split shift for a visit
   */
  async getRelatedSplitShiftParts(visitId: UUID): Promise<SplitShiftVisit[]> {
    const result = await this.pool.query(
      `SELECT
         v2.id as visit_id,
         v2.split_shift_part as part,
         v2.scheduled_start_time,
         v2.scheduled_end_time,
         v2.scheduled_duration,
         v2.actual_start_time,
         v2.actual_end_time,
         v2.actual_duration,
         v2.status
       FROM visits v1
       JOIN visits v2 ON v1.split_shift_group_id = v2.split_shift_group_id
       WHERE v1.id = $1
         AND v2.id != $1
         AND v2.is_deleted = false
       ORDER BY v2.split_shift_part ASC`,
      [visitId]
    );

    return result.rows.map((row) => ({
      visitId: row.visit_id,
      part: row.part,
      scheduledStartTime: row.scheduled_start_time,
      scheduledEndTime: row.scheduled_end_time,
      scheduledDuration: row.scheduled_duration,
      actualStartTime: row.actual_start_time ? new Date(row.actual_start_time) : undefined,
      actualEndTime: row.actual_end_time ? new Date(row.actual_end_time) : undefined,
      actualDuration: row.actual_duration,
      status: row.status,
    }));
  }

  // Helper methods

  private calculateDuration(startTime: string, endTime: string): number {
    return this.timeToMinutes(endTime) - this.timeToMinutes(startTime);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }

  private calculateBreakMinutes(parts: SplitShiftVisit[]): number {
    if (parts.length < 2) return 0;

    let totalBreak = 0;
    for (let i = 0; i < parts.length - 1; i++) {
      const currentPart = parts[i];
      const nextPart = parts[i + 1];
      if (currentPart && nextPart) {
        totalBreak += this.calculateDuration(currentPart.scheduledEndTime, nextPart.scheduledStartTime);
      }
    }
    return totalBreak;
  }

  private determineSplitShiftStatus(parts: SplitShiftVisit[]): SplitShiftStatus {
    const statuses = parts.map((p) => p.status);

    if (statuses.every((s) => s === 'CANCELLED')) {
      return 'CANCELLED';
    }

    if (statuses.every((s) => s === 'COMPLETED' || s === 'CANCELLED')) {
      return 'COMPLETED';
    }

    // Check for in-progress parts
    for (let i = 0; i < parts.length; i++) {
      if (statuses[i] === 'IN_PROGRESS') {
        if (i === 0) return 'PART_1_IN_PROGRESS';
        if (i === 1) return 'PART_2_IN_PROGRESS';
        if (i === 2) return 'PART_3_IN_PROGRESS';
      }
    }

    // Check if first part completed but second not started
    if (statuses[0] === 'COMPLETED' && statuses[1] && statuses[1] !== 'IN_PROGRESS' && statuses[1] !== 'COMPLETED') {
      return 'ON_BREAK';
    }

    return 'SCHEDULED';
  }
}
