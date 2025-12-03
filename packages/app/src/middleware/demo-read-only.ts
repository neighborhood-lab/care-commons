/**
 * Demo Read-Only Middleware
 *
 * Blocks all write operations (POST, PUT, PATCH, DELETE) for demo accounts.
 * This protects the shared demo database from being modified by public users.
 *
 * Demo accounts are identified by email pattern: *@*.folkcare.example
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Check if an email belongs to a demo account
 */
function isDemoEmail(email: string | undefined): boolean {
  if (!email) return false;

  // State-specific demo emails: user@tx.folkcare.example
  if (/@[a-z]{2}\.folkcare\.example$/i.test(email)) {
    return true;
  }

  // Generic demo emails: user@folkcare.example
  if (/@folkcare\.example$/i.test(email)) {
    return true;
  }

  return false;
}

/**
 * Routes that are allowed even for demo users
 * These are either read operations or necessary for app functionality
 */
const ALLOWED_ROUTES = [
  // Auth operations
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/me',

  // CSRF token
  '/api/csrf-token',

  // Health checks
  '/api/health',

  // Public signup (for non-demo users creating real accounts)
  '/api/signup',
  '/api/organizations/register',
  '/api/invitations/accept',
];

/**
 * Middleware to enforce read-only mode for demo accounts
 */
export function demoReadOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get user from request (set by auth middleware)
  const user = (req as Request & { user?: { email?: string } }).user;

  // If no user or not a demo user, allow all operations
  if (!user || !isDemoEmail(user.email)) {
    return next();
  }

  // Allow safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Allow specific routes that are necessary for app functionality
  const path = req.path;
  if (ALLOWED_ROUTES.some((route) => path === route || path.startsWith(route + '/'))) {
    return next();
  }

  // Block all other write operations for demo users
  console.warn(`🛡️  Blocked write operation for demo user: ${req.method} ${path} (${user.email})`);

  res.status(403).json({
    error: 'Demo Mode',
    message: 'This is a read-only demo. Create your own account to make changes.',
    code: 'DEMO_READ_ONLY',
  });
}

/**
 * Export for use in server.ts
 */
export default demoReadOnlyMiddleware;
