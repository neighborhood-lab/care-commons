import type { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 * Implements OWASP security best practices for HTTP headers
 *
 * @see https://owasp.org/www-project-secure-headers/
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent clickjacking by denying iframe embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection in legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HTTPS only)
  // Only enable in production to avoid issues in local development
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  // Restricts sources of content to prevent XSS attacks
  const csp = [
    "default-src 'self'",
    // React requires inline scripts for hydration
    "script-src 'self' 'unsafe-inline'",
    // Allow inline styles (required for styled-components, etc.)
    "style-src 'self' 'unsafe-inline'",
    // Allow images from self, data URLs, and HTTPS sources
    "img-src 'self' data: https:",
    // Allow fonts from self and data URLs
    "font-src 'self' data:",
    // Allow connections to self and external APIs
    "connect-src 'self' https:",
    // Prevent framing by other sites
    "frame-ancestors 'none'",
    // Restrict base tag to self
    "base-uri 'self'",
    // Restrict form submissions to self
    "form-action 'self'",
  ];

  res.setHeader('Content-Security-Policy', csp.join('; '));

  // Referrer Policy - control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature-Policy)
  // Restrict access to browser features
  const permissionsPolicy = [
    'geolocation=(self)', // EVV requires geolocation for check-in/check-out
    'camera=()', // No camera access needed
    'microphone=()', // No microphone access needed
    'payment=()', // No payment API access needed
    'usb=()', // No USB access needed
  ];

  res.setHeader('Permissions-Policy', permissionsPolicy.join(', '));

  // HIPAA compliance headers - prevent caching of PHI
  res.setHeader('X-Healthcare-Data', 'PHI');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

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
