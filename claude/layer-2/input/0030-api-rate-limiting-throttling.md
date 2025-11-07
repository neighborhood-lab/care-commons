# Task 0030: API Rate Limiting and Request Throttling

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 6-8 hours

## Context

Production APIs need rate limiting to prevent abuse, DDoS attacks, and resource exhaustion. Without rate limiting, the platform is vulnerable to malicious actors and accidental resource overuse.

## Problem Statement

Currently, all API endpoints are unprotected and can be called unlimited times by any authenticated user. This creates several risks:
- API abuse leading to service degradation
- Database connection pool exhaustion
- Denial of service attacks
- Increased hosting costs from excessive API calls
- Poor user experience for legitimate users during traffic spikes

## Task

### 1. Install Rate Limiting Middleware

```bash
npm install express-rate-limit --save
npm install @types/express-rate-limit --save-dev
npm install rate-limit-redis redis --save  # For distributed rate limiting
```

### 2. Create Rate Limit Configuration

**File**: `packages/app/src/middleware/rate-limit.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

// Redis client for distributed rate limiting (optional, fallback to memory)
const redisClient = process.env.REDIS_URL
  ? Redis.createClient({ url: process.env.REDIS_URL })
  : null;

if (redisClient) {
  redisClient.connect().catch(console.error);
}

// General API rate limit - 100 requests per 15 minutes per IP
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:general:',
      })
    : undefined, // Use memory store if Redis not available
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    retryAfter: 15 * 60, // seconds
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Strict rate limit for authentication endpoints - 5 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/signup requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:auth:',
      })
    : undefined,
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    retryAfter: 15 * 60,
  },
});

// Very strict rate limit for password reset - 3 requests per hour per IP
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:reset:',
      })
    : undefined,
  message: {
    error: 'Too many password reset attempts, please try again after an hour.',
    retryAfter: 60 * 60,
  },
});

// EVV check-in/check-out rate limit - 60 requests per hour per user
// (Caregivers typically have 4-8 visits per day, so 60/hour is generous)
export const evvLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  keyGenerator: (req) => {
    // Use user ID instead of IP for authenticated endpoints
    return req.user?.id || req.ip;
  },
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:evv:',
      })
    : undefined,
  message: {
    error: 'Too many EVV requests, please contact support if you need assistance.',
    retryAfter: 60 * 60,
  },
});

// Mobile sync rate limit - 120 requests per 5 minutes per user
// (Mobile apps may sync frequently when coming back online)
export const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 120,
  keyGenerator: (req) => req.user?.id || req.ip,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:sync:',
      })
    : undefined,
  message: {
    error: 'Sync rate limit exceeded, please wait a few minutes.',
    retryAfter: 5 * 60,
  },
});

// Report generation rate limit - 10 per hour per user
// (Reports can be expensive to generate)
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:reports:',
      })
    : undefined,
  message: {
    error: 'Too many report requests, please try again later.',
    retryAfter: 60 * 60,
  },
});
```

### 3. Apply Rate Limiters to Routes

**File**: `packages/app/src/index.ts`

```typescript
import {
  generalApiLimiter,
  authLimiter,
  passwordResetLimiter,
} from './middleware/rate-limit';

// Apply general rate limiter to all API routes
app.use('/api', generalApiLimiter);

// Apply specific rate limiters to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/refresh', authLimiter);
app.use('/api/auth/password-reset', passwordResetLimiter);
```

**File**: `packages/app/src/routes/evv.routes.ts`

```typescript
import { evvLimiter } from '../middleware/rate-limit';

router.post('/check-in', evvLimiter, authenticate, evvController.checkIn);
router.post('/check-out', evvLimiter, authenticate, evvController.checkOut);
```

**File**: `packages/app/src/routes/sync.routes.ts`

```typescript
import { syncLimiter } from '../middleware/rate-limit';

router.post('/pull', syncLimiter, authenticate, syncController.pullChanges);
router.post('/push', syncLimiter, authenticate, syncController.pushChanges);
```

**File**: `packages/app/src/routes/reports.routes.ts`

```typescript
import { reportLimiter } from '../middleware/rate-limit';

router.get('/analytics/generate', reportLimiter, authenticate, authorize(['admin', 'coordinator']), reportController.generate);
```

### 4. Add Redis Configuration

**File**: `.env.example`

```bash
# Redis Configuration (optional, for distributed rate limiting)
REDIS_URL=redis://localhost:6379
# REDIS_URL=redis://username:password@host:port/db  # For production
```

**File**: `packages/app/src/config/redis.ts`

```typescript
import Redis from 'redis';

let redisClient: Redis.RedisClientType | null = null;

export const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('Redis not configured, using in-memory rate limiting');
    return null;
  }

  try {
    redisClient = Redis.createClient({ url: process.env.REDIS_URL });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
};

export const getRedisClient = () => redisClient;
```

### 5. Add Request Throttling for Expensive Operations

For expensive database operations, add per-user throttling:

