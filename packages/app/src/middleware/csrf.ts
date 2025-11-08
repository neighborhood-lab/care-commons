/**
 * CSRF Protection Configuration for Express App
 *
 * Note: The csurf package is deprecated. This implementation uses the
 * CSRF protection from @care-commons/core which uses crypto-based tokens.
 */

import { Express } from 'express';
import { csrfTokenGenerator, csrfProtection, getCsrfToken } from '@care-commons/core/middleware/csrf.js';

export const configureCsrfProtection = (app: Express): void => {
  // Apply CSRF token generator to all routes
  app.use(csrfTokenGenerator);

  // Apply CSRF protection to state-changing routes
  app.use('/api', (req, res, next): void => {
    // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for mobile API (uses JWT)
    const mobileHeader = req.headers['x-mobile-app'];
    if (typeof mobileHeader === 'string' && mobileHeader.length > 0) {
      return next();
    }

    // Apply CSRF protection
    csrfProtection(req, res, next);
  });

  // Endpoint to get CSRF token
  app.get('/api/csrf-token', getCsrfToken);
};
