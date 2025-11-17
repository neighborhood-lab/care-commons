/**
 * @care-commons/core
 * 
 * Shared foundation for all Care Commons verticals
 */

export * from './types/base';
export * from './types/organization';
export * from './types/branding';
export * from './types/feature-flags';
export * from './types/domain-mappings';
export * from './types/email-templates';
export * from './db/connection';
export * from './db/repository';
export * from './db/query-logger';
export * from './db/scoped-queries';
export * from './db/scoped-database';
export * from './permissions/permission-service';
export * from './audit/audit-service';
export * from './repository/user-repository';
export * from './repository/organization-repository';
export * from './repository/branding-repository';
export * from './repository/feature-flag-repository';
export * from './repository/billing-repository';
export * from './service/organization-service';
export * from './service/auth-service';
export * from './service/signup-service';
export * from './service/white-label.service';
export * from './service/security-logger.service';
export * from './service/password-reset.service';
export * from './service/cache.service';
export * from './service/cache-warmer.service';
export * from './service/reference-data.service';
export * from './service/geocoding.service';
export * from './service/email-service';
export * from './constants/cache-keys';
export * from './middleware/auth-middleware';
export * from './middleware/request-logger';
export * from './middleware/metrics';
export * from './middleware/validation';
export * from './middleware/csrf';
export * from './utils/crypto';
export * from './utils/password-utils';
export * from './utils/jwt-utils';
export * from './utils/date.utils';
export * from './utils/timezone.utils';
export * from './utils/logger';
export * from './utils/metrics';
export * from './utils/error-tracker';
export * from './utils/performance';
export * from './utils/alerting';
export * from './validation/common-schemas';
// HTTP error handlers and middleware (import directly if needed)
export {
  AppError,
  UnauthorizedError,
  UnprocessableEntityError,
  TooManyRequestsError,
  ServiceUnavailableError,
  InternalServerError,
  DatabaseError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
} from './errors/app-errors';
export * from './utils/memoize';
export * from './utils/pagination';
export * from './utils/password-validator';
export * from './utils/sensitive-data-filter';
export * from './middleware/sanitize-input';
export * from './services/account-lockout.service';
export * from './sync/index';
export * from './demo/index';
export * from './providers/index';
// State compliance configuration (StateCode already exported from types/base)
export {
  ALL_STATES_CONFIG,
  getStateConfig,
  getAllStateCodes,
  isValidStateCode,
  type EVVConfig,
  type BackgroundScreeningConfig,
  type CaregiverCredentialingConfig,
  type PlanOfCareConfig,
  type RegulatoryRequirements,
  type StateComplianceConfig,
  type EVVAggregator,
  type BackgroundScreeningType,
} from './compliance/states/index';
// State compliance service
export {
  StateComplianceService,
  type VisitData,
  type EVVValidationResult,
  type EVVValidationError,
  type CaregiverComplianceData,
  type ClientServiceType,
  type PlanOfCareData,
} from './compliance/state-compliance-service';
// Notification system
export { getNotificationService, NotificationService } from './notifications/notification-service';
export * from './notifications/types';
