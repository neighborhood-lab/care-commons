/**
 * Care Team Message Types
 *
 * Types for internal communication between care coordinators,
 * caregivers, and other team members
 */

/**
 * Sender type
 */
export type SenderType =
  | 'USER'          // General user
  | 'CAREGIVER'     // Caregiver/field staff
  | 'COORDINATOR'   // Care coordinator
  | 'ADMINISTRATOR' // Admin user
  | 'SYSTEM';       // System-generated message

/**
 * Message type
 */
export type MessageType =
  | 'DIRECT'       // Direct message to specific recipients
  | 'BROADCAST'    // Broadcast to a group
  | 'ANNOUNCEMENT' // Organization-wide announcement
  | 'ALERT'        // Alert message
  | 'REMINDER';    // Reminder message

/**
 * Message category
 */
export type MessageCategory =
  | 'SCHEDULE'   // Schedule-related
  | 'CARE_PLAN'  // Care plan discussions
  | 'INCIDENT'   // Incident reports
  | 'QUESTION'   // Questions/clarifications
  | 'GENERAL'    // General communication
  | 'TRAINING'   // Training materials
  | 'POLICY';    // Policy updates

/**
 * Message priority
 */
export type MessagePriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

/**
 * Message status
 */
export type MessageStatus =
  | 'DRAFT'     // Draft message
  | 'SENT'      // Sent to recipients
  | 'DELIVERED' // Delivered to all
  | 'READ'      // Read by all
  | 'ARCHIVED'  // Archived
  | 'DELETED';  // Soft deleted

/**
 * Message recipient
 */
export interface MessageRecipient {
  userId: string;
  type: 'TO' | 'CC' | 'BCC';
  name?: string;
  role?: string;
}

/**
 * Delivery status per recipient
 */
export interface RecipientDeliveryStatus {
  userId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  deliveredAt?: Date;
  error?: string;
}

/**
 * Read status per recipient
 */
export interface RecipientReadStatus {
  userId: string;
  readAt: Date;
  acknowledgedAt?: Date;
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Care Team Message entity
 */
export interface CareTeamMessage {
  // Identity
  id: string;
  organizationId: string;
  clientId?: string;

  // Thread management
  threadId?: string;
  parentMessageId?: string;
  threadDepth: number;

  // Participants
  senderId: string;
  senderType: SenderType;
  recipients: MessageRecipient[];
  cc?: MessageRecipient[];

  // Message content
  subject?: string;
  message: string;
  messageType: MessageType;
  category?: MessageCategory;
  priority: MessagePriority;

  // Attachments
  attachments?: MessageAttachment[];
  hasAttachments: boolean;

  // Related entities
  visitId?: string;
  carePlanId?: string;
  taskId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;

  // Delivery & read status
  deliveryStatus?: RecipientDeliveryStatus[];
  readStatus?: RecipientReadStatus[];
  firstReadAt?: Date;
  allRead: boolean;

  // Flags & status
  isUrgent: boolean;
  requiresResponse: boolean;
  isPinned: boolean;
  isArchived: boolean;
  status: MessageStatus;

  // Response tracking
  hasResponses: boolean;
  responseCount: number;
  lastResponseAt?: Date;

  // Notifications sent
  emailSent: boolean;
  pushSent: boolean;
  smsSent: boolean;
  notificationsSentAt?: Date;

  // Expiration & cleanup
  expiresAt?: Date;
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  // Audit fields
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

/**
 * Create message input
 */
export interface CreateMessageInput {
  organizationId: string;
  clientId?: string;

  // Thread (for replies)
  parentMessageId?: string;

  // Participants
  senderId: string;
  senderType: SenderType;
  recipientIds: string[];
  ccIds?: string[];

  // Content
  subject?: string;
  message: string;
  messageType?: MessageType;
  category?: MessageCategory;
  priority?: MessagePriority;

  // Attachments
  attachments?: MessageAttachment[];

  // Related entities
  visitId?: string;
  carePlanId?: string;
  taskId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;

  // Flags
  isUrgent?: boolean;
  requiresResponse?: boolean;

