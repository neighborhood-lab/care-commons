/**
 * @care-commons/time-tracking-evv/browser
 * 
 * Browser-safe exports from time-tracking-evv
 * Excludes server-only modules (providers, repository, services that use Database)
 */

// Types (all browser-safe)
export * from './types/evv';
export * from './types/state-specific';

// Validation (browser-safe)
export { EVVValidator } from './validation/evv-validator';

// Utilities (browser-safe)
export { CryptoUtils } from './utils/crypto-utils';

// State configurations (browser-safe, pure functions)
export * from './config/state-evv-configs';

// Note: Providers, Repository, Services, and API Handlers are server-only
// Mobile apps should use API endpoints for EVV operations
