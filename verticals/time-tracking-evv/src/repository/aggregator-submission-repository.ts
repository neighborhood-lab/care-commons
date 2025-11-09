/**
 * Aggregator Submission Repository
 *
 * Handles data access for state aggregator submissions.
 * Provides methods to create, update, and query submission records.
 */

import { UUID } from '@care-commons/core';
import { StateAggregatorSubmission } from '../types/state-specific.js';
import type { Knex } from 'knex';

/**
 * Database row for state_aggregator_submissions table
 */
interface AggregatorSubmissionRow {
  id: string;
  state_code: string;
  evv_record_id: string;
  aggregator_id: string;
  aggregator_type: string;
  submission_payload: unknown;
  submission_format: string;
  submitted_at: Date;
  submitted_by: string;
  submission_status: string;
  aggregator_response: unknown | null;
  aggregator_confirmation_id: string | null;
  aggregator_received_at: Date | null;
  error_code: string | null;
  error_message: string | null;
  error_details: unknown | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Aggregator Submission Repository
 *
 * SOLID: Single Responsibility - Only handles database operations for submissions
 * Separation of Concerns: SQL logic isolated from business logic
 */
export class AggregatorSubmissionRepository {
  constructor(private db: Knex) {}

  /**
   * Create a new aggregator submission record
   */
  async createSubmission(
    submission: Omit<StateAggregatorSubmission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StateAggregatorSubmission> {
    const row: Partial<AggregatorSubmissionRow> = {
      state_code: submission.state,
      evv_record_id: submission.evvRecordId,
      aggregator_id: submission.aggregatorId,
      aggregator_type: submission.aggregatorType,
      submission_payload: submission.submissionPayload,
      submission_format: submission.submissionFormat,
      submitted_at: submission.submittedAt,
      submitted_by: submission.submittedBy,
      submission_status: submission.submissionStatus,
      aggregator_response: submission.aggregatorResponse || null,
      aggregator_confirmation_id: submission.aggregatorConfirmationId || null,
      aggregator_received_at: submission.aggregatorReceivedAt || null,
      error_code: submission.errorCode || null,
      error_message: submission.errorMessage || null,
      error_details: submission.errorDetails || null,
      retry_count: submission.retryCount,
      max_retries: submission.maxRetries,
      next_retry_at: submission.nextRetryAt || null,
    };

    const [inserted] = await this.db('state_aggregator_submissions')
      .insert(row)
      .returning('*');

    return this.mapRowToSubmission(inserted);
  }

  /**
   * Update an existing aggregator submission record
   */
  async updateSubmission(
    id: UUID,
    updates: Partial<StateAggregatorSubmission>
  ): Promise<StateAggregatorSubmission> {
    const row: Partial<AggregatorSubmissionRow> = {};

    if (updates.submissionStatus !== undefined) row.submission_status = updates.submissionStatus;
    if (updates.aggregatorResponse !== undefined) row.aggregator_response = updates.aggregatorResponse;
    if (updates.aggregatorConfirmationId !== undefined) row.aggregator_confirmation_id = updates.aggregatorConfirmationId;
    if (updates.aggregatorReceivedAt !== undefined) row.aggregator_received_at = updates.aggregatorReceivedAt;
    if (updates.errorCode !== undefined) row.error_code = updates.errorCode;
    if (updates.errorMessage !== undefined) row.error_message = updates.errorMessage;
    if (updates.errorDetails !== undefined) row.error_details = updates.errorDetails;
    if (updates.retryCount !== undefined) row.retry_count = updates.retryCount;
    if (updates.nextRetryAt !== undefined) row.next_retry_at = updates.nextRetryAt;

    const [updated] = await this.db('state_aggregator_submissions')
      .where({ id })
      .update(row)
      .returning('*');

    if (!updated) {
      throw new Error(`Aggregator submission not found: ${id}`);
    }

    return this.mapRowToSubmission(updated);
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id: UUID): Promise<StateAggregatorSubmission | null> {
    const row = await this.db('state_aggregator_submissions')
      .where({ id })
      .first();

    return row ? this.mapRowToSubmission(row) : null;
  }

  /**
   * Get all submissions for an EVV record
   */
  async getSubmissionsByEVVRecord(evvRecordId: UUID): Promise<StateAggregatorSubmission[]> {
    const rows = await this.db('state_aggregator_submissions')
      .where({ evv_record_id: evvRecordId })
      .orderBy('submitted_at', 'desc');

    return rows.map(row => this.mapRowToSubmission(row));
  }

  /**
   * Get pending submissions that need retry
   */
  async getPendingRetries(): Promise<StateAggregatorSubmission[]> {
    const rows = await this.db('state_aggregator_submissions')
      .where('submission_status', 'RETRY')
      .where('next_retry_at', '<=', new Date())
      .whereRaw('retry_count < max_retries')
      .orderBy('next_retry_at', 'asc');

    return rows.map(row => this.mapRowToSubmission(row));
  }

  /**
   * Get submissions by status
   */
  async getSubmissionsByStatus(
    status: StateAggregatorSubmission['submissionStatus'],
    limit: number = 100
  ): Promise<StateAggregatorSubmission[]> {
    const rows = await this.db('state_aggregator_submissions')
      .where({ submission_status: status })
      .orderBy('submitted_at', 'desc')
      .limit(limit);

    return rows.map(row => this.mapRowToSubmission(row));
  }

  /**
   * Get submissions for an organization
   */
  async getSubmissionsForOrganization(
    organizationId: UUID,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: StateAggregatorSubmission['submissionStatus'];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ submissions: StateAggregatorSubmission[]; total: number }> {
    // Build query to join with evv_records to filter by organization
    let query = this.db('state_aggregator_submissions as sas')
      .join('evv_records as evr', 'sas.evv_record_id', 'evr.id')
      .where('evr.organization_id', organizationId);

    // Apply filters
    if (options?.startDate) {
      query = query.where('sas.submitted_at', '>=', options.startDate);
    }
    if (options?.endDate) {
      query = query.where('sas.submitted_at', '<=', options.endDate);
    }
    if (options?.status) {
      query = query.where('sas.submission_status', options.status);
    }

    // Get total count
    const countResult = await query.clone().count('* as count') as Array<{ count: string | number }>;
    const total = typeof countResult[0]?.count === 'string' ? parseInt(countResult[0].count, 10) : (countResult[0]?.count || 0);

    // Get paginated results
    const rows = await query
      .select('sas.*')
      .orderBy('sas.submitted_at', 'desc')
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const submissions = rows.map(row => this.mapRowToSubmission(row));

    return { submissions, total };
  }

  /**
   * Get submission statistics for an organization
   */
  async getSubmissionStats(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
    retry: number;
  }> {
    const rows = await this.db('state_aggregator_submissions as sas')
      .join('evv_records as evr', 'sas.evv_record_id', 'evr.id')
      .where('evr.organization_id', organizationId)
      .whereBetween('sas.submitted_at', [startDate, endDate])
      .select('sas.submission_status')
      .count('* as count')
      .groupBy('sas.submission_status') as Array<{ submission_status: string; count: string | number }>;

    const stats = {
      total: 0,
      accepted: 0,
      rejected: 0,
      pending: 0,
      retry: 0,
    };

    rows.forEach(row => {
      const count = typeof row.count === 'string' ? parseInt(row.count, 10) : row.count;
      stats.total += count;

      switch (row.submission_status) {
        case 'ACCEPTED':
          stats.accepted += count;
          break;
        case 'REJECTED':
          stats.rejected += count;
          break;
        case 'PENDING':
          stats.pending += count;
          break;
        case 'RETRY':
          stats.retry += count;
          break;
      }
    });

    return stats;
  }

  /**
   * Map database row to domain model
   */
  private mapRowToSubmission(row: AggregatorSubmissionRow): StateAggregatorSubmission {
    return {
      id: row.id,
      state: row.state_code as StateAggregatorSubmission['state'],
      evvRecordId: row.evv_record_id,
      aggregatorId: row.aggregator_id,
      aggregatorType: row.aggregator_type,
      submissionPayload: row.submission_payload as Record<string, unknown>,
      submissionFormat: row.submission_format as StateAggregatorSubmission['submissionFormat'],
      submittedAt: row.submitted_at,
      submittedBy: row.submitted_by,
      submissionStatus: row.submission_status as StateAggregatorSubmission['submissionStatus'],
      aggregatorResponse: row.aggregator_response as Record<string, unknown> | undefined,
      aggregatorConfirmationId: row.aggregator_confirmation_id || undefined,
      aggregatorReceivedAt: row.aggregator_received_at || undefined,
      errorCode: row.error_code || undefined,
      errorMessage: row.error_message || undefined,
      errorDetails: row.error_details as Record<string, unknown> | undefined,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      nextRetryAt: row.next_retry_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
