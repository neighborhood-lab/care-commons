/**
 * useConnectionStatus Hook
 * 
 * Monitors network connectivity status and provides real-time updates.
 * Tracks both browser online/offline events and actual server reachability.
 * 
 * Features:
 * - Browser online/offline detection
 * - Periodic server health checks
 * - Last connection timestamp tracking
 * - Connection quality indicators
 */

import { useState, useEffect, useCallback } from 'react';

export interface ConnectionStatus {
  /** Whether the browser is online */
  isOnline: boolean;
  /** Whether the server is reachable */
  isServerReachable: boolean;
  /** Combined connection quality */
  isConnected: boolean;
  /** Last successful connection timestamp */
  lastConnected: Date | null;
  /** Timestamp of last check */
  lastChecked: Date | null;
  /** Manually trigger a connection check */
  checkConnection: () => Promise<void>;
}

const HEALTH_CHECK_ENDPOINT = '/api/health';
const CHECK_INTERVAL = 30000; // 30 seconds
const RETRY_INTERVAL = 5000; // 5 seconds when offline

/**
 * Check if the server is reachable by hitting the health endpoint
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(HEALTH_CHECK_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    // Network error, timeout, or aborted - expected during offline scenarios
    // This is a normal part of connectivity checks, not an error condition
    return false;
  }
}

/**
 * Hook to monitor network and server connectivity status
 */
export function useConnectionStatus(): ConnectionStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [lastConnected, setLastConnected] = useState<Date | null>(new Date());
  const [lastChecked, setLastChecked] = useState<Date | null>(new Date());

  const checkConnection = useCallback(async () => {
    const now = new Date();
    setLastChecked(now);
    
    if (!navigator.onLine) {
      setIsServerReachable(false);
      return;
    }

    const isReachable = await checkServerHealth();
    setIsServerReachable(isReachable);
    
    if (isReachable) {
      setLastConnected(now);
    }
  }, []);

  // Run initial check on mount
  useEffect(() => {
    let mounted = true;
    
    const runInitialCheck = async () => {
      if (mounted) {
        await checkConnection();
      }
    };
    
    void runInitialCheck();
    
    return () => {
      mounted = false;
    };
  }, [checkConnection]);

  // Set up event listeners and periodic checks
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Check server immediately when coming back online
      void checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsServerReachable(false);
    };

    // Set up browser online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up periodic health checks
    const interval = setInterval(
      () => void checkConnection(),
      isServerReachable ? CHECK_INTERVAL : RETRY_INTERVAL
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, isServerReachable]);

  const isConnected = isOnline && isServerReachable;

  return {
    isOnline,
    isServerReachable,
    isConnected,
    lastConnected,
    lastChecked,
    checkConnection,
  };
}
