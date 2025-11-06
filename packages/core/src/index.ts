/**
 * @care-commons/core
 * 
 * Shared foundation for all Care Commons verticals
 */

export * from './types/base.js';
export * from './types/organization.js';
export * from './db/connection.js';
export * from './db/repository.js';
export * from './permissions/permission-service.js';
export * from './audit/audit-service.js';
export * from './repository/user-repository.js';
export * from './repository/organization-repository.js';
export * from './service/organization-service.js';
export * from './service/auth-service.js';
export * from './middleware/auth-middleware.js';
export * from './utils/password-utils.js';
export * from './utils/jwt-utils.js';
export * from './utils/date.utils.js';
export * from './validation/common-schemas.js';
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
} from './errors/app-errors.js';
export * from './sync/index.js';
export * from './demo/index.js';
