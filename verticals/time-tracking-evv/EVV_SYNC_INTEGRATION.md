# EVV Sync Integration Guide

## Overview

This document outlines how to integrate the offline-first sync system with the EVV vertical for production use.

## Integration Strategy

The EVV vertical should integrate with sync at the **service layer**, not by modifying the repository. This maintains clean separation of concerns.

### Architecture

```
┌─────────────────┐
│   EVV Service   │ ← Business logic layer
└────────┬────────┘
         │ delegates to
         ↓
┌─────────────────┐
│  EVV Sync       │ ← Sync integration layer
│  Adapter        │
└────────┬────────┘
         │ uses
         ↓
┌─────────────────┐
│  Sync Service   │ ← Core sync infrastructure
└─────────────────┘
```

## Implementation Steps

### 1. Create EVV Sync Adapter

Create `verticals/time-tracking-evv/src/sync/evv-sync-adapter.ts`:

```typescript
import type { Database } from '@care-commons/core';
import type { EVVRecord, TimeEntry } from '../types/evv';

export class EVVSyncAdapter {
  constructor(
    private database: Database,
    private organizationId: string,
    private deviceId: string
  ) {}

  /**
   * Queue EVV clock-in for sync
   */
  async queueClockIn(evvRecord: EVVRecord, timeEntry: TimeEntry): Promise<void> {
    await this.database.query(
      `INSERT INTO sync_queue (
        id, operation_type, entity_type, entity_id, payload,
        device_id, user_id, organization_id, priority, status,
        retry_count, max_retries, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        this.generateId(),
        'CREATE',
        'EVV_RECORD',
        evvRecord.id,
        JSON.stringify({ evvRecord, timeEntry }),
        this.deviceId,
        evvRecord.caregiverId,
        this.organizationId,
        100, // High priority for EVV compliance
        'PENDING',
        0,
        5,
      ]
    );
  }

  /**
   * Queue EVV clock-out for sync
   */
  async queueClockOut(evvRecord: EVVRecord, timeEntry: TimeEntry): Promise<void> {
    await this.database.query(
      `INSERT INTO sync_queue (...) VALUES (...)`,
      [
        this.generateId(),
        'UPDATE',
        'EVV_RECORD',
        evvRecord.id,
        JSON.stringify({ evvRecord, timeEntry }),
        this.deviceId,
        evvRecord.caregiverId,
        this.organizationId,
        90, // High priority (slightly lower than clock-in)
        'PENDING',
        0,
        5,
      ]
    );
  }

  private generateId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
```

### 2. Modify EVV Service to Use Adapter

Update `verticals/time-tracking-evv/src/service/evv-service.ts`:

```typescript
import { EVVSyncAdapter } from '../sync/evv-sync-adapter';

export class EVVService {
  private syncAdapter?: EVVSyncAdapter;

  constructor(
    private repository: EVVRepository,
    // ... other dependencies
    syncAdapter?: EVVSyncAdapter
  ) {
    this.syncAdapter = syncAdapter;
  }

  async clockIn(input: ClockInInput, userContext: UserContext): Promise<Result> {
    // ... existing validation and business logic ...

    // Save to database (existing code)
    const evvRecord = await this.repository.create(evvRecordData, userContext);
    const timeEntry = await this.repository.createTimeEntry(timeEntryData, userContext);

    // NEW: Queue for sync if adapter is configured
    if (this.syncAdapter) {
      await this.syncAdapter.queueClockIn(evvRecord, timeEntry);
    }

    return { evvRecord, timeEntry, verification };
  }

