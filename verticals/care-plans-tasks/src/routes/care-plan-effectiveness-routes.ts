/**
 * Care Plan Effectiveness API Routes
 *
 * Coordinator-facing API for AI-powered care plan effectiveness scoring.
 * Helps identify which care plans are working and which need adjustment.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from '@folkcare/core';
import { AuthMiddleware } from '@folkcare/core';
import knex from 'knex';
import { CarePlanEffectivenessService } from '../services/care-plan-effectiveness-service.js';

// Validation schema for single care plan scoring
const scoreEffectivenessSchema = z.object({
  carePlanId: z.string().uuid(),
  evaluationPeriodDays: z.number().int().min(7).max(365).optional().default(90),
  includeRecommendations: z.boolean().optional().default(true),
});

// Validation schema for batch scoring
const batchScoreEffectivenessSchema = z.object({
  carePlanIds: z.array(z.string().uuid()).min(1).max(10),
  evaluationPeriodDays: z.number().int().min(7).max(365).optional().default(90),
  includeRecommendations: z.boolean().optional().default(true),
});

/**
 * Create care plan effectiveness routes
 */
export function createCarePlanEffectivenessRoutes(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Require authentication for all routes
  router.use(authMiddleware.requireAuth);

  /**
   * POST /api/care-plans/effectiveness
   * Score care plan effectiveness using AI analysis
   */
  router.post('/care-plans/effectiveness', async (req: Request, res: Response): Promise<void> => {
    // Create a new Knex instance for this request
    const knexDb = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
    });

    try {
      // Get organization from authenticated user
      const organizationId = req.user?.organizationId;
      if (typeof organizationId !== 'string') {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - organization context required',
        });
        return;
      }

      // Validate request body
      const data = scoreEffectivenessSchema.parse(req.body);

      // Initialize service
      const effectivenessService = new CarePlanEffectivenessService(knexDb);

      // Score effectiveness
      const score = await effectivenessService.scoreEffectiveness({
        carePlanId: data.carePlanId,
        organizationId,
        evaluationPeriodDays: data.evaluationPeriodDays,
        includeRecommendations: data.includeRecommendations,
      });

      res.json({
        success: true,
        data: score,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      } else {
        const err = error as Error & { statusCode?: number };

        if (err.message.includes('ANTHROPIC_API_KEY')) {
          res.status(503).json({
            success: false,
            error: 'AI service not configured',
          });
        } else if (err.message.includes('not found') || err.message.includes('Not found')) {
          res.status(404).json({
            success: false,
            error: err.message,
          });
        } else {
          console.error('Error scoring care plan effectiveness:', error);
          res.status(500).json({
            success: false,
            error: err.message || 'Failed to score care plan effectiveness',
          });
        }
      }
    } finally {
      // Clean up database connection
      await knexDb.destroy();
    }
  });

  /**
   * POST /api/care-plans/effectiveness/batch
   * Score multiple care plans for comparison
   */
  router.post('/care-plans/effectiveness/batch', async (req: Request, res: Response): Promise<void> => {
    // Create a new Knex instance for this request
    const knexDb = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
    });

    try {
      // Get organization from authenticated user
      const organizationId = req.user?.organizationId;
      if (typeof organizationId !== 'string') {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - organization context required',
        });
        return;
      }

      // Validate request body
      const data = batchScoreEffectivenessSchema.parse(req.body);

      // Initialize service
      const effectivenessService = new CarePlanEffectivenessService(knexDb);

      // Score all care plans
      const results = await Promise.allSettled(
        data.carePlanIds.map(carePlanId =>
          effectivenessService.scoreEffectiveness({
            carePlanId,
            organizationId,
            evaluationPeriodDays: data.evaluationPeriodDays,
            includeRecommendations: data.includeRecommendations,
          })
        )
      );

      const scores = results.map((result, index) => ({
        carePlanId: data.carePlanIds[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? (result.reason as Error).message : null,
      }));

      // Calculate summary statistics
      const successfulScores = scores.filter(s => s.success && s.data);
      const avgScore = successfulScores.length > 0
        ? Math.round(
            successfulScores.reduce((sum, s) => sum + (s.data?.overallScore ?? 0), 0) / successfulScores.length
          )
        : 0;

      res.json({
        success: true,
        data: scores,
        summary: {
          total: data.carePlanIds.length,
          successful: successfulScores.length,
          failed: results.filter(r => r.status === 'rejected').length,
          averageScore: avgScore,
          ratingDistribution: {
            excellent: successfulScores.filter(s => s.data?.overallRating === 'EXCELLENT').length,
            good: successfulScores.filter(s => s.data?.overallRating === 'GOOD').length,
            fair: successfulScores.filter(s => s.data?.overallRating === 'FAIR').length,
            needsImprovement: successfulScores.filter(s => s.data?.overallRating === 'NEEDS_IMPROVEMENT').length,
            critical: successfulScores.filter(s => s.data?.overallRating === 'CRITICAL').length,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      } else {
        const err = error as Error;
        console.error('Error batch scoring care plan effectiveness:', error);
        res.status(500).json({
          success: false,
          error: err.message || 'Failed to batch score care plan effectiveness',
        });
      }
    } finally {
      // Clean up database connection
      await knexDb.destroy();
    }
  });

  return router;
}
