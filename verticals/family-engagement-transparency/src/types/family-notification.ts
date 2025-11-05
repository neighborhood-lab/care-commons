/**
 * Family Notification Types
 *
 * Types for managing notifications sent to family members
 */

/**
 * Notification category
 */
export type NotificationCategory =
  | 'PROGRESS'       // Progress updates and summaries
  | 'SCHEDULE'       // Schedule changes and reminders
  | 'CARE_PLAN'      // Care plan updates
  | 'COMMUNICATION'  // New messages from care team
  | 'ALERT'         // Important alerts or incidents
  | 'SYSTEM';       // System notifications

/**
 * Priority level
 */
export type NotificationPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

/**
 * Overall notification status
 */
export type NotificationStatus =
  | 'PENDING'    // Waiting to be sent
  | 'SCHEDULED'  // Scheduled for future delivery
  | 'SENDING'    // Currently being sent
  | 'SENT'       // Successfully sent to at least one channel
  | 'DELIVERED'  // Confirmed delivery
  | 'READ'       // Read by recipient
  | 'FAILED'     // Failed to send
  | 'CANCELLED'  // Cancelled before sending
  | 'EXPIRED';   // Expired before delivery

/**
 * Channel-specific delivery status
 */
export type ChannelStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'BOUNCED'
  | 'OPENED'
  | 'CLICKED';

/**
 * Related entity types
 */
export type RelatedEntityType =
  | 'progress_summary'
  | 'visit'
  | 'care_plan'
  | 'message'
  | 'task'
  | 'incident'
  | 'document';

/**
 * Structured notification data
 */
export interface NotificationData {
  // Action buttons
  actions?: Array<{
    label: string;
    url: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;

  // Rich content
  imageUrl?: string;
  iconUrl?: string;
  badgeCount?: number;

  // Tracking
  trackClicks?: boolean;
  trackOpens?: boolean;

  // Custom fields
  [key: string]: unknown;
}

/**
 * Family Notification entity
 */
export interface FamilyNotification {
  // Identity
  id: string;
  familyContactId: string;
  clientId: string;
  organizationId: string;

  // Notification details
  notificationType: string;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Content
  title: string;
  message: string;
  summary?: string; // Short version for SMS/push
  data?: NotificationData;

  // Related entities
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  actionUrl?: string;

  // Scheduling
  scheduledFor?: Date;
  sendImmediately: boolean;

  // Delivery channels
  sendEmail: boolean;
  sendSms: boolean;
  sendPush: boolean;
  showInPortal: boolean;

  // Delivery tracking
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  acknowledgedAt?: Date;

  // Email delivery
  emailStatus?: ChannelStatus;
  emailMessageId?: string;
  emailError?: string;
  emailSentAt?: Date;
  emailOpenedAt?: Date;
  emailClickedAt?: Date;

  // SMS delivery
  smsStatus?: ChannelStatus;
  smsMessageId?: string;
  smsError?: string;
  smsSentAt?: Date;
  smsDeliveredAt?: Date;

  // Push delivery
  pushStatus?: ChannelStatus;
  pushMessageId?: string;
  pushError?: string;
  pushSentAt?: Date;
  pushDeliveredAt?: Date;

  // Retry logic
  retryCount: number;
  nextRetryAt?: Date;
  failureReason?: string;

  // Expiration
  expiresAt?: Date;
  expired: boolean;

  // Audit fields
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

/**
 * Create notification input
 */
export interface CreateFamilyNotificationInput {
  familyContactId: string;
  clientId: string;
  organizationId: string;

  // Notification details
  notificationType: string;
  category: NotificationCategory;
  priority?: NotificationPriority;

  // Content
  title: string;
  message: string;
  summary?: string;
  data?: NotificationData;

  // Related entities
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  actionUrl?: string;

  // Scheduling
  scheduledFor?: Date;
  sendImmediately?: boolean;

  // Delivery channels (will use contact preferences if not specified)
  sendEmail?: boolean;
  sendSms?: boolean;
  sendPush?: boolean;
  showInPortal?: boolean;

  // Expiration
  expiresAt?: Date;
}

/**
 * Batch notification input
 */
export interface BatchNotificationInput {
  familyContactIds: string[];
  clientId: string;
  organizationId: string;

  // Notification details
  notificationType: string;
  category: NotificationCategory;
  priority?: NotificationPriority;

  // Content
  title: string;
  message: string;
  summary?: string;
  data?: NotificationData;

  // Related entities
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  actionUrl?: string;

  // Scheduling
  scheduledFor?: Date;
  sendImmediately?: boolean;

  // Delivery channels
  sendEmail?: boolean;
  sendSms?: boolean;
  sendPush?: boolean;
  showInPortal?: boolean;
}

/**
 * Search criteria for notifications
 */
export interface NotificationSearchCriteria {
  organizationId?: string;
  familyContactId?: string;
  clientId?: string;
  category?: NotificationCategory[];
  priority?: NotificationPriority[];
  status?: NotificationStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  unreadOnly?: boolean;
  failedOnly?: boolean;
  searchText?: string;
}

/**
 * Notification statistics
 */
export interface NotificationStatistics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;

  byCategory: Record<NotificationCategory, number>;
  byChannel: {
    email: number;
    sms: number;
    push: number;
    portal: number;
  };

  deliveryRate: number; // Percentage
  readRate: number;     // Percentage
  failureRate: number;  // Percentage

  averageDeliveryTime?: number; // Milliseconds
  averageReadTime?: number;     // Milliseconds
}

/**
 * Notification with family contact details
 */
export interface NotificationWithContact extends FamilyNotification {
  familyContact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  notificationType: string;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Content templates
  titleTemplate: string;
  messageTemplate: string;
  summaryTemplate?: string;

  // Variables available in templates
  variables: string[];

  // Default channels
  defaultSendEmail: boolean;
  defaultSendSms: boolean;
  defaultSendPush: boolean;

  // Status
  active: boolean;
  organizationId?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification preferences summary
 */
export interface NotificationPreferencesSummary {
  familyContactId: string;
  clientId: string;

  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;

  enabledCategories: NotificationCategory[];
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };

  frequency: 'IMMEDIATE' | 'DIGEST_HOURLY' | 'DIGEST_DAILY' | 'DIGEST_WEEKLY';
}
