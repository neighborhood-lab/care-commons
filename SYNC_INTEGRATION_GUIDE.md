# Offline-First Sync Integration Guide

This guide shows how to integrate the offline-first synchronization system into your Care Commons application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Initializing the Sync Service](#initializing-the-sync-service)
3. [Using Sync in React Components](#using-sync-in-react-components)
4. [Queueing Offline Operations](#queueing-offline-operations)
5. [Monitoring Sync Status](#monitoring-sync-status)
6. [Integrating with Verticals](#integrating-with-verticals)
7. [Testing](#testing)

## Quick Start

### 1. Initialize the Sync Service

In your app's entry point (e.g., `App.tsx`), initialize the sync service:

```typescript
import { useEffect } from 'react';
import { initializeSyncService } from '@/core/services/sync-service';

function App() {
  useEffect(() => {
    // Initialize sync service on app start
    const syncService = initializeSyncService({
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
      deviceId: getDeviceId(), // Generate or retrieve device ID
      autoSyncInterval: 30000, // 30 seconds
      entities: ['VISIT', 'EVV_RECORD', 'TIME_ENTRY', 'TASK', 'CLIENT', 'CAREGIVER'],
    });

    // Cleanup on unmount
    return () => {
      syncService.shutdown();
    };
  }, [currentUser]);

  return <YourAppComponents />;
}
```

### 2. Use Sync Hooks in Components

```typescript
import { useSyncStatus } from '@/core/hooks/sync';

function SyncIndicator() {
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    lastSyncTime,
    syncNow 
  } = useSyncStatus();

  return (
    <div>
      {!isOnline && <Badge>Offline</Badge>}
      {isSyncing && <Spinner />}
      {pendingCount > 0 && <Badge>{pendingCount} pending</Badge>}
      <button onClick={syncNow}>Sync Now</button>
    </div>
  );
}
```

### 3. Queue Operations When Creating/Updating Data

```typescript
import { useOfflineQueue } from '@/core/hooks/sync';

function CreateVisitForm() {
  const { queueOperation } = useOfflineQueue();

  const handleSubmit = async (visitData) => {
    // Queue the operation for sync
    await queueOperation({
      operationType: 'CREATE',
      entityType: 'VISIT',
      entityId: visitData.id,
      data: visitData,
      metadata: {
        caregiverId: currentUser.id,
        timestamp: Date.now(),
      },
    });

    // Operation is now queued and will sync when online
    toast.success('Visit created (will sync when online)');
  };

  return <YourForm onSubmit={handleSubmit} />;
}
```

## Initializing the Sync Service

### Full Configuration Options

```typescript
interface SyncServiceConfig {
  organizationId: string;    // Required: User's organization
  userId: string;            // Required: Current user ID
  deviceId: string;          // Required: Unique device identifier
  autoSyncInterval?: number; // Optional: Auto-sync interval in ms (default: 30000)
  entities?: SyncEntityType[]; // Optional: Entities to sync (default: all)
}
```

### Device ID Generation

Create a persistent device ID:

```typescript
function getDeviceId(): string {
  const DEVICE_ID_KEY = 'care-commons-device-id';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}
```

### Conditional Initialization

Only initialize sync for authenticated users:

```typescript
function App() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const syncService = initializeSyncService({
      organizationId: user.organizationId,
      userId: user.id,
      deviceId: getDeviceId(),
    });

    return () => {
      syncService.shutdown();
    };
  }, [isAuthenticated, user]);

  // ...
}
```

## Using Sync in React Components

### Monitor Sync Status

```typescript
import { useSyncStatus } from '@/core/hooks/sync';

function SyncStatusWidget() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    conflictCount,
    lastSyncTime,
    lastSyncError,
    syncNow,
  } = useSyncStatus();

  if (!isOnline) {
    return (
      <Alert variant="warning">
        <WifiOff className="w-4 h-4" />
        <span>Offline - {pendingCount} changes pending</span>
      </Alert>
    );
  }

  if (failedCount > 0) {
    return (
      <Alert variant="error">
        <AlertCircle className="w-4 h-4" />
        <span>{failedCount} sync failures</span>
        <button onClick={syncNow}>Retry</button>
      </Alert>
    );
  }

  if (conflictCount > 0) {
    return (
      <Alert variant="warning">
        <Info className="w-4 h-4" />
        <span>{conflictCount} conflicts need review</span>
        <Link to="/admin/conflicts">Review</Link>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="w-4 h-4 text-green-500" />
      <span>Synced {formatRelativeTime(lastSyncTime)}</span>
      {isSyncing && <Spinner className="w-4 h-4" />}
    </div>
  );
}
```

### Network Status Detection

```typescript
import { useNetworkStatus } from '@/core/hooks/sync';

function NetworkBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Show banner when coming back online
  if (isOnline && wasOffline) {
    return (
      <Banner variant="success">
        Back online - syncing changes...
      </Banner>
    );
  }

  if (!isOnline) {
    return (
      <Banner variant="warning">
        You are offline. Changes will be saved and synced when connection is restored.
      </Banner>
    );
  }

  return null;
}
```

## Queueing Offline Operations

### Basic Usage

```typescript
import { useOfflineQueue } from '@/core/hooks/sync';

function EVVClockIn({ visitId, caregiverId }) {
  const { queueOperation, isOnline } = useOfflineQueue();

  const handleClockIn = async () => {
    const clockInData = {
      id: generateUUID(),
      visitId,
      caregiverId,
      timestamp: Date.now(),
      location: await getCurrentLocation(),
      // ... other EVV data
    };

    // Queue for sync (works offline or online)
    await queueOperation({
      operationType: 'CREATE',
      entityType: 'EVV_RECORD',
      entityId: clockInData.id,
      data: clockInData,
      metadata: {
        priority: 100, // High priority for clock-in
        requiresLocation: true,
      },
    });

    // Update local UI immediately
    setClockInTime(clockInData.timestamp);
  };

  return (
    <button onClick={handleClockIn}>
      Clock In {!isOnline && '(Offline)'}
    </button>
  );
}
```

### With Error Handling

```typescript
const handleSave = async (data) => {
  try {
    await queueOperation({
      operationType: 'UPDATE',
      entityType: 'CLIENT',
      entityId: data.id,
      data,
    });

    toast.success(
      isOnline 
        ? 'Saved and syncing...' 
        : 'Saved offline - will sync when online'
    );
  } catch (error) {
    toast.error('Failed to save changes');
    console.error('Queue operation failed:', error);
  }
};
```

### Batch Operations

```typescript
const handleBulkUpdate = async (tasks: Task[]) => {
  const operations = tasks.map(task => ({
    operationType: 'UPDATE' as const,
    entityType: 'TASK' as const,
    entityId: task.id,
    data: task,
  }));

  // Queue all operations
  await Promise.all(
    operations.map(op => queueOperation(op))
  );

  toast.success(`${tasks.length} tasks queued for sync`);
};
```

## Monitoring Sync Status

### Display Sync Metrics

```typescript
function SyncMetricsDashboard() {
  const {
    pendingCount,
    failedCount,
    conflictCount,
    lastSyncTime,
    syncNow,
  } = useSyncStatus();

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>Pending Changes</CardHeader>
        <CardContent className="text-3xl">{pendingCount}</CardContent>
      </Card>

      <Card>
        <CardHeader>Failed Syncs</CardHeader>
        <CardContent className="text-3xl text-red-500">
          {failedCount}
        </CardContent>
        {failedCount > 0 && (
          <CardFooter>
            <button onClick={syncNow}>Retry All</button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>Conflicts</CardHeader>
        <CardContent className="text-3xl text-yellow-500">
          {conflictCount}
        </CardContent>
        {conflictCount > 0 && (
          <CardFooter>
            <Link to="/admin/conflicts">Review</Link>
          </CardFooter>
        )}
      </Card>

      <Card className="col-span-3">
        <CardHeader>Last Sync</CardHeader>
        <CardContent>
          {lastSyncTime 
            ? formatRelativeTime(lastSyncTime)
            : 'Never synced'
          }
        </CardContent>
      </Card>
    </div>
  );
}
```

### Subscribe to Sync Events

```typescript
import { useEffect } from 'react';
import { getSyncService } from '@/core/services/sync-service';

function SyncEventLogger() {
  useEffect(() => {
    const syncService = getSyncService();
    if (!syncService) return;

    const unsubscribe = syncService.subscribe((state) => {
      console.log('[Sync State]', state);

      // Log to analytics
      if (state.isSyncing) {
        analytics.track('Sync Started');
      }

      if (state.lastSyncError) {
        analytics.track('Sync Failed', {
          error: state.lastSyncError,
        });
      }

      // Trigger notifications
      if (state.conflictCount > 0) {
        showNotification({
          title: 'Sync Conflicts',
          message: `${state.conflictCount} conflicts need review`,
        });
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
```

## Integrating with Verticals

### EVV Clock In/Out Example

```typescript
// In EVV vertical: verticals/time-tracking-evv/src/hooks/useEVVClockIn.ts

import { useOfflineQueue } from '@care-commons/web/core/hooks/sync';
import type { EVVRecord } from '../types';

export function useEVVClockIn() {
  const { queueOperation } = useOfflineQueue();

  const clockIn = async (visitId: string, caregiverId: string) => {
    const evvRecord: EVVRecord = {
      id: generateUUID(),
      visitId,
      caregiverId,
      clockInTime: Date.now(),
      clockInLocation: await getCurrentLocation(),
      clockInMethod: 'MOBILE_GPS',
      // ... other required EVV fields
    };

    // Save to local database
    await database.write(async () => {
      await database.get('evv_records').create((record) => {
        Object.assign(record, evvRecord);
      });
    });

    // Queue for sync to server
    await queueOperation({
      operationType: 'CREATE',
      entityType: 'EVV_RECORD',
      entityId: evvRecord.id,
      data: evvRecord,
      metadata: {
        priority: 100, // High priority for EVV compliance
      },
    });

    return evvRecord;
  };

  return { clockIn };
}
```

### Client Demographics Update

```typescript
// In Client Demographics vertical

import { useOfflineQueue } from '@care-commons/web/core/hooks/sync';

export function useClientUpdate() {
  const { queueOperation } = useOfflineQueue();

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    // Update local database
    await database.write(async () => {
      const client = await database.get('clients').find(clientId);
      await client.update((c) => {
        Object.assign(c, updates);
      });
    });

    // Queue for sync
    await queueOperation({
      operationType: 'UPDATE',
      entityType: 'CLIENT',
      entityId: clientId,
      data: updates,
      metadata: {
        updatedFields: Object.keys(updates),
      },
    });
  };

  return { updateClient };
}
```

### Care Plan Task Completion

```typescript
// In Care Plans vertical

export function useTaskCompletion() {
  const { queueOperation } = useOfflineQueue();

  const completeTask = async (taskId: string, completionData: TaskCompletion) => {
    const taskUpdate = {
      id: taskId,
      status: 'COMPLETED',
      completedAt: Date.now(),
      completedBy: currentUser.id,
      ...completionData,
    };

    // Update local state
    await database.write(async () => {
      const task = await database.get('care_plan_tasks').find(taskId);
      await task.update((t) => {
        Object.assign(t, taskUpdate);
      });
    });

    // Queue for sync
    await queueOperation({
      operationType: 'UPDATE',
      entityType: 'TASK',
      entityId: taskId,
      data: taskUpdate,
      metadata: {
        taskType: 'CARE_PLAN_TASK',
      },
    });
  };

  return { completeTask };
}
```

## Testing

### Unit Testing Sync Operations

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineQueue } from '@/core/hooks/sync';

describe('useOfflineQueue', () => {
  it('should queue operations for sync', async () => {
    const { result } = renderHook(() => useOfflineQueue());

    await act(async () => {
      const queueId = await result.current.queueOperation({
        operationType: 'CREATE',
        entityType: 'VISIT',
        entityId: 'visit-123',
        data: { visitData: 'test' },
      });

      expect(queueId).toBeDefined();
    });
  });

  it('should work offline', async () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineQueue());

    expect(result.current.isOnline).toBe(false);

    // Should still queue successfully
    await act(async () => {
      await result.current.queueOperation({
        operationType: 'UPDATE',
        entityType: 'CLIENT',
        entityId: 'client-456',
        data: {},
      });
    });
  });
});
```

### Integration Testing

```typescript
import { initializeSyncService, getSyncService } from '@/core/services/sync-service';
import { database } from '@/db';

describe('Sync Integration', () => {
  beforeEach(async () => {
    // Initialize clean database
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });

    // Initialize sync service
    initializeSyncService({
      organizationId: 'org-test',
      userId: 'user-test',
      deviceId: 'device-test',
    });
  });

  afterEach(() => {
    const service = getSyncService();
    service?.shutdown();
  });

  it('should sync queued operations when online', async () => {
    const service = getSyncService();
    expect(service).toBeDefined();

    // Queue an operation
    await database.write(async () => {
      await database.get('sync_queue').create((item) => {
        Object.assign(item, {
          operationType: 'CREATE',
          entityType: 'VISIT',
          entityId: 'visit-123',
          payloadJson: JSON.stringify({ test: 'data' }),
          status: 'PENDING',
          priority: 10,
        });
      });
    });

    // Trigger sync
    await service!.sync();

    // Verify sync completed
    const state = service!.getState();
    expect(state.lastSyncAt).toBeDefined();
  });
});
```

## Best Practices

### 1. Always Queue Critical Operations

For regulatory compliance (EVV, HIPAA), always queue critical operations:

```typescript
// ✅ GOOD: Queues operation for guaranteed sync
await queueOperation({
  operationType: 'CREATE',
  entityType: 'EVV_RECORD',
  entityId: clockInId,
  data: evvData,
});

// ❌ BAD: Direct API call can fail offline
await api.post('/evv/clock-in', evvData);
```

### 2. Provide User Feedback

Always inform users about sync status:

```typescript
const handleSave = async (data) => {
  await queueOperation({ ... });
  
  if (isOnline) {
    toast.success('Saved - syncing to server');
  } else {
    toast.info('Saved offline - will sync when online');
  }
};
```

### 3. Handle Conflicts Gracefully

Design your UI to support conflict resolution:

```typescript
if (conflictCount > 0) {
  return (
    <Alert variant="warning">
      Some changes conflict with server updates.
      <Link to="/conflicts">Review and resolve</Link>
    </Alert>
  );
}
```

### 4. Test Offline Scenarios

Always test your features offline:

```typescript
// In your tests
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false,
});

