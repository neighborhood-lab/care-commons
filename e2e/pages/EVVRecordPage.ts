import { BasePage } from './BasePage.js';
import { Locator, expect } from '@playwright/test';

/**
 * EVV Record Page Object
 *
 * Represents the Electronic Visit Verification (EVV) record view:
 * - View EVV compliance status
 * - Check verification method (GPS, mobile, VMUR)
 * - Review aggregator submission status
 * - View compliance flags
 * - Check state-specific requirements
 */
export class EVVRecordPage extends BasePage {
  // Locators
  readonly evvRecordId: Locator;
  readonly verificationMethod: Locator;
  readonly complianceStatus: Locator;
  readonly aggregatorName: Locator;
  readonly submissionStatus: Locator;
  readonly clockInLocation: Locator;
  readonly clockOutLocation: Locator;
  readonly gpsAccuracy: Locator;
  readonly complianceFlags: Locator;
  readonly stateRequirements: Locator;
  readonly vmurAmendmentButton: Locator;

  constructor(page: import('@playwright/test').Page) {
    super(page);

    // Initialize locators
    this.evvRecordId = page.locator('[data-testid="evv-record-id"]');
    this.verificationMethod = page.locator('[data-testid="verification-method"]');
    this.complianceStatus = page.locator('[data-testid="compliance-status"]');
    this.aggregatorName = page.locator('[data-testid="aggregator-name"]');
    this.submissionStatus = page.locator('[data-testid="submission-status"]');
    this.clockInLocation = page.locator('[data-testid="clock-in-location"]');
    this.clockOutLocation = page.locator('[data-testid="clock-out-location"]');
    this.gpsAccuracy = page.locator('[data-testid="gps-accuracy"]');
    this.complianceFlags = page.locator('[data-testid="compliance-flag"]');
    this.stateRequirements = page.locator('[data-testid="state-requirements"]');
    this.vmurAmendmentButton = page.getByRole('button', { name: /vmur.*amendment/i });
  }

  /**
   * Navigate to EVV record for a specific visit
   */
  async goToEVVRecord(visitId: string): Promise<void> {
    await this.goto(`/visits/${visitId}/evv`);
  }

  /**
   * Get verification method (GPS, MOBILE, VMUR, etc.)
   */
  async getVerificationMethod(): Promise<string> {
    return (await this.verificationMethod.textContent()) || '';
  }

  /**
   * Get compliance status (COMPLIANT, NON_COMPLIANT, PENDING_REVIEW, etc.)
   */
  async getComplianceStatus(): Promise<string> {
    return (await this.complianceStatus.textContent()) || '';
  }

  /**
   * Get aggregator name (HHAeXchange, Sandata, Tellus, etc.)
   */
  async getAggregatorName(): Promise<string> {
    return (await this.aggregatorName.textContent()) || '';
  }

  /**
   * Get submission status (SUBMITTED, PENDING, FAILED, etc.)
   */
  async getSubmissionStatus(): Promise<string> {
    return (await this.submissionStatus.textContent()) || '';
  }

  /**
   * Get all compliance flags
   */
  async getComplianceFlags(): Promise<string[]> {
    const flags = await this.complianceFlags.allTextContents();
    return flags;
  }

  /**
   * Check if a specific compliance flag exists
   */
  async hasComplianceFlag(flagName: string): Promise<boolean> {
    const flags = await this.getComplianceFlags();
    return flags.some((flag) => flag.includes(flagName));
  }

  /**
   * Get clock-in location details
   */
  async getClockInLocation(): Promise<{
    latitude?: string;
    longitude?: string;
    address?: string;
    accuracy?: string;
  }> {
    const locationText = (await this.clockInLocation.textContent()) || '';

    return {
      latitude: this.extractValue(locationText, 'Latitude:'),
      longitude: this.extractValue(locationText, 'Longitude:'),
      address: this.extractValue(locationText, 'Address:'),
      accuracy: this.extractValue(locationText, 'Accuracy:'),
    };
  }

  /**
   * Get clock-out location details
   */
  async getClockOutLocation(): Promise<{
    latitude?: string;
    longitude?: string;
    address?: string;
    accuracy?: string;
  }> {
    const locationText = (await this.clockOutLocation.textContent()) || '';

    return {
      latitude: this.extractValue(locationText, 'Latitude:'),
      longitude: this.extractValue(locationText, 'Longitude:'),
      address: this.extractValue(locationText, 'Address:'),
      accuracy: this.extractValue(locationText, 'Accuracy:'),
    };
  }

  /**
   * Get GPS accuracy in meters
   */
  async getGPSAccuracy(): Promise<number> {
    const accuracyText = (await this.gpsAccuracy.textContent()) || '';
    const match = accuracyText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get state-specific requirements displayed
   */
  async getStateRequirements(): Promise<string[]> {
    return await this.stateRequirements.allTextContents();
  }

  /**
   * Create VMUR amendment (for Texas)
   */
  async createVMURAmen dment(reason: string, correctedData: {
    clockInTime?: string;
    clockOutTime?: string;
    location?: string;
  }): Promise<void> {
    await this.vmurAmendmentButton.click();

    // Fill amendment form
    await this.page.getByLabel(/amendment.*reason/i).fill(reason);

    if (correctedData.clockInTime) {
      await this.page.getByLabel(/corrected.*clock.*in/i).fill(correctedData.clockInTime);
    }

    if (correctedData.clockOutTime) {
      await this.page.getByLabel(/corrected.*clock.*out/i).fill(correctedData.clockOutTime);
    }

    if (correctedData.location) {
      await this.page.getByLabel(/corrected.*location/i).fill(correctedData.location);
    }

    // Submit amendment
    await this.page.getByRole('button', { name: /submit.*amendment/i }).click();
    await this.waitForSuccessToast(/amendment.*submitted/i);
  }

  /**
   * Assert compliance status
   */
  async assertComplianceStatus(expectedStatus: string): Promise<void> {
    await expect(this.complianceStatus).toContainText(expectedStatus);
  }

  /**
   * Assert verification method
   */
  async assertVerificationMethod(expectedMethod: string): Promise<void> {
    await expect(this.verificationMethod).toContainText(expectedMethod);
  }

  /**
   * Assert GPS is within acceptable range
   */
  async assertGPSWithinRange(maxAccuracyMeters: number): Promise<void> {
    const accuracy = await this.getGPSAccuracy();
    expect(accuracy).toBeLessThanOrEqual(maxAccuracyMeters);
  }

  /**
   * Assert no compliance flags
   */
  async assertNoComplianceFlags(): Promise<void> {
    const count = await this.complianceFlags.count();
    expect(count).toBe(0);
  }

  /**
   * Assert specific compliance flag exists
   */
  async assertHasComplianceFlag(flagName: string): Promise<void> {
    const hasFlag = await this.hasComplianceFlag(flagName);
    expect(hasFlag).toBe(true);
  }

  /**
   * Assert aggregator submission succeeded
   */
  async assertSubmissionSuccessful(): Promise<void> {
    await expect(this.submissionStatus).toContainText(/submitted|success/i);
  }

  /**
   * Helper: Extract value from formatted text
   */
  private extractValue(text: string, label: string): string | undefined {
    const regex = new RegExp(`${label}\\s*([^,\\n]+)`);
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
  }
}
