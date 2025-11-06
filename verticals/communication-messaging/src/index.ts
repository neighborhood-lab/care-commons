/**
 * @care-commons/communication-messaging - Public API
 *
 * Communication & Messaging Platform
 * Multi-channel messaging, notifications, and team collaboration
 */

// Types
export * from './types/communication.js';

// Repositories
export { MessageThreadRepository, MessageRepository } from './repository/message-repository.js';
export { NotificationRepository } from './repository/notification-repository.js';
export { MessageTemplateRepository } from './repository/template-repository.js';
export { CommunicationPreferencesRepository } from './repository/preferences-repository.js';

// Services
export { MessagingService } from './service/messaging-service.js';
export { NotificationService } from './service/notification-service.js';

// Validation
export { CommunicationValidator } from './validation/communication-validator.js';
export * from './validation/communication-validator.js';

// API Handlers
export { createMessagingHandlers, createNotificationHandlers } from './api/communication-handlers.js';
