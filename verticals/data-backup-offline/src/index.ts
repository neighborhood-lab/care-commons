/**
 * Data Backup & Offline Support
 *
 * Comprehensive backup management and offline synchronization for care coordination platforms.
 *
 * @module @care-commons/data-backup-offline
 */

// Types
export * from './types';
export * from './types/backup';
export * from './types/offline-sync';

// Services
export { BackupService } from './service/backup-service';
export type {
  CreateBackupConfigInput,
  UpdateBackupConfigInput,
  CreateBackupSnapshotInput,
  CreateRestoreOperationInput,
  BackupServiceOptions,
} from './service/backup-service';

export { OfflineSyncService } from './service/offline-sync-service';
export type {
  QueueSyncOperationInput,
  ResolveSyncConflictInput,
  CreateCachePolicyInput,
  OfflineSyncServiceOptions,
} from './service/offline-sync-service';

// Repositories
export { BackupRepository } from './repository/backup-repository';
export type {
  BackupConfigFilters,
  BackupSnapshotFilters,
  RestoreOperationFilters,
} from './repository/backup-repository';

export { OfflineSyncRepository } from './repository/offline-sync-repository';
export type {
  SyncQueueFilters,
  SyncConflictFilters,
  OfflineSessionFilters,
} from './repository/offline-sync-repository';

// Validation
export { BackupValidator } from './validation/backup-validator';
export {
  CreateBackupConfigSchema,
  UpdateBackupConfigSchema,
  CreateBackupSnapshotSchema,
  CreateRestoreOperationSchema,
  BackupConfigTypeSchema,
  BackupFrequencySchema,
  BackupScopeSchema,
  RetentionPolicySchema,
  StorageDestinationSchema,
} from './validation/backup-validator';

export { OfflineSyncValidator } from './validation/offline-sync-validator';
export {
  QueueSyncOperationSchema,
  ResolveSyncConflictSchema,
  CreateCachePolicySchema,
  UpdateCachePolicySchema,
  SyncOperationSchema,
  SyncPrioritySchema,
  ConflictStrategySchema,
} from './validation/offline-sync-validator';

// Utilities
export {
  calculateNextBackupTime,
  calculateExpirationDate,
  isSnapshotExpired,
  applyGFSRetention,
  calculateChecksum,
  verifyChecksum,
  calculateCompressionRatio,
  formatBytes,
  estimateBackupDuration,
  generateSnapshotNumber,
  parseCronExpression,
  isWithinBackupWindow,
  calculateStorageEfficiency,
} from './utils/backup-utils';

export {
  calculateBackoff,
  calculateNextRetryTime,
  sortQueueByPriority,
  areDependenciesMet,
  detectFieldConflicts,
  applyConflictResolution,
  calculateSyncStats,
  estimateSyncTime,
  isOnline,
  generateDeviceId,
  validateSyncPayload,
  calculateCacheSize,
  isCacheSizeExceeded,
  formatSyncDuration,
  shouldRetry,
  batchOperations,
} from './utils/sync-utils';
