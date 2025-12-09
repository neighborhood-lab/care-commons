/**
 * Admin routes for system management and monitoring
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import knex from 'knex';
import { getCacheService } from '@folkcare/core/service/cache.service';
import { createAIUsageRepository } from '@folkcare/core/ai';
import { requireAuth } from '../middleware/auth-context';

/**
 * Create a Knex instance for repository services that need it.
 */
function getKnexInstance(): ReturnType<typeof knex> {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/folk-care-0';
  return knex({
    client: 'pg',
    connection: connectionString,
  });
}

const router: RouterType = Router();

// Apply authentication to all admin routes
router.use(requireAuth);

/**
 * Get cache statistics
 *
 * @route GET /admin/cache/stats
 * @security Requires admin role (not yet implemented)
 */
router.get('/cache/stats', async (_req, res) => {
  try {
    const cache = getCacheService();
    const stats = await cache.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * Clear cache
 *
 * @route POST /admin/cache/clear
 * @security Requires admin role (not yet implemented)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const cache = getCacheService();
    const { pattern } = req.body as { pattern?: string };

    if (pattern !== undefined) {
      await cache.delPattern(pattern);
      res.json({ message: `Cleared cache for pattern: ${pattern}` });
    } else {
      await cache.clearAll();
      res.json({ message: 'Cleared all cache' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// =============================================================================
// AI Usage Tracking Endpoints
// =============================================================================

const aiUsageQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  featureName: z.string().optional(),
  category: z.enum(['safetyCritical', 'analysis', 'generation', 'embeddings']).optional(),
  provider: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Get AI usage records for an organization
 *
 * @route GET /admin/ai-usage/:organizationId
 * @security Requires admin role
 */
router.get('/ai-usage/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const query = aiUsageQuerySchema.parse(req.query);

    const db = getKnexInstance();
    const repository = createAIUsageRepository(db);

    const records = await repository.getUsage(
      {
        organizationId,
        startDate: query.startDate !== undefined ? new Date(query.startDate) : undefined,
        endDate: query.endDate !== undefined ? new Date(query.endDate) : undefined,
        featureName: query.featureName,
        category: query.category,
        provider: query.provider,
      },
      query.limit,
      query.offset
    );

    res.json({ records, count: records.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.issues });
      return;
    }
    console.error('Error getting AI usage:', error);
    res.status(500).json({ error: 'Failed to get AI usage' });
  }
});

/**
 * Get current month AI usage stats for an organization
 *
 * @route GET /admin/ai-usage/:organizationId/current-month
 * @security Requires admin role
 */
router.get('/ai-usage/:organizationId/current-month', async (req, res) => {
  try {
    const { organizationId } = req.params;

    const db = getKnexInstance();
    const repository = createAIUsageRepository(db);

    const stats = await repository.getCurrentMonthStats(organizationId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting current month AI stats:', error);
    res.status(500).json({ error: 'Failed to get current month AI stats' });
  }
});

/**
 * Get monthly AI usage summary for an organization
 *
 * @route GET /admin/ai-usage/:organizationId/monthly-summary
 * @security Requires admin role
 */
router.get('/ai-usage/:organizationId/monthly-summary', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const rawMonths = Number(req.query.months);
    const months = Number.isNaN(rawMonths) || rawMonths === 0 ? 6 : rawMonths;

    const db = getKnexInstance();
    const repository = createAIUsageRepository(db);

    const summary = await repository.getMonthlySummary(organizationId, months);
    res.json({ summary });
  } catch (error) {
    console.error('Error getting monthly AI summary:', error);
    res.status(500).json({ error: 'Failed to get monthly AI summary' });
  }
});

/**
 * Get AI cost breakdown by provider/model for an organization
 *
 * @route GET /admin/ai-usage/:organizationId/cost-breakdown
 * @security Requires admin role
 */
router.get('/ai-usage/:organizationId/cost-breakdown', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const startDate = typeof req.query.startDate === 'string'
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = typeof req.query.endDate === 'string' ? new Date(req.query.endDate) : new Date();

    const db = getKnexInstance();
    const repository = createAIUsageRepository(db);

    const breakdown = await repository.getCostBreakdown(organizationId, startDate, endDate);
    res.json({ breakdown, startDate, endDate });
  } catch (error) {
    console.error('Error getting AI cost breakdown:', error);
    res.status(500).json({ error: 'Failed to get AI cost breakdown' });
  }
});

/**
 * Get AI feature usage statistics for an organization
 *
 * @route GET /admin/ai-usage/:organizationId/feature-usage
 * @security Requires admin role
 */
router.get('/ai-usage/:organizationId/feature-usage', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const startDate = typeof req.query.startDate === 'string'
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = typeof req.query.endDate === 'string' ? new Date(req.query.endDate) : new Date();

    const db = getKnexInstance();
    const repository = createAIUsageRepository(db);

    const usage = await repository.getFeatureUsage(organizationId, startDate, endDate);
    res.json({ usage, startDate, endDate });
  } catch (error) {
    console.error('Error getting AI feature usage:', error);
    res.status(500).json({ error: 'Failed to get AI feature usage' });
  }
});

export default router;
