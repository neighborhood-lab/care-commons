/**
 * Natural Language Care Plan API Routes
 *
 * Express routes for AI-powered care plan generation from natural language.
 * Coordinators can describe client needs in plain text and the AI generates
 * a structured care plan with goals, interventions, and task templates.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from '@folkcare/core';
import { AuthMiddleware } from '@folkcare/core';
import knex from 'knex';
import { NaturalLanguageCarePlanService } from '../services/natural-language-care-plan-service.js';

// Validation schema for care plan generation request
const generateCarePlanSchema = z.object({
  clientId: z.string().uuid(),
  description: z.string().min(10).max(5000),
  clientContext: z
    .object({
      name: z.string().optional(),
      age: z.number().int().positive().optional(),
      diagnoses: z.array(z.string()).optional(),
      currentMedications: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      mobilityLevel: z.string().optional(),
      cognitiveStatus: z.string().optional(),
      livingArrangement: z.string().optional(),
    })
    .optional(),
  preferredPlanType: z
    .enum([
      'PERSONAL_CARE',
      'COMPANION',
      'SKILLED_NURSING',
      'THERAPY',
      'HOSPICE',
      'RESPITE',
      'LIVE_IN',
      'CUSTOM',
    ])
    .optional(),
  estimatedHoursPerWeek: z.number().positive().optional(),
  focusAreas: z.array(z.string()).optional(),
});

/**
 * Create natural language care plan routes
 */
export function createNaturalLanguageCarePlanRoutes(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Require authentication for all routes
  router.use(authMiddleware.requireAuth);

  /**
   * POST /api/care-plans/generate
   * Generate a structured care plan from natural language description
   */
  router.post('/care-plans/generate', async (req: Request, res: Response): Promise<void> => {
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
      const data = generateCarePlanSchema.parse(req.body);

      // Initialize service
      const carePlanService = new NaturalLanguageCarePlanService(knexDb);

      // Generate care plan
      const result = await carePlanService.generateCarePlan({
        organizationId,
        clientId: data.clientId,
        description: data.description,
        clientContext: data.clientContext,
        preferredPlanType: data.preferredPlanType,
        estimatedHoursPerWeek: data.estimatedHoursPerWeek,
        focusAreas: data.focusAreas,
      });

      res.json({
        success: true,
        data: result,
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
        } else if (err.message.includes('permissions') || err.message.includes('unauthorized')) {
          res.status(403).json({
            success: false,
            error: err.message,
          });
        } else {
          console.error('Error generating care plan:', error);
          res.status(500).json({
            success: false,
            error: err.message || 'Failed to generate care plan',
          });
        }
      }
    } finally {
      // Clean up database connection
      await knexDb.destroy();
    }
  });

  return router;
}
