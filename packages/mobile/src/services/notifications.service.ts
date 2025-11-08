/**
 * Push Notifications Service
 *
 * Manages push notifications for:
 * - Visit reminders (15 min before)
 * - New message notifications
 * - Schedule change alerts
 * - System notifications
 *
 * Uses expo-notifications for cross-platform support
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import type { UUID } from '@care-commons/core';

export type NotificationType = 'VISIT_REMINDER' | 'MESSAGE' | 'SCHEDULE_CHANGE' | 'SYSTEM';

export interface NotificationData {
  id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  visitId?: UUID;
  userId: UUID;
  isRead: boolean;
  isDelivered: boolean;
  deliveredAt?: number;
  readAt?: number;
  scheduledFor?: number;
  sentAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduleVisitReminderOptions {
  visitId: UUID;
  userId: UUID;
  visitStartTime: Date;
  clientName: string;
  reminderMinutes?: number; // Default: 15
}

export interface SendNotificationOptions {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  visitId?: UUID;
  userId: UUID;
  scheduledFor?: Date;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationsService {
  private database: Database | null = null;
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize the notifications service
   */
  initialize(database: Database): void {
    this.database = database;
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('[Notifications] Push notifications only work on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission denied');
        return null;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.expoPushToken = token.data;
      console.log('[Notifications] Expo push token:', this.expoPushToken);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Visit reminders channel (high priority)
        await Notifications.setNotificationChannelAsync('visit-reminders', {
          name: 'Visit Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0066FF',
          sound: 'default',
        });

        // Messages channel
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#00FF00',
        });

        // Schedule changes channel (urgent)
        await Notifications.setNotificationChannelAsync('schedule-changes', {
          name: 'Schedule Changes',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#FF0000',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('[Notifications] Registration failed:', error);
      return null;
    }
  }

  /**
   * Setup notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Received:', notification);
      this.markAsDelivered(notification.request.identifier);

      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notifications] User interacted:', response);
      this.markAsRead(response.notification.request.identifier);

      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Schedule a visit reminder notification
   */
  async scheduleVisitReminder(options: ScheduleVisitReminderOptions): Promise<string> {
    const reminderMinutes = options.reminderMinutes ?? 15;
    const reminderTime = new Date(options.visitStartTime.getTime() - reminderMinutes * 60 * 1000);

    // Don't schedule if reminder time is in the past
    if (reminderTime.getTime() < Date.now()) {
      console.log('[Notifications] Reminder time in the past, skipping');
      return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Visit Reminder',
        body: `Visit with ${options.clientName} starts in ${reminderMinutes} minutes`,
        data: {
          type: 'VISIT_REMINDER',
          visitId: options.visitId,
          userId: options.userId,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'visit-reminder',
      },
      trigger: {
        date: reminderTime,
        channelId: 'visit-reminders',
      },
    });

    // Save to database
    await this.saveNotificationToDatabase({
      type: 'VISIT_REMINDER',
      title: '🔔 Visit Reminder',
      body: `Visit with ${options.clientName} starts in ${reminderMinutes} minutes`,
      data: { visitId: options.visitId },
      visitId: options.visitId,
      userId: options.userId,
      scheduledFor: reminderTime,
    });

    console.log('[Notifications] Scheduled visit reminder:', notificationId);
    return notificationId;
  }

  /**
   * Send immediate notification
   */
  async sendNotification(options: SendNotificationOptions): Promise<string> {
    let channelId = 'default';
    let priority = Notifications.AndroidNotificationPriority.DEFAULT;

    // Set channel and priority based on type
    switch (options.type) {
      case 'VISIT_REMINDER':
        channelId = 'visit-reminders';
        priority = Notifications.AndroidNotificationPriority.HIGH;
        break;
      case 'MESSAGE':
        channelId = 'messages';
        priority = Notifications.AndroidNotificationPriority.DEFAULT;
        break;
      case 'SCHEDULE_CHANGE':
        channelId = 'schedule-changes';
        priority = Notifications.AndroidNotificationPriority.HIGH;
        break;
    }

    const trigger = options.scheduledFor
      ? { date: options.scheduledFor, channelId }
      : { channelId };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: {
          type: options.type,
          ...options.data,
        },
        sound: true,
        priority,
      },
      trigger,
    });

    // Save to database
    await this.saveNotificationToDatabase(options);

    console.log('[Notifications] Sent notification:', notificationId);
    return notificationId;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Cancelled notification:', notificationId);
  }

  /**
   * Cancel all visit reminders for a specific visit
   */
  async cancelVisitReminders(visitId: UUID): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduled) {
      if (notification.content.data?.visitId === visitId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    console.log('[Notifications] Cancelled all reminders for visit:', visitId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cancelled all scheduled notifications');
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get unread notifications from database
   */
  async getUnreadNotifications(userId: UUID): Promise<NotificationData[]> {
    if (!this.database) {
      return [];
    }

    const records = await this.database
      .get('notifications')
      .query(
        Q.where('user_id', userId),
        Q.where('is_read', false),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();

    return records.map(this.mapRecordToNotification);
  }

  /**
   * Mark notification as delivered
   */
  private async markAsDelivered(notificationId: string): Promise<void> {
    if (!this.database) {
      return;
    }

    try {
      await this.database.write(async () => {
        const collection = this.database!.collections.get('notifications');
        const record = await collection.find(notificationId);

        await record.update((notification: any) => {
          notification.isDelivered = true;
          notification.deliveredAt = Date.now();
          notification.updatedAt = Date.now();
        });
      });
    } catch (error) {
      console.error('[Notifications] Failed to mark as delivered:', error);
    }
  }

  /**
   * Mark notification as read
   */
  private async markAsRead(notificationId: string): Promise<void> {
    if (!this.database) {
      return;
    }

    try {
      await this.database.write(async () => {
        const collection = this.database!.collections.get('notifications');
        const record = await collection.find(notificationId);

        await record.update((notification: any) => {
          notification.isRead = true;
          notification.readAt = Date.now();
          notification.updatedAt = Date.now();
        });
      });

      // Update badge count
      const unreadCount = await this.getUnreadNotifications('' as UUID);
      await this.setBadgeCount(unreadCount.length);
    } catch (error) {
      console.error('[Notifications] Failed to mark as read:', error);
    }
  }

  /**
   * Save notification to database
   */
  private async saveNotificationToDatabase(options: SendNotificationOptions): Promise<void> {
    if (!this.database) {
      return;
    }

    const timestamp = Date.now();

    await this.database.write(async () => {
      const collection = this.database!.collections.get('notifications');

      await collection.create((record: any) => {
        record.notificationType = options.type;
        record.title = options.title;
        record.body = options.body;
        record.dataJson = JSON.stringify(options.data || {});
        record.visitId = options.visitId;
        record.userId = options.userId;
        record.isRead = false;
        record.isDelivered = false;
        record.scheduledFor = options.scheduledFor?.getTime();
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    });
  }

  /**
   * Map database record to notification object
   */
  private mapRecordToNotification(record: any): NotificationData {
    return {
      id: record.id,
      type: record.notificationType,
      title: record.title,
      body: record.body,
      data: JSON.parse(record.dataJson || '{}'),
      visitId: record.visitId,
      userId: record.userId,
      isRead: record.isRead,
      isDelivered: record.isDelivered,
      deliveredAt: record.deliveredAt,
      readAt: record.readAt,
      scheduledFor: record.scheduledFor,
      sentAt: record.sentAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Get Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationsService = new NotificationsService();
