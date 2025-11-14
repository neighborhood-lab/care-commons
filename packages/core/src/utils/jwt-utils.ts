/**
 * JWT Token Utilities
 * 
 * Secure JWT token generation and verification for authentication.
 * Implements access token + refresh token pattern for security.
 */

import jwt from 'jsonwebtoken';
import { UUID } from '../types/base';

// Re-export types for convenience
type JwtPayload = jwt.JwtPayload;

/**
 * Payload stored in JWT access token
 * Contains all necessary user context for authorization
 */
export interface TokenPayload {
  userId: UUID;
  email: string;
  organizationId: UUID;
  branchIds: UUID[];
  roles: string[];
  permissions: string[];
  tokenVersion: number; // For token invalidation
}

/**
 * Complete token pair returned to client
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until access token expires
}

/**
 * Refresh token payload (minimal to reduce attack surface)
 */
export interface RefreshTokenPayload {
  userId: UUID;
  tokenVersion: number;
}

export class JWTUtils {
  // Token expiration times
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

  /**
   * Get access token secret from environment
   * @throws Error if JWT_SECRET not configured
   */
  private static getAccessTokenSecret(): string {
    const secret = process.env['JWT_SECRET'];
    if (secret === undefined || secret === '') {
      throw new Error('JWT_SECRET environment variable not set');
    }
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters for security');
    }
    return secret;
  }

  /**
   * Get refresh token secret from environment
   * @throws Error if JWT_REFRESH_SECRET not configured
   */
  private static getRefreshTokenSecret(): string {
    const secret = process.env['JWT_REFRESH_SECRET'];
    if (secret === undefined || secret === '') {
      throw new Error('JWT_REFRESH_SECRET environment variable not set');
    }
    if (secret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters for security');
    }
    return secret;
  }

  /**
   * Generate access + refresh token pair
   * 
   * Access token contains full user context and expires quickly (15m)
   * Refresh token contains minimal data and lasts longer (7d)
   * 
   * @param payload - User context to encode in access token
   * @returns Token pair with access token, refresh token, and expiry time
   */
  static generateTokenPair(payload: TokenPayload): TokenPair {
    // Generate short-lived access token with full payload
    const accessToken = jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      { 
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'care-commons',
        audience: 'care-commons-api'
      }
    );

    // Generate long-lived refresh token with minimal payload
    const refreshPayload: RefreshTokenPayload = {
      userId: payload.userId,
      tokenVersion: payload.tokenVersion
    };

    const refreshToken = jwt.sign(
      refreshPayload,
      this.getRefreshTokenSecret(),
      { 
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'care-commons',
        audience: 'care-commons-api'
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Verify and decode access token
   * 
   * @param token - JWT access token to verify
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
   static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.getAccessTokenSecret(), {
        issuer: 'care-commons',
        audience: 'care-commons-api'
      });

      // Validate payload structure - runtime safety checks
      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload structure');
      }

      const payload = decoded as JwtPayload;

      // Validate required fields - runtime safety checks
      const userId = payload.userId;
      const email = payload.email;
      const orgId = payload.organizationId;
      
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!userId || !email || !orgId) {
        throw new Error('Token missing required fields');
      }

      return {
        userId: userId as UUID,
        email: email as string,
        organizationId: orgId as UUID,
        branchIds: Array.isArray(payload.branchIds) ? (payload.branchIds as UUID[]) : [],
        roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
        permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
        tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 1
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new Error('Access token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new Error('Invalid access token');
        }
      }
      throw new Error('Failed to verify access token');
    }
  }

  /**
   * Verify and decode refresh token
   * 
   * @param token - JWT refresh token to verify
   * @returns Decoded refresh token payload
   * @throws Error if token is invalid or expired
   */
   static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.getRefreshTokenSecret(), {
        issuer: 'care-commons',
        audience: 'care-commons-api'
      });

      // Validate payload structure - runtime safety checks
      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload structure');
      }

      const payload = decoded as JwtPayload;

      // Validate required fields - runtime safety checks
      const userId = payload.userId;
      const tokenVersion = payload.tokenVersion;
      
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!userId || !tokenVersion) {
        throw new Error('Refresh token missing required fields');
      }

      return {
        userId: userId as UUID,
        tokenVersion: tokenVersion as number
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new Error('Refresh token has expired - please login again');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new Error('Invalid refresh token');
        }
      }
      throw new Error('Failed to verify refresh token');
    }
  }

  /**
   * Generate new access token from refresh token
   * 
   * This is a helper that combines refresh token verification with
   * access token generation. The caller must provide a function to
   * fetch the current user payload from the database.
   * 
   * @param refreshToken - JWT refresh token
   * @param getUserPayload - Function to fetch current user data
   * @returns New access token
   * @throws Error if refresh token is invalid or user not found
   */
  static async refreshAccessToken(
    refreshToken: string,
    getUserPayload: (userId: UUID, tokenVersion: number) => Promise<TokenPayload>
  ): Promise<string> {
    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Fetch current user payload (validates user exists and token version matches)
    const payload = await getUserPayload(decoded.userId, decoded.tokenVersion);

    // Generate new access token
    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      { 
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'care-commons',
        audience: 'care-commons-api'
      }
    );
  }

  /**
   * Extract token from Authorization header
   * 
   * @param authHeader - Authorization header value
   * @returns Token string or null if not found
   */
  static extractBearerToken(authHeader: string | undefined): string | null {
    if (authHeader === undefined || authHeader === '') {
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Return null if no token after 'Bearer '
    if (token === '' || token.trim() === '') {
      return null;
    }

    return token;
  }

  /**
   * Decode token without verification (for debugging only)
   * NEVER use this for authentication - use verifyAccessToken instead
   * 
   * @param token - JWT token to decode
   * @returns Decoded payload or null if invalid
   */
  static decodeWithoutVerify(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.getAccessTokenSecret(), { 
        ignoreExpiration: true 
      });
      return typeof decoded === 'string' ? null : decoded;
    } catch {
      return null;
    }
  }
}
