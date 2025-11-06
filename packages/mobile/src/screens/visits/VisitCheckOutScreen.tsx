/**
 * Visit Check-Out Screen
 *
 * Handles end-of-visit checkout with:
 * - GPS location capture and validation
 * - Biometric verification
 * - Summary of completed tasks
 * - Documentation completion check
 * - Visit duration calculation
 * - Submission for coordinator review
 * - Offline support with sync queue
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index.js';
import { differenceInMinutes } from 'date-fns';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import type { MobileVisit, LocationVerification } from '../../shared/index.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = NativeStackScreenProps<RootStackParamList, 'VisitCheckOut'>['route'];

interface Task {
  id: string;
  title: string;
  required: boolean;
  completed: boolean;
}

interface DocumentationStatus {
  hasNotes: boolean;
  hasCaregiverSignature: boolean;
  hasClientSignature: boolean;
  requiredTasksCompleted: boolean;
  allTasksCompleted: boolean;
}

export function VisitCheckOutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { visitId } = route.params;

  const [visit, setVisit] = useState<MobileVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documentation, setDocumentation] = useState<DocumentationStatus>({
    hasNotes: false,
    hasCaregiverSignature: false,
    hasClientSignature: false,
    requiredTasksCompleted: false,
    allTasksCompleted: false,
  });
  const [location, setLocation] = useState<LocationVerification | null>(null);
  const [locationChecking, setLocationChecking] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [actualStartTime] = useState(new Date('2025-11-06T14:05:00')); // Mock - should come from EVV record
  const [allowMinimumDurationOverride, setAllowMinimumDurationOverride] = useState(false);

  const loadVisitData = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Load from WatermelonDB
      // Mock data
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
        status: 'IN_PROGRESS',
        evvRecordId: 'evv-123',
        isSynced: true,
        lastModifiedAt: new Date(),
        syncPending: false,
      };

      const mockTasks: Task[] = [
        { id: '1', title: 'Assist with bathing', required: true, completed: true },
        { id: '2', title: 'Medication reminder', required: true, completed: true },
        { id: '3', title: 'Prepare meal', required: true, completed: true },
        { id: '4', title: 'Light housekeeping', required: false, completed: false },
      ];

      const mockDocumentation: DocumentationStatus = {
        hasNotes: true,
        hasCaregiverSignature: true,
        hasClientSignature: false,
        requiredTasksCompleted: mockTasks.filter(t => t.required).every(t => t.completed),
        allTasksCompleted: mockTasks.every(t => t.completed),
      };

      setVisit(mockVisit);
      setTasks(mockTasks);
      setDocumentation(mockDocumentation);
    } catch {
      Alert.alert('Error', 'Failed to load visit data');
    } finally {
      setIsLoading(false);
    }
  }, [visitId]);

  const checkLocation = useCallback(async () => {
    setLocationChecking(true);
    try {
      // TODO: Integrate with actual location service
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockLocation: LocationVerification = {
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 12,
        timestamp: new Date(),
        timestampSource: 'GPS',
        locationSource: 'GPS_SATELLITE',
        method: 'GPS',
        mockLocationDetected: false,
        isWithinGeofence: true,
        distanceFromAddress: 45,
        geofencePassed: true,
        deviceId: 'mock-device',
        verificationPassed: true,
      };

      setLocation(mockLocation);
    } catch {
      Alert.alert('Error', 'Failed to get location. Please enable GPS.');
    } finally {
      setLocationChecking(false);
    }
  }, []);

  useEffect(() => {
    loadVisitData();
    checkLocation();
  }, [loadVisitData, checkLocation]);

  const handleBiometricVerification = async () => {
    setBiometricChecking(true);
    try {
      // TODO: Integrate with actual biometric service
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBiometricVerified(true);
      Alert.alert('Success', 'Biometric verification successful');
    } catch {
      Alert.alert('Error', 'Biometric verification failed. Please try again.');
    } finally {
      setBiometricChecking(false);
    }
  };

  const getActualDuration = () => {
    const now = new Date();
    return differenceInMinutes(now, actualStartTime);
  };

  const getMinimumDuration = () => {
    // Typically 80% of scheduled duration
    return visit ? Math.floor(visit.scheduledDuration * 0.8) : 0;
  };

  const handleCheckOut = async () => {
    if (!visit) return;

    // Validation checks
    const validationErrors: string[] = [];

    if (!location) {
      validationErrors.push('Location verification required');
    }

    if (location?.mockLocationDetected) {
      validationErrors.push('Mock location detected - please disable');
    }

    if (!biometricVerified) {
      validationErrors.push('Biometric verification required');
    }

    if (!documentation.requiredTasksCompleted) {
      validationErrors.push('All required tasks must be completed');
    }

    if (!documentation.hasNotes) {
      validationErrors.push('Care notes must be entered');
    }

    if (!documentation.hasCaregiverSignature) {
      validationErrors.push('Caregiver signature required');
    }

    // Check minimum duration
    const actualDuration = getActualDuration();
    const minimumDuration = getMinimumDuration();

    if (actualDuration < minimumDuration && !allowMinimumDurationOverride) {
      validationErrors.push(
        `Visit duration (${actualDuration} min) is less than minimum required (${minimumDuration} min)`
      );
    }

    if (validationErrors.length > 0) {
      Alert.alert(
        'Cannot Check Out',
        validationErrors.join('\n\n'),
        [
          { text: 'OK' },
          actualDuration < minimumDuration && {
            text: 'Override Duration',
            onPress: () => setAllowMinimumDurationOverride(true),
          },
        ].filter(Boolean) as any
      );
      return;
    }

    // Confirm check-out
    Alert.alert(
      'Confirm Check-Out',
      `Are you sure you want to check out of this visit?\n\nDuration: ${actualDuration} minutes`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Out', onPress: performCheckOut },
      ]
    );
  };

  const performCheckOut = async () => {
    setCheckingOut(true);
    try {
      // TODO: Queue check-out for sync
      // const offlineQueue = new OfflineQueueService(database);
      // await offlineQueue.queueClockOut({ ... });

      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Check-Out Successful',
        'You have successfully checked out. Visit has been submitted for coordinator review.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to check out. Please try again.');
    } finally {
      setCheckingOut(false);
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

  const actualDuration = getActualDuration();
  const minimumDuration = getMinimumDuration();
  const meetsMinimumDuration = actualDuration >= minimumDuration || allowMinimumDurationOverride;
  const requiredTasksCount = tasks.filter(t => t.required).length;
  const completedRequiredTasks = tasks.filter(t => t.required && t.completed).length;

  return (
    <ScrollView style={styles.container}>
      {/* Visit Summary */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.clientName}>{visit.clientName}</Text>
          <Text style={styles.service}>{visit.serviceTypeName}</Text>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Scheduled Duration:</Text>
            <Text style={styles.summaryValue}>{visit.scheduledDuration} min</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Actual Duration:</Text>
            <Text style={[
              styles.summaryValue,
              !meetsMinimumDuration && styles.summaryValueWarning,
            ]}>
              {actualDuration} min
            </Text>
          </View>

          {!meetsMinimumDuration && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningBannerText}>
                ⚠️ Below minimum duration ({minimumDuration} min)
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Tasks Completion Summary */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <Badge
              variant={documentation.requiredTasksCompleted ? 'success' : 'danger'}
              size="sm"
            >
              {completedRequiredTasks}/{requiredTasksCount} Required
            </Badge>
          </View>

          {tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                {task.completed ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={styles.crossmark}>✗</Text>
                )}
              </View>
              <Text style={styles.taskText}>{task.title}</Text>
              {task.required && (
                <Badge variant="danger" size="sm">
                  Required
                </Badge>
              )}
            </View>
          ))}

          {!documentation.requiredTasksCompleted && (
            <Pressable
              style={styles.linkButton}
              onPress={() =>
                navigation.navigate('VisitDocumentation', { visitId: visit.id })
              }
            >
              <Text style={styles.linkButtonText}>
                → Complete required tasks
              </Text>
            </Pressable>
          )}
        </CardContent>
      </Card>

      {/* Documentation Status */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Documentation</Text>

          <View style={styles.checklistItem}>
            <View style={[
              styles.statusIcon,
              documentation.hasNotes && styles.statusIconSuccess,
            ]}>
              <Text style={styles.statusIconText}>
                {documentation.hasNotes ? '✓' : '✗'}
              </Text>
            </View>
            <Text style={styles.checklistText}>Care notes entered</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[
              styles.statusIcon,
              documentation.hasCaregiverSignature && styles.statusIconSuccess,
            ]}>
              <Text style={styles.statusIconText}>
                {documentation.hasCaregiverSignature ? '✓' : '✗'}
              </Text>
            </View>
            <Text style={styles.checklistText}>Caregiver signature captured</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[
              styles.statusIcon,
              documentation.hasClientSignature && styles.statusIconSuccess,
            ]}>
              <Text style={styles.statusIconText}>
                {documentation.hasClientSignature ? '✓' : '○'}
              </Text>
            </View>
            <Text style={styles.checklistText}>
              Client signature (optional)
            </Text>
          </View>

          {(!documentation.hasNotes || !documentation.hasCaregiverSignature) && (
            <Pressable
              style={styles.linkButton}
              onPress={() =>
                navigation.navigate('VisitDocumentation', { visitId: visit.id })
              }
            >
              <Text style={styles.linkButtonText}>
                → Complete documentation
              </Text>
            </Pressable>
          )}
        </CardContent>
      </Card>

      {/* Location Verification */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionTitle}>Location Verification</Text>
            {locationChecking ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : location ? (
              <Badge variant="success" size="sm">
                VERIFIED
              </Badge>
            ) : (
              <Badge variant="danger" size="sm">
                REQUIRED
              </Badge>
            )}
          </View>

          {location && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>GPS Accuracy:</Text>
              <Text style={styles.statusValue}>
                {location.accuracy.toFixed(0)}m
              </Text>
            </View>
          )}

          <Button
            variant="secondary"
            size="sm"
            onPress={checkLocation}
            disabled={locationChecking}
            style={styles.verifyButton}
          >
            {locationChecking ? 'Checking...' : 'Refresh Location'}
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

      {/* Check-Out Button */}
      <View style={styles.actionContainer}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleCheckOut}
          disabled={checkingOut}
          style={styles.checkOutButton}
        >
          {checkingOut ? 'Checking Out...' : 'Complete Visit & Check Out'}
        </Button>
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
  service: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  summaryValueWarning: {
    color: '#DC2626',
  },
  warningBanner: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  warningBannerText: {
    fontSize: 14,
    color: '#92400E',
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
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  checkboxChecked: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: 'bold',
  },
  crossmark: {
    color: '#991B1B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  checklistText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
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
  verifyButton: {
    marginTop: 8,
  },
  linkButton: {
    marginTop: 12,
    padding: 8,
  },
  linkButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  actionContainer: {
    padding: 16,
    marginTop: 8,
  },
  checkOutButton: {
    width: '100%',
  },
});
