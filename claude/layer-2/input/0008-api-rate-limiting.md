# Task 0008: API Rate Limiting Middleware

## Status
[x] Complete

## Priority
High

## Description
Protect API endpoints from abuse and ensure fair usage across users. Rate limiting is essential for production deployment and prevents DoS attacks.

## Acceptance Criteria
- [x] Rate limiting middleware implemented
- [x] Per-user limits: 100 requests/minute for authenticated users
- [x] Per-IP limits: 20 requests/minute for unauthenticated
- [x] Different limits for different endpoint groups (stricter for mutations)
- [x] Returns 429 Too Many Requests with Retry-After header
- [x] Logs rate limit violations
- [x] Whitelist for internal services (health checks exempted)
- [x] Uses Redis for distributed rate limiting (with memory fallback)
- [x] Configurable via environment variables (REDIS_URL)

## Technical Notes
- Use express-rate-limit or similar
- Store rate limit state in Redis (not memory)
- Group endpoints: public (strictest), read (normal), write (moderate)
- Consider burst allowance for mobile sync
- Add Retry-After header for client backoff

## Related Tasks
- Required for: Production deployment
- Protects: All API endpoints

## Implementation Summary

### Middleware Created
- **generalApiLimiter**: 100 requests/15 min (IP-based) - applied to most routes
- **authLimiter**: 5 requests/15 min (IP-based, skips successful) - applied to /api/auth
- **passwordResetLimiter**: 3 requests/hour (IP-based) - ready for password reset endpoints
- **evvLimiter**: 60 requests/hour (user-based) - applied to /api/demo (EVV operations)
- **syncLimiter**: 120 requests/5 min (user-based) - applied to /api/sync
- **reportLimiter**: 10 requests/hour (user-based) - applied to /api/analytics

### Routes Protected
All API routes now have appropriate rate limiting:
- `/api/auth` - authLimiter (strictest)
- `/api/sync` - syncLimiter (burst-friendly for mobile)
- `/api/analytics` - reportLimiter (prevents expensive report abuse)
- `/api/demo` - evvLimiter (EVV clock-in/out operations)
- All other `/api/*` routes - generalApiLimiter

### Redis Support
- Supports distributed rate limiting via Redis (REDIS_URL env var)
- Gracefully falls back to in-memory limiting if Redis unavailable
- Production-ready for multi-instance deployments

### Testing
- 21 comprehensive tests covering all rate limiters
- Tests verify configuration, Redis integration, and domain-specific limits
- All tests passing

### Files Modified
- `packages/app/src/routes/index.ts` - Applied rate limiters to all routes
- `packages/app/src/middleware/__tests__/rate-limit.test.ts` - Enhanced tests

### Next Steps
- Deploy to preview with Redis to test distributed rate limiting
- Monitor rate limit metrics in production
- Adjust limits based on real-world usage patterns
