/**
 * Client Access Audit Service
 * 
 * Implements HIPAA-compliant audit logging for client record access and disclosure.
 * Required for Texas Privacy Protection Act and general HIPAA compliance.
 * 
 * Per HIPAA Security Rule §164.312(b): "Implement hardware, software, and/or
 * procedural mechanisms that record and examine activity in information systems
 * that contain or use electronic protected health information."
 * 
 * Texas Privacy Protection Act adds additional requirements for biometric data
 * and geolocation tracking.
 */

import { UUID } from '@care-commons/core';

/**
 * Database interface for executing queries
 */
export interface DatabaseConnection {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export interface ClientAccessAuditEntry {
  id?: UUID;
  clientId: UUID;
  accessedBy: UUID;
  accessType: AccessType;
  accessTimestamp: Date;
  accessReason?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // For DISCLOSURE type
  disclosureRecipient?: string;
  disclosureMethod?: DisclosureMethod;
  authorizationReference?: string;
  informationDisclosed?: string;
}

export type AccessType = 
  | 'VIEW' 
  | 'UPDATE' 
  | 'CREATE' 
  | 'DELETE' 
  | 'DISCLOSURE' 
  | 'EXPORT' 
  | 'PRINT';

export type DisclosureMethod = 
  | 'VERBAL' 
  | 'WRITTEN' 
  | 'ELECTRONIC' 
  | 'FAX' 
  | 'PORTAL';

export interface AuditQuery {
  clientId?: UUID;
  accessedBy?: UUID;
  accessType?: AccessType[];
  startDate?: Date;
  endDate?: Date;
  disclosuresOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  entries: ClientAccessAuditEntry[];
  totalCount: number;
  clientId?: UUID;
  dateRange: { start: Date; end: Date };
  disclosureCount: number;
  accessCount: number;
}

export class ClientAuditService {
  constructor(private db: DatabaseConnection) {}

  /**
   * Log client record access
   * 
   * Must be called for every access to client PHI
   */
  async logAccess(entry: ClientAccessAuditEntry): Promise<UUID> {
    // Validate required fields
    this.validateEntry(entry);
    
    // Insert audit entry
    const result = await this.db.query(
      `INSERT INTO client_access_audit (
        client_id,
        accessed_by,
        access_type,
        access_timestamp,
        access_reason,
        ip_address,
        user_agent,
        disclosure_recipient,
        disclosure_method,
        authorization_reference,
        information_disclosed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        entry.clientId,
        entry.accessedBy,
        entry.accessType,
        entry.accessTimestamp ?? new Date(),
        entry.accessReason,
        entry.ipAddress,
        entry.userAgent,
        entry.disclosureRecipient,
        entry.disclosureMethod,
        entry.authorizationReference,
        entry.informationDisclosed,
      ]
    );
    
    return result.rows[0]?.['id'] as UUID;
  }

  /**
   * Log disclosure of client information
   * 
   * Special logging for disclosures per HIPAA §164.528
   */
  async logDisclosure(
    clientId: UUID,
    accessedBy: UUID,
    recipient: string,
    method: DisclosureMethod,
    informationDisclosed: string,
    authorizationRef?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UUID> {
    const entry: ClientAccessAuditEntry = {
      clientId,
      accessedBy,
      accessType: 'DISCLOSURE',
      accessTimestamp: new Date(),
      disclosureRecipient: recipient,
      disclosureMethod: method,
      informationDisclosed,
    };
    
    if (reason !== undefined) entry.accessReason = reason;
    if (ipAddress !== undefined) entry.ipAddress = ipAddress;
    if (userAgent !== undefined) entry.userAgent = userAgent;
    if (authorizationRef !== undefined) entry.authorizationReference = authorizationRef;
    
    return this.logAccess(entry);
  }

  /**
   * Query audit logs
   * 
   * Supports filtering by various criteria for compliance reporting
   */
  async queryAuditLog(query: AuditQuery): Promise<AuditReport> {
    // Build WHERE clause
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (query.clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      params.push(query.clientId);
    }
    
    if (query.accessedBy) {
      conditions.push(`accessed_by = $${paramIndex++}`);
      params.push(query.accessedBy);
    }
    
    if (query.accessType && query.accessType.length > 0) {
      conditions.push(`access_type = ANY($${paramIndex++})`);
      params.push(query.accessType);
    }
    
    if (query.startDate) {
      conditions.push(`access_timestamp >= $${paramIndex++}`);
      params.push(query.startDate);
    }
    
    if (query.endDate) {
      conditions.push(`access_timestamp <= $${paramIndex++}`);
      params.push(query.endDate);
    }
    
    if (query.disclosuresOnly === true) {
      conditions.push(`access_type = 'DISCLOSURE'`);
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) as total FROM client_access_audit ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0]?.['total'] as string, 10);
    
    // Get entries with pagination
    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;
    
    const entriesResult = await this.db.query(
      `SELECT * FROM client_access_audit ${whereClause}
       ORDER BY access_timestamp DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );
    
    // Get disclosure count
    const disclosureResult = await this.db.query(
      `SELECT COUNT(*) as count FROM client_access_audit 
       ${whereClause}${whereClause ? ' AND' : 'WHERE'} access_type = 'DISCLOSURE'`,
      params
    );
    const disclosureCount = parseInt(disclosureResult.rows[0]?.['count'] as string, 10);
    
    const report: AuditReport = {
      entries: entriesResult.rows.map(this.mapRowToEntry),
      totalCount,
      dateRange: {
        start: query.startDate ?? new Date(0),
        end: query.endDate ?? new Date(),
      },
      disclosureCount,
      accessCount: totalCount - disclosureCount,
    };
    
    if (query.clientId) {
      report.clientId = query.clientId;
    }
    
    return report;
  }

