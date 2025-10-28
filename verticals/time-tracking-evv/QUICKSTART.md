# Time Tracking & EVV - Quick Start Guide

Get started with Electronic Visit Verification in under 10 minutes.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for background jobs)
- Mobile device with GPS (for testing)

## Installation

```bash
# From repository root
npm install

# Build the EVV vertical
cd verticals/time-tracking-evv
npm run build
```

## Database Setup

```bash
# Run migrations to create EVV tables
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

## Basic Usage

### 1. Initialize the Service

```typescript
import { EVVService, EVVRepository, EVVValidator } from '@care-commons/time-tracking-evv';
import { getConnection } from '@care-commons/core';

const db = getConnection();
const repository = new EVVRepository(db);
const validator = new EVVValidator();
const evvService = new EVVService(repository, validator);
```

### 2. Create a Geofence

First, create a geofence around the client's address:

```typescript
const geofence = await evvService.createGeofence({
  organizationId: 'your-org-id',
  clientId: 'client-123',
  addressId: 'address-456',
  centerLatitude: 39.7817,
  centerLongitude: -89.6501,
  radiusMeters: 100, // 100 meter radius
}, userContext);

console.log('✓ Geofence created:', geofence.id);
```

### 3. Clock In

Caregiver clocks in when arriving at client location:

```typescript
const clockInResult = await evvService.clockIn({
  visitId: 'visit-123',
  caregiverId: 'caregiver-456',
  location: {
    latitude: 39.7817,
    longitude: -89.6501,
    accuracy: 12.5,
    timestamp: new Date(),
    method: 'GPS',
    mockLocationDetected: false,
  },
  deviceInfo: {
    deviceId: 'device-abc',
    deviceModel: 'iPhone 13',
    deviceOS: 'iOS',
    osVersion: '17.2',
    appVersion: '1.0.0',
    batteryLevel: 85,
    networkType: 'WIFI',
    isRooted: false,
    isJailbroken: false,
  },
  clientPresent: true,
}, userContext);

if (clockInResult.verification.passed) {
  console.log('✓ Clock-in verified!');
} else {
  console.log('⚠️ Verification issues:', clockInResult.verification.issues);
}
```

### 4. Clock Out

Caregiver clocks out when leaving:

```typescript
const clockOutResult = await evvService.clockOut({
  visitId: 'visit-123',
  evvRecordId: clockInResult.evvRecord.id,
  caregiverId: 'caregiver-456',
  location: {
    latitude: 39.7817,
    longitude: -89.6501,
    accuracy: 15.2,
    timestamp: new Date(),
    method: 'GPS',
    mockLocationDetected: false,
  },
  deviceInfo: {
    // ... same device info
  },
  completionNotes: 'All tasks completed',
  tasksCompleted: 8,
  tasksTotal: 8,
  clientSignature: {
    attestedByName: 'John Doe',
    attestationType: 'SIGNATURE',
    signatureData: 'data:image/png;base64,...',
    statement: 'Services received as documented',
  },
}, userContext);

console.log('✓ Clock-out successful');
console.log('  Duration:', clockOutResult.evvRecord.totalDuration, 'minutes');
console.log('  Status:', clockOutResult.evvRecord.recordStatus);
```

### 5. View EVV Record

```typescript
const evvRecord = await evvService.getEVVRecordByVisit('visit-123', userContext);

if (evvRecord) {
  console.log('EVV Record:', {
    serviceDate: evvRecord.serviceDate,
    duration: evvRecord.totalDuration,
    status: evvRecord.recordStatus,
    verificationLevel: evvRecord.verificationLevel,
    complianceFlags: evvRecord.complianceFlags,
  });
}
```

## Testing Location Verification

### Test In-Geofence (Should Pass)

```typescript
const result = await evvService.clockIn({
  visitId: 'visit-test-1',
  caregiverId: 'caregiver-test',
  location: {
    latitude: 39.7817,  // Exactly at center
    longitude: -89.6501,
    accuracy: 10,
    timestamp: new Date(),
    method: 'GPS',
    mockLocationDetected: false,
  },
  deviceInfo: { /* ... */ },
}, userContext);

