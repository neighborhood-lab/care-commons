/**
 * Report Generator Service
 * Pre-built reports for compliance, productivity, and revenue analysis
 */

import { Database, UserContext } from '@care-commons/core';
import { AnalyticsRepository } from '../repository/analytics-repository';
import {
  Report,
  EVVComplianceReport,
  ProductivityReport,
  RevenueCycleReport,
  DateRange,
  ReportType,
  ExportFormat,
} from '../types/analytics';

export class ReportService {
  private repository: AnalyticsRepository;

  constructor(private database: Database) {
    this.repository = new AnalyticsRepository(database);
  }

  /**
   * Generate EVV Compliance Report
   * For state submission and compliance audits
   */
  async generateEVVComplianceReport(
    orgId: string,
    state: string,
    dateRange: DateRange,
    branchId: string | undefined,
    context: UserContext
  ): Promise<EVVComplianceReport> {
    this.validateAccess(context, orgId);

    const [compliantVisits, totalVisits, flaggedVisits, flaggedVisitDetails] =
      await Promise.all([
        this.repository.countCompliantVisits(orgId, dateRange, branchId),
        this.repository.countVisits(
          orgId,
          dateRange,
          ['COMPLETED'],
          branchId
        ),
        this.repository.countFlaggedVisits(orgId, dateRange, branchId),
        this.getFlaggedVisitDetails(orgId, dateRange, branchId),
      ]);

    const complianceRate = totalVisits > 0 ? compliantVisits / totalVisits : 0;

    return {
      id: this.generateReportId(),
      reportType: 'EVV_COMPLIANCE',
      title: `EVV Compliance Report - ${state}`,
      description: `Electronic Visit Verification compliance report for ${state} from ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`,
      organizationId: orgId,
      branchId,
      generatedAt: new Date(),
      generatedBy: context.userId,
      period: dateRange,
      exportFormats: ['PDF', 'EXCEL', 'CSV'],
      data: {
        state,
        totalVisits,
        compliantVisits,
        flaggedVisits: flaggedVisitDetails,
        aggregatorSubmissions: [], // Would fetch from actual submission tracking
        complianceRate,
      },
    };
  }

  /**
   * Generate Caregiver Productivity Report
   */
  async generateProductivityReport(
    orgId: string,
    dateRange: DateRange,
    branchId: string | undefined,
    context: UserContext
  ): Promise<ProductivityReport> {
    this.validateAccess(context, orgId);

    const caregiverPerformance =
      await this.repository.getCaregiverPerformanceData(
        orgId,
        dateRange,
        branchId
      );

    const totalHours = caregiverPerformance.reduce(
      (sum, cp) => sum + (cp.visitsCompleted * cp.averageVisitDuration) / 60,
      0
    );

    const averageUtilization =
      caregiverPerformance.length > 0
        ? caregiverPerformance.reduce(
            (sum, cp) => sum + (cp.visitsCompleted > 0 ? 1 : 0),
            0
          ) / caregiverPerformance.length
        : 0;

    const sortedByPerformance = [...caregiverPerformance].sort(
      (a, b) => b.performanceScore - a.performanceScore
    );

    return {
      id: this.generateReportId(),
      reportType: 'PRODUCTIVITY',
      title: 'Caregiver Productivity Report',
      description: `Productivity metrics for all caregivers from ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`,
      organizationId: orgId,
      branchId,
      generatedAt: new Date(),
      generatedBy: context.userId,
      period: dateRange,
      exportFormats: ['PDF', 'EXCEL', 'CSV'],
      data: {
        caregivers: caregiverPerformance,
        summary: {
          totalHours,
          averageUtilization,
          topPerformers: sortedByPerformance.slice(0, 5),
          needsImprovement: sortedByPerformance
            .slice(-5)
            .reverse()
            .filter((cp) => cp.performanceScore < 70),
        },
      },
    };
  }

