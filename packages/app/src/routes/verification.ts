/**
 * Email Verification Routes
 * 
 * Handles email verification workflow
 */

import { Router, Request, Response } from 'express';
import { 
  Database, 
  EmailVerificationService, 
  AuthMiddleware,
  ValidationError,
  NotFoundError,
} from '@care-commons/core';

export function createVerificationRouter(db: Database): Router {
  const router = Router();
  const verificationService = new EmailVerificationService(db);
  const authMiddleware = new AuthMiddleware(db);

  /**
   * @openapi
   * /api/verify-email:
   *   post:
   *     tags:
   *       - Verification
   *     summary: Verify email address
   *     description: Verifies email address using token from email
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *                 description: Verification token from email
   *     responses:
   *       200:
   *         description: Email verified successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid or expired token
   *       500:
   *         description: Server error
   */
  router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      
      if (typeof token !== 'string' || token.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Verification token is required',
        });
        return;
      }
      
      await verificationService.verifyEmail(token);
      
      res.json({
        success: true,
        message: 'Email verified successfully! You can now log in.',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      
      console.error('[Verification] Error verifying email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify email',
      });
    }
  });

  /**
   * @openapi
   * /api/resend-verification:
   *   post:
   *     tags:
   *       - Verification
   *     summary: Resend verification email
   *     description: Resends verification email to authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Verification email sent
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Email already verified
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  router.post('/resend-verification', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      
      await verificationService.resendVerificationEmail(userId);
      
      res.json({
        success: true,
        message: 'Verification email sent! Please check your inbox.',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      
      console.error('[Verification] Error resending verification email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend verification email',
      });
    }
  });

  return router;
}
