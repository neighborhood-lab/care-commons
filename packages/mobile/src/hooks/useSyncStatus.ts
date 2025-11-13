import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncManager } from '../database/sync/sync-manager';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    const interval = setInterval(() => {
      setIsSyncing(syncManager.isSyncInProgress());
      setLastSyncTime(syncManager.getLastSyncTime());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const manualSync = async () => {
    await syncManager.performSync();
  };

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    manualSync
  };
}
