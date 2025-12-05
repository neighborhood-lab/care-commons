/**
 * Input Validation and Sanitization Middleware
 *
 * Provides Zod-based validation and XSS protection for request data.
 * Integrates with Express routes to enforce data validation.
 */

import { Request, Response, NextFunction } from 'express';
import { z, type ZodType, ZodError } from 'zod';

/**
 * Sanitize a string to prevent XSS attacks
 *
 * This approach:
 * 1. Removes dangerous URL protocols (javascript:, data:, vbscript:, file:, about:)
 * 2. Removes script/style tags and their content
 * 3. Strips remaining HTML tags and attributes
 * 4. Preserves plain text special characters like <>
 *
 * Note: We first remove URL protocols, then script tags, then other HTML tags.
 * This order prevents attackers from hiding malicious code in various ways.
 */
function sanitizeString(str: string): string {
  // Step 1: Remove dangerous URL protocols from plain text
  // Match protocols at word boundaries to avoid false positives
  const protocolPattern = /\b(javascript|data|vbscript|file|about):/gi;
  let sanitized = str.replace(protocolPattern, '');

  // Step 2: Remove script and style tags INCLUDING their content
  // This prevents XSS attacks via script injection
  sanitized = sanitized.replace(/<script\b[^>]*>[\S\s]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^>]*>[\S\s]*?<\/style>/gi, '');

  // Step 3: Strip remaining HTML tags (but preserve plain text < and >)
  // Match tags that have at least one alphanumeric character for the tag name
  // This preserves "<>" when it's not part of an HTML tag
  sanitized = sanitized.replace(/<\/?[a-z][\S\s]*?>/gi, '');

  // Step 4: Remove HTML event handlers that might be in remaining attributes
  // Matches: onclick="..." onerror="..." etc.
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
}

/**
 * Recursively sanitize all string values in an object
 */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate request body against a Zod schema
 * Sanitizes input to prevent XSS attacks
 *
 * Usage:
 *   const createClientSchema = z.object({
 *     firstName: z.string().min(1).max(100),
 *     lastName: z.string().min(1).max(100),
 *     email: z.string().email().optional()
 *   });
 *
 *   router.post('/clients', validate(createClientSchema), handler);
 *   // or
 *   router.post('/clients', validateBody(createClientSchema), handler);
 *
 * @param schema - Zod schema to validate against
 */
export function validateBody<T extends ZodType>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Sanitize strings to prevent XSS
      const sanitized = sanitizeObject(req.body);

      // Validate against schema
      req.body = schema.parse(sanitized) as Record<string, unknown>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request query parameters against a Zod schema
 *
 * Usage:
 *   const searchSchema = z.object({
 *     query: z.string().min(1),
 *     page: z.coerce.number().int().min(1).default(1),
 *     limit: z.coerce.number().int().min(1).max(100).default(20)
 *   });
 *
 *   router.get('/clients/search', validateQuery(searchSchema), handler);
 *
 * @param schema - Zod schema to validate against
 */
export function validateQuery<T extends ZodType>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Sanitize query parameters
      const sanitized = sanitizeObject(req.query);

      // Validate against schema
      const validated = schema.parse(sanitized);
      req.query = validated as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request route parameters against a Zod schema
 *
 * Usage:
 *   const paramsSchema = z.object({
 *     id: z.string().uuid()
 *   });
 *
 *   router.get('/clients/:id', validateParams(paramsSchema), handler);
 *
 * @param schema - Zod schema to validate against
 */
export function validateParams<T extends ZodType>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Sanitize params
      const sanitized = sanitizeObject(req.params);

      // Validate against schema
      const validated = schema.parse(sanitized);
      req.params = validated as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid route parameters',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Alias for validateBody for consistent naming
 *
 * Usage:
 *   router.post('/clients', validate(clientSchema), async (req, res) => {
 *     // req.body is guaranteed to be valid
 *     const client = await clientService.create(req.body);
 *     res.json(client);
 *   });
 */
export const validate = validateBody;

/**
 * Common validation schemas for reuse
 */
export const CommonSchemas = {
  // UUID parameter
  uuid: z.string().min(36).max(36).regex(
    /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i,
    { message: 'Invalid UUID format' }
  ),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().min(1),
    endDate: z.string().min(1)
  }),

  // Search query
  search: z.object({
    query: z.string().min(1).max(255),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),

  // Email - simple but safe regex without backtracking
  email: z.string().min(3).max(254).regex(
    /^[\w+.-]+@[\w-]+\.[\w.-]+$/,
    { message: 'Invalid email format' }
  ),

  // Phone number (US format)
  phone: z.string().regex(/^\d{10}$/, { message: 'Phone must be 10 digits' }),

  // Name fields
  name: z.string().min(1).max(100).trim(),

  // ID parameter
  idParam: z.object({
    id: z.string().min(36).max(36).regex(
      /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i,
      { message: 'Invalid ID format' }
    )
  })
};
