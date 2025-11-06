/**
 * @care-commons/communication-messaging - Type Definitions
 *
 * Communication & Messaging Platform
 *
 * Comprehensive communication system for multi-channel messaging,
 * notifications, broadcasts, and team collaboration across the
 * care coordination platform.
 */

import type { Entity, UUID, Timestamp, SoftDeletable } from '@care-commons/core';

// ============================================================================
// Communication Channel Types
// ============================================================================

/**
 * Communication channel type
 */
export type ChannelType =
  | 'SMS' // Text messaging
  | 'EMAIL' // Email communication
  | 'PUSH' // Push notifications
  | 'IN_APP' // In-app messaging
  | 'VOICE' // Voice calls (future)
  | 'VIDEO'; // Video calls (future)

/**
 * Channel status
 */
export type ChannelStatus =
  | 'ACTIVE' // Channel is operational
  | 'INACTIVE' // Channel is disabled
  | 'RATE_LIMITED' // Temporary rate limit
  | 'ERROR' // Channel has errors
  | 'MAINTENANCE'; // Under maintenance

/**
 * Communication channel configuration
 */
export interface CommunicationChannel extends Entity {
  organizationId: UUID;

  // Channel details
  channelType: ChannelType;
  channelName: string;
  description?: string;
  status: ChannelStatus;

  // Provider configuration
  providerName: string; // e.g., 'Twilio', 'SendGrid', 'AWS SNS'
  providerConfig: Record<string, unknown>; // Provider-specific settings

  // Limits and quotas
  dailyLimit?: number;
  monthlyLimit?: number;
  currentDailyUsage: number;
  currentMonthlyUsage: number;

  // Metadata
  lastUsedAt?: Timestamp | null;
  lastErrorAt?: Timestamp | null;
  lastErrorMessage?: string;

  // Settings
  isDefault: boolean; // Default channel for this type
  priority: number; // Fallback priority (lower = higher priority)
}

// ============================================================================
// Message & Thread Types
// ============================================================================

/**
 * Message type classification
 */
export type MessageType =
  | 'DIRECT' // Direct message to individual
  | 'GROUP' // Group conversation
  | 'BROADCAST' // One-to-many broadcast
  | 'AUTOMATED' // System/automated message
  | 'SCHEDULED'; // Scheduled for future delivery

/**
 * Message status
 */
export type MessageStatus =
  | 'DRAFT' // Being composed
  | 'QUEUED' // Queued for sending
  | 'SENDING' // Currently sending
  | 'SENT' // Successfully sent
  | 'DELIVERED' // Delivered to recipient
  | 'READ' // Read by recipient
  | 'FAILED' // Delivery failed
  | 'CANCELLED'; // Cancelled before sending

/**
 * Message priority
 */
export type MessagePriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

/**
 * Participant type in conversation
 */
export type ParticipantType =
  | 'CAREGIVER'
  | 'CLIENT'
  | 'FAMILY'
  | 'COORDINATOR'
  | 'ADMIN'
  | 'SYSTEM';

/**
 * Message thread (conversation container)
 */
export interface MessageThread extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId?: UUID;

  // Thread details
  threadType: MessageType;
  subject?: string;
  description?: string;

  // Participants
  participantIds: UUID[]; // User IDs of all participants
  participants: ThreadParticipant[];

  // Ownership
  ownerId: UUID; // Creator of the thread
  assignedToId?: UUID; // Assigned handler (for support/coordination)

  // Status
  status: 'ACTIVE' | 'ARCHIVED' | 'LOCKED' | 'DELETED';
  isLocked: boolean; // Prevent new messages
  lockedAt?: Timestamp | null;
  lockedBy?: UUID;
  lockedReason?: string;

  // Metadata
  lastMessageAt?: Timestamp | null;
  lastMessagePreview?: string;
  messageCount: number;

  // Related entities
  relatedEntityType?: 'CLIENT' | 'VISIT' | 'CARE_PLAN' | 'INCIDENT';
  relatedEntityId?: UUID;

  // Tags and categorization
  tags: string[];
  category?: string;

  // Settings
  allowAttachments: boolean;
  maxParticipants?: number;
}

