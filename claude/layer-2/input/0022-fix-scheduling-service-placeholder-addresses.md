# Task 0001: Fix Scheduling Service Placeholder Addresses - Wire Real Client Data

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 2-3 hours

## Context

The scheduling service uses hardcoded placeholder addresses for routing and distance calculations instead of real client addresses. This breaks the entire scheduling and routing optimization features in production.

## Problem Statement

**Location**: `verticals/scheduling-visits/src/services/schedule.service.ts` lines 566-576

**Current Code**:
```typescript
// PLACEHOLDER: Replace with real client address lookup
const clientAddress = {
  street: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  coordinates: { lat: 30.2672, lng: -97.7431 }
};
```

**Impact**:
- Route optimization calculates wrong distances
- Caregiver travel time estimates are meaningless
- Shift matching scores are incorrect
- Coordinators can't trust the scheduling suggestions
- Production deployment will fail immediately

## Task

### 1. Wire Up Client Provider

**Import Required Provider**:
```typescript
import { IClientProvider } from '@care-commons/core/providers/client.provider';
```

**Update Service Constructor**:
```typescript
export class ScheduleService {
  constructor(
    private db: Knex,
    private clientProvider: IClientProvider
  ) {}

  // ... existing methods
}
```

### 2. Replace Placeholder Address Lookup

**In `optimizeRouteForCaregiver` method** (around line 566-576):

```typescript
// OLD: Placeholder data
const clientAddress = {
  street: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  coordinates: { lat: 30.2672, lng: -97.7431 }
};

// NEW: Real lookup
const client = await this.clientProvider.getClientById(visit.client_id);
if (!client) {
  throw new Error(`Client not found for visit ${visit.id}: ${visit.client_id}`);
}

if (!client.address) {
  throw new Error(
    `Client ${client.id} (${client.first_name} ${client.last_name}) is missing an address`
  );
}

if (!client.coordinates?.lat || !client.coordinates?.lng) {
  throw new Error(
    `Client ${client.id} address has not been geocoded. Geocode required for route optimization.`
  );
}

const clientAddress = {
  street: client.address.street,
  city: client.address.city,
  state: client.address.state,
  zip: client.address.zip,
  coordinates: client.coordinates
};
```

### 3. Batch Client Lookups for Performance

When optimizing routes with multiple visits, use batch lookup:

```typescript
// Get all unique client IDs from visits
const clientIds = [...new Set(visits.map(v => v.client_id))];

// Batch fetch all clients
const clients = await this.clientProvider.getClientsByIds(clientIds);
const clientMap = new Map(clients.map(c => [c.id, c]));

// Use in route calculation
for (const visit of visits) {
  const client = clientMap.get(visit.client_id);
  if (!client) {
    console.warn(`Client not found for visit ${visit.id}: ${visit.client_id}`);
    continue; // Skip this visit in optimization
  }

  // Use client.coordinates for distance calculation
  const distance = this.calculateDistance(
    currentLocation,
    client.coordinates
  );

  // ... rest of optimization logic
}
```

### 4. Update Shift Matching Algorithm

**In shift matching service** (uses scheduling service):

Ensure shift matching uses real client addresses when calculating proximity scores:

```typescript
// Calculate distance between caregiver and client
const client = await this.clientProvider.getClientById(shift.client_id);

if (client?.coordinates && caregiver.home_coordinates) {
  const distanceScore = this.calculateProximityScore(
    caregiver.home_coordinates,
    client.coordinates
  );
}
```

### 5. Add Client Provider to Dependency Injection

**In service factory** (`verticals/scheduling-visits/src/services/index.ts`):

```typescript
import { ClientProvider } from '@care-commons/core/providers/client.provider';

const clientProvider = new ClientProvider(db);
const scheduleService = new ScheduleService(db, clientProvider);

export { scheduleService };
```

### 6. Handle Missing Data Gracefully

Add graceful degradation for clients without geocoded addresses:

```typescript
/**
 * Validates that a client has all required data for scheduling
 */
private async validateClientForScheduling(clientId: string): Promise<boolean> {
  const client = await this.clientProvider.getClientById(clientId);

  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return false;
  }

  if (!client.address) {
    console.warn(`Client ${clientId} missing address - skipping from route optimization`);
    return false;
  }

  if (!client.coordinates?.lat || !client.coordinates?.lng) {
    console.warn(`Client ${clientId} address not geocoded - skipping from route optimization`);
    return false;
  }

  return true;
}

// Use in optimization
const validVisits = [];
for (const visit of visits) {
  const isValid = await this.validateClientForScheduling(visit.client_id);
  if (isValid) {
    validVisits.push(visit);
  }
}

// Optimize only valid visits
const optimizedRoute = this.optimizeRoute(validVisits);
```

### 7. Add Geocoding Helper

If client addresses aren't geocoded, provide a helper method:

