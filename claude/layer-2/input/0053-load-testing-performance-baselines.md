# Task 0053: Load Testing and Performance Baselines

**Priority**: 🔴 HIGH (Production Requirement)
**Category**: Performance / Quality Assurance
**Estimated Effort**: 3-5 days (24-40 hours)

## Context

Care Commons is approaching production readiness but lacks performance validation. Before launch, we need to:

1. **Establish baseline metrics** - Response times, throughput, resource usage
2. **Validate scale targets** - Can handle 50+ concurrent users (3 agencies with 15-20 caregivers each)
3. **Identify bottlenecks** - Slow queries, N+1 problems, inefficient endpoints
4. **Set SLA targets** - 95th percentile response times for critical endpoints
5. **Prevent performance regressions** - Automated load tests in CI

Current state:
- No load testing performed
- No performance baselines established
- Unknown performance under concurrent load
- No monitoring of slow queries in production

## Objective

Implement comprehensive load testing infrastructure and establish performance baselines for production launch.

## Technology Stack

**Load Testing Tool**: k6 (Grafana k6)

**Rationale**:
- JavaScript/TypeScript syntax (familiar to team)
- Excellent CLI and CI integration
- Built-in performance metrics
- Realistic browser simulation
- Free and open-source
- Great documentation

**Alternative**: Artillery (simpler but less powerful)

## Performance Targets

### Response Time Targets (95th Percentile)

| Endpoint Category | Target | Max Acceptable |
|-------------------|--------|----------------|
| Authentication | < 200ms | 500ms |
| Read operations (GET) | < 300ms | 1000ms |
| Write operations (POST/PUT) | < 500ms | 2000ms |
| Complex queries (reports) | < 1000ms | 3000ms |
| File uploads | < 2000ms | 5000ms |

### Throughput Targets

| Scenario | Target RPS | Concurrent Users |
|----------|------------|------------------|
| Normal load | 100 RPS | 20 users |
| Peak load | 300 RPS | 50 users |
| Stress test | 500 RPS | 100 users |

### Resource Targets

- CPU usage < 70% under peak load
- Memory usage < 80% under peak load
- Database connections < 50 under peak load
- No connection pool exhaustion
- No memory leaks over 1-hour test

## Test Architecture

```
packages/load-tests/              # New package
├── scenarios/
│   ├── auth.ts                   # Login, logout, token refresh
│   ├── scheduling.ts             # Schedule visits, view calendar
│   ├── evv.ts                    # Clock in/out, GPS verification
│   ├── family-portal.ts          # Family views, messaging
│   ├── billing.ts                # Invoice generation, reports
│   └── mixed-workload.ts         # Realistic mixed scenario
├── fixtures/
│   ├── users.json                # Test user credentials
│   └── data.json                 # Test data (clients, visits, etc.)
├── utils/
│   ├── auth.ts                   # Auth token handling
│   └── metrics.ts                # Custom metrics
├── reports/
│   └── .gitkeep                  # Generated reports go here
└── k6.config.js
```

## Implementation Steps

### Step 1: Setup k6

```bash
# Install k6
brew install k6  # macOS
# OR
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6  # Ubuntu/Debian

# Create package
cd /home/user/care-commons
mkdir -p packages/load-tests
cd packages/load-tests
npm init -y
npm install -D @types/k6 typescript
```

**package.json**:
```json
{
  "name": "@care-commons/load-tests",
  "version": "1.0.0",
  "scripts": {
    "test:smoke": "k6 run --vus 1 --duration 30s scenarios/mixed-workload.ts",
    "test:load": "k6 run --vus 20 --duration 5m scenarios/mixed-workload.ts",
    "test:stress": "k6 run --vus 50 --duration 10m scenarios/mixed-workload.ts",
    "test:spike": "k6 run scenarios/spike-test.ts",
    "test:soak": "k6 run --vus 20 --duration 1h scenarios/mixed-workload.ts",
    "test:all": "npm run test:smoke && npm run test:load && npm run test:stress",
    "report": "open reports/latest.html"
  }
}
```

