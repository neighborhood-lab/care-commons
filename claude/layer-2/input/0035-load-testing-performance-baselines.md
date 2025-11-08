# Task 0035: Load Testing and Performance Baselines

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 6-8 hours

## Context

Production systems must handle expected load without degradation. Without load testing, performance bottlenecks remain hidden until production traffic overwhelms the system, causing outages and poor user experience.

## Problem Statement

Current gaps:
- No load testing performed
- Unknown system capacity
- No performance baselines
- No bottleneck identification
- Unknown database scaling limits
- No stress testing

## Task

### 1. Install Load Testing Tools

```bash
npm install -g k6  # Modern load testing tool
npm install -g autocannon  # Fast HTTP benchmarking
npm install --save-dev @k6/browser  # Browser automation for k6
```

### 2. Create Load Test Scenarios

**File**: `tests/load/scenarios/auth-login.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    email: `testuser${__VU}@example.com`,
    password: 'TestPassword123!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**File**: `tests/load/scenarios/evv-check-in.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 20 },  // Morning shift starts
    { duration: '5m', target: 20 },  // Steady state
    { duration: '2m', target: 100 }, // Peak check-in time
    { duration: '5m', target: 100 }, // Sustained peak
    { duration: '2m', target: 20 },  // Return to normal
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% < 1s for EVV operations
    http_req_failed: ['rate<0.005'],    // Error rate < 0.5% (EVV is critical)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Setup: Login and get token
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'caregiver@example.com',
      password: 'TestPassword123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return { token: JSON.parse(loginRes.body).accessToken };
}

