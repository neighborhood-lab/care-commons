/**
 * Communication API handlers - HTTP request handlers for messaging and notifications
 */

import type { Request, Response, NextFunction } from 'express';
import type { UserContext } from '@care-commons/core';
import { MessagingService } from '../service/messaging-service.js';
import { NotificationService } from '../service/notification-service.js';
import { CommunicationValidator } from '../validation/communication-validator.js';

/**
 * Create messaging handlers
 */
export function createMessagingHandlers(messagingService: MessagingService) {
  const validator = new CommunicationValidator();

  return {
    /**
     * POST /api/messaging/threads - Create new thread
     */
    createThread: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;

        const validation = validator.validateCreateThread(req.body);
        if (!validation.success) {
          return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors,
          });
        }

        const thread = await messagingService.createThread(validation.data!, context);

        res.status(201).json(thread);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/messaging/threads/:threadId/messages - Send message
     */
    sendMessage: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { threadId } = req.params;

        const validation = validator.validateSendMessage({
          ...req.body,
          threadId,
        });

        if (!validation.success) {
          return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors,
          });
        }

        const message = await messagingService.sendMessage(validation.data!, context);

        res.status(201).json(message);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/messaging/threads/:threadId - Get thread with messages
     */
    getThread: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { threadId } = req.params;
        const messageLimit = parseInt(req.query.limit as string) || 50;

        const thread = await messagingService.getThreadWithMessages(
          threadId,
          context,
          messageLimit
        );

        res.json(thread);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/messaging/inbox - Get user inbox
     */
    getInbox: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const userId = (req.query.userId as string) || context.userId;

        const inbox = await messagingService.getInboxSummary(userId, context);

        res.json(inbox);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/messaging/messages/:messageId/read - Mark message as read
     */
    markMessageRead: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { messageId } = req.params;

        await messagingService.markMessageAsRead(
          messageId,
          context.userId,
          'User Name', // Would be populated from context
          context
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/messaging/threads/:threadId/read - Mark thread as read
     */
    markThreadRead: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { threadId } = req.params;

        await messagingService.markThreadAsRead(
          threadId,
          context.userId,
          'User Name', // Would be populated from context
          context
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/messaging/messages/:messageId/reactions - Add reaction
     */
    addReaction: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { messageId } = req.params;
        const { emoji } = req.body;

        if (!emoji) {
          return res.status(400).json({ error: 'Emoji is required' });
        }

        await messagingService.addReaction(
          messageId,
          context.userId,
          'User Name', // Would be populated from context
          emoji,
          context
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/messaging/threads/:threadId/lock - Lock thread
     */
    lockThread: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { threadId } = req.params;
        const { reason } = req.body;

        await messagingService.lockThread(threadId, reason || 'Locked by admin', context);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/messaging/threads/:threadId/archive - Archive thread
     */
    archiveThread: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { threadId } = req.params;

        await messagingService.archiveThread(threadId, context);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}

/**
 * Create notification handlers
 */
export function createNotificationHandlers(notificationService: NotificationService) {
  const validator = new CommunicationValidator();

  return {
    /**
     * POST /api/notifications - Send notification
     */
    sendNotification: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;

        const validation = validator.validateSendNotification(req.body);
        if (!validation.success) {
          return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors,
          });
        }

        const notification = await notificationService.sendNotification(
          validation.data!,
          context
        );

        res.status(201).json(notification);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/notifications - Get notifications for user
     */
    getNotifications: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const recipientId = (req.query.recipientId as string) || context.userId;
        const unreadOnly = req.query.unreadOnly === 'true';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const notifications = await notificationService.getNotifications(
          recipientId,
          unreadOnly,
          context,
          { page, limit }
        );

        res.json(notifications);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/notifications/:notificationId/read - Mark as read
     */
    markAsRead: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { notificationId } = req.params;

        await notificationService.markAsRead(notificationId, context);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/notifications/read-all - Mark all as read
     */
    markAllAsRead: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const recipientId = req.body.recipientId || context.userId;

        await notificationService.markAllAsRead(recipientId, context);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/notifications/:notificationId/dismiss - Dismiss notification
     */
    dismiss: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { notificationId } = req.params;

        await notificationService.dismiss(notificationId, context);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/notifications/unread-count - Get unread count
     */
    getUnreadCount: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const recipientId = (req.query.recipientId as string) || context.userId;

        const count = await notificationService.getUnreadCount(recipientId, context);

        res.json({ count });
      } catch (error) {
        next(error);
      }
    },
  };
}