  /**
   * Get disclosure history for a client
   * 
   * Per HIPAA §164.528, patients have the right to an accounting of disclosures
   */
  async getDisclosureHistory(
    clientId: UUID,
    startDate?: Date,
    endDate?: Date
  ): Promise<ClientAccessAuditEntry[]> {
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
    
    const report = await this.queryAuditLog({
      clientId,
      accessType: ['DISCLOSURE'],
      startDate: startDate ?? sixYearsAgo,
      endDate: endDate ?? new Date(),
      limit: 1000, // HIPAA requires 6 years of disclosure history
    });
    
    return report.entries;
  }

  /**
   * Get access summary for a client
   * 
   * Useful for compliance audits and investigating unauthorized access
   */
  async getAccessSummary(
    clientId: UUID,
    days: number = 30
  ): Promise<{
    totalAccess: number;
    accessByType: Map<AccessType, number>;
    accessByUser: Map<UUID, number>;
    disclosures: number;
    suspiciousActivity: boolean;
    unusualAccessPatterns: string[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const report = await this.queryAuditLog({
      clientId,
      startDate,
      limit: 10000,
    });
    
    // Aggregate by type
    const accessByType = new Map<AccessType, number>();
    const accessByUser = new Map<UUID, number>();
    
    for (const entry of report.entries) {
      // Count by type
      const typeCount = accessByType.get(entry.accessType) ?? 0;
      accessByType.set(entry.accessType, typeCount + 1);
      
      // Count by user
      const userCount = accessByUser.get(entry.accessedBy) ?? 0;
      accessByUser.set(entry.accessedBy, userCount + 1);
    }
    
    // Detect unusual patterns
    const unusualPatterns: string[] = [];
    
    // Check for excessive access by single user
    for (const [userId, count] of accessByUser.entries()) {
      if (count > 50) {
        unusualPatterns.push(`User ${userId} accessed record ${count} times in ${days} days`);
      }
    }
    
    // Check for access outside normal hours
    const afterHoursAccess = report.entries.filter((entry) => {
      const hour = entry.accessTimestamp.getHours();
      return hour < 6 || hour > 22; // Before 6am or after 10pm
    });
    
    if (afterHoursAccess.length > 5) {
      unusualPatterns.push(`${afterHoursAccess.length} access events outside normal hours`);
    }
    
    return {
      totalAccess: report.totalCount,
      accessByType,
      accessByUser,
      disclosures: report.disclosureCount,
      suspiciousActivity: unusualPatterns.length > 0,
      unusualAccessPatterns: unusualPatterns,
    };
  }

  /**
   * Export audit log for compliance reporting
   * 
   * Generates CSV format for external audits
   */
  async exportAuditLog(query: AuditQuery): Promise<string> {
    const report = await this.queryAuditLog({ ...query, limit: 100000 });
    
    // CSV headers
    const headers = [
      'Timestamp',
      'Client ID',
      'Accessed By',
      'Access Type',
      'Reason',
      'IP Address',
      'Disclosure Recipient',
      'Disclosure Method',
      'Authorization',
      'Information Disclosed',
    ];
    
    // CSV rows
    const rows = report.entries.map((entry) => [
      entry.accessTimestamp.toISOString(),
      entry.clientId,
      entry.accessedBy,
      entry.accessType,
      entry.accessReason ?? '',
      entry.ipAddress ?? '',
      entry.disclosureRecipient ?? '',
      entry.disclosureMethod ?? '',
      entry.authorizationReference ?? '',
      entry.informationDisclosed ?? '',
    ]);
    
    // Build CSV
    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    
    // Log the export itself
    await this.logAccess({
      clientId: query.clientId ?? ('00000000-0000-0000-0000-000000000000' as UUID),
      accessedBy: ('SYSTEM' as unknown) as UUID, // System export
      accessType: 'EXPORT',
      accessTimestamp: new Date(),
      accessReason: 'Audit log export for compliance reporting',
    });
    
    return csv;
  }

  /**
   * Validate audit entry
   */
  private validateEntry(entry: ClientAccessAuditEntry): void {
    if (!entry.clientId) {
      throw new Error('Client ID is required for audit log');
    }
    
    if (!entry.accessedBy) {
      throw new Error('Accessed by user ID is required for audit log');
    }
    
    if (!entry.accessType) {
      throw new Error('Access type is required for audit log');
    }
    
    // Validate disclosure fields if disclosure type
    if (entry.accessType === 'DISCLOSURE') {
      if (!entry.disclosureRecipient || entry.disclosureRecipient === '') {
        throw new Error('Disclosure recipient is required for DISCLOSURE type');
      }
      
      if (!entry.disclosureMethod) {
        throw new Error('Disclosure method is required for DISCLOSURE type');
      }
      
      if (!entry.informationDisclosed || entry.informationDisclosed === '') {
        throw new Error('Information disclosed is required for DISCLOSURE type');
      }
    }
  }

  /**
   * Map database row to audit entry
   */
  private mapRowToEntry(row: Record<string, unknown>): ClientAccessAuditEntry {
    const entry: ClientAccessAuditEntry = {
      id: row['id'] as string,
      clientId: row['client_id'] as string,
      accessedBy: row['accessed_by'] as string,
      accessType: row['access_type'] as AccessType,
      accessTimestamp: row['access_timestamp'] as Date,
    };
    
    // Only add optional properties if they exist and are not undefined
    if (row['access_reason'] !== undefined && row['access_reason'] !== null) {
      entry.accessReason = row['access_reason'] as string;
    }
    if (row['ip_address'] !== undefined && row['ip_address'] !== null) {
      entry.ipAddress = row['ip_address'] as string;
    }
    if (row['user_agent'] !== undefined && row['user_agent'] !== null) {
      entry.userAgent = row['user_agent'] as string;
    }
    if (row['disclosure_recipient'] !== undefined && row['disclosure_recipient'] !== null) {
      entry.disclosureRecipient = row['disclosure_recipient'] as string;
    }
    if (row['disclosure_method'] !== undefined && row['disclosure_method'] !== null) {
      entry.disclosureMethod = row['disclosure_method'] as DisclosureMethod;
    }
    if (row['authorization_reference'] !== undefined && row['authorization_reference'] !== null) {
      entry.authorizationReference = row['authorization_reference'] as string;
    }
    if (row['information_disclosed'] !== undefined && row['information_disclosed'] !== null) {
      entry.informationDisclosed = row['information_disclosed'] as string;
    }
    
    return entry;
  }
}
