/**
 * Family Message Service - business logic for family-staff messaging
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FamilyMessage,
  CreateFamilyMessageInput,
  UpdateFamilyMessageInput,
  FamilyMessageFilters,
  Conversation,
} from '../types/index.js';
import { FamilyMessageRepository } from '../repository/index.js';
import { Database, PaginatedResult } from '@care-commons/core';

export class FamilyMessageService {
  private repository: FamilyMessageRepository;

  constructor(database: Database) {
    this.repository = new FamilyMessageRepository(database);
  }

  /**
   * Send a message
   */
  async sendMessage(input: CreateFamilyMessageInput): Promise<FamilyMessage> {
    const message: FamilyMessage = {
      id: uuidv4(),
      conversation_id: input.conversation_id,
      client_id: input.client_id,
      organization_id: input.organization_id,

      sender_id: input.sender_id,
      sender_type: input.sender_type,
      sender_name: input.sender_name,

      recipient_id: input.recipient_id,
      recipient_type: input.recipient_type,

      message_body: input.message_body,
      message_type: input.message_type ?? 'TEXT',
      attachments: input.attachments,
      attachment_count: input.attachments?.length ?? 0,

      status: 'SENT',
      sent_at: new Date(),
      is_read: false,

      parent_message_id: input.parent_message_id,
      thread_depth: await this.calculateThreadDepth(input.parent_message_id),

      is_urgent: input.is_urgent ?? false,
      is_flagged: false,
      is_archived: false,
      category: input.category,
      tags: input.tags,

      is_deleted: false,

      created_at: new Date(),
      created_by: input.created_by,
      updated_at: new Date(),
      updated_by: input.created_by,
      version: 1,
    };

    const created = await this.repository.create(message);

    // In production, this would trigger a notification to the recipient
    // await this.notifyRecipient(created);

    return created;
  }

  /**
   * Calculate thread depth for nested replies
   */
  private async calculateThreadDepth(parentMessageId?: string): Promise<number> {
    if (!parentMessageId) {
      return 0;
    }

    const parent = await this.repository.findById(parentMessageId);
    if (!parent) {
      return 0;
    }

    return parent.thread_depth + 1;
  }

  /**
   * Reply to a message
   */
  async replyToMessage(
    parentMessageId: string,
    senderInput: {
      sender_id: string;
      sender_type: CreateFamilyMessageInput['sender_type'];
      sender_name: string;
    },
    messageBody: string,
    createdBy: string
  ): Promise<FamilyMessage> {
    const parentMessage = await this.repository.findById(parentMessageId);
    if (!parentMessage) {
      throw new Error(`Parent message with ID ${parentMessageId} not found`);
    }

    return await this.sendMessage({
      conversation_id: parentMessage.conversation_id,
      client_id: parentMessage.client_id,
      organization_id: parentMessage.organization_id,
      sender_id: senderInput.sender_id,
      sender_type: senderInput.sender_type,
      sender_name: senderInput.sender_name,
      message_body: messageBody,
      parent_message_id: parentMessageId,
      created_by: createdBy,
    });
  }

  /**
   * Start a new conversation
   */
  async startConversation(
    clientId: string,
    organizationId: string,
    senderInput: {
      sender_id: string;
      sender_type: CreateFamilyMessageInput['sender_type'];
      sender_name: string;
    },
    recipientInput: {
      recipient_id?: string;
      recipient_type?: CreateFamilyMessageInput['recipient_type'];
    },
    messageBody: string,
    createdBy: string,
    options?: {
      category?: CreateFamilyMessageInput['category'];
      is_urgent?: boolean;
    }
  ): Promise<FamilyMessage> {
    const conversationId = uuidv4();

    return await this.sendMessage({
      conversation_id: conversationId,
      client_id: clientId,
      organization_id: organizationId,
      sender_id: senderInput.sender_id,
      sender_type: senderInput.sender_type,
      sender_name: senderInput.sender_name,
      recipient_id: recipientInput.recipient_id,
      recipient_type: recipientInput.recipient_type,
      message_body: messageBody,
      category: options?.category,
      is_urgent: options?.is_urgent,
      created_by: createdBy,
    });
  }

  /**
   * Get message by ID
   */
  async getMessageById(id: string): Promise<FamilyMessage | null> {
    return await this.repository.findById(id);
  }

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(
    conversationId: string,
    includeDeleted = false
  ): Promise<FamilyMessage[]> {
    return await this.repository.findByConversationId(conversationId, includeDeleted);
  }

  /**
   * Get all conversations for a client
   */
  async getClientConversations(clientId: string): Promise<Conversation[]> {
    return await this.repository.getConversations(clientId);
  }

  /**
   * Get unread messages for a recipient
   */
  async getUnreadMessages(
    recipientId: string,
    recipientType: 'FAMILY' | 'STAFF'
  ): Promise<FamilyMessage[]> {
    return await this.repository.findUnreadForRecipient(recipientId, recipientType);
  }

  /**
   * Get urgent messages for an organization
   */
  async getUrgentMessages(organizationId: string): Promise<FamilyMessage[]> {
    return await this.repository.findUrgent(organizationId);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    await this.repository.markAsRead(messageId, userId);
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    await this.repository.markConversationAsRead(conversationId, userId);
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string, reason?: string): Promise<void> {
    const message = await this.repository.findById(messageId);
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }

    if (message.is_deleted) {
      throw new Error(`Message with ID ${messageId} is already deleted`);
    }

    await this.repository.softDelete(messageId, userId, reason);
  }

  /**
   * Flag a message for review
   */
  async flagMessage(messageId: string, userId: string): Promise<FamilyMessage> {
    const message = await this.repository.findById(messageId);
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }

    return await this.repository.update(messageId, {
      is_flagged: true,
      updated_by: userId,
    });
  }

  /**
   * Archive a message
   */
  async archiveMessage(messageId: string, userId: string): Promise<FamilyMessage> {
    const message = await this.repository.findById(messageId);
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }

    return await this.repository.update(messageId, {
      is_archived: true,
      updated_by: userId,
    });
  }

  /**
   * Search messages with filters
   */
  async searchMessages(
    filters: FamilyMessageFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<FamilyMessage>> {
    return await this.repository.search(filters, page, pageSize);
  }

  /**
   * Get message statistics for a client
   */
  async getStatsForClient(clientId: string): Promise<{
    total_messages: number;
    total_conversations: number;
    unread_messages: number;
    urgent_messages: number;
    messages_today: number;
  }> {
    return await this.repository.getStatsForClient(clientId);
  }
}
