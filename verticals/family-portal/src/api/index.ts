/**
 * Family Portal API Routes
 */

import { Router } from 'express';
import type {
  FamilyAuthService,
  FamilyInvitationService,
  ChatbotService,
  NotificationService,
  DashboardService,
} from '../service/index.js';
import { createAuthRoutes } from './auth-routes.js';
import { createInvitationRoutes } from './invitation-routes.js';
import { createChatbotRoutes } from './chatbot-routes.js';
import { createNotificationRoutes } from './notification-routes.js';
import { createDashboardRoutes } from './dashboard-routes.js';

export interface FamilyPortalServices {
  authService: FamilyAuthService;
  invitationService: FamilyInvitationService;
  chatbotService: ChatbotService;
  notificationService: NotificationService;
  dashboardService: DashboardService;
}

export function createFamilyPortalRouter(services: FamilyPortalServices): Router {
  const router = Router();

  // Mount route modules
  router.use('/auth', createAuthRoutes(services.authService));
  router.use('/invitations', createInvitationRoutes(services.invitationService));
  router.use('/chat', createChatbotRoutes(services.chatbotService));
  router.use('/notifications', createNotificationRoutes(services.notificationService));
  router.use('/dashboard', createDashboardRoutes(services.dashboardService));

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'family-portal' });
  });

  return router;
}

export * from './auth-routes.js';
export * from './invitation-routes.js';
export * from './chatbot-routes.js';
export * from './notification-routes.js';
export * from './dashboard-routes.js';
