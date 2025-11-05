import { Router } from 'express';
import { createFamilyHandlers } from './family-handlers.js';

/**
 * Create family engagement router with all endpoints
 */
export function createFamilyRouter(handlers: ReturnType<typeof createFamilyHandlers>): Router {
  const router = Router();

  // Family Member Management
  router.post('/family-members', handlers.createFamilyMember);
  router.get('/family-members', handlers.searchFamilyMembers);
  router.get('/family-members/:id', handlers.getFamilyMemberById);
  router.put('/family-members/:id', handlers.updateFamilyMember);
  router.delete('/family-members/:id', handlers.deleteFamilyMember);
  router.post('/family-members/:id/enable-portal', handlers.enablePortalAccess);
  router.post('/family-members/:id/disable-portal', handlers.disablePortalAccess);

  // Client-specific family members
  router.get('/clients/:clientId/family-members', handlers.getFamilyMembersByClient);

  // Family Portal Authentication
  router.post('/family-portal/login', handlers.portalLogin);
  router.post('/family-portal/change-password/:id', handlers.changePortalPassword);

  // Messaging
  router.post('/family-messages', handlers.sendMessage);
  router.get('/clients/:clientId/messages', handlers.getMessagesByClient);
  router.post('/family-messages/:id/mark-read', handlers.markMessageAsRead);

  // AI Chatbot
  router.post('/family-chatbot/message', handlers.sendChatbotMessage);
  router.get('/family-chatbot/history/:sessionId', handlers.getChatbotHistory);

  // Feedback
  router.post('/family-feedback', handlers.submitFeedback);
  router.get('/clients/:clientId/feedback', handlers.getFeedbackByClient);
  router.get('/caregivers/:caregiverId/feedback', handlers.getFeedbackByCaregiver);
  router.post('/family-feedback/:id/complete-followup', handlers.completeFeedbackFollowup);

  return router;
}
