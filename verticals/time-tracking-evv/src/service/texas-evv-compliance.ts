/**
 * Texas EVV Compliance Service
 *
 * Comprehensive compliance checking for Texas HHSC EVV requirements.
 * Integrates geofence validation, six elements validation, and grace period rules.
 *
 * Texas HHSC EVV Requirements:
 * 1. Geofence validation: 100m base + GPS accuracy allowance
 * 2. Six required elements: Who (client & caregiver), What (service), When (date & time),
 *    Where (location), How Long (duration)
 * 3. 10-minute grace period for clock-in/clock-out
 * 4. GPS accuracy ≤100m for compliant submission
 * 5. VMUR (Visit Maintenance Unlock Request) for corrections
 *
 * References:
 * - 26 TAC §558 (Texas Administrative Code)
 * - HHSC EVV Policy Handbook
 * - 21st Century Cures Act § 12006
 */

import {
  TexasGeofenceValidator,
  GeofenceValidationResult,
  LocationCoordinates,
} from './texas-geofence-validator';
import {
  SixElementsValidator,
  SixElementsValidationResult,
  EVVDataInput,
  createTexasValidator,
} from './six-elements-validator';
import { EVVRecord } from '../types/evv';

/**
 * Comprehensive Texas EVV compliance result
 */
export interface TexasComplianceResult {
  isCompliant: boolean;
  complianceLevel: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  requiresAction: boolean;

  // Detailed validation results
  geofenceValidation: GeofenceValidationResult;
  elementsValidation: SixElementsValidationResult;
  gracePeriodValidation: GracePeriodValidationResult;

  // Compliance flags
  flags: TexasComplianceFlag[];

  // Summary
  summary: string;
  recommendations: string[];
}

/**
 * Grace period validation result
 */
export interface GracePeriodValidationResult {
  isValid: boolean;
  clockInStatus: 'ON_TIME' | 'EARLY_GRACE' | 'LATE_GRACE' | 'VIOLATION';
  clockOutStatus: 'ON_TIME' | 'EARLY_GRACE' | 'LATE_GRACE' | 'VIOLATION' | 'INCOMPLETE';
  clockInDifferenceMinutes?: number;
  clockOutDifferenceMinutes?: number;
  message: string;
}

/**
 * Texas compliance flags
 */
export type TexasComplianceFlag =
  | 'COMPLIANT' // Fully compliant
  | 'GEOFENCE_WARNING' // Location warning
  | 'GEOFENCE_VIOLATION' // Location violation
  | 'GPS_ACCURACY_EXCEEDED' // GPS accuracy > 100m
  | 'MISSING_ELEMENTS' // Missing required elements
  | 'GRACE_PERIOD_VIOLATION' // Clock time outside grace period
  | 'INCOMPLETE_VISIT' // Missing clock-out
  | 'REQUIRES_VMUR' // Requires Visit Maintenance Unlock Request
  | 'REQUIRES_SUPERVISOR' // Requires supervisor review
  | 'AGGREGATOR_READY'; // Ready for HHAeXchange submission

/**
 * Texas EVV compliance configuration
 */
export interface TexasComplianceConfig {
  gracePeriodMinutes: number; // Default: 10 minutes
  requireCompletedVisit: boolean; // Require clock-out
  strictGPSAccuracy: boolean; // Enforce 100m GPS accuracy limit
}

/**
 * Default Texas configuration
 */
const DEFAULT_TEXAS_CONFIG: TexasComplianceConfig = {
  gracePeriodMinutes: 10, // HHSC allows 10-minute grace period
  requireCompletedVisit: false, // Can validate in-progress visits
  strictGPSAccuracy: true, // Enforce 100m limit
};

/**
 * Texas EVV Compliance Service
 *
 * Provides comprehensive compliance checking for Texas HHSC requirements
 */
export class TexasEVVComplianceService {
  private geofenceValidator: TexasGeofenceValidator;
  private elementsValidator: SixElementsValidator;
  private config: TexasComplianceConfig;

  constructor(config?: Partial<TexasComplianceConfig>) {
    this.config = { ...DEFAULT_TEXAS_CONFIG, ...config };

    // Initialize validators
    this.geofenceValidator = new TexasGeofenceValidator({
      strictMode: this.config.strictGPSAccuracy,
    });

    this.elementsValidator = createTexasValidator({
      requireCompletedVisit: this.config.requireCompletedVisit,
    });
  }

