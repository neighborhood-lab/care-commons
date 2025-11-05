/**
 * Sync Types - Core types for offline-first synchronization
 * 
 * These types define the sync protocol between client and server,
 * supporting two-way sync with conflict resolution for offline-first
 * operation in home healthcare environments.
 */

/**
 * Entity types that can be synced
 */
export type SyncEntityType = 
  | 'VISIT' 
  | 'EVV_RECORD' 
  | 'TIME_ENTRY' 
  | 'TASK'
  | 'CLIENT'
  | 'CAREGIVER'
  | 'GEOFENCE';

/**
 * Operation types for sync queue
 */
export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Sync queue status
 */
export type SyncQueueStatus = 'PENDING' | 'IN_PROGRESS' | 'RETRY' | 'FAILED' | 'SYNCED';

/**
 * Conflict resolution strategies
 */
export type ConflictResolutionStrategy = 
  | 'LAST_WRITE_WINS'
  | 'MERGE_ARRAYS'
  | 'SERVER_WINS'
  | 'CLIENT_WINS'
  | 'MANUAL_REVIEW';

/**
 * Change record from server
 */
export interface SyncChange {
  id: string;
  entityType: SyncEntityType;
  operationType: SyncOperationType;
  data: Record<string, unknown>;
  version: number;
  updatedAt: number;
  updatedBy: string;
}

/**
 * Conflict detected during sync
 */
export interface SyncConflict {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  field: string;
  localValue: unknown;
  localUpdatedAt: number;
  remoteValue: unknown;
  remoteUpdatedAt: number;
  serverVersion: number;
  clientVersion: number;
}

/**
 * Resolution result
 */
export interface ConflictResolution {
  conflictId: string;
  strategy: ConflictResolutionStrategy;
  winner: 'LOCAL' | 'REMOTE' | 'MERGED' | 'MANUAL';
  value: unknown;
  requiresReview?: boolean;
  reviewBy?: 'SUPERVISOR' | 'ADMINISTRATOR';
  metadata?: Record<string, unknown>;
}

/**
 * Pull changes request
 */
export interface PullChangesRequest {
  lastPulledAt: number;
  entities: SyncEntityType[];
  organizationId: string;
  branchId?: string;
  caregiverId?: string;
  limit?: number;
}

/**
 * Pull changes response
 */
export interface PullChangesResponse {
  changes: SyncChange[];
  timestamp: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Push changes request
 */
export interface PushChangesRequest {
  changes: LocalChange[];
  deviceId: string;
  timestamp: number;
  organizationId: string;
}

/**
 * Local change to push
 */
export interface LocalChange {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operationType: SyncOperationType;
  data: Record<string, unknown>;
  version: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Push changes response
 */
export interface PushChangesResponse {
  success: boolean;
  synced: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
}

/**
 * Sync error
 */
export interface SyncError {
  changeId: string;
  entityType: SyncEntityType;
  entityId: string;
  errorCode: string;
  errorMessage: string;
  isRetryable: boolean;
}

/**
 * Offline queue item
 */
export interface OfflineQueueItem {
  id: string;
  operationType: SyncOperationType;
  entityType: SyncEntityType;
  entityId: string;
  payload: Record<string, unknown>;
  priority: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number | null;
  status: SyncQueueStatus;
  errorMessage: string | null;
  errorDetails: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
  syncedAt: number | null;
}

/**
 * Sync status
 */
export interface SyncStatus {
  lastSyncAt: number | null;
  lastSuccessfulSyncAt: number | null;
  pendingCount: number;
  isSyncing: boolean;
  syncErrors: SyncError[];
}

/**
 * Device information for sync tracking
 */
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'web' | 'ios' | 'android';
  appVersion: string;
  osVersion: string;
}
