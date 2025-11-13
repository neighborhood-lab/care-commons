/**
 * Custom Assertions for E2E Tests
 * 
 * Provides domain-specific assertions for EVV compliance, 
 * geofence validation, and other care-related scenarios.
 */

/**
 * Assert EVV record contains all six required elements
 * Per 21st Century Cures Act Section 12006
 */
export async function assertEVVCompliance(evvRecord: any): Promise<void> {
  const requiredFields = [
    'service_type',
    'individual_receiving',
    'individual_providing',
    'date',
    'location',
    'time_in',
  ];

  for (const field of requiredFields) {
    if (!(field in evvRecord)) {
      throw new Error(`EVV record missing required field: ${field}`);
    }
  }

  // Validate location has latitude and longitude
  if (!evvRecord.location?.latitude || !evvRecord.location?.longitude) {
    throw new Error('EVV location must include latitude and longitude');
  }

  // Validate timestamps
  if (!evvRecord.time_in) {
    throw new Error('EVV record must include check-in time');
  }
}

/**
 * Assert visit is within geofence for a given state
 * 
 * @param visitLocation - Actual GPS location
 * @param clientLocation - Expected client address location
 * @param state - State code (TX, FL, etc.)
 * @param gpsAccuracy - GPS accuracy in meters
 */
export async function assertWithinGeofence(
  visitLocation: { latitude: number; longitude: number },
  clientLocation: { latitude: number; longitude: number },
  state: string,
  gpsAccuracy: number
): Promise<void> {
  const distance = calculateDistance(
    visitLocation.latitude,
    visitLocation.longitude,
    clientLocation.latitude,
    clientLocation.longitude
  );

  const geofenceRadius = getGeofenceRadius(state);
  const allowedDistance = geofenceRadius + gpsAccuracy;

  if (distance > allowedDistance) {
    throw new Error(
      `Visit location outside geofence: ${distance.toFixed(2)}m (allowed: ${allowedDistance.toFixed(2)}m for ${state})`
    );
  }
}

/**
 * Assert visit is OUTSIDE geofence (for negative tests)
 */
export async function assertOutsideGeofence(
  visitLocation: { latitude: number; longitude: number },
  clientLocation: { latitude: number; longitude: number },
  state: string,
  gpsAccuracy: number
): Promise<void> {
  const distance = calculateDistance(
    visitLocation.latitude,
    visitLocation.longitude,
    clientLocation.latitude,
    clientLocation.longitude
  );

  const geofenceRadius = getGeofenceRadius(state);
  const allowedDistance = geofenceRadius + gpsAccuracy;

  if (distance <= allowedDistance) {
    throw new Error(
      `Expected visit location to be outside geofence, but it was within: ${distance.toFixed(2)}m (threshold: ${allowedDistance.toFixed(2)}m)`
    );
  }
}

/**
 * Get state-specific geofence radius in meters
 */
function getGeofenceRadius(state: string): number {
  const radiusMap: Record<string, number> = {
    TX: 100, // Texas: 100m + GPS accuracy
    FL: 150, // Florida: 150m + GPS accuracy
    CA: 100, // California: 100m (default)
    NY: 100, // New York: 100m (default)
  };

  return radiusMap[state] || 100; // Default to 100m
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
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
 * Assert sync queue contains expected operation
 */
export async function assertSyncQueueContains(
  operationType: string
): Promise<void> {
  // This would need to inspect the app's WatermelonDB sync queue
  // For now, this is a placeholder
  // In real implementation, we'd expose a test-only API to query the queue
  console.log(`TODO: Verify sync queue contains operation: ${operationType}`);
}

/**
 * Assert offline data was persisted to local database
 */
export async function assertOfflineDataPersisted(
  dataType: string,
  recordId: string
): Promise<void> {
  // This would need to query WatermelonDB directly
  // For now, this is a placeholder
  console.log(`TODO: Verify ${dataType} record ${recordId} persisted locally`);
}

/**
 * Wait for element with retry logic
 */
export async function waitForElement(
  elementId: string,
  timeout = 10000
): Promise<void> {
  const matcher = by.id(elementId);
  const elem = element(matcher);
  await waitFor(elem)
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Wait for text to appear
 */
export async function waitForText(
  text: string,
  timeout = 10000
): Promise<void> {
  const matcher = by.text(text);
  const elem = element(matcher);
  await waitFor(elem)
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Scroll to element if not visible
 */
export async function scrollToElement(
  elementId: string,
  scrollViewId: string,
  direction: 'up' | 'down' = 'down'
): Promise<void> {
  const matcher = by.id(elementId);
  const elem = element(matcher);
  const scrollMatcher = by.id(scrollViewId);
  await waitFor(elem)
    .toBeVisible()
    .whileElement(scrollMatcher)
    .scroll(100, direction);
}
