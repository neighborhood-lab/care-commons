/**
 * Input Validation and Sanitization Middleware
 *
 * Provides Zod-based validation and XSS protection for request data.
 * Integrates with Express routes to enforce data validation.
 */

import { Request, Response, NextFunction } from 'express';
import { z, type ZodType, ZodError } from 'zod';
import sanitizeHtml from 'sanitize-html';

/**
 * Dangerous URI protocols that can execute code.
 * Must be stripped before any other sanitization.
 * Note: These strings are used for pattern matching/removal, not for code execution.
 */
/* eslint-disable sonarjs/code-eval -- These are patterns to BLOCK, not execute */
const DANGEROUS_URI_PROTOCOLS = [
  'javascript:', // XSS via href/src attributes
  'data:text/html', // XSS via embedded HTML
  'data:application', // potential binary exploits
  'vbscript:', // IE legacy XSS
];
/* eslint-enable sonarjs/code-eval */

/**
 * Sanitize a string to prevent XSS attacks.
 * 1. First strips dangerous URI protocols (javascript:, data:, etc.)
 * 2. Then uses sanitize-html to handle nested HTML tags
 */
function sanitizeString(str: string): string {
  let result = str;

  // Strip dangerous URI protocols (case-insensitive)
  // Loop until no more protocols are found to handle nested/obfuscated attempts
  let hasProtocol = true;
  while (hasProtocol) {
    hasProtocol = false;
    for (const protocol of DANGEROUS_URI_PROTOCOLS) {
      const lowerResult = result.toLowerCase();
      const index = lowerResult.indexOf(protocol.toLowerCase());
      if (index !== -1) {
        // Remove the protocol prefix to neutralize it
        // This handles javascript:alert(...), data:text/html,..., etc.
        result = result.slice(0, index) + result.slice(index + protocol.length);
        hasProtocol = true;
      }
    }
  }

  // Use sanitize-html with strict settings - strip ALL HTML
  return sanitizeHtml(result, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    disallowedTagsMode: 'recursiveEscape', // Escape nested tags properly
  });
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
