/**
 * Family Engagement, Transparency & Communication Vertical
 *
 * Enables family members to access care information, communicate with staff,
 * and stay informed about their loved ones' care progress.
 *
 * Key Features:
 * - Family member account management
 * - Relationship and permission management
 * - Secure messaging between families and staff
 * - Automated progress updates
 * - Configurable transparency settings
 * - Family portal access
 *
 * @packageDocumentation
 */

// ==========================================
// TYPES
// ==========================================
export * from './types/index.js';

// ==========================================
// SERVICES
// ==========================================
export { FamilyMemberService } from './service/family-member-service.js';

// ==========================================
// REPOSITORIES
// ==========================================
export { FamilyMemberRepository } from './repository/family-member-repository.js';

// ==========================================
// VALIDATORS
// ==========================================
export { FamilyMemberValidator } from './validation/family-member-validator.js';

// ==========================================
// API HANDLERS
// ==========================================
export { FamilyMemberHandlers } from './api/family-member-handlers.js';

// ==========================================
// FACTORY FUNCTIONS
// ==========================================
import { Database } from '@care-commons/core';
import { FamilyMemberRepository } from './repository/family-member-repository.js';
import { FamilyMemberService } from './service/family-member-service.js';
import { FamilyMemberHandlers } from './api/family-member-handlers.js';

/**
 * Create a complete family member service stack
 */
export function createFamilyMemberStack(database: Database) {
  const repository = new FamilyMemberRepository(database);
  const service = new FamilyMemberService(repository);
  const handlers = new FamilyMemberHandlers(service);

  return {
    repository,
    service,
    handlers,
  };
}
