/**
 * Visit Notes API Handlers
 *
 * Express request handlers for visit notes and autofill functionality
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import type { NoteAutofillService } from '../services/note-autofill-service.js';

/**
 * Handle errors consistently across all handlers
 */
function handleError(error: unknown, res: Response, operation: string): void {
  const err = error as Error & { statusCode?: number };

  if (err.message.includes('permissions')) {
    res.status(403).json({ error: err.message });
  } else if (err.message.includes('not found') || err.message.includes('Not found')) {
    res.status(404).json({ error: err.message });
  } else if (err.message.includes('validation') || err.message.includes('already')) {
    res.status(400).json({ error: err.message });
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Validation schemas
const autofillRequestSchema = z.object({
  visitId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  caregiverId: z.string().uuid().optional(),
});

/**
 * Create API handlers for visit notes
 */
export function createVisitNotesHandlers(autofillService: NoteAutofillService) {
  return {
    /**
     * POST /visit-notes/autofill-suggestions
     * Get autofill suggestions for a visit note based on previous notes
     */
    async getAutofillSuggestions(req: Request, res: Response): Promise<void> {
      try {
        // Validate request body
        const data = autofillRequestSchema.parse(req.body);

        // Get autofill suggestions
        const suggestions = await autofillService.getAutofillSuggestions(data);

        res.json({
          success: true,
          data: suggestions,
        });
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.errors,
          });
          return;
        }

        handleError(error, res, 'getting autofill suggestions');
      }
    },
  };
}
