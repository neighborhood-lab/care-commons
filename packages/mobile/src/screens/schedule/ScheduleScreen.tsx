/**
 * Schedule Screen - Weekly View
 * 
 * Comprehensive schedule management for caregivers:
 * - Weekly calendar with day-by-day visit breakdown
 * - Visit cards with client info, time, and location
 * - Navigation to GPS apps for directions
 * - Filter by visit status
 * - Offline support with cached schedule
 * - Pull-to-refresh for updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { Button, Badge, Card, CardContent } from '../../components/index';

// Mock types - in production, import from shared
interface Visit {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  serviceTypes: string[];
}

type StatusFilter = 'all' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  /**
   * Initialize week days
   */
  useEffect(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    setWeekDays(days);
  }, [selectedDate]);

  /**
   * Load visits for the week
   */
  useEffect(() => {
    loadVisits();
  }, []);

  /**
   * Filter visits by selected date and status
   */
  useEffect(() => {
    let filtered = visits.filter((visit) =>
      isSameDay(parseISO(visit.scheduledStartTime), selectedDate)
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter((visit) => visit.status === statusFilter);
    }

    setFilteredVisits(filtered);
  }, [visits, selectedDate, statusFilter]);

  /**
   * Load visits from API/cache
   */
  const loadVisits = async () => {
    try {
      // Mock data - in production, fetch from API or local DB
      const mockVisits: Visit[] = [
        {
          id: '1',
          clientId: 'c1',
          clientName: 'Dorothy Chen',
          clientAddress: {
            line1: '123 Main St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
            latitude: 30.2672,
            longitude: -97.7431,
          },
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'SCHEDULED',
          serviceTypes: ['Personal Care', 'Medication Reminder'],
        },
        {
          id: '2',
          clientId: 'c2',
          clientName: 'Robert Martinez',
          clientAddress: {
            line1: '456 Oak Ave',
            city: 'Austin',
            state: 'TX',
            postalCode: '78702',
            latitude: 30.2849,
            longitude: -97.7341,
          },
          scheduledStartTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          scheduledEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: 'SCHEDULED',
          serviceTypes: ['Companionship', 'Light Housekeeping'],
        },
        {
          id: '3',
          clientId: 'c3',
          clientName: 'Sarah Johnson',
          clientAddress: {
            line1: '789 Elm St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78703',
            latitude: 30.2911,
            longitude: -97.7595,
          },
          scheduledStartTime: addDays(new Date(), 1).toISOString(),
          scheduledEndTime: addDays(new Date(Date.now() + 2 * 60 * 60 * 1000), 1).toISOString(),
          status: 'SCHEDULED',
          serviceTypes: ['Meal Preparation', 'Medication Administration'],
        },
      ];

      setVisits(mockVisits);
    } catch (error) {
      console.error('Failed to load visits:', error);
      Alert.alert('Error', 'Failed to load schedule. Using cached data.');
    }
  };

  /**
   * Refresh visits
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  }, []);

  /**
   * Open maps app for navigation
   */
  const handleGetDirections = (visit: Visit) => {
    const { latitude, longitude } = visit.clientAddress;
    const label = encodeURIComponent(visit.clientName);

    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}?q=${label}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  /**
   * Get status badge variant
   */
  const getStatusVariant = (
    status: Visit['status']
  ): 'primary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'SCHEDULED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'primary';
    }
  };

  /**
   * Get visit count for a day
   */
  const getVisitCountForDay = (day: Date): number => {
    return visits.filter((visit) =>
      isSameDay(parseISO(visit.scheduledStartTime), day)
    ).length;
  };

  return (
    <View style={styles.container}>
      {/* Week Calendar */}
      <View style={styles.calendarContainer}>
        <Text style={styles.monthLabel}>{format(selectedDate, 'MMMM yyyy')}</Text>
        <View style={styles.weekDays}>
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const visitCount = getVisitCountForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Pressable
                key={day.toISOString()}
                style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                    isToday && styles.dayNameToday,
                  ]}
                >
                  {format(day, 'EEE')}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && styles.dayNumberToday,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {visitCount > 0 && (
                  <View style={[styles.visitBadge, isSelected && styles.visitBadgeSelected]}>
                    <Text style={[styles.visitBadgeText, isSelected && styles.visitBadgeTextSelected]}>
                      {visitCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, statusFilter === 'SCHEDULED' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('SCHEDULED')}
        >
          <Text
            style={[styles.filterButtonText, statusFilter === 'SCHEDULED' && styles.filterButtonTextActive]}
          >
            Upcoming
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, statusFilter === 'COMPLETED' && styles.filterButtonActive]}
          onPress={() => setStatusFilter('COMPLETED')}
        >
          <Text
            style={[styles.filterButtonText, statusFilter === 'COMPLETED' && styles.filterButtonTextActive]}
          >
            Completed
          </Text>
        </Pressable>
      </View>

      {/* Visit List */}
      <FlatList
        data={filteredVisits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: visit }) => (
          <Card style={styles.visitCard}>
            <CardContent>
              <View style={styles.visitHeader}>
                <View style={styles.visitTitleRow}>
                  <Text style={styles.visitClientName}>{visit.clientName}</Text>
                  <Badge variant={getStatusVariant(visit.status)} size="sm">
                    {visit.status}
                  </Badge>
                </View>
                <Text style={styles.visitTime}>
                  {format(parseISO(visit.scheduledStartTime), 'h:mm a')} -{' '}
                  {format(parseISO(visit.scheduledEndTime), 'h:mm a')}
                </Text>
              </View>

              <View style={styles.visitDetails}>
                <Text style={styles.visitAddress}>
                  📍 {visit.clientAddress.line1}, {visit.clientAddress.city}
                </Text>
                <Text style={styles.visitServices}>
                  {visit.serviceTypes.join(' • ')}
                </Text>
              </View>

              <View style={styles.visitActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => handleGetDirections(visit)}
                  style={styles.actionButton}
                >
                  Get Directions
                </Button>
                {visit.status === 'SCHEDULED' && (
                  <Button variant="primary" size="sm" style={styles.actionButton}>
                    Start Visit
                  </Button>
                )}
              </View>
            </CardContent>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No {statusFilter !== 'all' ? statusFilter.toLowerCase() : ''} visits for{' '}
              {format(selectedDate, 'MMMM d')}
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
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  dayButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 44,
  },
  dayButtonSelected: {
    backgroundColor: '#2563EB',
  },
  dayName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNameToday: {
    fontWeight: '600',
    color: '#2563EB',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayNumberToday: {
    color: '#2563EB',
  },
  visitBadge: {
    marginTop: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  visitBadgeSelected: {
    backgroundColor: '#FFFFFF',
  },
  visitBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  visitBadgeTextSelected: {
    color: '#2563EB',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  visitCard: {
    marginBottom: 12,
  },
  visitHeader: {
    marginBottom: 12,
  },
  visitTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  visitClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  visitTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  visitDetails: {
    marginBottom: 12,
  },
  visitAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  visitServices: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  visitActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
