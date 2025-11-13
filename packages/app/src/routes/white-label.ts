/**
 * White-label routes for organization branding and feature management
 */

import { Router, Request, Response } from 'express';
import {
  asyncHandler,
  Database,
  AuthMiddleware,
  BrandingRepository,
  FeatureFlagRepository,
  WhiteLabelService,
} from '@care-commons/core';
import { z } from 'zod';

export function createWhiteLabelRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Validation schemas
   
  const upsertBrandingSchema = z.object({
    logoUrl: z.string().url().optional().nullable(),
    logoDarkUrl: z.string().url().optional().nullable(),
    faviconUrl: z.string().url().optional().nullable(),
    logoSquareUrl: z.string().url().optional().nullable(),
    primaryColor: z.string().regex(/^#[\dA-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[\dA-Fa-f]{6}$/).optional().nullable(),
    accentColor: z.string().regex(/^#[\dA-Fa-f]{6}$/).optional().nullable(),
    successColor: z.string().regex(/^#[\dA-Fa-f]{6}$/).optional(),
    warningColor: z.string().regex(/^#[\dA-Fa-f]{6}$/).optional(),
    errorColor: z.string().regex(/^#[\dA-Fa-f]{6}$/).optional(),
    infoColor: z.string().regex(/^#[\dA-Fa-f]{6}$/).optional(),
    fontFamily: z.string().optional(),
    headingFontFamily: z.string().optional().nullable(),
    brandName: z.string().optional().nullable(),
    tagline: z.string().optional().nullable(),
    customCss: z.string().optional().nullable(),
    themeOverrides: z.record(z.string(), z.unknown()).optional().nullable(),
    componentOverrides: z.record(z.string(), z.unknown()).optional().nullable(),
    termsOfServiceUrl: z.string().url().optional().nullable(),
    privacyPolicyUrl: z.string().url().optional().nullable(),
    supportEmail: z.string().email().optional().nullable(),
    supportPhone: z.string().optional().nullable(),
    supportUrl: z.string().url().optional().nullable(),
    emailHeaderHtml: z.string().optional().nullable(),
    emailFooterHtml: z.string().optional().nullable(),
    emailFromName: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  });

  const createFeatureFlagSchema = z.object({
    featureKey: z.string().min(1).max(100),
    featureName: z.string().min(1).max(200),
    description: z.string().optional(),
    isEnabled: z.boolean().optional(),
    configuration: z.record(z.string(), z.unknown()).optional(),
    limits: z.record(z.string(), z.number()).optional(),
    rolloutPercentage: z.number().min(0).max(100).optional(),
    rolloutUserIds: z.array(z.string().uuid()).optional(),
    rolloutBranchIds: z.array(z.string().uuid()).optional(),
    billingTier: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE', 'CUSTOM']).optional(),
    monthlyCost: z.number().optional(),
    requiresUpgrade: z.boolean().optional(),
    dependsOn: z.array(z.string()).optional(),
    conflictsWith: z.array(z.string()).optional(),
  });
   

  // Helper to get service instances
  function getWhiteLabelService(): WhiteLabelService {
    const brandingRepo = new BrandingRepository(db);
    const featureFlagRepo = new FeatureFlagRepository(db);
    return new WhiteLabelService(brandingRepo, featureFlagRepo);
  }

  /**
   * Get organization branding
   * @route GET /api/white-label/branding
   */
  router.get(
    '/branding',
    authMiddleware.requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const service = getWhiteLabelService();
      const organizationId = req.user!.organizationId;

      const branding = await service.getBranding(organizationId);
      res.json(branding ?? null);
    })
  );

  /**
   * Get compiled theme for organization
   * @route GET /api/white-label/theme
   */
  router.get(
    '/theme',
    asyncHandler(async (req: Request, res: Response) => {
      const service = getWhiteLabelService();

      // Allow unauthenticated access for theme (for login page)
      if (req.user?.organizationId === undefined) {
        const defaultTheme = await service.getCompiledTheme('00000000-0000-0000-0000-000000000000');
        res.json(defaultTheme);
        return;
      }

      const organizationId = req.user.organizationId;
      const theme = await service.getCompiledTheme(organizationId);
      res.json(theme);
    })
  );

  /**
   * Upsert organization branding
   * @route PUT /api/white-label/branding
   */
  router.put(
    '/branding',
    authMiddleware.requireAuth,
    authMiddleware.requireRole(['ORG_ADMIN', 'SUPER_ADMIN']),
    asyncHandler(async (req: Request, res: Response) => {
      const service = getWhiteLabelService();
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const validatedData = upsertBrandingSchema.parse(req.body);
      const branding = await service.upsertBranding(organizationId, validatedData, userId);

      res.json(branding);
    })
  );

  /**
   * Get feature flags for organization
   * @route GET /api/white-label/features
   */
  router.get(
    '/features',
    authMiddleware.requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const service = getWhiteLabelService();
      const organizationId = req.user!.organizationId;

      const features = await service.getFeatureFlags(organizationId);
      res.json(features);
    })
  );

  /**
   * Check if a feature is enabled
   * @route GET /api/white-label/features/:featureKey/enabled
   */
  router.get(
    '/features/:featureKey/enabled',
    authMiddleware.requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const service = getWhiteLabelService();
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const featureKey = req.params.featureKey;

      if (featureKey === undefined || featureKey === '') {
        res.status(400).json({ error: 'Feature key is required' });
        return;
      }

      const isEnabled = await service.isFeatureEnabled(organizationId, featureKey, userId);
      res.json({ featureKey, isEnabled });
    })
  );

  /**
   * Evaluate a feature with detailed information
   * @route GET /api/white-label/features/:featureKey/evaluate
   */
  router.get(
    '/features/:featureKey/evaluate',
    authMiddleware.requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const service = getWhiteLabelService();
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const featureKey = req.params.featureKey;

      if (featureKey === undefined || featureKey === '') {
        res.status(400).json({ error: 'Feature key is required' });
        return;
      }

      const evaluation = await service.evaluateFeature(organizationId, featureKey, userId);
      res.json(evaluation);
    })
  );

  /**
   * Create a feature flag (SUPER_ADMIN only)
   * @route POST /api/white-label/features
   */
  router.post(
    '/features',
    authMiddleware.requireAuth,
    authMiddleware.requireRole(['SUPER_ADMIN']),
    asyncHandler(async (req: Request, res: Response) => {
      const featureFlagRepo = new FeatureFlagRepository(db);
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const validatedData = createFeatureFlagSchema.parse(req.body);
      const feature = await featureFlagRepo.createFeatureFlag(
        organizationId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod validation ensures type safety
        validatedData as any,
        userId
      );

      res.status(201).json(feature);
    })
  );

  /**
   * Update a feature flag (SUPER_ADMIN only)
   * @route PATCH /api/white-label/features/:id
   */
  router.patch(
    '/features/:id',
    authMiddleware.requireAuth,
    authMiddleware.requireRole(['SUPER_ADMIN']),
    asyncHandler(async (req: Request, res: Response) => {
      const featureFlagRepo = new FeatureFlagRepository(db);
      const userId = req.user!.userId;
      const id = req.params.id;

      if (id === undefined || id === '') {
        res.status(400).json({ error: 'Feature flag ID is required' });
        return;
      }

      const validatedData = createFeatureFlagSchema.partial().parse(req.body);
      const feature = await featureFlagRepo.updateFeatureFlag(
        id as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod validation ensures type safety
        validatedData as any,
        userId
      );

      res.json(feature);
    })
  );

  /**
   * Delete a feature flag (SUPER_ADMIN only)
   * @route DELETE /api/white-label/features/:id
   */
  router.delete(
    '/features/:id',
    authMiddleware.requireAuth,
    authMiddleware.requireRole(['SUPER_ADMIN']),
    asyncHandler(async (req: Request, res: Response) => {
      const featureFlagRepo = new FeatureFlagRepository(db);
      const id = req.params.id;

      if (id === undefined || id === '') {
        res.status(400).json({ error: 'Feature flag ID is required' });
        return;
      }

      await featureFlagRepo.deleteFeatureFlag(id as string);
      res.status(204).send();
    })
  );

  return router;
}

export default function (db: Database): Router {
  return createWhiteLabelRouter(db);
}
