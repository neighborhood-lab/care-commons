/**
 * Notification Delivery Manager
 *
 * Orchestrates notification delivery across multiple channels
 * with intelligent routing, retry logic, and preference handling
 */

import type { Pool } from 'pg';
import type {
  NotificationRequest,
  NotificationResult,
  NotificationChannel,
  NotificationPreferences,
  IEmailProvider,
  ISMSProvider,
  IPushProvider,
  EmailNotificationParams,
  SMSNotificationParams,
  PushNotificationParams,
} from './types.js';
import { logger } from '../../utils/logger.js';

interface DeliveryManagerConfig {
  emailProvider?: IEmailProvider;
  smsProvider?: ISMSProvider;
  pushProvider?: IPushProvider;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Manages notification delivery with retry logic and preferences
 */
export class NotificationDeliveryManager {
  private db: Pool;
  private emailProvider?: IEmailProvider;
  private smsProvider?: ISMSProvider;
  private pushProvider?: IPushProvider;
  private retryAttempts: number;
  private retryDelayMs: number;

  constructor(db: Pool, config: DeliveryManagerConfig) {
    this.db = db;
    this.emailProvider = config.emailProvider;
    this.smsProvider = config.smsProvider;
    this.pushProvider = config.pushProvider;
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 2000;
  }

  /**
   * Deliver a notification to a user
   */
  async deliver(notification: NotificationRequest): Promise<void> {
    try {
      // Get user preferences
      const prefs = await this.getPreferences(notification.userId);

      if (!prefs) {
        logger.warn({ userId: notification.userId }, 'No notification preferences found');
        return;
      }

      // Check quiet hours
      if (this.isQuietHours(prefs) && notification.priority !== 'high') {
        logger.info(
          { userId: notification.userId, type: notification.type },
          'Notification queued due to quiet hours'
        );
        // In a production system, this would queue for later delivery
        // For now, we'll skip during quiet hours
        return;
      }

      // Determine channels based on preferences and priority
      const channels = this.selectChannels(notification, prefs);

      if (channels.length === 0) {
        logger.info(
          { userId: notification.userId, type: notification.type },
          'No delivery channels enabled for notification'
        );
        return;
      }

      // Send via selected channels with retry logic
      const results = await Promise.allSettled(
        channels.map((channel) => this.sendViaChannel(notification, channel, prefs))
      );

      // Log delivery results
      await this.logDeliveries(notification, results);
    } catch (error) {
      logger.error({ error, notification }, 'Failed to deliver notification');
    }
  }

