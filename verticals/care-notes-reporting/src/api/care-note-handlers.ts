/**
 * Care Note API Handlers
 *
 * Express request handlers for care notes and progress reporting
 */

import { Request, Response } from 'express';
import { CareNoteService } from '../service/care-note-service.js';
import {
  UserContext,
  Role,
  ValidationError,
  PermissionError,
  NotFoundError,
} from '@care-commons/core';
import {
  CareNoteType,
  NoteStatus,
  ReviewStatus,
  ProgressReportType,
} from '../types/care-note.js';

/**
 * Type guard to check if error is a known domain error
 */
function isDomainError(
  error: unknown
): error is ValidationError | PermissionError | NotFoundError {
  return (
    error instanceof ValidationError ||
    error instanceof PermissionError ||
    error instanceof NotFoundError
  );
}

/**
 * Handle errors consistently across all handlers
 */
function handleError(
  error: unknown,
  res: Response,
  operation: string
): void {
  if (isDomainError(error)) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, details: error.context });
    } else if (error instanceof PermissionError) {
      res.status(403).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    }
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Extract user context from request
 * In production, this would extract from JWT or session
 */
function getUserContext(req: Request): UserContext {
  const branchId = req.header('X-Branch-Id');
  return {
    userId: req.header('X-User-Id') || 'system',
    organizationId: req.header('X-Organization-Id') || '',
    branchIds: branchId ? [branchId] : [],
    roles: (req.header('X-User-Roles') || 'CAREGIVER').split(',') as Role[],
    permissions: (req.header('X-User-Permissions') || '')
      .split(',')
      .filter(Boolean),
  };
}

/**
 * Create API handlers for care notes
 */
