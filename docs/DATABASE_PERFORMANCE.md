# Database Performance Optimization Guide

## Overview

This document describes the database performance optimizations implemented in the care-commons platform, including indexing strategies, query optimization patterns, caching mechanisms, and connection pool configuration.

## Table of Contents

1. [Index Strategy](#index-strategy)
2. [Query Optimization](#query-optimization)
3. [Caching Layer](#caching-layer)
4. [Connection Pool Configuration](#connection-pool-configuration)
5. [Pagination Best Practices](#pagination-best-practices)
6. [Performance Monitoring](#performance-monitoring)
7. [Optimization Checklist](#optimization-checklist)

---

## Index Strategy

### Composite Indexes

We use composite indexes for common query patterns that filter on multiple columns. The order of columns in composite indexes matters - most selective columns should generally come first.

#### Open Shifts
```sql
-- Organization + date + status filtering
CREATE INDEX idx_open_shifts_org_date_status
ON open_shifts(organization_id, scheduled_date, matching_status);

-- Branch + date + status filtering
CREATE INDEX idx_open_shifts_branch_date_status
ON open_shifts(branch_id, scheduled_date, matching_status);
```

#### Visits
```sql
-- Caregiver schedule conflict detection
CREATE INDEX idx_visits_caregiver_schedule
ON visits(assigned_caregiver_id, scheduled_date, scheduled_start_time, scheduled_end_time)
WHERE deleted_at IS NULL AND status NOT IN ('CANCELLED', 'NO_SHOW_CAREGIVER', 'REJECTED');
```

#### Invoices
```sql
-- Client billing queries
CREATE INDEX idx_invoices_client_date
ON invoices(client_id, invoice_date DESC)
WHERE deleted_at IS NULL;

-- Accounts receivable aging
CREATE INDEX idx_invoices_due_date_status
ON invoices(due_date, status)
WHERE deleted_at IS NULL AND balance_due > 0;
```

### Partial Indexes

Partial indexes only index rows that meet specific criteria, reducing index size and improving performance for filtered queries.

```sql
-- Only index active care plans
CREATE INDEX idx_care_plans_dates
ON care_plans(effective_date, expiration_date)
WHERE deleted_at IS NULL AND status = 'ACTIVE';

-- Only index urgent shifts
CREATE INDEX idx_open_shifts_priority_date_status
ON open_shifts(priority DESC, scheduled_date ASC, matching_status)
WHERE is_urgent = true AND matching_status NOT IN ('ASSIGNED', 'EXPIRED');
```

### GIN Indexes for JSONB

GIN indexes enable efficient queries on JSONB fields and arrays.

```sql
-- Settings queries
CREATE INDEX idx_organizations_settings_gin
ON organizations USING GIN(settings)
WHERE deleted_at IS NULL;

-- Array containment queries
CREATE INDEX idx_open_shifts_required_skills_gin
ON open_shifts USING GIN(required_skills);

-- Caregiver skill matching
CREATE INDEX idx_caregivers_skills
ON caregivers USING GIN(skills)
WHERE deleted_at IS NULL AND status = 'ACTIVE';
```

### Covering Indexes

Covering indexes include additional columns to avoid table lookups.

```sql
-- Optimize visits + service_patterns JOIN
CREATE INDEX idx_visits_pattern_join
ON visits(id, pattern_id)
INCLUDE (organization_id, branch_id, client_id, scheduled_date,
         scheduled_start_time, scheduled_end_time, scheduled_duration,
         timezone, service_type_id, service_type_name, address,
         task_ids, required_skills, required_certifications, client_instructions)
WHERE deleted_at IS NULL;
```

---

## Query Optimization

### Eliminate N+1 Queries

**Bad:**
```typescript
// Fetches visits in a loop - N+1 problem
const proposals = await getProposalsByOpenShift(shiftId);
for (const proposal of proposals) {
  const caregiver = await getCaregiverById(proposal.caregiverId);
  // Process caregiver...
}
```

**Good:**
```typescript
// Single query with JOIN
const query = `
  SELECT p.*, c.*
  FROM assignment_proposals p
  JOIN caregivers c ON c.id = p.caregiver_id
  WHERE p.open_shift_id = $1 AND p.deleted_at IS NULL
`;
const result = await pool.query(query, [shiftId]);
```

### Use Proper WHERE Clauses

Always include soft-delete checks and status filters in WHERE clauses to leverage partial indexes:

```typescript
const query = `
  SELECT * FROM clients
  WHERE organization_id = $1
    AND deleted_at IS NULL
    AND status = 'ACTIVE'
  ORDER BY last_name, first_name
`;
```

### Optimize JOINs

Prefer INNER JOINs over LEFT JOINs when possible, and always JOIN on indexed columns:

```typescript
// Good - JOINs on indexed foreign keys
const query = `
  SELECT v.*, c.first_name, c.last_name, cg.first_name as caregiver_name
  FROM visits v
  INNER JOIN clients c ON c.id = v.client_id
  LEFT JOIN caregivers cg ON cg.id = v.assigned_caregiver_id
  WHERE v.organization_id = $1
    AND v.scheduled_date BETWEEN $2 AND $3
    AND v.deleted_at IS NULL
`;
```

### Use EXISTS for Existence Checks

Use EXISTS instead of COUNT when you only need to know if rows exist:

```typescript
// Bad
const countResult = await pool.query(
  'SELECT COUNT(*) FROM open_shifts WHERE visit_id = $1',
  [visitId]
);
const exists = countResult.rows[0].count > 0;

// Good
const existsResult = await pool.query(
  'SELECT EXISTS(SELECT 1 FROM open_shifts WHERE visit_id = $1)',
  [visitId]
);
const exists = existsResult.rows[0].exists;
```

---

## Caching Layer

We provide a query caching layer for frequently accessed, rarely changed data.

### Basic Usage

```typescript
import { getQueryCache, CacheKeys } from '@care-commons/core/db/query-cache';

// Get cache instance
const cache = getQueryCache();

// Manual cache management
const org = cache.get<Organization>(CacheKeys.organization(orgId));
if (!org) {
  const org = await fetchOrganization(orgId);
  cache.set(CacheKeys.organization(orgId), org, 300); // 5 minute TTL
}

// Or use getOrSet helper
const org = await cache.getOrSet(
  CacheKeys.organization(orgId),
  () => fetchOrganization(orgId),
  300
);
```

### Wrapped Functions

```typescript
import { getQueryCache } from '@care-commons/core/db/query-cache';

const cache = getQueryCache();

// Wrap a function with caching
const getCachedRateSchedule = cache.wrap(
  getRateSchedule,
  (orgId, payerId, date) => `rate:${orgId}:${payerId}:${date}`,
  600 // 10 minute TTL
);

// Use the wrapped function
const rates = await getCachedRateSchedule(orgId, payerId, new Date());
```

### Cache Invalidation

```typescript
import { CacheInvalidation } from '@care-commons/core/db/query-cache';

// Invalidate specific caches when data changes
async function updateOrganization(id: UUID, updates: Partial<Organization>) {
  await repo.update(id, updates);

  // Invalidate related caches
  CacheInvalidation.organization(id);
  CacheInvalidation.rateSchedule(id); // Clear rate schedules for this org
}
```

### What to Cache

**Good candidates:**
- Organization and branch settings
- Rate schedules
- Matching configurations
- User permissions
- Reference data (service types, programs, etc.)

**Bad candidates:**
- Frequently changing data (visits, EVV records)
- Real-time data (current shift status)
- Data with complex invalidation logic

---

## Connection Pool Configuration

### Development Environment

```typescript
// packages/core/knexfile.ts
pool: {
  min: 2,          // Keep 2 connections warm
  max: 10,         // Max 10 connections for local dev
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 10000,
}
```

### Production/Serverless (Neon)

```typescript
pool: {
  min: 0,          // No minimum - serverless friendly
  max: 1,          // Single connection per function
  idleTimeoutMillis: 1000,  // Quick cleanup
  acquireTimeoutMillis: 10000,
}
```

### Custom Database Configuration

```typescript
import { initializeDatabase, DatabaseConfig } from '@care-commons/core';

const config: DatabaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                      // Connection pool size
  min: 2,                       // Minimum connections
  statementTimeout: 30000,      // 30s query timeout
  queryTimeout: 30000,          // 30s total timeout
  application_name: 'care-commons',
};

const db = initializeDatabase(config);
```

### PostgreSQL Settings

Set these in your `postgresql.conf` or via connection string:

```ini
# Enable query plan caching
plan_cache_mode = force_custom_plan

# Statement timeout (30 seconds)
statement_timeout = 30000

# Work memory for sorts/joins (increase for complex queries)
work_mem = 16MB

# Shared buffers (25% of total RAM)
shared_buffers = 256MB

# Effective cache size (50-75% of total RAM)
effective_cache_size = 1GB
```

---

## Pagination Best Practices

### Offset-Based Pagination

Good for small datasets and UI pagination:

```typescript
interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function searchInvoices(
  filters: InvoiceSearchFilters,
  pagination: PaginationParams = { page: 1, limit: 100 }
): Promise<PaginatedResult<Invoice>> {
  const offset = (pagination.page - 1) * pagination.limit;

  // Count total
  const countQuery = `SELECT COUNT(*) FROM invoices WHERE ${whereClause}`;
  const total = (await pool.query(countQuery, params)).rows[0].count;

  // Fetch page
  const dataQuery = `
    SELECT * FROM invoices
    WHERE ${whereClause}
    ORDER BY ${pagination.sortBy} ${pagination.sortOrder}
    LIMIT $1 OFFSET $2
  `;
  const items = await pool.query(dataQuery, [...params, pagination.limit, offset]);

  return {
    items: items.rows,
    total: parseInt(total),
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}
```

### Cursor-Based Pagination

Better for large datasets and infinite scroll:

```typescript
interface CursorPaginationParams {
  limit: number;
  cursor?: string; // Encoded cursor (e.g., base64 of last ID)
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function getVisitsCursor(
  filters: VisitFilters,
  pagination: CursorPaginationParams
): Promise<CursorPaginatedResult<Visit>> {
  const limit = pagination.limit + 1; // Fetch one extra to determine hasNextPage

  let query = `
    SELECT * FROM visits
    WHERE organization_id = $1
      AND deleted_at IS NULL
  `;

  const params: unknown[] = [filters.organizationId];

  if (pagination.cursor) {
    // Decode cursor to get last seen ID
    const lastId = decodeCursor(pagination.cursor);
    query += ` AND id > $2`;
    params.push(lastId);
  }

  query += `
    ORDER BY ${pagination.sortBy ?? 'created_at'} ${pagination.sortOrder ?? 'desc'}
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const result = await pool.query(query, params);
  const hasNextPage = result.rows.length > pagination.limit;
  const items = hasNextPage ? result.rows.slice(0, -1) : result.rows;

  return {
    items,
    hasNextPage,
    nextCursor: hasNextPage ? encodeCursor(items[items.length - 1].id) : null,
  };
}
```

---

## Performance Monitoring

### Query Logging

Enable query logging in development:

```bash
# .env
LOG_QUERIES=true
VERBOSE_QUERIES=true
SLOW_QUERY_THRESHOLD_MS=500
LOG_QUERY_RESPONSES=false
```

### Slow Query Detection

The `query-logger.ts` module automatically tracks slow queries:

```typescript
import { QueryLogger } from '@care-commons/core/db/query-logger';

const logger = new QueryLogger({
  enabled: process.env.LOG_QUERIES === 'true',
  slowThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS ?? '500'),
});

// Attach to Knex
const knex = require('knex')(config);
logger.attachToKnex(knex);

// View statistics
console.log(logger.getStats());
// Output: { totalQueries: 1250, slowQueries: 15, avgDuration: 45.2 }
```

### PostgreSQL Statistics

Query active and slow queries:

```sql
-- View currently running queries
SELECT pid, usename, application_name, state, query,
       now() - query_start AS duration
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- View slow queries (requires pg_stat_statements extension)
SELECT calls, mean_exec_time, max_exec_time, query
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_reset();
SELECT pg_stat_statements_reset();
```

### Index Usage

Check if indexes are being used:

```sql
-- View index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
  AND indexname NOT LIKE '%pkey%';
```

---

## Optimization Checklist

### Before Writing a Query

- [ ] Identify the columns used in WHERE, ORDER BY, and JOIN clauses
- [ ] Check if appropriate indexes exist
- [ ] Consider if the query would benefit from a covering index
- [ ] Determine if the query should use a partial index (e.g., WHERE deleted_at IS NULL)

### When Writing a Query

- [ ] Always include organization_id or branch_id for multi-tenant filtering
- [ ] Include soft-delete check (WHERE deleted_at IS NULL)
- [ ] Use parameterized queries ($1, $2, etc.) to prevent SQL injection
- [ ] Use EXPLAIN ANALYZE to verify query plan
- [ ] Add pagination for list queries
- [ ] Use appropriate index hints if needed

### Query Performance Goals

- **p50 (median)**: < 50ms
- **p95**: < 100ms
- **p99**: < 200ms
- **Maximum**: < 1000ms (statement timeout)

### When to Add an Index

Add an index when:
- [ ] Query is used frequently (> 100 times/hour)
- [ ] Query takes > 100ms consistently
- [ ] Query is on a critical path (e.g., dashboard, matching algorithm)
- [ ] Table has > 10,000 rows and growing

Consider NOT adding an index when:
- [ ] Table has < 1,000 rows
- [ ] Column has low cardinality (< 10 unique values)
- [ ] Table has heavy write load (each index slows down INSERT/UPDATE)
- [ ] Existing indexes can be reordered to serve the same purpose

---

## Migration Management

### Running Migrations

```bash
# Check migration status
npm run db:migrate:status

# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Run specific migration
npm run db:migrate -- --to 20251109000000_add_query_performance_indexes.ts
```

### Performance Impact

The performance optimization migrations add the following indexes:

1. **20251101000000_add_performance_indexes.ts** - 37 indexes
   - Open shifts optimization
   - User and visit indexes
   - Assignment proposals
   - JSONB GIN indexes
   - Covering indexes

2. **20251106000000_add_additional_performance_indexes.ts** - 16 indexes
   - Care plans
   - Task instances
   - Invoices
   - Audit events
   - EVV records

3. **20251109000000_add_query_performance_indexes.ts** - 30 indexes
   - Billable items
   - Payments
   - Service authorizations
   - Payers and rate schedules
   - Client and caregiver search

**Total: 83 performance indexes**

---

## Further Reading

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Node-postgres Connection Pooling](https://node-postgres.com/features/pooling)
- [Knex.js Query Builder](https://knexjs.org/guide/query-builder.html)
- [Use The Index, Luke!](https://use-the-index-luke.com/)

---

## Support

For questions or issues related to database performance:
1. Check query execution plan with EXPLAIN ANALYZE
2. Review this documentation
3. Check existing indexes with \d+ table_name in psql
4. Contact the platform team
