/**
 * Base Aggregator Interface
 * 
 * SOLID: Interface Segregation - Clean contract for all aggregator implementations
 * APIE: Polymorphism - Enables swapping aggregators based on state requirements
 * 
 * All state EVV aggregators must implement this interface to ensure consistency
 * and enable the state router pattern in EVVService.
 */

import { EVVRecord } from '../types/evv.js';
import { StateCode, StateAggregatorSubmission } from '../types/state-specific.js';

/**
 * State-specific EVV configuration
 * Contains the parameters needed for aggregator submission
 */
export interface StateEVVConfig {
  state: StateCode;
  aggregatorType: string;
  aggregatorEndpoint: string;
  aggregatorApiKey?: string;
  gracePeriodMinutes: number;
  geofenceRadiusMeters: number;
  retryPolicy?: RetryPolicy;
  // State-specific extensions
  [key: string]: unknown;
}

/**
 * Retry policy for failed submissions
 */
export interface RetryPolicy {
  maxRetries: number;
  backoffType: 'LINEAR' | 'EXPONENTIAL';
  baseDelaySeconds: number;
  maxDelaySeconds: number;
}

/**
 * Aggregator submission result
 */
export interface AggregatorSubmissionResult {
  success: boolean;
  submissionId: string;
  confirmationId?: string;
  errorCode?: string;
  errorMessage?: string;
  requiresRetry?: boolean;
  retryAfterSeconds?: number;
}

/**
 * Base aggregator interface
 * All state aggregators (Sandata, Tellus, HHAeXchange, etc.) implement this
 */
export interface IAggregator {
  /**
   * Submit EVV record to the aggregator
   * 
   * @param evvRecord - Complete EVV record with clock-in and clock-out
   * @param config - State-specific configuration
   * @returns Submission result with confirmation or error details
   */
  submit(
    evvRecord: EVVRecord,
    config: StateEVVConfig
  ): Promise<AggregatorSubmissionResult>;

  /**
   * Check submission status
   * 
   * @param submissionId - ID returned from submit()
   * @returns Current status of the submission
   */
  getSubmissionStatus?(
    submissionId: string,
    config: StateEVVConfig
  ): Promise<SubmissionStatus>;

  /**
   * Retry a failed submission
   * 
   * @param submission - Original submission record
   * @param config - State-specific configuration
   * @returns Retry result
   */
  retry?(
    submission: StateAggregatorSubmission,
    config: StateEVVConfig
  ): Promise<AggregatorSubmissionResult>;

  /**
   * Validate EVV record meets aggregator requirements
   * 
   * @param evvRecord - EVV record to validate
   * @param config - State-specific configuration
   * @returns Validation result with any errors
   */
  validate?(
    evvRecord: EVVRecord,
    config: StateEVVConfig
  ): ValidationResult;
}

/**
 * Submission status from aggregator
 */
export interface SubmissionStatus {
  submissionId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED';
  confirmationId?: string;
  errorMessage?: string;
  lastUpdated: Date;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'ERROR';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  severity: 'WARNING';
}

/**
 * Common retry policies
 */
export const EXPONENTIAL_BACKOFF: RetryPolicy = {
  maxRetries: 3,
  backoffType: 'EXPONENTIAL',
  baseDelaySeconds: 60,
  maxDelaySeconds: 1800, // 30 minutes max
};

export const LINEAR_BACKOFF: RetryPolicy = {
  maxRetries: 5,
  backoffType: 'LINEAR',
  baseDelaySeconds: 300, // 5 minutes
  maxDelaySeconds: 1800,
};

/**
 * Helper: Calculate retry delay based on policy
 */
export function calculateRetryDelay(
  retryCount: number,
  policy: RetryPolicy
): number {
  if (policy.backoffType === 'EXPONENTIAL') {
    const delay = policy.baseDelaySeconds * Math.pow(2, retryCount);
    return Math.min(delay, policy.maxDelaySeconds);
  }
  
  // Linear backoff
  const delay = policy.baseDelaySeconds * (retryCount + 1);
  return Math.min(delay, policy.maxDelaySeconds);
}
