/**
 * Mileage Tracking Service
 *
 * Tracks distance traveled between client visits for reimbursement.
 * Features:
 * - Automatic trip recording from visit locations
 * - Manual trip entry
 * - Distance calculation using Haversine formula
 * - Trip history and reporting
 * - Export for reimbursement
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const MILEAGE_RECORDS_KEY = '@folkcare_mileage_records';
const CURRENT_TRIP_KEY = '@folkcare_current_trip';

export interface MileageLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

export interface MileageTrip {
  id: string;
  startLocation: MileageLocation;
  endLocation: MileageLocation;
  distanceMiles: number;
  distanceKm: number;
  purpose: 'client_visit' | 'training' | 'office' | 'other';
  visitId?: string;
  clientName?: string;
  notes?: string;
  createdAt: string;
  status: 'completed' | 'pending';
}

export interface MileageSummary {
  totalMiles: number;
  totalKm: number;
  tripCount: number;
  periodStart: string;
  periodEnd: string;
  byPurpose: Record<string, { miles: number; count: number }>;
}

export class MileageService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistanceMeters(
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

    return R * c;
  }

  /**
   * Convert meters to miles
   */
  private metersToMiles(meters: number): number {
    return meters * 0.000621371;
  }

  /**
   * Convert meters to kilometers
   */
  private metersToKm(meters: number): number {
    return meters / 1000;
  }

  /**
   * Get current GPS location
   */
  async getCurrentLocation(): Promise<MileageLocation> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(location.timestamp).toISOString(),
    };
  }

  /**
   * Start a new trip (when leaving for a visit)
   */
  async startTrip(
    purpose: MileageTrip['purpose'] = 'client_visit',
    visitId?: string,
    clientName?: string
  ): Promise<string> {
    const startLocation = await this.getCurrentLocation();
    const tripId = `trip_${Date.now()}`;

    const pendingTrip: Partial<MileageTrip> = {
      id: tripId,
      startLocation,
      purpose,
      visitId,
      clientName,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    await AsyncStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(pendingTrip));
    return tripId;
  }

  /**
   * End the current trip and calculate distance
   */
  async endTrip(notes?: string): Promise<MileageTrip | null> {
    const currentTripStr = await AsyncStorage.getItem(CURRENT_TRIP_KEY);
    if (!currentTripStr) {
      return null;
    }

    const pendingTrip: Partial<MileageTrip> = JSON.parse(currentTripStr);
    const endLocation = await this.getCurrentLocation();

    if (!pendingTrip.startLocation) {
      return null;
    }

    const distanceMeters = this.calculateDistanceMeters(
      pendingTrip.startLocation.latitude,
      pendingTrip.startLocation.longitude,
      endLocation.latitude,
      endLocation.longitude
    );

    const completedTrip: MileageTrip = {
      id: pendingTrip.id || `trip_${Date.now()}`,
      startLocation: pendingTrip.startLocation,
      endLocation,
      distanceMiles: Math.round(this.metersToMiles(distanceMeters) * 100) / 100,
      distanceKm: Math.round(this.metersToKm(distanceMeters) * 100) / 100,
      purpose: pendingTrip.purpose || 'client_visit',
      visitId: pendingTrip.visitId,
      clientName: pendingTrip.clientName,
      notes,
      createdAt: pendingTrip.createdAt || new Date().toISOString(),
      status: 'completed',
    };

    // Save to history
    await this.saveTrip(completedTrip);

    // Clear current trip
    await AsyncStorage.removeItem(CURRENT_TRIP_KEY);

    return completedTrip;
  }

  /**
   * Cancel the current trip without saving
   */
  async cancelTrip(): Promise<void> {
    await AsyncStorage.removeItem(CURRENT_TRIP_KEY);
  }

  /**
   * Check if there's a trip in progress
   */
  async getCurrentTrip(): Promise<Partial<MileageTrip> | null> {
    const currentTripStr = await AsyncStorage.getItem(CURRENT_TRIP_KEY);
    if (!currentTripStr) {
      return null;
    }
    return JSON.parse(currentTripStr);
  }

  /**
   * Manually add a trip (for entering historical mileage)
   */
  async addManualTrip(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    purpose: MileageTrip['purpose'],
    date: Date,
    notes?: string,
    clientName?: string
  ): Promise<MileageTrip> {
    const distanceMeters = this.calculateDistanceMeters(startLat, startLon, endLat, endLon);

    const trip: MileageTrip = {
      id: `trip_${Date.now()}`,
      startLocation: {
        latitude: startLat,
        longitude: startLon,
        timestamp: date.toISOString(),
      },
      endLocation: {
        latitude: endLat,
        longitude: endLon,
        timestamp: date.toISOString(),
      },
      distanceMiles: Math.round(this.metersToMiles(distanceMeters) * 100) / 100,
      distanceKm: Math.round(this.metersToKm(distanceMeters) * 100) / 100,
      purpose,
      clientName,
      notes,
      createdAt: date.toISOString(),
      status: 'completed',
    };

    await this.saveTrip(trip);
    return trip;
  }

  /**
   * Save a trip to storage
   */
  private async saveTrip(trip: MileageTrip): Promise<void> {
    const records = await this.getAllTrips();
    records.unshift(trip); // Add to beginning (most recent first)
    await AsyncStorage.setItem(MILEAGE_RECORDS_KEY, JSON.stringify(records));
  }

  /**
   * Get all trips
   */
  async getAllTrips(): Promise<MileageTrip[]> {
    const recordsStr = await AsyncStorage.getItem(MILEAGE_RECORDS_KEY);
    if (!recordsStr) {
      return [];
    }
    return JSON.parse(recordsStr);
  }

  /**
   * Get trips for a specific date range
   */
  async getTripsInRange(startDate: Date, endDate: Date): Promise<MileageTrip[]> {
    const allTrips = await this.getAllTrips();
    return allTrips.filter((trip) => {
      const tripDate = new Date(trip.createdAt);
      return tripDate >= startDate && tripDate <= endDate;
    });
  }

  /**
   * Get trips for current week
   */
  async getTripsThisWeek(): Promise<MileageTrip[]> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.getTripsInRange(startOfWeek, endOfWeek);
  }

  /**
   * Get trips for current month
   */
  async getTripsThisMonth(): Promise<MileageTrip[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return this.getTripsInRange(startOfMonth, endOfMonth);
  }

  /**
   * Get mileage summary for a period
   */
  async getSummary(startDate: Date, endDate: Date): Promise<MileageSummary> {
    const trips = await this.getTripsInRange(startDate, endDate);

    const byPurpose: Record<string, { miles: number; count: number }> = {};
    let totalMiles = 0;
    let totalKm = 0;

    for (const trip of trips) {
      totalMiles += trip.distanceMiles;
      totalKm += trip.distanceKm;

      if (!byPurpose[trip.purpose]) {
        byPurpose[trip.purpose] = { miles: 0, count: 0 };
      }
      byPurpose[trip.purpose].miles += trip.distanceMiles;
      byPurpose[trip.purpose].count += 1;
    }

    return {
      totalMiles: Math.round(totalMiles * 100) / 100,
      totalKm: Math.round(totalKm * 100) / 100,
      tripCount: trips.length,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      byPurpose,
    };
  }

  /**
   * Delete a trip
   */
  async deleteTrip(tripId: string): Promise<void> {
    const records = await this.getAllTrips();
    const filtered = records.filter((trip) => trip.id !== tripId);
    await AsyncStorage.setItem(MILEAGE_RECORDS_KEY, JSON.stringify(filtered));
  }

  /**
   * Clear all mileage data (for testing or reset)
   */
  async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(MILEAGE_RECORDS_KEY);
    await AsyncStorage.removeItem(CURRENT_TRIP_KEY);
  }

  /**
   * Export trips as CSV for reimbursement
   */
  async exportTripsAsCSV(startDate: Date, endDate: Date): Promise<string> {
    const trips = await this.getTripsInRange(startDate, endDate);

    const headers = ['Date', 'Purpose', 'Client', 'Miles', 'Notes'];
    const rows = trips.map((trip) => [
      new Date(trip.createdAt).toLocaleDateString(),
      trip.purpose.replace('_', ' '),
      trip.clientName || '',
      trip.distanceMiles.toString(),
      trip.notes || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    return csvContent;
  }
}

export const mileageService = new MileageService();
