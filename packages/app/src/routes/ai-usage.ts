/**
 * AI Usage Routes
 *
 * API endpoints for AI usage tracking and cost visibility.
 * Provides usage statistics, value metrics, and recent call logs.
 *
 * @see Issue #1043
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import knex from 'knex';
import {
  type Database,
  AuthMiddleware,
  createAIUsageService,
  type AIProviderType,
  type UsageTimePeriod,
} from '@folkcare/core';

/**
 * Create a Knex instance for AI usage service.
 */
function getKnexInstance(): ReturnType<typeof knex> {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/folk-care-0';
  return knex({
    client: 'pg',
    connection: connectionString,
  });
}

/**
 * Query parameter validation for usage endpoints
 */
const usageQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
});

const valueMetricsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  hourlyRate: z.string().optional().transform((val) => (val !== undefined && val !== '' ? Number.parseInt(val, 10) : 3000)),
});

const recentUsageQuerySchema = z.object({
  limit: z.string().optional().transform((val) => (val !== undefined && val !== '' ? Number.parseInt(val, 10) : 50)),
  feature: z.string().optional(),
  provider: z.enum(['anthropic', 'cloudflare', 'openai', 'ollama']).optional(),
});

/**
 * Create AI usage routes
 */
export function createAIUsageRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);
  const knexDb = getKnexInstance();
  const aiUsageService = createAIUsageService(knexDb);

  /**
   * @openapi
   * /api/ai/usage/summary:
   *   get:
   *     tags:
   *       - AI
   *     summary: Get AI usage summary
   *     description: Returns aggregated AI usage statistics for the organization
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [day, week, month, quarter, year]
   *           default: month
   *         description: Time period for aggregation
   *     responses:
   *       200:
   *         description: AI usage summary
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     organizationId:
   *                       type: string
   *                     periodStart:
   *                       type: string
   *                       format: date-time
   *                     periodEnd:
   *                       type: string
   *                       format: date-time
   *                     totalRequests:
   *                       type: integer
   *                     totalTokens:
   *                       type: integer
   *                     totalCostCents:
   *                       type: integer
   *                     successRate:
   *                       type: number
   *                     byFeature:
   *                       type: array
   *                     byProvider:
   *                       type: array
   *       401:
   *         description: Not authenticated
   */
  router.get(
    '/ai/usage/summary',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const query = usageQuerySchema.safeParse(req.query);

        if (!query.success) {
          res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            details: query.error.flatten(),
          });
          return;
        }

        const summary = await aiUsageService.getUsageSummary(
          organizationId,
          query.data.period as UsageTimePeriod
        );

        res.json({
          success: true,
          data: summary,
        });
      } catch (error) {
        console.error('[AI Usage] Error fetching usage summary:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch AI usage summary',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/ai/usage/value:
   *   get:
   *     tags:
   *       - AI
   *     summary: Get AI value metrics
   *     description: Returns cost comparison showing AI vs manual process savings
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [day, week, month, quarter, year]
   *           default: month
   *         description: Time period for calculation
   *       - in: query
   *         name: hourlyRate
   *         schema:
   *           type: integer
   *           default: 3000
   *         description: Manual hourly rate in cents (default $30/hour)
   *     responses:
   *       200:
   *         description: AI value metrics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     aiCostCents:
   *                       type: integer
   *                     estimatedManualCostCents:
   *                       type: integer
   *                     savingsCents:
   *                       type: integer
   *                     savingsPercentage:
   *                       type: integer
   *                     hoursAutomated:
   *                       type: number
   *       401:
   *         description: Not authenticated
   */
  router.get(
    '/ai/usage/value',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const query = valueMetricsQuerySchema.safeParse(req.query);

        if (!query.success) {
          res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            details: query.error.flatten(),
          });
          return;
        }

        const valueMetrics = await aiUsageService.getValueMetrics(
          organizationId,
          query.data.period as UsageTimePeriod,
          query.data.hourlyRate
        );

        res.json({
          success: true,
          data: valueMetrics,
        });
      } catch (error) {
        console.error('[AI Usage] Error fetching value metrics:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch AI value metrics',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/ai/usage/recent:
   *   get:
   *     tags:
   *       - AI
   *     summary: Get recent AI usage records
   *     description: Returns recent AI inference calls for the organization
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *           maximum: 200
   *         description: Number of records to return
   *       - in: query
   *         name: feature
   *         schema:
   *           type: string
   *         description: Filter by feature name
   *       - in: query
   *         name: provider
   *         schema:
   *           type: string
   *           enum: [anthropic, cloudflare, openai, ollama]
   *         description: Filter by AI provider
   *     responses:
   *       200:
   *         description: Recent AI usage records
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       401:
   *         description: Not authenticated
   */
  router.get(
    '/ai/usage/recent',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const query = recentUsageQuerySchema.safeParse(req.query);

        if (!query.success) {
          res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            details: query.error.flatten(),
          });
          return;
        }

        const limit = Math.min(query.data.limit, 200); // Cap at 200

        const records = await aiUsageService.getRecentUsage(organizationId, {
          limit,
          featureName: query.data.feature,
          provider: query.data.provider as AIProviderType | undefined,
        });

        res.json({
          success: true,
          data: records,
        });
      } catch (error) {
        console.error('[AI Usage] Error fetching recent usage:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch recent AI usage',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/ai/usage/features:
   *   get:
   *     tags:
   *       - AI
   *     summary: Get AI feature time savings
   *     description: Returns mapping of AI features to their estimated time savings
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Feature time savings mapping
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   additionalProperties:
   *                     type: number
   *                   description: Map of feature names to minutes saved per request
   *       401:
   *         description: Not authenticated
   */
  router.get(
    '/ai/usage/features',
    authMiddleware.requireAuth,
    async (_req: Request, res: Response): Promise<void> => {
      try {
        const timeSavings = aiUsageService.getFeatureTimeSavings();

        res.json({
          success: true,
          data: timeSavings,
        });
      } catch (error) {
        console.error('[AI Usage] Error fetching feature time savings:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch AI feature time savings',
        });
      }
    }
  );

  return router;
}
