import { BasePage } from './BasePage.js';
import { Locator, expect } from '@playwright/test';

/**
 * Visit Detail Page Object
 *
 * Represents the detailed view of a single visit where:
 * - Caregivers can clock in/out
 * - Tasks can be completed
 * - Visit details are displayed
 * - EVV records are captured
 */
export class VisitDetailPage extends BasePage {
  // Locators
  readonly clientName: Locator;
  readonly caregiverName: Locator;
  readonly visitStatus: Locator;
  readonly scheduledDateTime: Locator;
  readonly serviceType: Locator;
  readonly clockInButton: Locator;
  readonly clockOutButton: Locator;
  readonly taskCheckboxes: Locator;
  readonly notesTextarea: Locator;
  readonly saveNotesButton: Locator;
  readonly editVisitButton: Locator;
  readonly cancelVisitButton: Locator;
  readonly evvRecordLink: Locator;

  constructor(page: import('@playwright/test').Page) {
    super(page);

    // Initialize locators
    this.clientName = page.locator('[data-testid="client-name"]');
    this.caregiverName = page.locator('[data-testid="caregiver-name"]');
    this.visitStatus = page.locator('[data-testid="visit-status"]');
    this.scheduledDateTime = page.locator('[data-testid="scheduled-datetime"]');
    this.serviceType = page.locator('[data-testid="service-type"]');
    this.clockInButton = page.getByRole('button', { name: /clock.*in/i });
    this.clockOutButton = page.getByRole('button', { name: /clock.*out/i });
    this.taskCheckboxes = page.locator('input[type="checkbox"][data-testid^="task-"]');
    this.notesTextarea = page.getByLabel(/notes/i);
    this.saveNotesButton = page.getByRole('button', { name: /save.*notes/i });
    this.editVisitButton = page.getByRole('button', { name: /edit.*visit/i });
    this.cancelVisitButton = page.getByRole('button', { name: /cancel.*visit/i });
    this.evvRecordLink = page.getByRole('link', { name: /evv.*record/i });
  }

  /**
   * Navigate to a specific visit detail page
   */
  async goToVisit(visitId: string): Promise<void> {
    await this.goto(`/visits/${visitId}`);
  }

  /**
   * Clock in to the visit
   */
  async clockIn(options?: { withGPS?: boolean; notes?: string }): Promise<void> {
    // If GPS is required, set geolocation first
    if (options?.withGPS) {
      // GPS will be mocked in test context
    }

    await this.clockInButton.click();

    // If notes are required at clock-in
    if (options?.notes) {
      await this.notesTextarea.fill(options.notes);
      await this.saveNotesButton.click();
    }

    await this.waitForSuccessToast(/clocked.*in/i);
  }

  /**
   * Clock out from the visit
   */
  async clockOut(options?: { notes?: string; signature?: boolean }): Promise<void> {
    await this.clockOutButton.click();

    // If notes are required at clock-out
    if (options?.notes) {
      await this.notesTextarea.fill(options.notes);
      await this.saveNotesButton.click();
    }

    // If signature is required (MCO requirements)
    if (options?.signature) {
      await this.page.getByTestId('signature-canvas').click(); // Simulate signature
      await this.page.getByRole('button', { name: /submit.*signature/i }).click();
    }

    await this.waitForSuccessToast(/clocked.*out/i);
  }

  /**
   * Complete a specific task by name
   */
  async completeTask(taskName: string): Promise<void> {
    const taskCheckbox = this.page.locator('input[type="checkbox"]', {
      hasText: taskName,
    });
    await taskCheckbox.check();
    await this.waitForSuccessToast(/task.*completed/i, 3000).catch(() => {
      // Some implementations auto-save without toast
    });
  }

  /**
   * Complete a task by test ID
   */
  async completeTaskById(taskId: string): Promise<void> {
    const taskCheckbox = this.page.getByTestId(`task-${taskId}`);
    await taskCheckbox.check();
    await this.waitForSuccessToast(/task.*completed/i, 3000).catch(() => {
      // Some implementations auto-save without toast
    });
  }

  /**
   * Complete all tasks
   */
  async completeAllTasks(): Promise<void> {
    const tasks = await this.taskCheckboxes.all();
    for (const task of tasks) {
      if (!(await task.isChecked())) {
        await task.check();
        await this.page.waitForTimeout(200); // Small delay between tasks
      }
    }
  }

  /**
   * Get the current visit status
   */
  async getVisitStatus(): Promise<string> {
    return (await this.visitStatus.textContent()) || '';
  }

  /**
   * Get client name
   */
  async getClientName(): Promise<string> {
    return (await this.clientName.textContent()) || '';
  }

  /**
   * Get caregiver name
   */
  async getCaregiverName(): Promise<string> {
    return (await this.caregiverName.textContent()) || '';
  }

  /**
   * Get count of completed tasks
   */
  async getCompletedTaskCount(): Promise<number> {
    return await this.page.locator('input[type="checkbox"][data-testid^="task-"]:checked').count();
  }

  /**
   * Get count of total tasks
   */
  async getTotalTaskCount(): Promise<number> {
    return await this.taskCheckboxes.count();
  }

  /**
   * Add visit notes
   */
  async addNotes(notes: string): Promise<void> {
    await this.notesTextarea.fill(notes);
    await this.saveNotesButton.click();
    await this.waitForSuccessToast(/notes.*saved/i);
  }

  /**
   * Get current notes
   */
  async getNotes(): Promise<string> {
    return (await this.notesTextarea.inputValue()) || '';
  }

  /**
   * Edit the visit
   */
  async clickEdit(): Promise<void> {
    await this.editVisitButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Cancel the visit
   */
  async cancelVisit(reason: string): Promise<void> {
    await this.cancelVisitButton.click();

    // Fill cancellation reason in modal
    await this.page.getByLabel(/cancellation.*reason/i).fill(reason);
    await this.page.getByRole('button', { name: /confirm.*cancel/i }).click();

    await this.waitForSuccessToast(/visit.*cancelled/i);
  }

  /**
   * View EVV record
   */
  async viewEVVRecord(): Promise<void> {
    await this.evvRecordLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Assert visit status
   */
  async assertStatus(expectedStatus: string): Promise<void> {
    await expect(this.visitStatus).toHaveText(new RegExp(expectedStatus, 'i'));
  }

  /**
   * Assert all critical tasks are completed
   */
  async assertAllCriticalTasksCompleted(): Promise<void> {
    const criticalTasks = this.page.locator('input[type="checkbox"][data-critical="true"]');
    const count = await criticalTasks.count();

    for (let i = 0; i < count; i++) {
      await expect(criticalTasks.nth(i)).toBeChecked();
    }
  }

  /**
   * Check if clock-in button is visible
   */
  async isClockInVisible(): Promise<boolean> {
    return await this.clockInButton.isVisible();
  }

  /**
   * Check if clock-out button is visible
   */
  async isClockOutVisible(): Promise<boolean> {
    return await this.clockOutButton.isVisible();
  }

  /**
   * Get scheduled date and time
   */
  async getScheduledDateTime(): Promise<string> {
    return (await this.scheduledDateTime.textContent()) || '';
  }

  /**
   * Get service type
   */
  async getServiceType(): Promise<string> {
    return (await this.serviceType.textContent()) || '';
  }
}
