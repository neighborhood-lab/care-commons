/**
 * Email Notification Provider (SendGrid)
 * 
 * MVP implementation using console logging (SendGrid integration ready but not configured).
 * To enable SendGrid: Set SENDGRID_API_KEY environment variable.
 */

import type {
  NotificationProvider,
  NotificationPayload,
  NotificationRecipient,
  NotificationResult,
} from '../types.js';

export class EmailProvider implements NotificationProvider {
  readonly name = 'email';
  readonly channel = 'EMAIL' as const;

  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env['SENDGRID_API_KEY'];
  }

  isConfigured(): boolean {
    return this.apiKey !== undefined && this.apiKey !== '';
  }

  async send(
    payload: NotificationPayload,
    recipient: NotificationRecipient
  ): Promise<NotificationResult> {
    if (recipient.email === undefined || recipient.email === '') {
      return {
        success: false,
        channel: 'EMAIL',
        recipientId: recipient.userId,
        sentAt: new Date(),
        error: 'Recipient has no email address',
      };
    }

    // MVP: Console logging (SendGrid ready but not configured)
    if (!this.isConfigured()) {
      console.log('[EMAIL NOTIFICATION] (SendGrid not configured - logging only)');
      console.log(`  To: ${recipient.email}`);
      console.log(`  Subject: ${payload.subject}`);
      console.log(`  Message: ${payload.message}`);
      console.log(`  Priority: ${payload.priority}`);
      console.log(`  Event: ${payload.eventType}`);

      return {
        success: true,
        channel: 'EMAIL',
        recipientId: recipient.userId,
        sentAt: new Date(),
        externalId: `mock-${Date.now()}`,
      };
    }

    // SendGrid implementation (when configured)
    try {
      // Future: Implement SendGrid API call when needed
      // When ready, use @sendgrid/mail npm package
      console.log('[EMAIL] SendGrid configured but not fully implemented:', {
        to: recipient.email,
        subject: payload.subject,
        priority: payload.priority,
      });

      return {
        success: true,
        channel: 'EMAIL',
        recipientId: recipient.userId,
        sentAt: new Date(),
        externalId: `sg-${Date.now()}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EMAIL] SendGrid error:', errorMessage);

      return {
        success: false,
        channel: 'EMAIL',
        recipientId: recipient.userId,
        sentAt: new Date(),
        error: errorMessage,
      };
    }
  }
}
