# Task 0033: Monitoring, Error Tracking, and Observability

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 10-12 hours

## Context

Production systems require comprehensive monitoring to detect issues before they impact users. Without proper observability, debugging production issues is nearly impossible, and system degradation goes unnoticed until catastrophic failure.

## Problem Statement

Current gaps:
- No centralized error tracking
- No performance monitoring
- No alerting for system issues
- No application metrics dashboard
- Limited logging infrastructure
- No trace correlation for debugging
- Manual log inspection required

## Task

### 1. Install Monitoring Tools

```bash
npm install @sentry/node @sentry/tracing --save
npm install prom-client --save  # Prometheus metrics
npm install winston winston-daily-rotate-file --save  # Structured logging
```

### 2. Configure Sentry for Error Tracking

**File**: `packages/app/src/services/sentry.service.ts`

```typescript
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Express } from 'express';

export const initSentry = (app: Express) => {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry not configured (no SENTRY_DSN), error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),

      // Database integration
      new Tracing.Integrations.Postgres(),
    ],

    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }

      // Don't send errors from health checks
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      return event;
    },
  });

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  return Sentry;
};

export const configureSentryErrorHandler = (app: Express) => {
  // Error handler must be after all routes
  app.use(Sentry.Handlers.errorHandler());
};

// Helper to capture errors with context
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
};
```

### 3. Configure Structured Logging

**File**: `packages/core/src/services/logger.service.ts`

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { SensitiveDataFilter } from '../utils/sensitive-data-filter';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'care-commons',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // File transport for errors
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),

    // File transport for all logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
      zippedArchive: true,
    }),

    // File transport for audit logs
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxFiles: '90d', // Keep audit logs for 90 days
      maxSize: '20m',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Wrap logger methods to filter sensitive data
const originalInfo = logger.info.bind(logger);
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.info = (message: string, meta?: any) => {
  return originalInfo(message, meta ? SensitiveDataFilter.filter(meta) : meta);
};

logger.error = (message: string, meta?: any) => {
  return originalError(message, meta ? SensitiveDataFilter.filter(meta) : meta);
};

logger.warn = (message: string, meta?: any) => {
  return originalWarn(message, meta ? SensitiveDataFilter.filter(meta) : meta);
};

// Audit logging helper
export const auditLog = (action: string, userId: string, details: any) => {
  logger.info('AUDIT', {
    action,
    userId,
    details: SensitiveDataFilter.filter(details),
    timestamp: new Date().toISOString(),
  });
};

export default logger;
```

### 4. Implement Prometheus Metrics

**File**: `packages/app/src/services/metrics.service.ts`

```typescript
import promClient from 'prom-client';
import { Express } from 'express';

// Initialize Prometheus client
export class MetricsService {
  private static register = new promClient.Register();

  // Default metrics (CPU, memory, event loop lag)
  static {
    promClient.collectDefaultMetrics({ register: this.register });
  }

  // Custom metrics
  static httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [this.register],
  });

  static httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.register],
  });

  static databaseQueryDuration = new promClient.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [this.register],
  });

  static evvCheckInTotal = new promClient.Counter({
    name: 'evv_check_in_total',
    help: 'Total number of EVV check-ins',
    labelNames: ['status', 'state'],
    registers: [this.register],
  });

  static evvCheckOutTotal = new promClient.Counter({
    name: 'evv_check_out_total',
    help: 'Total number of EVV check-outs',
    labelNames: ['status', 'state'],
    registers: [this.register],
  });

  static activeVisits = new promClient.Gauge({
    name: 'active_visits',
    help: 'Number of currently active visits',
    registers: [this.register],
  });

  static syncQueueSize = new promClient.Gauge({
    name: 'sync_queue_size',
    help: 'Number of pending sync operations',
    labelNames: ['operation_type'],
    registers: [this.register],
  });

  static cacheHitRate = new promClient.Counter({
    name: 'cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'result'], // hit/miss
    registers: [this.register],
  });

  static configureMetricsEndpoint(app: Express) {
    // Metrics endpoint for Prometheus
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', this.register.contentType);
      res.end(await this.register.metrics());
    });
  }

  static getRegister() {
    return this.register;
  }
}
```

### 5. Create Metrics Middleware

**File**: `packages/app/src/middleware/metrics.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Capture response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    // Record metrics
    MetricsService.httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    MetricsService.httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
};
```

### 6. Add Health Check Endpoints

**File**: `packages/app/src/routes/health.routes.ts`

```typescript
import { Router } from 'express';
import { db } from '@care-commons/core/db';
import { getCacheService } from '@care-commons/core/services/cache.service';

const router = Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check (includes dependencies)
router.get('/health/detailed', async (req, res) => {
  const checks: any = {
    app: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Check database
  try {
    await db.raw('SELECT 1');
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    checks.databaseError = error.message;
  }

  // Check cache
  try {
    const cache = getCacheService();
    await cache.set('health-check', 'ok', 10);
    const value = await cache.get('health-check');
    checks.cache = value === 'ok' ? 'ok' : 'error';
  } catch (error) {
    checks.cache = 'error';
    checks.cacheError = error.message;
  }

  // Overall status
  const allOk = Object.values(checks)
    .filter(v => typeof v === 'string')
    .every(v => v === 'ok' || v.includes('2025'));

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
  });
});

