/**
 * User Management Routes
 *
 * Handles user profile and preference management
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  Database,
  AuthMiddleware,
} from '@care-commons/core';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').regex(/^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/, 'Invalid email address'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
});

export function createUsersRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  /**
   * @openapi
   * /api/users/profile:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get current user profile
   *     description: Retrieve the profile information for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  router.get('/profile', authMiddleware.requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Fetch user details from database
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
        [req.user!.userId]
      );

      const user = result.rows[0] as Record<string, unknown> | undefined;

      if (user === undefined) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          organizationId: user.organization_id,
          roles: req.user!.roles,
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @openapi
   * /api/users/profile:
   *   put:
   *     tags:
   *       - Users
   *     summary: Update user profile
   *     description: Update the profile information for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - email
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  router.put('/profile', authMiddleware.requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const validatedData = updateProfileSchema.parse(req.body);

      // Check if email is already taken by another user
      const existingResult = await db.query(
        'SELECT id FROM users WHERE email = $1 AND organization_id = $2 AND id != $3 AND deleted_at IS NULL',
        [validatedData.email, req.user!.organizationId, req.user!.userId]
      );

      if (existingResult.rows.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Email is already in use',
          code: 'EMAIL_IN_USE'
        });
        return;
      }

      // Update user profile
      const result = await db.query(
        `UPDATE users
         SET first_name = $1, last_name = $2, email = $3, updated_at = $4
         WHERE id = $5
         RETURNING *`,
        [validatedData.firstName, validatedData.lastName, validatedData.email, new Date(), req.user!.userId]
      );

      const updatedUser = result.rows[0] as Record<string, unknown> | undefined;

      if (updatedUser === undefined) {
        res.status(500).json({
          success: false,
          error: 'Failed to update profile',
          code: 'UPDATE_FAILED'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          organizationId: updatedUser.organization_id,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0];
        const errorMessage = firstIssue !== undefined ? firstIssue.message : 'Validation error';
        res.status(400).json({
          success: false,
          error: errorMessage,
          code: 'VALIDATION_ERROR'
        });
        return;
      }
      next(error);
    }
  });

  /**
   * @openapi
   * /api/users/password:
   *   put:
   *     tags:
   *       - Users
   *     summary: Change user password
   *     description: Change the password for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       400:
   *         description: Validation error or incorrect current password
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  router.put('/password', authMiddleware.requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const validatedData = changePasswordSchema.parse(req.body);

      // Get user with password hash
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
        [req.user!.userId]
      );

      const user = result.rows[0] as Record<string, unknown> | undefined;

      if (user === undefined) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(validatedData.currentPassword, String(user.password_hash));

      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        });
        return;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(validatedData.newPassword, 10);

      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
        [newPasswordHash, new Date(), req.user!.userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0];
        const errorMessage = firstIssue !== undefined ? firstIssue.message : 'Validation error';
        res.status(400).json({
          success: false,
          error: errorMessage,
          code: 'VALIDATION_ERROR'
        });
        return;
      }
      next(error);
    }
  });

  /**
   * @openapi
   * /api/users/preferences:
   *   put:
   *     tags:
   *       - Users
   *     summary: Update user preferences
   *     description: Update preferences for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - emailNotifications
   *               - pushNotifications
   *               - theme
   *             properties:
   *               emailNotifications:
   *                 type: boolean
   *               pushNotifications:
   *                 type: boolean
   *               theme:
   *                 type: string
   *                 enum: [light, dark, system]
   *     responses:
   *       200:
   *         description: Preferences updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
  router.put('/preferences', authMiddleware.requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const validatedData = updatePreferencesSchema.parse(req.body);

      // Store preferences in user's settings JSONB column
      await db.query(
        'UPDATE users SET settings = $1, updated_at = $2 WHERE id = $3',
        [JSON.stringify(validatedData), new Date(), req.user!.userId]
      );

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0];
        const errorMessage = firstIssue !== undefined ? firstIssue.message : 'Validation error';
        res.status(400).json({
          success: false,
          error: errorMessage,
          code: 'VALIDATION_ERROR'
        });
        return;
      }
      next(error);
    }
  });

  return router;
}
