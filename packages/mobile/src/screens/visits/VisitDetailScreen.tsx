/**
 * Visit Detail Screen
 *
 * Shows complete visit information with actions for starting and ending visits.
 * Includes client info, address with directions, assigned tasks, and status timeline.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index.js';
import { format } from 'date-fns';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import type { MobileVisit } from '../../shared/index.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = NativeStackScreenProps<RootStackParamList, 'VisitDetail'>['route'];

export function VisitDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { visitId } = route.params;

  const [visit, setVisit] = useState<MobileVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);

  const loadVisit = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO(future/integration): Load from WatermelonDB
      //   Deferred: Mobile offline-first infrastructure - Tasks 0055-0058
      // const db = await getDatabase();
      // const visit = await db.collections.get('visits').find(visitId);

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

      // Mock tasks
      const mockTasks = [
        { id: '1', title: 'Assist with bathing', completed: false },
        { id: '2', title: 'Medication reminder', completed: false },
        { id: '3', title: 'Prepare meal', completed: false },
        { id: '4', title: 'Light housekeeping', completed: false },
      ];

      setVisit(mockVisit);
      setTasks(mockTasks);
    } catch {
      Alert.alert('Error', 'Failed to load visit details');
    } finally {
      setIsLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    loadVisit();
  }, [loadVisit]);

  const handleGetDirections = () => {
    if (!visit) return;

    const address = visit.clientAddress;
    const destination = `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`;
    const url = Platform.select({
      ios: `maps://app?daddr=${encodeURIComponent(destination)}`,
      android: `google.navigation:q=${encodeURIComponent(destination)}`,
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to web maps
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  const handleCallClient = () => {
    // TODO(future/feature): Add phone number to visit data
    //   Deferred: Nice-to-have feature
    Alert.alert('Call Client', 'Phone number not available');
  };

  const handleStartVisit = () => {
    if (!visit) return;
    navigation.navigate('VisitCheckIn', { visitId: visit.id });
  };

  const handleEndVisit = () => {
    if (!visit) return;
    navigation.navigate('VisitCheckOut', { visitId: visit.id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'secondary' as const;
      case 'IN_PROGRESS':
        return 'success' as const;
      case 'COMPLETED':
        return 'primary' as const;
      case 'PAUSED':
        return 'warning' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading visit details...</Text>
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

  return (
    <ScrollView style={styles.container}>
      {/* Visit Info Card */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.clientName}>{visit.clientName}</Text>
              <Text style={styles.time}>
                {format(new Date(visit.scheduledStartTime), 'h:mm a')} - {format(new Date(visit.scheduledEndTime), 'h:mm a')}
              </Text>
              <Text style={styles.service}>{visit.serviceTypeName}</Text>
            </View>
            <Badge variant={getStatusColor(visit.status)} size="md">
              {visit.status}
            </Badge>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>{visit.scheduledDuration} minutes</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Service:</Text>
            <Text style={styles.value}>{visit.serviceTypeName}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Address Card */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>{visit.clientAddress.line1}</Text>
            <Text style={styles.addressText}>
              {visit.clientAddress.city}, {visit.clientAddress.state} {visit.clientAddress.postalCode}
            </Text>
          </View>
          <View style={styles.actionRow}>
            <Button
              variant="primary"
              size="md"
              onPress={handleGetDirections}
              style={styles.flexButton}
            >
              Get Directions
            </Button>
            <Button
              variant="secondary"
              size="md"
              onPress={handleCallClient}
              style={styles.flexButton}
            >
              Call Client
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Assigned Tasks</Text>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxChecked]}>
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                {task.title}
              </Text>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Status Timeline Card */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Visit Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, visit.status !== 'SCHEDULED' && styles.timelineDotCompleted]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Scheduled</Text>
                <Text style={styles.timelineTime}>
                  {format(new Date(visit.scheduledStartTime), 'MMM d, h:mm a')}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, visit.status === 'IN_PROGRESS' || visit.status === 'COMPLETED' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>In Progress</Text>
                {visit.status === 'IN_PROGRESS' && (
                  <Text style={styles.timelineTime}>Now</Text>
                )}
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, visit.status === 'COMPLETED' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Completed</Text>
                {visit.status === 'COMPLETED' && (
                  <Text style={styles.timelineTime}>{format(new Date(visit.scheduledEndTime), 'h:mm a')}</Text>
                )}
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {visit.status === 'SCHEDULED' && (
          <Button
            variant="primary"
            size="lg"
            onPress={handleStartVisit}
            style={styles.primaryButton}
          >
            Start Visit
          </Button>
        )}

        {visit.status === 'IN_PROGRESS' && (
          <>
            <Button
              variant="secondary"
              size="lg"
              onPress={() => navigation.navigate('VisitDocumentation', { visitId: visit.id })}
              style={styles.secondaryButton}
            >
              Document Care
            </Button>
            <Button
              variant="primary"
              size="lg"
              onPress={handleEndVisit}
              style={styles.primaryButton}
            >
              End Visit
            </Button>
          </>
        )}

        {visit.status === 'COMPLETED' && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>✓ Visit Completed</Text>
          </View>
        )}
      </View>

      {visit.syncPending && (
        <View style={styles.syncWarning}>
          <Text style={styles.syncWarningText}>
            ⚠️ Changes pending sync
          </Text>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: '#374151',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  timelineDotCompleted: {
    backgroundColor: '#10B981',
  },
  timelineDotPending: {
    backgroundColor: '#E5E7EB',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionContainer: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  completedContainer: {
    padding: 20,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065F46',
  },
  syncWarning: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  syncWarningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },
});