/**
 * Thread participant with metadata
 */
export interface ThreadParticipant {
  userId: UUID;
  participantType: ParticipantType;
  displayName: string;
  avatarUrl?: string;

  // Status
  joinedAt: Timestamp;
  leftAt?: Timestamp | null;
  isActive: boolean;

  // Permissions
  canSend: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  isAdmin: boolean;

  // Read tracking
  lastReadAt?: Timestamp | null;
  lastReadMessageId?: UUID;
  unreadCount: number;

  // Notification preferences
  notificationsEnabled: boolean;
  mentionNotificationsOnly: boolean;
}

/**
 * Individual message in a thread
 */
export interface Message extends Entity, SoftDeletable {
  threadId: UUID;
  organizationId: UUID;

  // Sender
  senderId: UUID;
  senderType: ParticipantType;
  senderName: string;
  senderAvatarUrl?: string;

  // Content
  content: string;
  contentFormat: 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML';
  truncatedContent?: string; // For previews

  // Attachments
  attachments: MessageAttachment[];

  // Message metadata
  messageType: MessageType;
  priority: MessagePriority;
  status: MessageStatus;

  // Delivery tracking
  sentAt?: Timestamp | null;
  deliveredAt?: Timestamp | null;
  failedAt?: Timestamp | null;
  failureReason?: string;

  // Read tracking
  readBy: ReadReceipt[];
  readCount: number;

  // Reply/Thread
  replyToMessageId?: UUID; // For threaded replies
  forwardedFromMessageId?: UUID; // If forwarded

  // Channels used
  channels: ChannelType[];
  primaryChannel: ChannelType;

  // Flags
  isEdited: boolean;
  editedAt?: Timestamp | null;
  isInternal: boolean; // Internal note not sent via external channels
  isFlagged: boolean;
  flaggedReason?: string;
  flaggedBy?: UUID;

  // Mentions and reactions
  mentionedUserIds: UUID[];
  reactions: MessageReaction[];

  // Scheduling
  scheduledSendAt?: Timestamp | null;

  // Metadata
  metadata: Record<string, unknown>; // Extensible metadata
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  attachmentId: UUID;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: Timestamp;
  uploadedBy: UUID;
}

/**
 * Read receipt tracking
 */
export interface ReadReceipt {
  userId: UUID;
  userName: string;
  readAt: Timestamp;
  deviceType?: 'WEB' | 'MOBILE' | 'TABLET';
}

/**
 * Message reaction (emoji reactions)
 */
export interface MessageReaction {
  reactionId: UUID;
  userId: UUID;
  userName: string;
  emoji: string;
  reactedAt: Timestamp;
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification category
 */
export type NotificationCategory =
  | 'VISIT' // Visit-related
  | 'SCHEDULE' // Schedule changes
  | 'CARE_PLAN' // Care plan updates
  | 'TASK' // Task assignments
  | 'MESSAGE' // New messages
  | 'INCIDENT' // Incidents/alerts
  | 'REMINDER' // Reminders
  | 'APPROVAL' // Approval requests
  | 'SYSTEM' // System notifications
  | 'MARKETING'; // Marketing communications

/**
 * Notification status
 */
export type NotificationStatus =
  | 'PENDING' // Queued for delivery
  | 'SCHEDULED' // Scheduled for future
  | 'SENDING' // Currently sending
  | 'SENT' // Successfully sent
  | 'DELIVERED' // Confirmed delivered
  | 'READ' // User has read
  | 'DISMISSED' // User dismissed
  | 'FAILED' // Delivery failed
  | 'EXPIRED'; // Expired before delivery

/**
 * Notification entity
 */
export interface Notification extends Entity {
  organizationId: UUID;
  recipientId: UUID;
  recipientType: ParticipantType;

