import { getDatabase } from '@care-commons/core';

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, unknown>;
}

export class SecurityMonitoringService {
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const db = getDatabase();

    await db.query(
      `INSERT INTO security_events (type, severity, user_id, ip_address, user_agent, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.type,
        event.severity,
        event.userId ?? null,
        event.ip,
        event.userAgent,
        JSON.stringify(event.details),
        new Date(),
      ]
    );

    // Alert on critical events
    if (event.severity === 'critical') {
      await this.sendSecurityAlert(event);
    }
  }

  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implement email/Slack notification
    console.error('🚨 SECURITY ALERT:', event);
    // In production, integrate with alerting service (email, Slack, PagerDuty)
  }
}
