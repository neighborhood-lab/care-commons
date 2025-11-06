/**
 * Notification Routes
 *
 * Handles notification management including:
 * - Listing notifications with filters and pagination
 * - Getting unread count
 * - Creating notifications
 * - Marking as read
 * - Deleting notifications
 */

import { Router, Request, Response } from 'express';
import {
  Database,
  NotificationService,
  NotificationRepository,
  ValidationError,
  NotFoundError,
  NotificationListOptions,
  CreateNotificationInput,
} from '@care-commons/core';

export function createNotificationRouter(db: Database): Router {
  const router = Router();
  const notificationRepository = new NotificationRepository(db);
  const notificationService = new NotificationService(notificationRepository);

  /**
   * GET /api/notifications
   * Get notifications for the authenticated user
   *
   * Query params:
   *   - page: Page number (default: 1)
   *   - limit: Items per page (default: 20)
   *   - isRead: Filter by read status (true/false)
   *   - type: Filter by type (info, success, warning, error)
   *   - sortBy: Sort field (created_at, read_at)
   *   - sortOrder: Sort order (asc, desc)
   */
  router.get('/notifications', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userContext?.userId;
      const organizationId = req.userContext?.organizationId;

      if (userId === undefined || userId.length === 0 ||
          organizationId === undefined || organizationId.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Parse isRead parameter
      let isReadFilter: boolean | undefined;
      if (req.query['isRead'] === 'true') {
        isReadFilter = true;
      } else if (req.query['isRead'] === 'false') {
        isReadFilter = false;
      }

      const pageParam = req.query['page'];
      const limitParam = req.query['limit'];
      const typeParam = req.query['type'];

      const options: NotificationListOptions = {
        page: typeof pageParam === 'string' && pageParam.length > 0
          ? parseInt(pageParam, 10)
          : 1,
        limit: typeof limitParam === 'string' && limitParam.length > 0
          ? parseInt(limitParam, 10)
          : 20,
        isRead: isReadFilter,
        type: typeof typeParam === 'string' && typeParam.length > 0
          ? typeParam as NotificationListOptions['type']
          : undefined,
        sortBy: (req.query['sortBy'] as NotificationListOptions['sortBy']) ?? 'created_at',
        sortOrder: (req.query['sortOrder'] as NotificationListOptions['sortOrder']) ?? 'desc',
      };

      const result = await notificationService.getUserNotifications(
        userId,
        organizationId,
        options
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notifications',
      });
    }
  });

  /**
   * GET /api/notifications/unread-count
   * Get count of unread notifications for the authenticated user
   */
  router.get('/notifications/unread-count', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userContext?.userId;
      const organizationId = req.userContext?.organizationId;

      if (userId === undefined || userId.length === 0 ||
          organizationId === undefined || organizationId.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const count = await notificationService.getUnreadCount(userId, organizationId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve unread count',
      });
    }
  });

  /**
   * POST /api/notifications
   * Create a new notification
   *
   * Body:
   *   - userId: Target user ID
   *   - type: Notification type (info, success, warning, error)
   *   - title: Notification title
   *   - message: Notification message
   *   - actionUrl: (optional) URL for action button
   *   - metadata: (optional) Additional metadata
   */
  router.post('/notifications', async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.userContext?.organizationId;

      if (organizationId === undefined || organizationId.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const input: CreateNotificationInput = {
        userId: req.body.userId,
        organizationId,
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        actionUrl: req.body.actionUrl,
        metadata: req.body.metadata,
      };

      const notification = await notificationService.createNotification(input);

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Create notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create notification',
      });
    }
  });

  /**
   * PATCH /api/notifications/:id/read
   * Mark a notification as read
   */
  router.patch('/notifications/:id/read', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userContext?.userId;
      const notificationId = req.params['id'];

      if (userId === undefined || userId.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      if (notificationId === undefined || notificationId.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Notification ID is required',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const notification = await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  });

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for the authenticated user
   */
  router.patch('/notifications/read-all', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userContext?.userId;
      const organizationId = req.userContext?.organizationId;

      if (userId === undefined || userId.length === 0 ||
          organizationId === undefined || organizationId.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const count = await notificationService.markAllAsRead(userId, organizationId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read',
      });
    }
  });

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  router.delete('/notifications/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userContext?.userId;
      const notificationId = req.params['id'];

      if (userId === undefined || userId.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      if (notificationId === undefined || notificationId.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Notification ID is required',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      await notificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        data: { deleted: true },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete notification',
      });
    }
  });

  return router;
}
