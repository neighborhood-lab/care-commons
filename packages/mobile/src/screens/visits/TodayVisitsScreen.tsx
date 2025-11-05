/**
 * Today's Visits Screen
 * 
 * Shows all visits scheduled for today with real-time status updates.
 * Primary screen for caregivers to manage their daily work.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, CardContent, Badge } from '@care-commons/shared-components/native';
import { Button } from '@care-commons/shared-components/native';
import { format, isPast, isFuture } from 'date-fns';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import type { MobileVisit } from '../../shared/index.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function TodayVisitsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [visits, setVisits] = useState<MobileVisit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncPending, setSyncPending] = useState(0);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      // TODO: Load from WatermelonDB and sync with API
      // const db = await getDatabase();
      // const visits = await db.collections.get('visits').query().fetch();
      
      // Mock data for now
      const mockVisits: MobileVisit[] = [
        {
          id: '1',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-1',
          caregiverId: 'caregiver-1',
          scheduledStartTime: new Date('2025-11-05T14:00:00'),
          scheduledEndTime: new Date('2025-11-05T15:00:00'),
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
          evvRecordId: 'evv-1',
          isSynced: true,
          lastModifiedAt: new Date(),
          syncPending: false,
        },
        {
          id: '2',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-2',
          caregiverId: 'caregiver-1',
          scheduledStartTime: new Date('2025-11-05T16:00:00'),
          scheduledEndTime: new Date('2025-11-05T17:30:00'),
          scheduledDuration: 90,
          clientName: 'Robert Martinez',
          clientAddress: {
            line1: '456 Oak Ave',
            city: 'Austin',
            state: 'TX',
            postalCode: '78702',
            country: 'US',
            latitude: 30.2672,
            longitude: -97.7431,
            geofenceRadius: 100,
            addressVerified: true,
          },
          serviceTypeCode: 'COMPANION',
          serviceTypeName: 'Companionship',
          status: 'SCHEDULED',
          evvRecordId: null,
          isSynced: true,
          lastModifiedAt: new Date(),
          syncPending: false,
        },
        {
          id: '3',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-3',
          caregiverId: 'caregiver-1',
          scheduledStartTime: new Date('2025-11-05T18:00:00'),
          scheduledEndTime: new Date('2025-11-05T19:00:00'),
          scheduledDuration: 60,
          clientName: 'Margaret Thompson',
          clientAddress: {
            line1: '789 Pine Rd',
            city: 'Austin',
            state: 'TX',
            postalCode: '78703',
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
        },
      ];
      
      setVisits(mockVisits);
      setSyncPending(mockVisits.filter(v => v.syncPending).length);
    } catch {
      Alert.alert('Error', 'Failed to load visits');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  };

  const getVisitStatus = (visit: MobileVisit) => {
    const start = new Date(visit.scheduledStartTime);
    const end = new Date(visit.scheduledEndTime);

    if (visit.status === 'IN_PROGRESS') {
      return { label: 'IN PROGRESS', variant: 'success' as const };
    }
    if (visit.status === 'COMPLETED') {
      return { label: 'COMPLETED', variant: 'primary' as const };
    }
    if (isPast(end)) {
      return { label: 'MISSED', variant: 'danger' as const };
    }
    if (isPast(start) && isFuture(end)) {
      return { label: 'OVERDUE', variant: 'warning' as const };
    }
    return { label: 'UPCOMING', variant: 'secondary' as const };
  };

  const renderVisit = ({ item: visit }: { item: MobileVisit }) => {
    const status = getVisitStatus(visit);
    const startTime = format(new Date(visit.scheduledStartTime), 'h:mm a');

    return (
      <Pressable
        onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}
      >
        <Card style={styles.card}>
          <CardContent>
            <View style={styles.visitHeader}>
              <View style={styles.visitInfo}>
                <Text style={styles.clientName}>{visit.clientName}</Text>
                <Text style={styles.time}>{startTime}</Text>
                <Text style={styles.service}>{visit.serviceTypeName}</Text>
              </View>
              <Badge variant={status.variant} size="sm">
                {status.label}
              </Badge>
            </View>

            <View style={styles.address}>
              <Text style={styles.addressText}>
                {visit.clientAddress.line1}
              </Text>
              <Text style={styles.addressText}>
                {visit.clientAddress.city}, {visit.clientAddress.state} {visit.clientAddress.postalCode}
              </Text>
            </View>

            {visit.syncPending && (
              <View style={styles.syncWarning}>
                <Text style={styles.syncWarningText}>
                  ⚠️ Changes pending sync
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              {visit.status === 'SCHEDULED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => navigation.navigate('ClockIn', { visitId: visit.id })}
                >
                  Clock In
                </Button>
              )}
              {visit.status === 'IN_PROGRESS' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => navigation.navigate('Tasks', { visitId: visit.id })}
                >
                  View Tasks
                </Button>
              )}
            </View>
          </CardContent>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Visits</Text>
        <Text style={styles.headerSubtitle}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Text>
        {syncPending > 0 && (
          <View style={styles.syncBadge}>
            <Text style={styles.syncBadgeText}>
              {syncPending} action{syncPending !== 1 ? 's' : ''} pending sync
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={visits}
        renderItem={renderVisit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading visits...' : 'No visits scheduled for today'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  syncBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  syncBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  service: {
    fontSize: 14,
    color: '#6B7280',
  },
  address: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  syncWarning: {
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  syncWarningText: {
    fontSize: 12,
    color: '#92400E',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
