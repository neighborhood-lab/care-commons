/**
 * Optimistic Update Manager
 *
 * Provides optimistic UI updates with automatic rollback on failure.
 * Critical for maintaining responsive UX while caregivers work offline.
 *
 * Features:
 * - Immediate local updates with pending state
 * - Automatic rollback on sync failure
 * - Conflict detection and resolution
 * - Audit trail for compliance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../index';

/**
 * Status of an optimistic update
 */
export enum OptimisticUpdateStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  CONFLICT = 'conflict',
}

/**
 * Snapshot of record state before optimistic update
 */
export interface RecordSnapshot {
  recordId: string;
  recordType: string;
  previousState: any;
  timestamp: number;
}

/**
 * Optimistic update metadata
 */
export interface OptimisticUpdate {
  id: string;
  recordId: string;
  recordType: string;
  operation: 'create' | 'update' | 'delete';
  optimisticState: any;
  previousState: any | null;
  status: OptimisticUpdateStatus;
  createdAt: number;
  syncedAt?: number;
  failedAt?: number;
  errorMessage?: string;
  retryCount: number;
}

/**
 * Optimistic Update Manager
 *
 * Manages optimistic updates with automatic rollback and conflict resolution
 */
export class OptimisticUpdateManager {
  private static UPDATES_KEY = '@optimistic_updates';
  private static SNAPSHOTS_KEY = '@record_snapshots';

  /**
   * Apply an optimistic update to local database
   */
  static async applyUpdate(
    recordType: string,
    recordId: string,
    operation: 'create' | 'update' | 'delete',
    updates: any | null
  ): Promise<OptimisticUpdate> {
    // Create snapshot of current state
    const snapshot = await this.createSnapshot(recordType, recordId);

    // Generate update ID
    const updateId = this.generateUUID();

    // Create optimistic update metadata
    const optimisticUpdate: OptimisticUpdate = {
      id: updateId,
      recordId,
      recordType,
      operation,
      optimisticState: updates,
      previousState: snapshot?.previousState || null,
      status: OptimisticUpdateStatus.PENDING,
      createdAt: Date.now(),
      retryCount: 0,
    };

    // Store update metadata
    await this.saveUpdate(optimisticUpdate);

    // Apply update to database
    await this.applyToDatabase(recordType, recordId, operation, updates);

    console.log(`[OptimisticUpdate] Applied ${operation} to ${recordType}:${recordId}`);

    return optimisticUpdate;
  }

  /**
   * Mark optimistic update as synced
   */
  static async markSynced(updateId: string): Promise<void> {
    const updates = await this.getUpdates();
    const update = updates.find((u) => u.id === updateId);

    if (!update) {
      console.warn(`[OptimisticUpdate] Update ${updateId} not found`);
      return;
    }

    update.status = OptimisticUpdateStatus.SYNCED;
    update.syncedAt = Date.now();

    await this.saveUpdates(updates);

    // Clean up old synced updates (keep last 50 for audit trail)
    await this.cleanupSyncedUpdates();

    console.log(`[OptimisticUpdate] Marked ${updateId} as synced`);
  }

  /**
   * Mark optimistic update as failed and optionally rollback
   */
  static async markFailed(
    updateId: string,
    errorMessage: string,
    shouldRollback: boolean = true
  ): Promise<void> {
    const updates = await this.getUpdates();
    const update = updates.find((u) => u.id === updateId);

    if (!update) {
      console.warn(`[OptimisticUpdate] Update ${updateId} not found`);
      return;
    }

    update.status = OptimisticUpdateStatus.FAILED;
    update.failedAt = Date.now();
    update.errorMessage = errorMessage;
    update.retryCount++;

    if (shouldRollback) {
      await this.rollback(update);
      update.status = OptimisticUpdateStatus.ROLLED_BACK;
    }

    await this.saveUpdates(updates);

    console.log(
      `[OptimisticUpdate] Marked ${updateId} as failed${shouldRollback ? ' and rolled back' : ''}`
    );
  }

  /**
   * Rollback an optimistic update
   */
  static async rollback(update: OptimisticUpdate): Promise<void> {
    if (!update.previousState && update.operation !== 'create') {
      console.error(
        `[OptimisticUpdate] Cannot rollback ${update.id} - no previous state`
      );
      return;
    }

    await database.write(async () => {
      const collection = database.collections.get(update.recordType);

      try {
        switch (update.operation) {
          case 'create': {
            // Delete the optimistically created record
            const createdRecord = await collection.find(update.recordId);
            await createdRecord.markAsDeleted();
            break;
          }
          case 'update': {
            // Restore previous state
            const updatedRecord = await collection.find(update.recordId);
            await updatedRecord.update((record: any) => {
              Object.assign(record, update.previousState);
            });
            break;
          }
          case 'delete':
            // This is tricky - we can't un-delete in WatermelonDB
            // Log error for manual intervention
            console.error(
              `[OptimisticUpdate] Cannot rollback delete operation for ${update.recordId}`
            );
            break;
        }

        console.log(`[OptimisticUpdate] Rolled back ${update.id}`);
      } catch (error) {
        console.error(`[OptimisticUpdate] Rollback failed for ${update.id}:`, error);
        throw error;
      }
    });
  }

  /**
   * Rollback all pending updates (useful for conflict resolution)
   */
  static async rollbackAll(): Promise<number> {
    const updates = await this.getUpdates();
    const pendingUpdates = updates.filter(
      (u) => u.status === OptimisticUpdateStatus.PENDING
    );

    let rolledBack = 0;
    for (const update of pendingUpdates) {
      try {
        await this.rollback(update);
        update.status = OptimisticUpdateStatus.ROLLED_BACK;
        rolledBack++;
      } catch (error) {
        console.error(`[OptimisticUpdate] Failed to rollback ${update.id}:`, error);
      }
    }

    await this.saveUpdates(updates);

    console.log(`[OptimisticUpdate] Rolled back ${rolledBack} pending updates`);
    return rolledBack;
  }

