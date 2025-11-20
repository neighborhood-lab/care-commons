import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Login Screen
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('demo@carecommons.com');
  const [password, setPassword] = useState('demo123');
  
  const handleLogin = () => {
    navigation.replace('Main');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏥 Care Commons</Text>
      <Text style={styles.subtitle}>Home Health EVV Platform</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      
      <Text style={styles.helperText}>Tap Login to enter demo mode</Text>
    </View>
  );
}

// Dashboard Screen
function DashboardScreen({ navigation }: any) {
  const stats = [
    { label: "Today's Visits", value: '12', color: '#2196F3' },
    { label: 'Clocked In Now', value: '8', color: '#4CAF50' },
    { label: 'Pending', value: '4', color: '#FF9800' },
    { label: 'Completed', value: '0', color: '#9C27B0' },
  ];
  
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EVV Dashboard</Text>
        <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>
      
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={styles.primaryActionButton}
        onPress={() => navigation.navigate('ClockIn')}
      >
        <Text style={styles.primaryActionText}>🕐 Quick Clock-In</Text>
      </TouchableOpacity>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Visits</Text>
        <View style={styles.activityItem}>
          <View>
            <Text style={styles.activityText}>Maria Garcia → Robert Johnson</Text>
            <Text style={styles.activityTime}>Clocked in 8:03 AM</Text>
          </View>
          <Text style={styles.statusBadge}>2h 15m</Text>
        </View>
        <View style={styles.activityItem}>
          <View>
            <Text style={styles.activityText}>John Smith → Susan Williams</Text>
            <Text style={styles.activityTime}>Clocked in 9:15 AM</Text>
          </View>
          <Text style={styles.statusBadge}>1h 03m</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Clock In/Out Screen
function ClockInScreen({ navigation }: any) {
  const [location, setLocation] = useState<any>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is required for EVV compliance');
    }
  };
  
  const handleClockIn = async () => {
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
      'Have you completed all required tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clock Out', 
          style: 'destructive',
          onPress: () => {
            const duration = '4h 23m';
            setIsClockedIn(false);
            Alert.alert('✅ Clocked Out', `Visit Duration: ${duration}\nPlease submit visit notes within 24 hours.`);
            navigation.goBack();
          }
        }
      ]
    );
  };
  
  return (
    <View style={styles.clockContainer}>
      <View style={styles.visitCard}>
        <Text style={styles.visitLabel}>Current Visit</Text>
        <Text style={styles.clientName}>Robert Johnson</Text>
        <Text style={styles.address}>📍 123 Main St, Austin, TX 78701</Text>
        <Text style={styles.schedule}>⏰ Scheduled: 9:00 AM - 1:00 PM</Text>
        <Text style={styles.services}>🏥 Services: Personal Care, Medication Reminder</Text>
      </View>
      
      {isClockedIn && (
        <View style={styles.clockedInCard}>
          <Text style={styles.clockedInTitle}>⏱️ Visit In Progress</Text>
          <Text style={styles.clockedInTime}>Started: {clockInTime}</Text>
          <View style={styles.evvStatus}>
            <Text style={styles.evvCheck}>✅ GPS Verified</Text>
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
          <Text style={styles.complianceItem}>• Must be within 100m of client location</Text>
          <Text style={styles.complianceItem}>• Photo verification may be required</Text>
          <Text style={styles.complianceItem}>• Visit notes due within 24 hours</Text>
          <Text style={styles.complianceItem}>• Electronic signature required at clock-out</Text>
        </View>
      )}
    </View>
  );
}

// Visits List Screen
function VisitsScreen({ navigation }: any) {
  const visits = [
    { id: 1, client: 'Robert Johnson', time: '9:00 AM - 1:00 PM', status: 'pending', address: '123 Main St' },
    { id: 2, client: 'Susan Williams', time: '2:00 PM - 6:00 PM', status: 'pending', address: '456 Oak Ave' },
    { id: 3, client: 'James Brown', time: '6:30 PM - 8:30 PM', status: 'pending', address: '789 Elm Dr' },
  ];
  
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Schedule</Text>
        <Text style={styles.headerSubtitle}>3 visits remaining</Text>
      </View>
      
      {visits.map((visit) => (
        <TouchableOpacity 
          key={visit.id} 
          style={styles.visitListCard}
          onPress={() => navigation.navigate('ClockIn')}
        >
          <View style={styles.visitRow}>
            <View style={styles.visitInfo}>
              <Text style={styles.visitClientName}>{visit.client}</Text>
              <Text style={styles.visitAddress}>{visit.address}</Text>
              <Text style={styles.visitTime}>{visit.time}</Text>
            </View>
            <TouchableOpacity 
              style={styles.clockInButton}
              onPress={() => navigation.navigate('ClockIn')}
            >
              <Text style={styles.clockInButtonText}>Clock In →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        headerShown: true,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
          title: 'Dashboard'
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
  );
}

// Main App
export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  clockContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    color: '#999',
    fontSize: 12,
    marginTop: 10,
  },
  header: {
    padding: 20,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  activityItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '600',
  },
  visitCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  visitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  clientName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
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
  },
  clockedInCard: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
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
    marginTop: 10,
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
    marginBottom: 20,
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
  visitListCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    padding: 15,
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitInfo: {
    flex: 1,
  },
  visitClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  visitAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  visitTime: {
    fontSize: 13,
    color: '#2196F3',
  },
  clockInButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clockInButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