  // Content
  category: NotificationCategory;
  priority: MessagePriority;
  title: string;
  message: string;
  richContent?: string; // HTML or markdown rich content

  // Action
  actionUrl?: string; // Deep link
  actionLabel?: string; // Button text
  actionData?: Record<string, unknown>; // Additional action data

  // Related entity
  relatedEntityType?: string;
  relatedEntityId?: UUID;

  // Delivery
  status: NotificationStatus;
  channels: ChannelType[];
  primaryChannel: ChannelType;

  // Tracking
  sentAt?: Timestamp | null;
  deliveredAt?: Timestamp | null;
  readAt?: Timestamp | null;
  dismissedAt?: Timestamp | null;
  failedAt?: Timestamp | null;
  failureReason?: string;

  // Channel-specific IDs
  externalIds: Record<ChannelType, string>; // e.g., SMS message ID from Twilio

  // Scheduling
  scheduledSendAt?: Timestamp | null;
  expiresAt?: Timestamp | null;

  // Grouping (for notification batching)
  groupKey?: string;
  isGrouped: boolean;

  // Metadata
  metadata: Record<string, unknown>;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Template variable placeholder
 */
export interface TemplateVariable {
  name: string;
  description: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'URL';
  isRequired: boolean;
  defaultValue?: string;
  exampleValue?: string;
}

/**
 * Message template for reusable content
 */
export interface MessageTemplate extends Entity {
  organizationId: UUID;

  // Template details
  templateName: string;
  description?: string;
  category: NotificationCategory;

  // Content
  subject?: string; // For email
  content: string;
  contentFormat: 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML';

  // Variables
  variables: TemplateVariable[];

  // Channel-specific versions
  channelVersions: Partial<Record<ChannelType, TemplateChannelVersion>>;

  // Usage
  usageCount: number;
  lastUsedAt?: Timestamp | null;

  // Status
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isSystem: boolean; // System template (cannot be deleted)

  // Metadata
  tags: string[];
  language: string; // e.g., 'en', 'es'
}

/**
 * Channel-specific template version
 */
export interface TemplateChannelVersion {
  channelType: ChannelType;
  subject?: string;
  content: string;
  contentFormat: 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML';
  characterLimit?: number;
}

// ============================================================================
// Communication Preferences Types
// ============================================================================

/**
 * User communication preferences
 */
export interface CommunicationPreferences extends Entity {
  userId: UUID;
  organizationId: UUID;

  // Channel preferences
  preferredChannel: ChannelType;
  enabledChannels: ChannelType[];

  // Channel-specific settings
  emailAddress?: string;
  phoneNumber?: string;
  pushDeviceTokens: string[];

  // Category preferences
  categoryPreferences: CategoryPreference[];

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
  quietHoursTimezone: string;

  // Digest settings
  enableDigest: boolean;
  digestFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  digestTime?: string; // HH:mm format
  digestDays?: number[]; // 0-6 for Sunday-Saturday

  // Notification settings
  notificationSound: boolean;
  notificationVibrate: boolean;
  showMessagePreview: boolean;

  // Do Not Disturb
  doNotDisturbEnabled: boolean;
  doNotDisturbUntil?: Timestamp | null;

  // Language
  preferredLanguage: string;

  // Consent
  marketingOptIn: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
  pushOptIn: boolean;
}

/**
 * Preference for specific notification category
 */
export interface CategoryPreference {
  category: NotificationCategory;
  enabled: boolean;
  channels: ChannelType[];
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  frequency: 'IMMEDIATE' | 'BATCHED' | 'DIGEST';
}

// ============================================================================
// Broadcast & Campaign Types
// ============================================================================

/**
 * Broadcast status
 */
export type BroadcastStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

/**
 * Broadcast message to multiple recipients
 */
export interface BroadcastMessage extends Entity {
  organizationId: UUID;

