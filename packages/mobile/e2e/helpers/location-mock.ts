/**
 * Location Mocking Helpers for E2E Tests
 * 
 * Provides utilities to simulate GPS location for testing geofence validation
 * and EVV compliance scenarios.
 */

export interface MockLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

/**
 * Mock GPS location for testing
 * 
 * @param location - Location coordinates and optional GPS metadata
 */
export async function mockLocation(location: MockLocation): Promise<void> {
  // Detox's device.setLocation() only takes lat and lon
  await device.setLocation(
    location.latitude,
    location.longitude
  );
}

/**
 * Test locations for different scenarios
 */
export const TEST_LOCATIONS = {
  // Texas - Client location (Austin)
  TEXAS_CLIENT_AT_HOME: {
    latitude: 30.2672,
    longitude: -97.7431,
    accuracy: 10, // High accuracy GPS
  },
  // Texas - Within geofence (90m away, Texas allows 100m + accuracy)
  TEXAS_WITHIN_GEOFENCE: {
    latitude: 30.2680,
    longitude: -97.7431,
    accuracy: 10,
  },
  // Texas - Outside geofence (200m away, exceeds 100m + accuracy)
  TEXAS_OUTSIDE_GEOFENCE: {
    latitude: 30.2700,
    longitude: -97.7431,
    accuracy: 10,
  },
  // Florida - Client location (Miami)
  FLORIDA_CLIENT_AT_HOME: {
    latitude: 25.7617,
    longitude: -80.1918,
    accuracy: 15,
  },
  // Florida - Within geofence (140m away, Florida allows 150m + accuracy)
  FLORIDA_WITHIN_GEOFENCE: {
    latitude: 25.7630,
    longitude: -80.1918,
    accuracy: 15,
  },
  // Florida - Outside geofence (300m away, exceeds 150m + accuracy)
  FLORIDA_OUTSIDE_GEOFENCE: {
    latitude: 25.7650,
    longitude: -80.1918,
    accuracy: 15,
  },
  // Poor GPS accuracy (100m)
  POOR_GPS_ACCURACY: {
    latitude: 30.2672,
    longitude: -97.7431,
    accuracy: 100,
  },
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Used for test assertions
 */
export function calculateDistance(
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
 * Disable location services (simulate GPS off)
 */
export async function disableLocationServices(): Promise<void> {
  // This would require platform-specific commands
  // For iOS: xcrun simctl location <device> clear
  // For Android: adb shell settings put secure location_providers_allowed -gps
  
  // Detox doesn't have direct API for this, so we'd need to use shell commands
  // For MVP, we can skip this or implement platform-specific logic
}

/**
 * Enable location services
 */
export async function enableLocationServices(): Promise<void> {
  // Reverse of disableLocationServices
}
