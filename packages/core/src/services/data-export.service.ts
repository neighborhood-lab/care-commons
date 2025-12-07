import { Database, getDatabase } from '../db/connection.js';

export interface ExportOptions {
  organizationId: string;
  format: 'json' | 'csv';
  includeDeleted?: boolean;
  tables?: string[];
}

export interface ExportResult {
  format: 'json' | 'csv';
  data: unknown;
  metadata: {
    organizationId: string;
    exportedAt: string;
    tableCount: number;
    recordCount: number;
    includeDeleted: boolean;
  };
}

export interface AuditLogFilters {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  eventType?: string;
  resource?: string;
  action?: string;
  includeRevisions?: boolean;
  includeSecurityEvents?: boolean;
  format: 'json' | 'csv';
}

export interface AuditLogExportResult {
  format: 'json' | 'csv';
  data: unknown;
  metadata: {
    organizationId: string;
    exportedAt: string;
    eventCount: number;
    revisionCount: number;
    securityEventCount: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
    filters: {
      userId?: string;
      eventType?: string;
      resource?: string;
      action?: string;
    };
  };
}

/**
 * Data Export Service
 *
 * Provides comprehensive data export functionality for organizations.
 * Supports JSON and CSV formats with organization-scoped data isolation.
 *
 * Features:
 * - Multi-tenant safe (organization_id scoping)
 * - Soft delete handling
 * - JSONB and array field preservation
 * - Relationship metadata
 */
export class DataExportService {
  private db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Get all exportable tables with organization_id column
   */
  private async getExportableTables(): Promise<string[]> {
    const tables = [
      // Core entities
      'organizations',
      'branches',
      'users',
      'programs',

      // Client demographics
      'clients',

      // Caregiver staff
      'caregivers',

      // Scheduling & visits
      'service_patterns',
      'schedules',
      'visits',
      'visit_exceptions',

      // EVV compliance
      'evv_records',
      'time_entries',
      'geofences',

      // Care plans & tasks
      'care_plans',
      'task_instances',
      'progress_notes',

      // Clinical documentation
      'medications',
      'medication_administrations',
      'incidents',
      'visit_notes',
      'clinical_visit_notes',

      // Billing & invoicing
      'payers',
      'rate_schedules',
      'service_authorizations',
      'billable_items',
      'invoices',
      'payments',
      'claims',

      // Payroll processing
      'pay_periods',
      'time_sheets',
      'pay_runs',
      'pay_stubs',
      'payment_records',
      'ach_batches',
      'tax_configurations',
      'caregiver_deductions',

      // Family engagement
      'family_members',
      'portal_invitations',
      'family_notifications',
      'family_activity_feed',
      'message_threads',
      'messages',
      'family_visit_summaries',
      'care_plan_progress_reports',
      'family_consent',

      // Audit & compliance
      'audit_events',
      'audit_revisions',
    ];

    return tables;
  }

  /**
   * Export organization data in specified format
   */
  async exportData(options: ExportOptions): Promise<ExportResult> {
    const { organizationId, format, includeDeleted = false, tables } = options;

    const exportableTables = tables ?? (await this.getExportableTables());
    const exportData: Record<string, unknown[]> = {};
    let totalRecords = 0;

    for (const tableName of exportableTables) {
      try {
        const records = await this.exportTable(tableName, organizationId, includeDeleted);
        if (records.length > 0) {
          exportData[tableName] = records;
          totalRecords += records.length;
        }
      } catch (error) {
        // Table might not exist or might not have organization_id column
        console.warn(`Skipping table ${tableName}:`, error);
      }
    }

    const metadata = {
      organizationId,
      exportedAt: new Date().toISOString(),
      tableCount: Object.keys(exportData).length,
      recordCount: totalRecords,
      includeDeleted,
    };

    if (format === 'json') {
      return {
        format: 'json',
        data: {
          metadata,
          data: exportData,
        },
        metadata,
      };
    }

    // CSV format - flatten and combine tables
    const csvData = this.convertToCSV(exportData);
    return {
      format: 'csv',
      data: csvData,
      metadata,
    };
  }

