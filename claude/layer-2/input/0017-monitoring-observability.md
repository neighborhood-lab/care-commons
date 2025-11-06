# Task 0017: Add Monitoring, Logging, and Observability

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 6-8 hours

## Context

Production systems need comprehensive monitoring, structured logging, and observability to detect and diagnose issues. Implement monitoring for application health, performance, errors, and business metrics.

## Goal

- Real-time visibility into application health
- Structured logging for debugging
- Error tracking and alerting
- Performance monitoring
- Business metrics dashboards

## Task

### 1. Implement Structured Logging

**Install logging library**:
```bash
npm install pino pino-pretty
npm install --save-dev @types/pino
```

**File**: `packages/core/src/utils/logger.ts`

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  }),
  ...(process.env.NODE_ENV === 'production' && {
    // JSON logging for production (easier to parse)
    formatters: {
      level: (label) => {
        return { level: label };
      }
    }
  })
});

export default logger;

// Convenience methods with context
export const createLogger = (context: string) => {
  return logger.child({ context });
};

// Usage example:
// const log = createLogger('VisitService');
// log.info({ visitId: '123' }, 'Visit created successfully');
// log.error({ error, visitId: '123' }, 'Failed to create visit');
```

**Replace console.log throughout codebase**:

Before:
```typescript
console.log('Visit created:', visit.id);
console.error('Error creating visit:', error);
```

After:
```typescript
const log = createLogger('VisitService');
log.info({ visitId: visit.id }, 'Visit created successfully');
log.error({ error, visitId: visit.id }, 'Failed to create visit');
```

### 2. Add Request Logging Middleware

**File**: `packages/core/src/middleware/request-logger.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log request
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('user-agent')
  }, 'Incoming request');

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;

    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request error');
    } else {
      logger.info(logData, 'Request completed');
    }

    // Alert on slow requests (>2 seconds)
    if (duration > 2000) {
      logger.warn({ ...logData, duration }, 'Slow request detected');
    }
  });

  next();
}
```

### 3. Integrate Error Tracking (Sentry)

**Install Sentry**:
```bash
npm install @sentry/node @sentry/integrations
```

**File**: `packages/core/src/utils/error-tracker.ts`

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initializeErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new ProfilingIntegration(),
      ],
      tracesSampleRate: 0.1, // 10% of requests
      profilesSampleRate: 0.1,

      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.['authorization'];
        }
        return event;
      }
    });
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  logger.error({ error, ...context }, 'Exception captured');

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context
    });
  }
}

export function setUserContext(user: { id: string; email?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email
  });
}
```

**Add Sentry middleware**:

**File**: `packages/app/src/index.ts`

```typescript
import * as Sentry from '@sentry/node';
import { initializeErrorTracking } from '@care-commons/core';

// Initialize before other middleware
initializeErrorTracking();

// Request handler middleware
app.use(Sentry.Handlers.requestHandler());

// ... other middleware

// Error handler middleware (MUST be last)
app.use(Sentry.Handlers.errorHandler());
```

### 4. Add Health Check Endpoints

**File**: `packages/app/src/routes/health.routes.ts`

```typescript
import express from 'express';
import knex from '@care-commons/core/db/knex';
import { CacheService } from '@care-commons/core';

const router = express.Router();

// Simple health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check with dependencies
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    checks: {
      database: 'unknown',
      cache: 'unknown'
    }
  };

  // Check database
  try {
    await knex.raw('SELECT 1');
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis cache
  try {
    const cache = CacheService.getInstance();
    await cache.set('health-check', 'ok', 10);
    await cache.get('health-check');
    health.checks.cache = 'healthy';
  } catch (error) {
    health.checks.cache = 'unhealthy';
    // Cache is optional, don't mark as degraded
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness check (for Kubernetes)
router.get('/health/ready', async (req, res) => {
  try {
    await knex.raw('SELECT 1');
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Liveness check (for Kubernetes)
router.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true });
});

export default router;
```

### 5. Add Application Metrics

**Install metrics library**:
```bash
npm install prom-client
```

**File**: `packages/core/src/utils/metrics.ts`

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// HTTP request metrics
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10],
  registers: [register]
});

// Database query metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1],
  registers: [register]
});

