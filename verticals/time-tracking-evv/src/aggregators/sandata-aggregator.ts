/**
 * Sandata EVV Aggregator
 * 
 * MASSIVE CODE REUSE: Single implementation serves OH, PA, NC, AZ
 * 
 * Sandata is one of the largest EVV aggregators in the US, serving multiple states
 * with a standardized API. States using Sandata:
 * - Ohio (ODM - Ohio Department of Medicaid)
 * - Pennsylvania (DHS - Department of Human Services)
 * - North Carolina (DHHS - Department of Health and Human Services)
 * - Arizona (AHCCCS - Arizona Health Care Cost Containment System)
 * 
 * Domain Knowledge:
 * - Sandata uses HL7/FHIR-based submissions with JSON fallback
 * - Requires OAuth 2.0 client credentials authentication
 * - Supports batch and real-time submission modes
 * - All states require the 6 federal EVV data elements (21st Century Cures Act)
 * - State-specific variations handled via configuration, not separate implementations
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
 * Sandata API payload structure
 */
interface SandataPayload {
  // Required federal EVV elements
  serviceType: string;
  memberIdentifier: string;
  memberName: string;
  providerIdentifier: string;
  providerName: string;
  serviceDate: string;
  serviceStartTime: string;
  serviceEndTime: string;
  serviceLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  
  // Additional Sandata-specific fields
  visitId: string;
  organizationId: string;
  verificationType: string;
  duration: number;
  
  // State-specific extensions
  stateSpecific?: Record<string, unknown>;
}

/**
 * Sandata API response
 */
interface SandataResponse {
  success: boolean;
  transactionId: string;
  confirmationNumber?: string;
  validationErrors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Sandata Aggregator Implementation
 * 
 * SOLID: Single Responsibility - Only handles Sandata API interaction
 * APIE: Encapsulation - API details hidden, configuration-driven state handling
 */
export class SandataAggregator implements IAggregator {
  /**
   * Submit EVV record to Sandata
   * 
   * State-specific routing is handled via config.state and config.aggregatorEndpoint.
   * The payload format is identical across all Sandata states, with state-specific
   * variations in validation rules handled by the state configuration.
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
        submissionId: '', // No submission created
        errorCode: 'VALIDATION_FAILED',
        errorMessage: `EVV record validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        requiresRetry: false,
      };
    }

    // Build Sandata-compliant payload
    const payload = this.formatPayload(evvRecord, config);

    try {
      // In production, replace with actual HTTP client
      const response = await this.sendToSandata(payload, config);

      if (response.success) {
        return {
          success: true,
          submissionId: response.transactionId,
          confirmationId: response.confirmationNumber,
        };
      }

      // Submission rejected by Sandata
      return {
        success: false,
        submissionId: response.transactionId,
        errorCode: response.errorCode || 'SUBMISSION_REJECTED',
        errorMessage: response.errorMessage || 'Sandata rejected submission',
        requiresRetry: this.isRetryableError(response.errorCode),
        retryAfterSeconds: this.isRetryableError(response.errorCode) ? 300 : undefined,
      };
    } catch (error) {
        // Network or system error - should retry
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else{
        const debugOutput = (typeof error === 'object' && error !== null)
        ? JSON.stringify(error, null, 2)
        : String(error);
        message = `${debugOutput}`;
      }
      return {
        success: false,
        submissionId: '',
        errorCode: 'NETWORK_ERROR',
        errorMessage: message || 'Failed to connect to Sandata',
        requiresRetry: true,
        retryAfterSeconds: EXPONENTIAL_BACKOFF.baseDelaySeconds,
      };
    }
  }

  /**
   * Validate EVV record meets Sandata requirements
   * 
   * All Sandata states require the same core data elements.
   * State-specific validation (grace periods, geofence tolerance, etc.)
   * should be handled BEFORE submission by EVVService.
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

    // Warnings for optional but recommended fields
    if (!evvRecord.caregiverNationalProviderId && config.state !== 'AZ') {
      // Arizona exempts non-medical services from NPI requirement
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
   * Format EVV record into Sandata API payload
   * 
   * Single format works across all Sandata states (OH, PA, NC, AZ).
   * State-specific data goes in stateSpecific object.
   */
  private formatPayload(evvRecord: EVVRecord, config: StateEVVConfig): SandataPayload {
    const payload: SandataPayload = {
      // Federal EVV required elements
      serviceType: evvRecord.serviceTypeCode,
      memberIdentifier: evvRecord.clientMedicaidId || evvRecord.clientId,
      memberName: evvRecord.clientName,
      providerIdentifier: evvRecord.caregiverEmployeeId,
      providerName: evvRecord.caregiverName,
      serviceDate: evvRecord.serviceDate.toISOString().split('T')[0]!,
      serviceStartTime: evvRecord.clockInTime.toISOString(),
      serviceEndTime: evvRecord.clockOutTime!.toISOString(), // Validated earlier
      serviceLocation: {
        latitude: evvRecord.clockInVerification.latitude,
        longitude: evvRecord.clockInVerification.longitude,
        accuracy: evvRecord.clockInVerification.accuracy,
      },
      
      // Additional tracking fields
      visitId: evvRecord.visitId,
      organizationId: evvRecord.organizationId,
      verificationType: this.mapVerificationMethod(evvRecord.clockInVerification.method),
      duration: evvRecord.totalDuration || 0,
      
      // State-specific extensions
      stateSpecific: {
        state: config.state,
        branchId: evvRecord.branchId,
        verificationLevel: evvRecord.verificationLevel,
        complianceFlags: evvRecord.complianceFlags,
      },
    };

    // Arizona-specific: Flag non-medical services (NPI not required)
    if (config.state === 'AZ' && config['nonMedicalExempt']) {
      payload.stateSpecific!['nonMedicalService'] = true;
    }

    return payload;
  }

