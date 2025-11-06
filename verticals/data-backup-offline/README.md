# Data Backup & Offline Support

> Comprehensive backup management and offline synchronization for care coordination platforms

## Overview

The **Data Backup & Offline Support** vertical provides enterprise-grade backup management and offline-first synchronization capabilities for care coordination platforms. This vertical ensures data protection, disaster recovery, and seamless offline operations for field caregivers.

## Key Features

### 🔒 Backup Management

- **Automated Backup Scheduling** - Configure automated backups with flexible scheduling (hourly, daily, weekly, monthly, custom cron)
- **Multiple Backup Types** - Full, incremental, differential, and continuous (CDC) backup strategies
- **Retention Policies** - GFS (Grandfather-Father-Son) rotation with compliance-aware retention
- **Storage Flexibility** - Support for AWS S3, Azure Blob, Google Cloud Storage, local filesystem, and network shares
- **Encryption & Compression** - AES-256 encryption and configurable compression for secure, efficient storage
- **Integrity Verification** - Checksum validation (SHA256, SHA512, BLAKE3) for data integrity
- **Point-in-Time Recovery** - Restore data to specific timestamps with conflict resolution

### 📱 Offline Synchronization

- **Offline-First Architecture** - Queue operations while offline, sync when connectivity is restored
- **Priority-Based Sync** - Critical operations (EVV clock-in) sync before lower-priority items
- **Conflict Detection & Resolution** - Automatic and manual conflict resolution strategies
- **Dependency Management** - Ensure operations execute in correct order based on dependencies
- **Exponential Backoff** - Intelligent retry logic with exponential backoff for failed operations
- **Cache Management** - Configurable caching policies with size limits and eviction strategies

### 🛡️ Compliance & Security

- **HIPAA Compliance** - PHI/PII tracking and secure handling
- **Audit Logging** - Comprehensive audit trails for all backup and sync operations
- **Compliance Requirements** - Configurable compliance rules (retention, encryption, integrity checks)
- **Retention Locks** - Prevent deletion of critical backups for compliance
- **State-Specific Rules** - Support for TX/FL specific data protection requirements

## Architecture

```
data-backup-offline/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── backup.ts       # Backup entities and types
│   │   ├── offline-sync.ts # Offline sync entities and types
│   │   └── index.ts        # Type exports
│   ├── service/            # Business logic layer
│   │   ├── backup-service.ts        # Backup operations
│   │   └── offline-sync-service.ts  # Sync operations
│   ├── repository/         # Data access layer
│   │   ├── backup-repository.ts     # Backup data access
│   │   └── offline-sync-repository.ts # Sync data access
│   ├── validation/         # Input validation with Zod
│   │   ├── backup-validator.ts
│   │   └── offline-sync-validator.ts
│   ├── utils/              # Utility functions
│   │   ├── backup-utils.ts  # Backup helpers
│   │   └── sync-utils.ts    # Sync helpers
│   └── index.ts            # Public API
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md               # This file
├── QUICKSTART.md          # Quick start guide
└── IMPLEMENTATION.md      # Implementation details
```

## Core Entities

### Backup Configuration

Defines backup policies, schedules, retention, and storage settings:

```typescript
interface BackupConfiguration {
  id: UUID;
  organizationId: UUID;
  name: string;
  configType: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'CONTINUOUS';
  schedule: BackupSchedule;
  scope: BackupScope;
  retention: RetentionPolicy;
  storageDestination: StorageDestination;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  status: BackupConfigStatus;
}
```

### Backup Snapshot

Represents a specific backup instance:

```typescript
interface BackupSnapshot {
  id: UUID;
  configurationId: UUID;
  snapshotNumber: string;
  status: BackupSnapshotStatus;
  dataMetrics: BackupDataMetrics;
  storageLocation: StorageLocation;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
}
```

### Restore Operation

Tracks data restoration with validation:

```typescript
interface RestoreOperation {
  id: UUID;
  snapshotId: UUID;
  restoreType: 'FULL' | 'SELECTIVE' | 'POINT_IN_TIME' | 'FILE_LEVEL';
  scope: RestoreScope;
  conflictResolutionStrategy: ConflictResolutionStrategy;
  status: RestoreStatus;
  requiresApproval: boolean;
  rollbackEnabled: boolean;
}
```

### Offline Sync Queue

Manages offline operations pending synchronization:

```typescript
interface OfflineSyncQueue {
  id: UUID;
  userId: UUID;
  deviceId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'PATCH' | 'MERGE' | 'UPSERT';
  entityType: string;
  entityId: UUID;
  payload: Record<string, unknown>;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';
  status: SyncQueueStatus;
  retryCount: number;
  hasConflict: boolean;
}
```

