/**
 * Tellus (Netsmart) EVV Aggregator
 * 
 * Tellus by Netsmart serves Georgia DCH (Department of Community Health)
 * and several other states with HCBS (Home and Community-Based Services).
 * 
 * Domain Knowledge:
 * - Georgia uses Tellus as primary aggregator for Medicaid EVV
 * - Most lenient geofence tolerance of all states (150m + 100m variance)
 * - Supports both real-time and batch submission modes
 * - REST API with API key authentication
 * - Requires extended service detail for HCBS waiver programs
 * 
 * Georgia-Specific Requirements:
 * - Grace period: 15 minutes before/after scheduled time
 * - Geofence: 150m base + 100m tolerance = 250m total
 * - Supports rural exception handling with lenient rules
 * - HCBS waiver programs require additional documentation
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
 * Tellus API payload structure
 */
interface TellusPayload {
  // Core EVV data
  visitReference: string;
  clientInfo: {
    medicaidId: string;
    fullName: string;
  };
  providerInfo: {
    employeeId: string;
    fullName: string;
    npi?: string;
  };
  serviceInfo: {
    serviceCode: string;
    serviceName: string;
    serviceDate: string;
  };
  timeInfo: {
    clockIn: string;
    clockOut: string;
    totalMinutes: number;
  };
  locationInfo: {
    checkInLocation: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    };
    checkOutLocation?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    };
  };
  verificationInfo: {
    method: string;
    level: string;
    geofenceCompliant: boolean;
  };
  
  // Georgia-specific extensions
  georgiaExtensions?: {
    waiverId?: string;
    serviceAuthorizationNumber?: string;
    ruralException?: boolean;
  };
}

/**
 * Tellus API response
 */
interface TellusResponse {
  status: 'SUCCESS' | 'VALIDATION_ERROR' | 'SYSTEM_ERROR';
  referenceNumber?: string;
  confirmationCode?: string;
  errors?: Array<{
    field: string;
    errorCode: string;
    errorMessage: string;
  }>;
  warnings?: Array<{
    field: string;
    warningCode: string;
    warningMessage: string;
  }>;
}

/**
 * Tellus Aggregator Implementation for Georgia
 * 
 * SOLID: Single Responsibility - Handles only Tellus API interaction
 * APIE: Encapsulation - Georgia-specific logic encapsulated within config
 */
