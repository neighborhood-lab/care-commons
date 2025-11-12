# Task 0002: Fix Client Demographics API Type Error

## Status
- [x] To Do
- [ ] In Progress
- [ ] Completed

## Priority
High

## Description
Fix TypeScript error in `useClients.ts` where `getClientsDashboard` method does not exist on `ClientApiService` type. This is blocking the web package build.

## Acceptance Criteria
- [ ] `getClientsDashboard` method properly defined or hook updated
- [ ] TypeScript compilation passes with 0 errors
- [ ] Web package builds successfully
- [ ] Client dashboard functionality works correctly

## Technical Notes
**Files affected**:
- `packages/web/src/verticals/client-demographics/hooks/useClients.ts` (line 88)

**Investigation needed**:
1. Check if `getClientsDashboard` should exist on `ClientApiService`
2. If yes, add method definition
3. If no, update hook to use correct method

## Related Tasks
- Blocks: Web package build
- Related to: #0001 (type errors)

## Completion Checklist
- [ ] Code implemented
- [ ] Unit tests written and passing
- [ ] Type check passes (npm run typecheck)
- [ ] Lint passes (npm run lint)
- [ ] Manual testing in browser
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Notes
