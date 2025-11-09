/**
 * Push Notifications Service
 *
 * Handles push notification setup, scheduling, and management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { database } from '../database/index.js';
import {
  Notification,
  type NotificationType,
  type NotificationPriority,
  type ActionData,
} from '../database/models/Notification.js';
import { Q } from '@nozbe/watermelondb';

export interface ScheduleNotificationOptions {
  userId: string;
  organizationId: string;
  title: string;
  body: string;
  notificationType: NotificationType;
  priority?: NotificationPriority;
  relatedEntityType?: 'visit' | 'message' | 'schedule';
  relatedEntityId?: string;
  actionData?: ActionData;
  scheduledFor?: Date;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationsService {
  private expoPushToken: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get Expo push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Create notification channels for different types
        await this.createNotificationChannels();
      }

      return token;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('visit_reminders', {
      name: 'Visit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('schedule_changes', {
      name: 'Schedule Changes',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('system', {
      name: 'System Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(
    options: ScheduleNotificationOptions
  ): Promise<Notification> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Schedule with Expo Notifications
      const content: Notifications.NotificationContentInput = {
        title: options.title,
        body: options.body,
        data: {
          notificationId,
          notificationType: options.notificationType,
          relatedEntityType: options.relatedEntityType,
          relatedEntityId: options.relatedEntityId,
          actionData: options.actionData,
        },
        sound: true,
        priority:
          options.priority === 'high'
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.DEFAULT,
      };

      // Create notification request with or without trigger
      if (options.scheduledFor) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: options.scheduledFor,
          },
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: null,
        });
      }

      // Save to database
      const notification = await database.write(async () => {
        return await database.get<Notification>('notifications').create((record) => {
          record.notificationId = notificationId;
          record.userId = options.userId;
          record.organizationId = options.organizationId;

          // Notification content
          record.title = options.title;
          record.body = options.body;
          record.notificationType = options.notificationType;
          record.priority = options.priority || 'normal';

          // Related entities
          record.relatedEntityType = options.relatedEntityType || null;
          record.relatedEntityId = options.relatedEntityId || null;

          // Action data
          record.actionData = options.actionData || null;

          // Status
          record.isRead = false;
          record.readAt = null;
          record.isDismissed = false;
          record.dismissedAt = null;

          // Scheduling
          record.scheduledFor = options.scheduledFor || null;
          record.sentAt = options.scheduledFor ? null : new Date();
          record.receivedAt = null;
        });
      });

      return notification;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Schedule visit reminder (15 minutes before visit)
   */
  async scheduleVisitReminder(
    visitId: string,
    visitStartTime: Date,
    clientName: string,
    userId: string,
    organizationId: string
  ): Promise<Notification> {
    // Schedule for 15 minutes before visit
    const reminderTime = new Date(visitStartTime.getTime() - 15 * 60 * 1000);

    // Don't schedule if time is in the past
    if (reminderTime <= new Date()) {
      throw new Error('Reminder time is in the past');
    }

    return await this.scheduleNotification({
      userId,
      organizationId,
      title: 'Upcoming Visit',
      body: `You have a visit with ${clientName} starting in 15 minutes`,
      notificationType: 'visit_reminder',
      priority: 'high',
      relatedEntityType: 'visit',
      relatedEntityId: visitId,
      actionData: {
        screen: 'VisitDetail',
        params: { visitId },
      },
      scheduledFor: reminderTime,
    });
  }

  /**
   * Send schedule change notification
   */
  async sendScheduleChangeNotification(
    userId: string,
    organizationId: string,
    changeDescription: string,
    relatedEntityId?: string
  ): Promise<Notification> {
    return await this.scheduleNotification({
      userId,
      organizationId,
      title: 'Schedule Updated',
      body: changeDescription,
      notificationType: 'schedule_change',
      priority: 'high',
      relatedEntityType: 'schedule',
      relatedEntityId,
      actionData: {
        screen: 'Schedule',
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = await database
      .get<Notification>('notifications')
      .query(Q.where('notification_id', notificationId))
      .fetch();

    if (notification.length > 0) {
      await database.write(async () => {
        await notification[0].update((record) => {
          record.isRead = true;
          record.readAt = new Date();
        });
      });
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    const notification = await database
      .get<Notification>('notifications')
      .query(Q.where('notification_id', notificationId))
      .fetch();

    if (notification.length > 0) {
      await database.write(async () => {
        await notification[0].update((record) => {
          record.isDismissed = true;
          record.dismissedAt = new Date();
        });
      });
    }
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await database
      .get<Notification>('notifications')
      .query(
        Q.where('user_id', userId),
        Q.where('is_read', false),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit?: number
  ): Promise<Notification[]> {
    const query = database
      .get<Notification>('notifications')
      .query(
        Q.where('user_id', userId),
        Q.sortBy('created_at', Q.desc)
      );

    if (limit) {
      query.extend(Q.take(limit));
    }

    return await query.fetch();
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    // Cancel in Expo
    await Notifications.cancelScheduledNotificationAsync(notificationId);

    // Delete from database
    const notifications = await database
      .get<Notification>('notifications')
      .query(Q.where('notification_id', notificationId))
      .fetch();

    if (notifications.length > 0) {
      await database.write(async () => {
        await notifications[0].destroyPermanently();
      });
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count (unread notifications)
   */
  async getBadgeCount(userId: string): Promise<number> {
    const unread = await this.getUnreadNotifications(userId);
    return unread.length;
  }

  /**
   * Update badge count
   */
  async updateBadgeCount(userId: string): Promise<void> {
    const count = await this.getBadgeCount(userId);
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Get Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const pushNotificationsService = new PushNotificationsService();
