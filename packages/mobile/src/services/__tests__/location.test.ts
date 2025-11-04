/**
 * Location Service Tests
 * 
 * Tests GPS capture, geofence verification, mock location detection,
 * and state-specific compliance rules.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocationService } from '../location.js';
import type { Geofence } from '../../shared/index.js';

// Mock expo-location
vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  requestBackgroundPermissionsAsync: vi.fn(),
  getForegroundPermissionsAsync: vi.fn(),
  getBackgroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  startLocationUpdatesAsync: vi.fn(),
  stopLocationUpdatesAsync: vi.fn(),
  hasServicesEnabledAsync: vi.fn(),
  Accuracy: {
    BestForNavigation: 6,
    Balanced: 5,
  },
}));

describe('LocationService', () => {
  let service: LocationService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    service = new LocationService();
  });

  describe('calculateDistance (Haversine)', () => {
    it('should calculate distance between two points accurately', () => {
      // Austin, TX State Capitol to Houston, TX City Hall (approx 234 km)
      const distance = (service as any).calculateDistance(
        30.2747, -97.7404,  // Austin
        29.7604, -95.3698   // Houston
      );

      // Allow 1% margin of error
      expect(distance).toBeGreaterThan(230000); // 230 km
      expect(distance).toBeLessThan(240000);    // 240 km
    });

    it('should return 0 for same coordinates', () => {
      const distance = (service as any).calculateDistance(
        30.2672, -97.7431,
        30.2672, -97.7431
      );

      expect(distance).toBe(0);
    });

    it('should calculate small distances accurately', () => {
      // ~100 meters apart
      const distance = (service as any).calculateDistance(
        30.2672, -97.7431,
        30.2681, -97.7431
      );

      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });
  });

  describe('verifyGeofence', () => {
    const mockGeofence: Geofence = {
      id: 'geofence-123',
      organizationId: 'org-456',
      clientId: 'client-789',
      addressId: 'address-012',
      centerLatitude: 30.2672,
      centerLongitude: -97.7431,
      radiusMeters: 100,
      radiusType: 'STANDARD',
      shape: 'CIRCLE',
      isActive: true,
      status: 'ACTIVE',
      verificationCount: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      createdAt: new Date(),
      createdBy: 'user-123',
      updatedAt: new Date(),
      updatedBy: 'user-123',
      version: 1,
    };

    it('should verify location within geofence (Texas)', () => {
      const location = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const result = service.verifyGeofence(location, mockGeofence, 'TX');

      expect(result.isWithinGeofence).toBe(true);
      expect(result.distanceFromCenter).toBeLessThan(50);
      expect(result.requiresManualReview).toBe(false);
    });

    it('should flag location outside geofence', () => {
      // 200 meters away
      const location = {
        latitude: 30.2690,
        longitude: -97.7431,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const result = service.verifyGeofence(location, mockGeofence, 'TX');

      expect(result.isWithinGeofence).toBe(false);
      expect(result.distanceFromCenter).toBeGreaterThan(150);
      expect(result.requiresManualReview).toBe(false);
    });

    it('should apply Texas state-specific tolerance (100m + 50m + accuracy)', () => {
      // 140 meters away, within tolerance
      const location = {
        latitude: 30.2685,
        longitude: -97.7431,
        accuracy: 20,
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const result = service.verifyGeofence(location, mockGeofence, 'TX');

      // Base 100m + TX tolerance 50m + accuracy 20m = 170m effective radius
      expect(result.isWithinGeofence).toBe(true);
      expect(result.requiresManualReview).toBe(true); // Outside base radius but within tolerance
    });

    it('should apply Florida state-specific tolerance (150m + 100m + accuracy)', () => {
      // 220 meters away, within Florida tolerance
      const location = {
        latitude: 30.2692,
        longitude: -97.7431,
        accuracy: 30,
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const result = service.verifyGeofence(location, mockGeofence, 'FL');

      // Base 100m + FL tolerance 100m + accuracy 30m = 230m effective radius
      expect(result.isWithinGeofence).toBe(true);
      expect(result.requiresManualReview).toBe(true);
    });

    it('should include accuracy in effective radius', () => {
      // 130 meters away with high accuracy (50m)
      const location = {
        latitude: 30.2684,
        longitude: -97.7431,
        accuracy: 50, // Poor GPS accuracy
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const result = service.verifyGeofence(location, mockGeofence, 'TX');

      // Base 100m + TX tolerance 50m + accuracy 50m = 200m effective radius
      expect(result.isWithinGeofence).toBe(true);
    });
  });

  describe('assessLocationAccuracy', () => {
    it('should pass location with good accuracy (Texas)', () => {
      const location = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 50, // Within TX limit of 100m
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const result = service.assessLocationAccuracy(location, 'TX');

      expect(result.isSufficient).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should fail location with poor accuracy (Texas)', () => {
      const location = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 150, // Exceeds TX limit of 100m
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const result = service.assessLocationAccuracy(location, 'TX');

      expect(result.isSufficient).toBe(false);
      expect(result.reason).toContain('GPS accuracy');
      expect(result.reason).toContain('150m');
      expect(result.reason).toContain('100m');
    });

    it('should fail location with mock detection', () => {
      const location = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: true, // GPS spoofing
      };

      const result = service.assessLocationAccuracy(location, 'TX');

      expect(result.isSufficient).toBe(false);
      expect(result.reason).toContain('Mock location detected');
      expect(result.reason).toContain('spoofing');
    });

    it('should use Florida-specific accuracy limits', () => {
      const location = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 120, // Within FL limit of 150m, but exceeds TX limit
        timestamp: new Date(),
        method: 'GPS' as const,
        mockLocationDetected: false,
      };

      const resultTX = service.assessLocationAccuracy(location, 'TX');
      const resultFL = service.assessLocationAccuracy(location, 'FL');

      expect(resultTX.isSufficient).toBe(false);
      expect(resultFL.isSufficient).toBe(true);
    });
  });

  describe('requestPermissions', () => {
    it('should request foreground and background permissions', async () => {
      const Location = await import('expo-location');
      (Location.requestForegroundPermissionsAsync as any).mockResolvedValue({
        status: 'granted',
      });
      (Location.requestBackgroundPermissionsAsync as any).mockResolvedValue({
        status: 'granted',
      });

      const result = await service.requestPermissions();

      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false if foreground permission denied', async () => {
      const Location = await import('expo-location');
      (Location.requestForegroundPermissionsAsync as any).mockResolvedValue({
        status: 'denied',
      });

      const result = await service.requestPermissions();

      expect(result).toBe(false);
      expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should return false if background permission denied', async () => {
      const Location = await import('expo-location');
      (Location.requestForegroundPermissionsAsync as any).mockResolvedValue({
        status: 'granted',
      });
      (Location.requestBackgroundPermissionsAsync as any).mockResolvedValue({
        status: 'denied',
      });

      const result = await service.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe('hasPermissions', () => {
    it('should check both foreground and background permissions', async () => {
      const Location = await import('expo-location');
      (Location.getForegroundPermissionsAsync as any).mockResolvedValue({
        status: 'granted',
      });
      (Location.getBackgroundPermissionsAsync as any).mockResolvedValue({
        status: 'granted',
      });

      const result = await service.hasPermissions();

      expect(result).toEqual({
        foreground: true,
        background: true,
      });
    });

    it('should return false for denied permissions', async () => {
      const Location = await import('expo-location');
      (Location.getForegroundPermissionsAsync as any).mockResolvedValue({
        status: 'denied',
      });
      (Location.getBackgroundPermissionsAsync as any).mockResolvedValue({
        status: 'denied',
      });

      const result = await service.hasPermissions();

      expect(result).toEqual({
        foreground: false,
        background: false,
      });
    });
  });

  describe('getCurrentLocation', () => {
    it('should return location with proper format', async () => {
      const Location = await import('expo-location');
      (Location.getCurrentPositionAsync as any).mockResolvedValue({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
          altitude: 150,
          heading: 90,
          speed: 0,
        },
        timestamp: 1704110400000, // 2024-01-01 10:00:00 UTC
        mocked: false,
      });

      const result = await service.getCurrentLocation();

      expect(result).toMatchObject({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
        altitude: 150,
        heading: 90,
        speed: 0,
        method: 'GPS',
        mockLocationDetected: false,
      });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should detect mocked locations', async () => {
      const Location = await import('expo-location');
      (Location.getCurrentPositionAsync as any).mockResolvedValue({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
        },
        timestamp: Date.now(),
        mocked: true, // GPS spoofing detected
      });

      const result = await service.getCurrentLocation();

      expect(result.mockLocationDetected).toBe(true);
    });

    it('should flag suspiciously perfect accuracy', async () => {
      const Location = await import('expo-location');
      (Location.getCurrentPositionAsync as any).mockResolvedValue({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 0, // Perfect accuracy is suspicious
        },
        timestamp: Date.now(),
        mocked: false,
      });

      const result = await service.getCurrentLocation();

      expect(result.mockLocationDetected).toBe(true);
    });

    it('should flag unrealistically high accuracy', async () => {
      const Location = await import('expo-location');
      (Location.getCurrentPositionAsync as any).mockResolvedValue({
        coords: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 1, // <3m is suspicious
        },
        timestamp: Date.now(),
        mocked: false,
      });

      const result = await service.getCurrentLocation();

      expect(result.mockLocationDetected).toBe(true);
    });
  });

  describe('isGPSEnabled', () => {
    it('should check if location services are enabled', async () => {
      const Location = await import('expo-location');
      (Location.hasServicesEnabledAsync as any).mockResolvedValue(true);

      const result = await service.isGPSEnabled();

      expect(result).toBe(true);
    });

    it('should return false if location services disabled', async () => {
      const Location = await import('expo-location');
      (Location.hasServicesEnabledAsync as any).mockResolvedValue(false);

      const result = await service.isGPSEnabled();

      expect(result).toBe(false);
    });
  });

  describe('background location tracking', () => {
    it('should start background tracking with proper configuration', async () => {
      const Location = await import('expo-location');
      (Location.startLocationUpdatesAsync as any).mockResolvedValue(undefined);

      await service.startBackgroundTracking('visit-123');

      expect(Location.startLocationUpdatesAsync).toHaveBeenCalledWith(
        'visit-tracking-visit-123',
        expect.objectContaining({
          accuracy: expect.any(Number),
          timeInterval: 5 * 60 * 1000, // 5 minutes
          distanceInterval: 100,
          foregroundService: expect.objectContaining({
            notificationTitle: 'Visit in progress',
          }),
        })
      );
    });

    it('should stop background tracking', async () => {
      const Location = await import('expo-location');
      (Location.stopLocationUpdatesAsync as any).mockResolvedValue(undefined);

      await service.stopBackgroundTracking('visit-123');

      expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledWith(
        'visit-tracking-visit-123'
      );
    });
  });
});
