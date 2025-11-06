# Implementation Guide

Detailed implementation guide for the Data Backup & Offline Support vertical.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backup System Implementation](#backup-system-implementation)
3. [Offline Sync Implementation](#offline-sync-implementation)
4. [Database Schema](#database-schema)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Performance Optimization](#performance-optimization)
8. [Security Implementation](#security-implementation)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

## Architecture Overview

### Component Layers

```
┌─────────────────────────────────────────────────────┐
│                  Application Layer                   │
│         (React/Vue/Angular Mobile/Web App)          │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Service Layer                      │
│  ┌────────────────┐      ┌──────────────────────┐  │
│  │ BackupService  │      │ OfflineSyncService   │  │
│  └────────────────┘      └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                 Validation Layer                     │
│  ┌──────────────┐        ┌────────────────────────┐ │
│  │Zod Schemas   │        │ Business Rules         │ │
│  └──────────────┘        └────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                Repository Layer                      │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │BackupRepository  │    │OfflineSyncRepository   │ │
│  └──────────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                  Data Storage                        │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ PostgreSQL │  │  Redis   │  │ Cloud Storage   │ │
│  │  (Metadata)│  │  (Queue) │  │ (S3/Blob/GCS)   │ │
│  └────────────┘  └──────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Backup System Implementation

### 1. Backup Configuration Setup

```typescript
// Create backup configuration
const config = await backupService.createConfiguration({
  organizationId,
  name: 'Daily Full Backup',
  configType: 'FULL',
  schedule: {
    frequency: 'DAILY',
    startTime: '02:00',
    timezone: 'America/Chicago',
  },
  scope: {
    includeEntities: ['CLIENT', 'CAREGIVER', 'VISIT'],
    includeSoftDeleted: false,
    includeAttachments: true,
  },
  retention: {
    retentionDays: 30,
    dailyRetention: 7,
    weeklyRetention: 4,
    monthlyRetention: 12,
    autoDeleteExpired: true,
  },
  storageDestination: {
    type: 'AWS_S3',
    cloudStorage: {
      provider: 'AWS',
      region: 'us-east-1',
      bucketName: 'backups',
    },
  },
  encryptionEnabled: true,
  compressionEnabled: true,
});
```

### 2. Backup Execution Flow

```
1. Schedule Check
   ├── Is it time for backup?
   └── Is backup window active?

2. Preparation
   ├── Create snapshot record
   ├── Lock resources (if needed)
   └── Initialize metrics

3. Data Collection
   ├── Query entities by scope
   ├── Apply filters (date range, branches)
   ├── Collect attachments/documents
   └── Track progress

4. Processing
   ├── Serialize data (JSON/Parquet)
   ├── Compress (if enabled)
   └── Encrypt (if enabled)

5. Upload
   ├── Upload to storage destination
   ├── Generate checksum
   └── Update progress

6. Verification
   ├── Verify upload integrity
   ├── Calculate final metrics
   └── Update snapshot status

7. Cleanup
   ├── Release locks
   ├── Send notifications
   └── Schedule next backup
```

### 3. Incremental Backup Implementation

```typescript
// Incremental backup: Only changed records since last backup
async function executeIncrementalBackup(
  configId: UUID,
  lastBackupTimestamp: Timestamp
): Promise<BackupSnapshot> {
  // Get all entities modified since last backup
  const changedRecords = await queryChangedRecords(lastBackupTimestamp);

  // Create snapshot with parent reference
  const snapshot = await createSnapshot({
    configurationId: configId,
    snapshotType: 'INCREMENTAL',
    parentSnapshotId: lastSnapshotId, // Reference to full backup
  });

  // Backup only changed records
  await backupRecords(snapshot.id, changedRecords);

  return snapshot;
}
```

### 4. GFS Retention Implementation

```typescript
// Apply Grandfather-Father-Son retention
async function applyGFSRetention(configId: UUID): Promise<void> {
  const config = await backupRepo.findConfigById(configId);
  const snapshots = await backupRepo.findSnapshotsByConfig(configId);

  const { keep, delete: toDelete } = applyGFSRetention(snapshots, config.retention);

  // Delete expired snapshots
  for (const snapshot of toDelete) {
    if (!snapshot.retentionLocked) {
      await deleteSnapshot(snapshot.id);
    }
  }
}
```

## Offline Sync Implementation

### 1. Queue Operation While Offline

```typescript
// Application detects offline status
const isOffline = !navigator.onLine;

if (isOffline) {
  // Queue operation for later sync
  await syncService.queueOperation({
    userId: currentUser.id,
    deviceId: getDeviceId(),
    operation: 'UPDATE',
    entityType: 'Visit',
    entityId: visit.id,
    payload: visitData,
    previousVersion: originalVisit,
    priority: 'HIGH',
  });

  // Show user confirmation
  showNotification('Changes saved. Will sync when online.');
}
```

### 2. Network Status Monitoring

```typescript
// Monitor network status changes
class NetworkMonitor {
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private async handleOnline() {
    console.log('Network connection restored');

    // Notify listeners
    this.listeners.forEach((listener) => listener(true));

    // Start syncing pending operations
    await syncService.processPendingOperations(getDeviceId());
  }

  private handleOffline() {
    console.log('Network connection lost');

    // Notify listeners
    this.listeners.forEach((listener) => listener(false));

    // Start offline session tracking
    syncService.startOfflineSession(currentUser.id, getDeviceId(), organizationId);
  }

  public onChange(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
  }
}
```

### 3. Priority-Based Sync

```typescript
// Process operations by priority
async function processPendingOperations(deviceId: string): Promise<void> {
  const pending = await syncRepo.findPendingOperations(deviceId);

  // Sort by priority and sequence
  const sorted = sortQueueByPriority(pending);

  // Process in order
  for (const operation of sorted) {
    try {
      // Check dependencies
      if (!areDependenciesMet(operation, pending)) {
        continue; // Skip for now, will retry later
      }

      // Process operation
      await processOperation(operation);
    } catch (error) {
      // Handle error with retry logic
      await handleSyncError(operation.id, error);
    }
  }
}
```

### 4. Conflict Detection & Resolution

```typescript
// Detect conflicts during sync
async function syncToServer(operation: OfflineSyncQueue): Promise<SyncResult> {
  const response = await api.sync({
    operation: operation.operation,
    entityType: operation.entityType,
    entityId: operation.entityId,
    data: operation.payload,
    version: operation.previousVersion?.version,
  });

  if (response.hasConflict) {
    // Create conflict record
    const conflict = await createSyncConflict(operation, response.serverData);

    // Attempt auto-resolution
    if (autoConflictResolution) {
      try {
        await resolveConflictAutomatically(conflict.id, 'NEWEST_WINS');
      } catch {
        // Auto-resolution failed, mark for manual review
        await markForManualResolution(conflict.id);
      }
    }

    return { success: false, hasConflict: true };
  }

  return { success: true, hasConflict: false };
}
```

### 5. Exponential Backoff Implementation

```typescript
// Retry with exponential backoff
async function retryOperation(operation: OfflineSyncQueue): Promise<void> {
  const retryCount = operation.retryCount + 1;
  const delay = calculateBackoff(retryCount, 1000, 2);

  // Update operation
  await syncRepo.updateQueueItem(operation.id, {
    retryCount,
    nextRetryAt: new Date(Date.now() + delay).toISOString(),
    status: 'PENDING',
  });

  // Schedule retry
  setTimeout(() => processOperation(operation.id), delay);
}
```

## Database Schema

### Backup Tables

```sql
-- Backup configurations
CREATE TABLE backup_configurations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  branch_ids UUID[],
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config_type VARCHAR(50) NOT NULL,
  schedule JSONB NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  scope JSONB NOT NULL,
  retention JSONB NOT NULL,
  storage_destination JSONB NOT NULL,
  encryption_enabled BOOLEAN NOT NULL,
  encryption_key_id VARCHAR(255),
  compression_enabled BOOLEAN NOT NULL,
  compression_level INTEGER,
  integrity_check_enabled BOOLEAN NOT NULL,
  checksum_algorithm VARCHAR(50) NOT NULL,
  notification_settings JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  status_reason TEXT,
  last_backup_at TIMESTAMP,
  last_successful_backup_at TIMESTAMP,
  next_scheduled_backup_at TIMESTAMP,
  total_backups_created INTEGER NOT NULL DEFAULT 0,
  total_storage_used BIGINT,
  compliance_requirements JSONB,
  audit_retention_days INTEGER,
  custom_fields JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  deleted_by UUID
);

-- Backup snapshots
CREATE TABLE backup_snapshots (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  configuration_id UUID NOT NULL REFERENCES backup_configurations(id),
  snapshot_number VARCHAR(100) NOT NULL UNIQUE,
  snapshot_type VARCHAR(50) NOT NULL,
  generation INTEGER NOT NULL,
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration BIGINT,
  status VARCHAR(50) NOT NULL,
  status_reason TEXT,
  progress JSONB,
  data_metrics JSONB NOT NULL,
  storage_location JSONB NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  checksum_algorithm VARCHAR(50) NOT NULL,
  integrity_verified BOOLEAN NOT NULL,
  integrity_verified_at TIMESTAMP,
  encrypted BOOLEAN NOT NULL,
  encryption_key_id VARCHAR(255),
  encryption_algorithm VARCHAR(50),
  compressed BOOLEAN NOT NULL,
  compression_algorithm VARCHAR(50),
  compression_ratio NUMERIC(5,2),
  errors JSONB,
  warnings JSONB,
  expires_at TIMESTAMP,
  retention_locked BOOLEAN NOT NULL DEFAULT FALSE,
  restore_count INTEGER NOT NULL DEFAULT 0,
  last_restored_at TIMESTAMP,
  parent_snapshot_id UUID REFERENCES backup_snapshots(id),
  child_snapshot_ids UUID[],
  tags JSONB,
  notes TEXT,
  custom_fields JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  deleted_by UUID
);

-- Restore operations
CREATE TABLE restore_operations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  snapshot_id UUID NOT NULL REFERENCES backup_snapshots(id),
  restore_number VARCHAR(100) NOT NULL UNIQUE,
  restore_type VARCHAR(50) NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  requested_by UUID NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration BIGINT,
  scope JSONB NOT NULL,
  restore_destination JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  status_reason TEXT,
  progress JSONB,
  data_metrics JSONB NOT NULL,
  validation_enabled BOOLEAN NOT NULL,
  validation_results JSONB,
  conflict_resolution_strategy VARCHAR(50) NOT NULL,
  conflicts_detected JSONB,
  errors JSONB,
  warnings JSONB,
  requires_approval BOOLEAN NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP,
  approval_notes TEXT,
  rollback_enabled BOOLEAN NOT NULL,
  rollback_snapshot_id UUID REFERENCES backup_snapshots(id),
  notes TEXT,
  custom_fields JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Offline Sync Tables

```sql
-- Offline sync queue
CREATE TABLE offline_sync_queue (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  branch_id UUID,
  user_id UUID NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  operation_id UUID NOT NULL UNIQUE,
  sequence_number BIGINT NOT NULL,
  batch_id UUID,
  operation VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  previous_version JSONB,
  occurred_at TIMESTAMP NOT NULL,
  queued_at TIMESTAMP NOT NULL,
  attempted_at TIMESTAMP,
  synced_at TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  status_reason TEXT,
  priority VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL,
  next_retry_at TIMESTAMP,
  backoff_multiplier NUMERIC(5,2) NOT NULL,
  has_conflict BOOLEAN NOT NULL DEFAULT FALSE,
  conflict_id UUID,
  conflict_resolution JSONB,
  depends_on UUID[],
  blocked_by UUID[],
  validation_errors JSONB,
  requires_approval BOOLEAN,
  approved_by UUID,
  last_attempt_error TEXT,
  last_attempt_status_code INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_device_status ON offline_sync_queue(device_id, status);
CREATE INDEX idx_sync_queue_priority ON offline_sync_queue(priority, sequence_number);
CREATE INDEX idx_sync_queue_retry ON offline_sync_queue(status, next_retry_at);

-- Sync conflicts
CREATE TABLE sync_conflicts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  operation_id UUID NOT NULL,
  conflict_number VARCHAR(100) NOT NULL UNIQUE,
  conflict_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  client_version JSONB NOT NULL,
  server_version JSONB NOT NULL,
  conflicting_fields JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  resolution JSONB,
  auto_resolution_attempted BOOLEAN NOT NULL DEFAULT FALSE,
  auto_resolution_strategy VARCHAR(50),
  auto_resolution_failed BOOLEAN,
  auto_resolution_failure_reason TEXT,
  requires_manual_resolution BOOLEAN NOT NULL,
  assigned_to UUID,
  resolved_at TIMESTAMP,
  detected_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Offline sessions
CREATE TABLE offline_sessions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  session_number VARCHAR(100) NOT NULL UNIQUE,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration BIGINT,
  status VARCHAR(50) NOT NULL,
  network_status JSONB NOT NULL,
  last_online_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  operation_count INTEGER NOT NULL DEFAULT 0,
  create_count INTEGER NOT NULL DEFAULT 0,
  update_count INTEGER NOT NULL DEFAULT 0,
  delete_count INTEGER NOT NULL DEFAULT 0,
  synced_operations INTEGER NOT NULL DEFAULT 0,
  failed_operations INTEGER NOT NULL DEFAULT 0,
  conflict_operations INTEGER NOT NULL DEFAULT 0,
  pending_operations INTEGER NOT NULL DEFAULT 0,
  cached_entities JSONB,
  cache_size BIGINT,
  device_info JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cache policies
CREATE TABLE offline_cache_policies (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  branch_ids UUID[],
  user_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scope JSONB NOT NULL,
  max_cache_size_mb INTEGER NOT NULL,
  max_records_per_entity INTEGER,
  default_ttl INTEGER NOT NULL,
  ttl_by_entity JSONB,
  refresh_strategy VARCHAR(50) NOT NULL,
  refresh_interval INTEGER,
  entity_priorities JSONB,
  eviction_policy VARCHAR(50) NOT NULL,
  preload_on_login BOOLEAN NOT NULL,
  preload_entities TEXT[],
  background_sync BOOLEAN NOT NULL,
  status VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## State Management

### React/Redux Example

```typescript
// Redux slice for offline sync
const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    isOnline: true,
    pendingOperations: [],
    syncInProgress: false,
    lastSyncAt: null,
  },
  reducers: {
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    addPendingOperation: (state, action) => {
      state.pendingOperations.push(action.payload);
    },
    removePendingOperation: (state, action) => {
      state.pendingOperations = state.pendingOperations.filter(
        (op) => op.id !== action.payload
      );
    },
    setSyncInProgress: (state, action) => {
      state.syncInProgress = action.payload;
    },
    setLastSyncAt: (state, action) => {
      state.lastSyncAt = action.payload;
    },
  },
});
```

## Error Handling

### Backup Errors

```typescript
class BackupError extends Error {
  constructor(
    message: string,
    public code: string,
    public snapshotId?: UUID,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'BackupError';
  }
}

