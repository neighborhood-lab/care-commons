/**
 * Overtime Alert Service
 *
 * Alerts coordinators before scheduling pushes caregivers into overtime.
 *
 * Features:
 * - Calculate scheduled hours for a caregiver in a given week
 * - Check if adding a visit would trigger overtime
 * - Support for state-specific overtime thresholds
 * - Configurable warning thresholds (e.g., alert at 35 hours)
 */

import { UUID } from '@folkcare/core';
import { Pool } from 'pg';
import { startOfWeek, endOfWeek } from 'date-fns';

/**
 * Overtime alert severity levels
 */
export type OvertimeAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * Overtime configuration by state
 * Most states follow federal 40-hour rule, but some have different thresholds
 */
export interface OvertimeConfig {
  weeklyThreshold: number; // Hours before overtime kicks in
  dailyThreshold?: number; // Some states (CA) have daily overtime
  warningThreshold: number; // Hours at which to show warning (e.g., 35)
  doubleTimeThreshold?: number; // Hours at which double time kicks in
  overtimeMultiplier: number; // Usually 1.5
  doubleTimeMultiplier?: number; // Usually 2.0
}

/**
 * Default overtime configurations by state
 */
export const STATE_OVERTIME_CONFIGS: Record<string, OvertimeConfig> = {
  // California has daily overtime after 8 hours
  CA: {
    weeklyThreshold: 40,
    dailyThreshold: 8,
    warningThreshold: 35,
    doubleTimeThreshold: 12, // Daily double time after 12 hours
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
  },
  // Colorado has daily overtime
  CO: {
    weeklyThreshold: 40,
    dailyThreshold: 12,
    warningThreshold: 35,
    overtimeMultiplier: 1.5,
  },
  // Federal default (applies to most states)
  DEFAULT: {
    weeklyThreshold: 40,
    warningThreshold: 35,
    overtimeMultiplier: 1.5,
  },
};

/**
 * Result of an overtime check
 */
export interface OvertimeCheckResult {
  caregiverId: UUID;
  caregiverName: string;
  weekStartDate: Date;
  weekEndDate: Date;

  // Current hours
  currentScheduledHours: number;
  currentScheduledMinutes: number;

  // Proposed addition
  proposedVisitDuration: number; // minutes

  // After adding proposed visit
  projectedTotalHours: number;
  projectedTotalMinutes: number;

  // Overtime status
  wouldTriggerOvertime: boolean;
  overtimeHours: number;

  // Alert
  alert: OvertimeAlert | null;

  // Additional context
  scheduledVisitsThisWeek: number;
  config: OvertimeConfig;
}

/**
 * Overtime alert to show to coordinator
 */
export interface OvertimeAlert {
  severity: OvertimeAlertSeverity;
  title: string;
  message: string;
  details: {
    currentHours: number;
    proposedHours: number;
    threshold: number;
    overtimeHours: number;
    estimatedOvertimeCost?: number;
  };
  suggestions: string[];
}

/**
 * Scheduled hours for a caregiver
 */
interface CaregiverScheduledHours {
  caregiverId: UUID;
  caregiverName: string;
  totalMinutes: number;
  visitCount: number;
  visits: Array<{
    id: UUID;
    scheduledDate: Date;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    clientName: string;
  }>;
}

export class OvertimeAlertService {
  constructor(private pool: Pool) {}

