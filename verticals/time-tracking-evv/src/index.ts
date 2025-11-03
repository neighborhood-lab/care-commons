/**
 * @care-commons/time-tracking-evv
 * 
 * Time Tracking & Electronic Visit Verification (EVV)
 * 
 * Accurate timing and location evidence of visits — clock-in/out, geofenced 
 * verification, offline capture with sync, integrity measures against 
 * falsification, and compliance-grade retention.
 * 
 * This vertical provides federal and state EVV compliance capabilities,
 * meeting requirements of the 21st Century Cures Act.
 */

// Types
export * from './types/evv';
export * from './types/state-specific';

// Repository
export { EVVRepository } from './repository/evv-repository';

// Validation
export { EVVValidator } from './validation/evv-validator';

// Service
export { EVVService } from './service/evv-service';
export { VMURService } from './service/vmur-service';
export type { CreateVMURInput, ApproveVMURInput, DenyVMURInput } from './service/vmur-service';

// Utilities
export { IntegrationService } from './utils/integration-service';
export { CryptoUtils } from './utils/crypto-utils';

// API Handlers
export { EVVHandlers } from './api/evv-handlers';
