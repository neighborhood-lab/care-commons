/**
 * Message service - business logic layer for messaging
 */

import { v4 as uuidv4 } from 'uuid';
import {
  UserContext,
  ValidationError,
  PermissionError,
  NotFoundError,
  PaginatedResult,
} from '@care-commons/core';
import { getPermissionService } from '@care-commons/core';
import {
  Message,
  MessageThread,
  CreateThreadRequest,
  CreateMessageRequest,
  ThreadFilterOptions,
  MessageFilterOptions,
  MessageWithSender,
  ThreadSummary,
} from '../types/message.js';
import {
  MessageRepository,
  MessageThreadRepository,
} from '../repository/message-repository.js';

export class MessageService {
  private messageRepository: MessageRepository;
  private threadRepository: MessageThreadRepository;
  private permissionService = getPermissionService();

  constructor(
    messageRepository: MessageRepository,
    threadRepository: MessageThreadRepository
  ) {
    this.messageRepository = messageRepository;
    this.threadRepository = threadRepository;
  }

  /**
   * Create a new message thread
   */
  async createThread(
    request: CreateThreadRequest,
    context: UserContext
  ): Promise<MessageThread> {
    // Check permissions
    this.permissionService.requirePermission(context, 'messages:create');

    // Validate participants
    if (!request.participants || request.participants.length === 0) {
      throw new ValidationError('Thread must have at least one participant');
    }

    // Ensure creator is in participants
    if (!request.participants.includes(context.userId)) {
      request.participants.push(context.userId);
    }

    // Build thread entity
    const thread: Partial<MessageThread> = {
      organizationId: request.organizationId,
      subject: request.subject,
      threadType: request.threadType,
      careRecipientId: request.careRecipientId,
      participants: request.participants,
      participantCount: request.participants.length,
      status: 'ACTIVE',
      isArchived: false,
    };

    // Create thread
    const created = await this.threadRepository.create(thread, context);

    // Send initial message if provided
    if (request.initialMessage) {
      await this.sendMessage(
        {
          threadId: created.id,
          body: request.initialMessage,
          messageType: 'TEXT',
        },
        context
      );
    }

    return created;
  }

  /**
   * Get thread by ID
   */
  async getThreadById(
    threadId: string,
    context: UserContext
  ): Promise<MessageThread> {
    this.permissionService.requirePermission(context, 'messages:read');

    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(`Thread not found: ${threadId}`);
    }

    // Check user is participant
    this.checkThreadAccess(thread, context);

