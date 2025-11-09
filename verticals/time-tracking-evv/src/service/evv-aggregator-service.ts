/**
 * EVV Aggregator Integration Service
 *
 * Handles submission of EVV data to state-mandated aggregators:
 * - Texas: HHAeXchange (mandatory)
 * - Florida: Multiple aggregators (HHAeXchange, Netsmart/Tellus, etc.)
 * - Ohio, Pennsylvania, North Carolina, Arizona: Sandata
 * - Georgia: Tellus (Netsmart)
 *
 * Implements retry logic, error handling, and compliance tracking.
 */

import {
  UUID,
  NotFoundError,
  ValidationError,
} from '@care-commons/core';
import { EVVRecord } from '../types/evv.js';
import {
  StateCode,
  StateAggregatorSubmission,
} from '../types/state-specific.js';
import { getAggregatorRouter } from '../aggregators/aggregator-router.js';
import { AggregatorSubmissionRepository } from '../repository/aggregator-submission-repository.js';
import { AggregatorConfigRepository } from '../repository/aggregator-config-repository.js';
import type { Knex } from 'knex';

/**
 * EVV Aggregator Service
 *
 * Handles all EVV data submission to state aggregators with proper error handling,
 * retry logic, and compliance tracking.
 *
 * Uses the aggregator router pattern for multi-state support.
 */
export class EVVAggregatorService {
  private submissionRepository: AggregatorSubmissionRepository;
  private configRepository: AggregatorConfigRepository;
  private aggregatorRouter = getAggregatorRouter();

  constructor(db: Knex) {
    this.submissionRepository = new AggregatorSubmissionRepository(db);
    this.configRepository = new AggregatorConfigRepository(db);
  }

  /**
   * Submit EVV record to appropriate state aggregator(s)
   *
   * @throws ValidationError if EVV record is incomplete
   * @throws NotFoundError if aggregator configuration not found
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<StateAggregatorSubmission[]> {
    // Validate EVV record is complete
    this.validateEVVRecord(evvRecord);

    // Get state code from service address
    const stateCode = this.extractStateCode(evvRecord);

    // Get aggregator configuration for this org/branch/state
    const config = await this.configRepository.getStateConfig(
      evvRecord.organizationId,
      evvRecord.branchId || null,
      stateCode
    );

    if (!config) {
      throw new NotFoundError(
        `Aggregator configuration not found for state ${stateCode}`,
        {
          organizationId: evvRecord.organizationId,
          branchId: evvRecord.branchId,
          stateCode,
        }
      );
    }

    // Create submission record
    const configAny = config as any;
    const evvRecordAny = evvRecord as any;
    const submission = await this.submissionRepository.createSubmission({
      state: stateCode,
      evvRecordId: evvRecordAny.id,
      aggregatorId: (configAny.aggregatorEntityId as string | undefined) || (configAny.aggregatorType as string | undefined) || 'unknown',
      aggregatorType: (configAny.aggregatorType as string | undefined) || 'UNKNOWN',
      submissionPayload: {
        visitId: evvRecord.visitId,
        serviceDate: evvRecord.serviceDate.toISOString(),
        clockInTime: evvRecord.clockInTime.toISOString(),
        clockOutTime: evvRecord.clockOutTime?.toISOString(),
      },
      submissionFormat: 'JSON',
      submittedAt: new Date(),
      submittedBy: evvRecordAny.recordedBy || evvRecordAny.createdBy,
      submissionStatus: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
    });

    try {
      // Submit using aggregator router
      const result = await this.aggregatorRouter.submit(evvRecord, stateCode);

      if (result.success) {
        // Update submission as accepted
        await this.submissionRepository.updateSubmission(submission.id, {
          submissionStatus: 'ACCEPTED',
          aggregatorConfirmationId: result.confirmationId,
          aggregatorReceivedAt: new Date(),
          aggregatorResponse: result as any,
        });
      } else {
        // Update submission with error
        await this.submissionRepository.updateSubmission(submission.id, {
          submissionStatus: result.requiresRetry ? 'RETRY' : 'REJECTED',
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          errorDetails: result as any,
          nextRetryAt: result.requiresRetry ? this.calculateNextRetry(0) : undefined,
        });
      }

      return [submission];
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.submissionRepository.updateSubmission(submission.id, {
        submissionStatus: 'RETRY',
        errorCode: 'NETWORK_ERROR',
        errorMessage,
        nextRetryAt: this.calculateNextRetry(0),
      });

      return [submission];
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id: UUID): Promise<StateAggregatorSubmission | null> {
    return await this.submissionRepository.getSubmissionById(id);
  }

  /**
   * Get all submissions for an EVV record
   */
  async getSubmissionsByEVVRecord(evvRecordId: UUID): Promise<StateAggregatorSubmission[]> {
    return await this.submissionRepository.getSubmissionsByEVVRecord(evvRecordId);
  }

