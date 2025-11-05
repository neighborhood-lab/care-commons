/**
 * Family Engagement API Handlers
 *
 * HTTP request handlers for family portal, messaging, and chatbot endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import { Database } from '@care-commons/core';
import { FamilyEngagementService } from '../service/family-engagement-service.js';
import { ChatbotService } from '../service/chatbot-service.js';
import {
  createFamilyPortalUserSchema,
  updateFamilyPortalUserSchema,
  createConversationSchema,
  sendMessageSchema,
  createActivityFeedItemSchema,
  chatRequestSchema,
  familyPortalUserSearchSchema,
  conversationSearchSchema,
  messageSearchSchema,
  activityFeedSearchSchema,
} from '../validation/family-portal-validator.js';

export class FamilyEngagementHandlers {
  private familyService: FamilyEngagementService;
  private chatbotService: ChatbotService;

  constructor(
    database: Database,
    chatbotConfig: { apiKey: string; model?: string }
  ) {
    this.familyService = new FamilyEngagementService(database);
    this.chatbotService = new ChatbotService(database, chatbotConfig);
  }

  // ============================================================================
  // Family Portal User Endpoints
  // ============================================================================

  /**
   * POST /family-portal-users
   * Create a new family portal user (invite)
   */
  createFamilyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createFamilyPortalUserSchema.parse(req.body);
      const user = req.user as { id: string; organizationId: string };

      const familyUser = await this.familyService.createFamilyUser(
        data,
        user.organizationId,
        user.id
      );

      res.status(201).json({
        success: true,
        data: familyUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /family-portal-users/:id
   * Get family portal user by ID
   */
  getFamilyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const familyUser = await this.familyService.getFamilyUser(id);

      if (!familyUser) {
        res.status(404).json({
          success: false,
          error: 'Family portal user not found',
        });
        return;
      }

      res.json({
        success: true,
        data: familyUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /family-portal-users/:id
   * Update family portal user
   */
  updateFamilyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = updateFamilyPortalUserSchema.parse(req.body);
      const user = req.user as { id: string };

      const updated = await this.familyService.updateFamilyUser(id, data, user.id);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /family-portal-users/client/:clientId
   * Get family members for a client
   */
  getFamilyMembersByClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId } = req.params;
      const familyMembers = await this.familyService.getFamilyMembersByClient(clientId);

      res.json({
        success: true,
        data: familyMembers,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /family-portal-users/accept-invitation
   * Accept family portal invitation
   */
  acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          error: 'Token and password are required',
        });
        return;
      }

      const familyUser = await this.familyService.acceptInvitation(token, password);

      res.json({
        success: true,
        data: familyUser,
        message: 'Invitation accepted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /family-portal-users/:id
   * Deactivate family portal user
   */
  deactivateFamilyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user as { id: string };

      await this.familyService.deactivateFamilyUser(id, user.id);

      res.json({
        success: true,
        message: 'Family portal user deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Conversation Endpoints
  // ============================================================================

  /**
   * POST /conversations
   * Create a new conversation
   */
  createConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createConversationSchema.parse(req.body);
      const user = req.user as { id: string; organizationId: string };

      const conversation = await this.familyService.createConversation(
        data,
        user.organizationId,
        user.id
      );

      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /conversations/:id
   * Get conversation by ID
   */
  getConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const conversation = await this.familyService.getConversation(id);

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
        return;
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /conversations/family-member/:familyMemberId
   * Get conversations for a family member
   */
  getConversationsForFamilyMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyMemberId } = req.params;
      const conversations = await this.familyService.getConversationsForFamilyMember(familyMemberId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /conversations/:id/archive
   * Archive a conversation
   */
  archiveConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.familyService.archiveConversation(id);

      res.json({
        success: true,
        message: 'Conversation archived successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Message Endpoints
  // ============================================================================

  /**
   * POST /messages
   * Send a message in a conversation
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = sendMessageSchema.parse(req.body);
      const user = req.user as { id: string; organizationId: string; name: string; type: string };

      const message = await this.familyService.sendMessage(
        data,
        user.id,
        user.type === 'family' ? 'FAMILY_MEMBER' : 'COORDINATOR',
        user.name,
        user.organizationId
      );

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /messages/conversation/:conversationId
   * Get messages in a conversation
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { limit, beforeMessageId } = messageSearchSchema.parse({
        conversationId,
        ...req.query,
      });

      const messages = await this.familyService.getMessages(conversationId, {
        limit,
        beforeMessageId,
      });

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /messages/mark-read
   * Mark messages as read
   */
  markMessagesAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageIds } = req.body;
      const user = req.user as { id: string };

      if (!Array.isArray(messageIds)) {
        res.status(400).json({
          success: false,
          error: 'messageIds must be an array',
        });
        return;
      }

      await this.familyService.markMessagesAsRead(messageIds, user.id);

      res.json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Activity Feed Endpoints
  // ============================================================================

  /**
   * POST /activity-feed
   * Create an activity feed item
   */
  createActivityFeedItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createActivityFeedItemSchema.parse(req.body);
      const user = req.user as { id: string; organizationId: string };

      const item = await this.familyService.createActivityFeedItem(
        data,
        user.organizationId,
        user.id
      );

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activity-feed/client/:clientId
   * Get activity feed for a client
   */
  getActivityFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId } = req.params;
      const params = activityFeedSearchSchema.parse({
        clientId,
        ...req.query,
      });

      const feed = await this.familyService.getActivityFeed(clientId, {
        visibleToFamily: params.visibleToFamily,
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page,
        limit: params.limit,
      });

      res.json({
        success: true,
        data: feed.data,
        pagination: {
          page: feed.page,
          pageSize: feed.pageSize,
          total: feed.total,
          totalPages: feed.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /activity-feed/:id/mark-read
   * Mark activity as read
   */
  markActivityAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { familyMemberId } = req.body;

      if (!familyMemberId) {
        res.status(400).json({
          success: false,
          error: 'familyMemberId is required',
        });
        return;
      }

      await this.familyService.markActivityAsRead(id, familyMemberId);

      res.json({
        success: true,
        message: 'Activity marked as read',
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // AI Chatbot Endpoints
  // ============================================================================

  /**
   * POST /chat
   * Send a chat message to the AI assistant
   */
  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = chatRequestSchema.parse(req.body);
      const user = req.user as { id: string; organizationId: string };

      const response = await this.chatbotService.chat(data, user.id, user.organizationId);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /chat/sessions/:sessionId/end
   * End a chatbot session with optional feedback
   */
  endChatSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { wasHelpful, rating, comment } = req.body;

      await this.chatbotService.endSession(sessionId, {
        wasHelpful,
        rating,
        comment,
      });

      res.json({
        success: true,
        message: 'Chat session ended',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /chat/sessions/:sessionId/handoff
   * Request human handoff for a chat session
   */
  requestHandoff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { reason, handoffTo } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Handoff reason is required',
        });
        return;
      }

      await this.chatbotService.requestHandoff(sessionId, reason, handoffTo);

      res.json({
        success: true,
        message: 'Handoff requested successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Dashboard Endpoint
  // ============================================================================

  /**
   * GET /dashboard/:familyMemberId
   * Get dashboard data for a family member
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyMemberId } = req.params;
      const { clientId } = req.query;

      if (!clientId || typeof clientId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'clientId query parameter is required',
        });
        return;
      }

      const dashboard = await this.familyService.getDashboardData(familyMemberId, clientId);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  };
}
