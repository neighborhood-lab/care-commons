import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitListPage } from '../pages/VisitListPage.js';
import { VisitDetailPage } from '../pages/VisitDetailPage.js';
import { CaregiverSelectionModal } from '../pages/CaregiverSelectionModal.js';
import { TestDatabase } from '../setup/test-database.js';

/**
 * Caregiver Assignment E2E Tests
 *
 * Tests multi-state caregiver assignment with validation:
 * - Credential verification
 * - Background check validation
 * - State-specific certification requirements
 * - Skill matching
 * - Availability checking
 * - Travel time calculation
 */
test.describe('Caregiver Assignment - Multi-State Validation', () => {
  test.beforeAll(async () => {
    await TestDatabase.setup();
  });

  test.afterAll(async () => {
    await TestDatabase.teardown();
  });

  test.beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  test.describe('Texas Assignment Requirements', () => {
    test('should block assignment if caregiver lacks EMR clearance', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('texas-caregiver-no-emr');

      const visitListPage = new VisitListPage(authenticatedPage);
      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitListPage.goToVisitList();
      await visitListPage.filterByStatus('SCHEDULED');
      await visitListPage.clickVisit('Jane Smith - Unassigned');

      // Open caregiver selection modal
      await caregiverModal.openModal();
      await caregiverModal.assertModalVisible();

      // Attempt to assign caregiver without EMR check
      await caregiverModal.selectCaregiver('John Caregiver');

      // Should show blocking error
      await caregiverModal.assertErrorShown(/employee.*misconduct.*registry|emr.*check/i);

      // Verify error mentions Texas statute
      const errorText = await caregiverModal.getErrorMessageText();
      expect(errorText).toMatch(/26 TAC.*558\.353|texas.*administrative.*code/i);

      // Assignment button should be disabled
      await caregiverModal.assertCannotAssign();
    });

    test('should allow assignment with valid EMR clearance', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('texas-caregiver-valid-emr');

      const visitListPage = new VisitListPage(authenticatedPage);
      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitListPage.goToVisitList();
      await visitListPage.clickVisit('Bob Johnson - Unassigned');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('Mary Caregiver');

      // Verify compliance indicators
      const compliance = await caregiverModal.getCaregiverCompliance('Mary Caregiver');
      expect(compliance.backgroundCheck).toMatch(/cleared|valid|compliant/i);

      // Should allow assignment
      await caregiverModal.assertCanAssign();
      await caregiverModal.confirmAssignment();

      // Verify assignment succeeded
      await visitDetailPage.waitForSuccessToast(/assigned/i);
      const caregiverName = await visitDetailPage.getCaregiverName();
      expect(caregiverName).toContain('Mary Caregiver');
    });
  });

  test.describe('Florida Assignment Requirements', () => {
    test('should require Level 2 background screening', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('florida-caregiver-no-level2');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-fl-unassigned-001');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('Tom Caregiver');

      // Should show blocking error
      await caregiverModal.assertErrorShown(/level.*2.*screening|background.*screening.*expired/i);

      // Verify error mentions Florida statute
      const errorText = await caregiverModal.getErrorMessageText();
      expect(errorText).toMatch(/florida.*statute|f\.s\.|435\.04/i);

      await caregiverModal.assertCannotAssign();
    });

    test('should allow assignment with valid Level 2 screening', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('florida-caregiver-valid-screening');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-fl-unassigned-002');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('Sarah Caregiver');

      // Verify valid Level 2 screening
      const compliance = await caregiverModal.getCaregiverCompliance('Sarah Caregiver');
      expect(compliance.backgroundCheck).toMatch(/level.*2|cleared|valid/i);

      await caregiverModal.confirmAssignment();
      await visitDetailPage.waitForSuccessToast(/assigned/i);
    });
  });

  test.describe('Ohio Assignment Requirements', () => {
    test('should require STNA certification for skilled nursing visits', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('ohio-skilled-nursing-assignment');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-oh-skilled-unassigned-001');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('Non-STNA Caregiver');

      // Should show blocking error
      await caregiverModal.assertErrorShown(/stna.*certification|state.*tested.*nursing.*aide/i);

      // Verify error mentions Ohio regulation
      const errorText = await caregiverModal.getErrorMessageText();
      expect(errorText).toMatch(/oac.*4723-27|ohio.*administrative.*code/i);

      await caregiverModal.assertCannotAssign();
    });

    test('should allow assignment with valid STNA certification', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('ohio-skilled-nursing-assignment');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-oh-skilled-unassigned-002');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('STNA-Certified Caregiver');

      // Verify STNA certification
      const hasSTNA = await caregiverModal.hasCredential('STNA-Certified Caregiver', 'STNA');
      expect(hasSTNA).toBe(true);

      await caregiverModal.confirmAssignment();
      await visitDetailPage.waitForSuccessToast(/assigned/i);
    });

    test('should allow personal care with HHA certification (no STNA required)', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('ohio-personal-care-assignment');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-oh-personal-care-001');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('HHA Caregiver'); // Has HHA, not STNA

      // Should allow assignment (personal care doesn't require STNA)
      await caregiverModal.assertCanAssign();
      await caregiverModal.confirmAssignment();
      await visitDetailPage.waitForSuccessToast(/assigned/i);
    });
  });

  test.describe('Pennsylvania Assignment Requirements', () => {
    test('should warn about expiring credentials within 30 days', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('pennsylvania-expiring-credentials');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-pa-unassigned-001');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('Sarah Caregiver');

      // Should show non-blocking warning
      await caregiverModal.assertWarningShown(/credential.*expiring|expires.*soon|15.*days/i);

      // Verify warning mentions specific credential
      const warningText = await caregiverModal.getWarningMessageText();
      expect(warningText).toMatch(/bci.*background.*check|background.*check.*expires/i);

      // But should still allow assignment
      await caregiverModal.assertCanAssign();
      await caregiverModal.confirmAssignment();
      await visitDetailPage.waitForSuccessToast(/assigned/i);
    });
  });

  test.describe('Skill Matching', () => {
    test('should match caregiver skills to visit requirements', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('skill-matching');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      // Visit requires "Medication Administration" skill
      await visitDetailPage.goToVisit('visit-requires-med-admin');

      await caregiverModal.openModal();

      // Caregiver without skill should show warning or be filtered
      await caregiverModal.searchCaregiver('Basic Caregiver');
      const countWithoutSkill = await caregiverModal.getCaregiverCount();
      expect(countWithoutSkill).toBe(0); // Filtered out

      // Caregiver with skill should be visible
      await caregiverModal.clearSearch();
      await caregiverModal.searchCaregiver('Advanced Caregiver');
      const countWithSkill = await caregiverModal.getCaregiverCount();
      expect(countWithSkill).toBeGreaterThan(0);

      // Verify credential badge
      const hasSkill = await caregiverModal.hasCredential('Advanced Caregiver', 'Medication');
      expect(hasSkill).toBe(true);
    });

    test('should allow assignment override for skill mismatch with warning', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('skill-mismatch-override');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-requires-specialized-skill');

      await caregiverModal.openModal();

      // Enable "Show all caregivers" override
      await authenticatedPage.getByLabel(/show.*all.*caregivers|include.*unqualified/i).check();

      await caregiverModal.selectCaregiver('Partially Qualified Caregiver');

      // Should show warning
      await caregiverModal.assertWarningShown(/skill.*mismatch|may.*not.*qualified/i);

      // But allow with coordinator override
      await caregiverModal.assertCanAssign();
    });
  });

  test.describe('Availability and Schedule Conflicts', () => {
    test('should show availability status for each caregiver', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('caregiver-availability');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-scheduled-2pm');

      await caregiverModal.openModal();

      // Check availability for available caregiver
      const availableStatus = await caregiverModal.getAvailabilityStatus('Available Caregiver');
      expect(availableStatus).toMatch(/available|free|open/i);

      // Check availability for busy caregiver
      const busyStatus = await caregiverModal.getAvailabilityStatus('Busy Caregiver');
      expect(busyStatus).toMatch(/unavailable|busy|conflict|scheduled/i);
    });

    test('should warn about schedule conflicts', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('schedule-conflict');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-overlapping-time');

      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('Double-Booked Caregiver');

      // Should show warning about conflict
      await caregiverModal.assertWarningShown(/schedule.*conflict|already.*assigned|overlapping/i);

      // May allow with override or may block
      const warningText = await caregiverModal.getWarningMessageText();
      expect(warningText).toMatch(/2:00.*pm.*-.*4:00.*pm|overlapping.*visit/i);
    });

    test('should calculate and display travel time', async ({
      authenticatedPage,
      coordinatorUser,
    }) => {
      await TestDatabase.seed('travel-time-calculation');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-far-location');

      await caregiverModal.openModal();

      // Check travel time for nearby caregiver
      const nearbyTravel = await caregiverModal.getTravelTime('Nearby Caregiver');
      expect(nearbyTravel).toMatch(/5.*min|10.*min|nearby/i);

      // Check travel time for distant caregiver
      const distantTravel = await caregiverModal.getTravelTime('Distant Caregiver');
      expect(distantTravel).toMatch(/30.*min|45.*min|1.*hour/i);
    });
  });

  test.describe('Search and Filtering', () => {
    test('should search caregivers by name', async ({ authenticatedPage, coordinatorUser }) => {
      await TestDatabase.seed('multiple-caregivers');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-unassigned-general');

      await caregiverModal.openModal();

      const initialCount = await caregiverModal.getCaregiverCount();
      expect(initialCount).toBeGreaterThan(5); // Many caregivers

      // Search for specific caregiver
      await caregiverModal.searchCaregiver('John');

      const filteredCount = await caregiverModal.getCaregiverCount();
      expect(filteredCount).toBeLessThan(initialCount);
      expect(filteredCount).toBeGreaterThan(0);

      await caregiverModal.assertCaregiverVisible('John Doe');
    });

    test('should filter by availability', async ({ authenticatedPage, coordinatorUser }) => {
      await TestDatabase.seed('mixed-availability');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-afternoon-slot');

      await caregiverModal.openModal();

      // Show only available caregivers
      await caregiverModal.filterByStatus('AVAILABLE');

      const availableCount = await caregiverModal.getCaregiverCount();

      // All shown caregivers should be available
      const statuses = [
        await caregiverModal.getAvailabilityStatus('First Available'),
        await caregiverModal.getAvailabilityStatus('Second Available'),
      ];

      statuses.forEach((status) => {
        expect(status).toMatch(/available|free/i);
      });
    });
  });

  test.describe('Assignment Audit Trail', () => {
    test('should log assignment changes', async ({ authenticatedPage, coordinatorUser }) => {
      await TestDatabase.seed('assignment-audit');

      const visitDetailPage = new VisitDetailPage(authenticatedPage);
      const caregiverModal = new CaregiverSelectionModal(authenticatedPage);

      await visitDetailPage.goToVisit('visit-reassignment');

      // Initial assignment
      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('First Caregiver');
      await caregiverModal.confirmAssignment();

      await visitDetailPage.waitForSuccessToast(/assigned/i);

      // Reassign to different caregiver
      await caregiverModal.openModal();
      await caregiverModal.selectCaregiver('Second Caregiver');
      await caregiverModal.confirmAssignment();

      await visitDetailPage.waitForSuccessToast(/assigned|reassigned/i);

      // Verify assignment history (if available in UI)
      const historyButton = authenticatedPage.getByRole('button', { name: /history|changes|audit/i });
      if (await historyButton.isVisible()) {
        await historyButton.click();

        // Verify both assignments logged
        await authenticatedPage.waitForSelector('[data-testid="audit-log-entry"]');
        const logEntries = authenticatedPage.locator('[data-testid="audit-log-entry"]');
        const count = await logEntries.count();
        expect(count).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