  /**
   * Export a single table's data for an organization
   */
  private async exportTable(
    tableName: string,
    organizationId: string,
    includeDeleted: boolean
  ): Promise<unknown[]> {
    // Check if table has organization_id column
    const hasOrgId = await this.hasColumn(tableName, 'organization_id');

    let query: string;
    let params: unknown[];

    if (hasOrgId) {
      // Handle soft deletes
      if (!includeDeleted) {
        const hasDeletedAt = await this.hasColumn(tableName, 'deleted_at');
        if (hasDeletedAt) {
          query = `SELECT * FROM "${tableName}" WHERE organization_id = $1 AND deleted_at IS NULL`;
        } else {
          query = `SELECT * FROM "${tableName}" WHERE organization_id = $1`;
        }
      } else {
        query = `SELECT * FROM "${tableName}" WHERE organization_id = $1`;
      }
      params = [organizationId];
    } else if (tableName === 'organizations') {
      // Special case: export only the organization itself
      query = `SELECT * FROM "${tableName}" WHERE id = $1`;
      params = [organizationId];
    } else {
      // Skip tables without organization scoping
      return [];
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Check if a table has a specific column
   */
  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, columnName]);

      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Convert table data to CSV format
   */
  private convertToCSV(data: Record<string, unknown[]>): string {
    const csvParts: string[] = [];

    for (const [tableName, records] of Object.entries(data)) {
      if (records.length === 0) continue;

      // Add table header
      csvParts.push(`\n# Table: ${tableName}\n`);

      // Get all unique columns across all records
      const columns = new Set<string>();
      for (const record of records) {
        for (const key of Object.keys(record as object)) {
          columns.add(key);
        }
      }
      const columnArray = Array.from(columns);

      // Header row
      csvParts.push(columnArray.map(col => this.escapeCSV(col)).join(','));

      // Data rows
      for (const record of records) {
        const row = columnArray.map(col => {
          const value = (record as Record<string, unknown>)[col];
          return this.formatCSVValue(value);
        });
        csvParts.push(row.join(','));
      }

      csvParts.push(''); // Empty line between tables
    }

    return csvParts.join('\n');
  }

