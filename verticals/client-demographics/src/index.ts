/**
 * @care-commons/client-demographics
 *
 * Client & Demographics Management Vertical
 *
 * Comprehensive client information management for home-based care services.
 * Provides client identity, demographics, contacts, healthcare information,
 * program enrollment, risk management, and lifecycle tracking.
 */

// Core types
export * from './types/client';

// Data access
export * from './repository/client-repository';

// Business logic
export * from './service/client-service';
export * from './service/client-audit-service';

// Validation
export * from './validation/client-validator';

// API handlers
export * from './api/client-handlers';

// Utilities
export * from './utils/client-utils';
export * from './utils/search-builder';
