/**
 * Twilio SMS Provider
 *
 * Handles SMS delivery using Twilio
 */

import twilio from 'twilio';
import type {
  ISMSProvider,
  SMSNotificationParams,
  NotificationResult,
} from '../types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Twilio SMS provider implementation
 */
export class TwilioProvider implements ISMSProvider {
  private client: ReturnType<typeof twilio>;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  /**
   * Send an SMS notification
   */
  async send(params: SMSNotificationParams): Promise<NotificationResult> {
    try {
      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(params.to)) {
        throw new Error(`Invalid phone number format: ${params.to}`);
      }

      const message = await this.client.messages.create({
        to: params.to,
        from: this.fromNumber,
        body: params.message,
      });

      logger.info(
        {
          to: params.to,
          messageId: message.sid,
          status: message.status,
        },
        'SMS sent successfully'
      );

      return {
        success: true,
        messageId: message.sid,
        provider: 'sms',
      };
    } catch (error) {
      logger.error(
        {
          error,
          to: params.to,
        },
        'Failed to send SMS'
      );

      return {
        success: false,
        error: error as Error,
        provider: 'sms',
      };
    }
  }
}
