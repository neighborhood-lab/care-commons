/**
 * useSyncStatus Hook
 * 
 * React hook for tracking synchronization status in real-time.
 * Monitors the sync queue and provides callbacks for manual sync triggers.
 */

import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../db/index.js';
import { Q } from '@nozbe/watermelondb';

export interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  isOnline: boolean;
}

export interface UseSyncStatusResult extends SyncStatus {
  syncNow: () => Promise<void>;
  clearFailed: () => Promise<void>;
}

/**
 * Hook to monitor sync status
 * 
 * @param pollInterval - How often to check sync status (milliseconds)
 * @returns Sync status and control functions
 */
export function useSyncStatus(pollInterval: number = 10000): UseSyncStatusResult {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
    lastSyncTime: null,
    isOnline: navigator.onLine,
  });

  /**
   * Load current sync status from database
   */
  const loadStatus = useCallback(async () => {
    try {
      const pending = await database
        .get('sync_queue')
        .query(Q.where('status', 'PENDING'))
        .fetchCount();

      const failed = await database
        .get('sync_queue')
        .query(Q.where('status', 'FAILED'))
        .fetchCount();

      const inProgress = await database
        .get('sync_queue')
        .query(Q.where('status', 'IN_PROGRESS'))
        .fetchCount();

      // Get last sync time from most recent synced item
      const lastSynced = await database
        .get('sync_queue')
        .query(
          Q.where('status', 'SYNCED'),
          Q.where('synced_at', Q.notEq(null)),
          Q.sortBy('synced_at', Q.desc),
          Q.take(1)
        )
        .fetch();

      const lastSyncTime = lastSynced[0]
        ? ((lastSynced[0] as unknown as { syncedAt: number }).syncedAt)
        : null;

      setStatus({
        pendingCount: pending,
        failedCount: failed,
        isSyncing: inProgress > 0,
        lastSyncTime,
        isOnline: navigator.onLine,
      });
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, []);

  /**
   * Trigger manual sync
   */
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      console.warn('Cannot sync while offline');
      return;
    }

    try {
      setStatus(prev => ({ ...prev, isSyncing: true }));
      
      // Call sync service
      // NOTE: This will be implemented when API endpoints are integrated
      console.log('Manual sync triggered');
      
      // Reload status after sync
      await loadStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [loadStatus]);

  /**
   * Clear all failed sync items
   */
  const clearFailed = useCallback(async () => {
    try {
      const failed = await database
        .get('sync_queue')
        .query(Q.where('status', 'FAILED'))
        .fetch();

      await database.write(async () => {
        for (const item of failed) {
          await item.destroyPermanently();
        }
      });

      await loadStatus();
    } catch (error) {
      console.error('Failed to clear failed items:', error);
    }
  }, [loadStatus]);

  /**
   * Set up polling and event listeners
   */
  useEffect(() => {
    // Initial load
    void loadStatus();

    // Poll for updates
    const interval = setInterval(() => {
      void loadStatus();
    }, pollInterval);

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      void loadStatus();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadStatus, pollInterval]);

  return {
    ...status,
    syncNow,
    clearFailed,
  };
}