  /**
   * Check if assigning a visit would push a caregiver into overtime
   */
  async checkOvertimeForAssignment(
    caregiverId: UUID,
    visitDate: Date,
    visitDurationMinutes: number,
    organizationId: UUID,
    state: string = 'DEFAULT'
  ): Promise<OvertimeCheckResult> {
    const config = STATE_OVERTIME_CONFIGS[state] || STATE_OVERTIME_CONFIGS.DEFAULT!;

    // Get the week boundaries
    const weekStart = startOfWeek(visitDate, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(visitDate, { weekStartsOn: 0 });

    // Get current scheduled hours
    const scheduledHours = await this.getCaregiverScheduledHours(
      caregiverId,
      weekStart,
      weekEnd,
      organizationId
    );

    // Calculate projections
    const currentTotalMinutes = scheduledHours.totalMinutes;
    const projectedTotalMinutes = currentTotalMinutes + visitDurationMinutes;

    const currentHours = currentTotalMinutes / 60;
    const projectedHours = projectedTotalMinutes / 60;

    const wouldTriggerOvertime = projectedHours > config.weeklyThreshold;
    const overtimeHours = Math.max(0, projectedHours - config.weeklyThreshold);

    // Generate alert if needed
    const alert = this.generateAlert(
      currentHours,
      projectedHours,
      config,
      scheduledHours.caregiverName
    );

    return {
      caregiverId,
      caregiverName: scheduledHours.caregiverName,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      currentScheduledHours: Math.floor(currentHours),
      currentScheduledMinutes: currentTotalMinutes % 60,
      proposedVisitDuration: visitDurationMinutes,
      projectedTotalHours: Math.floor(projectedHours),
      projectedTotalMinutes: projectedTotalMinutes % 60,
      wouldTriggerOvertime,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      alert,
      scheduledVisitsThisWeek: scheduledHours.visitCount,
      config,
    };
  }

  /**
   * Get scheduled hours for a caregiver in a week
   */
  async getCaregiverScheduledHours(
    caregiverId: UUID,
    weekStart: Date,
    weekEnd: Date,
    organizationId: UUID
  ): Promise<CaregiverScheduledHours> {
    const query = `
      SELECT
        v.id,
        v.scheduled_date,
        v.scheduled_start_time,
        v.scheduled_end_time,
        c.first_name || ' ' || c.last_name as client_name,
        u.first_name || ' ' || u.last_name as caregiver_name
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      JOIN users u ON v.assigned_caregiver_id = u.id
      WHERE v.assigned_caregiver_id = $1
        AND v.scheduled_date >= $2
        AND v.scheduled_date <= $3
        AND v.organization_id = $4
        AND v.status NOT IN ('CANCELLED', 'NO_SHOW_CLIENT')
        AND v.is_deleted = false
      ORDER BY v.scheduled_date, v.scheduled_start_time
    `;

    const result = await this.pool.query(query, [
      caregiverId,
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0],
      organizationId,
    ]);

    let totalMinutes = 0;
    const visits: CaregiverScheduledHours['visits'] = [];
    let caregiverName = 'Unknown Caregiver';

    for (const row of result.rows) {
      caregiverName = row.caregiver_name;

      // Calculate duration from start/end times
      const startParts = row.scheduled_start_time.split(':').map(Number);
      const endParts = row.scheduled_end_time.split(':').map(Number);

      const startMinutes = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0);
      const endMinutes = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0);
      const durationMinutes = endMinutes - startMinutes;

      totalMinutes += durationMinutes;

