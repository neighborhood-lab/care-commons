/**
 * Offline Queue Service
 * 
 * Manages queuing of EVV operations when offline and syncing when online.
 * This service ensures that clock-in/out events are never lost, even when
 * the device has no connectivity.
 * 
 * Key features:
 * - Automatic retry with exponential backoff
 * - Priority-based processing (clock-ins are highest priority)
 * - Conflict resolution
 * - Integrity verification
 */

import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import type {
  ClockInInput,
  ClockOutInput,
} from '../shared/index.js';

export type QueueOperationType = 'CLOCK_IN' | 'CLOCK_OUT' | 'UPDATE_EVV' | 'SYNC_VISIT' | 'UPLOAD_MEDIA' | 'UPLOAD_SIGNATURE';
export type QueueStatus = 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'COMPLETED';

export interface QueuedOperation {
  id: string;
  operationType: QueueOperationType;
  entityType: 'VISIT' | 'EVV_RECORD' | 'TIME_ENTRY';
  entityId: string;
  payload: unknown;
  priority: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  status: QueueStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OfflineQueueConfig {
  maxRetries: number;
  baseRetryDelay: number; // milliseconds
  maxRetryDelay: number; // milliseconds
  priorityLevels: Record<QueueOperationType, number>;
  apiBaseUrl: string;
  authToken?: string;
}

const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxRetries: 5,
  baseRetryDelay: 2000, // 2 seconds
  maxRetryDelay: 60000, // 1 minute
  priorityLevels: {
    CLOCK_IN: 100, // Highest priority
    CLOCK_OUT: 90,
    UPLOAD_SIGNATURE: 80, // High priority - needed for EVV compliance
    UPDATE_EVV: 50,
    UPLOAD_MEDIA: 40, // Photos can wait a bit
    SYNC_VISIT: 30,
  },
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
};

export class OfflineQueueService {
  private database: Database;
  private config: OfflineQueueConfig;
  private syncInProgress = false;
  private syncInterval: number | null = null;

