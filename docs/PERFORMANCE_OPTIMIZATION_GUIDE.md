# Performance Optimization Guide

This guide documents the performance optimizations implemented in the Care Commons platform and provides patterns for ongoing optimization work.

## Overview

Performance optimizations implemented:
- ✅ Database indexes for common query patterns
- ✅ Redis caching layer
- ✅ Query performance monitoring
- ✅ Pagination utilities
- ✅ Memoization for expensive calculations

## Database Indexes

### Implemented Indexes

**Migration: `20251101000000_add_performance_indexes.ts`**
- Open shifts (shift matching queries)
- Users (tenant-scoped queries)
- Visits (calendar and scheduling queries)
- Assignment proposals
- Matching configurations
- JSONB fields (GIN indexes)

**Migration: `20251106000000_add_additional_performance_indexes.ts`**
- Care plans (client + status, date ranges)
- Task instances (assignment, scheduling)
- Invoices (client billing, status)
- Audit events (event type, user activity)
- EVV records (compliance queries)

### Adding New Indexes

When adding indexes, consider:
1. Common filter combinations in WHERE clauses
2. Frequently joined columns (foreign keys)
3. ORDER BY columns
4. Partial indexes for common filtered queries

Example:
```typescript
// Optimize status + date queries
await knex.raw(`
  CREATE INDEX idx_table_status_date
  ON table_name(status, created_at DESC)
  WHERE deleted_at IS NULL
`);
```

## Caching with Redis

### Cache Service Usage

```typescript
import { getCacheService } from '@care-commons/core';

const cache = getCacheService();
await cache.connect();

// Get from cache
const client = await cache.get<Client>(`client:${id}`);
if (client) {
  return client; // Cache hit
}

// Cache miss - fetch from DB
const freshClient = await db.query(/* ... */);

// Store in cache (1 hour TTL)
await cache.set(`client:${id}`, freshClient, 3600);

return freshClient;
```

### Cache Invalidation

```typescript
// Single key
await cache.del(`client:${id}`);

// Pattern-based (use sparingly)
await cache.invalidatePattern('client:*');

// Multiple keys
await cache.delMany([
  `client:${id}`,
  `client:${id}:visits`,
  `client:${id}:care-plans`
]);
```

### Recommended Cache TTLs

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Clients/Caregivers | 1 hour | Infrequent updates |
| Organizations/Branches | 24 hours | Rarely change |
| Rate schedules | 24 hours | Static data |
| User permissions | 30 minutes | Security-sensitive |
| Today's schedule | 5 minutes | Frequently changing |
| Analytics data | 15 minutes | Expensive queries |

## N+1 Query Optimization

### Identifying N+1 Queries

**Bad Example** (N+1 query):
```typescript
// Fetches visits: 1 query
const visits = await db('visits').select('*').limit(50);

// Fetches client for each visit: N queries
for (const visit of visits) {
  visit.client = await db('clients')
    .where('id', visit.client_id)
    .first();
}
// Total: 1 + N queries = 51 queries for 50 visits
```

**Good Example** (Single query with JOIN):
```typescript
// Fetches everything in 1 query
const visits = await db('visits')
  .leftJoin('clients', 'visits.client_id', 'clients.id')
  .leftJoin('caregivers', 'visits.caregiver_id', 'caregivers.id')
  .select(
    'visits.*',
    db.raw(`json_build_object(
      'id', clients.id,
      'firstName', clients.first_name,
      'lastName', clients.last_name,
      'address', clients.address
    ) as client`),
    db.raw(`json_build_object(
      'id', caregivers.id,
      'firstName', caregivers.first_name,
      'lastName', caregivers.last_name
    ) as caregiver`)
  )
  .where('visits.deleted_at', null)
  .limit(50);
// Total: 1 query
```

### Using DataLoader Pattern

For more complex scenarios, use DataLoader pattern with batching:

```typescript
import { memoizeAsync } from '@care-commons/core';

// Batch loader function
async function batchLoadClients(ids: string[]): Promise<Client[]> {
  return await db('clients')
    .whereIn('id', ids)
    .where('deleted_at', null);
}

// Memoized loader (caches within request)
const loadClient = memoizeAsync(
  async (id: string) => {
    const clients = await batchLoadClients([id]);
    return clients[0];
  }
);

// Usage - multiple calls are batched
const visits = await getVisits();
await Promise.all(visits.map(async (visit) => {
  visit.client = await loadClient(visit.client_id);
}));
```

## Query Performance Monitoring

### Setup Query Logger

```typescript
import knex from 'knex';
import { setupQueryLogging } from '@care-commons/core';

const db = knex(config);

// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  const logger = setupQueryLogging(db, {
    enabled: true,
    verbose: true,
    slowQueryThreshold: 500 // ms
  });
}
```

### Environment Variables

```bash
# Enable query logging
LOG_QUERIES=true

# Verbose output (logs all queries)
VERBOSE_QUERIES=true

# Slow query threshold (milliseconds)
SLOW_QUERY_THRESHOLD_MS=500

# Log query responses
LOG_QUERY_RESPONSES=true
```

### Analyze Query Performance

Run the performance analysis script:

```bash
npm run analyze:performance
```

This will:
- Test critical queries
- Identify slow queries (>100ms)
- Calculate average query duration
- Provide optimization recommendations

## Pagination

### Using Pagination Utility

