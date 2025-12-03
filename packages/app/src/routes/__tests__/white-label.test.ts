/**
 * White-Label Routes Tests
 *
 * Tests for organization branding and feature flag management endpoints.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/redundant-type-aliases */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '@folkcare/core';
import type { Router } from 'express';

// Type for Express Router stack layer
type RouterLayer = any;

// Mock services
const mockGetBranding = vi.fn();
const mockGetCompiledTheme = vi.fn();
const mockUpsertBranding = vi.fn();
const mockGetFeatureFlags = vi.fn();
const mockIsFeatureEnabled = vi.fn();
const mockEvaluateFeature = vi.fn();
const mockCreateFeatureFlag = vi.fn();
const mockUpdateFeatureFlag = vi.fn();
const mockDeleteFeatureFlag = vi.fn();

vi.mock('@folkcare/core', async () => {
  const actual = await vi.importActual('@folkcare/core');
  return {
    ...actual,
    asyncHandler: (fn: any) => fn,
    AuthMiddleware: vi.fn().mockImplementation(function () {
      return {
        requireAuth: (_req: any, _res: any, next: any) => {
          _req.user = {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            organizationId: '223e4567-e89b-12d3-a456-426614174000',
            roles: ['SUPER_ADMIN'],
            permissions: [],
          };
          next();
        },
        requireRole: () => (_req: any, _res: any, next: any) => {
          next();
        },
      };
    }),
    BrandingRepository: vi.fn().mockImplementation(function () {
      return {};
    }),
    FeatureFlagRepository: vi.fn().mockImplementation(function () {
      return {
        createFeatureFlag: mockCreateFeatureFlag,
        updateFeatureFlag: mockUpdateFeatureFlag,
        deleteFeatureFlag: mockDeleteFeatureFlag,
      };
    }),
    WhiteLabelService: vi.fn().mockImplementation(function () {
      return {
        getBranding: mockGetBranding,
        getCompiledTheme: mockGetCompiledTheme,
        upsertBranding: mockUpsertBranding,
        getFeatureFlags: mockGetFeatureFlags,
        isFeatureEnabled: mockIsFeatureEnabled,
        evaluateFeature: mockEvaluateFeature,
      };
    }),
  };
});

// Import after mocking
import { createWhiteLabelRouter } from '../white-label.js';

// Helper to call Express route handlers
async function callHandler(handler: any, req: any, res: any) {
  const next = vi.fn();
  await handler(req, res, next);
}

