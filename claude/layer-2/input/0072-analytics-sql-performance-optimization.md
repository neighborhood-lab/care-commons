# Task 0072: Analytics SQL Performance Optimization

**Priority:** 🟡 MEDIUM
**Estimated Effort:** 1 week
**Vertical:** analytics-reporting
**Type:** Performance Optimization

---

## Context

The analytics reporting service has TODO comments indicating performance concerns:

```typescript
// verticals/analytics-reporting/src/service/report-service.ts:208
TODO: Rewrite using raw SQL - see ARCHITECTURAL_ISSUES.md

// Line 282
TODO: Rewrite using raw SQL - see ARCHITECTURAL_ISSUES.md

// Line 600 (QA audits)
TODO: Calculate statistics
```

Current reports may use inefficient queries that perform poorly with large datasets (10,000+ visits).

---

## Objectives

Optimize analytics queries to:
1. Execute in <2 seconds for standard reports
2. Handle 100,000+ visit records efficiently
3. Use proper indexes and query optimization
4. Leverage materialized views for frequently accessed aggregations
5. Implement query result caching

---

## Current Performance Issues

### Issue 1: N+1 Query Problem

Many reports fetch data in loops:

```typescript
// SLOW - N+1 queries
async getCaregiverPerformance(): Promise<Report> {
  const caregivers = await this.getCaregivers();

  const performance = [];
  for (const caregiver of caregivers) {
    const visits = await this.getVisitsForCaregiver(caregiver.id); // N queries!
    const stats = this.calculateStats(visits);
    performance.push({ caregiver, stats });
  }

  return performance;
}
```

### Issue 2: Missing Indexes

Queries filter on non-indexed columns:

```sql
SELECT *
FROM visits
WHERE status = 'completed'  -- Not indexed
  AND caregiver_id = $1
  AND DATE(scheduled_start_time) BETWEEN $2 AND $3;  -- Function call prevents index use
```

### Issue 3: No Aggregation Tables

Every report recalculates from raw visit data instead of using pre-aggregated summaries.

---

## Technical Requirements

### 1. Create Materialized Views

**Migration:** `packages/core/migrations/028_analytics_materialized_views.sql`