### Step 2: Create Authentication Helper

**utils/auth.ts**:
```typescript
import http from 'k6/http';
import { check } from 'k6';

export interface AuthToken {
  token: string;
  refreshToken: string;
}

export function login(email: string, password: string): AuthToken | null {
  const url = `${__ENV.BASE_URL}/api/auth/login`;

  const payload = JSON.stringify({
    email,
    password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  const success = check(res, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  if (!success) {
    console.error(`Login failed for ${email}: ${res.status}`);
    return null;
  }

  return {
    token: res.json('token') as string,
    refreshToken: res.json('refreshToken') as string,
  };
}

export function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
```

### Step 3: Create Scenario Tests

**scenarios/auth.ts**:
```typescript
import { check, sleep } from 'k6';
import http from 'k6/http';
import { login } from '../utils/auth';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate must be below 1%
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // Test login
  const authRes = login('coordinator@test.care-commons.local', 'TestPassword123!');

  check(authRes, {
    'login returned token': (auth) => auth !== null && auth.token.length > 0,
  });

  sleep(1);

  // Test token refresh
  if (authRes) {
    const refreshRes = http.post(
      `${baseUrl}/api/auth/refresh`,
      JSON.stringify({ refreshToken: authRes.refreshToken }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(refreshRes, {
      'refresh successful': (r) => r.status === 200,
      'new token received': (r) => r.json('token') !== undefined,
    });
  }

  sleep(1);
}
```

**scenarios/scheduling.ts**:
```typescript
import { check, sleep } from 'k6';
import http from 'k6/http';
import { login, getAuthHeaders } from '../utils/auth';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const visitCreations = new Counter('visit_creations');
const visitRetrievals = new Trend('visit_retrieval_time');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.01'],
    'visit_retrieval_time': ['p(95)<500'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // Login as coordinator
  const auth = login('coordinator@test.care-commons.local', 'TestPassword123!');
  if (!auth) return;

  const headers = getAuthHeaders(auth.token);

  // Get list of clients
  const clientsRes = http.get(`${baseUrl}/api/clients?limit=10`, { headers });
  check(clientsRes, {
    'clients retrieved': (r) => r.status === 200,
    'has clients': (r) => r.json('data.length') > 0,
  });

  sleep(1);

  // Get list of caregivers
  const caregiversRes = http.get(`${baseUrl}/api/caregivers?limit=10`, { headers });
  check(caregiversRes, {
    'caregivers retrieved': (r) => r.status === 200,
    'has caregivers': (r) => r.json('data.length') > 0,
  });

  sleep(1);

  // Get today's visits
  const visitsStartTime = Date.now();
  const visitsRes = http.get(`${baseUrl}/api/visits?date=today`, { headers });
  const visitsEndTime = Date.now();

  visitRetrievals.add(visitsEndTime - visitsStartTime);

  check(visitsRes, {
    'visits retrieved': (r) => r.status === 200,
  });

  sleep(2);

  // Create a visit (10% of the time)
  if (Math.random() < 0.1) {
    const clients = clientsRes.json('data');
    const caregivers = caregiversRes.json('data');

    if (clients && caregivers && clients.length > 0 && caregivers.length > 0) {
      const visit = {
        client_id: clients[0].id,
        caregiver_id: caregivers[0].id,
        scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        service_type: 'personal_care',
      };

      const createRes = http.post(
        `${baseUrl}/api/visits`,
        JSON.stringify(visit),
        { headers }
      );

      check(createRes, {
        'visit created': (r) => r.status === 201,
      });

      if (createRes.status === 201) {
        visitCreations.add(1);
      }
    }
  }

  sleep(2);
}
```