  // Broadcast details
  broadcastName: string;
  description?: string;
  category: NotificationCategory;

  // Content
  subject?: string;
  content: string;
  contentFormat: 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML';
  templateId?: UUID;

  // Targeting
  recipientFilter: RecipientFilter;
  recipientCount: number;
  recipientIds: UUID[];

  // Channels
  channels: ChannelType[];
  primaryChannel: ChannelType;

  // Scheduling
  status: BroadcastStatus;
  scheduledAt?: Timestamp | null;
  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  cancelledAt?: Timestamp | null;
  cancelledBy?: UUID;
  cancelledReason?: string;

  // Results
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;

  // Settings
  respectQuietHours: boolean;
  respectDoNotDisturb: boolean;
  respectOptOut: boolean;

  // Rate limiting
  maxSendRate?: number; // Messages per minute

  // Tracking
  trackOpens: boolean;
  trackClicks: boolean;

  // Metadata
  tags: string[];
  campaignId?: UUID;
}

/**
 * Recipient filter for broadcast targeting
 */
export interface RecipientFilter {
  // User types
  participantTypes?: ParticipantType[];

  // Demographics
  organizationIds?: UUID[];
  branchIds?: UUID[];
  roles?: string[];

  // Engagement
  lastActiveAfter?: Timestamp;
  lastActiveBefore?: Timestamp;

  // Preferences
  hasOptedIn?: boolean;
  preferredChannels?: ChannelType[];

  // Custom filters
  customFilters?: Record<string, unknown>;

  // Exclusions
  excludeUserIds?: UUID[];
}

// ============================================================================
// Delivery & Tracking Types
// ============================================================================

/**
 * Message delivery record
 */
export interface MessageDelivery extends Entity {
  messageId: UUID;
  notificationId?: UUID;
  broadcastId?: UUID;

  recipientId: UUID;
  recipientType: ParticipantType;

  // Channel delivery
  channel: ChannelType;
  channelMessageId?: string; // External provider message ID

  // Status
  status: MessageStatus;
  attemptCount: number;
  lastAttemptAt?: Timestamp | null;

  // Timestamps
  queuedAt: Timestamp;
  sentAt?: Timestamp | null;
  deliveredAt?: Timestamp | null;
  readAt?: Timestamp | null;
  failedAt?: Timestamp | null;

  // Error tracking
  errorCode?: string;
  errorMessage?: string;

  // Engagement
  openedAt?: Timestamp | null;
  clickedAt?: Timestamp | null;
  clickCount: number;

  // Metadata
  metadata: Record<string, unknown>;
}

/**
 * Communication analytics event
 */
export interface CommunicationEvent extends Entity {
  organizationId: UUID;

  // Event details
  eventType: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CLICKED' | 'UNSUBSCRIBED';
  entityType: 'MESSAGE' | 'NOTIFICATION' | 'BROADCAST';
  entityId: UUID;

  // User
  userId?: UUID;
  userType?: ParticipantType;

  // Channel
  channel: ChannelType;

  // Context
  context: Record<string, unknown>;

