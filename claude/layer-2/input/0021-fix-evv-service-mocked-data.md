# Task 0000: Fix EVV Service Mocked Data - Wire Real Provider Lookups

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 3-4 hours

## Context

The EVV service currently uses hardcoded/mocked client and caregiver data instead of real database lookups via provider interfaces. This is a **production blocker** - the feature appears complete but won't work with real data.

## Problem Statement

**Location**: `packages/app/src/services/evv-service.ts` lines 60-92

**Current Code**:
```typescript
// MOCKED DATA - Replace with real provider lookups
const client = {
  id: visit.client_id,
  first_name: 'John',
  last_name: 'Doe',
  address: '123 Main St, Austin, TX 78701',
  coordinates: { lat: 30.2672, lng: -97.7431 }
};

const caregiver = {
  id: visit.caregiver_id,
  first_name: 'Jane',
  last_name: 'Smith'
};
```

**Impact**:
- GPS verification fails with real client addresses
- Caregiver names don't match actual staff
- Distance calculations are meaningless
- Production deployment will fail immediately

## Task

### 1. Wire Up Provider Interfaces

**Import Required Providers**:
```typescript
import { IClientProvider } from '@care-commons/core/providers/client.provider';
import { ICaregiverProvider } from '@care-commons/core/providers/caregiver.provider';
```

**Update Service Constructor**:
```typescript
export class EVVService {
  constructor(
    private db: Knex,
    private clientProvider: IClientProvider,
    private caregiverProvider: ICaregiverProvider
  ) {}

  // ... existing methods
}
```

### 2. Replace Mocked Client Data

**In `checkIn` method** (around line 60-70):

```typescript
// OLD: Mocked data
const client = { id: visit.client_id, ... };

// NEW: Real lookup
const client = await this.clientProvider.getClientById(visit.client_id);
if (!client) {
  throw new Error(`Client not found: ${visit.client_id}`);
}

// Verify client has address and coordinates
if (!client.address || !client.coordinates) {
  throw new Error(`Client ${client.id} missing address/coordinates for GPS verification`);
}
```

### 3. Replace Mocked Caregiver Data

**In `checkIn` method** (around line 75-80):

```typescript
// OLD: Mocked data
const caregiver = { id: visit.caregiver_id, ... };

// NEW: Real lookup
const caregiver = await this.caregiverProvider.getCaregiverById(visit.caregiver_id);
if (!caregiver) {
  throw new Error(`Caregiver not found: ${visit.caregiver_id}`);
}
```

### 4. Update GPS Verification Logic

Use real client coordinates for distance calculation:

```typescript
const distance = this.calculateDistance(
  checkInData.gps_coordinates,
  client.coordinates
);

if (distance > this.GPS_THRESHOLD_METERS) {
  throw new EVVException(
    'GPS_OUT_OF_RANGE',
    `Check-in location is ${distance}m from client address (max ${this.GPS_THRESHOLD_METERS}m)`
  );
}
```

### 5. Update Dependency Injection

**In service factory** (`packages/app/src/services/index.ts` or wherever EVVService is instantiated):

```typescript
import { ClientProvider } from '@care-commons/core/providers/client.provider';
import { CaregiverProvider } from '@care-commons/core/providers/caregiver.provider';

const clientProvider = new ClientProvider(db);
const caregiverProvider = new CaregiverProvider(db);

const evvService = new EVVService(db, clientProvider, caregiverProvider);
```

### 6. Handle Missing Data Gracefully

Add validation for required fields:

```typescript
// Ensure client has required GPS fields
if (!client.address) {
  throw new EVVException(
    'CLIENT_MISSING_ADDRESS',
    `Client ${client.id} (${client.first_name} ${client.last_name}) does not have an address configured`
  );
}

if (!client.coordinates?.lat || !client.coordinates?.lng) {
  throw new EVVException(
    'CLIENT_MISSING_COORDINATES',
    `Client ${client.id} address has not been geocoded. Please geocode the address before scheduling visits.`
  );
}
```

### 7. Update Tests

