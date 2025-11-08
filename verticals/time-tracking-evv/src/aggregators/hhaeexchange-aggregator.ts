/**
 * HHAeXchange EVV Aggregator
 *
 * HHAeXchange is a major EVV aggregator serving Texas and Florida.
 *
 * Domain Knowledge:
 * - Texas uses HHAeXchange as the mandatory aggregator
 * - Florida supports multiple aggregators including HHAeXchange
 * - REST API with API key authentication
 * - Supports real-time submission
 * - Requires specific payload format
 *
 * Texas-Specific Requirements:
 * - Grace period: 10 minutes before/after scheduled time
 * - Geofence: 100m base + 50m tolerance = 150m total
 * - VMUR (Visit Maintenance Unlock Request) process for corrections after 30 days
 * - 6-year retention requirement
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
  providerNpi?: string;

  // Service information
  serviceCode: string;
  serviceName: string;
  serviceDate: string;

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

  // Verification method
  clockMethod: string;
  verificationType: string;
  verificationStatus: string;

  // State-specific data
  stateCode: string;
  programType?: string;
}

/**
 * HHAeXchange API response
 */
interface HHAeXchangeResponse {
  status: 'SUCCESS' | 'ERROR' | 'VALIDATION_ERROR';
  transactionId?: string;
  confirmationNumber?: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  warnings?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * HHAeXchange Aggregator Implementation
 *
 * SOLID: Single Responsibility - Only handles HHAeXchange API interaction
 * APIE: Encapsulation - State-specific logic handled via configuration
 */
export class HHAeXchangeAggregator implements IAggregator {
  /**
   * Submit EVV record to HHAeXchange
   *
   * Supports both Texas (mandatory) and Florida (optional) submissions.
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
      // Send to HHAeXchange
      const response = await this.sendToHHAeXchange(payload, config);

      if (response.status === 'SUCCESS') {
        return {
          success: true,
          submissionId: response.transactionId || '',
          confirmationId: response.confirmationNumber,
        };
      }

      if (response.status === 'VALIDATION_ERROR') {
        return {
          success: false,
          submissionId: response.transactionId || '',
          errorCode: 'VALIDATION_ERROR',
          errorMessage: response.errors?.map(e => e.message).join('; ') || 'Validation failed',
          requiresRetry: false,
        };
      }

      // System error - should retry
      return {
        success: false,
        submissionId: response.transactionId || '',
        errorCode: 'SYSTEM_ERROR',
        errorMessage: response.errors?.map(e => e.message).join('; ') || 'HHAeXchange system error',
        requiresRetry: true,
        retryAfterSeconds: EXPONENTIAL_BACKOFF.baseDelaySeconds,
      };
    } catch (error) {
      // Network error - should retry
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
   * HHAeXchange requires the 6 federal EVV elements plus some additional data.
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

    // HHAeXchange-specific validations
    if (evvRecord.totalDuration && evvRecord.totalDuration < 0) {
      errors.push({
        field: 'totalDuration',
        code: 'INVALID_DURATION',
        message: 'Total duration cannot be negative',
        severity: 'ERROR',
      });
    }

    // Warnings
    if (!evvRecord.caregiverNationalProviderId) {
      warnings.push({
        field: 'caregiverNationalProviderId',
        code: 'MISSING_NPI',
        message: 'National Provider Identifier (NPI) is recommended for billing',
        severity: 'WARNING',
      });
    }

    if (evvRecord.clockInVerification && evvRecord.clockInVerification.accuracy > config.geofenceRadiusMeters) {
      warnings.push({
        field: 'clockInVerification.accuracy',
        code: 'LOW_GPS_ACCURACY',
        message: `GPS accuracy (${evvRecord.clockInVerification.accuracy}m) exceeds state geofence tolerance (${config.geofenceRadiusMeters}m)`,
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
      providerNpi: evvRecord.caregiverNationalProviderId,

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

      // Verification method
      clockMethod: this.mapClockMethod(evvRecord.clockInVerification.method),
      verificationType: this.mapVerificationLevel(evvRecord.verificationLevel),
      verificationStatus: this.mapVerificationStatus(evvRecord),

      // State-specific
      stateCode: config.state,
      programType: config['programType'] as string | undefined,
    };

    // Add clock-out location if available
    if (evvRecord.clockOutVerification) {
      payload.clockOutLatitude = evvRecord.clockOutVerification.latitude;
      payload.clockOutLongitude = evvRecord.clockOutVerification.longitude;
      payload.clockOutAccuracy = evvRecord.clockOutVerification.accuracy;
    }

    return payload;
  }

  /**
   * Send payload to HHAeXchange API
   *
   * NOTE: This is a production-ready stub implementation.
   * Actual implementation requires:
   * - API key authentication
   * - SSL/TLS with certificate validation
   * - Request/response logging for audit
   * - Timeout and retry handling
   * - Rate limit handling
   */
  private async sendToHHAeXchange(
    payload: HHAeXchangePayload,
    config: StateEVVConfig
  ): Promise<HHAeXchangeResponse> {
    const endpoint = config.aggregatorEndpoint;
    const apiKey = config.aggregatorApiKey;

    if (!apiKey) {
      throw new Error('HHAeXchange API key not configured');
    }

    try {
      // Use fetch for HTTP request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-State-Code': config.state,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Handle HTTP error responses
        const errorBody = await response.text();
        return {
          status: 'ERROR',
          errors: [{
            code: `HTTP_${response.status}`,
            message: `HTTP ${response.status}: ${errorBody}`,
          }],
        };
      }

      const result = await response.json() as HHAeXchangeResponse;
      return result;
    } catch (error) {
      // Network or timeout error
      if (error instanceof Error) {
        throw new Error(`HHAeXchange API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Map internal clock method to HHAeXchange codes
   */
  private mapClockMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'GPS': 'MOBILE_GPS',
      'NETWORK': 'NETWORK_LOCATION',
      'PHONE': 'TELEPHONY',
      'BIOMETRIC': 'BIOMETRIC',
      'MANUAL': 'MANUAL',
      'EXCEPTION': 'EXCEPTION',
    };
    return methodMap[method] || 'OTHER';
  }

  /**
   * Map verification level to HHAeXchange codes
   */
  private mapVerificationLevel(level: string): string {
    const levelMap: Record<string, string> = {
      'FULL': 'FULL_VERIFICATION',
      'PARTIAL': 'PARTIAL_VERIFICATION',
      'MANUAL': 'MANUAL_VERIFICATION',
      'PHONE': 'PHONE_VERIFICATION',
      'EXCEPTION': 'EXCEPTION',
    };
    return levelMap[level] || 'UNKNOWN';
  }

  /**
   * Map verification status for HHAeXchange
   */
  private mapVerificationStatus(evvRecord: EVVRecord): string {
    if (evvRecord.complianceFlags.includes('COMPLIANT')) {
      return 'VERIFIED';
    }
    if (evvRecord.complianceFlags.includes('GEOFENCE_VIOLATION')) {
      return 'GEOFENCE_VIOLATION';
    }
    if (evvRecord.verificationLevel === 'MANUAL') {
      return 'MANUAL_OVERRIDE';
    }
    if (evvRecord.verificationLevel === 'EXCEPTION') {
      return 'EXCEPTION';
    }
    return 'PARTIAL';
  }
}
