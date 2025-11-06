/**
 * Sync Utilities
 *
 * Helper functions for offline synchronization, conflict resolution,
 * and queue management.
 */

import type { OfflineSyncQueue, SyncPriority, ConflictStrategy } from '../types/offline-sync';

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(
  retryCount: number,
  baseDelayMs: number = 1000,
  multiplier: number = 2,
  maxDelayMs: number = 60000
): number {
  const delay = baseDelayMs * Math.pow(multiplier, retryCount);
  return Math.min(delay, maxDelayMs);
}

/**
 * Calculate next retry time
 */
export function calculateNextRetryTime(
  retryCount: number,
  baseDelayMs: number = 1000,
  multiplier: number = 2
): Date {
  const delay = calculateBackoff(retryCount, baseDelayMs, multiplier);
  return new Date(Date.now() + delay);
}

/**
 * Sort sync queue items by priority and sequence
 */
export function sortQueueByPriority(items: OfflineSyncQueue[]): OfflineSyncQueue[] {
  const priorityOrder: Record<SyncPriority, number> = {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
    BACKGROUND: 5,
  };

  return [...items].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by sequence number
    return a.sequenceNumber - b.sequenceNumber;
  });
}

/**
 * Check if operation dependencies are met
 */
export function areDependenciesMet(
  operation: OfflineSyncQueue,
  allOperations: OfflineSyncQueue[]
): boolean {
  if (!operation.dependsOn || operation.dependsOn.length === 0) {
    return true;
  }

  const operationsMap = new Map(allOperations.map((op) => [op.operationId, op]));

  return operation.dependsOn.every((depId) => {
    const dep = operationsMap.get(depId);
    return dep && dep.status === 'COMPLETED';
  });
}

/**
 * Detect field-level conflicts between two data versions
 */
export function detectFieldConflicts(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>
): Array<{
  field: string;
  clientValue: unknown;
  serverValue: unknown;
}> {
  const conflicts: Array<{
    field: string;
    clientValue: unknown;
    serverValue: unknown;
  }> = [];

  // Check all client fields
  for (const key in clientData) {
    if (clientData[key] !== serverData[key]) {
      conflicts.push({
        field: key,
        clientValue: clientData[key],
        serverValue: serverData[key],
      });
    }
  }

  // Check for fields only in server data
  for (const key in serverData) {
    if (!(key in clientData)) {
      conflicts.push({
        field: key,
        clientValue: undefined,
        serverValue: serverData[key],
      });
    }
  }

  return conflicts;
}

/**
 * Apply conflict resolution strategy
 */
export function applyConflictResolution(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  strategy: ConflictStrategy,
  clientTimestamp: Date,
  serverTimestamp: Date
): Record<string, unknown> {
  switch (strategy) {
    case 'CLIENT_WINS':
      return clientData;

    case 'SERVER_WINS':
      return serverData;

    case 'NEWEST_WINS':
      return clientTimestamp > serverTimestamp ? clientData : serverData;

    case 'FIELD_LEVEL_MERGE':
      return mergeFieldLevel(clientData, serverData, clientTimestamp, serverTimestamp);

    case 'MANUAL':
      throw new Error('Manual conflict resolution required');

    case 'CUSTOM':
      throw new Error('Custom conflict resolution not implemented');

    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
  }
}

/**
 * Merge data at field level (newest field wins)
 */
function mergeFieldLevel(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  clientTimestamp: Date,
  serverTimestamp: Date
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  // Start with all server fields
  for (const key in serverData) {
    merged[key] = serverData[key];
  }

  // Overlay client fields if client is newer
  if (clientTimestamp > serverTimestamp) {
    for (const key in clientData) {
      merged[key] = clientData[key];
    }
  }

  return merged;
}

/**
 * Calculate sync statistics for a set of operations
 */
export function calculateSyncStats(operations: OfflineSyncQueue[]): {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  conflicted: number;
  byPriority: Record<SyncPriority, number>;
  byEntityType: Record<string, number>;
} {
  const stats = {
    total: operations.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    conflicted: 0,
    byPriority: {
      CRITICAL: 0,
      HIGH: 0,
      NORMAL: 0,
      LOW: 0,
      BACKGROUND: 0,
    } as Record<SyncPriority, number>,
    byEntityType: {} as Record<string, number>,
  };

  for (const op of operations) {
    // Count by status
    switch (op.status) {
      case 'PENDING':
        stats.pending++;
        break;
      case 'IN_PROGRESS':
        stats.inProgress++;
        break;
      case 'COMPLETED':
        stats.completed++;
        break;
      case 'FAILED':
        stats.failed++;
        break;
      case 'CONFLICT':
        stats.conflicted++;
        break;
    }

    // Count by priority
    stats.byPriority[op.priority]++;

    // Count by entity type
    if (!stats.byEntityType[op.entityType]) {
      stats.byEntityType[op.entityType] = 0;
    }
    stats.byEntityType[op.entityType]++;
  }

  return stats;
}

/**
 * Estimate time to sync remaining operations
 */
export function estimateSyncTime(
  pendingOperations: OfflineSyncQueue[],
  averageSyncTimeMs: number = 500
): number {
  return pendingOperations.length * averageSyncTimeMs;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  // In browser environment
  if (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined') {
    return navigator.onLine;
  }

  // Default to true in non-browser environments
  return true;
}

/**
 * Generate device ID
 */
export function generateDeviceId(): string {
  // In real implementation, would use device fingerprinting
  // or stored device ID from local storage
  return `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Validate sync operation payload
 */
export function validateSyncPayload(
  operation: string,
  payload: Record<string, unknown>
): boolean {
  // Basic validation
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  // Operation-specific validation
  switch (operation) {
    case 'CREATE':
      // Should not have an ID
      return !payload.id;

    case 'UPDATE':
    case 'PATCH':
    case 'DELETE':
      // Should have an ID
      return !!payload.id;

    case 'UPSERT':
      // Can have or not have an ID
      return true;

    default:
      return true;
  }
}

/**
 * Calculate cache size in bytes
 */
export function calculateCacheSize(data: unknown): number {
  // Rough estimation using JSON serialization
  try {
    const json = JSON.stringify(data);
    return new Blob([json]).size;
  } catch {
    return 0;
  }
}

/**
 * Check if cache size exceeds limit
 */
export function isCacheSizeExceeded(currentSizeBytes: number, limitMB: number): boolean {
  const limitBytes = limitMB * 1024 * 1024;
  return currentSizeBytes > limitBytes;
}

/**
 * Format sync duration
 */
export function formatSyncDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Determine if operation should be retried
 */
export function shouldRetry(operation: OfflineSyncQueue, error: Error): boolean {
  // Don't retry if max retries reached
  if (operation.retryCount >= operation.maxRetries) {
    return false;
  }

  // Don't retry validation errors
  if (error.message.includes('Validation')) {
    return false;
  }

  // Don't retry authorization errors
  if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
    return false;
  }

  // Don't retry if operation is expired
  if (operation.expiresAt && new Date(operation.expiresAt) < new Date()) {
    return false;
  }

  // Retry for network and server errors
  return true;
}

/**
 * Batch operations for more efficient sync
 */
export function batchOperations(
  operations: OfflineSyncQueue[],
  batchSize: number = 10
): OfflineSyncQueue[][] {
  const batches: OfflineSyncQueue[][] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    batches.push(operations.slice(i, i + batchSize));
  }

  return batches;
}
