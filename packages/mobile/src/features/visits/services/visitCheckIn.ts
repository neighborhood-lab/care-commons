/**
 * Visit Check-In/Check-Out Service
 * 
 * Handles EVV (Electronic Visit Verification) compliance:
 * - GPS location capture
 * - Geofence validation
 * - Offline queueing
 * - State-specific requirements (TX, FL, etc.)
 */

import * as Location from 'expo-location';
import { database } from '../../../database/index';
import { getApiClient } from '../../../services/api-client';
import type { Visit } from '../../../database/models/index';

export interface CheckInData {
  visitId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  deviceInfo?: {
    platform: string;
    osVersion: string;
  };
}

export interface CheckInResult {
  success: boolean;
  error?: string;
  queuedForSync?: boolean;
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request location permission:', error);
    return false;
  }
}

/**
 * Get current GPS location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error('Failed to get current location:', error);
    return null;
  }
}

/**
 * Validate if location is within geofence
 */
export function isWithinGeofence(
  visitLat: number,
  visitLng: number,
  currentLat: number,
  currentLng: number,
  geofenceRadius: number,
  gpsAccuracy: number,
): boolean {
  // Calculate distance using Haversine formula
  const R = 6371e3; // Earth radius in meters
  const φ1 = (visitLat * Math.PI) / 180;
  const φ2 = (currentLat * Math.PI) / 180;
  const Δφ = ((currentLat - visitLat) * Math.PI) / 180;
  const Δλ = ((currentLng - visitLng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters

  // Include GPS accuracy in geofence validation
  const effectiveRadius = geofenceRadius + gpsAccuracy;

  return distance <= effectiveRadius;
}

/**
 * Check in to a visit
 */
export async function checkInToVisit(visitId: string): Promise<CheckInResult> {
  try {
    // Get current location
    const location = await getCurrentLocation();
    if (!location) {
      return {
        success: false,
        error: 'Unable to determine your location. Please check location permissions.',
      };
    }

    // Get visit details from database
    const visit = await database.get<Visit>('visits').find(visitId);
    
    // Validate geofence
    const { latitude: visitLat, longitude: visitLng, geofenceRadius } = visit.clientAddress;
    
    if (visitLat && visitLng && geofenceRadius) {
      const withinGeofence = isWithinGeofence(
        visitLat,
        visitLng,
        location.coords.latitude,
        location.coords.longitude,
        geofenceRadius,
        location.coords.accuracy || 0,
      );

      if (!withinGeofence) {
        const distance = calculateDistance(
          visitLat,
          visitLng,
          location.coords.latitude,
          location.coords.longitude,
        );
        return {
          success: false,
          error: `You are ${Math.round(distance)}m away from the client location. Please move closer to check in.`,
        };
      }
    }

    // Create check-in data
    const checkInData: CheckInData = {
      visitId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      timestamp: new Date(),
    };

    // Update visit in local database
    await database.write(async () => {
      await visit.update((v: any) => {
        v.actualStartTime = checkInData.timestamp;
        v.checkInLatitude = checkInData.latitude;
        v.checkInLongitude = checkInData.longitude;
        v.checkInAccuracy = checkInData.accuracy;
        v.status = 'IN_PROGRESS';
        v.syncPending = true;
      });
    });

    // Try to sync to backend
    try {
      const apiClient = getApiClient();
      await apiClient.post(`/api/visits/${visitId}/check-in`, {
        latitude: checkInData.latitude,
        longitude: checkInData.longitude,
        accuracy: checkInData.accuracy,
        timestamp: checkInData.timestamp.toISOString(),
      });

      // Mark as synced
      await database.write(async () => {
        await visit.update((v: any) => {
          v.isSynced = true;
          v.syncPending = false;
        });
      });

      return { success: true };
    } catch (error) {
      // Queue for later sync (already marked syncPending)
      console.warn('Check-in will sync when online:', error);
      return { success: true, queuedForSync: true };
    }
  } catch (error) {
    console.error('Check-in failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Check-in failed',
    };
  }
}

/**
 * Check out from a visit
 */
export async function checkOutFromVisit(visitId: string): Promise<CheckInResult> {
  try {
    // Get current location
    const location = await getCurrentLocation();
    if (!location) {
      return {
        success: false,
        error: 'Unable to determine your location. Please check location permissions.',
      };
    }

    // Get visit from database
    const visit = await database.get<Visit>('visits').find(visitId);

    // Create check-out data
    const checkOutData = {
      visitId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      timestamp: new Date(),
    };

    // Update visit in local database
    await database.write(async () => {
      await visit.update((v: any) => {
        v.actualEndTime = checkOutData.timestamp;
        v.checkOutLatitude = checkOutData.latitude;
        v.checkOutLongitude = checkOutData.longitude;
        v.checkOutAccuracy = checkOutData.accuracy;
        v.status = 'COMPLETED';
        v.syncPending = true;
      });
    });

    // Try to sync to backend
    try {
      const apiClient = getApiClient();
      await apiClient.post(`/api/visits/${visitId}/check-out`, {
        latitude: checkOutData.latitude,
        longitude: checkOutData.longitude,
        accuracy: checkOutData.accuracy,
        timestamp: checkOutData.timestamp.toISOString(),
      });

      // Mark as synced
      await database.write(async () => {
        await visit.update((v: any) => {
          v.isSynced = true;
          v.syncPending = false;
        });
      });

      return { success: true };
    } catch (error) {
      // Queue for later sync
      console.warn('Check-out will sync when online:', error);
      return { success: true, queuedForSync: true };
    }
  } catch (error) {
    console.error('Check-out failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Check-out failed',
    };
  }
}

/**
 * Calculate distance between two coordinates (helper)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
