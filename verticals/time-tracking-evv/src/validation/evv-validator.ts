/**
 * EVV Validator - Validation and integrity checking for EVV data
 */

import { ValidationError } from '@care-commons/core';
import {
  ClockInInput,
  ClockOutInput,
  LocationVerificationInput,
  CreateGeofenceInput,
  GeofenceCheckResult,
  IntegrityCheckResult,
  VerificationResult,
  VerificationIssue,
  VerificationLevel,
  ComplianceFlag,
  EVVRecord,
} from '../types/evv';
import { CryptoUtils } from '../utils/crypto-utils';

export class EVVValidator {
  
  /**
   * Validate clock-in input
   */
  validateClockIn(input: ClockInInput): void {
    const errors: string[] = [];

    if (!input.visitId) {
      errors.push('visitId is required');
    }

    if (!input.caregiverId) {
      errors.push('caregiverId is required');
    }

    if (!input.location) {
      errors.push('location data is required');
    } else {
      this.validateLocation(input.location, errors);
    }

    if (!input.deviceInfo) {
      errors.push('deviceInfo is required');
    } else {
      this.validateDeviceInfo(input.deviceInfo, errors);
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid clock-in data', { errors });
    }
  }

  /**
   * Validate clock-out input
   */
  validateClockOut(input: ClockOutInput): void {
    const errors: string[] = [];

    if (!input.visitId) {
      errors.push('visitId is required');
    }

    if (!input.evvRecordId) {
      errors.push('evvRecordId is required');
    }

    if (!input.caregiverId) {
      errors.push('caregiverId is required');
    }

    if (!input.location) {
      errors.push('location data is required');
    } else {
      this.validateLocation(input.location, errors);
    }

    if (!input.deviceInfo) {
      errors.push('deviceInfo is required');
    } else {
      this.validateDeviceInfo(input.deviceInfo, errors);
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid clock-out data', { errors });
    }
  }

  /**
   * Validate location data
   */
  validateLocation(location: LocationVerificationInput, errors: string[]): void {
    if (location.latitude < -90 || location.latitude > 90) {
      errors.push('latitude must be between -90 and 90');
    }

    if (location.longitude < -180 || location.longitude > 180) {
      errors.push('longitude must be between -180 and 180');
    }

    if (location.accuracy < 0) {
      errors.push('accuracy cannot be negative');
    }

    if (location.accuracy > 1000) {
      errors.push('accuracy over 1000 meters is too low for verification');
    }

    if (!location.timestamp) {
      errors.push('location timestamp is required');
    } else {
      const now = new Date();
      const locationTime = new Date(location.timestamp);
      const timeDiff = Math.abs(now.getTime() - locationTime.getTime()) / 1000; // seconds

      // Location timestamp should be within 5 minutes of server time
      if (timeDiff > 300) {
        errors.push('location timestamp is too far from server time (clock skew detected)');
      }
    }

    if (!location.method) {
      errors.push('verification method is required');
    }

    if (location.mockLocationDetected) {
      errors.push('mock location/GPS spoofing detected - verification failed');
    }
  }

  /**
   * Validate device info
   */
  validateDeviceInfo(deviceInfo: any, errors: string[]): void {
    if (!deviceInfo.deviceId) {
      errors.push('deviceId is required');
    }

    if (!deviceInfo.deviceModel) {
      errors.push('deviceModel is required');
    }

    if (!deviceInfo.deviceOS) {
      errors.push('deviceOS is required');
    }

    if (!deviceInfo.appVersion) {
      errors.push('appVersion is required');
    }

    if (deviceInfo.isRooted || deviceInfo.isJailbroken) {
      errors.push('rooted/jailbroken devices are not allowed for EVV compliance');
    }
  }

