# Task 0000: Fix EVV Service Mocked Data Integration

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 3-4 hours

## Context

The EVV service in `packages/app/src/services/evv-service.ts` (lines 60-92) currently returns mocked/hardcoded data for client and caregiver information instead of using real provider lookups. This prevents the EVV system from functioning in production.

## Problem

```typescript
// Current mocked implementation (lines 60-92)
const mockClient = {
  id: 'client-123',
  firstName: 'John',
  lastName: 'Doe',
  // ... hardcoded data
};
```

This means EVV visits are being validated against fake data instead of real client/caregiver records from the database.

## Task

1. **Wire up provider interfaces**:
   - Use `IClientProvider` from `verticals/client-demographics`
   - Use `ICaregiverProvider` from `verticals/caregiver-staff`
   - Remove all mocked data (lines 60-92)

2. **Implement real data lookups**:
   - Query actual client demographics for visit validation
   - Query actual caregiver credentials for compliance checks
   - Handle cases where client/caregiver not found (proper error handling)

3. **Update tests**:
   - Modify existing EVV service tests to use provider mocks
   - Add integration tests with real database queries
   - Ensure 70%+ coverage maintained

4. **Verify integration**:
   - Test EVV visit creation with real client/caregiver IDs
   - Test GPS validation with real client addresses
   - Test compliance checks with real caregiver credentials

## Acceptance Criteria

- [ ] All mocked data removed from `evv-service.ts`
- [ ] Provider interfaces properly injected and used
- [ ] Real database queries return correct client/caregiver data
- [ ] Error handling for missing records
- [ ] All existing tests pass
- [ ] New integration tests added
- [ ] EVV visits work end-to-end with real data in local dev environment

## Files to Modify

- `packages/app/src/services/evv-service.ts`
- `packages/app/src/services/__tests__/evv-service.test.ts` (if exists)
- `verticals/time-tracking-evv/src/services/evv.service.ts` (may need updates)

## Reference

- Provider interfaces: `packages/core/src/providers/`
- Client demographics service: `verticals/client-demographics/src/services/`
- Caregiver staff service: `verticals/caregiver-staff/src/services/`
