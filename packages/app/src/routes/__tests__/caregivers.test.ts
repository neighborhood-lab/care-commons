/**
 * Caregiver Routes Tests
 *
 * Tests for caregiver API endpoints including CRUD operations,
 * credential management, and compliance checking.
 * 
 * NOTE: These are unit tests that verify route configuration and basic
 * functionality. Integration tests with full service mocking require
 * more complex setup and are planned for future work.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/no-hardcoded-passwords */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '@care-commons/core';
import type { Router } from 'express';

// Mock all external dependencies before importing the router
vi.mock('@care-commons/caregiver-staff', () => ({
  CaregiverService: vi.fn().mockImplementation(() => ({
    getCurrentCaregiverProfile: vi.fn(),
    getCaregiversWithExpiringCredentials: vi.fn(),
    getCaregiverByEmployeeNumber: vi.fn(),
    getCaregiversByBranch: vi.fn(),
    listCaregivers: vi.fn(),
    getCaregiverById: vi.fn(),
    createCaregiver: vi.fn(),
    updateCaregiver: vi.fn(),
    deleteCaregiver: vi.fn(),
    getCaregiverServiceAuthorizations: vi.fn(),
    addServiceAuthorization: vi.fn(),
    validateCaregiverClientAssignment: vi.fn(),
    getCaregiverStateScreenings: vi.fn(),
    createStateScreening: vi.fn(),
    updateStateScreening: vi.fn(),
    getComplianceStatus: vi.fn(),
  })),
  CredentialExpirationService: vi.fn().mockImplementation(() => ({
    getStatusSummary: vi.fn(),
    getExpiringItems: vi.fn(),
    getCredentialAlerts: vi.fn(),
    updateAllStatuses: vi.fn(),
    canBeScheduled: vi.fn(),
  })),
  ExclusionListService: vi.fn().mockImplementation(() => ({
    checkSingleCaregiver: vi.fn(),
    checkMultipleCaregivers: vi.fn(),
    getCheckHistory: vi.fn(),
  })),
}));

vi.mock('@care-commons/core', async () => {
  const actual = await vi.importActual('@care-commons/core');
  return {
    ...actual,
    AuthMiddleware: vi.fn().mockImplementation(function() {
      return {
        requireAuth: (_req: any, _res: any, next: any) => {
          _req.user = {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            email: 'admin@example.com',
            organizationId: '223e4567-e89b-12d3-a456-426614174000',
            roles: ['admin'],
            permissions: ['caregivers:read', 'caregivers:write', 'caregivers:delete'],
          };
          next();
        },
      };
    }),
  };
});

// Import after mocking
import { createCaregiverRouter } from '../caregivers.js';

