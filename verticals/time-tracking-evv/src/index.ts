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

// Interfaces
export type { IVisitProvider, IClientProvider, ICaregiverProvider, EVVVisitData } from './interfaces/visit-provider';

// Providers
export { ClientProvider, createClientProvider } from './providers/client-provider';
export { CaregiverProvider, createCaregiverProvider } from './providers/caregiver-provider';

// Repository
export { EVVRepository } from './repository/evv-repository';

// Validation
export { EVVValidator } from './validation/evv-validator';

// Service
export { EVVService } from './service/evv-service';
export { VMURService } from './service/vmur-service';
export type { CreateVMURInput, ApproveVMURInput, DenyVMURInput } from './service/vmur-service';
export {
  EVVComplianceOrchestrator,
  type RealTimeValidationFeedback,
  type AggregatorSubmissionStatus,
  type StateComplianceDashboard,
} from './service/evv-compliance-orchestrator';

// Texas-specific EVV compliance services
export {
  TexasGeofenceValidator,
  createTexasGeofenceValidator,
  type GeofenceValidationResult,
  type GeofenceValidationType,
  type LocationCoordinates,
  type TexasGeofenceConfig,
} from './service/texas-geofence-validator';

export {
  SixElementsValidator,
  createFederalValidator,
  createTexasValidator,
  type SixElementsValidationResult,
  type ElementValidationResult,
  type EVVElement,
  type EVVDataInput,
  type ValidationConfig,
} from './service/six-elements-validator';

export {
  TexasEVVComplianceService,
  createTexasComplianceService,
  type TexasComplianceResult,
  type GracePeriodValidationResult,
  type TexasComplianceFlag,
  type TexasComplianceConfig,
} from './service/texas-evv-compliance';

// Utilities
export { IntegrationService } from './utils/integration-service';
// Platform-specific: will use crypto-utils.native.ts in React Native
export { CryptoUtils } from './utils/crypto-utils';

// API Handlers
export { EVVHandlers } from './api/evv-handlers';

// Aggregators (multi-state support)
export * from './aggregators/index';

// State configurations
export * from './config/state-evv-configs';
