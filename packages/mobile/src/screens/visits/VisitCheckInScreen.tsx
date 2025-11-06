/**
 * Visit Check-In Screen
 *
 * Handles GPS-based check-in with:
 * - Location capture and validation
 * - Geofence verification
 * - Mock location detection
 * - Biometric authentication
 * - Photo capture (optional proof of presence)
 * - Offline support with sync queue
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index.js';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import type { MobileVisit, LocationVerification } from '../../shared/index.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = NativeStackScreenProps<RootStackParamList, 'VisitCheckIn'>['route'];

interface LocationStatus {
  checking: boolean;
  location: LocationVerification | null;
  withinGeofence: boolean;
  distance: number | null;
  mockLocationDetected: boolean;
  error: string | null;
}

export function VisitCheckInScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { visitId } = route.params;

  const [visit, setVisit] = useState<MobileVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>({
    checking: false,
    location: null,
    withinGeofence: false,
    distance: null,
    mockLocationDetected: false,
    error: null,
  });
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadVisit();
    checkLocation();
  }, [visitId]);

  const loadVisit = async () => {
    setIsLoading(true);
    try {
      // TODO: Load from WatermelonDB
      // Mock data for now
      const mockVisit: MobileVisit = {
        id: visitId,
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientId: 'client-1',
        caregiverId: 'caregiver-1',
        scheduledStartTime: new Date('2025-11-06T14:00:00'),
        scheduledEndTime: new Date('2025-11-06T15:00:00'),
        scheduledDuration: 60,
        clientName: 'Dorothy Chen',
        clientAddress: {
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
          latitude: 30.2672,
          longitude: -97.7431,
          geofenceRadius: 100,
          addressVerified: true,
        },
        serviceTypeCode: 'PERSONAL_CARE',
        serviceTypeName: 'Personal Care',
        status: 'SCHEDULED',
        evvRecordId: null,
        isSynced: true,
        lastModifiedAt: new Date(),
        syncPending: false,
      };
      setVisit(mockVisit);
    } catch (error) {
      Alert.alert('Error', 'Failed to load visit details');
    } finally {
      setIsLoading(false);
    }
  };

  const checkLocation = async () => {
    setLocationStatus(prev => ({ ...prev, checking: true, error: null }));

    try {
      // TODO: Integrate with actual location service
      // Mock location check
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate location verification
      const mockLocation: LocationVerification = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
        timestamp: new Date(),
        source: 'GPS',
        isMocked: false,
      };

      // Calculate distance (mock)
      const distance = 45; // meters
      const withinGeofence = distance <= 100; // within 100m geofence

      setLocationStatus({
        checking: false,
        location: mockLocation,
        withinGeofence,
        distance,
        mockLocationDetected: mockLocation.isMocked,
        error: null,
      });
    } catch (error) {
      setLocationStatus({
        checking: false,
        location: null,
        withinGeofence: false,
        distance: null,
        mockLocationDetected: false,
        error: 'Failed to get location. Please enable GPS.',
      });
    }
  };

  const handleBiometricVerification = async () => {
    setBiometricChecking(true);

    try {
      // TODO: Integrate with actual biometric service
      // Mock biometric check
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBiometricVerified(true);
      Alert.alert('Success', 'Biometric verification successful');
    } catch (error) {
      Alert.alert('Error', 'Biometric verification failed. Please try again.');
    } finally {
      setBiometricChecking(false);
    }
  };

  const handleTakePhoto = () => {
    // Navigate to camera screen
    navigation.navigate('Camera', {
      onCapture: (uri: string) => {
        setPhotoUri(uri);
      },
    });
  };

  const handleCheckIn = async () => {
    if (!visit) return;

    // Validate requirements
    if (locationStatus.mockLocationDetected) {
      Alert.alert(
        'Mock Location Detected',
        'Please disable mock location to check in.'
      );
      return;
    }

    if (!locationStatus.withinGeofence) {
      Alert.alert(
        'Location Warning',
        `You are ${locationStatus.distance}m from the client location. Are you sure you want to check in?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check In Anyway', onPress: () => performCheckIn() },
        ]
      );
      return;
    }

    if (!biometricVerified) {
      Alert.alert(
        'Biometric Required',
        'Please complete biometric verification before checking in.'
      );
      return;
    }

    await performCheckIn();
  };

  const performCheckIn = async () => {
    setCheckingIn(true);

    try {
      // TODO: Queue check-in for sync
      // const offlineQueue = new OfflineQueueService(database);
      // await offlineQueue.queueClockIn({ visitId, location, ... });

      // Mock check-in
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Check-In Successful',
        'You have successfully checked in to this visit.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!visit) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Visit not found</Text>
      </View>
    );
  }

  const canCheckIn =
    locationStatus.location &&
    !locationStatus.mockLocationDetected &&
    biometricVerified &&
    !checkingIn;

  return (
    <ScrollView style={styles.container}>
      {/* Visit Info */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.clientName}>{visit.clientName}</Text>
          <Text style={styles.address}>
            {visit.clientAddress.line1}, {visit.clientAddress.city}
          </Text>
        </CardContent>
      </Card>

      {/* Location Status */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Location Verification</Text>
            {locationStatus.checking ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Badge
                variant={locationStatus.withinGeofence ? 'success' : 'warning'}
                size="sm"
              >
                {locationStatus.withinGeofence ? 'IN RANGE' : 'OUT OF RANGE'}
              </Badge>
            )}
          </View>

          {locationStatus.error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{locationStatus.error}</Text>
            </View>
          )}

          {locationStatus.location && (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>GPS Accuracy:</Text>
                <Text style={styles.statusValue}>
                  {locationStatus.location.accuracy.toFixed(0)}m
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Distance from Client:</Text>
                <Text style={styles.statusValue}>
                  {locationStatus.distance}m
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Location Source:</Text>
                <Text style={styles.statusValue}>
                  {locationStatus.location.source}
                </Text>
              </View>
            </>
          )}

          {locationStatus.mockLocationDetected && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningBannerText}>
                ⚠️ Mock location detected. Please disable mock locations in your device settings.
              </Text>
            </View>
          )}

          <Button
            variant="secondary"
            size="md"
            onPress={checkLocation}
            disabled={locationStatus.checking}
            style={styles.refreshButton}
          >
            {locationStatus.checking ? 'Checking...' : 'Refresh Location'}
          </Button>
        </CardContent>
      </Card>

      {/* Biometric Verification */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Biometric Verification</Text>
            {biometricVerified && (
              <Badge variant="success" size="sm">
                VERIFIED
              </Badge>
            )}
          </View>

          <Text style={styles.description}>
            Verify your identity using fingerprint or Face ID
          </Text>

          <Button
            variant={biometricVerified ? 'secondary' : 'primary'}
            size="md"
            onPress={handleBiometricVerification}
            disabled={biometricChecking || biometricVerified}
            style={styles.verifyButton}
          >
            {biometricChecking
              ? 'Verifying...'
              : biometricVerified
              ? 'Verified ✓'
              : 'Verify Identity'}
          </Button>
        </CardContent>
      </Card>

      {/* Photo Capture (Optional) */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Photo Verification</Text>
            {photoUri && (
              <Badge variant="success" size="sm">
                CAPTURED
              </Badge>
            )}
          </View>

          <Text style={styles.description}>
            Optional: Take a photo as proof of presence
          </Text>

          <Button
            variant="secondary"
            size="md"
            onPress={handleTakePhoto}
            style={styles.photoButton}
          >
            {photoUri ? 'Retake Photo' : 'Take Photo'}
          </Button>
        </CardContent>
      </Card>

      {/* Check-In Button */}
      <View style={styles.actionContainer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleCheckIn}
          disabled={!canCheckIn}
          style={styles.checkInButton}
        >
          {checkingIn ? 'Checking In...' : 'Check In to Visit'}
        </Button>

        {!canCheckIn && !checkingIn && (
          <Text style={styles.requirementsText}>
            Complete all verifications to check in
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
  },
  card: {
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#991B1B',
  },
  warningBanner: {
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  warningBannerText: {
    fontSize: 14,
    color: '#92400E',
  },
  refreshButton: {
    marginTop: 12,
  },
  verifyButton: {
    marginTop: 4,
  },
  photoButton: {
    marginTop: 4,
  },
  actionContainer: {
    padding: 16,
    marginTop: 8,
  },
  checkInButton: {
    width: '100%',
  },
  requirementsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
