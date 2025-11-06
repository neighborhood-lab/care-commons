# Quick Start Guide

Get started with the Data Backup & Offline Support vertical in minutes.

## Installation

```bash
npm install @care-commons/data-backup-offline
```

## Basic Setup

### 1. Import Services

```typescript
import {
  BackupService,
  OfflineSyncService,
  BackupRepository,
  OfflineSyncRepository,
} from '@care-commons/data-backup-offline';
```

### 2. Initialize Services

```typescript
// Initialize repositories
const backupRepo = new BackupRepository();
const syncRepo = new OfflineSyncRepository();

// Initialize services
const backupService = new BackupService({
  autoStartScheduledBackups: true,
  maxConcurrentBackups: 3,
  enableIntegrityChecks: true,
});

const syncService = new OfflineSyncService({
  autoRetryEnabled: true,
  maxRetries: 5,
  autoConflictResolution: true,
});
```

## Common Use Cases

### Scenario 1: Daily Automated Backups

Create a daily backup configuration for all client data:

```typescript
const config = await backupService.createConfiguration({
  organizationId: 'org-abc-123',
  name: 'Daily Client Backup',
  description: 'Automated daily backup of all client records',

  // Full backup every day
  configType: 'FULL',

  // Schedule: Daily at 2:00 AM
  schedule: {
    frequency: 'DAILY',
    startTime: '02:00',
    timezone: 'America/Chicago',
  },

  // What to backup
  scope: {
    includeEntities: ['CLIENT', 'CARE_PLAN', 'ASSESSMENT'],
    includeSoftDeleted: false,
    includeAttachments: true,
    includeDocuments: true,
    includeAuditLogs: true,
    includePHI: true,
    includeFinancialData: false,
  },

  // Keep backups for 30 days
  retention: {
    retentionDays: 30,
    autoDeleteExpired: true,
  },

  // Store in AWS S3
  storageDestination: {
    type: 'AWS_S3',
    cloudStorage: {
      provider: 'AWS',
      region: 'us-east-1',
      bucketName: 'my-org-backups',
      path: 'daily-backups',
      storageClass: 'STANDARD',
    },
  },

  // Security
  encryptionEnabled: true,
  compressionEnabled: true,

  // Notifications
  notificationSettings: {
    enabled: true,
    emailRecipients: ['admin@example.com'],
    onSuccess: false,
    onFailure: true,
    onWarning: true,
    onStarted: false,
    onComplete: false,
  },
});

console.log('Backup configuration created:', config.id);
console.log('Next backup scheduled for:', config.nextScheduledBackupAt);
```

### Scenario 2: Manual Backup

Create an immediate backup manually:

```typescript
const snapshot = await backupService.createSnapshot({
  configurationId: config.id,
  notes: 'Pre-migration backup',
});

console.log('Backup started:', snapshot.snapshotNumber);
console.log('Status:', snapshot.status); // 'QUEUED' or 'IN_PROGRESS'
```

### Scenario 3: Offline Visit Update

Queue a visit update while the caregiver is offline:

```typescript
// Caregiver updates visit notes while offline
const queueItem = await syncService.queueOperation({
  userId: 'caregiver-456',
  deviceId: 'tablet-789',
  operation: 'UPDATE',
  entityType: 'Visit',
  entityId: 'visit-123',
  payload: {
    id: 'visit-123',
    notes: 'Client requested medication reminder at 2pm',
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
  },
  previousVersion: {
    /* ... previous visit data ... */
  },
  priority: 'HIGH', // High priority for visit completions
});

console.log('Operation queued:', queueItem.operationId);
console.log('Sequence number:', queueItem.sequenceNumber);
```

### Scenario 4: Critical EVV Clock-In

Queue a critical EVV clock-in (syncs immediately when online):

```typescript
const evvClockIn = await syncService.queueOperation({
  userId: 'caregiver-456',
  deviceId: 'mobile-abc',
  operation: 'CREATE',
  entityType: 'EVVRecord',
  entityId: 'evv-new-123',
  payload: {
    visitId: 'visit-123',
    clientId: 'client-789',
    caregiverId: 'caregiver-456',
    clockInTime: new Date().toISOString(),
    clockInVerification: {
      latitude: 29.7604,
      longitude: -95.3698,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    },
  },
  priority: 'CRITICAL', // Highest priority
});

console.log('EVV clock-in queued with CRITICAL priority');
```

### Scenario 5: Sync All Pending Operations

When device comes back online, process all pending operations:

```typescript
await syncService.processPendingOperations('mobile-abc');
console.log('All pending operations processed');
```

### Scenario 6: Restore from Backup

Restore client data from a specific backup:

```typescript
const restore = await backupService.createRestoreOperation({
  snapshotId: 'snapshot-456',
  restoreType: 'SELECTIVE',

  // What to restore
  scope: {
    includeEntities: ['CLIENT'],
    clientIds: ['client-123'], // Only restore specific client
    restoreSoftDeleted: false,
    restoreAttachments: true,
    restoreDocuments: true,
  },

  // Where to restore
  restoreDestination: {
    type: 'TEST', // Restore to test environment first
    overwriteExisting: false,
    mergeWithExisting: true,
  },

  // Conflict handling
  conflictResolutionStrategy: 'MANUAL', // Review conflicts manually

  // Approval required for production
  requiresApproval: true,
  rollbackEnabled: true,

  requestedBy: 'admin-user-789',
  notes: 'Restore accidentally deleted client record',
});

console.log('Restore operation created:', restore.restoreNumber);
console.log('Status:', restore.status); // 'PENDING_APPROVAL'
```

### Scenario 7: Approve and Execute Restore

Approve the restore operation:

