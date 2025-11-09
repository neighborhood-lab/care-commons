# Load Testing Guide

**Version**: 1.0
**Last Updated**: 2025-11-08
**Owner**: Engineering Team

---

## Overview

This guide provides procedures for load testing the Care Commons platform to ensure it can handle expected production traffic and identify performance bottlenecks.

---

## Load Testing Strategy

### Performance Goals

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Response Time (p50) | < 100ms | < 200ms | > 500ms |
| Response Time (p95) | < 300ms | < 500ms | > 1000ms |
| Response Time (p99) | < 500ms | < 1000ms | > 2000ms |
| Throughput | > 100 req/s | > 50 req/s | < 20 req/s |
| Error Rate | < 0.1% | < 1% | > 5% |
| Database Query Time | < 50ms | < 100ms | > 200ms |

### Traffic Estimates

**Expected Production Load** (per organization):
- Daily active users: 50-200
- Concurrent users (peak): 20-50
- API requests/minute: 100-500
- Visit clock-ins/day: 100-500
- Mobile sync operations/hour: 50-200

**Load Test Scenarios**:
1. **Normal Load**: Average traffic (100 req/min)
2. **Peak Load**: 2x average traffic (200 req/min)
3. **Stress Test**: 5x average traffic (500 req/min)
4. **Spike Test**: Sudden 10x traffic surge

---

## Load Testing Tools

### Recommended: Artillery

**Installation**:
```bash
npm install -g artillery@latest
```

**Configuration** (`artillery.yml`):
```yaml
config:
  target: 'https://your-domain.com'
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    # Ramp up to normal load
    - duration: 300
      arrivalRate: 5
      rampTo: 20
      name: "Ramp up to normal load"
    # Sustained normal load
    - duration: 600
      arrivalRate: 20
      name: "Sustained load"
    # Spike test
    - duration: 60
      arrivalRate: 100
      name: "Spike test"
  processor: "./load-test-processor.js"
  plugins:
    metrics-by-endpoint:
      # Group metrics by endpoint
      stripQueryString: true

scenarios:
  # Scenario 1: User Authentication
  - name: "User Login Flow"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomEmail }}"
            password: "test-password"
          capture:
            - json: "$.token"
              as: "authToken"

  # Scenario 2: API Health Check
  - name: "Health Check"
    weight: 10
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200

  # Scenario 3: List Organizations
  - name: "List Organizations"
    weight: 15
    beforeRequest: "setAuthToken"
    flow:
      - get:
          url: "/api/organizations"
          headers:
            Authorization: "Bearer {{ authToken }}"

  # Scenario 4: List Clients
  - name: "List Clients"
    weight: 20
    beforeRequest: "setAuthToken"
    flow:
      - get:
          url: "/api/clients"
          headers:
            Authorization: "Bearer {{ authToken }}"

  # Scenario 5: Create Visit
  - name: "Create Visit"
    weight: 15
    beforeRequest: "setAuthToken"
    flow:
      - post:
          url: "/api/visits"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            clientId: "{{ $randomClientId }}"
            caregiverId: "{{ $randomCaregiverId }}"
            scheduledStart: "{{ $timestamp }}"
            scheduledEnd: "{{ $timestampPlusHour }}"
            serviceType: "personal_care"

  # Scenario 6: Mobile Sync
  - name: "Mobile Sync"
    weight: 20
    beforeRequest: "setAuthToken"
    flow:
      - post:
          url: "/api/sync/pull"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            lastPulledAt: null
```

