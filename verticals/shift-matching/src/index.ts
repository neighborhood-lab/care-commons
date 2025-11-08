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
 * - ML-enhanced matching with predictive models
 * - A/B testing framework for algorithm optimization
 * - Match outcome tracking and performance monitoring
 */

// Types
export * from './types/shift-matching';
// Export ML types explicitly to avoid name conflicts
// ML types exported explicitly to avoid conflicts
// export type * from './types/ml-types';

// Repository
export { ShiftMatchingRepository } from './repository/shift-matching-repository';

// Service
export { ShiftMatchingService } from './service/shift-matching-service';
export type { MatchShiftResult } from './service/shift-matching-service';

// ML Services
export { MLFeatureEngineeringService } from './services/ml-feature-engineering-service';
export type { FeatureComputationInput } from './services/ml-feature-engineering-service';
export { MLInferenceService } from './services/ml-inference-service';
export type { PredictionInput } from './services/ml-inference-service';
export { ABTestingService } from './services/ab-testing-service';
export { MatchOutcomeService } from './services/match-outcome-service';
export { MLEnhancedMatchingService } from './services/ml-enhanced-matching-service';
export type { MLMatchingOptions } from './services/ml-enhanced-matching-service';

// API Handlers
export { ShiftMatchingHandlers } from './api/shift-matching-handlers';
export { MLHandlers } from './api/ml-handlers';

// Utilities
export { MatchingAlgorithm } from './utils/matching-algorithm';
export type { CaregiverContext } from './utils/matching-algorithm';

// Scripts
export { trainModel, deployModel } from './scripts/train-ml-model';

// Re-export commonly used core types
export type { UUID, UserContext, PaginationParams, PaginatedResult } from '@care-commons/core';
