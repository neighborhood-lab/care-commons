import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Client Page Object Model
 *
 * Represents the client detail page and provides methods for interacting with client data.
 */
export class ClientPage extends BasePage {
  readonly url = '/clients';

  // Locators
  readonly createClientBtn: Locator;
  readonly clientList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.createClientBtn = page.getByRole('button', { name: /new client|create/i });
    this.clientList = page.locator('[data-testid="client-list"]');
    this.searchInput = page.getByPlaceholder(/search.*client/i);
  }

  async goToClientList(): Promise<void> {
    await this.goto(this.url);
  }

  async goToClient(clientId: string): Promise<void> {
    await this.goto(`${this.url}/${clientId}`);
  }

  async searchClient(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async createClient(clientData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: string;
    phone: string;
    email: string;
    serviceAuthorization?: string;
    authorizedHours?: number;
  }): Promise<void> {
    await this.createClientBtn.click();

    await this.fillInput('First Name', clientData.firstName);
    await this.fillInput('Last Name', clientData.lastName);
    await this.fillInput('Date of Birth', clientData.dateOfBirth);
    await this.fillInput('Address', clientData.address);
    await this.fillInput('Phone', clientData.phone);
    await this.fillInput('Email', clientData.email);

    if (clientData.serviceAuthorization) {
      await this.selectOption('Service Authorization', clientData.serviceAuthorization);
    }

    if (clientData.authorizedHours) {
      await this.fillInput('Authorized Hours', clientData.authorizedHours.toString());
    }

    await this.clickButton('Create Client');
    await this.waitForNavigation();
  }

  async getClientName(): Promise<string> {
    return await this.getText('[data-testid="client-name"]');
  }

  async getClientStatus(): Promise<string> {
    return await this.getText('[data-testid="client-status"]');
  }

  async hasClient(clientName: string): Promise<boolean> {
    const client = this.page.locator('[data-testid="client-card"]', { hasText: clientName });
    return await client.isVisible({ timeout: 2000 }).catch(() => false);
  }
}