```sql
-- Daily visit summary (aggregated by day)
CREATE MATERIALIZED VIEW daily_visit_summary AS
SELECT
  DATE(scheduled_start_time) as visit_date,
  branch_id,
  caregiver_id,
  client_id,
  service_id,
  COUNT(*) as visit_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'missed') as missed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  SUM(EXTRACT(EPOCH FROM (actual_end_time - actual_start_time)) / 3600) FILTER (WHERE status = 'completed') as total_hours,
  AVG(EXTRACT(EPOCH FROM (actual_end_time - actual_start_time)) / 3600) FILTER (WHERE status = 'completed') as avg_duration_hours,
  SUM(billable_amount) as total_billable
FROM visits
GROUP BY
  DATE(scheduled_start_time),
  branch_id,
  caregiver_id,
  client_id,
  service_id;

CREATE UNIQUE INDEX idx_daily_visit_summary_unique
  ON daily_visit_summary(visit_date, branch_id, caregiver_id, client_id, service_id);

CREATE INDEX idx_daily_visit_summary_date ON daily_visit_summary(visit_date);
CREATE INDEX idx_daily_visit_summary_branch ON daily_visit_summary(branch_id);
CREATE INDEX idx_daily_visit_summary_caregiver ON daily_visit_summary(caregiver_id);
CREATE INDEX idx_daily_visit_summary_client ON daily_visit_summary(client_id);

-- Caregiver performance summary (monthly)
CREATE MATERIALIZED VIEW monthly_caregiver_performance AS
SELECT
  DATE_TRUNC('month', scheduled_start_time) as month,
  caregiver_id,
  c.first_name || ' ' || c.last_name as caregiver_name,
  COUNT(*) as total_visits,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_visits,
  COUNT(*) FILTER (WHERE status = 'missed') as missed_visits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / NULLIF(COUNT(*), 0), 2) as completion_rate,
  SUM(EXTRACT(EPOCH FROM (actual_end_time - actual_start_time)) / 3600) FILTER (WHERE status = 'completed') as total_hours,
  COUNT(DISTINCT client_id) as unique_clients,
  AVG(evv_compliance_score) FILTER (WHERE evv_compliance_score IS NOT NULL) as avg_compliance_score
FROM visits v
JOIN caregivers c ON v.caregiver_id = c.id
WHERE scheduled_start_time >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '24 months')
GROUP BY
  DATE_TRUNC('month', scheduled_start_time),
  caregiver_id,
  c.first_name,
  c.last_name;

CREATE UNIQUE INDEX idx_monthly_caregiver_perf_unique
  ON monthly_caregiver_performance(month, caregiver_id);

CREATE INDEX idx_monthly_caregiver_perf_month ON monthly_caregiver_performance(month);

-- Client service summary (weekly)
CREATE MATERIALIZED VIEW weekly_client_service_summary AS
SELECT
  DATE_TRUNC('week', scheduled_start_time) as week,
  client_id,
  cl.first_name || ' ' || cl.last_name as client_name,
  COUNT(*) as scheduled_visits,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_visits,
  COUNT(*) FILTER (WHERE status = 'missed') as missed_visits,
  SUM(EXTRACT(EPOCH FROM (actual_end_time - actual_start_time)) / 3600) FILTER (WHERE status = 'completed') as total_service_hours,
  COUNT(DISTINCT caregiver_id) as unique_caregivers,
  SUM(billable_amount) as total_billed
FROM visits v
JOIN clients cl ON v.client_id = cl.id
WHERE scheduled_start_time >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '52 weeks')
GROUP BY
  DATE_TRUNC('week', scheduled_start_time),
  client_id,
  cl.first_name,
  cl.last_name;

CREATE UNIQUE INDEX idx_weekly_client_service_unique
  ON weekly_client_service_summary(week, client_id);

CREATE INDEX idx_weekly_client_service_week ON weekly_client_service_summary(week);

-- Refresh function (call nightly via cron)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_visit_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_caregiver_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_client_service_summary;
END;
$$ LANGUAGE plpgsql;
```

**Scheduled Refresh:**

```typescript
// scripts/refresh-analytics.ts
import { database } from '@care-commons/core/database';

async function refreshAnalytics() {
  console.log('Refreshing analytics materialized views...');

  const startTime = Date.now();

  await database.query('SELECT refresh_analytics_views()');

  const duration = Date.now() - startTime;
  console.log(`Analytics views refreshed in ${duration}ms`);
}

refreshAnalytics()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error refreshing analytics:', err);
    process.exit(1);
  });
```

**Cron Job (in production):**

```bash
# Add to crontab
# Refresh analytics at 2 AM daily
0 2 * * * cd /app && node dist/scripts/refresh-analytics.js
```

---

### 2. Add Missing Indexes

**Migration:** `packages/core/migrations/029_analytics_indexes.sql`

```sql
-- Visits table indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_start_date ON visits(DATE(scheduled_start_time));
CREATE INDEX IF NOT EXISTS idx_visits_caregiver_date ON visits(caregiver_id, DATE(scheduled_start_time));
CREATE INDEX IF NOT EXISTS idx_visits_client_date ON visits(client_id, DATE(scheduled_start_time));
CREATE INDEX IF NOT EXISTS idx_visits_branch_date ON visits(branch_id, DATE(scheduled_start_time));

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_visits_analytics
  ON visits(status, caregiver_id, scheduled_start_time)
  WHERE status = 'completed';

-- EVV records for compliance reporting
CREATE INDEX IF NOT EXISTS idx_evv_compliance ON evv_records(visit_id, compliance_status);
CREATE INDEX IF NOT EXISTS idx_evv_submitted_date ON evv_records(DATE(submitted_at));

-- Billing for revenue reports
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(DATE(invoice_date));
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, DATE(invoice_date));
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(DATE(payment_date));
```

---

### 3. Optimized Report Queries

**File:** `verticals/analytics-reporting/src/service/optimized-report-service.ts`

