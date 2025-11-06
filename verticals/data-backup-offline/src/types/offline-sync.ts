/**
 * Offline Synchronization Support Types
 *
 * Comprehensive offline-first data synchronization with conflict resolution,
 * queue management, and automatic retry mechanisms for field operations.
 */

import type { UUID, Timestamp, Entity } from '@care-commons/core';

/**
 * Offline Sync Queue
 *
 * Tracks pending synchronization operations performed while offline,
 * with priority, retry logic, and conflict detection.
 */
export interface OfflineSyncQueue extends Entity {
  organizationId: UUID;
  branchId?: UUID;
  userId: UUID; // User who made the change
  deviceId: string; // Device identifier

  // Operation identity
  operationId: UUID; // Unique ID for this operation
  sequenceNumber: number; // Sequential order of operations
  batchId?: UUID; // Group related operations

  // Operation details
  operation: SyncOperation;
  entityType: string; // e.g., "Visit", "EVVRecord", "Client"
  entityId: UUID; // ID of affected entity

  // Data payload
  payload: Record<string, unknown>;
  previousVersion?: Record<string, unknown>; // For rollback

  // Timing
  occurredAt: Timestamp; // When the change was made offline
  queuedAt: Timestamp; // When it was queued for sync
  attemptedAt?: Timestamp; // Last sync attempt
  syncedAt?: Timestamp; // Successfully synced

  // Status
  status: SyncQueueStatus;
  statusReason?: string;

  // Priority
  priority: SyncPriority;
  expiresAt?: Timestamp; // Some operations may expire

  // Retry logic
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Timestamp;
  backoffMultiplier: number; // Exponential backoff

  // Conflict handling
  hasConflict: boolean;
  conflictId?: UUID;
  conflictResolution?: ConflictResolution;

  // Dependencies
  dependsOn?: UUID[]; // Other operations that must complete first
  blockedBy?: UUID[]; // Operations blocking this one

  // Validation
  validationErrors?: ValidationIssue[];
  requiresApproval?: boolean;
  approvedBy?: UUID;

  // Network info
  lastAttemptError?: string;
  lastAttemptStatusCode?: number;

  // Metadata
  metadata?: Record<string, unknown>;
}

export type SyncOperation =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PATCH'      // Partial update
  | 'MERGE'      // Merge with server version
  | 'UPSERT';    // Create or update

export type SyncQueueStatus =
  | 'PENDING'            // Waiting to sync
  | 'IN_PROGRESS'        // Currently syncing
  | 'COMPLETED'          // Successfully synced
  | 'FAILED'             // Failed after retries
  | 'CONFLICT'           // Needs conflict resolution
  | 'EXPIRED'            // Operation expired
  | 'CANCELLED'          // Manually cancelled
  | 'PAUSED'             // Temporarily paused
  | 'WAITING_APPROVAL'   // Needs manual approval
  | 'BLOCKED';           // Blocked by dependencies

export type SyncPriority =
  | 'CRITICAL'   // Must sync immediately (e.g., EVV clock-in)
  | 'HIGH'       // High priority (e.g., visit completion)
  | 'NORMAL'     // Standard priority
  | 'LOW'        // Low priority (e.g., note updates)
  | 'BACKGROUND'; // Can wait (e.g., analytics)

export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolvedBy?: UUID;
  resolvedAt?: Timestamp;
  resolvedVersion?: Record<string, unknown>;
  notes?: string;
}

export type ConflictStrategy =
  | 'CLIENT_WINS'
  | 'SERVER_WINS'
  | 'NEWEST_WINS'
  | 'MANUAL'
  | 'FIELD_LEVEL_MERGE'
  | 'CUSTOM';

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

/**
 * Sync Conflict
 *
 * Detailed conflict information when offline changes collide
 * with server-side changes.
 */
export interface SyncConflict extends Entity {
  organizationId: UUID;
  operationId: UUID; // References OfflineSyncQueue.operationId

  // Conflict identity
  conflictNumber: string; // e.g., "CONF-2025-001234"
  conflictType: ConflictType;

  // Entity information
  entityType: string;
  entityId: UUID;

  // Versions
  clientVersion: DataVersion;
  serverVersion: DataVersion;

  // Differences
  conflictingFields: FieldConflict[];

  // Resolution
  status: ConflictStatus;
  resolution?: ConflictResolution;

  // Auto-resolution attempts
  autoResolutionAttempted: boolean;
  autoResolutionStrategy?: ConflictStrategy;
  autoResolutionFailed?: boolean;
  autoResolutionFailureReason?: string;

