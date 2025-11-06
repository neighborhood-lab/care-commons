/**
 * Feature Flags Module
 *
 * Comprehensive feature flag system using OpenFeature.
 * Provides server-side, web, and mobile support with advanced targeting and rollouts.
 */

export * from './types.js';
export * from './service.js';
export * from './provider.js';
export * from './middleware.js';
export { FeatureFlagService, createFeatureFlagService, getFeatureFlagService } from './service.js';
