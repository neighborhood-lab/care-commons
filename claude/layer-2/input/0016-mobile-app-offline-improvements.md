# Task 0016: Mobile App - Enhanced Offline Capabilities and Sync Improvements

**Priority**: 🟠 HIGH
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 8-10 hours

## Context

The mobile app has offline-first foundations with WatermelonDB, but needs enhanced offline capabilities, conflict resolution, and better sync reliability for production use.

## Goal

- 99.5%+ offline sync success rate
- Robust conflict resolution
- Better offline indicators and queuing
- Comprehensive offline testing

## Task

### 1. Implement Robust Conflict Resolution

**File**: `packages/mobile/src/database/sync/conflict-resolver.ts`

```typescript
export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolvedRecord: any;
}

export class ConflictResolver {
  resolve<T extends Model>(
    clientRecord: T,
    serverRecord: T,
    recordType: string
  ): ConflictResolution {
    // Default strategy: last-write-wins (check updated_at)
    if (clientRecord.updatedAt > serverRecord.updatedAt) {
      return {
        strategy: 'client-wins',
        resolvedRecord: clientRecord
      };
    }

    if (serverRecord.updatedAt > clientRecord.updatedAt) {
      return {
        strategy: 'server-wins',
        resolvedRecord: serverRecord
      };
    }

    // Same timestamp - use smart merge for specific record types
    switch (recordType) {
      case 'visit':
        return this.resolveVisitConflict(clientRecord, serverRecord);
      case 'task':
        return this.resolveTaskConflict(clientRecord, serverRecord);
      default:
        // Default to server-wins for safety
        return {
          strategy: 'server-wins',
          resolvedRecord: serverRecord
        };
    }
  }

  private resolveVisitConflict(client: any, server: any): ConflictResolution {
    // For visits, merge non-conflicting fields
    // Server wins for core fields (scheduled_date, client, caregiver)
    // Client wins for documentation (notes, tasks_completed)
    return {
      strategy: 'merge',
      resolvedRecord: {
        ...server,
        care_notes: client.care_notes || server.care_notes,
        tasks_completed: client.tasks_completed || server.tasks_completed,
        check_in_time: client.check_in_time || server.check_in_time,
        check_out_time: client.check_out_time || server.check_out_time
      }
    };
  }

  private resolveTaskConflict(client: any, server: any): ConflictResolution {
    // For tasks, if client marked complete, client wins
    if (client.status === 'completed' && server.status !== 'completed') {
      return {
        strategy: 'client-wins',
        resolvedRecord: client
      };
    }

    return {
      strategy: 'server-wins',
      resolvedRecord: server
    };
  }
}
```

### 2. Enhance Sync Manager

**File**: `packages/mobile/src/database/sync/sync-manager.ts`

