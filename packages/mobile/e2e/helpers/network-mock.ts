/**
 * Network Mocking Helpers for E2E Tests
 * 
 * Provides utilities to simulate network conditions (online, offline, slow)
 * for testing offline-first architecture and sync behavior.
 */

/**
 * Simulate offline mode
 */
export async function goOffline(): Promise<void> {
  // Detox doesn't have a built-in way to toggle network
  // We need to use platform-specific commands
  
  if (device.getPlatform() === 'ios') {
    // For iOS simulator, we can toggle airplane mode
    // This requires xcrun simctl commands
    // For now, we'll document this limitation
    console.warn('Network mocking on iOS requires manual airplane mode toggle');
  } else {
    // For Android emulator
    // adb shell svc wifi disable
    // adb shell svc data disable
    console.warn('Network mocking on Android requires adb commands');
  }
  
  // Alternative: We can mock the network status in the app itself
  // by exposing a test-only API to override NetInfo state
}

/**
 * Simulate online mode
 */
export async function goOnline(): Promise<void> {
  if (device.getPlatform() === 'ios') {
    console.warn('Network mocking on iOS requires manual airplane mode toggle');
  } else {
    console.warn('Network mocking on Android requires adb commands');
  }
}

/**
 * Simulate slow network (3G speed)
 */
export async function setSlowNetwork(): Promise<void> {
  // This would require network throttling at OS level or proxy
  // For MVP, we can skip this or implement using Charles Proxy / network link conditioner
  console.warn('Slow network simulation not implemented yet');
}

/**
 * Reset network to normal speed
 */
export async function resetNetwork(): Promise<void> {
  await goOnline();
}

/**
 * Check if device is online (from app's perspective)
 * 
 * This queries the app's NetInfo state, not the actual network
 */
export async function isOnline(): Promise<boolean> {
  // This would need to be implemented by reading app state
  // For now, return true as placeholder
  return true;
}

/**
 * Wait for network to become available
 * 
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForOnline(timeout = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await isOnline()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error(`Network did not become online within ${timeout}ms`);
}

/**
 * Wait for network to become unavailable
 * 
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForOffline(timeout = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (!(await isOnline())) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error(`Network did not become offline within ${timeout}ms`);
}
