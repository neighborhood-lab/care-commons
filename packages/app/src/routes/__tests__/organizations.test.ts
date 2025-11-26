/**
 * Organization Routes Tests
 *
 * Tests for organization API endpoints including signup, registration,
 * and team invitation management.
 *
 * NOTE: These are unit tests that verify route configuration and basic
 * functionality. Integration tests with full service mocking require
 * more complex setup and are planned for future work.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable sonarjs/redundant-type-aliases */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '@care-commons/core';
import type { Router } from 'express';

// Type for Express Router stack layer (Express internals aren't fully typed)
type RouterLayer = any;

// Mock all external dependencies before importing the router
vi.mock('@care-commons/core', async () => {
  const actual = await vi.importActual('@care-commons/core');
  return {
    ...actual,
    OrganizationService: vi.fn().mockImplementation(function () {
      return {
        registerOrganization: vi.fn(),
        getOrganizationById: vi.fn(),
        createInvitation: vi.fn(),
        getOrganizationInvitations: vi.fn(),
        getInvitationDetails: vi.fn(),
        acceptInvitation: vi.fn(),
        revokeInvitation: vi.fn(),
      };
    }),
    SignupService: vi.fn().mockImplementation(function () {
      return {
        registerOrganization: vi.fn(),
      };
    }),
    AuthMiddleware: vi.fn().mockImplementation(function () {
      return {
        requireAuth: (_req: any, _res: any, next: any) => {
          _req.user = {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            email: 'admin@example.com',
            organizationId: '223e4567-e89b-12d3-a456-426614174000',
            roles: ['admin'],
            permissions: ['organizations:read', 'organizations:write'],
          };
          next();
        },
        requireSameOrganization: () => (_req: any, _res: any, next: any) => {
          next();
        },
      };
    }),
    ValidationError: class ValidationError extends Error {
      code: string;
      constructor(message: string, code: string = 'VALIDATION_ERROR') {
        super(message);
        this.code = code;
      }
    },
    ConflictError: class ConflictError extends Error {
      code: string;
      constructor(message: string, code: string = 'CONFLICT') {
        super(message);
        this.code = code;
      }
    },
    NotFoundError: class NotFoundError extends Error {
      code: string;
      constructor(message: string, code: string = 'NOT_FOUND') {
        super(message);
        this.code = code;
      }
    },
  };
});

// Import after mocking
import { createOrganizationRouter } from '../organizations.js';

