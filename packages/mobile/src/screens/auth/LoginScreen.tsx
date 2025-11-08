/**
 * Login Screen
 *
 * Authentication with email/password and optional biometric
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/index.js';
import { createAuthService } from '../../services/auth.js';
import { BiometricService } from '../../services/biometric.service.js';
import { useAuth } from '../../hooks/useAuth.js';

interface LoginScreenProps {
  navigation: {
    replace: (screen: string) => void;
  };
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { login } = useAuth();

  React.useEffect(() => {
    checkBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkBiometric = async () => {
    try {
      const available = await BiometricService.isAvailable();
      const enabled = await BiometricService.isBiometricEnabled();

      if (available && enabled) {
        setBiometricAvailable(true);
        // Auto-trigger biometric login if enabled
        handleBiometricLogin();
      } else {
        setBiometricAvailable(available);
      }
    } catch (error) {
      console.error('Error checking biometric:', error);
      setBiometricAvailable(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });

      // Check if this is first login
      const isFirstLogin = await AsyncStorage.getItem('first_login');

      if (!isFirstLogin) {
        // First time user - ask about biometric
        const available = await BiometricService.isAvailable();
        if (available) {
          const biometricName = await BiometricService.getBiometricTypeName();
          Alert.alert(
            'Enable Biometric Login',
            `Would you like to use ${biometricName} for faster login?`,
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  await BiometricService.enableBiometricLogin();
                },
              },
            ]
          );
        }

        // Navigate to onboarding
        navigation.replace('Onboarding');
      }
      // If not first login, auth state change will handle navigation
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      const success = await BiometricService.authenticate('Login to Care Commons');

      if (!success) {
        setIsLoading(false);
        return;
      }

      // Restore session after biometric auth
      const authService = createAuthService();
      const user = await authService.restoreSession();

      if (!user) {
        Alert.alert('Error', 'Could not restore session. Please login with your credentials.');
      }
      // If successful, auth state change will handle navigation
    } catch {
      Alert.alert('Biometric Login Failed', 'Please login with your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Care Commons</Text>
        <Text style={styles.subtitle}>Caregiver Mobile App</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="email-input"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
              placeholder="Enter your email"
            />
          </View>

          <View>
            <Text style={styles.label}>Password</Text>
            <TextInput
              testID="password-input"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              editable={!isLoading}
              placeholder="Enter your password"
            />
          </View>

          <Button
            testID="login-button"
            variant="primary"
            onPress={handleLogin}
            disabled={isLoading}
            loading={isLoading}
            style={styles.button}
          >
            Login
          </Button>

          {biometricAvailable && (
            <Button
              testID="biometric-login-button"
              variant="secondary"
              onPress={handleBiometricLogin}
              disabled={isLoading}
              style={styles.button}
            >
              Login with Biometric
            </Button>
          )}
        </View>

        <Text style={styles.footer}>
          Community owned care software
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
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
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 8,
  },
  footer: {
    marginTop: 48,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
