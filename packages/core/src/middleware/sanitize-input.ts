import type { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML input using the battle-tested sanitize-html library.
 * This properly handles nested tags and other bypass techniques that
 * regex-based sanitizers cannot safely handle.
 */
function sanitizeString(str: string): string {
  // Use sanitize-html with strict settings - strip ALL HTML
  return sanitizeHtml(str, {
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