  async clockOut(input: ClockOutInput, userContext: UserContext): Promise<Result> {
    // ... existing validation and business logic ...

    // Update database (existing code)
    const evvRecord = await this.repository.update(evvRecordId, updates, userContext);
    const timeEntry = await this.repository.updateTimeEntry(timeEntryId, updates, userContext);

    // NEW: Queue for sync if adapter is configured
    if (this.syncAdapter) {
      await this.syncAdapter.queueClockOut(evvRecord, timeEntry);
    }

    return { evvRecord, timeEntry };
  }
}
```

### 3. Handle Synced Changes from Server

Add method to EVV Sync Adapter to apply changes from server:

```typescript
export class EVVSyncAdapter {
  /**
   * Apply synced EVV record from server to local database
   */
  async applySync(change: SyncChange): Promise<void> {
    const { evvRecord, timeEntry } = change.data;

    switch (change.operationType) {
      case 'CREATE':
        // Insert EVV record if it doesn't exist
        await this.database.query(
          `INSERT INTO evv_records (...) VALUES (...)
           ON CONFLICT (id) DO NOTHING`,
          [/* evvRecord fields */]
        );
        break;

      case 'UPDATE':
        // Update EVV record with optimistic locking
        await this.database.query(
          `UPDATE evv_records SET ... WHERE id = $1 AND version < $2`,
          [evvRecord.id, change.version]
        );
        break;

      case 'DELETE':
        // Soft delete
        await this.database.query(
          `UPDATE evv_records SET deleted_at = NOW() WHERE id = $1`,
          [change.data.evvRecord.id]
        );
        break;
    }
  }
}
```

### 4. Register EVV Adapter with Sync Service

In the sync service, register the EVV adapter:

```typescript
// In packages/web/src/core/services/sync-service.ts

private entityAdapters: Map<SyncEntityType, EntityAdapter> = new Map();

registerAdapter(entityType: SyncEntityType, adapter: EntityAdapter): void {
  this.entityAdapters.set(entityType, adapter);
}

private async applyChangeToLocal(change: SyncChange): Promise<void> {
  const adapter = this.entityAdapters.get(change.entityType);
  
  if (adapter) {
    await adapter.applySync(change);
  } else {
    console.warn(`No adapter registered for entity type: ${change.entityType}`);
  }
}
```

Then during app initialization:

```typescript
import { createEVVSyncAdapter } from '@care-commons/time-tracking-evv/sync';

// Initialize sync service
const syncService = initializeSyncService({ ... });

// Register EVV adapter
const evvAdapter = createEVVSyncAdapter({
  database: db,
  repository: evvRepository,
  organizationId: currentUser.organizationId,
  deviceId: getDeviceId(),
});

