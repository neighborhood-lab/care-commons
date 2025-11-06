# Task 0001: Fix Scheduling Service Placeholder Addresses

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 2-3 hours

## Context

The scheduling service in `verticals/scheduling-visits/src/services/schedule.service.ts` (lines 566-576) contains a `getClientAddress()` method that returns hardcoded placeholder data instead of querying real client addresses.

## Problem

```typescript
// Current placeholder implementation (lines 566-576)
private async getClientAddress(clientId: string): Promise<Address> {
  return {
    street: '123 Main St',
    city: 'Anytown',
    state: 'TX',
    // ... hardcoded address
  };
}
```

This breaks:
- GPS-based caregiver-to-client matching
- EVV geofencing validation
- Route optimization for coordinators
- Travel time calculations

## Task

1. **Integrate with client-demographics vertical**:
   - Import and use client demographics service
   - Query client addresses from `client_addresses` table
   - Handle primary address selection logic
   - Handle cases where client has no address

2. **Update address selection logic**:
   - Use primary address if available
   - Fall back to service address if different
   - Return proper error if no address found

3. **Add caching**:
   - Cache frequently accessed client addresses
   - Invalidate cache on address updates
   - Consider using Redis for production (document as future improvement)

4. **Update tests**:
   - Mock client demographics service
   - Test primary address selection
   - Test fallback logic
   - Test error handling

## Acceptance Criteria

- [ ] Placeholder address code removed
- [ ] Real client address queries implemented
- [ ] Proper address selection logic (primary → service → error)
- [ ] Error handling for missing addresses
- [ ] Caching implemented (in-memory for now)
- [ ] All tests pass with updated mocks
- [ ] Scheduling works end-to-end with real addresses

## Files to Modify

- `verticals/scheduling-visits/src/services/schedule.service.ts` (lines 566-576)
- `verticals/scheduling-visits/src/services/__tests__/schedule.service.test.ts`

## Dependencies

- Client demographics service: `verticals/client-demographics/src/services/client.service.ts`
- Address types: `packages/core/src/types/address.ts`

## Notes

Document the caching strategy in the vertical's README for future optimization with Redis/Memcached.