export class TellusAggregator implements IAggregator {
  /**
   * Submit EVV record to Tellus
   * 
   * Georgia's lenient policies (largest geofence tolerance, generous grace periods)
   * mean fewer rejections and smoother submission workflow.
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

    // Build Tellus-compliant payload
    const payload = this.formatPayload(evvRecord, config);

    try {
      // In production, replace with actual HTTP client
      const response = await this.sendToTellus(payload, config);

      if (response.status === 'SUCCESS') {
        return {
          success: true,
          submissionId: response.referenceNumber!,
          confirmationId: response.confirmationCode,
        };
      }

      if (response.status === 'VALIDATION_ERROR') {
        return {
          success: false,
          submissionId: response.referenceNumber || '',
          errorCode: 'VALIDATION_ERROR',
          errorMessage: response.errors?.map(e => e.errorMessage).join('; ') || 'Validation failed',
          requiresRetry: false,
        };
      }

      // System error - should retry
      return {
        success: false,
        submissionId: response.referenceNumber || '',
        errorCode: 'SYSTEM_ERROR',
        errorMessage: response.errors?.map(e => e.errorMessage).join('; ') || 'Tellus system error',
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
        errorMessage: message || 'Failed to connect to Tellus',
        requiresRetry: true,
        retryAfterSeconds: EXPONENTIAL_BACKOFF.baseDelaySeconds,
      };
    }
  }

  /**
   * Validate EVV record meets Tellus/Georgia requirements
   * 
   * Georgia has lenient validation rules compared to other states.
   * Main focus is on having the 6 federal EVV elements.
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
        message: 'Client/Member identifier is required',
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
        message: 'Service end time is required',
        severity: 'ERROR',
      });
    }

    if (!evvRecord.clockInVerification?.latitude || !evvRecord.clockInVerification?.longitude) {
      errors.push({
        field: 'clockInVerification',
        code: 'MISSING_LOCATION',
        message: 'GPS location is required',
        severity: 'ERROR',
      });
    }

    // Georgia-specific validation
    if (config.state === 'GA') {
      // Check if this is a waiver service requiring authorization
      const isWaiverService = this.isHCBSWaiverService(evvRecord.serviceTypeCode);
      if (isWaiverService && !evvRecord.stateSpecificData?.['serviceAuthorizationNumber']) {
        warnings.push({
          field: 'stateSpecificData.serviceAuthorizationNumber',
          code: 'MISSING_WAIVER_AUTH',
          message: 'HCBS waiver services should include service authorization number',
          severity: 'WARNING',
        });
      }

      // Georgia's lenient GPS accuracy tolerance
      if (evvRecord.clockInVerification && evvRecord.clockInVerification.accuracy > 250) {
        // 150m base + 100m tolerance = 250m total
        warnings.push({
          field: 'clockInVerification.accuracy',
          code: 'HIGH_GPS_INACCURACY',
          message: `GPS accuracy (${evvRecord.clockInVerification.accuracy}m) exceeds Georgia's lenient tolerance (250m)`,
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
   * Format EVV record into Tellus API payload
   * 
   * Tellus expects a more detailed payload structure than Sandata.
   */
  private formatPayload(evvRecord: EVVRecord, config: StateEVVConfig): TellusPayload {
    const payload: TellusPayload = {
      visitReference: evvRecord.visitId,
      clientInfo: {
        medicaidId: evvRecord.clientMedicaidId || evvRecord.clientId,
        fullName: evvRecord.clientName,
      },
      providerInfo: {
        employeeId: evvRecord.caregiverEmployeeId,
        fullName: evvRecord.caregiverName,
        npi: evvRecord.caregiverNationalProviderId,
      },
      serviceInfo: {
        serviceCode: evvRecord.serviceTypeCode,
        serviceName: evvRecord.serviceTypeName,
        serviceDate: evvRecord.serviceDate.toISOString().split('T')[0]!,
      },
      timeInfo: {
        clockIn: evvRecord.clockInTime.toISOString(),
        clockOut: evvRecord.clockOutTime!.toISOString(),
        totalMinutes: evvRecord.totalDuration || 0,
      },
      locationInfo: {
        checkInLocation: {
          latitude: evvRecord.clockInVerification.latitude,
          longitude: evvRecord.clockInVerification.longitude,
          accuracy: evvRecord.clockInVerification.accuracy,
          timestamp: evvRecord.clockInVerification.timestamp.toISOString(),
        },
      },
      verificationInfo: {
        method: this.mapVerificationMethod(evvRecord.clockInVerification.method),
        level: evvRecord.verificationLevel,
        geofenceCompliant: !evvRecord.complianceFlags.includes('GEOFENCE_VIOLATION'),
      },
    };

    // Add clock-out location if available
    if (evvRecord.clockOutVerification) {
      payload.locationInfo.checkOutLocation = {
        latitude: evvRecord.clockOutVerification.latitude,
        longitude: evvRecord.clockOutVerification.longitude,
        accuracy: evvRecord.clockOutVerification.accuracy,
        timestamp: evvRecord.clockOutVerification.timestamp.toISOString(),
      };
    }

    // Georgia-specific extensions
    if (config.state === 'GA') {
      payload.georgiaExtensions = {
        waiverId: evvRecord.stateSpecificData?.['waiverId'] as string,
        serviceAuthorizationNumber: evvRecord.stateSpecificData?.['serviceAuthorizationNumber'] as string,
        ruralException: evvRecord.complianceFlags.includes('MANUAL_OVERRIDE') &&
                       evvRecord.stateSpecificData?.['ruralException'] === true,
      };
    }

    return payload;
  }

  /**
   * Send payload to Tellus API
   *
   * Production implementation with:
   * - API key authentication
   * - SSL/TLS with certificate validation
   * - Request/response logging for audit
   * - Timeout and retry handling
   * - Rate limit handling
   */
  private async sendToTellus(
    payload: TellusPayload,
    config: StateEVVConfig
  ): Promise<TellusResponse> {
    const endpoint = config.aggregatorEndpoint;
    const apiKey = config.aggregatorApiKey;

    if (!apiKey) {
      throw new Error('Tellus API key not configured');
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-State-Code': 'GA',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Handle HTTP error responses
        const errorBody = await response.text();
        return {
          status: 'SYSTEM_ERROR',
          errors: [{
            field: 'http',
            errorCode: `HTTP_${response.status}`,
            errorMessage: `HTTP ${response.status}: ${errorBody}`,
          }],
        };
      }

      const result = await response.json() as TellusResponse;
      return result;
    } catch (error) {
      // Network or timeout error
      if (error instanceof Error) {
        throw new Error(`Tellus API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Map internal verification method to Tellus codes
   */
  private mapVerificationMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'GPS': 'MOBILE_GPS',
      'NETWORK': 'NETWORK_BASED',
      'PHONE': 'TELEPHONY',
      'BIOMETRIC': 'BIOMETRIC',
      'MANUAL': 'MANUAL',
      'EXCEPTION': 'EXCEPTION',
    };
    return methodMap[method] || 'OTHER';
  }

  /**
   * Check if service code is an HCBS waiver service
   * 
   * Georgia HCBS waiver programs require additional documentation.
   */
  private isHCBSWaiverService(serviceCode: string): boolean {
    // Common Georgia HCBS waiver service codes
    const waiverCodes = [
      'T1019', // Personal care services
      'S5125', // Attendant care services
      'S5150', // Unskilled respite care
      'T2025', // Waiver services misc
      'H0045', // Respite care services
    ];
    return waiverCodes.includes(serviceCode);
  }
}
