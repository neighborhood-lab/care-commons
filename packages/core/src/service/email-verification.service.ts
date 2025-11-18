/**
 * Email Verification Service
 * 
 * Handles email verification workflow:
 * - Generate verification tokens
 * - Send verification emails
 * - Verify tokens
 * - Mark emails as verified
 */

import { randomBytes } from 'node:crypto';
import { Database } from '../db/connection.js';
import { createEmailService } from './email-service.js';
import { UUID, ValidationError, NotFoundError } from '../types/base.js';

export interface GenerateVerificationTokenResult {
  token: string;
  expiresAt: Date;
}

/**
 * Email Verification Service
 */
export class EmailVerificationService {
  private emailService: ReturnType<typeof createEmailService>;
  
  constructor(private db: Database) {
    this.emailService = createEmailService();
  }
  
  /**
   * Generate and store verification token for a user
   * 
   * @param userId - User ID
   * @param sendEmail - Whether to send verification email (default: true)
   * @returns Token and expiration date
   */
  async generateVerificationToken(userId: UUID, sendEmail = true): Promise<GenerateVerificationTokenResult> {
    // Generate secure token
    const token = randomBytes(32).toString('hex');
    
    // Token expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Store token in database
    const query = `
      UPDATE users
      SET email_verification_token = $1,
          email_verification_expires = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING email, first_name, last_name
    `;
    
    const result = await this.db.query<{
      email: string;
      first_name: string;
      last_name: string;
    }>(query, [token, expiresAt, userId]);
    
    if (result.rows[0] === undefined) {
      throw new NotFoundError('User not found', { userId });
    }
    
    const user = result.rows[0];
    
    // Send verification email if requested
    if (sendEmail) {
      try {
        await this.emailService.sendEmailVerification({
          recipientEmail: user.email,
          recipientName: user.first_name,
          verificationToken: token,
          expiresAt: expiresAt,
        });
      } catch (error) {
        console.error('[EmailVerification] Failed to send verification email:', error);
        // Don't fail the token generation if email fails
      }
    }
    
    return { token, expiresAt };
  }
  
  /**
   * Verify email using token
   * 
   * @param token - Verification token
   * @returns User ID of verified user
   */
  async verifyEmail(token: string): Promise<UUID> {
    if (token.length === 0) {
      throw new ValidationError('Verification token is required');
    }
    
    const now = new Date();
    
    // Find user with matching token that hasn't expired
    const query = `
      UPDATE users
      SET email_verified = true,
          email_verification_token = NULL,
          email_verification_expires = NULL,
          updated_at = NOW()
      WHERE email_verification_token = $1
        AND email_verification_expires > $2
        AND deleted_at IS NULL
      RETURNING id, email, first_name
    `;
    
    const result = await this.db.query<{
      id: UUID;
      email: string;
      first_name: string;
    }>(query, [token, now]);
    
    if (result.rows[0] === undefined) {
      // Check if token exists but is expired
      const checkQuery = `
        SELECT id, email_verification_expires
        FROM users
        WHERE email_verification_token = $1
          AND deleted_at IS NULL
      `;
      
      const checkResult = await this.db.query<{
        id: UUID;
        email_verification_expires: Date;
      }>(checkQuery, [token]);
      
      if (checkResult.rows[0] !== undefined) {
        throw new ValidationError('Verification token has expired. Please request a new one.');
      }
      
      throw new ValidationError('Invalid verification token');
    }
    
    const user = result.rows[0];
    
    console.log(`[EmailVerification] Email verified for user ${user.id} (${user.email})`);
    
    return user.id;
  }
  
  /**
   * Check if user's email is verified
   * 
   * @param userId - User ID
   * @returns true if email is verified
   */
  async isEmailVerified(userId: UUID): Promise<boolean> {
    const query = `
      SELECT email_verified
      FROM users
      WHERE id = $1
        AND deleted_at IS NULL
    `;
    
    const result = await this.db.query<{ email_verified: boolean }>(query, [userId]);
    
    if (result.rows[0] === undefined) {
      throw new NotFoundError('User not found', { userId });
    }
    
    return result.rows[0].email_verified;
  }
  
  /**
   * Resend verification email
   * 
   * @param userId - User ID
   */
  async resendVerificationEmail(userId: UUID): Promise<void> {
    // Check if already verified
    const isVerified = await this.isEmailVerified(userId);
    if (isVerified) {
      throw new ValidationError('Email is already verified');
    }
    
    // Generate new token and send email
    await this.generateVerificationToken(userId, true);
  }
}
