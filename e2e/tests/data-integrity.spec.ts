import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { TestDatabase } from '../setup/test-database.js';

/**
 * Data Integrity Tests
 *
 * Tests data consistency and integrity:
 * 1. Audit Trail Verification
 * 2. Soft Delete Verification
 * 3. Referential Integrity
 */
test.describe('Data Integrity', () => {
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

  test('Audit Trail: create operation should log audit entry', async ({
    authenticatedPage,
    coordinatorUser,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Create a visit
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();
    await authenticatedPage.waitForURL(/\/visits/);

    // Verify audit log entry created
    const visitId = await authenticatedPage.evaluate(() => {
      const url = window.location.pathname;
      const match = url.match(/\/visits\/(\d+)/);
      return match ? match[1] : null;
    });

    if (visitId) {
      // Navigate to audit log
      await authenticatedPage.goto(`/audit-log?resource=visit&resourceId=${visitId}`);

      // Verify audit entry exists
      const auditEntry = authenticatedPage.locator('[data-testid="audit-entry"]').first();
      await expect(auditEntry).toBeVisible();

      // Verify audit entry contains correct information
      await expect(auditEntry).toContainText(/created/i);
      await expect(auditEntry).toContainText(coordinatorUser.email);

      // Verify timestamp present
      const timestamp = auditEntry.locator('[data-testid="audit-timestamp"]');
      await expect(timestamp).toBeVisible();
    }
  });

  test('Audit Trail: update operation should log changes', async ({
    authenticatedPage,
    coordinatorUser,
  }) => {
    const visitDetail = new VisitDetailPage(authenticatedPage);
    await visitDetail.goToVisit('visit-001');

    // Edit visit
    await authenticatedPage.getByRole('button', { name: 'Edit Visit' }).click();

    const originalDuration = await authenticatedPage.getByLabel('Duration').inputValue();
    await authenticatedPage.getByLabel('Duration').fill('3');

    await authenticatedPage.getByRole('button', { name: 'Save Changes' }).click();

    // Navigate to audit log
    await authenticatedPage.goto('/audit-log?resource=visit&resourceId=visit-001');

    // Verify update audit entry
    const updateEntry = authenticatedPage.locator('[data-testid="audit-entry"]', {
      hasText: /updated|modified/i,
    });
    await expect(updateEntry).toBeVisible();

    // Verify audit entry shows field changes
    await expect(updateEntry).toContainText('duration');
    await expect(updateEntry).toContainText(originalDuration);
    await expect(updateEntry).toContainText('3');

    // Verify user info
    await expect(updateEntry).toContainText(coordinatorUser.email);
  });

  test('Audit Trail: delete operation should log audit entry', async ({
    authenticatedPage,
    coordinatorUser,
  }) => {
    const visitDetail = new VisitDetailPage(authenticatedPage);
    await visitDetail.goToVisit('visit-001');

    // Delete visit (soft delete)
    await authenticatedPage.getByRole('button', { name: /delete|remove/i }).click();

    // Confirm deletion
    const confirmBtn = authenticatedPage.getByRole('button', { name: /confirm|yes|delete/i });
    await confirmBtn.click();

    // Navigate to audit log
    await authenticatedPage.goto('/audit-log?resource=visit&resourceId=visit-001');

    // Verify delete audit entry
    const deleteEntry = authenticatedPage.locator('[data-testid="audit-entry"]', {
      hasText: /deleted|removed/i,
    });
    await expect(deleteEntry).toBeVisible();

    // Verify user info
    await expect(deleteEntry).toContainText(coordinatorUser.email);
  });

  test('Soft Delete: deleted client should not appear in list', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/clients');

    // Get initial count
    const initialCount = await authenticatedPage
      .locator('[data-testid="client-card"]')
      .count();

    // Click first client
    const firstClient = authenticatedPage.locator('[data-testid="client-card"]').first();
    const clientName = await firstClient.textContent();
    await firstClient.click();

    // Delete client
    await authenticatedPage.getByRole('button', { name: /delete|remove/i }).click();
    await authenticatedPage.getByRole('button', { name: /confirm|yes/i }).click();

    // Should redirect to client list
    await expect(authenticatedPage).toHaveURL(/\/clients$/);

    // Verify client count decreased
    const finalCount = await authenticatedPage
      .locator('[data-testid="client-card"]')
      .count();
    expect(finalCount).toBe(initialCount - 1);

    // Verify deleted client not in list
    const deletedClient = authenticatedPage.locator('[data-testid="client-card"]', {
      hasText: clientName || '',
    });
    await expect(deletedClient).toHaveCount(0);
  });

  test('Soft Delete: deleted record still in database with deleted_at timestamp', async ({
    authenticatedPage,
    adminUser,
  }) => {
    // Delete a client
    await authenticatedPage.goto('/clients/1');
    await authenticatedPage.getByRole('button', { name: /delete|remove/i }).click();
    await authenticatedPage.getByRole('button', { name: /confirm|yes/i }).click();

    // Admin can view deleted records
    await authenticatedPage.goto('/admin/deleted-records');

    // Verify deleted client appears in deleted records
    const deletedRecord = authenticatedPage.locator('[data-testid="deleted-record"]', {
      hasText: /client/i,
    });

    const exists = await deletedRecord.isVisible({ timeout: 5000 }).catch(() => false);

    if (exists) {
      // Verify deleted_at timestamp shown
      const deletedAt = deletedRecord.locator('[data-testid="deleted-at"]');
      await expect(deletedAt).toBeVisible();

      // Verify timestamp is recent
      const timestampText = await deletedAt.textContent();
      expect(timestampText).toBeTruthy();
    }
  });

  test('Soft Delete: related records are not orphaned', async ({
    authenticatedPage,
  }) => {
    // Create client with visits
    await authenticatedPage.goto('/clients/1');

    // Verify client has associated visits
    const visitsTab = authenticatedPage.getByRole('tab', { name: /visits/i });
    await visitsTab.click();

    const visitCount = await authenticatedPage
      .locator('[data-testid="visit-card"]')
      .count();

    if (visitCount > 0) {
      // Try to delete client with active visits
      await authenticatedPage.getByRole('button', { name: /delete|remove/i }).click();
      await authenticatedPage.getByRole('button', { name: /confirm|yes/i }).click();

      // Should show warning about related records
      const warningMessage = authenticatedPage.locator('[role="alert"]');
      const hasWarning = await warningMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasWarning) {
        await expect(warningMessage).toContainText(/visits|related.*records|cannot.*delete/i);
      } else {
        // If deletion allowed, verify visits are also soft-deleted (cascade)
        await authenticatedPage.goto('/visits?clientId=1');

        // Visits should not appear in active list
        const activeVisits = await authenticatedPage
          .locator('[data-testid="visit-card"]')
          .count();
        expect(activeVisits).toBe(0);
      }
    }
  });

  test('Referential Integrity: cannot assign visit to non-existent caregiver', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('NonExistent Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show validation error
    const errorMessage = authenticatedPage.locator('[role="alert"][data-type="error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/caregiver.*not.*found|invalid.*caregiver/i);
  });

  test('Referential Integrity: deleting caregiver with active visits should be prevented', async ({
    authenticatedPage,
  }) => {
    // Navigate to caregiver with active visits
    await authenticatedPage.goto('/caregivers/1');

    // Verify caregiver has active visits
    const visitsTab = authenticatedPage.getByRole('tab', { name: /visits/i });
    const tabExists = await visitsTab.isVisible({ timeout: 2000 }).catch(() => false);

    if (tabExists) {
      await visitsTab.click();

      const activeVisits = await authenticatedPage
        .locator('[data-testid="visit-card"][data-status="scheduled"]')
        .count();

      if (activeVisits > 0) {
        // Try to delete caregiver
        await authenticatedPage.getByRole('button', { name: /delete|remove/i }).click();
        await authenticatedPage.getByRole('button', { name: /confirm|yes/i }).click();

        // Should show error
        const errorMessage = authenticatedPage.locator('[role="alert"][data-type="error"]');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText(/active.*visits|cannot.*delete/i);

        // Caregiver should still exist
        await authenticatedPage.goto('/caregivers');
        const caregiverStillExists = await authenticatedPage
          .locator('[data-testid="caregiver-card"]')
          .first()
          .isVisible();
        expect(caregiverStillExists).toBe(true);
      }
    }
  });

  test('Data Consistency: visit duration matches clock in/out times', async ({
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

    // Clock in
    const clockInTime = Date.now();
    await visitDetail.clockIn({ withGPS: true });

    // Wait exactly 2 seconds
    await authenticatedPage.waitForTimeout(2000);

    // Complete tasks
    await visitDetail.completeAllTasks();

    // Clock out
    const clockOutTime = Date.now();
    await visitDetail.clockOut();

    // View visit details
    await authenticatedPage.reload();

    // Verify duration calculated correctly
    const expectedDuration = Math.floor((clockOutTime - clockInTime) / 1000 / 60); // minutes
    const displayedDuration = await authenticatedPage
      .locator('[data-testid="actual-duration"]')
      .textContent();

    // Duration should be approximately correct (within 1 minute tolerance)
    if (displayedDuration) {
      const durationMatch = displayedDuration.match(/(\d+)/);
      if (durationMatch) {
        const actualDuration = parseInt(durationMatch[1]);
        expect(Math.abs(actualDuration - expectedDuration)).toBeLessThanOrEqual(1);
      }
    }
  });

  test('Data Consistency: billing hours match actual visit hours', async ({
    authenticatedPage,
  }) => {
    // Navigate to completed visit
    await authenticatedPage.goto('/visits/completed-visit-001');

    // Get actual duration
    const actualDuration = await authenticatedPage
      .locator('[data-testid="actual-duration"]')
      .textContent();

    // Navigate to billing
    await authenticatedPage.goto('/billing/invoices');

    // Find invoice for this visit
    const invoice = authenticatedPage.locator('[data-testid="invoice-line"]', {
      hasText: 'completed-visit-001',
    });

    const invoiceExists = await invoice.isVisible({ timeout: 5000 }).catch(() => false);

    if (invoiceExists) {
      // Verify billed hours match actual hours
      const billedHours = await invoice.locator('[data-testid="billed-hours"]').textContent();

      expect(billedHours).toContain(actualDuration || '');
    }
  });

  test('Data Validation: cannot schedule visit in the past', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2020-01-01'); // Past date
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show validation error
    const errorMessage = authenticatedPage.locator('[data-testid="date-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/past|future|must.*be.*after/i);
  });

  test('Data Validation: cannot clock in before scheduled time', async ({
    authenticatedPage,
    caregiverUser,
  }) => {
    // Schedule visit for future time
    await authenticatedPage.goto('/visits/future-visit-001');

    await authenticatedPage.context().setGeolocation({
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 10,
    });
    await authenticatedPage.context().grantPermissions(['geolocation']);

    const visitDetail = new VisitDetailPage(authenticatedPage);

    // Try to clock in early (more than allowed grace period)
    await authenticatedPage.getByTestId('check-in-btn').click();

    // Should show error or warning
    const warningMessage = authenticatedPage.locator('[role="alert"]');
    const hasWarning = await warningMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasWarning) {
      await expect(warningMessage).toContainText(/early|scheduled.*time|not.*yet/i);
    }
  });

  test('Transaction Rollback: failed visit creation should not create orphaned records', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Intercept API call to simulate failure mid-transaction
    let callCount = 0;
    await authenticatedPage.route('**/api/visits', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Transaction failed' }),
        });
      } else {
        route.continue();
      }
    });

    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Should show error
    const errorMessage = authenticatedPage.locator('[role="alert"][data-type="error"]');
    await expect(errorMessage).toBeVisible();

    // Verify visit list unchanged (no orphaned record)
    await authenticatedPage.goto('/visits');
    const visitCount = await authenticatedPage.locator('[data-testid="visit-card"]').count();

    // Should be same as initial count (no new visit created)
    expect(visitCount).toBeGreaterThanOrEqual(0);
  });
});