  // Manual resolution
  requiresManualResolution: boolean;
  assignedTo?: UUID; // User assigned to resolve
  resolvedAt?: Timestamp;

  // Timing
  detectedAt: Timestamp;
  expiresAt?: Timestamp; // Time limit for resolution

  // Metadata
  metadata?: Record<string, unknown>;
}

export type ConflictType =
  | 'UPDATE_UPDATE'    // Both client and server updated same record
  | 'UPDATE_DELETE'    // Client updated, server deleted
  | 'DELETE_UPDATE'    // Client deleted, server updated
  | 'CREATE_CREATE'    // Duplicate creation (rare)
  | 'FIELD_LEVEL'      // Specific field conflicts
  | 'DEPENDENCY';      // Related record conflicts

export type ConflictStatus =
  | 'DETECTED'
  | 'AUTO_RESOLVING'
  | 'AUTO_RESOLVED'
  | 'PENDING_MANUAL'
  | 'RESOLVING'
  | 'RESOLVED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface DataVersion {
  version: number; // Version number
  timestamp: Timestamp;
  modifiedBy: UUID;
  data: Record<string, unknown>;
  checksum?: string;
}

export interface FieldConflict {
  fieldPath: string; // e.g., "address.street", "notes[0].text"
  clientValue: unknown;
  serverValue: unknown;
  baseValue?: unknown; // Original value (if available)

  resolution?: FieldResolution;
}

export interface FieldResolution {
  strategy: 'CLIENT' | 'SERVER' | 'MERGED' | 'CUSTOM';
  resolvedValue: unknown;
  resolvedBy?: UUID;
  resolvedAt?: Timestamp;
}

/**
 * Offline Session
 *
 * Tracks periods of offline operation for devices/users,
 * including network availability and sync status.
 */
export interface OfflineSession extends Entity {
  organizationId: UUID;
  userId: UUID;
  deviceId: string;

  // Session identity
  sessionNumber: string; // e.g., "OFF-2025-001234"

  // Timing
  startedAt: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // milliseconds

  // Status
  status: OfflineSessionStatus;

  // Network information
  networkStatus: NetworkStatus;
  lastOnlineAt?: Timestamp;
  lastSyncAt?: Timestamp;

  // Operations during offline period
  operationCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;

  // Sync results
  syncedOperations: number;
  failedOperations: number;
  conflictOperations: number;
  pendingOperations: number;

  // Data cached
  cachedEntities?: CachedEntitySummary[];
  cacheSize?: number; // bytes

  // Device info
  deviceInfo?: DeviceInfo;

  // Metadata
  metadata?: Record<string, unknown>;
}

export type OfflineSessionStatus =
  | 'ACTIVE'      // Currently offline
  | 'SYNCING'     // Syncing after reconnection
  | 'COMPLETED'   // All synced successfully
  | 'PARTIAL'     // Some operations failed
  | 'FAILED';     // Sync failed

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: 'WIFI' | 'CELLULAR' | 'ETHERNET' | 'UNKNOWN';
  effectiveType?: '2g' | '3g' | '4g' | '5g' | 'slow-2g' | 'unknown';
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  lastCheckedAt: Timestamp;
}

export interface CachedEntitySummary {
  entityType: string;
  count: number;
  size: number; // bytes
  oldestCacheDate?: Timestamp;
  newestCacheDate?: Timestamp;
}

export interface DeviceInfo {
  deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'KIOSK';
  platform: 'IOS' | 'ANDROID' | 'WEB' | 'WINDOWS' | 'MACOS' | 'LINUX';
  osVersion?: string;
  appVersion?: string;
  browserName?: string;
  browserVersion?: string;

  // Hardware
  screenSize?: string; // e.g., "1920x1080"
  memory?: number; // MB
  storage?: number; // MB available

  // Location
  timezone?: string;
  locale?: string;
}

/**
 * Offline Cache Policy
 *
 * Defines what data should be cached for offline access,
 * with size limits and expiration rules.
 */
export interface OfflineCachePolicy extends Entity {
  organizationId: UUID;
  branchIds?: UUID[];
  userId?: UUID; // User-specific policy

  // Identity
  name: string;
  description?: string;

  // Cache scope
  scope: CacheScope;

  // Size limits
  maxCacheSizeMB: number;
  maxRecordsPerEntity?: number;

  // Expiration
  defaultTTL: number; // Time-to-live in seconds
  ttlByEntity?: Record<string, number>;

