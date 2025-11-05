/**
 * Family Engagement, Transparency & Communication Vertical
 *
 * This vertical provides comprehensive family engagement and communication features:
 * - Secure messaging between caregivers, staff, and families
 * - Family member registration and access control
 * - HIPAA-compliant transparency and activity tracking
 * - Notification preferences and delivery
 *
 * @module @care-commons/family-engagement
 */

// Export all types
export * from './types/index.js';

// Export repositories
export { MessageRepository, MessageThreadRepository } from './repository/message-repository.js';
export { FamilyMemberRepository, FamilyAccessRuleRepository } from './repository/family-repository.js';
export { ActivityFeedRepository, AccessLogRepository } from './repository/transparency-repository.js';

// Export services
export { MessageService } from './service/message-service.js';
export { FamilyService } from './service/family-service.js';
export { TransparencyService } from './service/transparency-service.js';
