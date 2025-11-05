/**
 * Notification domain models
 *
 * System notifications and alerts for family members:
 * - Visit updates and reminders
 * - Care plan changes
 * - Message notifications
 * - System alerts
 * - Multi-channel delivery (email, SMS, push)
 */

import {
  Entity,
  UUID,
} from '@care-commons/core';

/**
 * Notification sent to family members
 */
export interface Notification extends Entity {
  id: UUID;

  // Recipient
  familyMemberId: UUID;
  clientId: UUID;

  // Notification Details
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Content
  title: string;
  body: string;
  actionUrl?: string;
  actionText?: string;

  // Context
  resourceType?: string; // 'visit', 'care_plan', 'message', etc.
  resourceId?: UUID;
  metadata?: Record<string, unknown>;

  // Delivery
  deliveryChannels: NotificationChannel[];
  deliveryStatus: NotificationDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;

  // User Interaction
  readAt?: Date;
  clickedAt?: Date;
  dismissedAt?: Date;

  // Scheduling
  scheduledFor?: Date;
  expiresAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType =
  // Visit Notifications
  | 'VISIT_SCHEDULED'
  | 'VISIT_REMINDER'
  | 'VISIT_STARTED'
  | 'VISIT_COMPLETED'
  | 'VISIT_CANCELLED'
  | 'VISIT_RESCHEDULED'
  | 'VISIT_MISSED'

  // Care Plan Notifications
  | 'CARE_PLAN_UPDATED'
  | 'CARE_PLAN_GOAL_COMPLETED'
  | 'CARE_PLAN_TASK_COMPLETED'

  // Message Notifications
  | 'NEW_MESSAGE'
  | 'MESSAGE_REPLY'
  | 'MESSAGE_MENTION'

  // System Notifications
  | 'ACCOUNT_CREATED'
  | 'INVITATION_RECEIVED'
  | 'ACCESS_GRANTED'
  | 'ACCESS_REVOKED'
  | 'PASSWORD_RESET'
  | 'SECURITY_ALERT'

  // Document Notifications
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_SHARED'
  | 'CONSENT_REQUIRED'

  // Billing Notifications
  | 'INVOICE_AVAILABLE'
  | 'PAYMENT_RECEIVED';

export type NotificationCategory =
  | 'CARE_UPDATES'
  | 'MESSAGES'
  | 'SYSTEM'
  | 'ALERTS'
  | 'REMINDERS'
  | 'BILLING';

export type NotificationPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export type NotificationChannel =
  | 'IN_APP'
  | 'EMAIL'
  | 'SMS'
  | 'PUSH';

export type NotificationDeliveryStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Notification delivery record
 * Tracks delivery across multiple channels
 */
export interface NotificationDelivery extends Entity {
  id: UUID;
  notificationId: UUID;
  channel: NotificationChannel;

  // Delivery Status
  status: NotificationDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  // Channel-Specific Data
  emailData?: EmailDelivery;
  smsData?: SMSDelivery;
  pushData?: PushDelivery;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Email delivery details
 */
export interface EmailDelivery {
  to: string;
  from: string;
  subject: string;
  messageId?: string; // Email provider message ID
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
}

/**
 * SMS delivery details
 */
export interface SMSDelivery {
  to: string;
  from: string;
  messageId?: string; // SMS provider message ID
  segments: number; // Number of SMS segments
  cost?: number;
}

/**
 * Push notification delivery details
 */
export interface PushDelivery {
  deviceTokens: string[];
  platform: 'IOS' | 'ANDROID' | 'WEB';
  badge?: number;
  sound?: string;
  data?: Record<string, unknown>;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: UUID;
  type: NotificationType;
  channel: NotificationChannel;

  // Template Content
  subject?: string; // For email
  titleTemplate: string; // Supports variables
  bodyTemplate: string; // Supports variables

  // Variables
  variables: string[]; // List of supported variables
  exampleData?: Record<string, string>;

  // Status
  isActive: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification batch
 * Groups notifications for bulk sending
 */
export interface NotificationBatch {
  id: UUID;
  name: string;
  type: NotificationType;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Notification subscription
 * Allows family members to subscribe to specific notification types
 */
export interface NotificationSubscription {
  familyMemberId: UUID;
  clientId: UUID;
  notificationType: NotificationType;
  channels: NotificationChannel[];
  isEnabled: boolean;
  updatedAt: Date;
}

/**
 * Notification statistics for analytics
 */
export interface NotificationStats {
  type: NotificationType;
  period: 'DAY' | 'WEEK' | 'MONTH';
  date: Date;

  // Counts
  sent: number;
  delivered: number;
  failed: number;
  read: number;
  clicked: number;

  // Rates
  deliveryRate: number;
  readRate: number;
  clickRate: number;

  // Channels
  byChannel: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

/**
 * Notification queue item
 * For background processing
 */
export interface NotificationQueueItem {
  id: UUID;
  notificationId: UUID;
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
}
