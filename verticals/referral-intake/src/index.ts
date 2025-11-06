/**
 * @care-commons/referral-intake
 *
 * Referral & Intake Management Vertical
 *
 * Comprehensive referral and intake process management for home-based care services.
 * Provides referral tracking, intake workflow, documentation collection,
 * assessment coordination, and client onboarding.
 */

// Core types
export * from './types/referral.js';
export * from './types/intake.js';

// Data access
export * from './repository/referral-repository.js';
export * from './repository/intake-repository.js';

// Business logic
export * from './service/referral-service.js';
export * from './service/intake-service.js';

// Validation
export * from './validation/referral-validator.js';
export * from './validation/intake-validator.js';

// API handlers
export * from './api/referral-handlers.js';
export * from './api/intake-handlers.js';

// Utilities
export * from './utils/referral-utils.js';
export * from './utils/intake-utils.js';
