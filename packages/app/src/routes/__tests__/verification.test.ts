/**
 * Email Verification Routes Tests
 *
 * Tests for email verification workflow API endpoints.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/redundant-type-aliases */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '@care-commons/core';
import type { Router } from 'express';

// Helper to call Express route handlers (they expect req, res, next)
async function callHandler(handler: any, req: any, res: any): Promise<void> {
  const next = vi.fn()!;
  await handler(req, res, next)!;
}

// Type for Express Router stack layer
type RouterLayer = any;

// Mock core module
const mockVerifyEmail = vi.fn()!;
const mockResendVerificationEmail = vi.fn()!;

vi.mock('@care-commons/core', async () => {
  const actual = await vi.importActual('@care-commons/core')!;
  return {
    ...actual,
    EmailVerificationService: vi.fn().mockImplementation(function () {
      return {
        verifyEmail: mockVerifyEmail,
        resendVerificationEmail: mockResendVerificationEmail,
      };
    }),
    AuthMiddleware: vi.fn().mockImplementation(function () {
      return {
        requireAuth: (_req: any, _res: any, next: any) => {
          _req.user = {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            organizationId: '223e4567-e89b-12d3-a456-426614174000',
            roles: ['user'],
            permissions: [],
          };
          next()!;
        },
      };
    }),
    ValidationError: class ValidationError extends Error {
      constructor(message: string) {
        super(message)!;
        this.name = 'ValidationError';
      }
    },
    NotFoundError: class NotFoundError extends Error {
      constructor(message: string) {
        super(message)!;
        this.name = 'NotFoundError';
      }
    },
  };
})!;

// Import after mocking
import { createVerificationRouter } from '../verification.js';

describe('Verification Routes', () => {
  let mockDb: Database;
  let router: Router;

  beforeEach(() => {
    mockDb = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      getPool: vi.fn().mockReturnValue({}),
    } as unknown as Database;

    router = createVerificationRouter(mockDb)!;
    
    // Reset mocks
    mockVerifyEmail.mockReset()!;
    mockResendVerificationEmail.mockReset()!;
  })!;

  describe('Router Configuration', () => {
    it('should create router with expected routes', () => {
      expect(router).toBeDefined()!;

      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }))!;

      expect(routes.length).toBeGreaterThan(0)!;
    })!;

    it('should have POST /verify-email endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }))!;

      const verifyRoute = routes.find(
        (r: any) => r.path === '/verify-email' && r.methods.includes('post')
      )!;
      expect(verifyRoute).toBeDefined()!;
    })!;

    it('should have POST /resend-verification endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }))!;

      const resendRoute = routes.find(
        (r: any) => r.path === '/resend-verification' && r.methods.includes('post')
      )!;
      expect(resendRoute).toBeDefined()!;
    })!;
  })!;

  describe('POST /verify-email', () => {
    it('should verify email with valid token', async () => {
      mockVerifyEmail.mockResolvedValue(null);

      // Create mock request/response
      const req = {
        body: { token: 'valid-verification-token' },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      // Get the route handler
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/verify-email'
      )!;
      const handler = route.route.stack[0].handle;

      await callHandler(handler, req, res)!;

      expect(mockVerifyEmail).toHaveBeenCalledWith('valid-verification-token')!;
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully! You can now log in.',
      })!;
    })!;

    it('should return 400 for missing token', async () => {
      const req = {
        body: {},
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/verify-email'
      )!;
      const handler = route!.route!.stack[0].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(400)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Verification token is required',
      })!;
    })!;

    it('should return 400 for empty token', async () => {
      const req = {
        body: { token: '' },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/verify-email'
      )!;
      const handler = route!.route!.stack[0].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(400)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Verification token is required',
      })!;
    })!;

    it('should return 400 for non-string token', async () => {
      const req = {
        body: { token: 12345 },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/verify-email'
      )!;
      const handler = route!.route!.stack[0].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(400)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Verification token is required',
      })!;
    })!;

    it('should handle ValidationError from service', async () => {
      // Import the mocked error class
      const { ValidationError } = await import('@care-commons/core')!;
      mockVerifyEmail.mockRejectedValue(new ValidationError('Token expired or invalid'))!;

      const req = {
        body: { token: 'expired-token' },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/verify-email'
      )!;
      const handler = route!.route!.stack[0].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(400)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired or invalid',
      })!;
    })!;

    it('should handle unexpected errors', async () => {
      mockVerifyEmail.mockRejectedValue(new Error('Database error'))!;

      const req = {
        body: { token: 'some-token' },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/verify-email'
      )!;
      const handler = route!.route!.stack[0].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(500)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to verify email',
      })!;
    })!;
  })!;

  describe('POST /resend-verification', () => {
    it('should resend verification email for authenticated user', async () => {
      mockResendVerificationEmail.mockResolvedValue(null);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
        },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      // Get the route handler (skip middleware, get actual handler)
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/resend-verification'
      )!;
      // The handler is after the auth middleware
      const handler = route!.route!.stack[route!.route!.stack.length - 1].handle;

      await callHandler(handler, req, res)!;

      expect(mockResendVerificationEmail).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')!;
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email sent! Please check your inbox.',
      })!;
    })!;

    it('should handle ValidationError (already verified)', async () => {
      const { ValidationError } = await import('@care-commons/core')!;
      mockResendVerificationEmail.mockRejectedValue(new ValidationError('Email already verified'))!;

      const req = {
        user: { userId: '123e4567-e89b-12d3-a456-426614174000' },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/resend-verification'
      )!;
      const handler = route!.route!.stack[route!.route!.stack.length - 1].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(400)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email already verified',
      })!;
    })!;

    it('should handle NotFoundError (user not found)', async () => {
      const { NotFoundError } = await import('@care-commons/core')!;
      mockResendVerificationEmail.mockRejectedValue(new NotFoundError('User not found'))!;

      const req = {
        user: { userId: 'nonexistent-user-id' },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/resend-verification'
      )!;
      const handler = route!.route!.stack[route!.route!.stack.length - 1].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(404)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      })!;
    })!;

    it('should handle unexpected errors', async () => {
      mockResendVerificationEmail.mockRejectedValue(new Error('SMTP failure'))!;

      const req = {
        user: { userId: '123e4567-e89b-12d3-a456-426614174000' },
      } as any;
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/resend-verification'
      )!;
      const handler = route!.route!.stack[route!.route!.stack.length - 1].handle;

      await callHandler(handler, req, res)!;

      expect(res.status).toHaveBeenCalledWith(500)!;
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to resend verification email',
      })!;
    })!;
  })!;

  describe('Middleware Integration', () => {
    it('should have auth middleware on resend-verification route', () => {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/resend-verification'
      )!;
      
      // Should have multiple handlers (middleware + actual handler)
      expect(route).toBeDefined()!;
      expect(route?.route?.stack.length).toBeGreaterThan(1)!;
    })!;

    it('should not require auth for verify-email route', () => {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/verify-email'
      )!;
      
      // Should only have one handler (no middleware)
      expect(route).toBeDefined()!;
      expect(route?.route?.stack.length).toBe(1)!;
    })!;
  })!;
})!;