**scenarios/evv.ts**:
```typescript
import { check, sleep } from 'k6';
import http from 'k6/http';
import { login, getAuthHeaders } from '../utils/auth';

export const options = {
  vus: 20,
  duration: '2m',
  thresholds: {
    'http_req_duration{endpoint:clock_in}': ['p(95)<800'],
    'http_req_duration{endpoint:clock_out}': ['p(95)<800'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // Login as caregiver
  const auth = login('caregiver@test.care-commons.local', 'TestPassword123!');
  if (!auth) return;

  const headers = getAuthHeaders(auth.token);

  // Get today's visits
  const visitsRes = http.get(`${baseUrl}/api/visits/my-visits?date=today`, { headers });
  check(visitsRes, {
    'visits retrieved': (r) => r.status === 200,
  });

  const visits = visitsRes.json('data');
  if (!visits || visits.length === 0) return;

  const visit = visits[0];

  sleep(1);

  // Clock in
  const clockInPayload = {
    visit_id: visit.id,
    latitude: 30.2672,
    longitude: -97.7431,
    device_id: `test-device-${__VU}`,
  };

  const clockInRes = http.post(
    `${baseUrl}/api/evv/clock-in`,
    JSON.stringify(clockInPayload),
    {
      headers,
      tags: { endpoint: 'clock_in' }
    }
  );

  check(clockInRes, {
    'clock in successful': (r) => r.status === 200 || r.status === 201,
    'evv record created': (r) => r.json('id') !== undefined,
  });

  sleep(5); // Simulate 5 seconds of work

  // Clock out
  const clockOutPayload = {
    visit_id: visit.id,
    latitude: 30.2672,
    longitude: -97.7431,
    device_id: `test-device-${__VU}`,
    notes: 'Provided excellent care',
  };

  const clockOutRes = http.post(
    `${baseUrl}/api/evv/clock-out`,
    JSON.stringify(clockOutPayload),
    {
      headers,
      tags: { endpoint: 'clock_out' }
    }
  );

  check(clockOutRes, {
    'clock out successful': (r) => r.status === 200,
    'evv validated': (r) => r.json('compliance_status') !== undefined,
  });

  sleep(2);
}
```

**scenarios/mixed-workload.ts** (Most Realistic):
```typescript
import { check, sleep } from 'k6';
import http from 'k6/http';
import { login, getAuthHeaders } from '../utils/auth';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '3m', target: 20 },   // Normal load
    { duration: '1m', target: 50 },   // Peak load
    { duration: '1m', target: 20 },   // Scale down
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.05'], // Allow up to 5% errors
  },
};

const USER_ROLES = [
  { email: 'admin@test.care-commons.local', password: 'TestPassword123!', weight: 0.1 },
  { email: 'coordinator@test.care-commons.local', password: 'TestPassword123!', weight: 0.3 },
  { email: 'caregiver@test.care-commons.local', password: 'TestPassword123!', weight: 0.5 },
  { email: 'family@test.care-commons.local', password: 'TestPassword123!', weight: 0.1 },
];

function getRandomUser() {
  const rand = Math.random();
  let cumulative = 0;

  for (const user of USER_ROLES) {
    cumulative += user.weight;
    if (rand < cumulative) return user;
  }

  return USER_ROLES[0];
}

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const user = getRandomUser();

  // Login
  const auth = login(user.email, user.password);
  if (!auth) return;

  const headers = getAuthHeaders(auth.token);

  // Simulate realistic user behavior based on role
  if (user.email.includes('coordinator')) {
    coordinatorWorkflow(baseUrl, headers);
  } else if (user.email.includes('caregiver')) {
    caregiverWorkflow(baseUrl, headers);
  } else if (user.email.includes('family')) {
    familyWorkflow(baseUrl, headers);
  } else {
    adminWorkflow(baseUrl, headers);
  }

  sleep(randomIntBetween(1, 5));
}

function coordinatorWorkflow(baseUrl: string, headers: object) {
  // View dashboard
  http.get(`${baseUrl}/api/dashboard/coordinator`, { headers });
  sleep(2);

  // View today's visits
  http.get(`${baseUrl}/api/visits?date=today`, { headers });
  sleep(1);

  // View clients
  http.get(`${baseUrl}/api/clients?limit=20`, { headers });
  sleep(1);

  // View caregivers
  http.get(`${baseUrl}/api/caregivers?limit=20`, { headers });
  sleep(1);
}

function caregiverWorkflow(baseUrl: string, headers: object) {
  // View my visits
  http.get(`${baseUrl}/api/visits/my-visits?date=today`, { headers });
  sleep(2);

  // View care plans
  http.get(`${baseUrl}/api/care-plans/assigned`, { headers });
  sleep(1);
}

function familyWorkflow(baseUrl: string, headers: object) {
  // View family portal dashboard
  http.get(`${baseUrl}/api/family-portal/dashboard`, { headers });
  sleep(2);

  // View recent visits
  http.get(`${baseUrl}/api/family-portal/visits`, { headers });
  sleep(1);

  // View messages
  http.get(`${baseUrl}/api/family-portal/messages`, { headers });
  sleep(1);
}

function adminWorkflow(baseUrl: string, headers: object) {
  // View admin dashboard
  http.get(`${baseUrl}/api/dashboard/admin`, { headers });
  sleep(2);

  // View analytics
  http.get(`${baseUrl}/api/analytics/overview`, { headers });
  sleep(1);
}
```

