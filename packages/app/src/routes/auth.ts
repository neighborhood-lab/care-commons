/**
 * Authentication Routes
 * 
 * Production-ready authentication with:
 * - Google OAuth 2.0
 * - Password authentication
 * - JWT token management
 * - HIPAA-compliant audit logging
 */

import { Router, Request, Response } from 'express';
import { 
  AuthService, 
  AuthMiddleware, 
  Database, 
  ValidationError, 
  AuthenticationError 
} from '@care-commons/core';

export function createAuthRouter(db: Database): Router {
  const router = Router();
  const authService = new AuthService(db);
  const authMiddleware = new AuthMiddleware(db);

  /**
   * POST /api/auth/login/google
   * Authenticate with Google OAuth
   * 
   * Body:
   *   - idToken: Google ID token from client
   *   - organizationId: (optional) Organization ID for new user registration
   * 
   * Returns:
   *   - user: User profile
   *   - tokens: Access token and refresh token
   */
  router.post('/login/google', async (req: Request, res: Response) => {
    try {
      const { idToken, organizationId } = req.body;

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!idToken || typeof idToken !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Google ID token is required',
          code: 'MISSING_ID_TOKEN'
        });
      }

      const result = await authService.authenticateWithGoogle(
        idToken,
        organizationId as string | undefined
      );

/**
 * POST /api/auth/login
 * Authenticate user and return user info
 */
router.post('/login', (req, res) => {
  console.log('🔐 Login attempt:', { 
    email: req.body?.email,
    hasPassword: Boolean(req.body?.password),
    timestamp: new Date().toISOString(),
  });

  // Validate request body exists
  if (req.body === undefined || req.body === null || typeof req.body !== 'object') {
    console.error('❌ Login failed: Invalid request body');
    return res.status(400).json({
      success: false,
      error: 'Invalid request body',
    });
  }

  const { email, password } = req.body;

  // Validate required fields
  if (typeof email !== 'string' || typeof password !== 'string') {
    console.error('❌ Login failed: Missing email or password');
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
  }

  // Find user by email
  const users = getUsers();
  const expectedPassword = getMockPassword();
  const user = users.find(u => u.email === email && u.password === password);

  if (user === undefined) {
    console.error('❌ Login failed: Invalid credentials', {
      email,
      providedPassword: password,
      expectedPassword,
      availableEmails: users.map(u => u.email),
    });
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }

  console.log('✅ Login successful:', { 
    userId: user.id,
    email: user.email,
    roles: user.roles,
  });

  // Return user info (in production, this would include JWT tokens)
  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        organizationId: user.organizationId,
      },
      // Mock tokens - in production these would be real JWTs
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    },
  });

  /**
   * POST /api/auth/login
   * Authenticate with email and password
   * 
   * Body:
   *   - email: User email
   *   - password: User password
   * 
   * Returns:
   *   - user: User profile
   *   - tokens: Access token and refresh token
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        });
      }

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Password is required',
          code: 'MISSING_PASSWORD'
        });
      }

      // Extract IP and user agent for audit logging
      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.authenticateWithPassword(
        email,
        password,
        ipAddress,
        userAgent
      );

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: error.code,
          context: error.context
        });
      }

      console.error('Password login error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   * 
   * Body:
   *   - refreshToken: JWT refresh token
   * 
   * Returns:
   *   - accessToken: New access token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: error.code
        });
      }

      console.error('Token refresh error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token',
        code: 'REFRESH_ERROR'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user and invalidate all tokens
   * 
   * Requires: Authentication
   */
   router.post('/logout', authMiddleware.requireAuth, async (req: Request, res: Response) => {
    try {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
      }

      await authService.logout(req.user.userId);

      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user
   * 
   * Requires: Authentication
   * 
   * Returns:
   *   - user: Current user profile
   */
   router.get('/me', authMiddleware.requireAuth, (req: Request, res: Response) => {
    try {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
      }

      return res.json({
        success: true,
        data: {
          id: req.user.userId,
          email: req.user.email,
          organizationId: req.user.organizationId,
          roles: req.user.roles,
          permissions: req.user.permissions
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user info',
        code: 'USER_INFO_ERROR'
      });
    }
  });

  return router;
}

export default createAuthRouter;