  /**
   * Perform comprehensive Texas EVV compliance check
   *
   * @param evvRecord - EVV record to validate
   * @param scheduledStartTime - Scheduled visit start time
   * @param scheduledEndTime - Scheduled visit end time
   * @param expectedLocation - Expected service location
   * @returns Comprehensive compliance result
   */
  validateCompliance(
    evvRecord: EVVRecord,
    scheduledStartTime: Date,
    scheduledEndTime: Date,
    expectedLocation: LocationCoordinates
  ): TexasComplianceResult {
    // 1. Validate geofence (location compliance)
    const actualLocation: LocationCoordinates = {
      latitude: evvRecord.clockInVerification.latitude,
      longitude: evvRecord.clockInVerification.longitude,
      accuracy: evvRecord.clockInVerification.accuracy,
    };

    const geofenceValidation = this.geofenceValidator.validate(
      actualLocation,
      expectedLocation
    );

    // 2. Validate six required elements
    const evvData: EVVDataInput = {
      serviceTypeCode: evvRecord.serviceTypeCode,
      serviceTypeName: evvRecord.serviceTypeName,
      clientId: evvRecord.clientId,
      clientName: evvRecord.clientName,
      clientMedicaidId: evvRecord.clientMedicaidId,
      caregiverId: evvRecord.caregiverId,
      caregiverName: evvRecord.caregiverName,
      caregiverEmployeeId: evvRecord.caregiverEmployeeId,
      caregiverNPI: evvRecord.caregiverNationalProviderId,
      serviceDate: evvRecord.serviceDate,
      serviceLocationLatitude: evvRecord.serviceAddress.latitude,
      serviceLocationLongitude: evvRecord.serviceAddress.longitude,
      serviceLocationAddress: this.formatAddress(evvRecord.serviceAddress),
      locationVerificationMethod: evvRecord.clockInVerification.method,
      clockInTime: evvRecord.clockInTime,
      clockOutTime: evvRecord.clockOutTime || undefined,
      totalDuration: evvRecord.totalDuration,
    };

    const elementsValidation = this.elementsValidator.validate(evvData);

    // 3. Validate grace period compliance
    const gracePeriodValidation = this.validateGracePeriod(
      evvRecord.clockInTime,
      evvRecord.clockOutTime,
      scheduledStartTime,
      scheduledEndTime
    );

    // 4. Determine compliance flags
    const flags = this.determineComplianceFlags(
      geofenceValidation,
      elementsValidation,
      gracePeriodValidation,
      evvRecord
    );

    // 5. Determine overall compliance level
    const complianceLevel = this.determineComplianceLevel(flags);

    // 6. Check if action required
    const requiresAction = this.requiresAction(flags);

    // 7. Generate recommendations
    const recommendations = this.generateRecommendations(
      geofenceValidation,
      elementsValidation,
      gracePeriodValidation,
      flags
    );

    // 8. Generate summary
    const summary = this.generateSummary(
      complianceLevel,
      geofenceValidation,
      elementsValidation,
      gracePeriodValidation
    );

    return {
      isCompliant: complianceLevel === 'COMPLIANT',
      complianceLevel,
      requiresAction,
      geofenceValidation,
      elementsValidation,
      gracePeriodValidation,
      flags,
      summary,
      recommendations,
    };
  }

