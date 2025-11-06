/**
 * Notification service - business logic for notifications
 */

import { v4 as uuidv4 } from 'uuid';
import {
  UserContext,
  ValidationError,
  PermissionError,
  NotFoundError,
  PaginatedResult,
} from '@care-commons/core';
import { getPermissionService } from '@care-commons/core';
import type {
  Notification,
  SendNotificationInput,
  NotificationCategory,
  ChannelType,
} from '../types/communication.js';
import { NotificationRepository } from '../repository/notification-repository.js';
import { CommunicationPreferencesRepository } from '../repository/preferences-repository.js';

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private preferencesRepository: CommunicationPreferencesRepository;
  private permissionService = getPermissionService();

  constructor(
    notificationRepository: NotificationRepository,
    preferencesRepository: CommunicationPreferencesRepository
  ) {
    this.notificationRepository = notificationRepository;
    this.preferencesRepository = preferencesRepository;
  }

  /**
   * Send a notification to a recipient
   */
  async sendNotification(
    input: SendNotificationInput,
    context: UserContext
  ): Promise<Notification> {
    this.permissionService.requirePermission(context, 'notifications:send');

    // Get recipient preferences
    const preferences = await this.preferencesRepository.findByUserId(input.recipientId);

    // Determine effective channels based on preferences and opt-ins
    const effectiveChannels = await this.determineEffectiveChannels(
      input.channels,
      input.recipientId,
      preferences
    );

    if (effectiveChannels.length === 0) {
      throw new ValidationError('No available delivery channels for recipient');
    }

    // Check quiet hours if preferences exist
    if (preferences && this.isQuietHours(preferences)) {
      // Schedule for after quiet hours instead
      const scheduledTime = this.calculatePostQuietHoursTime(preferences);
      input.scheduledSendAt = scheduledTime;
    }

    // Build notification entity
    const notification: Partial<Notification> = {
      organizationId: input.organizationId,
      recipientId: input.recipientId,
      recipientType: input.recipientType,
      category: input.category,
      priority: input.priority,
      title: input.title,
      message: input.message,
      richContent: input.richContent,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      status: input.scheduledSendAt ? 'SCHEDULED' : 'PENDING',
      channels: effectiveChannels,
      primaryChannel: effectiveChannels[0],
      scheduledSendAt: input.scheduledSendAt,
      expiresAt: input.expiresAt,
      externalIds: {},
      groupKey: this.generateGroupKey(input),
      isGrouped: false,
      metadata: {},
    };

    const created = await this.notificationRepository.create(notification, context);

    // If not scheduled, send immediately
    if (!input.scheduledSendAt) {
      await this.deliverNotification(created);
    }

    return created;
  }

  /**
   * Send notification to multiple recipients (broadcast)
   */
  async sendBulkNotifications(
    inputs: SendNotificationInput[],
    context: UserContext
  ): Promise<Notification[]> {
    this.permissionService.requirePermission(context, 'notifications:send');

    const notifications: Notification[] = [];

    for (const input of inputs) {
      const notification = await this.sendNotification(input, context);
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Get notifications for a recipient
   */
  async getNotifications(
    recipientId: string,
    unreadOnly: boolean,
    context: UserContext,
    pagination?: { page: number; limit: number }
  ): Promise<PaginatedResult<Notification> | Notification[]> {
    this.permissionService.requirePermission(context, 'notifications:read');

    if (recipientId !== context.userId && !context.roles.includes('ADMIN')) {
      throw new PermissionError('Cannot access another user\'s notifications');
    }

    return await this.notificationRepository.findByRecipient(
      recipientId,
      unreadOnly,
      pagination
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, context: UserContext): Promise<void> {
    this.permissionService.requirePermission(context, 'notifications:read');

    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification not found: ${notificationId}`);
    }

    if (notification.recipientId !== context.userId && !context.roles.includes('ADMIN')) {
      throw new PermissionError('Cannot mark another user\'s notification as read');
    }

    await this.notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a recipient
   */
  async markAllAsRead(recipientId: string, context: UserContext): Promise<void> {
    this.permissionService.requirePermission(context, 'notifications:read');

    if (recipientId !== context.userId && !context.roles.includes('ADMIN')) {
      throw new PermissionError('Cannot mark another user\'s notifications as read');
    }

    await this.notificationRepository.markAllAsRead(recipientId);
  }

  /**
   * Dismiss notification
   */
  async dismiss(notificationId: string, context: UserContext): Promise<void> {
    this.permissionService.requirePermission(context, 'notifications:read');

    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification not found: ${notificationId}`);
    }

    if (notification.recipientId !== context.userId && !context.roles.includes('ADMIN')) {
      throw new PermissionError('Cannot dismiss another user\'s notification');
    }

    await this.notificationRepository.markAsDismissed(notificationId);
  }

  /**
   * Get unread count for recipient
   */
  async getUnreadCount(recipientId: string, context: UserContext): Promise<number> {
    this.permissionService.requirePermission(context, 'notifications:read');

    if (recipientId !== context.userId && !context.roles.includes('ADMIN')) {
      throw new PermissionError('Cannot access another user\'s notification count');
    }

    return await this.notificationRepository.getUnreadCount(recipientId);
  }

  /**
   * Process scheduled notifications (called by background job)
   */
  async processScheduled(): Promise<void> {
    const notifications = await this.notificationRepository.findScheduledReady(new Date());

    for (const notification of notifications) {
      await this.deliverNotification(notification);
    }
  }

  /**
   * Clean up expired notifications (called by background job)
   */
  async cleanupExpired(): Promise<number> {
    return await this.notificationRepository.deleteExpired();
  }

  /**
   * Deliver notification through configured channels
   * In a real implementation, this would integrate with external services
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    // Update status to sending
    await this.notificationRepository.update(
      notification.id,
      { status: 'SENDING', sentAt: new Date() },
      { userId: 'system' } as UserContext
    );

    // In production, this would call external delivery services
    // For now, just mark as delivered for IN_APP channel
    const deliveredChannels: Partial<Record<ChannelType, string>> = {};

    for (const channel of notification.channels) {
      if (channel === 'IN_APP') {
        // In-app notifications are instantly "delivered"
        deliveredChannels[channel] = notification.id;
      } else {
        // Other channels would call external APIs (Twilio, SendGrid, etc.)
        // deliveredChannels[channel] = await this.deliverViaChannel(notification, channel);
      }
    }

    // Update notification with delivery status
    await this.notificationRepository.update(
      notification.id,
      {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        externalIds: deliveredChannels as Record<ChannelType, string>,
      },
      { userId: 'system' } as UserContext
    );
  }

  /**
   * Determine effective channels based on user preferences
   */
  private async determineEffectiveChannels(
    requestedChannels: ChannelType[],
    recipientId: string,
    preferences: any
  ): Promise<ChannelType[]> {
    const effectiveChannels: ChannelType[] = [];

    for (const channel of requestedChannels) {
      const hasOptedIn = await this.preferencesRepository.hasOptedIntoChannel(
        recipientId,
        channel
      );

      if (hasOptedIn) {
        // Check if channel is enabled in preferences
        if (!preferences || preferences.enabledChannels.includes(channel)) {
          effectiveChannels.push(channel);
        }
      }
    }

    // Always fall back to IN_APP if no other channels available
    if (effectiveChannels.length === 0 && !effectiveChannels.includes('IN_APP')) {
      effectiveChannels.push('IN_APP');
    }

    return effectiveChannels;
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: preferences.quietHoursTimezone,
    });

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    if (!start || !end) return false;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }

    return currentTime >= start && currentTime <= end;
  }

  /**
   * Calculate time after quiet hours end
   */
  private calculatePostQuietHoursTime(preferences: any): Date {
    const now = new Date();
    const end = preferences.quietHoursEnd || '08:00';
    const [hours, minutes] = end.split(':').map(Number);

    const endTime = new Date(now);
    endTime.setHours(hours, minutes, 0, 0);

    // If end time has already passed today, return current time
    if (endTime <= now) {
      return now;
    }

    return endTime;
  }

  /**
   * Generate group key for notification batching
   */
  private generateGroupKey(input: SendNotificationInput): string | undefined {
    if (input.relatedEntityType && input.relatedEntityId) {
      return `${input.category}:${input.relatedEntityType}:${input.relatedEntityId}`;
    }
    return undefined;
  }
}
