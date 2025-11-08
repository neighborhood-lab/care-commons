/**
 * Sync Service - Orchestrates offline-first synchronization
 * 
 * This service:
 * - Monitors network connectivity
 * - Automatically syncs when online
 * - Processes the offline queue
 * - Handles sync conflicts
 * - Provides sync status to UI
 * 
 * Designed for home healthcare field workers who need reliable
 * offline operation with automatic sync when connectivity returns.
 */

import { database } from '../../db/index.js';
import { pullChanges, pushChanges, getSyncStatus } from './sync-api.js';
import type { SyncEntityType, SyncOperationType } from '@care-commons/core/browser';

export interface SyncServiceConfig {
  organizationId: string;
  userId: string;
  deviceId: string;
  autoSyncInterval?: number; // milliseconds, default 30000 (30 seconds)
  entities?: SyncEntityType[];
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  lastSyncError: string | null;
  pendingCount: number;
  conflictCount: number;
  failedCount: number;
}

type SyncStateListener = (state: SyncState) => void;

/**
 * Sync orchestration service
 * Singleton that manages all sync operations for the application
 */
export class SyncService {
  private config: SyncServiceConfig;
  private state: SyncState;
  private listeners: Set<SyncStateListener>;
  private autoSyncTimer: ReturnType<typeof setInterval> | null;
  private isInitialized: boolean;

  constructor(config: SyncServiceConfig) {
    this.config = {
      autoSyncInterval: 30000,
      entities: ['VISIT', 'EVV_RECORD', 'TIME_ENTRY', 'TASK', 'CLIENT', 'CAREGIVER'],
      ...config,
    };

    this.state = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastSyncAt: null,
      lastSyncError: null,
      pendingCount: 0,
      conflictCount: 0,
      failedCount: 0,
    };

