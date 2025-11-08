/**
 * Profile Screen
 *
 * Full-featured profile screen with:
 * - User information display
 * - Settings and preferences
 * - Credentials management
 * - Theme toggle
 * - Logout functionality
 * - App info
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Button, Card, CardContent, Badge } from '../../components/index.js';
import { createAuthService } from '../../services/auth.js';
import { getApiClient } from '../../services/api-client.js';
import type { Caregiver, Credential } from '../../types/caregiver.js';

// Storage keys for settings
const SETTINGS_KEYS = {
  NOTIFICATIONS: 'settings_notifications',
  LANGUAGE: 'settings_language',
  THEME: 'settings_theme',
  BIOMETRIC: 'settings_biometric',
};

interface ProfileSettings {
  notifications: boolean;
  language: string;
  theme: 'light' | 'dark';
  biometricEnabled: boolean;
}

export function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Caregiver | null>(null);
  const [settings, setSettings] = useState<ProfileSettings>({
    notifications: true,
    language: 'en',
    theme: 'light',
    biometricEnabled: false,
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const loadProfileAndSettings = useCallback(async () => {
    try {
      setLoading(true);

      // Load user profile from API
      const apiClient = getApiClient();
      const response = await apiClient.get<Caregiver>('/api/caregivers/me');
      setProfile(response.data);

      // Load settings from AsyncStorage
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);

      // Check biometric availability
      const authService = createAuthService();
      const available = await authService.isBiometricAvailable();
      setBiometricAvailable(available);

      if (available) {
        const enabled = await authService.isBiometricEnabled();
        setSettings(prev => ({ ...prev, biometricEnabled: enabled }));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileAndSettings();
  }, [loadProfileAndSettings]);

  const loadSettings = async (): Promise<ProfileSettings> => {
    try {
      const [notifications, language, theme] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(SETTINGS_KEYS.LANGUAGE),
        AsyncStorage.getItem(SETTINGS_KEYS.THEME),
      ]);

      return {
        notifications: notifications !== 'false',
        language: language || 'en',
        theme: (theme as 'light' | 'dark') || 'light',
        biometricEnabled: false, // Will be set separately
      };
    } catch {
      return {
        notifications: true,
        language: 'en',
        theme: 'light',
        biometricEnabled: false,
      };
    }
  };

  const saveSetting = async (key: string, value: string | boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setSettings(prev => ({ ...prev, notifications: value }));
    await saveSetting(SETTINGS_KEYS.NOTIFICATIONS, value);
  };

  const handleThemeToggle = async (value: boolean) => {
    const theme = value ? 'dark' : 'light';
    setSettings(prev => ({ ...prev, theme }));
    await saveSetting(SETTINGS_KEYS.THEME, theme);
  };

  const handleBiometricToggle = async (value: boolean) => {
    const authService = createAuthService();

    if (value) {
      const success = await authService.enableBiometric();
      if (success) {
        setSettings(prev => ({ ...prev, biometricEnabled: true }));
      } else {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } else {
      await authService.disableBiometric();
      setSettings(prev => ({ ...prev, biometricEnabled: false }));
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSettings(prev => ({ ...prev, language: lang }));
    saveSetting(SETTINGS_KEYS.LANGUAGE, lang);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const authService = createAuthService();
              await authService.logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const getCredentialBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'danger';
      case 'PENDING_VERIFICATION':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button onPress={loadProfileAndSettings} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Section */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {profile.firstName} {profile.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{profile.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{profile.primaryPhone.number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{profile.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Employee #:</Text>
            <Text style={styles.value}>{profile.employeeNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Badge variant={profile.status === 'ACTIVE' ? 'success' : 'secondary'}>
              {profile.status}
            </Badge>
          </View>
        </CardContent>
      </Card>

      {/* Credentials Section */}
      {profile.credentials && profile.credentials.length > 0 && (
        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionTitle}>Credentials & Certifications</Text>
            {profile.credentials.map((credential: Credential) => (
              <View key={credential.id} style={styles.credentialItem}>
                <View style={styles.credentialHeader}>
                  <Text style={styles.credentialName}>{credential.name}</Text>
                  <Badge variant={getCredentialBadgeVariant(credential.status)} size="sm">
                    {credential.status}
                  </Badge>
                </View>
                {credential.number && (
                  <Text style={styles.credentialDetail}>Number: {credential.number}</Text>
                )}
                {credential.issuingAuthority && (
                  <Text style={styles.credentialDetail}>Issued by: {credential.issuingAuthority}</Text>
                )}
                <View style={styles.credentialDates}>
                  <Text style={styles.credentialDetail}>
                    Issue: {formatDate(credential.issueDate)}
                  </Text>
                  {credential.expirationDate && (
                    <Text style={styles.credentialDetail}>
                      Expires: {formatDate(credential.expirationDate)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Settings Section */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Settings & Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
              thumbColor={settings.notifications ? '#2563EB' : '#F3F4F6'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme</Text>
            </View>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
              thumbColor={settings.theme === 'dark' ? '#2563EB' : '#F3F4F6'}
            />
          </View>

          {biometricAvailable && (
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Biometric Login</Text>
                <Text style={styles.settingDescription}>
                  Use {Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'fingerprint'}
                </Text>
              </View>
              <Switch
                value={settings.biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
                thumbColor={settings.biometricEnabled ? '#2563EB' : '#F3F4F6'}
              />
            </View>
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDescription}>Current: {settings.language === 'en' ? 'English' : settings.language}</Text>
            </View>
            <View style={styles.languageButtons}>
              <Pressable
                style={[
                  styles.languageButton,
                  settings.language === 'en' && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    settings.language === 'en' && styles.languageButtonTextActive,
                  ]}
                >
                  EN
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.languageButton,
                  settings.language === 'es' && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageChange('es')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    settings.language === 'es' && styles.languageButtonTextActive,
                  ]}
                >
                  ES
                </Text>
              </Pressable>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* App Info Section */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version:</Text>
            <Text style={styles.value}>{Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Build:</Text>
            <Text style={styles.value}>{Constants.expoConfig?.extra?.buildNumber || 'dev'}</Text>
          </View>

          <View style={styles.linkSection}>
            <Pressable
              style={styles.link}
              onPress={() => openLink('https://carecommons.com/terms')}
            >
              <Text style={styles.linkText}>Terms of Service</Text>
            </Pressable>
            <Pressable
              style={styles.link}
              onPress={() => openLink('https://carecommons.com/privacy')}
            >
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Pressable>
            <Pressable
              style={styles.link}
              onPress={() => openLink('https://carecommons.com/support')}
            >
              <Text style={styles.linkText}>Help & Support</Text>
            </Pressable>
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
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  credentialItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  credentialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  credentialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  credentialDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  credentialDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  languageButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  languageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  linkSection: {
    marginTop: 12,
  },
  link: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
