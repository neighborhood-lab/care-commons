/**
 * Compliance Report Audit Service
 *
 * Manages audit trail for all compliance reporting operations
 */

import type { Pool } from 'pg';
import type {
  ComplianceReportAuditTrail,
  AuditEventCategory,
  ActorType
} from '@care-commons/core/types/compliance-reporting.js';

interface LogEventParams {
  reportId: string;
  submissionId?: string;
  eventType: string;
  eventCategory: AuditEventCategory;
  eventDescription: string;
  userId?: string;
  actorType: ActorType;
  actorName?: string;
  eventData?: Record<string, unknown>;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class AuditService {
  constructor(private db: Pool) {}

  /**
   * Log an audit event
   */
  async logEvent(params: LogEventParams): Promise<ComplianceReportAuditTrail> {
    const result = await this.db.query(
      `INSERT INTO compliance_report_audit_trail (
        report_id,
        submission_id,
        event_type,
        event_category,
        event_description,
        user_id,
        actor_type,
        actor_name,
        event_data,
        before_state,
        after_state,
        ip_address,
        user_agent,
        session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        params.reportId,
        params.submissionId || null,
        params.eventType,
        params.eventCategory,
        params.eventDescription,
        params.userId || null,
        params.actorType,
        params.actorName || null,
        JSON.stringify(params.eventData || {}),
        JSON.stringify(params.beforeState || {}),
        JSON.stringify(params.afterState || {}),
        params.ipAddress || null,
        params.userAgent || null,
        params.sessionId || null
      ]
    );

    return this.mapAuditTrailFromDb(result.rows[0]);
  }

  /**
   * Get audit trail for a report
   */
  async getAuditTrail(reportId: string): Promise<ComplianceReportAuditTrail[]> {
    const result = await this.db.query(
      `SELECT * FROM compliance_report_audit_trail
       WHERE report_id = $1
       ORDER BY event_timestamp DESC`,
      [reportId]
    );

    return result.rows.map(row => this.mapAuditTrailFromDb(row));
  }

  /**
   * Get audit trail by event category
   */
  async getAuditTrailByCategory(
    reportId: string,
    category: AuditEventCategory
  ): Promise<ComplianceReportAuditTrail[]> {
    const result = await this.db.query(
      `SELECT * FROM compliance_report_audit_trail
       WHERE report_id = $1 AND event_category = $2
       ORDER BY event_timestamp DESC`,
      [reportId, category]
    );

    return result.rows.map(row => this.mapAuditTrailFromDb(row));
  }

  /**
   * Get recent audit events across all reports
   */
  async getRecentEvents(limit: number = 100): Promise<ComplianceReportAuditTrail[]> {
    const result = await this.db.query(
      `SELECT * FROM compliance_report_audit_trail
       ORDER BY event_timestamp DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => this.mapAuditTrailFromDb(row));
  }

  /**
   * Get audit events by user
   */
  async getEventsByUser(userId: string, limit: number = 100): Promise<ComplianceReportAuditTrail[]> {
    const result = await this.db.query(
      `SELECT * FROM compliance_report_audit_trail
       WHERE user_id = $1
       ORDER BY event_timestamp DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapAuditTrailFromDb(row));
  }

  /**
   * Log report generation event
   */
  async logGeneration(
    reportId: string,
    userId: string,
    recordCount: number,
    templateId: string
  ): Promise<void> {
    await this.logEvent({
      reportId,
      eventType: 'REPORT_GENERATED',
      eventCategory: 'GENERATION',
      eventDescription: `Compliance report generated with ${recordCount} records`,
      userId,
      actorType: 'USER',
      eventData: {
        templateId,
        recordCount
      }
    });
  }

  /**
   * Log report validation event
   */
  async logValidation(
    reportId: string,
    userId: string,
    validationPassed: boolean,
    errorCount: number,
    warningCount: number
  ): Promise<void> {
    await this.logEvent({
      reportId,
      eventType: validationPassed ? 'VALIDATION_PASSED' : 'VALIDATION_FAILED',
      eventCategory: 'VALIDATION',
      eventDescription: `Report validation ${validationPassed ? 'passed' : 'failed'} with ${errorCount} errors and ${warningCount} warnings`,
      userId,
      actorType: 'USER',
      eventData: {
        validationPassed,
        errorCount,
        warningCount
      }
    });
  }

  /**
   * Log report export event
   */
  async logExport(
    reportId: string,
    userId: string,
    format: string,
    filePath: string
  ): Promise<void> {
    await this.logEvent({
      reportId,
      eventType: 'REPORT_EXPORTED',
      eventCategory: 'EXPORT',
      eventDescription: `Report exported to ${format}`,
      userId,
      actorType: 'USER',
      eventData: {
        format,
        filePath
      }
    });
  }

  /**
   * Log report submission event
   */
  async logSubmission(
    reportId: string,
    submissionId: string,
    userId: string,
    method: string,
    destination: string
  ): Promise<void> {
    await this.logEvent({
      reportId,
      submissionId,
      eventType: 'REPORT_SUBMITTED',
      eventCategory: 'SUBMISSION',
      eventDescription: `Report submitted via ${method} to ${destination}`,
      userId,
      actorType: 'USER',
      eventData: {
        method,
        destination
      }
    });
  }

  /**
   * Log report approval event
   */
  async logApproval(
    reportId: string,
    userId: string,
    approved: boolean,
    notes?: string
  ): Promise<void> {
    await this.logEvent({
      reportId,
      eventType: approved ? 'REPORT_APPROVED' : 'REPORT_REJECTED',
      eventCategory: 'APPROVAL',
      eventDescription: `Report ${approved ? 'approved' : 'rejected'}${notes ? ': ' + notes : ''}`,
      userId,
      actorType: 'USER',
      eventData: {
        approved,
        notes
      }
    });
  }

  /**
   * Log report modification event
   */
  async logModification(
    reportId: string,
    userId: string,
    changes: Record<string, { from: unknown; to: unknown }>
  ): Promise<void> {
    const fieldNames = Object.keys(changes).join(', ');

    await this.logEvent({
      reportId,
      eventType: 'REPORT_MODIFIED',
      eventCategory: 'MODIFICATION',
      eventDescription: `Report modified: ${fieldNames}`,
      userId,
      actorType: 'USER',
      eventData: { changes }
    });
  }

  /**
   * Log report access event
   */
  async logAccess(
    reportId: string,
    userId: string,
    accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT'
  ): Promise<void> {
    await this.logEvent({
      reportId,
      eventType: `REPORT_${accessType}`,
      eventCategory: 'ACCESS',
      eventDescription: `Report accessed: ${accessType}`,
      userId,
      actorType: 'USER',
      eventData: {
        accessType
      }
    });
  }

  /**
   * Map database row to ComplianceReportAuditTrail
   */
  private mapAuditTrailFromDb(row: any): ComplianceReportAuditTrail {
    return {
      id: row.id,
      reportId: row.report_id,
      submissionId: row.submission_id,
      eventTimestamp: row.event_timestamp,
      eventType: row.event_type,
      eventCategory: row.event_category,
      eventDescription: row.event_description,
      userId: row.user_id,
      actorType: row.actor_type,
      actorName: row.actor_name,
      eventData: row.event_data,
      beforeState: row.before_state,
      afterState: row.after_state,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      sessionId: row.session_id,
      createdAt: row.created_at
    };
  }
}
