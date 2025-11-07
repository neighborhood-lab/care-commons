/**
 * CSRF Protection Middleware
 *
 * Provides Cross-Site Request Forgery (CSRF) protection for state-changing operations.
 * Note: JWT-based authentication (Bearer tokens) is inherently resistant to CSRF attacks
 * since tokens are not automatically sent by the browser like cookies.
 *
 * This middleware is primarily useful for:
 * - Cookie-based authentication endpoints
 * - Forms that use session cookies
 * - Any endpoint that uses cookies for authentication
 *
 * For most API endpoints using JWT Bearer tokens, this protection is optional.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      csrfToken?: string;
    }
  }
}

/**
 * In-memory store for CSRF tokens
 * For production with multiple instances, use Redis or similar distributed store
 */
interface CsrfTokenStore {
  [sessionId: string]: {
    token: string;
    expiresAt: number;
  };
}

const tokenStore: CsrfTokenStore = {};

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const sessionId in tokenStore) {
    const entry = tokenStore[sessionId];
    if (entry !== undefined && entry.expiresAt < now) {
      delete tokenStore[sessionId];
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a CSRF token for a session
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get or create session ID from request
 * Uses various sources: session cookie, Authorization header, IP address
 */
function getSessionIdentifier(req: Request): string {
  // Try to get from Authorization header (for JWT-based sessions)
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    // Use the JWT token as session identifier (hashed for storage)
    const token = authHeader.slice(7);
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Fallback to IP address + User-Agent (less secure but works without auth)
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? 'unknown';
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

/**
 * Middleware to generate and attach CSRF token to request
 * Should be applied before routes that need CSRF protection
 *
 * Usage:
 *   app.use(csrfTokenGenerator);
 *
 *   // In handler, access token:
 *   res.json({ csrfToken: req.csrfToken });
 */
export function csrfTokenGenerator(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const sessionId = getSessionIdentifier(req);
  const now = Date.now();
  const tokenLifetime = 60 * 60 * 1000; // 1 hour

  // Get existing token or create new one
  const existingEntry = tokenStore[sessionId];
  if (existingEntry !== undefined && existingEntry.expiresAt > now) {
    req.csrfToken = existingEntry.token;
  } else {
    const newToken = generateCsrfToken();
    tokenStore[sessionId] = {
      token: newToken,
      expiresAt: now + tokenLifetime
    };
    req.csrfToken = newToken;
  }

  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Checks for token in X-CSRF-Token header or _csrf body parameter
 *
 * Usage:
 *   // Apply to specific routes
 *   router.post('/sensitive-action', csrfProtection, handler);
 *
 *   // Or apply to all POST/PUT/DELETE routes
 *   app.use(csrfProtection);
 */
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    next();
    return;
  }

  // Skip CSRF check for API endpoints using JWT Bearer tokens
  // JWT tokens in Authorization header are CSRF-safe
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const sessionId = getSessionIdentifier(req);

  // Get token from request (header or body)
  const submittedToken =
    req.headers['x-csrf-token'] as string | undefined ??
    (req.body as Record<string, unknown> | undefined)?._csrf as string | undefined;

  if (typeof submittedToken !== 'string' || submittedToken.length === 0) {
    res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING',
      message: 'Include CSRF token in X-CSRF-Token header or _csrf body parameter'
    });
    return;
  }

  // Validate token
  const storedEntry = tokenStore[sessionId];
  if (storedEntry === undefined) {
    res.status(403).json({
      success: false,
      error: 'CSRF token invalid',
      code: 'CSRF_TOKEN_INVALID',
      message: 'CSRF token not found or expired'
    });
    return;
  }

  const now = Date.now();
  if (storedEntry.expiresAt < now) {
    delete tokenStore[sessionId];
    res.status(403).json({
      success: false,
      error: 'CSRF token expired',
      code: 'CSRF_TOKEN_EXPIRED',
      message: 'CSRF token has expired, please refresh and try again'
    });
    return;
  }

  if (storedEntry.token !== submittedToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF token mismatch',
      code: 'CSRF_TOKEN_MISMATCH',
      message: 'CSRF token does not match'
    });
    return;
  }

  // Token is valid
  next();
}

/**
 * Route handler to provide CSRF token to clients
 *
 * Usage:
 *   router.get('/csrf-token', getCsrfToken);
 */
export function getCsrfToken(req: Request, res: Response): void {
  if (req.csrfToken === undefined) {
    res.status(500).json({
      success: false,
      error: 'CSRF token not generated',
      code: 'CSRF_NOT_INITIALIZED',
      message: 'csrfTokenGenerator middleware must be applied before this route'
    });
    return;
  }

  res.json({
    success: true,
    csrfToken: req.csrfToken
  });
}
