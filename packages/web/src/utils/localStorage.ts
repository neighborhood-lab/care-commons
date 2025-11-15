/**
 * LocalStorage Utilities
 * 
 * Provides safe localStorage access with:
 * - Type-safe get/set operations
 * - Automatic JSON serialization
 * - Expiration support
 * - Error handling for quota exceeded
 * - SSR-safe (checks for window availability)
 * 
 * Used for offline-first data persistence and fallback when APIs fail.
 */

interface StoredValue<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    // localStorage not available - may be disabled, in private mode, or SSR
    // This is expected and not an error condition
    return false;
  }
}

/**
 * Get a value from localStorage with type safety
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return defaultValue;
    }

    const stored: StoredValue<T> = JSON.parse(item);

    // Check if expired
    if (stored.expiresAt && Date.now() > stored.expiresAt) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    return stored.value;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set a value in localStorage with optional expiration
 */
export function setLocalStorage<T>(
  key: string,
  value: T,
  expirationMs?: number
): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const stored: StoredValue<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: expirationMs ? Date.now() + expirationMs : undefined,
    };

    localStorage.setItem(key, JSON.stringify(stored));
    return true;
  } catch (error) {
    // Handle quota exceeded or other errors
    console.error(`Error writing to localStorage key "${key}":`, error);
    
    // Try to free up space by removing old items
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldestItems(5);
      
      // Try one more time
      try {
        const stored: StoredValue<T> = {
          value,
          timestamp: Date.now(),
          expiresAt: expirationMs ? Date.now() + expirationMs : undefined,
        };
        localStorage.setItem(key, JSON.stringify(stored));
        return true;
      } catch (retryError) {
        console.error('Failed to write after clearing space:', retryError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Remove a value from localStorage
 */
export function removeLocalStorage(key: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error);
  }
}

/**
 * Clear all items from localStorage (use with caution)
 */
export function clearLocalStorage(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Get the timestamp when a value was last updated
 */
export function getLastUpdated(key: string): Date | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return null;
    }

    const stored: StoredValue<unknown> = JSON.parse(item);
    return new Date(stored.timestamp);
  } catch (error) {
    console.error(`Error reading timestamp from localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Clear the oldest items from localStorage to free up space
 */
function clearOldestItems(count: number): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const items: Array<{ key: string; timestamp: number }> = [];

    // Collect all items with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const stored: StoredValue<unknown> = JSON.parse(item);
        items.push({ key, timestamp: stored.timestamp });
      } catch {
        // Skip items that aren't in our format
        continue;
      }
    }

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp);

    // Remove the oldest items
    for (let i = 0; i < Math.min(count, items.length); i++) {
      const item = items[i];
      if (item) {
        localStorage.removeItem(item.key);
      }
    }
  } catch (error) {
    console.error('Error clearing oldest items:', error);
  }
}

/**
 * Constants for common cache keys
 */
export const CACHE_KEYS = {
  CAREGIVER_DASHBOARD_VISITS: 'caregiver:dashboard:visits',
  CAREGIVER_DASHBOARD_TIMESHEETS: 'caregiver:dashboard:timesheets',
  CAREGIVER_DASHBOARD_CREDENTIALS: 'caregiver:dashboard:credentials',
  CAREGIVER_DASHBOARD_STATS: 'caregiver:dashboard:stats',
} as const;

/**
 * Constants for expiration times
 */
export const CACHE_EXPIRATION = {
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
} as const;
