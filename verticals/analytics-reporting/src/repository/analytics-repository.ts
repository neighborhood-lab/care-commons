/**
 * Analytics Repository - Data access layer for analytics queries
 */

import { Database } from '@care-commons/core';
import {
  DateRange,
  VisitException,
  CaregiverPerformance,
  AgingBucket,
  RevenueByPayer,
  RevenueTrendDataPoint,
} from '../types/analytics';

export class AnalyticsRepository {
  constructor(private database: Database) {}

  /**
   * Count visits by status
   */
  async countVisits(
    orgId: string,
    dateRange: DateRange,
    statuses: string[],
    branchId?: string
  ): Promise<number> {

    let query = `
      SELECT COUNT(*) as count
      FROM visits
      WHERE organization_id = $1
        AND status = ANY($2)
        AND scheduled_date BETWEEN $3 AND $4
    `;
    const params: unknown[] = [orgId, statuses, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $5';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count compliant EVV visits
   * 
   * A visit is compliant if:
   * - Record status is COMPLETE
   * - Compliance flags do NOT contain any violation flags
   * 
   * Violation flags include: GEOFENCE_VIOLATION, TIME_GAP, DEVICE_SUSPICIOUS,
   * LOCATION_SUSPICIOUS, DUPLICATE_ENTRY, MISSING_SIGNATURE, LATE_SUBMISSION
   */
  async countCompliantVisits(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM evv_records
      WHERE organization_id = $1
        AND record_status = 'COMPLETE'
        AND service_date BETWEEN $2 AND $3
        AND NOT (
          compliance_flags ? 'GEOFENCE_VIOLATION'
          OR compliance_flags ? 'TIME_GAP'
          OR compliance_flags ? 'DEVICE_SUSPICIOUS'
          OR compliance_flags ? 'LOCATION_SUSPICIOUS'
          OR compliance_flags ? 'DUPLICATE_ENTRY'
          OR compliance_flags ? 'MISSING_SIGNATURE'
          OR compliance_flags ? 'LATE_SUBMISSION'
        )
    `;
    const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $4';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count flagged EVV visits
   */
  async countFlaggedVisits(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM evv_records
      WHERE organization_id = $1
        AND jsonb_array_length(compliance_flags) > 0
        AND service_date BETWEEN $2 AND $3
    `;
    const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $4';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count pending review EVV records
   */
  async countPendingReview(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM evv_records
      WHERE organization_id = $1
        AND record_status = 'PENDING'
        AND service_date BETWEEN $2 AND $3
    `;
    const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $4';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Sum billable hours
   */
  async sumBillableHours(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    let query = `
      SELECT COALESCE(SUM(total_duration), 0) as total
      FROM evv_records
      WHERE organization_id = $1
        AND record_status = 'COMPLETE'
        AND service_date BETWEEN $2 AND $3
    `;
    const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $4';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    const totalMinutes = parseFloat(result.rows[0]?.total as string) || 0;
    return totalMinutes / 60; // Convert to hours
  }

  /**
   * Sum billed amount
   */
  async sumBilledAmount(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    try {
      let query = `
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM invoices
        WHERE organization_id = $1
          AND invoice_date BETWEEN $2 AND $3
          AND deleted_at IS NULL
      `;
      const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

      if (branchId) {
        query += ' AND branch_id = $4';
        params.push(branchId);
      }

      const result = await this.database.query(query, params);
      return parseFloat(result.rows[0]?.total as string) || 0;
    } catch (error) {
      // Return 0 if billing tables don't exist or query fails
      console.error('Error summing billed amount:', error);
      return 0;
    }
  }

  /**
   * Sum paid amount
   */
  async sumPaidAmount(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    try {
      let query = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE organization_id = $1
          AND payment_date BETWEEN $2 AND $3
      `;
      const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

      if (branchId) {
        query += ' AND branch_id = $4';
        params.push(branchId);
      }

      const result = await this.database.query(query, params);
      return parseFloat(result.rows[0]?.total as string) || 0;
    } catch (error) {
      // Return 0 if billing tables don't exist or query fails
      console.error('Error summing paid amount:', error);
      return 0;
    }
  }

  /**
   * Get outstanding accounts receivable
   */
  async getOutstandingAR(orgId: string, branchId?: string): Promise<number> {
    let query = `
      SELECT COALESCE(SUM(balance_due), 0) as total
      FROM invoices
      WHERE organization_id = $1
        AND status = ANY($2)
    `;
    const params: unknown[] = [orgId, ['SENT', 'OVERDUE']];

    if (branchId) {
      query += ' AND branch_id = $3';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseFloat(result.rows[0]?.total as string) || 0;
  }

  /**
   * Count active caregivers
   */
  async countActiveCaregivers(orgId: string, branchId?: string): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM caregivers
      WHERE organization_id = $1
        AND employment_status = 'ACTIVE'
        AND deleted_at IS NULL
    `;
    const params: unknown[] = [orgId];

    if (branchId) {
      query += ' AND $2 = ANY(branch_ids)';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Sum overtime hours
   */
  async sumOvertimeHours(
    _orgId: string,
    _dateRange: DateRange,
    _branchId?: string
  ): Promise<number> {
    // This would require calculating hours worked per caregiver per week
    // and determining which hours exceed 40/week
    // Simplified version - actual implementation would be more complex

    // This is a placeholder - real implementation would calculate weekly hours
    return 0;
  }

  /**
   * Get expiring credentials
   */
  async getExpiringCredentials(
    orgId: string,
    daysAhead: number,
    branchId?: string
  ): Promise<number> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysAhead);

    let query = `
      SELECT COUNT(*) as count
      FROM caregivers
      WHERE organization_id = $1
        AND employment_status = 'ACTIVE'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(credentials) as cred
          WHERE (cred->>'expirationDate')::date <= $2
          AND (cred->>'expirationDate')::date >= CURRENT_DATE
        )
    `;
    const params: unknown[] = [orgId, expirationDate.toISOString().split('T')[0]];

    if (branchId) {
      query += ' AND $3 = ANY(branch_ids)';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count active clients
   */
  async countActiveClients(orgId: string, branchId?: string): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM clients
      WHERE organization_id = $1
        AND status = 'ACTIVE'
        AND deleted_at IS NULL
    `;
    const params: unknown[] = [orgId];

    if (branchId) {
      query += ' AND branch_id = $2';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count new clients in date range
   */
  async countNewClients(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM clients
      WHERE organization_id = $1
        AND created_at BETWEEN $2 AND $3
        AND deleted_at IS NULL
    `;
    const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $4';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count discharged clients
   */
  async countDischargedClients(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM clients
      WHERE organization_id = $1
        AND status = ANY($2)
        AND updated_at BETWEEN $3 AND $4
    `;
    const params: unknown[] = [orgId, ['DISCHARGED', 'DECEASED'], dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $5';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count high risk clients
   */
  async countHighRiskClients(orgId: string, branchId?: string): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM clients
      WHERE organization_id = $1
        AND status = 'ACTIVE'
        AND jsonb_array_length(risk_flags) > 0
        AND deleted_at IS NULL
    `;
    const params: unknown[] = [orgId];

    if (branchId) {
      query += ' AND branch_id = $2';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Count overdue assessments
   */
  async countOverdueAssessments(orgId: string, branchId?: string): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM care_plans
      WHERE organization_id = $1
        AND status = 'ACTIVE'
        AND effective_date < $2
    `;
    const params: unknown[] = [orgId, new Date()];

    if (branchId) {
      query += ' AND branch_id = $3';
      params.push(branchId);
    }

    const result = await this.database.query(query, params);
    return parseInt(result.rows[0]?.count as string) || 0;
  }

  /**
   * Get visits by caregiver
   */
  async getVisitsByCaregiver(
    caregiverId: string,
    dateRange: DateRange
  ): Promise<Array<Record<string, unknown>>> {
    const query = `
      SELECT *
      FROM evv_records
      WHERE caregiver_id = $1
        AND service_date BETWEEN $2 AND $3
    `;
    const params = [caregiverId, dateRange.startDate, dateRange.endDate];

    const result = await this.database.query(query, params);
    return result.rows as Array<Record<string, unknown>>;
  }

  /**
   * Get caregiver performance data
   */
  async getCaregiverPerformanceData(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<CaregiverPerformance[]> {
    let query = `
      SELECT
        c.id as caregiver_id,
        c.first_name,
        c.last_name,
        COUNT(CASE WHEN evv.record_status = 'COMPLETE' THEN 1 END) as visits_completed,
        AVG(evv.total_duration) as avg_duration,
        COUNT(CASE WHEN jsonb_array_length(evv.compliance_flags) = 0 THEN 1 END)::float /
          NULLIF(COUNT(evv.id), 0) as evv_compliance_rate,
        COUNT(CASE WHEN jsonb_array_length(evv.compliance_flags) > 0
          AND 'GEOFENCE_VIOLATION' = ANY(SELECT jsonb_array_elements_text(evv.compliance_flags))
          THEN 1 END) as geofence_violations
      FROM caregivers c
      LEFT JOIN evv_records evv ON c.id = evv.caregiver_id
        AND evv.service_date BETWEEN $2 AND $3
      WHERE c.organization_id = $1
        AND c.employment_status = 'ACTIVE'
        AND c.deleted_at IS NULL
    `;
    const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND $4 = ANY(c.branch_ids)';
      params.push(branchId);
    }

    query += `
      GROUP BY c.id, c.first_name, c.last_name
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => ({
      caregiverId: row.caregiver_id as string,
      caregiverName: `${row.first_name} ${row.last_name}`,
      visitsCompleted: parseInt(row.visits_completed as string) || 0,
      averageVisitDuration: parseFloat(row.avg_duration as string) || 0,
      onTimePercentage: 0.95, // Placeholder - would need clock_in time comparison
      evvComplianceRate: parseFloat(row.evv_compliance_rate as string) || 0,
      noShowRate: 0, // Placeholder - would need visit status data
      geofenceViolations: parseInt(row.geofence_violations as string) || 0,
      overtimeHours: 0, // Placeholder
      performanceScore: 85, // Placeholder - would calculate based on multiple factors
    }));
  }

  /**
   * Get revenue trends by month
   */
  async getRevenueTrends(
    orgId: string,
    months: number,
    branchId?: string
  ): Promise<RevenueTrendDataPoint[]> {
    let query = `
      SELECT
        EXTRACT(YEAR FROM invoice_date)::int as year,
        EXTRACT(MONTH FROM invoice_date)::int as month,
        SUM(total_amount) as billed,
        SUM(amount_paid) as paid,
        SUM(balance_due) as outstanding
      FROM invoices
      WHERE organization_id = $1
        AND invoice_date >= CURRENT_DATE - INTERVAL '${months} months'
    `;
    const params: unknown[] = [orgId];

    if (branchId) {
      query += ' AND branch_id = $2';
      params.push(branchId);
    }

    query += `
      GROUP BY EXTRACT(YEAR FROM invoice_date), EXTRACT(MONTH FROM invoice_date)
      ORDER BY year, month
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => ({
      month: new Date(row.year as number, (row.month as number) - 1).toLocaleString('default', { month: 'short' }),
      year: row.year as number,
      billed: parseFloat(row.billed as string) || 0,
      paid: parseFloat(row.paid as string) || 0,
      outstanding: parseFloat(row.outstanding as string) || 0,
    }));
  }

  /**
   * Get EVV exceptions needing review
   */
  async getEVVExceptions(
    orgId: string,
    branchId?: string
  ): Promise<VisitException[]> {
    let query = `
      SELECT
        evv.id,
        evv.visit_id,
        evv.caregiver_id,
        cg.first_name as caregiver_first,
        cg.last_name as caregiver_last,
        evv.client_id,
        cl.first_name as client_first,
        cl.last_name as client_last,
        evv.service_date,
        evv.compliance_flags,
        evv.record_status
      FROM evv_records evv
      JOIN caregivers cg ON evv.caregiver_id = cg.id
      JOIN clients cl ON evv.client_id = cl.id
      WHERE evv.organization_id = $1
        AND jsonb_array_length(evv.compliance_flags) > 0
        AND evv.record_status = 'PENDING'
    `;
    const params: unknown[] = [orgId];

    if (branchId) {
      query += ' AND evv.branch_id = $2';
      params.push(branchId);
    }

    query += `
      ORDER BY evv.service_date DESC
      LIMIT 50
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => ({
      id: row.id as string,
      visitId: row.visit_id as string,
      caregiverId: row.caregiver_id as string,
      caregiverName: `${row.caregiver_first} ${row.caregiver_last}`,
      clientId: row.client_id as string,
      clientName: `${row.client_first} ${row.client_last}`,
      visitDate: row.service_date as Date,
      exceptionType: 'EVV_COMPLIANCE',
      description: this.formatComplianceFlags(row.compliance_flags as string[]),
      severity: 'MEDIUM',
      status: 'PENDING',
      complianceFlags: row.compliance_flags as string[],
    }));
  }

  /**
   * Format compliance flags for display
   */
  private formatComplianceFlags(flags: string[]): string {
    if (!flags || flags.length === 0) return 'No issues';
    return flags.map(flag => flag.replace(/_/g, ' ').toLowerCase()).join(', ');
  }

  /**
   * Get aging buckets for A/R
   */
  async getAgingBuckets(orgId: string, branchId?: string): Promise<AgingBucket[]> {
    let query = `
      SELECT
        CASE
          WHEN CURRENT_DATE - invoice_date <= 30 THEN '0-30'
          WHEN CURRENT_DATE - invoice_date <= 60 THEN '31-60'
          WHEN CURRENT_DATE - invoice_date <= 90 THEN '61-90'
          ELSE '90+'
        END as range,
        COUNT(*) as count,
        SUM(balance_due) as amount
      FROM invoices
      WHERE organization_id = $1
        AND status = ANY($2)
    `;
    const params: unknown[] = [orgId, ['SENT', 'OVERDUE']];

    if (branchId) {
      query += ' AND branch_id = $3';
      params.push(branchId);
    }

    query += `
      GROUP BY range
      ORDER BY CASE range
        WHEN '0-30' THEN 1
        WHEN '31-60' THEN 2
        WHEN '61-90' THEN 3
        ELSE 4
      END
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => ({
      range: row.range as string,
      count: parseInt(row.count as string),
      amount: parseFloat(row.amount as string) || 0,
    }));
  }

  /**
   * Get revenue by payer
   */
  async getRevenueByPayer(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<RevenueByPayer[]> {
    let query = `
      SELECT
        payer_id,
        payer_name,
        COUNT(*) as visit_count,
        SUM(total_amount) as billed_amount,
        SUM(amount_paid) as paid_amount,
        SUM(balance_due) as outstanding_amount
      FROM invoices
      WHERE organization_id = $1
        AND invoice_date BETWEEN $2 AND $3
        AND payer_id IS NOT NULL
    `;
    const params: unknown[] = [orgId, dateRange.startDate, dateRange.endDate];

    if (branchId) {
      query += ' AND branch_id = $4';
      params.push(branchId);
    }

    query += `
      GROUP BY payer_id, payer_name
      ORDER BY billed_amount DESC
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => ({
      payerId: row.payer_id as string,
      payerName: row.payer_name as string,
      billedAmount: parseFloat(row.billed_amount as string) || 0,
      paidAmount: parseFloat(row.paid_amount as string) || 0,
      outstandingAmount: parseFloat(row.outstanding_amount as string) || 0,
      visitCount: parseInt(row.visit_count as string) || 0,
    }));
  }
}
