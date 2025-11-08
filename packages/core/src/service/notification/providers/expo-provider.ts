/**
 * Expo Push Notification Provider
 *
 * Handles push notifications using Expo
 */

import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import type {
  IPushProvider,
  PushNotificationParams,
  NotificationResult,
} from '../types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Expo push notification provider implementation
 */
export class ExpoPushProvider implements IPushProvider {
  private expo: Expo;

  constructor(accessToken?: string) {
    this.expo = new Expo({ accessToken });
  }

  /**
   * Send a push notification
   */
  async send(params: PushNotificationParams): Promise<NotificationResult> {
    try {
      // Validate push token
      if (!Expo.isExpoPushToken(params.token)) {
        throw new Error(`Invalid Expo push token: ${params.token}`);
      }

      const message: ExpoPushMessage = {
        to: params.token,
        title: params.title,
        body: params.body,
        data: params.data,
        sound: params.priority === 'high' ? 'default' : undefined,
        priority: params.priority === 'high' ? 'high' : 'default',
        badge: 1,
      };

      // Expo recommends batching notifications
      const chunks = this.expo.chunkPushNotifications([message]);
      const chunk = chunks[0];
      if (!chunk) {
        throw new Error('Failed to create push notification chunk');
      }

      const tickets = await this.expo.sendPushNotificationsAsync(chunk);
      const ticket = tickets[0];

      if (!ticket) {
        throw new Error('No ticket received from Expo');
      }

      if (ticket.status === 'error') {
        logger.error(
          {
            token: params.token,
            error: ticket.message,
          },
          'Push notification failed'
        );

        return {
          success: false,
          error: new Error(ticket.message),
          provider: 'push',
        };
      }

      logger.info(
        {
          token: params.token,
          ticketId: ticket.id,
        },
        'Push notification sent successfully'
      );

      return {
        success: true,
        messageId: ticket.id,
        provider: 'push',
      };
    } catch (error) {
      logger.error(
        {
          error,
          token: params.token,
        },
        'Failed to send push notification'
      );

      return {
        success: false,
        error: error as Error,
        provider: 'push',
      };
    }
  }

  /**
   * Check receipt statuses for sent notifications
   * This can be called periodically to verify delivery
   */
  async checkReceipts(receiptIds: string[]): Promise<void> {
    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptIdChunks) {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];

          if (receipt && receipt.status === 'error') {
            logger.error(
              {
                receiptId,
                error: receipt.message,
                details: receipt.details,
              },
              'Push notification delivery failed'
            );
          }
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to check push notification receipts');
    }
  }
}