// Should pass: ✓ Within geofence
console.log('Verification:', result.verification.passed);
```

### Test Outside Geofence (Should Fail)

```typescript
const result = await evvService.clockIn({
  visitId: 'visit-test-2',
  caregiverId: 'caregiver-test',
  location: {
    latitude: 39.8000,  // ~2km away
    longitude: -89.6700,
    accuracy: 10,
    timestamp: new Date(),
    method: 'GPS',
    mockLocationDetected: false,
  },
  deviceInfo: { /* ... */ },
}, userContext);

// Should fail: ✗ Outside geofence
console.log('Verification:', result.verification.passed);
console.log('Issues:', result.verification.issues);
```

### Test Mock Location Detection (Should Fail)

```typescript
const result = await evvService.clockIn({
  visitId: 'visit-test-3',
  caregiverId: 'caregiver-test',
  location: {
    latitude: 39.7817,
    longitude: -89.6501,
    accuracy: 10,
    timestamp: new Date(),
    method: 'GPS',
    mockLocationDetected: true,  // ✗ GPS spoofing detected
  },
  deviceInfo: { /* ... */ },
}, userContext);

// Should fail: ✗ Mock location detected
console.log('Verification:', result.verification.passed);
console.log('Issues:', result.verification.issues);
```

## Manual Override Example

When legitimate verification issues occur:

```typescript
// Supervisor reviews and approves
await evvService.applyManualOverride({
  timeEntryId: 'time-entry-123',
  reason: 'Client relocated to neighbor\'s house temporarily',
  reasonCode: 'CLIENT_LOCATION_CHANGE',
  supervisorName: 'Sarah Johnson',
  supervisorTitle: 'Care Coordinator',
  approvalAuthority: 'Override Policy 4.2',
  notes: 'Confirmed with client and family',
}, supervisorUserContext);

console.log('✓ Manual override applied');
```

## Offline Mode (Mobile App)

Handle offline clock-in/out:

```typescript
// Store clock-in locally when offline
const offlineData = {
  visitId: 'visit-123',
  caregiverId: 'caregiver-456',
  location: { /* GPS data */ },
  deviceInfo: { /* device data */ },
  offlineRecorded: true,
  offlineRecordedAt: new Date(),
  syncMetadata: {
    syncId: generateUUID(),
    lastSyncedAt: null,
    syncStatus: 'PENDING',
  },
};

// Store in local database (SQLite/IndexedDB)
await localDB.storeTimeEntry(offlineData);

// Later, when online:
const pending = await localDB.getPendingTimeEntries();
for (const entry of pending) {
  try {
    await evvService.clockIn(entry, userContext);
    await localDB.markAsSynced(entry.id);
  } catch (error) {
    // Will retry later
    console.error('Sync failed:', error);
  }
}
```

## Common Issues

### Issue: "GPS accuracy too low"

GPS accuracy over 100m may cause verification issues.

**Solution**: Wait for better GPS signal before clocking in.

```typescript
// Wait for acceptable accuracy
while (currentAccuracy > 50) {
  await wait(2000);
  currentLocation = await getLocation();
  currentAccuracy = currentLocation.accuracy;
}
```

### Issue: "Location outside geofence"

Caregiver may be at client location but GPS shows outside.

**Solution**: 
1. Check if geofence radius is too small
2. Consider GPS accuracy in verification
3. Apply manual override if legitimate

```typescript
// Increase geofence radius for this location
await updateGeofence(geofenceId, { radiusMeters: 150 });
```

### Issue: "Mock location detected"

Device has mock location/GPS spoofing enabled.

**Solution**: User must disable mock location in device settings.

```typescript
// Detect and warn user
if (location.mockLocationDetected) {
  showAlert('Please disable mock location in device settings');
  return;
}
```

## Next Steps

1. **Review Integration Points** - See how EVV connects with Scheduling and Billing
2. **Implement Mobile UI** - Build clock-in/out screens in mobile app
3. **Configure State Requirements** - Add state-specific EVV fields
4. **Setup Payor Submission** - Configure billing system integration
5. **Train Staff** - Educate supervisors on manual override procedures

## Resources

- [Full Documentation](./README.md)
- [API Reference](./docs/API.md)
- [State Requirements Guide](./docs/STATE_REQUIREMENTS.md)
- [Mobile App Integration](./docs/MOBILE_INTEGRATION.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Support

Questions? Issues?

- GitHub Issues: [github.com/neighborhood-lab/care-commons/issues](https://github.com/neighborhood-lab/care-commons/issues)
- Community: [community.neighborhoodlab.org](https://community.neighborhoodlab.org)

---

**Care Commons** - Shared care software, community owned
