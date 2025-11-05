import { Request, Response, NextFunction } from 'express';
import type { UserContext } from '@care-commons/core';
import { FamilyMemberService } from '../service/family-member-service.js';
import { FamilyChatbotService } from '../service/chatbot-service.js';
import { FeedbackRepository } from '../repository/feedback-repository.js';
import { MessageRepository } from '../repository/message-repository.js';
import {
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  familyMemberSearchSchema,
  createMessageSchema,
  createFeedbackSchema,
  feedbackSearchSchema,
  portalLoginSchema,
  changePortalPasswordSchema,
} from '../validation/family-validator.js';

/**
 * Create family engagement API handlers
 */
export function createFamilyHandlers(
  familyMemberService: FamilyMemberService,
  chatbotService: FamilyChatbotService,
  feedbackRepository: FeedbackRepository,
  messageRepository: MessageRepository
) {
  return {
    // ========================================================================
    // Family Member Endpoints
    // ========================================================================

    /**
     * Create a new family member
     * POST /api/family-members
     */
    createFamilyMember: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const validated = createFamilyMemberSchema.parse(req.body);

        const familyMember = await familyMemberService.create(validated, context);

        res.status(201).json({
          success: true,
          data: familyMember,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Get family member by ID
     * GET /api/family-members/:id
     */
    getFamilyMemberById: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { id } = req.params;

        const familyMember = await familyMemberService.findById(id, context);

        if (!familyMember) {
          return res.status(404).json({
            success: false,
            error: 'Family member not found',
          });
        }

        res.json({
          success: true,
          data: familyMember,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Search family members
     * GET /api/family-members
     */
    searchFamilyMembers: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const filter = familyMemberSearchSchema.parse({
          ...req.query,
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        });

        const result = await familyMemberService.search(filter, context);

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Get family members for a client
     * GET /api/clients/:clientId/family-members
     */
    getFamilyMembersByClient: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { clientId } = req.params;

        const familyMembers = await familyMemberService.findByClientId(clientId, context);

        res.json({
          success: true,
          data: familyMembers,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Update family member
     * PUT /api/family-members/:id
     */
    updateFamilyMember: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { id } = req.params;
        const validated = updateFamilyMemberSchema.parse(req.body);

        const familyMember = await familyMemberService.update(id, validated, context);

        res.json({
          success: true,
          data: familyMember,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Delete family member
     * DELETE /api/family-members/:id
     */
    deleteFamilyMember: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { id } = req.params;

        await familyMemberService.delete(id, context);

        res.json({
          success: true,
          message: 'Family member deleted successfully',
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Enable portal access
     * POST /api/family-members/:id/enable-portal
     */
    enablePortalAccess: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { id } = req.params;
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({
            success: false,
            error: 'Username and password are required',
          });
        }

        const familyMember = await familyMemberService.enablePortalAccess(
          id,
          username,
          password,
          context
        );

        res.json({
          success: true,
          data: familyMember,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Disable portal access
     * POST /api/family-members/:id/disable-portal
     */
    disablePortalAccess: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { id } = req.params;

        const familyMember = await familyMemberService.disablePortalAccess(id, context);

        res.json({
          success: true,
          data: familyMember,
        });
      } catch (error) {
        next(error);
      }
    },

    // ========================================================================
    // Family Portal Authentication
    // ========================================================================

    /**
     * Family portal login
     * POST /api/family-portal/login
     */
    portalLogin: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, password } = portalLoginSchema.parse(req.body);

        const familyMember = await familyMemberService.authenticatePortal(username, password);

        if (!familyMember) {
          return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
          });
        }

        // TODO: Generate JWT token for family member session
        // For now, return the family member data

        res.json({
          success: true,
          data: {
            familyMember,
            // token would go here
          },
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Change portal password
     * POST /api/family-portal/change-password
     */
    changePortalPassword: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { currentPassword, newPassword } = changePortalPasswordSchema.parse(req.body);

        // Assuming the family member ID is in the context or token
        const familyMemberId = req.params.id;

        await familyMemberService.changePortalPassword(
          familyMemberId,
          currentPassword,
          newPassword,
          context
        );

        res.json({
          success: true,
          message: 'Password changed successfully',
        });
      } catch (error) {
        next(error);
      }
    },

    // ========================================================================
    // Messaging Endpoints
    // ========================================================================

    /**
     * Send message
     * POST /api/family-messages
     */
    sendMessage: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const validated = createMessageSchema.parse(req.body);

        const message = await messageRepository.create(validated, context);

        res.status(201).json({
          success: true,
          data: message,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Get messages for a client
     * GET /api/clients/:clientId/messages
     */
    getMessagesByClient: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { clientId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await messageRepository.search({ clientId }, page, limit);

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Mark message as read
     * POST /api/family-messages/:id/mark-read
     */
    markMessageAsRead: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        await messageRepository.markAsRead(id);

        res.json({
          success: true,
          message: 'Message marked as read',
        });
      } catch (error) {
        next(error);
      }
    },

    // ========================================================================
    // AI Chatbot Endpoints
    // ========================================================================

    /**
     * Send message to AI chatbot
     * POST /api/family-chatbot/message
     */
    sendChatbotMessage: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const { familyMemberId, message, sessionId } = req.body;

        if (!familyMemberId || !message || !sessionId) {
          return res.status(400).json({
            success: false,
            error: 'familyMemberId, message, and sessionId are required',
          });
        }

        // Get family member
        const familyMember = await familyMemberService.findById(familyMemberId, context);

        if (!familyMember) {
          return res.status(404).json({
            success: false,
            error: 'Family member not found',
          });
        }

        // Get AI response
        const response = await chatbotService.handleMessage(
          familyMember,
          message,
          sessionId,
          context
        );

        res.json({
          success: true,
          data: {
            response,
          },
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Get chatbot conversation history
     * GET /api/family-chatbot/history/:sessionId
     */
    getChatbotHistory: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const history = await chatbotService.getConversationHistory(sessionId, limit);

        res.json({
          success: true,
          data: history,
        });
      } catch (error) {
        next(error);
      }
    },

    // ========================================================================
    // Feedback Endpoints
    // ========================================================================

    /**
     * Submit feedback
     * POST /api/family-feedback
     */
    submitFeedback: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = req.user as UserContext;
        const validated = createFeedbackSchema.parse(req.body);

        const feedback = await feedbackRepository.create(validated, context);

        res.status(201).json({
          success: true,
          data: feedback,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Get feedback for a client
     * GET /api/clients/:clientId/feedback
     */
    getFeedbackByClient: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { clientId } = req.params;
        const filter = feedbackSearchSchema.parse({
          clientId,
          ...req.query,
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        });

        const result = await feedbackRepository.search(filter, filter.page!, filter.limit!);

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Get feedback for a caregiver
     * GET /api/caregivers/:caregiverId/feedback
     */
    getFeedbackByCaregiver: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { caregiverId } = req.params;
        const filter = feedbackSearchSchema.parse({
          caregiverId,
          ...req.query,
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        });

        const result = await feedbackRepository.search(filter, filter.page!, filter.limit!);

        // Also get average rating
        const avgRating = await feedbackRepository.getAverageRatingForCaregiver(caregiverId);

        res.json({
          success: true,
          data: {
            ...result,
            averageRating: avgRating,
          },
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Complete feedback follow-up
     * POST /api/family-feedback/:id/complete-followup
     */
    completeFeedbackFollowup: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const { notes } = req.body;

        if (!notes) {
          return res.status(400).json({
            success: false,
            error: 'Follow-up notes are required',
          });
        }

        await feedbackRepository.completeFollowUp(id, notes);

        res.json({
          success: true,
          message: 'Follow-up completed successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