```typescript
/**
 * Geocodes all clients missing coordinates
 * Run this as a migration/setup script
 */
async geocodeAllClientAddresses(): Promise<void> {
  const clients = await this.clientProvider.getAllClients();
  const needsGeocoding = clients.filter(
    c => c.address && (!c.coordinates?.lat || !c.coordinates?.lng)
  );

  console.log(`Geocoding ${needsGeocoding.length} client addresses...`);

  for (const client of needsGeocoding) {
    try {
      const coordinates = await this.geocodeAddress(client.address);
      await this.clientProvider.updateClientCoordinates(client.id, coordinates);
      console.log(`Geocoded: ${client.id} - ${client.address.street}`);
    } catch (error) {
      console.error(`Failed to geocode ${client.id}:`, error);
    }
  }

  console.log('Geocoding complete');
}
```

### 8. Update Tests

**Test file**: `verticals/scheduling-visits/src/services/__tests__/schedule.service.test.ts`

```typescript
describe('ScheduleService with Real Client Data', () => {
  let scheduleService: ScheduleService;
  let mockClientProvider: jest.Mocked<IClientProvider>;

  beforeEach(() => {
    mockClientProvider = {
      getClientById: jest.fn(),
      getClientsByIds: jest.fn()
    };

    scheduleService = new ScheduleService(db, mockClientProvider);
  });

  it('should optimize route with real client addresses', async () => {
    mockClientProvider.getClientsByIds.mockResolvedValue([
      {
        id: 'client-1',
        first_name: 'John',
        last_name: 'Doe',
        address: {
          street: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zip: '78701'
        },
        coordinates: { lat: 30.2672, lng: -97.7431 }
      },
      {
        id: 'client-2',
        first_name: 'Jane',
        last_name: 'Smith',
        address: {
          street: '456 Oak Ave',
          city: 'Austin',
          state: 'TX',
          zip: '78702'
        },
        coordinates: { lat: 30.2850, lng: -97.7340 }
      }
    ]);

    const visits = [
      { id: 'visit-1', client_id: 'client-1', scheduled_start: '2025-01-15T09:00:00Z' },
      { id: 'visit-2', client_id: 'client-2', scheduled_start: '2025-01-15T11:00:00Z' }
    ];

    const optimizedRoute = await scheduleService.optimizeRouteForCaregiver(
      'caregiver-123',
      visits
    );

    expect(optimizedRoute).toBeDefined();
    expect(optimizedRoute.totalDistance).toBeGreaterThan(0);
  });

  it('should skip visits with missing client addresses', async () => {
    mockClientProvider.getClientsByIds.mockResolvedValue([
      {
        id: 'client-1',
        first_name: 'John',
        last_name: 'Doe',
        address: null, // Missing address
        coordinates: null
      }
    ]);

    const visits = [
      { id: 'visit-1', client_id: 'client-1', scheduled_start: '2025-01-15T09:00:00Z' }
    ];

    const optimizedRoute = await scheduleService.optimizeRouteForCaregiver(
      'caregiver-123',
      visits
    );

    // Should return empty route or skip the visit
    expect(optimizedRoute.visits.length).toBe(0);
  });
});
```

## Related Files to Review

- **Schedule Service**: `verticals/scheduling-visits/src/services/schedule.service.ts`
- **Client Provider**: `packages/core/src/providers/client.provider.ts`
- **Shift Matching**: `verticals/shift-matching/src/services/shift-matching.service.ts`
- **Client Demographics**: `verticals/client-demographics/src/services/client.service.ts`

## Acceptance Criteria

- [ ] Scheduling service constructor accepts client provider
- [ ] Placeholder address data replaced with real client lookups
- [ ] Batch client lookups used for performance
- [ ] Route optimization uses real client coordinates
- [ ] Shift matching uses real client coordinates
- [ ] Graceful handling of clients without addresses/coordinates
- [ ] Helper method for geocoding client addresses
- [ ] Tests updated to use mocked provider
- [ ] All existing tests still pass
- [ ] Manual test: Route optimization with 3+ real clients
- [ ] Manual test: Shift matching with real client proximity
- [ ] Code runs without errors in local dev environment

## Testing Checklist

1. **Unit Tests**: All scheduling service tests pass
2. **Integration Test**: Create 3 real clients with addresses, create visits, optimize route
3. **Error Cases**:
   - Route optimization with non-existent client
   - Route optimization with client missing address
   - Route optimization with client missing coordinates
4. **Performance**: Batch lookup should be <100ms for 20 clients

## Definition of Done

- ✅ No placeholder/hardcoded addresses in scheduling service
- ✅ All address lookups use client provider
- ✅ Tests pass with 70%+ coverage
- ✅ Route optimization works end-to-end with real data
- ✅ Graceful degradation for missing data
- ✅ Code reviewed and merged to feature branch

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: None (client provider already exists)

## Priority Justification

This is **CRITICAL** because:
1. Production blocker - scheduling doesn't work with real data
2. Affects core functionality (visit scheduling, route optimization)
3. Impacts coordinators' ability to efficiently schedule visits
4. Fast fix (2-3 hours) with high impact

---

**Previous Task**: 0000 - Fix EVV Service Mocked Data
**Next Task**: 0002 - Implement Care Plans Frontend UI
