/**
 * State Compliance Service
 *
 * Provides business logic methods for state-specific compliance validation.
 * This service abstracts the complexity of state regulations and provides
 * a clean API for other verticals to validate compliance requirements.
 *
 * Domain Coverage:
 * - EVV (Electronic Visit Verification) validation
 * - Geofencing rules
 * - Background screening requirements
 * - Caregiver credentialing
 * - Plan of care review schedules
 * - Visit correction workflows
 *
 * @module StateComplianceService
 */

import { ALL_STATES_CONFIG } from './states/all-states-config.js';
import type {
  StateCode,
  StateComplianceConfig,
  EVVConfig,
} from './states/types.js';

/**
 * Visit data for EVV validation
 */
export interface VisitData {
  /** Client's address coordinates */
  clientLatitude: number;
  clientLongitude: number;

  /** Actual clock-in coordinates */
  clockInLatitude: number;
  clockInLongitude: number;

  /** Actual clock-in time */
  clockInTime: Date;

  /** Scheduled start time */
  scheduledStartTime: Date;

  /** Clock-out coordinates (if clocking out) */
  clockOutLatitude?: number;
  clockOutLongitude?: number;

  /** Clock-out time (if clocking out) */
  clockOutTime?: Date;

  /** Scheduled end time */
  scheduledEndTime?: Date;

  /** GPS accuracy in meters */
  gpsAccuracy?: number;
}

/**
 * Validation result for EVV checks
 */
export interface EVVValidationResult {
  /** Is the visit compliant? */
  valid: boolean;

  /** Array of validation errors */
  errors: EVVValidationError[];

  /** Array of warnings (non-blocking) */
  warnings: string[];

  /** State-specific context for error messages */
  regulatoryContext?: string;
}

/**
 * Specific EVV validation error
 */
export interface EVVValidationError {
  /** Error code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Field that failed validation */
  field: string;

  /** State-specific regulatory citation */
  regulation?: string;
}

/**
 * Caregiver data for compliance checks
 */
export interface CaregiverComplianceData {
  /** Background screening completion date */
  backgroundScreeningDate?: Date;

  /** Background screening expiration date */
  backgroundScreeningExpiration?: Date;

  /** Nurse aide registry number */
  nurseAideRegistryNumber?: string;

  /** Training hours completed */
  trainingHoursCompleted: number;

  /** Annual training hours (current year) */
  annualTrainingHours: number;

  /** Required certifications held */
  certificationsHeld: string[];

  /** Medication delegation trained? */
  medicationDelegationTrained?: boolean;
}

/**
 * Client type for plan of care validation
 */
export type ClientServiceType = 'SKILLED_NURSING' | 'PERSONAL_CARE';

/**
 * Plan of care data
 */
export interface PlanOfCareData {
  /** Service type */
  serviceType: ClientServiceType;

  /** Last review date */
  lastReviewDate: Date;

  /** Last RN supervision visit date */
  lastRNSupervisionDate?: Date;

  /** Physician order date */
  physicianOrderDate: Date;
}

/**
 * State Compliance Service
 *
 * Provides validation and compliance checking for all 50 states + DC.
 */
export class StateComplianceService {
  /**
   * Get state configuration
   */
  getStateConfig(stateCode: StateCode): StateComplianceConfig {
    return ALL_STATES_CONFIG[stateCode];
  }

