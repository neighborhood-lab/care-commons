import type { Request, Response, NextFunction } from 'express';

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
  sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Step 3: Strip remaining HTML tags (but preserve plain text < and >)
  // Match tags that have at least one alphanumeric character for the tag name
  // This preserves "<>" when it's not part of an HTML tag
  sanitized = sanitized.replace(/<\/?[a-z][\s\S]*?>/gi, '');

  // Step 4: Remove HTML event handlers that might be in remaining attributes
  // Matches: onclick="..." onerror="..." etc.
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
}

// SQL injection protection (additional layer beyond parameterized queries)
export const validateNoSQLInjection = (value: string): boolean => {
  const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|declare)\b)|(--)|(;)|(\/\*)|(\*\/)/gi;
  return !sqlInjectionPattern.test(value);
};
