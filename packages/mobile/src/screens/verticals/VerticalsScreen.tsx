/**
 * Verticals Screen
 *
 * Shows all available verticals in the care commons platform
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Vertical {
  id: string;
  name: string;
  description: string;
  implemented: boolean;
  icon: string;
}

const VERTICALS: Vertical[] = [
  {
    id: 'client-demographics',
    name: 'Client Demographics',
    description: 'Manage client information, contact details, and emergency contacts',
    implemented: true,
    icon: '👤',
  },
  {
    id: 'scheduling-visits',
    name: 'Scheduling & Visits',
    description: 'Schedule care visits, manage appointments, and track visit completion',
    implemented: false,
    icon: '📅',
  },
  {
    id: 'caregiver-staff',
    name: 'Caregiver & Staff Management',
    description: 'Manage caregiver profiles, certifications, and availability',
    implemented: false,
    icon: '👥',
  },
  {
    id: 'care-plans-tasks',
    name: 'Care Plans & Tasks',
    description: 'Create and manage personalized care plans and daily tasks',
    implemented: false,
    icon: '📋',
  },
  {
    id: 'time-tracking-evv',
    name: 'Time Tracking & EVV',
    description: 'Electronic visit verification and time tracking for compliance',
    implemented: false,
    icon: '⏱️',
  },
  {
    id: 'billing-invoicing',
    name: 'Billing & Invoicing',
    description: 'Generate invoices, track payments, and manage billing cycles',
    implemented: false,
    icon: '💵',
  },
  {
    id: 'payroll-processing',
    name: 'Payroll Processing',
    description: 'Process payroll, track hours, and manage caregiver compensation',
    implemented: false,
    icon: '💰',
  },
  {
    id: 'shift-matching',
    name: 'Shift Matching',
    description: 'Intelligently match caregivers to shifts based on skills and availability',
    implemented: false,
    icon: '🔄',
  },
  {
    id: 'family-engagement',
    name: 'Family Engagement',
    description: 'Keep families informed with updates, photos, and communication tools',
    implemented: false,
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'quality-assurance-audits',
    name: 'Quality Assurance & Audits',
    description: 'Track quality metrics, conduct audits, and ensure compliance',
    implemented: false,
    icon: '✅',
  },
  {
    id: 'analytics-reporting',
    name: 'Analytics & Reporting',
    description: 'Generate insights and reports on operations, compliance, and performance',
    implemented: false,
    icon: '📊',
  },
];

export function VerticalsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleVerticalPress = (vertical: Vertical) => {
    if (vertical.implemented) {
      // Navigate to the implemented vertical
      navigation.navigate('ClientList');
    } else {
      // Navigate to coming soon screen
      navigation.navigate('ComingSoon', {
        verticalName: vertical.name,
        verticalDescription: vertical.description,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Care Commons Verticals</Text>
        <Text style={styles.subtitle}>
          Explore our comprehensive care management solutions
        </Text>
      </View>

      <View style={styles.verticalsList}>
        {VERTICALS.map((vertical) => (
          <TouchableOpacity
            key={vertical.id}
            style={[
              styles.verticalCard,
              !vertical.implemented && styles.verticalCardDisabled,
            ]}
            onPress={() => handleVerticalPress(vertical)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{vertical.icon}</Text>
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.verticalName}>{vertical.name}</Text>
                  {!vertical.implemented && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Coming Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.description}>{vertical.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  verticalsList: {
    padding: 16,
  },
  verticalCard: {
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
  verticalCardDisabled: {
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verticalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
