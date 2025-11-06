import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object
 *
 * Abstract base class for all page objects in Care Commons E2E tests.
 * Provides common functionality for navigation, waiting, and interaction.
 *
 * @example
 * ```typescript
 * export class VisitListPage extends BasePage {
 *   readonly url = '/visits';
 *
 *   async goToVisitList() {
 *     await this.goto(this.url);
 *   }
 * }
 * ```
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path and wait for page load
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded (network idle)
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for DOM content to be loaded
   */
  async waitForDOMLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for a toast/notification message to appear
   */
  async waitForToast(message: string, timeout = 5000): Promise<void> {
    const toast = this.page.locator('[role="alert"], [data-testid="toast"]', {
      hasText: message,
    });
    await toast.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for an error toast to appear
   */
  async waitForErrorToast(message?: string, timeout = 5000): Promise<void> {
    const selector = '[role="alert"][data-type="error"], [data-testid="error-toast"]';
    const toast = message
      ? this.page.locator(selector, { hasText: message })
      : this.page.locator(selector);
    await toast.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for a success toast to appear
   */
  async waitForSuccessToast(message?: string, timeout = 5000): Promise<void> {
    const selector = '[role="alert"][data-type="success"], [data-testid="success-toast"]';
    const toast = message
      ? this.page.locator(selector, { hasText: message })
      : this.page.locator(selector);
    await toast.waitFor({ state: 'visible', timeout });
  }

  /**
   * Click a button by text or test ID
   */
  async clickButton(textOrTestId: string): Promise<void> {
    // Try by role first
    const byRole = this.page.getByRole('button', { name: textOrTestId });
    if ((await byRole.count()) > 0) {
      await byRole.first().click();
      return;
    }

    // Fallback to test ID
    const byTestId = this.page.getByTestId(textOrTestId);
    if ((await byTestId.count()) > 0) {
      await byTestId.click();
      return;
    }

    // Fallback to text search
    await this.page.getByText(textOrTestId, { exact: false }).first().click();
  }

  /**
   * Fill an input field by label
   */
  async fillInput(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label, { exact: false }).fill(value);
  }

  /**
   * Fill an input field by test ID
   */
  async fillInputByTestId(testId: string, value: string): Promise<void> {
    await this.page.getByTestId(testId).fill(value);
  }

  /**
   * Select an option from a dropdown by label
   */
  async selectOption(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label, { exact: false }).selectOption(value);
  }

  /**
   * Select an option from a dropdown by test ID
   */
  async selectOptionByTestId(testId: string, value: string): Promise<void> {
    await this.page.getByTestId(testId).selectOption(value);
  }

  /**
   * Check a checkbox by label
   */
  async checkCheckbox(label: string): Promise<void> {
    await this.page.getByLabel(label, { exact: false }).check();
  }

  /**
   * Uncheck a checkbox by label
   */
  async uncheckCheckbox(label: string): Promise<void> {
    await this.page.getByLabel(label, { exact: false }).uncheck();
  }

  /**
   * Get error message locator
   */
  getErrorMessage(): Locator {
    return this.page.locator('[role="alert"][data-type="error"], [data-testid="error-message"]');
  }

  /**
   * Get error message text
   */
  async getErrorMessageText(): Promise<string> {
    return (await this.getErrorMessage().textContent()) || '';
  }

  /**
   * Get validation error for a specific field
   */
  getFieldError(fieldName: string): Locator {
    return this.page.locator(`[data-testid="${fieldName}-error"], #${fieldName}-error`);
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for a specific element to be hidden
   */
  async waitForElementHidden(selector: string, timeout = 10000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  /**
   * Check if an element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) || '';
  }

  /**
   * Take a screenshot (useful for debugging)
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert that we're on the correct page
   */
  async assertUrl(expectedPath: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }

  /**
   * Assert that page title matches
   */
  async assertTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitle));
  }
}
