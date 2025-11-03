/**
 * JWT Utilities Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JWTUtils, type TokenPayload } from '../../utils/jwt-utils.js';

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

    // Note: JWT tokens include timestamps (iat) in seconds, so tokens generated
    // in the same second will be identical. This is expected JWT behavior.
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

    it('should return null for invalid header format', () => {
      const token = JWTUtils.extractBearerToken('Basic abc123');

      expect(token).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      const token = JWTUtils.extractBearerToken('Bearer');

      expect(token).toBeNull();
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

    it('should throw error if JWT_SECRET too short', () => {
      const originalSecret = process.env['JWT_SECRET'];
      process.env['JWT_SECRET'] = 'short';

      expect(() => {
        JWTUtils.generateTokenPair(mockPayload);
      }).toThrow('JWT_SECRET must be at least 32 characters');

      process.env['JWT_SECRET'] = originalSecret;
    });
  });
});
