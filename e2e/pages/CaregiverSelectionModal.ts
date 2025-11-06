import { BasePage } from './BasePage.js';
import { Locator, expect } from '@playwright/test';

/**
 * Caregiver Selection Modal Page Object
 *
 * Represents the modal/dialog for assigning a caregiver to a visit:
 * - View available caregivers
 * - Filter by credentials, availability
 * - View compliance warnings/errors
 * - Assign caregiver
 * - Handle state-specific validation
 */
export class CaregiverSelectionModal extends BasePage {
  // Locators
  readonly modal: Locator;
  readonly searchInput: Locator;
  readonly caregiverCards: Locator;
  readonly filterDropdown: Locator;
  readonly assignButton: Locator;
  readonly cancelButton: Locator;
  readonly warningMessage: Locator;
  readonly errorMessage: Locator;
  readonly complianceIndicators: Locator;

  constructor(page: import('@playwright/test').Page) {
    super(page);

    // Initialize locators
    this.modal = page.locator('[data-testid="caregiver-selection-modal"], [role="dialog"]');
    this.searchInput = this.modal.getByPlaceholder(/search.*caregiver/i);
    this.caregiverCards = this.modal.locator('[data-testid="caregiver-card"]');
    this.filterDropdown = this.modal.getByLabel(/filter/i);
    this.assignButton = this.modal.getByRole('button', { name: /assign|confirm/i });
    this.cancelButton = this.modal.getByRole('button', { name: /cancel/i });
    this.warningMessage = this.modal.locator('[data-testid="warning-message"], [role="alert"][data-type="warning"]');
    this.errorMessage = this.modal.locator('[data-testid="error-message"], [role="alert"][data-type="error"]');
    this.complianceIndicators = this.modal.locator('[data-testid="compliance-indicator"]');
  }

  /**
   * Open the caregiver selection modal
   * (Usually triggered by clicking "Assign Caregiver" on visit detail page)
   */
  async openModal(): Promise<void> {
    const assignButton = this.page.getByRole('button', { name: /assign.*caregiver/i });
    await assignButton.click();
    await this.modal.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Search for a caregiver by name
   */
  async searchCaregiver(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(300); // Debounce delay
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  /**
   * Filter caregivers by status
   */
  async filterByStatus(status: 'AVAILABLE' | 'UNAVAILABLE' | 'ALL'): Promise<void> {
    await this.filterDropdown.selectOption(status);
    await this.page.waitForTimeout(300);
  }

  /**
   * Select a caregiver by name
   */
  async selectCaregiver(caregiverName: string): Promise<void> {
    const caregiverCard = this.caregiverCards.filter({
      hasText: caregiverName,
    });
    await caregiverCard.first().click();
  }

  /**
   * Select a caregiver by ID
   */
  async selectCaregiverById(caregiverId: string): Promise<void> {
    const caregiverCard = this.modal.getByTestId(`caregiver-${caregiverId}`);
    await caregiverCard.click();
  }

  /**
   * Confirm the assignment
   */
  async confirmAssignment(): Promise<void> {
    await this.assignButton.click();

    // Wait for either success or error
    await Promise.race([
      this.waitForSuccessToast(/assigned/i, 5000),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }),
    ]).catch(() => {
      // Timeout is okay, we'll check state separately
    });
  }

  /**
   * Cancel the assignment
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Get the count of available caregivers
   */
  async getCaregiverCount(): Promise<number> {
    return await this.caregiverCards.count();
  }

  /**
   * Get warning message text
   */
  async getWarningMessageText(): Promise<string> {
    return (await this.warningMessage.textContent()) || '';
  }

  /**
   * Get error message text
   */
  async getErrorMessageText(): Promise<string> {
    return (await this.errorMessage.textContent()) || '';
  }

  /**
   * Get compliance indicators for a caregiver
   */
  async getCaregiverCompliance(caregiverName: string): Promise<{
    backgroundCheck: string;
    credentials: string[];
    restrictions: string[];
  }> {
    const caregiverCard = this.caregiverCards.filter({
      hasText: caregiverName,
    });

    const backgroundCheck =
      (await caregiverCard.locator('[data-testid="background-check-status"]').textContent()) || '';
    const credentials = await caregiverCard
      .locator('[data-testid="credential-badge"]')
      .allTextContents();
    const restrictions = await caregiverCard
      .locator('[data-testid="restriction-badge"]')
      .allTextContents();

    return { backgroundCheck, credentials, restrictions };
  }

  /**
   * Check if a caregiver has a specific credential
   */
  async hasCredential(caregiverName: string, credentialType: string): Promise<boolean> {
    const compliance = await this.getCaregiverCompliance(caregiverName);
    return compliance.credentials.some((cred) => cred.includes(credentialType));
  }

  /**
   * Check if assignment button is enabled
   */
  async isAssignButtonEnabled(): Promise<boolean> {
    return await this.assignButton.isEnabled();
  }

  /**
   * Check if assignment button is disabled
   */
  async isAssignButtonDisabled(): Promise<boolean> {
    return await this.assignButton.isDisabled();
  }

  /**
   * Get estimated travel time for a caregiver
   */
  async getTravelTime(caregiverName: string): Promise<string> {
    const caregiverCard = this.caregiverCards.filter({
      hasText: caregiverName,
    });
    const travelTime =
      (await caregiverCard.locator('[data-testid="travel-time"]').textContent()) || '';
    return travelTime;
  }

  /**
   * Get availability status for a caregiver
   */
  async getAvailabilityStatus(caregiverName: string): Promise<string> {
    const caregiverCard = this.caregiverCards.filter({
      hasText: caregiverName,
    });
    const status =
      (await caregiverCard.locator('[data-testid="availability-status"]').textContent()) || '';
    return status;
  }

  /**
   * Assert that modal is visible
   */
  async assertModalVisible(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  /**
   * Assert that modal is hidden
   */
  async assertModalHidden(): Promise<void> {
    await expect(this.modal).toBeHidden();
  }

  /**
   * Assert warning message is shown
   */
  async assertWarningShown(expectedMessage?: string): Promise<void> {
    await expect(this.warningMessage).toBeVisible();
    if (expectedMessage) {
      await expect(this.warningMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Assert error message is shown (blocking)
   */
  async assertErrorShown(expectedMessage?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Assert that a specific caregiver is shown
   */
  async assertCaregiverVisible(caregiverName: string): Promise<void> {
    const caregiverCard = this.caregiverCards.filter({
      hasText: caregiverName,
    });
    await expect(caregiverCard).toBeVisible();
  }

  /**
   * Assert that no caregivers are shown (empty state)
   */
  async assertNoCaregivers(): Promise<void> {
    const count = await this.getCaregiverCount();
    expect(count).toBe(0);
  }

  /**
   * Assert that assign button is enabled
   */
  async assertCanAssign(): Promise<void> {
    await expect(this.assignButton).toBeEnabled();
  }

  /**
   * Assert that assign button is disabled
   */
  async assertCannotAssign(): Promise<void> {
    await expect(this.assignButton).toBeDisabled();
  }
}
