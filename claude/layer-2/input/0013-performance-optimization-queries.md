# Task 0013: Performance Optimization - Database Queries and Caching

**Priority**: 🟡 MEDIUM
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 8-10 hours

## Context

As data volume grows, database queries need optimization to maintain fast response times. Implement query optimization, indexing strategy, and caching layer.

## Goal

- Page load times <1 second
- API response times <200ms for most endpoints
- Support 50+ concurrent users without performance degradation

## Task

### 1. Analyze Current Query Performance

**Create performance testing script**:

**File**: `scripts/analyze-query-performance.ts`

```typescript
import knex from '../packages/core/src/db/knex';
import { performance } from 'perf_hooks';

interface QueryPerformance {
  query: string;
  duration: number;
  rowCount: number;
}

async function analyzeQueries() {
  const results: QueryPerformance[] = [];

  // Enable query logging
  knex.on('query', (query) => {
    console.log('Query:', query.sql);
  });

  // Test critical queries
  const queries = [
    { name: 'List clients', fn: () => knex('clients').select('*').limit(50) },
    { name: 'List visits today', fn: () => knex('visits').where('scheduled_date', new Date()).select('*') },
    { name: 'Caregiver schedule', fn: () => knex('visits').where('caregiver_id', 'test-id').select('*') },
    // ... more queries
  ];

  for (const { name, fn } of queries) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    results.push({
      query: name,
      duration,
      rowCount: result.length
    });

    console.log(`${name}: ${duration.toFixed(2)}ms (${result.length} rows)`);
  }

  // Identify slow queries (>100ms)
  const slowQueries = results.filter(r => r.duration > 100);
  if (slowQueries.length > 0) {
    console.warn('\n⚠️ Slow queries detected:');
    slowQueries.forEach(q => console.warn(`  ${q.query}: ${q.duration.toFixed(2)}ms`));
  }
}

analyzeQueries();
```

Run: `npm run analyze:performance`

### 2. Add Missing Database Indexes

**Create indexing migration**:

**File**: `packages/core/src/db/migrations/024_add_performance_indexes.ts`

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Visits - frequently filtered by date and status
  await knex.schema.alterTable('visits', (table) => {
    table.index(['scheduled_date', 'status'], 'idx_visits_date_status');
    table.index(['caregiver_id', 'scheduled_date'], 'idx_visits_caregiver_date');
    table.index(['client_id', 'scheduled_date'], 'idx_visits_client_date');
    table.index(['organization_id', 'status'], 'idx_visits_org_status');
  });

  // EVV records - frequently queried by visit and timestamp
  await knex.schema.alterTable('evv_records', (table) => {
    table.index(['visit_id', 'event_type'], 'idx_evv_visit_event');
    table.index(['caregiver_id', 'timestamp'], 'idx_evv_caregiver_time');
    table.index(['created_at'], 'idx_evv_created');
  });

  // Care plans - filtered by client and status
  await knex.schema.alterTable('care_plans', (table) => {
    table.index(['client_id', 'status'], 'idx_careplans_client_status');
    table.index(['effective_date', 'end_date'], 'idx_careplans_dates');
  });

  // Tasks - frequently filtered by caregiver and status
  await knex.schema.alterTable('task_instances', (table) => {
    table.index(['assigned_caregiver_id', 'status'], 'idx_tasks_caregiver_status');
    table.index(['visit_id', 'status'], 'idx_tasks_visit_status');
    table.index(['due_date', 'status'], 'idx_tasks_due_status');
  });

  // Invoices - filtered by client and date
  await knex.schema.alterTable('invoices', (table) => {
    table.index(['client_id', 'invoice_date'], 'idx_invoices_client_date');
    table.index(['status', 'invoice_date'], 'idx_invoices_status_date');
  });

  // Audit logs - frequently queried by entity and timestamp
  await knex.schema.alterTable('audit_logs', (table) => {
    table.index(['entity_type', 'entity_id'], 'idx_audit_entity');
    table.index(['user_id', 'timestamp'], 'idx_audit_user_time');
    table.index(['timestamp'], 'idx_audit_timestamp');
  });

  // Users - email lookup
  await knex.schema.alterTable('users', (table) => {
    table.index(['email'], 'idx_users_email');
    table.index(['organization_id', 'role'], 'idx_users_org_role');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('visits', (table) => {
    table.dropIndex(['scheduled_date', 'status'], 'idx_visits_date_status');
    table.dropIndex(['caregiver_id', 'scheduled_date'], 'idx_visits_caregiver_date');
    table.dropIndex(['client_id', 'scheduled_date'], 'idx_visits_client_date');
    table.dropIndex(['organization_id', 'status'], 'idx_visits_org_status');
  });

  // ... drop other indexes
}
```

### 3. Optimize N+1 Query Problems

**Identify and fix N+1 queries**:

**Bad Example** (N+1 query):
```typescript
// This executes 1 query for visits + N queries for clients
const visits = await knex('visits').select('*');
for (const visit of visits) {
  visit.client = await knex('clients').where('id', visit.client_id).first();
}
```

**Good Example** (single join query):
```typescript
// This executes 1 query total
const visits = await knex('visits')
  .leftJoin('clients', 'visits.client_id', 'clients.id')
  .leftJoin('caregivers', 'visits.caregiver_id', 'caregivers.id')
  .select(
    'visits.*',
    knex.raw('json_build_object(\'id\', clients.id, \'firstName\', clients.first_name, \'lastName\', clients.last_name) as client'),
    knex.raw('json_build_object(\'id\', caregivers.id, \'firstName\', caregivers.first_name, \'lastName\', caregivers.last_name) as caregiver')
  );
```

**Update services to use joins**:

Files to optimize:
- `verticals/scheduling-visits/src/services/visit.service.ts`
- `verticals/care-plans-tasks/src/services/care-plan.service.ts`
- `verticals/analytics-reporting/src/services/analytics.service.ts`

### 4. Implement Redis Caching Layer

**Install Redis**:
```bash
npm install redis
npm install --save-dev @types/redis
```

**Create cache service**:

**File**: `packages/core/src/services/cache.service.ts`

```typescript
import { createClient, RedisClientType } from 'redis';

export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}
```

### 5. Add Caching to Frequently Accessed Data

**Example: Cache client data**:

**File**: `verticals/client-demographics/src/services/client.service.ts`

```typescript
import { CacheService } from '@care-commons/core';

