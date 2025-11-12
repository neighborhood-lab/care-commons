/**
 * Notification System Types
 * 
 * Supports multiple channels (email, SMS, in-app) with rate limiting and audit trails.
 */

export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationEventType =
  | 'VISIT_CLOCK_IN'
  | 'VISIT_CLOCK_OUT'
  | 'VISIT_LATE_CLOCK_IN'
  | 'VISIT_MISSED'
  | 'VISIT_CANCELED'
  | 'VISIT_NO_SHOW_CAREGIVER'
  | 'VISIT_NO_SHOW_CLIENT'
  | 'VISIT_STATUS_CHANGED';

export interface NotificationRecipient {
  userId: string;
  email?: string;
  phone?: string;
  preferredChannels: NotificationChannel[];
}

export interface NotificationPayload {
  eventType: NotificationEventType;
  priority: NotificationPriority;
  recipients: NotificationRecipient[];
  subject: string;
  message: string;
  data: Record<string, unknown>;
  organizationId: string;
  relatedEntityType?: 'visit' | 'client' | 'caregiver';
  relatedEntityId?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  recipientId: string;
  sentAt: Date;
  error?: string;
  externalId?: string; // Provider-specific ID (SendGrid message ID, Twilio SID, etc.)
}

export interface NotificationPreferences {
  userId: string;
  organizationId: string;
  enabledChannels: NotificationChannel[];
  enabledEvents: NotificationEventType[];
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;
  timezone?: string;
  maxNotificationsPerHour: number;
}

export interface NotificationProvider {
  readonly name: string;
  readonly channel: NotificationChannel;
  send(payload: NotificationPayload, recipient: NotificationRecipient): Promise<NotificationResult>;
  isConfigured(): boolean;
}

export interface NotificationTemplate {
  eventType: NotificationEventType;
  subject: string;
  bodyTemplate: string; // Mustache template
  priority: NotificationPriority;
}
