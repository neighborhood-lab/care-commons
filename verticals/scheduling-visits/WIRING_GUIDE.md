# Scheduling Service Wiring Guide

This guide shows how to properly wire up the `ScheduleService` with real client address data from the `client-demographics` vertical.

## Problem

The scheduling service needs access to real client addresses for:
- Visit address assignment when generating schedules from patterns
- Route optimization calculations
- Distance/travel time estimates
- EVV geofence validation

Without proper wiring, the service will throw errors when trying to fetch client addresses.

## Solution

Use the `createScheduleService()` factory function to automatically wire up all dependencies.

## Quick Start

### 1. Basic Setup

```typescript
import { createScheduleService } from '@care-commons/scheduling-visits';
import { ClientService, ClientRepository } from '@care-commons/client-demographics';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({ /* your config */ });

// Create client service (from client-demographics vertical)
const clientRepository = new ClientRepository(pool);
const clientService = new ClientService(clientRepository);

// Create schedule service with real address lookups
const scheduleService = createScheduleService({
  pool,
  clientService,
  systemContext: {
    userId: '00000000-0000-0000-0000-000000000000',
    organizationId: '00000000-0000-0000-0000-000000000000',
    branchIds: [],
    roles: ['SUPER_ADMIN'],
    permissions: ['clients:read'],
  },
});
```

### 2. Generate Schedules (with real addresses)

```typescript
import type { UserContext } from '@care-commons/core';

const userContext: UserContext = {
  userId: 'coordinator-123',
  organizationId: 'org-456',
  branchIds: ['branch-789'],
  roles: ['COORDINATOR'],
  permissions: ['schedules:generate', 'schedules:create'],
};

// Generate visits from a service pattern
// Each visit will automatically have the client's real address
const visits = await scheduleService.generateScheduleFromPattern(
  {
    patternId: 'pattern-abc',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  userContext
);

// Each visit now has real client address with coordinates
visits.forEach(visit => {
  console.log(`Visit for client ${visit.clientId}:`);
  console.log(`  Address: ${visit.address.line1}, ${visit.address.city}`);
  console.log(`  Coordinates: ${visit.address.latitude}, ${visit.address.longitude}`);
  console.log(`  Geofence: ${visit.address.geofenceRadius}m`);
});
```

## Architecture

The wiring uses a layered adapter pattern:

```
ScheduleService
    ↓ (uses)
ClientAddressProvider
    ↓ (uses)
ClientServiceAdapter
    ↓ (wraps)
ClientService (from client-demographics)
    ↓ (queries)
ClientRepository → Database
```

### Why the Adapter?

The `ClientServiceAdapter` bridges the interface mismatch between:

**ClientService** (from client-demographics):
- Returns full `Client` objects
- Throws `NotFoundError` for missing clients
- Requires authorization context

**IClientService** (required by ClientAddressProvider):
- Returns minimal `ClientWithAddress` objects
- Returns `null` for missing clients
- Needs only address-related fields

## Configuration Options

### Address Cache TTL

Client addresses are cached to improve performance. The default TTL is 5 minutes:

```typescript
const scheduleService = createScheduleService({
  pool,
  clientService,
  systemContext,
  addressCacheTTL: 10 * 60 * 1000, // 10 minutes
});
```

### Cache Invalidation

If a client's address is updated, invalidate the cache:

```typescript
import { ClientAddressProvider } from '@care-commons/scheduling-visits';

// After updating a client's address
await clientService.updateClient(clientId, { primaryAddress: newAddress }, context);

// Invalidate the cache for that client
addressProvider.invalidateClient(clientId);
```

## Error Handling

### Client Not Found

```typescript
try {
  const visits = await scheduleService.generateScheduleFromPattern(options, context);
} catch (error) {
  if (error.name === 'NotFoundError') {
    // Client doesn't exist
    console.error('Client not found:', error.details.clientId);
  }
}
```

### Missing Address

```typescript
try {
  const visits = await scheduleService.generateScheduleFromPattern(options, context);
} catch (error) {
  if (error.name === 'NotFoundError' && error.message.includes('No address found')) {
    // Client exists but has no address
    console.error('Client missing address:', error.details.clientId);
  }
}
```

### Address Not Geocoded

```typescript
// ClientAddressProvider returns addresses even if not geocoded
// The calling code can check for coordinates:

visits.forEach(visit => {
  if (!visit.address.latitude || !visit.address.longitude) {
    console.warn(`Visit ${visit.id} address not geocoded - cannot optimize route`);
    // Handle gracefully (skip from route optimization, etc.)
  }
});
```

## Testing

### Unit Tests (with mocks)

