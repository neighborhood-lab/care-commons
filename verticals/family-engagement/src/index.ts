/**
 * @care-commons/family-engagement
 *
 * Family Engagement Platform Vertical
 *
 * Family portal, messaging system, AI chatbot, and care activity feeds
 * for home-based care services. Enables family members to stay connected
 * and informed about their loved one's care.
 */

// Core types
export * from './types/family-portal.js';

// Data access
export * from './repository/family-portal-repository.js';

// Business logic
export * from './service/family-engagement-service.js';
export * from './service/chatbot-service.js';

// Validation
export * from './validation/family-portal-validator.js';

// API handlers
export * from './api/family-engagement-handlers.js';