  /**
   * Generate Revenue Cycle Report
   */
  async generateRevenueCycleReport(
    orgId: string,
    dateRange: DateRange,
    branchId: string | undefined,
    context: UserContext
  ): Promise<RevenueCycleReport> {
    this.validateAccess(context, orgId);

    const [
      billed,
      paid,
      outstanding,
      aging,
      byPayer,
      trends,
    ] = await Promise.all([
      this.repository.sumBilledAmount(orgId, dateRange, branchId),
      this.repository.sumPaidAmount(orgId, dateRange, branchId),
      this.repository.getOutstandingAR(orgId, branchId),
      this.repository.getAgingBuckets(orgId, branchId),
      this.repository.getRevenueByPayer(orgId, dateRange, branchId),
      this.repository.getRevenueTrends(orgId, 12, branchId),
    ]);

    // Calculate denial rate (placeholder - would need denial tracking)
    const denialRate = 0.05;
    const resubmissions = 0;

    return {
      id: this.generateReportId(),
      reportType: 'REVENUE_CYCLE',
      title: 'Revenue Cycle Report',
      description: `Revenue cycle analysis from ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`,
      organizationId: orgId,
      branchId,
      generatedAt: new Date(),
      generatedBy: context.userId,
      period: dateRange,
      exportFormats: ['PDF', 'EXCEL', 'CSV'],
      data: {
        billed,
        paid,
        outstanding,
        aging,
        denialRate,
        resubmissions,
        byPayer,
        trends,
      },
    };
  }

  /**
   * Get detailed information about flagged visits
   * OPTIMIZED: Rewritten using raw SQL for better performance
   */
  private async getFlaggedVisitDetails(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<
    Array<{
      visitId: string;
      clientName: string;
      caregiverName: string;
      serviceDate: Date;
      complianceFlags: string[];
      resolutionStatus: string;
    }>
  > {
    const branchFilter = branchId ? 'AND evv.branch_id = $4' : '';
    const params = branchId
      ? [orgId, dateRange.startDate.toISOString(), dateRange.endDate.toISOString(), branchId]
      : [orgId, dateRange.startDate.toISOString(), dateRange.endDate.toISOString()];

    const query = `
      SELECT
        evv.visit_id,
        cl.first_name as client_first,
        cl.last_name as client_last,
        cg.first_name as caregiver_first,
        cg.last_name as caregiver_last,
        evv.service_date,
        evv.compliance_flags,
        evv.record_status
      FROM evv_records evv
      JOIN caregivers cg ON evv.caregiver_id = cg.id
      JOIN clients cl ON evv.client_id = cl.id
      WHERE evv.organization_id = $1
        AND jsonb_array_length(evv.compliance_flags) > 0
        AND evv.service_date BETWEEN $2::timestamp AND $3::timestamp
        ${branchFilter}
      ORDER BY evv.service_date DESC
      LIMIT 100
    `;

    const result = await this.database.query<{
      visit_id: string;
      client_first: string;
      client_last: string;
      caregiver_first: string;
      caregiver_last: string;
      service_date: Date;
      compliance_flags: string[];
      record_status: string;
    }>(query, params);

    return result.rows.map((row) => ({
      visitId: row.visit_id,
      clientName: `${row.client_first} ${row.client_last}`,
      caregiverName: `${row.caregiver_first} ${row.caregiver_last}`,
      serviceDate: row.service_date,
      complianceFlags: row.compliance_flags,
      resolutionStatus: row.record_status,
    }));
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * Validate user access
   */
  private validateAccess(context: UserContext, orgId: string): void {
    if (context.organizationId !== orgId) {
      throw new Error('Unauthorized: Access denied to this organization');
    }
  }

  /**
   * Schedule automated report generation
   * OPTIMIZED: Rewritten using raw SQL
   * This would be called by a cron job or scheduler
   */
  async scheduleReport(
    reportType: ReportType,
    orgId: string,
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    recipients: string[],
    context: UserContext
  ): Promise<void> {
    this.validateAccess(context, orgId);

    const query = `
      INSERT INTO scheduled_reports (
        organization_id,
        report_type,
        frequency,
        recipients,
        created_by,
        created_at,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    await this.database.query(query, [
      orgId,
      reportType,
      frequency,
      JSON.stringify(recipients),
      context.userId,
      new Date().toISOString(),
      true,
    ]);

    // In a real implementation, this would:
    // 1. Create a job in a queue (e.g., Bull, BullMQ)
    // 2. Set up cron scheduling
    // 3. Configure email delivery
  }
}
