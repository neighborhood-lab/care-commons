import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Caregiver Page Object Model
 *
 * Represents the caregiver pages and provides methods for managing caregivers.
 */
export class CaregiverPage extends BasePage {
  readonly url = '/caregivers';

  // Locators
  readonly createCaregiverBtn: Locator;
  readonly caregiverList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.createCaregiverBtn = page.getByRole('button', { name: /new caregiver|create/i });
    this.caregiverList = page.locator('[data-testid="caregiver-list"]');
    this.searchInput = page.getByPlaceholder(/search.*caregiver/i);
  }

  async goToCaregiverList(): Promise<void> {
    await this.goto(this.url);
  }

  async goToCaregiver(caregiverId: string): Promise<void> {
    await this.goto(`${this.url}/${caregiverId}`);
  }

  async searchCaregiver(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async getCaregiverName(): Promise<string> {
    return await this.getText('[data-testid="caregiver-name"]');
  }

  async getCaregiverStatus(): Promise<string> {
    return await this.getText('[data-testid="caregiver-status"]');
  }

  async hasCaregiver(caregiverName: string): Promise<boolean> {
    const caregiver = this.page.locator('[data-testid="caregiver-card"]', { hasText: caregiverName });
    return await caregiver.isVisible({ timeout: 2000 }).catch(() => false);
  }
}
