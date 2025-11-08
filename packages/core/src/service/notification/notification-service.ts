/**
 * Notification Service
 *
 * Main notification service interface for the application
 */

import type { Pool } from 'pg';
import { SendGridProvider } from './providers/sendgrid-provider.js';
import { TwilioProvider } from './providers/twilio-provider.js';
import { ExpoPushProvider } from './providers/expo-provider.js';
import { NotificationDeliveryManager } from './delivery-manager.js';
import type {
  INotificationService,
  EmailNotificationParams,
  SMSNotificationParams,
  PushNotificationParams,
  NotificationResult,
  NotificationRequest,
  DigestFrequency,
} from './types.js';
import { logger } from '../../utils/logger.js';

interface NotificationServiceConfig {
  db: Pool;
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  sendgridFromName?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  expoAccessToken?: string;
}

/**
 * Main notification service
 */
export class NotificationService implements INotificationService {
  private deliveryManager: NotificationDeliveryManager;
  private emailProvider?: SendGridProvider;
  private smsProvider?: TwilioProvider;
  private pushProvider?: ExpoPushProvider;

  constructor(config: NotificationServiceConfig) {
    // Initialize providers if configured
    if (config.sendgridApiKey && config.sendgridFromEmail) {
      this.emailProvider = new SendGridProvider(
        config.sendgridApiKey,
        config.sendgridFromEmail,
        config.sendgridFromName
      );
    } else {
      logger.warn('SendGrid not configured - email notifications disabled');
    }

    if (config.twilioAccountSid && config.twilioAuthToken && config.twilioFromNumber) {
      this.smsProvider = new TwilioProvider(
        config.twilioAccountSid,
        config.twilioAuthToken,
        config.twilioFromNumber
      );
    } else {
      logger.warn('Twilio not configured - SMS notifications disabled');
    }

    if (config.expoAccessToken !== undefined) {
      this.pushProvider = new ExpoPushProvider(config.expoAccessToken);
    } else {
      this.pushProvider = new ExpoPushProvider();
    }

    // Initialize delivery manager
    this.deliveryManager = new NotificationDeliveryManager(config.db, {
      emailProvider: this.emailProvider,
      smsProvider: this.smsProvider,
      pushProvider: this.pushProvider,
      retryAttempts: Number(process.env.NOTIFICATION_RETRY_ATTEMPTS) || 3,
      retryDelayMs: Number(process.env.NOTIFICATION_RETRY_DELAY_MS) || 2000,
    });
  }

  /**
   * Send an email notification
   */
  async sendEmail(params: EmailNotificationParams): Promise<NotificationResult> {
    if (!this.emailProvider) {
      return {
        success: false,
        error: new Error('Email provider not configured'),
        provider: 'email',
      };
    }

    return this.emailProvider.send(params);
  }

  /**
   * Send an SMS notification
   */
  async sendSMS(params: SMSNotificationParams): Promise<NotificationResult> {
    if (!this.smsProvider) {
      return {
        success: false,
        error: new Error('SMS provider not configured'),
        provider: 'sms',
      };
    }

    return this.smsProvider.send(params);
  }

  /**
   * Send a push notification
   */
  async sendPush(params: PushNotificationParams): Promise<NotificationResult> {
    if (!this.pushProvider) {
      return {
        success: false,
        error: new Error('Push provider not configured'),
        provider: 'push',
      };
    }

    return this.pushProvider.send(params);
  }

  /**
   * Send a notification via the delivery manager
   * This handles channel selection, preferences, and retry logic
   */
  async deliver(notification: NotificationRequest): Promise<void> {
    return this.deliveryManager.deliver(notification);
  }

  /**
   * Send multiple notifications in batch
   */
  async sendBatch(notifications: NotificationRequest[]): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = Number(process.env.NOTIFICATION_BATCH_SIZE) || 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchPromises = batch.map((notification) =>
        this.deliveryManager.deliver(notification).then(() => ({
          success: true,
          provider: 'email' as const,
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Schedule a digest notification
   * In a production system, this would set up a scheduled job
   */
  async scheduleDigest(_userId: string, _frequency: DigestFrequency): Promise<void> {
    // This would typically integrate with a job queue system like Bull or Agenda
    logger.info('Digest scheduling not yet implemented - requires job queue');
  }
}

/**
 * Create a notification service instance from environment variables
 */
export function createNotificationService(db: Pool): NotificationService {
  return new NotificationService({
    db,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL,
    sendgridFromName: process.env.SENDGRID_FROM_NAME,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
    expoAccessToken: process.env.EXPO_ACCESS_TOKEN,
  });
}