**Processor File** (`load-test-processor.js`):
```javascript
module.exports = {
  setAuthToken: setAuthToken,
  randomEmail: randomEmail,
  randomClientId: randomClientId,
  randomCaregiverId: randomCaregiverId,
};

// Store auth tokens for reuse
const authTokens = [];

function setAuthToken(requestParams, context, ee, next) {
  // Reuse existing token if available
  if (authTokens.length > 0) {
    const token = authTokens[Math.floor(Math.random() * authTokens.length)];
    context.vars.authToken = token;
  }
  return next();
}

function randomEmail(context, events, done) {
  context.vars.randomEmail = `test-${Date.now()}-${Math.random()}@example.com`;
  return done();
}

function randomClientId(context, events, done) {
  // Use pre-seeded client IDs for testing
  const clientIds = [
    'client-id-1',
    'client-id-2',
    'client-id-3',
  ];
  context.vars.randomClientId = clientIds[Math.floor(Math.random() * clientIds.length)];
  return done();
}

function randomCaregiverId(context, events, done) {
  const caregiverIds = [
    'caregiver-id-1',
    'caregiver-id-2',
    'caregiver-id-3',
  ];
  context.vars.randomCaregiverId = caregiverIds[Math.floor(Math.random() * caregiverIds.length)];
  return done();
}
```

**Run Load Test**:
```bash
# Run basic load test
artillery run artillery.yml

# Run with custom target
artillery run --target https://staging.your-domain.com artillery.yml

# Run and save report
artillery run artillery.yml --output report.json

# Generate HTML report
artillery report report.json --output report.html
```

### Alternative: k6

