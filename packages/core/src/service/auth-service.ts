/**
 * Authentication Service
 * 
 * Production-ready authentication with:
 * - Google OAuth 2.0 (primary method)
 * - Salted password authentication (fallback/demo)
 * - JWT token management
 * - HIPAA-compliant audit logging
 * - Rate limiting and account locking
 */

import { randomUUID } from '../utils/crypto';
import { OAuth2Client } from 'google-auth-library';
import { Database } from '../db/connection';
import { UUID } from '../types/base';
import {
  NotFoundError,
  ValidationError,
  AuthenticationError
} from '../types/base';
import { PasswordUtils } from '../utils/password-utils';
import { JWTUtils, TokenPayload, TokenPair } from '../utils/jwt-utils';
import { getCacheService } from './cache.service';
import { CacheKeys, CacheTTL } from '../constants/cache-keys';
import { PermissionService } from '../permissions/permission-service';

/**
 * Google OAuth profile data
 */
export interface OAuthProfile {
  provider: 'GOOGLE';
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  locale?: string;
}

/**
 * Login result containing user info and tokens
 */
export interface LoginResult {
  user: {
    id: UUID;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
    organizationId: UUID;
  };
  tokens: TokenPair;
}

/**
 * User record from database
 */
interface UserRecord {
  id: UUID;
  organization_id: UUID;
  email: string;
  password_hash: string | null;
  first_name: string;
  last_name: string;
  roles: string[];
  permissions: string[];
  status: string;
  token_version: number;
  failed_login_attempts: number;
  locked_until: Date | null;
  oauth_provider: string | null;
  oauth_provider_id: string | null;
}

export class AuthService {
  private googleClient: OAuth2Client;
  private permissionService: PermissionService;

  // Rate limiting constants
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 30;
  private static readonly RATE_LIMIT_WINDOW_MINUTES = 15;
  private static readonly MAX_ATTEMPTS_PER_WINDOW = 10;

  constructor(private db: Database) {
    // Initialize Google OAuth client
    const googleClientId = process.env['GOOGLE_CLIENT_ID'] ?? '';
    this.googleClient = new OAuth2Client(googleClientId);

    // Initialize permission service
    this.permissionService = new PermissionService();
  }

  /**
   * Merge explicit permissions with role-based permissions
   * @private
   */
  private mergePermissions(explicitPermissions: string[], roles: string[]): string[] {
    const rolePerms = this.permissionService.getPermissionsForRoles(roles);
    const merged = new Set([...explicitPermissions, ...rolePerms]);
    return Array.from(merged);
  }

  /**
   * Authenticate with Google OAuth
   * Primary authentication method for production
   *
   * @param idToken - Google ID token from client
   * @param organizationId - Organization ID for new user registration
   * @returns Login result with user info and tokens
   * @throws ValidationError if organization required for new users
   * @throws AuthenticationError if token verification fails
   */
  async authenticateWithGoogle(
    idToken: string,
    organizationId?: UUID
  ): Promise<LoginResult> {
    // Verify Google ID token
    const profile = await this.verifyGoogleToken(idToken);

    // Check if user exists
    let user = await this.findUserByEmail(profile.email);

    if (user === null) {
      // Auto-register if organization specified
      if (organizationId === undefined || organizationId === '') {
        throw new ValidationError('Organization ID required for new users', {
          email: profile.email
        });
      }

      // Create new user from OAuth profile
      user = await this.createOAuthUser(profile, organizationId);
    } else {
      // Update OAuth fields for existing user
      await this.updateOAuthFields(user.id, profile);
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      await this.logAuthEvent(
        user.id,
        'LOGIN_FAILED',
        'GOOGLE_OAUTH',
        'FAILED',
        'Account is not active'
      );
      throw new AuthenticationError('Account is not active', {
        status: user.status
      });
    }

    // Merge explicit and role-based permissions
    const mergedPermissions = this.mergePermissions(user.permissions, user.roles);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      roles: user.roles,
      permissions: mergedPermissions,
      tokenVersion: user.token_version
    };

    const tokens = JWTUtils.generateTokenPair(tokenPayload);

    // Update last login
    await this.updateLastLogin(user.id, null, null);

