/**
 * useSyncStatus Hook
 * 
 * React hook for tracking synchronization status in real-time.
 * Subscribes to the global SyncService and provides status updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSyncService } from '../../services/sync-service.js';
import type { SyncState } from '../../services/sync-service.js';

export interface UseSyncStatusResult {
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  lastSyncError: string | null;
  isOnline: boolean;
  syncNow: () => Promise<void>;
}

/**
 * Hook to monitor sync status
 * 
 * Subscribes to the global SyncService and provides status updates
 * and manual sync trigger.
 * 
 * @returns Sync status and control functions
 */
export function useSyncStatus(): UseSyncStatusResult {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncAt: null,
    lastSyncError: null,
    pendingCount: 0,
    conflictCount: 0,
    failedCount: 0,
  });

  /**
   * Subscribe to sync service state changes
   */
  useEffect(() => {
    const syncService = getSyncService();
    
    if (!syncService) {
      console.warn('[useSyncStatus] SyncService not initialized');
      return;
    }

    // Subscribe to state changes
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });

    return unsubscribe;
  }, []);

  /**
   * Trigger manual sync
   */
  const syncNow = useCallback(async () => {
    const syncService = getSyncService();
    
    if (!syncService) {
      console.error('[useSyncStatus] SyncService not initialized');
      return;
    }

    await syncService.sync();
  }, []);

  return {
    pendingCount: syncState.pendingCount,
    failedCount: syncState.failedCount,
    conflictCount: syncState.conflictCount,
    isSyncing: syncState.isSyncing,
    lastSyncTime: syncState.lastSyncAt,
    lastSyncError: syncState.lastSyncError,
    isOnline: syncState.isOnline,
    syncNow,
  };
}
