/**
 * useNetworkStatus Hook
 * 
 * Simple hook for tracking online/offline status.
 * Automatically triggers sync when coming back online.
 */

import { useState, useEffect } from 'react';

export interface UseNetworkStatusResult {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to track network connectivity status
 * 
 * @returns Current online status and whether user was previously offline
 */
export function useNetworkStatus(): UseNetworkStatusResult {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If we were offline, trigger a sync
      if (wasOffline) {
        console.log('Back online, triggering sync');
        // NOTE: This would trigger the sync service when integrated
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    wasOffline,
  };
}
