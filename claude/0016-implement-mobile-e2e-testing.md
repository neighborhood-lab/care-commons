# Task 0016: Implement Mobile E2E Testing for Critical Caregiver Workflows

## Metadata
- **Status**: To Do
- **Priority**: High
- **Created**: 2025-11-12
- **Rationale**: Production Readiness

## Problem Statement

The mobile application is the primary interface for field caregivers performing critical functions:
- Clocking in/out of visits (EVV compliance)
- Documenting care activities
- Completing tasks
- Recording visit notes

Without comprehensive end-to-end (E2E) tests, we cannot confidently:
- Deploy to production without regression risk
- Refactor code safely
- Validate that offline-first architecture works correctly
- Ensure state-specific EVV requirements are met

## Regulatory Context

**21st Century Cures Act - EVV Requirements**:
- Electronic Visit Verification systems must reliably capture the six required elements
- State agencies require 99.9% accuracy in EVV data submission
- E2E testing validates the complete flow from caregiver action to backend storage to aggregator submission

**HIPAA Security Rule** (§164.312(b) - Audit Controls):
- Systems must undergo regular testing to ensure controls function as designed
- E2E tests serve as evidence of due diligence in security testing

## Acceptance Criteria

### Core E2E Test Suites

**1. Visit Check-In/Check-Out Flow** (CRITICAL)
- [ ] Test complete happy path: login → view schedule → check in → perform tasks → check out
- [ ] Verify EVV six elements captured: service type, individual receiving, individual providing, date, location, time
- [ ] Test geofence validation (within vs. outside permitted radius)
- [ ] Test GPS accuracy handling (Texas 100m, Florida 150m)
- [ ] Test offline check-in with background sync when reconnected
- [ ] Test failed check-in scenarios (GPS disabled, outside geofence, duplicate check-in)

**2. Offline-First Architecture** (CRITICAL)
- [ ] Test complete workflow while offline: check in → complete tasks → add notes → check out
- [ ] Verify data persisted to WatermelonDB
- [ ] Verify sync queue populated correctly
- [ ] Test automatic sync on network reconnection
- [ ] Test manual sync trigger
- [ ] Test conflict resolution (server changes during offline period)

**3. Authentication & Security**
- [ ] Test login with valid credentials
- [ ] Test biometric re-authentication (if enrolled)
- [ ] Test session expiration and re-authentication
- [ ] Test logout clears sensitive data
- [ ] Test auto-lock after inactivity

**4. Visit Documentation**
- [ ] Test adding visit notes
- [ ] Test completing tasks in a visit
- [ ] Test uploading photos (if applicable)
- [ ] Test signature capture
- [ ] Test data persistence and sync

**5. Schedule Management**
- [ ] Test viewing today's visits
- [ ] Test viewing week schedule
- [ ] Test filtering by status (upcoming, in-progress, completed)
- [ ] Test refreshing schedule (pull-to-refresh)

### Test Infrastructure

- [ ] Set up Detox or Maestro for React Native E2E testing
- [ ] Configure iOS and Android test environments
- [ ] Create test fixtures for realistic caregiver data
- [ ] Implement test database seeding (clients, visits, tasks)
- [ ] Mock GPS location services for geofence testing
- [ ] Mock network conditions (online, offline, slow)
- [ ] Create CI/CD integration for automated E2E tests

### Test Quality Standards

- [ ] All tests must be deterministic (no flaky tests)
- [ ] Tests run in isolated environments (clean database per test)
- [ ] Tests use fixed timestamps (not `new Date()`)
- [ ] Tests clean up after themselves (no pollution)
- [ ] Tests have meaningful assertions (not just "doesn't crash")
- [ ] Test failures provide clear error messages
- [ ] Tests complete in reasonable time (< 5 minutes full suite)

## Technical Approach

### 1. Choose E2E Testing Framework

**Options**:
- **Detox** (Wix) - Industry standard for React Native, fast, reliable
- **Maestro** (Mobile.dev) - Simpler YAML-based, good for BDD-style tests
- **Appium** - Cross-platform but slower, more complex setup

**Recommendation**: Start with **Detox** for comprehensive coverage, add **Maestro** for simple smoke tests if time allows.

### 2. Test Environment Setup

