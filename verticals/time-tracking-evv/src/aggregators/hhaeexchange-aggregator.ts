/**
 * HHAeXchange EVV Aggregator
 *
 * HHAeXchange is a major EVV aggregator serving multiple states including:
 * - Texas (state-mandated)
 * - Florida (one of multiple options)
 * - Several other states
 *
 * Domain Knowledge:
 * - REST API with API key authentication
 * - Supports real-time visit submission
 * - Texas requires VMUR (Visit Maintenance Unlock Request) support
 * - GPS accuracy requirements vary by state (TX: ≤100m)
 * - Handles pause events and exception processing
 */

import {
  IAggregator,
  StateEVVConfig,
  AggregatorSubmissionResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  EXPONENTIAL_BACKOFF,
} from './base-aggregator.js';
import { EVVRecord } from '../types/evv.js';

/**
 * HHAeXchange API payload structure
 */
interface HHAeXchangePayload {
  // Visit identification
  visitId: string;
  externalVisitId?: string;

  // Member (client) information
  memberId: string;
  memberName: string;
  memberMedicaidId?: string;

  // Provider (caregiver) information
  providerId: string;
  providerName: string;
  providerNPI?: string;

  // Service information
  serviceCode: string;
  serviceName: string;
  serviceDate: string;
  serviceAuthorization?: string;

  // Time information
  clockInTime: string;
  clockOutTime?: string;
  totalMinutes?: number;

  // Location verification
  clockInLatitude: number;
  clockInLongitude: number;
  clockInAccuracy: number;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockOutAccuracy?: number;

  // Verification details
  clockMethod: string;
  verificationStatus: string;
  verificationLevel: string;

  // Additional tracking
  pauseEvents?: Array<{
    pauseTime: string;
    resumeTime?: string;
    pauseReason: string;
  }>;

  // State-specific extensions
  stateSpecific?: Record<string, unknown>;
}

/**
 * HHAeXchange API response
 */