```typescript
import { ScheduleService } from '@care-commons/scheduling-visits';
import type { IClientAddressProvider } from '@care-commons/scheduling-visits';

const mockAddressProvider: IClientAddressProvider = {
  getClientAddress: vi.fn().mockResolvedValue({
    line1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'USA',
    latitude: 30.2672,
    longitude: -97.7431,
    geofenceRadius: 100,
  }),
};

const scheduleService = new ScheduleService(mockRepository, mockAddressProvider);
```

### Integration Tests (with real database)

```typescript
import { createScheduleService } from '@care-commons/scheduling-visits';
import { ClientService } from '@care-commons/client-demographics';

// Use test database
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });

const scheduleService = createScheduleService({
  pool,
  clientService: new ClientService(new ClientRepository(pool)),
  systemContext: testSystemContext,
});

// Create test client with address
const client = await clientService.createClient({
  organizationId: 'test-org',
  branchId: 'test-branch',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1960-01-01'),
  primaryAddress: {
    type: 'HOME',
    line1: '123 Test St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'USA',
    latitude: 30.2672,
    longitude: -97.7431,
  },
  // ... other required fields
}, testContext);

// Generate schedule for that client
const visits = await scheduleService.generateScheduleFromPattern({
  patternId: pattern.id,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-07'),
}, testContext);

// Verify addresses are populated
expect(visits[0].address.line1).toBe('123 Test St');
expect(visits[0].address.latitude).toBe(30.2672);
```

## Production Deployment

### 1. Ensure Client Addresses are Geocoded

```sql
-- Check for clients without coordinates
SELECT id, first_name, last_name, primary_address
FROM clients
WHERE (primary_address->>'latitude') IS NULL
  OR (primary_address->>'longitude') IS NULL;
```

### 2. Geocode Missing Addresses

Use a geocoding service to add coordinates:

```typescript
import { geocodeAddress } from '@care-commons/core/utils/geocoding';

const clientsNeedingGeocode = await clientService.searchClients({
  // Custom filter for missing coordinates
}, pagination, systemContext);

for (const client of clientsNeedingGeocode.items) {
  if (!client.primaryAddress.latitude) {
    const coords = await geocodeAddress(client.primaryAddress);

    await clientService.updateClient(
      client.id,
      {
        primaryAddress: {
          ...client.primaryAddress,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      },
      systemContext
    );
  }
}
```

### 3. Monitor Cache Performance

```typescript
// Get cache statistics
const stats = addressProvider.getCacheStats();
console.log(`Address cache: ${stats.size} entries, TTL: ${stats.ttl}ms`);
```

## Common Patterns

### Pattern 1: Batch Visit Creation

```typescript
// When creating multiple visits, the address provider
// will cache addresses to avoid redundant queries

for (const pattern of activePatterns) {
  const visits = await scheduleService.generateScheduleFromPattern({
    patternId: pattern.id,
    startDate: startOfMonth,
    endDate: endOfMonth,
  }, context);

  console.log(`Generated ${visits.length} visits for pattern ${pattern.id}`);
}
```

### Pattern 2: API Endpoint Integration

```typescript
// Express/Fastify endpoint example
app.post('/api/schedules/generate', async (req, res) => {
  try {
    const visits = await scheduleService.generateScheduleFromPattern(
      req.body,
      req.userContext
    );

    res.json({ success: true, visits });
  } catch (error) {
    if (error.name === 'NotFoundError') {
      res.status(404).json({ error: error.message });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

## Troubleshooting

**Problem**: `ClientAddressProvider not configured` error

**Solution**: Make sure you're using `createScheduleService()` factory instead of manually instantiating `ScheduleService`:

```typescript
// ❌ Wrong
const scheduleService = new ScheduleService(repository);

// ✅ Correct
const scheduleService = createScheduleService({ pool, clientService, systemContext });
```

---

**Problem**: Addresses missing latitude/longitude

**Solution**: Run geocoding on client addresses (see Production Deployment section above)

---

**Problem**: Performance issues with large batch operations

**Solution**: The address provider automatically caches addresses. For very large batches, consider:
1. Increasing cache TTL
2. Pre-warming the cache
3. Using database-level caching

---

## Related Files

- **Factory**: `src/providers/schedule-service-factory.ts`
- **Adapter**: `src/providers/client-service-adapter.ts`
- **Provider**: `src/providers/client-address-provider.ts`
- **Service**: `src/service/schedule-service.ts`
- **Tests**: `src/service/__tests__/schedule-service.test.ts`

## Next Steps

- [ ] Review the factory implementation
- [ ] Update your service initialization code to use the factory
- [ ] Verify client addresses are geocoded in your database
- [ ] Test with real data in staging environment
- [ ] Monitor cache performance in production