```typescript
// packages/mobile/e2e/setup/test-environment.ts
- Configure test database (separate from dev)
- Seed realistic test data (caregivers, clients, visits, tasks)
- Mock location services with controllable coordinates
- Mock network status (online/offline toggle)
- Configure authentication bypass for testing
```

### 3. Test Structure

```
packages/mobile/e2e/
├── tests/
│   ├── 01-authentication.e2e.ts
│   ├── 02-schedule-viewing.e2e.ts
│   ├── 03-visit-check-in-out.e2e.ts (CRITICAL)
│   ├── 04-offline-workflow.e2e.ts (CRITICAL)
│   ├── 05-visit-documentation.e2e.ts
│   ├── 06-sync-status.e2e.ts
│   └── 07-profile-settings.e2e.ts
├── fixtures/
│   ├── caregivers.json
│   ├── clients.json
│   ├── visits.json
│   └── tasks.json
├── helpers/
│   ├── location-mock.ts
│   ├── network-mock.ts
│   └── assertions.ts
└── setup/
    ├── test-environment.ts
    └── global-setup.ts
```

### 4. Example Critical Test

```typescript
describe('Visit Check-In/Out - EVV Compliance (Texas)', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await seedTestData('texas-visit');
    await mockLocation({ lat: 30.2672, lng: -97.7431 }); // Austin, TX
  });

  it('should complete full check-in/out with EVV six elements', async () => {
    // Login
    await element(by.id('email-input')).typeText('maria@example.com');
    await element(by.id('password-input')).typeText('TestPass123!');
    await element(by.id('login-button')).tap();

    // Navigate to today's visits
    await element(by.id('schedule-tab')).tap();
    await waitFor(element(by.id('visit-list'))).toBeVisible();

    // Select first visit
    await element(by.id('visit-item-0')).tap();

    // Check in
    await element(by.id('check-in-button')).tap();
    
    // Verify check-in success
    await expect(element(by.id('check-in-time'))).toBeVisible();
    await expect(element(by.id('location-verified-badge'))).toBeVisible();

    // Complete a task
    await element(by.id('tasks-tab')).tap();
    await element(by.id('task-0-checkbox')).tap();

    // Add visit notes
    await element(by.id('notes-tab')).tap();
    await element(by.id('notes-input')).typeText('Client in good spirits. Assisted with meal preparation.');
    await element(by.id('save-notes-button')).tap();

    // Check out
    await element(by.id('check-out-button')).tap();

    // Verify EVV record created
    const evvRecord = await getEVVRecord();
    expect(evvRecord).toMatchObject({
      service_type: expect.any(String),
      individual_receiving: expect.any(String),
      individual_providing: 'maria@example.com',
      date: expect.any(String),
      location: expect.objectContaining({
        latitude: expect.closeTo(30.2672, 0.001),
        longitude: expect.closeTo(-97.7431, 0.001),
      }),
      time_in: expect.any(String),
      time_out: expect.any(String),
    });

    // Verify sync queue contains EVV submission
    const syncQueue = await getSyncQueue();
    expect(syncQueue).toContainEqual(
      expect.objectContaining({ type: 'visit-check-out' })
    );
  });

  it('should reject check-in outside geofence (Texas 100m)', async () => {
    await mockLocation({ lat: 30.3000, lng: -97.8000 }); // Far from client

    await element(by.id('check-in-button')).tap();

    await expect(element(by.text(/outside.*geofence/i))).toBeVisible();
    await expect(element(by.id('check-in-time'))).not.toExist();
  });
});
```

### 5. State-Specific Test Variations

Create separate test suites for each state's EVV requirements:

**Texas Tests**:
- 100m + GPS accuracy geofence
- HHAeXchange aggregator submission
- VMUR (manual correction) workflow

**Florida Tests**:
- 150m + GPS accuracy geofence
- Multi-aggregator support
- Plan of care compliance checks

## State-Specific Considerations

**Texas (HHSC)**:
- EVV tests must validate geofence calculation: `100m + gps_accuracy`
- Test VMUR (Visit Maintenance Unlock Request) flow for manual corrections
- Test HHAeXchange submission format

**Florida (AHCA)**:
- EVV tests must validate geofence calculation: `150m + gps_accuracy`
- Test multi-aggregator routing
- Test real-time submission preference