  /**
   * Validate grace period compliance
   */
  private validateGracePeriod(
    actualClockIn: Date,
    actualClockOut: Date | null,
    scheduledStart: Date,
    scheduledEnd: Date
  ): GracePeriodValidationResult {
    const gracePeriodMs = this.config.gracePeriodMinutes * 60 * 1000;

    // Clock-in validation
    const clockInDiffMs = actualClockIn.getTime() - scheduledStart.getTime();
    const clockInDiffMinutes = Math.abs(clockInDiffMs) / (60 * 1000);

    let clockInStatus: GracePeriodValidationResult['clockInStatus'];
    if (Math.abs(clockInDiffMs) <= gracePeriodMs) {
      clockInStatus = 'ON_TIME';
    } else if (clockInDiffMs < 0) {
      // Clocked in early
      clockInStatus = Math.abs(clockInDiffMs) <= gracePeriodMs * 2 ? 'EARLY_GRACE' : 'VIOLATION';
    } else {
      // Clocked in late
      clockInStatus = clockInDiffMs <= gracePeriodMs * 2 ? 'LATE_GRACE' : 'VIOLATION';
    }

    // Clock-out validation
    let clockOutStatus: GracePeriodValidationResult['clockOutStatus'];
    let clockOutDiffMinutes: number | undefined = undefined;

    if (!actualClockOut) {
      clockOutStatus = 'INCOMPLETE';
    } else {
      const clockOutDiffMs = actualClockOut.getTime() - scheduledEnd.getTime();
      clockOutDiffMinutes = Math.abs(clockOutDiffMs) / (60 * 1000);

      if (Math.abs(clockOutDiffMs) <= gracePeriodMs) {
        clockOutStatus = 'ON_TIME';
      } else if (clockOutDiffMs < 0) {
        // Clocked out early
        clockOutStatus = Math.abs(clockOutDiffMs) <= gracePeriodMs * 2 ? 'EARLY_GRACE' : 'VIOLATION';
      } else {
        // Clocked out late
        clockOutStatus = clockOutDiffMs <= gracePeriodMs * 2 ? 'LATE_GRACE' : 'VIOLATION';
      }
    }

    // Overall validation
    const isValid =
      clockInStatus !== 'VIOLATION' &&
      (clockOutStatus === 'INCOMPLETE' || clockOutStatus !== 'VIOLATION');

    // Generate message
    let message = `Clock-in: ${clockInStatus}`;
    if (clockInDiffMinutes > 0) {
      message += ` (${clockInDiffMinutes.toFixed(1)} minutes ${clockInDiffMs > 0 ? 'late' : 'early'})`;
    }
    if (clockOutStatus !== 'INCOMPLETE') {
      message += `, Clock-out: ${clockOutStatus}`;
      if (clockOutDiffMinutes && clockOutDiffMinutes > 0) {
        message += ` (${clockOutDiffMinutes.toFixed(1)} minutes ${(actualClockOut!.getTime() - scheduledEnd.getTime()) > 0 ? 'late' : 'early'})`;
      }
    } else {
      message += ', Clock-out: Not recorded (visit in progress)';
    }

    return {
      isValid,
      clockInStatus,
      clockOutStatus,
      clockInDifferenceMinutes: clockInDiffMinutes,
      clockOutDifferenceMinutes: clockOutDiffMinutes,
      message,
    };
  }

  /**
   * Determine compliance flags
   */
  private determineComplianceFlags(
    geofence: GeofenceValidationResult,
    elements: SixElementsValidationResult,
    gracePeriod: GracePeriodValidationResult,
    evvRecord: EVVRecord
  ): TexasComplianceFlag[] {
    const flags: TexasComplianceFlag[] = [];

    // Geofence flags
    if (geofence.validationType === 'GPS_ACCURACY_EXCEEDED') {
      flags.push('GPS_ACCURACY_EXCEEDED');
      flags.push('REQUIRES_SUPERVISOR');
    } else if (geofence.validationType === 'OUTSIDE_GEOFENCE') {
      flags.push('GEOFENCE_VIOLATION');
      flags.push('REQUIRES_SUPERVISOR');
    } else if (geofence.validationType === 'WITHIN_ACCURACY_ALLOWANCE') {
      flags.push('GEOFENCE_WARNING');
    }

    // Elements flags
    if (!elements.allElementsPresent) {
      flags.push('MISSING_ELEMENTS');
      flags.push('REQUIRES_SUPERVISOR');
    }

    // Grace period flags
    if (!gracePeriod.isValid) {
      flags.push('GRACE_PERIOD_VIOLATION');
    }

    // Incomplete visit
    if (!evvRecord.clockOutTime) {
      flags.push('INCOMPLETE_VISIT');
    }

    // VMUR requirement (visit > 30 days old with issues)
    const recordAge = Date.now() - evvRecord.recordedAt.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (recordAge > thirtyDays && flags.length > 0) {
      flags.push('REQUIRES_VMUR');
    }

    // Aggregator ready (fully compliant)
    if (
      geofence.complianceLevel === 'COMPLIANT' &&
      elements.texasCompliant &&
      gracePeriod.isValid &&
      evvRecord.clockOutTime
    ) {
      flags.push('COMPLIANT');
      flags.push('AGGREGATOR_READY');
    }

    return flags;
  }

