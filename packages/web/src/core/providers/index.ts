/**
 * Providers Module
 *
 * Central export point for all provider-related functionality.
 * Includes both the old DataProvider pattern (PR #60) and new API Provider pattern (PR #61).
 */

// Old DataProvider pattern (from PR #60)
export * from './types';
export * from './context';

// New API Provider pattern (from PR #61)
export * from './api-provider.interface';
export * from './api-provider-context';
export * from './production-api-provider';
export * from './showcase-api-provider';
export * from './showcase-data';

// Re-export with specific naming to avoid conflicts
export { createApiProvider } from './api-provider-factory';
export { getApiProviderConfigFromEnv } from './api-provider-factory';
