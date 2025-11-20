import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

const Tab = createBottomTabNavigator();

// Dashboard Screen - IMPROVED
function DashboardScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(true);
  
  const stats = [
    { label: "Today's Visits", value: '12', color: '#2196F3' },
    { label: 'Clocked In Now', value: '8', color: '#4CAF50' },
    { label: 'Pending', value: '4', color: '#FF9800' },
    { label: 'Completed', value: '0', color: '#9C27B0' },
  ];
  
  return (
    <ScrollView style={styles.scrollContainer}>
      {/* IMPROVED: Caregiver Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>MG</Text>
          </View>
          <View>
            <Text style={styles.caregiverName}>Maria Garcia, CNA</Text>
            <Text style={styles.caregiverRole}>Certified Nursing Assistant</Text>
          </View>
        </View>
        {/* IMPROVED: Offline/Sync Indicator */}
        <View style={[styles.syncBadge, isOnline && styles.syncOnline]}>
          <Text style={styles.syncText}>{isOnline ? '✓ Online' : '⚠ Offline'}</Text>
        </View>
      </View>
      
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>
      
      {/* IMPROVED: Late Visit Warning */}
      <TouchableOpacity style={styles.warningCard}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>1 Visit Running Late</Text>
          <Text style={styles.warningText}>John Smith - Susan Williams (30min overdue)</Text>
        </View>
        <Text style={styles.warningArrow}>→</Text>
      </TouchableOpacity>
      
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      
      {/* IMPROVED: Next Visit with Location/Distance */}
      <View style={styles.nextVisitCard}>
        <View style={styles.nextVisitHeader}>
          <Text style={styles.nextVisitLabel}>📍 Next Visit</Text>
          <Text style={styles.nextVisitTime}>in 25 min</Text>
        </View>
        <Text style={styles.nextVisitClient}>Robert Johnson</Text>
        <Text style={styles.nextVisitAddress}>123 Main St, Austin, TX</Text>
        <View style={styles.nextVisitDetails}>
          <Text style={styles.nextVisitDistance}>🚗 2.3 mi (8 min drive)</Text>
          <Text style={styles.nextVisitSchedule}>⏰ 9:00 AM - 1:00 PM</Text>
        </View>
        <TouchableOpacity 
          style={styles.startRouteButton}
          onPress={() => Alert.alert('Navigation', 'Opening maps...')}
        >
          <Text style={styles.startRouteText}>🗺️ Start Navigation</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.primaryActionButton}
        onPress={() => navigation.navigate('ClockIn')}
      >
        <Text style={styles.primaryActionText}>🕐 Quick Clock-In</Text>
      </TouchableOpacity>
      
      {/* IMPROVED: Active Visits with Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Visits</Text>
        
        <View style={styles.visitItemCard}>
          <View style={styles.visitItemHeader}>
            <View>
              <Text style={styles.visitItemCaregiver}>Maria Garcia → Robert Johnson</Text>
              <Text style={styles.visitItemTime}>Clocked in 8:03 AM</Text>
            </View>
            <Text style={styles.visitDuration}>2h 15m</Text>
          </View>
          {/* IMPROVED: Client Safety Alert */}
          <View style={styles.safetyAlert}>
            <Text style={styles.safetyAlertText}>⚕️ Fall Risk - Use gait belt</Text>
          </View>
          {/* IMPROVED: Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>📝 Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>📋 Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>📞 Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.visitItemCard}>
          <View style={styles.visitItemHeader}>
            <View>
              <Text style={styles.visitItemCaregiver}>John Smith → Susan Williams</Text>
              <Text style={styles.visitItemTime}>Clocked in 9:15 AM</Text>
            </View>
            <Text style={styles.visitDuration}>1h 03m</Text>
          </View>
          <View style={styles.safetyAlert}>
            <Text style={styles.safetyAlertText}>💊 Medication Reminder at 10:00 AM</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>📝 Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>📋 Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>📞 Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* IMPROVED: Pending Documentation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Action Required</Text>
        <View style={styles.taskCard}>
          <Text style={styles.taskIcon}>📄</Text>
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>2 Visit Notes Pending</Text>
            <Text style={styles.taskSubtitle}>Due within 24 hours</Text>
          </View>
          <TouchableOpacity style={styles.taskButton}>
            <Text style={styles.taskButtonText}>Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Clock In/Out Screen - IMPROVED
function ClockInScreen({ navigation }: any) {
  const [location, setLocation] = useState<any>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(0);
  
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is required for EVV compliance');
    } else {
      // Simulate distance calculation
      setDistance(Math.floor(Math.random() * 50) + 10);
    }
  };
  
  const handleClockIn = async () => {
    // Check distance
    if (distance > 100) {
      Alert.alert(
        'Location Alert',
        `You are ${distance}m from the client location. EVV requires you to be within 100m.\n\nOverride?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Override & Clock In', onPress: () => performClockIn() }
        ]
      );
    } else {
      performClockIn();
    }
  };
  
  const performClockIn = async () => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      
      const now = new Date();
      setClockInTime(now.toLocaleTimeString());
      setIsClockedIn(true);
      
      Alert.alert(
        '✅ Clock-In Successful', 
        `Time: ${now.toLocaleTimeString()}\n` +
        `GPS: Verified ✓\n` +
        `Distance: ${distance}m\n` +
        `Client: Robert Johnson\n` +
        `Visit ID: #V2024-1119-001`
      );
    } catch (error) {
      Alert.alert('Location Error', 'Please enable location services and try again');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClockOut = () => {
    Alert.alert(
      'Confirm Clock-Out',
      'Have you completed all required tasks?\n\n• Documented visit notes\n• Completed care tasks\n• Client signature obtained',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clock Out', 
          style: 'destructive',
          onPress: () => {
            const duration = '4h 23m';
            setIsClockedIn(false);
            Alert.alert('✅ Clocked Out', `Visit Duration: ${duration}\n\nPlease submit visit notes within 24 hours.`);
          }
        }
      ]
    );
  };
  
  return (
    <ScrollView style={styles.clockContainer}>
      {/* IMPROVED: Visit Card with More Context */}
      <View style={styles.visitCard}>
        <Text style={styles.visitLabel}>Current Visit</Text>
        <Text style={styles.clientName}>Robert Johnson</Text>
        <Text style={styles.clientInfo}>Age 78 • Male • English</Text>
        <Text style={styles.address}>📍 123 Main St, Austin, TX 78701</Text>
        <Text style={styles.schedule}>⏰ Scheduled: 9:00 AM - 1:00 PM (4 hours)</Text>
        <Text style={styles.services}>🏥 Services: Personal Care, Medication Reminder, Meal Prep</Text>
        
        {/* IMPROVED: Distance Indicator */}
        <View style={[styles.distanceIndicator, distance > 100 && styles.distanceTooFar]}>
          <Text style={styles.distanceText}>
            📍 {distance}m from client location {distance > 100 ? '(Too far - EVV requires <100m)' : '(Within range ✓)'}
          </Text>
        </View>
      </View>
      
      {/* IMPROVED: Care Plan Highlights */}
      <View style={styles.carePlanCard}>
        <Text style={styles.carePlanTitle}>⚕️ Important Care Notes</Text>
        <Text style={styles.carePlanItem}>• Fall Risk - Always use gait belt</Text>
        <Text style={styles.carePlanItem}>• Diabetic - Blood sugar check before meals</Text>
        <Text style={styles.carePlanItem}>• Medication at 10:00 AM (see MAR)</Text>
        <Text style={styles.carePlanItem}>• Emergency Contact: Son John 512-555-0123</Text>
      </View>
      
      {isClockedIn && (
        <View style={styles.clockedInCard}>
          <Text style={styles.clockedInTitle}>⏱️ Visit In Progress</Text>
          <Text style={styles.clockedInTime}>Started: {clockInTime}</Text>
          <View style={styles.evvStatus}>
            <Text style={styles.evvCheck}>✅ GPS Verified ({distance}m)</Text>
            <Text style={styles.evvCheck}>✅ Client Match</Text>
            <Text style={styles.evvCheck}>✅ Schedule Match</Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.clockButton, isClockedIn && styles.clockOutButton, loading && styles.disabledButton]}
        onPress={isClockedIn ? handleClockOut : handleClockIn}
        disabled={loading}
      >
        <Text style={styles.clockButtonText}>
          {loading ? 'Getting Location...' : isClockedIn ? '🛑 Clock Out' : '▶️ Clock In'}
        </Text>
      </TouchableOpacity>
      
      {!isClockedIn && (
        <View style={styles.complianceCard}>
          <Text style={styles.complianceTitle}>📋 EVV Compliance Checklist</Text>
          <Text style={styles.complianceItem}>✓ Must be within 100m of client location</Text>
          <Text style={styles.complianceItem}>• Photo verification may be required</Text>
          <Text style={styles.complianceItem}>• Visit notes due within 24 hours</Text>
          <Text style={styles.complianceItem}>• Electronic signature required at clock-out</Text>
          <Text style={styles.complianceItem}>• Document any incidents immediately</Text>
        </View>
      )}
      
      {/* IMPROVED: Emergency Button */}
      <TouchableOpacity 
        style={styles.emergencyButton}
        onPress={() => Alert.alert('Emergency', 'Call 911 or Agency Emergency Line?', [
          { text: 'Cancel', style: 'cancel' },
          { text: '📞 Agency (512-555-0100)', onPress: () => {} },
          { text: '🚨 911', style: 'destructive', onPress: () => {} }
        ])}
      >
        <Text style={styles.emergencyButtonText}>🚨 Emergency Contact</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Visits List Screen - IMPROVED