### Step 4: Create Spike Test

**scenarios/spike-test.ts**:
```typescript
export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Baseline
    { duration: '10s', target: 100 },  // SPIKE!
    { duration: '30s', target: 100 },  // Sustain spike
    { duration: '10s', target: 5 },    // Recovery
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // More lenient during spike
    'http_req_failed': ['rate<0.1'],     // Allow 10% errors during spike
  },
};

// Same mixed workload logic
```

### Step 5: Database Performance Monitoring

**Add slow query logging**:

Update PostgreSQL config:
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries taking > 100ms
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
SELECT pg_reload_conf();

-- Create extension for query stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Step 6: HTML Report Generation

**utils/generate-report.sh**:
```bash
#!/bin/bash

# Run load test and generate HTML report
k6 run \
  --out json=reports/results.json \
  --summary-export=reports/summary.json \
  scenarios/mixed-workload.ts

# Convert to HTML (requires k6-reporter or custom script)
# npm install -g k6-html-reporter
k6-html-reporter reports/results.json --output reports/latest.html

echo "Report generated at: reports/latest.html"
```

### Step 7: CI Integration

**.github/workflows/load-tests.yml**:
```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 1' # Every Monday at 2am
  workflow_dispatch: # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run smoke test
        run: cd packages/load-tests && npm run test:smoke
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Run load test
        run: cd packages/load-tests && npm run test:load
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: packages/load-tests/reports/
```

## Success Criteria

- [ ] All scenarios run without errors
- [ ] 95th percentile response times meet targets
- [ ] System handles 50 concurrent users
- [ ] No memory leaks during 1-hour soak test
- [ ] No database connection pool exhaustion
- [ ] Slow queries identified and documented
- [ ] Performance baselines documented
- [ ] Load tests run weekly in CI

## Performance Optimization Checklist

After running load tests, optimize:

1. **Database**:
   - [ ] Add missing indexes
   - [ ] Optimize N+1 queries
   - [ ] Add query result caching

2. **API**:
   - [ ] Add response compression
   - [ ] Implement rate limiting
   - [ ] Add Redis caching layer

3. **Frontend**:
   - [ ] Code splitting
   - [ ] Image optimization
   - [ ] CDN for static assets

## Related Tasks

- Task 0031 - Caching Layer Implementation (based on findings)
- Task 0044 - Performance Optimization and Database (based on slow queries)
- Task 0064 - API Performance Optimization (based on bottlenecks)
