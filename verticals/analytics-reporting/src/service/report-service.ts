/**
 * Report Generator Service
 * Pre-built reports for compliance, productivity, and revenue analysis
 */

import { Database, UserContext } from '@care-commons/core';
import {
  ReportType,
} from '../types/analytics';

export class ReportService {
  constructor(_database: Database) {
    // Repository will be added when implementing actual methods
  }

  /**
   * Get flagged visit details for compliance issues
   *
   * NOTE: This method is not yet implemented - requires refactor to raw SQL
   * See ARCHITECTURAL_ISSUES.md for details
   * Commented out to avoid unused method warning
   */
  /*
  private async getFlaggedVisitDetails(
    _orgId: string,
    _dateRange: DateRange,
    _branchId?: string
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
    // This method uses Knex query builder which doesn't exist on Database class
    throw new Error('Not implemented - requires refactor to raw SQL');
    
    const query = this.database
      .getConnection()
      .from('evv_records as evv')
      .join('caregivers as cg', 'evv.caregiver_id', 'cg.id')
      .join('clients as cl', 'evv.client_id', 'cl.id')
      .where('evv.organization_id', orgId)
      .whereRaw("jsonb_array_length(evv.compliance_flags) > 0")
      .whereBetween('evv.service_date', [
        dateRange.startDate,
        dateRange.endDate,
      ]);

    if (branchId) {
      query.andWhere('evv.branch_id', branchId);
    }

    const results = await query
      .select(
        'evv.visit_id',
        'cl.first_name as client_first',
        'cl.last_name as client_last',
        'cg.first_name as caregiver_first',
        'cg.last_name as caregiver_last',
        'evv.service_date',
        'evv.compliance_flags',
        'evv.record_status'
      )
      .orderBy('evv.service_date', 'desc')
      .limit(100);

    return results.map((row) => ({
      visitId: row.visit_id,
      clientName: `${row.client_first} ${row.client_last}`,
      caregiverName: `${row.caregiver_first} ${row.caregiver_last}`,
      serviceDate: row.service_date,
      complianceFlags: row.compliance_flags,
      resolutionStatus: row.record_status,
    }));
  }
  */

  /**
   * Generate unique report ID
   * NOTE: Will be used when implementing report generation
   */
  // private generateReportId(): string {
  //   return `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  // }

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
   * This would be called by a cron job or scheduler
   * NOTE: Requires refactor to raw SQL - see ARCHITECTURAL_ISSUES.md
   */
  async scheduleReport(
    _reportType: ReportType,
    orgId: string,
    _frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    _recipients: string[],
    context: UserContext
  ): Promise<void> {
    this.validateAccess(context, orgId);

    throw new Error('Not implemented - requires refactor to raw SQL');
    /*
    // Store scheduled report configuration
    await this.database.getConnection().insert({
      organization_id: orgId,
      report_type: reportType,
      frequency,
      recipients: JSON.stringify(recipients),
      created_by: context.userId,
      created_at: new Date(),
      is_active: true,
    }).into('scheduled_reports');
    */

    // In a real implementation, this would:
    // 1. Create a job in a queue (e.g., Bull, BullMQ)
    // 2. Set up cron scheduling
    // 3. Configure email delivery
  }
}
