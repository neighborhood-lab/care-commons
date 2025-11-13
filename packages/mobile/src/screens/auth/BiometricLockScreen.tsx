/**
 * Biometric Lock Screen
 * 
 * Displayed when app is locked and requires biometric authentication.
 * Provides fallback to password login.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BiometricService } from '../../services/biometric.service';

interface BiometricLockScreenProps {
  onUnlock: () => Promise<boolean>;
  onFallbackToPassword: () => void;
}

export function BiometricLockScreen({
  onUnlock,
  onFallbackToPassword,
}: BiometricLockScreenProps) {
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    void loadBiometricType();
    // Auto-trigger authentication on mount
    void handleAuthenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBiometricType = async () => {
    const type = await BiometricService.getBiometricTypeName();
    setBiometricType(type);
  };

  const handleAuthenticate = async () => {
    if (isAuthenticating) {
      return;
    }

    setIsAuthenticating(true);

    try {
      const success = await onUnlock();

      if (!success) {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication was not successful. Please try again or use your password.',
          [
            { text: 'Try Again', onPress: () => void handleAuthenticate() },
            { text: 'Use Password', onPress: onFallbackToPassword },
          ]
        );
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      Alert.alert(
        'Error',
        'An error occurred during authentication. Please try again or use your password.',
        [
          { text: 'Try Again', onPress: () => void handleAuthenticate() },
          { text: 'Use Password', onPress: onFallbackToPassword },
        ]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo or App Name */}
        <Text style={styles.title}>Care Commons</Text>
        
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        {/* Message */}
        <Text style={styles.message}>
          App Locked for Security
        </Text>
        <Text style={styles.subtitle}>
          Use {biometricType} to unlock
        </Text>

        {/* Authenticate Button */}
        <TouchableOpacity
          onPress={() => void handleAuthenticate()}
          disabled={isAuthenticating}
          style={[styles.button, isAuthenticating && styles.buttonDisabled]}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Unlock with {biometricType}</Text>
          )}
        </TouchableOpacity>

        {/* Fallback to Password */}
        <TouchableOpacity
          onPress={onFallbackToPassword}
          style={styles.fallbackButton}
        >
          <Text style={styles.fallbackText}>Use Password Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 48,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockIcon: {
    fontSize: 48,
  },
  message: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fallbackText: {
    fontSize: 16,
    color: '#1a73e8',
    textAlign: 'center',
  },
});
