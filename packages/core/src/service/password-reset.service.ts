/**
 * Secure Password Reset Service
 *
 * Implements secure password reset flow with:
 * - Cryptographically secure tokens
 * - Token hashing for storage
 * - Time-limited tokens (1 hour expiration)
 * - One-time use tokens
 * - Session invalidation after password change
 * - No user enumeration (consistent responses)
 */

import crypto from 'node:crypto';
import { Database } from '../db/connection.js';
import { PasswordUtils } from '../utils/password-utils.js';

/**
 * Password reset request result
 */
export interface PasswordResetRequest {
  success: boolean;
  token?: string; // Only for internal use, send via email
}

/**
 * Password reset validation result
 */
export interface PasswordResetValidation {
  valid: boolean;
  userId?: string;
  email?: string;
}

/**
 * Password Reset Service
 */
export class PasswordResetService {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  /**
   * Request a password reset
   * Generates a secure token and stores hashed version in database
   *
   * Security features:
   * - Returns success even if email doesn't exist (prevents user enumeration)
   * - Tokens are cryptographically secure (32 random bytes)
   * - Only hashed tokens are stored in database
   * - Tokens expire after 1 hour
   * - Rate limited (handled by rate-limit middleware)
   *
   * @param email - User's email address
   * @returns Password reset request result with token (for email sending)
   */
  async requestReset(email: string): Promise<PasswordResetRequest> {
    // Look up user by email
    const userQuery = `
      SELECT id, email, status
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;

    const userResult = await this.database.query(userQuery, [email.toLowerCase()]);
    const user = userResult.rows[0] as Record<string, unknown> | undefined;

    // If user doesn't exist, return success anyway (prevent enumeration)
    // Still generate token to maintain consistent timing
    if (user === undefined) {
      // Generate token but don't store it (timing attack prevention)
      crypto.randomBytes(32).toString('hex');

      // Return success to prevent user enumeration
      return { success: true };
    }

    // Check if user account is active
    if (user['status'] !== 'ACTIVE') {
      // Don't reveal account status
      return { success: true };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash token for storage (protect against database compromise)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Calculate expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 3600000);

    // Delete any existing reset tokens for this user
    await this.database.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user['id']]
    );

    // Store hashed token with expiration
    const insertQuery = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
    `;

    await this.database.query(insertQuery, [
      user['id'],
      hashedToken,
      expiresAt
    ]);

    // Return token for email sending (only returned internally, never to client)
    return {
      success: true,
      token
    };
  }

  /**
   * Validate a password reset token
   * Checks if token exists, is not expired, and has not been used
   *
   * @param token - Reset token from email link
   * @returns Validation result with user info if valid
   */
  async validateToken(token: string): Promise<PasswordResetValidation> {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const query = `
      SELECT
        prt.user_id,
        prt.expires_at,
        u.email,
        u.status
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE prt.token = $1
        AND prt.expires_at > NOW()
        AND u.deleted_at IS NULL
    `;

    const result = await this.database.query(query, [hashedToken]);
    const resetToken = result.rows[0] as Record<string, unknown> | undefined;

    if (resetToken === undefined) {
      return { valid: false };
    }

    // Check if user is still active
    if (resetToken['status'] !== 'ACTIVE') {
      return { valid: false };
    }

    return {
      valid: true,
      userId: resetToken['user_id'] as string,
      email: resetToken['email'] as string
    };
  }

  /**
   * Reset password using valid token
   * Updates password, invalidates token, and revokes all user sessions
   *
   * Security features:
   * - Validates token before reset
   * - Uses secure password hashing
   * - Invalidates all existing sessions (security best practice)
   * - Deletes used token (one-time use)
   *
   * @param token - Reset token from email link
   * @param newPassword - New password (will be hashed)
   * @returns Success status
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Validate token first
    const validation = await this.validateToken(token);

    if (!validation.valid || validation.userId === undefined) {
      return false;
    }

    // Start transaction
    await this.database.query('BEGIN');

    try {
      // Hash the new password
      const hashedPassword = PasswordUtils.hashPassword(newPassword);

      // Update user's password
      await this.database.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, validation.userId]
      );

      // Invalidate all existing sessions by incrementing token_version
      await this.database.query(
        'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
        [validation.userId]
      );

      // Delete the used reset token (one-time use)
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      await this.database.query(
        'DELETE FROM password_reset_tokens WHERE token = $1',
        [hashedToken]
      );

      // Delete all refresh tokens for this user (additional security)
      await this.database.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [validation.userId]
      );

      await this.database.query('COMMIT');

      return true;
    } catch (error) {
      await this.database.query('ROLLBACK');
      console.error('Password reset failed:', error);
      return false;
    }
  }

  /**
   * Clean up expired password reset tokens
   * Should be run periodically (e.g., daily cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.database.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < NOW()'
    );

    return result.rowCount ?? 0;
  }

  /**
   * Cancel all pending password reset requests for a user
   * Useful when user successfully logs in or requests account lock
   *
   * @param userId - User ID
   * @returns Number of tokens deleted
   */
  async cancelResetRequests(userId: string): Promise<number> {
    const result = await this.database.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [userId]
    );

    return result.rowCount ?? 0;
  }
}

/**
 * Singleton instance
 */
let passwordResetServiceInstance: PasswordResetService | null = null;

export function getPasswordResetService(database: Database): PasswordResetService {
  passwordResetServiceInstance ??= new PasswordResetService(database);
  return passwordResetServiceInstance;
}
