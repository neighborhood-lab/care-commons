/**
 * Schedule Screen
 *
 * Weekly calendar view showing caregiver's scheduled visits.
 * Features:
 * - Weekly calendar with swipe navigation
 * - Visit cards grouped by day
 * - Status filters (all, upcoming, completed, cancelled)
 * - Offline support with WatermelonDB
 * - Pull to refresh
 * - Navigation to maps for directions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index.js';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  isSameDay,
  isToday,
  isPast,
  isFuture,
} from 'date-fns';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import type { MobileVisit } from '../../shared/index.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

interface VisitsByDay {
  date: Date;
  visits: MobileVisit[];
}

export function ScheduleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [visits, setVisits] = useState<MobileVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<VisitsByDay[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [syncPending, setSyncPending] = useState(0);

  // Generate the current week's dates
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const loadVisits = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Load from WatermelonDB with date range
      // const db = await getDatabase();
      // const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
      // const visits = await getVisitsInDateRange(db, 'caregiver-1', currentWeekStart, weekEnd).fetch();

      // Mock data for now - spanning multiple days in the week
      const mockVisits: MobileVisit[] = [
        // Monday
        {
          id: '1',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-1',
          caregiverId: 'caregiver-1',
          scheduledStartTime: addDays(currentWeekStart, 1),
          scheduledEndTime: new Date(addDays(currentWeekStart, 1).getTime() + 60 * 60 * 1000),
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
        },
        // Tuesday
        {
          id: '2',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-2',
          caregiverId: 'caregiver-1',
          scheduledStartTime: addDays(currentWeekStart, 2),
          scheduledEndTime: new Date(addDays(currentWeekStart, 2).getTime() + 90 * 60 * 1000),
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
        // Wednesday - 2 visits
        {
          id: '3',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-3',
          caregiverId: 'caregiver-1',
          scheduledStartTime: addDays(currentWeekStart, 3),
          scheduledEndTime: new Date(addDays(currentWeekStart, 3).getTime() + 60 * 60 * 1000),
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
          status: 'COMPLETED',
          evvRecordId: 'evv-1',
          isSynced: true,
          lastModifiedAt: new Date(),
          syncPending: false,
        },
        {
          id: '4',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-4',
          caregiverId: 'caregiver-1',
          scheduledStartTime: new Date(addDays(currentWeekStart, 3).getTime() + 4 * 60 * 60 * 1000),
          scheduledEndTime: new Date(addDays(currentWeekStart, 3).getTime() + 5 * 60 * 60 * 1000),
          scheduledDuration: 60,
          clientName: 'James Wilson',
          clientAddress: {
            line1: '321 Elm St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78704',
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
        // Friday
        {
          id: '5',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-5',
          caregiverId: 'caregiver-1',
          scheduledStartTime: addDays(currentWeekStart, 5),
          scheduledEndTime: new Date(addDays(currentWeekStart, 5).getTime() + 120 * 60 * 1000),
          scheduledDuration: 120,
          clientName: 'Susan Davis',
          clientAddress: {
            line1: '654 Maple Dr',
            city: 'Austin',
            state: 'TX',
            postalCode: '78705',
            country: 'US',
            latitude: 30.2672,
            longitude: -97.7431,
            geofenceRadius: 100,
            addressVerified: true,
          },
          serviceTypeCode: 'COMPANION',
          serviceTypeName: 'Companionship',
          status: 'CANCELLED',
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
  }, [currentWeekStart]);

  const applyFilter = useCallback(() => {
    let filtered = [...visits];

    // Apply status filter
    if (filter === 'upcoming') {
      filtered = filtered.filter(v => v.status === 'SCHEDULED' || v.status === 'IN_PROGRESS');
    } else if (filter === 'completed') {
      filtered = filtered.filter(v => v.status === 'COMPLETED');
    } else if (filter === 'cancelled') {
      filtered = filtered.filter(v => v.status === 'CANCELLED');
    }

    // Group by day
    const visitsByDay: VisitsByDay[] = weekDates.map(date => ({
      date,
      visits: filtered
        .filter(v => isSameDay(new Date(v.scheduledStartTime), date))
        .sort((a, b) =>
          new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
        ),
    }));

    setFilteredVisits(visitsByDay);
  }, [visits, filter, weekDates]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev: Date) => addWeeks(prev, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev: Date) => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const openMaps = useCallback((visit: MobileVisit) => {
    const { latitude, longitude } = visit.clientAddress;
    const address = `${visit.clientAddress.line1}, ${visit.clientAddress.city}, ${visit.clientAddress.state} ${visit.clientAddress.postalCode}`;

    if (!latitude || !longitude) {
      Alert.alert('Error', 'Location coordinates not available');
      return;
    }

    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(visit.clientName);

    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latLng}`,
      android: `${scheme}${latLng}?q=${encodeURIComponent(address)}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported: boolean) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps application');
        }
      });
    }
  }, []);

  const getVisitStatus = (visit: MobileVisit) => {
    const start = new Date(visit.scheduledStartTime);
    const end = new Date(visit.scheduledEndTime);

    if (visit.status === 'IN_PROGRESS') {
      return { label: 'IN PROGRESS', variant: 'success' as const };
    }
    if (visit.status === 'COMPLETED') {
      return { label: 'COMPLETED', variant: 'primary' as const };
    }
    if (visit.status === 'CANCELLED') {
      return { label: 'CANCELLED', variant: 'secondary' as const };
    }
    if (isPast(end)) {
      return { label: 'MISSED', variant: 'danger' as const };
    }
    if (isPast(start) && isFuture(end)) {
      return { label: 'OVERDUE', variant: 'warning' as const };
    }
    return { label: 'UPCOMING', variant: 'secondary' as const };
  };

  const renderVisit = (visit: MobileVisit) => {
    const status = getVisitStatus(visit);
    const startTime = format(new Date(visit.scheduledStartTime), 'h:mm a');
    const endTime = format(new Date(visit.scheduledEndTime), 'h:mm a');

    return (
      <Pressable
        key={visit.id}
        onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}
      >
        <Card style={styles.visitCard}>
          <CardContent>
            <View style={styles.visitHeader}>
              <View style={styles.visitInfo}>
                <Text style={styles.clientName}>{visit.clientName}</Text>
                <Text style={styles.time}>
                  {startTime} - {endTime}
                </Text>
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
                  Changes pending sync
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => openMaps(visit)}
              >
                Get Directions
              </Button>
              {visit.status === 'SCHEDULED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => navigation.navigate('ClockIn', { visitId: visit.id })}
                >
                  Clock In
                </Button>
              )}
            </View>
          </CardContent>
        </Card>
      </Pressable>
    );
  };

  const renderDay = ({ item }: { item: VisitsByDay }) => {
    const dayName = format(item.date, 'EEEE');
    const dayDate = format(item.date, 'MMM d');
    const isTodayDate = isToday(item.date);
    const hasVisits = item.visits.length > 0;

    return (
      <View style={styles.daySection}>
        <View style={[styles.dayHeader, isTodayDate && styles.todayHeader]}>
          <Text style={[styles.dayName, isTodayDate && styles.todayText]}>
            {dayName}
          </Text>
          <Text style={[styles.dayDate, isTodayDate && styles.todayText]}>
            {dayDate}
          </Text>
          {hasVisits && (
            <View style={styles.visitCount}>
              <Text style={styles.visitCountText}>
                {item.visits.length} {item.visits.length === 1 ? 'visit' : 'visits'}
              </Text>
            </View>
          )}
        </View>

        {hasVisits ? (
          <View style={styles.dayVisits}>
            {item.visits.map(visit => renderVisit(visit))}
          </View>
        ) : (
          <View style={styles.noVisits}>
            <Text style={styles.noVisitsText}>No visits scheduled</Text>
          </View>
        )}
      </View>
    );
  };

  const totalVisitsInWeek = filteredVisits.reduce((sum: number, day: VisitsByDay) => sum + day.visits.length, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <Text style={styles.headerSubtitle}>
          {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), 'MMM d, yyyy')}
        </Text>
        {syncPending > 0 && (
          <View style={styles.syncBadge}>
            <Text style={styles.syncBadgeText}>
              {syncPending} action{syncPending !== 1 ? 's' : ''} pending sync
            </Text>
          </View>
        )}
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <Pressable onPress={goToPreviousWeek} style={styles.navButton}>
          <Text style={styles.navButtonText}>Previous</Text>
        </Pressable>
        <Pressable onPress={goToCurrentWeek} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>This Week</Text>
        </Pressable>
        <Pressable onPress={goToNextWeek} style={styles.navButton}>
          <Text style={styles.navButtonText}>Next</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        {(['all', 'upcoming', 'completed', 'cancelled'] as FilterType[]).map(filterType => (
          <Pressable
            key={filterType}
            onPress={() => setFilter(filterType)}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Visit Count */}
      <View style={styles.visitCountBanner}>
        <Text style={styles.visitCountBannerText}>
          {totalVisitsInWeek} {totalVisitsInWeek === 1 ? 'visit' : 'visits'} this week
        </Text>
      </View>

      {/* Schedule List */}
      <FlatList
        data={filteredVisits}
        renderItem={renderDay}
        keyExtractor={(item) => item.date.toISOString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading schedule...' : 'No visits found'}
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
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filters: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  visitCountBanner: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  visitCountBannerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  todayHeader: {
    borderBottomColor: '#2563EB',
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  dayDate: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  todayText: {
    color: '#2563EB',
  },
  visitCount: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  visitCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayVisits: {
    gap: 12,
  },
  noVisits: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noVisitsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  visitCard: {
    marginBottom: 0,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  service: {
    fontSize: 13,
    color: '#6B7280',
  },
  address: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 13,
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
