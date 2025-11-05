/**
 * Sync Status Badge Component
 * 
 * Displays the current sync status with visual indicators:
 * - Green: All synced
 * - Yellow/Orange: Syncing in progress
 * - Red: Sync failed or offline with pending items
 * - Gray: Offline, no pending items
 * 
 * Critical for caregivers to understand if their data is safely synced.
 */

import { useState, useEffect } from 'react';
import { CheckCircle, CloudOff, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';
import { Badge } from '../../core/components/Badge.js';
import { database } from '../../db/index.js';
import { Q } from '@nozbe/watermelondb';

interface SyncStatus {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  failedCount: number;
  isOnline: boolean;
}

export function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null,
    failedCount: 0,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    // Load sync status from database
    const loadStatus = async () => {
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
          isSyncing: inProgress > 0,
          lastSyncTime,
          failedCount: failed,
          isOnline: navigator.onLine,
        });
      } catch (error) {
        console.error('Failed to load sync status:', error);
      }
    };

    void loadStatus();

    // Update status every 10 seconds
    const interval = setInterval(() => {
      void loadStatus();
    }, 10000);

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
  }, []);

  const handleSyncNow = async () => {
    // Trigger manual sync
    // NOTE: This would call the sync service when integrated with API endpoints
    console.log('Manual sync triggered');
  };

  // Determine badge variant and icon based on status
  if (!status.isOnline) {
    if (status.pendingCount > 0 || status.failedCount > 0) {
      return (
        <Badge variant="warning" className="flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline - {status.pendingCount + status.failedCount} pending</span>
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-2">
        <CloudOff className="w-4 h-4" />
        <span>Offline</span>
      </Badge>
    );
  }

  if (status.failedCount > 0) {
    return (
      <Badge variant="error" className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{status.failedCount} sync failed</span>
        <button
          onClick={() => {
            void handleSyncNow();
          }}
          className="ml-2 text-xs underline hover:no-underline"
          type="button"
        >
          Retry
        </button>
      </Badge>
    );
  }

  if (status.isSyncing) {
    return (
      <Badge variant="warning" className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Syncing {status.pendingCount} items...</span>
      </Badge>
    );
  }

  if (status.pendingCount > 0) {
    return (
      <Badge variant="info" className="flex items-center gap-2">
        <CloudOff className="w-4 h-4" />
        <span>{status.pendingCount} pending sync</span>
        <button
          onClick={handleSyncNow}
          className="ml-2 text-xs underline hover:no-underline"
          type="button"
        >
          Sync Now
        </button>
      </Badge>
    );
  }

  // All synced
  const timeAgo = status.lastSyncTime
    ? formatTimeAgo(status.lastSyncTime)
    : 'never';

  return (
    <Badge variant="success" className="flex items-center gap-2">
      <CheckCircle className="w-4 h-4" />
      <span>Synced {timeAgo}</span>
    </Badge>
  );
}

/**
 * Format timestamp as "X minutes ago", "X hours ago", etc.
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 0) return `${seconds}s ago`;
  return 'just now';
}
