/**
 * Conversation and Messaging domain models
 *
 * Secure messaging between family members, coordinators, and caregivers:
 * - Conversation threads
 * - Message delivery and read receipts
 * - File attachments
 * - PHI protection and encryption
 * - Real-time messaging support
 * - HIPAA-compliant audit logging
 */

import {
  Entity,
  SoftDeletable,
  UUID,
} from '@care-commons/core';

/**
 * Conversation thread
 * Groups related messages between participants
 */
export interface Conversation extends Entity, SoftDeletable {
  id: UUID;

  // Context
  clientId: UUID; // All conversations are in context of a client
  subject?: string;
  conversationType: ConversationType;

  // Participants
  participants: ConversationParticipant[];

  // Status
  status: ConversationStatus;

  // Latest Message
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  lastMessageSenderId?: UUID;

  // Metadata
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  deletedAt?: Date;

  // Settings
  isArchived: boolean;
  isPinned: boolean;
  tags?: string[];
}

export type ConversationType =
  | 'DIRECT'           // One-on-one conversation
  | 'GROUP'            // Group conversation (3+ participants)
  | 'CARE_TEAM'        // Dedicated care team channel
  | 'FAMILY_UPDATES'   // Broadcast channel for family updates
  | 'SUPPORT';         // Support/help conversation

export type ConversationStatus =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'CLOSED';

/**
 * Participant in a conversation
 */
export interface ConversationParticipant {
  userId: UUID;
  userType: ParticipantType;
  role: ParticipantRole;

  // Status
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;

  // Read Status
  lastReadAt?: Date;
  lastReadMessageId?: UUID;
  unreadCount: number;

  // Preferences
  notificationsEnabled: boolean;
  isMuted: boolean;
}

export type ParticipantType =
  | 'FAMILY_MEMBER'
  | 'CARE_COORDINATOR'
  | 'CAREGIVER'
  | 'NURSE'
  | 'ADMIN'
  | 'SYSTEM';

export type ParticipantRole =
  | 'OWNER'       // Created the conversation
  | 'MODERATOR'   // Can add/remove participants
  | 'MEMBER'      // Regular participant
  | 'OBSERVER';   // Read-only access

/**
 * Individual message within a conversation
 */
export interface Message extends Entity, SoftDeletable {
  id: UUID;

  // Conversation
  conversationId: UUID;
  clientId: UUID;

  // Sender
  senderId: UUID;
  senderType: ParticipantType;

  // Content
  content: string;
  contentType: MessageContentType;

  // Rich Content
  attachments?: MessageAttachment[];
  mentions?: MessageMention[];

  // Reply/Thread
  replyToMessageId?: UUID;
  threadId?: UUID; // For threaded conversations

  // Delivery
  sentAt: Date;
  deliveredAt?: Date;
  deliveryStatus: MessageDeliveryStatus;

  // Read Receipts
  readBy: MessageReadReceipt[];

  // Reactions
  reactions?: MessageReaction[];

  // Editing
  editedAt?: Date;
  editHistory?: MessageEdit[];

  // System Messages
  isSystemMessage: boolean;
  systemMessageType?: SystemMessageType;

  // Security
  containsPHI: boolean;
  encryptionStatus?: 'ENCRYPTED' | 'UNENCRYPTED';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type MessageContentType =
  | 'TEXT'
  | 'RICH_TEXT'     // Markdown/HTML
  | 'ATTACHMENT'
  | 'SYSTEM';

export type MessageDeliveryStatus =
  | 'PENDING'       // Not yet sent
  | 'SENT'          // Sent to server
  | 'DELIVERED'     // Delivered to recipient(s)
  | 'FAILED';       // Delivery failed

export type SystemMessageType =
  | 'PARTICIPANT_ADDED'
  | 'PARTICIPANT_REMOVED'
  | 'CONVERSATION_CREATED'
  | 'CONVERSATION_ARCHIVED'
  | 'VISIT_SCHEDULED'
  | 'VISIT_COMPLETED'
  | 'CARE_PLAN_UPDATED';

/**
 * File attachment in a message
 */
export interface MessageAttachment {
  id: UUID;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string; // S3/storage URL
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: UUID;

  // Security
  virusScanned: boolean;
  scanStatus?: 'CLEAN' | 'INFECTED' | 'PENDING';
  containsPHI: boolean;
}

/**
 * User mention in a message
 */
export interface MessageMention {
  userId: UUID;
  userType: ParticipantType;
  position: number; // Character position in message
}

/**
 * Read receipt for a message
 */
export interface MessageReadReceipt {
  userId: UUID;
  userType: ParticipantType;
  readAt: Date;
}

/**
 * Message reaction (emoji)
 */
export interface MessageReaction {
  emoji: string;
  userId: UUID;
  userType: ParticipantType;
  reactedAt: Date;
}

/**
 * Message edit history
 */
export interface MessageEdit {
  editedAt: Date;
  previousContent: string;
  editReason?: string;
}

/**
 * Typing indicator
 * Real-time indicator of who is typing
 */
export interface TypingIndicator {
  conversationId: UUID;
  userId: UUID;
  userType: ParticipantType;
  isTyping: boolean;
  startedAt?: Date;
  stoppedAt?: Date;
}

/**
 * Conversation settings
 */
export interface ConversationSettings {
  conversationId: UUID;

  // Notifications
  allowNotifications: boolean;
  notifyOnMention: boolean;
  notifyOnReply: boolean;

  // Features
  allowAttachments: boolean;
  allowReactions: boolean;
  allowThreads: boolean;

  // Moderation
  requireApproval: boolean;
  allowedParticipantTypes: ParticipantType[];

  // Retention
  autoArchiveAfterDays?: number;
  deleteMessagesAfterDays?: number;
}

/**
 * Message draft (auto-save)
 */
export interface MessageDraft {
  id: UUID;
  conversationId: UUID;
  userId: UUID;
  content: string;
  attachments?: MessageAttachment[];
  replyToMessageId?: UUID;
  savedAt: Date;
  expiresAt: Date;
}

/**
 * Search result for message search
 */
export interface MessageSearchResult {
  message: Message;
  conversation: Conversation;
  matchScore: number;
  highlights: {
    field: string;
    snippet: string;
  }[];
}

/**
 * Conversation list filter options
 */
export interface ConversationFilter {
  clientId?: UUID;
  participantId?: UUID;
  conversationType?: ConversationType;
  status?: ConversationStatus;
  unreadOnly?: boolean;
  archivedOnly?: boolean;
  pinnedOnly?: boolean;
  tags?: string[];
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Message list filter options
 */
export interface MessageFilter {
  conversationId: UUID;
  senderId?: UUID;
  senderType?: ParticipantType;
  contentType?: MessageContentType;
  containsPHI?: boolean;
  hasAttachments?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * WebSocket message types for real-time messaging
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: Date;
}

export type WebSocketMessageType =
  | 'MESSAGE_SENT'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'TYPING_STARTED'
  | 'TYPING_STOPPED'
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_LEFT'
  | 'CONVERSATION_UPDATED'
  | 'PRESENCE_UPDATE';

/**
 * User presence status
 */
export interface UserPresence {
  userId: UUID;
  userType: ParticipantType;
  status: PresenceStatus;
  lastSeenAt: Date;
  customStatus?: string;
}

export type PresenceStatus =
  | 'ONLINE'
  | 'AWAY'
  | 'BUSY'
  | 'OFFLINE';