  /**
   * Determine overall compliance level
   */
  private determineComplianceLevel(flags: TexasComplianceFlag[]): 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' {
    if (flags.includes('COMPLIANT')) {
      return 'COMPLIANT';
    }

    const criticalFlags: TexasComplianceFlag[] = [
      'GEOFENCE_VIOLATION',
      'GPS_ACCURACY_EXCEEDED',
      'MISSING_ELEMENTS',
      'GRACE_PERIOD_VIOLATION',
    ];

    if (flags.some(f => criticalFlags.includes(f))) {
      return 'NON_COMPLIANT';
    }

    return 'WARNING';
  }

  /**
   * Check if action is required
   */
  private requiresAction(flags: TexasComplianceFlag[]): boolean {
    return flags.some(f =>
      f === 'REQUIRES_SUPERVISOR' ||
      f === 'REQUIRES_VMUR' ||
      f === 'GEOFENCE_VIOLATION' ||
      f === 'GPS_ACCURACY_EXCEEDED' ||
      f === 'MISSING_ELEMENTS'
    );
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    geofence: GeofenceValidationResult,
    elements: SixElementsValidationResult,
    gracePeriod: GracePeriodValidationResult,
    flags: TexasComplianceFlag[]
  ): string[] {
    const recommendations: string[] = [];

    // Geofence recommendations
    if (geofence.suggestedAction) {
      recommendations.push(geofence.suggestedAction);
    }

    // Elements recommendations
    if (!elements.allElementsPresent) {
      recommendations.push(
        `Complete missing EVV elements: ${elements.missingElements.join(', ')}`
      );
    }

    // Grace period recommendations
    if (!gracePeriod.isValid) {
      recommendations.push(
        'Document reason for clock-in/out time variance. Consider supervisor review.'
      );
    }

    // VMUR recommendation
    if (flags.includes('REQUIRES_VMUR')) {
      recommendations.push(
        'Record is older than 30 days. Use VMUR (Visit Maintenance Unlock Request) workflow for corrections.'
      );
    }

    // Supervisor recommendation
    if (flags.includes('REQUIRES_SUPERVISOR') && !flags.includes('REQUIRES_VMUR')) {
      recommendations.push(
        'Supervisor review and approval required before submission to aggregator.'
      );
    }

    return recommendations;
  }

  /**
   * Generate summary message
   */
  private generateSummary(
    complianceLevel: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT',
    geofence: GeofenceValidationResult,
    elements: SixElementsValidationResult,
    gracePeriod: GracePeriodValidationResult
  ): string {
    if (complianceLevel === 'COMPLIANT') {
      return 'Visit is fully compliant with Texas HHSC EVV requirements and ready for submission to HHAeXchange aggregator.';
    }

    const issues: string[] = [];

    if (geofence.complianceLevel === 'VIOLATION') {
      issues.push('geofence violation');
    } else if (geofence.complianceLevel === 'WARNING') {
      issues.push('geofence warning');
    }

    if (!elements.texasCompliant) {
      issues.push('missing/invalid required elements');
    }

    if (!gracePeriod.isValid) {
      issues.push('grace period violation');
    }

    return `Visit has compliance issues: ${issues.join(', ')}. ${complianceLevel === 'NON_COMPLIANT' ? 'Cannot submit to aggregator without resolution.' : 'May submit with warnings.'}`;
  }

  /**
   * Format service address
   */
  private formatAddress(address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  }): string {
    return `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.postalCode}`;
  }

  /**
   * Get configuration (for testing/debugging)
   */
  getConfig(): TexasComplianceConfig {
    return { ...this.config };
  }
}

/**
 * Create a Texas EVV compliance service with default configuration
 */
export function createTexasComplianceService(
  config?: Partial<TexasComplianceConfig>
): TexasEVVComplianceService {
  return new TexasEVVComplianceService(config);
}
