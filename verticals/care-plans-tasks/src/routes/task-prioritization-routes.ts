/**
 * Task Prioritization API Routes
 *
 * Express routes for AI-powered task prioritization feature.
 * Analyzes patient condition and care plan to intelligently rank tasks.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from '@folkcare/core';
import { AuthMiddleware } from '@folkcare/core';
import {
  TaskPrioritizationService,
  type PrioritizeTasksRequest,
} from '../services/task-prioritization-service.js';
import { Pool } from 'pg';

// Validation schema
const prioritizeTasksSchema = z.object({
  caregiverId: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitId: z.string().uuid().optional(),
});

/**
 * Create task prioritization routes
 */
export function createTaskPrioritizationRoutes(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Require authentication for all routes
  router.use(authMiddleware.requireAuth);

  // Initialize service (API key from environment)
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!anthropicApiKey) {
    console.warn('WARNING: ANTHROPIC_API_KEY not set - task prioritization will not work');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const prioritizationService = new TaskPrioritizationService(pool, {
    anthropicApiKey,
    maxTokens: 2048,
    temperature: 0.3,
    lookbackDays: 30,
  });

  /**
   * POST /api/care-plans/tasks/prioritize
   * Prioritize tasks for a caregiver's visit based on patient condition
   */
  router.post('/care-plans/tasks/prioritize', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const data = prioritizeTasksSchema.parse(req.body) as PrioritizeTasksRequest;

      // Get prioritized tasks
      const result = await prioritizationService.prioritizeTasks(data);

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

        if (err.message.includes('not found') || err.message.includes('Not found')) {
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
          console.error('Error prioritizing tasks:', error);
          res.status(500).json({
            success: false,
            error: err.message || 'Failed to prioritize tasks',
          });
        }
      }
    }
  });

  return router;
}