export default function (data) {
  const visitId = `visit-${Math.floor(Math.random() * 1000)}`;

  const payload = JSON.stringify({
    visitId,
    gpsCoordinates: {
      latitude: 30.2672 + Math.random() * 0.01,
      longitude: -97.7431 + Math.random() * 0.01,
      accuracy: 10,
    },
    deviceInfo: {
      deviceId: `device-${__VU}`,
      platform: 'ios',
      osVersion: '16.0',
    },
    biometricVerified: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/evv/check-in`, payload, params);

  check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'check-in successful': (r) => JSON.parse(r.body).success === true,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
```

**File**: `tests/load/scenarios/api-endpoints.js`

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: 50, // 50 virtual users
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    'http_req_duration{endpoint:list_clients}': ['p(95)<500'],
    'http_req_duration{endpoint:get_visits}': ['p(95)<600'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'coordinator@example.com',
      password: 'TestPassword123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return { token: JSON.parse(loginRes.body).accessToken };
}

export default function (data) {
  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
    tags: { endpoint: 'list_clients' },
  };

  group('Client Management', function () {
    const clientsRes = http.get(`${BASE_URL}/api/clients`, params);
    check(clientsRes, {
      'list clients status 200': (r) => r.status === 200,
    });

    if (clientsRes.status === 200) {
      const clients = JSON.parse(clientsRes.body);
      if (clients.length > 0) {
        const clientId = clients[0].id;
        const clientRes = http.get(`${BASE_URL}/api/clients/${clientId}`, {
          ...params,
          tags: { endpoint: 'get_client' },
        });
        check(clientRes, {
          'get client status 200': (r) => r.status === 200,
        });
      }
    }
  });

  group('Visit Management', function () {
    const visitsRes = http.get(`${BASE_URL}/api/visits`, {
      ...params,
      tags: { endpoint: 'get_visits' },
    });
    check(visitsRes, {
      'get visits status 200': (r) => r.status === 200,
    });
  });

  group('Care Plans', function () {
    const plansRes = http.get(`${BASE_URL}/api/care-plans`, {
      ...params,
      tags: { endpoint: 'get_care_plans' },
    });
    check(plansRes, {
      'get care plans status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
```

### 3. Create Database Load Test

**File**: `tests/load/scenarios/database-stress.js`

```javascript
import sql from 'k6/x/sql';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
};

const db = sql.open(
  'postgres',
  `postgres://${__ENV.DB_USER}:${__ENV.DB_PASSWORD}@${__ENV.DB_HOST}:${__ENV.DB_PORT}/${__ENV.DB_NAME}`
);

export default function () {
  // Test concurrent reads
  const result = db.query('SELECT * FROM clients LIMIT 100');
  check(result, {
    'query successful': (r) => r.length > 0,
  });

  // Test writes
  const insertResult = db.exec(
    `INSERT INTO visits (client_id, caregiver_id, scheduled_start, scheduled_end, status)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour', 'scheduled')`,
    'client-123',
    'caregiver-456'
  );

  check(insertResult, {
    'insert successful': (r) => r.rowsAffected === 1,
  });
}

export function teardown() {
  db.close();
}
```

### 4. Performance Baseline Script

**File**: `scripts/performance-baseline.sh`

```bash
#!/bin/bash

# Establish performance baselines for Care Commons

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
RESULTS_DIR="tests/load/results"

mkdir -p "${RESULTS_DIR}"

echo "========================================="
echo "Care Commons Performance Baseline Test"
echo "========================================="
echo "Base URL: ${BASE_URL}"
echo "Date: $(date)"
echo ""

# Test 1: Authentication endpoints
echo "Test 1: Authentication Load (10 concurrent users)"
k6 run --out json="${RESULTS_DIR}/auth-load.json" \
  tests/load/scenarios/auth-login.js

# Test 2: EVV check-in/check-out
echo "Test 2: EVV Check-in Load (100 peak concurrent)"
k6 run --out json="${RESULTS_DIR}/evv-load.json" \
  tests/load/scenarios/evv-check-in.js

# Test 3: API endpoints
echo "Test 3: API Endpoints Load (50 concurrent)"
k6 run --out json="${RESULTS_DIR}/api-load.json" \
  tests/load/scenarios/api-endpoints.js

# Test 4: Database stress
echo "Test 4: Database Stress Test"
k6 run --out json="${RESULTS_DIR}/db-load.json" \
  tests/load/scenarios/database-stress.js

# Generate HTML report
echo "Generating HTML report..."
node scripts/generate-load-report.js "${RESULTS_DIR}"

echo ""
echo "========================================="
echo "Performance Baseline Test Complete"
echo "Results saved to: ${RESULTS_DIR}"
echo "========================================="
```

### 5. Generate Performance Report

**File**: `scripts/generate-load-report.js`

```javascript
const fs = require('fs');
const path = require('path');

const resultsDir = process.argv[2] || 'tests/load/results';

// Read all JSON result files
const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));

const results = {};

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf-8'));

  // Extract key metrics
  const metrics = {
    http_req_duration: data.metrics.http_req_duration,
    http_req_failed: data.metrics.http_req_failed,
    http_reqs: data.metrics.http_reqs,
    vus: data.metrics.vus,
  };

  results[file.replace('.json', '')] = {
    metrics,
    thresholds: data.root_group.checks,
  };
});

// Generate HTML report
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Care Commons Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    .metric { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Care Commons Load Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  ${Object.entries(results).map(([test, data]) => `
    <h2>${test.replace(/-/g, ' ').toUpperCase()}</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Status</th>
      </tr>
      <tr class="metric">
        <td>Average Response Time</td>
        <td>${data.metrics.http_req_duration.values.avg.toFixed(2)} ms</td>
        <td class="${data.metrics.http_req_duration.values.avg < 500 ? 'pass' : 'fail'}">
          ${data.metrics.http_req_duration.values.avg < 500 ? 'PASS' : 'FAIL'}
        </td>
      </tr>
      <tr class="metric">
        <td>P95 Response Time</td>
        <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)} ms</td>
        <td class="${data.metrics.http_req_duration.values['p(95)'] < 1000 ? 'pass' : 'fail'}">
          ${data.metrics.http_req_duration.values['p(95)'] < 1000 ? 'PASS' : 'FAIL'}
        </td>
      </tr>
      <tr class="metric">
        <td>Error Rate</td>
        <td>${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</td>
        <td class="${data.metrics.http_req_failed.values.rate < 0.01 ? 'pass' : 'fail'}">
          ${data.metrics.http_req_failed.values.rate < 0.01 ? 'PASS' : 'FAIL'}
        </td>
      </tr>
      <tr class="metric">
        <td>Total Requests</td>
        <td>${data.metrics.http_reqs.values.count}</td>
        <td>-</td>
      </tr>
      <tr class="metric">
        <td>Requests/sec</td>
        <td>${data.metrics.http_reqs.values.rate.toFixed(2)}</td>
        <td>-</td>
      </tr>
      <tr class="metric">
        <td>Peak VUs</td>
        <td>${data.metrics.vus.values.max}</td>
        <td>-</td>
      </tr>
    </table>
  `).join('')}

  <h2>Performance Baselines</h2>
  <table>
    <tr>
      <th>Endpoint Type</th>
      <th>Target P95</th>
      <th>Target Error Rate</th>
      <th>Min Throughput</th>
    </tr>
    <tr>
      <td>Authentication</td>
      <td>&lt; 500ms</td>
      <td>&lt; 1%</td>
      <td>100 req/sec</td>
    </tr>
    <tr>
      <td>EVV Operations</td>
      <td>&lt; 1000ms</td>
      <td>&lt; 0.5%</td>
      <td>50 req/sec</td>
    </tr>
    <tr>
      <td>API Reads</td>
      <td>&lt; 500ms</td>
      <td>&lt; 1%</td>
      <td>200 req/sec</td>
    </tr>
    <tr>
      <td>API Writes</td>
      <td>&lt; 800ms</td>
      <td>&lt; 1%</td>
      <td>50 req/sec</td>
    </tr>
  </table>
</body>
</html>
`;

fs.writeFileSync(path.join(resultsDir, 'report.html'), html);
console.log('Report generated: tests/load/results/report.html');
```

### 6. Continuous Load Testing in CI

**File**: `.github/workflows/load-test.yml`

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:  # Allow manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Start application
        run: |
          npm run build
          npm start &
          sleep 10  # Wait for app to start

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load tests
        run: ./scripts/performance-baseline.sh

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: tests/load/results/

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('tests/load/results/report.html', 'utf-8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Load Test Results\n\n${report}`
            });
```

## Acceptance Criteria

- [ ] k6 load testing tool installed
- [ ] Authentication load test created
- [ ] EVV check-in load test created
- [ ] API endpoints load test created
- [ ] Database stress test created
- [ ] Performance baseline script completed
- [ ] HTML report generator working
- [ ] Baselines documented
- [ ] CI workflow for weekly load tests
- [ ] Performance regression alerts configured

## Testing Checklist

1. **Baseline Test**: Run full baseline suite, document results
2. **Stress Test**: Test system at 2x expected load
3. **Spike Test**: Test sudden traffic spikes
4. **Endurance Test**: Test system under load for extended period (2+ hours)
5. **Bottleneck Analysis**: Identify and document bottlenecks

## Performance Targets

| Endpoint Type | P50 | P95 | P99 | Error Rate | Throughput |
|---------------|-----|-----|-----|------------|------------|
| Authentication | < 200ms | < 500ms | < 1s | < 1% | 100 req/s |
| EVV Operations | < 500ms | < 1s | < 2s | < 0.5% | 50 req/s |
| API Reads | < 200ms | < 500ms | < 1s | < 1% | 200 req/s |
| API Writes | < 400ms | < 800ms | < 1.5s | < 1% | 50 req/s |

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: Tasks 0021, 0022, 0024 (core functionality must work)

## Priority Justification

This is **CRITICAL** because:
1. Prevents production outages from unexpected load
2. Identifies bottlenecks before they impact users
3. Establishes performance baselines for monitoring
4. Validates system can handle expected traffic

---

**Next Task**: 0036 - Family Engagement Portal UI