  /**
   * Get submission statistics for an organization
   */
  async getSubmissionStats(organizationId: UUID, startDate: Date, endDate: Date) {
    return await this.submissionRepository.getSubmissionStats(organizationId, startDate, endDate);
  }

  /**
   * Get submissions for an organization with optional filters
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
  ) {
    return await this.submissionRepository.getSubmissionsForOrganization(organizationId, options);
  }

  /**
   * Manually retry a failed submission
   */
  async retrySubmission(submissionId: UUID): Promise<StateAggregatorSubmission> {
    const submission = await this.submissionRepository.getSubmissionById(submissionId);

    if (!submission) {
      throw new NotFoundError(`Submission not found: ${submissionId}`);
    }

    if (submission.submissionStatus === 'ACCEPTED') {
      throw new ValidationError('Cannot retry accepted submission');
    }

    if (submission.retryCount >= submission.maxRetries) {
      throw new ValidationError('Max retries exceeded');
    }

    // Get the EVV record (would need to be passed in or fetched from another service)
    // For now, we'll just update the retry fields
    await this.submissionRepository.updateSubmission(submissionId, {
      submissionStatus: 'RETRY',
      retryCount: submission.retryCount + 1,
      nextRetryAt: this.calculateNextRetry(submission.retryCount + 1),
    });

    return (await this.submissionRepository.getSubmissionById(submissionId))!;
  }

  /**
   * Retry failed submissions (background job)
   */
  async retryPendingSubmissions(): Promise<number> {
    const pending = await this.submissionRepository.getPendingRetries();
    let retriedCount = 0;

    for (const submission of pending) {
      if (submission.retryCount >= submission.maxRetries) {
        // Max retries reached, mark as failed
        await this.submissionRepository.updateSubmission(submission.id, {
          submissionStatus: 'REJECTED',
          errorMessage: 'Max retries exceeded',
        });
        continue;
      }

      try {
        // Would need to fetch the EVV record and retry submission
        // For now, just update retry count
        await this.submissionRepository.updateSubmission(submission.id, {
          retryCount: submission.retryCount + 1,
          nextRetryAt: this.calculateNextRetry(submission.retryCount + 1),
        });
        retriedCount++;
      } catch (error) {
        // Log error and continue
        console.error(`Failed to retry submission ${submission.id}:`, error);
      }
    }

    return retriedCount;
  }

  /**
   * Validate EVV record is complete and ready for submission
   */
  private validateEVVRecord(evvRecord: EVVRecord): void {
    const errors: string[] = [];

    if (!evvRecord.clockInTime) {
      errors.push('clockInTime is required');
    }

    if (!evvRecord.clockOutTime) {
      errors.push('clockOutTime is required - record must be complete');
    }

    if (!evvRecord.clockInVerification) {
      errors.push('clockInVerification is required');
    }

    if (!evvRecord.clockOutVerification) {
      errors.push('clockOutVerification is required');
    }

    if (!evvRecord.clientMedicaidId && !evvRecord.clientId) {
      errors.push('clientMedicaidId or clientId is required');
    }

    if (!evvRecord.serviceTypeCode) {
      errors.push('serviceTypeCode is required');
    }

    if (errors.length > 0) {
      throw new ValidationError(
        'EVV record incomplete for aggregator submission',
        { errors, evvRecordId: evvRecord.id }
      );
    }
  }

  /**
   * Extract state code from EVV record
   */
  private extractStateCode(evvRecord: EVVRecord): StateCode {
    const stateAbbr = evvRecord.serviceAddress.state;

    const validStates: StateCode[] = ['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'];
    if (validStates.includes(stateAbbr as StateCode)) {
      return stateAbbr as StateCode;
    }

    throw new ValidationError(
      `Unsupported state for EVV aggregator: ${stateAbbr}`,
      { state: stateAbbr, evvRecordId: evvRecord.id, supportedStates: validStates }
    );
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(retryCount: number): Date {
    // Exponential backoff: 1min, 5min, 30min
    const delays = [60, 300, 1800]; // seconds
    const delay = delays[Math.min(retryCount, delays.length - 1)]!;
    return new Date(Date.now() + delay * 1000);
  }
}