export class ClientService {
  private cache = CacheService.getInstance();

  async getClientById(id: string): Promise<Client | null> {
    // Try cache first
    const cacheKey = `client:${id}`;
    const cached = await this.cache.get<Client>(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return cached;
    }

    // Cache miss - query database
    console.log('Cache miss:', cacheKey);
    const client = await knex('clients')
      .where('id', id)
      .first();

    if (client) {
      // Cache for 1 hour
      await this.cache.set(cacheKey, client, 3600);
    }

    return client;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const updated = await knex('clients')
      .where('id', id)
      .update(data)
      .returning('*');

    // Invalidate cache
    await this.cache.del(`client:${id}`);

    return updated[0];
  }
}
```

**Cache these frequently accessed items**:
- Clients (cache for 1 hour, invalidate on update)
- Caregivers (cache for 1 hour, invalidate on update)
- Organizations and branches (cache for 24 hours, rarely change)
- Rate schedules (cache for 24 hours)
- User permissions (cache for 30 minutes)
- Today's visit schedule (cache for 5 minutes)

### 6. Add Query Result Memoization

**For expensive calculations**:

**File**: `packages/core/src/utils/memoize.ts`

```typescript
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage example
const calculateDistance = memoize(
  (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Expensive haversine calculation
    return haversineDistance(lat1, lon1, lat2, lon2);
  }
);
```

### 7. Implement Pagination for Large Lists

**Add pagination helper**:

**File**: `packages/core/src/utils/pagination.ts`

```typescript
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T>(
  query: Knex.QueryBuilder,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  // Get total count (cached)
  const countQuery = query.clone().clearSelect().clearOrder().count('* as count');
  const [{ count }] = await countQuery;
  const total = parseInt(count as string, 10);

  // Get paginated data
  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

**Use in routes**:
```typescript
router.get('/clients', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const query = knex('clients').where('deleted_at', null);
  const result = await paginate(query, { page, limit });

  res.json(result);
});
```

### 8. Add Database Query Logging and Monitoring

**File**: `packages/core/src/db/query-logger.ts`

```typescript
import knex from './knex';

if (process.env.LOG_QUERIES === 'true') {
  knex.on('query', ({ sql, bindings }) => {
    console.log('Query:', sql);
    console.log('Bindings:', bindings);
  });

  knex.on('query-response', (response, query) => {
    console.log('Query response:', response);
  });
}

// Log slow queries (>500ms)
knex.on('query', (query) => {
  const start = Date.now();

  query.response.then(() => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`🐌 Slow query (${duration}ms):`, query.sql);
    }
  });
});
```

## Acceptance Criteria

- [ ] Performance analysis script created and run
- [ ] Missing database indexes added
- [ ] N+1 queries identified and fixed
- [ ] Redis caching implemented
- [ ] Frequently accessed data cached
- [ ] Cache invalidation working correctly
- [ ] Memoization added for expensive calculations
- [ ] Pagination implemented for large lists
- [ ] Query logging and monitoring enabled
- [ ] Page load times <1 second
- [ ] API response times <200ms (average)
- [ ] System handles 50+ concurrent users
- [ ] Load tests pass

## Testing

**Load testing**:
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API endpoint
ab -n 1000 -c 50 -H "Authorization: Bearer TOKEN" http://localhost:3000/api/visits
```

**Expected results**:
- 50 concurrent requests
- 1000 total requests
- <200ms average response time
- 0% failed requests

## Reference

- PostgreSQL indexing: https://www.postgresql.org/docs/current/indexes.html
- Redis caching patterns: https://redis.io/docs/manual/patterns/
- Query optimization: https://use-the-index-luke.com/
