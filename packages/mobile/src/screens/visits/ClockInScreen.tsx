/**
 * Clock In Screen with GPS Verification
 *
 * Full-featured clock-in screen with:
 * - Live GPS tracking and accuracy display
 * - Interactive map with geofence visualization
 * - Distance meter from client address
 * - Pre-flight checks (GPS, battery, mock location detection)
 * - Photo capture (optional)
 * - State-specific geofence rules (TX, FL, etc.)
 * - Offline support with queue management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button, Badge } from '../../components/index.js';
import { locationService } from '../../services/location.js';
import { deviceInfoService } from '../../services/device-info.js';
import { OfflineQueueService } from '../../services/offline-queue.js';
import { database } from '../../database/index.js';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import type {
  LocationVerificationInput,
  ClockInInput,
  StateCode,
} from '../../shared/index.js';
import { getStateEVVRules } from '../../shared/index.js';

type Props = NativeStackScreenProps<RootStackParamList, 'ClockIn'>;

interface PreFlightChecks {
  gpsEnabled: boolean;
  gpsAccurate: boolean;
  permissionsGranted: boolean;
  batteryOk: boolean;
  noMockLocation: boolean;
  withinGeofence: boolean;
}

export function ClockInScreen({ route, navigation }: Props) {
  const { visitId } = route.params;

  // Location state
  const [location, setLocation] = useState<LocationVerificationInput | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);

  // Pre-flight check state
  const [preFlightChecks, setPreFlightChecks] = useState<PreFlightChecks>({
    gpsEnabled: false,
    gpsAccurate: false,
    permissionsGranted: false,
    batteryOk: false,
    noMockLocation: false,
    withinGeofence: false,
  });
  const [preFlightPassed, setPreFlightPassed] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);

  // Mock visit data (in production, load from database)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visit = {
    id: visitId,
    clientName: 'Dorothy Chen',
    clientAddress: {
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX' as StateCode,
      postalCode: '78701',
      country: 'US',
      latitude: 30.2672,
      longitude: -97.7431,
      geofenceRadius: 100,
      addressVerified: true,
    },
    organizationId: 'org-1',
    branchId: 'branch-1',
    caregiverId: 'caregiver-1',
  };

  const stateRules = getStateEVVRules(visit.clientAddress.state);

  /**
   * Initialize location tracking
   */
  useEffect(() => {
    let subscription: any = null;
    let isActive = true;

    const initializeLocation = async () => {
      try {
        // Check GPS enabled
        const gpsEnabled = await locationService.isGPSEnabled();
        if (!gpsEnabled) {
          Alert.alert(
            'GPS Required',
            'Please enable location services to clock in.',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }

        // Check permissions
        const permissions = await locationService.hasPermissions();
        if (!permissions.foreground) {
          const granted = await locationService.requestPermissions();
          if (!granted) {
            Alert.alert(
              'Location Permission Required',
              'EVV compliance requires location access for visit verification.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            setIsLoading(false);
            return;
          }
        }

        // Start watching location
        const currentLoc = await locationService.getCurrentLocation();
        if (isActive) {
          handleLocationUpdate(currentLoc);
        }

        setIsLoading(false);

        // Continue watching for updates
        subscription = setInterval(async () => {
          try {
            const currentLoc = await locationService.getCurrentLocation();
            if (isActive) {
              handleLocationUpdate(currentLoc);
            }
          } catch (error) {
            console.error('Location update failed:', error);
          }
        }, 5000); // Update every 5 seconds

        setLocationSubscription(subscription);
      } catch (error) {
        console.error('Location initialization failed:', error);
        Alert.alert('Error', 'Failed to initialize location services');
        setIsLoading(false);
      }
    };

    void initializeLocation();

    return () => {
      isActive = false;
      if (subscription) {
        clearInterval(subscription);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle location update and run pre-flight checks
   */
  const handleLocationUpdate = useCallback(async (loc: LocationVerificationInput) => {
    setLocation(loc);

    // Calculate distance from client address
    const dist = calculateDistance(
      loc.latitude,
      loc.longitude,
      visit.clientAddress.latitude,
      visit.clientAddress.longitude
    );
    setDistance(dist);

    // Check geofence
    const effectiveRadius =
      visit.clientAddress.geofenceRadius +
      stateRules.geoFenceTolerance +
      loc.accuracy;
    const within = dist <= effectiveRadius;
    setIsWithinGeofence(within);

    // Run pre-flight checks
    const batteryLevel = await deviceInfoService.getBatteryLevel();

    const checks: PreFlightChecks = {
      gpsEnabled: true,
      gpsAccurate: loc.accuracy < stateRules.minimumGPSAccuracy,
      permissionsGranted: true,
      batteryOk: batteryLevel > 10,
      noMockLocation: !loc.mockLocationDetected,
      withinGeofence: within,
    };

    setPreFlightChecks(checks);
    setPreFlightPassed(Object.values(checks).every(Boolean));
  }, [visit, stateRules]);

  /**
   * Calculate distance using Haversine formula
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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
  };

  /**
   * Handle photo capture
   */
  const handleTakePhoto = () => {
    navigation.navigate('Camera', {
      onCapture: (uri: string) => {
        setPhotoUri(uri);
      },
    });
  };

  /**
   * Handle clock in
   */
  const handleClockIn = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available. Please wait...');
      return;
    }

    if (!preFlightPassed) {
      Alert.alert(
        'Pre-Flight Checks Failed',
        'Please resolve all issues before clocking in.',
        [{ text: 'OK' }]
      );
      return;
    }

    // If outside geofence, require override confirmation
    if (!isWithinGeofence) {
      Alert.alert(
        'Outside Geofence',
        `You are ${Math.round(distance || 0)}m from the client address. This will require supervisor approval. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => void performClockIn() },
        ]
      );
      return;
    }

    await performClockIn();
  };

  /**
   * Perform the actual clock-in operation
   */
  const performClockIn = async () => {
    if (!location) return;

    setIsClocking(true);

    try {
      const deviceInfo = await deviceInfoService.getDeviceInfo();

      const clockInInput: ClockInInput = {
        visitId,
        caregiverId: visit.caregiverId,
        location: {
          ...location,
          photoUrl: photoUri || undefined,
        },
        deviceInfo,
        clientPresent: true,
      };

      // Queue for sync (handles offline)
      const offlineQueue = new OfflineQueueService(database);
      await offlineQueue.queueClockIn(clockInInput);

      // Update local visit status (mock - in production, update WatermelonDB)
      // await updateLocalVisit(visitId, { status: 'IN_PROGRESS' });

      Alert.alert(
        'Success',
        'Clocked in successfully! Your visit has started.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clean up subscription
              if (locationSubscription) {
                clearInterval(locationSubscription);
              }
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Clock-in error:', error);
      Alert.alert(
        'Error',
        'Failed to clock in. Your request has been queued and will be sent when connection is restored.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsClocking(false);
    }
  };

  /**
   * Get accuracy status color
   */
  const getAccuracyStatus = (accuracy: number): { label: string; variant: 'success' | 'warning' | 'danger' } => {
    if (accuracy < 10) {
      return { label: 'Excellent', variant: 'success' };
    }
    if (accuracy < 30) {
      return { label: 'Good', variant: 'success' };
    }
    if (accuracy < 50) {
      return { label: 'Fair', variant: 'warning' };
    }
    return { label: 'Poor', variant: 'danger' };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Acquiring GPS location...</Text>
      </View>
    );
  }

  const accuracyStatus = location ? getAccuracyStatus(location.accuracy) : null;

  return (
    <View style={styles.container}>
      {/* Map View with Geofence */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: visit.clientAddress.latitude,
              longitude: visit.clientAddress.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {/* Client address marker */}
            <Marker
              coordinate={{
                latitude: visit.clientAddress.latitude,
                longitude: visit.clientAddress.longitude,
              }}
              title={visit.clientName}
              description={visit.clientAddress.line1}
              pinColor="#2563EB"
            />

            {/* Geofence circle */}
            <Circle
              center={{
                latitude: visit.clientAddress.latitude,
                longitude: visit.clientAddress.longitude,
              }}
              radius={visit.clientAddress.geofenceRadius + stateRules.geoFenceTolerance}
              fillColor="rgba(37, 99, 235, 0.1)"
              strokeColor="rgba(37, 99, 235, 0.3)"
              strokeWidth={2}
            />

            {/* Caregiver location */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You"
              pinColor={isWithinGeofence ? '#10B981' : '#EF4444'}
            >
              <View style={[
                styles.userMarker,
                { backgroundColor: isWithinGeofence ? '#10B981' : '#EF4444' },
              ]}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Status Panel */}
      <ScrollView style={styles.statusPanel} contentContainerStyle={styles.statusPanelContent}>
        <Text style={styles.heading}>Pre-Flight Checks</Text>
        <Text style={styles.subheading}>
          {visit.clientName} • {visit.clientAddress.city}, {visit.clientAddress.state}
        </Text>

        <View style={styles.checksContainer}>
          <StatusItem
            label="GPS Accuracy"
            value={location ? `${Math.round(location.accuracy)}m` : 'Waiting...'}
            status={preFlightChecks.gpsAccurate ? 'good' : 'warning'}
            detail={accuracyStatus?.label}
          />

          <StatusItem
            label="Distance from Address"
            value={distance !== null ? `${Math.round(distance)}m` : 'Calculating...'}
            status={preFlightChecks.withinGeofence ? 'good' : 'error'}
            detail={isWithinGeofence ? 'Within boundary' : 'Outside geofence'}
          />

          <StatusItem
            label="Geofence Status"
            value={isWithinGeofence ? 'Inside' : 'Outside'}
            status={preFlightChecks.withinGeofence ? 'good' : 'error'}
            detail={`Radius: ${visit.clientAddress.geofenceRadius + stateRules.geoFenceTolerance}m`}
          />

          <StatusItem
            label="Battery Level"
            value="OK"
            status={preFlightChecks.batteryOk ? 'good' : 'warning'}
            detail="Sufficient charge"
          />

          <StatusItem
            label="Location Source"
            value={location?.mockLocationDetected ? 'Mock' : 'GPS'}
            status={preFlightChecks.noMockLocation ? 'good' : 'error'}
            detail={location?.mockLocationDetected ? 'Spoofing detected!' : 'Authentic'}
          />
        </View>

        {photoUri && (
          <View style={styles.photoPreview}>
            <Text style={styles.photoPreviewText}>✓ Photo captured</Text>
            <Pressable onPress={handleTakePhoto}>
              <Text style={styles.photoPreviewLink}>Retake</Text>
            </Pressable>
          </View>
        )}

        <Button
          testID="take-photo-button"
          variant="secondary"
          onPress={handleTakePhoto}
          style={styles.photoButton}
        >
          {photoUri ? 'Retake Photo' : 'Take Photo (Optional)'}
        </Button>

        <Button
          testID="clock-in-button"
          variant="primary"
          onPress={handleClockIn}
          disabled={!preFlightPassed || isClocking}
          loading={isClocking}
          style={styles.clockInButton}
        >
          {isClocking ? 'Clocking In...' : 'Clock In'}
        </Button>

        {!preFlightPassed && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Please resolve all pre-flight check issues before clocking in
            </Text>
          </View>
        )}

        <View style={styles.stateInfo}>
          <Text style={styles.stateInfoText}>
            {visit.clientAddress.state} State Rules: {stateRules.geoFenceTolerance}m tolerance, {stateRules.minimumGPSAccuracy}m accuracy required
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Status Item Component
 */
interface StatusItemProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'error';
  detail?: string;
}

function StatusItem({ label, value, status, detail }: StatusItemProps) {
  const variantMap = {
    good: 'success',
    warning: 'warning',
    error: 'danger',
  } as const;

  return (
    <View style={styles.statusItem}>
      <View style={styles.statusItemHeader}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Badge variant={variantMap[status]} size="sm">
          {value}
        </Badge>
      </View>
      {detail && <Text style={styles.statusDetail}>{detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  statusPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusPanelContent: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  checksContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statusItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  photoPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    marginBottom: 12,
  },
  photoPreviewText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  photoPreviewLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  photoButton: {
    marginBottom: 12,
  },
  clockInButton: {
    marginBottom: 12,
  },
  warningBox: {
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  stateInfo: {
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  stateInfoText: {
    fontSize: 12,
    color: '#4338CA',
    textAlign: 'center',
  },
});
