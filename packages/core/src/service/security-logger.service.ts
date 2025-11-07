/**
 * Security Logging Service
 *
 * Specialized service for logging security-related events and detecting suspicious activity.
 * Built on top of the AuditService for compliance and security monitoring.
 */

import { Database } from '../db/connection.js';
import { AuditService } from '../audit/audit-service.js';
import { UserContext } from '../types/base.js';

/**
 * Security event types
 */
export type SecurityEventType =
  | 'login_failed'
  | 'login_success'
  | 'logout'
  | 'unauthorized_access'
  | 'suspicious_activity'
  | 'data_export'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'token_revoked'
  | 'account_locked'
  | 'brute_force_detected'
  | 'rate_limit_exceeded';

/**
 * Security event details
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent: string;
  resource?: string;
  details?: Record<string, unknown>;
}

/**
 * Brute force detection result
 */
export interface BruteForceCheck {
  isBlocked: boolean;
  attemptCount: number;
  remainingAttempts: number;
  resetTime: Date;
}

/**
 * Security Logger Service
 * Provides security event logging and threat detection
 */
export class SecurityLoggerService {
  private auditService: AuditService;
  private database: Database;

  constructor(database: Database) {
    this.database = database;
    this.auditService = new AuditService(database);
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent, context?: UserContext): Promise<void> {
    // If no user context provided, create a minimal one for logging
    const logContext: UserContext = context ?? {
      userId: event.userId ?? 'anonymous',
      organizationId: 'system',
      roles: [],
      permissions: [],
      branchIds: []
    };

    await this.auditService.logEvent(logContext, {
      eventType: 'SECURITY',
      resource: event.resource ?? 'SECURITY',
      resourceId: event.userId ?? 'anonymous',
      action: event.type.toUpperCase(),
      result: this.isFailureEvent(event.type) ? 'FAILURE' : 'SUCCESS',
      metadata: {
        ...event.details,
        eventType: event.type
      },
      ipAddress: event.ip,
      userAgent: event.userAgent
    });

    // Alert on critical events
    if (this.isCriticalEvent(event.type)) {
      await this.alertSecurityTeam(event);
    }
  }

  /**
   * Check if event type indicates a failure
   */
  private isFailureEvent(type: SecurityEventType): boolean {
    const failureEvents: SecurityEventType[] = [
      'login_failed',
      'unauthorized_access',
      'suspicious_activity',
      'brute_force_detected',
      'rate_limit_exceeded'
    ];
    return failureEvents.includes(type);
  }

  /**
   * Check if event is critical and requires immediate attention
   */
  private isCriticalEvent(type: SecurityEventType): boolean {
    const criticalEvents: SecurityEventType[] = [
      'suspicious_activity',
      'brute_force_detected',
      'account_locked'
    ];
    return criticalEvents.includes(type);
  }

  /**
   * Alert security team about critical events
   * In production, this should integrate with:
   * - Slack/Discord webhooks
   * - Email alerts
   * - PagerDuty/OpsGenie
   * - SIEM systems
   */
  private async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    // Log to console for now
    console.error('🚨 SECURITY ALERT:', {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      resource: event.resource,
      timestamp: new Date().toISOString(),
      details: event.details
    });