  /**
   * Validate geofence creation
   */
  validateGeofence(input: CreateGeofenceInput): void {
    const errors: string[] = [];

    if (!input.organizationId) {
      errors.push('organizationId is required');
    }

    if (!input.clientId) {
      errors.push('clientId is required');
    }

    if (!input.addressId) {
      errors.push('addressId is required');
    }

    if (input.centerLatitude < -90 || input.centerLatitude > 90) {
      errors.push('centerLatitude must be between -90 and 90');
    }

    if (input.centerLongitude < -180 || input.centerLongitude > 180) {
      errors.push('centerLongitude must be between -180 and 180');
    }

    if (input.radiusMeters <= 0) {
      errors.push('radiusMeters must be positive');
    }

    if (input.radiusMeters < 10) {
      errors.push('radiusMeters too small - minimum is 10 meters');
    }

    if (input.radiusMeters > 500) {
      errors.push('radiusMeters too large - maximum is 500 meters');
    }

    if (input.shape === 'POLYGON') {
      if (!input.polygonPoints || input.polygonPoints.length < 3) {
        errors.push('polygon shape requires at least 3 points');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid geofence data', { errors });
    }
  }

  /**
   * Check if location is within geofence
   */
  checkGeofence(
    locationLat: number,
    locationLon: number,
    locationAccuracy: number,
    geofenceLat: number,
    geofenceLon: number,
    geofenceRadius: number,
    allowedVariance: number = 0
  ): GeofenceCheckResult {
    const distance = this.calculateDistance(locationLat, locationLon, geofenceLat, geofenceLon);
    const effectiveRadius = geofenceRadius + allowedVariance;
    
    // Account for GPS accuracy - if the accuracy circle overlaps the geofence, it's acceptable
    const maxPossibleDistance = distance + locationAccuracy;
    const minPossibleDistance = Math.max(0, distance - locationAccuracy);

    const isWithinGeofence = minPossibleDistance <= effectiveRadius;
    const requiresManualReview = maxPossibleDistance > effectiveRadius && minPossibleDistance <= effectiveRadius;

    let reason: string | undefined;
    if (!isWithinGeofence) {
      if (distance > effectiveRadius + 50) {
        reason = 'Location is significantly outside geofence';
      } else {
        reason = 'Location is slightly outside geofence - may need manual review';
      }
    } else if (requiresManualReview) {
      reason = 'GPS accuracy makes verification uncertain - manual review recommended';
    }

    const resultBase = {
      isWithinGeofence,
      distanceFromCenter: distance,
      distanceFromAddress: distance, // Same as center for circular geofence
      accuracy: locationAccuracy,
      requiresManualReview,
    };

    const resultOptional = {
      reason,
    };

    const resultFilteredOptional = Object.fromEntries(
      Object.entries(resultOptional).filter(([_, value]) => value !== undefined)
    );

    return {
      ...resultBase,
      ...resultFilteredOptional,
    };
  }

  /**
   * Verify EVV record integrity
   */
  verifyIntegrity(record: EVVRecord): IntegrityCheckResult {
    // Compute hash of core fields
    const coreData = {
      visitId: record.visitId,
      clientId: record.clientId,
      caregiverId: record.caregiverId,
      serviceDate: record.serviceDate,
      clockInTime: record.clockInTime,
      clockOutTime: record.clockOutTime,
      serviceAddress: record.serviceAddress,
      clockInVerification: record.clockInVerification,
      clockOutVerification: record.clockOutVerification,
    };

    const computedHash = CryptoUtils.generateIntegrityHash(coreData);
    const hashMatch = computedHash === record.integrityHash;

    // Compute checksum - exclude integrity fields to avoid circular dependency
    const { integrityHash: _integrityHash, integrityChecksum: _integrityChecksum, ...recordWithoutIntegrity } = record;
    const computedChecksum = CryptoUtils.generateChecksum(recordWithoutIntegrity);
    const checksumMatch = computedChecksum === record.integrityChecksum;

    const tamperDetected = !hashMatch || !checksumMatch;
    const issues: string[] = [];

    if (!hashMatch) {
      issues.push('Integrity hash mismatch - core data may have been tampered with');
    }

    if (!checksumMatch) {
      issues.push('Checksum mismatch - record data may have been modified');
    }

    const integrityBase = {
      isValid: !tamperDetected,
      hashMatch,
      checksumMatch,
      tamperDetected,
    };

    const integrityOptional = {
      issues: issues.length > 0 ? issues : undefined,
    };

    const integrityFilteredOptional = Object.fromEntries(
      Object.entries(integrityOptional).filter(([_, value]) => value !== undefined)
    );

    return {
      ...integrityBase,
      ...integrityFilteredOptional,
    };
  }

  /**
   * Perform comprehensive verification
   */
  performVerification(
    evvRecord: EVVRecord,
    geofenceCheck: GeofenceCheckResult
  ): VerificationResult {
    const issues: VerificationIssue[] = [];
    const complianceFlags: ComplianceFlag[] = ['COMPLIANT'];
    let requiresSupervisorReview = false;

    // Check geofence compliance
    if (!geofenceCheck.isWithinGeofence) {
      issues.push({
        issueType: 'GEOFENCE_VIOLATION',
        severity: 'HIGH',
        description: `Location verification failed - ${geofenceCheck.distanceFromAddress}m from address`,
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      complianceFlags.push('GEOFENCE_VIOLATION');
      requiresSupervisorReview = true;
    }

    if (geofenceCheck.requiresManualReview) {
      issues.push({
        issueType: 'LOCATION_UNCERTAIN',
        severity: 'MEDIUM',
        description: 'GPS accuracy makes location uncertain',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      requiresSupervisorReview = true;
    }

    // Check for GPS accuracy issues
    if (evvRecord.clockInVerification.accuracy > 100) {
      issues.push({
        issueType: 'LOW_GPS_ACCURACY',
        severity: 'MEDIUM',
        description: `GPS accuracy is low (${evvRecord.clockInVerification.accuracy}m)`,
        canBeOverridden: true,
        requiresSupervisor: false,
      });
    }

    // Check for mock location
    if (evvRecord.clockInVerification.mockLocationDetected) {
      issues.push({
        issueType: 'GPS_SPOOFING',
        severity: 'CRITICAL',
        description: 'Mock location/GPS spoofing detected',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      complianceFlags.push('LOCATION_SUSPICIOUS');
      requiresSupervisorReview = true;
    }

    // Check for rooted/jailbroken device
    // In real implementation, check device security using evvRecord.clockInVerification.deviceId

    // Check visit duration anomalies
    if (evvRecord.totalDuration) {
      if (evvRecord.totalDuration < 5) {
        issues.push({
          issueType: 'VISIT_TOO_SHORT',
          severity: 'HIGH',
          description: 'Visit duration is suspiciously short',
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        requiresSupervisorReview = true;
      }

      if (evvRecord.totalDuration > 720) { // 12 hours
        issues.push({
          issueType: 'VISIT_TOO_LONG',
          severity: 'MEDIUM',
          description: 'Visit duration is unusually long',
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        requiresSupervisorReview = true;
      }
    }

    // Check for missing clock-out
    if (!evvRecord.clockOutTime) {
      issues.push({
        issueType: 'MISSING_CLOCK_OUT',
        severity: 'HIGH',
        description: 'Visit has no clock-out time',
        canBeOverridden: true,
        requiresSupervisor: true,
      });
      requiresSupervisorReview = true;
    }

    // Check for time gaps
    if (evvRecord.pauseEvents && evvRecord.pauseEvents.length > 0) {
      const totalPauseTime = evvRecord.pauseEvents.reduce((sum, pause) => {
        return sum + (pause.duration || 0);
      }, 0);

      if (totalPauseTime > 120) { // More than 2 hours paused
        issues.push({
          issueType: 'EXCESSIVE_PAUSE_TIME',
          severity: 'MEDIUM',
          description: `Total pause time (${totalPauseTime} minutes) is excessive`,
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        complianceFlags.push('TIME_GAP');
        requiresSupervisorReview = true;
      }
    }

    // Determine verification level
    let verificationLevel: VerificationLevel = 'FULL';
    if (issues.length > 0) {
      const hasCritical = issues.some(i => i.severity === 'CRITICAL');
      const hasHigh = issues.some(i => i.severity === 'HIGH');
      
      if (hasCritical) {
        verificationLevel = 'EXCEPTION';
      } else if (hasHigh) {
        verificationLevel = 'PARTIAL';
      }
    }

    // If there are any non-compliant flags beyond 'COMPLIANT', remove 'COMPLIANT'
    if (complianceFlags.length > 1) {
      const index = complianceFlags.indexOf('COMPLIANT');
      if (index > -1) {
        complianceFlags.splice(index, 1);
      }
    }

    return {
      passed: issues.length === 0,
      verificationLevel,
      complianceFlags,
      issues,
      requiresSupervisorReview,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
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

    return R * c;
  }

  /**
   * Validate state-specific requirements for TX and FL
   * Comprehensive validation including grace periods, geofencing, clock methods
   */
  validateStateRequirements(
    stateCode: string,
    config: any, // Accept full state config with all properties
    record: EVVRecord,
    scheduledStartTime?: Date,
    _scheduledEndTime?: Date // Unused parameter, kept for API compatibility
  ): VerificationResult {
    const issues: VerificationIssue[] = [];
    const complianceFlags: ComplianceFlag[] = ['COMPLIANT'];
    let requiresSupervisorReview = false;

    // Validate state code
    if (stateCode !== 'TX' && stateCode !== 'FL') {
      throw new ValidationError(`Unsupported state code: ${stateCode}. Only TX and FL are supported.`);
    }

    // Texas-specific validations (26 TAC §558 - HHSC)
    if (stateCode === 'TX') {
      // 1. Check allowed clock methods
      if (config.allowedClockMethods) {
        const method = record.clockInVerification.method;
        const methodMap: Record<string, string[]> = {
          'GPS': ['MOBILE_GPS'],
          'PHONE': ['FIXED_TELEPHONY'],
          'BIOMETRIC': ['FIXED_BIOMETRIC'],
          'MANUAL': [],
        };

        const methodMappings = methodMap[method] || [];
        const isAllowed = methodMappings.some(m => config.allowedClockMethods.includes(m));

        if (!isAllowed) {
          issues.push({
            issueType: 'INVALID_CLOCK_METHOD',
            severity: 'HIGH',
            description: `Clock method ${method} is not allowed for Texas. Allowed methods: ${config.allowedClockMethods.join(', ')}`,
            canBeOverridden: false,
            requiresSupervisor: true,
          });
          complianceFlags.push('MANUAL_OVERRIDE');
          requiresSupervisorReview = true;
        }
      }

      // 2. Grace period validation
      const clockInGracePeriod = config.clockInGracePeriodMinutes ?? 10;
      if (scheduledStartTime) {
        const minutesEarly = (scheduledStartTime.getTime() - record.clockInTime.getTime()) / 60000;
        if (minutesEarly > clockInGracePeriod) {
          issues.push({
            issueType: 'CLOCK_IN_TOO_EARLY',
            severity: 'MEDIUM',
            description: `Clock-in is ${Math.round(minutesEarly)} minutes before scheduled start. Texas allows maximum ${clockInGracePeriod} minutes early clock-in.`,
            canBeOverridden: true,
            requiresSupervisor: true,
          });
          complianceFlags.push('TIME_GAP');
          requiresSupervisorReview = true;
        }
      }

      // 3. Geofence validation: Base radius + tolerance (HHSC guidance)
      const geoTolerance = config.geoPerimeterTolerance ?? 150; // 100m base + 50m tolerance
      const distance = record.clockInVerification.distanceFromAddress || 0;

      if (distance > geoTolerance) {
        issues.push({
          issueType: 'GEOFENCE_VIOLATION',
          severity: 'CRITICAL',
          description: `Location exceeds Texas geofence tolerance: ${Math.round(distance)}m from address. Texas: 100m + 50m tolerance`,
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        complianceFlags.push('GEOFENCE_VIOLATION');
        requiresSupervisorReview = true;
      }

      // 4. GPS accuracy requirement (check against tolerance)
      const accuracyThreshold = geoTolerance;
      if (record.clockInVerification.accuracy > accuracyThreshold) {
        issues.push({
          issueType: 'LOW_GPS_ACCURACY',
          severity: 'HIGH',
          description: `GPS accuracy ${Math.round(record.clockInVerification.accuracy)}m exceeds Texas tolerance of ${accuracyThreshold}m.`,
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        requiresSupervisorReview = true;
      }

      // 5. VMUR requirement for amended records
      if (record.recordStatus === 'AMENDED') {
        if (config.vmurEnabled && config.vmurApprovalRequired) {
          // Check if VMUR data exists (this would be in a separate field in production)
          // For now, we always flag amended records as needing VMUR
          issues.push({
            issueType: 'MISSING_VMUR',
            severity: 'HIGH',
            description: 'Texas requires VMUR approval for amended EVV records',
            canBeOverridden: false,
            requiresSupervisor: true,
          });
          complianceFlags.push('AMENDED');
          requiresSupervisorReview = true;
        }
      }

      // 6. Mock location detection (security violation)
      if (record.clockInVerification.mockLocationDetected) {
        issues.push({
          issueType: 'GPS_SPOOFING',
          severity: 'CRITICAL',
          description: 'Mock/simulated location detected - not allowed for EVV compliance per Texas HHSC policy.',
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        complianceFlags.push('LOCATION_SUSPICIOUS');
        requiresSupervisorReview = true;
      }
    }

    // Florida-specific validations (Chapter 59A-8 AHCA)
    if (stateCode === 'FL') {
      // 1. Check allowed verification methods
      if (config.allowedVerificationMethods) {
        const method = record.clockInVerification.method;
        const methodMap: Record<string, string[]> = {
          'GPS': ['MOBILE_GPS'],
          'PHONE': ['TELEPHONY_IVR'],
          'BIOMETRIC': ['BIOMETRIC_FIXED'],
          'MANUAL': [],
        };

        const methodMappings = methodMap[method] || [];
        const isAllowed = methodMappings.some(m => config.allowedVerificationMethods.includes(m));

        if (!isAllowed) {
          issues.push({
            issueType: 'INVALID_VERIFICATION_METHOD',
            severity: 'HIGH',
            description: `Verification method ${method} is not allowed for Florida. Allowed methods: ${config.allowedVerificationMethods.join(', ')}`,
            canBeOverridden: false,
            requiresSupervisor: true,
          });
          complianceFlags.push('MANUAL_OVERRIDE');
          requiresSupervisorReview = true;
        }
      }

      // 2. Grace period validation (Florida allows 15 minutes by default)
      const clockInGracePeriod = config.clockInGracePeriodMinutes ?? 15;
      if (scheduledStartTime) {
        const minutesEarly = (scheduledStartTime.getTime() - record.clockInTime.getTime()) / 60000;
        if (minutesEarly > clockInGracePeriod) {
          issues.push({
            issueType: 'CLOCK_IN_TOO_EARLY',
            severity: 'MEDIUM',
            description: `Clock-in is ${Math.round(minutesEarly)} minutes before scheduled start. Florida allows maximum ${clockInGracePeriod} minutes early clock-in.`,
            canBeOverridden: true,
            requiresSupervisor: true,
          });
          complianceFlags.push('TIME_GAP');
          requiresSupervisorReview = true;
        }
      }

      // 3. Geofence validation: Base radius + tolerance
      const geoTolerance = config.geoPerimeterTolerance ?? 250; // 150m base + 100m tolerance
      const distance = record.clockInVerification.distanceFromAddress || 0;

      if (distance > geoTolerance) {
        issues.push({
          issueType: 'GEOFENCE_VIOLATION',
          severity: 'HIGH',
          description: `Location exceeds Florida geofence tolerance: ${Math.round(distance)}m from address. Florida: 150m + 100m tolerance`,
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        complianceFlags.push('GEOFENCE_VIOLATION');
        requiresSupervisorReview = true;
      }

      // 4. Telephony fallback validation
      if (record.clockInVerification.method === 'PHONE') {
        if (config.allowTelephonyFallback === false) {
          issues.push({
            issueType: 'UNAUTHORIZED_TELEPHONY',
            severity: 'HIGH',
            description: 'Telephony verification not authorized for this configuration',
            canBeOverridden: false,
            requiresSupervisor: true,
          });
          complianceFlags.push('MANUAL_OVERRIDE');
          requiresSupervisorReview = true;
        }
      }

      // 5. MCO-specific requirements
      if (config.mcoRequirements) {
        const mco = config.mcoRequirements;

        // Check client signature requirement
        if (mco.requiresClientSignature) {
          // TODO: Implement client signature validation once EVVRecord type is extended
          // In production, check if signature exists on record
          // if (!record.clientSignature) {
          //   issues.push({
          //     issueType: 'MISSING_SIGNATURE',
          //     severity: 'HIGH',
          //     description: `MCO ${mco.mcoName} requires client signature`,
          //     canBeOverridden: false,
          //     requiresSupervisor: true,
          //   });
          //   complianceFlags.push('MISSING_SIGNATURE');
          //   requiresSupervisorReview = true;
          // }
        }

        // Check photo verification requirement
        if (mco.requiresPhotoVerification) {
          // TODO: Implement photo verification validation once EVVRecord type is extended
          // In production, check if photo exists on record
          // if (!record.photoVerification) {
          //   issues.push({
          //     issueType: 'MISSING_PHOTO_VERIFICATION',
          //     severity: 'HIGH',
          //     description: `MCO ${mco.mcoName} requires photo verification`,
          //     canBeOverridden: false,
          //     requiresSupervisor: true,
          //   });
          //   requiresSupervisorReview = true;
          // }
        }
      }

      // 6. Mock location detection
      if (record.clockInVerification.mockLocationDetected) {
        issues.push({
          issueType: 'GPS_SPOOFING',
          severity: 'CRITICAL',
          description: 'Mock/simulated location detected - not allowed for EVV compliance per Florida AHCA policy.',
          canBeOverridden: true,
          requiresSupervisor: true,
        });
        complianceFlags.push('LOCATION_SUSPICIOUS');
        requiresSupervisorReview = true;
      }
    }

    // Remove COMPLIANT flag if there are any other flags
    if (complianceFlags.length > 1) {
      const index = complianceFlags.indexOf('COMPLIANT');
      if (index > -1) {
        complianceFlags.splice(index, 1);
      }
    }

    // Determine verification level based on issue severity
    let verificationLevel: VerificationLevel = 'FULL';
    if (issues.length > 0) {
      const hasCritical = issues.some(i => i.severity === 'CRITICAL');
      const hasHigh = issues.some(i => i.severity === 'HIGH');
      const hasMedium = issues.some(i => i.severity === 'MEDIUM');

      if (hasCritical) {
        verificationLevel = 'EXCEPTION';
      } else if (hasHigh || hasMedium) {
        verificationLevel = 'PARTIAL';
      }
    }

    return {
      passed: issues.length === 0,
      verificationLevel,
      complianceFlags,
      issues,
      requiresSupervisorReview,
    };
  }

  /**
   * Validate geographic location with state-specific tolerance
   *
   * Tests call this method directly with raw parameters for geographic validation
   */
  validateGeographicWithStateTolerance(
    stateCode: string,
    locationLat: number,
    locationLon: number,
    accuracy: number,
    geofenceLat: number,
    geofenceLon: number,
    baseRadius: number
  ): GeofenceCheckResult {
    // Validate state code
    if (stateCode !== 'TX' && stateCode !== 'FL') {
      throw new ValidationError(`Unsupported state code: ${stateCode}. Only TX and FL are supported.`);
    }

    // Get state-specific tolerance
    // Texas: 100m base + 50m tolerance = 150m total
    // Florida: 150m base + 100m tolerance = 250m total
    const stateTolerance = stateCode === 'TX' ? 50 : 100;

    // Use the standard geofence check with state-specific tolerance
    const geofenceCheck = this.checkGeofence(
      locationLat,
      locationLon,
      accuracy,
      geofenceLat,
      geofenceLon,
      baseRadius,
      stateTolerance
    );

    return geofenceCheck;
  }
}
