/**
 * EVV Aggregator Integration Service
 * 
 * Handles submission of EVV data to state-mandated aggregators:
 * - Texas: HHAeXchange (mandatory)
 * - Florida: Multiple aggregators (HHAeXchange, Netsmart/Tellus, etc.)
 * 
 * Implements retry logic, error handling, and compliance tracking.
 */

import {
  UUID,
  NotFoundError,
  ValidationError,
} from '@care-commons/core';
import { EVVRecord } from '../types/evv';
import {
  StateCode,
  TexasEVVConfig,
  FloridaEVVConfig,
  StateAggregatorSubmission,
} from '../types/state-specific';

/**
 * Aggregator submission payload for HHAeXchange
 */
interface HHAeXchangePayload extends Record<string, unknown> {
  visitId: string;
  memberId: string;
  memberName: string;
  providerId: string;
  providerName: string;
  serviceCode: string;
  serviceDate: string;
  clockInTime: string;
  clockOutTime?: string;
  clockInLatitude: number;
  clockInLongitude: number;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockMethod: string;
  duration?: number;
  verificationStatus: string;
}

/**
 * Aggregator response
 */
interface AggregatorResponse extends Record<string, unknown> {
  success: boolean;
  confirmationId?: string;
  errorCode?: string;
  errorMessage?: string;
  requiresRetry?: boolean;
}

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

    // Submit based on state
    if (config.state === 'TX') {
      return await this.submitToTexasAggregator(evvRecord, config as TexasEVVConfig);
    } else if (config.state === 'FL') {
      return await this.submitToFloridaAggregators(evvRecord, config as FloridaEVVConfig);
    }

    throw new ValidationError(`Unsupported state code: ${stateCode}`);
  }

  /**
   * Submit to Texas aggregator (single mandatory aggregator)
   */
  private async submitToTexasAggregator(
    evvRecord: EVVRecord,
    config: TexasEVVConfig
  ): Promise<StateAggregatorSubmission[]> {
    const payload = this.buildHHAeXchangePayload(evvRecord, 'TX');

    const submission = await this.submissionRepository.createSubmission({
      state: 'TX',
      evvRecordId: evvRecord.id,
      aggregatorId: config.aggregatorEntityId,
      aggregatorType: config.aggregatorType,
      submissionPayload: payload,
      submissionFormat: 'JSON',
      submittedAt: new Date(),
      submittedBy: evvRecord.recordedBy,
      submissionStatus: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
    });

    // Attempt to send to aggregator
    try {
      const response = await this.sendToHHAeXchange(
        config.aggregatorSubmissionEndpoint,
        payload,
        config.aggregatorApiKey
      );

      if (response.success) {
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: 'ACCEPTED',
          aggregatorResponse: response,
          aggregatorReceivedAt: new Date(),
        };

        if (response.confirmationId !== undefined) {
          updateData.aggregatorConfirmationId = response.confirmationId;
        }

        await this.submissionRepository.updateSubmission(submission.id, updateData);
      } else {
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: response.requiresRetry ? 'RETRY' : 'REJECTED',
          errorDetails: response,
          retryCount: 0,
        };

        if (response.errorCode !== undefined) {
          updateData.errorCode = response.errorCode;
        }
        if (response.errorMessage !== undefined) {
          updateData.errorMessage = response.errorMessage;
        }
        if (response.requiresRetry) {
          updateData.nextRetryAt = this.calculateNextRetry(0);
        }

        await this.submissionRepository.updateSubmission(submission.id, updateData);
      }
    } catch (error: any) {
      await this.submissionRepository.updateSubmission(submission.id, {
        submissionStatus: 'RETRY' as const,
        errorCode: 'NETWORK_ERROR',
        errorMessage: error.message,
        retryCount: 0,
        nextRetryAt: this.calculateNextRetry(0),
      });
    }

    return [submission];
  }

  /**
   * Submit to Florida aggregators (potentially multiple)
   */
  private async submitToFloridaAggregators(
    evvRecord: EVVRecord,
    config: FloridaEVVConfig
  ): Promise<StateAggregatorSubmission[]> {
    const submissions: StateAggregatorSubmission[] = [];

    // Determine which aggregator(s) to use based on payer/MCO
    // For now, use the default aggregator
    const aggregatorConfig = config.aggregators.find(
      agg => agg.id === config.defaultAggregator && agg.isActive
    );

    if (!aggregatorConfig) {
      throw new NotFoundError(
        `No active aggregator found for Florida`,
        { organizationId: evvRecord.organizationId }
      );
    }

    const payload = this.buildHHAeXchangePayload(evvRecord, 'FL');

    const submission = await this.submissionRepository.createSubmission({
      state: 'FL',
      evvRecordId: evvRecord.id,
      aggregatorId: aggregatorConfig.id,
      aggregatorType: aggregatorConfig.type,
      submissionPayload: payload,
      submissionFormat: 'JSON',
      submittedAt: new Date(),
      submittedBy: evvRecord.recordedBy,
      submissionStatus: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
    });

    // Attempt to send to aggregator
    try {
      const response = await this.sendToHHAeXchange(
        aggregatorConfig.endpoint,
        payload,
        aggregatorConfig.apiKey
      );

      if (response.success) {
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: 'ACCEPTED',
          aggregatorResponse: response,
          aggregatorReceivedAt: new Date(),
        };

        if (response.confirmationId !== undefined) {
          updateData.aggregatorConfirmationId = response.confirmationId;
        }

        await this.submissionRepository.updateSubmission(submission.id, updateData);
      } else {
        const updateData: Partial<StateAggregatorSubmission> = {
          submissionStatus: response.requiresRetry ? 'RETRY' : 'REJECTED',
          errorDetails: response,
          retryCount: 0,
        };

        if (response.errorCode !== undefined) {
          updateData.errorCode = response.errorCode;
        }
        if (response.errorMessage !== undefined) {
          updateData.errorMessage = response.errorMessage;
        }
        if (response.requiresRetry) {
          updateData.nextRetryAt = this.calculateNextRetry(0);
        }

        await this.submissionRepository.updateSubmission(submission.id, updateData);
      }
    } catch (error: any) {
      await this.submissionRepository.updateSubmission(submission.id, {
        submissionStatus: 'RETRY',
        errorCode: 'NETWORK_ERROR',
        errorMessage: error.message,
        retryCount: 0,
        nextRetryAt: this.calculateNextRetry(0),
      });
    }

    submissions.push(submission);
    return submissions;
  }

  /**
   * Retry failed submissions
   */
  async retryPendingSubmissions(): Promise<void> {
    const pending = await this.submissionRepository.getPendingRetries();

    for (const submission of pending) {
      if (submission.retryCount >= submission.maxRetries) {
        // Max retries reached, mark as failed
        await this.submissionRepository.updateSubmission(submission.id, {
          submissionStatus: 'REJECTED',
          errorMessage: 'Max retries exceeded',
        });
        continue;
      }

      // TODO: Retry the submission
      // This would fetch the config and resend
    }
  }

  /**
   * Build HHAeXchange-compatible payload
   */
  private buildHHAeXchangePayload(
    evvRecord: EVVRecord,
    _stateCode: StateCode
  ): HHAeXchangePayload {
    const basePayload = {
      visitId: evvRecord.visitId,
      memberId: evvRecord.clientMedicaidId ?? evvRecord.clientId,
      memberName: evvRecord.clientName,
      providerId: evvRecord.caregiverEmployeeId,
      providerName: evvRecord.caregiverName,
      serviceCode: evvRecord.serviceTypeCode,
      serviceDate: evvRecord.serviceDate.toISOString().split('T')[0]!,
      clockInTime: evvRecord.clockInTime.toISOString(),
      clockInLatitude: evvRecord.clockInVerification.latitude,
      clockInLongitude: evvRecord.clockInVerification.longitude,
      clockMethod: evvRecord.clockInVerification.method,
      duration: evvRecord.totalDuration,
      verificationStatus: this.mapVerificationStatus(evvRecord),
    };

    const optionalFields = {
      clockOutTime: evvRecord.clockOutTime?.toISOString(),
      clockOutLatitude: evvRecord.clockOutVerification?.latitude,
      clockOutLongitude: evvRecord.clockOutVerification?.longitude,
    };

    const filteredOptional = Object.fromEntries(
      Object.entries(optionalFields).filter(([_, value]) => value !== undefined)
    );

    return { ...basePayload, ...filteredOptional } as HHAeXchangePayload;
  }

  /**
   * Send payload to HHAeXchange API
   * 
   * NOTE: This is a stub implementation. In production, implement proper HTTP client
   * with authentication, SSL/TLS, retries, and logging.
   */
  private async sendToHHAeXchange(
    endpoint: string,
    _payload: HHAeXchangePayload,
    _apiKey?: string
  ): Promise<AggregatorResponse> {
    // TODO: Implement actual HTTP POST to aggregator
    // Example using fetch or axios:
    //
    // const response = await fetch(endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`,
    //   },
    //   body: JSON.stringify(payload),
    // });
    //
    // return await response.json();

    throw new Error(
      'HHAeXchange integration not implemented. ' +
      'Production implementation must include proper HTTP client with ' +
      'authentication, SSL/TLS verification, retries, and logging. ' +
      `Endpoint: ${endpoint}`
    );
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

    if (stateAbbr === 'TX') return 'TX';
    if (stateAbbr === 'FL') return 'FL';

    throw new ValidationError(
      `Unsupported state for EVV aggregator: ${stateAbbr}`,
      { state: stateAbbr, evvRecordId: evvRecord.id }
    );
  }

  /**
   * Map verification level to aggregator-friendly status
   */
  private mapVerificationStatus(evvRecord: EVVRecord): string {
    switch (evvRecord.verificationLevel) {
      case 'FULL':
        return 'VERIFIED';
      case 'PARTIAL':
        return 'PARTIAL';
      case 'MANUAL':
        return 'MANUAL_OVERRIDE';
      case 'EXCEPTION':
        return 'EXCEPTION';
      default:
        return 'UNKNOWN';
    }
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