    return thread;
  }

  /**
   * Get threads by filters
   */
  async getThreads(
    filters: ThreadFilterOptions,
    context: UserContext
  ): Promise<PaginatedResult<MessageThread>> {
    this.permissionService.requirePermission(context, 'messages:read');

    // Enforce organization scope
    filters.organizationId = context.organizationId;

    // For non-admin users, filter by their participation
    if (!this.permissionService.hasPermission(context, 'messages:admin')) {
      filters.userId = context.userId;
    }

    return this.threadRepository.findByFilters(filters);
  }

  /**
   * Get threads with unread counts
   */
  async getThreadsWithUnreadCounts(
    organizationId: string,
    context: UserContext,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<MessageThread & { unreadCount: number }>> {
    this.permissionService.requirePermission(context, 'messages:read');

    return this.threadRepository.findThreadsWithUnreadCounts(
      organizationId,
      context.userId,
      options
    );
  }

  /**
   * Send a message in a thread
   */
  async sendMessage(
    request: CreateMessageRequest,
    context: UserContext
  ): Promise<Message> {
    this.permissionService.requirePermission(context, 'messages:create');

    // Verify thread exists and user has access
    const thread = await this.getThreadById(request.threadId, context);

    // Validate message
    if (!request.body || request.body.trim().length === 0) {
      throw new ValidationError('Message body cannot be empty');
    }

    // Build message entity
    const message: Partial<Message> = {
      threadId: request.threadId,
      organizationId: thread.organizationId,
      senderId: context.userId,
      body: request.body.trim(),
      attachments: request.attachments || [],
      messageType: request.messageType || 'TEXT',
      replyToId: request.replyToId,
      replyCount: 0,
      status: 'SENT',
      readBy: {},
      readCount: 0,
      isUrgent: request.isUrgent || false,
      requiresAcknowledgment: request.requiresAcknowledgment || false,
    };

    // Create message
    const created = await this.messageRepository.create(message, context);

    // Update reply count if this is a reply
    if (request.replyToId) {
      await this.incrementReplyCount(request.replyToId);
    }

    // Thread's last_message_at is automatically updated by database trigger

    return created;
  }

  /**
   * Get messages in a thread
   */
  async getMessages(
    filters: MessageFilterOptions,
    context: UserContext
  ): Promise<PaginatedResult<Message>> {
    this.permissionService.requirePermission(context, 'messages:read');

    // Verify thread access
    await this.getThreadById(filters.threadId, context);

    return this.messageRepository.findByFilters(filters);
  }

  /**
   * Get messages with sender details
   */
  async getMessagesWithSenderDetails(
    filters: MessageFilterOptions,
    context: UserContext
  ): Promise<PaginatedResult<MessageWithSender>> {
    this.permissionService.requirePermission(context, 'messages:read');

    // Verify thread access
    await this.getThreadById(filters.threadId, context);

    return this.messageRepository.findWithSenderDetails(filters);
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(
    messageId: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messages:read');

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError(`Message not found: ${messageId}`);
    }

    // Verify thread access
    await this.getThreadById(message.threadId, context);

    // Don't mark own messages as read
    if (message.senderId === context.userId) {
      return;
    }

    // Mark as read
    await this.messageRepository.markAsRead(messageId, context.userId);
  }

  /**
   * Mark all messages in thread as read
   */
  async markThreadAsRead(
    threadId: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messages:read');

    // Verify thread access
    await this.getThreadById(threadId, context);

    await this.messageRepository.markThreadAsRead(threadId, context.userId);
  }

  /**
   * Edit message
   */
  async editMessage(
    messageId: string,
    newBody: string,
    context: UserContext
  ): Promise<Message> {
    this.permissionService.requirePermission(context, 'messages:update');

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError(`Message not found: ${messageId}`);
    }

    // Only sender can edit
    if (message.senderId !== context.userId) {
      throw new PermissionError('Only the message sender can edit the message');
    }

    // Cannot edit deleted messages
    if (message.deletedAt) {
      throw new ValidationError('Cannot edit deleted message');
    }

    // Validate new body
    if (!newBody || newBody.trim().length === 0) {
      throw new ValidationError('Message body cannot be empty');
    }

    // Update message
    const updated = await this.messageRepository.update(
      messageId,
      {
        body: newBody.trim(),
        status: 'EDITED',
        editedAt: new Date(),
      },
      context
    );

    return updated;
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messages:delete');

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError(`Message not found: ${messageId}`);
    }

    // Only sender or admin can delete
    const canDelete =
      message.senderId === context.userId ||
      this.permissionService.hasPermission(context, 'messages:admin');

    if (!canDelete) {
      throw new PermissionError(
        'Only the message sender or admin can delete the message'
      );
    }

    // Soft delete
    await this.messageRepository.softDelete(messageId, context.userId);
  }

  /**
   * Archive thread
   */
  async archiveThread(
    threadId: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messages:update');

    const thread = await this.getThreadById(threadId, context);

    await this.threadRepository.update(
      threadId,
      {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: context.userId,
      },
      context
    );
  }

  /**
   * Unarchive thread
   */
  async unarchiveThread(
    threadId: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messages:update');

    const thread = await this.getThreadById(threadId, context);

    await this.threadRepository.update(
      threadId,
      {
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
      },
      context
    );
  }

  /**
   * Add participant to thread
   */
  async addParticipant(
    threadId: string,
    userId: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messages:update');

    const thread = await this.getThreadById(threadId, context);

    // Check if user is already a participant
    if (thread.participants.includes(userId)) {
      throw new ValidationError('User is already a participant');
    }

    await this.threadRepository.addParticipant(threadId, userId);

    // Send system message
    await this.sendMessage(
      {
        threadId,
        body: `User ${userId} was added to the conversation`,
        messageType: 'SYSTEM',
      },
      context
    );
  }

  /**
   * Remove participant from thread
   */
  async removeParticipant(
    threadId: string,
    userId: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messages:update');

    const thread = await this.getThreadById(threadId, context);

    // Check if user is a participant
    if (!thread.participants.includes(userId)) {
      throw new ValidationError('User is not a participant');
    }

    // Cannot remove last participant
    if (thread.participants.length === 1) {
      throw new ValidationError('Cannot remove the last participant');
    }

    await this.threadRepository.removeParticipant(threadId, userId);

    // Send system message
    await this.sendMessage(
      {
        threadId,
        body: `User ${userId} left the conversation`,
        messageType: 'SYSTEM',
      },
      context
    );
  }

  /**
   * Check if user has access to thread
   */
  private checkThreadAccess(
    thread: MessageThread,
    context: UserContext
  ): void {
    // Admin can access all threads
    if (this.permissionService.hasPermission(context, 'messages:admin')) {
      return;
    }

    // User must be a participant
    if (!thread.participants.includes(context.userId)) {
      throw new PermissionError('Access denied to this thread');
    }

    // Check organization scope
    if (thread.organizationId !== context.organizationId) {
      throw new PermissionError('Access denied to this thread');
    }
  }

  /**
   * Increment reply count for a message
   */
  private async incrementReplyCount(messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId);
    if (message) {
      await this.messageRepository.update(
        messageId,
        {
          replyCount: message.replyCount + 1,
        },
        { userId: 'system', organizationId: message.organizationId } as UserContext
      );
    }
  }
}
