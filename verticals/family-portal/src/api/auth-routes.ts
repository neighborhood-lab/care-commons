/**
 * Family Portal Authentication Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { FamilyAuthService } from '../service/index.js';
import {
  familyLoginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateFamilyMemberSchema,
} from '../validation/index.js';

export function createAuthRoutes(authService: FamilyAuthService): Router {
  const router = Router();

  /**
   * POST /api/family-portal/auth/login
   * Login with email and password
   */
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials = familyLoginSchema.parse(req.body);
      const authResponse = await authService.login(credentials);

      res.json({
        success: true,
        data: authResponse,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/auth/refresh
   * Refresh access token
   */
  router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'Refresh token required' });
      }

      const authResponse = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: authResponse,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/auth/password/reset-request
   * Request password reset
   */
  router.post('/password/reset-request', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = passwordResetRequestSchema.parse(req.body);
      const result = await authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/auth/password/reset
   * Reset password with token
   */
  router.post('/password/reset', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = passwordResetSchema.parse(req.body);
      await authService.resetPassword(data.token, data.newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/auth/password/change
   * Change password (authenticated)
   */
  router.post('/password/change', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Assumes middleware has attached familyMember to req
      const familyMemberId = (req as any).familyMember?.id;
      if (!familyMemberId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const data = changePasswordSchema.parse(req.body);
      await authService.changePassword(familyMemberId, data.currentPassword, data.newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/family-portal/auth/me
   * Get current family member profile
   */
  router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMember = (req as any).familyMember;
      if (!familyMember) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Remove sensitive data
      const { passwordHash, passwordResetToken, passwordResetExpires, ...safeProfile } =
        familyMember;

      res.json({
        success: true,
        data: safeProfile,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/family-portal/auth/me
   * Update current family member profile
   */
  router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyMemberId = (req as any).familyMember?.id;
      if (!familyMemberId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const updates = updateFamilyMemberSchema.parse(req.body);
      const updated = await authService.updateProfile(familyMemberId, updates);

      // Remove sensitive data
      const { passwordHash, passwordResetToken, passwordResetExpires, ...safeProfile } = updated;

      res.json({
        success: true,
        data: safeProfile,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
