/**
 * Family Notification Service - business logic for family notifications and transparency
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FamilyNotification,
  CreateFamilyNotificationInput,
  UpdateFamilyNotificationInput,
  FamilyNotificationFilters,
  NotificationStats,
  DeliveryChannel,
} from '../types/index.js';
import { FamilyNotificationRepository } from '../repository/index.js';
import { Database, PaginatedResult } from '@care-commons/core';

export class FamilyNotificationService {
  private repository: FamilyNotificationRepository;

  constructor(database: Database) {
    this.repository = new FamilyNotificationRepository(database);
  }

  /**
   * Create and send a notification to a family member
   */
  async createNotification(input: CreateFamilyNotificationInput): Promise<FamilyNotification> {
    const notification: FamilyNotification = {
      id: uuidv4(),
      family_member_id: input.family_member_id,
      client_id: input.client_id,
      organization_id: input.organization_id,

      notification_type: input.notification_type,
      category: input.category,
      priority: input.priority ?? 'NORMAL',
      title: input.title,
      body: input.body,
      data: input.data,

      related_entity_id: input.related_entity_id,
      related_entity_type: input.related_entity_type,

      delivery_channels: input.delivery_channels ?? ['APP', 'EMAIL'],
      scheduled_for: input.scheduled_for,
      delivery_status: 'PENDING',

      is_read: false,
      is_archived: false,
      is_starred: false,

      expires_at: input.expires_at,

      created_at: new Date(),
      created_by: input.created_by,
      updated_at: new Date(),
      updated_by: input.created_by,
      version: 1,
    };

    const created = await this.repository.create(notification);

    // Trigger async delivery (in production, this would queue the notification)
    // await this.deliverNotification(created);

    return created;
  }

  /**
   * Send a visit update notification
   */
  async notifyVisitUpdate(
    familyMemberId: string,
    clientId: string,
    organizationId: string,
    visitId: string,
    visitStatus: string,
    visitDetails: string,
    createdBy: string
  ): Promise<FamilyNotification> {
    let notificationType: 'VISIT_SCHEDULED' | 'VISIT_STARTED' | 'VISIT_COMPLETED' | 'VISIT_CANCELLED';
    let title: string;

    switch (visitStatus) {
      case 'scheduled':
        notificationType = 'VISIT_SCHEDULED';
        title = 'Visit Scheduled';
        break;
      case 'in_progress':
        notificationType = 'VISIT_STARTED';
        title = 'Visit Started';
        break;
      case 'completed':
        notificationType = 'VISIT_COMPLETED';
        title = 'Visit Completed';
        break;
      case 'cancelled':
        notificationType = 'VISIT_CANCELLED';
        title = 'Visit Cancelled';
        break;
      default:
        notificationType = 'VISIT_SCHEDULED';
        title = 'Visit Update';
    }

    return await this.createNotification({
      family_member_id: familyMemberId,
      client_id: clientId,
      organization_id: organizationId,
      notification_type: notificationType,
      category: 'VISIT',
      priority: visitStatus === 'cancelled' ? 'HIGH' : 'NORMAL',
      title,
      body: visitDetails,
      related_entity_id: visitId,
      related_entity_type: 'visit',
      created_by: createdBy,
    });
  }

  /**
   * Send a care plan update notification
   */
  async notifyCarePlanUpdate(
    familyMemberId: string,
    clientId: string,
    organizationId: string,
    carePlanId: string,
    updateDetails: string,
    createdBy: string
  ): Promise<FamilyNotification> {
    return await this.createNotification({
      family_member_id: familyMemberId,
      client_id: clientId,
      organization_id: organizationId,
      notification_type: 'CARE_PLAN_UPDATED',
      category: 'CARE_PLAN',
      priority: 'NORMAL',
      title: 'Care Plan Updated',
      body: updateDetails,
      related_entity_id: carePlanId,
      related_entity_type: 'care_plan',
      created_by: createdBy,
    });
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<FamilyNotification | null> {
    return await this.repository.findById(id);
  }

  /**
   * Get all notifications for a family member
   */
  async getNotificationsByFamilyMember(
    familyMemberId: string,
    includeArchived = false
  ): Promise<FamilyNotification[]> {
    return await this.repository.findByFamilyMemberId(familyMemberId, includeArchived);
  }

  /**
   * Get unread notifications for a family member
   */
  async getUnreadNotifications(familyMemberId: string): Promise<FamilyNotification[]> {
    return await this.repository.findUnread(familyMemberId);
  }

  /**
   * Get pending notifications for delivery
   */
  async getPendingNotifications(): Promise<FamilyNotification[]> {
    return await this.repository.findPendingDelivery();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.repository.markAsRead(notificationId, userId);
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<void> {
    await this.repository.markMultipleAsRead(notificationIds, userId);
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string, userId: string): Promise<void> {
    await this.repository.archive(notificationId, userId);
  }

  /**
   * Update notification delivery status
   */
  async updateDeliveryStatus(
    notificationId: string,
    status: 'SENT' | 'DELIVERED' | 'FAILED',
    error?: string,
    userId?: string
  ): Promise<FamilyNotification> {
    const update: UpdateFamilyNotificationInput = {
      delivery_status: status,
      updated_by: userId ?? 'system',
    };

    if (status === 'SENT') {
      update.sent_at = new Date();
    } else if (status === 'DELIVERED') {
      update.delivered_at = new Date();
    }

    if (error) {
      update.delivery_error = error;
    }

    return await this.repository.update(notificationId, update);
  }

  /**
   * Get notification statistics for a family member
   */
  async getStats(familyMemberId: string): Promise<NotificationStats> {
    return await this.repository.getStats(familyMemberId);
  }

  /**
   * Search notifications with filters
   */
  async searchNotifications(
    filters: FamilyNotificationFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<FamilyNotification>> {
    return await this.repository.search(filters, page, pageSize);
  }

  /**
   * Delete expired notifications
   */
  async deleteExpiredNotifications(): Promise<number> {
    return await this.repository.deleteExpired();
  }

  /**
   * Broadcast notification to all family members of a client
   */
  async broadcastToClientFamily(
    clientId: string,
    organizationId: string,
    notificationType: CreateFamilyNotificationInput['notification_type'],
    category: CreateFamilyNotificationInput['category'],
    title: string,
    body: string,
    createdBy: string,
    options?: {
      priority?: CreateFamilyNotificationInput['priority'];
      relatedEntityId?: string;
      relatedEntityType?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<FamilyNotification[]> {
    // In a real implementation, this would fetch all family members for the client
    // and create notifications for each one who has notification permissions
    // For now, returning empty array as placeholder
    return [];
  }
}
