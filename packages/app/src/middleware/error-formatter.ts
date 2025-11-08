/**
 * Enhanced error formatter for better developer experience
 * Provides clear, actionable error messages instead of raw stack traces
 */

import { Request } from 'express';

export interface FormattedError {
  statusCode: number;
  errorCode: string;
  message: string;
  suggestion?: string;
  documentation?: string;
  requestId?: string;
  timestamp: string;
  details?: unknown;
}

/**
 * Common error codes with user-friendly messages and suggestions
 */
const ERROR_CATALOG: Record<string, { message: string; suggestion: string; docs?: string }> = {
  // Authentication errors
  AUTH_TOKEN_MISSING: {
    message: 'Authentication token is missing',
    suggestion: 'Include an Authorization header with format: "Bearer <token>"',
    docs: '/docs/authentication',
  },
  AUTH_TOKEN_INVALID: {
    message: 'Authentication token is invalid or expired',
    suggestion: 'Refresh your access token using the /auth/refresh endpoint',
    docs: '/docs/authentication#token-refresh',
  },
  AUTH_UNAUTHORIZED: {
    message: 'You do not have permission to access this resource',
    suggestion: 'Check your user role and permissions, or contact an administrator',
    docs: '/docs/authorization',
  },

  // Validation errors
  VALIDATION_FAILED: {
    message: 'Request validation failed',
    suggestion: 'Check the request body, query parameters, and headers match the API specification',
    docs: '/docs/api-reference',
  },
  MISSING_REQUIRED_FIELD: {
    message: 'Required field is missing',
    suggestion: 'Ensure all required fields are included in your request',
  },
  INVALID_FORMAT: {
    message: 'Data format is invalid',
    suggestion: 'Check that dates are ISO 8601, IDs are valid UUIDs, and enums match allowed values',
  },

  // Database errors
  DATABASE_CONNECTION: {
    message: 'Database connection failed',
    suggestion: 'Check DATABASE_URL environment variable and ensure PostgreSQL is running',
    docs: '/docs/database-setup',
  },
  DATABASE_QUERY: {
    message: 'Database query failed',
    suggestion: 'Check database logs for detailed error information',
  },
  RECORD_NOT_FOUND: {
    message: 'The requested record was not found',
    suggestion: 'Verify the ID exists and you have permission to access it',
  },
  DUPLICATE_RECORD: {
    message: 'A record with this identifier already exists',
    suggestion: 'Use a different unique value or update the existing record',
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    message: 'Too many requests',
    suggestion: 'Wait before making additional requests. Check the Retry-After header.',
    docs: '/docs/rate-limits',
  },

  // Resource errors
  RESOURCE_NOT_FOUND: {
    message: 'The requested resource does not exist',
    suggestion: 'Check the URL path and ensure the resource ID is correct',
  },
  RESOURCE_CONFLICT: {
    message: 'Resource conflict detected',
    suggestion: 'The resource may have been modified by another request. Fetch the latest version and retry.',
  },

  // Server errors
  INTERNAL_SERVER_ERROR: {
    message: 'An unexpected error occurred',
    suggestion: 'This has been logged and will be investigated. Please try again later.',
  },
  SERVICE_UNAVAILABLE: {
    message: 'Service temporarily unavailable',
    suggestion: 'The service is undergoing maintenance or experiencing high load. Try again in a few minutes.',
  },
};

/**
 * Map HTTP status codes to error codes
 */
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'VALIDATION_FAILED',
  401: 'AUTH_TOKEN_INVALID',
  403: 'AUTH_UNAUTHORIZED',
  404: 'RESOURCE_NOT_FOUND',
  409: 'RESOURCE_CONFLICT',
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'INTERNAL_SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Detect error type from error message
 */
