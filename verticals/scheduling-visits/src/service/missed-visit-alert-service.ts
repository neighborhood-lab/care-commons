/**
 * Missed Visit Alert Service
 *
 * CRITICAL EVV COMPLIANCE FEATURE: Real-time monitoring for missed clock-ins.
 * When caregivers don't clock in within a grace period after scheduled start time,
 * coordinators get immediate alerts to take action.
 *
 * Why This Matters:
 * - Missed visits = serious client safety risk
 * - EVV compliance requires proof of service delivery
 * - Quick intervention prevents billing denials
 * - Builds trust with clients and families
 *
 * Detection Logic:
 * - Grace period: 15 minutes after scheduled start time (configurable)
 * - Only alerts for SCHEDULED or ASSIGNED visits
 * - Ignores already-started, cancelled, or completed visits
 * - Creates visit_exceptions record for audit trail
 * - Sends multi-channel notifications (Discord, Email, SMS)
 *
 * Key Principles:
 * - FAIL FAST: Throw errors immediately, no silent failures
 * - Real-time: Runs every 5 minutes via background job
 * - Idempotent: Safe to run multiple times
 * - Audit trail: All alerts logged in visit_exceptions
 */

import { Database } from '@folkcare/core';

export interface MissedVisitAlert {
  id: string;
  visitId: string;
  visitNumber: string;
  clientId: string;
  clientName: string;
  caregiverId: string | null;
  caregiverName: string | null;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  minutesOverdue: number;
  detectedAt: Date;
  exceptionId: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface MissedVisitStats {
  totalMissed: number;
  openAlerts: number;
  resolvedAlerts: number;
  averageResponseTimeMinutes: number;
  byBranch: Record<string, number>;
  bySeverity: {
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export class MissedVisitAlertService {
  constructor(private db: Database) {}

  /**
   * Scan for missed visits and create alerts
   *
   * Grace periods:
   * - 0-15 min late: No alert (within grace period)
   * - 15-30 min late: MEDIUM severity
   * - 30-60 min late: HIGH severity
   * - 60+ min late: CRITICAL severity
   *
   * Returns: Number of new alerts created
   */
  async detectMissedVisits(organizationId: string, gracePeriodMinutes: number = 15): Promise<number> {
    if (!organizationId) {
      throw new Error('MISSED_VISIT_ALERT: organizationId is required');
    }

    if (gracePeriodMinutes < 0 || gracePeriodMinutes > 120) {
      throw new Error('MISSED_VISIT_ALERT: gracePeriodMinutes must be between 0 and 120');
    }

    const now = new Date();

    // Find visits that should have started but have no clock-in
    const missedVisits = await this.db.query<{
      id: string;
      visit_number: string;
      client_id: string;
      client_name: string;
      assigned_caregiver_id: string | null;
      caregiver_name: string | null;
      scheduled_date: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
      address: Record<string, unknown>;
      scheduled_datetime: Date;
      minutes_overdue: number;
    }>(
      `
      SELECT
        v.id,
        v.visit_number,
        v.client_id,
        c.first_name || ' ' || c.last_name AS client_name,
        v.assigned_caregiver_id,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        v.scheduled_date::text,
        v.scheduled_start_time::text,
        v.scheduled_end_time::text,
        v.address,
        (v.scheduled_date || ' ' || v.scheduled_start_time)::timestamp AS scheduled_datetime,
        EXTRACT(EPOCH FROM (NOW() - (v.scheduled_date || ' ' || v.scheduled_start_time)::timestamp)) / 60 AS minutes_overdue
      FROM visits v
      INNER JOIN clients c ON c.id = v.client_id
      LEFT JOIN caregivers cg ON cg.id = v.assigned_caregiver_id
      WHERE v.organization_id = $1
        AND v.deleted_at IS NULL
        AND v.status IN ('SCHEDULED', 'ASSIGNED')
        AND v.actual_start_time IS NULL
        AND (v.scheduled_date || ' ' || v.scheduled_start_time)::timestamp < (NOW() - INTERVAL '1 minute' * $2)
        AND NOT EXISTS (
          SELECT 1 FROM visit_exceptions ve
          WHERE ve.visit_id = v.id
            AND ve.exception_type = 'NO_SHOW_CAREGIVER'
            AND ve.status IN ('OPEN', 'IN_PROGRESS')
        )
      ORDER BY scheduled_datetime ASC
      LIMIT 100
      `,
      [organizationId, gracePeriodMinutes]
    );

    if (missedVisits.rows.length === 0) {
      return 0;
    }

    let alertsCreated = 0;

    for (const visit of missedVisits.rows) {
      const minutesOverdue = Math.floor(visit.minutes_overdue);

      // Determine severity based on how late
      let severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (minutesOverdue >= 60) {
        severity = 'CRITICAL';
      } else if (minutesOverdue >= 30) {
        severity = 'HIGH';
      } else {
        severity = 'MEDIUM';
      }

      const description = visit.caregiver_name
        ? `Caregiver ${visit.caregiver_name} missed clock-in for visit ${visit.visit_number}. ` +
          `Scheduled start: ${visit.scheduled_start_time}. ` +
          `Currently ${minutesOverdue} minutes overdue. ` +
          `Client: ${visit.client_name}`
        : `Visit ${visit.visit_number} has no assigned caregiver and is ${minutesOverdue} minutes past scheduled start time. ` +
          `Client: ${visit.client_name}`;

      // Create visit exception record
      const exceptionResult = await this.db.query<{ id: string }>(
        `
        INSERT INTO visit_exceptions (
          visit_id,
          client_id,
          caregiver_id,
          exception_type,
          severity,
          detected_at,
          automatic,
          description,
          requires_followup,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
        `,
        [
          visit.id,
          visit.client_id,
          visit.assigned_caregiver_id,
          'NO_SHOW_CAREGIVER',
          severity,
          now,
          true, // automatic detection
          description,
          true, // requires followup
          'OPEN'
        ]
      );

      if (exceptionResult.rows.length > 0) {
        alertsCreated++;
      }
    }

    return alertsCreated;
  }

  /**
   * Get all active missed visit alerts for an organization
   */
  async getActiveAlerts(organizationId: string, branchId?: string): Promise<MissedVisitAlert[]> {
    if (!organizationId) {
      throw new Error('MISSED_VISIT_ALERT: organizationId is required');
    }

    const params: (string | number)[] = [organizationId];
    let branchFilter = '';

    if (branchId) {
      params.push(branchId);
      branchFilter = 'AND v.branch_id = $2';
    }

    type AlertRow = {
      exception_id: string;
      visit_id: string;
      visit_number: string;
      client_id: string;
      client_name: string;
      caregiver_id: string | null;
      caregiver_name: string | null;
      scheduled_date: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
      address: Record<string, unknown>;
      minutes_overdue: number;
      detected_at: Date;
      severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
      status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    };

    const result = await this.db.query<AlertRow>(
      `
      SELECT
        ve.id AS exception_id,
        v.id AS visit_id,
        v.visit_number,
        v.client_id,
        c.first_name || ' ' || c.last_name AS client_name,
        v.assigned_caregiver_id AS caregiver_id,
        cg.first_name || ' ' || cg.last_name AS caregiver_name,
        v.scheduled_date::text,
        v.scheduled_start_time::text,
        v.scheduled_end_time::text,
        v.address,
        EXTRACT(EPOCH FROM (NOW() - (v.scheduled_date || ' ' || v.scheduled_start_time)::timestamp)) / 60 AS minutes_overdue,
        ve.detected_at,
        ve.severity,
        ve.status
      FROM visit_exceptions ve
      INNER JOIN visits v ON v.id = ve.visit_id
      INNER JOIN clients c ON c.id = v.client_id
      LEFT JOIN caregivers cg ON cg.id = v.assigned_caregiver_id
      WHERE v.organization_id = $1
        ${branchFilter}
        AND ve.exception_type = 'NO_SHOW_CAREGIVER'
        AND ve.status IN ('OPEN', 'IN_PROGRESS')
        AND v.deleted_at IS NULL
      ORDER BY ve.severity DESC, ve.detected_at ASC
      `,
      params
    );

    return result.rows.map((row: AlertRow): MissedVisitAlert => ({
      id: row.exception_id,
      visitId: row.visit_id,
      visitNumber: row.visit_number,
      clientId: row.client_id,
      clientName: row.client_name,
      caregiverId: row.caregiver_id,
      caregiverName: row.caregiver_name,
      scheduledDate: row.scheduled_date,
      scheduledStartTime: row.scheduled_start_time,
      scheduledEndTime: row.scheduled_end_time,
      address: row.address as { street: string; city: string; state: string; zip: string },
      minutesOverdue: Math.floor(row.minutes_overdue),
      detectedAt: row.detected_at,
      exceptionId: row.exception_id,
      severity: row.severity,
      status: row.status
    }));
  }

  /**
   * Resolve a missed visit alert
   */
  async resolveAlert(
    exceptionId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<void> {
    if (!exceptionId || !resolution || !resolvedBy) {
      throw new Error('MISSED_VISIT_ALERT: exceptionId, resolution, and resolvedBy are required');
    }

    const result = await this.db.query(
      `
      UPDATE visit_exceptions
      SET
        status = 'RESOLVED',
        resolution = $1,
        resolved_at = NOW(),
        resolved_by = $2,
        updated_at = NOW()
      WHERE id = $3
        AND exception_type = 'NO_SHOW_CAREGIVER'
      RETURNING id
      `,
      [resolution, resolvedBy, exceptionId]
    );

    if (result.rowCount === 0) {
      throw new Error(`MISSED_VISIT_ALERT: Exception ${exceptionId} not found or already resolved`);
    }
  }

  /**
   * Mark alert as in progress (coordinator is addressing it)
   */
  async markInProgress(exceptionId: string, assignedTo: string): Promise<void> {
    if (!exceptionId || !assignedTo) {
      throw new Error('MISSED_VISIT_ALERT: exceptionId and assignedTo are required');
    }

    const result = await this.db.query(
      `
      UPDATE visit_exceptions
      SET
        status = 'IN_PROGRESS',
        followup_assigned_to = $1,
        updated_at = NOW()
      WHERE id = $2
        AND exception_type = 'NO_SHOW_CAREGIVER'
        AND status = 'OPEN'
      RETURNING id
      `,
      [assignedTo, exceptionId]
    );

    if (result.rowCount === 0) {
      throw new Error(`MISSED_VISIT_ALERT: Exception ${exceptionId} not found or not in OPEN status`);
    }
  }

  /**
   * Get statistics on missed visits for reporting
   */
  async getStats(organizationId: string, startDate: Date, endDate: Date): Promise<MissedVisitStats> {
    if (!organizationId || !startDate || !endDate) {
      throw new Error('MISSED_VISIT_ALERT: organizationId, startDate, and endDate are required');
    }

    if (startDate > endDate) {
      throw new Error('MISSED_VISIT_ALERT: startDate must be before endDate');
    }

    const result = await this.db.query<{
      total_missed: string;
      open_alerts: string;
      resolved_alerts: string;
      avg_response_minutes: string;
      branch_stats: Record<string, number>;
      severity_stats: { MEDIUM: number; HIGH: number; CRITICAL: number };
    }>(
      `
      SELECT
        COUNT(*) AS total_missed,
        COUNT(*) FILTER (WHERE ve.status IN ('OPEN', 'IN_PROGRESS')) AS open_alerts,
        COUNT(*) FILTER (WHERE ve.status = 'RESOLVED') AS resolved_alerts,
        AVG(EXTRACT(EPOCH FROM (ve.resolved_at - ve.detected_at)) / 60) FILTER (WHERE ve.resolved_at IS NOT NULL) AS avg_response_minutes,
        jsonb_object_agg(
          COALESCE(v.branch_id::text, 'unassigned'),
          COUNT(*) FILTER (WHERE v.branch_id IS NOT NULL)
        ) AS branch_stats,
        jsonb_build_object(
          'MEDIUM', COUNT(*) FILTER (WHERE ve.severity = 'MEDIUM'),
          'HIGH', COUNT(*) FILTER (WHERE ve.severity = 'HIGH'),
          'CRITICAL', COUNT(*) FILTER (WHERE ve.severity = 'CRITICAL')
        ) AS severity_stats
      FROM visit_exceptions ve
      INNER JOIN visits v ON v.id = ve.visit_id
      WHERE v.organization_id = $1
        AND ve.exception_type = 'NO_SHOW_CAREGIVER'
        AND ve.detected_at BETWEEN $2 AND $3
      `,
      [organizationId, startDate, endDate]
    );

    const row = result.rows[0];

    if (!row) {
      // No data - return zeros
      return {
        totalMissed: 0,
        openAlerts: 0,
        resolvedAlerts: 0,
        averageResponseTimeMinutes: 0,
        byBranch: {},
        bySeverity: { MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
      };
    }

    return {
      totalMissed: parseInt(row.total_missed, 10),
      openAlerts: parseInt(row.open_alerts, 10),
      resolvedAlerts: parseInt(row.resolved_alerts, 10),
      averageResponseTimeMinutes: parseFloat(row.avg_response_minutes || '0'),
      byBranch: row.branch_stats || {},
      bySeverity: row.severity_stats || { MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    };
  }
}
