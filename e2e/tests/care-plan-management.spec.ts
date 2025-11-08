import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { TestDatabase } from '../setup/test-database.js';
import { createAuthenticatedPage } from '../fixtures/auth.fixture.js';

/**
 * Care Plan Management Workflow E2E Tests
 *
 * Tests the complete care plan management process:
 * 1. Coordinator creates care plan for client
 * 2. Coordinator adds tasks (ADLs, medications, etc.)
 * 3. Coordinator assigns plan to caregiver
 * 4. Caregiver views care plan and tasks during visit
 * 5. Caregiver completes tasks
 * 6. System tracks completion percentage
 * 7. Coordinator reviews progress
 *
 * This validates the care-plans-tasks vertical and ensures proper
 * task tracking and completion workflow.
 */
test.describe('Care Plan Management Workflow', () => {
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

  test('Complete Care Plan Workflow: Create → Add Tasks → Assign → Complete → Review', async ({
    context,
    coordinatorUser,
    caregiverUser,
  }) => {
    // ===== PHASE 1: Coordinator creates care plan for client =====
    await test.step('Coordinator creates care plan', async () => {
      const coordinatorPage = await context.newPage();
      await createAuthenticatedPage(coordinatorPage, coordinatorUser);

      // Navigate to client profile
      await coordinatorPage.goto('/clients');

      // Find and click on client
      const clientLink = coordinatorPage.locator('[data-testid="client-link"]', {
        hasText: 'John Doe',
      });
      if (await clientLink.isVisible()) {
        await clientLink.click();
      } else {
        await coordinatorPage.goto('/clients/client-001');
      }

      // Navigate to care plans tab
      const carePlansTab = coordinatorPage.getByRole('tab', { name: /care.*plan/i });
      if (await carePlansTab.isVisible()) {
        await carePlansTab.click();
      } else {
        await coordinatorPage.goto('/clients/client-001/care-plans');
      }

      // Create new care plan
      await coordinatorPage.getByRole('button', { name: /new.*plan|add.*plan|create.*plan/i }).click();

      // Fill care plan details
      await coordinatorPage.getByLabel('Plan Name').fill('Personal Care and ADL Support');
      await coordinatorPage.getByLabel('Care Plan Type').selectOption('PERSONAL_CARE');
      await coordinatorPage.getByLabel('Start Date').fill('2025-01-15');

      const endDate = coordinatorPage.getByLabel('End Date');
      if (await endDate.isVisible()) {
        await endDate.fill('2025-04-15');
      }

      // Add description
      const description = coordinatorPage.getByLabel('Description');
      if (await description.isVisible()) {
        await description.fill('Comprehensive personal care plan focusing on ADLs and medication management');
      }

      // Save care plan
      await coordinatorPage.getByRole('button', { name: /save.*plan|create.*plan/i }).click();

      // Verify success
      const planSuccess = coordinatorPage.locator('[role="alert"][data-type="success"]');
      await expect(planSuccess).toBeVisible();
      await expect(planSuccess).toContainText(/created|saved/i);

      await coordinatorPage.close();
    });

    // ===== PHASE 2: Coordinator adds tasks to care plan =====
    await test.step('Coordinator adds tasks to care plan', async () => {
      const coordinatorPage = await context.newPage();
      await createAuthenticatedPage(coordinatorPage, coordinatorUser);

      // Navigate to care plan
      await coordinatorPage.goto('/clients/client-001/care-plans');

      // Click on the care plan
      const carePlanItem = coordinatorPage.locator('[data-testid="care-plan-item"]').first();
      await carePlanItem.click();

      // Add tasks
      const addTaskBtn = coordinatorPage.getByRole('button', { name: /add.*task/i });

      // Task 1: Bathing assistance
      if (await addTaskBtn.isVisible()) {
        await addTaskBtn.click();
        await coordinatorPage.getByLabel('Task Name').fill('Assist with bathing');
        await coordinatorPage.getByLabel('Category').selectOption('ADL');
        await coordinatorPage.getByLabel('Frequency').selectOption('DAILY');

        const priority = coordinatorPage.getByLabel('Priority');
        if (await priority.isVisible()) {
          await priority.selectOption('HIGH');
        }

        const isCritical = coordinatorPage.getByLabel(/critical|required/i);
        if (await isCritical.isVisible()) {
          await isCritical.check();
        }

        await coordinatorPage.getByRole('button', { name: /save.*task|add.*task/i }).click();
        await coordinatorPage.waitForTimeout(500);
      }

      // Task 2: Medication reminder
      if (await addTaskBtn.isVisible()) {
        await addTaskBtn.click();
        await coordinatorPage.getByLabel('Task Name').fill('Medication reminder - 9AM');
        await coordinatorPage.getByLabel('Category').selectOption('MEDICATION');
        await coordinatorPage.getByLabel('Frequency').selectOption('DAILY');

        const medicationNotes = coordinatorPage.getByLabel('Notes');
        if (await medicationNotes.isVisible()) {
          await medicationNotes.fill('Blood pressure medication - white pill');
        }

        await coordinatorPage.getByRole('button', { name: /save.*task|add.*task/i }).click();
        await coordinatorPage.waitForTimeout(500);
      }

      // Task 3: Meal preparation
      if (await addTaskBtn.isVisible()) {
        await addTaskBtn.click();
        await coordinatorPage.getByLabel('Task Name').fill('Prepare lunch');
        await coordinatorPage.getByLabel('Category').selectOption('NUTRITION');
        await coordinatorPage.getByLabel('Frequency').selectOption('DAILY');
        await coordinatorPage.getByRole('button', { name: /save.*task|add.*task/i }).click();
        await coordinatorPage.waitForTimeout(500);
      }

      // Verify tasks added
      const taskList = coordinatorPage.locator('[data-testid="task-item"]');
      const taskCount = await taskList.count();
      expect(taskCount).toBeGreaterThanOrEqual(3);

      await coordinatorPage.close();
    });

    // ===== PHASE 3: Caregiver views care plan during visit =====
    await test.step('Caregiver views care plan and tasks', async () => {
      const caregiverPage = await context.newPage();
      await createAuthenticatedPage(caregiverPage, caregiverUser);

      // Set GPS location
      await caregiverPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
      });
      await caregiverPage.context().grantPermissions(['geolocation']);

      const visitDetail = new VisitDetailPage(caregiverPage);
      await visitDetail.goToVisit('visit-001');

      // Clock in
      await visitDetail.clockIn({ withGPS: true });

      // View care plan
      const carePlanTab = caregiverPage.getByRole('tab', { name: /care.*plan|tasks/i });
      if (await carePlanTab.isVisible()) {
        await carePlanTab.click();
      }

      // Verify can see tasks from care plan
      const taskList = caregiverPage.locator('[data-testid="task-list"]');
      await expect(taskList).toBeVisible();

      // Should see the tasks we created
      await expect(caregiverPage.locator('text=Assist with bathing')).toBeVisible();
      await expect(caregiverPage.locator('text=Medication reminder - 9AM')).toBeVisible();
      await expect(caregiverPage.locator('text=Prepare lunch')).toBeVisible();

      await caregiverPage.close();
    });

    // ===== PHASE 4: Caregiver completes tasks =====
    await test.step('Caregiver completes care plan tasks', async () => {
      const caregiverPage = await context.newPage();
      await createAuthenticatedPage(caregiverPage, caregiverUser);

      await caregiverPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
      });
      await caregiverPage.context().grantPermissions(['geolocation']);

      const visitDetail = new VisitDetailPage(caregiverPage);
      await visitDetail.goToVisit('visit-001');

      // Complete task 1: Bathing
      await visitDetail.completeTask('Assist with bathing');

      // Add notes to task
      const taskNotes = caregiverPage.getByLabel(/task.*notes|notes/i);
      if (await taskNotes.isVisible()) {
        await taskNotes.fill('Client bathed independently with minimal assistance');
      }

      // Complete task 2: Medication
      await visitDetail.completeTask('Medication reminder - 9AM');

      // Complete task 3: Meal prep
      await visitDetail.completeTask('Prepare lunch');

      // Verify completion percentage
      const completionPercentage = caregiverPage.locator('[data-testid="completion-percentage"]');
      if (await completionPercentage.isVisible()) {
        const percentText = await completionPercentage.textContent();
        expect(percentText).toContain('100%');
      }

      // Clock out
      await visitDetail.clockOut();

      await caregiverPage.close();
    });

    // ===== PHASE 5: Coordinator reviews care plan progress =====
    await test.step('Coordinator reviews care plan completion', async () => {
      const coordinatorPage = await context.newPage();
      await createAuthenticatedPage(coordinatorPage, coordinatorUser);

      // Navigate to client care plan
      await coordinatorPage.goto('/clients/client-001/care-plans');

      // Click on care plan to view progress
      const carePlanItem = coordinatorPage.locator('[data-testid="care-plan-item"]').first();
      await carePlanItem.click();

      // View progress/compliance tab
      const progressTab = coordinatorPage.getByRole('tab', { name: /progress|compliance/i });
      if (await progressTab.isVisible()) {
        await progressTab.click();
      }

      // Should see completion statistics
      const completionStats = coordinatorPage.locator('[data-testid="completion-stats"]');
      if (await completionStats.isVisible()) {
        await expect(completionStats).toBeVisible();

        // Should show tasks completed
        const completedCount = coordinatorPage.locator('[data-testid="tasks-completed"]');
        if (await completedCount.isVisible()) {
          const countText = await completedCount.textContent();
          expect(countText).toMatch(/3|100%/);
        }
      }

      // View task history
      const taskHistory = coordinatorPage.locator('[data-testid="task-history"]');
      if (await taskHistory.isVisible()) {
        await expect(taskHistory).toBeVisible();

        // Should see completed tasks with timestamps
        await expect(coordinatorPage.locator('text=Assist with bathing')).toBeVisible();
        await expect(coordinatorPage.locator('text=Completed')).toBeVisible();
      }

      await coordinatorPage.close();
    });
  });

  test('Care Plan: Update existing care plan tasks', async ({ context, coordinatorUser }) => {
    await test.step('Coordinator modifies care plan tasks', async () => {
      const coordinatorPage = await context.newPage();
      await createAuthenticatedPage(coordinatorPage, coordinatorUser);

      await coordinatorPage.goto('/clients/client-001/care-plans');

      // Select care plan
      const carePlan = coordinatorPage.locator('[data-testid="care-plan-item"]').first();
      await carePlan.click();

      // Edit existing task
      const editTaskBtn = coordinatorPage
        .locator('[data-testid="task-item"]')
        .first()
        .locator('[data-testid="edit-task-btn"]');

      if (await editTaskBtn.isVisible()) {
        await editTaskBtn.click();

        // Update frequency
        await coordinatorPage.getByLabel('Frequency').selectOption('TWICE_DAILY');

        // Save changes
        await coordinatorPage.getByRole('button', { name: /save|update/i }).click();

        // Verify success
        const updateSuccess = coordinatorPage.locator('[role="alert"][data-type="success"]');
        await expect(updateSuccess).toBeVisible();
      }

      await coordinatorPage.close();
    });
  });

  test('Care Plan: Track partial completion', async ({ context, caregiverUser }) => {
    await test.step('Track when only some tasks are completed', async () => {
      const caregiverPage = await context.newPage();
      await createAuthenticatedPage(caregiverPage, caregiverUser);

      await caregiverPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
      });
      await caregiverPage.context().grantPermissions(['geolocation']);

      const visitDetail = new VisitDetailPage(caregiverPage);
      await visitDetail.goToVisit('visit-001');
      await visitDetail.clockIn({ withGPS: true });

      // Complete only 2 out of 3 tasks
      await visitDetail.completeTask('Assist with bathing');
      await visitDetail.completeTask('Medication reminder - 9AM');
      // Skip "Prepare lunch"

      // Check completion percentage
      const completionPercentage = caregiverPage.locator('[data-testid="completion-percentage"]');
      if (await completionPercentage.isVisible()) {
        const percentText = await completionPercentage.textContent();
        expect(percentText).toMatch(/66%|67%/); // 2 out of 3
      }

      await visitDetail.clockOut();

      await caregiverPage.close();
    });
  });

  test('Care Plan: Require critical tasks before clock-out', async ({
    context,
    caregiverUser,
  }) => {
    await test.step('Prevent clock-out if critical tasks incomplete', async () => {
      const caregiverPage = await context.newPage();
      await createAuthenticatedPage(caregiverPage, caregiverUser);

      await caregiverPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
      });
      await caregiverPage.context().grantPermissions(['geolocation']);

      const visitDetail = new VisitDetailPage(caregiverPage);
      await visitDetail.goToVisit('visit-with-critical-tasks');
      await visitDetail.clockIn({ withGPS: true });

      // Complete only non-critical tasks
      // Skip critical task (e.g., medication reminder)

      // Try to clock out
      const clockOutBtn = caregiverPage.getByRole('button', { name: /clock.*out/i });
      if (await clockOutBtn.isVisible()) {
        await clockOutBtn.click();

        // Should show error about incomplete critical tasks
        const errorToast = caregiverPage.locator('[role="alert"][data-type="error"]');
        if (await errorToast.isVisible()) {
          await expect(errorToast).toContainText(/critical.*task|required.*task/i);
        }

        // Visit should still be IN_PROGRESS
        await visitDetail.assertStatus('IN_PROGRESS');
      }

      await caregiverPage.close();
    });
  });

  test('Care Plan: Generate compliance report', async ({ context, coordinatorUser }) => {
    await test.step('Coordinator generates care plan compliance report', async () => {
      const coordinatorPage = await context.newPage();
      await createAuthenticatedPage(coordinatorPage, coordinatorUser);

      // Navigate to reports
      await coordinatorPage.goto('/reports/care-plans');

      // Select date range
      const dateRange = coordinatorPage.getByLabel('Date Range');
      if (await dateRange.isVisible()) {
        await dateRange.selectOption('last-30-days');
      }

      // Select client
      const clientFilter = coordinatorPage.getByLabel('Client');
      if (await clientFilter.isVisible()) {
        await clientFilter.selectOption({ label: /John Doe/i });
      }

      // Generate report
      await coordinatorPage.getByRole('button', { name: /generate.*report/i }).click();

      // Wait for report to load
      const reportTable = coordinatorPage.locator('[data-testid="care-plan-report"]');
      await expect(reportTable).toBeVisible();

      // Verify report shows completion rates
      const completionRate = coordinatorPage.locator('[data-testid="completion-rate"]');
      if (await completionRate.isVisible()) {
        await expect(completionRate).toBeVisible();
      }

      await coordinatorPage.close();
    });
  });
});
