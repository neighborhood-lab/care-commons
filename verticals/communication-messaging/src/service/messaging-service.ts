/**
 * Messaging service - business logic for messages and threads
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
import type {
  Message,
  MessageThread,
  CreateThreadInput,
  SendMessageInput,
  ThreadWithMessages,
  InboxSummary,
  ParticipantType,
} from '../types/communication.js';
import { MessageThreadRepository, MessageRepository } from '../repository/message-repository.js';

export class MessagingService {
  private threadRepository: MessageThreadRepository;
  private messageRepository: MessageRepository;
  private permissionService = getPermissionService();

  constructor(
    threadRepository: MessageThreadRepository,
    messageRepository: MessageRepository
  ) {
    this.threadRepository = threadRepository;
    this.messageRepository = messageRepository;
  }

  /**
   * Create a new message thread
   */
  async createThread(
    input: CreateThreadInput,
    context: UserContext
  ): Promise<MessageThread> {
    this.permissionService.requirePermission(context, 'messaging:create');

    // Validate participants
    if (!input.participantIds || input.participantIds.length === 0) {
      throw new ValidationError('Thread must have at least one participant');
    }

    // Build thread entity
    const thread: Partial<MessageThread> = {
      organizationId: input.organizationId,
      branchId: input.branchId,
      threadType: input.threadType,
      subject: input.subject,
      description: input.description,
      participantIds: input.participantIds,
      participants: input.participantIds.map((id) => ({
        userId: id,
        participantType: this.determineParticipantType(id, context),
        displayName: '', // Would be populated from user service
        joinedAt: new Date(),
        isActive: true,
        canSend: true,
        canAddParticipants: false,
        canRemoveParticipants: false,
        isAdmin: id === context.userId,
        unreadCount: 0,
        notificationsEnabled: true,
        mentionNotificationsOnly: false,
      })),
      ownerId: context.userId,
      status: 'ACTIVE',
      isLocked: false,
      messageCount: 0,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      tags: input.tags || [],
      category: input.category,
      allowAttachments: true,
    };

    const created = await this.threadRepository.create(thread, context);
    return created;
  }

  /**
   * Send a message in a thread
   */
  async sendMessage(
    input: SendMessageInput,
    context: UserContext
  ): Promise<Message> {
    this.permissionService.requirePermission(context, 'messaging:send');

    // Verify thread exists and user is a participant
    const thread = await this.threadRepository.findById(input.threadId);
    if (!thread) {
      throw new NotFoundError(`Thread not found: ${input.threadId}`);
    }

    if (thread.isLocked) {
      throw new ValidationError('Thread is locked and cannot receive new messages');
    }

    if (!thread.participantIds.includes(input.senderId)) {
      throw new PermissionError('User is not a participant in this thread');
    }

    // Build message entity
    const message: Partial<Message> = {
      threadId: input.threadId,
      organizationId: thread.organizationId,
      senderId: input.senderId,
      senderType: this.determineParticipantType(input.senderId, context),
      senderName: '', // Would be populated from user service
      content: input.content,
      contentFormat: input.contentFormat || 'PLAIN_TEXT',
      truncatedContent: this.truncateContent(input.content, 100),
      attachments: input.attachments || [],
      messageType: thread.threadType,
      priority: input.priority || 'NORMAL',
      status: input.scheduledSendAt ? 'QUEUED' : 'SENT',
      sentAt: input.scheduledSendAt ? undefined : new Date(),
      readBy: [],
      readCount: 0,
      replyToMessageId: input.replyToMessageId,
      channels: input.channels || ['IN_APP'],
      primaryChannel: 'IN_APP',
      isEdited: false,
      isInternal: input.isInternal || false,
      isFlagged: false,
      mentionedUserIds: input.mentionedUserIds || [],
      reactions: [],
      scheduledSendAt: input.scheduledSendAt,
      metadata: {},
    };

    const created = await this.messageRepository.create(message, context);

    // Update thread metadata
    if (!input.scheduledSendAt) {
      await this.threadRepository.updateMessageMetadata(
        input.threadId,
        new Date(),
        this.truncateContent(input.content, 50),
        true
      );
    }

    return created;
  }

  /**
   * Get thread with latest messages
   */
  async getThreadWithMessages(
    threadId: string,
    context: UserContext,
    messageLimit: number = 50
  ): Promise<ThreadWithMessages> {
    this.permissionService.requirePermission(context, 'messaging:read');

    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(`Thread not found: ${threadId}`);
    }

    // Check if user is a participant
    if (!thread.participantIds.includes(context.userId)) {
      throw new PermissionError('User is not a participant in this thread');
    }

    const messages = await this.messageRepository.findByThread(threadId, {
      page: 1,
      limit: messageLimit,
    });

    const messagesArray = Array.isArray(messages) ? messages : messages.items;

    // Calculate unread count for this user
    const unreadCount = messagesArray.filter(
      (msg) => !msg.readBy.some((receipt) => receipt.userId === context.userId)
    ).length;

    return {
      ...thread,
      latestMessages: messagesArray,
      unreadCount,
    };
  }

  /**
   * Get user inbox summary
   */
  async getInboxSummary(userId: string, context: UserContext): Promise<InboxSummary> {
    this.permissionService.requirePermission(context, 'messaging:read');

    if (userId !== context.userId && !context.roles.includes('ADMIN')) {
      throw new PermissionError('Cannot access another user\'s inbox');
    }

    const threads = await this.threadRepository.findByUserId(userId, 'ACTIVE');
    const recentThreads: ThreadWithMessages[] = [];

    let totalUnreadMessages = 0;

    for (const thread of threads.slice(0, 10)) {
      const messages = await this.messageRepository.findByThread(thread.id);
      const messagesArray = Array.isArray(messages) ? messages : messages.items;
      const unreadCount = messagesArray.filter(
        (msg) => !msg.readBy.some((receipt) => receipt.userId === userId)
      ).length;

      totalUnreadMessages += unreadCount;

      recentThreads.push({
        ...thread,
        latestMessages: messagesArray.slice(-5), // Last 5 messages
        unreadCount,
      });
    }

    const unreadThreads = threads.filter((t) =>
      t.lastMessageAt && t.participantIds.includes(userId)
    ).length;

    return {
      userId,
      totalThreads: threads.length,
      unreadThreads,
      unreadMessages: totalUnreadMessages,
      unreadNotifications: 0, // Would be calculated from notification repository
      recentThreads,
      recentNotifications: [], // Would be populated from notification repository
    };
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(
    messageId: string,
    userId: string,
    userName: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messaging:read');

    await this.messageRepository.markAsRead(messageId, userId, userName);
  }

  /**
   * Mark all messages in thread as read
   */
  async markThreadAsRead(
    threadId: string,
    userId: string,
    userName: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messaging:read');

    const messages = await this.messageRepository.findByThread(threadId);
    const messagesArray = Array.isArray(messages) ? messages : messages.items;

    for (const message of messagesArray) {
      if (!message.readBy.some((receipt) => receipt.userId === userId)) {
        await this.messageRepository.markAsRead(message.id, userId, userName);
      }
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    messageId: string,
    userId: string,
    userName: string,
    emoji: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messaging:react');

    await this.messageRepository.addReaction(messageId, userId, userName, emoji);
  }

  /**
   * Lock thread (prevent new messages)
   */
  async lockThread(
    threadId: string,
    reason: string,
    context: UserContext
  ): Promise<void> {
    this.permissionService.requirePermission(context, 'messaging:manage');

    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(`Thread not found: ${threadId}`);
    }

    await this.threadRepository.update(
      threadId,
      {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: context.userId,
        lockedReason: reason,
      },
      context
    );
  }

  /**
   * Archive thread
   */
  async archiveThread(threadId: string, context: UserContext): Promise<void> {
    this.permissionService.requirePermission(context, 'messaging:manage');

    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(`Thread not found: ${threadId}`);
    }

    await this.threadRepository.update(
      threadId,
      { status: 'ARCHIVED' },
      context
    );
  }

  /**
   * Helper: Determine participant type based on user roles
   */
  private determineParticipantType(userId: string, context: UserContext): ParticipantType {
    if (context.roles.includes('CAREGIVER')) return 'CAREGIVER';
    if (context.roles.includes('CLIENT')) return 'CLIENT';
    if (context.roles.includes('FAMILY')) return 'FAMILY';
    if (context.roles.includes('COORDINATOR')) return 'COORDINATOR';
    if (context.roles.includes('ADMIN')) return 'ADMIN';
    return 'SYSTEM';
  }

  /**
   * Helper: Truncate content for preview
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}
