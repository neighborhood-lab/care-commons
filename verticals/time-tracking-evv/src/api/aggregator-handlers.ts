/**
 * EVV Aggregator Submission API Handlers
 *
 * Provides RESTful API endpoints for:
 * - Viewing submission status
 * - Manual resubmission of failed submissions
 * - Submission history and tracking
 */

import { UserContext, UUID } from '@care-commons/core';
import { EVVAggregatorService, IAggregatorSubmissionRepository } from '../service/evv-aggregator-service';
import { StateAggregatorSubmission } from '../types/state-specific';

export interface APIRequest<T = unknown> {
  body: T;
  params: Record<string, string>;
  query: Record<string, string>;
  user: UserContext;
}

export interface APIResponse {
  status: number;
  data?: unknown;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export class AggregatorHandlers {
  constructor(
    private aggregatorService: EVVAggregatorService,
    private submissionRepository: IAggregatorSubmissionRepository
  ) {}

  /**
   * @openapi
   * /api/evv/aggregator/submissions/{evvRecordId}:
   *   get:
   *     summary: Get submission history for an EVV record
   *     tags: [EVV Aggregator]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: evvRecordId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: The EVV record ID
   *     responses:
   *       200:
   *         description: Submission history retrieved
   *       404:
   *         description: EVV record not found
   *       500:
   *         description: Server error
   *
   * GET /api/evv/aggregator/submissions/:evvRecordId
   * Get submission history for an EVV record
   */
  async getSubmissionsByRecord(req: APIRequest): Promise<APIResponse> {
    try {
      const { evvRecordId } = req.params;

      const submissions = await this.submissionRepository.getSubmissionsByEVVRecord(
        evvRecordId as UUID
      );

      return {
        status: 200,
        data: {
          evvRecordId,
          submissions,
          totalCount: submissions.length,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * @openapi
   * /api/evv/aggregator/submissions/{submissionId}/retry:
   *   post:
   *     summary: Manually retry a failed submission
   *     tags: [EVV Aggregator]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: submissionId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: The submission ID to retry
   *     responses:
   *       200:
   *         description: Retry attempted
   *       400:
   *         description: Invalid request (e.g., max retries exceeded)
   *       404:
   *         description: Submission not found
   *       500:
   *         description: Server error
   *
   * POST /api/evv/aggregator/submissions/:submissionId/retry
   * Manually retry a failed submission
   */
  async retrySubmission(req: APIRequest): Promise<APIResponse> {
    try {
      const { submissionId } = req.params;

      const updatedSubmission = await this.aggregatorService.retrySubmission(
        submissionId as UUID
      );

      return {
        status: 200,
        data: {
          message: 'Submission retry attempted',
          submission: updatedSubmission,
          success: updatedSubmission.submissionStatus === 'ACCEPTED',
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * @openapi
   * /api/evv/aggregator/submissions/pending:
   *   get:
   *     summary: Get all pending submissions (for retry)
   *     tags: [EVV Aggregator]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Pending submissions retrieved
   *       500:
   *         description: Server error
   *
   * GET /api/evv/aggregator/submissions/pending
   * Get all pending submissions that need retry
   */
  async getPendingSubmissions(req: APIRequest): Promise<APIResponse> {
    try {
      const submissions = await this.submissionRepository.getPendingRetries();

      return {
        status: 200,
        data: {
          submissions,
          totalCount: submissions.length,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * @openapi
   * /api/evv/aggregator/submissions/retry-all:
   *   post:
   *     summary: Trigger retry for all pending submissions
   *     tags: [EVV Aggregator]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Retry process triggered
   *       500:
   *         description: Server error
   *
   * POST /api/evv/aggregator/submissions/retry-all
   * Trigger retry for all pending submissions
   */
  async retryAllPending(req: APIRequest): Promise<APIResponse> {
    try {
      await this.aggregatorService.retryPendingSubmissions();

      return {
        status: 200,
        data: {
          message: 'Retry process for pending submissions triggered',
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * @openapi
   * /api/evv/aggregator/submissions/stats:
   *   get:
   *     summary: Get submission statistics
   *     tags: [EVV Aggregator]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by organization
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for statistics
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for statistics
   *     responses:
   *       200:
   *         description: Statistics retrieved
   *       500:
   *         description: Server error
   *
   * GET /api/evv/aggregator/submissions/stats
   * Get submission statistics
   */
  async getSubmissionStats(req: APIRequest): Promise<APIResponse> {
    try {
      const pending = await this.submissionRepository.getPendingRetries();

      // Calculate stats from pending submissions
      const stats = {
        totalPending: pending.length,
        byState: this.groupByState(pending),
        byAggregator: this.groupByAggregator(pending),
        byStatus: this.groupByStatus(pending),
        retryingSoon: pending.filter(s =>
          s.nextRetryAt && s.nextRetryAt <= new Date(Date.now() + 3600000) // Next hour
        ).length,
      };

      return {
        status: 200,
        data: stats,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Group submissions by state
   */
  private groupByState(submissions: StateAggregatorSubmission[]): Record<string, number> {
    return submissions.reduce((acc, sub) => {
      acc[sub.state] = (acc[sub.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Group submissions by aggregator type
   */
  private groupByAggregator(submissions: StateAggregatorSubmission[]): Record<string, number> {
    return submissions.reduce((acc, sub) => {
      acc[sub.aggregatorType] = (acc[sub.aggregatorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Group submissions by status
   */
  private groupByStatus(submissions: StateAggregatorSubmission[]): Record<string, number> {
    return submissions.reduce((acc, sub) => {
      acc[sub.submissionStatus] = (acc[sub.submissionStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Handle errors and return appropriate API response
   */
  private handleError(error: unknown): APIResponse {
    const err = error as Error;
    const errorName = err.constructor.name;
    const errorMessage = err.message || 'Unknown error';

    console.error('AggregatorHandlers error:', error);

    if (errorName === 'NotFoundError') {
      return {
        status: 404,
        error: {
          message: errorMessage,
          code: 'NOT_FOUND',
        },
      };
    }

    if (errorName === 'ValidationError') {
      const validationError = error as { details?: unknown };
      return {
        status: 400,
        error: {
          message: errorMessage,
          code: 'VALIDATION_ERROR',
          details: validationError.details,
        },
      };
    }

    return {
      status: 500,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    };
  }
}
