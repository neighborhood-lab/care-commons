/**
 * Feature Flag API Routes
 *
 * Provides endpoints for feature flag management and evaluation.
 */

import { Router, type Request, type Response } from 'express';
import { getFeatureFlagService } from '@care-commons/core/feature-flags';
import type {
  FeatureFlagKey,
  FlagEvaluationContext,
  UpdateFeatureFlagPayload,
} from '@care-commons/core/feature-flags';
import type { RequestWithFeatureFlags } from '@care-commons/core/feature-flags/middleware';

/**
 * Create feature flag router
 */
export function createFeatureFlagRouter(): Router {
  const router = Router();

  /**
   * GET /api/feature-flags
   * Get all feature flags (admin only)
   */
  router.get('/feature-flags', async (_req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const flags = service.getAllFlags();

      res.json({
        flags,
        metadata: service.getMetadata(),
      });
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({
        error: 'Failed to fetch feature flags',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/feature-flags/values
   * Get evaluated flag values for current user context
   */
  router.get('/feature-flags/values', async (req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const reqWithFlags = req as RequestWithFeatureFlags;
      const context = reqWithFlags.featureFlags?.context || {};

      const values = await service.getAllFlagValues(context);

      res.json({
        values,
        context: {
          userId: context.userId,
          organizationId: context.organizationId,
          role: context.role,
          platform: context.platform,
        },
      });
    } catch (error) {
      console.error('Error evaluating feature flags:', error);
      res.status(500).json({
        error: 'Failed to evaluate feature flags',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/feature-flags/:key
   * Get specific flag details
   */
  router.get('/feature-flags/:key', async (req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const key = req.params['key'];
      if (!key) {
        res.status(400).json({ error: 'Flag key is required' });
        return;
      }
      const flag = service.getFlag(key);

      if (!flag) {
        res.status(404).json({ error: `Flag '${key}' not found` });
        return;
      }

      res.json({ flag });
    } catch (error) {
      console.error('Error fetching feature flag:', error);
      res.status(500).json({
        error: 'Failed to fetch feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/feature-flags/:key/evaluate
   * Evaluate a specific flag with custom context
   */
  router.post('/feature-flags/:key/evaluate', async (req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const { context = {} } = req.body as { context?: FlagEvaluationContext };
      const key = req.params['key'];
      if (!key) {
        res.status(400).json({ error: 'Flag key is required' });
        return;
      }

      const flag = service.getFlag(key);
      if (!flag) {
        res.status(404).json({ error: `Flag '${key}' not found` });
        return;
      }

      // Evaluate based on flag type
      let result;
      switch (flag.type) {
        case 'boolean':
          result = await service.evaluateBooleanFlag(key, context);
          break;
        case 'string':
          result = await service.evaluateStringFlag(key, context);
          break;
        case 'number':
          result = await service.getNumberFlag(key, context);
          break;
        case 'json':
          result = await service.getObjectFlag(key, context, {});
          break;
        default:
          result = await service.evaluateBooleanFlag(key, context);
      }

      res.json({ result });
    } catch (error) {
      console.error('Error evaluating feature flag:', error);
      res.status(500).json({
        error: 'Failed to evaluate feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/feature-flags/:key
   * Update a feature flag (admin only)
   */
  router.put('/feature-flags/:key', async (req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const key = req.params['key'];
      if (!key) {
        res.status(400).json({ error: 'Flag key is required' });
        return;
      }
      const updates = req.body as UpdateFeatureFlagPayload;

      const updatedFlag = service.updateFlag(key, updates);

      res.json({
        flag: updatedFlag,
        message: `Flag '${key}' updated successfully`,
      });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
        error: 'Failed to update feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/feature-flags/:key/toggle
   * Quick toggle enabled state (admin only)
   */
  router.post('/feature-flags/:key/toggle', async (req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const key = req.params['key'];
      if (!key) {
        res.status(400).json({ error: 'Flag key is required' });
        return;
      }
      const flag = service.getFlag(key);

      if (!flag) {
        res.status(404).json({ error: `Flag '${key}' not found` });
        return;
      }

      const updatedFlag = service.updateFlag(key, {
        enabled: !flag.enabled,
      });

      res.json({
        flag: updatedFlag,
        message: `Flag '${key}' ${updatedFlag.enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      res.status(500).json({
        error: 'Failed to toggle feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/feature-flags
   * Create a new feature flag (admin only)
   */
  router.post('/feature-flags', async (req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const flagData = req.body;

      const newFlag = service.createFlag(flagData);

      res.status(201).json({
        flag: newFlag,
        message: `Flag '${newFlag.key}' created successfully`,
      });
    } catch (error) {
      console.error('Error creating feature flag:', error);
      res.status(error instanceof Error && error.message.includes('already exists') ? 409 : 500).json({
        error: 'Failed to create feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /api/feature-flags/:key
   * Delete a feature flag (admin only)
   */
  router.delete('/feature-flags/:key', async (req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      const key = req.params['key'];
      if (!key) {
        res.status(400).json({ error: 'Flag key is required' });
        return;
      }
      service.deleteFlag(key);

      res.json({
        message: `Flag '${key}' deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
        error: 'Failed to delete feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/feature-flags/reload
   * Reload configuration from disk (admin only)
   */
  router.post('/feature-flags/reload', async (_req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();
      service.reloadConfig();

      res.json({
        message: 'Feature flag configuration reloaded successfully',
        metadata: service.getMetadata(),
      });
    } catch (error) {
      console.error('Error reloading feature flags:', error);
      res.status(500).json({
        error: 'Failed to reload feature flag configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/feature-flags/status
   * Get feature flag service status
   */
  router.get('/feature-flags/status', async (_req: Request, res: Response) => {
    try {
      const service = getFeatureFlagService();

      res.json({
        status: service.isReady() ? 'ready' : 'not_ready',
        metadata: service.getMetadata(),
      });
    } catch (error) {
      console.error('Error checking feature flag status:', error);
      res.status(500).json({
        error: 'Failed to check feature flag status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
