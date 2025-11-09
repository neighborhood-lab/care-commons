/**
 * HHAeXchange EVV Aggregator
 *
 * HHAeXchange is the mandated aggregator for Texas and one of the approved aggregators
 * for Florida. It's one of the largest EVV platforms in the US.
 *
 * Domain Knowledge:
 * - Texas: HHAeXchange is the mandatory aggregator (HHSC-designated)
 * - Florida: One of multiple approved aggregators, MCO/payer-dependent
 * - Uses REST API with API key authentication
 * - Supports both real-time and batch submission modes
 * - Requires Visit Maintenance Unlock Request (VMUR) for corrections in Texas
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
  // Required federal EVV elements
  visitId: string;
  memberId: string;
  memberName: string;
  providerId: string;
  providerName: string;
  serviceCode: string;
  serviceName: string;
  serviceDate: string;

  // Time and location
  clockInTime: string;
  clockOutTime?: string;
  totalDuration?: number;
  clockInLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };

  // Verification
  clockMethod: string;
  verificationStatus: string;
  verificationLevel: string;

  // Additional tracking
  organizationId: string;
  branchId?: string;
}

/**
 * HHAeXchange API response
 */
interface HHAeXchangeResponse {
  success: boolean;
  confirmationId?: string;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  validationErrors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

/**
 * HHAeXchange Aggregator Implementation
 *
 * SOLID: Single Responsibility - Only handles HHAeXchange API interaction
 * APIE: Encapsulation - API details hidden, configuration-driven
 */
export class HHAeXchangeAggregator implements IAggregator {
  /**
   * Submit EVV record to HHAeXchange
   *
   * Texas requires all EVV data to flow through HHAeXchange.
   * Florida allows HHAeXchange as one of multiple aggregator options.
   */
  async submit(
    evvRecord: EVVRecord,
    config: StateEVVConfig
  ): Promise<AggregatorSubmissionResult> {
    // Validate record is complete before submission
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
      // Send to HHAeXchange
      const response = await this.sendToHHAeXchange(payload, config);

      if (response.success) {
        return {
          success: true,
          submissionId: response.transactionId || response.confirmationId || '',
          confirmationId: response.confirmationId,
        };
      }

      // Submission rejected by HHAeXchange
      return {
        success: false,
        submissionId: response.transactionId || '',
        errorCode: response.errorCode || 'SUBMISSION_REJECTED',
        errorMessage: response.errorMessage || 'HHAeXchange rejected submission',
        requiresRetry: this.isRetryableError(response.errorCode),
        retryAfterSeconds: this.isRetryableError(response.errorCode) ? 300 : undefined,
      };
    } catch (error) {
      // Network or system error - should retry
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        submissionId: '',
        errorCode: 'NETWORK_ERROR',
        errorMessage: errorMessage || 'Failed to connect to HHAeXchange',
        requiresRetry: true,
        retryAfterSeconds: EXPONENTIAL_BACKOFF.baseDelaySeconds,
      };
    }
  }

  /**
   * Validate EVV record meets HHAeXchange requirements
   *
   * HHAeXchange enforces strict validation for all federal EVV elements.
   */
  validate(
    evvRecord: EVVRecord,
    config: StateEVVConfig
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required federal EVV elements (21st Century Cures Act)
    if (!evvRecord.serviceTypeCode) {
      errors.push({
        field: 'serviceTypeCode',
        code: 'MISSING_SERVICE_TYPE',
        message: 'Service type code is required by federal EVV mandate',
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
      // Texas requires NPI for medical services
      if (!evvRecord.caregiverNationalProviderId) {
        warnings.push({
          field: 'caregiverNationalProviderId',
          code: 'MISSING_NPI',
          message: 'National Provider Identifier (NPI) is recommended for Texas Medicaid billing',
          severity: 'WARNING',
        });
      }

      // Texas has strict geofence tolerance
      if (evvRecord.clockInVerification && evvRecord.clockInVerification.accuracy > 150) {
        warnings.push({
          field: 'clockInVerification.accuracy',
          code: 'LOW_GPS_ACCURACY',
          message: `GPS accuracy (${evvRecord.clockInVerification.accuracy}m) exceeds Texas tolerance (150m)`,
          severity: 'WARNING',
        });
      }
    }

    // Florida-specific validation
    if (config.state === 'FL') {
      // Florida is more lenient with GPS accuracy
      if (evvRecord.clockInVerification && evvRecord.clockInVerification.accuracy > 250) {
        warnings.push({
          field: 'clockInVerification.accuracy',
          code: 'LOW_GPS_ACCURACY',
          message: `GPS accuracy (${evvRecord.clockInVerification.accuracy}m) exceeds Florida tolerance (250m)`,
          severity: 'WARNING',
        });
      }
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
  private formatPayload(evvRecord: EVVRecord, _config: StateEVVConfig): HHAeXchangePayload {
    const payload: HHAeXchangePayload = {
      // Federal EVV required elements
      visitId: evvRecord.visitId,
      memberId: evvRecord.clientMedicaidId || evvRecord.clientId,
      memberName: evvRecord.clientName,
      providerId: evvRecord.caregiverEmployeeId,
      providerName: evvRecord.caregiverName,
      serviceCode: evvRecord.serviceTypeCode,
      serviceName: evvRecord.serviceTypeName,
      serviceDate: evvRecord.serviceDate.toISOString().split('T')[0]!,

      // Time information
      clockInTime: evvRecord.clockInTime.toISOString(),
      clockOutTime: evvRecord.clockOutTime?.toISOString(),
      totalDuration: evvRecord.totalDuration,

      // Location information
      clockInLocation: {
        latitude: evvRecord.clockInVerification.latitude,
        longitude: evvRecord.clockInVerification.longitude,
        accuracy: evvRecord.clockInVerification.accuracy,
      },

      // Verification information
      clockMethod: this.mapVerificationMethod(evvRecord.clockInVerification.method),
      verificationStatus: this.mapVerificationStatus(evvRecord.verificationLevel),
      verificationLevel: evvRecord.verificationLevel,

      // Organizational tracking
      organizationId: evvRecord.organizationId,
      branchId: evvRecord.branchId,
    };

    // Add clock-out location if available
    if (evvRecord.clockOutVerification) {
      payload.clockOutLocation = {
        latitude: evvRecord.clockOutVerification.latitude,
        longitude: evvRecord.clockOutVerification.longitude,
        accuracy: evvRecord.clockOutVerification.accuracy,
      };
    }

    return payload;
  }

  /**
   * Send payload to HHAeXchange API
   *
   * Uses API key authentication and HTTPS for secure communication.
   */
  private async sendToHHAeXchange(
    payload: HHAeXchangePayload,
    stateConfig: StateEVVConfig
  ): Promise<HHAeXchangeResponse> {
    const apiKey = stateConfig.aggregatorApiKey || stateConfig['aggregatorApiKey'] as string | undefined;

    if (!apiKey) {
      throw new Error(
        `HHAeXchange API key missing for state ${stateConfig.state}. ` +
        `Required: aggregatorApiKey in configuration`
      );
    }

    try {
      // Send request to HHAeXchange
      const response = await fetch(stateConfig.aggregatorEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-State-Code': stateConfig.state,
          'X-Client-Version': 'Care-Commons-EVV/1.0',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData: HHAeXchangeResponse;

      try {
        responseData = JSON.parse(responseText) as HHAeXchangeResponse;
      } catch {
        // If response is not JSON, create error response
        responseData = {
          success: false,
          errorCode: 'INVALID_RESPONSE',
          errorMessage: `HHAeXchange API returned non-JSON response: ${responseText.substring(0, 200)}`,
        };
      }

      return responseData;

    } catch (error) {
      // Network or system error
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Failed to connect to HHAeXchange: ${errorMessage}`,
      };
    }
  }

  /**
   * Map internal verification method to HHAeXchange codes
   */
  private mapVerificationMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'GPS': 'MOBILE_GPS',
      'NETWORK': 'NETWORK_LOCATION',
      'PHONE': 'TELEPHONY_IVR',
      'BIOMETRIC': 'BIOMETRIC',
      'MANUAL': 'MANUAL_ENTRY',
      'EXCEPTION': 'EXCEPTION',
    };
    return methodMap[method] || 'OTHER';
  }

  /**
   * Map verification level to HHAeXchange status
   */
  private mapVerificationStatus(verificationLevel: string): string {
    const statusMap: Record<string, string> = {
      'FULL': 'VERIFIED',
      'PARTIAL': 'PARTIAL_VERIFICATION',
      'MANUAL': 'MANUAL_OVERRIDE',
      'PHONE': 'PHONE_VERIFICATION',
      'EXCEPTION': 'EXCEPTION_PROCESS',
    };
    return statusMap[verificationLevel] || 'UNKNOWN';
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
      'SERVER_ERROR',
    ];
    return errorCode ? retryableCodes.includes(errorCode) : false;
  }
}
