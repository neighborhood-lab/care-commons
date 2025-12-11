/**
 * On-Call Schedule Service
 *
 * Manages on-call rotations and escalations for caregivers.
 *
 * Features:
 * - Create and manage on-call periods/shifts
 * - Assign caregivers to on-call rotations
 * - Handle escalation paths when primary on-call unavailable
 * - Track on-call coverage status
 * - Support for backup caregivers
 */

import { UUID } from '@folkcare/core';
import { Pool } from 'pg';
import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval } from 'date-fns';

/**
 * On-call period type
 */
export type OnCallPeriodType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'OVERNIGHT' | 'CUSTOM';

/**
 * On-call status
 */
export type OnCallStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/**
 * Escalation level
 */
export type EscalationLevel = 1 | 2 | 3;

/**
 * On-call shift
 */
export interface OnCallShift {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  caregiverId: UUID;
  caregiverName: string;
  periodType: OnCallPeriodType;
  startDateTime: Date;
  endDateTime: Date;
  status: OnCallStatus;
  escalationLevel: EscalationLevel;
  backupCaregiverId?: UUID;
  backupCaregiverName?: string;
  notes?: string;
  createdBy: UUID;
  createdAt: Date;
}

/**
 * On-call rotation
 */
export interface OnCallRotation {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  name: string;
  description?: string;
  periodType: OnCallPeriodType;
  defaultStartTime: string; // HH:mm
  defaultEndTime: string; // HH:mm
  rotationPattern: RotationPattern;
  caregiverIds: UUID[];
  backupCaregiverIds: UUID[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rotation pattern
 */
export type RotationPattern = 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';

/**
 * Create on-call shift input
 */
export interface CreateOnCallShiftInput {
  organizationId: UUID;
  branchId?: UUID;
  caregiverId: UUID;
  periodType: OnCallPeriodType;
  startDateTime: Date;
  endDateTime: Date;
  escalationLevel?: EscalationLevel;
  backupCaregiverId?: UUID;
  notes?: string;
  createdBy: UUID;
}

/**
 * Create rotation input
 */
export interface CreateRotationInput {
  organizationId: UUID;
  branchId?: UUID;
  name: string;
  description?: string;
  periodType: OnCallPeriodType;
  defaultStartTime: string;
  defaultEndTime: string;
  rotationPattern: RotationPattern;
  caregiverIds: UUID[];
  backupCaregiverIds?: UUID[];
}

/**
 * On-call coverage status
 */
export interface OnCallCoverageStatus {
  hasCoverage: boolean;
  currentOnCall?: OnCallShift;
  nextOnCall?: OnCallShift;
  coverageGaps: CoverageGap[];
}

/**
 * Coverage gap
 */
export interface CoverageGap {
  startDateTime: Date;
  endDateTime: Date;
  durationHours: number;
}

/**
 * Escalation result
 */
export interface EscalationResult {
  success: boolean;
  escalatedTo?: {
    caregiverId: UUID;
    caregiverName: string;
    escalationLevel: EscalationLevel;
    contactPhone?: string;
  };
  reason?: string;
}

export class OnCallScheduleService {
  constructor(private pool: Pool) {}

  /**
   * Create an on-call shift
   */
  async createOnCallShift(input: CreateOnCallShiftInput): Promise<OnCallShift> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get caregiver name
      const caregiverResult = await client.query(
        `SELECT first_name || ' ' || last_name as name FROM users WHERE id = $1`,
        [input.caregiverId]
      );
      const caregiverName = caregiverResult.rows[0]?.name || 'Unknown';

      // Get backup caregiver name if provided
      let backupCaregiverName: string | undefined;
      if (input.backupCaregiverId) {
        const backupResult = await client.query(
          `SELECT first_name || ' ' || last_name as name FROM users WHERE id = $1`,
          [input.backupCaregiverId]
        );
        backupCaregiverName = backupResult.rows[0]?.name;
      }

      // Check for conflicts
      const conflictResult = await client.query(
        `SELECT id FROM on_call_shifts
         WHERE organization_id = $1
           AND caregiver_id = $2
           AND status NOT IN ('COMPLETED', 'CANCELLED')
           AND (
             (start_date_time, end_date_time) OVERLAPS ($3::timestamp, $4::timestamp)
           )`,
        [input.organizationId, input.caregiverId, input.startDateTime, input.endDateTime]
      );

      if (conflictResult.rows.length > 0) {
        throw new Error('Caregiver already has an on-call shift during this period');
      }

      // Insert the shift
      const result = await client.query(
        `INSERT INTO on_call_shifts (
           organization_id, branch_id, caregiver_id, period_type,
           start_date_time, end_date_time, status, escalation_level,
           backup_caregiver_id, notes, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED', $7, $8, $9, $10)
         RETURNING id, created_at`,
        [
          input.organizationId,
          input.branchId || null,
          input.caregiverId,
          input.periodType,
          input.startDateTime,
          input.endDateTime,
          input.escalationLevel || 1,
          input.backupCaregiverId || null,
          input.notes || null,
          input.createdBy,
        ]
      );

      await client.query('COMMIT');

      return {
        id: result.rows[0].id,
        organizationId: input.organizationId,
        branchId: input.branchId,
        caregiverId: input.caregiverId,
        caregiverName,
        periodType: input.periodType,
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
        status: 'SCHEDULED',
        escalationLevel: input.escalationLevel || 1,
        backupCaregiverId: input.backupCaregiverId,
        backupCaregiverName,
        notes: input.notes,
        createdBy: input.createdBy,
        createdAt: result.rows[0].created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current on-call caregiver
   */
  async getCurrentOnCall(
    organizationId: UUID,
    branchId?: UUID
  ): Promise<OnCallShift | null> {
    const now = new Date();

    let query = `
      SELECT
        ocs.id,
        ocs.organization_id,
        ocs.branch_id,
        ocs.caregiver_id,
        u.first_name || ' ' || u.last_name as caregiver_name,
        ocs.period_type,
        ocs.start_date_time,
        ocs.end_date_time,
        ocs.status,
        ocs.escalation_level,
        ocs.backup_caregiver_id,
        bu.first_name || ' ' || bu.last_name as backup_caregiver_name,
        ocs.notes,
        ocs.created_by,
        ocs.created_at
      FROM on_call_shifts ocs
      JOIN users u ON ocs.caregiver_id = u.id
      LEFT JOIN users bu ON ocs.backup_caregiver_id = bu.id
      WHERE ocs.organization_id = $1
        AND ocs.start_date_time <= $2
        AND ocs.end_date_time >= $2
        AND ocs.status IN ('SCHEDULED', 'ACTIVE')
    `;

    const params: (string | Date)[] = [organizationId, now];

    if (branchId) {
      query += ` AND ocs.branch_id = $3`;
      params.push(branchId);
    }

    query += ` ORDER BY ocs.escalation_level ASC LIMIT 1`;

    const result = await this.pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return this.mapRowToShift(row);
  }

  /**
   * Get on-call shifts for a date range
   */
  async getOnCallShifts(
    organizationId: UUID,
    startDate: Date,
    endDate: Date,
    branchId?: UUID
  ): Promise<OnCallShift[]> {
    let query = `
      SELECT
        ocs.id,
        ocs.organization_id,
        ocs.branch_id,
        ocs.caregiver_id,
        u.first_name || ' ' || u.last_name as caregiver_name,
        ocs.period_type,
        ocs.start_date_time,
        ocs.end_date_time,
        ocs.status,
        ocs.escalation_level,
        ocs.backup_caregiver_id,
        bu.first_name || ' ' || bu.last_name as backup_caregiver_name,
        ocs.notes,
        ocs.created_by,
        ocs.created_at
      FROM on_call_shifts ocs
      JOIN users u ON ocs.caregiver_id = u.id
      LEFT JOIN users bu ON ocs.backup_caregiver_id = bu.id
      WHERE ocs.organization_id = $1
        AND ocs.start_date_time >= $2
        AND ocs.start_date_time <= $3
        AND ocs.status NOT IN ('CANCELLED')
    `;

    const params: (string | Date)[] = [organizationId, startDate, endDate];

    if (branchId) {
      query += ` AND ocs.branch_id = $4`;
      params.push(branchId);
    }

    query += ` ORDER BY ocs.start_date_time ASC`;

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapRowToShift(row));
  }

  /**
   * Check coverage status for an organization
   */
  async checkCoverageStatus(
    organizationId: UUID,
    startDate: Date,
    endDate: Date,
    branchId?: UUID
  ): Promise<OnCallCoverageStatus> {
    const now = new Date();
    const shifts = await this.getOnCallShifts(organizationId, startDate, endDate, branchId);

    // Find current on-call
    const currentOnCall = shifts.find(
      (shift) =>
        isWithinInterval(now, {
          start: shift.startDateTime,
          end: shift.endDateTime,
        }) && (shift.status === 'SCHEDULED' || shift.status === 'ACTIVE')
    );

    // Find next on-call
    const nextOnCall = shifts.find(
      (shift) =>
        shift.startDateTime > now &&
        (shift.status === 'SCHEDULED' || shift.status === 'ACTIVE')
    );

    // Calculate coverage gaps
    const coverageGaps = this.calculateCoverageGaps(shifts, startDate, endDate);

    return {
      hasCoverage: !!currentOnCall,
      currentOnCall,
      nextOnCall,
      coverageGaps,
    };
  }

  /**
   * Escalate to backup caregiver
   */
  async escalateOnCall(
    shiftId: UUID,
    reason: string
  ): Promise<EscalationResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get the current shift
      const shiftResult = await client.query(
        `SELECT
           ocs.*,
           u.first_name || ' ' || u.last_name as caregiver_name,
           u.phone as caregiver_phone,
           bu.first_name || ' ' || bu.last_name as backup_caregiver_name,
           bu.phone as backup_phone
         FROM on_call_shifts ocs
         JOIN users u ON ocs.caregiver_id = u.id
         LEFT JOIN users bu ON ocs.backup_caregiver_id = bu.id
         WHERE ocs.id = $1`,
        [shiftId]
      );

      if (shiftResult.rows.length === 0) {
        return { success: false, reason: 'Shift not found' };
      }

      const shift = shiftResult.rows[0];

      // Check if there's a backup
      if (!shift.backup_caregiver_id) {
        // Try to find another on-call caregiver at higher escalation level
        const escalationResult = await client.query(
          `SELECT
             ocs.id,
             ocs.caregiver_id,
             u.first_name || ' ' || u.last_name as caregiver_name,
             u.phone,
             ocs.escalation_level
           FROM on_call_shifts ocs
           JOIN users u ON ocs.caregiver_id = u.id
           WHERE ocs.organization_id = $1
             AND ocs.start_date_time <= NOW()
             AND ocs.end_date_time >= NOW()
             AND ocs.escalation_level > $2
             AND ocs.status IN ('SCHEDULED', 'ACTIVE')
           ORDER BY ocs.escalation_level ASC
           LIMIT 1`,
          [shift.organization_id, shift.escalation_level]
        );

        if (escalationResult.rows.length === 0) {
          return {
            success: false,
            reason: 'No backup or higher escalation level available',
          };
        }

        const nextLevel = escalationResult.rows[0];

        // Log escalation
        await client.query(
          `INSERT INTO on_call_escalations (
             shift_id, from_caregiver_id, to_caregiver_id,
             escalation_level, reason
           ) VALUES ($1, $2, $3, $4, $5)`,
          [
            shiftId,
            shift.caregiver_id,
            nextLevel.caregiver_id,
            nextLevel.escalation_level,
            reason,
          ]
        );

        await client.query('COMMIT');

        return {
          success: true,
          escalatedTo: {
            caregiverId: nextLevel.caregiver_id,
            caregiverName: nextLevel.caregiver_name,
            escalationLevel: nextLevel.escalation_level,
            contactPhone: nextLevel.phone,
          },
        };
      }

      // Use the designated backup
      await client.query(
        `INSERT INTO on_call_escalations (
           shift_id, from_caregiver_id, to_caregiver_id,
           escalation_level, reason
         ) VALUES ($1, $2, $3, $4, $5)`,
        [shiftId, shift.caregiver_id, shift.backup_caregiver_id, 2, reason]
      );

      await client.query('COMMIT');

      return {
        success: true,
        escalatedTo: {
          caregiverId: shift.backup_caregiver_id,
          caregiverName: shift.backup_caregiver_name,
          escalationLevel: 2,
          contactPhone: shift.backup_phone,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate on-call schedule from rotation
   */
  async generateScheduleFromRotation(
    rotationId: UUID,
    startDate: Date,
    weeksToGenerate: number,
    createdBy: UUID
  ): Promise<OnCallShift[]> {
    // Get rotation details
    const rotationResult = await this.pool.query(
      `SELECT * FROM on_call_rotations WHERE id = $1 AND is_active = true`,
      [rotationId]
    );

    if (rotationResult.rows.length === 0) {
      throw new Error('Rotation not found or inactive');
    }

    const rotation = rotationResult.rows[0];
    const caregiverIds: UUID[] = rotation.caregiver_ids;
    const backupCaregiverIds: UUID[] = rotation.backup_caregiver_ids || [];

    if (caregiverIds.length === 0) {
      throw new Error('No caregivers assigned to rotation');
    }

    const generatedShifts: OnCallShift[] = [];
    let currentCaregiverIndex = 0;
    let currentBackupIndex = 0;

    for (let week = 0; week < weeksToGenerate; week++) {
      const weekStart = startOfWeek(addWeeks(startDate, week));
      const weekEnd = endOfWeek(addWeeks(startDate, week));

      // Determine shifts based on rotation pattern
      const shiftDates = this.getShiftDatesForPattern(
        rotation.rotation_pattern,
        rotation.period_type,
        weekStart,
        weekEnd
      );

      for (const { start, end } of shiftDates) {
        const caregiverId = caregiverIds[currentCaregiverIndex % caregiverIds.length] as UUID;
        const backupCaregiverId = backupCaregiverIds.length > 0
          ? backupCaregiverIds[currentBackupIndex % backupCaregiverIds.length]
          : undefined;

        // Set times based on rotation defaults
        const startDateTime = this.setTimeOnDate(start, rotation.default_start_time);
        const endDateTime = this.setTimeOnDate(end, rotation.default_end_time);

        try {
          const shift = await this.createOnCallShift({
            organizationId: rotation.organization_id,
            branchId: rotation.branch_id,
            caregiverId,
            periodType: rotation.period_type,
            startDateTime,
            endDateTime,
            backupCaregiverId,
            createdBy,
          });
          generatedShifts.push(shift);
        } catch (error) {
          // Log error but continue generating other shifts
          console.error(`Error creating shift for ${format(startDateTime, 'yyyy-MM-dd')}:`, error);
        }

        // Rotate to next caregiver based on pattern
        if (rotation.rotation_pattern === 'DAILY') {
          currentCaregiverIndex++;
          currentBackupIndex++;
        }
      }

      // For weekly/bi-weekly patterns, rotate after the week
      const shouldRotate =
        rotation.rotation_pattern === 'WEEKLY' ||
        (rotation.rotation_pattern === 'BI_WEEKLY' && week % 2 === 1);
      if (shouldRotate) {
        currentCaregiverIndex++;
        currentBackupIndex++;
      }
    }

    return generatedShifts;
  }

  /**
   * Cancel an on-call shift
   */
  async cancelOnCallShift(
    shiftId: UUID,
    cancelledBy: UUID,
    reason?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE on_call_shifts
       SET status = 'CANCELLED', notes = COALESCE(notes || ' | ', '') || $1
       WHERE id = $2`,
      [`Cancelled by ${cancelledBy}: ${reason || 'No reason provided'}`, shiftId]
    );
  }

  /**
   * Get on-call statistics for an organization
   */
  async getOnCallStats(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalShifts: number;
    completedShifts: number;
    cancelledShifts: number;
    escalations: number;
    coveragePercentage: number;
    topCaregivers: Array<{ caregiverId: UUID; name: string; shiftsWorked: number }>;
  }> {
    const statsResult = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status != 'CANCELLED') as total_shifts,
         COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_shifts,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_shifts
       FROM on_call_shifts
       WHERE organization_id = $1
         AND start_date_time >= $2
         AND start_date_time <= $3`,
      [organizationId, startDate, endDate]
    );

    const escalationsResult = await this.pool.query(
      `SELECT COUNT(*) as escalations
       FROM on_call_escalations oce
       JOIN on_call_shifts ocs ON oce.shift_id = ocs.id
       WHERE ocs.organization_id = $1
         AND ocs.start_date_time >= $2
         AND ocs.start_date_time <= $3`,
      [organizationId, startDate, endDate]
    );

    const topCaregiversResult = await this.pool.query(
      `SELECT
         ocs.caregiver_id,
         u.first_name || ' ' || u.last_name as name,
         COUNT(*) as shifts_worked
       FROM on_call_shifts ocs
       JOIN users u ON ocs.caregiver_id = u.id
       WHERE ocs.organization_id = $1
         AND ocs.start_date_time >= $2
         AND ocs.start_date_time <= $3
         AND ocs.status IN ('COMPLETED', 'ACTIVE')
       GROUP BY ocs.caregiver_id, u.first_name, u.last_name
       ORDER BY shifts_worked DESC
       LIMIT 5`,
      [organizationId, startDate, endDate]
    );

    // Calculate coverage percentage
    const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const shifts = await this.getOnCallShifts(organizationId, startDate, endDate);
    const coveredHours = shifts.reduce((total, shift) => {
      const hours =
        (shift.endDateTime.getTime() - shift.startDateTime.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
    const coveragePercentage = Math.min(100, (coveredHours / totalHours) * 100);

    return {
      totalShifts: parseInt(statsResult.rows[0].total_shifts, 10),
      completedShifts: parseInt(statsResult.rows[0].completed_shifts, 10),
      cancelledShifts: parseInt(statsResult.rows[0].cancelled_shifts, 10),
      escalations: parseInt(escalationsResult.rows[0].escalations, 10),
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      topCaregivers: topCaregiversResult.rows.map((row) => ({
        caregiverId: row.caregiver_id,
        name: row.name,
        shiftsWorked: parseInt(row.shifts_worked, 10),
      })),
    };
  }

  // Helper methods

  private mapRowToShift(row: Record<string, unknown>): OnCallShift {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      branchId: row.branch_id as UUID | undefined,
      caregiverId: row.caregiver_id as UUID,
      caregiverName: row.caregiver_name as string,
      periodType: row.period_type as OnCallPeriodType,
      startDateTime: new Date(row.start_date_time as string),
      endDateTime: new Date(row.end_date_time as string),
      status: row.status as OnCallStatus,
      escalationLevel: row.escalation_level as EscalationLevel,
      backupCaregiverId: row.backup_caregiver_id as UUID | undefined,
      backupCaregiverName: row.backup_caregiver_name as string | undefined,
      notes: row.notes as string | undefined,
      createdBy: row.created_by as UUID,
      createdAt: new Date(row.created_at as string),
    };
  }

  private calculateCoverageGaps(
    shifts: OnCallShift[],
    startDate: Date,
    endDate: Date
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const sortedShifts = [...shifts]
      .filter((s) => s.status !== 'CANCELLED')
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    let currentEnd = startDate;

    for (const shift of sortedShifts) {
      if (shift.startDateTime > currentEnd) {
        const gapStart = currentEnd;
        const gapEnd = shift.startDateTime;
        const durationHours =
          (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60);

        gaps.push({
          startDateTime: gapStart,
          endDateTime: gapEnd,
          durationHours: Math.round(durationHours * 100) / 100,
        });
      }
      if (shift.endDateTime > currentEnd) {
        currentEnd = shift.endDateTime;
      }
    }

    // Check gap at the end
    if (currentEnd < endDate) {
      const durationHours =
        (endDate.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);
      gaps.push({
        startDateTime: currentEnd,
        endDateTime: endDate,
        durationHours: Math.round(durationHours * 100) / 100,
      });
    }

    return gaps;
  }

  private getShiftDatesForPattern(
    _pattern: RotationPattern,
    periodType: OnCallPeriodType,
    weekStart: Date,
    weekEnd: Date
  ): Array<{ start: Date; end: Date }> {
    const dates: Array<{ start: Date; end: Date }> = [];

    if (periodType === 'WEEKDAY') {
      // Mon-Fri
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day >= 1 && day <= 5) {
          dates.push({ start: new Date(d), end: new Date(d) });
        }
      }
    } else if (periodType === 'WEEKEND') {
      // Sat-Sun
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day === 0 || day === 6) {
          dates.push({ start: new Date(d), end: new Date(d) });
        }
      }
    } else {
      // Full week for other types
      dates.push({ start: weekStart, end: weekEnd });
    }

    return dates;
  }

  private setTimeOnDate(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    return result;
  }
}
