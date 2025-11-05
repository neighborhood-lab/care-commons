/**
 * Analytics Service - Business logic for operational metrics and KPIs
 */

import { Database, UserContext } from '@care-commons/core';
import { AnalyticsRepository } from '../repository/analytics-repository';
import {
  OperationalKPIs,
  DateRange,
  ComplianceAlert,
  CaregiverPerformance,
  AnalyticsQueryOptions,
  RevenueTrendDataPoint,
  VisitException,
  DashboardStats,
} from '../types/analytics';

export class AnalyticsService {
  private repository: AnalyticsRepository;

  constructor(database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Get operational KPIs for dashboard
   */
  async getOperationalKPIs(
    options: AnalyticsQueryOptions,
    context: UserContext
  ): Promise<OperationalKPIs> {
    const { organizationId, branchId, dateRange } = options;

    // Verify user has access to this organization
    this.validateAccess(context, organizationId, branchId);

    // Fetch all metrics in parallel for performance
    const [
      visitMetrics,
      evvMetrics,
      revenueMetrics,
      staffingMetrics,
      clientMetrics,
    ] = await Promise.all([
      this.getVisitMetrics(organizationId, dateRange, branchId),
      this.getEVVComplianceMetrics(organizationId, dateRange, branchId),
      this.getRevenueMetrics(organizationId, dateRange, branchId),
      this.getStaffingMetrics(organizationId, dateRange, branchId),
      this.getClientMetrics(organizationId, dateRange, branchId),
    ]);

    return {
      visits: visitMetrics,
      evvCompliance: evvMetrics,
      revenueMetrics,
      staffing: staffingMetrics,
      clientMetrics,
    };
  }

  /**
   * Get visit metrics
   */
  private async getVisitMetrics(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ) {
    const [scheduled, completed, missed, inProgress] = await Promise.all([
      this.repository.countVisits(orgId, dateRange, ['SCHEDULED', 'CONFIRMED'], branchId),
      this.repository.countVisits(orgId, dateRange, ['COMPLETED'], branchId),
      this.repository.countVisits(orgId, dateRange, ['NO_SHOW', 'CANCELLED'], branchId),
      this.repository.countVisits(orgId, dateRange, ['IN_PROGRESS'], branchId),
    ]);

    const total = scheduled + completed + missed + inProgress;
    const completionRate = total > 0 ? completed / (completed + missed) : 0;

    return {
      scheduled,
      completed,
      missed,
      inProgress,
      completionRate,
    };
  }

  /**
   * Get EVV compliance metrics
   */
  private async getEVVComplianceMetrics(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ) {
    const [compliantVisits, totalVisits, flaggedVisits, pendingReview] =
      await Promise.all([
        this.repository.countCompliantVisits(orgId, dateRange, branchId),
        this.repository.countVisits(orgId, dateRange, ['COMPLETED'], branchId),
        this.repository.countFlaggedVisits(orgId, dateRange, branchId),
        this.repository.countPendingReview(orgId, dateRange, branchId),
      ]);

    const complianceRate = totalVisits > 0 ? compliantVisits / totalVisits : 0;

    return {
      compliantVisits,
      totalVisits,
      complianceRate,
      flaggedVisits,
      pendingReview,
    };
  }

  /**
   * Get revenue metrics
   */
  private async getRevenueMetrics(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ) {
    const [billableHours, billedAmount, paidAmount, outstandingAR] =
      await Promise.all([
        this.repository.sumBillableHours(orgId, dateRange, branchId),
        this.repository.sumBilledAmount(orgId, dateRange, branchId),
        this.repository.sumPaidAmount(orgId, dateRange, branchId),
        this.repository.getOutstandingAR(orgId, branchId),
      ]);

    const averageReimbursementRate =
      billedAmount > 0 ? paidAmount / billedAmount : 0;

    return {
      billableHours,
      billedAmount,
      paidAmount,
      outstandingAR,
      averageReimbursementRate,
    };
  }

  /**
   * Get staffing metrics
   */
  private async getStaffingMetrics(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ) {
    const [activeCaregivers, overtimeHours, credentialExpirations] =
      await Promise.all([
        this.repository.countActiveCaregivers(orgId, branchId),
        this.repository.sumOvertimeHours(orgId, dateRange, branchId),
        this.repository.getExpiringCredentials(orgId, 30, branchId),
      ]);

    // Calculate utilization rate (placeholder - would need more complex logic)
    const billableHours = await this.repository.sumBillableHours(
      orgId,
      dateRange,
      branchId
    );
    const daysInRange = Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const availableHours = activeCaregivers * daysInRange * 8; // 8 hours per day
    const utilizationRate =
      availableHours > 0 ? billableHours / availableHours : 0;

    return {
      activeCaregivers,
      utilizationRate: Math.min(utilizationRate, 1), // Cap at 100%
      overtimeHours,
      credentialExpirations,
    };
  }

  /**
   * Get client metrics
   */
  private async getClientMetrics(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ) {
    const [
      activeClients,
      newClients,
      dischargedClients,
      highRiskClients,
      overdueAssessments,
    ] = await Promise.all([
      this.repository.countActiveClients(orgId, branchId),
      this.repository.countNewClients(orgId, dateRange, branchId),
      this.repository.countDischargedClients(orgId, dateRange, branchId),
      this.repository.countHighRiskClients(orgId, branchId),
      this.repository.countOverdueAssessments(orgId, branchId),
    ]);

    return {
      activeClients,
      newClients,
      dischargedClients,
      highRiskClients,
      overdueAssessments,
    };
  }

  /**
   * Get compliance alerts
   */
  async getComplianceAlerts(
    orgId: string,
    branchId: string | undefined,
    context: UserContext
  ): Promise<ComplianceAlert[]> {
    this.validateAccess(context, orgId, branchId);

    const alerts: ComplianceAlert[] = [];

    // Check credential expirations
    const expiringCredentials = await this.repository.getExpiringCredentials(
      orgId,
      30,
      branchId
    );
    if (expiringCredentials > 0) {
      alerts.push({
        type: 'CREDENTIAL_EXPIRING',
        severity: 'WARNING',
        count: expiringCredentials,
        message: `${expiringCredentials} caregiver credentials expire within 30 days`,
        actionRequired: 'Review and schedule renewals',
      });
    }

    // Check overdue assessments
    const overdueAssessments = await this.repository.countOverdueAssessments(
      orgId,
      branchId
    );
    if (overdueAssessments > 0) {
      alerts.push({
        type: 'ASSESSMENT_OVERDUE',
        severity: 'HIGH',
        count: overdueAssessments,
        message: `${overdueAssessments} clients have overdue assessments`,
        actionRequired: 'Schedule care plan reviews immediately',
      });
    }

    // Check pending EVV records
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const pendingEVV = await this.repository.countPendingReview(
      orgId,
      { startDate: yesterday, endDate: today },
      branchId
    );
    if (pendingEVV > 0) {
      alerts.push({
        type: 'EVV_SUBMISSION_DELAYED',
        severity: 'MEDIUM',
        count: pendingEVV,
        message: `${pendingEVV} visits pending EVV submission`,
        actionRequired: 'Review and submit visits to aggregator',
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, INFO: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get caregiver performance
   */
  async getCaregiverPerformance(
    caregiverId: string,
    dateRange: DateRange,
    context: UserContext
  ): Promise<CaregiverPerformance> {
    // Get visits for this caregiver
    const visits = await this.repository.getVisitsByCaregiver(
      caregiverId,
      dateRange
    );

    const completedVisits = visits.filter(
      (v) => v.record_status === 'COMPLETE'
    );
    const totalDuration = completedVisits.reduce(
      (sum, v) => sum + ((v.total_duration as number) || 0),
      0
    );
    const avgDuration = completedVisits.length > 0 ? totalDuration / completedVisits.length : 0;

    const compliantVisits = completedVisits.filter(
      (v) => Array.isArray(v.compliance_flags) && v.compliance_flags.length === 0
    );
    const evvComplianceRate =
      completedVisits.length > 0 ? compliantVisits.length / completedVisits.length : 0;

    const geofenceViolations = visits.filter((v) =>
      Array.isArray(v.compliance_flags) &&
      v.compliance_flags.includes('GEOFENCE_VIOLATION')
    ).length;

    // Calculate performance score (weighted average)
    const performanceScore =
      evvComplianceRate * 40 + // 40% weight on EVV compliance
      (1 - geofenceViolations / Math.max(visits.length, 1)) * 30 + // 30% on location compliance
      0.95 * 30; // 30% on on-time percentage (placeholder)

    return {
      caregiverId,
      caregiverName: '', // Would need to fetch caregiver details
      visitsCompleted: completedVisits.length,
      averageVisitDuration: avgDuration,
      onTimePercentage: 0.95, // Placeholder
      evvComplianceRate,
      noShowRate: 0, // Placeholder
      geofenceViolations,
      overtimeHours: 0, // Placeholder
      performanceScore: performanceScore * 100,
    };
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(
    orgId: string,
    months: number,
    branchId: string | undefined,
    context: UserContext
  ): Promise<RevenueTrendDataPoint[]> {
    this.validateAccess(context, orgId, branchId);
    return this.repository.getRevenueTrends(orgId, months, branchId);
  }

  /**
   * Get EVV exceptions for coordinator dashboard
   */
  async getEVVExceptions(
    orgId: string,
    branchId: string | undefined,
    context: UserContext
  ): Promise<VisitException[]> {
    this.validateAccess(context, orgId, branchId);
    return this.repository.getEVVExceptions(orgId, branchId);
  }

  /**
   * Get dashboard stats for coordinator
   */
  async getDashboardStats(
    orgId: string,
    branchId: string | undefined,
    context: UserContext
  ): Promise<DashboardStats> {
    this.validateAccess(context, orgId, branchId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [inProgress, completedToday, upcoming, needsReview] =
      await Promise.all([
        this.repository.countVisits(
          orgId,
          { startDate: today, endDate: tomorrow },
          ['IN_PROGRESS'],
          branchId
        ),
        this.repository.countVisits(
          orgId,
          { startDate: today, endDate: tomorrow },
          ['COMPLETED'],
          branchId
        ),
        this.repository.countVisits(
          orgId,
          { startDate: tomorrow, endDate: new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000) },
          ['SCHEDULED', 'CONFIRMED'],
          branchId
        ),
        this.repository.countPendingReview(
          orgId,
          { startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), endDate: today },
          branchId
        ),
      ]);

    return {
      inProgress,
      completedToday,
      upcoming,
      needsReview,
    };
  }

  /**
   * Validate user access to organization/branch
   */
  private validateAccess(
    context: UserContext,
    orgId: string,
    branchId?: string
  ): void {
    // Check if user belongs to this organization
    if (context.organizationId !== orgId) {
      throw new Error('Unauthorized: Access denied to this organization');
    }

    // If branchId specified, check branch access
    if (branchId && context.branchId && context.branchId !== branchId) {
      throw new Error('Unauthorized: Access denied to this branch');
    }
  }
}