**File**: `packages/app/src/middleware/throttle.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

interface ThrottleOptions {
  maxConcurrent: number;
  queueSize: number;
  timeout: number; // milliseconds
}

const userQueues = new Map<string, number>();

export const throttle = (options: ThrottleOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;

    const currentConcurrent = userQueues.get(userId) || 0;

    if (currentConcurrent >= options.maxConcurrent) {
      return res.status(429).json({
        error: 'Too many concurrent requests. Please wait for previous requests to complete.',
      });
    }

    // Increment concurrent request count
    userQueues.set(userId, currentConcurrent + 1);

    // Set timeout
    const timeoutId = setTimeout(() => {
      // Decrement on timeout
      const count = userQueues.get(userId) || 1;
      userQueues.set(userId, Math.max(0, count - 1));
    }, options.timeout);

    // Wrap response to decrement on completion
    const originalSend = res.send;
    res.send = function (data) {
      clearTimeout(timeoutId);
      const count = userQueues.get(userId) || 1;
      userQueues.set(userId, Math.max(0, count - 1));
      return originalSend.call(this, data);
    };

    next();
  };
};
```

**Usage Example**:

```typescript
// Apply to expensive report generation
router.get(
  '/analytics/complex-report',
  authenticate,
  throttle({ maxConcurrent: 2, queueSize: 5, timeout: 30000 }),
  reportController.complexReport
);
```

### 6. Add Rate Limit Headers to Responses

Update `generalApiLimiter` to include helpful headers:

```typescript
handler: (req, res) => {
  res.status(429).json({
    error: 'Too many requests',
    retryAfter: res.getHeader('Retry-After'),
    limit: res.getHeader('X-RateLimit-Limit'),
    remaining: res.getHeader('X-RateLimit-Remaining'),
    reset: res.getHeader('X-RateLimit-Reset'),
  });
},
```

### 7. Monitor Rate Limit Metrics

**File**: `packages/app/src/services/metrics.service.ts`

```typescript
import { getRedisClient } from '../config/redis';

export class MetricsService {
  static async getRateLimitStats() {
    const redis = getRedisClient();
    if (!redis) return null;

    const keys = await redis.keys('rl:*');
    const stats = {
      general: 0,
      auth: 0,
      evv: 0,
      sync: 0,
      reports: 0,
    };

    for (const key of keys) {
      if (key.startsWith('rl:general:')) stats.general++;
      else if (key.startsWith('rl:auth:')) stats.auth++;
      else if (key.startsWith('rl:evv:')) stats.evv++;
      else if (key.startsWith('rl:sync:')) stats.sync++;
      else if (key.startsWith('rl:reports:')) stats.reports++;
    }

    return stats;
  }
}
```

### 8. Add Tests

**File**: `packages/app/src/middleware/__tests__/rate-limit.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../index';

describe('Rate Limiting', () => {
  describe('General API rate limit', () => {
    it('should allow requests under the limit', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app).get('/api/health');
        expect(res.status).not.toBe(429);
      }
    });

    it('should block requests over the limit', async () => {
      // This test may need adjustment based on your limit configuration
      const promises = Array(110).fill(null).map(() =>
        request(app).get('/api/some-endpoint')
      );

      const responses = await Promise.all(promises);
      const blocked = responses.filter(r => r.status === 429);

      expect(blocked.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('Auth rate limit', () => {
    it('should allow 5 login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' });

        expect(res.status).not.toBe(429);
      }
    });

    it('should block 6th login attempt', async () => {
      // Make 6 attempts
      const promises = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
      );

      const responses = await Promise.all(promises);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error).toContain('Too many authentication attempts');
    });
  });
});
```

## Acceptance Criteria

- [ ] Rate limiting middleware installed and configured
- [ ] General API rate limit applied (100 req/15min)
- [ ] Auth endpoints have strict rate limit (5 req/15min)
- [ ] Password reset has very strict rate limit (3 req/hour)
- [ ] EVV endpoints have reasonable rate limit (60 req/hour)
- [ ] Mobile sync endpoints have high rate limit (120 req/5min)
- [ ] Report generation has moderate rate limit (10 req/hour)
- [ ] Redis integration optional but recommended
- [ ] Rate limit headers included in responses
- [ ] Helpful error messages returned
- [ ] Request throttling for expensive operations
- [ ] Health check endpoints excluded from rate limiting
- [ ] Tests written for rate limiting
- [ ] Documentation updated

## Testing Checklist

1. **Unit Tests**: Middleware applies limits correctly
2. **Integration Tests**:
   - Make 100 API calls, verify 101st is blocked
   - Make 6 login attempts, verify 6th is blocked
   - Verify rate limit resets after window expires
3. **Load Test**: Use `autocannon` or `k6` to verify rate limiting under load
4. **Redis Test**: Verify distributed rate limiting works across multiple instances

## Performance Considerations

- Use Redis for distributed rate limiting in production (multiple server instances)
- In-memory store is fine for single-instance deployments
- Rate limit keys expire automatically, no cleanup needed
- Monitor Redis memory usage, add maxmemory policy if needed

## Security Notes

- Rate limiting by IP can be bypassed with proxies/VPNs
- For authenticated endpoints, use user ID as key
- Consider adding CAPTCHA for critical endpoints after rate limit hit
- Log rate limit violations for security monitoring

## Documentation

Update the following docs:
- API documentation with rate limit information
- Deployment guide with Redis setup
- Environment variables guide

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: None

## Priority Justification

This is **CRITICAL** because:
1. Security requirement - prevents API abuse
2. Cost control - prevents excessive resource usage
3. Service stability - prevents accidental DoS
4. Required for production deployment

---

**Next Task**: 0031 - Implement Caching Layer
