/**
 * Family Portal Notification Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { NotificationService } from '../service/index.js';
import { queryNotificationsSchema, markAsReadSchema } from '../validation/index.js';

export function createNotificationRoutes(notificationService: NotificationService): Router {
  const router = Router();

  /**
   * GET /api/family-portal/notifications
   * Get notifications for authenticated family member
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const query = queryNotificationsSchema.parse(req.query);
      const filters = {
        familyMemberId: familyMember.id,
        category: query.category,
        priority: query.priority,
        status: query.status,
        unreadOnly: query.unreadOnly,
        urgentOnly: query.urgentOnly,
      };

      const pagination = {
        page: 1,
        limit: query.limit,
      };

      const result = await notificationService.getNotifications(filters, pagination);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/family-portal/notifications/summary
   * Get notification summary
   */
  router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const summary = await notificationService.getNotificationSummary(familyMember.id);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/family-portal/notifications/:id/read
   * Mark notification as read
   */
  router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      await notificationService.markAsRead(id);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/notifications/mark-read
   * Mark multiple notifications as read
   */
  router.post('/mark-read', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { notificationIds } = markAsReadSchema.parse(req.body);
      await notificationService.markMultipleAsRead(notificationIds);

      res.json({
        success: true,
        message: 'Notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/notifications/mark-all-read
   * Mark all notifications as read
   */
  router.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      await notificationService.markAllAsRead(familyMember.id);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/family-portal/notifications/:id
   * Dismiss notification
   */
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      await notificationService.dismissNotification(id);

      res.json({
        success: true,
        message: 'Notification dismissed',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
