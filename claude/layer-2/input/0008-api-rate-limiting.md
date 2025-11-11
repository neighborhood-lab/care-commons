# Task 0008: API Rate Limiting Middleware

## Status
[ ] To Do

## Priority
High

## Description
Protect API endpoints from abuse and ensure fair usage across users. Rate limiting is essential for production deployment and prevents DoS attacks.

## Acceptance Criteria
- [ ] Rate limiting middleware implemented
- [ ] Per-user limits: 100 requests/minute for authenticated users
- [ ] Per-IP limits: 20 requests/minute for unauthenticated
- [ ] Different limits for different endpoint groups (stricter for mutations)
- [ ] Returns 429 Too Many Requests with Retry-After header
- [ ] Logs rate limit violations
- [ ] Whitelist for internal services
- [ ] Uses Redis for distributed rate limiting
- [ ] Configurable via environment variables

## Technical Notes
- Use express-rate-limit or similar
- Store rate limit state in Redis (not memory)
- Group endpoints: public (strictest), read (normal), write (moderate)
- Consider burst allowance for mobile sync
- Add Retry-After header for client backoff

## Related Tasks
- Required for: Production deployment
- Protects: All API endpoints
