/**
 * Texas Geofence Validation Service
 *
 * Implements Texas HHSC EVV geofence validation requirements:
 * - Base radius: 100 meters (HHSC standard)
 * - GPS accuracy allowance: Additional tolerance based on reported accuracy
 * - Validation levels: COMPLIANT, WARNING, VIOLATION
 *
 * Per Texas HHSC EVV Policy:
 * - GPS accuracy ≤100m is required for compliant submission
 * - Geofence verification must account for GPS accuracy variance
 * - Location within (radius + accuracy) is acceptable with warning
 * - Location beyond (radius + accuracy) requires exception handling
 *
 * References:
 * - 26 TAC §558.453 (Texas Administrative Code - EVV Requirements)
 * - HHSC EVV Policy Handbook v3.2
 */

import { ValidationError } from '@care-commons/core';

/**
 * Geofence validation result
 */
export interface GeofenceValidationResult {
  isValid: boolean;
  validationType: GeofenceValidationType;
  distanceMeters: number;
  baseRadiusMeters: number;
  gpsAccuracyMeters: number;
  effectiveRadiusMeters: number;
  message: string;
  complianceLevel: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  requiresException: boolean;
  suggestedAction?: string;
}

/**
 * Validation type classification
 */
export type GeofenceValidationType =
  | 'WITHIN_BASE_RADIUS' // Within 100m base radius - fully compliant
  | 'WITHIN_ACCURACY_ALLOWANCE' // Beyond base but within GPS accuracy allowance - warning
  | 'OUTSIDE_GEOFENCE' // Beyond all allowances - violation
  | 'GPS_ACCURACY_EXCEEDED'; // GPS accuracy > 100m - requires exception

/**
 * Location coordinates
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // GPS accuracy in meters
}

/**
 * Texas-specific geofence configuration
 */
export interface TexasGeofenceConfig {
  baseRadiusMeters: number; // Default: 100m
  maxGPSAccuracyMeters: number; // Default: 100m
  accuracyAllowanceMultiplier: number; // Default: 1.0 (full accuracy as allowance)
  strictMode: boolean; // If true, GPS accuracy > 100m is rejected
}

/**
 * Default Texas HHSC configuration
 */
const TEXAS_DEFAULT_CONFIG: TexasGeofenceConfig = {
  baseRadiusMeters: 100, // HHSC standard
  maxGPSAccuracyMeters: 100, // HHSC requirement
  accuracyAllowanceMultiplier: 1.0, // Full GPS accuracy as additional allowance
  strictMode: true, // Enforce GPS accuracy requirement
};

/**
 * Texas Geofence Validator
 *
 * Validates location against Texas HHSC geofence requirements
 */
export class TexasGeofenceValidator {
  private config: TexasGeofenceConfig;