  /**
   * Get all pending optimistic updates
   */
  static async getPendingUpdates(): Promise<OptimisticUpdate[]> {
    const updates = await this.getUpdates();
    return updates.filter((u) => u.status === OptimisticUpdateStatus.PENDING);
  }

  /**
   * Get optimistic updates for a specific record
   */
  static async getRecordUpdates(
    recordType: string,
    recordId: string
  ): Promise<OptimisticUpdate[]> {
    const updates = await this.getUpdates();
    return updates.filter(
      (u) => u.recordType === recordType && u.recordId === recordId
    );
  }

  /**
   * Check if a record has pending updates
   */
  static async hasPendingUpdates(
    recordType: string,
    recordId: string
  ): Promise<boolean> {
    const updates = await this.getRecordUpdates(recordType, recordId);
    return updates.some((u) => u.status === OptimisticUpdateStatus.PENDING);
  }

  /**
   * Get statistics about optimistic updates
   */
  static async getStats(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
    rolledBack: number;
  }> {
    const updates = await this.getUpdates();

    return {
      total: updates.length,
      pending: updates.filter((u) => u.status === OptimisticUpdateStatus.PENDING).length,
      synced: updates.filter((u) => u.status === OptimisticUpdateStatus.SYNCED).length,
      failed: updates.filter((u) => u.status === OptimisticUpdateStatus.FAILED).length,
      rolledBack: updates.filter((u) => u.status === OptimisticUpdateStatus.ROLLED_BACK)
        .length,
    };
  }

  /**
   * Clear all optimistic updates (destructive)
   */
  static async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(this.UPDATES_KEY);
    await AsyncStorage.removeItem(this.SNAPSHOTS_KEY);
    console.log('[OptimisticUpdate] Cleared all updates and snapshots');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Create snapshot of record before update
   */
  private static async createSnapshot(
    recordType: string,
    recordId: string
  ): Promise<RecordSnapshot | null> {
    try {
      const collection = database.collections.get(recordType);
      const record = await collection.find(recordId);

      const snapshot: RecordSnapshot = {
        recordId,
        recordType,
        previousState: record._raw,
        timestamp: Date.now(),
      };

      // Save snapshot
      const snapshots = await this.getSnapshots();
      snapshots.set(`${recordType}:${recordId}`, snapshot);
      await this.saveSnapshots(snapshots);

      return snapshot;
    } catch {
      // Record doesn't exist (probably a create operation)
      return null;
    }
  }

  /**
   * Apply update to database
   */
  private static async applyToDatabase(
    recordType: string,
    recordId: string,
    operation: 'create' | 'update' | 'delete',
    updates: any
  ): Promise<void> {
    await database.write(async () => {
      const collection = database.collections.get(recordType);

      switch (operation) {
        case 'create':
          await collection.create((record: any) => {
            record._raw.id = recordId;
            Object.assign(record, updates);
          });
          break;

        case 'update': {
          const record = await collection.find(recordId);
          await record.update((r: any) => {
            Object.assign(r, updates);
          });
          break;
        }
        case 'delete': {
          const recordToDelete = await collection.find(recordId);
          await recordToDelete.markAsDeleted();
          break;
        }
      }
    });
  }

  /**
   * Get all updates from storage
   */
  private static async getUpdates(): Promise<OptimisticUpdate[]> {
    const updatesJson = await AsyncStorage.getItem(this.UPDATES_KEY);
    return updatesJson ? JSON.parse(updatesJson) : [];
  }

  /**
   * Save updates to storage
   */
  private static async saveUpdates(updates: OptimisticUpdate[]): Promise<void> {
    await AsyncStorage.setItem(this.UPDATES_KEY, JSON.stringify(updates));
  }

  /**
   * Save single update
   */
  private static async saveUpdate(update: OptimisticUpdate): Promise<void> {
    const updates = await this.getUpdates();
    updates.push(update);
    await this.saveUpdates(updates);
  }

  /**
   * Get snapshots map
   */
  private static async getSnapshots(): Promise<Map<string, RecordSnapshot>> {
    const snapshotsJson = await AsyncStorage.getItem(this.SNAPSHOTS_KEY);
    if (!snapshotsJson) {
      return new Map();
    }
    const snapshotsArray = JSON.parse(snapshotsJson);
    return new Map(snapshotsArray);
  }

  /**
   * Save snapshots map
   */
  private static async saveSnapshots(
    snapshots: Map<string, RecordSnapshot>
  ): Promise<void> {
    const snapshotsArray = Array.from(snapshots.entries());
    await AsyncStorage.setItem(this.SNAPSHOTS_KEY, JSON.stringify(snapshotsArray));
  }

  /**
   * Clean up old synced updates (keep last 50 for audit)
   */
  private static async cleanupSyncedUpdates(): Promise<void> {
    const updates = await this.getUpdates();
    const syncedUpdates = updates
      .filter((u) => u.status === OptimisticUpdateStatus.SYNCED)
      .sort((a, b) => (b.syncedAt || 0) - (a.syncedAt || 0));

    if (syncedUpdates.length > 50) {
      const toKeep = syncedUpdates.slice(0, 50);
      const otherUpdates = updates.filter(
        (u) => u.status !== OptimisticUpdateStatus.SYNCED
      );
      await this.saveUpdates([...toKeep, ...otherUpdates]);
      console.log(
        `[OptimisticUpdate] Cleaned up ${syncedUpdates.length - 50} old synced updates`
      );
    }
  }

  /**
   * Generate UUID
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
