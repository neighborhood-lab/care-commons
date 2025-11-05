/**
 * Family Portal Chatbot Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { ChatbotService } from '../service/index.js';
import { sendMessageSchema, getMessagesQuerySchema, getConversationsQuerySchema } from '../validation/index.js';

export function createChatbotRoutes(chatbotService: ChatbotService): Router {
  const router = Router();

  /**
   * POST /api/family-portal/chat/messages
   * Send a message to the chatbot
   */
  router.post('/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const input = sendMessageSchema.parse(req.body);
      const response = await chatbotService.sendMessage(familyMember, input);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/family-portal/chat/conversations
   * Get all conversations for authenticated family member
   */
  router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const query = getConversationsQuerySchema.parse(req.query);
      const conversations = await chatbotService.getConversations(
        familyMember.id,
        query.isActive ?? true
      );

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/family-portal/chat/conversations/:conversationId/messages
   * Get messages for a conversation
   */
  router.get(
    '/conversations/:conversationId/messages',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const familyMember = (req as any).familyMember;
        if (!familyMember) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { conversationId } = req.params;
        const query = getMessagesQuerySchema.parse(req.query);

        const messages = await chatbotService.getMessages(conversationId, query.limit);

        res.json({
          success: true,
          data: messages,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/family-portal/chat/conversations/:conversationId/archive
   * Archive a conversation
   */
  router.post(
    '/conversations/:conversationId/archive',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const familyMember = (req as any).familyMember;
        if (!familyMember) {
          return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { conversationId } = req.params;
        await chatbotService.archiveConversation(conversationId, familyMember.id);

        res.json({
          success: true,
          message: 'Conversation archived successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