  // Refresh strategy
  refreshStrategy: CacheRefreshStrategy;
  refreshInterval?: number; // seconds

  // Priority
  entityPriorities?: Record<string, CachePriority>;

  // Eviction policy
  evictionPolicy: EvictionPolicy;

  // Preload settings
  preloadOnLogin: boolean;
  preloadEntities?: string[];
  backgroundSync: boolean;

  // Status
  status: 'ACTIVE' | 'DISABLED';

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface CacheScope {
  // Entity types to cache
  entities: string[];

  // Filters
  dateRangeStart?: Date;
  dateRangeEnd?: Date;

  // User-specific filtering
  myClientsOnly?: boolean;
  myScheduleOnly?: boolean;
  myBranchOnly?: boolean;

  // Custom filters
  customFilters?: Record<string, unknown>;
}

export type CacheRefreshStrategy =
  | 'ON_CONNECT'      // Refresh when connection restored
  | 'PERIODIC'        // Refresh at intervals
  | 'ON_DEMAND'       // Only refresh when requested
  | 'BACKGROUND';     // Background sync when idle

export type CachePriority =
  | 'CRITICAL'   // Always cache, never evict
  | 'HIGH'       // High priority
  | 'NORMAL'     // Standard priority
  | 'LOW';       // Low priority, evict first

export type EvictionPolicy =
  | 'LRU'        // Least Recently Used
  | 'LFU'        // Least Frequently Used
  | 'FIFO'       // First In, First Out
  | 'TTL'        // By time-to-live
  | 'PRIORITY';  // By cache priority

/**
 * Sync Statistics
 *
 * Aggregate statistics for offline sync operations,
 * useful for monitoring and troubleshooting.
 */
export interface SyncStatistics extends Entity {
  organizationId: UUID;
  branchId?: UUID;
  userId?: UUID;
  deviceId?: string;

  // Time period
  periodStart: Date;
  periodEnd: Date;

  // Operation counts
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  pendingOperations: number;
  conflictOperations: number;

  // By operation type
  createOperations: number;
  updateOperations: number;
  deleteOperations: number;

  // By entity type
  operationsByEntity: Record<string, number>;

  // Timing metrics
  averageSyncTime: number; // milliseconds
  medianSyncTime: number;
  p95SyncTime: number;
  p99SyncTime: number;

  // Data metrics
  totalBytesSynced: number;
  totalRecordsSynced: number;

  // Offline periods
  totalOfflineTime: number; // milliseconds
  offlineSessionCount: number;
  averageOfflineDuration: number;

  // Errors
  errorsByCode: Record<string, number>;
  mostCommonErrors: ErrorSummary[];

  // Conflicts
  conflictsByType: Record<ConflictType, number>;
  autoResolvedConflicts: number;
  manuallyResolvedConflicts: number;

  // Network
  averageLatency: number; // milliseconds
  connectionTypeDistribution?: Record<string, number>;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface ErrorSummary {
  code: string;
  message: string;
  count: number;
  lastOccurredAt: Timestamp;
}

/**
 * Sync Event Log
 *
 * Detailed event log for sync operations, useful for debugging
 * and audit trails.
 */
export interface SyncEventLog extends Entity {
  organizationId: UUID;
  operationId?: UUID;
  sessionId?: UUID;

  // Event identity
  eventType: SyncEventType;
  eventCategory: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

  // Timing
  occurredAt: Timestamp;

  // Context
  userId?: UUID;
  deviceId?: string;
  entityType?: string;
  entityId?: UUID;

  // Event data
  message: string;
  details?: Record<string, unknown>;

  // Error information
  errorCode?: string;
  errorMessage?: string;
  stackTrace?: string;

  // Network
  networkStatus?: 'ONLINE' | 'OFFLINE';
  latency?: number; // milliseconds

  // Metadata
  metadata?: Record<string, unknown>;
}

export type SyncEventType =
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'
  | 'OPERATION_QUEUED'
  | 'OPERATION_SYNCING'
  | 'OPERATION_SYNCED'
  | 'OPERATION_FAILED'
  | 'OPERATION_RETRYING'
  | 'CONFLICT_DETECTED'
  | 'CONFLICT_RESOLVED'
  | 'CACHE_UPDATED'
  | 'CACHE_CLEARED'
  | 'NETWORK_ONLINE'
  | 'NETWORK_OFFLINE'
  | 'SESSION_STARTED'
  | 'SESSION_ENDED';
