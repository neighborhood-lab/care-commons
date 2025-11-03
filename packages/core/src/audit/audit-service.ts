/**
 * Audit logging service for compliance and security
 */

import { v4 as uuidv4 } from 'uuid';
import { Database } from '../db/connection';
import { UserContext, Timestamp } from '../types/base';

export interface AuditEvent {
  eventId: string;
  timestamp: Timestamp;
  userId: string;
  organizationId: string;
  eventType: AuditEventType;
  resource: string;
  resourceId: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditEventType =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'CONFIGURATION'
  | 'SECURITY'
  | 'COMPLIANCE';

/**
 * Type for creating audit events (omits server-generated fields)
 */
export type CreateAuditEvent = Omit<
  AuditEvent,
  'eventId' | 'timestamp' | 'userId' | 'organizationId'
>;

/**
 * Audit service for tracking security and compliance events
 */
export class AuditService {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  /**
   * Log an audit event
   */
  async logEvent(context: UserContext, event: CreateAuditEvent): Promise<void> {
    const eventId = uuidv4();
    const timestamp = new Date();

    const query = `
      INSERT INTO audit_events (
        event_id, timestamp, user_id, organization_id, event_type,
        resource, resource_id, action, result, metadata, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    await this.database.query(query, [
      eventId,
      timestamp,
      context.userId,
      context.organizationId,
      event.eventType,
      event.resource,
      event.resourceId,
      event.action,
      event.result,
      JSON.stringify(event.metadata ?? {}),
      event.ipAddress,
      event.userAgent,
    ]);
  }

  /**
   * Log successful data access
   */
  async logDataAccess(
    context: UserContext,
    resource: string,
    resourceId: string,
    action: 'READ' | 'SEARCH',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const eventData: CreateAuditEvent = {
      eventType: 'DATA_ACCESS',
      resource,
      resourceId,
      action,
      result: 'SUCCESS',
    };
    if (metadata !== undefined) {
      eventData.metadata = metadata;
    }
    await this.logEvent(context, eventData);
  }

  /**
   * Log data modification
   */
  async logDataModification(
    context: UserContext,
    resource: string,
    resourceId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const eventData: CreateAuditEvent = {
      eventType: 'DATA_MODIFICATION',
      resource,
      resourceId,
      action,
      result: 'SUCCESS',
    };
    if (metadata !== undefined) {
      eventData.metadata = metadata;
    }
    await this.logEvent(context, eventData);
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    context: UserContext,
    action: string,
    result: 'SUCCESS' | 'FAILURE',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const eventData: CreateAuditEvent = {
      eventType: 'SECURITY',
      resource: 'SECURITY',
      resourceId: context.userId,
      action,
      result,
    };
    if (metadata !== undefined) {
      eventData.metadata = metadata;
    }
    await this.logEvent(context, eventData);
  }

  /**
   * Get audit trail for a resource
   */
  async getAuditTrail(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ): Promise<AuditEvent[]> {
    const query = `
      SELECT * FROM audit_events
      WHERE resource = $1 AND resource_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;

    const result = await this.database.query(query, [resourceType, resourceId, limit]);

    return result.rows.map((row): AuditEvent => {
      const event: AuditEvent = {
        eventId: row['event_id'] as string,
        timestamp: row['timestamp'] as Date,
        userId: row['user_id'] as string,
        organizationId: row['organization_id'] as string,
        eventType: row['event_type'] as AuditEventType,
        resource: row['resource'] as string,
        resourceId: row['resource_id'] as string,
        action: row['action'] as string,
        result: row['result'] as 'SUCCESS' | 'FAILURE',
        metadata: JSON.parse(
          (row['metadata'] as string | null) !== null && (row['metadata'] as string).length > 0
            ? (row['metadata'] as string)
            : '{}'
        ),
      };
      const ipAddress = row['ip_address'];
      if (typeof ipAddress === 'string' && ipAddress.length > 0) {
        event.ipAddress = ipAddress;
      }
      const userAgent = row['user_agent'];
      if (typeof userAgent === 'string' && userAgent.length > 0) {
        event.userAgent = userAgent;
      }
      return event;
    });
  }
}
