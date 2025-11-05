/**
 * Message and Thread domain models
 *
 * Secure messaging between caregivers, staff, and family members:
 * - Thread management (direct, group, family, care team)
 * - Message delivery and read tracking
 * - Attachment support
 * - Reply threading
 * - Urgency and acknowledgment
 */

import {
  Entity,
  UUID,
} from '@care-commons/core';

/**
 * Thread types
 */
export type ThreadType = 'DIRECT' | 'GROUP' | 'FAMILY' | 'CARE_TEAM';

/**
 * Thread status
 */
export type ThreadStatus = 'ACTIVE' | 'ARCHIVED' | 'LOCKED';

/**
 * Message type
 */
export type MessageType = 'TEXT' | 'SYSTEM' | 'NOTIFICATION' | 'ALERT';

/**
 * Message status
 */
export type MessageStatus = 'SENT' | 'EDITED' | 'DELETED';

/**
 * Message attachment metadata
 */
export interface MessageAttachment {
  id: UUID;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: UUID;
}

/**
 * Message read receipt
 */
export interface MessageReadReceipt {
  userId: UUID;
  readAt: Date;
}

/**
 * Message thread entity
 */
export interface MessageThread extends Entity {
  organizationId: UUID;

  // Thread metadata
  subject?: string;
  threadType: ThreadType;
  careRecipientId?: UUID; // Optional: link to specific care recipient

  // Participants (array of user IDs)
  participants: UUID[];
  participantCount: number;

  // Thread status
  status: ThreadStatus;
  lastMessageAt?: Date;
  lastMessageBy?: UUID;
  lastMessagePreview?: string;

  // Archive/mute
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: UUID;
}

/**
 * Message entity
 */
export interface Message extends Entity {
  threadId: UUID;
  organizationId: UUID;

  // Message content
  senderId: UUID;
  body: string;
  attachments: MessageAttachment[];
  messageType: MessageType;

  // Reply tracking
  replyToId?: UUID; // For threaded replies
  replyCount: number;

  // Status
  status: MessageStatus;
  editedAt?: Date;
  deletedAt?: Date;
  deletedBy?: UUID;

  // Delivery tracking
  readBy: Record<UUID, Date>; // Map of userId -> timestamp
  readCount: number;

  // Priority/urgency
  isUrgent: boolean;
  requiresAcknowledgment: boolean;
}

/**
 * Thread creation request
 */
export interface CreateThreadRequest {
  organizationId: UUID;
  subject?: string;
  threadType: ThreadType;
  careRecipientId?: UUID;
  participants: UUID[];
  initialMessage?: string;
}

/**
 * Message creation request
 */
export interface CreateMessageRequest {
  threadId: UUID;
  body: string;
  attachments?: MessageAttachment[];
  messageType?: MessageType;
  replyToId?: UUID;
  isUrgent?: boolean;
  requiresAcknowledgment?: boolean;
}

/**
 * Thread filter options
 */
export interface ThreadFilterOptions {
  organizationId: UUID;
  userId?: UUID; // Filter by participant
  careRecipientId?: UUID;
  threadType?: ThreadType;
  status?: ThreadStatus;
  isArchived?: boolean;
  search?: string; // Search in subject and messages
  limit?: number;
  offset?: number;
}

/**
 * Message filter options
 */
export interface MessageFilterOptions {
  threadId: UUID;
  senderId?: UUID;
  messageType?: MessageType;
  isUrgent?: boolean;
  unreadOnly?: boolean;
  beforeDate?: Date;
  afterDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Thread with unread count
 */
export interface ThreadWithUnreadCount extends MessageThread {
  unreadCount: number;
}

/**
 * Message with sender details
 */
export interface MessageWithSender extends Message {
  senderName: string;
  senderRole?: string;
  replyToMessage?: {
    id: UUID;
    body: string;
    senderName: string;
  };
}

/**
 * Thread summary for list views
 */
export interface ThreadSummary {
  id: UUID;
  subject?: string;
  threadType: ThreadType;
  participants: Array<{
    userId: UUID;
    name: string;
    role?: string;
  }>;
  lastMessage?: {
    body: string;
    sentAt: Date;
    senderName: string;
    isRead: boolean;
  };
  unreadCount: number;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  threadId: UUID;
  userId: UUID;
  userName: string;
  startedAt: Date;
}
