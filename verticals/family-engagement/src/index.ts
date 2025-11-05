/**
 * Family Engagement Platform
 *
 * Provides real-time transparency, two-way communication, and AI-powered assistance
 * for families of clients receiving home healthcare services.
 */

// Types
export * from './types/family.js';

// Repositories
export { FamilyMemberRepository } from './repository/family-member-repository.js';
export { NotificationRepository } from './repository/notification-repository.js';
export { MessageRepository } from './repository/message-repository.js';
export { AIConversationRepository } from './repository/ai-conversation-repository.js';
export { FeedbackRepository } from './repository/feedback-repository.js';

// Services
export { FamilyMemberService } from './service/family-member-service.js';
export { SMSNotificationService, type SMSServiceConfig } from './service/sms-notification-service.js';
export { FamilyChatbotService, type ChatbotConfig } from './service/chatbot-service.js';

// Event Handlers
export { FamilyNotificationHandler } from './events/notification-handler.js';

// API
export { createFamilyHandlers } from './api/family-handlers.js';
export { createFamilyRouter } from './api/family-router.js';

// Validation
export * from './validation/family-validator.js';