**Test file**: `packages/app/src/services/__tests__/evv-service.test.ts`

- Mock the provider interfaces
- Test with real client/caregiver data structures
- Test error cases (client not found, missing coordinates)
- Test GPS verification with real coordinates

```typescript
describe('EVVService with Real Providers', () => {
  let evvService: EVVService;
  let mockClientProvider: jest.Mocked<IClientProvider>;
  let mockCaregiverProvider: jest.Mocked<ICaregiverProvider>;

  beforeEach(() => {
    mockClientProvider = {
      getClientById: jest.fn()
    };

    mockCaregiverProvider = {
      getCaregiverById: jest.fn()
    };

    evvService = new EVVService(db, mockClientProvider, mockCaregiverProvider);
  });

  it('should check in with real client coordinates', async () => {
    mockClientProvider.getClientById.mockResolvedValue({
      id: 'client-123',
      first_name: 'John',
      last_name: 'Doe',
      address: '123 Main St, Austin, TX 78701',
      coordinates: { lat: 30.2672, lng: -97.7431 }
    });

    mockCaregiverProvider.getCaregiverById.mockResolvedValue({
      id: 'caregiver-456',
      first_name: 'Jane',
      last_name: 'Smith'
    });

    // ... test check-in logic
  });

  it('should throw error when client not found', async () => {
    mockClientProvider.getClientById.mockResolvedValue(null);

    await expect(
      evvService.checkIn(visitId, checkInData)
    ).rejects.toThrow('Client not found');
  });

  it('should throw error when client missing coordinates', async () => {
    mockClientProvider.getClientById.mockResolvedValue({
      id: 'client-123',
      first_name: 'John',
      last_name: 'Doe',
      address: '123 Main St, Austin, TX 78701',
      coordinates: null
    });

    await expect(
      evvService.checkIn(visitId, checkInData)
    ).rejects.toThrow('missing address/coordinates');
  });
});
```

## Related Files to Review

- **Provider Interfaces**: `packages/core/src/providers/client.provider.ts`
- **Provider Interfaces**: `packages/core/src/providers/caregiver.provider.ts`
- **EVV Service**: `packages/app/src/services/evv-service.ts`
- **Client Demographics**: `verticals/client-demographics/src/services/client.service.ts`
- **Caregiver Staff**: `verticals/caregiver-staff/src/services/caregiver.service.ts`

## Acceptance Criteria

- [ ] EVV service constructor accepts provider interfaces
- [ ] Mocked client data replaced with `clientProvider.getClientById()`
- [ ] Mocked caregiver data replaced with `caregiverProvider.getCaregiverById()`
- [ ] GPS verification uses real client coordinates
- [ ] Error handling for missing clients/caregivers
- [ ] Error handling for missing addresses/coordinates
- [ ] Tests updated to use mocked providers
- [ ] All existing tests still pass
- [ ] Manual test: Check-in with real client succeeds
- [ ] Manual test: Check-in with invalid client fails gracefully
- [ ] Code runs without errors in local dev environment

## Testing Checklist

1. **Unit Tests**: All EVV service tests pass
2. **Integration Test**: Create real client with address, create visit, perform check-in
3. **Error Cases**:
   - Check-in with non-existent client ID
   - Check-in with client missing address
   - Check-in with client missing coordinates
   - Check-in outside GPS range
4. **Performance**: Verify provider lookups don't slow down check-in (<500ms total)

## Definition of Done

- ✅ No mocked/hardcoded client or caregiver data in EVV service
- ✅ All lookups use provider interfaces
- ✅ Tests pass with 70%+ coverage
- ✅ Error messages are helpful (not technical stack traces)
- ✅ GPS verification works end-to-end with real data
- ✅ Code reviewed and merged to feature branch

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: None (providers already exist)

## Priority Justification

This is **CRITICAL** because:
1. Production blocker - feature doesn't work with real data
2. Affects core functionality (EVV compliance)
3. Impacts caregivers' ability to check in/out
4. Fast fix (3-4 hours) with high impact

---

**Next Task**: 0001 - Fix Scheduling Service Placeholder Addresses