  /**
   * Format a value for CSV output
   */
  private formatCSVValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      // Convert objects/arrays to JSON string
      return this.escapeCSV(JSON.stringify(value));
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    return this.escapeCSV(String(value));
  }

  /**
   * Escape a value for CSV (handle quotes, commas, newlines)
   */
  private escapeCSV(value: string): string {
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Get export metadata without downloading full dataset
   */
  async getExportMetadata(organizationId: string): Promise<{
    tables: Array<{ name: string; recordCount: number }>;
    totalRecords: number;
    estimatedSize: number;
  }> {
    const tables = await this.getExportableTables();
    const tableStats: Array<{ name: string; recordCount: number }> = [];
    let totalRecords = 0;

    for (const tableName of tables) {
      try {
        const hasOrgId = await this.hasColumn(tableName, 'organization_id');

        let query: string;
        let params: unknown[];

        if (hasOrgId) {
          query = `SELECT COUNT(*) as count FROM "${tableName}" WHERE organization_id = $1`;
          params = [organizationId];
        } else if (tableName === 'organizations') {
          query = `SELECT COUNT(*) as count FROM "${tableName}" WHERE id = $1`;
          params = [organizationId];
        } else {
          continue;
        }

        const result = await this.db.query<{ count: string }>(query, params);
        const count = Number(result.rows[0]?.count ?? 0);

        if (count > 0) {
          tableStats.push({ name: tableName, recordCount: count });
          totalRecords += count;
        }
      } catch (error) {
        console.warn(`Skipping table ${tableName}:`, error);
      }
    }

    // Estimate size (rough calculation: 500 bytes per record average)
    const estimatedSize = totalRecords * 500;

    return {
      tables: tableStats,
      totalRecords,
      estimatedSize,
    };
  }

  /**
   * Build base filter conditions for audit log queries
   */
  private buildBaseConditions(
    organizationId: string,
    startDate?: string,
    endDate?: string,
    userId?: string
  ): { conditions: string[]; params: unknown[]; paramIndex: number } {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let paramIndex = 2;

    if (startDate !== undefined) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate !== undefined) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (userId !== undefined) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    return { conditions, params, paramIndex };
  }

  /**
   * Export audit_events with additional filters
   */
  private async exportAuditEvents(
    conditions: string[],
    params: unknown[],
    paramIndex: number,
    eventType?: string,
    resource?: string,
    action?: string
  ): Promise<unknown[]> {
    const eventConditions = [...conditions];
    const eventParams = [...params];
    let eventParamIndex = paramIndex;

    if (eventType !== undefined) {
      eventConditions.push(`event_type = $${eventParamIndex}`);
      eventParams.push(eventType);
      eventParamIndex++;
    }

    if (resource !== undefined) {
      eventConditions.push(`resource = $${eventParamIndex}`);
      eventParams.push(resource);
      eventParamIndex++;
    }

    if (action !== undefined) {
      eventConditions.push(`action = $${eventParamIndex}`);
      eventParams.push(action);
      eventParamIndex++;
    }

    const query = `SELECT * FROM audit_events WHERE ${eventConditions.join(' AND ')} ORDER BY timestamp DESC`;
    const result = await this.db.query(query, eventParams);
    return result.rows;
  }

  /**
   * Export security_events filtered by organization users
   */
  private async exportSecurityEvents(
    organizationId: string,
    startDate?: string,
    endDate?: string,
    userId?: string
  ): Promise<unknown[]> {
    const securityConditions: string[] = [];
    const securityParams: unknown[] = [];
    let securityParamIndex = 1;

    if (startDate !== undefined) {
      securityConditions.push(`created_at >= $${securityParamIndex}`);
      securityParams.push(startDate);
      securityParamIndex++;
    }

    if (endDate !== undefined) {
      securityConditions.push(`created_at <= $${securityParamIndex}`);
      securityParams.push(endDate);
      securityParamIndex++;
    }

    if (userId !== undefined) {
      securityConditions.push(`user_id = $${securityParamIndex}`);
      securityParams.push(userId);
      securityParamIndex++;
    }

    // Get users from this organization to filter security events
    const orgUsersResult = await this.db.query<{ id: string }>(
      'SELECT id FROM users WHERE organization_id = $1',
      [organizationId]
    );
    const userIds = orgUsersResult.rows.map(row => row.id);

    if (userIds.length === 0) {
      return [];
    }

    securityConditions.push(`user_id = ANY($${securityParamIndex})`);
    securityParams.push(userIds);

    const whereClause = securityConditions.length > 0 ? `WHERE ${securityConditions.join(' AND ')}` : '';
    const query = `SELECT * FROM security_events ${whereClause} ORDER BY created_at DESC`;
    const result = await this.db.query(query, securityParams);
    return result.rows;
  }

  /**
   * Export audit logs with filtering options for compliance and legal purposes
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async exportAuditLogs(filters: AuditLogFilters): Promise<AuditLogExportResult> {
    const {
      organizationId,
      startDate,
      endDate,
      userId,
      eventType,
      resource,
      action,
      includeRevisions = true,
      includeSecurityEvents = true,
      format,
    } = filters;

    const exportData: Record<string, unknown[]> = {};

    // Build base conditions
    const { conditions, params, paramIndex } = this.buildBaseConditions(
      organizationId,
      startDate,
      endDate,
      userId
    );

    // Export audit_events
    const auditEvents = await this.exportAuditEvents(
      conditions,
      params,
      paramIndex,
      eventType,
      resource,
      action
    );
    exportData.audit_events = auditEvents;

    // Export audit_revisions if requested
    let revisions: unknown[] = [];
    if (includeRevisions) {
      const query = `SELECT * FROM audit_revisions WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC`;
      const result = await this.db.query(query, params);
      revisions = result.rows;
      exportData.audit_revisions = revisions;
    }

    // Export security_events if requested
    let securityEvents: unknown[] = [];
    if (includeSecurityEvents) {
      securityEvents = await this.exportSecurityEvents(organizationId, startDate, endDate, userId);
      exportData.security_events = securityEvents;
    }

    const metadata = {
      organizationId,
      exportedAt: new Date().toISOString(),
      eventCount: auditEvents.length,
      revisionCount: revisions.length,
      securityEventCount: securityEvents.length,
      dateRange: {
        start: startDate ?? null,
        end: endDate ?? null,
      },
      filters: {
        userId,
        eventType,
        resource,
        action,
      },
    };

    if (format === 'json') {
      return {
        format: 'json',
        data: {
          metadata,
          data: exportData,
        },
        metadata,
      };
    }

    // CSV format - flatten and combine logs
    const csvData = this.convertToCSV(exportData);
    return {
      format: 'csv',
      data: csvData,
      metadata,
    };
  }
}
