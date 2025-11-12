# Task 0004: Implement State-Specific EVV Validation

## Status
- [ ] To Do
- [x] In Progress
- [ ] Completed

## Priority
High

## Description
Integrate state-specific EVV validation into the visit check-in/out workflow using the StateComplianceService. This ensures visits comply with each state's geofencing rules, grace periods, and correction procedures.

## Acceptance Criteria
- [ ] Geofencing validation applies state-specific radius and GPS tolerance
- [ ] Grace period validation uses state-specific early/late allowances
- [ ] Visit correction workflow enforces state-specific rules
- [ ] Aggregator-specific data included in visit records
- [ ] Tests for TX (strict), FL (moderate), MT (rural flexible)
- [ ] Error messages include state-specific regulatory context

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
- [ ] Code implemented
- [ ] Unit tests written and passing
- [ ] Integration tests added
- [ ] E2E tests for visit workflows
- [ ] Type check passes
- [ ] Lint passes
- [ ] Manual testing in dev environment
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Notes
This directly impacts caregivers in the field - must work flawlessly.
