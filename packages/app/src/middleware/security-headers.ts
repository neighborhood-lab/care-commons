import helmet from 'helmet';
import { Express, Request, Response, NextFunction } from 'express';

/**
 * Configure comprehensive security headers using Helmet
 * Implements OWASP security best practices for HTTP headers
 *
 * @see https://owasp.org/www-project-secure-headers/
 */
export const configureSecurityHeaders = (app: Express): void => {
  // Use Helmet for security headers
  const apiUrl = process.env.API_URL;
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", ...(typeof apiUrl === 'string' && apiUrl.length > 0 ? [apiUrl] : [])],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow cross-origin resources
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      xContentTypeOptions: true, // Prevent MIME sniffing
      xFrameOptions: { action: 'deny' }, // Prevent clickjacking
      xXssProtection: true, // Enable XSS filter
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Additional custom headers
  app.use((_req, res, next): void => {
    // HIPAA compliance headers
    res.setHeader('X-Healthcare-Data', 'PHI');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    next();
  });
};

/**
 * Legacy security headers middleware (kept for backwards compatibility)
 * @deprecated Use configureSecurityHeaders instead
 */
export function securityHeaders(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  // This is now handled by Helmet in configureSecurityHeaders
  next();
}

/**
 * Rate limit headers middleware
 * Adds standard rate limit headers to responses
 *
 * @param limit - Maximum number of requests allowed
 * @param remaining - Number of requests remaining
 * @param reset - Timestamp when the limit resets
 */
export function rateLimitHeaders(limit: number, remaining: number, reset: number) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());
    next();
  };
}
