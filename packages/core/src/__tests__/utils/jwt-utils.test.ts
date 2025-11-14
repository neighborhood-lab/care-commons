/**
 * JWT Utilities Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sign } from 'jsonwebtoken';
import { JWTUtils, type TokenPayload } from '../../utils/jwt-utils';

// Set up test environment variables
const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long-for-security';
const TEST_JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-characters-long';

describe('JWTUtils', () => {
  beforeAll(() => {
    process.env['JWT_SECRET'] = TEST_JWT_SECRET;
    process.env['JWT_REFRESH_SECRET'] = TEST_JWT_REFRESH_SECRET;
  });

  afterAll(() => {
    delete process.env['JWT_SECRET'];
    delete process.env['JWT_REFRESH_SECRET'];
  });

  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    organizationId: '123e4567-e89b-12d3-a456-426614174001',
    branchIds: ['123e4567-e89b-12d3-a456-426614174002'],
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'clients:write'],
    tokenVersion: 1
  };

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = JWTUtils.generateTokenPair(mockPayload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(15 * 60); // 15 minutes
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid access token', () => {
      const tokens = JWTUtils.generateTokenPair(mockPayload);
      const decoded = JWTUtils.verifyAccessToken(tokens.accessToken);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.organizationId).toBe(mockPayload.organizationId);
      expect(decoded.roles).toEqual(mockPayload.roles);
      expect(decoded.permissions).toEqual(mockPayload.permissions);
      expect(decoded.tokenVersion).toBe(mockPayload.tokenVersion);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTUtils.verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid access token');
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        JWTUtils.verifyAccessToken('not-a-jwt');
      }).toThrow();
    });

    it('should handle token with missing userId', () => {
      const badToken = sign(
        { email: 'test@example.com', organizationId: mockPayload.organizationId },
        TEST_JWT_SECRET,
        { issuer: 'care-commons', audience: 'care-commons-api' }
      );

      expect(() => {
        JWTUtils.verifyAccessToken(badToken);
      }).toThrow();
    });

    it('should handle token with missing email', () => {
      const badToken = sign(
        { userId: mockPayload.userId, organizationId: mockPayload.organizationId },
        TEST_JWT_SECRET,
        { issuer: 'care-commons', audience: 'care-commons-api' }
      );

      expect(() => {
        JWTUtils.verifyAccessToken(badToken);
      }).toThrow();
    });

    it('should handle token with missing organizationId', () => {
      const badToken = sign(
        { userId: mockPayload.userId, email: 'test@example.com' },
        TEST_JWT_SECRET,
        { issuer: 'care-commons', audience: 'care-commons-api' }
      );

      expect(() => {
        JWTUtils.verifyAccessToken(badToken);
      }).toThrow();
    });

    it('should default to empty arrays for missing roles/permissions', () => {
      const tokenWithoutArrays = sign(
        { userId: mockPayload.userId, email: 'test@example.com', organizationId: mockPayload.organizationId },
        TEST_JWT_SECRET,
        { issuer: 'care-commons', audience: 'care-commons-api' }
      );

      const decoded = JWTUtils.verifyAccessToken(tokenWithoutArrays);
      expect(decoded.roles).toEqual([]);
      expect(decoded.permissions).toEqual([]);
    });

    it('should default tokenVersion to 1 if missing', () => {
      const tokenWithoutVersion = sign(
        { userId: mockPayload.userId, email: 'test@example.com', organizationId: mockPayload.organizationId },
        TEST_JWT_SECRET,
        { issuer: 'care-commons', audience: 'care-commons-api' }
      );

      const decoded = JWTUtils.verifyAccessToken(tokenWithoutVersion);
      expect(decoded.tokenVersion).toBe(1);
    });

    it('should handle TokenExpiredError', async () => {
      const expiredToken = sign(
        mockPayload,
        TEST_JWT_SECRET,
        { expiresIn: '0s', issuer: 'care-commons', audience: 'care-commons-api' }
      );

      // Wait to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(() => {
        JWTUtils.verifyAccessToken(expiredToken);
      }).toThrow('Access token has expired');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const tokens = JWTUtils.generateTokenPair(mockPayload);
      const decoded = JWTUtils.verifyRefreshToken(tokens.refreshToken);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.tokenVersion).toBe(mockPayload.tokenVersion);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTUtils.verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });

    it('should handle refresh token with missing userId', () => {
      const badToken = sign(
        { tokenVersion: 1 },
        TEST_JWT_REFRESH_SECRET,
        { issuer: 'care-commons', audience: 'care-commons-api' }
      );

      expect(() => {
        JWTUtils.verifyRefreshToken(badToken);
      }).toThrow();
    });

    it('should handle refresh token with missing tokenVersion', () => {
      const badToken = sign(
        { userId: mockPayload.userId },
        TEST_JWT_REFRESH_SECRET,
        { issuer: 'care-commons', audience: 'care-commons-api' }
      );

      expect(() => {
        JWTUtils.verifyRefreshToken(badToken);
      }).toThrow();
    });

    it('should handle TokenExpiredError for refresh token', async () => {
      const expiredToken = sign(
        { userId: mockPayload.userId, tokenVersion: 1 },
        TEST_JWT_REFRESH_SECRET,
        { expiresIn: '0s', issuer: 'care-commons', audience: 'care-commons-api' }
      );

      // Wait to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(() => {
        JWTUtils.verifyRefreshToken(expiredToken);
      }).toThrow('Refresh token has expired - please login again');
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token from refresh token', async () => {
      const tokens = JWTUtils.generateTokenPair(mockPayload);

      const newAccessToken = await JWTUtils.refreshAccessToken(
        tokens.refreshToken,
        async (userId, tokenVersion) => {
          expect(userId).toBe(mockPayload.userId);
          expect(tokenVersion).toBe(mockPayload.tokenVersion);
          return mockPayload;
        }
      );

      expect(newAccessToken).toBeDefined();
      expect(typeof newAccessToken).toBe('string');

      // Verify the new token is valid
      const decoded = JWTUtils.verifyAccessToken(newAccessToken);
      expect(decoded.userId).toBe(mockPayload.userId);
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(
        JWTUtils.refreshAccessToken('invalid.token.here', async () => mockPayload)
      ).rejects.toThrow();
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      const token = JWTUtils.extractBearerToken('Bearer abc123xyz');

      expect(token).toBe('abc123xyz');
    });

    it('should return null for missing header', () => {
      const token = JWTUtils.extractBearerToken(undefined);

      expect(token).toBeNull();
    });

    it('should return null for empty string', () => {
      const token = JWTUtils.extractBearerToken('');

      expect(token).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const token = JWTUtils.extractBearerToken('Basic abc123');

      expect(token).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      const token = JWTUtils.extractBearerToken('Bearer');

      expect(token).toBeNull();
    });

    it('should return null for Bearer with only whitespace', () => {
      const token = JWTUtils.extractBearerToken('Bearer   ');

      expect(token).toBeNull();
    });
  });

  describe('decodeWithoutVerify', () => {
    it('should decode valid token without verification', () => {
      const tokens = JWTUtils.generateTokenPair(mockPayload);
      const decoded = JWTUtils.decodeWithoutVerify(tokens.accessToken);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = JWTUtils.decodeWithoutVerify('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('environment validation', () => {
    it('should throw error if JWT_SECRET not set', () => {
      const originalSecret = process.env['JWT_SECRET'];
      delete process.env['JWT_SECRET'];

      expect(() => {
        JWTUtils.generateTokenPair(mockPayload);
      }).toThrow('JWT_SECRET environment variable not set');

      process.env['JWT_SECRET'] = originalSecret;
    });

    it('should throw error if JWT_SECRET is empty string', () => {
      const originalSecret = process.env['JWT_SECRET'];
      process.env['JWT_SECRET'] = '';

      expect(() => {
        JWTUtils.generateTokenPair(mockPayload);
      }).toThrow('JWT_SECRET environment variable not set');

      process.env['JWT_SECRET'] = originalSecret;
    });

    it('should throw error if JWT_SECRET too short', () => {
      const originalSecret = process.env['JWT_SECRET'];
      process.env['JWT_SECRET'] = 'short';

      expect(() => {
        JWTUtils.generateTokenPair(mockPayload);
      }).toThrow('JWT_SECRET must be at least 32 characters');

      process.env['JWT_SECRET'] = originalSecret;
    });

    it('should throw error if JWT_REFRESH_SECRET not set', () => {
      const originalSecret = process.env['JWT_REFRESH_SECRET'];
      delete process.env['JWT_REFRESH_SECRET'];

      expect(() => {
        JWTUtils.generateTokenPair(mockPayload);
      }).toThrow('JWT_REFRESH_SECRET environment variable not set');

      process.env['JWT_REFRESH_SECRET'] = originalSecret;
    });

    it('should throw error if JWT_REFRESH_SECRET is empty string', () => {
      const originalSecret = process.env['JWT_REFRESH_SECRET'];
      process.env['JWT_REFRESH_SECRET'] = '';

      expect(() => {
        JWTUtils.generateTokenPair(mockPayload);
      }).toThrow('JWT_REFRESH_SECRET environment variable not set');

      process.env['JWT_REFRESH_SECRET'] = originalSecret;
    });

    it('should throw error if JWT_REFRESH_SECRET too short', () => {
      const originalSecret = process.env['JWT_REFRESH_SECRET'];
      process.env['JWT_REFRESH_SECRET'] = 'short';

      expect(() => {
        JWTUtils.generateTokenPair(mockPayload);
      }).toThrow('JWT_REFRESH_SECRET must be at least 32 characters');

      process.env['JWT_REFRESH_SECRET'] = originalSecret;
    });
  });
});
