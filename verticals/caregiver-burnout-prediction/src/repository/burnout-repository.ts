/**
 * Burnout Repository - Data Access Layer
 *
 * Queries caregiver work patterns, EVV compliance, and performance data
 * to support burnout risk calculation.
 */

import type { Knex } from 'knex';
import type {
  UUID,
  DateRange,
  BurnoutIndicators,
  BurnoutSnapshot,
} from '../types/burnout.js';

export class BurnoutRepository {
  constructor(private db: Knex) {}

  /**
   * Get caregiver's work hours and patterns over a date range
   */
  async getCaregiverWorkloadMetrics(
    caregiverId: UUID,
    dateRange: DateRange
  ): Promise<{
    avgHoursPerWeek: number;
    weeksExceedingMax: number;
    consecutiveDaysWorked: number;
    totalVisitsAssigned: number;
    maxHoursPerWeek: number;
  }> {
    // Get caregiver's max hours constraint
    const caregiver = await this.db('caregivers')
      .where({ id: caregiverId })
      .first('max_hours_per_week');

    if (!caregiver) {
      throw new Error(`Caregiver ${caregiverId} not found`);
    }

    // Get total hours worked per week
    const weeklyHours = await this.db('evv_records')
      .select(
        this.db.raw(
          "date_trunc('week', service_date) as week_start"
        ),
        this.db.raw('SUM(total_duration) / 60.0 as hours')
      )
      .where({ caregiver_id: caregiverId })
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate])
      .whereIn('record_status', ['COMPLETE', 'SUBMITTED'])
      .groupByRaw("date_trunc('week', service_date)")
      .orderBy('week_start');

    const weeks = weeklyHours.length;
    const totalHours = weeklyHours.reduce((sum: number, w: any) => sum + parseFloat(w.hours), 0);
    const avgHoursPerWeek = weeks > 0 ? totalHours / weeks : 0;

    const maxHours = caregiver.max_hours_per_week || 40;
    const weeksExceedingMax = weeklyHours.filter(
      (w: any) => parseFloat(w.hours) > maxHours
    ).length;

    // Get consecutive days worked
    const dailyVisits = await this.db('evv_records')
      .select('service_date')
      .where({ caregiver_id: caregiverId })
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate])
      .whereIn('record_status', ['COMPLETE', 'SUBMITTED'])
      .groupBy('service_date')
      .orderBy('service_date');

    const consecutiveDaysWorked = this.calculateConsecutiveDays(
      dailyVisits.map((d: any) => new Date(d.service_date))
    );

    // Get total visits assigned
    const visitCount = await this.db('visits')
      .where({ assigned_caregiver_id: caregiverId })
      .whereBetween('scheduled_date', [dateRange.startDate, dateRange.endDate])
      .count('* as count')
      .first();

    return {
      avgHoursPerWeek,
      weeksExceedingMax,
      consecutiveDaysWorked,
      totalVisitsAssigned: parseInt(visitCount?.count as string) || 0,
      maxHoursPerWeek: maxHours,
    };
  }

  /**
   * Get caregiver reliability metrics (no-shows, cancellations, late arrivals)
   */
  async getCaregiverReliabilityMetrics(
    caregiverId: UUID,
    dateRange: DateRange
  ): Promise<{
    noShowRate: number;
    cancellationRate: number;
    lateClockInRate: number;
  }> {
    const visits = await this.db('visits')
      .where({ assigned_caregiver_id: caregiverId })
      .whereBetween('scheduled_date', [dateRange.startDate, dateRange.endDate])
      .select('id', 'status', 'scheduled_start_time', 'actual_start_time');

    if (visits.length === 0) {
      return { noShowRate: 0, cancellationRate: 0, lateClockInRate: 0 };
    }

    const noShows = visits.filter((v: any) => v.status === 'NO_SHOW_CAREGIVER').length;
    const cancellations = visits.filter((v: any) => v.status === 'CANCELLED').length;

    // Calculate late clock-ins (>10 minutes late)
    const completedVisits = visits.filter((v: any) =>
      v.status === 'COMPLETED' && v.scheduled_start_time && v.actual_start_time
    );

    const lateVisits = completedVisits.filter((v: any) => {
      const scheduled = new Date(v.scheduled_start_time);
      const actual = new Date(v.actual_start_time);
      const minutesLate = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
      return minutesLate > 10;
    }).length;

    return {
      noShowRate: noShows / visits.length,
      cancellationRate: cancellations / visits.length,
      lateClockInRate: completedVisits.length > 0 ? lateVisits / completedVisits.length : 0,
    };
  }

  /**
   * Get EVV compliance issue counts
   */
  async getCaregiverComplianceMetrics(
    caregiverId: UUID,
    dateRange: DateRange
  ): Promise<{
    geofenceViolationCount: number;
    manualOverrideCount: number;
    missedClockOutCount: number;
    lateSubmissionRate: number;
  }> {
    const evvRecords = await this.db('evv_records')
      .where({ caregiver_id: caregiverId })
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate])
      .select('compliance_flags', 'record_status', 'created_at', 'service_date');

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
        const hoursDiff = (createdDate.getTime() - serviceDate.getTime()) / (1000 * 60 * 60);
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
    caregiverId: UUID,
    currentRange: DateRange,
    priorRange: DateRange
  ): Promise<{
    performanceTrendPercentage: number;
    complianceTrendPercentage: number;
    currentPerformanceRating: number;
  }> {
    // Get current period compliance rate
    const currentCompliance = await this.calculateComplianceRate(caregiverId, currentRange);

    // Get prior period compliance rate
    const priorCompliance = await this.calculateComplianceRate(caregiverId, priorRange);

    // Calculate percentage change
    const complianceTrendPercentage = priorCompliance > 0
      ? ((currentCompliance - priorCompliance) / priorCompliance) * 100
      : 0;

    // Get current performance rating
    const caregiver = await this.db('caregivers')
      .where({ id: caregiverId })
      .first('performance_rating');

    const currentPerformanceRating = caregiver?.performance_rating || 3;

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
  async getCaregiverExternalFactors(
    caregiverId: UUID
  ): Promise<{
    credentialsExpiringCount: number;
    trainingOverdueCount: number;
  }> {
    const caregiver = await this.db('caregivers')
      .where({ id: caregiverId })
      .first('credentials', 'training');

    const credentials = caregiver?.credentials || [];
    const training = caregiver?.training || [];

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Count credentials expiring in next 30 days
    const credentialsExpiringCount = credentials.filter((cred: any) => {
      if (!cred.expirationDate) return false;
      const expDate = new Date(cred.expirationDate);
      return expDate >= now && expDate <= thirtyDaysFromNow;
    }).length;

    // Count overdue trainings
    const trainingOverdueCount = training.filter((t: any) => {
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
    caregiverId: UUID,
    currentRange: DateRange,
    priorRange: DateRange
  ): Promise<BurnoutIndicators> {
    // Run queries in parallel for performance
    const [workload, reliability, compliance, performance, external] = await Promise.all([
      this.getCaregiverWorkloadMetrics(caregiverId, currentRange),
      this.getCaregiverReliabilityMetrics(caregiverId, currentRange),
      this.getCaregiverComplianceMetrics(caregiverId, currentRange),
      this.getCaregiverPerformanceTrends(caregiverId, currentRange, priorRange),
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
    caregiverId: UUID,
    organizationId: UUID,
    riskScore: number,
    riskLevel: string,
    indicators: BurnoutIndicators
  ): Promise<UUID> {
    const [row] = await this.db('caregiver_burnout_snapshots')
      .insert({
        id: this.db.raw('gen_random_uuid()'),
        caregiver_id: caregiverId,
        organization_id: organizationId,
        snapshot_date: new Date(),
        risk_score: riskScore,
        risk_level: riskLevel,
        indicators: JSON.stringify(indicators),
        created_at: new Date(),
      })
      .returning('id');

    return row.id;
  }

  /**
   * Get historical burnout snapshots for trending
   */
  async getBurnoutSnapshots(
    caregiverId: UUID,
    limit: number = 12
  ): Promise<BurnoutSnapshot[]> {
    const rows = await this.db('caregiver_burnout_snapshots')
      .where({ caregiver_id: caregiverId })
      .orderBy('snapshot_date', 'desc')
      .limit(limit)
      .select('*');

    return rows.map((row: any) => ({
      snapshotId: row.id,
      caregiverId: row.caregiver_id,
      organizationId: row.organization_id,
      snapshotDate: row.snapshot_date,
      riskScore: parseFloat(row.risk_score),
      riskLevel: row.risk_level,
      indicators: JSON.parse(row.indicators),
    }));
  }

  /**
   * Get all caregivers in an organization for batch processing
   */
  async getOrganizationCaregivers(organizationId: UUID): Promise<
    Array<{ caregiverId: UUID; caregiverName: string }>
  > {
    const rows = await this.db('caregivers')
      .where({
        organization_id: organizationId,
        is_deleted: false,
        employment_status: 'ACTIVE',
      })
      .select('id as caregiverId', this.db.raw("first_name || ' ' || last_name as caregiverName"));

    return rows;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate consecutive days worked from array of dates
   */
  private calculateConsecutiveDays(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
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
    caregiverId: UUID,
    dateRange: DateRange
  ): Promise<number> {
    const records = await this.db('evv_records')
      .where({ caregiver_id: caregiverId })
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate])
      .select('compliance_flags');

    if (records.length === 0) return 1.0; // Perfect compliance if no records

    const compliantRecords = records.filter(
      (r: any) => !r.compliance_flags || r.compliance_flags.length === 0
    ).length;

    return compliantRecords / records.length;
  }
}
