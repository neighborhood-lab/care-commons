/**
 * Notification Service
 *
 * Manages notifications for family members
 */

import { UUID, UserContext, PaginationParams } from '@care-commons/core';
import type {
  FamilyNotification,
  CreateNotificationInput,
  NotificationSummary,
} from '../types/index.js';
import { NotificationRepository, NotificationFilters } from '../repository/index.js';

export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  /**
   * Create a notification
   */
  async createNotification(
    input: CreateNotificationInput,
    context: UserContext
  ): Promise<FamilyNotification> {
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const notification: Partial<FamilyNotification> = {
      familyMemberId: input.familyMemberId,
      clientId: input.clientId,
      type: input.type,
      category: input.category,
      title: input.title,
      message: input.message,
      priority: input.priority || 'MEDIUM',
      actionRequired: input.actionRequired || false,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      channels: input.channels || ['IN_APP'],
      status: 'PENDING',
      relatedEntity: input.relatedEntity,
      expiresAt,
    };

    const created = await this.notificationRepository.create(notification, context);

    // TODO: Send notifications via configured channels (email, SMS, push)
    // For now, just mark as SENT
    await this.notificationRepository.update(
      created.id,
      { status: 'SENT', sentAt: new Date() } as Partial<FamilyNotification>,
      context
    );

    return (await this.notificationRepository.findById(created.id)) as FamilyNotification;
  }

  /**
   * Get notifications for a family member
   */
  async getNotifications(
    filters: NotificationFilters,
    pagination: PaginationParams
  ) {
    return await this.notificationRepository.search(filters, pagination);
  }

  /**
   * Get notification summary
   */
  async getNotificationSummary(familyMemberId: UUID): Promise<NotificationSummary> {
    // Get all notifications
    const allNotifications = await this.notificationRepository.search(
      { familyMemberId },
      { page: 1, limit: 100 }
    );

    // Get unread count
    const unreadCount = await this.notificationRepository.getUnreadCount(familyMemberId);

    // Get urgent notifications
    const urgent = await this.notificationRepository.getUrgentNotifications(familyMemberId);

    // Count by category
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    allNotifications.items.forEach((notif) => {
      byCategory[notif.category] = (byCategory[notif.category] || 0) + 1;
      byPriority[notif.priority] = (byPriority[notif.priority] || 0) + 1;
    });

    return {
      total: allNotifications.total,
      unread: unreadCount,
      byCategory: byCategory as any,
      byPriority: byPriority as any,
      urgent,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: UUID): Promise<void> {
    await this.notificationRepository.markAsRead([notificationId]);
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: UUID[]): Promise<void> {
    await this.notificationRepository.markAsRead(notificationIds);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(familyMemberId: UUID): Promise<void> {
    await this.notificationRepository.markAllAsRead(familyMemberId);
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: UUID): Promise<void> {
    await this.notificationRepository.markAsDismissed([notificationId]);
  }

  /**
   * Delete expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    return await this.notificationRepository.deleteExpired();
  }

  /**
   * Send visit reminder notification
   */
  async sendVisitReminder(
    familyMemberId: UUID,
    clientId: UUID,
    visitId: UUID,
    visitDetails: { caregiverName: string; scheduledTime: Date },
    context: UserContext
  ): Promise<FamilyNotification> {
    return await this.createNotification(
      {
        familyMemberId,
        clientId,
        type: 'VISIT_REMINDER',
        category: 'SCHEDULE',
        title: 'Upcoming Visit Reminder',
        message: `${visitDetails.caregiverName} has a visit scheduled for ${visitDetails.scheduledTime.toLocaleString()}`,
        priority: 'MEDIUM',
        channels: ['IN_APP', 'EMAIL'],
        relatedEntity: {
          type: 'visit',
          id: visitId,
        },
      },
      context
    );
  }

  /**
   * Send care plan update notification
   */
  async sendCarePlanUpdate(
    familyMemberId: UUID,
    clientId: UUID,
    carePlanId: UUID,
    updateDescription: string,
    context: UserContext
  ): Promise<FamilyNotification> {
    return await this.createNotification(
      {
        familyMemberId,
        clientId,
        type: 'CARE_PLAN_UPDATE',
        category: 'CARE',
        title: 'Care Plan Updated',
        message: updateDescription,
        priority: 'HIGH',
        channels: ['IN_APP', 'EMAIL'],
        relatedEntity: {
          type: 'care_plan',
          id: carePlanId,
        },
      },
      context
    );
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(
    familyMemberId: UUID,
    clientId: UUID,
    alertMessage: string,
    context: UserContext
  ): Promise<FamilyNotification> {
    return await this.createNotification(
      {
        familyMemberId,
        clientId,
        type: 'EMERGENCY_ALERT',
        category: 'EMERGENCY',
        title: 'Emergency Alert',
        message: alertMessage,
        priority: 'URGENT',
        actionRequired: true,
        channels: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'],
      },
      context
    );
  }
}
