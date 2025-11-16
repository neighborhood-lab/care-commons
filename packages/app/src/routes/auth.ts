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
   * @openapi
   * /api/auth/login/google:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Authenticate with Google OAuth
   *     description: Authenticate user using Google ID token and receive JWT tokens
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idToken
   *             properties:
   *               idToken:
   *                 type: string
   *                 description: Google ID token from client
   *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
   *               organizationId:
   *                 type: string
   *                 format: uuid
   *                 description: Organization ID for new user registration (optional)
   *                 example: 123e4567-e89b-12d3-a456-426614174000
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       type: object
   *                       properties:
   *                         accessToken:
   *                           type: string
   *                         refreshToken:
   *                           type: string
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                 code:
   *                   type: string
   *       401:
   *         description: Authentication failed
   *       500:
   *         description: Server error
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
        organizationId as string
      );

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
          context: error.context
        });
      }

      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: error.code,
          context: error.context
        });
      }

      console.error('Google login error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  });

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Login with email and password
   *     description: Authenticate user with credentials and receive JWT tokens
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email address
   *                 example: admin@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 description: User password
   *                 example: SecurePassword123!
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       type: object
   *                       properties:
   *                         accessToken:
   *                           type: string
   *                           description: JWT access token
   *                         refreshToken:
   *                           type: string
   *                           description: JWT refresh token
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Invalid credentials
   *       500:
   *         description: Server error
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
   * @openapi
   * /api/auth/refresh:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Refresh access token
   *     description: Obtain a new access token using a valid refresh token
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: JWT refresh token
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       description: New JWT access token
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Invalid or expired refresh token
   *       500:
   *         description: Server error
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
   * @openapi
   * /api/auth/logout:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Logout user
   *     description: Logout user and invalidate all tokens
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Logged out successfully
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
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
   * @openapi
   * /api/auth/me:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Get current authenticated user
   *     description: Retrieve profile information for the currently authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     email:
   *                       type: string
   *                       format: email
   *                     organizationId:
   *                       type: string
   *                       format: uuid
   *                     roles:
   *                       type: array
   *                       items:
   *                         type: string
   *                     permissions:
   *                       type: array
   *                       items:
   *                         type: string
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
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

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         first_name:
 *           type: string
 *           description: User first name
 *         last_name:
 *           type: string
 *           description: User last name
 *         role:
 *           type: string
 *           enum: [admin, coordinator, caregiver, family]
 *           description: User role
 *         organization_id:
 *           type: string
 *           format: uuid
 *           description: Organization ID the user belongs to
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when user was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when user was last updated
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error message
 *         code:
 *           type: string
 *           description: Error code
 *         context:
 *           type: object
 *           description: Additional error context
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default createAuthRouter;
