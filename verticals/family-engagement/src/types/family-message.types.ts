/**
 * Family Message Types
 *
 * Type definitions for two-way messaging between family and care team
 */

export type MessageSenderType = 'FAMILY' | 'STAFF';

export type MessageRecipientType = 'FAMILY' | 'STAFF' | 'CARE_TEAM';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO';

export type MessageStatus = 'DRAFT' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type MessageCategory = 'GENERAL' | 'CARE_QUESTION' | 'SCHEDULING' | 'BILLING' | 'EMERGENCY';

export interface MessageAttachment {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  url: string;
  thumbnail_url?: string;
}

export interface FamilyMessage {
  id: string;
  conversation_id: string;
  client_id: string;
  organization_id: string;

  // Sender & recipient
  sender_id: string;
  sender_type: MessageSenderType;
  sender_name: string;

  recipient_id?: string;
  recipient_type?: MessageRecipientType;

  // Message content
  message_body: string;
  message_type: MessageType;
  attachments?: MessageAttachment[];
  attachment_count: number;

  // Status
  status: MessageStatus;
  sent_at: Date;
  delivered_at?: Date;
  read_at?: Date;
  is_read: boolean;

  // Threading
  parent_message_id?: string;
  thread_depth: number;

  // Flags & categories
  is_urgent: boolean;
  is_flagged: boolean;
  is_archived: boolean;
  category?: MessageCategory;
  tags?: string[];

  // Moderation
  is_deleted: boolean;
  deleted_at?: Date;
  deleted_by?: string;
  deletion_reason?: string;

  // Standard fields
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  version: number;
}

export interface CreateFamilyMessageInput {
  conversation_id: string;
  client_id: string;
  organization_id: string;

  sender_id: string;
  sender_type: MessageSenderType;
  sender_name: string;

  recipient_id?: string;
  recipient_type?: MessageRecipientType;

  message_body: string;
  message_type?: MessageType;
  attachments?: MessageAttachment[];

  parent_message_id?: string;

  is_urgent?: boolean;
  category?: MessageCategory;
  tags?: string[];

  created_by: string;
}

export interface UpdateFamilyMessageInput {
  status?: MessageStatus;
  delivered_at?: Date;
  read_at?: Date;
  is_read?: boolean;
  is_flagged?: boolean;
  is_archived?: boolean;
  is_deleted?: boolean;
  deleted_by?: string;
  deletion_reason?: string;
  updated_by: string;
}

export interface FamilyMessageFilters {
  conversation_id?: string;
  client_id?: string;
  organization_id?: string;
  sender_id?: string;
  sender_type?: MessageSenderType;
  recipient_id?: string;
  is_read?: boolean;
  is_urgent?: boolean;
  is_deleted?: boolean;
  category?: MessageCategory;
  date_from?: Date;
  date_to?: Date;
}

export interface Conversation {
  conversation_id: string;
  client_id: string;
  client_name: string;
  last_message: FamilyMessage;
  unread_count: number;
  participant_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  type: MessageSenderType;
  last_read_at?: Date;
}