```typescript
await backupService.approveRestore(
  restore.id,
  'admin-user-789',
  'Verified backup integrity, approved for restore'
);

console.log('Restore approved and executing');
```

### Scenario 8: Handle Sync Conflict

Resolve a detected sync conflict:

```typescript
// Conflict detected: client updated on both device and server
await syncService.resolveConflict({
  conflictId: 'conflict-123',
  strategy: 'FIELD_LEVEL_MERGE', // Merge non-conflicting fields
  resolvedBy: 'admin-user-789',
  notes: 'Merged client address from server, kept notes from device',
});

console.log('Conflict resolved');
```

### Scenario 9: Configure Cache Policy

Set up offline cache for caregivers:

```typescript
const cachePolicy = await syncService.createCachePolicy({
  organizationId: 'org-abc-123',
  name: 'Caregiver Mobile Cache',
  description: 'Cache policy for mobile caregivers',

  // What to cache
  scope: {
    entities: ['CLIENT', 'VISIT', 'CARE_PLAN', 'SCHEDULE'],
    myClientsOnly: true, // Only cache assigned clients
    myScheduleOnly: true, // Only cache assigned visits
  },

  // Size limits
  maxCacheSizeMB: 100, // 100MB max cache

  // TTL (time-to-live)
  defaultTTL: 86400, // 24 hours

  // Refresh strategy
  refreshStrategy: 'ON_CONNECT', // Refresh when online

  // Eviction policy
  evictionPolicy: 'LRU', // Least Recently Used

  // Preload on login
  preloadOnLogin: true,
  backgroundSync: true,
});

console.log('Cache policy created:', cachePolicy.id);
```

### Scenario 10: Monitor Backup Status

Check status of a running backup:

```typescript
const snapshot = await backupService.getSnapshot('snapshot-456');

if (snapshot) {
  console.log('Snapshot:', snapshot.snapshotNumber);
  console.log('Status:', snapshot.status);

  if (snapshot.progress) {
    console.log('Progress:', snapshot.progress.overallPercent + '%');
    console.log('Current phase:', snapshot.progress.currentPhase);
    console.log('ETA:', snapshot.progress.estimatedCompletionAt);
  }

  if (snapshot.status === 'COMPLETED') {
    console.log('Records backed up:', snapshot.dataMetrics.totalRecords);
    console.log('Original size:', snapshot.dataMetrics.originalSize, 'bytes');
    console.log('Stored size:', snapshot.dataMetrics.storedSize, 'bytes');
    console.log('Compression ratio:', snapshot.compressionRatio);
  }
}
```

## Validation Examples

### Validate Backup Configuration

```typescript
import { BackupValidator, CreateBackupConfigSchema } from '@care-commons/data-backup-offline';

const configData = {
  organizationId: 'org-123',
  name: 'My Backup',
  // ... other fields
};

try {
  BackupValidator.validateCreateConfig(configData);
  console.log('Configuration is valid');
} catch (error) {
  console.error('Validation error:', error.message);
}
```

### Validate Sync Operation

```typescript
import { OfflineSyncValidator } from '@care-commons/data-backup-offline';

const operationData = {
  userId: 'user-123',
  deviceId: 'device-456',
  operation: 'UPDATE',
  entityType: 'Visit',
  entityId: 'visit-789',
  payload: { /* ... */ },
};

try {
  OfflineSyncValidator.validateQueueOperation(operationData);
  console.log('Operation is valid');
} catch (error) {
  console.error('Validation error:', error.message);
}
```

## Utility Examples

### Calculate Next Backup Time

```typescript
import { calculateNextBackupTime } from '@care-commons/data-backup-offline';

const nextBackup = calculateNextBackupTime(
  {
    frequency: 'DAILY',
    startTime: '02:00',
  },
  'America/Chicago'
);

console.log('Next backup:', nextBackup);
```

### Check if Snapshot is Expired

```typescript
import { isSnapshotExpired } from '@care-commons/data-backup-offline';

const expired = isSnapshotExpired(snapshot, {
  retentionDays: 30,
  autoDeleteExpired: true,
});

console.log('Snapshot expired:', expired);
```

### Format Bytes

```typescript
import { formatBytes } from '@care-commons/data-backup-offline';

console.log(formatBytes(1024)); // "1 KB"
console.log(formatBytes(1048576)); // "1 MB"
console.log(formatBytes(1073741824)); // "1 GB"
```

### Calculate Sync Stats

```typescript
import { calculateSyncStats } from '@care-commons/data-backup-offline';

const stats = calculateSyncStats(pendingOperations);

console.log('Total operations:', stats.total);
console.log('Pending:', stats.pending);
console.log('Completed:', stats.completed);
console.log('Failed:', stats.failed);
console.log('By priority:', stats.byPriority);
console.log('By entity type:', stats.byEntityType);
```

## Best Practices

1. **Backup Scheduling**: Schedule backups during off-peak hours (2-4 AM)
2. **Retention Policies**: Balance storage costs with compliance requirements
3. **Encryption**: Always enable encryption for PHI/PII data
4. **Compression**: Enable for text data, consider disabling for already-compressed files
5. **Sync Priorities**: Use CRITICAL for EVV, HIGH for visits, NORMAL for notes
6. **Conflict Resolution**: Use FIELD_LEVEL_MERGE for best automatic conflict handling
7. **Cache Limits**: Set appropriate limits based on device storage (50-200MB for mobile)
8. **Testing**: Always test restores in non-production environment first

## Next Steps

- Read [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed implementation guide
- Review type definitions in `src/types/` for complete API reference
- Check out integration examples with other verticals
- Set up monitoring and alerting for backup failures

## Support

For issues or questions, please refer to the main Care Commons documentation.
