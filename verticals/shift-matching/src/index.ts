/**
 * @care-commons/shift-matching
 *
 * Intelligent caregiver-to-shift matching and assignment system.
 *
 * Core capabilities:
 * - Automated matching based on skills, availability, proximity, and preferences
 * - Configurable scoring algorithm with dimensional weights
 * - Assignment proposal workflow with caregiver response tracking
 * - Bulk matching for schedule optimization
 * - Caregiver preference management
 * - Match history and analytics
 */

// Types
export * from './types/shift-matching';

// Repository
export { ShiftMatchingRepository } from './repository/shift-matching-repository';

// Service
export { ShiftMatchingService } from './service/shift-matching-service';
export type { MatchShiftResult } from './service/shift-matching-service';

// API Handlers
export { ShiftMatchingHandlers } from './api/shift-matching-handlers';

// Utilities
export { MatchingAlgorithm } from './utils/matching-algorithm';
export type { CaregiverContext } from './utils/matching-algorithm';

// Re-export commonly used core types
export type { UUID, UserContext, PaginationParams, PaginatedResult } from '@care-commons/core';
