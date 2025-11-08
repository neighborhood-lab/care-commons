/**
 * useOfflineQueue Hook
 * 
 * React hook for queueing operations when offline.
 * Provides functions to queue operations and track their status.
 */

import { useCallback } from 'react';
import { database } from '../../../db/index.js';
import {
  createQueueItem,
  type SyncOperationType,
  type SyncEntityType,
} from '@care-commons/core/browser';

export interface QueueOperationOptions {
  operationType: SyncOperationType;
  entityType: SyncEntityType;
  entityId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UseOfflineQueueResult {
  queueOperation: (options: QueueOperationOptions) => Promise<string>;
  isOnline: boolean;
}

/**
 * Hook to interact with the offline queue
 * 
 * @returns Functions for queueing operations
 */
export function useOfflineQueue(): UseOfflineQueueResult {
  const isOnline = navigator.onLine;

  /**
   * Queue an operation for later sync
   */
  const queueOperation = useCallback(async (options: QueueOperationOptions): Promise<string> => {
    const { operationType, entityType, entityId, data, metadata } = options;

    // Create queue item
    const queueItem = createQueueItem(
      operationType,
      entityType,
      entityId,
      data,
      metadata
    );

    // Generate unique ID
    // eslint-disable-next-line sonarjs/pseudo-random
    const id = `queue_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    // Save to database
    await database.write(async () => {
      await database.get('sync_queue').create((record: unknown) => {
        const r = record as {
          id: string;
          operationType: string;
          entityType: string;
          entityId: string;
          payloadJson: string;
          priority: number;
          retryCount: number;
          maxRetries: number;
          nextRetryAt: number | null;
          status: string;
          errorMessage: string | null;
          errorDetailsJson: string | null;
          createdAt: number;
          updatedAt: number;
          syncedAt: number | null;
        };
        
        r.id = id;
        r.operationType = queueItem.operationType;
        r.entityType = queueItem.entityType;
        r.entityId = queueItem.entityId;
        r.payloadJson = JSON.stringify(queueItem.payload);
        r.priority = queueItem.priority;
        r.retryCount = queueItem.retryCount;
        r.maxRetries = queueItem.maxRetries;
        r.nextRetryAt = queueItem.nextRetryAt;
        r.status = queueItem.status;
        r.errorMessage = queueItem.errorMessage;
        r.errorDetailsJson = queueItem.errorDetails ? JSON.stringify(queueItem.errorDetails) : null;
        r.createdAt = queueItem.createdAt;
        r.updatedAt = queueItem.updatedAt;
        r.syncedAt = queueItem.syncedAt;
      });
    });

    // Trigger sync if online
    if (isOnline) {
      // NOTE: This would trigger the sync service when integrated
      console.log('Queued operation, triggering sync:', id);
    }

    return id;
  }, [isOnline]);

  return {
    queueOperation,
    isOnline,
  };
}
