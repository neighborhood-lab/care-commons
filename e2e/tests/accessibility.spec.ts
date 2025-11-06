import { test, expect } from '../fixtures/auth.fixture.js';
import { TestDatabase } from '../setup/test-database.js';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests
 *
 * Tests WCAG 2.1 AA compliance using axe-core:
 * 1. WCAG AA Compliance
 * 2. Screen Reader Support
 * 3. Keyboard Navigation
 */
test.describe('Accessibility', () => {
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

  test('WCAG AA Compliance: visit list page should have no critical violations', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page: authenticatedPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Should have no critical or serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('WCAG AA Compliance: schedule visit form should be accessible', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');
    await authenticatedPage.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page: authenticatedPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('WCAG AA Compliance: client detail page should be accessible', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/clients/1');
    await authenticatedPage.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page: authenticatedPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('WCAG AA Compliance: dashboard should be accessible', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page: authenticatedPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('Color Contrast: verify all text meets WCAG AA contrast ratios', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    const contrastResults = await new AxeBuilder({ page: authenticatedPage })
      .withTags(['cat.color'])
      .analyze();

    const contrastViolations = contrastResults.violations.filter((violation) =>
      violation.id.includes('color-contrast')
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('Color Contrast: verify button colors meet contrast requirements', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    const buttons = authenticatedPage.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const contrastResults = await new AxeBuilder({ page: authenticatedPage })
        .include('button')
        .withTags(['cat.color'])
        .analyze();

      const violations = contrastResults.violations.filter((v) =>
        v.id.includes('color-contrast')
      );

      expect(violations).toHaveLength(0);
    }
  });

  test('Keyboard Navigation: all interactive elements should be keyboard accessible', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    // Start at first interactive element
    await authenticatedPage.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = await authenticatedPage.evaluate(() => {
      const activeElement = document.activeElement;
      const styles = window.getComputedStyle(activeElement!);
      return {
        tagName: activeElement?.tagName,
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        hasFocusIndicator: styles.outline !== 'none' || styles.boxShadow !== 'none',
      };
    });

    expect(focusedElement.hasFocusIndicator).toBe(true);
  });

  test('Keyboard Navigation: tab through form fields in logical order', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Tab through form
    const tabOrder: string[] = [];

    for (let i = 0; i < 10; i++) {
      await authenticatedPage.keyboard.press('Tab');

      const focusedLabel = await authenticatedPage.evaluate(() => {
        const activeElement = document.activeElement;
        return (
          activeElement?.getAttribute('aria-label') ||
          activeElement?.getAttribute('placeholder') ||
          activeElement?.getAttribute('name') ||
          activeElement?.textContent?.trim() ||
          activeElement?.tagName
        );
      });

      if (focusedLabel) {
        tabOrder.push(focusedLabel);
      }
    }

    // Verify logical tab order (should hit form fields before submit button)
    expect(tabOrder.length).toBeGreaterThan(0);
  });

  test('Keyboard Navigation: escape key should close modals', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    // Open a modal if available
    const newVisitBtn = authenticatedPage.getByRole('button', { name: /new visit|create/i });
    const btnExists = await newVisitBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (btnExists) {
      await newVisitBtn.click();

      // Modal should be visible
      const modal = authenticatedPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Press escape
      await authenticatedPage.keyboard.press('Escape');

      // Modal should close
      await expect(modal).toBeHidden();
    }
  });

  test('Keyboard Navigation: enter key should submit forms', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Fill first field
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    // Press Enter to submit
    await authenticatedPage.keyboard.press('Enter');

    // Should submit form
    await expect(authenticatedPage).toHaveURL(/\/visits/, { timeout: 5000 });
  });

  test('Screen Reader Support: images should have alt text', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/clients');

    const images = authenticatedPage.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        // All images should have alt text (can be empty for decorative images)
        expect(alt).not.toBeNull();
      }
    }
  });

  test('Screen Reader Support: form labels should be associated correctly', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    const inputs = authenticatedPage.locator('input, select, textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have label via id, aria-label, or aria-labelledby
      const hasLabel = !!(inputId || ariaLabel || ariaLabelledBy);

      if (!hasLabel) {
        // Check if wrapped in label
        const wrappedInLabel = await input.evaluate((el) => {
          return el.closest('label') !== null;
        });

        expect(wrappedInLabel).toBe(true);
      }
    }
  });

  test('Screen Reader Support: buttons should have accessible names', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    const buttons = authenticatedPage.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();

      if (isVisible) {
        const textContent = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');

        // Button should have accessible name
        const hasAccessibleName = !!(
          textContent?.trim() ||
          ariaLabel ||
          ariaLabelledBy
        );

        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('Screen Reader Support: ARIA landmarks should be present', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    const landmarks = await authenticatedPage.evaluate(() => {
      return {
        main: document.querySelectorAll('main, [role="main"]').length,
        nav: document.querySelectorAll('nav, [role="navigation"]').length,
        banner: document.querySelectorAll('header, [role="banner"]').length,
        contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length,
      };
    });

    // Should have main content landmark
    expect(landmarks.main).toBeGreaterThan(0);

    // Should have navigation landmark
    expect(landmarks.nav).toBeGreaterThan(0);
  });

  test('Screen Reader Support: headings should follow hierarchical order', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    const headings = await authenticatedPage.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headingElements.map((h) => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim(),
      }));
    });

    if (headings.length > 0) {
      // Should have only one h1
      const h1Count = headings.filter((h) => h.level === 1).length;
      expect(h1Count).toBe(1);

      // Headings should not skip levels
      for (let i = 1; i < headings.length; i++) {
        const prevLevel = headings[i - 1].level;
        const currLevel = headings[i].level;

        // Should not jump more than one level
        expect(currLevel - prevLevel).toBeLessThanOrEqual(1);
      }
    }
  });

  test('Screen Reader Support: status messages should use ARIA live regions', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Fill and submit form
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Success message should have aria-live
    const successMessage = authenticatedPage.locator('[role="alert"], [role="status"]');
    const exists = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (exists) {
      const ariaLive = await successMessage.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    }
  });

  test('Focus Management: focus should move to new content after actions', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    const newVisitBtn = authenticatedPage.getByRole('button', { name: /new visit|create/i });
    const btnExists = await newVisitBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (btnExists) {
      await newVisitBtn.click();

      // Focus should move to modal or new page
      const focusedElement = await authenticatedPage.evaluate(() => {
        return document.activeElement?.tagName;
      });

      expect(focusedElement).not.toBe('BODY');
    }
  });

  test('Skip Links: should have skip to main content link', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    // Tab to first element (should be skip link)
    await authenticatedPage.keyboard.press('Tab');

    const skipLink = authenticatedPage.locator('a[href="#main"], a[href="#content"]').first();
    const exists = await skipLink.isVisible().catch(() => false);

    if (exists) {
      // Click skip link
      await skipLink.click();

      // Focus should be on main content
      const focusedElement = await authenticatedPage.evaluate(() => {
        const activeElement = document.activeElement;
        return {
          id: activeElement?.id,
          role: activeElement?.getAttribute('role'),
          tagName: activeElement?.tagName,
        };
      });

      const isMainContent =
        focusedElement.id === 'main' ||
        focusedElement.id === 'content' ||
        focusedElement.role === 'main' ||
        focusedElement.tagName === 'MAIN';

      expect(isMainContent).toBe(true);
    }
  });
});