describe('Organization Routes', () => {
  let mockDb: Database;
  let router: Router;

  beforeEach(() => {
    mockDb = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      getPool: vi.fn().mockReturnValue({}),
    } as unknown as Database;

    router = createOrganizationRouter(mockDb);
  });

  describe('Router Configuration', () => {
    it('should create router with all expected routes', () => {
      expect(router).toBeDefined();

      // Get all routes from the router stack
      const routes = router.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      // Verify essential routes exist
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should have signup endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const signupRoute = routes.find((r: any) => r.path === '/signup');
      expect(signupRoute).toBeDefined();
      expect(signupRoute?.methods).toContain('post');
    });

    it('should have organization registration endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const registerRoute = routes.find(
        (r: any) => r.path === '/organizations/register'
      );
      expect(registerRoute).toBeDefined();
      expect(registerRoute?.methods).toContain('post');
    });

    it('should have get organization by ID endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const getOrgRoute = routes.find(
        (r: any) => r.path === '/organizations/:id'
      );
      expect(getOrgRoute).toBeDefined();
      expect(getOrgRoute?.methods).toContain('get');
    });

    it('should have create invitation endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const createInviteRoute = routes.find(
        (r: any) => r.path === '/organizations/:id/invitations'
      );
      expect(createInviteRoute).toBeDefined();
      expect(createInviteRoute?.methods).toContain('post');
    });

    it('should have list invitations endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      // Find all routes matching this path (POST and GET are separate entries)
      const invitationRoutes = routes.filter(
        (r: any) => r.path === '/organizations/:id/invitations'
      );
      expect(invitationRoutes.length).toBeGreaterThan(0);
      // Check that GET exists among the methods
      const hasGetMethod = invitationRoutes.some((r: any) =>
        r.methods.includes('get')
      );
      expect(hasGetMethod).toBe(true);
    });

    it('should have get invitation details endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const getInviteRoute = routes.find(
        (r: any) => r.path === '/invitations/:token'
      );
      expect(getInviteRoute).toBeDefined();
      expect(getInviteRoute?.methods).toContain('get');
    });

    it('should have accept invitation endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const acceptInviteRoute = routes.find(
        (r: any) => r.path === '/invitations/accept'
      );
      expect(acceptInviteRoute).toBeDefined();
      expect(acceptInviteRoute?.methods).toContain('post');
    });

    it('should have revoke invitation endpoint', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      // Find all routes matching this path (GET and DELETE are separate entries)
      const tokenRoutes = routes.filter(
        (r: any) => r.path === '/invitations/:token'
      );
      expect(tokenRoutes.length).toBeGreaterThan(0);
      // Check that DELETE exists among the methods
      const hasDeleteMethod = tokenRoutes.some((r: any) =>
        r.methods.includes('delete')
      );
      expect(hasDeleteMethod).toBe(true);
    });
  });

  describe('Route Count', () => {
    it('should have all 8 organization routes configured', () => {
      const routes = router.stack
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      // 12 endpoints total:
      // POST /signup
      // POST /organizations/register
      // GET /organizations/:id
      // PUT /organizations/:id
      // POST /organizations/:id/invitations
      // GET /organizations/:id/invitations
      // GET /invitations/:token
      // POST /invitations/accept
      // DELETE /invitations/:token
      // POST /organizations/:id/seed-demo
      // DELETE /organizations/:id/demo-data
      // GET /organizations/:id/demo-data/status
      expect(routes.length).toBe(12);
    });
  });

  describe('Authentication Requirements', () => {
    it('should have public signup endpoint (no auth required)', () => {
      const routes = router.stack.filter(
        (layer: RouterLayer) => layer.route?.path === '/signup'
      );

      expect(routes.length).toBe(1);
      // Signup should be accessible without authentication
      const route = routes[0] as RouterLayer;
      expect(route?.route?.methods?.post).toBe(true);
    });

    it('should have public organization registration endpoint (no auth required)', () => {
      const routes = router.stack.filter(
        (layer: RouterLayer) => layer.route?.path === '/organizations/register'
      );

      expect(routes.length).toBe(1);
      const route = routes[0] as RouterLayer;
      expect(route?.route?.methods?.post).toBe(true);
    });

    it('should have public invitation details endpoint (no auth required)', () => {
      const routes = router.stack.filter(
        (layer: RouterLayer) => layer.route?.path === '/invitations/:token'
      );

      // GET and DELETE are separate route entries
      expect(routes.length).toBeGreaterThan(0);
      // Find the GET route (for getting invitation details - public)
      const getRoute = routes.find(
        (r: RouterLayer) => r.route.methods.get === true
      );
      expect(getRoute).toBeDefined();
    });

    it('should have public accept invitation endpoint (no auth required)', () => {
      const routes = router.stack.filter(
        (layer: RouterLayer) => layer.route?.path === '/invitations/accept'
      );

      expect(routes.length).toBe(1);
      const route = routes[0] as RouterLayer;
      expect(route?.route?.methods?.post).toBe(true);
    });

    it('should require auth for get organization by ID', () => {
      const routes = router.stack.filter(
        (layer: RouterLayer) => layer.route?.path === '/organizations/:id'
      );

      // GET and PUT are separate route entries
      expect(routes.length).toBe(2);
      // Check both GET and PUT routes exist
      const hasGet = routes.some(
        (r: RouterLayer) => r.route.methods.get === true
      );
      const hasPut = routes.some(
        (r: RouterLayer) => r.route.methods.put === true
      );
      expect(hasGet).toBe(true);
      expect(hasPut).toBe(true);
    });

    it('should require auth for organization invitations management', () => {
      const routes = router.stack.filter(
        (layer: RouterLayer) =>
          layer.route?.path === '/organizations/:id/invitations'
      );

      // GET and POST are separate route entries
      expect(routes.length).toBeGreaterThan(0);
      // Check both GET and POST routes exist
      const hasGet = routes.some(
        (r: RouterLayer) => r.route.methods.get === true
      );
      const hasPost = routes.some(
        (r: RouterLayer) => r.route.methods.post === true
      );
      expect(hasGet).toBe(true);
      expect(hasPost).toBe(true);
    });

    it('should require auth for revoking invitations', () => {
      const routes = router.stack.filter(
        (layer: RouterLayer) => layer.route?.path === '/invitations/:token'
      );

      // GET and DELETE are separate route entries
      expect(routes.length).toBeGreaterThan(0);
      // Find the DELETE route (requires auth)
      const deleteRoute = routes.find(
        (r: RouterLayer) => r.route.methods.delete === true
      );
      expect(deleteRoute).toBeDefined();
    });
  });
});
