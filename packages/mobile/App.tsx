/**
 * Care Commons Mobile App
 *
 * Main entry point with simple home screen
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initializeSentry } from './src/utils/sentry';

// Initialize error tracking
initializeSentry();

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Care Commons</Text>
        <Text style={styles.headerSubtitle}>Mobile EVV System</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'visits' && <VisitsScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'home' && styles.activeTab]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'visits' && styles.activeTab]}
          onPress={() => setActiveTab('visits')}
        >
          <Text style={[styles.tabText, activeTab === 'visits' && styles.activeTabText]}>
            Visits
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.welcomeText}>Welcome to Care Commons</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Schedule</Text>
        <Text style={styles.cardContent}>No visits scheduled</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Clock In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>View Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VisitsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Your Visits</Text>
      <View style={styles.card}>
        <Text style={styles.cardContent}>No recent visits</Text>
      </View>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Caregiver</Text>
        <Text style={styles.cardContent}>Not logged in</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  screen: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
});