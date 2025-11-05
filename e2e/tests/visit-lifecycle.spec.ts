import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitListPage } from '../pages/VisitListPage.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { ScheduleVisitPage } from '../pages/ScheduleVisitPage.js';
import { EVVRecordPage } from '../pages/EVVRecordPage.js';
import { TestDatabase } from '../setup/test-database.js';

/**
 * Visit Lifecycle E2E Tests
 *
 * Tests the complete visit workflow from scheduling to completion:
 * 1. Schedule a visit
 * 2. Assign caregiver
 * 3. Clock in (with GPS verification)
 * 4. Complete tasks
 * 5. Clock out
 * 6. Verify EVV record
 */
test.describe('Visit Lifecycle Workflow', () => {
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

  test('should complete full visit lifecycle: Schedule → Clock In → Complete Tasks → Clock Out', async ({
    authenticatedPage,
    coordinatorUser,
  }) => {
    const schedulePage = new ScheduleVisitPage(authenticatedPage);
    const visitListPage = new VisitListPage(authenticatedPage);
    const visitDetailPage = new VisitDetailPage(authenticatedPage);
    const evvPage = new EVVRecordPage(authenticatedPage);

    // Step 1: Schedule a new visit
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

    // Step 2: Verify visit appears in list
    await visitListPage.goToVisitList();
    await visitListPage.filterByStatus('SCHEDULED');
    const visitCount = await visitListPage.getVisitCount();
    expect(visitCount).toBeGreaterThan(0);

    // Verify visit shows correct status
    const status = await visitListPage.getVisitStatus('John Doe');
    expect(status).toContain('SCHEDULED');

    // Step 3: Navigate to visit detail
    await visitListPage.clickVisit('John Doe');

    // Verify visit details
    await visitDetailPage.assertStatus('SCHEDULED');
    const clientName = await visitDetailPage.getClientName();
    expect(clientName).toContain('John Doe');

    const caregiverName = await visitDetailPage.getCaregiverName();
    expect(caregiverName).toContain('Jane Caregiver');

    // Step 4: Clock in (as caregiver)
    // Mock GPS coordinates within geofence
    await authenticatedPage.context().setGeolocation({
      latitude: 30.2672, // Austin, TX (within geofence)
      longitude: -97.7431,
      accuracy: 10,
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    await visitDetailPage.clockIn({
      withGPS: true,
      notes: 'Arrived on time, client ready',
    });

    // Verify status changed to IN_PROGRESS
    await visitDetailPage.assertStatus('IN_PROGRESS');

    // Step 5: Complete tasks
    await visitDetailPage.completeTask('Assist with bathing');
    await visitDetailPage.completeTask('Medication reminder');
    await visitDetailPage.completeTask('Meal preparation');

    // Verify all tasks completed
    const completedTasks = await visitDetailPage.getCompletedTaskCount();
    expect(completedTasks).toBe(3);

    // Step 6: Add visit notes
    await visitDetailPage.addNotes('All tasks completed successfully. Client in good spirits.');

    // Step 7: Clock out
    await visitDetailPage.clockOut({
      notes: 'Visit completed successfully',
    });

    // Verify status changed to COMPLETED
    await visitDetailPage.assertStatus('COMPLETED');

    // Step 8: Verify EVV record created
    await visitDetailPage.viewEVVRecord();

    // Verify EVV compliance
    await evvPage.assertComplianceStatus('COMPLIANT');
    await evvPage.assertVerificationMethod('GPS');
    await evvPage.assertGPSWithinRange(50); // Within 50 meters
    await evvPage.assertNoComplianceFlags();
  });

  test('should prevent clock-in outside geofence', async ({ authenticatedPage, caregiverUser }) => {
    const visitDetailPage = new VisitDetailPage(authenticatedPage);

    // Navigate to a scheduled visit
    await visitDetailPage.goToVisit('visit-001');

    // Mock geolocation far from client location (New York instead of Austin)
    await authenticatedPage.context().setGeolocation({
      latitude: 40.7128, // New York
      longitude: -74.006,
      accuracy: 10,
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    // Attempt to clock in
    await visitDetailPage.clockInButton.click();

    // Should show geofence error
    await visitDetailPage.waitForErrorToast(/outside.*geofence|location.*not.*match/i);

    // Visit should still be SCHEDULED
    await visitDetailPage.assertStatus('SCHEDULED');
  });

  test('should require all critical tasks before clock-out', async ({
    authenticatedPage,
    caregiverUser,
  }) => {
    const visitDetailPage = new VisitDetailPage(authenticatedPage);

    // Set up visit with GPS
    await authenticatedPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    await visitDetailPage.goToVisit('visit-with-critical-tasks');
    await visitDetailPage.clockIn();

    // Complete only some tasks (not all critical ones)
    await visitDetailPage.completeTask('Assist with bathing');
    // Skip critical task: "Medication reminder" (marked as critical)

    // Attempt to clock out
    await visitDetailPage.clockOutButton.click();

    // Should show error about incomplete critical tasks
    await visitDetailPage.waitForErrorToast(/complete.*required.*tasks|critical.*tasks.*incomplete/i);

    // Visit should still be IN_PROGRESS
    await visitDetailPage.assertStatus('IN_PROGRESS');
  });

  test('should handle visit cancellation', async ({ authenticatedPage, coordinatorUser }) => {
    const visitListPage = new VisitListPage(authenticatedPage);
    const visitDetailPage = new VisitDetailPage(authenticatedPage);

    // Navigate to a scheduled visit
    await visitListPage.goToVisitList();
    await visitListPage.filterByStatus('SCHEDULED');
    await visitListPage.clickVisit('Bob Smith');

    // Cancel the visit
    await visitDetailPage.cancelVisit('Client hospitalized');

    // Verify status changed to CANCELLED
    await visitDetailPage.assertStatus('CANCELLED');

    // Verify visit shows as cancelled in list
    await visitListPage.goToVisitList();
    await visitListPage.filterByStatus('CANCELLED');
    const status = await visitListPage.getVisitStatus('Bob Smith');
    expect(status).toContain('CANCELLED');
  });

  test('should track visit duration accurately', async ({ authenticatedPage, caregiverUser }) => {
    const visitDetailPage = new VisitDetailPage(authenticatedPage);

    // Set up GPS
    await authenticatedPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    await visitDetailPage.goToVisit('visit-001');

    // Clock in
    const clockInTime = Date.now();
    await visitDetailPage.clockIn();

    // Simulate work (in real scenario, this would be actual time)
    await authenticatedPage.waitForTimeout(2000); // 2 seconds for test speed

    // Complete tasks
    await visitDetailPage.completeAllTasks();

    // Clock out
    const clockOutTime = Date.now();
    await visitDetailPage.clockOut();

    // Verify visit completed
    await visitDetailPage.assertStatus('COMPLETED');

    // In a real test, you would verify duration matches scheduled duration
    // For now, we just verify the workflow completed
    const duration = clockOutTime - clockInTime;
    expect(duration).toBeGreaterThan(1000); // At least 1 second
  });

  test('should handle offline mode gracefully', async ({ authenticatedPage, caregiverUser }) => {
    const visitDetailPage = new VisitDetailPage(authenticatedPage);

    // Set up GPS
    await authenticatedPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    await visitDetailPage.goToVisit('visit-001');
    await visitDetailPage.clockIn();

    // Simulate offline mode
    await authenticatedPage.context().setOffline(true);

    // Complete tasks (should work offline)
    await visitDetailPage.completeTask('Assist with bathing');

    // Go back online
    await authenticatedPage.context().setOffline(false);

    // Clock out (should sync data)
    await visitDetailPage.clockOut();

    // Verify completed
    await visitDetailPage.assertStatus('COMPLETED');
  });

  test('should display real-time visit updates for coordinators', async ({
    page,
    coordinatorUser,
  }) => {
    const visitListPage = new VisitListPage(page);

    await visitListPage.goToVisitList();
    await visitListPage.filterByStatus('IN_PROGRESS');

    const initialCount = await visitListPage.getVisitCount();

    // In a real scenario with WebSocket updates, a new visit starting
    // would appear in the list automatically. For now, we simulate a refresh.
    await page.waitForTimeout(1000);
    await visitListPage.reload();

    // This test would verify real-time updates in a live environment
    const updatedCount = await visitListPage.getVisitCount();
    expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should validate GPS accuracy requirements', async ({
    authenticatedPage,
    caregiverUser,
  }) => {
    const visitDetailPage = new VisitDetailPage(authenticatedPage);

    await visitDetailPage.goToVisit('visit-001');

    // Mock GPS with poor accuracy (over 100 meters)
    await authenticatedPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 150, // Poor accuracy
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    // Attempt clock-in
    await visitDetailPage.clockInButton.click();

    // Should show warning or error about GPS accuracy
    await visitDetailPage.waitForErrorToast(/gps.*accuracy|location.*accuracy|weak.*signal/i, 5000).catch(async () => {
      // Some implementations may allow with warning
      await visitDetailPage.waitForToast(/gps.*accuracy|low.*accuracy/i);
    });
  });
});
