/**
 * VisitDetailScreen - Main screen for visit details and EVV clock-in/out
 * 
 * This demonstrates the core mobile EVV workflow:
 * 1. View visit details
 * 2. Clock in with GPS verification
 * 3. Clock out with task completion
 * 4. Offline-first operation with sync queue
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Card, ActivityIndicator } from 'react-native-paper';
import { useVisit } from '../hooks/index.js';
import { locationService } from '../../../services/location.js';
import { deviceInfoService } from '../../../services/device-info.js';
import { OfflineQueueService } from '../../../services/offline-queue.js';
import { database } from '../../../database/index.js';
import type { ClockInInput, ClockOutInput } from '../../../shared/index.js';

interface VisitDetailScreenProps {
  visitId: string;
}

export function VisitDetailScreen({ visitId }: VisitDetailScreenProps) {
  const { visit, loading, error } = useVisit(visitId);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading visit...</Text>
      </View>
    );
  }

  if (error || !visit) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error?.message || 'Visit not found'}
        </Text>
      </View>
    );
  }

  const handleClockIn = async () => {
    setClockingIn(true);

    try {
      // Check permissions
      const hasPermissions = await locationService.hasPermissions();
      if (!hasPermissions.foreground) {
        const granted = await locationService.requestPermissions();
        if (!granted) {
          Alert.alert(
            'Location Required',
            'Location access is required for EVV compliance. Please enable location in settings.'
          );
          return;
        }
      }

      // Get current location
      const location = await locationService.getCurrentLocation();
      
      // Get device info
      const deviceInfo = await deviceInfoService.getDeviceInfo();

      // Prepare clock-in input
      const clockInInput: ClockInInput = {
        visitId: visit.id,
        caregiverId: visit.caregiverId,
        location,
        deviceInfo,
        clientPresent: true, // TODO: Ask caregiver
        notes: undefined,
      };

      // Queue for offline sync
      const offlineQueue = new OfflineQueueService(database);
      await offlineQueue.queueClockIn(clockInInput);

      Alert.alert(
        'Clock In Successful',
        'You have clocked in to this visit. Location recorded.'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Clock In Failed', errorMessage);
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setClockingOut(true);

    try {
      // Get current location
      const location = await locationService.getCurrentLocation();
      
      // Get device info
      const deviceInfo = await deviceInfoService.getDeviceInfo();

      // Prepare clock-out input
      const clockOutInput: ClockOutInput = {
        visitId: visit.id,
        evvRecordId: visit.evvRecordId || '', // Should exist after clock-in
        caregiverId: visit.caregiverId,
        location,
        deviceInfo,
        completionNotes: undefined, // TODO: Prompt caregiver for notes
        tasksCompleted: undefined, // TODO: Get from task list
        tasksTotal: undefined,
        clientSignature: undefined, // TODO: Capture signature if required
      };

      // Queue for offline sync
      const offlineQueue = new OfflineQueueService(database);
      await offlineQueue.queueClockOut(clockOutInput);

      Alert.alert(
        'Clock Out Successful',
        'You have clocked out of this visit. Visit complete.'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Clock Out Failed', errorMessage);
    } finally {
      setClockingOut(false);
    }
  };

  const canClockIn = visit.status === 'SCHEDULED' && !visit.evvRecordId;
  const canClockOut = visit.status === 'IN_PROGRESS' && visit.evvRecordId;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Visit Details" />
        <Card.Content>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{visit.clientName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Service:</Text>
            <Text style={styles.value}>{visit.serviceTypeName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Scheduled:</Text>
            <Text style={styles.value}>
              {visit.scheduledStartTime.toLocaleTimeString()} - 
              {visit.scheduledEndTime.toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>{visit.scheduledDuration} minutes</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, styles.statusBadge]}>
              {visit.status}
            </Text>
          </View>

          {!visit.isSynced && (
            <View style={styles.syncWarning}>
              <Text style={styles.syncWarningText}>
                ⚠️ This visit has pending changes that will sync when online
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Location" />
        <Card.Content>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>
              {visit.clientAddress.line1}, {visit.clientAddress.city}, 
              {visit.clientAddress.state} {visit.clientAddress.postalCode}
            </Text>
          </View>
          
          {/* TODO: Show map with geofence circle */}
        </Card.Content>
      </Card>

      <View style={styles.actionButtons}>
        {canClockIn && (
          <Button
            mode="contained"
            onPress={handleClockIn}
            loading={clockingIn}
            disabled={clockingIn}
            style={styles.button}
          >
            Clock In
          </Button>
        )}

        {canClockOut && (
          <Button
            mode="contained"
            onPress={handleClockOut}
            loading={clockingOut}
            disabled={clockingOut}
            style={styles.button}
          >
            Clock Out
          </Button>
        )}

        {visit.status === 'COMPLETED' && (
          <Text style={styles.completedText}>Visit Completed</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 100,
  },
  value: {
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncWarning: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 4,
  },
  syncWarningText: {
    color: '#f57c00',
    fontSize: 14,
  },
  actionButtons: {
    padding: 16,
  },
  button: {
    marginBottom: 12,
  },
  completedText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    padding: 20,
  },
});
