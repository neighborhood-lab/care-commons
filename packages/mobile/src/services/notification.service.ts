/**
 * Push Notification Service
 *
 * Handles push notifications for:
 * - Visit reminders (15 min before scheduled visit)
 * - New messages
 * - Schedule changes
 * - System notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import type { Notification as NotificationModel } from '../database/models/Notification';
import Constants from 'expo-constants';

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

export interface ScheduleNotificationOptions {
  type: 'VISIT_REMINDER' | 'MESSAGE' | 'SCHEDULE_CHANGE' | 'SYSTEM';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  visitId?: string;
  userId: string;
  scheduledTime?: Date;
}

export class NotificationService {
  private pushToken: string | null = null;

  constructor(private database: Database) {}

  /**
   * Initialize notification service
   * Register for push notifications and get device token
   */
  async initialize(): Promise<string | null> {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get push token
      this.pushToken = await this.registerForPushNotifications();

      // Set up notification listeners
      this.setupNotificationListeners();

      return this.pushToken;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return null;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const existingPermissions = await Notifications.getPermissionsAsync();
    // Check if already granted (PermissionResponse.granted or iOS-specific status)
    const alreadyGranted = (existingPermissions as any).granted === true || 
      existingPermissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;

    if (!alreadyGranted) {
      const newPermissions = await Notifications.requestPermissionsAsync();
      const isGranted = (newPermissions as any).granted === true || 
        newPermissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
      
      if (!isGranted) {
        Alert.alert(
          'Permission Required',
          'Push notifications are required for visit reminders and schedule updates.'
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        throw new Error('Project ID not configured');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        });

        // Create visit reminder channel
        await Notifications.setNotificationChannelAsync('visit-reminders', {
          name: 'Visit Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          lightColor: '#2563EB',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Push token registration error:', error);
      throw error;
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notifications received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped/opened
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  /**
   * Handle notification received
   */
  private async handleNotificationReceived(
    notification: Notifications.Notification
  ): Promise<void> {
    try {
      const { request } = notification;
      const { content } = request;

      // Save to database
      await this.database.write(async () => {
        await this.database.get<NotificationModel>('notifications').create((record) => {
          record.notificationType = (content.data?.type as any) || 'SYSTEM';
          record.title = content.title || '';
          record.body = content.body || '';
          if (content.data) {
            record.dataJson = JSON.stringify(content.data);
          }
          if (content.data?.visitId) {
            record.visitId = content.data.visitId as string;
          }
          record.userId = (content.data?.userId as string) || '';
          record.deliveredAt = Date.now();
          record.status = 'DELIVERED';
          record.isRead = false;
        });
      });
    } catch (error) {
      console.error('Handle notification error:', error);
    }
  }

  /**
   * Handle notification tapped
   */
  private async handleNotificationTapped(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    try {
      const { notification } = response;
      const { data } = notification.request.content;

      // Mark as read in database
      if (data?.notificationId) {
        const notificationRecord = await this.database
          .get<NotificationModel>('notifications')
          .find(data.notificationId as string);

        await notificationRecord.markAsRead();
      }

      // Handle navigation based on notification type
      // This would integrate with your navigation system
      if (data?.visitId) {
        // Navigate to visit detail screen
        console.log('Navigate to visit:', data.visitId);
      }
    } catch (error) {
      console.error('Handle notification tap error:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    options: ScheduleNotificationOptions
  ): Promise<string> {
    const {
      type,
      title,
      body,
      data = {},
      visitId,
      userId,
      scheduledTime,
    } = options;

    try {
      // Save to database first
      const notification = await this.database.write(async () => {
        const newNotification = await this.database
          .get<NotificationModel>('notifications')
          .create((record) => {
            record.notificationType = type;
            record.title = title;
            record.body = body;
            record.dataJson = JSON.stringify({ ...data, type });
            if (visitId) record.visitId = visitId;
            record.userId = userId;
            if (scheduledTime) {
              record.scheduledAt = scheduledTime.getTime();
            }
            record.status = scheduledTime ? 'SCHEDULED' : 'PENDING';
            record.isRead = false;
          });

        return newNotification;
      });

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            type,
            visitId,
            userId,
            notificationId: notification.id,
          },
        },
        trigger: scheduledTime
          ? (scheduledTime as unknown as Notifications.NotificationTriggerInput)
          : null, // Send immediately if no scheduled time
      });

      return notificationId;
    } catch (error) {
      console.error('Schedule notification error:', error);
      throw error;
    }
  }

  /**
   * Schedule visit reminder (15 minutes before)
   */
  async scheduleVisitReminder(
    visitId: string,
    userId: string,
    scheduledStartTime: Date,
    clientName: string
  ): Promise<string> {
    // Schedule for 15 minutes before visit
    const reminderTime = new Date(scheduledStartTime.getTime() - 15 * 60 * 1000);

    // Don't schedule if in the past
    if (reminderTime < new Date()) {
      throw new Error('Cannot schedule reminder in the past');
    }

    return this.scheduleNotification({
      type: 'VISIT_REMINDER',
      title: 'Upcoming Visit',
      body: `Visit with ${clientName} starts in 15 minutes`,
      data: { visitId },
      visitId,
      userId,
      scheduledTime: reminderTime,
    });
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Cancel notification error:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Cancel all notifications error:', error);
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Get scheduled notifications error:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.database
        .get<NotificationModel>('notifications')
        .query(
          Q.where('user_id', userId),
          Q.where('is_read', false)
        )
        .fetchCount();

      return count;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notification = await this.database
        .get<NotificationModel>('notifications')
        .find(notificationId);

      await notification.markAsRead();

      // Update badge count
      const unreadCount = await this.getUnreadCount(notification.userId);
      await Notifications.setBadgeCountAsync(unreadCount);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.database
        .get<NotificationModel>('notifications')
        .query(
          Q.where('user_id', userId),
          Q.where('is_read', false)
        )
        .fetch();

      await this.database.write(async () => {
        for (const notification of notifications) {
          await notification.markAsRead();
        }
      });

      // Clear badge
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}
