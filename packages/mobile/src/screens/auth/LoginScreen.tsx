/**
 * Login Screen
 * 
 * Authentication with email/password and optional biometric
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { Button } from '../../components/index.js';
import { createAuthService } from '../../services/auth.js';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    // Check if biometric is available
    const checkBiometric = async () => {
      try {
        const authService = createAuthService();
        const available = await authService.isBiometricAvailable();
        setBiometricAvailable(available);
      } catch {
        setBiometricAvailable(false);
      }
    };
    checkBiometric();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const authService = createAuthService();
      await authService.login({ email, password });
      // Navigation will happen automatically via isAuthenticated state change
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      const authService = createAuthService();
      const success = await authService.authenticateWithBiometric();
      
      if (!success) {
        Alert.alert('Authentication Failed', 'Biometric authentication was not successful');
        setIsLoading(false);
        return;
      }

      // Restore session after biometric auth
      const user = await authService.restoreSession();
      if (!user) {
        Alert.alert('Error', 'Could not restore session. Please login again.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
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