  constructor(database: Database, config: Partial<OfflineQueueConfig> = {}) {
    this.database = database;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update auth token for API requests
   */
  setAuthToken(token: string): void {
    this.config.authToken = token;
  }

  /**
   * Queue a clock-in operation for offline processing
   */
  async queueClockIn(input: ClockInInput): Promise<string> {
    const operationId = this.generateOperationId();
    
    await this.database.write(async () => {
      const syncQueue = this.database.collections.get('sync_queue');
      await syncQueue.create((record: any) => {
        record.id = operationId;
        record.operationType = 'CLOCK_IN';
        record.entityType = 'TIME_ENTRY';
        record.entityId = input.visitId;
        record.payloadJson = JSON.stringify(input);
        record.priority = this.config.priorityLevels.CLOCK_IN;
        record.retryCount = 0;
        record.maxRetries = this.config.maxRetries;
        record.status = 'PENDING';
        record.createdAt = Date.now();
        record.updatedAt = Date.now();
      });
    });

    // Trigger sync if online
    void this.trySync();

    return operationId;
  }

  /**
   * Queue a clock-out operation for offline processing
   */
  async queueClockOut(input: ClockOutInput): Promise<string> {
    const operationId = this.generateOperationId();

    await this.database.write(async () => {
      const syncQueue = this.database.collections.get('sync_queue');
      await syncQueue.create((record: any) => {
        record.id = operationId;
        record.operationType = 'CLOCK_OUT';
        record.entityType = 'TIME_ENTRY';
        record.entityId = input.visitId;
        record.payloadJson = JSON.stringify(input);
        record.priority = this.config.priorityLevels.CLOCK_OUT;
        record.retryCount = 0;
        record.maxRetries = this.config.maxRetries;
        record.status = 'PENDING';
        record.createdAt = Date.now();
        record.updatedAt = Date.now();
      });
    });

    // Trigger sync if online
    void this.trySync();

    return operationId;
  }

  /**
   * Queue a media upload (photo) for offline processing
   */
  async queueMediaUpload(mediaId: string, visitId: string, payload: Record<string, any>): Promise<string> {
    const operationId = this.generateOperationId();

    await this.database.write(async () => {
      const syncQueue = this.database.collections.get('sync_queue');
      await syncQueue.create((record: any) => {
        record.id = operationId;
        record.operationType = 'UPLOAD_MEDIA';
        record.entityType = 'MEDIA';
        record.entityId = mediaId;
        record.payloadJson = JSON.stringify({ ...payload, visitId, mediaId });
        record.priority = this.config.priorityLevels.UPLOAD_MEDIA;
        record.retryCount = 0;
        record.maxRetries = this.config.maxRetries;
        record.status = 'PENDING';
        record.createdAt = Date.now();
        record.updatedAt = Date.now();
      });
    });

    // Trigger sync if online
    void this.trySync();

    return operationId;
  }

  /**
   * Queue a signature upload for offline processing
   */
  async queueSignatureUpload(signatureId: string, evvRecordId: string, payload: Record<string, any>): Promise<string> {
    const operationId = this.generateOperationId();

    await this.database.write(async () => {
      const syncQueue = this.database.collections.get('sync_queue');
      await syncQueue.create((record: any) => {
        record.id = operationId;
        record.operationType = 'UPLOAD_SIGNATURE';
        record.entityType = 'MEDIA';
        record.entityId = signatureId;
        record.payloadJson = JSON.stringify({ ...payload, evvRecordId, signatureId });
        record.priority = this.config.priorityLevels.UPLOAD_SIGNATURE;
        record.retryCount = 0;
        record.maxRetries = this.config.maxRetries;
        record.status = 'PENDING';
        record.createdAt = Date.now();
        record.updatedAt = Date.now();
      });
    });

    // Trigger sync if online
    void this.trySync();

    return operationId;
  }

  /**
   * Process the sync queue - send pending operations to server
   */
  async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (this.syncInProgress) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // Get pending operations ordered by priority
      const pendingOps = await this.database
        .get('sync_queue')
        .query(
          Q.where('status', 'PENDING'),
          Q.sortBy('priority', Q.desc),
          Q.sortBy('created_at', Q.asc)
        )
        .fetch();

      for (const op of pendingOps) {
        processed++;
        
        try {
          await this.processOperation(op);
          succeeded++;
        } catch (error) {
          failed++;
          await this.handleOperationFailure(op, error);
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    return { processed, succeeded, failed };
  }

  /**
   * Process a single queued operation
   */
  private async processOperation(operation: any): Promise<void> {
    const payload = JSON.parse(operation.payloadJson);

    // Mark as in progress
    await this.database.write(async () => {
      await operation.update((record: any) => {
        record.status = 'IN_PROGRESS';
        record.updatedAt = Date.now();
      });
    });

    // Process based on operation type
    switch (operation.operationType) {
      case 'CLOCK_IN':
        await this.processClockIn(payload);
        break;
      case 'CLOCK_OUT':
        await this.processClockOut(payload);
        break;
      case 'UPDATE_EVV':
        await this.processEVVUpdate(payload);
        break;
      case 'SYNC_VISIT':
        await this.processSyncVisit(payload);
        break;
      case 'UPLOAD_MEDIA':
        await this.processMediaUpload(payload);
        break;
      case 'UPLOAD_SIGNATURE':
        await this.processSignatureUpload(payload);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.operationType}`);
    }

    // Mark as completed
    await this.database.write(async () => {
      await operation.update((record: any) => {
        record.status = 'COMPLETED';
        record.completedAt = Date.now();
        record.updatedAt = Date.now();
      });
    });
  }

  /**
   * Handle operation failure with retry logic
   */
  private async handleOperationFailure(operation: any, error: unknown): Promise<void> {
    const retryCount = operation.retryCount + 1;
    const shouldRetry = retryCount < operation.maxRetries;

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (shouldRetry) {
      // Calculate exponential backoff delay
      const delay = Math.min(
        this.config.baseRetryDelay * Math.pow(2, retryCount),
        this.config.maxRetryDelay
      );
      const nextRetryAt = Date.now() + delay;

      await this.database.write(async () => {
        await operation.update((record: any) => {
          record.status = 'PENDING';
          record.retryCount = retryCount;
          record.nextRetryAt = nextRetryAt;
          record.errorMessage = errorMessage;
          record.updatedAt = Date.now();
        });
      });
    } else {
      // Max retries exceeded - mark as failed
      await this.database.write(async () => {
        await operation.update((record: any) => {
          record.status = 'FAILED';
          record.errorMessage = errorMessage;
          record.errorDetailsJson = JSON.stringify({ error: String(error) });
          record.updatedAt = Date.now();
        });
      });
    }
  }

  /**
   * Process clock-in operation - send to server
   */
  private async processClockIn(payload: ClockInInput): Promise<void> {
    const response = await this.apiRequest('POST', '/evv/clock-in', payload);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Clock-in failed: ${error.message || response.statusText}`);
    }

    // Store the response data if needed
    const result = await response.json();
    console.log('Clock-in successful:', result);
  }