    // NOTE: Implement actual alerting mechanism in production:
    // - Send to Slack webhook
    // - Email security team
    // - Create incident ticket
  }

  /**
   * Detect potential brute force attacks
   * Checks for repeated failed login attempts from same IP or for same user
   */
  async detectBruteForce(
    identifier: string,
    identifierType: 'ip' | 'user',
    windowMinutes: number = 15,
    maxAttempts: number = 5
  ): Promise<BruteForceCheck> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const query = `
      SELECT COUNT(*) as attempt_count
      FROM audit_events
      WHERE event_type = 'SECURITY'
        AND action = 'LOGIN_FAILED'
        AND timestamp >= $1
        AND ${identifierType === 'ip' ? 'ip_address' : 'user_id'} = $2
    `;

    const result = await this.database.query(query, [windowStart, identifier]);
    const firstRow = result.rows[0] as Record<string, unknown> | undefined;
    const attemptCount = parseInt((firstRow?.['attempt_count'] as string | undefined) ?? '0');

    const resetTime = new Date(Date.now() + windowMinutes * 60 * 1000);
    const isBlocked = attemptCount >= maxAttempts;
    const remainingAttempts = Math.max(0, maxAttempts - attemptCount);

    // If brute force detected, log it
    if (isBlocked) {
      await this.logSecurityEvent({
        type: 'brute_force_detected',
        userId: identifierType === 'user' ? identifier : undefined,
        ip: identifierType === 'ip' ? identifier : 'unknown',
        userAgent: 'system',
        details: {
          attemptCount,
          windowMinutes,
          identifierType
        }
      });
    }

    return {
      isBlocked,
      attemptCount,
      remainingAttempts,
      resetTime
    };
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(
    email: string,
    ip: string,
    userAgent: string,
    reason: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'login_failed',
      ip,
      userAgent,
      resource: 'AUTH',
      details: {
        email,
        reason
      }
    });
  }

  /**
   * Log successful login
   */
  async logSuccessfulLogin(
    userId: string,
    ip: string,
    userAgent: string,
    context: UserContext
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'login_success',
      userId,
      ip,
      userAgent,
      resource: 'AUTH'
    }, context);
  }

  /**
   * Log suspicious activity
   * Should be called when detecting anomalous behavior:
   * - Unusual access patterns
   * - Access to sensitive data outside normal hours
   * - Rapid successive access to many records
   * - Access from unusual locations
   */
  async logSuspiciousActivity(
    userId: string,
    ip: string,
    userAgent: string,
    reason: string,
    details: Record<string, unknown>,
    context: UserContext
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'suspicious_activity',
      userId,
      ip,
      userAgent,
      resource: 'SECURITY',
      details: {
        reason,
        ...details
      }
    }, context);
  }

  /**
   * Log data export event
   * HIPAA compliance requirement to track PHI exports
   */
  async logDataExport(
    userId: string,
    ip: string,
    userAgent: string,
    exportType: string,
    recordCount: number,
    context: UserContext
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'data_export',
      userId,
      ip,
      userAgent,
      resource: 'DATA_EXPORT',
      details: {
        exportType,
        recordCount
      }
    }, context);
  }

  /**
   * Get recent security events for monitoring
   */
  async getRecentSecurityEvents(
    limit: number = 100,
    eventTypes?: SecurityEventType[]
  ): Promise<Array<{
    timestamp: Date;
    type: string;
    userId?: string;
    ip?: string;
    resource?: string;
    result: string;
  }>> {
    let query = `
      SELECT
        timestamp,
        action as type,
        user_id,
        ip_address,
        resource,
        result
      FROM audit_events
      WHERE event_type = 'SECURITY'
    `;

    const params: unknown[] = [];

    if (eventTypes !== undefined && eventTypes.length > 0) {
      const placeholders = eventTypes.map((_, i) => `$${i + 1}`).join(', ');
      query += ` AND action IN (${placeholders})`;
      params.push(...eventTypes.map(t => t.toUpperCase()));
    }

    const limitPlaceholder = `$${params.length + 1}`;
    query += ` ORDER BY timestamp DESC LIMIT ${limitPlaceholder}`;
    params.push(limit);

    const result = await this.database.query(query, params);

    return result.rows.map(row => ({
      timestamp: (row as Record<string, unknown>)['timestamp'] as Date,
      type: (row as Record<string, unknown>)['type'] as string,
      userId: (row as Record<string, unknown>)['user_id'] as string | undefined,
      ip: (row as Record<string, unknown>)['ip_address'] as string | undefined,
      resource: (row as Record<string, unknown>)['resource'] as string | undefined,
      result: (row as Record<string, unknown>)['result'] as string
    }));
  }
}

/**
 * Singleton instance
 */
let securityLoggerInstance: SecurityLoggerService | null = null;

export function getSecurityLogger(database: Database): SecurityLoggerService {
  securityLoggerInstance ??= new SecurityLoggerService(database);
  return securityLoggerInstance;
}
