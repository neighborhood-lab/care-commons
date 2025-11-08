/**
 * Visit History Screen
 *
 * Displays past visits with:
 * - List of visits from last 30 days
 * - Filter by client, date range, status
 * - Search functionality
 * - View visit details (read-only)
 * - Export visit summaries
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, CardContent, Badge, Button } from '../../components/index.js';
import { format, subDays, isWithinInterval } from 'date-fns';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';
import type { MobileVisit, VisitStatus } from '../../shared/index.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FilterOptions {
  dateRange: 'last7' | 'last14' | 'last30' | 'custom';
  status: VisitStatus | 'all';
  clientId: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export function VisitHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [visits, setVisits] = useState<MobileVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<MobileVisit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'last30',
    status: 'all',
    clientId: null,
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  useEffect(() => {
    loadVisits();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, searchQuery, filters]);

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      // TODO(future/integration): Load from WatermelonDB
      //   Deferred: Mobile offline-first infrastructure - Tasks 0055-0058
      // const db = await getDatabase();
      // const visits = await db.collections.get('visits')
      //   .query(Q.where('status', 'COMPLETED'))
      //   .fetch();

      // Mock data
      const mockVisits: MobileVisit[] = [
        {
          id: '1',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-1',
          caregiverId: 'caregiver-1',
          scheduledStartTime: subDays(new Date(), 1),
          scheduledEndTime: subDays(new Date(), 1),
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
          status: 'COMPLETED',
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
          scheduledStartTime: subDays(new Date(), 3),
          scheduledEndTime: subDays(new Date(), 3),
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
          status: 'COMPLETED',
          evvRecordId: 'evv-2',
          isSynced: true,
          lastModifiedAt: new Date(),
          syncPending: false,
        },
        {
          id: '3',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-1',
          caregiverId: 'caregiver-1',
          scheduledStartTime: subDays(new Date(), 5),
          scheduledEndTime: subDays(new Date(), 5),
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
          status: 'COMPLETED',
          evvRecordId: 'evv-3',
          isSynced: true,
          lastModifiedAt: new Date(),
          syncPending: false,
        },
        {
          id: '4',
          organizationId: 'org-1',
          branchId: 'branch-1',
          clientId: 'client-3',
          caregiverId: 'caregiver-1',
          scheduledStartTime: subDays(new Date(), 8),
          scheduledEndTime: subDays(new Date(), 8),
          scheduledDuration: 120,
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
          evvRecordId: 'evv-4',
          isSynced: true,
          lastModifiedAt: new Date(),
          syncPending: false,
        },
      ];

      setVisits(mockVisits);
    } catch {
      Alert.alert('Error', 'Failed to load visit history');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...visits];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        visit =>
          visit.clientName.toLowerCase().includes(query) ||
          visit.serviceTypeName.toLowerCase().includes(query) ||
          visit.clientAddress.city.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(visit => visit.status === filters.status);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(visit =>
        isWithinInterval(new Date(visit.scheduledStartTime), {
          start: filters.startDate!,
          end: filters.endDate!,
        })
      );
    }

    // Sort by date (most recent first)
    filtered.sort(
      (a, b) =>
        new Date(b.scheduledStartTime).getTime() -
        new Date(a.scheduledStartTime).getTime()
    );

    setFilteredVisits(filtered);
  };

  const handleDateRangeChange = (range: 'last7' | 'last14' | 'last30') => {
    const now = new Date();
    const days = range === 'last7' ? 7 : range === 'last14' ? 14 : 30;

    setFilters({
      ...filters,
      dateRange: range,
      startDate: subDays(now, days),
      endDate: now,
    });
  };

  const handleExport = () => {
    // TODO(future/feature): Implement export functionality
    //   Deferred: Nice-to-have feature
    Alert.alert(
      'Export Visits',
      `Export ${filteredVisits.length} visit${filteredVisits.length !== 1 ? 's' : ''} to CSV?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', 'Export not yet implemented') },
      ]
    );
  };

  const renderVisit = ({ item: visit }: { item: MobileVisit }) => {
    return (
      <Pressable onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}>
        <Card style={styles.card}>
          <CardContent>
            <View style={styles.visitHeader}>
              <View style={styles.visitInfo}>
                <Text style={styles.clientName}>{visit.clientName}</Text>
                <Text style={styles.date}>
                  {format(new Date(visit.scheduledStartTime), 'MMM d, yyyy')}
                </Text>
                <Text style={styles.time}>
                  {format(new Date(visit.scheduledStartTime), 'h:mm a')} - {visit.scheduledDuration} min
                </Text>
                <Text style={styles.service}>{visit.serviceTypeName}</Text>
              </View>
              <Badge
                variant={
                  visit.status === 'COMPLETED' ? 'primary' : 'secondary'
                }
                size="sm"
              >
                {visit.status}
              </Badge>
            </View>

            <View style={styles.address}>
              <Text style={styles.addressText}>
                {visit.clientAddress.line1}, {visit.clientAddress.city}
              </Text>
            </View>

            {visit.syncPending && (
              <View style={styles.syncWarning}>
                <Text style={styles.syncWarningText}>⚠️ Pending sync</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visit History</Text>
        <Text style={styles.headerSubtitle}>
          {filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client name, service, or location..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Button
            variant={filters.dateRange === 'last7' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => handleDateRangeChange('last7')}
            style={styles.filterButton}
          >
            Last 7 Days
          </Button>
          <Button
            variant={filters.dateRange === 'last14' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => handleDateRangeChange('last14')}
            style={styles.filterButton}
          >
            Last 14 Days
          </Button>
          <Button
            variant={filters.dateRange === 'last30' ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => handleDateRangeChange('last30')}
            style={styles.filterButton}
          >
            Last 30 Days
          </Button>
        </View>

        <Button
          variant="secondary"
          size="sm"
          onPress={handleExport}
          style={styles.exportButton}
        >
          Export CSV
        </Button>
      </View>

      {/* Visits List */}
      <FlatList
        data={filteredVisits}
        renderItem={renderVisit}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading
                ? 'Loading visits...'
                : searchQuery
                ? 'No visits match your search'
                : 'No visit history found'}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
  },
  exportButton: {
    width: '100%',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  service: {
    fontSize: 14,
    color: '#6B7280',
  },
  address: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  syncWarning: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  syncWarningText: {
    fontSize: 12,
    color: '#92400E',
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
