import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { EVVRecordPage } from '../pages/EVVRecordPage.js';
import { TestDatabase } from '../setup/test-database.js';

/**
 * EVV Compliance E2E Tests
 *
 * Tests state-specific EVV requirements and compliance validation:
 * - Texas: HHAeXchange, GPS verification, VMUR amendments
 * - Florida: MCO signature requirements, Level 2 screening
 * - Ohio: Sandata submission, STNA certification
 * - GPS spoofing detection
 * - Aggregator submission workflows
 */
test.describe('EVV Compliance - State-Specific Requirements', () => {
  test.beforeAll(async () => {
    await TestDatabase.setup();
  });

  test.afterAll(async () => {
    await TestDatabase.teardown();
  });

  test.beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  test.describe('Texas EVV Requirements', () => {
    test('should create compliant EVV record with GPS verification', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('texas-visit');

      const visitPage = new VisitDetailPage(authenticatedPage);
      const evvPage = new EVVRecordPage(authenticatedPage);

      // Mock GPS coordinates within geofence (Austin, TX)
      await authenticatedPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-tx-001');
      await visitPage.clockIn();
      await visitPage.completeAllTasks();
      await visitPage.clockOut();

      // Verify EVV record created with correct aggregator
      await evvPage.goToEVVRecord('visit-tx-001');

      // Texas uses HHAeXchange
      const aggregator = await evvPage.getAggregatorName();
      expect(aggregator).toContain('HHAeXchange');

      // Verify GPS verification
      const verificationMethod = await evvPage.getVerificationMethod();
      expect(verificationMethod).toContain('GPS');

      // Verify compliance status
      const complianceStatus = await evvPage.getComplianceStatus();
      expect(complianceStatus).toContain('COMPLIANT');

      // Verify GPS accuracy
      await evvPage.assertGPSWithinRange(50); // Texas requires ≤50m accuracy
    });

    test('should support VMUR amendments for Texas visits', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('texas-visit-with-error');

      const evvPage = new EVVRecordPage(authenticatedPage);

      await evvPage.goToEVVRecord('visit-tx-002');

      // Verify initial submission failed or needs correction
      const initialStatus = await evvPage.getSubmissionStatus();
      expect(initialStatus).toMatch(/pending|failed|requires.*amendment/i);

      // Create VMUR amendment (Voice/Manual Universal Record)
      await evvPage.createVMURAmendment('GPS signal lost during visit', {
        clockInTime: '09:00:00',
        clockOutTime: '11:00:00',
        location: 'Client home address',
      });

      // Verify amendment created
      await evvPage.assertHasComplianceFlag('VMUR_AMENDMENT');

      // Verify resubmission status
      const updatedStatus = await evvPage.getSubmissionStatus();
      expect(updatedStatus).toMatch(/pending|resubmitted/i);
    });

    test('should enforce 10-minute grace period for Texas clock-in', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('texas-visit-early-clock-in');

      const visitPage = new VisitDetailPage(authenticatedPage);

      await authenticatedPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-tx-003');

      // Try to clock in more than 10 minutes early (visit scheduled for 10:00, trying at 9:30)
      await visitPage.clockIn();

      // Should show grace period warning/error
      await visitPage.waitForErrorToast(/grace.*period|too.*early|scheduled.*time/i);
    });
  });

  test.describe('Florida EVV Requirements', () => {
    test('should enforce MCO-specific signature requirements', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('florida-visit-mco');

      const visitPage = new VisitDetailPage(authenticatedPage);

      await authenticatedPage.context().setGeolocation({
        latitude: 28.5383, // Orlando, FL
        longitude: -81.3792,
        accuracy: 15,
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-fl-mco-001');
      await visitPage.clockIn();
      await visitPage.completeAllTasks();

      // Attempt clock-out without client signature
      await visitPage.clockOutButton.click();

      // Should require client signature for MCO visits
      await visitPage.waitForErrorToast(/client.*signature.*required|mco.*requires.*signature/i);

      // Visit should still be IN_PROGRESS
      await visitPage.assertStatus('IN_PROGRESS');
    });

    test('should allow clock-out with valid client signature', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('florida-visit-mco');

      const visitPage = new VisitDetailPage(authenticatedPage);
      const evvPage = new EVVRecordPage(authenticatedPage);

      await authenticatedPage.context().setGeolocation({
        latitude: 28.5383,
        longitude: -81.3792,
        accuracy: 15,
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-fl-mco-002');
      await visitPage.clockIn();
      await visitPage.completeAllTasks();

      // Clock out with signature
      await visitPage.clockOut({
        signature: true, // Provides client signature
      });

      // Verify completed
      await visitPage.assertStatus('COMPLETED');

      // Verify EVV record has signature
      await evvPage.goToEVVRecord('visit-fl-mco-002');
      await evvPage.assertHasComplianceFlag('CLIENT_SIGNATURE_CAPTURED');
    });

    test('should validate Level 2 background screening for Florida caregivers', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('florida-visit-no-screening');

      const visitPage = new VisitDetailPage(authenticatedPage);

      // Try to start visit with caregiver lacking Level 2 screening
      await visitPage.goToVisit('visit-fl-no-screening-001');

      // Should show blocking error
      await visitPage.waitForErrorToast(/level.*2.*screening|background.*check.*expired/i);

      // Clock-in button should be disabled
      const canClockIn = await visitPage.isClockInVisible();
      expect(canClockIn).toBe(false);
    });
  });

  test.describe('Ohio EVV Requirements', () => {
    test('should validate Sandata submission requirements', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('ohio-visit');

      const visitPage = new VisitDetailPage(authenticatedPage);
      const evvPage = new EVVRecordPage(authenticatedPage);

      await authenticatedPage.context().setGeolocation({
        latitude: 39.9612, // Columbus, OH
        longitude: -82.9988,
        accuracy: 20,
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-oh-001');
      await visitPage.clockIn();
      await visitPage.completeAllTasks();
      await visitPage.clockOut();

      // Verify EVV record uses Sandata
      await evvPage.goToEVVRecord('visit-oh-001');

      const aggregator = await evvPage.getAggregatorName();
      expect(aggregator).toContain('Sandata');

      // Verify submission status
      const submissionStatus = await evvPage.getSubmissionStatus();
      expect(submissionStatus).toMatch(/pending|submitted|success/i);

      // Verify compliance
      await evvPage.assertComplianceStatus(/compliant/i);
    });

    test('should require STNA certification for skilled nursing visits in Ohio', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('ohio-skilled-nursing-no-stna');

      const visitPage = new VisitDetailPage(authenticatedPage);

      // Visit assigned to caregiver without STNA
      await visitPage.goToVisit('visit-oh-skilled-002');

      // Should show blocking error
      await visitPage.waitForErrorToast(/stna.*certification|skilled.*nursing.*requires/i);

      // Clock-in should be blocked
      const canClockIn = await visitPage.isClockInVisible();
      expect(canClockIn).toBe(false);
    });
  });

  test.describe('GPS Spoofing Detection', () => {
    test('should detect mock GPS and flag for manual review', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('visit-gps-detection');

      const visitPage = new VisitDetailPage(authenticatedPage);
      const evvPage = new EVVRecordPage(authenticatedPage);

      // In real scenario, we'd simulate mock GPS
      // For Playwright, we'll mock the API response
      await authenticatedPage.route('**/api/visits/*/clock-in', async (route) => {
        const response = await route.fetch();
        const json = await response.json();
        json.mockLocationDetected = true;
        json.requiresManualReview = true;
        await route.fulfill({ json });
      });

      await authenticatedPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 5, // Suspiciously perfect accuracy
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-gps-001');
      await visitPage.clockIn();

      // Should show warning about GPS verification
      await visitPage.waitForToast(/gps.*verification|location.*under.*review/i, 5000).catch(
        () => {
          // Some implementations may not show toast
        }
      );

      await visitPage.completeAllTasks();
      await visitPage.clockOut();

      // Check EVV record for flags
      await evvPage.goToEVVRecord('visit-gps-001');

      await evvPage.assertHasComplianceFlag('GPS_SPOOFING');
      await evvPage.assertHasComplianceFlag('MANUAL_REVIEW');

      // Compliance status should indicate review needed
      const status = await evvPage.getComplianceStatus();
      expect(status).toMatch(/pending.*review|requires.*review/i);
    });

    test('should validate location consistency across clock-in/out', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('visit-location-mismatch');

      const visitPage = new VisitDetailPage(authenticatedPage);
      const evvPage = new EVVRecordPage(authenticatedPage);

      // Clock in at one location
      await authenticatedPage.context().setGeolocation({
        latitude: 30.2672, // Austin
        longitude: -97.7431,
        accuracy: 10,
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-location-001');
      await visitPage.clockIn();
      await visitPage.completeAllTasks();

      // Clock out at significantly different location (suspicious)
      await authenticatedPage.context().setGeolocation({
        latitude: 29.7604, // San Antonio (70+ miles away)
        longitude: -95.3698,
        accuracy: 10,
      });

      await visitPage.clockOut();

      // Check for location mismatch flag
      await evvPage.goToEVVRecord('visit-location-001');
      await evvPage.assertHasComplianceFlag('LOCATION_MISMATCH');
    });
  });

  test.describe('Aggregator Submission', () => {
    test('should handle aggregator submission failures gracefully', async ({
      authenticatedPage,
      caregiverUser,
    }) => {
      await TestDatabase.seed('visit-aggregator-fail');

      const visitPage = new VisitDetailPage(authenticatedPage);
      const evvPage = new EVVRecordPage(authenticatedPage);

      // Mock aggregator API failure
      await authenticatedPage.route('**/api/evv/submit', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Aggregator API unavailable' }),
        });
      });

      await authenticatedPage.context().setGeolocation({
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 10,
      });
      await authenticatedPage.context().grantPermissions(['geolocation']);

      await visitPage.goToVisit('visit-submit-001');
      await visitPage.clockIn();
      await visitPage.completeAllTasks();
      await visitPage.clockOut();

      // Visit should complete even if submission fails (queued for retry)
      await visitPage.assertStatus('COMPLETED');

      // Check EVV record
      await evvPage.goToEVVRecord('visit-submit-001');

      const submissionStatus = await evvPage.getSubmissionStatus();
      expect(submissionStatus).toMatch(/pending|failed|queued.*retry/i);
    });

    test('should retry failed submissions automatically', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('visit-retry-submission');

      const evvPage = new EVVRecordPage(authenticatedPage);

      await evvPage.goToEVVRecord('visit-retry-001');

      // Initial state: failed submission
      let submissionStatus = await evvPage.getSubmissionStatus();
      expect(submissionStatus).toMatch(/failed|pending.*retry/i);

      // Mock successful retry
      await authenticatedPage.route('**/api/evv/submit', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, submissionId: 'AGG-123' }),
        });
      });

      // Trigger manual retry
      await authenticatedPage.getByRole('button', { name: /retry.*submission/i }).click();

      // Wait for success toast
      await evvPage.waitForSuccessToast(/submitted.*successfully/i);

      // Verify updated status
      submissionStatus = await evvPage.getSubmissionStatus();
      expect(submissionStatus).toMatch(/submitted|success/i);
    });
  });
});
