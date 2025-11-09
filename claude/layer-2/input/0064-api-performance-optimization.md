# Task 0064: API Performance Optimization

**Priority**: 🟡 LOW (Optimization)
**Category**: Performance / Backend
**Estimated Effort**: 1 week

## Context

Based on load testing results (Task 0053), optimize slow queries, add caching, and improve API performance.

## Objective

Optimize API performance to meet SLA targets (p95 < 1000ms).

## Requirements

1. **Database Indexing**: Add missing indexes based on slow query log
2. **N+1 Query Elimination**: Fix N+1 queries using eager loading
3. **Query Optimization**: Rewrite slow queries, add pagination
4. **Caching**: Implement Redis caching for frequently accessed data
5. **Connection Pooling**: Optimize database connection pool size
6. **Response Compression**: Enable gzip compression

## Implementation

**Prerequisites**: Run Task 0053 (Load Testing) first to identify bottlenecks

**Steps**:
1. Analyze slow query log from PostgreSQL
2. Add indexes for common WHERE/JOIN clauses
3. Use Dataloader or similar to batch queries
4. Implement Redis caching layer
5. Add response compression middleware
6. Optimize connection pool configuration

## Success Criteria

- [ ] P95 response time < 1000ms for all endpoints
- [ ] No N+1 queries in hot paths
- [ ] Cache hit rate > 70% for cacheable data
- [ ] Database CPU usage < 50% under normal load
- [ ] All queries have appropriate indexes
