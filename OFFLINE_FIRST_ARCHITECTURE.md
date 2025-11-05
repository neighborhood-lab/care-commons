# Offline-First Architecture Implementation

## Overview

This document describes the offline-first architecture implemented for Care Commons, enabling caregivers to work without internet connectivity and automatically sync data when connection is restored.

## Why Offline-First Matters

In home healthcare, caregivers frequently encounter connectivity challenges:
- **Basement apartments** with poor cell reception
- **Rural areas** with limited coverage
- **Multi-story buildings** where signal degrades
- **Network congestion** in dense areas

Without offline support, these situations prevent caregivers from:
- Clocking in/out for EVV compliance
- Completing care tasks
- Recording visit notes
- Updating client information

**The result**: Lost billable hours, compliance violations, and frustrated caregivers.

## Architecture Components

### 1. Client-Side Database (WatermelonDB)

**Purpose**: Local storage for offline data persistence

**Technology**: 
- **Mobile**: SQLite with WatermelonDB
- **Web**: IndexedDB with WatermelonDB + LokiJS adapter

**Location**: 
- `packages/mobile/src/database/`
- `packages/web/src/db/`

**Schema**: Mirrors server database for core entities:
- Visits
- EVV Records
- Time Entries
- Tasks
- Clients
- Caregivers
- Geofences

