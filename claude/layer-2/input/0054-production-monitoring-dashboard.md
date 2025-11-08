# Task 0054: Production Monitoring Dashboard

**Priority**: 🔴 HIGH (Production Requirement)
**Category**: DevOps / Observability
**Estimated Effort**: 3-5 days

## Context

Care Commons needs real-time production monitoring before launch. Current monitoring gaps:
- No real-time metrics dashboard
- Limited error tracking visibility
- No SLA monitoring
- No alert escalation
- Difficult to diagnose production issues quickly

## Objective

Implement comprehensive production monitoring dashboard with real-time metrics, alerting, and SLA tracking.

## Technology Stack

- **Metrics**: Prometheus + Grafana (industry standard, free, self-hostable)
- **Errors**: Sentry (already integrated based on codebase)
- **Logs**: Winston + Loki (structured logging with search)
- **Uptime**: UptimeRobot or StatusCake (external monitoring)

## Implementation

### 1. Prometheus Metrics Export

**packages/app/src/middleware/metrics.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users',
  labelNames: ['role']
});

const visitOperations = new client.Counter({
  name: 'visit_operations_total',
  help: 'Total visit operations',
  labelNames: ['operation', 'status']
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
}

// Expose metrics endpoint
export function getMetrics() {
  return client.register.metrics();
}
```

### 2. Grafana Dashboard Configuration

**monitoring/grafana/dashboards/care-commons-overview.json**:
```json
{
  "dashboard": {
    "title": "Care Commons - Production Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_ms_bucket)",
            "legendFormat": "{{route}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      },
      {
        "title": "Active Users by Role",
        "targets": [
          {
            "expr": "active_users_total",
            "legendFormat": "{{role}}"
          }
        ]
      },
      {
        "title": "Visit Operations",
        "targets": [
          {
            "expr": "rate(visit_operations_total[5m])",
            "legendFormat": "{{operation}}: {{status}}"
          }
        ]
      },
      {
        "title": "Database Connection Pool",
        "targets": [
          {
            "expr": "pg_pool_size - pg_pool_available",
            "legendFormat": "Active connections"
          }
        ]
      }
    ]
  }
}
```

### 3. Alert Rules

**monitoring/prometheus/alerts.yml**:
```yaml
groups:
  - name: care_commons_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} (threshold: 0.05)"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_ms_bucket) > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response times detected"
          description: "P95 response time is {{ $value }}ms"

      - alert: DatabaseConnectionsHigh
        expr: (pg_pool_size - pg_pool_available) / pg_pool_size > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool usage high"
          description: "{{ $value }}% of connection pool in use"

      - alert: ServiceDown
        expr: up{job="care-commons-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Care Commons API is down"
          description: "API service has been down for 1 minute"
```

### 4. Docker Compose for Monitoring Stack

**monitoring/docker-compose.yml**:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager/config.yml:/etc/alertmanager/config.yml
    ports:
      - "9093:9093"

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki/loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
```

## Success Criteria

- [ ] Prometheus collecting metrics from API
- [ ] Grafana dashboards showing real-time data
- [ ] Alerts configured and tested
- [ ] Alert notifications sent to Slack/email
- [ ] SLA metrics tracked (99.5% uptime target)
- [ ] Error tracking integrated with Sentry
- [ ] Logs searchable in Grafana/Loki
- [ ] Documentation for on-call procedures

## Related Tasks

- Task 0033 - Monitoring, Error Tracking, Observability (may have overlap)
- Task 0053 - Load Testing (validates metrics under load)