**Universal**:
- All states require testing the six EVV elements
- Test offline resilience (caregivers work in rural areas)
- Test battery/performance impact of continuous GPS tracking

## Files to Create

**New Files**:
- `packages/mobile/e2e/tests/01-authentication.e2e.ts`
- `packages/mobile/e2e/tests/02-schedule-viewing.e2e.ts`
- `packages/mobile/e2e/tests/03-visit-check-in-out.e2e.ts` **(CRITICAL)**
- `packages/mobile/e2e/tests/04-offline-workflow.e2e.ts` **(CRITICAL)**
- `packages/mobile/e2e/tests/05-visit-documentation.e2e.ts`
- `packages/mobile/e2e/tests/06-sync-status.e2e.ts`
- `packages/mobile/e2e/tests/07-profile-settings.e2e.ts`
- `packages/mobile/e2e/fixtures/caregivers.json`
- `packages/mobile/e2e/fixtures/clients.json`
- `packages/mobile/e2e/fixtures/visits.json`
- `packages/mobile/e2e/fixtures/tasks.json`
- `packages/mobile/e2e/helpers/location-mock.ts`
- `packages/mobile/e2e/helpers/network-mock.ts`
- `packages/mobile/e2e/helpers/assertions.ts`
- `packages/mobile/e2e/setup/test-environment.ts`
- `packages/mobile/e2e/setup/global-setup.ts`
- `packages/mobile/.detoxrc.js` (Detox configuration)

**Modified Files**:
- `packages/mobile/package.json` (add Detox dependencies and scripts)
- `.github/workflows/mobile-e2e.yml` (CI/CD integration)

## Success Criteria

1. **Functional**: All critical user flows have E2E test coverage
2. **Reliable**: Tests run deterministically in CI/CD (no flaky tests)
3. **Fast**: Full E2E suite completes in < 5 minutes
4. **Comprehensive**: EVV compliance scenarios covered for TX and FL
5. **CI Integration**: E2E tests block merges if failing
6. **Documentation**: Clear instructions for running tests locally

## Out of Scope

- Performance testing (load, stress) - Future task
- Accessibility testing (screen readers) - Future task
- Android-specific tests (iOS only for MVP) - Add Android in follow-up
- Multi-language testing - Future task
- Advanced edge cases (all possible error scenarios) - Cover critical paths only

## Implementation Notes

- **Start with iOS** (most caregivers use iPhone), add Android later
- **Focus on critical paths** first: check-in/out, offline workflow
- **Use realistic data** in fixtures (actual client addresses in TX/FL)
- **Mock external dependencies** (GPS, network, aggregator APIs)
- **Fail fast** - Tests should fail immediately with clear error messages
- **Keep tests focused** - One scenario per test, no mega-tests

## Related Tasks

- Depends on: Existing mobile app implementation (completed)
- Blocks: Production deployment with confidence
- Enables: Safe refactoring and feature additions
- Related to: Testing improvements (layer-2 task 0015)

## Definition of Done

- [ ] Detox configured for iOS and Android
- [ ] Critical test suites implemented (authentication, check-in/out, offline)
- [ ] State-specific EVV tests passing (Texas, Florida)
- [ ] Test fixtures created with realistic data
- [ ] CI/CD workflow created (`.github/workflows/mobile-e2e.yml`)
- [ ] All E2E tests passing locally and in CI
- [ ] No flaky tests (10 consecutive runs without failures)
- [ ] Documentation added for running tests
- [ ] Code reviewed and approved
- [ ] PR merged to `develop`
- [ ] Task marked as completed

## Estimated Effort

- **Setup (Detox + fixtures)**: 2-3 hours
- **Critical tests (check-in/out, offline)**: 3-4 hours
- **State-specific tests (TX, FL)**: 2-3 hours
- **CI/CD integration**: 1-2 hours
- **Bug fixes and stabilization**: 2-3 hours
- **Total**: ~10-15 hours

## Impact

This task directly supports:
- **Regulatory Compliance**: Validate EVV requirements are met
- **Production Readiness**: Deploy with confidence
- **Code Quality**: Enable safe refactoring
- **User Trust**: Ensure critical workflows function correctly
- **Community Service**: Reliable tools for caregivers serving vulnerable populations
