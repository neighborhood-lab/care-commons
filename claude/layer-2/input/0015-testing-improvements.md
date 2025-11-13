# Task 0015: Test Coverage Improvements

## Status
[x] In Progress

## Priority
Medium

## Description
Increase test coverage for critical paths to ensure production stability. Current coverage gaps exist in API endpoints, mobile hooks, and edge cases.

## Acceptance Criteria
- [ ] Test coverage > 80% overall
- [ ] Test coverage > 90% on critical paths (auth, visits, EVV)
- [ ] Unit tests for all API endpoints
- [ ] Unit tests for all custom React hooks
- [ ] Integration tests for visit check-in/out flow
- [ ] E2E tests for coordinator scheduling workflow
- [ ] E2E tests for caregiver mobile app flow
- [ ] All tests deterministic (no flaky tests)
- [ ] CI runs all tests on every PR
- [ ] Coverage report in PR comments

## Technical Notes
- Use Vitest for unit/integration tests
- Use Playwright for E2E tests
- Mock external services (time, GPS, network)
- Use fixed timestamps for deterministic tests
- Add coverage badges to README
- Set up Istanbul for coverage reporting

## Related Tasks
- Required for: Production confidence
- Prevents: Regressions
