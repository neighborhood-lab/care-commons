# Task 0004: Implement State-Specific EVV Validation

## Status
- [ ] To Do
- [ ] In Progress
- [x] Completed

## Priority
High

## Description
Integrate state-specific EVV validation into the visit check-in/out workflow using the StateComplianceService. This ensures visits comply with each state's geofencing rules, grace periods, and correction procedures.

## Acceptance Criteria
- [x] Geofencing validation applies state-specific radius and GPS tolerance
- [x] Grace period validation uses state-specific early/late allowances
- [x] Visit correction workflow enforces state-specific rules
- [x] Aggregator-specific data included in visit records
- [x] Tests for TX (strict), FL (moderate), MT (rural flexible)
- [x] Error messages include state-specific regulatory context

## Technical Notes
**Files to modify**:
- `verticals/time-tracking-evv/src/service/evv-service.ts`
- `verticals/time-tracking-evv/src/validation/visit-validator.ts`

**Integration points**:
- Use `StateComplianceService.validateEVVForState()`
- Use `StateComplianceService.getGeofenceRadius()`

**Test scenarios**:
- TX: 100m radius, 10min grace, requires VMUR for corrections
- FL: 150m radius, 10min grace, allows manual overrides
- MT: 200m radius, 15min grace, caregiver can self-correct

## Related Tasks
- Depends on: #0003 (State Compliance Service)
- Related to: #0000 (state config data)

## Completion Checklist
- [x] Code implemented
- [x] Unit tests written and passing (12 new tests)
- [x] Integration tests added
- [x] E2E tests for visit workflows
- [x] Type check passes
- [x] Lint passes
- [x] Manual testing in dev environment
- [x] PR created, checks passing (#276)
- [x] PR merged to develop
- [x] Post-merge checks passing

## Completion Date
2025-11-12

## Notes
This directly impacts caregivers in the field - must work flawlessly.

**Completed via PR #276** - Integrated state-specific EVV validation for TX, FL, and MT with comprehensive test coverage.

