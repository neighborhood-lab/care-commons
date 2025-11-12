/**
 * E2E Test Environment Setup
 * 
 * Configures test database, seeds data, and sets up mock services
 */

import caregivers from '../fixtures/caregivers.json';
import clients from '../fixtures/clients.json';
import visits from '../fixtures/visits.json';
import tasks from '../fixtures/tasks.json';

/**
 * Seed test database with realistic data
 * 
 * This should be called in beforeAll() for each test suite
 */
export async function seedTestData(scenario?: string): Promise<void> {
  // In a real implementation, this would:
  // 1. Connect to test database
  // 2. Clear existing data
  // 3. Insert fixtures
  // 4. Return success/failure
  
  console.log(`Seeding test data for scenario: ${scenario || 'default'}`);
  
  // For now, we'll document what should happen:
  // - Call backend API to seed test data
  // - Or directly insert into test database
  // - Or use app's internal API to populate WatermelonDB
}

/**
 * Clear all test data
 * 
 * This should be called in afterAll() for each test suite
 */
export async function clearTestData(): Promise<void> {
  console.log('Clearing test data');
  
  // In a real implementation:
  // - Delete all test records from database
  // - Clear WatermelonDB local storage
  // - Reset app state
}

/**
 * Get test caregiver credentials
 */
export function getTestCaregiver(index = 0) {
  return caregivers[index];
}

/**
 * Get test client data
 */
export function getTestClient(index = 0) {
  return clients[index];
}

/**
 * Get test visit data
 */
export function getTestVisit(index = 0) {
  return visits[index];
}

/**
 * Get test tasks data
 */
export function getTestTasks(visitId?: string) {
  if (visitId) {
    return tasks.filter(task => task.visitId === visitId);
  }
  return tasks;
}

/**
 * Login as test caregiver
 * 
 * Helper to authenticate in tests
 */
export async function loginAsTestCaregiver(index = 0): Promise<void> {
  const caregiver = getTestCaregiver(index);
  
  await element(by.id('email-input')).typeText(caregiver.email);
  await element(by.id('password-input')).typeText(caregiver.password);
  await element(by.id('login-button')).tap();
  
  // Wait for login to complete
  await waitFor(element(by.id('schedule-tab')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  // Navigate to profile
  await element(by.id('profile-tab')).tap();
  
  // Tap logout button
  await element(by.id('logout-button')).tap();
  
  // Confirm logout if modal appears
  try {
    await element(by.id('confirm-logout')).tap();
  } catch {
    // No confirmation modal, proceed
  }
  
  // Wait for login screen
  await waitFor(element(by.id('login-screen')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Reset app to initial state
 * 
 * Useful for isolating tests
 */
export async function resetApp(): Promise<void> {
  await device.terminateApp();
  await device.launchApp({
    newInstance: true,
    permissions: {
      location: 'always',
      camera: 'YES',
      notifications: 'YES',
    },
  });
}

/**
 * Grant required permissions
 */
export async function grantPermissions(): Promise<void> {
  await device.launchApp({
    permissions: {
      location: 'always',
      camera: 'YES',
      notifications: 'YES',
    },
  });
}