    this.listeners = new Set();
    this.autoSyncTimer = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the sync service
   * Sets up network listeners and starts auto-sync
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('SyncService already initialized');
      return;
    }

    // Set up network event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }

    // Load initial sync status
    await this.loadSyncStatus();

    // Start auto-sync timer
    this.startAutoSync();

    // Sync immediately if online
    if (this.state.isOnline) {
      void this.sync();
    }

    this.isInitialized = true;
    console.log('[SyncService] Initialized', this.config);
  }

  /**
   * Shutdown the sync service
   * Cleans up listeners and timers
   */
  shutdown(): void {
    if (!this.isInitialized) return;

    // Remove network listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    // Stop auto-sync
    this.stopAutoSync();

    // Clear listeners
    this.listeners.clear();

    this.isInitialized = false;
    console.log('[SyncService] Shutdown');
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);

    // Immediately notify with current state
    listener(this.state);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Manually trigger sync
   */
  async sync(): Promise<void> {
    if (this.state.isSyncing) {
      console.log('[SyncService] Sync already in progress, skipping');
      return;
    }

    if (!this.state.isOnline) {
      console.log('[SyncService] Offline, cannot sync');
      return;
    }

    this.updateState({ isSyncing: true, lastSyncError: null });

    try {
      console.log('[SyncService] Starting sync...');

      // Step 1: Pull changes from server
      await this.pullFromServer();

      // Step 2: Push local changes to server
      await this.pushToServer();

      // Step 3: Update sync status
      await this.loadSyncStatus();

      this.updateState({
        isSyncing: false,
        lastSyncAt: Date.now(),
        lastSyncError: null,
      });

      console.log('[SyncService] Sync completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      this.updateState({
        isSyncing: false,
        lastSyncError: errorMessage,
      });

      console.error('[SyncService] Sync failed:', error);
    }
  }

  /**
   * Pull changes from server
   */
  private async pullFromServer(): Promise<void> {
    const lastPulledAt = this.state.lastSyncAt ?? 0;

    const response = await pullChanges({
      lastPulledAt,
      entities: this.config.entities ?? [],
      organizationId: this.config.organizationId,
    });

    // Apply changes to local database
    for (const change of response.changes) {
      await this.applyChangeToLocal(change);
    }

    console.log(`[SyncService] Pulled ${response.changes.length} changes from server`);
  }

  /**
   * Push local changes to server
   */
  private async pushToServer(): Promise<void> {
    // Get pending changes from local queue
    const queueItems = await database.write(async () => {
      const collection = database.get('sync_queue');
      const pending = await collection.query().fetch();
      return pending;
    });

    if (queueItems.length === 0) {
      console.log('[SyncService] No local changes to push');
      return;
    }

    // Convert queue items to sync changes
    const changes = queueItems.map((item: unknown) => {
      const queueItem = item as {
        id: string;
        entityType: string;
        entityId: string;
        operationType: string;
        payloadJson: string;
        createdAt: number;
        updatedAt: number;
      };

      return {
        id: queueItem.id,
        entityType: queueItem.entityType as SyncEntityType,
        entityId: queueItem.entityId,
        operationType: queueItem.operationType as 'CREATE' | 'UPDATE' | 'DELETE',
        data: JSON.parse(queueItem.payloadJson) as Record<string, unknown>,
        version: 1, // NOTE: Version tracking will be implemented with actual entity integration
        createdAt: queueItem.createdAt,
        updatedAt: queueItem.updatedAt,
      };
    });

    // Push to server
    const response = await pushChanges({
      changes,
      deviceId: this.config.deviceId,
      timestamp: Date.now(),
      organizationId: this.config.organizationId,
    });

    // Remove successfully synced changes from queue
    if (response.success && response.synced > 0) {
      await database.write(async () => {
        // NOTE: For now, we'll remove all items since we don't track which specific ones were synced
        // This will be improved when we add sync IDs to track individual changes
        for (const item of queueItems.slice(0, response.synced)) {
          if (typeof (item as { destroyPermanently?: () => Promise<void> }).destroyPermanently === 'function') {
            await (item as { destroyPermanently: () => Promise<void> }).destroyPermanently();
          }
        }
      });
    }

    // Handle conflicts
    if (response.conflicts.length > 0) {
      console.warn(`[SyncService] ${response.conflicts.length} conflicts detected`);
      // NOTE: Conflict handling UI will be implemented in admin dashboard
    }

    // Handle errors
    if (response.errors.length > 0) {
      console.error(`[SyncService] ${response.errors.length} errors during push`);
      // NOTE: Failed items remain in queue for retry
    }

    console.log(`[SyncService] Pushed ${response.synced} changes to server`);
  }

  /**
   * Apply a change from server to local database
   */
  private async applyChangeToLocal(change: {
    id: string;
    entityType: SyncEntityType;
    operationType: SyncOperationType;
    data: Record<string, unknown>;
    version: number;
    updatedAt: number;
    updatedBy: string;
  }): Promise<void> {
    // NOTE: This will be implemented when we integrate with actual entity models
    // For now, just log the change
    console.log('[SyncService] Would apply change:', change);
  }

  /**
   * Load sync status from server
   */
  private async loadSyncStatus(): Promise<void> {
    try {
      const status = await getSyncStatus();
      
      this.updateState({
        pendingCount: status.pendingCount,
        conflictCount: status.conflictCount,
        failedCount: status.failedCount,
      });
    } catch (error) {
      console.error('[SyncService] Failed to load sync status:', error);
    }
  }

  /**
   * Start auto-sync timer
   */
  private startAutoSync(): void {
    if (this.autoSyncTimer) return;

    this.autoSyncTimer = setInterval(() => {
      if (this.state.isOnline && !this.state.isSyncing) {
        void this.sync();
      }
    }, this.config.autoSyncInterval);

    console.log(`[SyncService] Auto-sync started (interval: ${this.config.autoSyncInterval}ms)`);
  }

  /**
   * Stop auto-sync timer
   */
  private stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      console.log('[SyncService] Auto-sync stopped');
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('[SyncService] Network online');
    this.updateState({ isOnline: true });
    
    // Sync immediately when coming back online
    void this.sync();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[SyncService] Network offline');
    this.updateState({ isOnline: false });
  };

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<SyncState>): void {
    this.state = { ...this.state, ...updates };
    
    // Notify all listeners
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

/**
 * Singleton instance
 */
let syncServiceInstance: SyncService | null = null;

/**
 * Initialize the global sync service
 */
export function initializeSyncService(config: SyncServiceConfig): SyncService {
  if (syncServiceInstance) {
    console.warn('[SyncService] Already initialized, shutting down previous instance');
    syncServiceInstance.shutdown();
  }

  syncServiceInstance = new SyncService(config);
  void syncServiceInstance.initialize();
  
  return syncServiceInstance;
}

/**
 * Get the global sync service instance
 */
export function getSyncService(): SyncService | null {
  return syncServiceInstance;
}

/**
 * Shutdown the global sync service
 */
export function shutdownSyncService(): void {
  if (syncServiceInstance) {
    syncServiceInstance.shutdown();
    syncServiceInstance = null;
  }
}