**Installation**:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Test Script** (`load-test.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '10m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 },  // Spike to 100 users
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://your-domain.com';

export default function () {
  // Test 1: Health check
  let res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check has status field': (r) => r.json('status') === 'healthy',
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Login
  const loginPayload = JSON.stringify({
    email: `test-${__VU}@example.com`,
    password: 'test-password',
  });

  res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const authToken = res.json('token');
  check(res, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => authToken !== undefined,
  }) || errorRate.add(1);

  if (!authToken) return;

  sleep(1);

  // Test 3: Fetch data
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  res = http.get(`${BASE_URL}/api/clients`, authHeaders);
  check(res, {
    'fetch clients successful': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(2);
}
```

**Run k6 Test**:
```bash
# Run load test
k6 run load-test.js

# Run with custom base URL
k6 run -e BASE_URL=https://staging.your-domain.com load-test.js

# Run with output to InfluxDB (if configured)
k6 run --out influxdb=http://localhost:8086/k6 load-test.js
```

---

## Pre-Production Load Testing Procedure

### Step 1: Prepare Test Environment

**Use Staging/Preview Environment**:
```
❌ DO NOT run load tests against production
✅ Use Vercel preview deployment or staging environment
```

1. **Deploy to Preview**:
   ```bash
   # Create preview deployment
   vercel deploy --preview

   # Note the preview URL
   # Example: https://care-commons-preview-abc123.vercel.app
   ```

2. **Seed Test Data**:
   ```bash
   # Connect to preview database
   export DATABASE_URL="postgresql://preview-db-url"

   # Run migrations
   npm run db:migrate

   # Seed with demo data
   npm run db:seed:demo

   # Create additional test users/data for load testing
   node scripts/create-load-test-data.js
   ```

3. **Configure Monitoring**:
   - Enable Sentry for preview environment
   - Access Vercel analytics for preview deployment
   - Monitor Neon database metrics

### Step 2: Run Baseline Test

**Purpose**: Establish performance baseline

```bash
# Run light load to establish baseline
artillery quick --count 10 --num 100 https://preview-url.vercel.app/health

# Expected output:
# Scenarios launched: 10
# Scenarios completed: 10
# Requests completed: 100
# Mean response time: ~150ms
# p95 response time: ~300ms
# p99 response time: ~500ms
```

### Step 3: Run Progressive Load Tests

**Test 1: Normal Load** (100 requests/minute):
```bash
artillery run \
  --target https://preview-url.vercel.app \
  --config '{"phases":[{"duration":300,"arrivalRate":1.67}]}' \
  artillery.yml
```

**Test 2: Peak Load** (200 requests/minute):
```bash
artillery run \
  --target https://preview-url.vercel.app \
  --config '{"phases":[{"duration":300,"arrivalRate":3.33}]}' \
  artillery.yml
```

**Test 3: Stress Test** (500 requests/minute):
```bash
artillery run \
  --target https://preview-url.vercel.app \
  --config '{"phases":[{"duration":300,"arrivalRate":8.33}]}' \
  artillery.yml
```

### Step 4: Analyze Results

**Key Metrics to Review**:

1. **Response Times**:
   ```
   ✅ p50 < 200ms
   ✅ p95 < 500ms
   ✅ p99 < 1000ms
   ⚠️ If p95 > 500ms → investigate slow endpoints
   ❌ If p99 > 2000ms → performance issues, do not launch
   ```

2. **Error Rate**:
   ```
   ✅ < 1% errors
   ⚠️ 1-5% errors → investigate and fix
   ❌ > 5% errors → critical issues, do not launch
   ```

3. **Database Performance**:
   - Check Neon metrics dashboard
   - Review slow query logs
   - Monitor connection pool utilization

4. **Vercel Metrics**:
   - Function execution time
   - Cold start frequency
   - Edge cache hit rate

### Step 5: Identify Bottlenecks

**Common Issues**:

1. **Slow Database Queries**:
   ```sql
   -- Find slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;

   -- Add missing indexes
   CREATE INDEX idx_visits_client_date
   ON visits(client_id, scheduled_start);
   ```

2. **High Connection Pool Usage**:
   ```javascript
   // Increase pool size if needed (packages/core/src/db/connection.ts)
   pool: {
     min: 2,
     max: 30, // Increase from 20 if needed
   }
   ```

3. **Slow API Endpoints**:
   - Check Prometheus metrics: `/metrics`
   - Review Sentry performance traces
   - Add caching where appropriate

### Step 6: Re-test After Optimizations

```bash
# Run same load test again
artillery run artillery.yml --output report-optimized.json

# Compare with baseline
artillery report report-baseline.json --output baseline.html
artillery report report-optimized.json --output optimized.html

# Compare metrics side-by-side
```

---

## Production Monitoring During Launch

### Real-Time Metrics to Watch

1. **Vercel Dashboard**:
   - Request rate
   - Response times (p50, p95, p99)
   - Error rate
   - Function execution duration

2. **Prometheus Metrics** (`/metrics`):
   ```bash
   # Watch metrics in real-time
   watch -n 5 'curl -s https://domain.com/metrics | grep http_requests_total'

   # Key metrics:
   # - http_requests_total{status="200"}
   # - http_request_duration_seconds
   # - db_query_duration_seconds
   ```

3. **Neon Database**:
   - Connection count
   - Query duration
   - Active queries
   - Lock wait time

4. **Sentry**:
   - Error rate
   - Performance issues
   - Transaction throughput

---

## Performance Optimization Checklist

### Application Level

- [ ] Database query optimization (indexes, N+1 queries)
- [ ] Enable response compression (gzip/brotli)
- [ ] Implement caching (Redis for rate limiting)
- [ ] Optimize serialization (reduce payload size)
- [ ] Connection pooling tuning
- [ ] Lazy loading for large datasets

### Database Level

- [ ] Add indexes for common queries
- [ ] Analyze and vacuum tables regularly
- [ ] Optimize slow queries
- [ ] Consider read replicas (if needed)
- [ ] Enable query caching

### Infrastructure Level

- [ ] Vercel Edge caching for static assets
- [ ] CDN for media files
- [ ] Database in same region as serverless functions
- [ ] Connection pooling (Neon serverless driver)

---

## Load Testing Checklist

**Before Launch**:
- [ ] Load test plan created
- [ ] Test environment prepared
- [ ] Test data seeded
- [ ] Baseline metrics established
- [ ] Progressive load tests completed
- [ ] Performance goals met
- [ ] Bottlenecks identified and fixed
- [ ] Final load test passed

**Post-Launch**:
- [ ] Monitor real user metrics
- [ ] Compare with load test predictions
- [ ] Adjust capacity if needed
- [ ] Update load test scenarios based on actual usage

---

## Useful Commands

```bash
# Quick load test with Artillery
artillery quick --count 10 --num 1000 https://your-domain.com/health

# Run full load test suite
artillery run artillery.yml --output results.json

# Generate HTML report
artillery report results.json --output report.html

# Run k6 load test
k6 run load-test.js

# Monitor Prometheus metrics
curl https://your-domain.com/metrics | grep -E "(http_requests|http_request_duration)"

# Check database performance
psql $DATABASE_URL -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Next Load Test**: Before next major release