```typescript
import NetInfo from '@react-native-community/netinfo';
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../index';

export class SyncManager {
  private syncInProgress = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private lastSyncTimestamp: number | null = null;
  private syncRetryCount = 0;
  private maxRetries = 3;

  async initialize() {
    // Listen for network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.syncInProgress) {
        this.performSync();
      }
    });

    // Periodic sync every 5 minutes if connected
    setInterval(() => {
      this.performSync();
    }, 5 * 60 * 1000);
  }

  async performSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return { success: false, error: 'Sync in progress' };
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No network connection, skipping sync');
      return { success: false, error: 'No network' };
    }

    this.syncInProgress = true;

    try {
      await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          const response = await fetch(`${API_URL}/sync/pull`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
              lastPulledAt,
              schemaVersion,
              migration
            })
          });

          if (!response.ok) {
            throw new Error(`Sync pull failed: ${response.status}`);
          }

          const { changes, timestamp } = await response.json();
          return { changes, timestamp };
        },

        pushChanges: async ({ changes, lastPulledAt }) => {
          const response = await fetch(`${API_URL}/sync/push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
              changes,
              lastPulledAt
            })
          });

          if (!response.ok) {
            throw new Error(`Sync push failed: ${response.status}`);
          }

          // Handle conflicts
          const { conflicts } = await response.json();
          if (conflicts && conflicts.length > 0) {
            await this.resolveConflicts(conflicts);
          }
        },

        migrationsEnabledAtVersion: 1
      });

      this.lastSyncTimestamp = Date.now();
      this.syncRetryCount = 0;

      console.log('Sync completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Sync failed:', error);

      // Retry with exponential backoff
      if (this.syncRetryCount < this.maxRetries) {
        this.syncRetryCount++;
        const retryDelay = Math.pow(2, this.syncRetryCount) * 1000;

        console.log(`Retrying sync in ${retryDelay}ms (attempt ${this.syncRetryCount})`);

        setTimeout(() => {
          this.performSync();
        }, retryDelay);
      }

      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async resolveConflicts(conflicts: any[]) {
    const resolver = new ConflictResolver();

    for (const conflict of conflicts) {
      const resolution = resolver.resolve(
        conflict.clientRecord,
        conflict.serverRecord,
        conflict.table
      );

      // Apply resolution
      await database.write(async () => {
        const collection = database.collections.get(conflict.table);
        const record = await collection.find(conflict.id);
        await record.update(record => {
          Object.assign(record, resolution.resolvedRecord);
        });
      });

      console.log(`Resolved conflict for ${conflict.table}:${conflict.id} using ${resolution.strategy}`);
    }
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTimestamp ? new Date(this.lastSyncTimestamp) : null;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const syncManager = new SyncManager();
```

### 3. Add Offline Queue Management

**File**: `packages/mobile/src/database/sync/offline-queue.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QueuedAction {
  id: string;
  type: 'visit-check-in' | 'visit-check-out' | 'task-complete' | 'care-note';
  payload: any;
  timestamp: number;
  retries: number;
}

export class OfflineQueue {
  private static QUEUE_KEY = '@offline_queue';

  static async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) {
    const queue = await this.getQueue();

    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    };

    queue.push(queuedAction);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

    console.log(`Queued action: ${action.type}`);
  }

  static async processQueue() {
    const queue = await this.getQueue();

    if (queue.length === 0) {
      return;
    }

    console.log(`Processing ${queue.length} queued actions`);

    const processed: string[] = [];
    const failed: QueuedAction[] = [];

    for (const action of queue) {
      try {
        await this.executeAction(action);
        processed.push(action.id);
      } catch (error) {
        console.error(`Failed to execute ${action.type}:`, error);

        if (action.retries < 3) {
          failed.push({ ...action, retries: action.retries + 1 });
        } else {
          console.error(`Max retries exceeded for ${action.id}, discarding`);
        }
      }
    }

    // Update queue
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(failed));

    console.log(`Processed ${processed.length} actions, ${failed.length} failed`);
  }

  private static async executeAction(action: QueuedAction) {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/${action.type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(action.payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  private static async getQueue(): Promise<QueuedAction[]> {
    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  }

  static async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  static async clearQueue() {
    await AsyncStorage.removeItem(this.QUEUE_KEY);
  }
}
```

### 4. Add Offline Indicator Component

**File**: `packages/mobile/src/components/OfflineIndicator.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncManager } from '../database/sync/sync-manager';
import { OfflineQueue } from '../database/sync/offline-queue';

export function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);

      if (state.isConnected) {
        // When coming back online, process queue
        OfflineQueue.processQueue();
      }
    });

    // Update queue size periodically
    const interval = setInterval(async () => {
      const size = await OfflineQueue.getQueueSize();
      setQueueSize(size);
      setIsSyncing(syncManager.isSyncInProgress());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isConnected && queueSize === 0 && !isSyncing) {
    return null; // Don't show anything when online and synced
  }

  return (
    <View
      style={{
        backgroundColor: isConnected ? '#fbbf24' : '#ef4444',
        padding: 8,
        alignItems: 'center'
      }}
    >
      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
        {!isConnected && '📴 Offline Mode - Changes will sync when online'}
        {isConnected && isSyncing && '🔄 Syncing...'}
        {isConnected && !isSyncing && queueSize > 0 && `⏳ ${queueSize} actions pending sync`}
      </Text>
    </View>
  );
}
```

### 5. Add Sync Status Hook

**File**: `packages/mobile/src/hooks/useSyncStatus.ts`

```typescript
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
```

### 6. Add Offline Testing Support

**File**: `packages/mobile/src/utils/offline-simulator.ts`

```typescript
// Development tool for testing offline scenarios
export class OfflineSimulator {
  private static isSimulatingOffline = false;