// Business metrics
export const visitsCreated = new Counter({
  name: 'visits_created_total',
  help: 'Total number of visits created',
  labelNames: ['status'],
  registers: [register]
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register]
});

// Sync metrics
export const syncSuccess = new Counter({
  name: 'mobile_sync_success_total',
  help: 'Total number of successful mobile syncs',
  registers: [register]
});

export const syncFailure = new Counter({
  name: 'mobile_sync_failure_total',
  help: 'Total number of failed mobile syncs',
  registers: [register]
});
```

**Add metrics middleware**:

**File**: `packages/core/src/middleware/metrics.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { httpRequestCounter, httpRequestDuration } from '../utils/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode
      },
      duration
    );
  });

  next();
}
```

**Expose metrics endpoint**:

**File**: `packages/app/src/routes/metrics.routes.ts`

```typescript
import express from 'express';
import { register } from '@care-commons/core/utils/metrics';

const router = express.Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
```

### 6. Add Performance Monitoring

**File**: `packages/core/src/utils/performance.ts`

```typescript
import { performance } from 'perf_hooks';
import logger from './logger';

export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string) {
    this.timers.set(label, performance.now());
  }

  static end(label: string, context?: Record<string, any>) {
    const start = this.timers.get(label);
    if (!start) {
      logger.warn({ label }, 'Performance timer not found');
      return;
    }

    const duration = performance.now() - start;
    this.timers.delete(label);

    logger.info({
      label,
      duration: `${duration.toFixed(2)}ms`,
      ...context
    }, 'Performance measurement');

    // Alert on slow operations
    if (duration > 1000) {
      logger.warn({
        label,
        duration: `${duration.toFixed(2)}ms`,
        ...context
      }, 'Slow operation detected');
    }

    return duration;
  }

  static async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label, context);
    }
  }
}

// Usage:
// await PerformanceMonitor.measure('createVisit', async () => {
//   return visitService.create(data);
// }, { clientId: data.clientId });
```

### 7. Configure Log Aggregation

**For production, send logs to centralized logging**:

Options:
1. **Datadog**: Full observability platform
2. **New Relic**: APM and logging
3. **CloudWatch**: AWS native
4. **Logtail**: Lightweight log aggregation

**Example with Logtail**:

```bash
npm install @logtail/node @logtail/pino
```

```typescript
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/pino';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

const logger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: '@logtail/pino',
        options: { logtail }
      }
    ]
  }
});
```

### 8. Add Alerting

**File**: `packages/core/src/utils/alerting.ts`

```typescript
export class Alerting {
  static async sendAlert(alert: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    context?: Record<string, any>;
  }) {
    logger.warn(alert, 'Alert triggered');

    // Send to Slack, PagerDuty, email, etc.
    if (alert.severity === 'critical') {
      await this.sendToSlack(alert);
      await this.sendToPagerDuty(alert);
    } else if (alert.severity === 'high') {
      await this.sendToSlack(alert);
    }
  }

  private static async sendToSlack(alert: any) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${alert.title}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.title}*\n${alert.message}`
            }
          }
        ]
      })
    });
  }

  private static async sendToPagerDuty(alert: any) {
    // Implement PagerDuty integration
  }
}
```

## Acceptance Criteria

- [ ] Structured logging with Pino implemented
- [ ] Request logging middleware working
- [ ] Error tracking with Sentry integrated
- [ ] Health check endpoints functional
- [ ] Application metrics exposed (Prometheus format)
- [ ] Performance monitoring implemented
- [ ] Log aggregation configured
- [ ] Alerting system functional
- [ ] Logs include request IDs for tracing
- [ ] No sensitive data in logs (passwords, tokens, SSN)
- [ ] Metrics dashboard created (Grafana or similar)

## Metrics to Monitor

**Application Metrics**:
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Active users

**Database Metrics**:
- Query duration
- Connection pool usage
- Slow queries (>500ms)

**Business Metrics**:
- Visits created/completed per day
- EVV compliance rate
- Caregiver utilization rate
- Client satisfaction scores

**Mobile Metrics**:
- Sync success rate
- Sync duration
- Offline queue size
- App crashes

## Reference

- Pino logging: https://getpino.io/
- Sentry: https://sentry.io/
- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