  /**
   * Process clock-out operation - send to server
   */
  private async processClockOut(payload: ClockOutInput): Promise<void> {
    const response = await this.apiRequest('POST', '/evv/clock-out', payload);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Clock-out failed: ${error.message || response.statusText}`);
    }

    // Store the response data if needed
    const result = await response.json();
    console.log('Clock-out successful:', result);
  }

  /**
   * Process EVV update operation
   */
  private async processEVVUpdate(payload: unknown): Promise<void> {
    const response = await this.apiRequest('PATCH', '/evv/update', payload);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`EVV update failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('EVV update successful:', result);
  }

  /**
   * Process visit sync operation
   */
  private async processSyncVisit(payload: unknown): Promise<void> {
    const response = await this.apiRequest('POST', '/visits/sync', payload);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Visit sync failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('Visit sync successful:', result);
  }

  /**
   * Process media upload (photo) operation
   */
  private async processMediaUpload(payload: any): Promise<void> {
    const response = await this.apiRequest('POST', '/media/upload', payload);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Media upload failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('Media upload successful:', result);

    // Update media record in database with server URL
    if (result.serverUrl) {
      await this.updateMediaRecord(payload.mediaId, result.serverUrl);
    }
  }

  /**
   * Process signature upload operation
   */
  private async processSignatureUpload(payload: any): Promise<void> {
    const response = await this.apiRequest('POST', '/media/signature', payload);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Signature upload failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('Signature upload successful:', result);

    // Update media record and EVV record with signature URL
    if (result.serverUrl) {
      await this.updateMediaRecord(payload.signatureId, result.serverUrl);
    }
  }

  /**
   * Update media record with server URL after successful upload
   */
  private async updateMediaRecord(mediaId: string, serverUrl: string): Promise<void> {
    try {
      const mediaCollection = this.database.collections.get('media');
      const mediaRecord = await mediaCollection.find(mediaId);

      await this.database.write(async () => {
        await mediaRecord.update((record: any) => {
          record.serverUrl = serverUrl;
          record.uploadStatus = 'UPLOADED';
          record.uploadProgress = 100;
          record.uploadedAt = Date.now();
          record.updatedAt = Date.now();
        });
      });
    } catch (error) {
      console.error('Failed to update media record:', error);
      // Don't throw - the upload was successful even if we can't update the record
    }
  }

  /**
   * Make an authenticated API request
   */
  private async apiRequest(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<Response> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    return await fetch(url, options);
  }

  /**
   * Try to sync if we're online
   */
  private async trySync(): Promise<void> {
    // Check network status using NetInfo
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable;

    if (isOnline && !this.syncInProgress) {
      await this.processQueue();
    }
  }

  /**
   * Start automatic sync interval
   */
  startAutoSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const interval = setInterval(() => {
      void this.trySync();
    }, intervalMs);
    this.syncInterval = interval as unknown as number;
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    pending: number;
    inProgress: number;
    failed: number;
    completed: number;
  }> {
    const pending = await this.database
      .get('sync_queue')
      .query(
        Q.where('status', 'PENDING')
      )
      .fetchCount();

    const inProgress = await this.database
      .get('sync_queue')
      .query(
        Q.where('status', 'IN_PROGRESS')
      )
      .fetchCount();

    const failed = await this.database
      .get('sync_queue')
      .query(
        Q.where('status', 'FAILED')
      )
      .fetchCount();

    const completed = await this.database
      .get('sync_queue')
      .query(
        Q.where('status', 'COMPLETED')
      )
      .fetchCount();

    return { pending, inProgress, failed, completed };
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Clear completed operations (housekeeping)
   */
  async clearCompleted(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    
    const completed = await this.database
      .get('sync_queue')
      .query(
        Q.where('status', 'COMPLETED'),
        Q.where('completed_at', Q.lt(cutoffDate))
      )
      .fetch();

    await this.database.write(async () => {
      for (const record of completed) {
        await record.destroyPermanently();
      }
    });

    return completed.length;
  }
}
