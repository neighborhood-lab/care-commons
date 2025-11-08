# Care Commons Load Tests

Comprehensive load testing suite for Care Commons using [k6](https://k6.io/).

## Overview

This package provides performance testing infrastructure to validate that Care Commons can handle production workloads. It includes various test scenarios, performance monitoring utilities, and CI integration.

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Ubuntu/Debian:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

### Install Dependencies

```bash
cd packages/load-tests
npm install
```

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

## Test Scenarios

### 1. Smoke Test
Quick validation that the system works under minimal load.

```bash
npm run test:smoke
```

- Duration: 30 seconds
- Virtual Users: 1
- Purpose: Verify basic functionality

### 2. Load Test
Normal production workload simulation.

```bash
npm run test:load
```

- Duration: 5 minutes
- Virtual Users: 20
- Purpose: Validate performance under normal load

### 3. Stress Test
Push the system beyond normal capacity.

```bash
npm run test:stress
```

- Duration: 10 minutes
- Virtual Users: 50
- Purpose: Find the breaking point

### 4. Spike Test
Sudden traffic spike simulation.

```bash
npm run test:spike
```

- Pattern: Baseline → Spike → Sustain → Recovery
- Peak Users: 100
- Purpose: Test system resilience

### 5. Soak Test
Long-running test to identify memory leaks and degradation.

```bash
npm run test:soak
```

- Duration: 1 hour
- Virtual Users: 20
- Purpose: Find memory leaks and performance degradation

### Individual Scenario Tests

```bash
# Test authentication flows
npm run test:auth

# Test scheduling operations
npm run test:scheduling

# Test EVV (clock in/out) operations
npm run test:evv
```

## Running Tests

### Basic Usage

```bash
# Set the base URL (defaults to http://localhost:3000)
export BASE_URL=https://staging.care-commons.com

# Run a test
npm run test:load
```

### Using the Report Generator

```bash
# Run test and generate detailed report
cd utils
./generate-report.sh mixed-workload
```

### Custom k6 Options

```bash
# Custom virtual users and duration
k6 run --vus 30 --duration 10m scenarios/mixed-workload.ts

# With specific thresholds
k6 run --vus 20 --duration 5m \
  --threshold http_req_duration=p(95)<500 \
  scenarios/mixed-workload.ts
```

## Test Scenarios Explained

### Authentication Scenario (`auth.ts`)
Tests login, logout, and token refresh operations.

**Key Metrics:**
- Login success rate
- Token refresh success rate
- Response times

### Scheduling Scenario (`scheduling.ts`)
Tests visit scheduling, client/caregiver retrieval, and calendar operations.

**Key Metrics:**
- Visit retrieval time
- Visit creation success rate
- List query performance

### EVV Scenario (`evv.ts`)
Tests electronic visit verification: clock in/out with GPS validation.

**Key Metrics:**
- Clock in/out response times
- GPS validation success rate
- Compliance status updates

### Mixed Workload Scenario (`mixed-workload.ts`)
Realistic simulation with multiple user roles performing typical workflows.

**User Distribution:**
- 50% Caregivers
- 30% Coordinators
- 10% Admins
- 10% Family Members

**Load Pattern:**
1. Warm up (1min): Ramp to 10 users
2. Normal load (3min): Ramp to 20 users
3. Peak load (1min): Spike to 50 users
4. Scale down (1min): Return to 20 users
5. Cool down (1min): Ramp to 0 users

### Spike Test Scenario (`spike-test.ts`)
Sudden traffic spike to test system resilience.

**Load Pattern:**
1. Baseline (10s): 5 users
2. Spike (10s): Ramp to 100 users
3. Sustain (30s): Hold at 100 users
4. Recovery (10s): Return to 5 users

## Database Performance Monitoring

The `utils/db-performance.sql` file contains SQL queries for monitoring database performance during load tests.

### Before Running Load Tests

```bash
# Enable slow query logging and reset stats
psql -d care_commons -f utils/db-performance.sql
```

### After Running Load Tests

```sql
-- View slow queries
SELECT * FROM pg_stat_statements WHERE mean_exec_time > 100 ORDER BY mean_exec_time DESC LIMIT 20;

-- Check for N+1 problems
SELECT calls, mean_exec_time, query FROM pg_stat_statements WHERE calls > 1000 ORDER BY calls DESC LIMIT 20;

-- Monitor connection pool
SELECT state, COUNT(*) FROM pg_stat_activity WHERE datname = 'care_commons' GROUP BY state;
```

## Interpreting Results

### k6 Output Metrics

```
http_req_duration.........: avg=250ms min=50ms med=200ms max=1500ms p(90)=400ms p(95)=500ms
http_req_failed...........: 0.50% (5 of 1000)
http_reqs.................: 1000 (100/s)
vus.......................: 20
vus_max...................: 20
```

**Key Metrics:**
- `http_req_duration`: Response time distribution
- `http_req_failed`: Error rate (should be < 1%)
- `http_reqs`: Total requests and requests per second
- `vus`: Current virtual users

### Threshold Failures

If thresholds fail, you'll see:
```
✓ { expected_response:true }...: avg=250ms min=50ms med=200ms max=1500ms p(90)=400ms p(95)=500ms
✗ http_req_duration............: avg=1200ms min=500ms med=1000ms max=3000ms p(90)=2000ms p(95)=2500ms
     ✗ p(95) < 1000
```

This indicates the 95th percentile response time (2500ms) exceeded the threshold (1000ms).

## CI Integration

Load tests run automatically in GitHub Actions:

- **Schedule**: Every Monday at 2am UTC
- **Manual**: Via workflow_dispatch with customizable parameters

See `.github/workflows/load-tests.yml` for configuration.

## Test Data Requirements

### Test Users

The following test users must exist in your test environment:

```
admin@test.care-commons.local (password: TestPassword123!)
coordinator@test.care-commons.local (password: TestPassword123!)
caregiver@test.care-commons.local (password: TestPassword123!)
family@test.care-commons.local (password: TestPassword123!)
```

### Test Data

For realistic tests, ensure your test environment has:
- At least 10 clients
- At least 10 caregivers
- Scheduled visits for today
- Active care plans

## Troubleshooting

### High Error Rates

If you see high `http_req_failed` rates:
1. Check if the BASE_URL is correct
2. Verify test users exist
3. Check server logs for errors
4. Reduce virtual users to identify capacity limits

### Slow Response Times

If response times exceed thresholds:
1. Run database performance queries (see `utils/db-performance.sql`)
2. Check for missing indexes
3. Identify N+1 query problems
4. Monitor server CPU/memory usage
5. Check database connection pool settings

### Connection Failures

If you see connection errors:
1. Verify the server is running
2. Check firewall/network settings
3. Ensure connection pool size is adequate
4. Monitor database connection limits

## Best Practices

1. **Start Small**: Run smoke tests before full load tests
2. **Monitor Resources**: Watch CPU, memory, and database connections during tests
3. **Reset Stats**: Clear database statistics before each test run
4. **Baseline First**: Establish baseline performance before making changes
5. **Incremental Load**: Gradually increase load to find capacity limits
6. **Regular Testing**: Run load tests regularly to catch performance regressions

## Performance Optimization Checklist

After identifying bottlenecks:

### Database
- [ ] Add missing indexes
- [ ] Optimize N+1 queries
- [ ] Implement query result caching
- [ ] Tune connection pool settings
- [ ] Optimize slow queries

### API
- [ ] Add response compression
- [ ] Implement rate limiting
- [ ] Add Redis caching layer
- [ ] Optimize serialization
- [ ] Use database query batching

### Infrastructure
- [ ] Scale horizontally (add servers)
- [ ] Scale vertically (increase resources)
- [ ] Add load balancer
- [ ] Configure CDN for static assets
- [ ] Implement connection pooling

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/api-load-testing/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

## Support

For issues or questions:
1. Check the [k6 documentation](https://k6.io/docs/)
2. Review test results in the `reports/` directory
3. Consult the database performance queries
4. Contact the development team

## License

Proprietary - Care Commons Team
