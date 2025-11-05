/**
 * @care-commons/family-engagement
 *
 * Family Engagement Platform Vertical
 *
 * Enables families to stay connected with care delivery through a dedicated portal,
 * real-time messaging, AI-powered assistance, and personalized notifications.
 * Provides secure, HIPAA-compliant access to care information with fine-grained
 * permission controls.
 */

// Core types
export * from './types/portal.js';
export * from './types/conversation.js';
export * from './types/notification.js';
export * from './types/ai-chatbot.js';

// Data access
export * from './repository/family-portal-repository.js';
export * from './repository/conversation-repository.js';
export * from './repository/notification-repository.js';
export * from './repository/chat-repository.js';

// Business logic
export * from './service/ai-chatbot-service.js';

// Validation
export * from './validation/family-engagement-validator.js';

// API handlers
export * from './api/chatbot-handlers.js';
