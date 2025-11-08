-- Database Performance Monitoring Scripts for Care Commons
-- Use these scripts to analyze database performance during and after load tests

-- =============================================================================
-- 1. Enable slow query logging and pg_stat_statements extension
-- =============================================================================

-- Enable slow query logging (logs queries taking > 100ms)
ALTER SYSTEM SET log_min_duration_statement = 100;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
SELECT pg_reload_conf();

-- Create extension for query stats (if not already exists)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =============================================================================
-- 2. View slow queries
-- =============================================================================

-- Show slowest queries by mean execution time
SELECT
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
  ROUND(stddev_exec_time::numeric, 2) AS stddev_time_ms,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Show queries with highest total execution time
SELECT
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
  ROUND((total_exec_time / sum(total_exec_time) OVER ()) * 100, 2) AS pct_total_time,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- =============================================================================
-- 3. Identify missing indexes
-- =============================================================================

-- Find tables with sequential scans that might benefit from indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;

-- Find unused indexes (consider dropping these)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE '%pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- =============================================================================
-- 4. Check for N+1 query problems
-- =============================================================================

-- Look for queries with very high call counts but low execution time
-- These might indicate N+1 problems
SELECT
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
  query
FROM pg_stat_statements
WHERE calls > 1000
AND mean_exec_time < 10
ORDER BY calls DESC
LIMIT 20;

-- =============================================================================
-- 5. Monitor database connections
-- =============================================================================

-- Current connection count by state
SELECT
  state,
  COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

-- Check for connection pool exhaustion
SELECT
  COUNT(*) AS total_connections,
  COUNT(*) FILTER (WHERE state = 'active') AS active_connections,
  COUNT(*) FILTER (WHERE state = 'idle') AS idle_connections,
  COUNT(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
  MAX(EXTRACT(EPOCH FROM (now() - state_change))) AS max_idle_seconds
FROM pg_stat_activity
WHERE datname = current_database();

-- =============================================================================
-- 6. Monitor table bloat and vacuum stats
-- =============================================================================

-- Check vacuum and analyze statistics
SELECT
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  ROUND((n_dead_tup::float / NULLIF(n_live_tup, 0)) * 100, 2) AS dead_tuple_pct
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- =============================================================================
-- 7. Monitor cache hit ratio
-- =============================================================================

-- Database-level cache hit ratio (should be > 99%)
SELECT
  sum(heap_blks_read) AS heap_read,
  sum(heap_blks_hit) AS heap_hit,
  ROUND(
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100,
    2
  ) AS cache_hit_ratio_pct
FROM pg_statio_user_tables;

-- Table-level cache hit ratio
SELECT
  schemaname,
  tablename,
  heap_blks_read,
  heap_blks_hit,
  ROUND(
    heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0) * 100,
    2
  ) AS cache_hit_ratio_pct
FROM pg_statio_user_tables
WHERE heap_blks_read > 0
ORDER BY heap_blks_read DESC
LIMIT 20;

-- =============================================================================
-- 8. Monitor lock contention
-- =============================================================================

-- Show current locks
SELECT
  locktype,
  relation::regclass AS relation,
  mode,
  granted,
  COUNT(*) AS lock_count
FROM pg_locks
WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
AND relation IS NOT NULL
GROUP BY locktype, relation, mode, granted
ORDER BY lock_count DESC;

-- Show blocked queries
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- =============================================================================
-- 9. Reset statistics (run before load test)
-- =============================================================================

-- Reset query statistics
SELECT pg_stat_statements_reset();

-- Reset table statistics
SELECT pg_stat_reset();

-- =============================================================================
-- 10. Table and index sizes
-- =============================================================================

-- Show largest tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
