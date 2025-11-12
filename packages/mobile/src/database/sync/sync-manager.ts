import NetInfo from '@react-native-community/netinfo';
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../index';
import { ConflictResolver } from './conflict-resolver';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface SyncResult {
  success: boolean;
  error?: string;
  changesCount?: number;
}

interface SyncHistoryEntry {
  timestamp: Date;
  success: boolean;
  error?: string;
  changesCount?: number;
}

// Helper function to get auth token (to be implemented)
async function getAuthToken(): Promise<string> {
  // This should integrate with your auth service
  // For now, return empty string
  return '';
}

export class SyncManager {
  private syncInProgress = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private lastSyncTimestamp: number | null = null;
  private syncRetryCount = 0;
  private maxRetries = 3;
  private syncHistory: SyncHistoryEntry[] = [];
  private periodicSyncInterval: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;

  async initialize() {
    // Listen for network changes
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.syncInProgress) {
        this.performSync();
      }
    });

    // Periodic sync every 5 minutes if connected
    this.periodicSyncInterval = setInterval(() => {
      this.performSync();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup timers and listeners - call when app unmounts or user logs out
   */
  cleanup() {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = null;
    }
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
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
      let totalChanges = 0;
      
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
          
          // Count changes
          if (changes) {
            Object.values(changes).forEach((tableChanges: any) => {
              if (tableChanges?.created) totalChanges += tableChanges.created.length;
              if (tableChanges?.updated) totalChanges += tableChanges.updated.length;
              if (tableChanges?.deleted) totalChanges += tableChanges.deleted.length;
            });
          }
          
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

      // Record successful sync in history
      this.addToHistory({
        timestamp: new Date(),
        success: true,
        changesCount: totalChanges,
      });

      console.log('Sync completed successfully');
      return { success: true, changesCount: totalChanges };
    } catch (error) {
      console.error('Sync failed:', error);

      // Record failed sync in history
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addToHistory({
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      });

      // Retry with exponential backoff
      if (this.syncRetryCount < this.maxRetries) {
        this.syncRetryCount++;
        const retryDelay = Math.pow(2, this.syncRetryCount) * 1000;

        console.log(`Retrying sync in ${retryDelay}ms (attempt ${this.syncRetryCount})`);

        setTimeout(() => {
          this.performSync();
        }, retryDelay);
      }

      return { success: false, error: errorMessage };
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
        await record.update((record: any) => {
          Object.assign(record, resolution.resolvedRecord);
        });
      });

      console.log(`Resolved conflict for ${conflict.table}:${conflict.id} using ${resolution.strategy}`);
    }
  }

  private addToHistory(entry: SyncHistoryEntry) {
    this.syncHistory.unshift(entry);
    // Keep only last 20 entries
    if (this.syncHistory.length > 20) {
      this.syncHistory = this.syncHistory.slice(0, 20);
    }
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTimestamp ? new Date(this.lastSyncTimestamp) : null;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  getSyncHistory(): SyncHistoryEntry[] {
    return [...this.syncHistory];
  }
}

export const syncManager = new SyncManager();
