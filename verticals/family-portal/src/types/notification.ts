import type { UUID, Timestamp } from '@care-commons/core';

/**
 * Family Notification
 * Represents notifications sent to family members
 */
export interface FamilyNotification {
  id: UUID;
  familyMemberId: UUID;
  clientId: UUID;

  // Notification details
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;

  // Priority and actions
  priority: NotificationPriority;
  actionRequired: boolean;
  actionUrl?: string;
  actionLabel?: string;

  // Delivery channels
  channels: NotificationChannel[];

  // Status
  status: NotificationStatus;
  sentAt?: Timestamp;
  readAt?: Timestamp;
  dismissedAt?: Timestamp;

  // Related entities
  relatedEntity?: {
    type: 'visit' | 'care_plan' | 'medication' | 'document' | 'message';
    id: UUID;
  };

  // Audit
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export type NotificationType =
  | 'CARE_UPDATE'
  | 'VISIT_REMINDER'
  | 'VISIT_COMPLETED'
  | 'VISIT_CANCELLED'
  | 'CARE_PLAN_UPDATE'
  | 'MEDICATION_CHANGE'
  | 'DOCUMENT_ADDED'
  | 'MESSAGE_RECEIVED'
  | 'EMERGENCY_ALERT'
  | 'SYSTEM_ANNOUNCEMENT';

export type NotificationCategory =
  | 'CARE'
  | 'SCHEDULE'
  | 'HEALTH'
  | 'COMMUNICATION'
  | 'EMERGENCY'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'DISMISSED' | 'FAILED';

/**
 * Create Notification Input
 */
export interface CreateNotificationInput {
  familyMemberId: UUID;
  clientId: UUID;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionRequired?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  channels?: NotificationChannel[];
  relatedEntity?: {
    type: 'visit' | 'care_plan' | 'medication' | 'document' | 'message';
    id: UUID;
  };
  expiresInDays?: number;
}

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  careUpdates: {
    enabled: boolean;
    channels: NotificationChannel[];
    priority: NotificationPriority;
  };
  visitReminders: {
    enabled: boolean;
    channels: NotificationChannel[];
    reminderHoursBefore: number;
  };
  emergencyAlerts: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  chatMessages: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  systemAnnouncements: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
    timezone: string;
  };
}

/**
 * Notification Summary
 */
export interface NotificationSummary {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  urgent: FamilyNotification[];
}
