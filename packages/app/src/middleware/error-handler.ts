/**
 * Centralized error handling middleware
 */

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
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
  const isProduction = process.env['NODE_ENV'] === 'production';
  
  // Log full error details server-side for debugging (never sent to client)
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    message: err.message,
    stack: err.stack,
    details: err.details,
    // Include request context for debugging
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  // Determine safe client-facing error message
  let clientMessage: string;
  
  if (statusCode >= 400 && statusCode < 500) {
    // Client errors (4xx) - safe to send specific message
    clientMessage = err.message || 'Invalid request';
  } else {
    // Server errors (5xx) - use generic message to avoid information disclosure
    clientMessage = isProduction 
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    // Only include error details in development and only for client errors
    ...((!isProduction && statusCode < 500) ? {
      details: err.details,
      // Note: Stack traces NEVER sent to client, even in development
      // Use server logs for debugging
    } : {}),
  });
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
