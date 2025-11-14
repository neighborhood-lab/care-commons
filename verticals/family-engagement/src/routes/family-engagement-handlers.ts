/**
 * Family Engagement API Handlers
 *
 * Express request handlers for family portal, notifications, and messaging
 */

import type { Request, Response } from 'express';
import type { UserContext } from '@care-commons/core';
import { FamilyEngagementService } from '../services/family-engagement-service';

/**
 * Extract user context from JWT payload
 */
function getUserContext(req: Request): UserContext {
  const user = req.user!;
  return {
    userId: user.userId,
    organizationId: user.organizationId,
    branchIds: user.branchIds,
    roles: user.roles,
    permissions: user.permissions,
  };
}

/**
 * Handle errors consistently across all handlers
 */
function handleError(error: unknown, res: Response, operation: string): void {
  const err = error as Error & { statusCode?: number };

  if (err.message.includes('permissions')) {
    res.status(403).json({ error: err.message });
  } else if (err.message.includes('not found')) {
    res.status(404).json({ error: err.message });
  } else if (err.message.includes('validation') || err.message.includes('already')) {
    res.status(400).json({ error: err.message });
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create API handlers for family engagement
 */
export function createFamilyEngagementHandlers(service: FamilyEngagementService) {
  return {
    // ========================================================================
    // Family Member Management
    // ========================================================================

    /**
     * POST /family-members/invite
     * Invite a family member to the portal
     */
    async inviteFamilyMember(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const familyMember = await service.inviteFamilyMember(req.body, context);
        res.status(201).json(familyMember);
      } catch (error: unknown) {
        handleError(error, res, 'inviting family member');
      }
    },

    /**
     * GET /family-members/:id
     * Get family member profile with statistics
     */
    async getFamilyMemberProfile(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const profile = await service.getFamilyMemberProfile(
          req.params['id'] as string,
          context
        );

        if (!profile) {
          res.status(404).json({ error: 'Family member not found' });
          return;
        }

        res.json(profile);
      } catch (error: unknown) {
        handleError(error, res, 'fetching family member profile');
      }
    },

    /**
     * GET /family-members/client/:clientId
     * Get all family members for a client
     */
    async getFamilyMembersForClient(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const familyMembers = await service.getFamilyMembersForClient(
          req.params['clientId'] as string,
          context
        );
        res.json(familyMembers);
      } catch (error: unknown) {
        handleError(error, res, 'fetching family members');
      }
    },

    /**
     * PATCH /family-members/:id/portal-access
     * Update family member portal access
     */
    async updatePortalAccess(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const familyMember = await service.updatePortalAccess(
          req.params['id'] as string,
          req.body,
          context
        );
        res.json(familyMember);
      } catch (error: unknown) {
        handleError(error, res, 'updating portal access');
      }
    },

    // ========================================================================
    // Notifications
    // ========================================================================

    /**
     * POST /notifications
     * Send notification to family member
     */
    async sendNotification(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const notification = await service.sendNotification(req.body, context);
        res.status(201).json(notification);
      } catch (error: unknown) {
        handleError(error, res, 'sending notification');
      }
    },

    /**
     * POST /notifications/broadcast
     * Broadcast notification to all family members of a client
     */
    async broadcastNotification(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const { clientId, ...notificationData } = req.body;

        if (!clientId) {
          res.status(400).json({ error: 'clientId is required' });
          return;
        }

        const notifications = await service.broadcastNotification(
          clientId,
          notificationData,
          context
        );
        res.status(201).json(notifications);
      } catch (error: unknown) {
        handleError(error, res, 'broadcasting notification');
      }
    },

    /**
     * GET /notifications/family-member/:familyMemberId/unread
     * Get unread notifications for family member
     */
    async getUnreadNotifications(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const notifications = await service.getUnreadNotifications(
          req.params['familyMemberId'] as string,
          context
        );
        res.json(notifications);
      } catch (error: unknown) {
        handleError(error, res, 'fetching unread notifications');
      }
    },

    /**
     * PATCH /notifications/:id/read
     * Mark notification as read
     */
    async markNotificationAsRead(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        await service.markNotificationAsRead(
          req.params['id'] as string,
          context
        );
        res.status(204).send();
      } catch (error: unknown) {
        handleError(error, res, 'marking notification as read');
      }
    },

    // ========================================================================
    // Activity Feed
    // ========================================================================

    /**
     * GET /activity-feed/family-member/:familyMemberId
     * Get recent activity for family member
     */
    async getRecentActivity(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const limit = req.query['limit']
          ? parseInt(req.query['limit'] as string, 10)
          : 20;

        const activity = await service.getRecentActivity(
          req.params['familyMemberId'] as string,
          limit,
          context
        );
        res.json(activity);
      } catch (error: unknown) {
        handleError(error, res, 'fetching activity feed');
      }
    },

    /**
     * POST /activity-feed
     * Create activity feed item (internal use by other verticals)
     */
    async createActivityFeedItem(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const { familyMemberIds, clientId, ...activityData } = req.body;

        if (!familyMemberIds || !clientId) {
          res.status(400).json({
            error: 'familyMemberIds and clientId are required'
          });
          return;
        }

        const activities = await service.createActivityFeedItem(
          familyMemberIds,
          clientId,
          activityData,
          context
        );
        res.status(201).json(activities);
      } catch (error: unknown) {
        handleError(error, res, 'creating activity feed item');
      }
    },

    // ========================================================================
    // Messaging
    // ========================================================================

    /**
     * POST /messages/threads
     * Create a new message thread
     */
    async createMessageThread(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const thread = await service.createMessageThread(req.body, context);
        res.status(201).json(thread);
      } catch (error: unknown) {
        handleError(error, res, 'creating message thread');
      }
    },

    /**
     * POST /messages/threads/:threadId/messages
     * Send message in thread
     */
    async sendMessage(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const senderType = req.body.senderType || 'STAFF';

        const message = await service.sendMessage(
          {
            threadId: req.params['threadId'] as string,
            ...req.body
          },
          senderType,
          context
        );
        res.status(201).json(message);
      } catch (error: unknown) {
        handleError(error, res, 'sending message');
      }
    },

    /**
     * GET /messages/family-member/:familyMemberId/threads
     * Get message threads for family member
     */
    async getThreadsForFamilyMember(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const threads = await service.getThreadsForFamilyMember(
          req.params['familyMemberId'] as string,
          context
        );
        res.json(threads);
      } catch (error: unknown) {
        handleError(error, res, 'fetching message threads');
      }
    },

    /**
     * GET /messages/threads/:threadId/messages
     * Get messages in thread
     */
    async getMessagesInThread(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const messages = await service.getMessagesInThread(
          req.params['threadId'] as string,
          context
        );
        res.json(messages);
      } catch (error: unknown) {
        handleError(error, res, 'fetching messages');
      }
    },

    // ========================================================================
    // Dashboard
    // ========================================================================

    /**
     * GET /dashboard/family-member/:familyMemberId
     * Get family dashboard data
     */
    async getFamilyDashboard(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const dashboard = await service.getFamilyDashboard(
          req.params['familyMemberId'] as string,
          context
        );
        res.json(dashboard);
      } catch (error: unknown) {
        handleError(error, res, 'fetching family dashboard');
      }
    },

    // ========================================================================
    // Care Event Notifications
    // ========================================================================

    /**
     * POST /events/notify
     * Notify family of care event (internal use)
     */
    async notifyFamilyOfCareEvent(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const { clientId, eventType, eventData } = req.body;

        if (!clientId || !eventType || !eventData) {
          res.status(400).json({
            error: 'clientId, eventType, and eventData are required'
          });
          return;
        }

        await service.notifyFamilyOfCareEvent(
          clientId,
          eventType,
          eventData,
          context
        );
        res.status(204).send();
      } catch (error: unknown) {
        handleError(error, res, 'notifying family of care event');
      }
    }
  };
}
