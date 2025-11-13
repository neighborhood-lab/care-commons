/**
 * Care Commons Mobile App
 *
 * Main entry point with:
 * - Authentication state management
 * - Biometric app lock integration
 * - Root navigation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initializeSentry } from './src/utils/sentry.js';
import { RootNavigator } from './src/navigation/RootNavigator.js';
import { AppLockProvider, useAppLock } from './src/contexts/AppLockContext.js';
import { BiometricLockScreen } from './src/screens/auth/BiometricLockScreen.js';
import { createAuthService } from './src/services/auth.js';

// Initialize error tracking
initializeSentry();

/**
 * App content with lock screen handling
 */
function AppContent() {
  const { isLocked, unlockApp } = useAppLock();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    void checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authService = createAuthService();
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Handle logout navigation
  useEffect(() => {
    // Check auth status periodically
    const interval = setInterval(() => {
      void checkAuthStatus();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Show biometric lock screen if app is locked
  if (isLocked) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <BiometricLockScreen
          onUnlock={unlockApp}
          onFallbackToPassword={() => {
            // Navigate to login screen
            setIsAuthenticated(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <RootNavigator isAuthenticated={isAuthenticated} />
    </View>
  );
}

/**
 * Root app component with providers
 */
export default function App() {
  return (
    <AppLockProvider>
      <AppContent />
    </AppLockProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});