// Readiness check (for Kubernetes)
router.get('/health/ready', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Liveness check (for Kubernetes)
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
```

### 7. Implement Request Tracing

**File**: `packages/app/src/middleware/tracing.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate or use existing trace ID
  const traceId = req.headers['x-trace-id'] || uuidv4();
  req.headers['x-trace-id'] = traceId as string;

  // Add trace ID to response headers
  res.setHeader('X-Trace-ID', traceId);

  // Store trace ID in request for logging
  (req as any).traceId = traceId;

  next();
};

// Update logger to include trace ID
import { logger } from '@care-commons/core/services/logger.service';

export const logWithTrace = (req: Request, level: string, message: string, meta?: any) => {
  logger[level](message, {
    ...meta,
    traceId: (req as any).traceId,
    userId: req.user?.id,
    ip: req.ip,
  });
};
```

### 8. Create Alerting Configuration

**File**: `config/alerts.yaml`

```yaml
# Alert rules for monitoring system
alerts:
  # High error rate
  - name: high_error_rate
    condition: http_requests_total{status_code=~"5.."} > 10 per 5m
    severity: critical
    message: "High error rate detected: {{ $value }} errors in 5 minutes"
    notify:
      - email: alerts@example.com
      - slack: "#alerts"

  # Database connection issues
  - name: database_connection_error
    condition: database_health != "ok"
    severity: critical
    message: "Database connection error detected"
    notify:
      - email: alerts@example.com
      - pagerduty: service_key

  # High response time
  - name: high_response_time
    condition: http_request_duration_seconds{quantile="0.95"} > 2
    severity: warning
    message: "95th percentile response time > 2s"
    notify:
      - slack: "#alerts"

  # Cache unavailable
  - name: cache_unavailable
    condition: cache_health != "ok"
    severity: warning
    message: "Cache service unavailable, falling back to database"
    notify:
      - slack: "#alerts"

  # Sync queue backing up
  - name: sync_queue_backup
    condition: sync_queue_size > 1000
    severity: warning
    message: "Sync queue has {{ $value }} pending operations"
    notify:
      - slack: "#alerts"

  # EVV failures
  - name: evv_check_in_failures
    condition: evv_check_in_total{status="error"} > 5 per 10m
    severity: high
    message: "Multiple EVV check-in failures detected"
    notify:
      - email: alerts@example.com
      - slack: "#alerts"
```

### 9. Dashboard Configuration

**File**: `config/grafana-dashboard.json`

Create Grafana dashboard with panels for:
- Request rate (by endpoint, method, status)
- Response times (p50, p95, p99)
- Error rate
- Database query times
- Active visits
- EVV check-in/out rates
- Cache hit rate
- System resources (CPU, memory, disk)

### 10. Logging Best Practices Documentation

**File**: `docs/logging-best-practices.md`

```markdown
# Logging Best Practices

## Log Levels

- **ERROR**: System errors requiring immediate attention
- **WARN**: Potential issues that should be investigated
- **INFO**: Important business events (user actions, EVV check-ins)
- **DEBUG**: Detailed diagnostic information

## What to Log

- All authentication attempts (success/failure)
- All authorization failures
- EVV check-ins and check-outs
- Visit status changes
- Billing transactions
- Data exports
- Configuration changes
- System errors

## What NOT to Log

- Passwords or password hashes
- API keys or tokens
- SSN or sensitive PII
- Credit card numbers
- Biometric data

## Log Structure

{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "info",
  "message": "EVV check-in completed",
  "traceId": "abc-123-def-456",
  "userId": "user-789",
  "context": {
    "visitId": "visit-123",
    "caregiverId": "cg-456",
    "clientId": "client-789"
  }
}
```

## Acceptance Criteria

- [ ] Sentry configured for error tracking
- [ ] Structured logging with Winston
- [ ] Prometheus metrics implemented
- [ ] Health check endpoints created
- [ ] Request tracing with trace IDs
- [ ] Sensitive data filtered from logs
- [ ] Metrics endpoint exposed at `/metrics`
- [ ] Alert rules configured
- [ ] Grafana dashboard created
- [ ] Logging best practices documented
- [ ] Tests written for monitoring code

## Testing Checklist

1. **Error Tracking Test**: Trigger error, verify in Sentry
2. **Metrics Test**: Make requests, verify metrics at `/metrics`
3. **Health Check Test**: Verify all health endpoints return correct status
4. **Logging Test**: Verify logs contain trace IDs
5. **Sensitive Data Test**: Verify passwords/tokens not in logs

## Metrics to Monitor

- Request rate: Requests per second
- Error rate: Errors per minute
- Response time: p50, p95, p99
- Database query time: Average, max
- Cache hit rate: Percentage
- Active visits: Current count
- EVV check-ins/outs: Per hour
- Sync queue size: Current count

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: None

## Priority Justification

This is **CRITICAL** because:
1. Production requirement - cannot debug without observability
2. Proactive issue detection - catch problems before users report
3. Performance tracking - measure and improve system performance
4. Compliance requirement - audit trail for HIPAA

---

**Next Task**: 0034 - Backup and Disaster Recovery
