/**
 * @care-commons/core/browser
 *
 * Browser-safe exports from core package
 * This file excludes server-only modules that depend on Node.js built-ins
 */

// Types only - safe for browser
export type * from './types/base';
export type * from './types/organization';

// Utils that are browser-compatible
export * from './utils/date.utils';
export * from './utils/timezone.utils';
export * from './utils/memoize';
export * from './utils/pagination';

// Validation (browser-compatible)
export * from './validation/schemas';

// Sync types only (browser-compatible)
export type * from './sync/types';

// Error types (browser-compatible)
export {
  AppError,
  UnauthorizedError,
  UnprocessableEntityError,
  TooManyRequestsError,
  ServiceUnavailableError,
  InternalServerError,
  DatabaseError,
} from './errors/app-errors';
