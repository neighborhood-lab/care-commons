/**
 * Demo Module
 * 
 * Provides demo session management with isolated state for interactive demos.
 * 
 * @packageDocumentation
 */

export * from './types.js';
export * from './demo-state-store.js';
export * from './demo-session-manager.js';
export * from './state-credentials.js';

export {
  getDemoStateStore,
  resetDemoStateStore
} from './demo-state-store.js';

export {
  getDemoSessionManager,
  resetDemoSessionManager
} from './demo-session-manager.js';

export {
  getStateCredentials,
  getSupportedDemoStates,
  compareStateCredentials,
  TEXAS_CREDENTIALS,
  FLORIDA_CREDENTIALS
} from './state-credentials.js';
