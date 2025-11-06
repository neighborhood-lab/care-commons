import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { ScheduleVisitPage } from '../pages/ScheduleVisitPage.js';
import { TestDatabase } from '../setup/test-database.js';

/**
 * Error Handling and Edge Case Tests
 *
 * Tests system behavior under error conditions:
 * 1. Network Interruption
 * 2. Validation Errors
 * 3. Permission Errors
 * 4. Database Errors
 */
test.describe('Error Scenarios', () => {
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

  test('Network Interruption: should warn about unsaved changes when offline', async ({
    authenticatedPage,
  }) => {
    const schedulePage = new ScheduleVisitPage(authenticatedPage);

    await authenticatedPage.goto('/visits/schedule');

    // Start filling form
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');

    // Simulate network loss
    await authenticatedPage.context().setOffline(true);

    // Try to submit form
    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show network error
    const errorToast = authenticatedPage.locator('[role="alert"][data-type="error"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText(/network.*error|offline|connection.*failed/i);

    // Form data should still be present
    const clientInput = authenticatedPage.getByLabel('Client');
    await expect(clientInput).toHaveValue('John Doe');

    // Restore network
    await authenticatedPage.context().setOffline(false);

    // Wait a moment for connection to restore
    await authenticatedPage.waitForTimeout(1000);

    // Try submitting again - should succeed
    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show success message
    const successToast = authenticatedPage.locator('[role="alert"][data-type="success"]');
    await expect(successToast).toBeVisible({ timeout: 10000 });
  });

  test('Network Interruption: should queue data when offline and sync when online', async ({
    authenticatedPage,
    caregiverUser,
  }) => {
    const visitDetail = new VisitDetailPage(authenticatedPage);

    await authenticatedPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    await visitDetail.goToVisit('visit-001');
    await visitDetail.clockIn({ withGPS: true });

    // Go offline
    await authenticatedPage.context().setOffline(true);

    // Complete tasks while offline
    await visitDetail.completeTask('Assist with bathing');
    await visitDetail.completeTask('Medication reminder');

    // Should show "queued for sync" indicator
    const syncIndicator = authenticatedPage.locator('[data-testid="sync-status"]');
    await expect(syncIndicator).toContainText(/queued|pending.*sync|offline/i);

    // Add notes while offline
    await visitDetail.addNotes('Completed tasks offline');

    // Go back online
    await authenticatedPage.context().setOffline(false);

    // Should automatically sync
    await authenticatedPage.waitForTimeout(2000); // Allow sync to complete

    // Sync indicator should show success
    await expect(syncIndicator).toContainText(/synced|up.*to.*date|online/i, { timeout: 10000 });

    // Verify data persisted
    await authenticatedPage.reload();
    const taskStatus = await visitDetail.getCompletedTaskCount();
    expect(taskStatus).toBe(2);
  });

  test('Validation Errors: should show field-level errors for missing required fields', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Submit form without filling required fields
    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show validation errors
    const clientError = authenticatedPage.locator('[data-testid="client-error"]');
    await expect(clientError).toBeVisible();
    await expect(clientError).toContainText(/required|must.*select/i);

    const caregiverError = authenticatedPage.locator('[data-testid="caregiver-error"]');
    await expect(caregiverError).toBeVisible();
    await expect(caregiverError).toContainText(/required|must.*select/i);

    const dateError = authenticatedPage.locator('[data-testid="date-error"]');
    await expect(dateError).toBeVisible();

    // Verify form not submitted (still on same page)
    await expect(authenticatedPage).toHaveURL(/\/visits\/schedule/);

    // Fill in missing fields
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    // Submit again - should succeed
    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should redirect to visit list
    await expect(authenticatedPage).toHaveURL(/\/visits/, { timeout: 10000 });
  });

  test('Validation Errors: should validate date/time constraints', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Try to schedule visit in the past
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2020-01-01'); // Past date
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show date validation error
    const dateError = authenticatedPage.locator('[data-testid="date-error"]');
    await expect(dateError).toBeVisible();
    await expect(dateError).toContainText(/past|future|must.*be.*after/i);
  });

  test('Validation Errors: should validate duration and time constraints', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Try invalid duration (0 hours)
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('0');

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    const durationError = authenticatedPage.locator('[data-testid="duration-error"]');
    await expect(durationError).toBeVisible();
    await expect(durationError).toContainText(/greater than.*zero|must.*be.*positive/i);

    // Try excessive duration (25 hours)
    await authenticatedPage.getByLabel('Duration').fill('25');
    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    await expect(durationError).toBeVisible();
    await expect(durationError).toContainText(/maximum|too.*long|exceed/i);
  });

  test('Permission Errors: caregiver cannot access admin pages', async ({
    page,
    caregiverUser,
  }) => {
    // Set up caregiver session
    await page.goto('/');
    await page.evaluate(
      (token) => {
        localStorage.setItem('authToken', token as string);
      },
      caregiverUser.token
    );

    // Try to access admin-only page
    await page.goto('/admin/settings');

    // Should redirect to unauthorized page or home
    await expect(page).toHaveURL(/\/(unauthorized|403|home|visits)/i, { timeout: 5000 });

    // Or should show 403 error message
    const errorMessage = page.locator('[data-testid="error-message"], [role="alert"]');
    const isVisible = await errorMessage.isVisible().catch(() => false);

    if (isVisible) {
      await expect(errorMessage).toContainText(/unauthorized|permission.*denied|403/i);
    }
  });

  test('Permission Errors: caregiver cannot view other caregivers visits', async ({
    authenticatedPage,
    caregiverUser,
  }) => {
    const visitDetail = new VisitDetailPage(authenticatedPage);

    // Try to access visit assigned to another caregiver
    await authenticatedPage.goto('/visits/other-caregiver-visit-001');

    // Should show permission error
    const errorMessage = authenticatedPage.locator('[data-testid="error-message"], [role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/not authorized|permission denied|cannot.*access/i);

    // Or should redirect to visit list
    await expect(authenticatedPage).toHaveURL(/\/visits$|\/unauthorized/i, { timeout: 5000 });
  });

  test('Permission Errors: coordinator cannot modify completed/billed visits', async ({
    authenticatedPage,
    coordinatorUser,
  }) => {
    const visitDetail = new VisitDetailPage(authenticatedPage);

    // Navigate to a completed and billed visit
    await visitDetail.goToVisit('visit-billed-001');

    // Edit button should be disabled or hidden
    const editButton = authenticatedPage.getByRole('button', { name: 'Edit Visit' });
    const isDisabled = await editButton.isDisabled().catch(() => true);
    const isHidden = !(await editButton.isVisible().catch(() => false));

    expect(isDisabled || isHidden).toBe(true);

    // If edit button is visible, clicking should show error
    if (!isHidden && !isDisabled) {
      await editButton.click();
      const errorMessage = authenticatedPage.locator('[role="alert"][data-type="error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/billed|locked|cannot.*modify/i);
    }
  });

  test('Database Errors: should show graceful error message, not technical stack trace', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Fill valid form
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    // Intercept API call and return database error
    await authenticatedPage.route('**/api/visits', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR',
        }),
      });
    });

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show user-friendly error message
    const errorMessage = authenticatedPage.locator('[role="alert"][data-type="error"]');
    await expect(errorMessage).toBeVisible();

    // Should NOT contain technical details like stack traces
    const errorText = await errorMessage.textContent();
    expect(errorText).not.toContain('Error: ');
    expect(errorText).not.toContain('.ts:');
    expect(errorText).not.toContain('at ');
    expect(errorText).not.toContain('stack trace');

    // Should contain user-friendly message
    expect(errorText).toMatch(/try.*again|unable.*to.*save|something.*wrong/i);
  });

  test('Database Errors: should implement retry logic for transient failures', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    let attemptCount = 0;

    // Intercept API call - fail first 2 times, succeed on 3rd
    await authenticatedPage.route('**/api/visits', (route) => {
      attemptCount++;
      if (attemptCount < 3) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary database error' }),
        });
      } else {
        route.continue();
      }
    });

    // Page should automatically retry and eventually load
    await authenticatedPage.waitForSelector('[data-testid="visit-list"]', { timeout: 10000 });

    // Verify retry happened
    expect(attemptCount).toBeGreaterThanOrEqual(2);
  });

  test('API Errors: should handle 404 Not Found gracefully', async ({
    authenticatedPage,
  }) => {
    // Try to access non-existent visit
    await authenticatedPage.goto('/visits/non-existent-visit-999');

    // Should show 404 page or error message
    const notFoundMessage = authenticatedPage.locator(
      '[data-testid="not-found"], [data-testid="error-message"]'
    );
    await expect(notFoundMessage).toBeVisible();
    await expect(notFoundMessage).toContainText(/not found|does not exist|404/i);

    // Should have link to go back
    const backLink = authenticatedPage.getByRole('link', { name: /back|return|home|visits/i });
    await expect(backLink).toBeVisible();
  });

  test('Form Errors: should prevent double-submission', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Fill form
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    // Slow down API response
    await authenticatedPage.route('**/api/visits', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.continue();
    });

    const submitButton = authenticatedPage.getByRole('button', { name: 'Schedule Visit' });

    // Click submit
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();

    // Should show loading indicator
    const loadingIndicator = authenticatedPage.locator('[data-testid="loading"], .spinner');
    await expect(loadingIndicator).toBeVisible();

    // Try clicking again - should not trigger duplicate submission
    await submitButton.click({ force: true }).catch(() => {});

    // Wait for submission to complete
    await authenticatedPage.waitForURL(/\/visits/, { timeout: 10000 });

    // Verify only one visit was created (not duplicated)
    // This would be verified by checking the database or visit count
  });
});