  constructor(config?: Partial<TexasGeofenceConfig>) {
    this.config = { ...TEXAS_DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate a location against geofence with Texas HHSC rules
   *
   * @param actualLocation - Caregiver's actual location (from GPS)
   * @param expectedLocation - Expected service location (client address)
   * @returns Validation result with compliance level
   */
  validate(
    actualLocation: LocationCoordinates,
    expectedLocation: LocationCoordinates
  ): GeofenceValidationResult {
    // 1. Validate input
    this.validateInput(actualLocation, expectedLocation);

    // 2. Calculate distance between locations
    const distanceMeters = this.calculateDistance(
      actualLocation.latitude,
      actualLocation.longitude,
      expectedLocation.latitude,
      expectedLocation.longitude
    );

    // 3. Get GPS accuracy (default to 0 if not provided)
    const gpsAccuracyMeters = actualLocation.accuracy || 0;

    // 4. Check if GPS accuracy exceeds Texas requirement
    if (this.config.strictMode && gpsAccuracyMeters > this.config.maxGPSAccuracyMeters) {
      return {
        isValid: false,
        validationType: 'GPS_ACCURACY_EXCEEDED',
        distanceMeters,
        baseRadiusMeters: this.config.baseRadiusMeters,
        gpsAccuracyMeters,
        effectiveRadiusMeters: this.config.baseRadiusMeters,
        message: `GPS accuracy (${gpsAccuracyMeters.toFixed(1)}m) exceeds Texas HHSC requirement (${this.config.maxGPSAccuracyMeters}m). This visit requires an exception or manual verification.`,
        complianceLevel: 'VIOLATION',
        requiresException: true,
        suggestedAction: 'Use VMUR workflow or manual supervisor verification',
      };
    }

    // 5. Calculate effective radius (base + GPS accuracy allowance)
    const effectiveRadiusMeters =
      this.config.baseRadiusMeters +
      gpsAccuracyMeters * this.config.accuracyAllowanceMultiplier;

    // 6. Determine compliance level
    if (distanceMeters <= this.config.baseRadiusMeters) {
      // Within base radius - fully compliant
      return {
        isValid: true,
        validationType: 'WITHIN_BASE_RADIUS',
        distanceMeters,
        baseRadiusMeters: this.config.baseRadiusMeters,
        gpsAccuracyMeters,
        effectiveRadiusMeters,
        message: `Location verified within ${this.config.baseRadiusMeters}m geofence (distance: ${distanceMeters.toFixed(1)}m). Fully compliant with Texas HHSC EVV requirements.`,
        complianceLevel: 'COMPLIANT',
        requiresException: false,
      };
    } else if (distanceMeters <= effectiveRadiusMeters) {
      // Beyond base radius but within GPS accuracy allowance - warning
      const excessDistance = distanceMeters - this.config.baseRadiusMeters;
      return {
        isValid: true,
        validationType: 'WITHIN_ACCURACY_ALLOWANCE',
        distanceMeters,
        baseRadiusMeters: this.config.baseRadiusMeters,
        gpsAccuracyMeters,
        effectiveRadiusMeters,
        message: `Location is ${excessDistance.toFixed(1)}m beyond base geofence but within GPS accuracy allowance. Distance: ${distanceMeters.toFixed(1)}m, Effective radius: ${effectiveRadiusMeters.toFixed(1)}m. Acceptable with warning.`,
        complianceLevel: 'WARNING',
        requiresException: false,
        suggestedAction: 'Review location accuracy. Consider supervisor verification if pattern continues.',
      };
    } else {
      // Beyond all allowances - violation
      const excessDistance = distanceMeters - effectiveRadiusMeters;
      return {
        isValid: false,
        validationType: 'OUTSIDE_GEOFENCE',
        distanceMeters,
        baseRadiusMeters: this.config.baseRadiusMeters,
        gpsAccuracyMeters,
        effectiveRadiusMeters,
        message: `Location is ${excessDistance.toFixed(1)}m beyond geofence limits. Distance: ${distanceMeters.toFixed(1)}m, Allowed: ${effectiveRadiusMeters.toFixed(1)}m. Geofence violation - requires exception handling.`,
        complianceLevel: 'VIOLATION',
        requiresException: true,
        suggestedAction: 'Verify service location with client. Use VMUR workflow if address changed or use manual verification for exception.',
      };
    }
  }

  /**
   * Validate multiple location checks (for clock-in, clock-out, mid-visit)
   *
   * @param locations - Array of locations to validate
   * @param expectedLocation - Expected service location
   * @returns Array of validation results
   */
  validateMultiple(
    locations: LocationCoordinates[],
    expectedLocation: LocationCoordinates
  ): GeofenceValidationResult[] {
    return locations.map(location => this.validate(location, expectedLocation));
  }

  /**
   * Get overall compliance status from multiple validations
   *
   * @param results - Array of validation results
   * @returns Overall compliance level
   */
  getOverallCompliance(results: GeofenceValidationResult[]): 'COMPLIANT' | 'WARNING' | 'VIOLATION' {
    if (results.some(r => r.complianceLevel === 'VIOLATION')) {
      return 'VIOLATION';
    }
    if (results.some(r => r.complianceLevel === 'WARNING')) {
      return 'WARNING';
    }
    return 'COMPLIANT';
  }

  /**
   * Check if visit requires exception handling
   *
   * @param results - Array of validation results
   * @returns True if any result requires exception
   */
  requiresException(results: GeofenceValidationResult[]): boolean {
    return results.some(r => r.requiresException);
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   *
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Validate input coordinates
   */
  private validateInput(
    actualLocation: LocationCoordinates,
    expectedLocation: LocationCoordinates
  ): void {
    // Validate latitude
    if (
      !this.isValidLatitude(actualLocation.latitude) ||
      !this.isValidLatitude(expectedLocation.latitude)
    ) {
      throw new ValidationError('Invalid latitude. Must be between -90 and 90.');
    }

    // Validate longitude
    if (
      !this.isValidLongitude(actualLocation.longitude) ||
      !this.isValidLongitude(expectedLocation.longitude)
    ) {
      throw new ValidationError('Invalid longitude. Must be between -180 and 180.');
    }

    // Validate GPS accuracy if provided
    if (
      actualLocation.accuracy !== undefined &&
      (actualLocation.accuracy < 0 || actualLocation.accuracy > 10000)
    ) {
      throw new ValidationError(
        'Invalid GPS accuracy. Must be between 0 and 10000 meters.'
      );
    }
  }

  /**
   * Check if latitude is valid
   */
  private isValidLatitude(lat: number): boolean {
    return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
  }

  /**
   * Check if longitude is valid
   */
  private isValidLongitude(lon: number): boolean {
    return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
  }

  /**
   * Get configuration (for testing/debugging)
   */
  getConfig(): TexasGeofenceConfig {
    return { ...this.config };
  }
}

/**
 * Create a Texas geofence validator with default configuration
 */
export function createTexasGeofenceValidator(
  config?: Partial<TexasGeofenceConfig>
): TexasGeofenceValidator {
  return new TexasGeofenceValidator(config);
}