```typescript
import { paginate, validatePaginationParams } from '@care-commons/core';

// In API route handler
const params = validatePaginationParams(
  req.query.page,
  req.query.limit
);

const query = knex('clients')
  .where('organization_id', orgId)
  .where('deleted_at', null)
  .orderBy('created_at', 'desc');

const result = await paginate(query, params);

res.json({
  data: result.data,
  pagination: result.pagination
});
```

### Cursor-Based Pagination

For real-time data or large datasets:

```typescript
import { paginateWithCursor } from '@care-commons/core';

const query = knex('audit_events')
  .where('organization_id', orgId)
  .orderBy('timestamp', 'asc');

const result = await paginateWithCursor(
  query,
  'timestamp',
  { cursor: req.query.cursor, limit: 50 }
);

res.json({
  data: result.data,
  nextCursor: result.pagination.nextCursor,
  hasMore: result.pagination.hasMore
});
```

## Memoization

### For Expensive Calculations

```typescript
import { memoize } from '@care-commons/core';

// Expensive distance calculation
const calculateDistance = memoize(
  (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Haversine formula...
    return distance;
  }
);

// First call: computes
const d1 = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);

// Second call with same args: returns cached result
const d2 = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
```

### With Custom Key Function

```typescript
const memoizedQuery = memoize(
  async (userId: string, date: Date) => {
    return await db('visits')
      .where('user_id', userId)
      .where('date', date)
      .first();
  },
  (userId, date) => `${userId}:${date.toISOString().split('T')[0]}`
);
```

## Best Practices

### Query Optimization Checklist

- [ ] Use indexes for frequently queried columns
- [ ] Avoid N+1 queries - use JOINs or batch loading
- [ ] Add pagination for lists (max 100 items per page)
- [ ] Cache frequently accessed data
- [ ] Use partial indexes for common filtered queries
- [ ] Monitor slow queries (>200ms)
- [ ] Use EXPLAIN ANALYZE to understand query plans

### Caching Checklist

- [ ] Cache read-heavy data with appropriate TTL
- [ ] Invalidate cache on writes/updates
- [ ] Handle cache misses gracefully
- [ ] Don't cache rapidly changing data
- [ ] Use cache keys with consistent naming
- [ ] Monitor cache hit/miss rates

### Performance Monitoring

1. **Enable query logging in development**
   ```bash
   LOG_QUERIES=true npm run dev
   ```

2. **Run performance analysis regularly**
   ```bash
   npm run analyze:performance
   ```

3. **Monitor slow queries**
   - Look for queries >500ms
   - Check EXPLAIN plans
   - Add indexes as needed

4. **Track key metrics**
   - Average response time (<200ms target)
   - P95/P99 response times
   - Cache hit rate (>80% target)
   - Slow query count

## Examples by Service

### Client Demographics Service

```typescript
// ❌ Bad: N+1 query
async getClientsWithCaregivers(orgId: string) {
  const clients = await db('clients').where('organization_id', orgId);
  for (const client of clients) {
    client.primaryCaregiver = await db('caregivers')
      .where('id', client.primary_caregiver_id)
      .first();
  }
  return clients;
}

// ✅ Good: Single query with JOIN
async getClientsWithCaregivers(orgId: string) {
  return await db('clients')
    .leftJoin('caregivers', 'clients.primary_caregiver_id', 'caregivers.id')
    .select(
      'clients.*',
      db.raw(`json_build_object(
        'id', caregivers.id,
        'firstName', caregivers.first_name,
        'lastName', caregivers.last_name
      ) as primaryCaregiver`)
    )
    .where('clients.organization_id', orgId)
    .where('clients.deleted_at', null);
}
```

### Scheduling/Visits Service

```typescript
// ✅ Use caching for frequently accessed schedules
async getTodaySchedule(caregiverId: string) {
  const cache = getCacheService();
  const cacheKey = `schedule:${caregiverId}:${new Date().toDateString()}`;

  let schedule = await cache.get<Visit[]>(cacheKey);
  if (schedule) {
    return schedule;
  }

  schedule = await db('visits')
    .where('assigned_caregiver_id', caregiverId)
    .where('scheduled_date', new Date())
    .where('deleted_at', null);

  // Cache for 5 minutes
  await cache.set(cacheKey, schedule, 300);

  return schedule;
}
```

### Analytics Service

```typescript
// ✅ Cache expensive analytics queries
async getOrganizationMetrics(orgId: string) {
  const cache = getCacheService();
  const cacheKey = `analytics:org:${orgId}`;

  let metrics = await cache.get(cacheKey);
  if (metrics) {
    return metrics;
  }

  // Expensive aggregation query
  metrics = await db('visits')
    .where('organization_id', orgId)
    .select(
      db.raw('COUNT(*) as total_visits'),
      db.raw('COUNT(DISTINCT client_id) as unique_clients'),
      db.raw('AVG(actual_duration) as avg_duration')
    )
    .first();

  // Cache for 15 minutes
  await cache.set(cacheKey, metrics, 900);

  return metrics;
}
```

## Troubleshooting

### Slow Queries

1. Check if indexes exist:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'your_table';
   ```

2. Analyze query plan:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM visits
   WHERE organization_id = 'xxx'
   AND scheduled_date = '2024-01-01';
   ```

3. Look for:
   - Sequential scans (add index)
   - High loop counts (N+1 query)
   - Large row counts (add pagination)

### Cache Issues

- **Cache not working**: Check Redis connection with `redis-cli ping`
- **Stale data**: Reduce TTL or improve invalidation
- **Memory issues**: Use shorter TTLs or selective caching

## Resources

- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
- [Query Optimization](https://use-the-index-luke.com/)
