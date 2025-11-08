/**
 * Centralized error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { formatError } from './error-formatter.js';
import { randomUUID } from 'node:crypto';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
  code?: string;
}

/**
 * Global error handler middleware
 * Should be last in middleware chain
 *
 * Security: Never exposes internal error details, stack traces, or file paths to clients
 * All detailed error information is logged server-side only for debugging
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const requestId = randomUUID();

  // Log full error details server-side for debugging (never sent to client)
  console.error('Error occurred:', {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    errorCode: err.code,
    message: err.message,
    stack: err.stack,
    details: err.details,
    // Include request context for debugging
    userAgent: req.get('user-agent'),
    ip: req.ip,
    query: req.query,
    body: sanitizeBody(req.body),
  });

  // Use enhanced error formatter for better DX
  const formattedError = formatError(err, req, requestId);

  res.status(statusCode).json({
    success: false,
    error: formattedError.message,
    errorCode: formattedError.errorCode,
    requestId: formattedError.requestId,
    timestamp: formattedError.timestamp,
    ...(formattedError.suggestion !== undefined ? { suggestion: formattedError.suggestion } : {}),
    ...(formattedError.documentation !== undefined ? { documentation: formattedError.documentation } : {}),
    ...(formattedError.details !== undefined ? { details: formattedError.details } : {}),
  });
}

/**
 * Sanitize request body for logging (remove sensitive fields)
 */
function sanitizeBody(body: unknown): unknown {
  if (body === null || body === undefined || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const sanitized = { ...body } as Record<string, unknown>;

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
  });
}
