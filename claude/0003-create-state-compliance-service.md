# Task 0003: Create State Compliance Service

## Status
- [ ] To Do
- [ ] In Progress
- [x] Completed

## Priority
Medium

## Description
Create a `StateComplianceService` that provides business logic methods for using the state compliance configuration data. This service will be used by EVV and scheduling verticals to validate state-specific rules.

## Acceptance Criteria
- [ ] `StateComplianceService` class created in `packages/core/src/compliance/`
- [ ] Methods: `validateEVVForState()`, `getGeofenceRadius()`, `checkBackgroundScreeningValid()`, `getPlanOfCareReviewDue()`
- [ ] Full test coverage (>90%)
- [ ] Exported from core package
- [ ] Documentation with usage examples

## Technical Notes
**Implementation approach**:
```typescript
export class StateComplianceService {
  validateEVVForState(stateCode: StateCode, visitData: VisitData): ValidationResult
  getGeofenceRadius(stateCode: StateCode): number
  checkBackgroundScreeningValid(stateCode: StateCode, caregiver: Caregiver): boolean
  getPlanOfCareReviewDue(stateCode: StateCode, clientType: ClientType): Date
}
```

Uses `ALL_STATES_CONFIG` from task #0000 (completed).

## Related Tasks
- Depends on: #0000 (completed - state config exists)
- Blocks: #0004 (EVV validation)
- Blocks: #0005 (scheduling compliance)

## Completion Checklist
- [x] Code implemented
- [x] Unit tests written and passing (>90% coverage)
- [x] Integration tests added
- [x] Type check passes
- [x] Lint passes
- [x] Documentation updated
- [x] PR created, checks passing
- [x] PR merged to develop
- [x] Post-merge checks passing

## Notes
**Completed**: 2025-11-12

This is a foundational service that enables state-specific compliance validation throughout the application.

**Implementation Summary**:
- Created `StateComplianceService` class with comprehensive methods for:
  - EVV validation (geofencing, grace periods, clock-in/out timing)
  - Background screening validation and rescreening calculations
  - Caregiver credentialing checks
  - Plan of care review due dates
  - RN supervision visit schedules
  - Visit correction workflow validation
- 44 comprehensive unit tests covering all methods and edge cases
- Tests validate TX (strict), FL (moderate), MT (rural/flexible) compliance scenarios
- All date calculations use UTC to avoid timezone-related issues
- Full documentation with JSDoc examples
- Exported from `@care-commons/core` for use across all verticals
