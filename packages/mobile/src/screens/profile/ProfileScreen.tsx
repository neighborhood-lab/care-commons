/**
 * Profile Screen - Caregiver Settings & Account Management
 * 
 * Comprehensive profile management:
 * - User information display
 * - Notification preferences
 * - Biometric authentication toggle
 * - Theme selection (dark/light)
 * - Credentials/certifications view
 * - App information
 * - Logout functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { Button, Card, CardContent, Badge } from '../../components/index';
import { createAuthService } from '../../services/auth';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  certifications: Array<{
    type: string;
    number: string;
    expiresAt: string;
    status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
  }>;
  languages: string[];
}

interface AppSettings {
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  darkModeEnabled: boolean;
  language: string;
}

const APP_VERSION = '1.0.0';

export function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    biometricEnabled: false,
    darkModeEnabled: false,
    language: 'en',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      // Mock data - in production, fetch from API
      const mockProfile: UserProfile = {
        id: 'cg-1',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: 'maria.rodriguez@example.com',
        phone: '(512) 555-0123',
        certifications: [
          {
            type: 'CNA',
            number: 'TX-CNA-123456',
            expiresAt: '2026-03-15',
            status: 'ACTIVE',
          },
          {
            type: 'CPR/First Aid',
            number: 'AHA-2024-789',
            expiresAt: '2025-12-01',
            status: 'EXPIRING',
          },
        ],
        languages: ['English', 'Spanish'],
      };

      setProfile(mockProfile);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // In production, load from AsyncStorage
      // const stored = await AsyncStorage.getItem('app_settings');
      // if (stored) setSettings(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      setSettings(newSettings);
      // In production, save to AsyncStorage
      // await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleNotifications = () => {
    const newSettings = {
      ...settings,
      notificationsEnabled: !settings.notificationsEnabled,
    };
    saveSettings(newSettings);
  };

  const toggleBiometric = () => {
    const newSettings = {
      ...settings,
      biometricEnabled: !settings.biometricEnabled,
    };
    saveSettings(newSettings);
    
    if (newSettings.biometricEnabled) {
      Alert.alert(
        'Biometric Authentication',
        'Biometric authentication will be required for future logins.'
      );
    }
  };

  const toggleDarkMode = () => {
    const newSettings = {
      ...settings,
      darkModeEnabled: !settings.darkModeEnabled,
    };
    saveSettings(newSettings);
    
    Alert.alert(
      'Theme Changed',
      'Dark mode will be applied on next app restart.'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const authService = createAuthService();
            await authService.logout();
          },
        },
      ]
    );
  };

  const openTerms = () => {
    Linking.openURL('https://carecommons.example/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://carecommons.example/privacy');
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@carecommons.example');
  };

  const getCertStatusVariant = (
    status: string
  ): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRING':
        return 'warning';
      case 'EXPIRED':
        return 'danger';
      default:
        return 'success';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Section */}
      <Card style={styles.section}>
        <CardContent>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.firstName[0]}
                {profile.lastName[0]}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text style={styles.userEmail}>{profile.email}</Text>
              <Text style={styles.userPhone}>{profile.phone}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Certifications Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Certifications</Text>
      </View>
      <Card style={styles.section}>
        <CardContent>
          {profile.certifications.map((cert, index) => (
            <View
              key={index}
              style={[
                styles.certItem,
                index < profile.certifications.length - 1 &&
                  styles.certItemBorder,
              ]}
            >
              <View style={styles.certHeader}>
                <Text style={styles.certType}>{cert.type}</Text>
                <Badge
                  variant={getCertStatusVariant(cert.status)}
                  size="sm"
                >
                  {cert.status}
                </Badge>
              </View>
              <Text style={styles.certNumber}>#{cert.number}</Text>
              <Text style={styles.certExpiry}>
                Expires: {new Date(cert.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Languages Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Languages</Text>
      </View>
      <Card style={styles.section}>
        <CardContent>
          <Text style={styles.languages}>{profile.languages.join(', ')}</Text>
        </CardContent>
      </Card>

      {/* Settings Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Settings</Text>
      </View>
      <Card style={styles.section}>
        <CardContent>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDesc}>
                Receive alerts for new visits and updates
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
            />
          </View>

          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Biometric Login</Text>
              <Text style={styles.settingDesc}>
                Use fingerprint or face ID to login
              </Text>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={toggleBiometric}
            />
          </View>

          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDesc}>Use dark theme</Text>
            </View>
            <Switch
              value={settings.darkModeEnabled}
              onValueChange={toggleDarkMode}
            />
          </View>
        </CardContent>
      </Card>

      {/* App Info Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>App Information</Text>
      </View>
      <Card style={styles.section}>
        <CardContent>
          <Pressable style={styles.linkItem} onPress={openTerms}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
          <Pressable
            style={[styles.linkItem, styles.settingItemBorder]}
            onPress={openPrivacy}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
          <Pressable
            style={[styles.linkItem, styles.settingItemBorder]}
            onPress={openSupport}
          >
            <Text style={styles.linkText}>Contact Support</Text>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
          <View style={[styles.linkItem, styles.settingItemBorder]}>
            <Text style={styles.linkText}>Version</Text>
            <Text style={styles.versionText}>{APP_VERSION}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="danger"
        size="lg"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Logout
      </Button>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  certItem: {
    paddingVertical: 12,
  },
  certItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  certType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  certNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  certExpiry: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  languages: {
    fontSize: 14,
    color: '#111827',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#111827',
  },
  linkArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 32,
  },
});
