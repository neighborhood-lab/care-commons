/**
 * Training Recommendation API Routes
 *
 * Coordinator-facing API for AI-powered training recommendations.
 * Helps identify and prioritize caregiver training needs.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from '@folkcare/core';
import { AuthMiddleware } from '@folkcare/core';
import knex from 'knex';
import { TrainingRecommendationService } from '../services/training-recommendation-service.js';

// Validation schema for single caregiver recommendation
const recommendTrainingSchema = z.object({
  caregiverId: z.string().uuid(),
  includeUpcomingExpirations: z.boolean().optional().default(true),
  includePerformanceAnalysis: z.boolean().optional().default(true),
  lookAheadDays: z.number().int().min(30).max(365).optional().default(90),
});

// Validation schema for batch recommendations
const batchRecommendTrainingSchema = z.object({
  caregiverIds: z.array(z.string().uuid()).min(1).max(10),
  includeUpcomingExpirations: z.boolean().optional().default(true),
  includePerformanceAnalysis: z.boolean().optional().default(true),
  lookAheadDays: z.number().int().min(30).max(365).optional().default(90),
});

/**
 * Create training recommendation routes
 */
export function createTrainingRecommendationRoutes(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Require authentication for all routes
  router.use(authMiddleware.requireAuth);

  /**
   * POST /api/caregivers/training/recommendations
   * Generate AI-powered training recommendations for a caregiver
   */
  router.post('/training/recommendations', async (req: Request, res: Response): Promise<void> => {
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
      const data = recommendTrainingSchema.parse(req.body);

      // Initialize service
      const trainingService = new TrainingRecommendationService(knexDb);

      // Generate recommendations
      const plan = await trainingService.recommendTraining({
        caregiverId: data.caregiverId,
        organizationId,
        includeUpcomingExpirations: data.includeUpcomingExpirations,
        includePerformanceAnalysis: data.includePerformanceAnalysis,
        lookAheadDays: data.lookAheadDays,
      });

      res.json({
        success: true,
        data: plan,
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
          console.error('Error generating training recommendations:', error);
          res.status(500).json({
            success: false,
            error: err.message || 'Failed to generate training recommendations',
          });
        }
      }
    } finally {
      // Clean up database connection
      await knexDb.destroy();
    }
  });

  /**
   * POST /api/caregivers/training/recommendations/batch
   * Generate recommendations for multiple caregivers
   */
  router.post('/training/recommendations/batch', async (req: Request, res: Response): Promise<void> => {
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
      const data = batchRecommendTrainingSchema.parse(req.body);

      // Initialize service
      const trainingService = new TrainingRecommendationService(knexDb);

      // Generate recommendations for all caregivers
      const results = await Promise.allSettled(
        data.caregiverIds.map(caregiverId =>
          trainingService.recommendTraining({
            caregiverId,
            organizationId,
            includeUpcomingExpirations: data.includeUpcomingExpirations,
            includePerformanceAnalysis: data.includePerformanceAnalysis,
            lookAheadDays: data.lookAheadDays,
          })
        )
      );

      const plans = results.map((result, index) => ({
        caregiverId: data.caregiverIds[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? (result.reason as Error).message : null,
      }));

      // Calculate summary statistics
      const successfulPlans = plans.filter(p => p.success && p.data);
      const totalRecommendations = successfulPlans.reduce(
        (sum, p) => sum + (p.data?.recommendations?.length ?? 0),
        0
      );
      const criticalCount = successfulPlans.reduce(
        (sum, p) => sum + (p.data?.recommendations?.filter(r => r.priority === 'CRITICAL').length ?? 0),
        0
      );

      res.json({
        success: true,
        data: plans,
        summary: {
          total: data.caregiverIds.length,
          successful: successfulPlans.length,
          failed: results.filter(r => r.status === 'rejected').length,
          totalRecommendations,
          criticalRecommendations: criticalCount,
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
        console.error('Error generating batch training recommendations:', error);
        res.status(500).json({
          success: false,
          error: err.message || 'Failed to generate batch training recommendations',
        });
      }
    } finally {
      // Clean up database connection
      await knexDb.destroy();
    }
  });

  return router;
}