export function createCareNoteHandlers(service: CareNoteService) {
  return {
    /**
     * POST /care-notes
     * Create a new care note
     */
    async createCareNote(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const careNote = await service.createCareNote(req.body, context);
        res.status(201).json(careNote);
      } catch (error: unknown) {
        handleError(error, res, 'creating care note');
      }
    },

    /**
     * GET /care-notes/:id
     * Get care note by ID
     */
    async getCareNoteById(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const careNote = await service.getCareNoteById(
          req.params['id'] as string,
          context
        );
        res.json(careNote);
      } catch (error: unknown) {
        handleError(error, res, 'fetching care note');
      }
    },

    /**
     * PUT /care-notes/:id
     * Update care note
     */
    async updateCareNote(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const careNote = await service.updateCareNote(
          req.params['id'] as string,
          req.body,
          context
        );
        res.json(careNote);
      } catch (error: unknown) {
        handleError(error, res, 'updating care note');
      }
    },

    /**
     * DELETE /care-notes/:id
     * Delete care note (soft delete)
     */
    async deleteCareNote(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        await service.deleteCareNote(req.params['id'] as string, context);
        res.status(204).send();
      } catch (error: unknown) {
        handleError(error, res, 'deleting care note');
      }
    },

    /**
     * GET /care-notes
     * Search care notes
     */
    async searchCareNotes(req: Request, res: Response) {
      try {
        const context = getUserContext(req);

        // Validate and sanitize query parameters
        const query =
          typeof req.query['query'] === 'string'
            ? req.query['query'].trim()
            : undefined;
        const clientId =
          typeof req.query['clientId'] === 'string'
            ? req.query['clientId'].trim()
            : undefined;
        const caregiverId =
          typeof req.query['caregiverId'] === 'string'
            ? req.query['caregiverId'].trim()
            : undefined;

        // Validate note type values
        let noteType: CareNoteType[] | undefined;
        if (typeof req.query['noteType'] === 'string') {
          const validNoteTypes: CareNoteType[] = [
            'VISIT_NOTE',
            'DAILY_NOTE',
            'SHIFT_NOTE',
            'INCIDENT_REPORT',
            'CHANGE_IN_CONDITION',
            'PROGRESS_NOTE',
            'ASSESSMENT_NOTE',
            'COMMUNICATION_NOTE',
            'ADMISSION_NOTE',
            'DISCHARGE_NOTE',
            'TRANSFER_NOTE',
            'MEDICATION_NOTE',
            'SAFETY_NOTE',
            'BEHAVIORAL_NOTE',
            'OTHER',
          ];
          noteType = req.query['noteType']
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter((s) =>
              validNoteTypes.includes(s as CareNoteType)
            ) as CareNoteType[];
          if (noteType.length === 0) noteType = undefined;
        }

        // Validate status values
        let status: NoteStatus[] | undefined;
        if (typeof req.query['status'] === 'string') {
          const validStatuses: NoteStatus[] = [
            'DRAFT',
            'PENDING_REVIEW',
            'REVIEWED',
            'APPROVED',
            'REJECTED',
            'AMENDED',
            'LOCKED',
          ];
          status = req.query['status']
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter((s) =>
              validStatuses.includes(s as NoteStatus)
            ) as NoteStatus[];
          if (status.length === 0) status = undefined;
        }

        // Validate review status values
        let reviewStatus: ReviewStatus[] | undefined;
        if (typeof req.query['reviewStatus'] === 'string') {
          const validReviewStatuses: ReviewStatus[] = [
            'NOT_REVIEWED',
            'IN_REVIEW',
            'APPROVED',
            'REJECTED',
            'NEEDS_REVISION',
          ];
          reviewStatus = req.query['reviewStatus']
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter((s) =>
              validReviewStatuses.includes(s as ReviewStatus)
            ) as ReviewStatus[];
          if (reviewStatus.length === 0) reviewStatus = undefined;
        }

        // Parse date filters
        const dateFrom =
          typeof req.query['dateFrom'] === 'string'
            ? new Date(req.query['dateFrom'])
            : undefined;
        const dateTo =
          typeof req.query['dateTo'] === 'string'
            ? new Date(req.query['dateTo'])
            : undefined;

        // Parse boolean filters
        const needsReview = req.query['needsReview'] === 'true';
        const changeInCondition = req.query['changeInCondition'] === 'true';

        const filters = {
          query,
          clientId,
          caregiverId,
          noteType,
          status,
          reviewStatus,
          dateFrom,
          dateTo,
          needsReview: needsReview || undefined,
          changeInCondition: changeInCondition || undefined,
        };

        // Pagination
        const page =
          typeof req.query['page'] === 'string'
            ? Number.parseInt(req.query['page'], 10)
            : 1;
        const limit =
          typeof req.query['limit'] === 'string'
            ? Number.parseInt(req.query['limit'], 10)
            : 20;

        const result = await service.searchCareNotes(
          filters,
          context,
          { page, limit }
        );
        res.json(result);
      } catch (error: unknown) {
        handleError(error, res, 'searching care notes');
      }
    },

    /**
     * GET /care-notes/client/:clientId
     * Get care notes by client ID
     */
    async getCareNotesByClientId(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const page =
          typeof req.query['page'] === 'string'
            ? Number.parseInt(req.query['page'], 10)
            : 1;
        const limit =
          typeof req.query['limit'] === 'string'
            ? Number.parseInt(req.query['limit'], 10)
            : 20;

        const result = await service.getCareNotesByClientId(
          req.params['clientId'] as string,
          context,
          { page, limit }
        );
        res.json(result);
      } catch (error: unknown) {
        handleError(error, res, 'fetching care notes by client');
      }
    },

    /**
     * GET /care-notes/review/pending
     * Get care notes requiring review
     */
    async getCareNotesRequiringReview(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const page =
          typeof req.query['page'] === 'string'
            ? Number.parseInt(req.query['page'], 10)
            : 1;
        const limit =
          typeof req.query['limit'] === 'string'
            ? Number.parseInt(req.query['limit'], 10)
            : 20;

        const result = await service.getCareNotesRequiringReview(context, {
          page,
          limit,
        });
        res.json(result);
      } catch (error: unknown) {
        handleError(error, res, 'fetching care notes requiring review');
      }
    },

    /**
     * POST /care-notes/:id/review
     * Review care note
     */
    async reviewCareNote(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const careNote = await service.reviewCareNote(
          req.params['id'] as string,
          req.body,
          context
        );
        res.json(careNote);
      } catch (error: unknown) {
        handleError(error, res, 'reviewing care note');
      }
    },

    /**
     * POST /care-notes/:id/approve
     * Approve care note
     */
    async approveCareNote(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const careNote = await service.approveCareNote(
          req.params['id'] as string,
          context
        );
        res.json(careNote);
      } catch (error: unknown) {
        handleError(error, res, 'approving care note');
      }
    },

    /**
     * GET /care-notes/analytics
     * Get care note analytics
     */
    async getCareNoteAnalytics(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const dateFrom =
          typeof req.query['dateFrom'] === 'string'
            ? new Date(req.query['dateFrom'])
            : undefined;
        const dateTo =
          typeof req.query['dateTo'] === 'string'
            ? new Date(req.query['dateTo'])
            : undefined;

        const analytics = await service.getCareNoteAnalytics(
          context,
          dateFrom,
          dateTo
        );
        res.json(analytics);
      } catch (error: unknown) {
        handleError(error, res, 'fetching care note analytics');
      }
    },

    /**
     * POST /progress-reports
     * Generate progress report
     */
    async generateProgressReport(req: Request, res: Response) {
      try {
        const context = getUserContext(req);
        const { clientId, reportType, periodStart, periodEnd } = req.body;

        const report = await service.generateProgressReport(
          clientId,
          reportType as ProgressReportType,
          new Date(periodStart),
          new Date(periodEnd),
          context
        );
        res.status(201).json(report);
      } catch (error: unknown) {
        handleError(error, res, 'generating progress report');
      }
    },
  };
}

/**
 * Create Express router for care notes
 */
export function createCareNoteRouter(service: CareNoteService) {
  // This would be imported from express in actual implementation
  // For now, we return the handlers that can be used to create routes
  return createCareNoteHandlers(service);
}
