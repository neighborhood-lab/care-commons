/**
 * App Lock Context
 * 
 * Manages app locking and biometric authentication:
 * - Auto-lock after 5 minutes in background
 * - Biometric prompt on app foreground
 * - Session timeout management
 * - Security-first approach for PHI protection
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { createAuthService } from '../services/auth';
import { BiometricService } from '../services/biometric.service';

interface AppLockContextType {
  isLocked: boolean;
  unlockApp: () => Promise<boolean>;
  lockApp: () => void;
  setAutoLockEnabled: (enabled: boolean) => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

// Auto-lock timeout: 5 minutes
const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000;

interface AppLockProviderProps {
  children: React.ReactNode;
}

export function AppLockProvider({ children }: AppLockProviderProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const lastActiveTime = useRef<number>(Date.now());
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // App going to background
    if (
      appState.current.match(/active/) &&
      nextAppState.match(/inactive|background/)
    ) {
      lastActiveTime.current = Date.now();
    }

    // App coming to foreground
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      await checkAutoLock();
    }

    appState.current = nextAppState;
  };

  const checkAutoLock = async () => {
    if (!autoLockEnabled) {
      return;
    }

    const timeInBackground = Date.now() - lastActiveTime.current;
    
    // Lock app if it was in background for more than 5 minutes
    if (timeInBackground > AUTO_LOCK_TIMEOUT) {
      // Check if biometric is enabled
      const biometricEnabled = await BiometricService.isBiometricEnabled();
      
      if (biometricEnabled) {
        const isAvailable = await BiometricService.isAvailable();
        
        if (isAvailable) {
          // Lock and require biometric
          setIsLocked(true);
        }
      }
    }
  };

  const unlockApp = async (): Promise<boolean> => {
    try {
      const authService = createAuthService();
      const biometricEnabled = await authService.isBiometricEnabled();

      if (!biometricEnabled) {
        // Biometric not enabled, unlock immediately
        setIsLocked(false);
        return true;
      }

      // Authenticate with biometric
      const success = await authService.authenticateWithBiometric();

      if (success) {
        setIsLocked(false);
        lastActiveTime.current = Date.now();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unlocking app:', error);
      return false;
    }
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const value: AppLockContextType = {
    isLocked,
    unlockApp,
    lockApp,
    setAutoLockEnabled,
  };

  return (
    <AppLockContext.Provider value={value}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock(): AppLockContextType {
  const context = useContext(AppLockContext);
  if (context === undefined) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