  // Timestamp
  occurredAt: Timestamp;
}

// ============================================================================
// Service Layer Input Types
// ============================================================================

/**
 * Input for creating message thread
 */
export interface CreateThreadInput {
  organizationId: UUID;
  branchId?: UUID;
  threadType: MessageType;
  subject?: string;
  description?: string;
  participantIds: UUID[];
  relatedEntityType?: 'CLIENT' | 'VISIT' | 'CARE_PLAN' | 'INCIDENT';
  relatedEntityId?: UUID;
  category?: string;
  tags?: string[];
}

/**
 * Input for sending message
 */
export interface SendMessageInput {
  threadId: UUID;
  senderId: UUID;
  content: string;
  contentFormat?: 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML';
  priority?: MessagePriority;
  attachments?: MessageAttachment[];
  replyToMessageId?: UUID;
  channels?: ChannelType[];
  scheduledSendAt?: Timestamp;
  isInternal?: boolean;
  mentionedUserIds?: UUID[];
}

/**
 * Input for sending notification
 */
export interface SendNotificationInput {
  organizationId: UUID;
  recipientId: UUID;
  recipientType: ParticipantType;
  category: NotificationCategory;
  priority: MessagePriority;
  title: string;
  message: string;
  richContent?: string;
  actionUrl?: string;
  actionLabel?: string;
  channels: ChannelType[];
  relatedEntityType?: string;
  relatedEntityId?: UUID;
  scheduledSendAt?: Timestamp;
  expiresAt?: Timestamp;
}

/**
 * Input for creating broadcast
 */
export interface CreateBroadcastInput {
  organizationId: UUID;
  broadcastName: string;
  description?: string;
  category: NotificationCategory;
  subject?: string;
  content: string;
  contentFormat?: 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML';
  templateId?: UUID;
  recipientFilter: RecipientFilter;
  channels: ChannelType[];
  scheduledAt?: Timestamp;
  respectQuietHours?: boolean;
  respectDoNotDisturb?: boolean;
  maxSendRate?: number;
}

/**
 * Input for creating template
 */
export interface CreateTemplateInput {
  organizationId: UUID;
  templateName: string;
  description?: string;
  category: NotificationCategory;
  subject?: string;
  content: string;
  contentFormat?: 'PLAIN_TEXT' | 'MARKDOWN' | 'HTML';
  variables: TemplateVariable[];
  channelVersions?: Partial<Record<ChannelType, TemplateChannelVersion>>;
  tags?: string[];
  language?: string;
}

/**
 * Input for updating preferences
 */
export interface UpdatePreferencesInput {
  userId: UUID;
  preferredChannel?: ChannelType;
  enabledChannels?: ChannelType[];
  emailAddress?: string;
  phoneNumber?: string;
  categoryPreferences?: CategoryPreference[];
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTimezone?: string;
  doNotDisturbEnabled?: boolean;
  doNotDisturbUntil?: Timestamp;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
  emailOptIn?: boolean;
  pushOptIn?: boolean;
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Message thread with latest messages
 */
export interface ThreadWithMessages extends MessageThread {
  latestMessages: Message[];
  unreadCount: number;
}

/**
 * User inbox summary
 */
export interface InboxSummary {
  userId: UUID;
  totalThreads: number;
  unreadThreads: number;
  unreadMessages: number;
  unreadNotifications: number;
  recentThreads: ThreadWithMessages[];
  recentNotifications: Notification[];
}

/**
 * Broadcast statistics
 */
export interface BroadcastStats extends BroadcastMessage {
  deliveryRate: number; // Percentage
  readRate: number; // Percentage
  failureRate: number; // Percentage
  averageReadTime?: number; // Seconds
  clickThroughRate?: number; // Percentage
}

/**
 * Communication analytics
 */
export interface CommunicationAnalytics {
  organizationId: UUID;
  periodStart: Timestamp;
  periodEnd: Timestamp;

  // Volume metrics
  totalMessages: number;
  totalNotifications: number;
  totalBroadcasts: number;

  // Channel breakdown
  byChannel: Record<ChannelType, ChannelMetrics>;

  // Category breakdown
  byCategory: Record<NotificationCategory, number>;

  // Engagement
  averageReadTime: number;
  readRate: number;
  responseRate: number;

  // Trends
  dailyVolume: DailyVolume[];
}

/**
 * Channel-specific metrics
 */
export interface ChannelMetrics {
  channel: ChannelType;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  deliveryRate: number;
  averageDeliveryTime: number; // Milliseconds
}

/**
 * Daily volume tracking
 */
export interface DailyVolume {
  date: string; // YYYY-MM-DD
  messages: number;
  notifications: number;
  broadcasts: number;
}
