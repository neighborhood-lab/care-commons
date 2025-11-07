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
