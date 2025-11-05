/**
 * Messaging domain model
 *
 * Secure communication between families and care staff,
 * including threads, messages, read receipts, and attachments.
 */

import { Entity, UUID } from '@care-commons/core';

/**
 * Message thread entity
 */
export interface MessageThread extends Entity {
  id: UUID;
  organizationId: UUID;
  clientId: UUID;

  // Thread details
  subject?: string;
  threadType: ThreadType;
  priority: Priority;
  category?: string;

  // Status and lifecycle
  status: ThreadStatus;
  lastMessageAt: Date;
  lastMessageBy?: UUID; // Staff user
  lastMessageByFamily?: UUID; // Family member
  messageCount: number;

  // Assignment
  assignedToUser?: UUID;
  assignedToBranch?: UUID;
  assignedAt?: Date;

  // SLA tracking
  firstResponseAt?: Date;
  resolvedAt?: Date;
  responseTimeMinutes?: number;
  resolutionNotes?: string;

  // Moderation
  requiresModeration: boolean;
  isFlagged: boolean;
  flagReason?: string;
  flaggedBy?: UUID;
  flaggedAt?: Date;

  // Metadata
  tags?: string[];
  customFields?: Record<string, unknown>;

  // Audit fields
  createdAt: Date;
  createdBy?: UUID; // Can be null if initiated by family
  createdByFamily?: UUID;
  updatedAt: Date;
  archivedAt?: Date;
  archivedBy?: UUID;
}

/**
 * Thread types
 */
export type ThreadType =
  | 'GENERAL' // General conversation
  | 'CARE_QUESTION' // Question about care
  | 'SCHEDULE_REQUEST' // Schedule change request
  | 'BILLING_INQUIRY' // Billing question
  | 'CONCERN' // Concern or complaint
  | 'INCIDENT_FOLLOWUP' // Follow-up on an incident
  | 'MEDICATION_QUESTION' // Medication-related
  | 'EQUIPMENT_REQUEST' // Equipment or supplies
  | 'FEEDBACK'; // Positive feedback

/**
 * Thread status
 */
export type ThreadStatus =
  | 'OPEN' // Active conversation
  | 'WAITING_FAMILY' // Waiting for family response
  | 'WAITING_STAFF' // Waiting for staff response
  | 'RESOLVED' // Issue resolved
  | 'CLOSED' // Conversation closed
  | 'ARCHIVED'; // Archived for records

/**
 * Priority levels
 */
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Message entity
 */
export interface Message extends Entity {
  id: UUID;
  organizationId: UUID;
  threadId: UUID;

  // Sender
  senderUserId?: UUID; // Staff sender
  senderFamilyMemberId?: UUID; // Family sender
  senderName: string; // Cached for display
  senderType: SenderType;

  // Message content
  body: string;
  messageType: MessageType;
  isDraft: boolean;

  // Formatting
  contentFormat: ContentFormat;
  mentions?: UUID[]; // @mentioned user/family member IDs
  metadata?: Record<string, unknown>;

  // Status
  isRead: boolean; // Deprecated - use read receipts
  requiresResponse: boolean;
  inReplyTo?: UUID; // For threading within conversation

  // Moderation
  isHidden: boolean;
  isEdited: boolean;
  editedAt?: Date;
  editReason?: string;

  // Delivery tracking
  deliveryStatus: DeliveryStatus;
  deliveredAt?: Date;
  deliveryError?: string;

  // External notifications
  emailSent: boolean;
  emailSentAt?: Date;
  smsSent: boolean;
  smsSentAt?: Date;
  pushSent: boolean;
  pushSentAt?: Date;

  // Audit fields
  createdAt: Date;
  deletedAt?: Date;
  deletedBy?: UUID;
}

/**
 * Sender types
 */
export type SenderType = 'STAFF' | 'FAMILY' | 'SYSTEM';

/**
 * Message types
 */
export type MessageType =
  | 'TEXT' // Regular text message
  | 'AUTOMATED' // System-generated
  | 'SYSTEM' // System notification
  | 'NOTIFICATION'; // Important notification

/**
 * Content formats
 */
export type ContentFormat = 'PLAIN' | 'MARKDOWN' | 'HTML';

/**
 * Delivery status
 */
export type DeliveryStatus =
  | 'SENDING' // Currently sending
  | 'SENT' // Sent successfully
  | 'DELIVERED' // Delivered to recipient
  | 'FAILED'; // Failed to send

/**
 * Message participant entity
 */
export interface MessageParticipant extends Entity {
  id: UUID;
  threadId: UUID;

  // Participant
  userId?: UUID; // Staff participant
  familyMemberId?: UUID; // Family participant
  participantType: ParticipantType;

