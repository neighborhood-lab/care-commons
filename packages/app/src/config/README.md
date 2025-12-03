# Redis / Upstash Configuration

## Overview

Folk Care uses **Upstash Redis** for distributed rate limiting and caching in production. Upstash is a serverless Redis service optimized for edge and serverless environments like Vercel.

## Why Upstash?

- **Serverless-optimized**: REST API works perfectly in Vercel serverless functions
- **Global replication**: Low latency worldwide
- **Pay-per-request**: No idle costs
- **Free tier**: 10K commands/day, perfect for development

## Configuration Files

### `/config/upstash.ts`
- Upstash Redis REST API client
- Cache helper functions
- Rate limiter utilities using `@upstash/ratelimit`

### `/config/redis.ts`
- Traditional Redis client (local development)
- Maintained for backward compatibility

### `/middleware/rate-limit.ts`
- Express rate limiting middleware
- Uses `express-rate-limit` + `rate-limit-redis`
- Automatically uses Upstash when configured
- Falls back to in-memory store for local development

## Environment Variables

### Required for Production (Vercel)

```bash
# Upstash Redis REST API (recommended for serverless)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Traditional Redis connection (for rate limiting middleware)
REDIS_URL=redis://default:password@your-db.upstash.io:6379
```

### Local Development

Create `.env` file in project root with the same variables. Note: Upstash may have connection issues locally (serverless-optimized), but the in-memory fallback works fine for development.

## Usage

### Caching

```typescript
import { cacheService } from '../services/cache.service.js';

// Cache analytics results (5 min TTL)
await cacheService.cacheAnalytics(orgId, 'visits', '30d', data);
const cached = await cacheService.getAnalytics(orgId, 'visits', '30d');

// Cache reports (1 hour TTL)
await cacheService.cacheReport(orgId, 'billing', { month: '2025-01' }, data);
const report = await cacheService.getReport(orgId, 'billing', { month: '2025-01' });

// Cache aggregates (10 min TTL)
await cacheService.cacheAggregate('visits', 'count', { status: 'completed' }, count);
const agg = await cacheService.getAggregate('visits', 'count', { status: 'completed' });

// Custom caching
await cacheService.cache('my-key', myData, 600); // 10 minutes
const data = await cacheService.get('my-key');
```

### Rate Limiting

Rate limiting is automatic via middleware. Current limits:

- **General API**: 5000 requests / 15 min (authenticated), 200 / 15 min (unauthenticated)
- **Auth endpoints**: 50 failed attempts / 5 min
- **Password reset**: 3 requests / hour
- **EVV endpoints**: 200 requests / hour per user
- **Mobile sync**: 120 requests / 5 min per user
- **Reports**: 100 requests / hour per user

Middleware applied in `/routes/index.ts`.

### Health Check

The `/health` endpoint now includes Redis status:

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": {
    "upstash": "healthy",
    "rateLimit": "connected"
  },
  "uptime": 12345,
  "environment": "production"
}
```

## Setup Instructions

### 1. Create Upstash Database

```bash
# Login to Upstash
upstash auth login

# Create database
upstash redis create folk-care-production --region us-east-1

# Get credentials (automatically shown after creation)
```

### 2. Add to Vercel

```bash
# Add environment variables
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add REDIS_URL production

# Repeat for preview environment
vercel env add UPSTASH_REDIS_REST_URL preview
# ... etc
```

### 3. Local Development

Add to `.env` file in project root:

```bash
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
REDIS_URL=redis://default:password@your-db.upstash.io:6379
```

## Troubleshooting

### Local Connection Issues

**Symptom**: "Socket closed unexpectedly" errors locally

**Cause**: Upstash is optimized for serverless environments and may not work reliably with persistent connections locally.

**Solution**: This is expected. The middleware automatically falls back to in-memory rate limiting for local development. Production (Vercel) will work perfectly.

### Rate Limit Not Persisting

**Symptom**: Rate limits reset on every deployment

**Cause**: Using in-memory fallback instead of Redis

**Solution**: Verify `REDIS_URL` is set in Vercel environment variables

### Cache Not Working

**Symptom**: Cache always returns null

**Cause**: Upstash REST credentials not configured

**Solution**: Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set

## Architecture Notes

We use TWO Redis clients:

1. **Traditional Redis client** (`redis` package) for `express-rate-limit` compatibility
   - Used by rate limiting middleware
   - Connects to Upstash via traditional Redis protocol
   - May have issues locally (serverless optimized)

2. **Upstash REST client** (`@upstash/redis` package) for caching
   - Used by cache service
   - Uses HTTP REST API (perfect for serverless)
   - Works everywhere (local + production)

This hybrid approach gives us the best of both worlds: battle-tested `express-rate-limit` for rate limiting, and serverless-optimized Upstash for caching.

## References

- [Upstash Documentation](https://docs.upstash.com/redis)
- [Upstash Ratelimit](https://github.com/upstash/ratelimit)
- [express-rate-limit](https://express-rate-limit.github.io/)
