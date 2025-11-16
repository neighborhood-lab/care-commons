import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper function to get auth token (to be implemented)
async function getAuthToken(): Promise<string> {
  // This should integrate with your auth service
  // For now, return empty string
  return '';
}

/**
 * Priority levels for offline queue operations
 * CRITICAL: EVV clock events, signatures (regulatory compliance)
 * HIGH: Visit notes, task completion (care documentation)
 * NORMAL: General updates, metadata changes
 * LOW: Analytics, non-essential sync
 */
export enum QueuePriority {
  CRITICAL = 4,
  HIGH = 3,
  NORMAL = 2,
  LOW = 1,
}

/**
 * Action types supported by offline queue
 */
export type QueuedActionType =
  | 'visit-check-in'
  | 'visit-check-out'
  | 'task-complete'
  | 'care-note'
  | 'attachment-upload'
  | 'signature-upload'
  | 'visit-note'
  | 'incident-report';

/**
 * Error details for failed actions
 */
export interface QueuedActionError {
  message: string;
  code?: string;
  status?: number;
  timestamp: number;
  isRetryable: boolean;
}

/**
 * Queued action with full metadata
 */
export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: any;
  timestamp: number;
  retries: number;
  priority: QueuePriority;
  maxRetries: number;
  errors: QueuedActionError[];
  lastAttemptAt?: number;
  nextRetryAt?: number;
}

/**
 * Enhanced offline queue with priority support, exponential backoff,
 * and comprehensive error tracking for regulatory compliance
 */
export class OfflineQueue {
  private static QUEUE_KEY = '@offline_queue';
  private static MAX_RETRIES = 5;
  private static BASE_RETRY_DELAY = 1000; // 1 second
  private static MAX_RETRY_DELAY = 300000; // 5 minutes

