import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

/**
 * Schedule Visit Page Object
 *
 * Represents the form for creating a new visit:
 * - Select client
 * - Select caregiver
 * - Choose service type
 * - Set date/time
 * - Add tasks
 * - Save visit
 */
export class ScheduleVisitPage extends BasePage {
  readonly url = '/visits/new';

  constructor(page: import('@playwright/test').Page) {
    super(page);
  }

  /**
   * Navigate to the schedule visit page
   */
  async goToScheduleVisit(): Promise<void> {
    await this.goto(this.url);
  }

  /**
   * Fill in all visit details
   */
  async fillVisitDetails(details: {
    clientId?: string;
    clientName?: string;
    caregiverId?: string;
    caregiverName?: string;
    serviceType: string;
    scheduledDate: string; // YYYY-MM-DD format
    scheduledTime: string; // HH:MM format
    duration: number; // hours
    tasks?: string[]; // Optional task list
    notes?: string; // Optional notes
  }): Promise<void> {
    // Select client (either by ID or by name)
    if (details.clientId) {
      await this.selectOptionByTestId('client-select', details.clientId);
    } else if (details.clientName) {
      const clientSelect = this.page.getByLabel(/client/i);
      await clientSelect.click();
      await this.page.getByText(details.clientName, { exact: false }).click();
    }

    // Select caregiver (either by ID or by name)
    if (details.caregiverId) {
      await this.selectOptionByTestId('caregiver-select', details.caregiverId);
    } else if (details.caregiverName) {
      const caregiverSelect = this.page.getByLabel(/caregiver/i);
      await caregiverSelect.click();
      await this.page.getByText(details.caregiverName, { exact: false }).click();
    }

    // Select service type
    await this.selectOption('Service Type', details.serviceType);

    // Set scheduled date
    await this.fillInput('Date', details.scheduledDate);

    // Set scheduled time
    await this.fillInput('Time', details.scheduledTime);

    // Set duration
    await this.fillInput('Duration', details.duration.toString());

    // Add tasks if provided
    if (details.tasks && details.tasks.length > 0) {
      for (const task of details.tasks) {
        await this.addTask(task);
      }
    }

    // Add notes if provided
    if (details.notes) {
      await this.fillInput('Notes', details.notes);
    }
  }

  /**
   * Select client by name (with search)
   */
  async selectClient(clientName: string): Promise<void> {
    const clientSelect = this.page.getByLabel(/client/i);
    await clientSelect.click();

    // Search for client
    const searchInput = this.page.getByPlaceholder(/search.*client/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(clientName);
    }

    await this.page.getByText(clientName, { exact: false }).first().click();
  }

  /**
   * Select caregiver by name (with search)
   */
  async selectCaregiver(caregiverName: string): Promise<void> {
    const caregiverSelect = this.page.getByLabel(/caregiver/i);
    await caregiverSelect.click();

    // Search for caregiver
    const searchInput = this.page.getByPlaceholder(/search.*caregiver/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(caregiverName);
    }

    await this.page.getByText(caregiverName, { exact: false }).first().click();
  }

  /**
   * Add a task to the visit
   */
  async addTask(taskName: string): Promise<void> {
    // Click "Add Task" button
    const addTaskButton = this.page.getByRole('button', { name: /add.*task/i });
    await addTaskButton.click();

    // Fill task name in the newly added task input
    const taskInputs = this.page.getByLabel(/task.*name/i);
    const lastTaskInput = taskInputs.last();
    await lastTaskInput.fill(taskName);
  }

  /**
   * Remove a task
   */
  async removeTask(taskIndex: number): Promise<void> {
    const removeButtons = this.page.locator('[data-testid^="remove-task-"]');
    await removeButtons.nth(taskIndex).click();
  }

  /**
   * Mark a task as critical
   */
  async markTaskAsCritical(taskIndex: number): Promise<void> {
    const criticalCheckboxes = this.page.locator('[data-testid^="task-critical-"]');
    await criticalCheckboxes.nth(taskIndex).check();
  }

  /**
   * Submit the visit form
   */
  async submitVisit(): Promise<void> {
    await this.clickButton('Schedule Visit');
    await this.waitForSuccessToast(/visit.*scheduled/i);
  }

  /**
   * Save as draft
   */
  async saveAsDraft(): Promise<void> {
    await this.clickButton('Save as Draft');
    await this.waitForSuccessToast(/draft.*saved/i);
  }

  /**
   * Cancel visit creation
   */
  async cancel(): Promise<void> {
    await this.clickButton('Cancel');
    await this.waitForNavigation();
  }

  /**
   * Complete workflow: Fill details and submit
   */
  async scheduleVisit(details: Parameters<typeof this.fillVisitDetails>[0]): Promise<void> {
    await this.goToScheduleVisit();
    await this.fillVisitDetails(details);
    await this.submitVisit();
  }

  /**
   * Assert validation error for a field
   */
  async assertFieldError(fieldName: string, errorMessage: string): Promise<void> {
    const fieldError = this.getFieldError(fieldName);
    await expect(fieldError).toBeVisible();
    await expect(fieldError).toContainText(errorMessage);
  }

  /**
   * Assert that caregiver is available for selected time
   */
  async assertCaregiverAvailable(): Promise<void> {
    const availabilityIndicator = this.page.getByTestId('caregiver-availability');
    await expect(availabilityIndicator).toContainText(/available/i);
  }

  /**
   * Assert that caregiver is NOT available
   */
  async assertCaregiverUnavailable(): Promise<void> {
    const availabilityIndicator = this.page.getByTestId('caregiver-availability');
    await expect(availabilityIndicator).toContainText(/unavailable|conflict/i);
  }

  /**
   * Get estimated travel time (if shown)
   */
  async getEstimatedTravelTime(): Promise<string> {
    const travelTimeElement = this.page.getByTestId('estimated-travel-time');
    if (await travelTimeElement.isVisible()) {
      return (await travelTimeElement.textContent()) || '';
    }
    return '';
  }

  /**
   * Assert form is valid and submit button is enabled
   */
  async assertFormValid(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /schedule.*visit/i });
    await expect(submitButton).toBeEnabled();
  }

  /**
   * Assert form is invalid and submit button is disabled
   */
  async assertFormInvalid(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /schedule.*visit/i });
    await expect(submitButton).toBeDisabled();
  }
}
