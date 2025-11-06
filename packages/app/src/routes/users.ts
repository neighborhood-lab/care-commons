/**
 * User Settings Routes
 *
 * Routes for user account settings, preferences, and password management.
 */

import { Router, Request, Response } from 'express';
import {
  Database,
  AuthMiddleware,
  ValidationError,
  AuthenticationError,
} from '@care-commons/core';

interface AccountSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export function createUserRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  /**
   * GET /api/users/settings
   * Get current user's account settings
   *
   * Requires: Authentication
   */
  router.get(
    '/settings',
    authMiddleware.requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        // Fetch user data from database
        const result = await db.query(
          `SELECT
            first_name as "firstName",
            last_name as "lastName",
            email,
            phone,
            avatar
          FROM users
          WHERE id = $1`,
          [req.user.userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND',
          });
        }

        const settings: AccountSettings = result.rows[0];

        return res.json({
          success: true,
          data: settings,
        });
      } catch (error) {
        console.error('Get account settings error:', error);
        return res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get account settings',
          code: 'GET_SETTINGS_ERROR',
        });
      }
    }
  );

  /**
   * PATCH /api/users/settings
   * Update current user's account settings
   *
   * Requires: Authentication
   *
   * Body:
   *   - firstName: (optional) User's first name
   *   - lastName: (optional) User's last name
   *   - phone: (optional) User's phone number
   *   - avatar: (optional) Avatar URL
   */
  router.patch(
    '/settings',
    authMiddleware.requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        const { firstName, lastName, phone, avatar } = req.body;

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (firstName !== undefined) {
          updates.push(`first_name = $${paramIndex++}`);
          values.push(firstName);
        }
        if (lastName !== undefined) {
          updates.push(`last_name = $${paramIndex++}`);
          values.push(lastName);
        }
        if (phone !== undefined) {
          updates.push(`phone = $${paramIndex++}`);
          values.push(phone || null);
        }
        if (avatar !== undefined) {
          updates.push(`avatar = $${paramIndex++}`);
          values.push(avatar || null);
        }

        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No fields to update',
            code: 'NO_UPDATES',
          });
        }

        updates.push(`updated_at = NOW()`);
        values.push(req.user.userId);

        const query = `
          UPDATE users
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING
            first_name as "firstName",
            last_name as "lastName",
            email,
            phone,
            avatar
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND',
          });
        }

        const settings: AccountSettings = result.rows[0];

        return res.json({
          success: true,
          data: settings,
        });
      } catch (error) {
        console.error('Update account settings error:', error);
        return res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update account settings',
          code: 'UPDATE_SETTINGS_ERROR',
        });
      }
    }
  );

  /**
   * GET /api/users/preferences
   * Get current user's preferences
   *
   * Requires: Authentication
   */
  router.get(
    '/preferences',
    authMiddleware.requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        // Fetch preferences from database
        const result = await db.query(
          `SELECT
            preferences
          FROM users
          WHERE id = $1`,
          [req.user.userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND',
          });
        }

        // Default preferences if none exist
        const defaultPreferences: UserPreferences = {
          theme: 'system',
          language: 'en',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        };

        const preferences: UserPreferences = result.rows[0].preferences || defaultPreferences;

        return res.json({
          success: true,
          data: preferences,
        });
      } catch (error) {
        console.error('Get preferences error:', error);
        return res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to get preferences',
          code: 'GET_PREFERENCES_ERROR',
        });
      }
    }
  );

  /**
   * PATCH /api/users/preferences
   * Update current user's preferences
   *
   * Requires: Authentication
   *
   * Body:
   *   - theme: (optional) UI theme
   *   - language: (optional) Language preference
   *   - timezone: (optional) Timezone
   *   - dateFormat: (optional) Date format
   *   - timeFormat: (optional) Time format
   *   - notifications: (optional) Notification preferences
   */
  router.patch(
    '/preferences',
    authMiddleware.requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        // Get current preferences
        const currentResult = await db.query(
          `SELECT preferences FROM users WHERE id = $1`,
          [req.user.userId]
        );

        if (currentResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND',
          });
        }

        const currentPreferences = currentResult.rows[0].preferences || {};
        const updates = req.body;

        // Merge preferences
        const newPreferences: UserPreferences = {
          theme: updates.theme || currentPreferences.theme || 'system',
          language: updates.language || currentPreferences.language || 'en',
          timezone:
            updates.timezone ||
            currentPreferences.timezone ||
            'America/New_York',
          dateFormat:
            updates.dateFormat ||
            currentPreferences.dateFormat ||
            'MM/DD/YYYY',
          timeFormat:
            updates.timeFormat || currentPreferences.timeFormat || '12h',
          notifications: {
            email:
              updates.notifications?.email ??
              currentPreferences.notifications?.email ??
              true,
            push:
              updates.notifications?.push ??
              currentPreferences.notifications?.push ??
              true,
            sms:
              updates.notifications?.sms ??
              currentPreferences.notifications?.sms ??
              false,
          },
        };

        // Update preferences
        const result = await db.query(
          `UPDATE users
           SET preferences = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING preferences`,
          [JSON.stringify(newPreferences), req.user.userId]
        );

        return res.json({
          success: true,
          data: result.rows[0].preferences,
        });
      } catch (error) {
        console.error('Update preferences error:', error);
        return res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update preferences',
          code: 'UPDATE_PREFERENCES_ERROR',
        });
      }
    }
  );

  /**
   * POST /api/users/password
   * Change user's password
   *
   * Requires: Authentication
   *
   * Body:
   *   - currentPassword: Current password
   *   - newPassword: New password
   */
  router.post(
    '/password',
    authMiddleware.requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
            code: 'NOT_AUTHENTICATED',
          });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            error: 'Current password and new password are required',
            code: 'MISSING_FIELDS',
          });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'New password must be at least 8 characters long',
            code: 'WEAK_PASSWORD',
          });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(newPassword)) {
          return res.status(400).json({
            success: false,
            error:
              'New password must contain at least one uppercase letter, one lowercase letter, and one number',
            code: 'WEAK_PASSWORD',
          });
        }

        // Verify current password
        const { AuthService } = await import('@care-commons/core');
        const authService = new AuthService(db);

        // Get user email
        const userResult = await db.query(
          'SELECT email FROM users WHERE id = $1',
          [req.user.userId]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND',
          });
        }

        const email = userResult.rows[0].email;

        // Verify current password by attempting authentication
        try {
          await authService.authenticateWithPassword(
            email,
            currentPassword,
            req.ip,
            req.headers['user-agent']
          );
        } catch (error) {
          return res.status(401).json({
            success: false,
            error: 'Current password is incorrect',
            code: 'INVALID_PASSWORD',
          });
        }

        // Hash new password
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.query(
          `UPDATE users
           SET password_hash = $1, updated_at = NOW()
           WHERE id = $2`,
          [hashedPassword, req.user.userId]
        );

        return res.json({
          success: true,
          message: 'Password changed successfully',
        });
      } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to change password',
          code: 'CHANGE_PASSWORD_ERROR',
        });
      }
    }
  );

  return router;
}

export default createUserRouter;
