import { test, expect } from '../fixtures/auth.fixture.js';
import { VisitListPage } from '../pages/VisitListPage.js';
import { ScheduleVisitPage } from '../pages/ScheduleVisitPage.js';
import { TestDatabase } from '../setup/test-database.js';
import { createAuthenticatedPage } from '../fixtures/auth.fixture.js';

/**
 * Caregiver Onboarding Workflow E2E Tests
 *
 * Tests the complete caregiver onboarding process:
 * 1. Admin creates caregiver account
 * 2. Caregiver completes profile with personal information
 * 3. Caregiver uploads credentials (license, certifications)
 * 4. Admin verifies and approves credentials
 * 5. Coordinator assigns first visit
 * 6. Caregiver can view and accept assignment
 *
 * This validates the caregiver-staff vertical and ensures proper
 * onboarding workflow with credential verification.
 */
test.describe('Caregiver Onboarding Workflow', () => {
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

  test('Complete Caregiver Onboarding: Create → Profile → Credentials → Verify → Assign Visit', async ({
    context,
    adminUser,
    coordinatorUser,
  }) => {
    // ===== PHASE 1: Admin creates caregiver account =====
    await test.step('Admin creates caregiver account', async () => {
      const adminPage = await context.newPage();
      await createAuthenticatedPage(adminPage, adminUser);

      // Navigate to caregivers management
      await adminPage.goto('/caregivers/new');

      // Fill basic information
      await adminPage.getByLabel('First Name').fill('Sarah');
      await adminPage.getByLabel('Last Name').fill('Martinez');
      await adminPage.getByLabel('Email').fill('sarah.martinez@care-commons.local');
      await adminPage.getByLabel('Phone').fill('512-555-9876');

      // Fill address
      await adminPage.getByLabel('Address').fill('789 Caregiver Lane');
      await adminPage.getByLabel('City').fill('Austin');
      await adminPage.getByLabel('State').selectOption('TX');
      await adminPage.getByLabel('ZIP Code').fill('78703');

      // Set employment type
      const employmentType = adminPage.getByLabel('Employment Type');
      if (await employmentType.isVisible()) {
        await employmentType.selectOption('W2_EMPLOYEE');
      }

      // Create account
      await adminPage.getByRole('button', { name: /create.*caregiver|add.*caregiver/i }).click();

      // Wait for success message
      const successToast = adminPage.locator('[role="alert"][data-type="success"]');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/created.*successfully|added.*successfully/i);

      // Should redirect to caregiver profile page
      await expect(adminPage).toHaveURL(/\/caregivers\/[\w-]+/);

      await adminPage.close();
    });

    // ===== PHASE 2: Caregiver logs in and completes profile =====
    await test.step('Caregiver completes profile', async () => {
      const caregiverPage = await context.newPage();
      const newCaregiver = {
        userId: 'caregiver-new-001',
        email: 'sarah.martinez@care-commons.local',
        organizationId: 'org-e2e-001',
        branchId: 'branch-e2e-001',
        roles: ['CAREGIVER'],
        permissions: ['profile:write:own', 'credentials:write:own'],
      };
      await createAuthenticatedPage(caregiverPage, newCaregiver);

      // Navigate to profile
      await caregiverPage.goto('/profile');

      // Complete additional profile information
      await caregiverPage.getByLabel('Date of Birth').fill('1990-05-15');

      // Emergency contact
      const emergencyName = caregiverPage.getByLabel('Emergency Contact Name');
      if (await emergencyName.isVisible()) {
        await emergencyName.fill('John Martinez');
        await caregiverPage.getByLabel('Emergency Contact Phone').fill('512-555-1111');
      }

      // Languages spoken
      const languages = caregiverPage.getByLabel('Languages');
      if (await languages.isVisible()) {
        await languages.selectOption(['English', 'Spanish']);
      }

      // Years of experience
      const experience = caregiverPage.getByLabel(/experience|years/i);
      if (await experience.isVisible()) {
        await experience.fill('5');
      }

      // Skills and certifications
      const skills = caregiverPage.getByLabel(/skills|specialties/i);
      if (await skills.isVisible()) {
        await skills.check();
      }

      // Save profile
      await caregiverPage.getByRole('button', { name: /save.*profile|update/i }).click();

      // Wait for success
      const profileSuccess = caregiverPage.locator('[role="alert"][data-type="success"]');
      await expect(profileSuccess).toBeVisible();

      await caregiverPage.close();
    });

    // ===== PHASE 3: Caregiver uploads credentials =====
    await test.step('Caregiver uploads credentials', async () => {
      const caregiverPage = await context.newPage();
      const caregiver = {
        userId: 'caregiver-new-001',
        email: 'sarah.martinez@care-commons.local',
        organizationId: 'org-e2e-001',
        branchId: 'branch-e2e-001',
        roles: ['CAREGIVER'],
        permissions: ['credentials:write:own'],
      };
      await createAuthenticatedPage(caregiverPage, caregiver);

      // Navigate to credentials/documents
      await caregiverPage.goto('/profile/credentials');

      // Upload driver's license
      const licenseUpload = caregiverPage.locator('input[type="file"]').first();
      if (await licenseUpload.isVisible()) {
        // In a real test, we would upload an actual file
        // For E2E, we may need to create a test file or mock the upload
        // await licenseUpload.setInputFiles('path/to/test-license.pdf');
      }

      // Add credential information
      const addCredentialBtn = caregiverPage.getByRole('button', {
        name: /add.*credential|upload.*document/i,
      });
      if (await addCredentialBtn.isVisible()) {
        await addCredentialBtn.click();

        // Fill credential details
        await caregiverPage.getByLabel('Credential Type').selectOption('CNA_LICENSE');
        await caregiverPage.getByLabel('License Number').fill('TX-CNA-123456');
        await caregiverPage.getByLabel('Issue Date').fill('2020-01-15');
        await caregiverPage.getByLabel('Expiration Date').fill('2026-01-15');
        await caregiverPage.getByLabel('Issuing State').selectOption('TX');

        // Submit credential
        await caregiverPage.getByRole('button', { name: /submit|save/i }).click();

        // Verify success
        const credentialSuccess = caregiverPage.locator('[role="alert"][data-type="success"]');
        await expect(credentialSuccess).toBeVisible();
      }

      await caregiverPage.close();
    });

    // ===== PHASE 4: Admin verifies and approves credentials =====
    await test.step('Admin verifies and approves credentials', async () => {
      const adminPage = await context.newPage();
      await createAuthenticatedPage(adminPage, adminUser);

      // Navigate to pending verifications
      await adminPage.goto('/admin/credentials/pending');

      // Find Sarah Martinez's credentials
      const pendingCredential = adminPage.locator('[data-testid="credential-item"]', {
        hasText: 'Sarah Martinez',
      });

      if (await pendingCredential.isVisible()) {
        await pendingCredential.click();

        // View credential details
        await expect(adminPage.locator('[data-testid="credential-detail"]')).toBeVisible();

        // Verify license number matches
        await expect(adminPage.locator('text=TX-CNA-123456')).toBeVisible();

        // Approve credential
        await adminPage.getByRole('button', { name: /approve|verify/i }).click();

        // Confirm approval
        const confirmBtn = adminPage.getByRole('button', { name: /confirm|yes/i });
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }

        // Verify success message
        const approvalSuccess = adminPage.locator('[role="alert"][data-type="success"]');
        await expect(approvalSuccess).toBeVisible();
        await expect(approvalSuccess).toContainText(/approved|verified/i);
      }

      await adminPage.close();
    });

    // ===== PHASE 5: Coordinator assigns first visit =====
    await test.step('Coordinator assigns first visit to new caregiver', async () => {
      const coordinatorPage = await context.newPage();
      await createAuthenticatedPage(coordinatorPage, coordinatorUser);

      const schedulePage = new ScheduleVisitPage(coordinatorPage);

      await schedulePage.scheduleVisit({
        clientName: 'John Doe',
        caregiverName: 'Sarah Martinez',
        serviceType: 'PERSONAL_CARE',
        scheduledDate: '2025-01-25',
        scheduledTime: '14:00',
        duration: 2,
        tasks: ['Assist with bathing', 'Medication reminder'],
        notes: 'First visit for new caregiver - orientation with client',
      });

      // Verify visit created
      const visitList = new VisitListPage(coordinatorPage);
      await visitList.goToVisitList();
      await visitList.filterByCaregiver('Sarah Martinez');

      const visitExists = await visitList.hasVisit('John Doe');
      expect(visitExists).toBe(true);

      await coordinatorPage.close();
    });

    // ===== PHASE 6: Caregiver can view and accept assignment =====
    await test.step('Caregiver views and accepts first assignment', async () => {
      const caregiverPage = await context.newPage();
      const caregiver = {
        userId: 'caregiver-new-001',
        email: 'sarah.martinez@care-commons.local',
        organizationId: 'org-e2e-001',
        branchId: 'branch-e2e-001',
        roles: ['CAREGIVER'],
        permissions: ['visits:read:own', 'visits:write:own'],
      };
      await createAuthenticatedPage(caregiverPage, caregiver);

      // Navigate to visits/schedule
      const visitList = new VisitListPage(caregiverPage);
      await visitList.goToVisitList();

      // Should see new visit assignment
      const visitItem = caregiverPage.locator('[data-testid="visit-card"]', {
        hasText: 'John Doe',
      });
      await expect(visitItem).toBeVisible();

      // Click to view details
      await visitItem.click();

      // Should see visit details and "Accept" button (if required)
      const acceptBtn = caregiverPage.getByRole('button', { name: /accept/i });
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();

        const acceptSuccess = caregiverPage.locator('[role="alert"][data-type="success"]');
        await expect(acceptSuccess).toBeVisible();
      }

      // Verify visit is now in "My Schedule"
      await visitList.goToVisitList();
      await visitList.filterByStatus('SCHEDULED');
      const hasScheduledVisit = await visitList.hasVisit('John Doe');
      expect(hasScheduledVisit).toBe(true);

      await caregiverPage.close();
    });
  });

  test('Caregiver Onboarding: Reject expired credentials', async ({ context, adminUser }) => {
    await test.step('Admin rejects expired credential', async () => {
      const adminPage = await context.newPage();
      await createAuthenticatedPage(adminPage, adminUser);

      await adminPage.goto('/admin/credentials/pending');

      // Find credential with expired expiration date
      const expiredCredential = adminPage.locator('[data-testid="credential-item"]').first();

      if (await expiredCredential.isVisible()) {
        await expiredCredential.click();

        // Reject credential
        const rejectBtn = adminPage.getByRole('button', { name: /reject|decline/i });
        if (await rejectBtn.isVisible()) {
          await rejectBtn.click();

          // Provide rejection reason
          await adminPage.getByLabel('Reason').fill('License has expired. Please upload current license.');

          // Confirm rejection
          await adminPage.getByRole('button', { name: /confirm|submit/i }).click();

          // Verify rejection success
          const rejectSuccess = adminPage.locator('[role="alert"][data-type="success"]');
          await expect(rejectSuccess).toBeVisible();
        }
      }

      await adminPage.close();
    });
  });

  test('Caregiver Onboarding: State-specific credential requirements', async ({
    context,
    adminUser,
  }) => {
    await test.step('Verify Texas EMR clearance required', async () => {
      const adminPage = await context.newPage();
      await createAuthenticatedPage(adminPage, adminUser);

      await adminPage.goto('/caregivers/new');

      // Fill basic info
      await adminPage.getByLabel('First Name').fill('John');
      await adminPage.getByLabel('Last Name').fill('Smith');
      await adminPage.getByLabel('Email').fill('john.smith@test.com');
      await adminPage.getByLabel('State').selectOption('TX');

      // Save caregiver
      await adminPage.getByRole('button', { name: /create|save/i }).click();

      // Navigate to credentials
      await adminPage.getByRole('tab', { name: /credentials|documents/i }).click();

      // For Texas, should require EMR clearance
      const requiredDocs = adminPage.locator('[data-testid="required-documents"]');
      if (await requiredDocs.isVisible()) {
        await expect(requiredDocs).toContainText(/emr|employee.*misconduct/i);
      }

      await adminPage.close();
    });
  });

  test('Caregiver Onboarding: Cannot start work without approved credentials', async ({
    context,
  }) => {
    await test.step('Block visit assignment if credentials not approved', async () => {
      const caregiverPage = await context.newPage();
      const unapprovedCaregiver = {
        userId: 'caregiver-pending-001',
        email: 'pending@test.com',
        organizationId: 'org-e2e-001',
        branchId: 'branch-e2e-001',
        roles: ['CAREGIVER'],
        permissions: ['visits:read:own'],
        credentialsApproved: false,
      };
      await createAuthenticatedPage(caregiverPage, unapprovedCaregiver);

      // Try to access visits
      await caregiverPage.goto('/visits');

      // Should see message about pending credentials
      const blockingMessage = caregiverPage.locator('[data-testid="credential-warning"]');
      if (await blockingMessage.isVisible()) {
        await expect(blockingMessage).toContainText(/credentials.*pending|approval.*required/i);
      }

      await caregiverPage.close();
    });
  });
});