function detectErrorCode(error: Error, statusCode: number): string {
  const message = error.message.toLowerCase();

  // Check for specific error patterns
  if (message.includes('jwt') || message.includes('token')) {
    if (message.includes('expired')) return 'AUTH_TOKEN_INVALID';
    if (message.includes('missing')) return 'AUTH_TOKEN_MISSING';
    return 'AUTH_TOKEN_INVALID';
  }

  if (message.includes('unauthorized') || message.includes('permission')) {
    return 'AUTH_UNAUTHORIZED';
  }

  if (message.includes('not found')) {
    return 'RECORD_NOT_FOUND';
  }

  if (message.includes('duplicate') || message.includes('already exists')) {
    return 'DUPLICATE_RECORD';
  }

  if (message.includes('database') || message.includes('connection')) {
    return 'DATABASE_CONNECTION';
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_FAILED';
  }

  // Fall back to status code mapping
  return STATUS_CODE_MAP[statusCode] ?? 'INTERNAL_SERVER_ERROR';
}

/**
 * Format error with actionable information
 */
export function formatError(
  error: Error & { statusCode?: number; details?: unknown; code?: string },
  _req: Request,
  requestId?: string
): FormattedError {
  const statusCode = error.statusCode ?? 500;
  const errorCode = error.code ?? detectErrorCode(error, statusCode);
  const catalogEntry = ERROR_CATALOG[errorCode];

  const isProduction = process.env['NODE_ENV'] === 'production';
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  // In production, use generic messages for 5xx errors
  const useGenericMessage = isProduction && statusCode >= 500;

  // Determine the final message
  let finalMessage: string;
  if (useGenericMessage) {
    finalMessage = catalogEntry?.message ?? 'An unexpected error occurred';
  } else {
    finalMessage = (error.message.length > 0 ? error.message : undefined) ?? catalogEntry?.message ?? 'An error occurred';
  }

  return {
    statusCode,
    errorCode,
    message: finalMessage,
    suggestion: catalogEntry?.suggestion,
    documentation: catalogEntry?.docs,
    requestId,
    timestamp: new Date().toISOString(),
    // Only include details in development for 4xx errors
    ...(isDevelopment && statusCode < 500 && error.details !== undefined ? { details: error.details } : {}),
  };
}

/**
 * Format validation errors with field-specific messages
 */
export function formatValidationError(
  errors: Array<{ field: string; message: string; value?: unknown }>,
  _req: Request,
  requestId?: string
): FormattedError {
  const catalogEntry = ERROR_CATALOG['VALIDATION_FAILED'];

  return {
    statusCode: 400,
    errorCode: 'VALIDATION_FAILED',
    message: catalogEntry?.message ?? 'Validation failed',
    suggestion: catalogEntry?.suggestion,
    documentation: catalogEntry?.docs,
    requestId,
    timestamp: new Date().toISOString(),
    details: {
      errors: errors.map((err) => ({
        field: err.field,
        message: err.message,
        ...(process.env['NODE_ENV'] === 'development' && err.value !== undefined
          ? { receivedValue: err.value }
          : {}),
      })),
    },
  };
}

/**
 * Create a custom application error with error code
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApplicationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory functions
 */
export const ErrorFactory = {
  unauthorized(message = 'Unauthorized'): ApplicationError {
    return new ApplicationError(message, 401, 'AUTH_UNAUTHORIZED');
  },

  forbidden(message = 'Forbidden'): ApplicationError {
    return new ApplicationError(message, 403, 'AUTH_UNAUTHORIZED');
  },

  notFound(resource = 'Resource'): ApplicationError {
    return new ApplicationError(`${resource} not found`, 404, 'RECORD_NOT_FOUND');
  },

  validation(message: string, details?: unknown): ApplicationError {
    return new ApplicationError(message, 400, 'VALIDATION_FAILED', details);
  },

  conflict(message: string): ApplicationError {
    return new ApplicationError(message, 409, 'RESOURCE_CONFLICT');
  },

  internal(message = 'Internal server error'): ApplicationError {
    return new ApplicationError(message, 500, 'INTERNAL_SERVER_ERROR');
  },

  database(message = 'Database operation failed'): ApplicationError {
    return new ApplicationError(message, 500, 'DATABASE_QUERY');
  },
};
