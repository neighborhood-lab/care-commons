import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitListPage } from '../pages/VisitListPage.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { ScheduleVisitPage } from '../pages/ScheduleVisitPage.js';
import { TestDatabase } from '../setup/test-database.js';
import { createAuthenticatedPage } from '../fixtures/auth.fixture.js';

/**
 * Multi-User Workflow Tests
 *
 * Tests workflows involving multiple users interacting concurrently:
 * 1. Concurrent Scheduling (2 coordinators)
 * 2. Real-Time Updates (coordinator + caregiver)
 * 3. Family Portal Updates (caregiver + family member)
 */
test.describe('Multi-User Workflows', () => {
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

  test('Concurrent Scheduling: two coordinators schedule overlapping visits', async ({
    context,
    coordinatorUser,
  }) => {
    // Create two coordinator sessions
    const coordinator1Page = await context.newPage();
    const coordinator2Page = await context.newPage();

    const coordinator1 = {
      ...coordinatorUser,
      userId: 'coord-e2e-001',
      email: 'coordinator1@e2e-test.com',
    };

    const coordinator2 = {
      ...coordinatorUser,
      userId: 'coord-e2e-002',
      email: 'coordinator2@e2e-test.com',
    };

    await createAuthenticatedPage(coordinator1Page, coordinator1);
    await createAuthenticatedPage(coordinator2Page, coordinator2);

    const schedule1 = new ScheduleVisitPage(coordinator1Page);
    const schedule2 = new ScheduleVisitPage(coordinator2Page);

    // Coordinator 1 starts scheduling a visit
    await coordinator1Page.goto('/visits/schedule');
    await schedule1.fillVisitForm({
      clientName: 'John Doe',
      caregiverName: 'Jane Caregiver',
      serviceType: 'PERSONAL_CARE',
      scheduledDate: '2025-01-20',
      scheduledTime: '10:00',
      duration: 2,
    });

    // Coordinator 2 tries to schedule overlapping visit for same caregiver
    await coordinator2Page.goto('/visits/schedule');
    await schedule2.fillVisitForm({
      clientName: 'Bob Smith',
      caregiverName: 'Jane Caregiver', // Same caregiver
      serviceType: 'PERSONAL_CARE',
      scheduledDate: '2025-01-20',
      scheduledTime: '10:30', // Overlaps with first visit
      duration: 2,
    });

    // Coordinator 1 submits first
    await coordinator1Page.getByRole('button', { name: 'Schedule Visit' }).click();
    await coordinator1Page.waitForSelector('[role="alert"][data-type="success"]');

    // Coordinator 2 submits second - should see conflict warning
    await coordinator2Page.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should display conflict warning
    const conflictWarning = coordinator2Page.locator('[data-testid="scheduling-conflict"]');
    await expect(conflictWarning).toBeVisible();
    await expect(conflictWarning).toContainText(/conflict|overlap|already.*scheduled/i);

    // Verify caregiver and time details shown
    await expect(conflictWarning).toContainText('Jane Caregiver');
    await expect(conflictWarning).toContainText(/10:00.*12:00/i);

    // Coordinator 2 should have option to override or reschedule
    const overrideBtn = coordinator2Page.getByRole('button', { name: /override|continue anyway/i });
    const rescheduleBtn = coordinator2Page.getByRole('button', { name: /choose.*time|reschedule/i });

    await expect(overrideBtn).toBeVisible();
    await expect(rescheduleBtn).toBeVisible();

    await coordinator1Page.close();
    await coordinator2Page.close();
  });

  test('Real-Time Updates: coordinator sees caregiver check-in/check-out in real-time', async ({
    context,
    coordinatorUser,
    caregiverUser,
  }) => {
    // Set up coordinator viewing visit list
    const coordinatorPage = await context.newPage();
    await createAuthenticatedPage(coordinatorPage, coordinatorUser);
    const visitListPage = new VisitListPage(coordinatorPage);

    await visitListPage.goToVisitList();
    await visitListPage.filterByStatus('SCHEDULED');
    await visitListPage.filterByDate('today');

    // Open visit detail in coordinator view
    await visitListPage.clickVisit('John Doe');
    const coordinatorVisitDetail = new VisitDetailPage(coordinatorPage);
    await coordinatorVisitDetail.assertStatus('SCHEDULED');

    // Set up caregiver session
    const caregiverPage = await context.newPage();
    await createAuthenticatedPage(caregiverPage, caregiverUser);
    const caregiverVisitDetail = new VisitDetailPage(caregiverPage);

    // Set GPS location
    await caregiverPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await caregiverPage.context().grantPermissions(['geolocation']);

    await caregiverVisitDetail.goToVisit('visit-001');

    // Caregiver checks in
    await caregiverVisitDetail.clockIn({
      withGPS: true,
      notes: 'Arrived',
    });

    // Coordinator should see real-time status update (via WebSocket or polling)
    await coordinatorPage.waitForTimeout(2000); // Allow time for WebSocket update

    // Reload to simulate real-time update
    await coordinatorPage.reload();
    await coordinatorVisitDetail.assertStatus('IN_PROGRESS');

    // Verify coordinator sees check-in notification
    const statusBadge = coordinatorPage.locator('[data-testid="visit-status"]');
    await expect(statusBadge).toContainText(/in progress|active/i);

    // Verify timestamp updated
    const lastUpdate = coordinatorPage.locator('[data-testid="last-updated"]');
    await expect(lastUpdate).toBeVisible();

    // Caregiver completes visit
    await caregiverVisitDetail.completeAllTasks();
    await caregiverVisitDetail.clockOut({
      notes: 'Completed',
    });

    // Coordinator sees completion notification
    await coordinatorPage.waitForTimeout(2000);
    await coordinatorPage.reload();
    await coordinatorVisitDetail.assertStatus('COMPLETED');

    // Verify completion notification shown
    const notification = coordinatorPage.locator('[data-testid="notification-badge"]');
    await expect(notification).toBeVisible();

    await coordinatorPage.close();
    await caregiverPage.close();
  });

  test('Family Portal Updates: family member sees caregiver activity and can send messages', async ({
    context,
    caregiverUser,
    coordinatorUser,
  }) => {
    // Set up caregiver completing a visit
    const caregiverPage = await context.newPage();
    await createAuthenticatedPage(caregiverPage, caregiverUser);
    const caregiverVisitDetail = new VisitDetailPage(caregiverPage);

    await caregiverPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await caregiverPage.context().grantPermissions(['geolocation']);

    await caregiverVisitDetail.goToVisit('visit-001');
    await caregiverVisitDetail.clockIn({ withGPS: true });
    await caregiverVisitDetail.completeAllTasks();
    await caregiverVisitDetail.addNotes('Client had a good day. Completed all activities.');
    await caregiverVisitDetail.clockOut();

    // Set up family member session
    const familyPage = await context.newPage();
    const familyUser = {
      userId: 'family-e2e-001',
      email: 'family@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['FAMILY_MEMBER'],
      permissions: ['family-portal:read', 'messages:write'],
    };
    await createAuthenticatedPage(familyPage, familyUser);

    // Family member navigates to family portal
    await familyPage.goto('/family-portal');

    // Should see recent visit activity
    await familyPage.waitForSelector('[data-testid="activity-feed"]');
    const activityItem = familyPage.locator('[data-testid="activity-item"]').first();
    await expect(activityItem).toBeVisible();
    await expect(activityItem).toContainText(/visit.*completed|care.*provided/i);

    // View visit details
    await activityItem.click();
    await familyPage.waitForSelector('[data-testid="visit-summary"]');

    // Verify caregiver notes visible (if permitted)
    const caregiverNotes = familyPage.locator('[data-testid="caregiver-notes"]');
    await expect(caregiverNotes).toContainText(/good day.*completed all activities/i);

    // Family member sends message to coordinator
    await familyPage.getByRole('button', { name: /send message|contact coordinator/i }).click();
    await familyPage.getByLabel('Message').fill('Thank you for the excellent care! Mom really enjoyed today.');
    await familyPage.getByRole('button', { name: 'Send' }).click();

    // Verify message sent confirmation
    const successToast = familyPage.locator('[role="alert"][data-type="success"]');
    await expect(successToast).toBeVisible();

    // Coordinator receives message
    const coordinatorPage = await context.newPage();
    await createAuthenticatedPage(coordinatorPage, coordinatorUser);
    await coordinatorPage.goto('/messages');

    // Should see new message notification
    const messageNotification = coordinatorPage.locator('[data-testid="unread-badge"]');
    await expect(messageNotification).toBeVisible();

    // Open message thread
    const messageThread = coordinatorPage.locator('[data-testid="message-thread"]', {
      hasText: 'family@e2e-test.com',
    });
    await messageThread.click();

    // Verify message content
    const messageContent = coordinatorPage.locator('[data-testid="message-content"]').last();
    await expect(messageContent).toContainText(/thank you.*excellent care/i);

    await caregiverPage.close();
    await familyPage.close();
    await coordinatorPage.close();
  });

  test('Concurrent visit modifications: prevent race conditions when multiple users edit same visit', async ({
    context,
    coordinatorUser,
  }) => {
    // Create two coordinator sessions editing the same visit
    const coord1Page = await context.newPage();
    const coord2Page = await context.newPage();

    const coord1 = { ...coordinatorUser, userId: 'coord-001', email: 'coord1@test.com' };
    const coord2 = { ...coordinatorUser, userId: 'coord-002', email: 'coord2@test.com' };

    await createAuthenticatedPage(coord1Page, coord1);
    await createAuthenticatedPage(coord2Page, coord2);

    const visit1 = new VisitDetailPage(coord1Page);
    const visit2 = new VisitDetailPage(coord2Page);

    // Both open the same visit
    await visit1.goToVisit('visit-001');
    await visit2.goToVisit('visit-001');

    // Coordinator 1 starts editing
    await coord1Page.getByRole('button', { name: 'Edit Visit' }).click();
    await coord1Page.getByLabel('Duration').fill('3');

    // Coordinator 2 also starts editing
    await coord2Page.getByRole('button', { name: 'Edit Visit' }).click();
    await coord2Page.getByLabel('Start Time').fill('11:00');

    // Coordinator 1 saves first
    await coord1Page.getByRole('button', { name: 'Save Changes' }).click();
    await coord1Page.waitForSelector('[role="alert"][data-type="success"]');

    // Coordinator 2 tries to save - should see conflict warning
    await coord2Page.getByRole('button', { name: 'Save Changes' }).click();

    // Should show "visit was modified" warning
    const conflictWarning = coord2Page.locator('[data-testid="edit-conflict-warning"]');
    await expect(conflictWarning).toBeVisible();
    await expect(conflictWarning).toContainText(/modified.*another user|version conflict/i);

    // Should offer options to reload or force save
    const reloadBtn = coord2Page.getByRole('button', { name: /reload|refresh/i });
    const forceSaveBtn = coord2Page.getByRole('button', { name: /force.*save|overwrite/i });

    await expect(reloadBtn).toBeVisible();
    await expect(forceSaveBtn).toBeVisible();

    await coord1Page.close();
    await coord2Page.close();
  });

  test('Shift handoff: outgoing caregiver documents notes, incoming caregiver sees them', async ({
    context,
    caregiverUser,
  }) => {
    // Morning caregiver completes shift
    const morningCaregiverPage = await context.newPage();
    const morningCaregiver = {
      ...caregiverUser,
      userId: 'caregiver-morning',
      email: 'morning@test.com',
    };
    await createAuthenticatedPage(morningCaregiverPage, morningCaregiver);

    await morningCaregiverPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await morningCaregiverPage.context().grantPermissions(['geolocation']);

    const morningVisit = new VisitDetailPage(morningCaregiverPage);
    await morningVisit.goToVisit('visit-morning');
    await morningVisit.clockIn({ withGPS: true });
    await morningVisit.completeAllTasks();

    // Add handoff notes
    await morningCaregiverPage.getByLabel('Handoff Notes').fill(
      'Client had breakfast. Medication taken at 9am. Mood: cheerful. Note: prefers afternoon walk.'
    );
    await morningVisit.clockOut();

    // Evening caregiver views handoff notes
    const eveningCaregiverPage = await context.newPage();
    const eveningCaregiver = {
      ...caregiverUser,
      userId: 'caregiver-evening',
      email: 'evening@test.com',
    };
    await createAuthenticatedPage(eveningCaregiverPage, eveningCaregiver);

    await eveningCaregiverPage.goto('/visits/today');
    await eveningCaregiverPage.getByText('John Doe').click();

    // Should see handoff notes from morning shift
    const handoffSection = eveningCaregiverPage.locator('[data-testid="handoff-notes"]');
    await expect(handoffSection).toBeVisible();
    await expect(handoffSection).toContainText(/breakfast.*medication.*9am/i);
    await expect(handoffSection).toContainText(/afternoon walk/i);

    // Should see timestamp and caregiver name
    await expect(handoffSection).toContainText('morning@test.com');

    await morningCaregiverPage.close();
    await eveningCaregiverPage.close();
  });
});
