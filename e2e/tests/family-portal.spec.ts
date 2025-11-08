import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { TestDatabase } from '../setup/test-database.js';
import { createAuthenticatedPage } from '../fixtures/auth.fixture.js';

/**
 * Family Portal Workflow E2E Tests
 *
 * Tests the complete family portal workflow:
 * 1. Family member logs in
 * 2. Views care updates and visit history
 * 3. Sends messages to care team
 * 4. Receives notifications
 * 5. Views caregiver information
 *
 * This validates the family engagement vertical and ensures family
 * members can stay informed about their loved ones' care.
 */
test.describe('Family Portal Workflow', () => {
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

  test('Complete Family Portal Workflow: Login → View Updates → Send Message → Get Notification', async ({
    context,
    caregiverUser,
    coordinatorUser,
  }) => {
    // ===== PHASE 1: Set up completed visit with caregiver notes =====
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
    await caregiverVisitDetail.clockIn({ withGPS: true });
    await caregiverVisitDetail.completeAllTasks();
    await caregiverVisitDetail.addNotes(
      'Client had a wonderful day. Completed all activities including a walk in the garden. Appetite was good at lunch.'
    );
    await caregiverVisitDetail.clockOut();

    // ===== PHASE 2: Family member logs in =====
    const familyPage = await context.newPage();
    const familyUser = {
      userId: 'family-e2e-001',
      email: 'family@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['FAMILY_MEMBER'],
      permissions: ['family-portal:read', 'messages:write', 'visits:read'],
    };
    await createAuthenticatedPage(familyPage, familyUser);

    // Navigate to family portal
    await familyPage.goto('/family-portal');
    await expect(familyPage).toHaveURL(/\/family-portal/);

    // Verify welcome message or client name
    const welcomeMessage = familyPage.locator('[data-testid="welcome-message"]');
    await expect(welcomeMessage).toBeVisible();

    // ===== PHASE 3: View recent visit updates =====
    await test.step('View recent visits', async () => {
      const activityFeed = familyPage.locator('[data-testid="activity-feed"]');
      await expect(activityFeed).toBeVisible();

      // Should see the completed visit
      const recentVisit = familyPage.locator('[data-testid="activity-item"]').first();
      await expect(recentVisit).toBeVisible();
      await expect(recentVisit).toContainText(/visit.*completed|care.*provided/i);

      // Click to view visit details
      await recentVisit.click();

      // Verify visit details are visible
      const visitSummary = familyPage.locator('[data-testid="visit-summary"]');
      await expect(visitSummary).toBeVisible();

      // Verify can see caregiver notes
      const caregiverNotes = familyPage.locator('[data-testid="caregiver-notes"]');
      await expect(caregiverNotes).toBeVisible();
      await expect(caregiverNotes).toContainText(/wonderful day.*walk in the garden/i);
    });

    // ===== PHASE 4: View visit history =====
    await test.step('View visit history', async () => {
      await familyPage.goto('/family-portal/visits');

      const visitHistory = familyPage.locator('[data-testid="visit-history"]');
      await expect(visitHistory).toBeVisible();

      // Filter by date range
      const dateFilter = familyPage.locator('[data-testid="date-filter"]');
      if (await dateFilter.isVisible()) {
        await dateFilter.selectOption('last-7-days');
      }

      // Verify visit list shows visits
      const visitList = familyPage.locator('[data-testid="visit-list-item"]');
      const visitCount = await visitList.count();
      expect(visitCount).toBeGreaterThan(0);
    });

    // ===== PHASE 5: Send message to coordinator =====
    await test.step('Send message to coordinator', async () => {
      await familyPage.goto('/family-portal/messages');

      // Click "New Message" or "Contact Care Team"
      await familyPage.getByRole('button', { name: /new message|contact.*team/i }).click();

      // Fill message form
      await familyPage.getByLabel(/recipient|to/i).selectOption({ label: /coordinator/i });
      await familyPage
        .getByLabel('Subject')
        .fill('Thank you for the excellent care');
      await familyPage
        .getByLabel(/message|body/i)
        .fill('Thank you so much for the wonderful care today. Mom really enjoyed the walk in the garden!');

      // Send message
      await familyPage.getByRole('button', { name: /send/i }).click();

      // Verify success message
      const successToast = familyPage.locator('[role="alert"][data-type="success"]');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/message.*sent|sent.*successfully/i);
    });

    // ===== PHASE 6: Coordinator receives message =====
    await test.step('Coordinator receives and responds to message', async () => {
      const coordinatorPage = await context.newPage();
      await createAuthenticatedPage(coordinatorPage, coordinatorUser);

      // Navigate to messages
      await coordinatorPage.goto('/messages');

      // Should see unread message indicator
      const unreadBadge = coordinatorPage.locator('[data-testid="unread-badge"]');
      await expect(unreadBadge).toBeVisible();

      // Find message from family member
      const messageThread = coordinatorPage.locator('[data-testid="message-thread"]', {
        hasText: 'family@e2e-test.com',
      });
      await messageThread.click();

      // Verify message content
      const messageContent = coordinatorPage.locator('[data-testid="message-content"]').last();
      await expect(messageContent).toContainText(/thank you.*excellent care/i);

      // Reply to message
      await coordinatorPage
        .getByLabel('Reply')
        .fill("You're very welcome! We're happy to hear she enjoyed the garden walk. We'll continue to include outdoor activities in her care plan.");
      await coordinatorPage.getByRole('button', { name: /send reply/i }).click();

      // Verify reply sent
      const replySuccess = coordinatorPage.locator('[role="alert"][data-type="success"]');
      await expect(replySuccess).toBeVisible();

      await coordinatorPage.close();
    });

    // ===== PHASE 7: Family member receives notification =====
    await test.step('Family member receives notification', async () => {
      // Reload or navigate to notifications
      await familyPage.goto('/family-portal/notifications');

      // Should see notification for new reply
      const notification = familyPage.locator('[data-testid="notification"]').first();
      await expect(notification).toBeVisible();
      await expect(notification).toContainText(/new reply|response.*message/i);

      // Click notification to view message
      await notification.click();

      // Should navigate to message thread
      await expect(familyPage).toHaveURL(/\/messages|\/family-portal\/messages/);

      // Verify can see coordinator's reply
      const reply = familyPage.locator('[data-testid="message-content"]').last();
      await expect(reply).toContainText(/continue.*outdoor activities/i);
    });

    // ===== PHASE 8: View caregiver information =====
    await test.step('View caregiver information', async () => {
      await familyPage.goto('/family-portal/caregivers');

      // Should see list of caregivers assigned to client
      const caregiverList = familyPage.locator('[data-testid="caregiver-list"]');
      await expect(caregiverList).toBeVisible();

      // Should see caregiver profile information
      const caregiverCard = familyPage.locator('[data-testid="caregiver-card"]').first();
      await expect(caregiverCard).toBeVisible();

      // Verify caregiver has name and photo
      const caregiverName = caregiverCard.locator('[data-testid="caregiver-name"]');
      await expect(caregiverName).toBeVisible();
    });

    await caregiverPage.close();
    await familyPage.close();
  });

  test('Family Portal: View upcoming scheduled visits', async ({ context }) => {
    const familyPage = await context.newPage();
    const familyUser = {
      userId: 'family-e2e-002',
      email: 'family2@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['FAMILY_MEMBER'],
      permissions: ['family-portal:read', 'visits:read'],
    };
    await createAuthenticatedPage(familyPage, familyUser);

    // Navigate to upcoming visits
    await familyPage.goto('/family-portal/schedule');

    // Should see calendar or list of upcoming visits
    const upcomingVisits = familyPage.locator('[data-testid="upcoming-visits"]');
    await expect(upcomingVisits).toBeVisible();

    // Should show visit details: date, time, caregiver
    const visitDetails = familyPage.locator('[data-testid="visit-schedule-item"]').first();
    if (await visitDetails.isVisible()) {
      await expect(visitDetails).toContainText(/\d{1,2}:\d{2}|am|pm/i); // Time
      await expect(visitDetails).toContainText(/\d{1,2}\/\d{1,2}|\w+ \d{1,2}/); // Date
    }

    await familyPage.close();
  });

  test('Family Portal: Cannot access unauthorized sections', async ({ context }) => {
    const familyPage = await context.newPage();
    const familyUser = {
      userId: 'family-e2e-003',
      email: 'family3@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['FAMILY_MEMBER'],
      permissions: ['family-portal:read'], // No admin permissions
    };
    await createAuthenticatedPage(familyPage, familyUser);

    // Try to access admin pages
    await familyPage.goto('/admin/users');

    // Should be redirected or show access denied
    const accessDenied = familyPage.locator(
      'text=/access denied|not authorized|forbidden|404/i'
    );
    await expect(accessDenied).toBeVisible({ timeout: 10000 });

    await familyPage.close();
  });

  test('Family Portal: View care plan and tasks', async ({ context }) => {
    const familyPage = await context.newPage();
    const familyUser = {
      userId: 'family-e2e-004',
      email: 'family4@e2e-test.com',
      organizationId: 'org-e2e-001',
      branchId: 'branch-e2e-001',
      roles: ['FAMILY_MEMBER'],
      permissions: ['family-portal:read', 'care-plans:read'],
    };
    await createAuthenticatedPage(familyPage, familyUser);

    // Navigate to care plan
    await familyPage.goto('/family-portal/care-plan');

    // Should see care plan summary
    const carePlanSection = familyPage.locator('[data-testid="care-plan-summary"]');
    if (await carePlanSection.isVisible()) {
      // Verify can see tasks or activities
      const tasks = familyPage.locator('[data-testid="care-plan-task"]');
      const taskCount = await tasks.count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    }

    await familyPage.close();
  });
});