```typescript
export class OptimizedReportService {
  /**
   * Caregiver Performance Report (OPTIMIZED)
   * BEFORE: 15+ seconds for 10,000 visits
   * AFTER: <1 second using materialized view
   */
  async getCaregiverPerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<CaregiverPerformanceReport> {
    const query = `
      SELECT
        caregiver_id,
        caregiver_name,
        SUM(total_visits) as total_visits,
        SUM(completed_visits) as completed_visits,
        SUM(missed_visits) as missed_visits,
        ROUND(100.0 * SUM(completed_visits) / NULLIF(SUM(total_visits), 0), 2) as completion_rate,
        SUM(total_hours) as total_hours,
        COUNT(DISTINCT month) as active_months,
        ROUND(AVG(avg_compliance_score), 2) as avg_compliance_score
      FROM monthly_caregiver_performance
      WHERE month >= DATE_TRUNC('month', $1::date)
        AND month <= DATE_TRUNC('month', $2::date)
      GROUP BY caregiver_id, caregiver_name
      ORDER BY completion_rate DESC, total_hours DESC
    `;

    const result = await this.database.query(query, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    return result.rows;
  }

  /**
   * Client Service Summary (OPTIMIZED)
   */
  async getClientServiceSummary(
    clientId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ClientServiceSummary> {
    const query = `
      SELECT
        week,
        scheduled_visits,
        completed_visits,
        missed_visits,
        total_service_hours,
        unique_caregivers,
        total_billed
      FROM weekly_client_service_summary
      WHERE client_id = $1
        AND week >= DATE_TRUNC('week', $2::date)
        AND week <= DATE_TRUNC('week', $3::date)
      ORDER BY week DESC
    `;

    const result = await this.database.query(query, [
      clientId,
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    return {
      weeks: result.rows,
      totals: this.calculateTotals(result.rows),
    };
  }

  /**
   * Revenue Report (OPTIMIZED with single query)
   */
  async getRevenueReport(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<RevenueReport> {
    const truncFunction = `DATE_TRUNC('${groupBy}', invoice_date)`;

    const query = `
      WITH revenue_data AS (
        SELECT
          ${truncFunction} as period,
          SUM(total) as invoiced,
          SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as collected,
          SUM(CASE WHEN status IN ('pending', 'overdue') THEN total ELSE 0 END) as outstanding,
          COUNT(*) as invoice_count,
          COUNT(DISTINCT client_id) as unique_clients
        FROM invoices
        WHERE invoice_date >= $1
          AND invoice_date <= $2
        GROUP BY ${truncFunction}
      ),
      payment_data AS (
        SELECT
          ${truncFunction.replace('invoice_date', 'payment_date')} as period,
          SUM(amount) as payments_received,
          COUNT(*) as payment_count
        FROM payments
        WHERE payment_date >= $1
          AND payment_date <= $2
        GROUP BY ${truncFunction.replace('invoice_date', 'payment_date')}
      )
      SELECT
        r.period,
        COALESCE(r.invoiced, 0) as invoiced,
        COALESCE(r.collected, 0) as collected,
        COALESCE(r.outstanding, 0) as outstanding,
        COALESCE(p.payments_received, 0) as payments_received,
        r.invoice_count,
        r.unique_clients,
        p.payment_count
      FROM revenue_data r
      LEFT JOIN payment_data p ON r.period = p.period
      ORDER BY r.period DESC
    `;

    const result = await this.database.query(query, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    return result.rows;
  }

  /**
   * EVV Compliance Report (OPTIMIZED)
   */
  async getEVVComplianceReport(
    startDate: Date,
    endDate: Date,
    state?: string
  ): Promise<EVVComplianceReport> {
    const query = `
      WITH compliance_summary AS (
        SELECT
          DATE_TRUNC('day', v.scheduled_start_time) as day,
          COUNT(*) as total_visits,
          COUNT(evv.id) as evv_submitted,
          COUNT(*) FILTER (WHERE evv.compliance_status = 'compliant') as compliant,
          COUNT(*) FILTER (WHERE evv.compliance_status = 'non_compliant') as non_compliant,
          COUNT(*) FILTER (WHERE evv.compliance_status = 'pending') as pending,
          ARRAY_AGG(DISTINCT evv.rejection_reason) FILTER (WHERE evv.rejection_reason IS NOT NULL) as rejection_reasons
        FROM visits v
        LEFT JOIN evv_records evv ON v.id = evv.visit_id
        WHERE v.scheduled_start_time >= $1
          AND v.scheduled_start_time <= $2
          AND v.status = 'completed'
          ${state ? 'AND v.state_code = $3' : ''}
        GROUP BY DATE_TRUNC('day', v.scheduled_start_time)
      )
      SELECT
        day,
        total_visits,
        evv_submitted,
        compliant,
        non_compliant,
        pending,
        ROUND(100.0 * compliant / NULLIF(evv_submitted, 0), 2) as compliance_rate,
        rejection_reasons
      FROM compliance_summary
      ORDER BY day DESC
    `;

    const params = [startDate.toISOString(), endDate.toISOString()];
    if (state) params.push(state);

    const result = await this.database.query(query, params);

    return {
      daily: result.rows,
      summary: this.calculateComplianceSummary(result.rows),
    };
  }
}
```

