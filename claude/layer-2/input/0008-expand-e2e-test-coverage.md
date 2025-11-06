# Task 0008: Expand End-to-End Test Coverage

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 8-10 hours

## Context

The project has ~15 E2E tests with Playwright. Coverage should be expanded to include critical user journeys, edge cases, and multi-user workflows.

## Current Coverage

- ✅ Basic authentication flows
- ✅ Client CRUD operations
- ✅ Caregiver CRUD operations
- ✅ Visit scheduling
- ⚠️ Limited coverage for complex workflows

## Task

### 1. Add Critical User Journey Tests

**File**: `e2e/tests/critical-journeys.spec.ts`

**Scenarios**:
1. **Complete Visit Lifecycle** (coordinator → caregiver → coordinator):
   - Coordinator creates visit
   - Caregiver checks in
   - Caregiver completes tasks
   - Caregiver checks out
   - Coordinator reviews and approves

2. **New Client Onboarding** (admin → coordinator):
   - Admin creates client
   - Admin sets up care plan
   - Coordinator schedules first visit
   - Coordinator assigns caregiver
   - Verify visit appears on caregiver schedule

3. **EVV Compliance Flow** (caregiver → system → coordinator):
   - Caregiver attempts check-in outside geofence (should fail)
   - Caregiver moves to correct location (should succeed)
   - Caregiver completes visit
   - Verify EVV data captured correctly
   - Coordinator views EVV report

### 2. Add Multi-User Workflow Tests

**File**: `e2e/tests/multi-user-workflows.spec.ts`

**Scenarios**:
1. **Concurrent Scheduling** (2 coordinators):
   - Two coordinators schedule overlapping visits
   - System should detect conflict
   - Second coordinator sees conflict warning

2. **Real-Time Updates** (coordinator + caregiver):
   - Caregiver checks in to visit
   - Coordinator sees real-time status update
   - Caregiver completes visit
   - Coordinator sees completion notification

3. **Family Portal Updates** (caregiver + family member):
   - Caregiver completes visit and documents care
   - Family member sees activity in family portal
   - Family member sends message to coordinator
   - Coordinator receives message

### 3. Add Error Handling Tests

**File**: `e2e/tests/error-scenarios.spec.ts`

**Scenarios**:
1. **Network Interruption**:
   - Start creating visit
   - Simulate network loss (offline)
   - Verify unsaved changes warning
   - Restore network
   - Verify data saved correctly

2. **Validation Errors**:
   - Submit form with missing required fields
   - Verify error messages displayed
   - Verify form not submitted
   - Fix errors and resubmit successfully

3. **Permission Errors**:
   - Caregiver attempts to access admin-only page
   - Verify redirect or 403 error
   - Verify no sensitive data leaked

4. **Database Errors**:
   - Simulate database connection failure
   - Verify graceful error message (not technical stack trace)
   - Verify retry logic works

### 4. Add Mobile-Specific Tests

**File**: `e2e/tests/mobile-workflows.spec.ts`

**Use Playwright mobile viewport emulation**:
1. **Mobile Visit Check-In**:
   - Navigate to today's visits on mobile
   - Tap "Check In" button
   - Grant location permission
   - Verify GPS capture
   - Verify biometric prompt (mock)

2. **Mobile Offline Sync**:
   - Complete visit while offline
   - Verify queued for sync
   - Go back online
   - Verify sync completes successfully

3. **Mobile Responsive Design**:
   - Test all key pages on mobile viewport
   - Verify no horizontal scroll
   - Verify touch targets >44px
   - Verify readable font sizes

### 5. Add Performance Tests

**File**: `e2e/tests/performance.spec.ts`

**Scenarios**:
1. **Page Load Times**:
   - Measure time to interactive for key pages
   - Assert page loads <3 seconds
   - Measure largest contentful paint (LCP)
   - Measure cumulative layout shift (CLS)

2. **Large Dataset Rendering**:
   - Load page with 100+ items in list
   - Verify pagination/virtualization working
   - Verify no browser freeze
   - Verify smooth scrolling

3. **Concurrent User Load** (basic):
   - Simulate 10 concurrent users
   - Verify no errors
   - Verify response times acceptable

### 6. Add Accessibility Tests

**File**: `e2e/tests/accessibility.spec.ts`

