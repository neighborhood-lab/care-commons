/**
 * Burnout Repository - Data Access Layer
 *
 * Queries caregiver work patterns, EVV compliance, and performance data
 * to support burnout risk calculation.
 *
 * Uses Database class (pg Pool-based) from @folkcare/core.
 */

import type { Database } from '@folkcare/core';
import type {
  DateRange,
  BurnoutIndicators,
  BurnoutSnapshot,
  BurnoutRiskLevel,
} from '../types/burnout.js';

export class BurnoutRepository {
  constructor(private db: Database) {}

  /**
   * Get caregiver's work hours and patterns over a date range
   */
  async getCaregiverWorkloadMetrics(
    caregiverId: string,
    dateRange: DateRange
  ): Promise<{
    avgHoursPerWeek: number;
    weeksExceedingMax: number;
    consecutiveDaysWorked: number;
    totalVisitsAssigned: number;
    maxHoursPerWeek: number;
  }> {
    // Get caregiver's max hours constraint
    const caregiverResult = await this.db.query<{
      max_hours_per_week: number | null;
    }>(
      'SELECT max_hours_per_week FROM caregivers WHERE id = $1 LIMIT 1',
      [caregiverId]
    );

    const caregiver = caregiverResult.rows[0];
    if (!caregiver) {
      throw new Error(`Caregiver ${caregiverId} not found`);
    }

    // Get total hours worked per week
    const weeklyHoursResult = await this.db.query<{
      week_start: Date;
      hours: string;
    }>(
      `SELECT
        date_trunc('week', service_date) as week_start,
        SUM(total_duration) / 60.0 as hours
      FROM evv_records
      WHERE caregiver_id = $1
        AND service_date BETWEEN $2 AND $3
        AND record_status IN ('COMPLETE', 'SUBMITTED')
      GROUP BY date_trunc('week', service_date)
      ORDER BY week_start`,
      [caregiverId, dateRange.startDate, dateRange.endDate]
    );

    const weeklyHours = weeklyHoursResult.rows;
    const weeks = weeklyHours.length;
    const totalHours = weeklyHours.reduce(
      (sum, w) => sum + parseFloat(w.hours),
      0
    );
    const avgHoursPerWeek = weeks > 0 ? totalHours / weeks : 0;

    const maxHours = caregiver.max_hours_per_week || 40;
    const weeksExceedingMax = weeklyHours.filter(
      (w) => parseFloat(w.hours) > maxHours
    ).length;

    // Get consecutive days worked
    const dailyVisitsResult = await this.db.query<{ service_date: Date }>(
      `SELECT service_date
      FROM evv_records
      WHERE caregiver_id = $1
        AND service_date BETWEEN $2 AND $3
        AND record_status IN ('COMPLETE', 'SUBMITTED')
      GROUP BY service_date
      ORDER BY service_date`,
      [caregiverId, dateRange.startDate, dateRange.endDate]
    );

    const consecutiveDaysWorked = this.calculateConsecutiveDays(
      dailyVisitsResult.rows.map((d) => new Date(d.service_date))
    );

    // Get total visits assigned
    const visitCountResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND scheduled_date BETWEEN $2 AND $3`,
      [caregiverId, dateRange.startDate, dateRange.endDate]
    );

    return {
      avgHoursPerWeek,
      weeksExceedingMax,
      consecutiveDaysWorked,
      totalVisitsAssigned: parseInt(visitCountResult.rows[0]?.count || '0'),
      maxHoursPerWeek: maxHours,
    };
  }

  /**
   * Get caregiver reliability metrics (no-shows, cancellations, late arrivals)
   */
  async getCaregiverReliabilityMetrics(
    caregiverId: string,
    dateRange: DateRange
  ): Promise<{
    noShowRate: number;
    cancellationRate: number;
    lateClockInRate: number;
  }> {
    const visitsResult = await this.db.query<{
      id: string;
      status: string;
      scheduled_start_time: Date | null;
      actual_start_time: Date | null;
    }>(
      `SELECT id, status, scheduled_start_time, actual_start_time
      FROM visits
      WHERE assigned_caregiver_id = $1
        AND scheduled_date BETWEEN $2 AND $3`,
      [caregiverId, dateRange.startDate, dateRange.endDate]
    );

    const visits = visitsResult.rows;
    if (visits.length === 0) {
      return { noShowRate: 0, cancellationRate: 0, lateClockInRate: 0 };
    }

    const noShows = visits.filter((v) => v.status === 'NO_SHOW_CAREGIVER').length;
    const cancellations = visits.filter((v) => v.status === 'CANCELLED').length;

    // Calculate late clock-ins (>10 minutes late)
    const completedVisits = visits.filter(
      (v) =>
        v.status === 'COMPLETED' &&
        v.scheduled_start_time &&
        v.actual_start_time
    );

    const lateVisits = completedVisits.filter((v) => {
      const scheduled = new Date(v.scheduled_start_time!);
      const actual = new Date(v.actual_start_time!);
      const minutesLate = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
      return minutesLate > 10;
    }).length;

    return {
      noShowRate: noShows / visits.length,
      cancellationRate: cancellations / visits.length,
      lateClockInRate:
        completedVisits.length > 0 ? lateVisits / completedVisits.length : 0,
    };
  }

  /**
   * Get EVV compliance issue counts
   */
  async getCaregiverComplianceMetrics(
    caregiverId: string,
    dateRange: DateRange
  ): Promise<{
    geofenceViolationCount: number;
    manualOverrideCount: number;
    missedClockOutCount: number;
    lateSubmissionRate: number;
  }> {
    const evvRecordsResult = await this.db.query<{
      compliance_flags: string[] | null;
      record_status: string;
      created_at: Date;
      service_date: Date;
    }>(
      `SELECT compliance_flags, record_status, created_at, service_date
      FROM evv_records
      WHERE caregiver_id = $1
        AND service_date BETWEEN $2 AND $3`,
      [caregiverId, dateRange.startDate, dateRange.endDate]
    );

    const evvRecords = evvRecordsResult.rows;
    if (evvRecords.length === 0) {
      return {
        geofenceViolationCount: 0,
        manualOverrideCount: 0,
        missedClockOutCount: 0,
        lateSubmissionRate: 0,
      };
    }

    let geofenceViolations = 0;
    let manualOverrides = 0;
    let missedClockOuts = 0;
    let lateSubmissions = 0;

    for (const record of evvRecords) {
      const flags = record.compliance_flags || [];

      if (flags.includes('GEOFENCE_VIOLATION')) geofenceViolations++;
      if (flags.includes('MANUAL_OVERRIDE')) manualOverrides++;
      if (flags.includes('MISSED_CLOCK_OUT')) missedClockOuts++;

      // Late submission: EVV record created >24 hours after service date
      if (record.created_at && record.service_date) {
        const serviceDate = new Date(record.service_date);
        const createdDate = new Date(record.created_at);
        const hoursDiff =
          (createdDate.getTime() - serviceDate.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) lateSubmissions++;
      }
    }

    return {
      geofenceViolationCount: geofenceViolations,
      manualOverrideCount: manualOverrides,
      missedClockOutCount: missedClockOuts,
      lateSubmissionRate: lateSubmissions / evvRecords.length,
    };
  }

  /**
   * Get caregiver performance trends
   */
  async getCaregiverPerformanceTrends(
    caregiverId: string,
    currentRange: DateRange,
    priorRange: DateRange
  ): Promise<{
    performanceTrendPercentage: number;
    complianceTrendPercentage: number;
    currentPerformanceRating: number;
  }> {
    // Get current period compliance rate
    const currentCompliance = await this.calculateComplianceRate(
      caregiverId,
      currentRange
    );

    // Get prior period compliance rate
    const priorCompliance = await this.calculateComplianceRate(
      caregiverId,
      priorRange
    );

    // Calculate percentage change
    const complianceTrendPercentage =
      priorCompliance > 0
        ? ((currentCompliance - priorCompliance) / priorCompliance) * 100
        : 0;

    // Get current performance rating
    const caregiverResult = await this.db.query<{
      performance_rating: number | null;
    }>('SELECT performance_rating FROM caregivers WHERE id = $1 LIMIT 1', [
      caregiverId,
    ]);

    const currentPerformanceRating =
      caregiverResult.rows[0]?.performance_rating || 3;

    // Performance trend based on rating (simplified - could be more sophisticated)
    // Negative trend if rating < 3, positive if > 3, neutral if = 3
    const performanceTrendPercentage = (currentPerformanceRating - 3) * 10;

    return {
      performanceTrendPercentage,
      complianceTrendPercentage,
      currentPerformanceRating,
    };
  }

  /**
   * Get external compliance factors (expiring credentials, overdue training)
   */
  async getCaregiverExternalFactors(caregiverId: string): Promise<{
    credentialsExpiringCount: number;
    trainingOverdueCount: number;
  }> {
    const caregiverResult = await this.db.query<{
      credentials: Array<{ expirationDate?: string }> | null;
      training: Array<{
        dueDate?: string;
        completedAt?: string;
      }> | null;
    }>('SELECT credentials, training FROM caregivers WHERE id = $1 LIMIT 1', [
      caregiverId,
    ]);

    const caregiver = caregiverResult.rows[0];
    const credentials = caregiver?.credentials || [];
    const training = caregiver?.training || [];

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    // Count credentials expiring in next 30 days
    const credentialsExpiringCount = credentials.filter((cred) => {
      if (!cred.expirationDate) return false;
      const expDate = new Date(cred.expirationDate);
      return expDate >= now && expDate <= thirtyDaysFromNow;
    }).length;

    // Count overdue trainings
    const trainingOverdueCount = training.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now && !t.completedAt;
    }).length;

    return {
      credentialsExpiringCount,
      trainingOverdueCount,
    };
  }

  /**
   * Get all burnout indicators for a caregiver in one call
   */
  async getCaregiverBurnoutIndicators(
    caregiverId: string,
    currentRange: DateRange,
    priorRange: DateRange
  ): Promise<BurnoutIndicators> {
    // Run queries in parallel for performance
    const [workload, reliability, compliance, performance, external] =
      await Promise.all([
        this.getCaregiverWorkloadMetrics(caregiverId, currentRange),
        this.getCaregiverReliabilityMetrics(caregiverId, currentRange),
        this.getCaregiverComplianceMetrics(caregiverId, currentRange),
        this.getCaregiverPerformanceTrends(
          caregiverId,
          currentRange,
          priorRange
        ),
        this.getCaregiverExternalFactors(caregiverId),
      ]);

    return {
      // Workload
      avgHoursPerWeek: workload.avgHoursPerWeek,
      weeksExceedingMax: workload.weeksExceedingMax,
      consecutiveDaysWorked: workload.consecutiveDaysWorked,
      totalVisitsAssigned: workload.totalVisitsAssigned,

      // Reliability
      noShowRate: reliability.noShowRate,
      cancellationRate: reliability.cancellationRate,
      lateClockInRate: reliability.lateClockInRate,

      // Compliance
      geofenceViolationCount: compliance.geofenceViolationCount,
      manualOverrideCount: compliance.manualOverrideCount,
      missedClockOutCount: compliance.missedClockOutCount,
      lateSubmissionRate: compliance.lateSubmissionRate,

      // Performance
      performanceTrendPercentage: performance.performanceTrendPercentage,
      complianceTrendPercentage: performance.complianceTrendPercentage,
      currentPerformanceRating: performance.currentPerformanceRating,

      // External
      credentialsExpiringCount: external.credentialsExpiringCount,
      trainingOverdueCount: external.trainingOverdueCount,
    };
  }

  /**
   * Save burnout risk snapshot for historical trending
   */
  async saveBurnoutSnapshot(
    caregiverId: string,
    organizationId: string,
    riskScore: number,
    riskLevel: string,
    indicators: BurnoutIndicators
  ): Promise<string> {
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO caregiver_burnout_snapshots
        (id, caregiver_id, organization_id, snapshot_date, risk_score, risk_level, indicators, created_at)
      VALUES
        (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        caregiverId,
        organizationId,
        new Date(),
        riskScore,
        riskLevel,
        JSON.stringify(indicators),
        new Date(),
      ]
    );

    return result.rows[0]!.id;
  }

  /**
   * Get historical burnout snapshots for trending
   */
  async getBurnoutSnapshots(
    caregiverId: string,
    limit: number = 12
  ): Promise<BurnoutSnapshot[]> {
    const result = await this.db.query<{
      id: string;
      caregiver_id: string;
      organization_id: string;
      snapshot_date: Date;
      risk_score: string;
      risk_level: string;
      indicators: string;
    }>(
      `SELECT * FROM caregiver_burnout_snapshots
      WHERE caregiver_id = $1
      ORDER BY snapshot_date DESC
      LIMIT $2`,
      [caregiverId, limit]
    );

    return result.rows.map((row) => ({
      snapshotId: row.id,
      caregiverId: row.caregiver_id,
      organizationId: row.organization_id,
      snapshotDate: row.snapshot_date,
      riskScore: parseFloat(row.risk_score),
      riskLevel: row.risk_level as BurnoutRiskLevel,
      indicators: JSON.parse(row.indicators) as BurnoutIndicators,
    }));
  }

  /**
   * Get all caregivers in an organization for batch processing
   */
  async getOrganizationCaregivers(
    organizationId: string
  ): Promise<Array<{ caregiverId: string; caregiverName: string }>> {
    const result = await this.db.query<{
      caregiverid: string;
      caregivername: string;
    }>(
      `SELECT
        id as caregiverId,
        first_name || ' ' || last_name as caregiverName
      FROM caregivers
      WHERE organization_id = $1
        AND is_deleted = false
        AND employment_status = 'ACTIVE'`,
      [organizationId]
    );

    return result.rows.map((row) => ({
      caregiverId: row.caregiverid,
      caregiverName: row.caregivername,
    }));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate consecutive days worked from array of dates
   */
  private calculateConsecutiveDays(dates: Date[]): number {
    if (dates.length === 0) return 0;

    // Create sorted copy to avoid mutation
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];

      if (!prevDate || !currDate) continue;

      const daysDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (daysDiff > 1) {
        currentStreak = 1;
      }
      // If daysDiff === 0 (same day), keep current streak
    }

    return maxStreak;
  }

  /**
   * Calculate EVV compliance rate for a caregiver in a date range
   */
  private async calculateComplianceRate(
    caregiverId: string,
    dateRange: DateRange
  ): Promise<number> {
    const result = await this.db.query<{
      compliance_flags: string[] | null;
    }>(
      `SELECT compliance_flags FROM evv_records
      WHERE caregiver_id = $1
        AND service_date BETWEEN $2 AND $3`,
      [caregiverId, dateRange.startDate, dateRange.endDate]
    );

    const records = result.rows;
    if (records.length === 0) return 1.0; // Perfect compliance if no records

    const compliantRecords = records.filter(
      (r) => !r.compliance_flags || r.compliance_flags.length === 0
    ).length;

    return compliantRecords / records.length;
  }
}