// Error handling in backup service
try {
  await executeBackup(snapshotId);
} catch (error) {
  if (error instanceof BackupError) {
    if (error.recoverable) {
      // Retry backup
      await retryBackup(snapshotId);
    } else {
      // Mark as failed, notify admins
      await markBackupFailed(snapshotId, error.message);
      await sendFailureNotification(error);
    }
  }
}
```

### Sync Errors

```typescript
class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public operationId: UUID,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

// Categorize errors
function categorizeSyncError(error: Error): {
  retryable: boolean;
  requiresManualIntervention: boolean;
} {
  // Network errors: retryable
  if (error.message.includes('Network') || error.message.includes('timeout')) {
    return { retryable: true, requiresManualIntervention: false };
  }

  // Validation errors: not retryable, fix data
  if (error.message.includes('Validation')) {
    return { retryable: false, requiresManualIntervention: true };
  }

  // Authorization errors: not retryable
  if (error.message.includes('Unauthorized')) {
    return { retryable: false, requiresManualIntervention: true };
  }

  // Server errors: retryable
  if (error.message.includes('500') || error.message.includes('503')) {
    return { retryable: true, requiresManualIntervention: false };
  }

  // Default: retryable
  return { retryable: true, requiresManualIntervention: false };
}
```

## Performance Optimization

### 1. Batch Operations

```typescript
// Batch sync operations for efficiency
async function batchSyncOperations(operations: OfflineSyncQueue[]): Promise<void> {
  const batches = batchOperations(operations, 50); // 50 per batch

  for (const batch of batches) {
    await api.batchSync({
      operations: batch.map((op) => ({
        operation: op.operation,
        entityType: op.entityType,
        entityId: op.entityId,
        data: op.payload,
      })),
    });
  }
}
```

### 2. Incremental Backups

Use incremental backups for large datasets to reduce backup time:

```typescript
// Only backup changed records
const lastBackup = await getLastSuccessfulBackup(configId);
const changedRecords = await getChangedRecords(lastBackup.completedAt);
await backupRecords(changedRecords);
```

### 3. Compression

Enable compression for text-heavy data:

```typescript
// Compress data before upload
const compressed = await compress(data, 'ZSTD', 6);
await upload(compressed);
```

### 4. Caching

Cache frequently accessed data:

```typescript
// Cache recent snapshots metadata
const cachedSnapshots = await redis.get(`snapshots:${configId}`);
if (cachedSnapshots) {
  return JSON.parse(cachedSnapshots);
}