---

### 4. Query Result Caching

**File:** `packages/core/src/services/cache-service.ts`

```typescript
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Caching decorator for report methods
export function Cached(ttlSeconds: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = new CacheService();
      const cacheKey = `report:${propertyName}:${JSON.stringify(args)}`;

      // Check cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`Cache HIT: ${cacheKey}`);
        return cached;
      }

      // Execute query
      console.log(`Cache MISS: ${cacheKey}`);
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cache.set(cacheKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}

// Usage
export class CachedReportService extends OptimizedReportService {
  @Cached(600) // Cache for 10 minutes
  async getCaregiverPerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<CaregiverPerformanceReport> {
    return super.getCaregiverPerformanceReport(startDate, endDate);
  }
}
```

---

### 5. Query Performance Monitoring

**File:** `packages/core/src/middleware/query-logger.ts`

```typescript
export function logSlowQueries(database: Database) {
  const originalQuery = database.query.bind(database);

  database.query = async function (text: string, params?: any[]) {
    const startTime = Date.now();

    try {
      const result = await originalQuery(text, params);
      const duration = Date.now() - startTime;

      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`SLOW QUERY (${duration}ms):`, {
          query: text.substring(0, 200),
          params,
          rowCount: result.rowCount,
        });
      }

      return result;
    } catch (error) {
      console.error('QUERY ERROR:', { query: text, params, error });
      throw error;
    }
  };
}
```

---

## Testing

### Performance Benchmarks

```typescript
describe('Analytics Performance', () => {
  it('should generate caregiver performance report in <1s', async () => {
    const startTime = Date.now();

    await reportService.getCaregiverPerformanceReport(
      new Date('2025-01-01'),
      new Date('2025-12-31')
    );

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });

  it('should handle 100,000 visits efficiently', async () => {
    // Seed 100k visits
    await seedLargeDataset(100000);

    const startTime = Date.now();

    await reportService.getRevenueReport(
      new Date('2024-01-01'),
      new Date('2025-12-31')
    );

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000);
  });
});
```

---

## Success Criteria

- [ ] Materialized views created and indexed
- [ ] Missing indexes added
- [ ] All TODO comments resolved
- [ ] Report queries rewritten to use views
- [ ] Query result caching implemented
- [ ] All reports execute in <2 seconds
- [ ] Performance benchmarks passing
- [ ] Slow query logging enabled
- [ ] Nightly view refresh scheduled
- [ ] Documentation updated

---

## Performance Targets

| Report | Before | After | Target |
|--------|--------|-------|--------|
| Caregiver Performance | 15s | 0.3s | <1s |
| Client Service Summary | 8s | 0.5s | <1s |
| Revenue Report | 12s | 0.4s | <1s |
| EVV Compliance | 20s | 0.8s | <2s |

---

## Related Tasks

- Task 0041: Analytics Dashboard Completion
- Task 0060: Analytics Dashboard Completion (duplicate)
- Task 0064: API Performance Optimization
