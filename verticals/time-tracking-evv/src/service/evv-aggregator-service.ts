/**
 * EVV Aggregator Integration Service
 *
 * Handles submission of EVV data to state-mandated aggregators:
 * - Texas: HHAeXchange
 * - Florida: HHAeXchange (multi-aggregator support)
 * - Ohio, Pennsylvania, North Carolina, Arizona: Sandata
 * - Georgia: Tellus
 *
 * Implements retry logic, error handling, and compliance tracking.
 * Uses aggregator router for automatic state-based routing.
 */

import {
  UUID,
  NotFoundError,
  ValidationError,
} from '@care-commons/core';
import { EVVRecord } from '../types/evv';
import {
  StateCode,
  StateAggregatorSubmission,
  TexasEVVConfig,
  FloridaEVVConfig,
} from '../types/state-specific';
import { getAggregatorRouter } from '../aggregators/aggregator-router.js';

/**
 * Aggregator submission payload for HHAeXchange
 * (Note: Unused - kept for reference)
 */
// interface HHAeXchangePayload extends Record<string, unknown> {
//   visitId: string;
//   memberId: string;
//   memberName: string;
//   providerId: string;
//   providerName: string;
//   serviceCode: string;
//   serviceDate: string;
//   clockInTime: string;
//   clockOutTime?: string;
//   clockInLatitude: number;
//   clockInLongitude: number;
//   clockOutLatitude?: number;
//   clockOutLongitude?: number;
//   clockMethod: string;
//   duration?: number;
//   verificationStatus: string;
// }

/**
 * Aggregator response
 * (Note: Unused - kept for reference)
 */
// interface AggregatorResponse extends Record<string, unknown> {
//   success: boolean;
//   confirmationId?: string;
//   errorCode?: string;
//   errorMessage?: string;
//   requiresRetry?: boolean;
// }

/**
 * Aggregator configuration repository interface
 */
export interface IAggregatorConfigRepository {
  getStateConfig(organizationId: UUID, branchId: UUID, stateCode: StateCode): Promise<TexasEVVConfig | FloridaEVVConfig | null>;
}

/**
 * Aggregator submission repository interface
 */
export interface IAggregatorSubmissionRepository {
  createSubmission(submission: Omit<StateAggregatorSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<StateAggregatorSubmission>;
  updateSubmission(id: UUID, updates: Partial<StateAggregatorSubmission>): Promise<StateAggregatorSubmission>;
  getSubmissionsByEVVRecord(evvRecordId: UUID): Promise<StateAggregatorSubmission[]>;
  getPendingRetries(): Promise<StateAggregatorSubmission[]>;
}

/**
 * EVV Aggregator Service
 * 
 * Handles all EVV data submission to state aggregators with proper error handling,
 * retry logic, and compliance tracking.
 */
export class EVVAggregatorService {
  constructor(
    private configRepository: IAggregatorConfigRepository,
    private submissionRepository: IAggregatorSubmissionRepository
  ) {}