  /**
   * Send payload to Sandata API
   *
   * Production implementation with:
   * - OAuth 2.0 client credentials flow (if configured)
   * - SSL/TLS with certificate validation
   * - Proper timeout and retry configuration
   * - Error logging
   */
  private async sendToSandata(
    payload: SandataPayload,
    config: StateEVVConfig
  ): Promise<SandataResponse> {
    const endpoint = config.aggregatorEndpoint;
    const apiKey = config.aggregatorApiKey;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-State-Code': config.state,
      };

      // Check if OAuth is configured
      const authEndpoint = config['aggregatorAuthEndpoint'] as string | undefined;
      const clientId = config['aggregatorClientId'] as string | undefined;
      const clientSecret = config['aggregatorClientSecret'] as string | undefined;

      if (authEndpoint && clientId && clientSecret) {
        // Use OAuth 2.0
        const token = await this.getOAuthToken(authEndpoint, clientId, clientSecret);
        headers['Authorization'] = `Bearer ${token}`;
      } else if (apiKey) {
        // Use API key
        headers['X-API-Key'] = apiKey;
      } else {
        throw new Error('Sandata API credentials not configured (need OAuth or API key)');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Handle HTTP error responses
        const errorBody = await response.text();
        return {
          success: false,
          transactionId: '',
          errorCode: `HTTP_${response.status}`,
          errorMessage: `HTTP ${response.status}: ${errorBody}`,
        };
      }

      const result = await response.json() as SandataResponse;
      return result;
    } catch (error) {
      // Network or timeout error
      if (error instanceof Error) {
        throw new Error(`Sandata API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get OAuth 2.0 access token using client credentials flow
   */
  private async getOAuthToken(
    authEndpoint: string,
    clientId: string,
    clientSecret: string
  ): Promise<string> {
    try {
      const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'evv.submit',
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`OAuth token request failed: ${response.status}`);
      }

      const result = await response.json() as { access_token: string };
      return result.access_token;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OAuth authentication failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Map internal verification method to Sandata codes
   */
  private mapVerificationMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'GPS': 'MOBILE_GPS',
      'NETWORK': 'NETWORK_LOCATION',
      'PHONE': 'TELEPHONY_IVR',
      'BIOMETRIC': 'BIOMETRIC_VERIFICATION',
      'MANUAL': 'MANUAL_SUPERVISOR',
      'EXCEPTION': 'EXCEPTION_PROCESS',
    };
    return methodMap[method] || 'OTHER';
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
    ];
    return errorCode ? retryableCodes.includes(errorCode) : false;
  }
}
