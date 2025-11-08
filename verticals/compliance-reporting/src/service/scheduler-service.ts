/**
 * Compliance Report Scheduler Service
 *
 * Manages automated scheduling and generation of compliance reports using BullMQ
 */

import type { Pool } from 'pg';
import { Queue, Worker } from 'bullmq';
import type {
  ScheduledComplianceReport,
  ScheduleReportParams,
  GenerateReportRequest
} from '@care-commons/core/types/compliance-reporting.js';
import { ComplianceReportService } from './compliance-report-service.js';

interface ScheduleJobData {
  scheduledReportId: string;
  organizationId: string;
  templateId: string;
  branchId?: string;
  periodStartDate: Date;
  periodEndDate: Date;
  exportFormats: string[];
  autoSubmit: boolean;
}

export class SchedulerService {
  private queue: Queue;
  private worker: Worker;

  private reportService: ComplianceReportService;

  constructor(private db: Pool) {
    const redisConnection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    };

    this.queue = new Queue('compliance-reports', { connection: redisConnection });
    this.reportService = new ComplianceReportService(db);

    // Initialize worker
    this.worker = new Worker(
      'compliance-reports',
      async (job) => {
        await this.processScheduledReport(job.data);
      },
      { connection: redisConnection }
    );

    this.worker.on('completed', (job) => {
      console.log(`Report generation job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Report generation job ${job?.id} failed:`, err);
    });
  }

  /**
   * Create a scheduled report
   */
  async createSchedule(params: ScheduleReportParams, userId: string): Promise<ScheduledComplianceReport> {
    // Calculate next run time
    const nextRunAt = this.calculateNextRunTime(params);

    const result = await this.db.query(
      `INSERT INTO scheduled_compliance_reports (
        template_id,
        organization_id,
        branch_id,
        schedule_name,
        frequency,
        day_of_month,
        day_of_week,
        time_of_day,
        date_range_type,
        export_formats,
        auto_submit,
        delivery_method,
        delivery_config,
        is_enabled,
        next_run_at,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, $15, $16)
      RETURNING *`,
      [
        params.templateId,
        params.organizationId,
        params.branchId || null,
        params.scheduleName,
        params.frequency,
        params.dayOfMonth || null,
        params.dayOfWeek || null,
        params.timeOfDay || '02:00:00',
        params.dateRangeType || 'PREVIOUS_PERIOD',
        `{${params.exportFormats.join(',')}}`,
        params.deliveryMethod === 'API',
        params.deliveryMethod,
        JSON.stringify(params.deliveryConfig),
        nextRunAt,
        userId,
        userId
      ]
    );

    const schedule = this.mapScheduleFromDb(result.rows[0]);

    // Add to job queue
    await this.scheduleJob(schedule);

    return schedule;
  }

  /**
   * Update a scheduled report
   */
  async updateSchedule(
    scheduleId: string,
    params: Partial<ScheduleReportParams>,
    userId: string
  ): Promise<ScheduledComplianceReport> {
    // Build update query dynamically based on provided params
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.scheduleName !== undefined) {
      updates.push(`schedule_name = $${paramIndex++}`);
      values.push(params.scheduleName);
    }

    if (params.frequency !== undefined) {
      updates.push(`frequency = $${paramIndex++}`);
      values.push(params.frequency);
    }

    if (params.exportFormats !== undefined) {
      updates.push(`export_formats = $${paramIndex++}`);
      values.push(`{${params.exportFormats.join(',')}}`);
    }

    updates.push(`updated_by = $${paramIndex++}`, `updated_at = NOW()`);
    values.push(userId);

    values.push(scheduleId);

    const result = await this.db.query(
      `UPDATE scheduled_compliance_reports
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const schedule = this.mapScheduleFromDb(result.rows[0]);

    // Reschedule job
    await this.removeJob(scheduleId);
    await this.scheduleJob(schedule);

    return schedule;
  }

  /**
   * Delete a scheduled report
   */
  async deleteSchedule(scheduleId: string, userId: string): Promise<void> {
    await this.db.query(
      `UPDATE scheduled_compliance_reports
       SET deleted = true, deleted_at = NOW(), deleted_by = $1, is_enabled = false
       WHERE id = $2`,
      [userId, scheduleId]
    );

    await this.removeJob(scheduleId);
  }

  /**
   * Enable/disable a schedule
   */
  async toggleSchedule(scheduleId: string, enabled: boolean, userId: string): Promise<void> {
    await this.db.query(
      `UPDATE scheduled_compliance_reports
       SET is_enabled = $1, updated_by = $2, updated_at = NOW()
       WHERE id = $3`,
      [enabled, userId, scheduleId]
    );

    if (enabled) {
      const result = await this.db.query(
        `SELECT * FROM scheduled_compliance_reports WHERE id = $1`,
        [scheduleId]
      );
      if (result.rows.length > 0) {
        await this.scheduleJob(this.mapScheduleFromDb(result.rows[0]));
      }
    } else {
      await this.removeJob(scheduleId);
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRunTime(params: ScheduleReportParams): Date {
    const now = new Date();
    const [hours, minutes] = (params.timeOfDay || '02:00:00').split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (params.frequency) {
      case 'WEEKLY':
        // Set to next occurrence of day of week
        const targetDay = params.dayOfWeek || 1; // Default to Monday
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        break;

      case 'MONTHLY':
        // Set to next occurrence of day of month
        const targetDate = params.dayOfMonth || 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case 'QUARTERLY':
        // Set to first day of next quarter
        const currentMonth = nextRun.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3 + 3;
        nextRun.setMonth(quarterStartMonth, 1);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 3);
        }
        break;

      case 'ANNUALLY':
        // Set to specific date next year
        nextRun.setFullYear(nextRun.getFullYear() + 1);
        nextRun.setMonth(0, 1); // January 1st by default
        break;

      case 'ON_DEMAND':
        // No automatic scheduling
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    }

    return nextRun;
  }

  /**
   * Add job to queue
   */
  private async scheduleJob(schedule: ScheduledComplianceReport): Promise<void> {
    if (!schedule.isEnabled || !schedule.nextRunAt) {
      return;
    }

    const delay = schedule.nextRunAt.getTime() - Date.now();

    if (delay < 0) {
      console.warn(`Schedule ${schedule.id} is in the past, skipping`);
      return;
    }

    const jobData: ScheduleJobData = {
      scheduledReportId: schedule.id,
      organizationId: schedule.organizationId,
      templateId: schedule.templateId,
      branchId: schedule.branchId || undefined,
      periodStartDate: this.calculatePeriodStart(schedule),
      periodEndDate: this.calculatePeriodEnd(schedule),
      exportFormats: schedule.exportFormats,
      autoSubmit: schedule.autoSubmit
    };

    await this.queue.add(
      `scheduled-report-${schedule.id}`,
      jobData,
      {
        jobId: schedule.id,
        delay,
        removeOnComplete: true,
        removeOnFail: false
      }
    );
  }

  /**
   * Remove job from queue
   */
  private async removeJob(scheduleId: string): Promise<void> {
    const job = await this.queue.getJob(scheduleId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Process scheduled report generation
   */
  private async processScheduledReport(data: ScheduleJobData): Promise<void> {
    try {
      const request: GenerateReportRequest = {
        templateId: data.templateId,
        organizationId: data.organizationId,
        branchId: data.branchId,
        periodStartDate: new Date(data.periodStartDate),
        periodEndDate: new Date(data.periodEndDate),
        exportFormats: data.exportFormats as any[],
        autoSubmit: data.autoSubmit
      };

      // Generate the report
      const report = await this.reportService.generateReport(request, 'system');

      // Update schedule with last run info
      await this.db.query(
        `UPDATE scheduled_compliance_reports
         SET last_run_at = NOW(),
             last_generated_report_id = $1,
             next_run_at = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [
          report.id,
          this.calculateNextRunTime({
            frequency: data.exportFormats[0] as any, // Placeholder
            templateId: data.templateId,
            organizationId: data.organizationId,
            scheduleName: '',
            exportFormats: data.exportFormats as any[],
            deliveryMethod: 'EMAIL',
            deliveryConfig: {}
          }),
          data.scheduledReportId
        ]
      );

      // Reschedule for next run
      const scheduleResult = await this.db.query(
        `SELECT * FROM scheduled_compliance_reports WHERE id = $1`,
        [data.scheduledReportId]
      );

      if (scheduleResult.rows.length > 0) {
        await this.scheduleJob(this.mapScheduleFromDb(scheduleResult.rows[0]));
      }
    } catch (error) {
      console.error('Failed to process scheduled report:', error);
      throw error;
    }
  }

  /**
   * Calculate period start date based on schedule
   */
  private calculatePeriodStart(schedule: ScheduledComplianceReport): Date {
    const now = new Date();

    switch (schedule.frequency) {
      case 'WEEKLY':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        return weekStart;

      case 'MONTHLY':
        const monthStart = new Date(now);
        monthStart.setMonth(monthStart.getMonth() - 1, 1);
        return monthStart;

      case 'QUARTERLY':
        const quarterStart = new Date(now);
        const currentMonth = quarterStart.getMonth();
        const prevQuarterStart = Math.floor((currentMonth - 3) / 3) * 3;
        quarterStart.setMonth(prevQuarterStart, 1);
        return quarterStart;

      case 'ANNUALLY':
        const yearStart = new Date(now);
        yearStart.setFullYear(yearStart.getFullYear() - 1, 0, 1);
        return yearStart;

      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  /**
   * Calculate period end date based on schedule
   */
  private calculatePeriodEnd(schedule: ScheduledComplianceReport): Date {
    const start = this.calculatePeriodStart(schedule);

    switch (schedule.frequency) {
      case 'WEEKLY':
        const weekEnd = new Date(start);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return weekEnd;

      case 'MONTHLY':
        const monthEnd = new Date(start);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
        return monthEnd;

      case 'QUARTERLY':
        const quarterEnd = new Date(start);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3, 0);
        return quarterEnd;

      case 'ANNUALLY':
        const yearEnd = new Date(start);
        yearEnd.setFullYear(yearEnd.getFullYear() + 1, 0, 0);
        return yearEnd;

      default:
        return new Date();
    }
  }

  /**
   * Map database row to ScheduledComplianceReport
   */
  private mapScheduleFromDb(row: any): ScheduledComplianceReport {
    return {
      id: row.id,
      templateId: row.template_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      scheduleName: row.schedule_name,
      frequency: row.frequency,
      dayOfMonth: row.day_of_month,
      dayOfWeek: row.day_of_week,
      monthOfYear: row.month_of_year,
      quarter: row.quarter,
      timeOfDay: row.time_of_day,
      dateRangeType: row.date_range_type,
      lookbackDays: row.lookback_days,
      exportFormats: row.export_formats,
      autoSubmit: row.auto_submit,
      deliveryMethod: row.delivery_method,
      deliveryConfig: row.delivery_config,
      isEnabled: row.is_enabled,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      lastGeneratedReportId: row.last_generated_report_id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      deletedAt: row.deleted_at,
      version: row.version || 1,
      deletedBy: row.deleted_by
    };
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}
