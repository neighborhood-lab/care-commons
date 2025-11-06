import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitListPage } from '../pages/VisitListPage.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { ScheduleVisitPage } from '../pages/ScheduleVisitPage.js';
import { EVVRecordPage } from '../pages/EVVRecordPage.js';
import { TestDatabase } from '../setup/test-database.js';
import { createAuthenticatedPage } from '../fixtures/auth.fixture.js';

/**
 * Critical User Journey Tests
 *
 * Tests end-to-end workflows that span multiple user roles and system components:
 * 1. Complete Visit Lifecycle (coordinator → caregiver → coordinator)
 * 2. New Client Onboarding (admin → coordinator)
 * 3. EVV Compliance Flow (caregiver → system → coordinator)
 */
test.describe('Critical User Journeys', () => {
  test.beforeAll(async () => {
    await TestDatabase.setup();
  });

  test.afterAll(async () => {
    await TestDatabase.teardown();
  });

  test.beforeEach(async () => {
    await TestDatabase.cleanup();
    await TestDatabase.seed('visit-lifecycle');
  });

  test('Complete Visit Lifecycle: coordinator creates → caregiver executes → coordinator approves', async ({
    page,
    context,
    coordinatorUser,
    caregiverUser,
  }) => {
    // ===== PHASE 1: Coordinator creates visit =====
    const coordinatorPage = await createAuthenticatedPage(page, coordinatorUser);
    const schedulePage = new ScheduleVisitPage(coordinatorPage);
    const visitListPage = new VisitListPage(coordinatorPage);

    await schedulePage.scheduleVisit({
      clientName: 'John Doe',
      caregiverName: 'Jane Caregiver',
      serviceType: 'PERSONAL_CARE',
      scheduledDate: '2025-01-15',
      scheduledTime: '09:00',
      duration: 2,
      tasks: ['Assist with bathing', 'Medication reminder', 'Meal preparation'],
      notes: 'Client prefers morning visits',
    });

    await visitListPage.goToVisitList();
    await visitListPage.filterByStatus('SCHEDULED');
    const visitExists = await visitListPage.hasVisit('John Doe');
    expect(visitExists).toBe(true);

    // ===== PHASE 2: Caregiver checks in and completes tasks =====
    const caregiverPage = await context.newPage();
    await createAuthenticatedPage(caregiverPage, caregiverUser);
    const caregiverVisitDetail = new VisitDetailPage(caregiverPage);

    // Set GPS location within geofence
    await caregiverPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await caregiverPage.context().grantPermissions(['geolocation']);

    await caregiverVisitDetail.goToVisit('visit-001');
    await caregiverVisitDetail.clockIn({
      withGPS: true,
      notes: 'Arrived on time',
    });
    await caregiverVisitDetail.assertStatus('IN_PROGRESS');

    // Complete all tasks
    await caregiverVisitDetail.completeTask('Assist with bathing');
    await caregiverVisitDetail.completeTask('Medication reminder');
    await caregiverVisitDetail.completeTask('Meal preparation');

    await caregiverVisitDetail.addNotes('All tasks completed. Client in good spirits.');
    await caregiverVisitDetail.clockOut({
      notes: 'Visit completed successfully',
    });
    await caregiverVisitDetail.assertStatus('COMPLETED');

    // ===== PHASE 3: Coordinator reviews and approves =====
    await coordinatorPage.reload();
    await visitListPage.filterByStatus('COMPLETED');
    const completedVisit = await visitListPage.hasVisit('John Doe');
    expect(completedVisit).toBe(true);

    const coordinatorVisitDetail = new VisitDetailPage(coordinatorPage);
    await visitListPage.clickVisit('John Doe');
    await coordinatorVisitDetail.assertStatus('COMPLETED');

    // View EVV record
    await coordinatorVisitDetail.viewEVVRecord();
    const evvPage = new EVVRecordPage(coordinatorPage);
    await evvPage.assertComplianceStatus('COMPLIANT');
    await evvPage.assertVerificationMethod('GPS');

    await caregiverPage.close();
  });

  test('New Client Onboarding: admin creates client → coordinator schedules first visit', async ({
    page,
    context,
    adminUser,
    coordinatorUser,
  }) => {
    // ===== PHASE 1: Admin creates client =====
    const adminPage = await createAuthenticatedPage(page, adminUser);
    await adminPage.goto('/clients/new');

    // Fill client information
    await adminPage.getByLabel('First Name').fill('Emily');
    await adminPage.getByLabel('Last Name').fill('Johnson');
    await adminPage.getByLabel('Date of Birth').fill('1945-03-15');
    await adminPage.getByLabel('Address').fill('123 Main St, Austin, TX 78701');
    await adminPage.getByLabel('Phone').fill('512-555-1234');
    await adminPage.getByLabel('Email').fill('emily.johnson@example.com');

    // Select service authorization
    await adminPage.getByLabel('Service Authorization').selectOption('MEDICAID_WAIVER');
    await adminPage.getByLabel('Authorized Hours/Week').fill('20');

    await adminPage.getByRole('button', { name: 'Create Client' }).click();
    await adminPage.waitForURL(/\/clients\/\d+/);

    // ===== PHASE 2: Admin sets up care plan =====
    await adminPage.getByRole('tab', { name: 'Care Plan' }).click();
    await adminPage.getByRole('button', { name: 'Add Care Plan' }).click();

    await adminPage.getByLabel('Care Plan Type').selectOption('PERSONAL_CARE');
    await adminPage.getByLabel('Start Date').fill('2025-01-15');
    await adminPage.getByLabel('Tasks').fill('Bathing assistance\nMedication reminders\nMeal preparation');
    await adminPage.getByRole('button', { name: 'Save Care Plan' }).click();

    // Wait for success message
    const successToast = adminPage.locator('[role="alert"][data-type="success"]');
    await successToast.waitFor({ state: 'visible' });

    // ===== PHASE 3: Coordinator schedules first visit =====
    const coordinatorPage = await context.newPage();
    await createAuthenticatedPage(coordinatorPage, coordinatorUser);
    const schedulePage = new ScheduleVisitPage(coordinatorPage);

    await schedulePage.scheduleVisit({
      clientName: 'Emily Johnson',
      caregiverName: 'Jane Caregiver',
      serviceType: 'PERSONAL_CARE',
      scheduledDate: '2025-01-20',
      scheduledTime: '10:00',
      duration: 2,
      tasks: ['Bathing assistance', 'Medication reminders', 'Meal preparation'],
      notes: 'First visit - introduce caregiver to client',
    });

    // ===== PHASE 4: Verify visit appears on caregiver schedule =====
    const caregiverPage = await context.newPage();
    const caregiverUser = {
      userId: 'caregiver-e2e-001',
      email: 'caregiver@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['CAREGIVER'],
      permissions: ['visits:read:own', 'evv:write:own'],
    };
    await createAuthenticatedPage(caregiverPage, caregiverUser);

    const caregiverVisitList = new VisitListPage(caregiverPage);
    await caregiverVisitList.goToVisitList();
    await caregiverVisitList.filterByDate('2025-01-20');

    const visitAppears = await caregiverVisitList.hasVisit('Emily Johnson');
    expect(visitAppears).toBe(true);

    await adminPage.close();
    await coordinatorPage.close();
    await caregiverPage.close();
  });

  test('EVV Compliance Flow: geofence validation → GPS capture → coordinator reviews', async ({
    page,
    context,
    caregiverUser,
    coordinatorUser,
  }) => {
    // ===== PHASE 1: Caregiver attempts check-in outside geofence (should fail) =====
    const caregiverPage = await createAuthenticatedPage(page, caregiverUser);
    const visitDetail = new VisitDetailPage(caregiverPage);

    await visitDetail.goToVisit('visit-001');

    // Set GPS location far from client (New York instead of Austin)
    await caregiverPage.context().setGeolocation({
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
    });
    await caregiverPage.context().grantPermissions(['geolocation']);

    await caregiverPage.getByTestId('check-in-btn').click();

    // Should show geofence error
    await visitDetail.waitForErrorToast(/outside.*geofence|location.*not.*match/i);
    await visitDetail.assertStatus('SCHEDULED');

    // ===== PHASE 2: Caregiver moves to correct location (should succeed) =====
    await caregiverPage.context().setGeolocation({
      latitude: 30.2672, // Austin, TX
      longitude: -97.7431,
      accuracy: 10,
    });

    // Wait a moment for GPS to update
    await caregiverPage.waitForTimeout(500);

    await caregiverPage.getByTestId('check-in-btn').click();
    await visitDetail.assertStatus('IN_PROGRESS');

    // ===== PHASE 3: Caregiver completes visit =====
    await visitDetail.completeAllTasks();
    await visitDetail.clockOut({
      notes: 'All services provided',
    });
    await visitDetail.assertStatus('COMPLETED');

    // ===== PHASE 4: Verify EVV data captured correctly =====
    await visitDetail.viewEVVRecord();
    const evvPage = new EVVRecordPage(caregiverPage);

    // Verify GPS coordinates captured
    await evvPage.assertGPSWithinRange(50);
    await evvPage.assertVerificationMethod('GPS');
    await evvPage.assertComplianceStatus('COMPLIANT');

    // Verify timestamps captured
    const clockInTime = await evvPage.getClockInTime();
    const clockOutTime = await evvPage.getClockOutTime();
    expect(clockInTime).toBeTruthy();
    expect(clockOutTime).toBeTruthy();
    expect(new Date(clockOutTime) > new Date(clockInTime)).toBe(true);

    // ===== PHASE 5: Coordinator views EVV report =====
    const coordinatorPage = await context.newPage();
    await createAuthenticatedPage(coordinatorPage, coordinatorUser);

    await coordinatorPage.goto('/evv/reports');
    await coordinatorPage.getByLabel('Date Range').selectOption('today');
    await coordinatorPage.getByRole('button', { name: 'Generate Report' }).click();

    // Wait for report to load
    await coordinatorPage.waitForSelector('[data-testid="evv-report-table"]');

    // Verify visit appears in report
    const reportRow = coordinatorPage.locator('[data-testid="evv-report-row"]', {
      hasText: 'visit-001',
    });
    await expect(reportRow).toBeVisible();

    // Verify compliance status
    const complianceCell = reportRow.locator('[data-testid="compliance-status"]');
    await expect(complianceCell).toHaveText(/COMPLIANT/i);

    await coordinatorPage.close();
  });

  test('Multi-day visit series: schedule recurring → complete multiple visits → review weekly summary', async ({
    page,
    coordinatorUser,
  }) => {
    const coordinatorPage = await createAuthenticatedPage(page, coordinatorUser);
    const schedulePage = new ScheduleVisitPage(coordinatorPage);

    // Schedule recurring visits (Mon-Fri for 1 week)
    await coordinatorPage.goto('/visits/schedule');
    await coordinatorPage.getByTestId('schedule-type').selectOption('RECURRING');

    await schedulePage.fillVisitForm({
      clientName: 'John Doe',
      caregiverName: 'Jane Caregiver',
      serviceType: 'PERSONAL_CARE',
      startDate: '2025-01-20',
      endDate: '2025-01-24',
      time: '09:00',
      duration: 2,
      recurrencePattern: 'DAILY_WEEKDAYS',
      tasks: ['Assist with bathing', 'Medication reminder'],
    });

    await coordinatorPage.getByRole('button', { name: 'Schedule Series' }).click();

    // Verify 5 visits created (Mon-Fri)
    const visitListPage = new VisitListPage(coordinatorPage);
    await visitListPage.goToVisitList();
    await visitListPage.filterByDateRange('2025-01-20', '2025-01-24');
    await visitListPage.filterByClient('John Doe');

    const visitCount = await visitListPage.getVisitCount();
    expect(visitCount).toBe(5);

    // Verify weekly summary shows scheduled hours
    await coordinatorPage.goto('/reports/weekly-summary');
    await coordinatorPage.getByLabel('Week Of').fill('2025-01-20');
    await coordinatorPage.getByRole('button', { name: 'Generate' }).click();

    const scheduledHours = await coordinatorPage
      .locator('[data-testid="scheduled-hours"]')
      .textContent();
    expect(scheduledHours).toContain('10'); // 5 visits × 2 hours
  });
});
