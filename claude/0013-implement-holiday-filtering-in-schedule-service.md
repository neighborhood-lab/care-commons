# Task 0013: Implement Holiday Filtering in Schedule Service

## Status
- [ ] To Do
- [x] In Progress
- [ ] Completed

## Priority
High

## Description
The schedule service has a TODO for filtering holidays when generating recurring visit dates. Currently `skipHolidays` parameter is accepted but not implemented, which means visits get scheduled on holidays (federal, state, or organization-specific). Implement holiday calendar checking and filtering.

## Acceptance Criteria
- [ ] Remove TODO comment and implement holiday filtering
- [ ] Create holiday calendar service/data structure
- [ ] Support federal holidays
- [ ] Support state-specific holidays
- [ ] Support organization-defined holidays
- [ ] Filter dates that fall on holidays when `skipHolidays=true`
- [ ] Add unit tests for holiday filtering logic
- [ ] Handle edge cases (weekend holidays, observed dates)

## Technical Notes
**File**: `verticals/scheduling-visits/src/service/schedule-service.ts:633`

**Current Code**:
```typescript
// TODO: Filter holidays if skipHolidays is true
// Would need holiday calendar service
```

**Context**: The `generateRecurringDates()` method generates visit dates based on recurrence rules, but doesn't respect holidays.

**Implementation Approach**:
1. Create holiday calendar types and data
2. Add federal holiday list (MLK Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, Christmas, etc.)
3. Add state-specific holiday support (e.g., Texas state holidays)
4. Add organization-level holiday configuration
5. Filter generated dates against holiday calendar when `skipHolidays=true`

**Holiday Sources**:
- Federal holidays: 10 official US federal holidays
- State holidays: Vary by state (e.g., Texas Independence Day, Juneteenth)
- Organization holidays: Configurable per agency

## Related Tasks
- Depends on: None (self-contained feature)
- Improves: Scheduling accuracy
- Enables: Compliant scheduling that respects holidays

## Completion Checklist
- [ ] Design holiday calendar data structure
- [ ] Implement federal holiday calculator
- [ ] Add state holiday support
- [ ] Implement holiday filtering logic
- [ ] Write unit tests
- [ ] Lint passing
- [ ] Type check passing  
- [ ] PR created, checks passing
- [ ] PR merged to develop

## Notes
This is a moderate-complexity task requiring calendar logic and configuration. Federal holidays follow specific rules (e.g., "last Monday in May" for Memorial Day).

Consider using a library like `date-fns` or implementing from scratch for full control.

