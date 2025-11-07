/**
 * Permissions Screen
 *
 * Requests necessary permissions:
 * - Location (required for GPS check-in)
 * - Notifications (optional for visit reminders)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

interface PermissionsScreenProps {
  navigation: {
    replace: (screen: string) => void;
  };
}

export function PermissionsScreen({ navigation }: PermissionsScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Location permission is required for GPS check-in and check-out. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }

      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsGranted(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const handleRequestPermissions = async () => {
    setIsLoading(true);

    // Request location (required)
    const locationGranted = await requestLocationPermission();

    // Request notifications (optional)
    await requestNotificationPermission();

    setIsLoading(false);

    // Can proceed even if notifications are denied
    if (locationGranted) {
      handleContinue();
    }
  };

  const handleContinue = () => {
    navigation.replace('Main');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Permissions?',
      'Location permission is required for GPS check-in. You can grant permissions later in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip Anyway', onPress: handleContinue },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Permissions Required</Text>
        <Text style={styles.subtitle}>
          We need a few permissions to provide the best experience
        </Text>

        <View style={styles.permissionsContainer}>
          {/* Location Permission */}
          <View style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <Text style={styles.permissionIconText}>📍</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Location Access</Text>
              <Text style={styles.permissionDescription}>
                Required for GPS-verified check-in and check-out
              </Text>
              {locationGranted && (
                <Text style={styles.grantedText}>✓ Granted</Text>
              )}
            </View>
          </View>

          {/* Notification Permission */}
          <View style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <Text style={styles.permissionIconText}>🔔</Text>
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Notifications</Text>
              <Text style={styles.permissionDescription}>
                Optional - Get reminders for upcoming visits
              </Text>
              {notificationsGranted && (
                <Text style={styles.grantedText}>✓ Granted</Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRequestPermissions}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Requesting...' : 'Grant Permissions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          You can change these permissions anytime in your device settings
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  permissionsContainer: {
    marginBottom: 32,
  },
  permissionCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  permissionIconText: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  grantedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
});