  /**
   * Get user notification preferences
   */
  private async getPreferences(userId: number): Promise<NotificationPreferences | null> {
    try {
      const result = await this.db.query(
        `SELECT
          email_enabled, sms_enabled, push_enabled,
          email, phone_number, push_tokens,
          visit_updates_email, visit_updates_sms, visit_updates_push,
          messages_email, messages_sms, messages_push,
          care_plan_updates_email, care_plan_updates_sms, care_plan_updates_push,
          emergency_alerts_email, emergency_alerts_sms, emergency_alerts_push,
          digest_frequency, digest_time, digest_day_of_week,
          quiet_hours_enabled, quiet_hours_start, quiet_hours_end
         FROM notification_preferences
         WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        emailEnabled: row.email_enabled,
        smsEnabled: row.sms_enabled,
        pushEnabled: row.push_enabled,
        email: row.email,
        phoneNumber: row.phone_number,
        pushTokens: row.push_tokens || [],
        visitUpdatesEmail: row.visit_updates_email,
        visitUpdatesSms: row.visit_updates_sms,
        visitUpdatesPush: row.visit_updates_push,
        messagesEmail: row.messages_email,
        messagesSms: row.messages_sms,
        messagesPush: row.messages_push,
        carePlanUpdatesEmail: row.care_plan_updates_email,
        carePlanUpdatesSms: row.care_plan_updates_sms,
        carePlanUpdatesPush: row.care_plan_updates_push,
        emergencyAlertsEmail: row.emergency_alerts_email,
        emergencyAlertsSms: row.emergency_alerts_sms,
        emergencyAlertsPush: row.emergency_alerts_push,
        digestFrequency: row.digest_frequency,
        digestTime: row.digest_time,
        digestDayOfWeek: row.digest_day_of_week,
        quietHoursEnabled: row.quiet_hours_enabled,
        quietHoursStart: row.quiet_hours_start,
        quietHoursEnd: row.quiet_hours_end,
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get notification preferences');
      return null;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const startParts = prefs.quietHoursStart.split(':').map(Number);
    const endParts = prefs.quietHoursEnd.split(':').map(Number);

    const startHour = startParts[0] ?? 22;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 8;
    const endMin = endParts[1] ?? 0;

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  /**
   * Select delivery channels based on notification type and user preferences
   */
  private selectChannels(
    notification: NotificationRequest,
    prefs: NotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Emergency alerts go to all enabled channels
    if (notification.priority === 'high') {
      if (prefs.emergencyAlertsEmail && prefs.email && this.emailProvider) {
        channels.push('email');
      }
      if (prefs.emergencyAlertsSms && prefs.phoneNumber && this.smsProvider) {
        channels.push('sms');
      }
      if (prefs.emergencyAlertsPush && prefs.pushTokens.length > 0 && this.pushProvider) {
        channels.push('push');
      }
      return channels;
    }

    // Route based on notification type
    const notificationType = notification.type.toLowerCase();

    if (notificationType.includes('visit')) {
      if (prefs.visitUpdatesEmail && prefs.email && this.emailProvider) {
        channels.push('email');
      }
      if (prefs.visitUpdatesSms && prefs.phoneNumber && this.smsProvider) {
        channels.push('sms');
      }
      if (prefs.visitUpdatesPush && prefs.pushTokens.length > 0 && this.pushProvider) {
        channels.push('push');
      }
    } else if (notificationType.includes('message')) {
      if (prefs.messagesEmail && prefs.email && this.emailProvider) {
        channels.push('email');
      }
      if (prefs.messagesSms && prefs.phoneNumber && this.smsProvider) {
        channels.push('sms');
      }
      if (prefs.messagesPush && prefs.pushTokens.length > 0 && this.pushProvider) {
        channels.push('push');
      }
    } else if (notificationType.includes('care') || notificationType.includes('plan')) {
      if (prefs.carePlanUpdatesEmail && prefs.email && this.emailProvider) {
        channels.push('email');
      }
      if (prefs.carePlanUpdatesSms && prefs.phoneNumber && this.smsProvider) {
        channels.push('sms');
      }
      if (prefs.carePlanUpdatesPush && prefs.pushTokens.length > 0 && this.pushProvider) {
        channels.push('push');
      }
    }

    return channels;
  }

  /**
   * Send notification via a specific channel with retry logic
   */
  private async sendViaChannel(
    notification: NotificationRequest,
    channel: NotificationChannel,
    prefs: NotificationPreferences
  ): Promise<NotificationResult> {
    let attempts = 0;

    while (attempts < this.retryAttempts) {
      try {
        let result: NotificationResult;

        switch (channel) {
          case 'email':
            if (!this.emailProvider || !prefs.email) {
              throw new Error('Email provider not configured or email address missing');
            }
            result = await this.sendEmail(notification, prefs.email);
            break;

          case 'sms':
            if (!this.smsProvider || !prefs.phoneNumber) {
              throw new Error('SMS provider not configured or phone number missing');
            }
            result = await this.sendSMS(notification, prefs.phoneNumber);
            break;

          case 'push':
            if (!this.pushProvider || prefs.pushTokens.length === 0) {
              throw new Error('Push provider not configured or no push tokens');
            }
            // Send to the first token for now
            const firstToken = prefs.pushTokens[0];
            if (!firstToken) {
              throw new Error('No push token available');
            }
            result = await this.sendPush(notification, firstToken);
            break;

          default:
            throw new Error(`Unknown channel: ${channel}`);
        }

        if (result.success) {
          return result;
        }

        attempts++;
        if (attempts < this.retryAttempts) {
          await this.delay(Math.pow(2, attempts) * this.retryDelayMs); // Exponential backoff
        }
      } catch (error) {
        attempts++;
        if (attempts >= this.retryAttempts) {
          return {
            success: false,
            error: error as Error,
            provider: channel,
          };
        }
        await this.delay(Math.pow(2, attempts) * this.retryDelayMs);
      }
    }

    return {
      success: false,
      error: new Error(`Failed after ${this.retryAttempts} attempts`),
      provider: channel,
    };
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    notification: NotificationRequest,
    email: string
  ): Promise<NotificationResult> {
    if (!this.emailProvider) {
      throw new Error('Email provider not configured');
    }

    const params: EmailNotificationParams = {
      to: email,
      subject: notification.subject || this.getDefaultSubject(notification),
      template: notification.template,
      data: notification.data,
      priority: notification.priority,
    };

    return this.emailProvider.send(params);
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(
    notification: NotificationRequest,
    phoneNumber: string
  ): Promise<NotificationResult> {
    if (!this.smsProvider) {
      throw new Error('SMS provider not configured');
    }

    const params: SMSNotificationParams = {
      to: phoneNumber,
      message: this.formatSMSMessage(notification),
      priority: notification.priority,
    };

    return this.smsProvider.send(params);
  }

  /**
   * Send push notification
   */
  private async sendPush(
    notification: NotificationRequest,
    token: string
  ): Promise<NotificationResult> {
    if (!this.pushProvider) {
      throw new Error('Push provider not configured');
    }

    const params: PushNotificationParams = {
      token,
      title: notification.subject || this.getDefaultSubject(notification),
      body: this.formatPushBody(notification),
      data: notification.data,
      priority: notification.priority,
    };

    return this.pushProvider.send(params);
  }

  /**
   * Get default subject for notification type
   */
  private getDefaultSubject(notification: NotificationRequest): string {
    const type = notification.type.toLowerCase();
    if (type.includes('visit')) return 'Visit Update';
    if (type.includes('message')) return 'New Message';
    if (type.includes('care') || type.includes('plan')) return 'Care Plan Update';
    if (type.includes('emergency')) return 'Emergency Alert';
    return 'Notification';
  }

  /**
   * Format notification as SMS message
   */
  private formatSMSMessage(notification: NotificationRequest): string {
    // SMS messages should be concise (under 160 characters ideally)
    const { data } = notification;
    const type = notification.type.toLowerCase();

    if (type.includes('visit') && type.includes('scheduled')) {
      return `Visit scheduled for ${data.clientName} on ${data.visitDate} at ${data.visitTime}. Caregiver: ${data.caregiverName}`;
    }
    if (type.includes('visit') && type.includes('started')) {
      return `Visit for ${data.clientName} has started with ${data.caregiverName}`;
    }
    if (type.includes('visit') && type.includes('completed')) {
      return `Visit for ${data.clientName} completed. Duration: ${data.duration}`;
    }
    if (type.includes('message')) {
      return `New message from ${data.senderName}: ${data.messagePreview?.substring(0, 50)}...`;
    }

    return `${this.getDefaultSubject(notification)} - Check the family portal for details`;
  }

  /**
   * Format notification as push notification body
   */
  private formatPushBody(notification: NotificationRequest): string {
    const { data } = notification;
    const type = notification.type.toLowerCase();

    if (type.includes('visit') && type.includes('scheduled')) {
      return `Visit scheduled for ${data.clientName} on ${data.visitDate}`;
    }
    if (type.includes('visit') && type.includes('started')) {
      return `${data.caregiverName} has started the visit`;
    }
    if (type.includes('visit') && type.includes('completed')) {
      return `Visit completed - ${data.duration}`;
    }
    if (type.includes('message')) {
      return `${data.senderName}: ${data.messagePreview}`;
    }

    return 'Check the app for details';
  }

  /**
   * Log delivery results to database
   */
  private async logDeliveries(
    notification: NotificationRequest,
    results: PromiseSettledResult<NotificationResult>[]
  ): Promise<void> {
    try {
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const deliveryResult = result.value;

          await this.db.query(
            `INSERT INTO notification_deliveries
             (user_id, notification_type, channel, delivered_at, success,
              provider_message_id, subject, preview)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              notification.userId,
              notification.type,
              deliveryResult.provider,
              new Date(),
              deliveryResult.success,
              deliveryResult.messageId,
              notification.subject || this.getDefaultSubject(notification),
              JSON.stringify(notification.data).substring(0, 500),
            ]
          );
        }
      }
    } catch (error) {
      logger.error({ error, notification }, 'Failed to log delivery results');
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