    // Audit log
    await this.logAuthEvent(user.id, 'LOGIN_SUCCESS', 'GOOGLE_OAUTH', 'SUCCESS');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        roles: user.roles,
        permissions: mergedPermissions,
        organizationId: user.organization_id
      },
      tokens
    };
  }

  /**
   * Authenticate with password
   * Demo/fallback authentication method
   * 
   * @param email - User email
   * @param password - Plain text password
   * @param ipAddress - Client IP address for rate limiting
   * @param userAgent - Client user agent
   * @returns Login result with user info and tokens
   * @throws AuthenticationError if credentials invalid or account locked
   */
  async authenticateWithPassword(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    // Normalize email for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check
    await this.checkRateLimit(normalizedEmail);

    // Find user
    const user = await this.findUserByEmail(normalizedEmail);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
    if (!user || !user.password_hash) {
      // Record failed attempt (even if user doesn't exist - constant time)
      await this.recordFailedLogin(normalizedEmail, ipAddress, userAgent, 'Invalid credentials');
      throw new AuthenticationError('Invalid credentials');
    }

    // Check account lock
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (user.locked_until && new Date() < user.locked_until) {
      await this.recordFailedLogin(
        normalizedEmail,
        ipAddress,
        userAgent,
        `Account locked until ${user.locked_until.toISOString()}`
      );
      throw new AuthenticationError('Account temporarily locked', {
        lockedUntil: user.locked_until
      });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      await this.recordFailedLogin(normalizedEmail, ipAddress, userAgent, 'Account not active');
      throw new AuthenticationError('Account is not active', {
        status: user.status
      });
    }

    // Verify password
    const isValid = PasswordUtils.verifyPassword(password, user.password_hash);

    if (!isValid) {
      // Increment failed attempts
      await this.incrementFailedAttempts(user.id);
      await this.recordFailedLogin(normalizedEmail, ipAddress, userAgent, 'Invalid password');
      throw new AuthenticationError('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user.id);

    // Check if password needs rehashing
    if (PasswordUtils.needsRehash(user.password_hash)) {
      const newHash = PasswordUtils.hashPassword(password);
      await this.updatePasswordHash(user.id, newHash);
    }

    // Merge explicit and role-based permissions
    const mergedPermissions = this.mergePermissions(user.permissions, user.roles);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      roles: user.roles,
      permissions: mergedPermissions,
      tokenVersion: user.token_version
    };

    const tokens = JWTUtils.generateTokenPair(tokenPayload);

    // Update last login
    await this.updateLastLogin(user.id, ipAddress, userAgent);

    // Audit log
    await this.logAuthEvent(
      user.id,
      'LOGIN_SUCCESS',
      'PASSWORD',
      'SUCCESS',
      undefined,
      ipAddress,
      userAgent
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        roles: user.roles,
        permissions: mergedPermissions,
        organizationId: user.organization_id
      },
      tokens
    };
  }

  /**
   * Refresh access token using refresh token
   * 
   * @param refreshToken - JWT refresh token
   * @returns New access token
   * @throws AuthenticationError if token invalid or user not found
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const accessToken = await JWTUtils.refreshAccessToken(
      refreshToken,
      async (userId, tokenVersion) => {
        const user = await this.findUserById(userId);

        if (user === null) {
          throw new NotFoundError('User not found');
        }

        if (user.status !== 'ACTIVE') {
          throw new AuthenticationError('Account is not active');
        }

        if (user.token_version !== tokenVersion) {
          throw new AuthenticationError(
            'Token version mismatch - please login again',
            { expectedVersion: user.token_version, receivedVersion: tokenVersion }
          );
        }

        return {
          userId: user.id,
          email: user.email,
          organizationId: user.organization_id,
          roles: user.roles,
          permissions: user.permissions,
          tokenVersion: user.token_version
        };
      }
    );

    return { accessToken };
  }

  /**
   * Logout user and invalidate all tokens
   * 
   * @param userId - User ID to logout
   */
  async logout(userId: UUID): Promise<void> {
    // Increment token version to invalidate all existing tokens
    await this.db.query(
      `UPDATE users 
       SET token_version = token_version + 1, 
           updated_at = NOW(),
           updated_by = $1
       WHERE id = $1`,
      [userId]
    );

    await this.logAuthEvent(userId, 'LOGOUT', 'USER_INITIATED', 'SUCCESS');
  }

  /**
   * Verify Google ID token and extract profile
   * 
   * @param idToken - Google ID token
   * @returns OAuth profile data
   * @throws AuthenticationError if token verification fails
   */
  private async verifyGoogleToken(idToken: string): Promise<OAuthProfile> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env['GOOGLE_CLIENT_ID']
      });

      const payload = ticket.getPayload();

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain
      if (!payload || !payload.sub || !payload.email) {
        throw new AuthenticationError('Invalid Google token payload');
      }

      // Split name into first and last name
      const fullName = payload.name ?? '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] ?? (payload.given_name ?? '');
      const lastName = (nameParts.slice(1).join(' ') !== '' ? nameParts.slice(1).join(' ') : (payload.family_name ?? ''));

      return {
        provider: 'GOOGLE',
        providerId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
        name: fullName,
        firstName,
        lastName,
        picture: payload.picture,
        locale: payload.locale
      };
    } catch (error) {
      throw new AuthenticationError('Failed to verify Google token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Find user by email
   *
   * @param email - User email
   * @returns User record or null
   */
  private async findUserByEmail(email: string): Promise<UserRecord | null> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.userByEmail(email),
      async () => {
        const result = await this.db.query(
          `SELECT id, organization_id, email, password_hash, first_name, last_name,
                  roles, permissions, status, token_version, failed_login_attempts,
                  locked_until, oauth_provider, oauth_provider_id
           FROM users
           WHERE email = $1 AND deleted_at IS NULL`,
          [email]
        );

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return (result.rows[0] as unknown as UserRecord) ?? null;
      },
      CacheTTL.SHORT // User data changes frequently
    );
  }

  /**
   * Find user by ID
   *
   * @param userId - User ID
   * @returns User record or null
   */
  private async findUserById(userId: UUID): Promise<UserRecord | null> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.user(userId),
      async () => {
        const result = await this.db.query(
          `SELECT id, organization_id, email, password_hash, first_name, last_name,
                  roles, permissions, status, token_version, failed_login_attempts,
                  locked_until, oauth_provider, oauth_provider_id
           FROM users
           WHERE id = $1 AND deleted_at IS NULL`,
          [userId]
        );

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return (result.rows[0] as unknown as UserRecord) ?? null;
      },
      CacheTTL.SHORT // User data changes frequently
    );
  }

  /**
   * Create new user from OAuth profile
   * 
   * @param profile - OAuth profile data
   * @param organizationId - Organization ID
   * @returns New user record
   */
  private async createOAuthUser(
    profile: OAuthProfile,
    organizationId: UUID
  ): Promise<UserRecord> {
    const userId = randomUUID();

    await this.db.query(
      `INSERT INTO users (
        id, organization_id, username, email, password_hash,
        first_name, last_name, roles, permissions, status,
        oauth_provider, oauth_provider_id, oauth_email_verified,
        oauth_picture_url, oauth_locale, oauth_last_verified_at,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3, $4, NULL,
        $5, $6, $7, $8, 'ACTIVE',
        $9, $10, $11,
        $12, $13, NOW(),
        NOW(), $1, NOW(), $1
      )`,
      [
        userId,
        organizationId,
        profile.email.split('@')[0] ?? profile.email, // Username from email (fallback to full email if no @)
        profile.email,
        profile.firstName ?? profile.name,
        profile.lastName ?? '',
        ['COORDINATOR'], // Default role
        [],
        profile.provider,
        profile.providerId,
        profile.emailVerified ? 'true' : 'false',
        profile.picture,
        profile.locale
      ]
    );

    // Fetch and return created user
    const user = await this.findUserById(userId);
    if (user === null) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  /**
   * Update OAuth fields for existing user
   * 
   * @param userId - User ID
   * @param profile - OAuth profile data
   */
  private async updateOAuthFields(userId: UUID, profile: OAuthProfile): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET oauth_provider = $2,
           oauth_provider_id = $3,
           oauth_email_verified = $4,
           oauth_picture_url = $5,
           oauth_locale = $6,
           oauth_last_verified_at = NOW(),
           updated_at = NOW(),
           updated_by = $1
       WHERE id = $1`,
      [
        userId,
        profile.provider,
        profile.providerId,
        profile.emailVerified ? 'true' : 'false',
        profile.picture,
        profile.locale
      ]
    );

    // Invalidate user cache
    const cache = getCacheService();
    await cache.delPattern(CacheKeys.patterns.user(userId));
  }

  /**
   * Update last login timestamp and metadata
   * 
   * @param userId - User ID
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   */
  private async updateLastLogin(
    userId: UUID,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    await this.db.query(
      `UPDATE users 
       SET last_login_at = NOW(),
           last_login_ip = $2,
           last_login_user_agent = $3,
           updated_at = NOW(),
           updated_by = $1
       WHERE id = $1`,
      [userId, ipAddress, userAgent]
    );
  }

  /**
   * Update password hash
   * 
   * @param userId - User ID
   * @param passwordHash - New password hash
   */
  private async updatePasswordHash(userId: UUID, passwordHash: string): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET password_hash = $2,
           last_password_change_at = NOW(),
           updated_at = NOW(),
           updated_by = $1
       WHERE id = $1`,
      [userId, passwordHash]
    );

    // Invalidate user cache
    const cache = getCacheService();
    await cache.delPattern(CacheKeys.patterns.user(userId));
  }

  /**
   * Increment failed login attempts and lock account if threshold exceeded
   * 
   * @param userId - User ID
   */
  private async incrementFailedAttempts(userId: UUID): Promise<void> {
    const result = await this.db.query<{ failed_login_attempts: number }>(
      `UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1,
           last_failed_login_at = NOW(),
           locked_until = CASE
             WHEN failed_login_attempts + 1 >= $2
             THEN NOW() + INTERVAL '${AuthService.LOCKOUT_DURATION_MINUTES} minutes'
             ELSE locked_until
           END,
           updated_at = NOW(),
           updated_by = $1
       WHERE id = $1
       RETURNING failed_login_attempts`,
      [userId, AuthService.MAX_FAILED_ATTEMPTS]
    );

    const attempts = result.rows[0]?.failed_login_attempts ?? 0;

    if (attempts >= AuthService.MAX_FAILED_ATTEMPTS) {
      await this.logAuthEvent(
        userId,
        'ACCOUNT_LOCKED',
        'SYSTEM',
        'SUCCESS',
        `Account locked after ${attempts} failed attempts`
      );
    }

    // Invalidate user cache
    const cache = getCacheService();
    await cache.delPattern(CacheKeys.patterns.user(userId));
  }

  /**
   * Reset failed login attempts
   * 
   * @param userId - User ID
   */
  private async resetFailedAttempts(userId: UUID): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = NOW(),
           updated_by = $1
       WHERE id = $1`,
      [userId]
    );

    // Invalidate user cache
    const cache = getCacheService();
    await cache.delPattern(CacheKeys.patterns.user(userId));
  }

  /**
   * Check rate limiting for login attempts
   * 
   * @param email - Email being attempted
   * @throws AuthenticationError if rate limit exceeded
   */
  private async checkRateLimit(email: string): Promise<void> {
    const result = await this.db.query<{ attempt_count: number }>(
      `SELECT COUNT(*) as attempt_count
       FROM auth_events
       WHERE email = $1
         AND timestamp > NOW() - INTERVAL '${AuthService.RATE_LIMIT_WINDOW_MINUTES} minutes'
         AND result = 'FAILED'
         AND (failure_reason = 'Invalid credentials' OR failure_reason = 'Invalid password')`,
      [email]
    );

    const attemptCount = Number(result.rows[0]?.attempt_count ?? 0);

    if (attemptCount >= AuthService.MAX_ATTEMPTS_PER_WINDOW) {
      throw new AuthenticationError(
        `Too many login attempts. Please try again in ${AuthService.RATE_LIMIT_WINDOW_MINUTES} minutes.`,
        { attemptCount, windowMinutes: AuthService.RATE_LIMIT_WINDOW_MINUTES }
      );
    }
  }

  /**
   * Record failed login attempt
   * 
   * @param email - Email attempted
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @param reason - Failure reason
   */
  private async recordFailedLogin(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO auth_events (
        event_type, auth_method, email, ip_address, user_agent, result, failure_reason
      ) VALUES ($1, $2, $3, $4, $5, 'FAILED', $6)`,
      ['LOGIN_FAILED', 'PASSWORD', email, ipAddress, userAgent, reason]
    );
  }

  /**
   * Log authentication event for audit trail
   * 
   * @param userId - User ID (null for failed logins)
   * @param eventType - Event type
   * @param authMethod - Authentication method
   * @param result - Result status
   * @param failureReason - Reason for failure (if applicable)
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   */
  private async logAuthEvent(
    userId: string | null,
    eventType: string,
    authMethod: string,
    result: string,
    failureReason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO auth_events (
        id, user_id, event_type, auth_method, result, failure_reason, ip_address, user_agent
      ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)`,
      [userId, eventType, authMethod, result, failureReason, ipAddress, userAgent]
    );
  }
}