### Sync Conflict

Detailed conflict information for resolution:

```typescript
interface SyncConflict {
  id: UUID;
  conflictType: ConflictType;
  entityType: string;
  entityId: UUID;
  clientVersion: DataVersion;
  serverVersion: DataVersion;
  conflictingFields: FieldConflict[];
  status: ConflictStatus;
  requiresManualResolution: boolean;
}
```

### Offline Cache Policy

Defines caching behavior for offline access:

```typescript
interface OfflineCachePolicy {
  id: UUID;
  organizationId: UUID;
  scope: CacheScope;
  maxCacheSizeMB: number;
  defaultTTL: number;
  refreshStrategy: 'ON_CONNECT' | 'PERIODIC' | 'ON_DEMAND' | 'BACKGROUND';
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO' | 'TTL' | 'PRIORITY';
}
```

## Use Cases

### 1. Automated Daily Backups

Configure automated daily backups with 30-day retention:

```typescript
const config = await backupService.createConfiguration({
  organizationId: 'org-123',
  name: 'Daily Production Backup',
  configType: 'FULL',
  schedule: {
    frequency: 'DAILY',
    startTime: '02:00',
  },
  retention: {
    retentionDays: 30,
    autoDeleteExpired: true,
  },
  encryptionEnabled: true,
  compressionEnabled: true,
});
```

### 2. Offline Visit Documentation

Queue visit updates while offline, sync when online:

```typescript
await syncService.queueOperation({
  userId: 'user-456',
  deviceId: 'device-789',
  operation: 'UPDATE',
  entityType: 'Visit',
  entityId: 'visit-123',
  payload: visitData,
  priority: 'HIGH',
});
```

### 3. Point-in-Time Recovery

Restore data to specific timestamp:

```typescript
const restore = await backupService.createRestoreOperation({
  snapshotId: 'snapshot-123',
  restoreType: 'POINT_IN_TIME',
  scope: {
    includeEntities: ['CLIENT', 'VISIT'],
    restoreToTimestamp: '2025-01-15T10:30:00Z',
  },
  conflictResolutionStrategy: 'BACKUP_WINS',
  requiresApproval: true,
});
```

### 4. Conflict Resolution

Resolve sync conflicts with custom strategy:

```typescript
await syncService.resolveConflict({
  conflictId: 'conflict-123',
  strategy: 'FIELD_LEVEL_MERGE',
  resolvedBy: 'user-456',
  notes: 'Merged client and server changes',
});
```

## Integration Examples

### With EVV Vertical

```typescript
// Queue EVV clock-in while offline (critical priority)
await syncService.queueOperation({
  operation: 'CREATE',
  entityType: 'EVVRecord',
  entityId: evvRecordId,
  payload: evvData,
  priority: 'CRITICAL', // Syncs immediately when online
});
```

### With Visit Scheduling

```typescript
// Backup visit schedules daily
await backupService.createConfiguration({
  name: 'Visit Schedule Backup',
  scope: {
    includeEntities: ['VISIT', 'SCHEDULE'],
  },
  schedule: { frequency: 'DAILY' },
});
```

### With Payroll Processing

```typescript
// Compliance-aware payroll backup (7-year retention)
await backupService.createConfiguration({
  name: 'Payroll Archive',
  scope: {
    includeEntities: ['PAYROLL', 'TIME_ENTRY'],
    includeFinancialData: true,
  },
  retention: {
    retentionDays: 2555, // 7 years
    autoDeleteExpired: false,
  },
  complianceRequirements: [
    {
      regulation: 'IRS',
      minimumRetentionDays: 2555,
      requiresEncryption: true,
    },
  ],
});
```

## Performance Considerations

- **Incremental Backups**: Use incremental backups for large datasets to reduce backup time and storage
- **Compression**: Enable compression for text-heavy data (notes, care plans) but consider CPU overhead
- **Priority Queue**: Assign appropriate priorities to sync operations to ensure critical data syncs first
- **Batch Operations**: Use batch sync for multiple operations to reduce network overhead
- **Cache Limits**: Set appropriate cache size limits based on device capabilities

## Security Features

- **End-to-End Encryption**: AES-256-GCM encryption for backups in transit and at rest
- **Checksum Verification**: SHA256/SHA512/BLAKE3 checksums prevent data corruption
- **Access Control**: Organization and branch-level access controls
- **Audit Trails**: Complete audit logs for compliance and security monitoring
- **Secure Storage**: Support for encrypted cloud storage (AWS KMS, Azure Key Vault)

## Testing

Run the test suite:

```bash
npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

## Documentation

- [README.md](./README.md) - Overview and features (this file)
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide with examples
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Detailed implementation guide

## License

Part of the Care Commons ecosystem.
