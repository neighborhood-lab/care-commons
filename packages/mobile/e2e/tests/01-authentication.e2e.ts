/**
 * E2E Test: Authentication Flow
 * 
 * Tests login, logout, and session management for caregivers
 * 
 * NOTE: This is an MVP implementation. The app UI needs to have
 * testID props added to components before these tests will pass.
 * See mobile/README-E2E-TESTING.md for setup instructions.
 */

import { loginAsTestCaregiver, resetApp, getTestCaregiver } from '../setup/test-environment';

describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        location: 'always',
        camera: 'YES',
        notifications: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await resetApp();
  });

  it('should display login screen on app launch', async () => {
    // Verify login screen elements are visible
    // These testIDs need to be added to the Login screen components
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should successfully login with valid credentials', async () => {
    const caregiver = getTestCaregiver(0);
    
    // Type email and password
    await element(by.id('email-input')).typeText(caregiver.email);
    await element(by.id('password-input')).typeText(caregiver.password);
    await element(by.id('login-button')).tap();
    
    // Should navigate to main app (schedule screen)
    await waitFor(element(by.id('schedule-tab')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should show error message with invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();
    
    // Should show error message
    await waitFor(element(by.id('error-message')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show validation error for empty email', async () => {
    await element(by.id('password-input')).typeText('somepassword');
    await element(by.id('login-button')).tap();
    
    // Should show email required error
    await waitFor(element(by.id('email-error')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show validation error for empty password', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('login-button')).tap();
    
    // Should show password required error
    await waitFor(element(by.id('password-error')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should successfully logout', async () => {
    // Login first
    await loginAsTestCaregiver(0);
    
    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Tap logout
    await element(by.id('logout-button')).tap();
    
    // Confirm logout if modal appears
    try {
      const confirmButton = element(by.id('confirm-logout'));
      await waitFor(confirmButton).toBeVisible().withTimeout(2000);
      await confirmButton.tap();
    } catch {
      // No confirmation modal
    }
    
    // Should return to login screen
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