describe('White-Label Routes', () => {
  let mockDb: Database;
  let router: Router;

  beforeEach(() => {
    mockDb = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      getPool: vi.fn().mockReturnValue({}),
    } as unknown as Database;

    router = createWhiteLabelRouter(mockDb);

    // Reset mocks
    mockGetBranding.mockReset();
    mockGetCompiledTheme.mockReset();
    mockUpsertBranding.mockReset();
    mockGetFeatureFlags.mockReset();
    mockIsFeatureEnabled.mockReset();
    mockEvaluateFeature.mockReset();
    mockCreateFeatureFlag.mockReset();
    mockUpdateFeatureFlag.mockReset();
    mockDeleteFeatureFlag.mockReset();
  });

  describe('Router Configuration', () => {
    it('should create router with expected routes', () => {
      expect(router).toBeDefined();

      const routes = (router.stack as RouterLayer[])
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      expect(routes.length).toBeGreaterThan(0);
    });

    it('should have GET /branding endpoint', () => {
      const routes = (router.stack as RouterLayer[])
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const brandingRoute = routes.find(
        (r: any) => r.path === '/branding' && r.methods.includes('get')
      );
      expect(brandingRoute).toBeDefined();
    });

    it('should have GET /theme endpoint', () => {
      const routes = (router.stack as RouterLayer[])
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const themeRoute = routes.find(
        (r: any) => r.path === '/theme' && r.methods.includes('get')
      );
      expect(themeRoute).toBeDefined();
    });

    it('should have feature flag endpoints', () => {
      const routes = (router.stack as RouterLayer[])
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const featuresRoute = routes.find(
        (r: any) => r.path === '/features' && r.methods.includes('get')
      );
      expect(featuresRoute).toBeDefined();
    });
  });

  describe('GET /branding', () => {
    function getBrandingHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/branding' && layer.route?.methods?.get
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should return organization branding', async () => {
      const mockBranding = {
        id: 'branding-1',
        organizationId: '223e4567-e89b-12d3-a456-426614174000',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#123456',
      };
      mockGetBranding.mockResolvedValue(mockBranding);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
      } as any;
      const res = { json: vi.fn() } as any;

      await callHandler(getBrandingHandler(), req, res);

      expect(mockGetBranding).toHaveBeenCalledWith('223e4567-e89b-12d3-a456-426614174000');
      expect(res.json).toHaveBeenCalledWith(mockBranding);
    });

    it('should return null when no branding exists', async () => {
      mockGetBranding.mockResolvedValue(null);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
      } as any;
      const res = { json: vi.fn() } as any;

      await callHandler(getBrandingHandler(), req, res);

      expect(res.json).toHaveBeenCalledWith(null);
    });
  });

  describe('GET /theme', () => {
    function getThemeHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/theme' && layer.route?.methods?.get
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should return compiled theme for authenticated user', async () => {
      const mockTheme = {
        primaryColor: '#123456',
        secondaryColor: '#654321',
        fontFamily: 'Arial',
      };
      mockGetCompiledTheme.mockResolvedValue(mockTheme);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
      } as any;
      const res = { json: vi.fn() } as any;

      await callHandler(getThemeHandler(), req, res);

      expect(mockGetCompiledTheme).toHaveBeenCalledWith('223e4567-e89b-12d3-a456-426614174000');
      expect(res.json).toHaveBeenCalledWith(mockTheme);
    });

    it('should return default theme for unauthenticated user', async () => {
      const mockDefaultTheme = {
        primaryColor: '#000000',
        fontFamily: 'System',
      };
      mockGetCompiledTheme.mockResolvedValue(mockDefaultTheme);

      const req = { user: undefined } as any;
      const res = { json: vi.fn() } as any;

      await callHandler(getThemeHandler(), req, res);

      expect(mockGetCompiledTheme).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000000');
      expect(res.json).toHaveBeenCalledWith(mockDefaultTheme);
    });
  });

  describe('PUT /branding', () => {
    function getBrandingPutHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/branding' && layer.route?.methods?.put
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should upsert organization branding', async () => {
      const mockUpdatedBranding = {
        id: 'branding-1',
        organizationId: '223e4567-e89b-12d3-a456-426614174000',
        logoUrl: 'https://example.com/new-logo.png',
        primaryColor: '#ABCDEF',
      };
      mockUpsertBranding.mockResolvedValue(mockUpdatedBranding);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        body: {
          logoUrl: 'https://example.com/new-logo.png',
          primaryColor: '#ABCDEF',
        },
      } as any;
      const res = { json: vi.fn() } as any;

      await callHandler(getBrandingPutHandler(), req, res);

      expect(mockUpsertBranding).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockUpdatedBranding);
    });
  });

  describe('GET /features', () => {
    function getFeaturesHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/features' && layer.route?.methods?.get
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should return feature flags for organization', async () => {
      const mockFeatures = [
        { id: 'flag-1', featureKey: 'feature_a', isEnabled: true },
        { id: 'flag-2', featureKey: 'feature_b', isEnabled: false },
      ];
      mockGetFeatureFlags.mockResolvedValue(mockFeatures);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
      } as any;
      const res = { json: vi.fn() } as any;

      await callHandler(getFeaturesHandler(), req, res);

      expect(mockGetFeatureFlags).toHaveBeenCalledWith('223e4567-e89b-12d3-a456-426614174000');
      expect(res.json).toHaveBeenCalledWith(mockFeatures);
    });
  });

  describe('GET /features/:featureKey/enabled', () => {
    function getFeatureEnabledHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/features/:featureKey/enabled'
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should return feature enabled status', async () => {
      mockIsFeatureEnabled.mockResolvedValue(true);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        params: { featureKey: 'my_feature' },
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getFeatureEnabledHandler(), req, res);

      expect(mockIsFeatureEnabled).toHaveBeenCalledWith(
        '223e4567-e89b-12d3-a456-426614174000',
        'my_feature',
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(res.json).toHaveBeenCalledWith({ featureKey: 'my_feature', isEnabled: true });
    });

    it('should return 400 when feature key is missing', async () => {
      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        params: { featureKey: '' },
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getFeatureEnabledHandler(), req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Feature key is required' });
    });
  });

  describe('GET /features/:featureKey/evaluate', () => {
    function getFeatureEvaluateHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/features/:featureKey/evaluate'
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should return feature evaluation', async () => {
      const mockEvaluation = {
        featureKey: 'my_feature',
        isEnabled: true,
        reason: 'User is in rollout',
      };
      mockEvaluateFeature.mockResolvedValue(mockEvaluation);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        params: { featureKey: 'my_feature' },
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getFeatureEvaluateHandler(), req, res);

      expect(mockEvaluateFeature).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockEvaluation);
    });
  });

  describe('POST /features', () => {
    function getCreateFeatureHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/features' && layer.route?.methods?.post
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should create a feature flag', async () => {
      const mockFeature = {
        id: 'flag-new',
        featureKey: 'new_feature',
        featureName: 'New Feature',
        isEnabled: true,
      };
      mockCreateFeatureFlag.mockResolvedValue(mockFeature);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        body: {
          featureKey: 'new_feature',
          featureName: 'New Feature',
          isEnabled: true,
        },
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getCreateFeatureHandler(), req, res);

      expect(mockCreateFeatureFlag).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockFeature);
    });
  });

  describe('PATCH /features/:id', () => {
    function getUpdateFeatureHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/features/:id' && layer.route?.methods?.patch
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should update a feature flag', async () => {
      const mockUpdatedFeature = {
        id: 'flag-1',
        featureKey: 'updated_feature',
        featureName: 'Updated Feature',
        isEnabled: false,
      };
      mockUpdateFeatureFlag.mockResolvedValue(mockUpdatedFeature);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        params: { id: 'flag-1' },
        body: { isEnabled: false },
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getUpdateFeatureHandler(), req, res);

      expect(mockUpdateFeatureFlag).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockUpdatedFeature);
    });

    it('should return 400 when feature id is missing', async () => {
      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        params: { id: '' },
        body: { isEnabled: false },
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getUpdateFeatureHandler(), req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Feature flag ID is required' });
    });
  });

  describe('DELETE /features/:id', () => {
    function getDeleteFeatureHandler() {
      const route = (router.stack as RouterLayer[]).find(
        (layer: RouterLayer) => layer.route?.path === '/features/:id' && layer.route?.methods?.delete
      )!;
      return route.route.stack[route.route.stack.length - 1].handle;
    }

    it('should delete a feature flag', async () => {
      mockDeleteFeatureFlag.mockResolvedValue(null);

      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        params: { id: 'flag-1' },
      } as any;
      const res = { send: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getDeleteFeatureHandler(), req, res);

      expect(mockDeleteFeatureFlag).toHaveBeenCalledWith('flag-1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 400 when feature id is missing', async () => {
      const req = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '223e4567-e89b-12d3-a456-426614174000',
        },
        params: { id: '' },
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      await callHandler(getDeleteFeatureHandler(), req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Feature flag ID is required' });
    });
  });
});
