/**
 * Offline Queue Service (Core Logic)
 * 
 * Platform-agnostic offline queue logic that can be used by both
 * web and mobile clients. Handles priority-based queuing,
 * retry logic with exponential backoff, and queue management.
 */

/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import type {
  OfflineQueueItem,
  SyncOperationType,
  SyncEntityType,
} from './types.js';

export interface OfflineQueueConfig {
  maxRetries: number;
  baseRetryDelay: number; // milliseconds
  maxRetryDelay: number; // milliseconds
}

export const DEFAULT_QUEUE_CONFIG: OfflineQueueConfig = {
  maxRetries: 5,
  baseRetryDelay: 2000, // 2 seconds
  maxRetryDelay: 60000, // 1 minute
};

/**
 * Priority levels for different operation types
 */
export const OPERATION_PRIORITIES: Record<string, number> = {
  CLOCK_IN: 100, // Highest priority - required for EVV compliance
  CLOCK_OUT: 90, // High priority - affects billing
  TASK_COMPLETE: 70,
  NOTE_CREATE: 50,
  UPDATE_EVV: 50,
  SYNC_VISIT: 30,
  DEFAULT: 10,
};

/**
 * Calculate priority for an operation
 */
export function calculatePriority(
  _operationType: SyncOperationType,
  entityType: SyncEntityType,
  metadata?: Record<string, unknown>
): number {
  // Check metadata for specific operation type
  const specificOp = metadata?.operationType as string | undefined;
  if (specificOp !== undefined && specificOp !== '' && OPERATION_PRIORITIES[specificOp] !== undefined) {
    return OPERATION_PRIORITIES[specificOp]!;
  }

  // High priority for EVV-related operations
  if (entityType === 'EVV_RECORD' || entityType === 'TIME_ENTRY') {
    return 80;
  }

  // Medium priority for visits and tasks
  if (entityType === 'VISIT' || entityType === 'TASK') {
    return 50;
  }

  // Lower priority for other entities
  return OPERATION_PRIORITIES.DEFAULT!;
}

/**
 * Calculate next retry time using exponential backoff
 */
export function calculateNextRetry(
  retryCount: number,
  config: OfflineQueueConfig = DEFAULT_QUEUE_CONFIG
): number {
  const delay = Math.min(
    config.baseRetryDelay * Math.pow(2, retryCount),
    config.maxRetryDelay
  );

  return Date.now() + delay;
}

/**
 * Check if an item should be retried
 */
export function shouldRetry(
  item: OfflineQueueItem,
  config: OfflineQueueConfig = DEFAULT_QUEUE_CONFIG
): boolean {
  const maxRetries = item.maxRetries ?? config.maxRetries;
  return item.retryCount < maxRetries;
}

/**
 * Check if an item is ready to retry
 */
export function isReadyToRetry(item: OfflineQueueItem): boolean {
  if (item.status !== 'RETRY') return false;
  if (item.nextRetryAt == null || item.nextRetryAt === 0) return true;
  return Date.now() >= item.nextRetryAt;
}

/**
 * Create a new queue item
 */
export function createQueueItem(
  operationType: SyncOperationType,
  entityType: SyncEntityType,
  entityId: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Omit<OfflineQueueItem, 'id'> {
  const now = Date.now();
  const priority = calculatePriority(operationType, entityType, metadata);

  return {
    operationType,
    entityType,
    entityId,
    payload,
    priority,
    retryCount: 0,
    maxRetries: DEFAULT_QUEUE_CONFIG.maxRetries,
    nextRetryAt: null,
    status: 'PENDING',
    errorMessage: null,
    errorDetails: null,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  };
}

/**
 * Update queue item for retry
 */
export function markForRetry(
  item: OfflineQueueItem,
  error: Error,
  config: OfflineQueueConfig = DEFAULT_QUEUE_CONFIG
): OfflineQueueItem {
  const newRetryCount = item.retryCount + 1;

  if (!shouldRetry(item, config)) {
    // Max retries exceeded - mark as failed
    return {
      ...item,
      status: 'FAILED',
      retryCount: newRetryCount,
      errorMessage: error.message,
      errorDetails: {
        error: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    };
  }

  // Schedule retry
  return {
    ...item,
    status: 'RETRY',
    retryCount: newRetryCount,
    nextRetryAt: calculateNextRetry(newRetryCount, config),
    errorMessage: error.message,
    errorDetails: {
      error: error.message,
      retryCount: newRetryCount,
      nextRetryAt: calculateNextRetry(newRetryCount, config),
    },
    updatedAt: Date.now(),
  };
}

/**
 * Mark queue item as synced
 */
export function markAsSynced(item: OfflineQueueItem): OfflineQueueItem {
  return {
    ...item,
    status: 'SYNCED',
    syncedAt: Date.now(),
    updatedAt: Date.now(),
    errorMessage: null,
    errorDetails: null,
  };
}

/**
 * Mark queue item as in progress
 */
export function markAsInProgress(item: OfflineQueueItem): OfflineQueueItem {
  return {
    ...item,
    status: 'IN_PROGRESS',
    updatedAt: Date.now(),
  };
}

/**
 * Sort queue items by priority and creation time
 */
export function sortQueueItems(items: OfflineQueueItem[]): OfflineQueueItem[] {
  return items.sort((a, b) => {
    // Higher priority first
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // Earlier created items first
    return a.createdAt - b.createdAt;
  });
}

/**
 * Filter items that are ready for processing
 */
export function getProcessableItems(
  items: OfflineQueueItem[]
): OfflineQueueItem[] {
  return items.filter(item => {
    if (item.status === 'PENDING') return true;
    if (item.status === 'RETRY') return isReadyToRetry(item);
    return false;
  });
}

/**
 * Group queue items by entity type for batch processing
 */
export function groupByEntityType(
  items: OfflineQueueItem[]
): Record<SyncEntityType, OfflineQueueItem[]> {
  const grouped: Partial<Record<SyncEntityType, OfflineQueueItem[]>> = {};

  for (const item of items) {
    const existing = grouped[item.entityType];
    if (existing == null) {
      grouped[item.entityType] = [];
    }
    grouped[item.entityType]!.push(item);
  }

  return grouped as Record<SyncEntityType, OfflineQueueItem[]>;
}