interface HHAeXchangeResponse {
  success: boolean;
  confirmationId?: string;
  visitReferenceNumber?: string;
  errors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
  warnings?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

/**
 * HHAeXchange Aggregator Implementation
 *
 * SOLID: Single Responsibility - Handles only HHAeXchange API interaction
 * APIE: Encapsulation - State-specific logic handled via configuration
 */
export class HHAeXchangeAggregator implements IAggregator {
  /**
   * Submit EVV record to HHAeXchange
   *
   * Works for all states using HHAeXchange (TX, FL, etc.).
   * State-specific requirements handled through configuration.
   */
  async submit(
    evvRecord: EVVRecord,
    config: StateEVVConfig
  ): Promise<AggregatorSubmissionResult> {
    // Validate record before submission
    const validation = this.validate(evvRecord, config);
    if (!validation.isValid) {
      return {
        success: false,
        submissionId: '',
        errorCode: 'VALIDATION_FAILED',
        errorMessage: `EVV record validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        requiresRetry: false,
      };
    }

    // Build HHAeXchange-compliant payload
    const payload = this.formatPayload(evvRecord, config);

    try {
      // Send to HHAeXchange API
      const response = await this.sendToHHAeXchange(payload, config);

      if (response.success) {
        return {
          success: true,
          submissionId: response.visitReferenceNumber!,
          confirmationId: response.confirmationId,
        };
      }

      // Submission rejected
      const errorMessages = response.errors?.map(e => e.message).join('; ') || 'Submission rejected';
      const errorCodes = response.errors?.map(e => e.code) || [];

      return {
        success: false,
        submissionId: response.visitReferenceNumber || '',
        errorCode: errorCodes[0] || 'SUBMISSION_REJECTED',
        errorMessage: errorMessages,
        requiresRetry: this.isRetryableError(errorCodes[0]),
        retryAfterSeconds: this.isRetryableError(errorCodes[0]) ? EXPONENTIAL_BACKOFF.baseDelaySeconds : undefined,
      };
    } catch (error) {
      // Network or system error - should retry
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else {
        const debugOutput = (typeof error === 'object' && error !== null)
          ? JSON.stringify(error, null, 2)
          : String(error);
        message = `${debugOutput}`;
      }

      return {
        success: false,
        submissionId: '',
        errorCode: 'NETWORK_ERROR',
        errorMessage: message || 'Failed to connect to HHAeXchange',
        requiresRetry: true,
        retryAfterSeconds: EXPONENTIAL_BACKOFF.baseDelaySeconds,
      };
    }
  }

  /**
   * Validate EVV record meets HHAeXchange requirements
   *
   * HHAeXchange requires the 6 federal EVV elements plus additional metadata.
   */
  validate(
    evvRecord: EVVRecord,
    config: StateEVVConfig
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required federal EVV elements
    if (!evvRecord.serviceTypeCode) {
      errors.push({
        field: 'serviceTypeCode',
        code: 'MISSING_SERVICE_TYPE',
        message: 'Service type code is required',
        severity: 'ERROR',
      });
    }

    if (!evvRecord.clientMedicaidId && !evvRecord.clientId) {
      errors.push({
        field: 'clientMedicaidId',
        code: 'MISSING_MEMBER_ID',
        message: 'Member identifier (Medicaid ID or Client ID) is required',
        severity: 'ERROR',
      });
    }

    if (!evvRecord.caregiverEmployeeId) {
      errors.push({
        field: 'caregiverEmployeeId',
        code: 'MISSING_PROVIDER_ID',
        message: 'Provider employee ID is required',
        severity: 'ERROR',
      });
    }

    if (!evvRecord.clockInTime) {
      errors.push({
        field: 'clockInTime',
        code: 'MISSING_START_TIME',
        message: 'Service start time is required',
        severity: 'ERROR',
      });
    }

    if (!evvRecord.clockOutTime) {
      errors.push({
        field: 'clockOutTime',
        code: 'MISSING_END_TIME',
        message: 'Service end time is required - record must be complete',
        severity: 'ERROR',
      });
    }

    if (!evvRecord.clockInVerification?.latitude || !evvRecord.clockInVerification?.longitude) {
      errors.push({
        field: 'clockInVerification',
        code: 'MISSING_LOCATION',
        message: 'GPS location coordinates are required',
        severity: 'ERROR',
      });
    }

    // Texas-specific validation
    if (config.state === 'TX') {
      // Texas requires GPS accuracy ≤100m
      if (evvRecord.clockInVerification && evvRecord.clockInVerification.accuracy > 100) {
        errors.push({
          field: 'clockInVerification.accuracy',
          code: 'GPS_ACCURACY_EXCEEDED',
          message: `GPS accuracy (${evvRecord.clockInVerification.accuracy}m) exceeds Texas requirement (100m)`,
          severity: 'ERROR',
        });
      }
    }

    // Warnings
    if (!evvRecord.caregiverNationalProviderId) {
      warnings.push({
        field: 'caregiverNationalProviderId',
        code: 'MISSING_NPI',
        message: 'National Provider Identifier (NPI) is recommended',
        severity: 'WARNING',
      });
    }

    if (evvRecord.clockInVerification && evvRecord.clockInVerification.accuracy > config.geofenceRadiusMeters) {
      warnings.push({
        field: 'clockInVerification.accuracy',
        code: 'LOW_GPS_ACCURACY',
        message: `GPS accuracy (${evvRecord.clockInVerification.accuracy}m) exceeds geofence tolerance (${config.geofenceRadiusMeters}m)`,
        severity: 'WARNING',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format EVV record into HHAeXchange API payload
   */
  private formatPayload(evvRecord: EVVRecord, config: StateEVVConfig): HHAeXchangePayload {
    const payload: HHAeXchangePayload = {
      // Visit identification
      visitId: evvRecord.visitId,

      // Member information
      memberId: evvRecord.clientId,
      memberName: evvRecord.clientName,
      memberMedicaidId: evvRecord.clientMedicaidId,

      // Provider information
      providerId: evvRecord.caregiverEmployeeId,
      providerName: evvRecord.caregiverName,
      providerNPI: evvRecord.caregiverNationalProviderId,

      // Service information
      serviceCode: evvRecord.serviceTypeCode,
      serviceName: evvRecord.serviceTypeName,
      serviceDate: evvRecord.serviceDate.toISOString().split('T')[0]!,

      // Time information
      clockInTime: evvRecord.clockInTime.toISOString(),
      clockOutTime: evvRecord.clockOutTime?.toISOString(),
      totalMinutes: evvRecord.totalDuration,

      // Location verification
      clockInLatitude: evvRecord.clockInVerification.latitude,
      clockInLongitude: evvRecord.clockInVerification.longitude,
      clockInAccuracy: evvRecord.clockInVerification.accuracy,

      // Verification details
      clockMethod: this.mapVerificationMethod(evvRecord.clockInVerification.method),
      verificationStatus: this.mapVerificationStatus(evvRecord),
      verificationLevel: evvRecord.verificationLevel,
    };

    // Add clock-out location if available
    if (evvRecord.clockOutVerification) {
      payload.clockOutLatitude = evvRecord.clockOutVerification.latitude;
      payload.clockOutLongitude = evvRecord.clockOutVerification.longitude;
      payload.clockOutAccuracy = evvRecord.clockOutVerification.accuracy;
    }

    // Add pause events if present
    if (evvRecord.pauseEvents && evvRecord.pauseEvents.length > 0) {
      payload.pauseEvents = evvRecord.pauseEvents.map(pause => ({
        pauseTime: pause.pausedAt.toISOString(),
        resumeTime: pause.resumedAt?.toISOString(),
        pauseReason: pause.reason,
      }));
    }

    // State-specific extensions
    payload.stateSpecific = {
      state: config.state,
      organizationId: evvRecord.organizationId,
      branchId: evvRecord.branchId,
      verificationLevel: evvRecord.verificationLevel,
      complianceFlags: evvRecord.complianceFlags,
    };

    return payload;
  }

  /**
   * Send payload to HHAeXchange API
   *
   * Production implementation with:
   * - API key authentication
   * - SSL/TLS verification
   * - Timeout and retry configuration
   * - Error logging
   */
  private async sendToHHAeXchange(
    payload: HHAeXchangePayload,
    config: StateEVVConfig
  ): Promise<HHAeXchangeResponse> {
    const apiKey = config.aggregatorApiKey;

    if (!apiKey) {
      throw new Error(
        `Missing API key for ${config.state}. ` +
        `Required: aggregatorApiKey in configuration`
      );
    }

    try {
      // Create AbortController for timeout
      // eslint-disable-next-line no-undef
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Send payload to HHAeXchange API
        // eslint-disable-next-line no-undef
        const response = await fetch(config.aggregatorEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-State-Code': config.state,
            'X-API-Version': '1.0',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Parse response
        const responseBody = await response.json() as HHAeXchangeResponse;

        // Check for HTTP errors
        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            return {
              success: false,
              visitReferenceNumber: responseBody.visitReferenceNumber,
              errors: [{
                field: 'rate_limit',
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'API rate limit exceeded. Please retry after the specified time.',
              }],
            };
          }

          // Other HTTP errors
          return {
            success: false,
            visitReferenceNumber: responseBody.visitReferenceNumber || `http-${response.status}`,
            errors: [{
              field: 'http',
              code: `HTTP_${response.status}`,
              message: (responseBody as { message?: string }).message || `HTTP error: ${response.statusText}`,
            }],
          };
        }

        // Return response
        return responseBody;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('HHAeXchange API request timeout after 30 seconds');
        }
        throw new Error(`HHAeXchange API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Map internal verification method to HHAeXchange codes
   */
  private mapVerificationMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'GPS': 'MOBILE_GPS',
      'NETWORK': 'NETWORK_LOCATION',
      'PHONE': 'TELEPHONY',
      'BIOMETRIC': 'BIOMETRIC',
      'MANUAL': 'MANUAL_ENTRY',
      'EXCEPTION': 'EXCEPTION',
    };
    return methodMap[method] || 'OTHER';
  }

  /**
   * Map verification level to HHAeXchange status
   */
  private mapVerificationStatus(evvRecord: EVVRecord): string {
    switch (evvRecord.verificationLevel) {
      case 'FULL':
        return 'VERIFIED';
      case 'PARTIAL':
        return 'PARTIAL_VERIFICATION';
      case 'MANUAL':
        return 'MANUAL_OVERRIDE';
      case 'PHONE':
        return 'PHONE_VERIFICATION';
      case 'EXCEPTION':
        return 'EXCEPTION_PROCESSED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Determine if error code indicates retry should be attempted
   */
  private isRetryableError(errorCode?: string): boolean {
    const retryableCodes = [
      'NETWORK_TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED',
      'TEMPORARY_ERROR',
      'HTTP_503',
      'HTTP_504',
    ];
    return errorCode ? retryableCodes.includes(errorCode) : false;
  }
}
