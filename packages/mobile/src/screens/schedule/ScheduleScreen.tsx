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

import React, { useState, useCallback, useMemo } from 'react';
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
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Button, Badge, Card, CardContent } from '../../components/index';
import { useSchedule } from '../../features/visits/hooks/useSchedule';
import type { MobileVisit, VisitStatus } from '../../shared/index';

type StatusFilter = 'all' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

// TODO: Get caregiver ID from auth context
const MOCK_CAREGIVER_ID = 'mock-caregiver-id';

export function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Use the schedule hook for offline-first data
  const { visits, refetch } = useSchedule({
    caregiverId: MOCK_CAREGIVER_ID,
    selectedDate,
  });

  /**
   * Calculate week days
   */
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  /**
   * Filter visits by selected date and status
   */
  const filteredVisits = useMemo(() => {
    let filtered = visits.filter((visit) =>
      isSameDay(visit.scheduledStartTime, selectedDate)
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter((visit) => visit.status === statusFilter);
    }

    return filtered;
  }, [visits, selectedDate, statusFilter]);

  /**
   * Refresh visits (pull-to-refresh)
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      Alert.alert('Error', 'Failed to refresh schedule. Using cached data.');
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  /**
   * Open maps app for navigation
   */
  const handleGetDirections = useCallback((visit: MobileVisit) => {
    const { latitude, longitude } = visit.clientAddress;
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Client address does not have GPS coordinates.');
      return;
    }

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
  }, []);

  /**
   * Get status badge variant
   */
  const getStatusVariant = useCallback(
    (status: VisitStatus): 'primary' | 'success' | 'warning' | 'danger' => {
      switch (status) {
        case 'SCHEDULED':
          return 'primary';
        case 'IN_PROGRESS':
        case 'PAUSED':
          return 'warning';
        case 'COMPLETED':
          return 'success';
        case 'CANCELLED':
        case 'PENDING_SYNC':
          return 'danger';
        default:
          return 'primary';
      }
    },
    []
  );

  /**
   * Get visit count for a day
   */
  const getVisitCountForDay = useCallback(
    (day: Date): number => {
      return visits.filter((visit) => isSameDay(visit.scheduledStartTime, day))
        .length;
    },
    [visits]
  );

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
                  {format(visit.scheduledStartTime, 'h:mm a')} -{' '}
                  {format(visit.scheduledEndTime, 'h:mm a')}
                </Text>
              </View>

              <View style={styles.visitDetails}>
                <Text style={styles.visitAddress}>
                  📍 {visit.clientAddress.line1}, {visit.clientAddress.city}
                </Text>
                <Text style={styles.visitServices}>{visit.serviceTypeName}</Text>
                {!visit.isSynced && (
                  <Text style={styles.syncStatus}>⚠️ Not synced</Text>
                )}
              </View>

              <View style={styles.visitActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => handleGetDirections(visit)}
                  style={styles.actionButton}
                  disabled={!visit.clientAddress.latitude || !visit.clientAddress.longitude}
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
  syncStatus: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontWeight: '500',
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
