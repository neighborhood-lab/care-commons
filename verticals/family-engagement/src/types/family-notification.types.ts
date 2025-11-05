/**
 * Family Notification Types
 *
 * Type definitions for family notifications and transparency updates
 */

export type NotificationType =
  | 'VISIT_SCHEDULED'
  | 'VISIT_STARTED'
  | 'VISIT_COMPLETED'
  | 'VISIT_CANCELLED'
  | 'CARE_PLAN_UPDATED'
  | 'TASK_COMPLETED'
  | 'MEDICATION_REMINDER'
  | 'HEALTH_UPDATE'
  | 'INCIDENT_REPORT'
  | 'BILLING_STATEMENT'
  | 'APPOINTMENT_REMINDER'
  | 'DOCUMENT_SHARED'
  | 'MESSAGE_RECEIVED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'SURVEY_REQUEST'
  | 'CONSENT_REQUIRED';

export type NotificationCategory =
  | 'VISIT'
  | 'CARE_PLAN'
  | 'HEALTH'
  | 'BILLING'
  | 'COMMUNICATION'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type DeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELLED';

export type DeliveryChannel = 'EMAIL' | 'SMS' | 'APP' | 'PUSH';

export interface DeliveryDetails {
  channel: DeliveryChannel;
  status: DeliveryStatus;
  sent_at?: Date;
  delivered_at?: Date;
  error?: string;
}

export interface FamilyNotification {
  id: string;
  family_member_id: string;
  client_id: string;
  organization_id: string;

  // Notification details
  notification_type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, unknown>;

  // Related entities
  related_entity_id?: string;
  related_entity_type?: string;

  // Delivery
  delivery_channels?: DeliveryChannel[];
  scheduled_for?: Date;
  delivery_status: DeliveryStatus;
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  delivery_details?: DeliveryDetails[];
  delivery_error?: string;

  // User interaction
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
  archived_at?: Date;

  // Expiration
  expires_at?: Date;

  // Standard fields
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

export interface CreateFamilyNotificationInput {
  family_member_id: string;
  client_id: string;
  organization_id: string;

  notification_type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, unknown>;

  related_entity_id?: string;
  related_entity_type?: string;

  delivery_channels?: DeliveryChannel[];
  scheduled_for?: Date;

  expires_at?: Date;

  created_by: string;
}

export interface UpdateFamilyNotificationInput {
  delivery_status?: DeliveryStatus;
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  is_read?: boolean;
  is_archived?: boolean;
  is_starred?: boolean;
  delivery_details?: DeliveryDetails[];
  delivery_error?: string;
  updated_by: string;
}

export interface FamilyNotificationFilters {
  family_member_id?: string;
  client_id?: string;
  organization_id?: string;
  notification_type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  delivery_status?: DeliveryStatus;
  is_read?: boolean;
  is_archived?: boolean;
  date_from?: Date;
  date_to?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_category: Record<NotificationCategory, number>;
  by_priority: Record<NotificationPriority, number>;
}
