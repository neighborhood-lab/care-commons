/**
 * Client List Screen
 *
 * Shows a list of clients with their basic information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Client {
  id: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  status: string;
  primaryPhone?: {
    number: string;
  };
  primaryAddress?: {
    city: string;
    state: string;
  };
}

export function ClientListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration - in real app, would call API
      // const response = await fetch('/api/clients');
      // const data = await response.json();

      // Using mock data for now
      const mockClients: Client[] = [
        {
          id: '1',
          clientNumber: 'CL-001',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1950-03-15',
          status: 'ACTIVE',
          primaryPhone: { number: '(555) 123-4567' },
          primaryAddress: { city: 'San Francisco', state: 'CA' },
        },
        {
          id: '2',
          clientNumber: 'CL-002',
          firstName: 'Jane',
          lastName: 'Smith',
          preferredName: 'Janie',
          dateOfBirth: '1945-07-22',
          status: 'ACTIVE',
          primaryPhone: { number: '(555) 234-5678' },
          primaryAddress: { city: 'Oakland', state: 'CA' },
        },
        {
          id: '3',
          clientNumber: 'CL-003',
          firstName: 'Robert',
          lastName: 'Johnson',
          dateOfBirth: '1938-11-30',
          status: 'ACTIVE',
          primaryPhone: { number: '(555) 345-6789' },
          primaryAddress: { city: 'Berkeley', state: 'CA' },
        },
      ];

      setClients(mockClients);
    } catch (err) {
      setError('Failed to load clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client: Client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(query) ||
      client.lastName.toLowerCase().includes(query) ||
      client.clientNumber.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10B981';
      case 'INACTIVE':
        return '#6B7280';
      case 'ON_HOLD':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const renderClient = ({ item }: { item: Client }): React.JSX.Element => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => {
        // Navigate to client detail screen (not implemented yet)
        navigation.navigate('ComingSoon', {
          verticalName: 'Client Details',
          verticalDescription: 'View and edit detailed client information',
        });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {item.preferredName || item.firstName} {item.lastName}
          </Text>
          <Text style={styles.clientNumber}>{item.clientNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Age:</Text>
          <Text style={styles.detailValue}>{calculateAge(item.dateOfBirth)} years</Text>
        </View>
        {item.primaryPhone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.primaryPhone.number}</Text>
          </View>
        )}
        {item.primaryAddress && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {item.primaryAddress.city}, {item.primaryAddress.state}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading clients...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchClients}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Text style={styles.subtitle}>{filteredClients.length} total clients</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No clients found</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
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
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  clientNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