  /**
   * Submit EVV record to appropriate state aggregator(s)
   *
   * Uses aggregator router to automatically route to the correct aggregator
   * based on state configuration.
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
      evvRecord.branchId,
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
    const submission = await this.submissionRepository.createSubmission({
      state: stateCode,
      evvRecordId: evvRecord.id,
      aggregatorId: (config as unknown as Record<string, unknown>).aggregatorEntityId as string || 'default',
      aggregatorType: (config as unknown as Record<string, unknown>).aggregatorType as string || 'UNKNOWN',
      submissionPayload: evvRecord as unknown as Record<string, unknown>, // Will be formatted by aggregator
      submissionFormat: 'JSON',
      submittedAt: new Date(),
      submittedBy: evvRecord.recordedBy,
      submissionStatus: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
    });

    try {
      // Use aggregator router to submit
      const router = getAggregatorRouter();
      const result = await router.submit(evvRecord, stateCode);

      if (result.success) {
        // Update submission as accepted
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: 'ACCEPTED',
          aggregatorResponse: result as unknown as Record<string, unknown>,
          aggregatorReceivedAt: new Date(),
        };

        if (result.confirmationId) {
          updateData.aggregatorConfirmationId = result.confirmationId;
        }

        await this.submissionRepository.updateSubmission(submission.id, updateData);
      } else {
        // Update submission with error
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: result.requiresRetry ? 'RETRY' : 'REJECTED',
          errorDetails: result as unknown as Record<string, unknown>,
          retryCount: 0,
        };

        if (result.errorCode) {
          updateData.errorCode = result.errorCode;
        }
        if (result.errorMessage) {
          updateData.errorMessage = result.errorMessage;
        }
        if (result.requiresRetry && result.retryAfterSeconds) {
          updateData.nextRetryAt = new Date(Date.now() + result.retryAfterSeconds * 1000);
        }

        await this.submissionRepository.updateSubmission(submission.id, updateData);
      }
    } catch (error: any) {
      // Handle submission error
      await this.submissionRepository.updateSubmission(submission.id, {
        submissionStatus: 'RETRY',
        errorCode: 'NETWORK_ERROR',
        errorMessage: error.message || 'Unknown error',
        retryCount: 0,
        nextRetryAt: this.calculateNextRetry(0),
      });
    }

    return [submission];
  }

  /**
   * Manually retry a failed submission
   *
   * Allows coordinators to manually retry submissions that failed.
   */
  async retrySubmission(submissionId: UUID): Promise<StateAggregatorSubmission> {
    const submission = await this.submissionRepository.getSubmissionsByEVVRecord(submissionId);

    if (!submission || submission.length === 0) {
      throw new NotFoundError(`Submission not found: ${submissionId}`);
    }

    const sub = submission[0]!;

    // Check if retry is allowed
    if (sub.retryCount >= sub.maxRetries) {
      throw new ValidationError(
        'Maximum retries exceeded. Cannot retry this submission.',
        { submissionId, retryCount: sub.retryCount, maxRetries: sub.maxRetries }
      );
    }

    // Get the EVV record (from submission payload)
    const evvRecord = sub.submissionPayload as unknown as EVVRecord;

    // Get state code
    const stateCode = this.extractStateCode(evvRecord);

    // Get aggregator configuration
    const config = await this.configRepository.getStateConfig(
      evvRecord.organizationId,
      evvRecord.branchId,
      stateCode
    );

    if (!config) {
      throw new NotFoundError(
        `Aggregator configuration not found for state ${stateCode}`
      );
    }

    try {
      // Use aggregator router to retry
      const router = getAggregatorRouter();
      const result = await router.submit(evvRecord, stateCode);

      if (result.success) {
        // Update submission as accepted
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: 'ACCEPTED',
          aggregatorResponse: result as unknown as Record<string, unknown>,
          aggregatorReceivedAt: new Date(),
          retryCount: sub.retryCount + 1,
        };

        if (result.confirmationId) {
          updateData.aggregatorConfirmationId = result.confirmationId;
        }

        return await this.submissionRepository.updateSubmission(sub.id, updateData);
      } else {
        // Update submission with error
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: result.requiresRetry ? 'RETRY' : 'REJECTED',
          errorDetails: result as unknown as Record<string, unknown>,
          retryCount: sub.retryCount + 1,
        };

        if (result.errorCode) {
          updateData.errorCode = result.errorCode;
        }
        if (result.errorMessage) {
          updateData.errorMessage = result.errorMessage;
        }
        if (result.requiresRetry && result.retryAfterSeconds) {
          updateData.nextRetryAt = new Date(Date.now() + result.retryAfterSeconds * 1000);
        }

        return await this.submissionRepository.updateSubmission(sub.id, updateData);
      }
    } catch (error: any) {
      // Handle submission error
      return await this.submissionRepository.updateSubmission(sub.id, {
        submissionStatus: 'RETRY',
        errorCode: 'NETWORK_ERROR',
        errorMessage: error.message || 'Unknown error',
        retryCount: sub.retryCount + 1,
        nextRetryAt: this.calculateNextRetry(sub.retryCount + 1),
      });
    }
  }

  /**
   * Retry all pending submissions
   *
   * Called by the submission scheduler to automatically retry failed submissions.
   */
  async retryPendingSubmissions(): Promise<void> {
    const pending = await this.submissionRepository.getPendingRetries();

    for (const submission of pending) {
      // Skip if max retries reached
      if (submission.retryCount >= submission.maxRetries) {
        await this.submissionRepository.updateSubmission(submission.id, {
          submissionStatus: 'REJECTED',
          errorMessage: 'Max retries exceeded',
        });
        continue;
      }

      // Skip if not yet time to retry
      if (submission.nextRetryAt && submission.nextRetryAt > new Date()) {
        continue;
      }

      // Retry the submission
      try {
        await this.retrySubmission(submission.id);
      } catch (error) {
        console.error(`Failed to retry submission ${submission.id}:`, error);
        // Continue with next submission
      }
    }
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
