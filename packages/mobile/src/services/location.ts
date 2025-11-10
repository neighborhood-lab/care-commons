/**
 * Location Service
 * 
 * Handles GPS location capture for EVV compliance with geofence verification.
 * Implements state-specific requirements for Texas and Florida.
 * 
 * Key features:
 * - High-accuracy GPS for clock-in/out
 * - Mock location detection (GPS spoofing)
 * - Geofence verification
 * - Background location tracking during visits
 * - Offline location caching
 */

import * as Location from 'expo-location';
import type {
  LocationVerificationInput,
  VerificationMethod,
  Geofence,
  GeofenceCheckResult,
  StateCode,
} from '../shared/index';
import { getStateEVVRules } from '../shared/index';

export class LocationService {
  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = 
      await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      return false;
    }

    // Request background location for visit tracking
    const { status: backgroundStatus } = 
      await Location.requestBackgroundPermissionsAsync();
    
    return backgroundStatus === 'granted';
  }

  /**
   * Check if location permissions are granted
   */
  async hasPermissions(): Promise<{ foreground: boolean; background: boolean }> {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    
    return {
      foreground: foreground.status === 'granted',
      background: background.status === 'granted',
    };
  }

  /**
   * Get current location for EVV clock-in/out
   * 
   * Uses high-accuracy GPS with timeout for compliance requirements.
   */
  async getCurrentLocation(): Promise<LocationVerificationInput> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000, // Max 5 seconds
      distanceInterval: 0,
    });

    const mockDetected = await this.detectMockLocation(location);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? 0,
      altitude: location.coords.altitude ?? undefined,
      heading: location.coords.heading ?? undefined,
      speed: location.coords.speed ?? undefined,
      timestamp: new Date(location.timestamp),
      method: 'GPS' as VerificationMethod,
      mockLocationDetected: mockDetected,
    };
  }

  /**
   * Detect GPS spoofing / mock locations
   * 
   * Mock location detection is critical for preventing fraud.
   * Some devices allow users to fake their GPS location.
   */
  private async detectMockLocation(
    location: Location.LocationObject
  ): Promise<boolean> {
    // On Android, check if location is from mock provider
    if (location.mocked) {
      return true;
    }

    // Additional checks:
    // - Speed inconsistencies (impossible travel distance)
    // - Accuracy too perfect (GPS rarely has 0m accuracy)
    // - Location jumps (teleportation detection)
    // - Altitude anomalies
    // - Developer options enabled (Android)

    const accuracy = location.coords.accuracy || 0;
    if (accuracy === 0 || accuracy < 3) {
      // GPS accuracy of 0m or <3m is suspicious
      return true;
    }

    return false;
  }

  /**
   * Verify location is within geofence
   * 
   * Implements state-specific geofence rules for Texas and Florida.
   */
  verifyGeofence(
    location: LocationVerificationInput,
    geofence: Geofence,
    stateCode: StateCode
  ): GeofenceCheckResult {
    const stateRules = getStateEVVRules(stateCode);
    
    // Calculate distance from geofence center
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.centerLatitude,
      geofence.centerLongitude
    );

    // Apply state-specific tolerance
    const effectiveRadius = 
      geofence.radiusMeters + 
      stateRules.geoFenceTolerance + 
      location.accuracy; // Add GPS accuracy margin

    const isWithinGeofence = distance <= effectiveRadius;
    const requiresManualReview = 
      distance > geofence.radiusMeters && 
      distance <= effectiveRadius;

    return {
      isWithinGeofence,
      distanceFromCenter: distance,
      distanceFromAddress: distance, // Same as center for circular geofence
      accuracy: location.accuracy,
      requiresManualReview,
      reason: requiresManualReview
        ? `Within tolerance range (${distance.toFixed(0)}m from center, tolerance: ${stateRules.geoFenceTolerance}m)`
        : undefined,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * 
   * Returns distance in meters.
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
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
   * Start background location tracking
   * 
   * Used during active visits to track caregiver location.
   * Required for mid-visit compliance checks in some states.
   */
  async startBackgroundTracking(visitId: string): Promise<void> {
    await Location.startLocationUpdatesAsync(`visit-tracking-${visitId}`, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5 * 60 * 1000, // Every 5 minutes
      distanceInterval: 100, // Or every 100 meters
      foregroundService: {
        notificationTitle: 'Visit in progress',
        notificationBody: 'Care Commons is tracking your visit location',
        notificationColor: '#007AFF',
      },
      pausesUpdatesAutomatically: false,
    });
  }

  /**
   * Stop background location tracking
   */
  async stopBackgroundTracking(visitId: string): Promise<void> {
    await Location.stopLocationUpdatesAsync(`visit-tracking-${visitId}`);
  }

  /**
   * Check if GPS is available and enabled
   */
  async isGPSEnabled(): Promise<boolean> {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  }

  /**
   * Get location accuracy assessment
   * 
   * Helps determine if location quality is sufficient for EVV compliance.
   */
  assessLocationAccuracy(
    location: LocationVerificationInput,
    stateCode: StateCode
  ): {
    isSufficient: boolean;
    reason?: string;
  } {
    const stateRules = getStateEVVRules(stateCode);
    
    if (location.accuracy > stateRules.minimumGPSAccuracy) {
      return {
        isSufficient: false,
        reason: `GPS accuracy (${location.accuracy.toFixed(0)}m) exceeds maximum allowed (${stateRules.minimumGPSAccuracy}m) for ${stateCode}`,
      };
    }

    if (location.mockLocationDetected) {
      return {
        isSufficient: false,
        reason: 'Mock location detected - GPS spoofing suspected',
      };
    }

    return { isSufficient: true };
  }
}

export const locationService = new LocationService();
