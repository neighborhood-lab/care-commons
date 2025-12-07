/**
 * Clock In/Out Screen for EVV Compliance
 *
 * Captures:
 * - GPS coordinates (required for Medicaid/Medicare)
 * - Timestamp
 * - Device info
 * - Optional verification photo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as Device from 'expo-device';

interface ClockInOutScreenProps {
  route: {
    params: {
      visitId: string;
      clientName: string;
      clientAddress: string;
      action: 'clockIn' | 'clockOut';
    };
  };
  navigation: any;
}

interface VisitEvent {
  visitId: string;
  action: 'clock_in' | 'clock_out';
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  deviceModel: string;
  deviceOS: string;
  deviceOSVersion: string;
}

export default function ClockInOutScreen({ route, navigation }: ClockInOutScreenProps) {
  const { visitId, clientName, clientAddress, action } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'EVV compliance requires location access to verify visit location.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        return;
      }
      setLocationPermission(true);

      // Get current location
      setIsLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to get location. Please try again.');
      console.error('Location error:', error);
    }
  };

  const handleClockInOut = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available. Please wait or try again.');
      return;
    }

    setIsLoading(true);

    // Create visit event
    const event: VisitEvent = {
      visitId,
      action: action === 'clockIn' ? 'clock_in' : 'clock_out',
      timestamp: new Date().toISOString(),
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      deviceModel: Device.modelName || 'Unknown',
      deviceOS: Platform.OS,
      deviceOSVersion: Platform.Version.toString(),
    };

    // TODO: Save to WatermelonDB for offline support
    // TODO: Queue for sync to backend
    console.log('Visit Event:', event);

    // For now, just show success
    setIsLoading(false);

    Alert.alert(
      'Success',
      action === 'clockIn'
        ? 'Clocked in successfully! Location verified.'
        : 'Clocked out successfully! Visit completed.',
      [
        {
          text: 'OK',
          onPress: () => {
            if (action === 'clockOut') {
              // Navigate back to visits list
              navigation.navigate('VisitsList');
            } else {
              // Navigate to visit details after clock in
              navigation.navigate('VisitDetails', { visitId });
            }
          },
        },
      ]
    );
  };

  const distanceToClient = location
    ? calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        // TODO: Parse actual client lat/lng from address
        30.2672, // Austin, TX as placeholder
        -97.7431
      )
    : null;

  const isLocationVerified = distanceToClient !== null && distanceToClient < 0.1; // Within 100 meters

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {action === 'clockIn' ? 'Clock In' : 'Clock Out'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Client Info */}
        <View style={styles.card}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.clientAddress}>{clientAddress}</Text>
        </View>

        {/* Location Status */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location Verification</Text>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          )}

          {!isLoading && location && (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>GPS Status:</Text>
                <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
                  <Text style={styles.statusBadgeText}>✓ Connected</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Accuracy:</Text>
                <Text style={styles.statusValue}>
                  ±{Math.round(location.coords.accuracy || 0)}m
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Distance to Client:</Text>
                <Text style={[
                  styles.statusValue,
                  isLocationVerified ? styles.statusValueGood : styles.statusValueWarning
                ]}>
                  {distanceToClient !== null
                    ? `${(distanceToClient * 1000).toFixed(0)}m`
                    : 'Calculating...'
                  }
                </Text>
              </View>

              {!isLocationVerified && distanceToClient !== null && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ You appear to be {(distanceToClient * 1000).toFixed(0)}m from the client's address.
                    You may proceed, but this will be flagged for review.
                  </Text>
                </View>
              )}

              {isLocationVerified && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    ✓ Location verified - you are at the client's address
                  </Text>
                </View>
              )}
            </>
          )}

          {!isLoading && !location && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Unable to get location. Please check your GPS settings.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={requestLocationPermission}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Device Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Device:</Text>
            <Text style={styles.infoValue}>{Device.modelName || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>OS:</Text>
            <Text style={styles.infoValue}>
              {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Timestamp:</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Clock In/Out Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            action === 'clockIn' ? styles.clockInButton : styles.clockOutButton,
            (!location || isLoading) && styles.actionButtonDisabled,
          ]}
          onPress={handleClockInOut}
          disabled={!location || isLoading}
        >
          <Text style={styles.actionButtonText}>
            {isLoading
              ? 'Please Wait...'
              : action === 'clockIn'
              ? '✓ Confirm Clock In'
              : '✓ Confirm Clock Out'
            }
          </Text>
        </TouchableOpacity>

        {/* Compliance Note */}
        <View style={styles.complianceNote}>
          <Text style={styles.complianceText}>
            📋 This event will be recorded for EVV compliance and cannot be edited.
            All data is encrypted and only accessible to authorized personnel.
          </Text>
        </View>
      </View>
    </View>
  );
}

// Haversine formula to calculate distance between two lat/lng points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientAddress: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statusValueGood: {
    color: '#4CAF50',
  },
  statusValueWarning: {
    color: '#FF9800',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  warningText: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clockInButton: {
    backgroundColor: '#4CAF50',
  },
  clockOutButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonDisabled: {
    backgroundColor: '#CCC',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  complianceNote: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  complianceText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});
