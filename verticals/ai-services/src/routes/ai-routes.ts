/**
 * AI Services API Routes
 *
 * Express routes for AI-powered features including note summarization,
 * sentiment analysis, and keyword extraction.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from '@folkcare/core';
import { NoteSummarizationService } from '../service/note-summarization-service.js';
import type {
  SummarizeNoteRequest,
  BatchSummarizeRequest,
  DailySummaryRequest,
} from '../types/ai-types.js';

// Validation schemas
const summarizeNoteSchema = z.object({
  noteId: z.string().uuid(),
  noteType: z.enum([
    'PROGRESS_NOTE',
    'VISIT_NOTE',
    'INCIDENT_REPORT',
    'CARE_PLAN_UPDATE',
    'ASSESSMENT',
    'GENERAL',
  ]),
  content: z.string().min(10).max(10000),
  strategy: z.enum(['BRIEF', 'STANDARD', 'DETAILED', 'BULLET_POINTS']).optional(),
  includeSentiment: z.boolean().optional(),
  includeKeywords: z.boolean().optional(),
});

const batchSummarizeSchema = z.object({
  notes: z.array(
    z.object({
      noteId: z.string().uuid(),
      noteType: z.enum([
        'PROGRESS_NOTE',
        'VISIT_NOTE',
        'INCIDENT_REPORT',
        'CARE_PLAN_UPDATE',
        'ASSESSMENT',
        'GENERAL',
      ]),
      content: z.string().min(10).max(10000),
    })
  ).min(1).max(50), // Limit batch size
  strategy: z.enum(['BRIEF', 'STANDARD', 'DETAILED', 'BULLET_POINTS']).optional(),
  includeSentiment: z.boolean().optional(),
  includeKeywords: z.boolean().optional(),
});

const dailySummarySchema = z.object({
  clientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  includeVisits: z.boolean().default(true),
  includeMedications: z.boolean().default(true),
  includeVitals: z.boolean().default(true),
  includeIncidents: z.boolean().default(true),
});

const extractKeywordsSchema = z.object({
  content: z.string().min(10).max(10000),
});

/**
 * Create AI services router
 */
export function createAIRoutes(_db: Database): Router {
  const router = Router();

  // Initialize AI service (in production, API key would come from env)
  const aiService = new NoteSummarizationService({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    defaultModel: 'claude-sonnet-4',
    maxTokens: 2048,
    temperature: 0.3,
    enableCaching: true,
    cacheTTLSeconds: 3600, // 1 hour
  });

  /**
   * POST /ai/summarize-note
   * Summarize a single note
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/ai/summarize-note', async (req: Request, res: Response): Promise<void> => {
    try {
      const data = summarizeNoteSchema.parse(req.body) as SummarizeNoteRequest;

      const summary = await aiService.summarizeNote(data);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        console.error('Error summarizing note:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to summarize note',
        });
      }
    }
  });

  /**
   * POST /ai/batch-summarize
   * Summarize multiple notes at once
   */
  router.post('/ai/batch-summarize', async (req: Request, res: Response): Promise<void> => {
    try {
      const data = batchSummarizeSchema.parse(req.body) as BatchSummarizeRequest;

      const result = await aiService.batchSummarize(data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        console.error('Error in batch summarization:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to summarize notes',
        });
      }
    }
  });

  /**
   * POST /ai/daily-summary
   * Generate daily summary for a client
   */
  router.post('/ai/daily-summary', async (req: Request, res: Response): Promise<void> => {
    try {
      const data = dailySummarySchema.parse(req.body) as DailySummaryRequest;

      const summary = await aiService.generateDailySummary(data);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        console.error('Error generating daily summary:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate daily summary',
        });
      }
    }
  });

  /**
   * POST /ai/extract-keywords
   * Extract keywords from note content
   */
  router.post('/ai/extract-keywords', async (req: Request, res: Response): Promise<void> => {
    try {
      const data = extractKeywordsSchema.parse(req.body);

      const result = await aiService.extractKeywords(data.content);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        console.error('Error extracting keywords:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to extract keywords',
        });
      }
    }
  });

  /**
   * GET /ai/cache-stats
   * Get summarization cache statistics
   */
  router.get('/ai/cache-stats', (_req: Request, res: Response) => {
    const stats = aiService.getCacheStats();
    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * POST /ai/clear-cache
   * Clear the summarization cache
   */
  router.post('/ai/clear-cache', (_req: Request, res: Response) => {
    aiService.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  });

  return router;
}
