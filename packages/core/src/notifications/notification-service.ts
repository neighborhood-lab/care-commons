/**
 * Notification Service
 * 
 * Central notification orchestration with provider pattern, rate limiting, and audit trails.
 */

import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
  NotificationRecipient,
  NotificationChannel,
} from './types.js';
import type { Database } from '../db/connection.js';
import { EmailProvider } from './providers/email-provider.js';
import { PushProvider } from './providers/push-provider.js';

export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();
  private rateLimitCache: Map<string, number[]> = new Map(); // userId -> timestamps of recent notifications

  constructor(database?: Database) {
    this.registerProvider(new EmailProvider());
    
    // Register push provider if database is available
    if (database !== undefined) {
      this.registerProvider(new PushProvider(database));
    }
    
    // Future: Register SMS and InApp providers when needed
  }

  registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  /**
   * Send notification to multiple recipients across multiple channels
   * 
   * Orchestrates notification delivery with rate limiting and error handling.
   * Recipients parameter must be provided with valid user IDs and preferred channels.
   */
  async send(payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const recipient of payload.recipients) {
      const recipientResults = await this.sendToRecipient(payload, recipient);
      results.push(...recipientResults);
    }

    return results;
  }

  /**
   * Send notification to a single recipient across their preferred channels
   */
  private async sendToRecipient(
    payload: NotificationPayload,
    recipient: NotificationRecipient
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Check rate limiting
    if (this.checkRateLimit(recipient.userId, 10) === false) {
      console.warn(`[NOTIFICATION] Rate limit exceeded for user ${recipient.userId}`);
      results.push(this.createRateLimitError(recipient.userId));
      return results;
    }

    // Send via each preferred channel
    for (const channel of recipient.preferredChannels) {
      const result = await this.sendViaChannel(payload, recipient, channel);
      if (result !== null) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Send notification via a specific channel
   */
  private async sendViaChannel(
    payload: NotificationPayload,
    recipient: NotificationRecipient,
    channel: NotificationChannel
  ): Promise<NotificationResult | null> {
    const provider = this.providers.get(channel);
    if (provider === undefined) {
      console.warn(`[NOTIFICATION] No provider for channel ${channel}`);
      return null;
    }

    if (provider.isConfigured() === false) {
      console.warn(`[NOTIFICATION] Provider ${channel} not configured, using mock`);
    }

    try {
      const result = await provider.send(payload, recipient);
      if (result.success) {
        this.recordNotification(recipient.userId);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NOTIFICATION] Error sending via ${channel}:`, errorMessage);
      return this.createSendError(channel, recipient.userId, errorMessage);
    }
  }

  /**
   * Create rate limit error result
   */
  private createRateLimitError(userId: string): NotificationResult {
    return {
      success: false,
      channel: 'EMAIL',
      recipientId: userId,
      sentAt: new Date(),
      error: 'Rate limit exceeded (max 10 notifications per hour)',
    };
  }

  /**
   * Create send error result
   */
  private createSendError(
    channel: NotificationChannel,
    userId: string,
    errorMessage: string
  ): NotificationResult {
    return {
      success: false,
      channel,
      recipientId: userId,
      sentAt: new Date(),
      error: errorMessage,
    };
  }

  /**
   * Check if user has exceeded rate limit (max notifications per hour)
   */
  private checkRateLimit(userId: string, maxPerHour: number): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const timestamps = this.rateLimitCache.get(userId) ?? [];
    const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);

    return recentTimestamps.length < maxPerHour;
  }

  /**
   * Record notification sent (for rate limiting)
   */
  private recordNotification(userId: string): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const timestamps = this.rateLimitCache.get(userId) ?? [];
    const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
    recentTimestamps.push(now);

    this.rateLimitCache.set(userId, recentTimestamps);

    // Cleanup old entries periodically (every 1000 entries)
    if (this.rateLimitCache.size > 1000) {
      const entriesToDelete: string[] = [];
      for (const [uid, ts] of this.rateLimitCache.entries()) {
        const allOld = ts.every(t => t < oneHourAgo);
        if (allOld === true) {
          entriesToDelete.push(uid);
        }
      }
      for (const uid of entriesToDelete) {
        this.rateLimitCache.delete(uid);
      }
    }
  }

  /**
   * Get notification templates for event types
   */
  static getTemplate(eventType: string, data: Record<string, unknown>): { subject: string; message: string } {
    const templates: Record<string, (data: Record<string, unknown>) => { subject: string; message: string }> = {
      VISIT_CLOCK_IN: (d) => ({
        subject: `Visit Started: ${d.caregiverName} checked in`,
        message: `${d.caregiverName} has checked in for the visit with ${d.clientName} at ${d.clockInTime}.`,
      }),
      VISIT_CLOCK_OUT: (d) => ({
        subject: `Visit Completed: ${d.caregiverName} checked out`,
        message: `${d.caregiverName} has completed the visit with ${d.clientName}. Duration: ${d.duration} minutes.`,
      }),
      VISIT_LATE_CLOCK_IN: (d) => ({
        subject: `⚠️ Late Check-In: ${d.caregiverName}`,
        message: `${d.caregiverName} checked in ${d.minutesLate} minutes late for the visit with ${d.clientName}. Scheduled time was ${d.scheduledTime}.`,
      }),
      VISIT_MISSED: (d) => ({
        subject: `🚨 URGENT: Missed Visit - ${d.clientName}`,
        message: `No caregiver has checked in for the visit with ${d.clientName} scheduled at ${d.scheduledTime}. This visit is now ${d.minutesOverdue} minutes overdue. Please contact ${d.caregiverName} immediately.`,
      }),
      VISIT_CANCELED: (d) => ({
        subject: `Visit Canceled: ${String(d.clientName)}`,
        message: `The visit scheduled for ${String(d.scheduledTime)} with ${String(d.clientName)} has been canceled. Reason: ${String(d.reason ?? 'Not specified')}.`,
      }),
      VISIT_NO_SHOW_CAREGIVER: (d) => ({
        subject: `🚨 URGENT: Caregiver No-Show - ${d.caregiverName}`,
        message: `${d.caregiverName} did not show up for the scheduled visit with ${d.clientName} at ${d.scheduledTime}. Immediate action required.`,
      }),
      // Compliance notification templates
      COMPLIANCE_DEADLINE_WARNING: (d) => ({
        subject: `⚠️ Compliance Deadline Approaching: ${d.title}`,
        message: `${d.entityName} has a compliance deadline coming up.\n\n${d.title}\n\nDue: ${d.deadlineDate}\nDays remaining: ${d.daysRemaining}\n\nPlease take action to avoid compliance issues.`,
      }),
      COMPLIANCE_DEADLINE_URGENT: (d) => ({
        subject: `🚨 URGENT: Compliance Deadline in ${d.daysRemaining} days - ${d.title}`,
        message: `URGENT: ${d.entityName} has a critical compliance deadline.\n\n${d.title}\n\nDue: ${d.deadlineDate}\nDays remaining: ${d.daysRemaining}\n\nImmediate action required to maintain compliance.`,
      }),
      COMPLIANCE_DEADLINE_OVERDUE: (d) => ({
        subject: `❌ OVERDUE: ${d.title} - Compliance Violation`,
        message: `COMPLIANCE VIOLATION: ${d.entityName} has missed a compliance deadline.\n\n${d.title}\n\nDue date: ${d.deadlineDate}\nDays overdue: ${d.daysOverdue}\n\nThis may result in regulatory penalties or scheduling restrictions. Please resolve immediately.`,
      }),
      COMPLIANCE_DAILY_DIGEST: (d) => ({
        subject: `📋 Daily Compliance Summary - ${d.overdueCount} overdue, ${d.urgentCount} urgent`,
        message: `Your daily compliance summary:\n\n🔴 Overdue: ${d.overdueCount} items\n🟠 Urgent: ${d.urgentCount} items\n🟡 Warning: ${d.warningCount} items\n\nPlease review the compliance dashboard for details.`,
      }),
      COMPLIANCE_CREDENTIAL_EXPIRING: (d) => ({
        subject: `⚠️ Credential Expiring: ${d.credentialName} for ${d.caregiverName}`,
        message: `The ${d.credentialName} credential for ${d.caregiverName} will expire on ${d.expirationDate}.\n\nDays remaining: ${d.daysRemaining}\n\nPlease renew before expiration to avoid scheduling restrictions.`,
      }),
      COMPLIANCE_AUTHORIZATION_LOW: (d) => ({
        subject: `⚠️ Authorization Running Low: ${d.clientName}`,
        message: `${d.clientName}'s service authorization is running low.\n\nAuthorization: ${d.authorizationNumber}\nRemaining: ${d.remainingUnits} hours (${d.usagePercentage}% used)\nExpires: ${d.expirationDate}\n\nPlease request a new authorization to avoid service interruption.`,
      }),
    };

    const template = templates[eventType];
    if (template === undefined) {
      return {
        subject: 'Notification',
        message: 'You have a new notification.',
      };
    }

    return template(data);
  }
}

// Singleton instance
let instance: NotificationService | null = null;

export function getNotificationService(database?: Database): NotificationService {
  if (instance === null) {
    instance = new NotificationService(database);
  }
  return instance;
}