  // Notifications
  sendEmailNotification?: boolean;
  sendPushNotification?: boolean;
  sendSmsNotification?: boolean;

  // Scheduling
  scheduledFor?: Date;
}

/**
 * Update message input
 */
export interface UpdateMessageInput {
  subject?: string;
  message?: string;
  category?: MessageCategory;
  priority?: MessagePriority;

  // Flags
  isUrgent?: boolean;
  requiresResponse?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Reply to message input
 */
export interface ReplyToMessageInput {
  parentMessageId: string;
  message: string;
  attachments?: MessageAttachment[];
  replyToAll?: boolean; // Reply to all original recipients
  additionalRecipientIds?: string[];
}

/**
 * Search criteria for messages
 */
export interface MessageSearchCriteria {
  organizationId?: string;
  clientId?: string;
  senderId?: string;
  recipientId?: string;
  messageType?: MessageType[];
  category?: MessageCategory[];
  priority?: MessagePriority[];
  status?: MessageStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  unreadOnly?: boolean;
  requiresResponseOnly?: boolean;
  isUrgent?: boolean;
  hasAttachments?: boolean;
  searchText?: string; // Search in subject and message
  threadId?: string;
}

/**
 * Message thread
 */
export interface MessageThread {
  threadId: string;
  subject?: string;
  messageCount: number;
  participantIds: string[];
  firstMessage: CareTeamMessage;
  lastMessage: CareTeamMessage;
  lastActivity: Date;
  unreadCount: number;
  hasUnread: boolean;
}

/**
 * Message with sender and recipient details
 */
export interface MessageWithDetails extends CareTeamMessage {
  sender: {
    id: string;
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  recipientDetails: Array<{
    id: string;
    name: string;
    role?: string;
    isRead: boolean;
    readAt?: Date;
  }>;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  parentMessage?: {
    id: string;
    subject?: string;
    message: string;
    senderName: string;
  };
}

/**
 * Message statistics
 */
export interface MessageStatistics {
  totalSent: number;
  totalReceived: number;
  unreadCount: number;
  requiresResponseCount: number;
  urgentCount: number;

  byCategory: Record<MessageCategory, number>;
  byPriority: Record<MessagePriority, number>;

  averageResponseTime?: number; // Minutes
  responseRate: number;         // Percentage
}

/**
 * Message notification settings
 */
export interface MessageNotificationSettings {
  userId: string;
  organizationId: string;

  // Notification preferences
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;

  // Category preferences
  notifyForUrgent: boolean;
  notifyForDirect: boolean;
  notifyForMentions: boolean;
  notifyForReplies: boolean;

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string;   // HH:MM
  timezone?: string;

  // Digest settings
  digestEnabled: boolean;
  digestFrequency?: 'HOURLY' | 'DAILY' | 'WEEKLY';
  digestTime?: string; // HH:MM for daily/weekly
}

/**
 * Bulk message input for broadcasting
 */
export interface BroadcastMessageInput {
  organizationId: string;
  clientId?: string;

  // Content
  subject: string;
  message: string;
  category?: MessageCategory;
  priority?: MessagePriority;

  // Recipients
  recipientType: 'ALL_CAREGIVERS' | 'ALL_COORDINATORS' | 'ALL_STAFF' | 'CUSTOM';
  recipientIds?: string[]; // For CUSTOM type
  excludeIds?: string[];   // Exclude specific users

  // Filters (for automatic recipient selection)
  filters?: {
    branchIds?: string[];
    roleIds?: string[];
    clientIds?: string[];
  };

  // Attachments
  attachments?: MessageAttachment[];

  // Scheduling
  scheduledFor?: Date;
  expiresAt?: Date;

  // Tracking
  requireAcknowledgment?: boolean;
}

/**
 * Message draft
 */
export interface MessageDraft {
  id: string;
  userId: string;
  organizationId: string;

  // Draft content
  recipientIds: string[];
  subject?: string;
  message: string;
  attachments?: MessageAttachment[];

  // Context
  parentMessageId?: string;
  clientId?: string;

  // Metadata
  lastEditedAt: Date;
  createdAt: Date;
}
