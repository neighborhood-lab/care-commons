/**
 * Texas Geofence Validator Tests
 *
 * Tests for Texas HHSC EVV geofence validation requirements
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TexasGeofenceValidator,
  createTexasGeofenceValidator,
  type LocationCoordinates,
} from '../texas-geofence-validator';

describe('TexasGeofenceValidator', () => {
  let validator: TexasGeofenceValidator;

  // Test locations (Austin, Texas area)
  const clientAddress: LocationCoordinates = {
    latitude: 30.2672,
    longitude: -97.7431,
  };

  beforeEach(() => {
    validator = createTexasGeofenceValidator();
  });

  describe('Constructor and Configuration', () => {
    it('should create validator with default Texas configuration', () => {
      const config = validator.getConfig();

      expect(config.baseRadiusMeters).toBe(100);
      expect(config.maxGPSAccuracyMeters).toBe(100);
      expect(config.accuracyAllowanceMultiplier).toBe(1.0);
      expect(config.strictMode).toBe(true);
    });

    it('should create validator with custom configuration', () => {
      const customValidator = new TexasGeofenceValidator({
        baseRadiusMeters: 150,
        strictMode: false,
      });

      const config = customValidator.getConfig();

      expect(config.baseRadiusMeters).toBe(150);
      expect(config.strictMode).toBe(false);
    });
  });

  describe('Scenario 1: Compliant Visit (Perfect Clock-In)', () => {
    it('should validate location within base radius as COMPLIANT', () => {
      // Caregiver at client address (0m distance)
      const actualLocation: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 15, // Good GPS accuracy
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.isValid).toBe(true);
      expect(result.validationType).toBe('WITHIN_BASE_RADIUS');
      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.requiresException).toBe(false);
      expect(result.distanceMeters).toBeLessThan(1);
      expect(result.message).toContain('Fully compliant');
    });

    it('should validate location within 50m as COMPLIANT', () => {
      // Caregiver 50m away from client address
      const actualLocation: LocationCoordinates = {
        latitude: 30.26765, // ~50m north
        longitude: -97.7431,
        accuracy: 20,
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.isValid).toBe(true);
      expect(result.validationType).toBe('WITHIN_BASE_RADIUS');
      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.distanceMeters).toBeLessThan(100);
      expect(result.distanceMeters).toBeGreaterThan(40);
    });

    it('should validate location exactly at 100m boundary as COMPLIANT', () => {
      // Caregiver exactly 100m away
      const actualLocation: LocationCoordinates = {
        latitude: 30.2681, // ~100m north
        longitude: -97.7431,
        accuracy: 10,
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.isValid).toBe(true);
      expect(result.validationType).toBe('WITHIN_BASE_RADIUS');
      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.distanceMeters).toBeLessThanOrEqual(105);
      expect(result.distanceMeters).toBeGreaterThanOrEqual(95);
    });
  });

  describe('Scenario 2: Geofence Warning (Barely Outside Range)', () => {
    it('should validate location beyond base but within GPS allowance as WARNING', () => {
      // Caregiver 120m away with 30m GPS accuracy
      // Effective radius = 100m + 30m = 130m
      // Distance 120m < 130m = WARNING (acceptable)
      const actualLocation: LocationCoordinates = {
        latitude: 30.2683, // ~120m north
        longitude: -97.7431,
        accuracy: 30, // GPS accuracy provides allowance
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.isValid).toBe(true);
      expect(result.validationType).toBe('WITHIN_ACCURACY_ALLOWANCE');
      expect(result.complianceLevel).toBe('WARNING');
      expect(result.requiresException).toBe(false);
      expect(result.effectiveRadiusMeters).toBe(130); // 100 + 30
      expect(result.distanceMeters).toBeLessThan(130);
      expect(result.distanceMeters).toBeGreaterThan(100);
      expect(result.message).toContain('within GPS accuracy allowance');
      expect(result.suggestedAction).toBeDefined();
    });

    it('should provide helpful warning message for borderline cases', () => {
      const actualLocation: LocationCoordinates = {
        latitude: 30.2684, // ~130m north
        longitude: -97.7431,
        accuracy: 40, // Effective radius = 140m
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.complianceLevel).toBe('WARNING');
      expect(result.message).toContain('beyond base geofence');
      expect(result.message).toContain('Acceptable with warning');
      expect(result.suggestedAction).toContain('Review location accuracy');
    });
  });

  describe('Scenario 3: Geofence Violation (Outside All Allowances)', () => {
    it('should validate location beyond all allowances as VIOLATION', () => {
      // Caregiver 200m away with 20m GPS accuracy
      // Effective radius = 100m + 20m = 120m
      // Distance 200m > 120m = VIOLATION
      const actualLocation: LocationCoordinates = {
        latitude: 30.2690, // ~200m north
        longitude: -97.7431,
        accuracy: 20,
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.isValid).toBe(false);
      expect(result.validationType).toBe('OUTSIDE_GEOFENCE');
      expect(result.complianceLevel).toBe('VIOLATION');
      expect(result.requiresException).toBe(true);
      expect(result.distanceMeters).toBeGreaterThan(170);
      expect(result.message).toContain('beyond geofence limits');
      expect(result.message).toContain('requires exception');
      expect(result.suggestedAction).toContain('VMUR');
    });

    it('should require exception for significant distance violations', () => {
      // Caregiver 500m away (significantly outside)
      const actualLocation: LocationCoordinates = {
        latitude: 30.2717, // ~500m north
        longitude: -97.7431,
        accuracy: 25,
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.isValid).toBe(false);
      expect(result.requiresException).toBe(true);
      expect(result.suggestedAction).toBeDefined();
      expect(result.suggestedAction).toContain('Verify service location');
    });
  });

  describe('GPS Accuracy Exceeded (>100m)', () => {
    it('should reject visits with GPS accuracy > 100m in strict mode', () => {
      const actualLocation: LocationCoordinates = {
        latitude: 30.2672, // Same location as client
        longitude: -97.7431,
        accuracy: 150, // GPS accuracy > 100m limit
      };

      const result = validator.validate(actualLocation, clientAddress);

      expect(result.isValid).toBe(false);
      expect(result.validationType).toBe('GPS_ACCURACY_EXCEEDED');
      expect(result.complianceLevel).toBe('VIOLATION');
      expect(result.requiresException).toBe(true);
      expect(result.message).toContain('GPS accuracy');
      expect(result.message).toContain('exceeds Texas HHSC requirement');
      expect(result.suggestedAction).toContain('VMUR');
    });

    it('should allow GPS accuracy > 100m when strictMode is false', () => {
      const lenientValidator = new TexasGeofenceValidator({ strictMode: false });

      const actualLocation: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 150,
      };

      const result = lenientValidator.validate(actualLocation, clientAddress);

      // Should use effective radius instead of rejecting
      expect(result.validationType).not.toBe('GPS_ACCURACY_EXCEEDED');
      expect(result.effectiveRadiusMeters).toBe(250); // 100 + 150
    });
  });

  describe('Multiple Location Validation', () => {
    it('should validate multiple locations (clock-in, clock-out, mid-visit)', () => {
      const locations: LocationCoordinates[] = [
        // Clock-in: perfect
        { latitude: 30.2672, longitude: -97.7431, accuracy: 15 },
        // Mid-visit: warning
        { latitude: 30.2683, longitude: -97.7431, accuracy: 30 },
        // Clock-out: perfect
        { latitude: 30.2672, longitude: -97.7431, accuracy: 20 },
      ];

      const results = validator.validateMultiple(locations, clientAddress);

      expect(results).toHaveLength(3);
      expect(results[0]!.complianceLevel).toBe('COMPLIANT');
      expect(results[1]!.complianceLevel).toBe('WARNING');
      expect(results[2]!.complianceLevel).toBe('COMPLIANT');
    });

    it('should get overall compliance from multiple validations', () => {
      const compliantResults = [
        { complianceLevel: 'COMPLIANT' as const, requiresException: false } as any,
        { complianceLevel: 'COMPLIANT' as const, requiresException: false } as any,
      ];

      const warningResults = [
        { complianceLevel: 'COMPLIANT' as const, requiresException: false } as any,
        { complianceLevel: 'WARNING' as const, requiresException: false } as any,
      ];

      const violationResults = [
        { complianceLevel: 'COMPLIANT' as const, requiresException: false } as any,
        { complianceLevel: 'VIOLATION' as const, requiresException: true } as any,
      ];

      expect(validator.getOverallCompliance(compliantResults)).toBe('COMPLIANT');
      expect(validator.getOverallCompliance(warningResults)).toBe('WARNING');
      expect(validator.getOverallCompliance(violationResults)).toBe('VIOLATION');
    });

    it('should check if any result requires exception', () => {
      const noExceptionResults = [
        { requiresException: false } as any,
        { requiresException: false } as any,
      ];

      const exceptionResults = [
        { requiresException: false } as any,
        { requiresException: true } as any,
      ];

      expect(validator.requiresException(noExceptionResults)).toBe(false);
      expect(validator.requiresException(exceptionResults)).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid latitude', () => {
      const invalidLocation: LocationCoordinates = {
        latitude: 91, // > 90
        longitude: -97.7431,
      };

      expect(() => validator.validate(invalidLocation, clientAddress)).toThrow(
        'Invalid latitude'
      );
    });

    it('should reject invalid longitude', () => {
      const invalidLocation: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -181, // < -180
      };

      expect(() => validator.validate(invalidLocation, clientAddress)).toThrow(
        'Invalid longitude'
      );
    });

    it('should reject invalid GPS accuracy', () => {
      const invalidLocation: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: -10, // Negative
      };

      expect(() => validator.validate(invalidLocation, clientAddress)).toThrow(
        'Invalid GPS accuracy'
      );
    });

    it('should reject GPS accuracy > 10000m', () => {
      const invalidLocation: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 15000, // Too large
      };

      expect(() => validator.validate(invalidLocation, clientAddress)).toThrow(
        'Invalid GPS accuracy'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle location with no GPS accuracy (default to 0)', () => {
      const locationNoAccuracy: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -97.7431,
        // No accuracy provided
      };

      const result = validator.validate(locationNoAccuracy, clientAddress);

      expect(result.gpsAccuracyMeters).toBe(0);
      expect(result.effectiveRadiusMeters).toBe(100); // Base only
    });

    it('should handle very precise GPS (sub-meter accuracy)', () => {
      const preciseLocation: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 0.5, // Very precise
      };

      const result = validator.validate(preciseLocation, clientAddress);

      expect(result.gpsAccuracyMeters).toBe(0.5);
      expect(result.complianceLevel).toBe('COMPLIANT');
    });

    it('should handle locations at exact boundaries', () => {
      // Test at exactly 100m
      const at100m: LocationCoordinates = {
        latitude: 30.2681,
        longitude: -97.7431,
        accuracy: 0,
      };

      const result100m = validator.validate(at100m, clientAddress);
      expect(result100m.complianceLevel).toBe('COMPLIANT');

      // Test at 101m with 0 accuracy (should be WARNING or VIOLATION)
      const at101m: LocationCoordinates = {
        latitude: 30.26815,
        longitude: -97.7431,
        accuracy: 0,
      };

      const result101m = validator.validate(at101m, clientAddress);
      // With 0 accuracy, effective radius = 100m, so 101m is outside
      expect(result101m.isValid).toBe(false);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical mobile GPS accuracy (10-30m)', () => {
      const typicalMobileGPS: LocationCoordinates = {
        latitude: 30.2680, // ~90m away
        longitude: -97.7431,
        accuracy: 20, // Typical mobile GPS
      };

      const result = validator.validate(typicalMobileGPS, clientAddress);

      // 90m < 100m = within base radius
      expect(result.complianceLevel).toBe('COMPLIANT');
    });

    it('should handle poor GPS in urban canyon (50-80m accuracy)', () => {
      const urbanCanyonGPS: LocationCoordinates = {
        latitude: 30.2683, // ~120m away
        longitude: -97.7431,
        accuracy: 60, // Poor urban GPS
      };

      const result = validator.validate(urbanCanyonGPS, clientAddress);

      // 120m < (100m + 60m) = 160m effective radius
      expect(result.complianceLevel).toBe('WARNING');
      expect(result.message).toContain('GPS accuracy allowance');
    });

    it('should handle rural area with good GPS', () => {
      const ruralGPS: LocationCoordinates = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 5, // Excellent rural GPS
      };

      const result = validator.validate(ruralGPS, clientAddress);

      expect(result.complianceLevel).toBe('COMPLIANT');
      expect(result.gpsAccuracyMeters).toBe(5);
    });
  });
});
