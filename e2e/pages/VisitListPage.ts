import { BasePage } from './BasePage.js';
import { Locator, expect } from '@playwright/test';

/**
 * Visit List Page Object
 *
 * Represents the visits list view where coordinators can:
 * - View all scheduled visits
 * - Filter by status (scheduled, in-progress, completed)
 * - Search for specific visits
 * - Navigate to visit details
 * - Create new visits
 */
export class VisitListPage extends BasePage {
  readonly url = '/visits';

  // Locators
  readonly visitCards: Locator;
  readonly filterStatusDropdown: Locator;
  readonly searchInput: Locator;
  readonly createVisitButton: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: import('@playwright/test').Page) {
    super(page);

    // Initialize locators
    this.visitCards = page.locator('[data-testid="visit-card"], [data-testid^="visit-"]');
    this.filterStatusDropdown = page.getByLabel('Filter by status', { exact: false });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.createVisitButton = page.getByRole('button', { name: /schedule.*visit/i });
    this.emptyState = page.getByTestId('empty-state');
    this.loadingSpinner = page.getByTestId('loading-spinner');
  }

  /**
   * Navigate to the visit list page
   */
  async goToVisitList(): Promise<void> {
    await this.goto(this.url);
  }

  /**
   * Filter visits by status
   */
  async filterByStatus(status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string): Promise<void> {
    await this.filterStatusDropdown.selectOption(status);
    await this.waitForPageLoad();
  }

  /**
   * Search for visits by query (client name, caregiver, etc.)
   */
  async searchVisits(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Click on a visit card by client name
   */
  async clickVisit(clientName: string): Promise<void> {
    const visitCard = this.page.locator('[data-testid="visit-card"]', {
      hasText: clientName,
    });
    await visitCard.first().click();
    await this.waitForPageLoad();
  }

  /**
   * Click on a visit card by visit ID
   */
  async clickVisitById(visitId: string): Promise<void> {
    const visitCard = this.page.getByTestId(`visit-${visitId}`);
    await visitCard.click();
    await this.waitForPageLoad();
  }

  /**
   * Get the total count of visible visit cards
   */
  async getVisitCount(): Promise<number> {
    await this.waitForElement('[data-testid="visit-card"]', 3000).catch(() => {
      // Empty state is okay
    });
    return await this.visitCards.count();
  }

  /**
   * Get a specific visit card by client name
   */
  getVisitByClient(clientName: string): Locator {
    return this.page.locator('[data-testid="visit-card"]', {
      hasText: clientName,
    });
  }

  /**
   * Get visit card by caregiver name
   */
  getVisitByCaregiver(caregiverName: string): Locator {
    return this.page.locator('[data-testid="visit-card"]', {
      hasText: caregiverName,
    });
  }

  /**
   * Check if a visit exists in the list
   */
  async visitExists(clientName: string): Promise<boolean> {
    const count = await this.getVisitByClient(clientName).count();
    return count > 0;
  }

  /**
   * Click the "Schedule Visit" button
   */
  async clickScheduleVisit(): Promise<void> {
    await this.createVisitButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Assert that empty state is shown
   */
  async assertEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Assert that a specific number of visits are shown
   */
  async assertVisitCount(expectedCount: number): Promise<void> {
    await expect(this.visitCards).toHaveCount(expectedCount);
  }

  /**
   * Get visit status from card
   */
  async getVisitStatus(clientName: string): Promise<string> {
    const visitCard = this.getVisitByClient(clientName);
    const statusBadge = visitCard.locator('[data-testid="visit-status"], .status-badge');
    return (await statusBadge.textContent()) || '';
  }

  /**
   * Wait for visits to load
   */
  async waitForVisitsToLoad(): Promise<void> {
    // Wait for loading spinner to disappear
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Spinner might not appear for fast loads
    });

    // Wait for either visits or empty state
    await Promise.race([
      this.visitCards.first().waitFor({ state: 'visible', timeout: 5000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 5000 }),
    ]).catch(() => {
      // Neither appeared - that's okay, list might be empty
    });
  }
}
