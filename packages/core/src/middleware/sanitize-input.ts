import type { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

/**
 * Dangerous URI protocols that can execute code.
 * Must be stripped before any other sanitization.
 */
const DANGEROUS_URI_PROTOCOLS = [
  'javascript:',
  'data:text/html',
  'data:application',
  'vbscript:',
];

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
        // Remove everything from the protocol to the end of that "word"
        // This handles javascript:alert(...), data:text/html,..., etc.
        result = result.substring(0, index) + result.substring(index + protocol.length);
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
