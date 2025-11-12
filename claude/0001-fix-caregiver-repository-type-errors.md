# Task 0001: Fix Caregiver Repository Type Errors

## Status
- [x] To Do
- [ ] In Progress
- [ ] Completed

## Priority
High

## Description
Fix 8 TypeScript errors in `caregiver-repository.ts` where the `row` parameter implicitly has `any` type. These errors prevent strict type checking and could lead to runtime issues.

## Acceptance Criteria
- [ ] All `row` parameters have explicit type annotations
- [ ] TypeScript compilation passes with 0 errors
- [ ] Existing tests still pass
- [ ] No regression in functionality

## Technical Notes
**Files affected**:
- `verticals/caregiver-staff/src/repository/caregiver-repository.ts` (lines 406, 431, 447, 472, 491, 519, 609, 728)

**Likely fix**: Add explicit type annotation to row parameters in map functions
```typescript
// Before
.map((row) => ...)

// After  
.map((row: DatabaseRow) => ...)
```

## Related Tasks
- Blocks: Clean TypeScript build
- Related to: #0002 (client demographics type error)

## Completion Checklist
- [ ] Code implemented
- [ ] Unit tests written and passing
- [ ] Type check passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Notes
