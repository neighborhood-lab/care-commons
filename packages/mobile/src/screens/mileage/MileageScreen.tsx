/**
 * Mileage Tracking Screen
 *
 * Displays mileage history, current trip status, and allows manual entry.
 * Features:
 * - Start/stop trip tracking
 * - View trip history
 * - Weekly/monthly summaries
 * - Export for reimbursement
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../themes';
import { mileageService, MileageTrip, MileageSummary } from '../../services/mileage.service';

type TimeFilter = 'week' | 'month' | 'all';

export function MileageScreen() {
  const { colors } = useTheme();
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [summary, setSummary] = useState<MileageSummary | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Partial<MileageTrip> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadData = useCallback(async () => {
    try {
      // Check for active trip
      const activeTrip = await mileageService.getCurrentTrip();
      setCurrentTrip(activeTrip);
      setIsTracking(!!activeTrip);

      // Load trips based on filter
      let tripData: MileageTrip[];
      const now = new Date();

      if (timeFilter === 'week') {
        tripData = await mileageService.getTripsThisWeek();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const summaryData = await mileageService.getSummary(startOfWeek, endOfWeek);
        setSummary(summaryData);
      } else if (timeFilter === 'month') {
        tripData = await mileageService.getTripsThisMonth();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const summaryData = await mileageService.getSummary(startOfMonth, endOfMonth);
        setSummary(summaryData);
      } else {
        tripData = await mileageService.getAllTrips();
        // For all time, calculate from oldest trip to now
        if (tripData.length > 0) {
          const oldestDate = new Date(tripData[tripData.length - 1].createdAt);
          const summaryData = await mileageService.getSummary(oldestDate, now);
          setSummary(summaryData);
        } else {
          setSummary(null);
        }
      }

      setTrips(tripData);
    } catch (error) {
      console.error('Error loading mileage data:', error);
      Alert.alert('Error', 'Failed to load mileage data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartTrip = async () => {
    try {
      setIsTracking(true);
      await mileageService.startTrip('client_visit');
      const activeTrip = await mileageService.getCurrentTrip();
      setCurrentTrip(activeTrip);
      Alert.alert('Trip Started', 'Mileage tracking has begun. End the trip when you arrive at your destination.');
    } catch (error) {
      setIsTracking(false);
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please check location permissions.');
    }
  };

  const handleEndTrip = async () => {
    try {
      const completedTrip = await mileageService.endTrip();
      if (completedTrip) {
        Alert.alert(
          'Trip Completed',
          `Distance: ${completedTrip.distanceMiles} miles\n\nTrip has been saved to your history.`
        );
      }
      setIsTracking(false);
      setCurrentTrip(null);
      loadData();
    } catch (error) {
      console.error('Error ending trip:', error);
      Alert.alert('Error', 'Failed to end trip. Please try again.');
    }
  };

  const handleCancelTrip = () => {
    Alert.alert('Cancel Trip', 'Are you sure you want to cancel this trip? No mileage will be recorded.', [
      { text: 'Keep Tracking', style: 'cancel' },
      {
        text: 'Cancel Trip',
        style: 'destructive',
        onPress: async () => {
          await mileageService.cancelTrip();
          setIsTracking(false);
          setCurrentTrip(null);
        },
      },
    ]);
  };

  const handleDeleteTrip = (tripId: string) => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await mileageService.deleteTrip(tripId);
          loadData();
        },
      },
    ]);
  };

  const handleExport = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const csv = await mileageService.exportTripsAsCSV(startOfMonth, now);
      // In a real app, this would share/save the CSV file
      Alert.alert('Export Ready', `CSV export contains ${trips.length} trips.\n\nIn production, this would save or share the file.`);
      console.log('CSV Export:', csv);
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export mileage data');
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPurposeLabel = (purpose: string): string => {
    const labels: Record<string, string> = {
      client_visit: 'Client Visit',
      training: 'Training',
      office: 'Office',
      other: 'Other',
    };
    return labels[purpose] || purpose;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading mileage data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mileage Tracking</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Active Trip Card */}
      {isTracking && currentTrip && (
        <View style={styles.activeTrip}>
          <View style={styles.activeTripHeader}>
            <Text style={styles.activeTripIcon}>🚗</Text>
            <Text style={styles.activeTripTitle}>Trip in Progress</Text>
          </View>
          <Text style={styles.activeTripInfo}>Started: {formatTime(currentTrip.startLocation?.timestamp || '')}</Text>
          <View style={styles.activeTripActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelTrip}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.endTripButton} onPress={handleEndTrip}>
              <Text style={styles.endTripButtonText}>End Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Start Trip Button */}
      {!isTracking && (
        <TouchableOpacity style={styles.startTripButton} onPress={handleStartTrip}>
          <Text style={styles.startTripIcon}>🚗</Text>
          <Text style={styles.startTripText}>Start Trip</Text>
        </TouchableOpacity>
      )}

      {/* Summary Card */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {timeFilter === 'week' ? 'This Week' : timeFilter === 'month' ? 'This Month' : 'All Time'}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{summary.totalMiles}</Text>
              <Text style={styles.summaryLabel}>Miles</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{summary.tripCount}</Text>
              <Text style={styles.summaryLabel}>Trips</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>
                ${(summary.totalMiles * 0.67).toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Est. Reimbursement</Text>
            </View>
          </View>
        </View>
      )}

      {/* Time Filter */}
      <View style={styles.filterContainer}>
        {(['week', 'month', 'all'] as TimeFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, timeFilter === filter && styles.filterButtonActive]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text style={[styles.filterButtonText, timeFilter === filter && styles.filterButtonTextActive]}>
              {filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip List */}
      <View style={styles.tripList}>
        <Text style={styles.sectionTitle}>Trip History</Text>
        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🗺️</Text>
            <Text style={styles.emptyStateText}>No trips recorded yet</Text>
            <Text style={styles.emptyStateSubtext}>Start a trip to begin tracking your mileage</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onLongPress={() => handleDeleteTrip(trip.id)}
            >
              <View style={styles.tripHeader}>
                <View>
                  <Text style={styles.tripDate}>{formatDate(trip.createdAt)}</Text>
                  <Text style={styles.tripPurpose}>{getPurposeLabel(trip.purpose)}</Text>
                </View>
                <View style={styles.tripDistance}>
                  <Text style={styles.tripMiles}>{trip.distanceMiles} mi</Text>
                </View>
              </View>
              {trip.clientName && <Text style={styles.tripClient}>Client: {trip.clientName}</Text>}
              {trip.notes && <Text style={styles.tripNotes}>{trip.notes}</Text>}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Footer spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    exportButton: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    exportButtonText: {
      color: colors.primary,
      fontWeight: '600',
    },
    activeTrip: {
      backgroundColor: colors.successLight,
      margin: 20,
      marginBottom: 10,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    activeTripHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    activeTripIcon: {
      fontSize: 24,
      marginRight: 8,
    },
    activeTripTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.success,
    },
    activeTripInfo: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    activeTripActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontWeight: '600',
    },
    endTripButton: {
      flex: 2,
      backgroundColor: colors.success,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    endTripButtonText: {
      color: colors.textInverse,
      fontWeight: '600',
    },
    startTripButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      margin: 20,
      marginBottom: 10,
      padding: 20,
      borderRadius: 12,
    },
    startTripIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    startTripText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textInverse,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      margin: 20,
      marginTop: 10,
      padding: 20,
      borderRadius: 12,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryStat: {
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    summaryDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    filterButton: {
      flex: 1,
      padding: 10,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surfaceSecondary,
      marginHorizontal: 4,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    filterButtonTextActive: {
      color: colors.textInverse,
      fontWeight: '600',
    },
    tripList: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    tripCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    tripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    tripDate: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    tripPurpose: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    tripDistance: {
      alignItems: 'flex-end',
    },
    tripMiles: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    tripClient: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    tripNotes: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 4,
      fontStyle: 'italic',
    },
  });
}

export default MileageScreen;