  /**
   * Get default priority based on action type
   * EVV events and signatures are CRITICAL for compliance
   */
  private static getDefaultPriority(type: QueuedActionType): QueuePriority {
    switch (type) {
      case 'visit-check-in':
      case 'visit-check-out':
      case 'signature-upload':
        return QueuePriority.CRITICAL; // EVV compliance
      case 'care-note':
      case 'visit-note':
      case 'task-complete':
      case 'incident-report':
        return QueuePriority.HIGH; // Care documentation
      case 'attachment-upload':
        return QueuePriority.NORMAL; // Supporting documentation
      default:
        return QueuePriority.NORMAL;
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private static calculateRetryDelay(retryCount: number): number {
    const exponentialDelay = this.BASE_RETRY_DELAY * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * exponentialDelay; // +/- 30% jitter
    const delay = Math.min(exponentialDelay + jitter, this.MAX_RETRY_DELAY);
    return Math.floor(delay);
  }

  /**
   * Determine if error is retryable
   */
  private static isRetryable(status?: number): boolean {
    if (!status) return true; // Network errors are retryable
    if (status >= 500) return true; // Server errors are retryable
    if (status === 408 || status === 429) return true; // Timeout/rate limit
    if (status === 409) return false; // Conflict - needs manual resolution
    if (status >= 400 && status < 500) return false; // Client errors not retryable
    return true;
  }

  /**
   * Enqueue an action with priority support
   */
  static async enqueue(
    action: Omit<
      QueuedAction,
      'id' | 'timestamp' | 'retries' | 'errors' | 'maxRetries' | 'priority'
    > & {
      priority?: QueuePriority;
    },
    options: {
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const queue = await this.getQueue();

    const queuedAction: QueuedAction = {
      ...action,
      id: this.generateUUID(),
      timestamp: Date.now(),
      retries: 0,
      priority: action.priority ?? this.getDefaultPriority(action.type),
      maxRetries: options.maxRetries ?? this.MAX_RETRIES,
      errors: [],
    };

    queue.push(queuedAction);
    await this.saveQueue(queue);

    console.log(`[OfflineQueue] Enqueued ${action.type} (priority: ${queuedAction.priority})`);
    return queuedAction.id;
  }

  /**
   * Process queue with priority-based sorting and exponential backoff
   */
  static async processQueue(): Promise<{
    processed: number;
    failed: number;
    skipped: number;
  }> {
    const queue = await this.getQueue();

    if (queue.length === 0) {
      return { processed: 0, failed: 0, skipped: 0 };
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('[OfflineQueue] No network connection, skipping queue processing');
      return { processed: 0, failed: 0, skipped: queue.length };
    }

    console.log(`[OfflineQueue] Processing ${queue.length} queued actions`);

    const now = Date.now();
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    // Sort by priority (descending) then timestamp (ascending)
    const sortedQueue = queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Older first
    });

    const remainingQueue: QueuedAction[] = [];

    for (const action of sortedQueue) {
      // Skip if retry delay hasn't elapsed
      if (action.nextRetryAt && action.nextRetryAt > now) {
        skipped++;
        remainingQueue.push(action);
        continue;
      }

      // Skip if max retries exceeded
      if (action.retries >= action.maxRetries) {
        console.error(
          `[OfflineQueue] Max retries exceeded for ${action.type}:${action.id}, discarding`
        );
        failed++;
        continue;
      }

      try {
        await this.executeAction(action);
        processed++;
        console.log(`[OfflineQueue] Successfully executed ${action.type}:${action.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = (error as any)?.status;

        const actionError: QueuedActionError = {
          message: errorMessage,
          status,
          timestamp: now,
          isRetryable: this.isRetryable(status),
        };

        // Ensure errors array exists (for backwards compatibility with old queue items)
        if (!action.errors) {
          action.errors = [];
        }
        action.errors.push(actionError);
        action.retries++;
        action.lastAttemptAt = now;

        if (actionError.isRetryable && action.retries < action.maxRetries) {
          // Calculate next retry time with exponential backoff
          const retryDelay = this.calculateRetryDelay(action.retries);
          action.nextRetryAt = now + retryDelay;
          remainingQueue.push(action);

          console.warn(
            `[OfflineQueue] Failed ${action.type}:${action.id} (retry ${action.retries}/${action.maxRetries}), ` +
              `will retry in ${Math.round(retryDelay / 1000)}s`
          );
        } else {
          failed++;
          console.error(
            `[OfflineQueue] Failed ${action.type}:${action.id} permanently: ${errorMessage}`
          );
        }
      }
    }

    await this.saveQueue(remainingQueue);

    console.log(
      `[OfflineQueue] Processed ${processed} actions, ${failed} failed, ${skipped} skipped`
    );

    return { processed, failed, skipped };
  }

  /**
   * Execute a queued action
   */
  private static async executeAction(action: QueuedAction): Promise<void> {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/${action.type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(action.payload),
    });

    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
  }

  /**
   * Get queue sorted by priority
   */
  private static async getQueue(): Promise<QueuedAction[]> {
    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  }

  /**
   * Save queue to storage
   */
  private static async saveQueue(queue: QueuedAction[]): Promise<void> {
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Get queue size
   */
  static async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Get queue items (for UI display)
   */
  static async getQueueItems(): Promise<QueuedAction[]> {
    return await this.getQueue();
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    total: number;
    byPriority: Record<QueuePriority, number>;
    byType: Record<string, number>;
    failedCount: number;
    retryableCount: number;
  }> {
    const queue = await this.getQueue();

    const stats = {
      total: queue.length,
      byPriority: {
        [QueuePriority.CRITICAL]: 0,
        [QueuePriority.HIGH]: 0,
        [QueuePriority.NORMAL]: 0,
        [QueuePriority.LOW]: 0,
      },
      byType: {} as Record<string, number>,
      failedCount: 0,
      retryableCount: 0,
    };

    for (const action of queue) {
      stats.byPriority[action.priority]++;
      stats.byType[action.type] = (stats.byType[action.type] || 0) + 1;

      if (action.retries >= action.maxRetries) {
        stats.failedCount++;
      } else if (action.retries > 0) {
        stats.retryableCount++;
      }
    }

    return stats;
  }

  /**
   * Retry failed items by resetting retry metadata
   */
  static async retryFailedItems(): Promise<void> {
    const queue = await this.getQueue();

    const resetQueue = queue.map((item) => ({
      ...item,
      retries: item.retries > 0 ? 0 : item.retries,
      nextRetryAt: undefined,
      lastAttemptAt: undefined,
      errors: [], // Clear error history on manual retry
    }));

    await this.saveQueue(resetQueue);
    await this.processQueue();
  }

  /**
   * Clear entire queue (destructive operation)
   */
  static async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.QUEUE_KEY);
    console.log('[OfflineQueue] Queue cleared');
  }

  /**
   * Remove specific item from queue
   */
  static async removeItem(id: string): Promise<boolean> {
    const queue = await this.getQueue();
    const filteredQueue = queue.filter((item) => item.id !== id);

    if (filteredQueue.length === queue.length) {
      return false; // Item not found
    }

    await this.saveQueue(filteredQueue);
    console.log(`[OfflineQueue] Removed item ${id}`);
    return true;
  }

  /**
   * Generate RFC4122 v4 UUID
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Validate queue integrity (for debugging)
   */
  static async validateQueue(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const validation = {
      isValid: true,
      errors: [] as string[],
    };

    try {
      const queue = await this.getQueue();

      for (const action of queue) {
        if (!action.id) {
          validation.errors.push(`Action missing ID: ${JSON.stringify(action)}`);
          validation.isValid = false;
        }
        if (!action.type) {
          validation.errors.push(`Action ${action.id} missing type`);
          validation.isValid = false;
        }
        if (action.retries > action.maxRetries) {
          validation.errors.push(
            `Action ${action.id} has retries (${action.retries}) > maxRetries (${action.maxRetries})`
          );
          validation.isValid = false;
        }
      }
    } catch (error) {
      validation.errors.push(`Failed to validate queue: ${error}`);
      validation.isValid = false;
    }

    return validation;
  }
}
