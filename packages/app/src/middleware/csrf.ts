import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import type { Express, Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    csrfToken?: () => string;
  }
}

// Custom CSRF protection implementation (csurf is deprecated)
// Uses double-submit cookie pattern

const CSRF_SECRET = process.env.CSRF_SECRET ?? crypto.randomBytes(32).toString('hex');
const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function createTokenHash(token: string): string {
  return crypto.createHmac('sha256', CSRF_SECRET).update(token).digest('hex');
}

function verifyToken(token: string, hash: string): boolean {
  const expectedHash = createTokenHash(token);
  return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(hash));
}

export const configureCsrfProtection = (app: Express): void => {
  // Enable cookie parser for CSRF cookies
  app.use(cookieParser());

  // Middleware to set CSRF cookie and attach token generator to request
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Generate or retrieve CSRF token
    // eslint-disable-next-line security/detect-object-injection
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const token = typeof cookieToken === 'string' ? cookieToken : null;

    if (token === null || token === '') {
      const newToken = generateToken();
      const hash = createTokenHash(newToken);

      res.cookie(CSRF_COOKIE_NAME, hash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Add csrfToken() method to request
      req.csrfToken = () => newToken;
    } else {
      // Add csrfToken() method to request
      req.csrfToken = () => token;
    }

    next();
  });

  // Apply CSRF protection to state-changing routes
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for mobile API (uses JWT)
    if (req.headers['x-mobile-app'] !== undefined) {
      return next();
    }

    // Verify CSRF token
    // eslint-disable-next-line security/detect-object-injection
    const headerValue = req.headers[CSRF_HEADER_NAME];
    const tokenHeader = typeof headerValue === 'string' ? headerValue : null;
    // eslint-disable-next-line security/detect-object-injection
    const cookieValue = req.cookies[CSRF_COOKIE_NAME];
    const cookieHash = typeof cookieValue === 'string' ? cookieValue : null;

    if (tokenHeader === null || tokenHeader === '' || cookieHash === null || cookieHash === '') {
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF protection requires a valid token',
      });
    }

    try {
      if (!verifyToken(tokenHeader, cookieHash)) {
        return res.status(403).json({
          error: 'CSRF token invalid',
          message: 'CSRF token verification failed',
        });
      }
    } catch (error) {
      // Verification can throw if buffers have different lengths
      // This is expected and indicates an invalid token
      // Log the error for security monitoring but don't expose details
      console.error('CSRF verification error:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(403).json({
        error: 'CSRF token invalid',
        message: 'CSRF token verification failed',
      });
    }

    next();
  });

  // Endpoint to get CSRF token
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken?.() });
  });
};