  // Participation details
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;

  // Notification preferences (per-thread)
  notifyNewMessages: boolean;
  notificationMethod: string;

  // Read tracking
  lastReadAt?: Date;
  lastReadMessageId?: UUID;
  unreadCount: number;
}

/**
 * Participant types
 */
export type ParticipantType = 'STAFF' | 'FAMILY';

/**
 * Participant roles
 */
export type ParticipantRole =
  | 'PARTICIPANT' // Regular participant
  | 'MODERATOR' // Can moderate messages
  | 'OBSERVER'; // Can view but not participate

/**
 * Message read receipt entity
 */
export interface MessageReadReceipt extends Entity {
  id: UUID;
  messageId: UUID;

  // Reader
  readerUserId?: UUID;
  readerFamilyMemberId?: UUID;
  readerType: 'STAFF' | 'FAMILY';

  // Read details
  readAt: Date;
  readVia?: string; // WEB, MOBILE, EMAIL, etc.
}

/**
 * Message attachment entity
 */
export interface MessageAttachment extends Entity {
  id: UUID;
  messageId: UUID;
  organizationId: UUID;

  // File details
  fileName: string;
  fileType?: string; // MIME type
  fileCategory: FileCategory;
  fileSizeBytes: number;
  storageKey: string;
  storageUrl?: string;

  // Security
  encryptionStatus: EncryptionStatus;
  virusScanned: boolean;
  scanResult?: ScanResult;

  // Metadata
  metadata?: Record<string, unknown>;
  thumbnailUrl?: string;

  // Audit fields
  createdAt: Date;
  deletedAt?: Date;
}

/**
 * File categories
 */
export type FileCategory =
  | 'IMAGE'
  | 'DOCUMENT'
  | 'VIDEO'
  | 'AUDIO'
  | 'OTHER';

/**
 * Encryption status
 */
export type EncryptionStatus = 'ENCRYPTED' | 'UNENCRYPTED';

/**
 * Virus scan results
 */
export type ScanResult = 'CLEAN' | 'INFECTED' | 'SKIPPED' | 'FAILED';

/**
 * Input for creating a new thread
 */
export interface CreateThreadInput {
  organizationId: UUID;
  clientId: UUID;
  subject?: string;
  threadType: ThreadType;
  priority?: Priority;
  category?: string;
  initialMessage: string;
  createdByFamily?: UUID; // If initiated by family member
  assignedToUser?: UUID;
  assignedToBranch?: UUID;
}

/**
 * Input for updating a thread
 */
export interface UpdateThreadInput {
  subject?: string;
  status?: ThreadStatus;
  priority?: Priority;
  category?: string;
  assignedToUser?: UUID;
  assignedToBranch?: UUID;
  resolutionNotes?: string;
  tags?: string[];
}

/**
 * Input for creating a new message
 */
export interface CreateMessageInput {
  threadId: UUID;
  body: string;
  senderUserId?: UUID; // Staff sender
  senderFamilyMemberId?: UUID; // Family sender
  contentFormat?: ContentFormat;
  mentions?: UUID[];
  requiresResponse?: boolean;
  inReplyTo?: UUID;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSizeBytes: number;
    storageKey: string;
  }>;
}

/**
 * Input for sending a message
 */
export interface SendMessageInput extends CreateMessageInput {
  notifyParticipants?: boolean;
  notificationMethods?: ('EMAIL' | 'SMS' | 'PUSH')[];
}

/**
 * Message search filters
 */
export interface MessageSearchFilters {
  organizationId: UUID;
  threadId?: UUID;
  clientId?: UUID;
  senderUserId?: UUID;
  senderFamilyMemberId?: UUID;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string; // Full-text search
  threadStatus?: ThreadStatus;
  threadType?: ThreadType;
  priority?: Priority;
  unreadOnly?: boolean;
}

/**
 * Thread with message preview
 */
export interface ThreadWithPreview extends MessageThread {
  lastMessage?: {
    id: UUID;
    body: string;
    senderName: string;
    senderType: SenderType;
    createdAt: Date;
  };
  participants: MessageParticipant[];
  unreadCount: number;
}

/**
 * Thread with full messages
 */
export interface ThreadWithMessages extends MessageThread {
  messages: Message[];
  participants: MessageParticipant[];
  attachments: MessageAttachment[];
}

/**
 * Message delivery report
 */
export interface MessageDeliveryReport {
  messageId: UUID;
  deliveryStatus: DeliveryStatus;
  emailDelivered?: boolean;
  smsDelivered?: boolean;
  pushDelivered?: boolean;
  readReceipts: MessageReadReceipt[];
  deliveryErrors?: string[];
}