syncService.registerAdapter('EVV_RECORD', evvAdapter);
```

## Priority Configuration

EVV operations should have high priority in the sync queue:

- **Clock-In**: Priority 100 (highest)
- **Clock-Out**: Priority 90
- **Mid-Visit Check-In**: Priority 80
- **Manual Corrections**: Priority 70

This ensures EVV data syncs first for regulatory compliance.

## Conflict Resolution

For EVV records, use the following conflict resolution strategy:

1. **Clock-In Time**: Server wins (prevent fraud)
2. **Clock-Out Time**: Last-write-wins (allow corrections)
3. **Location Data**: Server wins (prevent tampering)
4. **Service Notes**: Merge (concatenate with timestamps)
5. **Verification Flags**: Manual review required

```typescript
export class EVVConflictResolver {
  resolve(conflict: SyncConflict): ConflictResolution {
    const field = conflict.field;

    // EVV compliance: location and time data favor server
    if (field === 'clockInTime' || field === 'clockInLocation') {
      return {
        strategy: 'SERVER_WINS',
        winner: 'REMOTE',
        value: conflict.remoteValue,
        metadata: {
          reason: 'EVV compliance: clock-in data is immutable',
        },
      };
    }

    // Clock-out can be corrected by supervisors
    if (field === 'clockOutTime' && conflict.localUpdatedAt > conflict.remoteUpdatedAt) {
      return {
        strategy: 'LAST_WRITE_WINS',
        winner: 'LOCAL',
        value: conflict.localValue,
      };
    }

    // Default: manual review
    return {
      strategy: 'MANUAL_REVIEW',
      winner: 'MANUAL',
      value: null,
      requiresReview: true,
      reviewBy: 'SUPERVISOR',
    };
  }
}
```

## Testing Offline EVV

### Unit Test Example

```typescript
describe('EVV Sync Integration', () => {
  it('should queue clock-in for sync', async () => {
    const adapter = new EVVSyncAdapter(db, 'org-123', 'device-456');
    
    const evvRecord = createMockEVVRecord();
    const timeEntry = createMockTimeEntry();
    
    await adapter.queueClockIn(evvRecord, timeEntry);
    
    // Verify queue entry created
    const queued = await db.query(
      'SELECT * FROM sync_queue WHERE entity_id = $1',
      [evvRecord.id]
    );
    
    expect(queued.rows).toHaveLength(1);
    expect(queued.rows[0].priority).toBe(100);
    expect(queued.rows[0].entity_type).toBe('EVV_RECORD');
  });
  
  it('should work offline', async () => {
    // Mock offline status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    const result = await evvService.clockIn(clockInData, userContext);
    
    expect(result.evvRecord).toBeDefined();
    
    // Verify queued for sync
    const pending = await db.query(
      'SELECT COUNT(*) FROM sync_queue WHERE status = $1',
      ['PENDING']
    );
    
    expect(pending.rows[0].count).toBe('1');
  });
});
```

### Integration Test Example

```typescript
describe('EVV Offline-to-Online Flow', () => {
  it('should sync queued EVV records when coming online', async () => {
    // 1. Start offline
    mockOffline();
    
    // 2. Clock in (queues locally)
    await evvService.clockIn(clockInData, userContext);
    
    // 3. Go online
    mockOnline();
    
    // 4. Trigger sync
    await syncService.sync();
    
    // 5. Verify synced to server
    const serverRecord = await fetch(`/api/evv/${evvRecord.id}`);
    expect(serverRecord.status).toBe(200);
    
    // 6. Verify queue cleared
    const queue = await db.query(
      'SELECT COUNT(*) FROM sync_queue WHERE status = $1',
      ['PENDING']
    );
    expect(queue.rows[0].count).toBe('0');
  });
});
```

## Regulatory Compliance Notes

### EVV Requirements (21st Century Cures Act)

The sync system ensures all six EVV required elements are captured and transmitted:

1. **Type of service** - Stored in `serviceTypeCode`
2. **Individual receiving service** - Stored in `clientId` + `clientName`
3. **Individual providing service** - Stored in `caregiverId` + `caregiverName`
4. **Date of service** - Stored in `serviceDate`
5. **Location** - Stored in `clockInLocation` (GPS coordinates)
6. **Time begins/ends** - Stored in `clockInTime` / `clockOutTime`

All data is:
- ✅ Captured at point of service (even offline)
- ✅ Encrypted in transit (HTTPS)
- ✅ Retained for required period (7 years)
- ✅ Audit trail maintained
- ✅ Transmitted to state aggregators

### State-Specific Considerations

**Texas (HHAeXchange)**:
- Clock-in/out must sync within 24 hours
- GPS accuracy must be ≤ 100m
- Mandatory submission to HHAeXchange
- VMUR process for corrections

**Florida (Multi-Aggregator)**:
- Supports HHAeXchange, Netsmart, Sandata
- Clock-in/out must sync within 48 hours
- GPS accuracy must be ≤ 150m
- RN supervision visits tracked separately

## Performance Considerations

- **Batch Size**: Sync max 100 EVV records per request
- **Retry Interval**: Exponential backoff (2s, 4s, 8s, 16s, 32s)
- **Max Retries**: 5 attempts before marking failed
- **Priority**: EVV always syncs before other entity types
- **Network**: Adaptive sync based on connection quality

## Monitoring & Alerts

Track these metrics in production:

- **Pending Count**: Alert if > 50 for > 1 hour
- **Failed Count**: Alert immediately if any failures
- **Sync Latency**: Alert if avg > 5 minutes
- **Conflict Rate**: Alert if > 5% of syncs have conflicts
- **Offline Duration**: Alert if caregiver offline > 4 hours

## Next Steps

1. Implement `EVVSyncAdapter` class
2. Update `EVVService` to use adapter
3. Register adapter with sync service
4. Add unit tests for offline scenarios
5. Test in staging with real field caregivers
6. Monitor sync metrics in production
7. Tune sync intervals and priorities based on usage

## References

- [OFFLINE_FIRST_ARCHITECTURE.md](../../OFFLINE_FIRST_ARCHITECTURE.md)
- [SYNC_INTEGRATION_GUIDE.md](../../SYNC_INTEGRATION_GUIDE.md)
- [EVV README](./README.md)
- [21st Century Cures Act EVV Requirements](https://www.medicaid.gov/medicaid/hcbs/guidance/electronic-visit-verification/index.html)
