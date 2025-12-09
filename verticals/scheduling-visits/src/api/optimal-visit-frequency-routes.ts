/**
 * Optimal Visit Frequency API Routes
 *
 * Coordinator-facing API for AI-powered visit frequency recommendations.
 * Helps optimize care delivery based on client needs and risk factors.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from '@folkcare/core';
import { AuthMiddleware } from '@folkcare/core';
import knex from 'knex';
import { OptimalVisitFrequencyService } from '../service/optimal-visit-frequency-service.js';

// Validation schema for single client recommendation
const recommendFrequencySchema = z.object({
  clientId: z.string().uuid(),
  includeHistoricalAnalysis: z.boolean().optional().default(true),
  includeRiskFactors: z.boolean().optional().default(true),
});

// Validation schema for batch recommendation
const batchRecommendFrequencySchema = z.object({
  clientIds: z.array(z.string().uuid()).min(1).max(10),
  includeHistoricalAnalysis: z.boolean().optional().default(true),
  includeRiskFactors: z.boolean().optional().default(true),
});

/**
 * Create optimal visit frequency routes
 */
export function createOptimalVisitFrequencyRoutes(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Require authentication for all routes
  router.use(authMiddleware.requireAuth);

  /**
   * POST /api/scheduling/optimal-frequency
   * Generate AI-powered optimal visit frequency recommendation for a client
   */
  router.post('/scheduling/optimal-frequency', async (req: Request, res: Response): Promise<void> => {
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
      const data = recommendFrequencySchema.parse(req.body);

      // Initialize service
      const frequencyService = new OptimalVisitFrequencyService(knexDb);

      // Generate recommendation
      const recommendation = await frequencyService.recommendFrequency({
        clientId: data.clientId,
        organizationId,
        includeHistoricalAnalysis: data.includeHistoricalAnalysis,
        includeRiskFactors: data.includeRiskFactors,
      });

      res.json({
        success: true,
        data: recommendation,
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
          console.error('Error generating frequency recommendation:', error);
          res.status(500).json({
            success: false,
            error: err.message || 'Failed to generate frequency recommendation',
          });
        }
      }
    } finally {
      // Clean up database connection
      await knexDb.destroy();
    }
  });

  /**
   * POST /api/scheduling/optimal-frequency/batch
   * Generate recommendations for multiple clients
   */
  router.post('/scheduling/optimal-frequency/batch', async (req: Request, res: Response): Promise<void> => {
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
      const data = batchRecommendFrequencySchema.parse(req.body);

      // Initialize service
      const frequencyService = new OptimalVisitFrequencyService(knexDb);

      // Generate recommendations for all clients
      const results = await Promise.allSettled(
        data.clientIds.map(clientId =>
          frequencyService.recommendFrequency({
            clientId,
            organizationId,
            includeHistoricalAnalysis: data.includeHistoricalAnalysis,
            includeRiskFactors: data.includeRiskFactors,
          })
        )
      );

      const recommendations = results.map((result, index) => ({
        clientId: data.clientIds[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? (result.reason as Error).message : null,
      }));

      res.json({
        success: true,
        data: recommendations,
        summary: {
          total: data.clientIds.length,
          successful: results.filter(r => r.status === 'fulfilled').length,
          failed: results.filter(r => r.status === 'rejected').length,
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
        console.error('Error generating batch frequency recommendations:', error);
        res.status(500).json({
          success: false,
          error: err.message || 'Failed to generate batch recommendations',
        });
      }
    } finally {
      // Clean up database connection
      await knexDb.destroy();
    }
  });

  return router;
}