      visits.push({
        id: row.id,
        scheduledDate: row.scheduled_date,
        startTime: row.scheduled_start_time,
        endTime: row.scheduled_end_time,
        durationMinutes,
        clientName: row.client_name,
      });
    }

    return {
      caregiverId,
      caregiverName,
      totalMinutes,
      visitCount: visits.length,
      visits,
    };
  }

  /**
   * Get overtime status for all caregivers in an organization
   * Useful for dashboard/monitoring
   */
  async getOrganizationOvertimeStatus(
    organizationId: UUID,
    weekDate: Date = new Date(),
    state: string = 'DEFAULT'
  ): Promise<Array<{
    caregiverId: UUID;
    caregiverName: string;
    scheduledHours: number;
    overtimeHours: number;
    status: 'NORMAL' | 'WARNING' | 'OVERTIME';
  }>> {
    const config = STATE_OVERTIME_CONFIGS[state] || STATE_OVERTIME_CONFIGS.DEFAULT!;
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 0 });

    const query = `
      SELECT
        u.id as caregiver_id,
        u.first_name || ' ' || u.last_name as caregiver_name,
        COALESCE(
          SUM(
            EXTRACT(EPOCH FROM (
              (v.scheduled_date + v.scheduled_end_time::time) -
              (v.scheduled_date + v.scheduled_start_time::time)
            )) / 60
          ),
          0
        ) as total_minutes
      FROM users u
      LEFT JOIN visits v ON v.assigned_caregiver_id = u.id
        AND v.scheduled_date >= $2
        AND v.scheduled_date <= $3
        AND v.organization_id = $1
        AND v.status NOT IN ('CANCELLED', 'NO_SHOW_CLIENT')
        AND v.is_deleted = false
      WHERE u.organization_id = $1
        AND u.role = 'caregiver'
        AND u.is_deleted = false
      GROUP BY u.id, u.first_name, u.last_name
      HAVING COALESCE(
        SUM(
          EXTRACT(EPOCH FROM (
            (v.scheduled_date + v.scheduled_end_time::time) -
            (v.scheduled_date + v.scheduled_start_time::time)
          )) / 60
        ),
        0
      ) > 0
      ORDER BY total_minutes DESC
    `;

    const result = await this.pool.query(query, [
      organizationId,
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0],
    ]);

    return result.rows.map((row) => {
      const scheduledHours = row.total_minutes / 60;
      const overtimeHours = Math.max(0, scheduledHours - config.weeklyThreshold);

      let status: 'NORMAL' | 'WARNING' | 'OVERTIME' = 'NORMAL';
      if (scheduledHours > config.weeklyThreshold) {
        status = 'OVERTIME';
      } else if (scheduledHours >= config.warningThreshold) {
        status = 'WARNING';
      }

      return {
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_name,
        scheduledHours: Math.round(scheduledHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        status,
      };
    });
  }

  /**
   * Generate alert based on overtime status
   */
  private generateAlert(
    currentHours: number,
    projectedHours: number,
    config: OvertimeConfig,
    caregiverName: string
  ): OvertimeAlert | null {
    // No alert needed
    if (projectedHours < config.warningThreshold) {
      return null;
    }

    // Already in overtime and would add more
    if (currentHours > config.weeklyThreshold) {
      const additionalOT = projectedHours - currentHours;
      return {
        severity: 'CRITICAL',
        title: 'Additional Overtime',
        message: `${caregiverName} is already in overtime. This visit would add ${additionalOT.toFixed(1)} more overtime hours.`,
        details: {
          currentHours: Math.round(currentHours * 100) / 100,
          proposedHours: Math.round(projectedHours * 100) / 100,
          threshold: config.weeklyThreshold,
          overtimeHours: Math.round((projectedHours - config.weeklyThreshold) * 100) / 100,
        },
        suggestions: [
          'Consider assigning to a different caregiver',
          'Review if overtime is approved for this caregiver',
          'Check if the visit can be rescheduled to next week',
        ],
      };
    }

    // Would trigger overtime
    if (projectedHours > config.weeklyThreshold) {
      const overtimeHours = projectedHours - config.weeklyThreshold;
      return {
        severity: 'WARNING',
        title: 'Overtime Warning',
        message: `Assigning this visit would push ${caregiverName} into overtime by ${overtimeHours.toFixed(1)} hours.`,
        details: {
          currentHours: Math.round(currentHours * 100) / 100,
          proposedHours: Math.round(projectedHours * 100) / 100,
          threshold: config.weeklyThreshold,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
        },
        suggestions: [
          'Consider assigning to another caregiver with availability',
          'Get supervisor approval for overtime',
          'Review weekly schedule for optimization opportunities',
        ],
      };
    }

    // Approaching overtime (warning threshold)
    const remainingHours = config.weeklyThreshold - projectedHours;
    return {
      severity: 'INFO',
      title: 'Approaching Overtime',
      message: `${caregiverName} will have ${remainingHours.toFixed(1)} hours remaining before overtime this week.`,
      details: {
        currentHours: Math.round(currentHours * 100) / 100,
        proposedHours: Math.round(projectedHours * 100) / 100,
        threshold: config.weeklyThreshold,
        overtimeHours: 0,
      },
      suggestions: [
        'Monitor upcoming assignments closely',
        'Consider distributing remaining hours among other caregivers',
      ],
    };
  }

  /**
   * Get overtime configuration for a state
   */
  getOvertimeConfig(state: string): OvertimeConfig {
    return STATE_OVERTIME_CONFIGS[state] || STATE_OVERTIME_CONFIGS.DEFAULT!;
  }
}
