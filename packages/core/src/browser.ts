/**
 * @care-commons/core/browser
 *
 * Browser-safe exports from core package
 * This file excludes server-only modules that depend on Node.js built-ins
 */

// Types only - safe for browser
export type * from './types/base.js';
export type * from './types/organization.js';

// Utils that are browser-compatible
export * from './utils/date.utils.js';
export * from './utils/timezone.utils.js';
export * from './utils/memoize.js';
export * from './utils/pagination.js';

// Sync types only (browser-compatible)
export type * from './sync/types.js';

// Error types (browser-compatible)
export {
  AppError,
  UnauthorizedError,
  UnprocessableEntityError,
  TooManyRequestsError,
  ServiceUnavailableError,
  InternalServerError,
  DatabaseError,
} from './errors/app-errors.js';