**Key Features**:
- Reactive queries (automatic UI updates)
- Lazy loading (fetch only what's needed)
- Fast indexed searches
- Observable data streams (RxJS)

### 2. Sync Queue

**Purpose**: Track pending operations for server sync

**Location**: `packages/core/src/sync/offline-queue.ts`

**Queue Item Structure**:
```typescript
{
  id: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'VISIT' | 'EVV_RECORD' | 'TIME_ENTRY' | ...;
  entityId: string;
  payload: Record<string, unknown>;
  priority: number;
  retryCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'RETRY' | 'FAILED' | 'SYNCED';
}
```

**Priority System**:
- `CLOCK_IN`: 100 (highest - EVV compliance critical)
- `CLOCK_OUT`: 90 (high - affects billing)
- `TASK_COMPLETE`: 70
- `NOTE_CREATE`: 50
- `SYNC_VISIT`: 30
- `DEFAULT`: 10

### 3. Sync Protocol

**Purpose**: Two-way synchronization between client and server

**Location**: `packages/core/src/sync/sync-protocol.ts`

#### Pull Changes (Server → Client)

Clients periodically pull changes from the server:

```typescript
interface PullChangesRequest {
  lastPulledAt: number;           // Unix timestamp of last pull
  entities: SyncEntityType[];     // Which entities to sync
  organizationId: string;
  branchId?: string;
  caregiverId?: string;
}

interface PullChangesResponse {
  changes: SyncChange[];          // Server changes since lastPulledAt
  timestamp: number;              // New timestamp for next pull
  hasMore: boolean;               // Pagination indicator
}
```

#### Push Changes (Client → Server)

Clients push local changes to server:

```typescript
interface PushChangesRequest {
  changes: LocalChange[];         // Local pending changes
  deviceId: string;               // For conflict tracking
  timestamp: number;
  organizationId: string;
}

interface PushChangesResponse {
  success: boolean;
  synced: number;                 // Count of successful syncs
  conflicts: SyncConflict[];      // Conflicts requiring resolution
  errors: SyncError[];            // Errors for retry
}
```

### 4. Conflict Resolution

**Purpose**: Resolve conflicts when same data modified offline on multiple devices

**Location**: `packages/core/src/sync/conflict-resolver.ts`

**Strategies**:

#### 1. Last Write Wins
Used for most fields where newest modification should win:
```typescript
// Example: Visit status field
if (remoteUpdatedAt > localUpdatedAt) {
  return remoteValue;  // Server wins
} else {
  return localValue;   // Client wins
}
```

#### 2. Merge Arrays
Used for lists (tasks, notes) where both sides may add items:
```typescript
// Example: Task list
const merged = unionBy([...localTasks, ...remoteTasks], 'id');
// Result: All tasks from both sides, deduplicated by ID
```

#### 3. Manual Review
Used for critical fields where automated resolution is risky:
```typescript
// Example: Clock in/out times (billing-critical)
return {
  winner: 'MANUAL',
  requiresReview: true,
  reviewBy: 'ADMINISTRATOR',
  metadata: { localValue, remoteValue, reason }
};
```

#### 4. Server Wins
Used when server is always authoritative:
```typescript
// Example: Client authorization status (only server can change)
return remoteValue;
```

**Critical Fields Requiring Manual Review**:
- `clockInTime` / `clockOutTime` - Affects billing
- `serviceDate` - EVV compliance
- `totalDuration` - Billing calculation
- `authorizationId` - Payor requirement

### 5. Retry Logic

**Purpose**: Handle transient network failures gracefully

**Location**: `packages/core/src/sync/offline-queue.ts`

**Exponential Backoff**:
```
Retry 1: 2 seconds
Retry 2: 4 seconds
Retry 3: 8 seconds
Retry 4: 16 seconds
Retry 5: 32 seconds (max: 60 seconds)
```

**Max Retries**: 5 attempts

**After Max Retries**:
- Item marked as `FAILED`
- User notified
- Supervisor review required for critical operations

### 6. UI Components

**Purpose**: Visual feedback for sync status

**Location**: `packages/web/src/components/sync/`

#### SyncStatusBadge

Shows current sync state:
- ✅ **Green**: All synced (e.g., "Synced 5m ago")
- 🔄 **Orange**: Syncing (e.g., "Syncing 3 items...")
- ⚠️ **Yellow**: Offline with pending (e.g., "Offline - 5 pending")
- ❌ **Red**: Sync failed (e.g., "3 sync failed - Retry")
- ⚫ **Gray**: Offline, no pending

#### NetworkStatusBanner

Prominent banner at top of screen:
- **Offline**: "You're offline. Changes are being saved locally and will sync when you reconnect."
- **Reconnected**: "Back online. Your data is now syncing with the server." (auto-hides after 5s)

## Data Flow

### Offline Operation

```
1. User performs action (e.g., clock in)
   ↓
2. Data saved to local database
   ↓
3. Operation added to sync queue (status: PENDING)
   ↓
4. UI updates immediately (optimistic update)
   ↓
5. Sync service detects network status
   ↓
6. If offline: Operation waits in queue
   If online: Attempt sync immediately
```

### Sync Process

```
1. Sync service runs (triggered by network change, manual, or interval)
   ↓
2. Fetch pending items from queue (sorted by priority)
   ↓
3. For each item:
   a. Send to server
   b. If success: Mark as SYNCED
   c. If conflict: Resolve using strategy
   d. If error: Schedule retry
   ↓
4. Pull latest changes from server
   ↓
5. Apply server changes to local database
   ↓
6. UI updates automatically (reactive queries)
```

## Implementation Status

### ✅ Completed

- [x] WatermelonDB schema for web and mobile
- [x] Sync queue database models
- [x] Conflict resolution service with multiple strategies
- [x] Priority-based offline queue
- [x] Exponential backoff retry logic
- [x] Pull changes endpoint
- [x] Push changes endpoint
- [x] UI components (SyncStatusBadge, NetworkStatusBanner)
- [x] Core sync protocol
- [x] Comprehensive tests for conflict resolution

### ⏳ In Progress

- [ ] Service worker for background sync (web)
- [ ] Expo BackgroundFetch for background sync (mobile)
- [ ] Sync endpoints in API server
- [ ] Integration with existing EVV vertical

### 📋 Planned

- [ ] Sync analytics dashboard (admin view)
- [ ] Conflict review interface (supervisor tool)
- [ ] Bulk sync optimization
- [ ] Compression for large payloads
- [ ] Differential sync (only changed fields)

## Usage Examples

### Web Application

```typescript
import { database } from '@/db';
import { SyncStatusBadge, NetworkStatusBanner } from '@/components/sync';

// Add to app layout
function AppLayout() {
  return (
    <>
      <NetworkStatusBanner />
      <header>
        <SyncStatusBadge />
      </header>
      {/* ... rest of app */}
    </>
  );
}

// Queue an operation
import { database } from '@/db';
import { Q } from '@nozbe/watermelondb';

async function clockIn(visitId: string, location: Location) {
  await database.write(async () => {
    // Create local time entry
    const timeEntry = await database.get('time_entries').create(entry => {
      entry.visitId = visitId;
      entry.entryType = 'CLOCK_IN';
      entry.entryTimestamp = Date.now();
      entry.locationJson = JSON.stringify(location);
      entry.syncStatus = 'PENDING';
      entry.offlineRecorded = !navigator.onLine;
    });

    // Add to sync queue
    await database.get('sync_queue').create(item => {
      item.operationType = 'CREATE';
      item.entityType = 'TIME_ENTRY';
      item.entityId = timeEntry.id;
      item.payloadJson = JSON.stringify({ visitId, location });
      item.priority = 100; // Highest priority
      item.status = 'PENDING';
    });
  });

  // Sync will trigger automatically if online
}
```

### Mobile Application

```typescript
import { database } from '@/database';
import { OfflineQueueService } from '@/services/offline-queue';

// Initialize offline queue
const queueService = new OfflineQueueService(database);
queueService.startAutoSync(60000); // Sync every 60 seconds

// Queue clock in
await queueService.queueClockIn({
  visitId: 'visit_123',
  caregiverId: 'caregiver_456',
  timestamp: Date.now(),
  location: { latitude, longitude, accuracy },
});

// Check queue status
const status = await queueService.getQueueStatus();
console.log(`${status.pending} pending, ${status.failed} failed`);
```

## Testing

### Unit Tests

Run conflict resolution tests:
```bash
cd packages/core
npm run test src/__tests__/sync/conflict-resolver.test.ts
```

### Integration Tests

Test full sync flow:
```bash
cd packages/web
npm run test src/__tests__/integration/sync-flow.test.ts
```

### Manual Testing

1. **Go offline**: Turn off network
2. **Perform actions**: Clock in, complete tasks, add notes
3. **Verify local storage**: Check sync queue in DevTools
4. **Go online**: Restore network
5. **Verify sync**: Confirm data appears on server

## Performance Considerations

### Database Size

- **Mobile**: SQLite handles 100k+ records efficiently
- **Web**: IndexedDB handles 50k+ records (browser-dependent)

### Sync Batch Size

- **Default**: 20 items per sync cycle
- **Rationale**: Balances speed vs. memory usage
- **Configurable**: Can increase for faster bulk sync

### Storage Limits

- **Mobile**: ~50MB typical, ~500MB maximum
- **Web**: 50MB-1GB (varies by browser)

### Cache Invalidation

- **Synced items**: Deleted after 7 days
- **Failed items**: Kept indefinitely for review
- **Manual cleanup**: Admin tool available

## Security

### Data Encryption

- **At rest**: Device-level encryption (iOS/Android)
- **In transit**: TLS 1.3 for all sync requests
- **Local storage**: IndexedDB encrypted in secure browsers

### Authentication

- **JWT tokens**: Stored in secure storage (Keychain/SharedPreferences)
- **Token refresh**: Automatic before sync attempts
- **Expired tokens**: Clear local data, require re-login

### Audit Trail

- All sync operations logged with:
  - Device ID
  - Timestamp
  - User ID
  - Operation type
  - Success/failure status

## Troubleshooting

### Sync Not Happening

1. Check network status
2. Verify queue has pending items
3. Check for failed items needing retry
4. Review error logs in sync queue

### Conflicts Keep Occurring

1. Check if multiple devices editing same records
2. Review conflict resolution strategy
3. Consider manual review for critical fields
4. Coordinate edits across team

### Database Growing Too Large

1. Run cleanup for old synced items
2. Limit cached data to recent records
3. Implement pagination for large lists
4. Clear and resync database

## Regulatory Compliance

### EVV Requirements (21st Century Cures Act)

Offline-first architecture ensures all six required elements are captured even without connectivity:

1. ✅ **Type of service**: Saved to local visit record
2. ✅ **Individual receiving service**: Client ID in local database
3. ✅ **Individual providing service**: Caregiver ID in local database
4. ✅ **Location of service**: GPS coordinates in time entry
5. ✅ **Date of service**: Service date in EVV record
6. ✅ **Time service begins/ends**: Clock in/out timestamps

### HIPAA Compliance

- **Encryption**: All PHI encrypted at rest and in transit
- **Access control**: Permission-based access to local data
- **Audit logging**: All sync operations logged
- **Data retention**: Configurable retention periods

### State-Specific Requirements

#### Texas
- **HHAeXchange aggregator**: Sync queue ensures submission
- **GPS required**: Location captured with each time entry
- **10-minute grace period**: Validated offline before sync

#### Florida
- **Multi-aggregator**: Sync protocol supports routing
- **15-minute grace period**: Validated offline before sync
- **RN supervision visits**: Scheduled and synced offline

## Future Enhancements

### Phase 2: Advanced Sync
- Differential sync (only changed fields)
- Compression for bandwidth savings
- Batch conflict resolution UI

### Phase 3: Analytics
- Sync performance dashboard
- Conflict rate monitoring
- Offline usage patterns

### Phase 4: Optimization
- Predictive prefetching
- Smart sync scheduling
- Adaptive retry strategies

---

**Care Commons** - Offline-first architecture for reliable home healthcare  
Built with ❤️ by [Neighborhood Lab](https://neighborhoodlab.org)
