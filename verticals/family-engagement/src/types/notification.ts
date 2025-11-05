/**
 * Notification domain models
 *
 * Notification preferences and delivery:
 * - User notification preferences
 * - Channel preferences (push, email, SMS, in-app)
 * - Quiet hours and digest settings
 * - Notification type configuration
 */

import {
  Entity,
  UUID,
} from '@care-commons/core';

/**
 * Notification channels
 */
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Notification types (extends push_notifications table types)
 */
export type NotificationType =
  | 'VISIT_REMINDER'
  | 'VISIT_STARTED'
  | 'VISIT_CANCELLED'
  | 'VISIT_COMPLETED'
  | 'TASK_ASSIGNED'
  | 'TASK_DUE'
  | 'TASK_COMPLETED'
  | 'SCHEDULE_UPDATED'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_URGENT'
  | 'SYSTEM_ALERT'
  | 'COMPLIANCE_WARNING'
  | 'FAMILY_INVITE'
  | 'FAMILY_MESSAGE'
  | 'CARE_PLAN_UPDATED'
  | 'INCIDENT_REPORTED'
  | 'MEDICATION_REMINDER';

/**
 * Digest frequency options
 */
export type DigestFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY';

/**
 * Notification delivery status
 */
export type NotificationDeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Notification preferences entity
 */
export interface NotificationPreferences extends Entity {
  userId: UUID;
  organizationId: UUID;

  // Channel preferences
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;

  // Notification type preferences (map: notification_type -> enabled)
  typePreferences: Record<NotificationType, boolean>;

  // Quiet hours
  quietHoursStart?: string; // HH:MM:SS format
  quietHoursEnd?: string; // HH:MM:SS format
  timezone: string;

  // Digest preferences
  digestEnabled: boolean;
  digestFrequency: DigestFrequency;
  digestTime: string; // HH:MM:SS format

  // Urgency filtering
  minimumPriority: NotificationPriority; // Only send this priority and above
}

/**
 * Notification preferences update request
 */
export interface UpdateNotificationPreferencesRequest {
  userId: UUID;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  inAppEnabled?: boolean;
  typePreferences?: Partial<Record<NotificationType, boolean>>;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  digestEnabled?: boolean;
  digestFrequency?: DigestFrequency;
  digestTime?: string;
  minimumPriority?: NotificationPriority;
}

/**
 * Notification creation request
 */
export interface CreateNotificationRequest {
  userId: UUID;
  organizationId: UUID;
  deviceId?: UUID; // Optional: target specific device
  notificationType: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledFor?: Date;
}

/**
 * Notification delivery log
 */
export interface NotificationDeliveryLog {
  id: UUID;
  notificationId: UUID;
  userId: UUID;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification with delivery status
 */
export interface NotificationWithDelivery {
  id: UUID;
  userId: UUID;
  organizationId: UUID;
  notificationType: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

/**
 * Notification filter options
 */
export interface NotificationFilterOptions {
  userId?: UUID;
  organizationId?: UUID;
  notificationType?: NotificationType;
  status?: NotificationDeliveryStatus;
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  beforeDate?: Date;
  afterDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Notification summary for user
 */
export interface NotificationSummary {
  totalCount: number;
  unreadCount: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

/**
 * Bulk notification request
 */
export interface BulkNotificationRequest {
  userIds: UUID[];
  notificationType: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledFor?: Date;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: UUID;
  organizationId: UUID;
  notificationType: NotificationType;
  name: string;
  description?: string;
  titleTemplate: string; // Supports placeholders like {{userName}}
  bodyTemplate: string;
  defaultPriority: NotificationPriority;
  isActive: boolean;
}

/**
 * Notification template variables
 */
export interface NotificationTemplateVariables {
  [key: string]: string | number | Date | boolean;
}

/**
 * Mark notification as read request
 */
export interface MarkNotificationReadRequest {
  notificationId: UUID;
  userId: UUID;
}

/**
 * Mark all as read request
 */
export interface MarkAllNotificationsReadRequest {
  userId: UUID;
  beforeDate?: Date;
  notificationType?: NotificationType;
}
