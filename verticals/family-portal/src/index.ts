/**
 * Family Portal Vertical
 *
 * Provides family engagement platform with AI chatbot support
 */

// Export types
export * from './types/index.js';

// Export validation schemas
export * from './validation/index.js';

// Export repositories
export * from './repository/index.js';

// Export services
export * from './service/index.js';

// Export API routes
export * from './api/index.js';

// Re-export commonly used items
export { createFamilyPortalRouter, type FamilyPortalServices } from './api/index.js';
export {
  FamilyAuthService,
  FamilyInvitationService,
  ChatbotService,
  NotificationService,
  DashboardService,
} from './service/index.js';
export {
  FamilyMemberRepository,
  FamilyInvitationRepository,
  ChatConversationRepository,
  ChatMessageRepository,
  NotificationRepository,
} from './repository/index.js';