const snapshots = await backupRepo.findSnapshotsByConfig(configId);
await redis.setex(`snapshots:${configId}`, 300, JSON.stringify(snapshots));
return snapshots;
```

## Security Implementation

### 1. Encryption at Rest

```typescript
// Encrypt data before storage
async function encryptData(data: Buffer, keyId: string): Promise<Buffer> {
  const key = await getEncryptionKey(keyId);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}
```

### 2. Access Control

```typescript
// Check user permissions before backup/restore
async function checkBackupPermissions(userId: UUID, action: string): Promise<boolean> {
  const user = await getUserById(userId);

  const requiredPermissions = {
    create_backup: ['backup:create'],
    restore_backup: ['backup:restore', 'backup:admin'],
    delete_backup: ['backup:delete', 'backup:admin'],
  };

  return user.permissions.some((p) => requiredPermissions[action]?.includes(p));
}
```

### 3. Audit Logging

```typescript
// Log all backup/restore operations
async function auditLog(action: string, details: Record<string, unknown>): Promise<void> {
  await auditLogger.log({
    timestamp: new Date(),
    action,
    userId: details.userId,
    resourceType: details.resourceType,
    resourceId: details.resourceId,
    details,
  });
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('BackupService', () => {
  it('should create backup configuration', async () => {
    const config = await backupService.createConfiguration(mockConfigData);
    expect(config.id).toBeDefined();
    expect(config.status).toBe('ACTIVE');
  });

  it('should calculate next backup time correctly', () => {
    const next = calculateNextBackupTime(
      { frequency: 'DAILY', startTime: '02:00' },
      'America/Chicago'
    );
    expect(next.getHours()).toBe(2);
  });
});
```

### Integration Tests

```typescript
describe('Offline Sync Integration', () => {
  it('should sync pending operations when online', async () => {
    // Queue operations while offline
    await syncService.queueOperation(operation1);
    await syncService.queueOperation(operation2);

    // Simulate going online
    await syncService.processPendingOperations(deviceId);

    // Verify operations synced
    const pending = await syncRepo.findPendingOperations(deviceId);
    expect(pending.length).toBe(0);
  });
});
```

## Deployment Considerations

### 1. Job Scheduler

Use a job scheduler for backup automation:

```typescript
// Bull/BullMQ for Node.js
import { Queue, Worker } from 'bullmq';

const backupQueue = new Queue('backups');

// Schedule backup
await backupQueue.add(
  'daily-backup',
  { configId: 'config-123' },
  {
    repeat: {
      pattern: '0 2 * * *', // Daily at 2 AM
    },
  }
);

// Process backup jobs
new Worker('backups', async (job) => {
  await backupService.createSnapshot({
    configurationId: job.data.configId,
  });
});
```

### 2. Monitoring

Set up monitoring for backup health:

```typescript
// Prometheus metrics
const backupDuration = new Histogram({
  name: 'backup_duration_seconds',
  help: 'Backup duration in seconds',
});

const backupFailures = new Counter({
  name: 'backup_failures_total',
  help: 'Total backup failures',
});

// Track metrics
const timer = backupDuration.startTimer();
try {
  await executeBackup(snapshotId);
} catch (error) {
  backupFailures.inc();
  throw error;
} finally {
  timer();
}
```

### 3. Storage Lifecycle

Configure storage lifecycle policies:

```typescript
// AWS S3 lifecycle policy
const lifecyclePolicy = {
  Rules: [
    {
      Id: 'TransitionToGlacier',
      Status: 'Enabled',
      Transitions: [
        {
          Days: 30,
          StorageClass: 'GLACIER',
        },
      ],
    },
  ],
};
```

## Best Practices Summary

1. **Backup Schedule**: Off-peak hours (2-4 AM)
2. **Retention**: Balance costs with compliance
3. **Testing**: Regular restore tests
4. **Monitoring**: Alert on backup failures
5. **Security**: Encryption + access control
6. **Performance**: Use incremental backups for large datasets
7. **Conflicts**: Auto-resolve when possible, manual review for critical
8. **Priority**: CRITICAL for EVV, HIGH for visits
9. **Cache**: Limit based on device (50-200MB mobile)
10. **Documentation**: Keep runbooks for disaster recovery

## Support and Resources

- API Documentation: See type definitions in `src/types/`
- Examples: Check `QUICKSTART.md` for usage examples
- Issues: Report bugs to Care Commons team
