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
    const query = this.database
      .getConnection()
      .from('schedules')
      .where('organization_id', orgId)
      .whereIn('status', statuses)
      .whereBetween('start_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count compliant EVV visits
   */
  async countCompliantVisits(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    const query = this.database
      .getConnection()
      .from('evv_records')
      .where('organization_id', orgId)
      .where('record_status', 'COMPLETE')
      .where('verification_level', 'FULL')
      .whereRaw("compliance_flags = '[]'::jsonb")
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count flagged EVV visits
   */
  async countFlaggedVisits(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    const query = this.database
      .getConnection()
      .from('evv_records')
      .where('organization_id', orgId)
      .whereRaw("jsonb_array_length(compliance_flags) > 0")
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count pending review EVV records
   */
  async countPendingReview(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    const query = this.database
      .getConnection()
      .from('evv_records')
      .where('organization_id', orgId)
      .where('record_status', 'PENDING')
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Sum billable hours
   */
  async sumBillableHours(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    const query = this.database
      .getConnection()
      .from('evv_records')
      .where('organization_id', orgId)
      .where('record_status', 'COMPLETE')
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.sum('total_duration as total').first();
    const totalMinutes = parseInt(result?.total as string) || 0;
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
    const query = this.database
      .getConnection()
      .from('invoice_line_items as ili')
      .join('invoices as i', 'ili.invoice_id', 'i.id')
      .where('i.organization_id', orgId)
      .whereBetween('i.invoice_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('i.branch_id', branchId);
    }

    const result = await query.sum('ili.total_amount as total').first();
    return parseFloat(result?.total as string) || 0;
  }

  /**
   * Sum paid amount
   */
  async sumPaidAmount(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    const query = this.database
      .getConnection()
      .from('payments as p')
      .join('invoices as i', 'p.invoice_id', 'i.id')
      .where('i.organization_id', orgId)
      .whereBetween('p.payment_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('i.branch_id', branchId);
    }

    const result = await query.sum('p.amount as total').first();
    return parseFloat(result?.total as string) || 0;
  }

  /**
   * Get outstanding accounts receivable
   */
  async getOutstandingAR(orgId: string, branchId?: string): Promise<number> {
    const query = this.database
      .getConnection()
      .from('invoices')
      .where('organization_id', orgId)
      .whereIn('status', ['SENT', 'OVERDUE']);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.sum('balance_due as total').first();
    return parseFloat(result?.total as string) || 0;
  }

  /**
   * Count active caregivers
   */
  async countActiveCaregivers(orgId: string, branchId?: string): Promise<number> {
    const query = this.database
      .getConnection()
      .from('caregivers')
      .where('organization_id', orgId)
      .where('employment_status', 'ACTIVE')
      .whereNull('deleted_at');

    if (branchId) {
      query.whereRaw('? = ANY(branch_ids)', [branchId]);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Sum overtime hours
   */
  async sumOvertimeHours(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    // This would require calculating hours worked per caregiver per week
    // and determining which hours exceed 40/week
    // Simplified version - actual implementation would be more complex
    const query = this.database
      .getConnection()
      .from('evv_records')
      .where('organization_id', orgId)
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

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

    const query = this.database
      .getConnection()
      .from('caregivers')
      .where('organization_id', orgId)
      .where('employment_status', 'ACTIVE')
      .whereRaw(`
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(credentials) as cred
          WHERE (cred->>'expirationDate')::date <= ?
          AND (cred->>'expirationDate')::date >= CURRENT_DATE
        )
      `, [expirationDate.toISOString().split('T')[0]]);

    if (branchId) {
      query.whereRaw('? = ANY(branch_ids)', [branchId]);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count active clients
   */
  async countActiveClients(orgId: string, branchId?: string): Promise<number> {
    const query = this.database
      .getConnection()
      .from('clients')
      .where('organization_id', orgId)
      .where('status', 'ACTIVE')
      .whereNull('deleted_at');

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count new clients in date range
   */
  async countNewClients(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    const query = this.database
      .getConnection()
      .from('clients')
      .where('organization_id', orgId)
      .whereBetween('created_at', [dateRange.startDate, dateRange.endDate])
      .whereNull('deleted_at');

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count discharged clients
   */
  async countDischargedClients(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<number> {
    const query = this.database
      .getConnection()
      .from('clients')
      .where('organization_id', orgId)
      .whereIn('status', ['DISCHARGED', 'DECEASED'])
      .whereBetween('updated_at', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count high risk clients
   */
  async countHighRiskClients(orgId: string, branchId?: string): Promise<number> {
    const query = this.database
      .getConnection()
      .from('clients')
      .where('organization_id', orgId)
      .where('status', 'ACTIVE')
      .whereRaw("jsonb_array_length(risk_flags) > 0")
      .whereNull('deleted_at');

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Count overdue assessments
   */
  async countOverdueAssessments(orgId: string, branchId?: string): Promise<number> {
    const query = this.database
      .getConnection()
      .from('care_plans')
      .where('organization_id', orgId)
      .where('status', 'ACTIVE')
      .where('effective_to', '<', new Date());

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Get visits by caregiver
   */
  async getVisitsByCaregiver(
    caregiverId: string,
    dateRange: DateRange
  ): Promise<Array<Record<string, unknown>>> {
    const visits = await this.database
      .getConnection()
      .from('evv_records')
      .where('caregiver_id', caregiverId)
      .whereBetween('service_date', [dateRange.startDate, dateRange.endDate])
      .select('*');

    return visits;
  }

  /**
   * Get caregiver performance data
   */
  async getCaregiverPerformanceData(
    orgId: string,
    dateRange: DateRange,
    branchId?: string
  ): Promise<CaregiverPerformance[]> {
    const query = this.database
      .getConnection()
      .from('caregivers as c')
      .leftJoin('evv_records as evv', function() {
        this.on('c.id', 'evv.caregiver_id')
          .andOnBetween('evv.service_date', [dateRange.startDate, dateRange.endDate]);
      })
      .where('c.organization_id', orgId)
      .where('c.employment_status', 'ACTIVE')
      .whereNull('c.deleted_at');

    if (branchId) {
      query.whereRaw('? = ANY(c.branch_ids)', [branchId]);
    }

    const results = await query
      .select(
        'c.id as caregiver_id',
        'c.first_name',
        'c.last_name',
        this.database.getConnection().raw(`
          COUNT(CASE WHEN evv.record_status = 'COMPLETE' THEN 1 END) as visits_completed
        `),
        this.database.getConnection().raw(`
          AVG(evv.total_duration) as avg_duration
        `),
        this.database.getConnection().raw(`
          COUNT(CASE WHEN jsonb_array_length(evv.compliance_flags) = 0 THEN 1 END)::float /
          NULLIF(COUNT(evv.id), 0) as evv_compliance_rate
        `),
        this.database.getConnection().raw(`
          COUNT(CASE WHEN jsonb_array_length(evv.compliance_flags) > 0
          AND 'GEOFENCE_VIOLATION' = ANY(SELECT jsonb_array_elements_text(evv.compliance_flags))
          THEN 1 END) as geofence_violations
        `)
      )
      .groupBy('c.id', 'c.first_name', 'c.last_name');

    return results.map(row => ({
      caregiverId: row.caregiver_id,
      caregiverName: `${row.first_name} ${row.last_name}`,
      visitsCompleted: parseInt(row.visits_completed) || 0,
      averageVisitDuration: parseFloat(row.avg_duration) || 0,
      onTimePercentage: 0.95, // Placeholder - would need clock_in time comparison
      evvComplianceRate: parseFloat(row.evv_compliance_rate) || 0,
      noShowRate: 0, // Placeholder - would need visit status data
      geofenceViolations: parseInt(row.geofence_violations) || 0,
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
    const query = this.database
      .getConnection()
      .from('invoices')
      .where('organization_id', orgId)
      .where('invoice_date', '>=', this.database.getConnection().raw(`CURRENT_DATE - INTERVAL '${months} months'`));

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const results = await query
      .select(
        this.database.getConnection().raw(`
          EXTRACT(YEAR FROM invoice_date)::int as year,
          EXTRACT(MONTH FROM invoice_date)::int as month,
          SUM(total_amount) as billed,
          SUM(amount_paid) as paid,
          SUM(balance_due) as outstanding
        `)
      )
      .groupByRaw('EXTRACT(YEAR FROM invoice_date), EXTRACT(MONTH FROM invoice_date)')
      .orderByRaw('year, month');

    return results.map(row => ({
      month: new Date(row.year, row.month - 1).toLocaleString('default', { month: 'short' }),
      year: row.year,
      billed: parseFloat(row.billed) || 0,
      paid: parseFloat(row.paid) || 0,
      outstanding: parseFloat(row.outstanding) || 0,
    }));
  }

  /**
   * Get EVV exceptions needing review
   */
  async getEVVExceptions(
    orgId: string,
    branchId?: string
  ): Promise<VisitException[]> {
    const query = this.database
      .getConnection()
      .from('evv_records as evv')
      .join('caregivers as cg', 'evv.caregiver_id', 'cg.id')
      .join('clients as cl', 'evv.client_id', 'cl.id')
      .where('evv.organization_id', orgId)
      .whereRaw("jsonb_array_length(evv.compliance_flags) > 0")
      .where('evv.record_status', 'PENDING');

    if (branchId) {
      query.andWhere('evv.branch_id', branchId);
    }

    const results = await query
      .select(
        'evv.id',
        'evv.visit_id',
        'evv.caregiver_id',
        'cg.first_name as caregiver_first',
        'cg.last_name as caregiver_last',
        'evv.client_id',
        'cl.first_name as client_first',
        'cl.last_name as client_last',
        'evv.service_date',
        'evv.compliance_flags',
        'evv.record_status'
      )
      .orderBy('evv.service_date', 'desc')
      .limit(50);

    return results.map(row => ({
      id: row.id,
      visitId: row.visit_id,
      caregiverId: row.caregiver_id,
      caregiverName: `${row.caregiver_first} ${row.caregiver_last}`,
      clientId: row.client_id,
      clientName: `${row.client_first} ${row.client_last}`,
      visitDate: row.service_date,
      exceptionType: 'EVV_COMPLIANCE',
      description: this.formatComplianceFlags(row.compliance_flags),
      severity: 'MEDIUM',
      status: 'PENDING',
      complianceFlags: row.compliance_flags,
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
    const query = this.database
      .getConnection()
      .from('invoices')
      .where('organization_id', orgId)
      .whereIn('status', ['SENT', 'OVERDUE']);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const results = await query
      .select(
        this.database.getConnection().raw(`
          CASE
            WHEN CURRENT_DATE - invoice_date <= 30 THEN '0-30'
            WHEN CURRENT_DATE - invoice_date <= 60 THEN '31-60'
            WHEN CURRENT_DATE - invoice_date <= 90 THEN '61-90'
            ELSE '90+'
          END as range,
          COUNT(*) as count,
          SUM(balance_due) as amount
        `)
      )
      .groupByRaw('range')
      .orderByRaw(`
        CASE range
          WHEN '0-30' THEN 1
          WHEN '31-60' THEN 2
          WHEN '61-90' THEN 3
          ELSE 4
        END
      `);

    return results.map(row => ({
      range: row.range,
      count: parseInt(row.count),
      amount: parseFloat(row.amount) || 0,
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
    const query = this.database
      .getConnection()
      .from('invoices')
      .where('organization_id', orgId)
      .whereBetween('invoice_date', [dateRange.startDate, dateRange.endDate]);

    if (branchId) {
      query.andWhere('branch_id', branchId);
    }

    const results = await query
      .select(
        'payer_id',
        'payer_name',
        this.database.getConnection().raw('COUNT(*) as visit_count'),
        this.database.getConnection().raw('SUM(total_amount) as billed_amount'),
        this.database.getConnection().raw('SUM(amount_paid) as paid_amount'),
        this.database.getConnection().raw('SUM(balance_due) as outstanding_amount')
      )
      .whereNotNull('payer_id')
      .groupBy('payer_id', 'payer_name')
      .orderBy('billed_amount', 'desc');

    return results.map(row => ({
      payerId: row.payer_id,
      payerName: row.payer_name,
      billedAmount: parseFloat(row.billed_amount) || 0,
      paidAmount: parseFloat(row.paid_amount) || 0,
      outstandingAmount: parseFloat(row.outstanding_amount) || 0,
      visitCount: parseInt(row.visit_count) || 0,
    }));
  }
}
