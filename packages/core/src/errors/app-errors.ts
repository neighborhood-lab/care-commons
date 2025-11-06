/**
 * Application error classes and error handling middleware
 * Provides consistent error handling across the application
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  // eslint-disable-next-line max-params -- Error base class needs these params
  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Error
 * Used when a requested resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id !== undefined && id !== ''
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 400 Bad Request - Validation Error
 * Used when request data fails validation
 */
export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/**
 * 401 Unauthorized Error
 * Used when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden Error
 * Used when user is authenticated but lacks permission for the resource
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 409 Conflict Error
 * Used when there's a conflict with current resource state (e.g., duplicate key, version conflict)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * 422 Unprocessable Entity Error
 * Used when request is well-formed but semantically incorrect
 */
export class UnprocessableEntityError extends AppError {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 422, 'UNPROCESSABLE_ENTITY');
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/**
 * 429 Too Many Requests Error
 * Used for rate limiting
 */
export class TooManyRequestsError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'TOO_MANY_REQUESTS');
    if (retryAfter !== undefined && retryAfter > 0) {
      this.retryAfter = retryAfter;
    }
  }
}

/**
 * 503 Service Unavailable Error
 * Used when service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected errors that don't fit other categories
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', isOperational = false) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', isOperational);
  }
}

/**
 * Database Error
 * Used for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR', false);
    if (originalError !== undefined) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Permission Error (alias for ForbiddenError for backwards compatibility)
 */
export class PermissionError extends ForbiddenError {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Build error response from AppError
 */
function buildAppErrorResponse(err: AppError): ErrorResponse {
  const response: ErrorResponse = {
    error: err.code !== undefined && err.code !== '' ? err.code : 'ERROR',
    message: err.message,
  };

  // Include details for errors that have them
  const hasDetails =
    (err instanceof ValidationError && err.details !== undefined) ||
    (err instanceof UnprocessableEntityError && err.details !== undefined);

  if (hasDetails) {
    response.details = (err as ValidationError | UnprocessableEntityError).details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return response;
}

/**
 * Log error based on type
 */
function logError(err: AppError, req: Request): void {
  if (err.isOperational) {
    console.warn('Operational error:', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      url: req.url,
      method: req.method,
    });
  } else {
    console.error('Non-operational error:', {
      error: err,
      url: req.url,
      method: req.method,
      body: req.body,
    });
  }
}

/**
 * Global error handler middleware for Express
 * Catches all errors and returns consistent error responses
 */
// eslint-disable-next-line max-params -- Express middleware requires 4 params
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    const response = buildAppErrorResponse(err);
    logError(err, req);
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);

  const response: ErrorResponse = {
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}

/**
 * Async handler wrapper
 * Wraps async route handlers to automatically catch errors and pass to error middleware
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line promise/no-callback-in-promise -- Express pattern requires callback in catch
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler middleware
 * Should be added after all routes to catch 404s
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Route', req.path));
}