// Trigger your feature
await userEvent.click(clockInButton);

// Verify it works offline
expect(screen.getByText(/saved offline/i)).toBeInTheDocument();
```

## Regulatory Compliance Notes

### EVV Requirements (21st Century Cures Act)

The sync system ensures EVV compliance:

- **High Priority Queue**: Clock in/out operations have priority 100
- **Retry Logic**: Exponential backoff ensures eventual sync
- **Audit Trail**: All queue operations are logged with timestamps
- **Offline Support**: Caregivers can clock in/out without connectivity

### HIPAA Compliance

- **Encryption**: All synced data uses HTTPS
- **Authentication**: Auth tokens required for all sync endpoints
- **Audit Logs**: Server tracks all sync operations
- **Access Control**: Organization-scoped data access

### State-Specific Requirements

Configure sync behavior per state:

```typescript
const config = getStateConfig(stateCode);

initializeSyncService({
  autoSyncInterval: config.syncInterval,
  entities: config.requiredEntities,
  // ...
});
```

## Troubleshooting

### Sync Not Working

1. Check if sync service is initialized:
   ```typescript
   const service = getSyncService();
   console.log('Sync service:', service ? 'initialized' : 'NOT initialized');
   ```

2. Check network status:
   ```typescript
   const { isOnline } = useNetworkStatus();
   console.log('Network status:', isOnline ? 'online' : 'offline');
   ```

3. Check for errors:
   ```typescript
   const { lastSyncError } = useSyncStatus();
   if (lastSyncError) {
     console.error('Last sync error:', lastSyncError);
   }
   ```

### High Pending Count

If pending count stays high:

1. Check for failed operations:
   ```typescript
   const { failedCount } = useSyncStatus();
   ```

2. Manually trigger sync:
   ```typescript
   await syncNow();
   ```

3. Review server logs for errors

### Memory Leaks

Always cleanup subscriptions:

```typescript
useEffect(() => {
  const service = getSyncService();
  if (!service) return;

  const unsubscribe = service.subscribe(handleStateChange);
  
  // ✅ IMPORTANT: Return cleanup function
  return unsubscribe;
}, []);
```

## Next Steps

- Review [OFFLINE_FIRST_ARCHITECTURE.md](./OFFLINE_FIRST_ARCHITECTURE.md) for technical details
- Check [OFFLINE_FIRST_IMPLEMENTATION_SUMMARY.md](./OFFLINE_FIRST_IMPLEMENTATION_SUMMARY.md) for implementation status
- See individual vertical READMEs for vertical-specific integration examples
