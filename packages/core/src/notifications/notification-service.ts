/**
 * Notification service - business logic layer
 */

import { NotificationRepository } from './notification-repository';
import {
  Notification,
  CreateNotificationInput,
  NotificationListOptions,
} from './types';
import { PaginatedResult } from '../types/base';
import { ValidationError, NotFoundError } from '../types/base';

export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  /**
   * Create a new notification
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<Notification> {
    this.validateNotificationInput(input);
    return this.repository.create(input);
  }

  /**
   * Get notifications for a user with filters and pagination
   */
  async getUserNotifications(
    userId: string,
    organizationId: string,
    options: NotificationListOptions = {}
  ): Promise<PaginatedResult<Notification>> {
    if (userId.length === 0) {
      throw new ValidationError('User ID is required');
    }
    if (organizationId.length === 0) {
      throw new ValidationError('Organization ID is required');
    }

    return this.repository.findByUserId(userId, organizationId, options);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, organizationId: string): Promise<number> {
    if (userId.length === 0) {
      throw new ValidationError('User ID is required');
    }
    if (organizationId.length === 0) {
      throw new ValidationError('Organization ID is required');
    }

    return this.repository.countUnread(userId, organizationId);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    if (notificationId.length === 0) {
      throw new ValidationError('Notification ID is required');
    }
    if (userId.length === 0) {
      throw new ValidationError('User ID is required');
    }

    const notification = await this.repository.markAsRead(notificationId, userId);

    if (notification === null) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, organizationId: string): Promise<number> {
    if (userId.length === 0) {
      throw new ValidationError('User ID is required');
    }
    if (organizationId.length === 0) {
      throw new ValidationError('Organization ID is required');
    }

    return this.repository.markAllAsRead(userId, organizationId);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    if (notificationId.length === 0) {
      throw new ValidationError('Notification ID is required');
    }
    if (userId.length === 0) {
      throw new ValidationError('User ID is required');
    }

    const deleted = await this.repository.delete(notificationId, userId);

    if (deleted === false) {
      throw new NotFoundError('Notification not found');
    }
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    if (notificationId.length === 0) {
      throw new ValidationError('Notification ID is required');
    }
    if (userId.length === 0) {
      throw new ValidationError('User ID is required');
    }

    const notification = await this.repository.findById(notificationId, userId);

    if (notification === null) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  /**
   * Validate notification input
   */
  private validateNotificationInput(input: CreateNotificationInput): void {
    if (input.userId.length === 0) {
      throw new ValidationError('User ID is required');
    }
    if (input.organizationId.length === 0) {
      throw new ValidationError('Organization ID is required');
    }
    if (input.type.length === 0 || !['info', 'success', 'warning', 'error'].includes(input.type)) {
      throw new ValidationError('Valid notification type is required (info, success, warning, error)');
    }
    if (input.title.length === 0 || input.title.trim().length === 0) {
      throw new ValidationError('Notification title is required');
    }
    if (input.message.length === 0 || input.message.trim().length === 0) {
      throw new ValidationError('Notification message is required');
    }
    if (input.title.length > 255) {
      throw new ValidationError('Notification title must be 255 characters or less');
    }
    if (input.actionUrl !== undefined && input.actionUrl.length > 500) {
      throw new ValidationError('Action URL must be 500 characters or less');
    }
  }
}
