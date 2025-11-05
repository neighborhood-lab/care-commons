/**
 * AI Chatbot API handlers
 */

import type { Request, Response } from 'express';
import { AIChatbotService } from '../service/ai-chatbot-service.js';
import { FamilyEngagementValidator } from '../validation/family-engagement-validator.js';
import type { UserContext } from '@care-commons/core';

export class ChatbotHandlers {
  private chatService: AIChatbotService;
  private validator: FamilyEngagementValidator;

  constructor(chatService: AIChatbotService) {
    this.chatService = chatService;
    this.validator = new FamilyEngagementValidator();
  }

  /**
   * POST /api/family/chat/message
   * Send a message to the chatbot
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const context = req.user as UserContext;
      const familyMemberId = context.userId;
      const { sessionId, message, clientId } = req.body;

      // Validate input
      const validation = this.validator.validateSendChatMessage({ sessionId, message });
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      // Get or create session
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        if (!clientId) {
          res.status(400).json({ error: 'clientId required for new sessions' });
          return;
        }
        const session = await this.chatService.getOrCreateSession(
          familyMemberId,
          clientId,
          context
        );
        activeSessionId = session.id;
      }

      // Send message and get response
      const result = await this.chatService.sendMessage(
        activeSessionId,
        message,
        context
      );

      res.status(200).json({
        sessionId: activeSessionId,
        userMessage: result.message,
        assistantResponse: result.response,
      });
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        message: error.message,
      });
    }
  };

  /**
   * GET /api/family/chat/sessions
   * Get chat sessions for current family member
   */
  getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const context = req.user as UserContext;
      const familyMemberId = context.userId;

      // TODO: Implement session list retrieval
      res.status(200).json({ sessions: [] });
    } catch (error: any) {
      console.error('Error getting sessions:', error);
      res.status(500).json({
        error: 'Failed to get sessions',
        message: error.message,
      });
    }
  };

  /**
   * GET /api/family/chat/sessions/:sessionId/history
   * Get chat history for a session
   */
  getChatHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const messages = await this.chatService.getChatHistory(sessionId);

      res.status(200).json({ messages });
    } catch (error: any) {
      console.error('Error getting chat history:', error);
      res.status(500).json({
        error: 'Failed to get chat history',
        message: error.message,
      });
    }
  };

  /**
   * POST /api/family/chat/sessions/:sessionId/feedback
   * Submit feedback for a chat session
   */
  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const context = req.user as UserContext;
      const familyMemberId = context.userId;
      const { sessionId } = req.params;
      const { messageId, rating, feedbackType, comment } = req.body;

      // Validate input
      const validation = this.validator.validateChatFeedback({
        sessionId,
        messageId,
        rating,
        feedbackType,
        comment,
      });

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const feedback = await this.chatService.submitFeedback(
        sessionId,
        messageId,
        rating,
        feedbackType,
        comment,
        familyMemberId,
        context
      );

      res.status(201).json({ feedback });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        error: 'Failed to submit feedback',
        message: error.message,
      });
    }
  };

  /**
   * POST /api/family/chat/sessions/:sessionId/escalate
   * Escalate chat to human agent
   */
  escalate = async (req: Request, res: Response): Promise<void> => {
    try {
      const context = req.user as UserContext;
      const familyMemberId = context.userId;
      const { sessionId } = req.params;
      const { reason, description, priority, clientId } = req.body;

      // Validate input
      const validation = this.validator.validateChatEscalation({
        sessionId,
        reason,
        description,
        priority,
      });

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const escalation = await this.chatService.escalate(
        sessionId,
        reason,
        description,
        priority || 'NORMAL',
        familyMemberId,
        clientId,
        context
      );

      res.status(201).json({ escalation });
    } catch (error: any) {
      console.error('Error escalating chat:', error);
      res.status(500).json({
        error: 'Failed to escalate chat',
        message: error.message,
      });
    }
  };

  /**
   * POST /api/family/chat/sessions/:sessionId/end
   * End a chat session
   */
  endSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      await this.chatService.endSession(sessionId);

      res.status(200).json({ message: 'Session ended successfully' });
    } catch (error: any) {
      console.error('Error ending session:', error);
      res.status(500).json({
        error: 'Failed to end session',
        message: error.message,
      });
    }
  };
}

/**
 * Create Express router for chatbot endpoints
 */
export function createChatbotRouter(chatService: AIChatbotService) {
  const handlers = new ChatbotHandlers(chatService);

  return {
    'POST /message': handlers.sendMessage,
    'GET /sessions': handlers.getSessions,
    'GET /sessions/:sessionId/history': handlers.getChatHistory,
    'POST /sessions/:sessionId/feedback': handlers.submitFeedback,
    'POST /sessions/:sessionId/escalate': handlers.escalate,
    'POST /sessions/:sessionId/end': handlers.endSession,
  };
}
