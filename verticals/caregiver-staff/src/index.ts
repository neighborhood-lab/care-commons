/**
 * Caregiver & Staff Management Vertical
 * 
 * Entry point for caregiver and staff management functionality
 */

// Types
export * from './types/caregiver.js';

// Repository
export { CaregiverRepository } from './repository/caregiver-repository.js';

// Services
export { CaregiverService } from './service/caregiver-service.js';
export { CaregiverImportService } from './service/caregiver-import-service.js';
export type { CaregiverImportRow } from './service/caregiver-import-service.js';

// Credential & Compliance Services
export { 
  CredentialExpirationService,
  DEFAULT_ALERT_THRESHOLDS,
  type ExpiringItem,
  type ExpiringItemType,
  type AlertSeverity,
  type CredentialStatusSummary,
  type AlertConfig,
} from './services/credential-expiration-service.js';

export {
  ExclusionListService,
  type ExclusionCheckResult,
  type ExclusionListResult,
  type ExclusionDetail,
  type BatchExclusionCheckResult,
  type ExclusionListType,
} from './services/exclusion-list-service.js';

// State-Specific Registry Checks
export { TexasNurseAideRegistryService } from './services/registry-checks/texas-nurse-aide-registry.js';
export { TexasEmployeeMisconductRegistryService } from './services/registry-checks/texas-employee-misconduct-registry.js';
export { FloridaLevel2ScreeningService } from './services/registry-checks/florida-level2-screening.js';

// Burnout Prevention
export {
  BurnoutPredictionService,
  type BurnoutRiskAssessment,
  type BurnoutRiskLevel,
  type RiskFactor,
  type RiskFactorCategory,
  type InterventionSuggestion,
  type InterventionCategory,
  type IWorkPatternProvider,
  type CaregiverWorkPattern,
} from './services/burnout-prediction-service.js';

// Validation
export { CaregiverValidator } from './validation/caregiver-validator.js';

// Utilities
export * from './utils/caregiver-utils.js';