  /**
   * Validate EVV requirements for a state
   *
   * Checks geofencing, grace periods, and state-specific EVV rules.
   *
   * @param stateCode - State to validate against
   * @param visitData - Visit check-in/out data
   * @returns Validation result with errors and warnings
   *
   * @example
   * ```typescript
   * const service = new StateComplianceService();
   * const result = service.validateEVVForState('TX', {
   *   clientLatitude: 30.2672,
   *   clientLongitude: -97.7431,
   *   clockInLatitude: 30.2680,
   *   clockInLongitude: -97.7435,
   *   clockInTime: new Date('2025-01-15T08:05:00'),
   *   scheduledStartTime: new Date('2025-01-15T08:00:00'),
   *   gpsAccuracy: 20,
   * });
   *
   * if (!result.valid) {
   *   console.error('EVV validation failed:', result.errors);
   * }
   * ```
   */
  validateEVVForState(stateCode: StateCode, visitData: VisitData): EVVValidationResult {
    const config = this.getStateConfig(stateCode);
    const errors: EVVValidationError[] = [];
    const warnings: string[] = [];

    // Check if EVV is mandated
    if (!config.evv.mandated) {
      warnings.push(`EVV is not mandated in ${config.stateName}, but validation proceeding as best practice.`);
    }

    // Validate geofencing if required
    if (config.evv.geofencing.required) {
      const geofenceError = this.validateGeofence(stateCode, visitData, config.evv);
      if (geofenceError !== undefined) {
        errors.push(geofenceError);
      }
    }

    // Validate grace periods for clock-in
    const graceError = this.validateGracePeriod(stateCode, visitData, config.evv);
    if (graceError !== undefined) {
      errors.push(graceError);
    }

    // Validate clock-out if provided
    if (visitData.clockOutTime !== undefined && visitData.scheduledEndTime !== undefined) {
      const clockOutError = this.validateClockOut(stateCode, visitData, config.evv);
      if (clockOutError !== undefined) {
        errors.push(clockOutError);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      regulatoryContext: `${config.stateName} EVV requirements per ${config.regulatory.keyRegulations.join(', ')}`,
    };
  }

  /**
   * Get geofence radius for a state
   *
   * Returns the total allowable distance (base radius + GPS accuracy tolerance).
   *
   * @param stateCode - State code
   * @param gpsAccuracy - Current GPS accuracy in meters (optional)
   * @returns Total geofence radius in meters
   *
   * @example
   * ```typescript
   * const service = new StateComplianceService();
   * const radius = service.getGeofenceRadius('TX', 15); // 115 meters (100 base + 15 accuracy)
   * const radiusFL = service.getGeofenceRadius('FL', 15); // 165 meters (150 base + 15 accuracy)
   * ```
   */
  getGeofenceRadius(stateCode: StateCode, gpsAccuracy?: number): number {
    const config = this.getStateConfig(stateCode);
    const baseRadius = config.evv.geofencing.baseRadiusMeters;
    const tolerance = gpsAccuracy ?? config.evv.geofencing.gpsAccuracyTolerance;

    return baseRadius + tolerance;
  }

  /**
   * Check if caregiver background screening is valid
   *
   * Validates based on state-specific validity periods and rescreening requirements.
   *
   * @param stateCode - State code
   * @param caregiver - Caregiver compliance data
   * @returns true if background screening is current and valid
   *
   * @example
   * ```typescript
   * const service = new StateComplianceService();
   * const isValid = service.checkBackgroundScreeningValid('TX', {
   *   backgroundScreeningDate: new Date('2024-01-01'),
   *   backgroundScreeningExpiration: new Date('2026-01-01'),
   *   trainingHoursCompleted: 80,
   *   annualTrainingHours: 12,
   *   certificationsHeld: ['CPR', 'First Aid'],
   * });
   * ```
   */
  checkBackgroundScreeningValid(stateCode: StateCode, caregiver: CaregiverComplianceData): boolean {
    const config = this.getStateConfig(stateCode);
    const now = new Date();

    // Check expiration date if provided
    if (caregiver.backgroundScreeningExpiration !== undefined) {
      return caregiver.backgroundScreeningExpiration > now;
    }

    // Calculate expiration from screening date
    if (caregiver.backgroundScreeningDate !== undefined) {
      const validityMonths = config.backgroundScreening.validityMonths;
      const expirationDate = new Date(caregiver.backgroundScreeningDate);
      expirationDate.setMonth(expirationDate.getMonth() + validityMonths);

      return expirationDate > now;
    }

    // No screening date available
    return false;
  }

  /**
   * Get next background screening rescreening date
   *
   * @param stateCode - State code
   * @param lastScreeningDate - Date of last screening
   * @returns Date when rescreening is required
   */
  getBackgroundScreeningRescreeningDate(stateCode: StateCode, lastScreeningDate: Date): Date {
    const config = this.getStateConfig(stateCode);
    const rescreeningDate = new Date(lastScreeningDate);
    rescreeningDate.setMonth(rescreeningDate.getMonth() + config.backgroundScreening.rescreeningFrequencyMonths);
    return rescreeningDate;
  }

  /**
   * Check if caregiver credentialing is valid
   *
   * Validates training hours, certifications, and registry requirements.
   *
   * @param stateCode - State code
   * @param caregiver - Caregiver compliance data
   * @returns true if caregiver meets all credentialing requirements
   */
  checkCaregiverCredentialingValid(stateCode: StateCode, caregiver: CaregiverComplianceData): boolean {
    const config = this.getStateConfig(stateCode);
    const cred = config.caregiverCredentialing;

    // Check nurse aide registry
    if (cred.nurseAideRegistryRequired && caregiver.nurseAideRegistryNumber === undefined) {
      return false;
    }

    // Check minimum training hours
    if (caregiver.trainingHoursCompleted < cred.minimumTrainingHours) {
      return false;
    }

    // Check annual training hours
    if (caregiver.annualTrainingHours < cred.annualTrainingHours) {
      return false;
    }

    // Check required certifications
    const missingCerts = cred.requiredCertifications.filter(
      reqCert => !caregiver.certificationsHeld.includes(reqCert)
    );
    if (missingCerts.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * Get plan of care review due date
   *
   * Calculates when the next plan of care review is due based on service type.
   *
   * @param stateCode - State code
   * @param serviceType - Type of service (skilled nursing or personal care)
   * @param lastReviewDate - Date of last review
   * @returns Date when review is due
   *
   * @example
   * ```typescript
   * const service = new StateComplianceService();
   * const dueDate = service.getPlanOfCareReviewDue(
   *   'FL',
   *   'SKILLED_NURSING',
   *   new Date('2025-01-01')
   * ); // Returns date 60 days later (Florida skilled nursing requirement)
   * ```
   */
  getPlanOfCareReviewDue(stateCode: StateCode, serviceType: ClientServiceType, lastReviewDate: Date): Date {
    const config = this.getStateConfig(stateCode);
    const reviewDays = serviceType === 'SKILLED_NURSING'
      ? config.planOfCare.skilledNursingReviewDays
      : config.planOfCare.personalCareReviewDays;

    const dueDate = new Date(lastReviewDate);
    dueDate.setUTCDate(dueDate.getUTCDate() + reviewDays);
    return dueDate;
  }

  /**
   * Get RN supervision visit due date
   *
   * Calculates when the next RN supervision visit is due.
   *
   * @param stateCode - State code
   * @param lastSupervisionDate - Date of last supervision visit
   * @returns Date when supervision visit is due, or undefined if not required
   *
   * @example
   * ```typescript
   * const service = new StateComplianceService();
   * const dueDate = service.getRNSupervisionDue('FL', new Date('2025-01-01'));
   * // Returns date 60 days later (Florida requires 60-day RN supervision visits)
   * ```
   */
  getRNSupervisionDue(stateCode: StateCode, lastSupervisionDate: Date): Date | undefined {
    const config = this.getStateConfig(stateCode);

    if (config.planOfCare.rnSupervisionVisitDays === undefined) {
      return undefined;
    }

    const dueDate = new Date(lastSupervisionDate);
    dueDate.setUTCDate(dueDate.getUTCDate() + config.planOfCare.rnSupervisionVisitDays);
    return dueDate;
  }

  /**
   * Check if plan of care is due for review
   *
   * @param stateCode - State code
   * @param planOfCare - Plan of care data
   * @returns true if review is overdue or due within 7 days
   */
  isPlanOfCareReviewDue(stateCode: StateCode, planOfCare: PlanOfCareData): boolean {
    const reviewDueDate = this.getPlanOfCareReviewDue(
      stateCode,
      planOfCare.serviceType,
      planOfCare.lastReviewDate
    );

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return reviewDueDate <= sevenDaysFromNow;
  }

  /**
   * Check if RN supervision visit is due
   *
   * @param stateCode - State code
   * @param lastSupervisionDate - Date of last supervision visit
   * @returns true if supervision visit is overdue or due within 7 days
   */
  isRNSupervisionDue(stateCode: StateCode, lastSupervisionDate: Date): boolean {
    const supervisionDueDate = this.getRNSupervisionDue(stateCode, lastSupervisionDate);

    if (supervisionDueDate === undefined) {
      return false; // Not required in this state
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return supervisionDueDate <= sevenDaysFromNow;
  }

  /**
   * Check if caregiver can self-correct visit data
   *
   * @param stateCode - State code
   * @param visitTime - Time of the visit
   * @returns true if caregiver can still correct the visit
   */
  canCaregiverCorrectVisit(stateCode: StateCode, visitTime: Date): boolean {
    const config = this.getStateConfig(stateCode);

    if (!config.evv.visitCorrection.caregiverCanCorrect) {
      return false;
    }

    const now = new Date();
    const hoursSinceVisit = (now.getTime() - visitTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceVisit <= config.evv.visitCorrection.correctionWindowHours;
  }

  /**
   * Get visit correction requirements for a state
   *
   * @param stateCode - State code
   * @returns Visit correction configuration
   */
  getVisitCorrectionRequirements(stateCode: StateCode): {
    caregiverCanCorrect: boolean;
    correctionWindowHours: number;
    requiresSupervisorApproval: boolean;
  } {
    const config = this.getStateConfig(stateCode);
    return config.evv.visitCorrection;
  }

  /**
   * Get EVV aggregators for a state
   *
   * @param stateCode - State code
   * @returns Array of required aggregators
   */
  getEVVAggregators(stateCode: StateCode): string[] {
    const config = this.getStateConfig(stateCode);
    return config.evv.aggregators;
  }

  /**
   * Get grace period minutes for a state
   *
   * @param stateCode - State code
   * @returns Object with early and late grace periods in minutes
   */
  getGracePeriods(stateCode: StateCode): { earlyClockInMinutes: number; lateClockOutMinutes: number } {
    const config = this.getStateConfig(stateCode);
    return config.evv.gracePeriods;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Validate geofencing
   */
  private validateGeofence(
    stateCode: StateCode,
    visitData: VisitData,
    evvConfig: EVVConfig
  ): EVVValidationError | undefined {
    const distance = this.calculateDistance(
      visitData.clientLatitude,
      visitData.clientLongitude,
      visitData.clockInLatitude,
      visitData.clockInLongitude
    );

    const allowedRadius = this.getGeofenceRadius(stateCode, visitData.gpsAccuracy);

    if (distance > allowedRadius) {
      return {
        code: 'GEOFENCE_VIOLATION',
        message: `Clock-in location is ${Math.round(distance)}m from client address, exceeding allowed radius of ${allowedRadius}m`,
        field: 'clockInLocation',
        regulation: `${stateCode} requires geofencing within ${evvConfig.geofencing.baseRadiusMeters}m + GPS accuracy`,
      };
    }

    return undefined;
  }

  /**
   * Validate grace period for clock-in
   */
  private validateGracePeriod(
    stateCode: StateCode,
    visitData: VisitData,
    evvConfig: EVVConfig
  ): EVVValidationError | undefined {
    const scheduledTime = visitData.scheduledStartTime.getTime();
    const actualTime = visitData.clockInTime.getTime();
    const diffMinutes = (actualTime - scheduledTime) / (1000 * 60);

    if (diffMinutes < 0) {
      // Early clock-in
      const earlyMinutes = Math.abs(diffMinutes);
      if (earlyMinutes > evvConfig.gracePeriods.earlyClockInMinutes) {
        return {
          code: 'EARLY_CLOCK_IN',
          message: `Clock-in ${Math.round(earlyMinutes)} minutes early, exceeding ${evvConfig.gracePeriods.earlyClockInMinutes}-minute grace period`,
          field: 'clockInTime',
          regulation: `${stateCode} allows ${evvConfig.gracePeriods.earlyClockInMinutes} minutes early clock-in`,
        };
      }
    }

    return undefined;
  }

  /**
   * Validate clock-out timing
   */
  private validateClockOut(
    stateCode: StateCode,
    visitData: VisitData,
    evvConfig: EVVConfig
  ): EVVValidationError | undefined {
    if (visitData.clockOutTime === undefined || visitData.scheduledEndTime === undefined) {
      return undefined;
    }

    const scheduledTime = visitData.scheduledEndTime.getTime();
    const actualTime = visitData.clockOutTime.getTime();
    const diffMinutes = (actualTime - scheduledTime) / (1000 * 60);

    if (diffMinutes > 0) {
      // Late clock-out
      if (diffMinutes > evvConfig.gracePeriods.lateClockOutMinutes) {
        return {
          code: 'LATE_CLOCK_OUT',
          message: `Clock-out ${Math.round(diffMinutes)} minutes late, exceeding ${evvConfig.gracePeriods.lateClockOutMinutes}-minute grace period`,
          field: 'clockOutTime',
          regulation: `${stateCode} allows ${evvConfig.gracePeriods.lateClockOutMinutes} minutes late clock-out`,
        };
      }
    }

    return undefined;
  }

  /**
   * Calculate distance between two points using Haversine formula
   *
   * @param lat1 - Latitude of point 1
   * @param lon1 - Longitude of point 1
   * @param lat2 - Latitude of point 2
   * @param lon2 - Longitude of point 2
   * @returns Distance in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