function VisitsScreen({ navigation }: any) {
  const visits = [
    { 
      id: 1, 
      client: 'Robert Johnson', 
      time: '9:00 AM - 1:00 PM', 
      address: '123 Main St',
      distance: '2.3 mi',
      services: 'Personal Care, Medication',
      alerts: ['Fall Risk'],
      status: 'upcoming'
    },
    { 
      id: 2, 
      client: 'Susan Williams', 
      time: '2:00 PM - 6:00 PM', 
      address: '456 Oak Ave',
      distance: '5.1 mi',
      services: 'Meal Prep, Companionship',
      alerts: ['Diabetic'],
      status: 'upcoming'
    },
    { 
      id: 3, 
      client: 'James Brown', 
      time: '6:30 PM - 8:30 PM', 
      address: '789 Elm Dr',
      distance: '3.7 mi',
      services: 'Personal Care',
      alerts: [],
      status: 'upcoming'
    },
  ];
  
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Schedule</Text>
        <Text style={styles.headerSubtitle}>3 visits • 12 hours total</Text>
      </View>
      
      {visits.map((visit) => (
        <TouchableOpacity 
          key={visit.id} 
          style={styles.visitListCard}
          onPress={() => navigation.navigate('ClockIn')}
        >
          <View style={styles.visitCardHeader}>
            <Text style={styles.visitClientName}>{visit.client}</Text>
            <Text style={styles.visitDistance}>🚗 {visit.distance}</Text>
          </View>
          <Text style={styles.visitAddress}>📍 {visit.address}</Text>
          <Text style={styles.visitTime}>⏰ {visit.time}</Text>
          <Text style={styles.visitServices}>🏥 {visit.services}</Text>
          
          {visit.alerts.length > 0 && (
            <View style={styles.visitAlerts}>
              {visit.alerts.map((alert, idx) => (
                <Text key={idx} style={styles.visitAlert}>⚠️ {alert}</Text>
              ))}
            </View>
          )}
          
          <View style={styles.visitActions}>
            <TouchableOpacity 
              style={styles.visitActionButton}
              onPress={() => Alert.alert('Navigation', 'Opening maps...')}
            >
              <Text style={styles.visitActionText}>🗺️ Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.visitActionButton, styles.visitActionPrimary]}
              onPress={() => navigation.navigate('ClockIn')}
            >
              <Text style={styles.visitActionTextPrimary}>Clock In →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Main App
export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#2196F3',
            headerShown: false,
          }}
        >
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
            }}
          />
          <Tab.Screen 
            name="Visits" 
            component={VisitsScreen}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text>,
              title: 'My Visits'
            }}
          />
          <Tab.Screen 
            name="ClockIn" 
            component={ClockInScreen}
            options={{
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⏰</Text>,
              title: 'Clock In/Out'
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  clockContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  // IMPROVED: Profile Header
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  caregiverRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  syncBadge: {
    backgroundColor: '#FFE0E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  syncOnline: {
    backgroundColor: '#E8F5E9',
  },
  syncText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  dateHeader: {
    padding: 15,
    paddingTop: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  // IMPROVED: Warning Card
  warningCard: {
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#666',
  },
  warningArrow: {
    fontSize: 20,
    color: '#FF9800',
  },
  // IMPROVED: Next Visit Card
  nextVisitCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextVisitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nextVisitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  nextVisitTime: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  nextVisitClient: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  nextVisitAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  nextVisitDetails: {
    marginBottom: 10,
  },
  nextVisitDistance: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  nextVisitSchedule: {
    fontSize: 12,
    color: '#2196F3',
  },
  startRouteButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  startRouteText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    width: '44%',
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
  },
  primaryActionButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryActionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  // IMPROVED: Visit Item Cards
  visitItemCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  visitItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  visitItemCaregiver: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  visitItemTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  visitDuration: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '600',
  },
  safetyAlert: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  safetyAlertText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
  },
  // Task Card
  taskCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  taskSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  taskButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  taskButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  // Visit Card Improvements
  visitCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  visitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  clientName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  clientInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  schedule: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 5,
  },
  services: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  distanceIndicator: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  distanceTooFar: {
    backgroundColor: '#FFE0E0',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
  carePlanCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  carePlanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 10,
  },
  carePlanItem: {
    fontSize: 12,
    color: '#333',
    marginVertical: 3,
  },
  clockedInCard: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  clockedInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 5,
  },
  clockedInTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  evvStatus: {
    marginTop: 5,
  },
  evvCheck: {
    fontSize: 12,
    color: '#4CAF50',
    marginVertical: 2,
  },
  clockButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  clockOutButton: {
    backgroundColor: '#FF5252',
  },
  disabledButton: {
    opacity: 0.6,
  },
  clockButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  complianceCard: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD54F',
    marginBottom: 15,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  complianceItem: {
    fontSize: 13,
    color: '#666',
    marginVertical: 3,
  },
  emergencyButton: {
    backgroundColor: '#FF5252',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Visit List Card
  visitListCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    padding: 15,
  },
  visitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitClientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  visitDistance: {
    fontSize: 13,
    color: '#2196F3',
  },
  visitAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  visitTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  visitServices: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  visitAlerts: {
    marginBottom: 10,
  },
  visitAlert: {
    fontSize: 12,
    color: '#E65100',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  visitActions: {
    flexDirection: 'row',
    gap: 10,
  },
  visitActionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  visitActionPrimary: {
    backgroundColor: '#2196F3',
  },
  visitActionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  visitActionTextPrimary: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});