**Use axe-core Playwright integration**:
1. **WCAG AA Compliance**:
   - Run axe accessibility scan on all key pages
   - Verify no critical violations
   - Verify color contrast ratios
   - Verify keyboard navigation

2. **Screen Reader Testing**:
   - Verify ARIA labels present
   - Verify semantic HTML used
   - Verify form labels associated correctly

### 7. Add Data Integrity Tests

**File**: `e2e/tests/data-integrity.spec.ts`

**Scenarios**:
1. **Audit Trail Verification**:
   - Create/update/delete record
   - Verify audit log entry created
   - Verify audit log contains correct user, timestamp, changes

2. **Soft Delete Verification**:
   - Delete client
   - Verify client not shown in list
   - Verify client still in database (deleted_at set)
   - Verify related records not orphaned

3. **Referential Integrity**:
   - Create visit for client
   - Attempt to delete client with active visits
   - Verify deletion blocked or cascade handled correctly

### 8. Add Security Tests

**File**: `e2e/tests/security.spec.ts`

**Scenarios**:
1. **Authentication**:
   - Access protected route without login (should redirect)
   - Attempt SQL injection in login form (should be escaped)
   - Test JWT expiration and refresh

2. **Authorization**:
   - Caregiver attempts to access admin route (should fail)
   - Coordinator attempts to delete agency settings (should fail)
   - Test role-based access control (RBAC)

3. **CSRF Protection**:
   - Verify CSRF tokens on forms
   - Attempt form submission without token (should fail)

4. **XSS Prevention**:
   - Enter <script> tag in text fields
   - Verify output is escaped
   - Verify no script execution

## Test Infrastructure Improvements

### 1. Add Test Fixtures

**File**: `e2e/fixtures/test-data.ts`

Create reusable test data:
- Test users (admin, coordinator, caregiver, family member)
- Test clients (various demographics, service needs)
- Test caregivers (various skill sets, certifications)
- Test visits (scheduled, in-progress, completed)

### 2. Add Page Object Models (POMs)

**Create POMs for key pages**:
```typescript
// e2e/pages/VisitPage.ts
export class VisitPage {
  constructor(private page: Page) {}

  async createVisit(visitData: VisitData) {
    await this.page.click('[data-testid="create-visit-btn"]');
    await this.fillVisitForm(visitData);
    await this.page.click('[data-testid="submit-visit-btn"]');
  }

  async checkIn(gpsCoords: { lat: number, lon: number }) {
    await this.mockGPS(gpsCoords);
    await this.page.click('[data-testid="check-in-btn"]');
  }
}
```

### 3. Add Test Utilities

**File**: `e2e/utils/helpers.ts`

Utility functions:
- `login(role: string)` - Quick login as different roles
- `seedDatabase()` - Seed test data
- `clearDatabase()` - Clean database after tests
- `mockGPS(coords)` - Mock GPS location
- `mockBiometric()` - Mock biometric verification
- `waitForSync()` - Wait for offline sync to complete

### 4. Configure CI/CD Integration

**Update `.github/workflows/e2e-tests.yml`**:
- Run E2E tests on every PR
- Run on multiple browsers (Chrome, Firefox, Safari)
- Generate HTML report
- Upload screenshots on failure
- Fail PR if tests fail

## Acceptance Criteria

- [ ] 50+ E2E tests covering critical journeys
- [ ] Multi-user workflow tests implemented
- [ ] Error handling tests implemented
- [ ] Mobile-specific tests with viewport emulation
- [ ] Performance tests with assertions
- [ ] Accessibility tests with axe-core
- [ ] Data integrity tests
- [ ] Security tests
- [ ] Test fixtures and POMs created
- [ ] CI/CD integration working
- [ ] All tests pass consistently (no flaky tests)
- [ ] Test execution time <10 minutes

## Best Practices

- **Stable Selectors**: Use `data-testid` attributes, not CSS classes
- **Wait for Network**: Use `page.waitForResponse()` for API calls
- **Independent Tests**: Each test should be fully independent
- **Cleanup**: Reset database state after each test
- **No Hardcoded Waits**: Use Playwright's auto-waiting, not `sleep()`
- **Screenshots on Failure**: Automatically capture for debugging

## Reference

- Playwright documentation: https://playwright.dev/
- Testing best practices: Test Pyramid (unit > integration > E2E)
- Existing tests: `e2e/tests/*.spec.ts`
