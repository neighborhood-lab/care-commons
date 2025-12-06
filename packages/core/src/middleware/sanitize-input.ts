import type { Request, Response, NextFunction } from 'express';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj != null && typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitized: any = {};
    for (const key in obj) {
      // eslint-disable-next-line security/detect-object-injection
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }

  return obj;
}

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitize request body
  if (req.body != null && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body) as typeof req.body;
  }

  // Sanitize query parameters
  // Note: req.query has a getter but no setter, so we need to define our own property
  if (req.query != null && typeof req.query === 'object') {
    const sanitizedQuery = sanitizeObject(req.query);
    Object.defineProperty(req, 'query', {
      value: sanitizedQuery,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  next();
};

// SQL injection protection (additional layer beyond parameterized queries)
export const validateNoSQLInjection = (value: string): boolean => {
  const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|declare)\b)|(--)|(;)|(\/\*)|(\*\/)/gi;
  return !sqlInjectionPattern.test(value);
};