  static enable() {
    this.isSimulatingOffline = true;
    console.warn('🔴 OFFLINE MODE SIMULATED');

    // Intercept fetch to simulate network failures
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      if (this.isSimulatingOffline) {
        throw new Error('Network request failed (simulated offline)');
      }
      return originalFetch(...args);
    };
  }

  static disable() {
    this.isSimulatingOffline = false;
    console.log('✅ OFFLINE MODE DISABLED');
  }

  static toggle() {
    if (this.isSimulatingOffline) {
      this.disable();
    } else {
      this.enable();
    }
  }

  static isActive() {
    return this.isSimulatingOffline;
  }
}

// Add debug menu in development
if (__DEV__) {
  // @ts-ignore
  global.toggleOffline = () => OfflineSimulator.toggle();
}
```

### 7. Add Comprehensive Offline Tests

**File**: `packages/mobile/src/__tests__/offline-sync.test.ts`

```typescript
describe('Offline Sync', () => {
  test('should queue visit check-in when offline', async () => {
    // Simulate offline
    NetInfo.fetch.mockResolvedValue({ isConnected: false });

    await checkInToVisit('visit-123');

    const queueSize = await OfflineQueue.getQueueSize();
    expect(queueSize).toBe(1);
  });

  test('should process queue when coming back online', async () => {
    // Add items to queue
    await OfflineQueue.enqueue({
      type: 'visit-check-in',
      payload: { visitId: 'visit-123' }
    });

    // Simulate coming back online
    NetInfo.fetch.mockResolvedValue({ isConnected: true });
    await OfflineQueue.processQueue();

    const queueSize = await OfflineQueue.getQueueSize();
    expect(queueSize).toBe(0);
  });

  test('should resolve conflicts with last-write-wins', async () => {
    const clientRecord = { id: '123', updatedAt: new Date('2024-01-02') };
    const serverRecord = { id: '123', updatedAt: new Date('2024-01-01') };

    const resolution = new ConflictResolver().resolve(
      clientRecord,
      serverRecord,
      'visit'
    );

    expect(resolution.strategy).toBe('client-wins');
    expect(resolution.resolvedRecord).toEqual(clientRecord);
  });

  test('should retry failed sync with exponential backoff', async () => {
    // Mock sync failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await syncManager.performSync();

    // Should have scheduled retry
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
  });
});
```

### 8. Add Data Integrity Checks

**File**: `packages/mobile/src/database/sync/integrity-checker.ts`

```typescript
export class IntegrityChecker {
  static async verifyDatabase() {
    const issues: string[] = [];

    // Check for orphaned records
    const orphanedVisits = await database
      .get('visits')
      .query(Q.where('client_id', Q.notIn(await getClientIds())))
      .fetch();

    if (orphanedVisits.length > 0) {
      issues.push(`Found ${orphanedVisits.length} orphaned visits`);
    }

    // Check for invalid timestamps
    const futureVisits = await database
      .get('visits')
      .query(Q.where('scheduled_date', Q.gt(addDays(new Date(), 365))))
      .fetch();

    if (futureVisits.length > 0) {
      issues.push(`Found ${futureVisits.length} visits scheduled >1 year in future`);
    }

    // Check for duplicate records
    const duplicates = await this.findDuplicateRecords();
    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate records`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  static async repair() {
    // Remove orphaned records
    // Merge duplicates
    // Fix invalid timestamps
    console.log('Database repair completed');
  }
}
```

## Acceptance Criteria

- [ ] Conflict resolution implemented with multiple strategies
- [ ] Sync manager with retry logic and exponential backoff
- [ ] Offline queue for pending actions
- [ ] Offline indicator component in UI
- [ ] Sync status hook for components
- [ ] Offline simulator for testing
- [ ] Comprehensive offline tests (>80% coverage)
- [ ] Data integrity checker
- [ ] 99.5%+ sync success rate in testing
- [ ] Works reliably with intermittent connectivity
- [ ] User never loses data

## Testing Scenarios

1. **Complete Offline**: Perform full visit workflow offline, verify syncs when online
2. **Intermittent Connectivity**: Toggle network on/off during visit, verify no data loss
3. **Conflict Resolution**: Modify same record on device and server, verify merge
4. **Queue Overflow**: Queue 50+ actions, verify all process successfully
5. **Sync Failure**: Simulate server error, verify retries work
6. **App Restart**: Queue actions, kill app, restart, verify queue persists

## Reference

- WatermelonDB Sync: https://nozbe.github.io/WatermelonDB/Advanced/Sync.html
- NetInfo: https://github.com/react-native-netinfo/react-native-netinfo
- Offline-first patterns: https://offlinefirst.org/