describe('Caregiver Routes', () => {
  let mockDb: Database;
  let router: Router;

  beforeEach(() => {
    mockDb = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      getPool: vi.fn().mockReturnValue({}),
    } as unknown as Database;

    router = createCaregiverRouter(mockDb);
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

      // Verify critical routes exist
      const expectedRoutes = [
        { path: '/me', method: 'get' },
        { path: '/expiring-credentials', method: 'get' },
        { path: '/employee-number/:employeeNumber', method: 'get' },
        { path: '/branch/:branchId', method: 'get' },
        { path: '/', method: 'get' },
        { path: '/:id', method: 'get' },
        { path: '/', method: 'post' },
        { path: '/:id', method: 'patch' },
        { path: '/:id', method: 'delete' },
        { path: '/:id/service-authorizations', method: 'get' },
        { path: '/:id/service-authorizations', method: 'post' },
        { path: '/:id/validate-assignment', method: 'post' },
        { path: '/:id/state-screenings', method: 'get' },
        { path: '/:id/state-screenings', method: 'post' },
        { path: '/:caregiverId/state-screenings/:screeningId', method: 'patch' },
        { path: '/:id/compliance-status', method: 'post' },
        { path: '/credentials/status-summary', method: 'get' },
        { path: '/credentials/expiring', method: 'get' },
        { path: '/credentials/alerts', method: 'get' },
        { path: '/credentials/update-all-statuses', method: 'post' },
        { path: '/:id/credentials/can-be-scheduled', method: 'post' },
        { path: '/:id/exclusion-check', method: 'post' },
        { path: '/exclusion-check/batch', method: 'post' },
        { path: '/:id/exclusion-check/history', method: 'get' },
      ];

      expectedRoutes.forEach(({ path, method }) => {
        const route = routes.find(
          (r: any) => r.path === path && r.methods.includes(method)
        );
        expect(route, `Route ${method.toUpperCase()} ${path} should exist`).toBeDefined();
      });
    });

    it('should have 24 route handlers', () => {
      const routeCount = router.stack.filter((layer: any) => layer.route).length;
      expect(routeCount).toBe(24);
    });
  });

  describe('Route Paths', () => {
    it('should expose /me endpoint for current caregiver profile', () => {
      const meRoute = router.stack.find(
        (layer: any) => layer.route?.path === '/me'
      );
      expect(meRoute).toBeDefined();
      expect((meRoute as any).route.methods.get).toBe(true);
    });

    it('should expose /expiring-credentials endpoint', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/expiring-credentials'
      );
      expect(route).toBeDefined();
      expect((route as any).route.methods.get).toBe(true);
    });

    it('should expose CRUD endpoints for caregivers', () => {
      // List
      const listRoute = router.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route.methods.get
      );
      expect(listRoute).toBeDefined();

      // Create
      const createRoute = router.stack.find(
        (layer: any) => layer.route?.path === '/' && layer.route.methods.post
      );
      expect(createRoute).toBeDefined();

      // Read
      const readRoute = router.stack.find(
        (layer: any) => layer.route?.path === '/:id' && layer.route.methods.get
      );
      expect(readRoute).toBeDefined();

      // Update
      const updateRoute = router.stack.find(
        (layer: any) => layer.route?.path === '/:id' && layer.route.methods.patch
      );
      expect(updateRoute).toBeDefined();

      // Delete
      const deleteRoute = router.stack.find(
        (layer: any) => layer.route?.path === '/:id' && layer.route.methods.delete
      );
      expect(deleteRoute).toBeDefined();
    });

    it('should expose credential management endpoints', () => {
      const credentialRoutes = [
        '/credentials/status-summary',
        '/credentials/expiring',
        '/credentials/alerts',
        '/credentials/update-all-statuses',
      ];

      credentialRoutes.forEach((path) => {
        const route = router.stack.find(
          (layer: any) => layer.route?.path === path
        );
        expect(route, `Credential route ${path} should exist`).toBeDefined();
      });
    });

    it('should expose exclusion list check endpoints', () => {
      const exclusionRoutes = [
        { path: '/:id/exclusion-check', method: 'post' },
        { path: '/exclusion-check/batch', method: 'post' },
        { path: '/:id/exclusion-check/history', method: 'get' },
      ];

      exclusionRoutes.forEach(({ path, method }) => {
        const route = router.stack.find(
          (layer: any) => layer.route?.path === path && layer.route.methods[method]
        );
        expect(route, `Exclusion route ${method.toUpperCase()} ${path} should exist`).toBeDefined();
      });
    });

    it('should expose state screening endpoints', () => {
      const screeningRoutes = [
        { path: '/:id/state-screenings', method: 'get' },
        { path: '/:id/state-screenings', method: 'post' },
        { path: '/:caregiverId/state-screenings/:screeningId', method: 'patch' },
      ];

      screeningRoutes.forEach(({ path, method }) => {
        const route = router.stack.find(
          (layer: any) => layer.route?.path === path && layer.route.methods[method]
        );
        expect(route, `Screening route ${method.toUpperCase()} ${path} should exist`).toBeDefined();
      });
    });

    it('should expose service authorization endpoints', () => {
      const authRoutes = [
        { path: '/:id/service-authorizations', method: 'get' },
        { path: '/:id/service-authorizations', method: 'post' },
      ];

      authRoutes.forEach(({ path, method }) => {
        const route = router.stack.find(
          (layer: any) => layer.route?.path === path && layer.route.methods[method]
        );
        expect(route, `Service auth route ${method.toUpperCase()} ${path} should exist`).toBeDefined();
      });
    });

    it('should expose validate-assignment endpoint', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:id/validate-assignment' && layer.route.methods.post
      );
      expect(route).toBeDefined();
    });

    it('should expose compliance-status endpoint', () => {
      const route = router.stack.find(
        (layer: any) => layer.route?.path === '/:id/compliance-status' && layer.route.methods.post
      );
      expect(route).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should have auth middleware in the router stack', () => {
      // Auth middleware is added via router.use() at the beginning
      // The auth middleware is added as a regular function, so we check if there's
      // a non-route layer in the stack
      const nonRouteLayers = router.stack.filter((layer: any) => !layer.route);
      expect(nonRouteLayers.length).toBeGreaterThan(0);
    });
  });

  describe('Route Handler Existence', () => {
    it('should have async handlers for all routes', () => {
      const routeLayers = router.stack.filter((layer: any) => layer.route);
      
      routeLayers.forEach((layer: any) => {
        const handlers = layer.route.stack;
        expect(handlers.length).toBeGreaterThan(0);
        
        // Each route should have at least one handler function
        handlers.forEach((handler: any) => {
          expect(typeof handler.handle).toBe('function');
        });
      });
    });
  });
});
